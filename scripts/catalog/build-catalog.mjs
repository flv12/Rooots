// Assembles assets/catalog/catalog.json from scripts/catalog/drafts/<id>.json.
// - keeps the photos already fetched for each plant (fetch-photos.mjs owns that field)
// - checks every draft against plants-list.json (id, latin name, category)
// - reports care values that look wrong, for human review
// - refuses to drop an id that is already in the catalog (ids are never deleted: use status 'retired')
// Full schema validation runs in the test suite (__tests__/catalog/catalog-data.test.ts).
// Usage: node scripts/catalog/build-catalog.mjs
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const DRAFTS = new URL('drafts/', import.meta.url);
const CATALOG = new URL('../../assets/catalog/catalog.json', import.meta.url);
const list = JSON.parse(readFileSync(new URL('plants-list.json', import.meta.url), 'utf8'));

const previous = existsSync(CATALOG)
  ? JSON.parse(readFileSync(CATALOG, 'utf8'))
  : { version: 1, plants: [] };
const photosById = new Map(previous.plants.map((p) => [p.id, p.photos ?? []]));

const drafts = new Map(
  readdirSync(DRAFTS)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const d = JSON.parse(readFileSync(new URL(f, DRAFTS), 'utf8'));
      if (`${d.id}.json` !== f) throw new Error(`${f}: id "${d.id}" does not match the file name`);
      return [d.id, d];
    }),
);

const errors = [];
const warnings = [];

for (const p of previous.plants) {
  if (!drafts.has(p.id)) errors.push(`${p.id}: present in the catalog but its draft is missing`);
}

for (const l of list) {
  const d = drafts.get(l.id);
  if (!d) {
    warnings.push(`${l.id}: no draft yet`);
    continue;
  }
  if (d.latin_name !== l.latin_name) errors.push(`${l.id}: latin_name differs from the list`);
  if (d.category !== l.category) errors.push(`${l.id}: category differs from the list`);
}
for (const id of drafts.keys()) {
  if (!list.some((l) => l.id === id)) errors.push(`${id}: draft not in plants-list.json`);
}

// Coherence checks: values a reviewer should look at twice.
for (const d of drafts.values()) {
  const w = (msg) => warnings.push(`${d.id}: ${msg}`);
  if (d.water_every_days_winter < d.water_every_days_summer) w('waters more often in winter');
  if (d.water_every_days_summer < 2 || d.water_every_days_winter > 45)
    w('unusual watering interval');
  if (d.temp_min_c >= d.temp_max_c) errors.push(`${d.id}: temp_min_c >= temp_max_c`);
  if (d.temp_min_c < 0 || d.temp_max_c > 40) w('unusual temperature range');
  if (d.pet_toxic !== 'unknown' && !d.sources.some((s) => /aspca/i.test(s.name))) {
    errors.push(`${d.id}: pet_toxic "${d.pet_toxic}" without an ASPCA source`);
  }
  if (d.pet_toxic === 'yes' && !d.pet_toxic_note_fr) w('toxic without a note');
  if (!d.common_names_fr.length) w('no French name');
}

const order = list.map((l) => l.id);
const plants = [...drafts.values()]
  .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
  .map((d) => ({ ...d, photos: photosById.get(d.id) ?? [] }));

for (const w of warnings) console.log(`⚠ ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error(`\n${errors.length} error(s): catalog.json not written.`);
  process.exit(1);
}

writeFileSync(CATALOG, JSON.stringify({ version: previous.version, plants }, null, 2) + '\n');
console.log(`\ncatalog.json: ${plants.length} plants (${warnings.length} warning(s)).`);
