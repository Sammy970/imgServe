# Image Transformation API Documentation

## Overview

This API provides powerful image transformation capabilities including resizing, smart cropping, text overlays, and automatic optimization. The API is implemented in `route.ts` and handles image transformations via URL parameters.

## URL Structure

The API accepts two URL formats:

- `/image/tr:[transformations]/[imageId]`
- `/image/[imageId]?tr:[transformations]`

## Transformation Options

### Basic Image Transformations

| Parameter     | Description             | Example |
| ------------- | ----------------------- | ------- |
| `w-[number]`  | Set width in pixels     | `w-300` |
| `h-[number]`  | Set height in pixels    | `h-400` |
| `rt-[number]` | Rotate image by degrees | `rt-90` |

### Smart Object Detection & Cropping

| Parameter     | Description                          | Example                |
| ------------- | ------------------------------------ | ---------------------- |
| `fo-auto`     | Auto-detect and focus on main object | `fo-auto`              |
| `fo-[object]` | Focus on specific object type        | `fo-person`, `fo-bowl` |

### Text Overlay

Text overlays must be wrapped between `l-text` and `l-end` tags. Available parameters:

| Parameter     | Description                       | Default  |
| ------------- | --------------------------------- | -------- |
| `i-[text]`    | Text content (use %20 for spaces) | Required |
| `w-[number]`  | Maximum text wrap width           | None     |
| `fs-[number]` | Font size                         | 40       |
| `cl-[color]`  | Text color                        | white    |

#### Text Positioning

Either use preset positions with `lfo-[position]`:

- Top: `top`, `top_left`, `top_right`
- Middle: `middle`, `middle_left`, `middle_right`
- Bottom: `bottom`, `bottom_left`, `bottom_right`

Or specify exact coordinates:

- `lx-[number]`: X position
- `ly-[number]`: Y position
- Use 'N' prefix for negative positioning (e.g., `lx-N20`)
