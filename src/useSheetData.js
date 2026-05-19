import { useState, useEffect } from "react";
import { SHEETS } from "./config";

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

const n  = v => parseFloat(v) || 0;
const ni = v => parseInt(v)   || 0;

function parseProjects(rows) {
  return rows.map(r => ({
    no: ni(r.no), dev: r.dev, name: r.name,
    units: ni(r.units), sfMin: ni(r.sfMin), sfMax: ni(r.sfMax),
    psfMin: ni(r.psfMin), psfMax: ni(r.psfMax),
    pMin: ni(r.pMin), pMax: ni(r.pMax),
    launch: ni(r.launch), comp: r.comp, rate: n(r.rate),
  }));
}

function parseAnnual(rows) {
  return rows.map(r => ({
    sh: r.sh, name: r.name, dev: r.dev,
    y4: ni(r.y4), y5: ni(r.y5), y6: ni(r.y6),
  }));
}

function parseCompleted(rows) {
  return rows.map(r => ({
    name: r.name, dev: r.dev, units: ni(r.units),
    psfMin: ni(r.psfMin), psfMax: ni(r.psfMax), rate: n(r.rate),
  }));
}

const CONFIGURED = url => url && !url.startsWith("PASTE_");

function fetchWithTimeout(url, ms = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal })
    .then(r => r.text())
    .finally(() => clearTimeout(timer));
}

export function useSheetData(fallback) {
  // Always start with local data — dashboard is visible immediately.
  const [data, setData]           = useState(fallback);
  const [syncing, setSyncing]     = useState(CONFIGURED(SHEETS.projects));
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    if (!CONFIGURED(SHEETS.projects)) return;

    async function load() {
      try {
        const [pTxt, aTxt, cTxt] = await Promise.all([
          CONFIGURED(SHEETS.projects)  ? fetchWithTimeout(SHEETS.projects)  : Promise.resolve(""),
          CONFIGURED(SHEETS.annual)    ? fetchWithTimeout(SHEETS.annual)    : Promise.resolve(""),
          CONFIGURED(SHEETS.completed) ? fetchWithTimeout(SHEETS.completed) : Promise.resolve(""),
        ]);
        setData({
          active:    pTxt ? parseProjects(parseCSV(pTxt))  : fallback.active,
          annual:    aTxt ? parseAnnual(parseCSV(aTxt))    : fallback.annual,
          completed: cTxt ? parseCompleted(parseCSV(cTxt)) : fallback.completed,
        });
        setSyncError(null);
      } catch (e) {
        // Fetch failed or timed out — keep showing local data, surface a soft warning.
        setSyncError("Could not reach Google Sheets — showing last saved data.");
      } finally {
        setSyncing(false);
      }
    }

    load();
  }, []);

  return { data, loading: false, syncing, syncError };
}
