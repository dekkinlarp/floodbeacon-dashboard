# 3D flood map

The main view: a pitched MapLibre GL + deck.gl scene over OpenFreeMap vector tiles, showing
flood-extent polygons, road segments colored by status, truck/boat routes, and clickable
incident markers. Clicking an incident (on the map or in the board) flies the camera to it.

## Sub-features

- `map-renders` the basemap and deck.gl overlay layers actually paint (not a black canvas).
- `map-fly-to` selecting an incident animates the camera to center on it.
- `map-marker-click` clicking an incident marker on the map selects it, same as clicking its
  board row.

## How to get to it (user POV)

- The map fills the main panel on load — no navigation needed.
- Click a marker directly on the map, or select an incident from the board (see
  [incident-board.md](./incident-board.md)).

## Driving it with drive.mjs

Preconditions:

- FloodBeacon is healthy (`doctor` reports `httpOk`/`browserOk` true).
- The browser window is at least 1280×800 (`start`'s default viewport) so the map has room
  to render recognizably.

- **Map renders.** Load the app and let tiles settle. Run `node ../scripts/drive.mjs goto /`,
  wait a couple seconds, then
  `node ../scripts/drive.mjs screenshot --path artifacts/verify-floodbeacon/map_initial.png`.
  The screenshot must show real street geometry and labels (e.g. road lines, place names) —
  **a solid black or solid-gray canvas is a failure**, not a loading state (this exact
  symptom was previously caused by a Vite/MapLibre worker bundling conflict, and separately
  by a deprecated CARTO tile endpoint silently returning "API KEY REQUIRED" placeholder
  tiles instead of erroring).
- **Check console for the known failure signatures.** Run `node ../scripts/drive.mjs
  console`. Fail the check if you see `Worker failed to load` or any `[requestfailed]` line
  for a basemap/tile URL.
- **Fly-to on select.** From the board, click the top incident. Run
  `node ../scripts/drive.mjs click --role button --name "Bang Phlat Community Hospital"`,
  wait ~1.5s for the flight animation, then
  `node ../scripts/drive.mjs screenshot --path artifacts/verify-floodbeacon/map_fly-to.png`.
  Compare against `map_initial.png`: the view should be visibly zoomed/recentered, not
  identical.
- **Marker click selects.** This cannot be done by role (the map canvas has no accessible
  markers), so verify indirectly: after a marker click in manual/exploratory testing, the
  board's selected-row highlight and the detail panel are the same proof used in
  [incident-board.md](./incident-board.md) — treat marker-click and board-click as the same
  verified code path (`onSelectIncident`) and don't re-prove both every run.

## Gotchas

- The map needs network access to OpenFreeMap (`tiles.openfreemap.org`) — a sandboxed or
  fully offline verification environment will show a legitimately broken/incomplete map
  through no fault of the app. Check `console` for `requestfailed` entries pointing at
  `openfreemap.org` before concluding the app itself is broken.
- `waitUntil: 'networkidle'` in `drive.mjs`'s `goto`/`start` does not guarantee deck.gl's
  WebGL layers have finished their first paint (GPU work isn't a network event) — add a
  short wait (1-2s) before screenshotting for layer content, not just the basemap.
- Reflections/shader warnings like `luma.gl: WebGL uniform block reflection failed` in the
  console are benign noise from this stack on this GPU and are not failures to report.
