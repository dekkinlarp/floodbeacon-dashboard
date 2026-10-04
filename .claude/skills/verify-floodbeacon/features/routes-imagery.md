# Routes satellite imagery

The Routes tab shows real satellite observations of Nepomukbrücke in Rech,
Germany, on 11 February and 18 July 2021. Changing the acquisition date updates
the pixels and manual bridge finding while preserving the camera. Clicking the
review square opens a dated finding. The detail panel separates manual review
from the Copernicus agency assessment and labels exact failure time unknown.

## Sub-features

- `routes-load` displays the post-event satellite image, complete bridge square,
  manual finding, observation date, and visible source/license attribution.
- `routes-dates` changes between the actual before/after observations without
  changing map position or zoom; the status changes from missing span to
  crossing visible.
- `routes-bridge-click` opens a map popup containing bridge name, date, and
  manual finding. Date changes dismiss the old popup to prevent stale findings.
- `routes-map-controls` allows drag panning, zooming, and Back to bridge reset.
- `routes-evidence` shows a separate Destroyed agency grade and source link,
  before/after thumbnails, and a detailed comparison link.
- `routes-responsive` retains date controls, attribution, scrollable findings,
  and a visible map at a phone viewport.
- `routes-error` shows a useful loading failure and retry button if the API is
  unavailable. It does not substitute mock bridge results.

## How to get to it (user POV)

1. Open FloodBeacon and select **Routes** in the top navigation.
2. Use either date button in the bottom panel or a dated thumbnail in the
   evidence panel. Pan and zoom to inspect the same bridge location.
3. Click inside the square on the map to read that date's finding. Use
   **Back to bridge** to restore the initial map view.
4. Scroll the evidence panel for the agency source and coverage limitations.

## Driving it with drive.mjs

Preconditions:

- Run the sibling `floodbeacon-satellite` API on port 8000 with `.env` containing
  the shared hosted dev `DATABASE_URL`. The processing owner must have published
  `ahr-2021`; `GET /cases/ahr-2021/imagery` must return its observations.
- Set `VITE_FLOODBEACON_API_URL` in `.env.local` if the API uses another origin,
  then restart Vite. The default is `http://localhost:8000`.
- Start the verification browser as described in `../SKILL.md`; require a
  successful `doctor` check. Browser graphics acceleration must support WebGL.

From the repository root:

```bash
node .claude/skills/verify-floodbeacon/scripts/drive.mjs goto /
node .claude/skills/verify-floodbeacon/scripts/drive.mjs click --role button --name Routes
node .claude/skills/verify-floodbeacon/scripts/drive.mjs wait --role button --name "Back to bridge"
node .claude/skills/verify-floodbeacon/scripts/drive.mjs screenshot --path artifacts/verify-floodbeacon/routes-imagery_after.png
node .claude/skills/verify-floodbeacon/scripts/drive.mjs snapshot --path artifacts/verify-floodbeacon/routes-imagery_after.aria.yaml
node .claude/skills/verify-floodbeacon/scripts/drive.mjs click --role button --name "Show 2021-02-11"
node .claude/skills/verify-floodbeacon/scripts/drive.mjs screenshot --path artifacts/verify-floodbeacon/routes-imagery_before.png
node .claude/skills/verify-floodbeacon/scripts/drive.mjs snapshot --path artifacts/verify-floodbeacon/routes-imagery_before.aria.yaml
node .claude/skills/verify-floodbeacon/scripts/drive.mjs click --role button --name "Show 2021-07-18"
node .claude/skills/verify-floodbeacon/scripts/drive.mjs click --role button --name "Back to bridge"
node .claude/skills/verify-floodbeacon/scripts/drive.mjs console
```

Check screenshots show different real pixels at the same location and a full
square around the bridge. Check snapshots show the expected observed date,
manual assessment, Unknown failure time, and separate agency evidence. Inspect
the console for failed API/PNG requests or map errors.

Map-square clicks and drag panning require a manual browser or computer-use
pass because this helper exposes only role-based clicks. Capture the opened
popup, then change date and confirm the previous popup disappears. Repeat the
view at a phone viewport and capture proof of readable controls and evidence.

## Gotchas

- Acquisition date describes the image, not when the bridge failed. Neither a
  complete-looking deck nor the agency grade certifies route passability.
- The square is a manual 90 m review annotation, not a surveyed damage boundary.
- Source imagery is bounded. Empty background beyond the image means no
  observation. This view does not use CARTO basemap or AWS terrain tiles.
- Dates and findings come from the API; other tabs' Thai mock statistics and
  depth/3D controls must not appear in Routes.
- The popup is rendered on a canvas map and cannot be verified from an ARIA
  snapshot alone. Save screenshots after the actual click.
- If the bundled verification Chromium is unavailable, report that limitation
  and use an available browser for the same user path. A build alone does not
  establish that WebGL rendered the satellite pixels.
