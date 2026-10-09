// Checks every latin name of plants-list.json against the GBIF backbone taxonomy:
// accepted name, synonym, or unknown, plus the family. Writes gbif-report.json.
// Usage: node scripts/catalog/validate-gbif.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const UA = 'rooots-catalog-builder/0.1 (personal offline houseplant app; build-time only)';
const list = JSON.parse(readFileSync(new URL('plants-list.json', import.meta.url), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const report = [];
for (const p of list) {
  // GBIF does not want the hybrid sign inside the name.
  const name = p.latin_name.replace(/\s*×\s*/g, ' ');
  const url = `https://api.gbif.org/v1/species/match?kingdom=Plantae&name=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const m = await res.json();
  const entry = {
    id: p.id,
    latin_name: p.latin_name,
    matchType: m.matchType,
    status: m.status ?? 'NONE',
    rank: m.rank ?? null,
    family: m.family ?? null,
    accepted: m.status === 'SYNONYM' ? (m.species ?? m.canonicalName ?? null) : null,
  };
  report.push(entry);
  const flag =
    entry.matchType === 'NONE'
      ? '✗ not found'
      : entry.status === 'SYNONYM'
        ? `↪ synonym of ${entry.accepted}`
        : entry.matchType === 'FUZZY'
          ? '~ fuzzy match'
          : '✓';
  console.log(`${flag.padEnd(40)} ${p.latin_name} (${entry.family ?? '?'})`);
  await sleep(150);
}

writeFileSync(new URL('gbif-report.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
const issues = report.filter((r) => r.status !== 'ACCEPTED' || r.matchType !== 'EXACT');
console.log(`\n${report.length} names, ${issues.length} to look at.`);
