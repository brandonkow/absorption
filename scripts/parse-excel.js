#!/usr/bin/env node
/**
 * Reads public/Master_File.xlsx and writes src/data.json.
 * Run with:  npm run update-data
 *
 * ── Workflow ──────────────────────────────────────────────────────
 *  1. Edit  public/Master_File.xlsx  (keep column layout unchanged)
 *  2. Run:  npm run update-data
 *  3. git add public/Master_File.xlsx src/data.json && git push
 *
 * ── Developer names ───────────────────────────────────────────────
 *  The Excel has no Developer column.  Add new projects to DEV_MAP.
 * ─────────────────────────────────────────────────────────────────
 */

import XLSX from 'xlsx';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Developer lookup ──────────────────────────────────────────────
const DEV_MAP = {
  "Noordinz Suites":          "Exsim",
  "Queens Residences Q3":     "Ideal",
  "Ventus & Tradesmen":       "Unknown",
  "STARK Tower":              "Unknown",
  "The Lume":                 "E&O",
  "Maris":                    "E&O",
  "Westin Residences":        "BSG Property",
  "G'Vinton":                 "GSD Land",
  "Lumina Residence":         "BSG Property",
  "The Anton":                "Tamarins",
  "The Crown":                "Chin Hin",
  "Scott @ Logan":            "Advance Golden",
  "Alton Skyvillas":          "Airmas",
  "Lightwater Residences":    "IJM",
  "The Lighthauz":            "Exsim",
  "Avea":                     "E&O",
  "Setia SV2":                "SP Setia",
  "Keeperz Suites":           "Exsim",
  "Avion":                    "Rackson",
  "Bayan Suite":              "Seal Inc.",
  // Add new projects here ↓
};

// ── Short chart labels ────────────────────────────────────────────
const SH_MAP = {
  "Queens Residences Q3":     "Queens Q3",
  "The Lume":                 "The Lume",
  "Maris":                    "Maris",
  "Westin Residences":        "Westin",
  "G'Vinton":                 "G'Vinton",
  "Lumina Residence":         "Lumina",
  "The Crown":                "The Crown",
  "Scott @ Logan":            "Scott@L",
  "Alton Skyvillas":          "Alton",
  "Lightwater Residences":    "Lightwater",
  "The Lighthauz":            "Lighthauz*",
  "Avea":                     "Avea",
  "Setia SV2":                "Setia SV2",
  "Keeperz Suites":           "Keeperz*",
  "Avion":                    "Avion",
  "Bayan Suite":              "Bayan Suite",
};

// ── Name normalisations (Excel name → canonical dashboard name) ───
const NAME_NORM = {
  "Westin Residences Penang": "Westin Residences",
};

// ── Helpers ───────────────────────────────────────────────────────
function cleanNum(v) {
  if (typeof v === 'number') return v;
  const m = String(v || '').replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

function parseRange(raw) {
  const s = String(raw || '').replace(/,/g, '').trim();
  if (!s) return [0, 0];
  if (s.toLowerCase().includes('onwards')) {
    const v = parseFloat(s) || 0;
    return [v, v];
  }
  const parts = s.split(/\s*[–\-]\s*/);
  if (parts.length >= 2) {
    return [parseFloat(parts[0]) || 0, parseFloat(parts[1]) || 0];
  }
  const v = parseFloat(s) || 0;
  return [v, v];
}

function parseLaunchComp(raw) {
  const parts = String(raw || '').split('/');
  return {
    launch: parseInt(parts[0].trim()) || 0,
    comp:   parts.slice(1).join('/').trim(),
  };
}

function sh(name) {
  return SH_MAP[name] || name.slice(0, 10).trim();
}

// ── Read Excel ────────────────────────────────────────────────────
const xlPath = join(__dirname, '../public/Master_File.xlsx');
if (!existsSync(xlPath)) {
  console.error('❌  public/Master_File.xlsx not found.');
  process.exit(1);
}

const wb   = XLSX.readFile(xlPath);
const ws   = wb.Sheets['Master'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Walk rows, split into highrise / landed sections
let section = null;
const highriseRows = [];

for (const r of rows) {
  const label = String(r[0]).trim();
  if (label === 'Highrise') { section = 'highrise'; continue; }
  if (label === 'Landed')   { section = 'landed';   continue; }
  if (label === 'No' || typeof r[0] !== 'number') continue;
  if (!String(r[1]).trim()) continue;

  const entry = {
    no:        r[0],
    name:      NAME_NORM[String(r[1]).trim()] ?? String(r[1]).trim(),
    units:     parseInt(r[2]) || 0,
    sf:        r[3],
    price:     r[4],
    psf:       r[5],
    lc:        r[6],
    abs2023:   cleanNum(r[7]),
    abs2024:   cleanNum(r[8]),
    abs2025:   cleanNum(r[9]),
    abs1h2026: cleanNum(r[10]),
    rateRaw:   r[11],
    remark:    String(r[12] || '').trim(),
  };

  if (section === 'highrise') highriseRows.push(entry);
}

// ── Build ACTIVE & ANN ────────────────────────────────────────────
let seq = 1;
const active = [];
const ann    = [];

for (const r of highriseRows) {
  // Skip rows that only have a booking/estimated rate (not a confirmed numeric %)
  if (typeof r.rateRaw !== 'number') continue;

  const [sfMin,  sfMax]  = parseRange(r.sf);
  const [pMin,   pMax]   = parseRange(r.price);
  const [psfMin, psfMax] = parseRange(r.psf);
  const { launch, comp } = parseLaunchComp(r.lc);
  const dev              = DEV_MAP[r.name] ?? 'Unknown';

  active.push({
    no:    seq++,
    dev,
    name:  r.name,
    units: r.units,
    sfMin:  Math.round(sfMin),  sfMax:  Math.round(sfMax),
    psfMin: Math.round(psfMin), psfMax: Math.round(psfMax),
    pMin:   Math.round(pMin),   pMax:   Math.round(pMax),
    launch, comp,
    rate: r.rateRaw,
  });

  // Only include in annual chart if at least one year has absorption data
  if (r.abs2024 || r.abs2025 || r.abs1h2026) {
    ann.push({
      sh:   sh(r.name),
      name: r.name,
      dev,
      y4:   r.abs2024,
      y5:   r.abs2025,
      y6:   r.abs1h2026,
    });
  }
}

// ── Completed benchmarks (not in Excel — edit manually here) ──────
const completed = [
  { dev: "IJM", name: "Mezzo",      units: 456, psfMin: 1016, psfMax: 1045, rate: 50.22 },
  { dev: "YTL", name: "Shorefront", units: 115, psfMin:  996, psfMax: 1319, rate: 100   },
];

// ── Write output ──────────────────────────────────────────────────
const out = { active, ann, completed };
writeFileSync(join(__dirname, '../src/data.json'), JSON.stringify(out, null, 2));

console.log(`✓ ${active.length} active projects`);
console.log(`✓ ${ann.length} annual absorption records`);
console.log(`✓ ${completed.length} completed benchmarks`);
console.log('✓ src/data.json updated — commit and push to deploy.');
