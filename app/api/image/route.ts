import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { Canvas, GlobalFonts, loadImage, SKRSContext2D } from "@napi-rs/canvas";
import redis from "@/lib/redis";
import {
  TransformationParams,
  ParsedURLResult,
  RoboflowResponse,
  TextPosition,
  ImageAPIHandler,
  TextOverlayOptions,
  TextPositionResult,
} from "./types";

// Register fonts
GlobalFonts.registerFromPath(join(process.cwd(), "fonts/Arial.ttf"));

// Utility function to calculate text position
function calculateTextPosition(
  textOptions: TextOverlayOptions,
  imageWidth: number,
  imageHeight: number,
  textWidth: number,
  totalTextHeight: number,
  textHeight: number
): TextPositionResult {
  let posX: number, posY: number;

  if (textOptions.lfo) {
    switch (textOptions.lfo) {
      case "top":
        posX = (imageWidth - textWidth) / 2;
        posY = textHeight;
        break;
      case "top_left":
        posX = 10;
        posY = textHeight + 10;
        break;
      case "top_right":
        posX = imageWidth - textWidth;
        posY = textHeight + 10;
        break;
      case "middle":
        posX = (imageWidth - textWidth) / 2;
        posY = (imageHeight - totalTextHeight) / 2 + textHeight;
        break;
      case "middle_left":
        posX = 10;
        posY = (imageHeight - totalTextHeight) / 2 + textHeight;
        break;
      case "middle_right":
        posX = imageWidth - textWidth;
        posY = (imageHeight - totalTextHeight) / 2 + textHeight;
        break;
      case "bottom":
        posX = (imageWidth - textWidth) / 2;
        posY = imageHeight - totalTextHeight + textHeight;
        break;
      case "bottom_left":
        posX = 10;
        posY = imageHeight - totalTextHeight + textHeight - 15;
        break;
      case "bottom_right":
        posX = imageWidth - textWidth - 10;
        posY = imageHeight - totalTextHeight + textHeight - 15;
        break;
      default:
        posX = (imageWidth - textWidth) / 2;
        posY = (imageHeight - totalTextHeight) / 2 + textHeight;
    }
  } else {
    let lxFromUser = textOptions.lx || 0;
    let lyFromUser = textOptions.ly || 0;

    const maxX = imageWidth - textWidth;
    const maxY = imageHeight - totalTextHeight;

    if (textOptions.lx === undefined && textOptions.ly === undefined) {
      posX = (imageWidth - textWidth) / 2;
      posY = (imageHeight - totalTextHeight) / 2 + textHeight;
    } else {
      const isNegativeX =
        typeof lxFromUser === "string" && lxFromUser.startsWith("N");
      posX = isNegativeX
        ? imageWidth - parseInt(lxFromUser.slice(1), 10) - textWidth
        : typeof lxFromUser === "string"
        ? parseInt(lxFromUser, 10)
        : lxFromUser;

      const isNegativeY =
        typeof lyFromUser === "string" && lyFromUser.startsWith("N");
      posY = isNegativeY
        ? imageHeight - parseInt(lyFromUser.slice(1), 10) - totalTextHeight
        : typeof lyFromUser === "string"
        ? parseInt(lyFromUser, 10)
        : lyFromUser;
    }

    posX = Math.max(0, Math.min(posX, maxX));
    posY = Math.max(textHeight, Math.min(posY + textHeight, maxY + textHeight));
  }

  return { x: posX, y: posY };
}

// Utility function to reorder transformations
function reorderTransformations(inputString: string): string {
  const mainOrder = ["w", "h", "ar", "rt", "fo", "removeBg"];
  const textOrder = [
    "l-text",
    "i",
    "w",
    "lx",
    "ly",
    "lfo",
    "fs",
    "cl",
    "l-end",
  ];

  const transformations = inputString.split(",");
  const mainTransforms: Record<string, string> = {};
  const textTransforms: string[] = [];
  let inTextOverlay = false;

  transformations.forEach((transform) => {
    const [type] = transform.split("-");
    if (transform === "l-text") {
      inTextOverlay = true;
      textTransforms.push(transform);
    } else if (transform === "l-end") {
      textTransforms.push(transform);
      inTextOverlay = false;
    } else if (inTextOverlay) {
      textTransforms.push(transform);
    } else if (mainOrder.includes(type)) {
      mainTransforms[type] = transform;
    }
  });

  const orderedMain = mainOrder
    .map((type) => mainTransforms[type])
    .filter(Boolean);

  const orderedText = textOrder.reduce<string[]>((acc, type) => {
    const matching = textTransforms.filter((t) => t.startsWith(type));
    return acc.concat(matching);
  }, []);

  return [...orderedMain, ...orderedText].join(",");
}

// Utility function to parse URL
function parseURL(req: NextRequest): ParsedURLResult {
  const { pathname } = new URL(req.url);
  const parsedUrl = new URL(req.url);
  let pathSegments = pathname.replace("/image", "").split("/").filter(Boolean);

  let transformationString: string;
  let assetName: string;

  if (pathSegments[0]?.startsWith("tr:")) {
    transformationString = pathSegments[0];
    assetName = pathSegments.slice(1).join("/");
  } else {
    transformationString = "";
    assetName = pathSegments.join("/");
  }

  if (parsedUrl?.search && parsedUrl.search.includes("?tr:")) {
    transformationString = parsedUrl.search.replace("?tr:", "tr:");
  }

  return { transformationString, assetName };
}

// Utility function to parse transformations
function parseTransformations(
  transformationString: string
): TransformationParams {
  transformationString = transformationString.replace("tr:", "");
  const parsedTransformations: TransformationParams = {};
  const transformations = transformationString.split(",");

  let overlayText: string[] = [];
  let inTextOverlay = false;
  let textStartIndex = -1;

  transformations.forEach((transformation, index) => {
    const [key, value] = transformation.split("-");

    if (transformation === "l-text") {
      inTextOverlay = true;
      textStartIndex = index;
      return;
    }

    if (transformation === "l-end") {
      inTextOverlay = false;
      const textConfig = overlayText.reduce((acc: any, item) => {
        const [key, value] = item.split("-");
        const parsedValue = isNaN(Number(value)) ? value : Number(value);
        acc[key] = parsedValue;
        return acc;
      }, {});
      parsedTransformations.overlayText = textConfig;
      return;
    }

    if (inTextOverlay) {
      overlayText.push(transformation);
      return;
    }

    switch (key) {
      case "ar":
        const [arWidth, arHeight] = value.split("_").map(Number);
        parsedTransformations.ar = { width: arWidth, height: arHeight };
        break;
      case "fo":
        parsedTransformations.fo = value
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .toLowerCase();
        break;
      case "removeBg":
        parsedTransformations.removeBg = value === "true";
        break;
      default:
        (parsedTransformations as any)[key] = parseFloat(value);
    }
  });

  return parsedTransformations;
}

// Utility function to handle text overlay
async function applyTextOverlay(
  image: sharp.Sharp,
  textOptions: TransformationParams["overlayText"],
  imageMetadata: sharp.Metadata
): Promise<Buffer> {
  if (!textOptions) return image.toBuffer();

  const processedImageBuffer = await image.toBuffer();
  const imageLoaded = await loadImage(processedImageBuffer);
  const canvas = new Canvas(imageLoaded.width, imageLoaded.height);
  const ctx = canvas.getContext("2d") as SKRSContext2D;

  const text = textOptions.i.replace(/%20/g, " ");
  const fontSize = textOptions.fs || 40;

  ctx.drawImage(imageLoaded, 0, 0);
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = textOptions.cl || "white";

  // Text wrapping function
  const wrapText = (
    context: SKRSContext2D,
    text: string,
    maxWidth?: number
  ): string[] => {
    if (!maxWidth) return [text];

    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine + word + " ";
      const testWidth = context.measureText(testLine).width;

      if (testWidth > maxWidth && currentLine !== "") {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine = testLine;
      }
    });

    lines.push(currentLine.trim());
    return lines;
  };

  const lines = wrapText(ctx, text, textOptions.w);
  const textWidth = Math.max(
    ...lines.map((line) => ctx.measureText(line).width)
  );
  const textHeight = fontSize;
  const totalTextHeight = lines.length * textHeight;

  const position = calculateTextPosition(
    textOptions,
    imageLoaded.width,
    imageLoaded.height,
    textWidth,
    totalTextHeight,
    fontSize
  );

  lines.forEach((line, index) => {
    ctx.fillText(line, position.x, position.y + index * textHeight);
  });

  return canvas.toBuffer("image/png");
}

// Optimization configurations
const IMAGE_CONFIG = {
  // Quality settings for different formats
  quality: {
    jpeg: 80,
    png: 75,
    webp: 75,
  },
  // Cache settings
  cache: {
    expiry: 86400, // 24 hours
    maxSize: 5 * 1024 * 1024, // 5MB max cache size per image
  },
};

// Optimize image based on format and size
async function optimizeImage(
  image: sharp.Sharp,
  metadata: sharp.Metadata,
  transformations: TransformationParams
): Promise<sharp.Sharp> {
  // Single resize operation if needed
  if (transformations.w || transformations.h) {
    image = image.resize(transformations.w, transformations.h, {
      fit: "contain",
      withoutEnlargement: true,
    });
  }

  // Format-specific optimizations
  switch (metadata.format) {
    case "jpeg":
      return image.jpeg({
        quality: IMAGE_CONFIG.quality.jpeg,
        mozjpeg: true,
      });

    case "png":
      return image.png({
        quality: IMAGE_CONFIG.quality.png,
        compressionLevel: 8,
        palette: true,
      });

    default:
      return image.webp({
        quality: IMAGE_CONFIG.quality.webp,
        effort: 4,
      });
  }
}

// Main API handler
export const GET: ImageAPIHandler = async (req) => {
  const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;

  try {
    let { transformationString, assetName } = parseURL(req);

    if (!assetName) {
      return NextResponse.json(
        { error: "Asset name is required" },
        { status: 400 }
      );
    }

    transformationString = transformationString.replace("tr:", "");
    transformationString = reorderTransformations(transformationString);
    transformationString = `tr:${transformationString}`;

    const cacheKey = `img:${assetName}:${transformationString}`;
    const cachedImage = await redis.get(cacheKey);

    if (cachedImage) {
      const imageBuffer = Buffer.from(cachedImage as string, "base64");
      const metadata = await sharp(imageBuffer).metadata();

      const headers = new Headers({
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Cache": "HIT",
        "X-Image-Size": imageBuffer.length.toString(),
        "X-Image-Width": metadata.width?.toString() || "unknown",
        "X-Image-Height": metadata.height?.toString() || "unknown",
        "X-Image-Format": metadata.format || "unknown",
      });
      return new NextResponse(imageBuffer, { headers });
    }

    const transformations = parseTransformations(transformationString);
    const assetUrl = `https://utfs.io/f/${assetName}`;

    const [imageResponse, detectionData] = await Promise.all([
      fetch(assetUrl),
      transformations.fo
        ? fetch(
            `https://detect.roboflow.com/coco/5?api_key=${ROBOFLOW_API_KEY}&image=${assetUrl}`,
            { method: "POST" }
          ).then((res) => res.json() as Promise<RoboflowResponse>)
        : null,
    ]);

    if (!imageResponse.ok) throw new Error("Failed to fetch the image");

    let image = sharp(Buffer.from(await imageResponse.arrayBuffer()));
    const originalMetadata = await image.metadata();
    const originalSize = (await image.toBuffer()).length;

    // Handle object detection and smart cropping BEFORE any resizing
    let detectedObject;
    if (detectionData) {
      detectedObject =
        transformations.fo === "auto"
          ? detectionData.predictions.reduce((prev, current) =>
              prev.confidence > current.confidence ? prev : current
            )
          : detectionData.predictions.find(
              (prediction) => prediction.class === transformations.fo
            );
    }

    // Apply smart crop first if object detected
    if (detectedObject && originalMetadata.width && originalMetadata.height) {
      const { x, y, width, height } = detectedObject;
      const CROP_PADDING = transformations.ar ? 40 : 10;

      let cropX = Math.max(0, x - width / 2);
      let cropY = Math.max(0, y - height / 2);
      let cropWidth = width;
      let cropHeight = height;

      cropX = Math.max(0, cropX - CROP_PADDING);
      cropY = Math.max(0, cropY - CROP_PADDING);
      cropWidth = Math.min(
        originalMetadata.width - cropX,
        cropWidth + 2 * CROP_PADDING
      );
      cropHeight = Math.min(
        originalMetadata.height - cropY,
        cropHeight + 2 * CROP_PADDING
      );

      if (transformations.ar) {
        const { width: arWidth, height: arHeight } = transformations.ar;
        const aspectRatio = arWidth / arHeight;

        let requiredWidth = cropWidth;
        let requiredHeight = cropHeight;

        if (cropWidth / cropHeight > aspectRatio) {
          requiredHeight = cropWidth / aspectRatio;
        } else {
          requiredWidth = cropHeight * aspectRatio;
        }

        cropX = Math.max(
          0,
          Math.min(
            originalMetadata.width - requiredWidth,
            x - requiredWidth / 2
          )
        );
        cropY = Math.max(
          0,
          Math.min(
            originalMetadata.height - requiredHeight,
            y - requiredHeight / 2
          )
        );

        cropWidth = Math.min(requiredWidth, originalMetadata.width - cropX);
        cropHeight = Math.min(requiredHeight, originalMetadata.height - cropY);
      }

      image = image.extract({
        left: Math.round(cropX),
        top: Math.round(cropY),
        width: Math.round(cropWidth),
        height: Math.round(cropHeight),
      });
    }

    // Now apply optimization (including resize) after cropping
    if (!transformations.overlayText) {
      image = await optimizeImage(image, originalMetadata, transformations);
    } else {
      // If text overlay, just handle resize
      if (transformations.w || transformations.h) {
        image = image.resize(transformations.w, transformations.h, {
          fit: "contain",
          withoutEnlargement: true,
        });
      }
    }

    // Apply rotation
    if (transformations.rt) {
      image = image.png().rotate(transformations.rt, {
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
    }

    // Apply text overlay
    let finalImageBuffer: Buffer;
    if (transformations.overlayText) {
      finalImageBuffer = await applyTextOverlay(
        image,
        transformations.overlayText,
        originalMetadata
      );
    } else {
      finalImageBuffer = await image.toBuffer();
    }

    // Only cache if under size limit
    if (finalImageBuffer.length <= IMAGE_CONFIG.cache.maxSize) {
      try {
        await redis.setEx(
          cacheKey,
          IMAGE_CONFIG.cache.expiry,
          finalImageBuffer.toString("base64")
        );
      } catch (cacheError) {
        console.error("Redis cache error:", cacheError);
      }
    }

    const finalMetadata = await sharp(finalImageBuffer).metadata();

    console.log("\n=== Optimized Image Details ===");
    console.log(`Size: ${(finalImageBuffer.length / 1024).toFixed(2)}KB`);
    console.log(`Dimensions: ${finalMetadata.width}x${finalMetadata.height}`);
    console.log(`Format: ${finalMetadata.format}`);
    console.log(
      `Size Reduction: ${(
        ((originalSize - finalImageBuffer.length) / originalSize) *
        100
      ).toFixed(2)}%`
    );
    console.log("==============================\n");

    // Send response
    const headers = new Headers({
      "Content-Type": `image/${finalMetadata.format}`,
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Cache": "MISS",
      // Original image info
      "X-Original-Size": originalSize.toString(),
      "X-Original-Width": originalMetadata.width?.toString() || "unknown",
      "X-Original-Height": originalMetadata.height?.toString() || "unknown",
      "X-Original-Format": originalMetadata.format || "unknown",
      // Transformed image info
      "X-Final-Size": finalImageBuffer.length.toString(),
      "X-Final-Width": finalMetadata.width?.toString() || "unknown",
      "X-Final-Height": finalMetadata.height?.toString() || "unknown",
      "X-Final-Format": finalMetadata.format || "unknown",
      // Size reduction percentage
      "X-Size-Reduction": `${(
        ((originalSize - finalImageBuffer.length) / originalSize) *
        100
      ).toFixed(2)}%`,
    });

    return new NextResponse(finalImageBuffer, { headers });
  } catch (error) {
    console.error("Error in image API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};
