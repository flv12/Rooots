// Helps choose the WebP quality: encodes a few cached originals at several qualities, prints
// sizes, and writes a side-by-side sheet of 1:1 crops (the most detailed area) to inspect.
// Usage: node scripts/catalog/compare-quality.mjs <out.png> [id ...]
import { readFileSync } from 'node:fs';

import sharp from 'sharp';

import { encode } from './fetch-photos.mjs';

const QUALITIES = [55, 62, 68, 72, 78];
const CROP = 220;

const [out, ...ids] = process.argv.slice(2);
const catalog = JSON.parse(
  readFileSync(new URL('../../assets/catalog/catalog.json', import.meta.url), 'utf8'),
);
const cacheFile = (url) =>
  new URL(
    decodeURIComponent(url.split('/File:')[1]).replace(/[^\w.-]+/g, '_'),
    new URL('.photo-cache/', import.meta.url),
  );

const rows = [];
for (const id of ids) {
  const plant = catalog.plants.find((p) => p.id === id);
  const original = readFileSync(cacheFile(plant.photos[0].source_url));
  const tiles = [];
  const sizes = [];
  for (const q of QUALITIES) {
    const webp = await encode(original, { quality: q, effort: 6, smartSubsample: true });
    sizes.push(`q${q}: ${Math.round(webp.length / 1024)} Ko`);
    // Center 1:1 crop of the encoded image, enlarged 2x to make artifacts visible.
    const tile = await sharp(webp)
      .extract({ left: 190, top: 160, width: CROP / 2, height: CROP / 2 })
      .resize(CROP, CROP, { kernel: 'nearest' })
      .png()
      .toBuffer();
    tiles.push(tile);
  }
  console.log(`${id.padEnd(26)} ${sizes.join('  ')}`);
  rows.push(tiles);
}

const gap = 8;
await sharp({
  create: {
    width: QUALITIES.length * (CROP + gap) + gap,
    height: rows.length * (CROP + gap) + gap,
    channels: 3,
    background: '#ffffff',
  },
})
  .composite(
    rows.flatMap((tiles, r) =>
      tiles.map((input, c) => ({
        input,
        left: gap + c * (CROP + gap),
        top: gap + r * (CROP + gap),
      })),
    ),
  )
  .png()
  .toFile(out);
console.log(`Columns: ${QUALITIES.map((q) => `q${q}`).join(', ')} → ${out}`);
