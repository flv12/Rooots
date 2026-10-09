// Assembles assets/catalog/catalog.json from scripts/catalog/drafts/<id>.json.
// - keeps the photos already fetched for each plant (fetch-photos.mjs owns that field)
// - checks every draft against plants-list.json (id, latin name, category)
// - reports care values that look wrong, for human review
// - refuses to drop an id that is already in the catalog (ids are never deleted: use status 'retired')
// Full schema validation runs in the test suite (__tests__/catalog/catalog-data.test.ts).
// Usage: node scripts/catalog/build-catalog.mjs [--dry-run] [--only id1,id2]
//   --dry-run  check only, never writes catalog.json (safe to run concurrently)
//   --only     restrict draft checks and warnings to these ids
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const DRY_RUN = process.argv.includes('--dry-run');
const onlyArg = process.argv[process.argv.indexOf('--only') + 1];
const ONLY = process.argv.includes('--only') ? new Set(onlyArg.split(',')) : null;

const ENUMS = {
  status: ['active', 'retired'],
  data_status: ['draft', 'reviewed'],
  category: ['foliage', 'succulent', 'flowering', 'palm', 'fern', 'carnivorous', 'edible'],
  light: ['low', 'medium', 'bright_indirect', 'direct'],
  humidity: ['low', 'medium', 'high'],
  pet_toxic: ['yes', 'no', 'unknown'],
  difficulty: ['easy', 'medium', 'hard'],
};
const STRINGS = [
  'id',
  'latin_name',
  'family',
  'water_notes_fr',
  'soil_fr',
  'fertilize_fr',
  'tips_fr',
];
const INTS = ['water_every_days_summer', 'water_every_days_winter', 'temp_min_c', 'temp_max_c'];
const NULLABLE_INTS = ['fertilize_every_days', 'repot_every_years'];
const STRING_ARRAYS = ['synonyms', 'common_names_fr', 'common_names_en'];

/** Field-level checks mirroring src/catalog/schema.ts (the test suite runs the real schema). */
function shapeErrors(d) {
  const out = [];
  for (const [k, values] of Object.entries(ENUMS)) {
    if (!values.includes(d[k])) out.push(`${k} must be one of ${values.join('|')}`);
  }
  for (const k of STRINGS)
    if (typeof d[k] !== 'string' || !d[k]) out.push(`${k} must be a non-empty string`);
  for (const k of INTS) if (!Number.isInteger(d[k])) out.push(`${k} must be an integer`);
  for (const k of NULLABLE_INTS) {
    if (d[k] !== null && !(Number.isInteger(d[k]) && d[k] > 0))
      out.push(`${k} must be a positive integer or null`);
  }
  for (const k of STRING_ARRAYS) {
    if (!Array.isArray(d[k]) || d[k].some((s) => typeof s !== 'string'))
      out.push(`${k} must be a string array`);
  }
  if (d.pet_toxic_note_fr !== null && typeof d.pet_toxic_note_fr !== 'string')
    out.push('pet_toxic_note_fr must be a string or null');
  if (
    !Array.isArray(d.problems) ||
    d.problems.some((p) => !p.symptom_fr || !p.cause_fr || !p.fix_fr)
  ) {
    out.push('problems must be [{ symptom_fr, cause_fr, fix_fr }]');
  }
  if (!Array.isArray(d.sources) || d.sources.length === 0 || d.sources.some((s) => !s.name)) {
    out.push('sources must be a non-empty [{ name, url? }]');
  }
  if ('photos' in d) out.push('photos must not be in a draft (fetch-photos.mjs owns it)');
  return out;
}

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

const inScope = (id) => !ONLY || ONLY.has(id);

for (const l of list.filter((x) => inScope(x.id))) {
  const d = drafts.get(l.id);
  if (!d) {
    (ONLY ? errors : warnings).push(`${l.id}: no draft yet`);
    continue;
  }
  for (const e of shapeErrors(d)) errors.push(`${l.id}: ${e}`);
  if (d.latin_name !== l.latin_name) errors.push(`${l.id}: latin_name differs from the list`);
  if (d.category !== l.category) errors.push(`${l.id}: category differs from the list`);
}
for (const id of drafts.keys()) {
  if (!list.some((l) => l.id === id)) errors.push(`${id}: draft not in plants-list.json`);
}

// Coherence checks: values a reviewer should look at twice.
for (const d of [...drafts.values()].filter((x) => inScope(x.id))) {
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

if (DRY_RUN) {
  console.log(
    `\nOK (dry run): ${ONLY ? ONLY.size : plants.length} plant(s) checked, ${warnings.length} warning(s).`,
  );
} else {
  writeFileSync(CATALOG, JSON.stringify({ version: previous.version, plants }, null, 2) + '\n');
  console.log(`\ncatalog.json: ${plants.length} plants (${warnings.length} warning(s)).`);
}
