---
name: verify-floodbeacon
description: "Drive the FloodBeacon dashboard (Vite + React + MapLibre/deck.gl web app) the way a user does and capture proof: start it, click into the 3D flood map and incident board, capture screenshots and ARIA snapshots. Use for /verify-floodbeacon, when asked to prove a FloodBeacon UI change works, or before reporting a frontend task done."
---

# Verify FloodBeacon

FloodBeacon is a single-page React app (Vite dev server, MapLibre GL + deck.gl for
the 3D flood map). There is no backend, auth, or persistent data — everything reads
static mock GeoJSON/JSON from `public/mock/`, so verification runs are cheap and
side-effect-free; restarting always comes back to the same state.

## Launch

```bash
node .claude/skills/verify-floodbeacon/scripts/drive.mjs start --port <PORT> --cdp-port <CDP_PORT>
```

This does three things: starts `npm run dev -- --port <PORT>` detached, spawns Playwright's
bundled headless Chromium directly (not via `playwright.launch()`) with
`--remote-debugging-port=<CDP_PORT>`, and opens the app in it. Both processes are detached
from this CLI invocation so later, separate `node drive.mjs ...` calls can reconnect to the
*same* page via raw CDP (`chromium.connectOverCDP`) — this matters because Playwright's own
`connect()`/`launchServer()` protocol isolates contexts per connection and would show an
empty browser to every call after `start`.

Defaults: `--port 5190 --cdp-port 9222`. Pick different ports to run two verification
instances side by side (the app has no shared state, so this is always safe). "Ready" is
`doctor` reporting `httpOk: true, browserOk: true`.

Teardown: `node .claude/skills/verify-floodbeacon/scripts/drive.mjs stop` (see Cleanup).

## Doctor

```bash
node .claude/skills/verify-floodbeacon/scripts/drive.mjs doctor
```

Prints `{ url, httpOk, browserOk, title, pids }` and exits non-zero if either check fails.
Run this first whenever a drive command errors or behaves oddly — it tells you whether the
dev server died, the browser died, or you're looking at a stale `.state.json` from a prior
run (delete `scripts/.state.json` and `start` again if so).

## Drive

All commands below operate on the page opened by `start`, reconnecting fresh over CDP each
time (so there is no long-lived Node process to keep alive between commands):

```bash
node .claude/skills/verify-floodbeacon/scripts/drive.mjs goto <path>              # e.g. "/"
node .claude/skills/verify-floodbeacon/scripts/drive.mjs click --role <role> --name <name>
node .claude/skills/verify-floodbeacon/scripts/drive.mjs fill --role <role> --name <name> --value <value>
node .claude/skills/verify-floodbeacon/scripts/drive.mjs press --key <key>
node .claude/skills/verify-floodbeacon/scripts/drive.mjs wait --role <role> --name <name>
```

Prefer accessible roles/names over CSS selectors — `--role button --name "Bang Phlat
Community Hospital"` over any class or nth-child. Name matching is substring and
case-insensitive (Playwright default), so partial incident names work.

The map itself (MapLibre canvas, deck.gl layers) is not accessible-tree content — you can't
`click --role` an incident marker *on the map*. Verify map-rendered state (flood polygons,
routes, markers) by screenshot instead; verify board/panel/legend/slider state by role.

See `features/README.md` for the maintained map of what to drive and how, feature by feature.

## Evidence

```bash
node .claude/skills/verify-floodbeacon/scripts/drive.mjs screenshot --path artifacts/verify-floodbeacon/<name>.png
node .claude/skills/verify-floodbeacon/scripts/drive.mjs snapshot --path artifacts/verify-floodbeacon/<name>.aria.yaml
node .claude/skills/verify-floodbeacon/scripts/drive.mjs console
```

- `screenshot` captures the full viewport as rendered (map canvas included — ARIA snapshots
  can't prove canvas content, screenshots can).
- `snapshot` dumps the page's ARIA tree as YAML (`page.locator('body').ariaSnapshot()`), the
  right proof for board/panel/legend structure and text.
- `console` prints everything captured since `start`: console messages, page errors, and
  failed requests. **Always check this after a drive**, not just the screenshot — a feature
  can look visually fine while throwing in the background (this is exactly how the
  MapLibre-worker-under-Vite bug and the deprecated CARTO-tile-needs-an-API-key bug were
  caught in this repo).
- Proof standard: capture the action *and* the resulting state (e.g. click an incident, then
  screenshot the detail panel it opened — not just a screenshot of the idle board). Drive the
  real user path (click the board, not a React state setter).
- Save artifacts under `artifacts/verify-floodbeacon/` (gitignored — scratch evidence, not
  committed output).

## Cleanup

```bash
node .claude/skills/verify-floodbeacon/scripts/drive.mjs stop
```

Kills the dev server's process group and the Chromium process group it tracked in
`scripts/.state.json`, then deletes that state file. It does **not** touch
`artifacts/verify-floodbeacon/` — evidence from the run you just finished stays on disk.
Never kill dev-server or Chromium processes by name/port guess; always go through `stop` so
you only kill what this run started. If `stop` is interrupted, `doctor` will report the
dangling instance and you can `stop` again (it tolerates already-dead PIDs).

## Helpers

`scripts/drive.mjs` is the only helper. Every subcommand is documented above; run
`node .claude/skills/verify-floodbeacon/scripts/drive.mjs` with no args (or an unknown
command) to get the same command list from the script itself.
