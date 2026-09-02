import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawFn) {
  // CRC32 table
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c >>> 0;
  }

  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcVal = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crcVal, 8 + len);
    return buf;
  }

  // Scanlines
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Icon drawer: Stylish dark slate background (#0f172a) with emerald accent icon
function drawIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const rNorm = Math.hypot(x - cx, y - cy) / (w / 2);

  // Background: Deep dark slate (#0f172a -> #1e293b)
  let r = 15;
  let g = 23;
  let b = 42;
  let a = 255;

  // Subtle radial gradient in background
  const grad = Math.max(0, 1 - rNorm);
  r = Math.min(255, Math.round(r + grad * 20));
  g = Math.min(255, Math.round(g + grad * 35));
  b = Math.min(255, Math.round(b + grad * 50));

  // Central icon badge: Shopee Orange / Emerald chart & bag
  const relX = (x - cx) / (w * 0.35); // -1 to 1
  const relY = (y - cy) / (h * 0.35); // -1 to 1

  // Draw a rounded card / bag in center
  if (Math.abs(relX) < 0.8 && Math.abs(relY) < 0.8) {
    // Bag body
    const distSquare = Math.max(Math.abs(relX), Math.abs(relY));
    if (distSquare < 0.75) {
      // Emerald / Teal badge (#10b981)
      r = 16;
      g = 185;
      b = 129;

      // Inner icon: chart bars or check
      // Bar 1 (left)
      if (relX > -0.55 && relX < -0.3 && relY > 0.0 && relY < 0.5) {
        r = 255; g = 255; b = 255;
      }
      // Bar 2 (middle)
      if (relX > -0.2 && relX < 0.05 && relY > -0.25 && relY < 0.5) {
        r = 255; g = 255; b = 255;
      }
      // Bar 3 (right, highest)
      if (relX > 0.15 && relX < 0.4 && relY > -0.5 && relY < 0.5) {
        r = 255; g = 255; b = 255;
      }
      // Upward trend arrow or sparkle
      if (relX > 0.15 && relX < 0.45 && relY > -0.65 && relY < -0.45) {
        r = 245; g = 158; b = 11; // Amber sparkle
      }
    }
  }

  return [r, g, b, a];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PNGs
console.log('Generating PWA and iOS icons...');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, drawIcon));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, drawIcon));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, drawIcon));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, drawIcon));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(48, 48, drawIcon));

console.log('Icons generated successfully in /public!');
