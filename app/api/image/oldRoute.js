import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { Canvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import redis from "@/lib/redis";
// import removeBackground from "@imgly/background-removal-node";

GlobalFonts.registerFromPath(join(process.cwd(), "fonts/Arial.ttf"));

export async function GET(req) {
  // use env - ROBOFLOW_API_KEY below
  const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;

  const { pathname } = new URL(req.url);
  const parsedUrl = new URL(req.url);

  let pathSegments = pathname.replace("/image", "").split("/").filter(Boolean);

  let transformationString, assetName;

  if (pathSegments[0].startsWith("tr:")) {
    transformationString = pathSegments[0];
    assetName = pathSegments.slice(1).join("/");
  } else {
    transformationString = "";
    assetName = pathSegments.join("/");
  }

  if (parsedUrl?.search && parsedUrl.search.includes("?tr:")) {
    transformationString = parsedUrl.search.replace("?tr:", "tr:");
  }

  if (!assetName) {
    return NextResponse.json(
      { error: "Asset name is required" },
      { status: 400 }
    );
  }

  function reorderTransformations(inputString) {
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
    const mainTransforms = {};
    const textTransforms = [];
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

    const orderedText = textOrder.reduce((acc, type) => {
      const matching = textTransforms.filter((t) => t.startsWith(type));
      return acc.concat(matching);
    }, []);

    return [...orderedMain, ...orderedText].join(",");
  }

  // Reorder transformations based on the transformationOrder
  transformationString = transformationString.replace("tr:", "");

  transformationString = reorderTransformations(transformationString);

  transformationString = `tr:${transformationString}`;

  const cacheKey = `${assetName}-${transformationString}`;

  // Check if the transformed image is already in cache
  const cachedImage = await redis.get(cacheKey);

  if (cachedImage) {
    // Send the processed image back
    // const imageBuffer = Buffer.from(cachedImage.data);
    const imageBuffer = Buffer.from(cachedImage, "base64");
    const headers = new Headers();
    headers.set(
      "Content-Type",
      `${transformationString?.rt ? "image/png" : `image/png`}`
    );
    // headers.set("Cache-Control", "public, max-age=31536000, immutable"); // Cache for one year

    return new NextResponse(imageBuffer, {
      headers,
    });
  }

  try {
    const assetUrl = `https://utfs.io/f/${assetName}`;

    const parser = () => {
      transformationString = transformationString.replace("tr:", "");

      const parsedTransformations = {};
      const transformations = transformationString.split(",");

      let overlayText = "";

      transformations.forEach((transformation) => {
        const [key, value] = transformation.split("-");

        if (transformation === "l-text") {
          // in transformations array, find the index of l-text, and l-end
          const textStartIndex = transformations.indexOf("l-text");
          const textEndIndex = transformations.indexOf("l-end");

          // get the text between l-text and l-end
          overlayText = transformations.slice(textStartIndex + 1, textEndIndex);

          // remove the text from transformations array
          transformations.splice(
            textStartIndex,
            textEndIndex - textStartIndex + 1
          );

          // add eacah key:value object to parsedTransformations in array

          // parsedTransformations.overlayText = {
          // w: 300,
          // h: 100,
          // }

          parsedTransformations.overlayText = {};

          for (const item of overlayText) {
            const [key, value] = item.split("-");
            const parsedValue = isNaN(Number(value)) ? value : Number(value);
            parsedTransformations["overlayText"][key] = parsedValue;
          }
        }
        // Aspect Ratio
        else if (key === "ar") {
          const [arWidth, arHeight] = value.split("_").map(Number);
          parsedTransformations[key] = { width: arWidth, height: arHeight };
        }
        // smart crop fo
        else if (key === "fo") {
          let parsedValue = value.replace(/([a-z])([A-Z])/g, "$1 $2");
          parsedTransformations[key] = parsedValue.toLowerCase();
        }
        // Remove background
        else if (key === "removeBg") {
          parsedTransformations["removeBg"] = value === "true";
        }
        // all other keys
        else {
          parsedTransformations[key] = parseFloat(value); // Handle both integer and float values
        }
      });

      return parsedTransformations;
    };

    let transformations = parser();

    const [imageResponse, detectionData] = await Promise.all([
      fetch(assetUrl),
      transformations.fo
        ? fetch(
            `https://detect.roboflow.com/coco/5?api_key=${ROBOFLOW_API_KEY}&image=${assetUrl}`,
            { method: "POST" }
          ).then((res) => res.json())
        : null,
    ]);

    if (!imageResponse.ok) throw new Error("Failed to fetch the image");

    // Load image with Sharp
    const imageBuffer = await imageResponse.arrayBuffer();
    let image = sharp(Buffer.from(imageBuffer));

    // Get original image metadata
    const metadata = await image.metadata();

    // Decrease the quality of the image to reduce file size
    if (transformations.overlayText) {
      image = image.png({ quality: 75 });
    } else {
      if (metadata.format === "jpeg") image = image.jpeg({ quality: 75 });
      else if (metadata.format === "png") image = image.png({ quality: 75 });
      else if (metadata.format === "webp") image = image.webp({ quality: 75 });
      else image.jpeg({ quality: 75 });
    }

    // Object detection
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

    // Apply aspect ratio transformation
    if (transformations.ar) {
      const { width: arWidth, height: arHeight } = transformations.ar;

      if (transformations.w) {
        transformations.h = Math.round(
          (transformations.w * arHeight) / arWidth
        );
      } else if (transformations.h) {
        transformations.w = Math.round(
          (transformations.h * arWidth) / arHeight
        );
      } else {
        transformations.w = metadata.width;
        transformations.h = Math.round((metadata.width * arHeight) / arWidth);
      }
    }

    // Apply smart crop transformation
    if (detectedObject) {
      const { x, y, width, height } = detectedObject;

      // Ensure the crop box doesn't cut off any part of the object
      let cropX = Math.max(0, x - width / 2);
      let cropY = Math.max(0, y - height / 2);
      let cropWidth = width;
      let cropHeight = height;

      const CROP_PADDING = transformations.ar ? 40 : 10; // Add padding to the crop area

      cropX = Math.max(0, cropX - CROP_PADDING);
      cropY = Math.max(0, cropY - CROP_PADDING);
      cropWidth = Math.min(
        metadata.width - cropX,
        cropWidth + 2 * CROP_PADDING
      );
      cropHeight = Math.min(
        metadata.height - cropY,
        cropHeight + 2 * CROP_PADDING
      );

      if (transformations.ar) {
        const { width: arWidth, height: arHeight } = transformations.ar;
        const aspectRatio = arWidth / arHeight;

        // Calculate required width and height to fit the aspect ratio while keeping the object fully visible
        let requiredWidth = cropWidth;
        let requiredHeight = cropHeight;

        if (cropWidth / cropHeight > aspectRatio) {
          requiredHeight = cropWidth / aspectRatio;
        } else {
          requiredWidth = cropHeight * aspectRatio;
        }

        // Adjust cropX and cropY to center the object while maintaining aspect ratio
        cropX = Math.max(
          0,
          Math.min(metadata.width - requiredWidth, x - requiredWidth / 2)
        );
        cropY = Math.max(
          0,
          Math.min(metadata.height - requiredHeight, y - requiredHeight / 2)
        );

        // Update the crop dimensions to the required aspect ratio dimensions
        cropWidth = Math.min(requiredWidth, metadata.width - cropX);
        cropHeight = Math.min(requiredHeight, metadata.height - cropY);
      }

      image = image.extract({
        left: Math.round(cropX),
        top: Math.round(cropY),
        width: Math.round(cropWidth),
        height: Math.round(cropHeight),
      });
    }

    // Apply width transformation
    if (transformations.w) {
      if (transformations.w <= 1) {
        transformations.w = Math.round(metadata.width * transformations.w);
      }
    }

    // Apply height transformation
    if (transformations.h) {
      if (transformations.h <= 1) {
        transformations.h = Math.round(metadata.height * transformations.h);
      }
    }

    // Resize the image based on the calculated width and height
    if (transformations.w || transformations.h) {
      image = image.resize(transformations.w, transformations.h);
    }

    // Apply rotation transoformation if rt-number is provided and once rotation is applied, the image should have transparent background
    if (transformations.rt) {
      const rotation = parseInt(transformations.rt);

      // Convert the image to PNG format if not already, to support transparency
      image = image.png().rotate(rotation, {
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Set the background to transparent
      });
    }

    // Apply overlay text transformatio
    let canvas;
    if (transformations.overlayText) {
      try {
        const { i, lx, ly, fs, cl, w, lfo } = transformations.overlayText;

        const processedImageBuffer = await image.toBuffer();

        const imageLoaded = await loadImage(processedImageBuffer);

        // Create a canvas with the same dimensions as the image
        // canvas = createCanvas(imageLoaded.width, imageLoaded.height);
        // const ctx = canvas.getContext("2d");

        canvas = new Canvas(imageLoaded.width, imageLoaded.height);
        const ctx = canvas.getContext("2d");

        let text;
        if (i.includes("%20")) {
          // i = Hello%20World
          text = i.replace(/%20/g, " ");
        } else {
          text = i;
        }

        // Draw the image onto the canvas
        ctx.drawImage(imageLoaded, 0, 0);

        // Set the font and color for the text
        ctx.font = `${fs ? fs : 40}px Arial`; // Font size and family
        ctx.fillStyle = cl ? cl : "white"; // Text color

        // Function to wrap text
        const wrapText = (context, text, maxWidth) => {
          if (!maxWidth) {
            return [text];
          }

          const words = text.split(" ");
          let line = "";
          const lines = [];

          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + " ";
            const testWidth = context.measureText(testLine).width;
            if (testWidth > maxWidth && i > 0) {
              lines.push(line.trim());
              line = words[i] + " ";
            } else {
              line = testLine;
            }
          }
          lines.push(line.trim());
          return lines;
        };

        const lines = wrapText(ctx, text, w);

        // Measure the text size
        const textWidth = Math.max(
          ...lines.map((line) => ctx.measureText(line).width)
        );
        const textHeight = fs ? parseInt(fs, 10) : 40; // Adjust based on font size
        const totalTextHeight = lines.length * textHeight;

        let posX, posY;

        if (lfo) {
          // Calculate position based on lfo (layout format option)
          switch (lfo) {
            case "top":
              posX = (imageLoaded.width - textWidth) / 2;
              posY = textHeight;
              break;
            case "top_left":
              posX = 10;
              posY = textHeight + 10;
              break;
            case "top_right":
              posX = imageLoaded.width - textWidth;
              posY = textHeight + 10;
              break;
            case "middle":
              posX = (imageLoaded.width - textWidth) / 2;
              posY = (imageLoaded.height - totalTextHeight) / 2 + textHeight; // Center vertically based on line count
              break;
            case "middle_left":
              posX = 10;
              posY = (imageLoaded.height - totalTextHeight) / 2 + textHeight; // Center vertically based on line count
              break;
            case "middle_right":
              posX = imageLoaded.width - textWidth;
              posY = (imageLoaded.height - totalTextHeight) / 2 + textHeight; // Center vertically based on line count
              break;
            case "bottom":
              posX = (imageLoaded.width - textWidth) / 2;
              posY = imageLoaded.height - totalTextHeight + textHeight;
              break;
            case "bottom_left":
              posX = 10;
              posY = imageLoaded.height - totalTextHeight + textHeight - 15;
              break;
            case "bottom_right":
              posX = imageLoaded.width - textWidth - 10;
              posY = imageLoaded.height - totalTextHeight + textHeight - 15;
              break;
            default:
              // Default to middle if lfo is not recognized
              posX = (imageLoaded.width - textWidth) / 2;
              posY = (imageLoaded.height - totalTextHeight) / 2 + textHeight; // Center vertically based on line count
          }
        } else {
          let lxFromUser = lx || 0; // X coordinate
          let lyFromUser = ly || 0; // Y coordinate

          // Calculate maximum X and Y coordinates
          const maxX = imageLoaded.width - textWidth;
          const maxY = imageLoaded.height - totalTextHeight;

          if (lx === undefined && ly === undefined) {
            // Center the text horizontally and vertically
            posX = (imageLoaded.width - textWidth) / 2;
            posY =
              (imageLoaded.height - lines.length * textHeight) / 2 + textHeight; // Center vertically based on line count
          } else {
            // Handle lxFromUser
            const isNegativeX =
              typeof lxFromUser === "string" && lxFromUser.startsWith("N");
            posX = isNegativeX
              ? imageLoaded.width -
                parseInt(lxFromUser.slice(1), 10) -
                textWidth
              : parseInt(lxFromUser, 10);

            // Handle lyFromUser
            const isNegativeY =
              typeof lyFromUser === "string" && lyFromUser.startsWith("N");
            posY = isNegativeY
              ? imageLoaded.height -
                parseInt(lyFromUser.slice(1), 10) -
                totalTextHeight
              : parseInt(lyFromUser, 10);
          }

          // Adjust coordinates to ensure text fits within image boundaries
          posX = Math.max(0, Math.min(posX, maxX));
          posY = Math.max(
            textHeight,
            Math.min(posY + textHeight, maxY + textHeight)
          );
        }

        // Draw the text on the canvas
        // ctx.fillText(text, adjustedX, adjustedY);

        // Draw each line of text on the canvas
        lines.forEach((line, index) => {
          ctx.fillText(line, posX, posY + index * textHeight); // Adjust for line height
        });
      } catch (error) {
        console.error("Error found in overlay text transformation", error);
      }
    }

    let finalImageBuffer;

    if (transformations.overlayText) {
      finalImageBuffer = canvas.toBuffer("image/png");
    }

    // Convert the processed image to a buffer
    else {
      finalImageBuffer = await image.toBuffer();
    }

    // Cache the processed image
    // cache.set(cacheKey, finalImageBuffer);
    await redis.set(cacheKey, finalImageBuffer.toString("base64"), "EX", 3600); // Cache for one hour

    // Send the processed image back
    const headers = new Headers();
    headers.set(
      "Content-Type",
      `${
        transformationString?.rt || transformations.overlayText
          ? "image/png"
          : `image/${metadata.format}`
      }`
    );
    headers.set("Content-Disposition", "inline");
    headers.set("Cache-Control", "public, max-age=31536000, immutable"); // Cache for one year

    return new NextResponse(finalImageBuffer, {
      headers,
    });
  } catch (error) {
    console.error("error in api: ", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
