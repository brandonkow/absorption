// ─────────────────────────────────────────────────────────────
//  GOOGLE SHEETS DATA SOURCE
//
//  Step 1 — In your Google Sheet, set up 3 tabs with these names:
//    • Projects   (columns: no, dev, name, units, sfMin, sfMax,
//                  psfMin, psfMax, pMin, pMax, launch, comp, rate)
//    • Annual     (columns: sh, name, dev, y4, y5, y6)
//    • Completed  (columns: name, dev, units, psfMin, psfMax, rate)
//
//  Step 2 — Publish each tab:
//    File → Share → Publish to web → choose the tab → CSV → Publish
//    Copy the URL and paste it below.
//
//  Step 3 — Commit & push. The dashboard will fetch live data on
//  every page load. Just edit the sheet and refresh to see changes.
// ─────────────────────────────────────────────────────────────

export const SHEETS = {
  projects:  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-gtoI_ZbXogP4-FLtaDbrQ_skjXZVbYBeuiugwFAt3i9NMit8-jrUdtVtNtEhiWCECkfkne6UqjJN/pub?gid=701938332&single=true&output=csv",
  annual:    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-gtoI_ZbXogP4-FLtaDbrQ_skjXZVbYBeuiugwFAt3i9NMit8-jrUdtVtNtEhiWCECkfkne6UqjJN/pub?gid=178014944&single=true&output=csv",
  completed: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-gtoI_ZbXogP4-FLtaDbrQ_skjXZVbYBeuiugwFAt3i9NMit8-jrUdtVtNtEhiWCECkfkne6UqjJN/pub?gid=842732858&single=true&output=csv",
};
