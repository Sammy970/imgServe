import { NextResponse } from "next/server";
import sharp from "sharp";
import { createCanvas, loadImage } from "@napi-rs/canvas";
// import module from "node-module";

export const GET = async (req, res) => {
  const { pathname } = new URL(req.url);
  const [transformationString, assetName] = pathname
    .replace("/api/image", "")
    .split("/")
    .filter(Boolean);

  if (!assetName) {
    return NextResponse.json(
      { error: "Asset name is required" },
      { status: 400 }
    );
  }

  const imgUrl = `https://utfs.io/f/${assetName}`;

  console.log(`
    Transformation: ${transformationString}
    Asset: ${assetName}
    Image URL: ${imgUrl}
    `);

  return NextResponse.json(
    { data: imgUrl },
    {
      status: 200,
    }
  );
};
