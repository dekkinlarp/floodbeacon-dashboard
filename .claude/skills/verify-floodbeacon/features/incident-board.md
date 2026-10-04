# Incident board

The incident board is the dispatch-style side panel listing every incident sorted by
severity (highest first), each showing type, status, severity score, and people affected.
Selecting one opens its detail panel and flies the 3D map camera to it.

## Sub-features

- `board-list` renders all incidents from `public/mock/incidents.geojson`, sorted descending
  by `severity`.
- `board-select` opens the detail panel for the clicked incident and highlights it in the
  list.
- `board-status` shows status via both color and a non-color symbol/shape (●▲■✕), never
  color alone.

## How to get to it (user POV)

- The board is always visible in the left sidebar on load — no navigation needed.
- Click any incident row to select it.

## Driving it with drive.mjs

Preconditions:

- FloodBeacon is healthy (`doctor` reports `httpOk`/`browserOk` true).
- On a fresh `goto /`, no incident is selected.

- **List renders.** Load the app. Run `node ../scripts/drive.mjs goto /`. Then
  `node ../scripts/drive.mjs screenshot --path artifacts/verify-floodbeacon/board_initial.png`.
  The sidebar shows "Incident board" and "8 active · sorted by severity", with "Bang Phlat
  Community Hospital" (severity 92) first and "Bang Phlat District Office" (severity 20)
  last.
- **Select top incident.** Click the highest-severity row. Run
  `node ../scripts/drive.mjs click --role button --name "Bang Phlat Community Hospital"`.
- **Proof of selection.** Capture the result. Run
  `node ../scripts/drive.mjs screenshot --path artifacts/verify-floodbeacon/board_select-top.png`
  and
  `node ../scripts/drive.mjs snapshot --path artifacts/verify-floodbeacon/board_select-top.aria.yaml`.
  The screenshot shows an incident detail panel titled "Bang Phlat Community Hospital" with
  severity 92/100, status "Cut off", and a severity breakdown (Population 40, Access 35,
  Facility Criticality 17). The row stays visibly highlighted in the board.
- **Check console.** Run `node ../scripts/drive.mjs console`. No `[pageerror]` or
  `[requestfailed]` lines should follow the click.
- **Close detail.** Run
  `node ../scripts/drive.mjs click --role button --name "Close"`. The detail panel
  disappears; a follow-up screenshot shows the board alone.

## Gotchas

- Row buttons contain several text nodes (icon, name, type, severity number, status badge,
  population count); Playwright's default name matching is substring + case-insensitive, so
  `--name "Bang Phlat Community Hospital"` matches even though the button's full accessible
  name is longer. Don't use `exact` matching here.
- Selecting the same incident twice still re-triggers the map fly-to (see
  [flood-map.md](./flood-map.md)) — the app tracks a fly-to token separately from the
  selected ID, so this is expected, not a bug to report.
- The close button's accessible name is "Close" (from `aria-label="Close"` on the ✕ button),
  not "✕" or "X".
