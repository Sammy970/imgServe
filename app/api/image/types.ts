import { type NextRequest } from "next/server";

// Base transformation parameters
export interface BaseTransformations {
  w?: number;  // width
  h?: number;  // height
  rt?: number; // rotation
  ar?: {
    width: number;
    height: number;
  };
  fo?: string; // focus/smart crop
  removeBg?: boolean;
}

// Text overlay specific parameters
export interface TextOverlayOptions {
  i: string;      // text content
  w?: number;     // max width
  lx?: number | string; // x position
  ly?: number | string; // y position
  lfo?: TextPosition; // layout format option
  fs?: number;    // font size
  cl?: string;    // color
}

// All possible text positioning options
export type TextPosition = 
  | "top"
  | "top_left"
  | "top_right"
  | "middle"
  | "middle_left"
  | "middle_right"
  | "bottom"
  | "bottom_left"
  | "bottom_right";

// Complete transformation parameters
export interface TransformationParams extends BaseTransformations {
  overlayText?: TextOverlayOptions;
}

// Roboflow API response types
export interface RoboflowPrediction {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
}

export interface RoboflowResponse {
  predictions: RoboflowPrediction[];
}

// Image metadata
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
}

// Request parameters
export interface RequestParams {
  transformationString: string;
  assetName: string;
}

// Parse URL result
export interface ParsedURLResult {
  transformationString: string;
  assetName: string;
}

// Cache interface
export interface CacheInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, expiryMode?: string, time?: number): Promise<void>;
}

// API Handler type
export type ImageAPIHandler = (req: NextRequest) => Promise<Response>; 

// Add these new interfaces to your existing types.ts file

export interface TextPositionResult {
  x: number;
  y: number;
} 