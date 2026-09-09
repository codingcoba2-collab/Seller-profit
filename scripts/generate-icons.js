import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const inputLogoPath = path.resolve('src/assets/images/app_icon_logo_1788362419961.jpg');
const publicDir = path.resolve('public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function generateAllIcons() {
  console.log('Generating high-resolution PWA and iOS icons from Seller Center emblem...');
  
  if (!fs.existsSync(inputLogoPath)) {
    console.error('Source logo file not found:', inputLogoPath);
    process.exit(1);
  }

  // 1. Apple Touch Icon for iOS Safari (180x180)
  await sharp(inputLogoPath)
    .resize(180, 180, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  await sharp(inputLogoPath)
    .resize(180, 180, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon-precomposed.png'));

  // 2. Android & Chromium PWA standard icons
  await sharp(inputLogoPath)
    .resize(192, 192, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  await sharp(inputLogoPath)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 3. Android Maskable icon with 15% safe padding
  const innerSize = Math.round(512 * 0.80); // 410px
  const pad = Math.floor((512 - innerSize) / 2);
  const resizedInner = await sharp(inputLogoPath)
    .resize(innerSize, innerSize, { fit: 'cover' })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 11, g: 12, b: 16, alpha: 1 }
    }
  })
  .composite([{ input: resizedInner, top: pad, left: pad }])
  .png({ quality: 100 })
  .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // 4. Favicon (64x64)
  await sharp(inputLogoPath)
    .resize(64, 64, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('All Seller Center PWA & iOS Safari icons generated successfully!');
}

generateAllIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});

