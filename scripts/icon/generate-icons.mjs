// Generates the app icon set from SVG artwork (no text, brand colours).
// Usage: node scripts/icon/generate-icons.mjs [variant]   (variant: leaf | drop | sprout; default drop)
//        node scripts/icon/generate-icons.mjs --preview   (writes a comparison sheet only)
import { mkdirSync, writeFileSync } from 'node:fs';

import sharp from 'sharp';

const OUT = new URL('../../assets/images/', import.meta.url);
const PREVIEW = new URL('../../assets/icon-variants/', import.meta.url);

const C = {
  green: '#2F6B47',
  greenDark: '#24563A',
  cream: '#F4F1EA',
  leaf: '#8CC79A',
  water: '#73B6E8',
};

// Artwork drawn in a 1024 box, kept inside the central 640 px (adaptive-icon safe zone).
const art = {
  // A single rounded leaf with its midrib and a falling water drop.
  leaf: (fg, accent) => `
    <g transform="rotate(-28 512 540)">
      <path d="M512 228 C 676 330 724 520 652 676 C 612 762 562 808 512 828 C 462 808 412 762 372 676 C 300 520 348 330 512 228 Z" fill="${fg}"/>
      <path d="M512 300 L 512 812" stroke="${accent}" stroke-width="22" stroke-linecap="round" fill="none" opacity="0.55"/>
      <path d="M512 470 L 600 400 M512 590 L 616 512 M512 470 L 424 400 M512 590 L 408 512" stroke="${accent}" stroke-width="16" stroke-linecap="round" fill="none" opacity="0.4"/>
    </g>
    <path d="M708 640 C 708 640 660 700 660 732 C 660 759 682 780 708 780 C 734 780 756 759 756 732 C 756 700 708 640 708 640 Z" fill="${C.water}"/>`,
  // A big water drop holding a small sprout.
  drop: (fg, accent) => `
    <path d="M512 220 C 512 220 312 460 312 600 C 312 712 402 800 512 800 C 622 800 712 712 712 600 C 712 460 512 220 512 220 Z" fill="${fg}"/>
    <path d="M512 724 L 512 560" stroke="${accent}" stroke-width="22" stroke-linecap="round"/>
    <path d="M512 590 C 512 520 560 480 624 476 C 628 540 584 590 512 590 Z" fill="${accent}"/>
    <path d="M512 640 C 512 580 470 548 412 546 C 410 600 448 640 512 640 Z" fill="${accent}"/>`,
  // A sprout with two leaves coming out of soil.
  sprout: (fg, accent) => `
    <path d="M512 780 C 512 640 512 560 512 470" stroke="${fg}" stroke-width="34" stroke-linecap="round" fill="none"/>
    <path d="M512 520 C 512 380 600 300 744 292 C 752 432 660 524 512 520 Z" fill="${fg}"/>
    <path d="M512 600 C 512 488 440 424 320 418 C 314 532 390 604 512 600 Z" fill="${fg}" opacity="0.85"/>
    <path d="M360 780 L 664 780" stroke="${accent}" stroke-width="34" stroke-linecap="round"/>`,
};

const svg = (body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${
    bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''
  }${body}</svg>`;

const png = (s, size = 1024) => sharp(Buffer.from(s)).resize(size, size).png().toBuffer();

async function preview() {
  mkdirSync(PREVIEW, { recursive: true });
  const tiles = [];
  for (const name of Object.keys(art)) {
    const full = await png(svg(art[name](C.cream, C.green), C.green), 300);
    // Simulate the round Android launcher mask.
    const mask = Buffer.from('<svg width="300" height="300"><circle cx="150" cy="150" r="150"/></svg>');
    const round = await sharp(full).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
    writeFileSync(new URL(`${name}.png`, PREVIEW), round);
    tiles.push(round);
  }
  const gap = 40;
  const sheet = sharp({
    create: { width: tiles.length * 300 + (tiles.length + 1) * gap, height: 380, channels: 4, background: C.cream },
  }).composite(tiles.map((t, i) => ({ input: t, left: gap + i * (300 + gap), top: gap })));
  await sheet.png().toFile(new URL('sheet.png', PREVIEW).pathname);
  console.log('Preview written to assets/icon-variants/sheet.png');
}

async function generate(name) {
  const draw = art[name];
  if (!draw) throw new Error(`Unknown variant ${name}`);
  const files = {
    'icon.png': svg(draw(C.cream, C.green), C.green),
    'android-icon-foreground.png': svg(draw(C.cream, C.green)),
    'android-icon-background.png': svg('', C.green),
    // Android themed icons only use alpha: cut the details out of the shape with a mask.
    'android-icon-monochrome.png': `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs><mask id="m">${draw('#ffffff', '#000000')}</mask></defs><rect width="1024" height="1024" fill="#000000" mask="url(#m)"/></svg>`,
    'splash-icon.png': svg(draw(C.green, C.cream)),
    'favicon.png': svg(draw(C.cream, C.green), C.green),
  };
  for (const [file, s] of Object.entries(files)) {
    const size = file === 'favicon.png' ? 48 : 1024;
    writeFileSync(new URL(file, OUT), await png(s, size));
  }
  console.log(`Generated icon set "${name}" in assets/images/`);
}

const arg = process.argv[2];
if (arg === '--preview') await preview();
else await generate(arg ?? 'drop');
