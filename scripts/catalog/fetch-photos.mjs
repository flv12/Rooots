// Fetches one freely-licensed example photo per catalog plant from Wikimedia Commons,
// resizes it to WebP, records author/license/source in catalog.json and regenerates
// src/catalog/photos.generated.ts.
//
// Strategy: use the taxon's lead image on English Wikipedia (curated, representative),
// then verify its licence on Commons. Falls back to a Commons search.
//
// Usage: node scripts/catalog/fetch-photos.mjs [--force | --reencode]
//   (default)   fetch photos for plants that have none
//   --force     pick and fetch a photo again for every plant
//   --reencode  re-encode every existing photo from its original (cached, or re-downloaded once)
//
// Originals (1200 px thumbnails from Commons) are cached in scripts/catalog/.photo-cache/
// (git-ignored) so encoding settings can be tuned later without network or generation loss.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import sharp from 'sharp';

const ROOT = new URL('../../', import.meta.url);
const CATALOG = new URL('assets/catalog/catalog.json', ROOT);
const PHOTOS_DIR = new URL('assets/catalog/photos/', ROOT);
const GENERATED = new URL('src/catalog/photos.generated.ts', ROOT);
const UA = 'rooots-catalog-builder/0.1 (personal offline houseplant app; build-time only)';
const CACHE_DIR = new URL('scripts/catalog/.photo-cache/', ROOT);
const FORCE = process.argv.includes('--force');
const REENCODE = process.argv.includes('--reencode');

// Encoding. The photo is shown full-width at the top of the catalog sheet (aspect 1.1) and as a
// square crop in the catalog grid: store exactly the 1.1 frame, smart-cropped on the subject.
const WIDTH = 600;
const HEIGHT = Math.round(WIDTH / 1.1);
const SOURCE_WIDTH = WIDTH * 2;
// Quality chosen with compare-quality.mjs: q62 is visually identical to q78 on detailed foliage at 2x zoom.
const WEBP = { quality: 62, effort: 6, smartSubsample: true };

// Free licences only. NC / ND variants are rejected.
const ALLOWED = [/^cc0/i, /^public domain/i, /^pd/i, /^cc by(-sa)? \d/i, /^cc-by(-sa)?-\d/i];
const isAllowed = (lic) => ALLOWED.some((re) => re.test(lic)) && !/[-\s](nc|nd)\b/i.test(lic);

const stripHtml = (s) =>
  s
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { 'User-Agent': UA } });
    } catch (e) {
      // Transient network errors ("fetch failed"): retry with backoff.
      if (attempt >= 4) throw e;
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    if (res.status === 429 && attempt < 5) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 2000 * 2 ** attempt;
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res;
  }
}

async function api(base, params) {
  const url = `${base}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  await sleep(700);
  return (await get(url)).json();
}

async function leadImage(title, lang = 'en') {
  const data = await api(`https://${lang}.wikipedia.org/w/api.php`, {
    action: 'query',
    titles: title,
    redirects: '1',
    prop: 'pageimages',
    piprop: 'name',
  });
  return data.query?.pages?.[0]?.pageimage ?? null;
}

async function searchCommons(latin) {
  const data = await api('https://commons.wikimedia.org/w/api.php', {
    action: 'query',
    list: 'search',
    srsearch: `${latin} filetype:bitmap`,
    srnamespace: '6',
    srlimit: '10',
  });
  return (data.query?.search ?? []).map((r) => r.title.replace(/^File:/, ''));
}

async function fileInfo(name) {
  const data = await api('https://commons.wikimedia.org/w/api.php', {
    action: 'query',
    titles: `File:${name}`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: String(SOURCE_WIDTH),
  });
  const page = data.query?.pages?.[0];
  const ii = page?.imageinfo?.[0];
  if (!ii || page.missing) return null;
  const meta = ii.extmetadata ?? {};
  return {
    thumb: ii.thumburl,
    width: ii.width,
    height: ii.height,
    mime: ii.mime,
    license: meta.LicenseShortName?.value ?? '',
    author: stripHtml(meta.Artist?.value ?? meta.Attribution?.value ?? ''),
    source_url: ii.descriptionurl,
  };
}

function usable(info) {
  if (!info || !info.thumb) return false;
  if (!/jpeg|png|webp/.test(info.mime)) return false;
  if (info.width < WIDTH) return false;
  const ratio = info.width / info.height;
  const needsAuthor = !/^(cc0|public domain|pd)/i.test(info.license);
  return (
    ratio > 0.6 && ratio < 1.8 && isAllowed(info.license) && (!needsAuthor || info.author !== '')
  );
}

/**
 * Tries, in order: Wikipedia lead image for the latin name, its synonyms, the English and the
 * French common names; then a Commons search on the same names. First freely-licensed fit wins.
 */
async function pickPhoto(plant) {
  const names = [
    [plant.latin_name, 'en'],
    ...plant.synonyms.map((s) => [s, 'en']),
    ...plant.common_names_en.slice(0, 1).map((n) => [n, 'en']),
    ...plant.common_names_fr.slice(0, 1).map((n) => [n, 'fr']),
  ];
  const tried = new Set();
  for (const [title, lang] of names) {
    const lead = await leadImage(title, lang);
    if (!lead || tried.has(lead)) continue;
    tried.add(lead);
    const info = await fileInfo(lead);
    if (usable(info)) return info;
    console.log(`  lead image of "${title}" rejected (${info?.license ?? 'no info'})`);
  }
  for (const [query] of names.filter(([, lang]) => lang === 'en')) {
    for (const name of await searchCommons(query)) {
      if (tried.has(name)) continue;
      tried.add(name);
      const info = await fileInfo(name);
      if (usable(info)) return info;
    }
  }
  return null;
}

const fileNameFromSourceUrl = (url) => decodeURIComponent(url.split('/File:')[1] ?? '');
const cacheFile = (sourceUrl) =>
  new URL(fileNameFromSourceUrl(sourceUrl).replace(/[^\w.-]+/g, '_'), CACHE_DIR);

/** Original image bytes for a Commons file, from the local cache or downloaded once. */
async function original(thumbUrl, sourceUrl) {
  const cached = cacheFile(sourceUrl);
  if (existsSync(cached)) return readFileSync(cached);
  const res = await get(thumbUrl);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cached, buf);
  return buf;
}

export async function encode(buf, webp = WEBP) {
  return sharp(buf)
    .rotate()
    .resize({ width: WIDTH, height: HEIGHT, fit: 'cover', position: sharp.strategy.attention })
    .webp(webp)
    .toBuffer();
}

async function download(info, dest) {
  const out = await encode(await original(info.thumb, info.source_url));
  writeFileSync(dest, out);
  return out.length;
}

async function reencodeAll(catalog) {
  let before = 0;
  let after = 0;
  for (const plant of catalog.plants) {
    for (const photo of plant.photos) {
      const dest = new URL(photo.file, PHOTOS_DIR);
      if (existsSync(dest)) before += readFileSync(dest).length;
      let buf;
      if (existsSync(cacheFile(photo.source_url))) {
        buf = readFileSync(cacheFile(photo.source_url));
      } else {
        const info = await fileInfo(fileNameFromSourceUrl(photo.source_url));
        if (!info?.thumb) {
          console.log(`  ✗ ${plant.id}: original not found`);
          continue;
        }
        buf = await original(info.thumb, photo.source_url);
      }
      const out = await encode(buf);
      writeFileSync(dest, out);
      after += out.length;
      console.log(`  ${plant.id}: ${Math.round(out.length / 1024)} Ko`);
    }
  }
  console.log(`Re-encoded: ${Math.round(before / 1024)} Ko → ${Math.round(after / 1024)} Ko`);
}

function writeGenerated(plants) {
  const lines = plants
    .filter((p) => p.photos.length > 0)
    .map(
      (p) =>
        `  '${p.id}': [${p.photos.map((ph) => `require('../../assets/catalog/photos/${ph.file}')`).join(', ')}],`,
    );
  writeFileSync(
    GENERATED,
    `// Generated by scripts/catalog/fetch-photos.mjs — do not edit by hand.\nexport const catalogPhotos: Record<string, number[]> = {\n${lines.join('\n')}\n};\n`,
  );
}

async function main() {
  mkdirSync(PHOTOS_DIR, { recursive: true });
  const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
  if (REENCODE) {
    await reencodeAll(catalog);
    return;
  }
  let total = 0;
  for (const plant of catalog.plants) {
    const file = `${plant.id}-1.webp`;
    if (!FORCE && plant.photos.length > 0 && existsSync(new URL(file, PHOTOS_DIR))) {
      console.log(`= ${plant.id} (kept)`);
      continue;
    }
    console.log(`… ${plant.id}`);
    try {
      const info = await pickPhoto(plant);
      if (!info) {
        console.log('  no suitable free photo found');
        plant.photos = [];
        continue;
      }
      const size = await download(info, new URL(file, PHOTOS_DIR));
      total += size;
      plant.photos = [
        {
          file,
          author: info.author || 'Domaine public',
          license: info.license,
          source_url: info.source_url,
        },
      ];
      console.log(`  ✓ ${info.license} — ${info.author} (${Math.round(size / 1024)} Ko)`);
    } catch (e) {
      console.log(`  ✗ ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n');
  writeGenerated(catalog.plants);
  console.log(`Done. Downloaded ${Math.round(total / 1024)} Ko.`);
}

// Run only when executed directly (encode() is also imported by the comparison script).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
