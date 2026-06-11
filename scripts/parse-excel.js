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
 * ── Expected column layout (v2, sheet "Master") ───────────────────
 *  0  No
 *  1  Project Name
 *  2  Total Units
 *  3  Typical Floor Area (sq. ft.)
 *  4  Developer's Selling Price (RM)
 *  5  Developer's Selling Price (RM psf)
 *  6  Transacted Price (RM)          ← used as price range
 *  7  Transacted Price (RM psf)      ← used as PSF range
 *  8  Launched year / Estimated Completion
 *  9  Absorption units 2023
 *  10 Absorption units 2024
 *  11 Absorption units 2025
 *  12 Absorption units 1H 2026
 *
 *  Sales rate is computed as cumulative absorption ÷ total units.
 *  Projects with no absorption data are included only if they have a
 *  RATE_OVERRIDE entry; otherwise they are skipped (e.g. pre-launch).
 *
 * ── Developer names ───────────────────────────────────────────────
 *  The Excel has no Developer column.  Add new projects to DEV_MAP.
 * ─────────────────────────────────────────────────────────────────
 */

import XLSX from 'xlsx';
import { writeFileSync, existsSync } from 'fs';
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

// ── Sales-rate overrides ──────────────────────────────────────────
// For projects whose take-up is known from research but which have no
// per-year absorption breakdown in the Excel. Values carried over from
// the original Master_File (which had an explicit Sales Rate column).
const RATE_OVERRIDE = {
  "Noordinz Suites": 99.83,
  "The Anton":       94.12,
};

// ── Launch-year fixes ─────────────────────────────────────────────
// For rows where the Excel omits the launch year (e.g. "Q2 2026" is
// completion only). Values carried over from the original Master_File.
const LAUNCH_FIX = {
  "Alton Skyvillas": 2023,
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
  const s = String(raw || '').trim();
  if (!s) return { launch: 0, comp: '' };
  const parts = s.split('/');
  if (parts.length >= 2) {
    // Launch part may carry a quarter prefix, e.g. "Q3 2023" — take the year.
    const ym = parts[0].match(/(\d{4})/);
    return { launch: ym ? parseInt(ym[1]) : 0, comp: parts.slice(1).join('/').trim() };
  }
  // No slash → the cell holds completion only; launch comes from LAUNCH_FIX.
  return { launch: 0, comp: s };
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

  // Normalise curly apostrophes so DEV_MAP / map-coordinate lookups match.
  const rawName = String(r[1]).trim().replace(/[’‘]/g, "'");

  const entry = {
    no:        r[0],
    name:      NAME_NORM[rawName] ?? rawName,
    units:     parseInt(r[2]) || 0,
    sf:        r[3],
    price:     r[6],   // Transacted Price (RM)
    psf:       r[7],   // Transacted Price (RM psf)
    lc:        r[8],
    abs2023:   cleanNum(r[9]),
    abs2024:   cleanNum(r[10]),
    abs2025:   cleanNum(r[11]),
    abs1h2026: cleanNum(r[12]),
  };

  if (section === 'highrise') highriseRows.push(entry);
}

// ── Build ACTIVE & ANN ────────────────────────────────────────────
let seq = 1;
const active = [];
const ann    = [];

for (const r of highriseRows) {
  const cumAbs = r.abs2023 + r.abs2024 + r.abs2025 + r.abs1h2026;

  // Skip rows with no absorption data and no known rate (e.g. pre-launch).
  if (!cumAbs && !(r.name in RATE_OVERRIDE)) continue;

  const [sfMin,  sfMax]  = parseRange(r.sf);
  const [pMin,   pMax]   = parseRange(r.price);
  const [psfMin, psfMax] = parseRange(r.psf);
  let { launch, comp }   = parseLaunchComp(r.lc);
  if (!launch) launch    = LAUNCH_FIX[r.name] ?? 0;
  const dev              = DEV_MAP[r.name] ?? 'Unknown';
  const rate             = RATE_OVERRIDE[r.name] ?? +((cumAbs / r.units) * 100).toFixed(2);

  active.push({
    no:    seq++,
    dev,
    name:  r.name,
    units: r.units,
    sfMin:  Math.round(sfMin),  sfMax:  Math.round(sfMax),
    psfMin: Math.round(psfMin), psfMax: Math.round(psfMax),
    pMin:   Math.round(pMin),   pMax:   Math.round(pMax),
    launch, comp,
    rate,
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
