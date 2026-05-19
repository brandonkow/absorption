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
  projects:  "PASTE_PROJECTS_CSV_URL_HERE",
  annual:    "PASTE_ANNUAL_CSV_URL_HERE",
  completed: "PASTE_COMPLETED_CSV_URL_HERE",
};
