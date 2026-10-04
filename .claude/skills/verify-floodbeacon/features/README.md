# FloodBeacon verification map

This directory is the maintained source for verifying the user-facing behavior of
FloodBeacon. Read this index before driving the app, then use the matching feature file as
the recipe.

## Baseline preconditions

- Launch FloodBeacon at `http://localhost:<PORT>` (default `5190`) with
  `node ../scripts/drive.mjs start --port <PORT> --cdp-port <CDP_PORT>`.
- No seed data to set up — the app reads static files from `public/mock/`, which are
  committed and identical on every run.
- Run `node ../scripts/drive.mjs doctor` and require `httpOk: true`, `browserOk: true`,
  and `title: "FloodBeacon"`.
- Never drive an instance this run did not start (check `doctor`'s `pids` against what
  `start` printed).

## Driving conventions

- Start every recipe from the freshly-loaded app (`goto /`) unless its preconditions say
  otherwise.
- Prefer ARIA roles and accessible names over CSS selectors or DOM position.
- The map canvas (MapLibre/deck.gl) is not part of the accessible tree — markers, flood
  polygons, and routes can only be verified by screenshot, not by role/name.
- Check `node ../scripts/drive.mjs console` after every drive, not just the screenshot.
  Several real bugs in this app (black map from a Vite/MapLibre worker conflict, a
  deprecated tile provider silently serving "API key required" placeholder tiles) were
  visually subtle but showed up immediately in console/network errors.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes a screenshot; include an ARIA snapshot too when the feature's proof is
  textual/structural (board contents, panel fields) rather than purely visual (map
  rendering).
- Record the feature ID and entry point used with every artifact filename, e.g.
  `artifacts/verify-floodbeacon/incident-board_select-top.png`.
- Report an unreachable path with the attempted command and the unmet precondition (e.g.
  "role button name X not found — board may be empty, check `public/mock/incidents.geojson`
  loaded via console log").

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible
behavior. It then uses exactly four H2 sections in this order: `Sub-features`, `How to get
to it (user POV)`, `Driving it with drive.mjs`, `Gotchas`.

## Features

- [Incident board](./incident-board.md) — severity-sorted list, selecting an incident, status
  and severity display.
- [3D flood map](./flood-map.md) — map renders, flood extent/road/route layers, camera
  fly-to on incident selection.
- [Time slider](./time-slider.md) — Sentinel-1 pass timeline, scrubbing between observations.
- [Legend and provenance](./legend-and-provenance.md) — status legend, observation-vs-estimate
  badge.

Not yet mapped (not yet built in the app, see `README.md`'s "Not built yet"): routing view,
field reached/cleared feedback, briefing download, share outputs.
