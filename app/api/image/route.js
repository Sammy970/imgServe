import { NextResponse } from "next/server";
import sharp from "sharp";
const cache = new Map(); // Simple in-memory cache

export const GET = async (req) => {
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

  // console.log(transformationString, assetName);

  if (!assetName) {
    return NextResponse.json(
      { error: "Asset name is required" },
      { status: 400 }
    );
  }

  const cacheKey = `${assetName}-${transformationString}`;

  if (cache.has(cacheKey)) {
    // Serve from cache
    const cachedImage = cache.get(cacheKey);
    // Send the processed image back
    const headers = new Headers();
    headers.set(
      "Content-Type",
      `${transformationString?.rt ? "image/png" : `image/jpeg`}`
    );
    headers.set("Cache-Control", "public, max-age=31536000, immutable"); // Cache for one year

    return new NextResponse(cachedImage, {
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
        // all other keys
        else {
          parsedTransformations[key] = parseFloat(value); // Handle both integer and float values
        }
      });

      return parsedTransformations;
    };

    const transformations = parser();

    console.log(transformations);

    // Object detection
    let detectedObject;
    if (transformations.fo) {
      const objectDetectionResponse = await fetch(
        `https://detect.roboflow.com/coco/5?api_key=${ROBOFLOW_API_KEY}&image=${assetUrl}`,
        { method: "POST" }
      );
      const detectionData = await objectDetectionResponse.json();

      if (transformations.fo === "auto") {
        // Find the object with the highest confidence score
        detectedObject = detectionData.predictions.reduce((prev, current) =>
          prev.confidence > current.confidence ? prev : current
        );
      } else {
        // Find the specified object in the detection results
        detectedObject = detectionData.predictions
          .map((prediction) => {
            if (prediction.class === transformations.fo) {
              return prediction;
            }
          })
          .filter((item) => item !== undefined);

        detectedObject = detectedObject.reduce((prev, current) =>
          prev.confidence > current.confidence ? prev : current
        );

        if (!detectedObject) {
          detectedObject = null;
        }
      }
    }

    // Fetch the original image
    const response = await fetch(assetUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch the image");
    }
    const imageBuffer = await response.arrayBuffer();

    // Load image with Sharp
    let image = sharp(Buffer.from(imageBuffer));

    // Get original image metadata
    const metadata = await image.metadata();

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

    // Apply overlay text transformation
    if (transformations.overlayText) {
      // Retrieve the metadata of the image to get its dimensions
      const metadata = await image.metadata();
      const imageWidth = metadata.width;
      const imageHeight = metadata.height;

      console.log(transformations.overlayText); // { overlayText: { i: 'Hello' } }

      const { i, w, h, th, fs, cl, tx, ty } = transformations.overlayText;

      console.log(i); // "Hello"

      // Create an SVG image with the text
      const svgText = `
        <svg width="${w ? w : "auto"}" height="${h ? h : 100}">
          <text x="0" y="${th ? th : 100}" font-size="${fs ? fs : 30}" fill="${
        cl ? cl : "black"
      }">
            ${i}
          </text>
        </svg>
      `;

      // Create a buffer from the SVG text
      const textBuffer = Buffer.from(svgText);

      // Calculate the text's dimensions (assuming text width is proportional to its length and font size)
      const textWidth = (fs || 30) * i.length; // Approximate text width
      const textHeight = fs || 30; // Approximate text height

      // Calculate default coordinates to center the text
      const defaultX = Math.round((imageWidth - textWidth) / 2);
      const defaultY = Math.round((imageHeight - textHeight) / 2);

      console.log(defaultX, defaultY);

      // Composite the text onto the image at specified x, y coordinates
      image = image.composite([
        {
          input: textBuffer,
          top: ty !== undefined ? ty : defaultY, // Y coordinate for text placement
          left: tx !== undefined ? tx : defaultX, // X coordinate for text placement
        },
      ]);
    }

    // qualtiy 80
    // image = image.jpeg({ progressive: true, quality: 75 });

    // Convert the processed image to a buffer
    const finalImageBuffer = await image.toBuffer();

    // Cache the processed image
    cache.set(cacheKey, finalImageBuffer);

    // Send the processed image back
    const headers = new Headers();
    headers.set(
      "Content-Type",
      `${transformationString?.rt ? "image/png" : `image/${metadata.format}`}`
    );
    headers.set("Cache-Control", "public, max-age=31536000, immutable"); // Cache for one year

    return new NextResponse(finalImageBuffer, {
      headers,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
