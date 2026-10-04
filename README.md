# FloodBeacon

Flood response dashboard for first responders in Thailand — a 3D editorial map, incident
board, routing, bilingual (EN/TH) UI, and light/dark themes. Built for StormHacks 2026. See
`CLAUDE.md` and `project-context.md` for the full product context, and
`docs/data-contract.md` for the file formats teammates export.

## Run it

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`. The app reads static GeoJSON/JSON from `public/mock/`, but
**does need network** for the CARTO vector basemap, AWS terrain tiles, and Google Fonts — see
"Not built yet" below.

## What's here

This follows the "FloodBeacon Editorial" design (ported from a design export): raw
MapLibre GL (no deck.gl) with live classification of real OpenStreetMap buildings/roads
against a procedural flood polygon, full EN/TH bilingual copy, and light/dark themes.

- `src/map/MapCanvas.tsx` — the MapLibre lifecycle: terrain, water/depth/risk layers, live
  building/road classification via `querySourceFeatures`, incident markers.
- `src/lib/geometry.ts` — procedural flood/depth/risk polygon generator (no real
  `flood_polygons.geojson` yet; see the file's header comment for the real-data seam).
- `src/lib/palette.ts` — map color tokens (status colors, depth/risk ramps) per theme.
- `src/i18n/` — `strings.ts` (UI copy, EN+TH) and `ThemeLangContext.tsx` (theme/lang state).
- `src/components/TopNav.tsx`, `Sidebar.tsx` — nav bar and the numbered-section sidebar
  (Situation / Incidents / Routes / Reports).
- `src/components/LayerToggle.tsx`, `ViewControls.tsx`, `MapLegend.tsx`, `SatelliteBar.tsx`,
  `CommandPalette.tsx`, `PhoneScreen.tsx` — map chrome, command palette (⌘K/⌘E), phone layout.
- `src/pages/LayersScenariosPage.tsx`, `BriefingPage.tsx` — the two full secondary screens.
- `public/mock/*` — mock data matching `docs/data-contract.md`. Swap these for real
  teammate exports under `public/data/` without changing components.

## Verifying changes

`.claude/skills/verify-floodbeacon/` drives the real app (headless Chromium over CDP) and
captures screenshots/ARIA snapshots as proof, instead of trusting a type-check alone. See
`.claude/skills/verify-floodbeacon/SKILL.md`. Its `features/*.md` files currently describe
the **previous** deck.gl-based scaffold and need rewriting for this design — do that before
trusting them for a drive.

## Not built yet

- **Offline basemap.** The CARTO vector style, AWS terrain tiles, and Google Fonts all need
  network — CLAUDE.md's "must work with no network" rule isn't met yet.
- Routing view, the field reached/cleared feedback loop, briefing PDF/image download, and
  Gemini/ElevenLabs share outputs — see the build order in `CLAUDE.md`.
- `flood_polygons.geojson` from teammate 1's satellite pipeline — flood extent is currently
  procedural (synthetic), not real, per `src/lib/geometry.ts`'s header comment.
