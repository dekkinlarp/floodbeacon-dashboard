# Merritt access replay frontend

The Response tab reads the committed [`public/data/access-replay.json`](../public/data/access-replay.json) export. It validates the fields it renders, then shows observed gauge values, a schematic planning network, scenario thresholds, community access states, and a date-by-date replay. The network is illustrative and does not represent surveyed roads or confirmed historical closures.

## Open the replay

Install the locked frontend dependencies and run the Vite preview:

```sh
npm ci
npm run dev
```

Open [http://localhost:5173/?view=response](http://localhost:5173/?view=response) to start directly on Response. The regular app defaults to Incidents. The replay works from the committed static export without the analysis backend or a map basemap request.

## Export shape

The frontend expects schema version `1`, mode `historical_replay`, station metadata, a graph of nodes and edges, source provenance, assumptions, and dated frames. Each frame contains the observed gauge sample, up to two later daily observations in `outlook`, edge scenario states, and community reachability/action summaries. Coordinates use `[longitude, latitude]` for the schematic SVG layout. Trigger metrics are `stage_m` or `discharge_m3_s`; null triggers indicate a baseline corridor assumed available in the scenario.

Quality fields are preserved from the source. An `Estimated` discharge quality flag is shown beside that value. Missing or short outlooks remain incomplete; the interface does not fill gaps. The outlook contains later historical observations for hindsight and must not be presented as an operational forecast.

The analysis and export provenance are maintained in the [FloodBeacon satellite repository replay documentation](https://github.com/dekkinlarp/floodbeacon-satellite/blob/tarit/access-replay-data/docs/access-replay.md).
