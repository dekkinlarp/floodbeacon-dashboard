# Legend and provenance

Two always-visible overlays on the map view: a status legend (top-right) explaining the
color+symbol scheme for incident/road status, and a provenance badge (top-left) stating the
flood-polygon data's source, acquisition time, and whether it's an observation or an
estimate. These exist specifically to satisfy CLAUDE.md's "always show data source,
observation time, and observation-vs-estimate" rule — their presence and correctness is part
of the product requirement, not just UI polish.

## Sub-features

- `legend-symbols` shows all four statuses (Clear, At risk, Cut off, Inundated) each with a
  distinct symbol, not just a color swatch.
- `provenance-badge` shows the flood-polygon source, acquisition timestamp, and an
  OBSERVATION/ESTIMATE label.

## How to get to it (user POV)

- Both are always visible on the map view once `flood_polygons.geojson` loads — no
  navigation or interaction needed.

## Driving it with drive.mjs

Preconditions:

- FloodBeacon is healthy (`doctor` reports `httpOk`/`browserOk` true).

- **Legend present.** Load the app. Run `node ../scripts/drive.mjs goto /` then
  `node ../scripts/drive.mjs snapshot --path artifacts/verify-floodbeacon/legend.aria.yaml`.
  The YAML must contain "Status legend" and all four of "Clear", "At risk", "Cut off",
  "Inundated".
- **Provenance badge present.** Same snapshot (or a fresh one) must contain "OBSERVATION" (or
  "ESTIMATE"), "Sentinel-1", and a formatted date/time matching
  `flood_polygons.geojson`'s top-level `properties.acquired_at`
  (`2026-09-28T23:14:00Z` → rendered as "Sep 28, ...").
- **Visual proof.** Run
  `node ../scripts/drive.mjs screenshot --path artifacts/verify-floodbeacon/legend-and-provenance.png`.
  Confirm by eye: legend symbols are visually distinct shapes (●▲■✕), not just four identical
  dots in different colors — this is the color-blind-safety requirement from CLAUDE.md, and
  an ARIA snapshot alone won't catch a regression to color-only dots.

## Gotchas

- The provenance badge reads `flood_polygons.geojson`'s *top-level* `properties` object
  (file-level metadata), not any individual feature's `properties` — don't confuse the two
  when checking the source file.
- If `public/mock/flood_polygons.geojson` is ever replaced with a real teammate export that
  omits top-level `properties`, the badge silently disappears (the component guards on
  `provenance?.source && provenance?.acquired_at`) rather than erroring — check for its
  absence explicitly, don't assume no error means it's present.
