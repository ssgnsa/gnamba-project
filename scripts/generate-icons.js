#!/usr/bin/env node
/**
 * Script to generate PWA icons from SVG
 * Requires: npm install canvas
 */

import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

// Ensure public directory exists
try {
  mkdirSync(publicDir, { recursive: true });
} catch (e) {
  // Directory already exists
}

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#1e40af";
  ctx.fillRect(0, 0, size, size);

  // Rounded corners
  ctx.fillStyle = "#1e40af";
  ctx.beginPath();
  const radius = size * 0.125;
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // Text "EGS"
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EGS", size / 2, size * 0.45);

  // Subtitle
  ctx.fillStyle = "#bfdbfe";
  ctx.font = `${size * 0.08}px Arial`;
  ctx.fillText("Gnamba Services", size / 2, size * 0.75);

  // Save
  const buffer = canvas.toBuffer("image/png");
  writeFileSync(join(publicDir, filename), buffer);
  console.log(`✓ Generated ${filename} (${size}x${size})`);
}

// Generate icons
generateIcon(192, "icon-192.png");
generateIcon(512, "icon-512.png");

console.log("\nIcons generated successfully!");
