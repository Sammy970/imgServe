import { NextResponse } from "next/server";
import sharp from "sharp";

export const GET = async (req) => {
  // use env - ROBOFLOW_API_KEY below
  const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;

  const { pathname } = new URL(req.url);
  let [transformationString, assetName] = pathname
    .replace("/api/image", "")
    .split("/")
    .filter(Boolean);

  if (!assetName) {
    return NextResponse.json(
      { error: "Asset name is required" },
      { status: 400 }
    );
  }

  try {
    const assetUrl = `https://utfs.io/f/${assetName}`;

    const parser = () => {
      transformationString = transformationString.replace("tr:", "");

      const parsedTransformations = {};

      transformationString.split(",").forEach((transformation) => {
        const [key, value] = transformation.split("-");
        if (key === "ar") {
          const [arWidth, arHeight] = value.split("_").map(Number);
          parsedTransformations[key] = { width: arWidth, height: arHeight };
        } else if (key === "fo") {
          parsedTransformations[key] = value;
        } else {
          parsedTransformations[key] = parseFloat(value); // Handle both integer and float values
        }
      });

      return parsedTransformations;
    };

    const transformations = parser();

    // Object detection
    let detectedObject;
    if (transformations.fo) {
      const objectDetectionResponse = await fetch(
        `https://detect.roboflow.com/coco/5?api_key=${ROBOFLOW_API_KEY}&image=${assetUrl}`,
        { method: "POST" }
      );
      const detectionData = await objectDetectionResponse.json();

      // Find the specified object in the detection results
      detectedObject = detectionData.predictions.find(
        (prediction) => prediction.class === transformations.fo
      );

      if (!detectedObject) {
        // make it null
        detectedObject = null;
      }

      if (transformations.fo === "auto") {
        // Find the object with the highest confidence score
        detectedObject = detectionData.predictions.reduce((prev, current) =>
          prev.confidence > current.confidence ? prev : current
        );
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

    // qualtiy 80
    image = image.jpeg({ progressive: true, quality: 75 });

    // Convert the processed image to a buffer
    const finalImageBuffer = await image.toBuffer();

    // Send the processed image back
    const headers = new Headers();
    headers.set("Content-Type", "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000, immutable"); // Cache for one year

    return new NextResponse(finalImageBuffer, {
      headers,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
