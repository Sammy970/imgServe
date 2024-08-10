import { NextResponse } from "next/server";
import sharp from "sharp";
import { createCanvas, loadImage } from "@napi-rs/canvas";
// import module from "node-module";

export const GET = async (req, res) => {
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
      // sample transformationString: "tr:w-30,h-30,a-4-3"
      // expected output: { w: 30, h: 30, a: "4-3" }

      transformationString = transformationString.replace("tr:", "");

      const parsedTransformations = {};

      transformationString.split(",").forEach((transformation) => {
        const [key, value] = transformation.split("-");
        if (key === "ar") {
          const [arWidth, arHeight] = value.split("_").map(Number);
          parsedTransformations[key] = { width: arWidth, height: arHeight };
        } else {
          parsedTransformations[key] = parseFloat(value); // Handle both integer and float values
        }
      });

      return parsedTransformations;
    };

    const transformations = parser();

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
        // Treat it as a percentage if <= 1 (e.g., 0.4 for 40%)
        transformations.w = Math.round(metadata.width * transformations.w);
      }
    }

    // Apply height transformation
    if (transformations.h) {
      if (transformations.h <= 1) {
        // Treat it as a percentage if <= 1 (e.g., 0.4 for 40%)
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
      }
    }

    // Resize the image based on the calculated width and height
    if (transformations.w || transformations.h) {
      image = image.resize(transformations.w, transformations.h);
    }

    console.log("Image metadata:", metadata);
    console.log("Transformations:", transformations);

    // Decrease the quality of the image and convert it to webp
    image = image.webp({ quality: 100 });

    // Convert the processed image to a buffer
    const finalImageBuffer = await image.toBuffer();

    // Send the processed image back
    const headers = new Headers();
    headers.set("Content-Type", "image/webp");
    headers.set("Cache-Control", "public, max-age=31536000, immutable"); // Cache for one year

    return new NextResponse(finalImageBuffer, {
      headers,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
