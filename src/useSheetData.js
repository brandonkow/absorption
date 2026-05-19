import { useState, useEffect } from "react";
import { SHEETS } from "./config";

// Parses a CSV string into an array of objects using the first row as headers.
function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = vals[i]?.trim() ?? ""; });
    return obj;
  });
}

// Handles quoted fields (fields containing commas).
function splitCSVLine(line) {
  const result = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === "," && !inQ) { result.push(cur); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

const n = v => parseFloat(v) || 0;
const ni = v => parseInt(v) || 0;

function parseProjects(rows) {
  return rows.map(r => ({
    no:     ni(r.no),
    dev:    r.dev,
    name:   r.name,
    units:  ni(r.units),
    sfMin:  ni(r.sfMin),
    sfMax:  ni(r.sfMax),
    psfMin: ni(r.psfMin),
    psfMax: ni(r.psfMax),
    pMin:   ni(r.pMin),
    pMax:   ni(r.pMax),
    launch: ni(r.launch),
    comp:   r.comp,
    rate:   n(r.rate),
  }));
}

function parseAnnual(rows) {
  return rows.map(r => ({
    sh:   r.sh,
    name: r.name,
    dev:  r.dev,
    y4:   ni(r.y4),
    y5:   ni(r.y5),
    y6:   ni(r.y6),
  }));
}

function parseCompleted(rows) {
  return rows.map(r => ({
    name:   r.name,
    dev:    r.dev,
    units:  ni(r.units),
    psfMin: ni(r.psfMin),
    psfMax: ni(r.psfMax),
    rate:   n(r.rate),
  }));
}

const CONFIGURED = url => url && !url.startsWith("PASTE_");

export function useSheetData(fallback) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(CONFIGURED(SHEETS.projects));
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!CONFIGURED(SHEETS.projects)) return; // no URLs set yet — use fallback

    async function load() {
      try {
        const fetches = [
          CONFIGURED(SHEETS.projects)  ? fetch(SHEETS.projects).then(r=>r.text())  : Promise.resolve(""),
          CONFIGURED(SHEETS.annual)    ? fetch(SHEETS.annual).then(r=>r.text())    : Promise.resolve(""),
          CONFIGURED(SHEETS.completed) ? fetch(SHEETS.completed).then(r=>r.text()) : Promise.resolve(""),
        ];
        const [pTxt, aTxt, cTxt] = await Promise.all(fetches);
        setData({
          active:    pTxt ? parseProjects(parseCSV(pTxt))   : fallback.active,
          annual:    aTxt ? parseAnnual(parseCSV(aTxt))     : fallback.annual,
          completed: cTxt ? parseCompleted(parseCSV(cTxt))  : fallback.completed,
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // If no URLs configured, return the hardcoded fallback immediately.
  if (!CONFIGURED(SHEETS.projects)) return { data: fallback, loading: false, error: null };

  return { data, loading, error };
}
