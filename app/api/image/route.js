import { NextResponse } from "next/server";
import sharp from "sharp";
import { createCanvas, loadImage } from "@napi-rs/canvas";
// import module from "node-module";

export const GET = async (req, res) => {
  const imgUrl =
    "https://m.economictimes.com/thumb/msid-80833752,width-1200,height-900,resizemode-4,imgsize-64431/online-test-gettyimages.jpg";

  const searchParams = req.nextUrl.searchParams;

  const width = searchParams.get("w");
  const height = searchParams.get("h");
  const crop = searchParams.get("crop");
  const text = searchParams.get("text");
  const textX = searchParams.get("textX") || 0;
  const textY = searchParams.get("textY") || 0;
  const textSize = searchParams.get("textSize") || 32;
  const textColor = searchParams.get("textColor") || "white";

  try {
    // Fetch the original image
    const response = await fetch(imgUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch the image");
    }
    const buffer = await response.arrayBuffer();
    let image = sharp(Buffer.from(buffer));

    // Apply transformations
    if (width || height) {
      image = image.resize(
        width ? parseInt(width) : null,
        height ? parseInt(height) : null
      );
    }

    if (crop) {
      const [left, top, cropWidth, cropHeight] = crop.split(",").map(Number);
      image = image.extract({
        left,
        top,
        width: cropWidth,
        height: cropHeight,
      });
    }

    // Convert the image to buffer
    const transformedBuffer = await image.toBuffer();

    // Load the transformed image into the canvas
    const img = await loadImage(Buffer.from(transformedBuffer));
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, img.width, img.height);

    // Add text overlay
    if (text) {
      ctx.font = `${textSize}px sans-serif`;
      ctx.fillStyle = textColor;
      ctx.fillText(text, parseInt(textX), parseInt(textY));
    }

    // Convert the canvas to a buffer
    const finalBuffer = canvas.toBuffer("image/jpeg");

    // Create and return the response
    const headers = new Headers();
    headers.set("Content-Type", "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000, immutable"); // Cache for one year

    return new NextResponse(finalBuffer, {
      headers,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
