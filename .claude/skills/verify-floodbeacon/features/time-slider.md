# Time slider

A bar-chart timeline of Sentinel-1 passes (`public/mock/timeseries.json`) in the bottom-right
of the map view, showing flooded area (km²) per observation. Clicking a bar or dragging the
range input scrubs to that pass and updates the displayed date and area.

## Sub-features

- `slider-renders` shows one bar per timeseries point, scaled to the max flooded area.
- `slider-scrub` changing the range input updates the highlighted bar and the displayed
  date/area.
- `slider-bar-click` clicking a bar directly jumps to that index.

## How to get to it (user POV)

- Always visible in the bottom-right of the map view once `timeseries.json` loads — no
  navigation needed.
- Drag the range slider, or click one of the bars.

## Driving it with drive.mjs

Preconditions:

- FloodBeacon is healthy (`doctor` reports `httpOk`/`browserOk` true).
- Fresh `goto /` — the slider starts at index 0 (`2026-09-20`, `0.4 km²`).

- **Initial state.** Load the app. Run `node ../scripts/drive.mjs goto /` then
  `node ../scripts/drive.mjs screenshot --path artifacts/verify-floodbeacon/slider_initial.png`.
  The panel shows "Sep 20" in the header and "0.4 km² flooded (estimated extent)" at the
  bottom.
- **Scrub via range input.** Run
  `node ../scripts/drive.mjs fill --role slider --name "" --value "4"` — if the bare role
  selector doesn't resolve (the `<input type="range">` may have no accessible name), use
  `press --key ArrowRight` six times from a focused slider instead, or drive this one
  manually and note it as a mapped-but-not-automated sub-feature. Either way, the visible
  proof is the same: the date updates to "Sep 28, 04:14 PM" and the area to "4.3 km²", and
  that bar's fill turns the active cyan color.
- **Proof.** Run
  `node ../scripts/drive.mjs screenshot --path artifacts/verify-floodbeacon/slider_scrubbed.png`.
  Compare the header date and area text against `slider_initial.png`'s — they must differ.

## Gotchas

- The timeline bars are plain `<button>` elements with only a `title` attribute (tooltip),
  not an accessible name — `getByRole('button', { name: ... })` won't reliably target a
  specific bar. Prefer the range `<input>` or arrow-key stepping for scripted drives; reserve
  bar-click verification for manual/exploratory passes.
- `timeseries.json` is mock data fixed at 7 points (`2026-09-20` through `2026-10-02`); the
  app does not yet support real teammate-exported timeseries, so don't read anything into the
  specific dates/values beyond "the slider updates when scrubbed."
