// @ts-check

import { Canvas } from "@napi-rs/canvas";

export default function generateImage(req, res) {
  const WIDTH = 800;
  const HEIGHT = 400;
  const canvas = new Canvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "blue";
  ctx.rect(0, 0, WIDTH, HEIGHT / 5);
  ctx.fill();

  ctx.rect(0, HEIGHT - HEIGHT / 5, WIDTH, HEIGHT);
  ctx.fill();

  const START_X = WIDTH / 2 - HEIGHT / 8;
  const START_Y = HEIGHT / 2 - HEIGHT / 8;

  ctx.strokeStyle = "blue";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(START_X + HEIGHT / 8, START_Y);
  ctx.lineTo(START_X + HEIGHT / 4, START_Y + HEIGHT / 4);
  ctx.lineTo(START_X, START_Y + HEIGHT / 4);
  ctx.lineTo(START_X + HEIGHT / 8, START_Y);
  ctx.stroke();

  const distance = 20;

  ctx.beginPath();
  ctx.moveTo(START_X + HEIGHT / 8, distance + START_Y + HEIGHT / 4);
  ctx.lineTo(START_X + HEIGHT / 4, distance + START_Y);
  ctx.lineTo(START_X, distance + START_Y);
  ctx.lineTo(START_X + HEIGHT / 8, START_Y + distance + HEIGHT / 4);
  ctx.stroke();

  const buffer = canvas.toBuffer("image/png");
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", "inline");
  res.send(buffer);
}
