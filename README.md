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

### Satellite bridge view (Routes)

The **Routes** tab reads Germany's Ahr Valley imagery and Rech bridge observations
from the FloodBeacon API. It opens on the flood study area, with dated regional
satellite tiles and a high-resolution Rech detail patch from 11 February and
18 July 2021. Bridge findings are manual reviews; Copernicus agency assessments
are shown separately. Changing
date keeps the map camera in place. The square marks a review area; failure time
and nearby route safety are unknown.

Start the backend in the sibling `floodbeacon-satellite` repo:

```bash
uv sync --locked
# Set DATABASE_URL in .env to the shared hosted dev database.
uv run --locked --env-file .env uvicorn floodbeacon.api:app --reload --port 8000
```

The processing owner publishes the imagery catalog once to the shared database.
Frontend developers need no PostgreSQL server, raw imagery, or processing tools.
Git-tracked regional XYZ tiles and detail PNGs are served by FastAPI. Date
changes keep the map camera in place. The regional scenes have coverage gaps;
empty areas mean no observation. The agency flood extent is a retrospective
18 July assessment and only appears on the post-flood date. This view needs no
external basemap or tile service.

In this frontend repo:

```bash
cp .env.example .env.local
# Optional: change VITE_FLOODBEACON_API_URL for a remotely hosted API.
npm run dev
```

Open **Routes**, pan/zoom across the Ahr study area, and click the bridge marker
or **Zoom to bridge** for the detailed review square. Use **View whole area**
to return to the regional overview, and change dates to compare the same place.
The default API origin is `http://localhost:8000`; restart Vite after changing it.
The API also publishes Libya and Nepal cases, while the current Routes demo
selects `ahr-2021`. Other tabs still use the existing Thailand mock data.

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
- Route planning, the field reached/cleared feedback loop, briefing PDF/image download, and
  Gemini/ElevenLabs share outputs — see the build order in `CLAUDE.md`.
- `flood_polygons.geojson` from teammate 1's satellite pipeline — flood extent is currently
  procedural (synthetic), not real, per `src/lib/geometry.ts`'s header comment.
