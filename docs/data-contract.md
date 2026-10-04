# FloodBeacon Data Contract

This is the integration point between repos. Teammates export small, simplified
files from their own repo and open a PR adding them to `public/data/` here,
matching the shapes below. Until real files land, the frontend reads from
`public/mock/` (same shapes, fake data).

Every file/layer must carry provenance: `acquired_at`, `source`, `method`, and
whether a value is an **observation** or an **estimate**.

| File | Format | Owner | Notes |
|---|---|---|---|
| `incidents.geojson` | GeoJSON (Point) | Teammate 2 / app | properties: `id`, `type` (`hospital`\|`shelter`\|`bridge`\|`pump`\|`school`\|`road`\|`report`), `name`/`name_th`, `short_name`/`short_name_th`, `desc`/`desc_th` (one-liner), `long`/`long_th` (detail paragraph), `metrics`/`metrics_th` (`[{k,v}]`), `severity` (0-100), `severity_breakdown`, `population_affected`, `status`, `unverified`, `last_updated` |
| `routes.geojson` | GeoJSON (LineString) | Teammate 2 | properties: `status`, `name`/`name_th`, `desc`/`desc_th`, `eta` |
| `timeseries.json` | JSON | Teammate 1 | per district: `[{ acquired_at, flood_factor, flooded_area_km2, people_exposed, roads_impassable, shelters_at_risk }]` |
| `reports.json` | JSON | App (Twilio backend) | `id`, `received_at`, `district`, `status`, `title`/`title_th`, `summary`/`summary_th`, `time` — no full phone numbers |
| `flood-event.json` | JSON | Teammate 1 / app | provenance for the whole event: `acquired_at`, `source`, `method`, `district`/`district_th`, `event`/`event_th` |
| `buildings.geojson` (not yet used) | GeoJSON (Polygon) | Teammate 2 | footprints with `height` (OSM), `status`, `population_served` where known |

**Flood extent is currently synthetic.** There is no `flood_polygons.geojson`, `flood_raster.png`,
`depth_estimate.png`, or `road_segments.geojson` yet — teammate 1's satellite pipeline hasn't
delivered real polygons, so the frontend generates a procedural water/depth/risk shape
(`src/lib/geometry.ts`) from each `timeseries.json` point's `flood_factor`, and classifies
real OpenStreetMap buildings/roads against it live in the browser (`src/map/MapCanvas.tsx`,
via `querySourceFeatures` on the basemap's own vector tiles). When real exports land, replace
`src/lib/geometry.ts`'s generator with a loader for the real files; the rest of the app
(`classify()`'s building/road matching) only needs `obs`/`deep`/`est` FeatureCollections and
should keep working unchanged.

## Status vocabulary

`clear` · `at_risk` · `cut_off` · `inundated` (infrastructure/incidents)
`assessed` · `team_assigned` · `reached` · `resolved` (operational updates)

## Ground rules

- Simplify polygons before export (mapshaper/TopoJSON). Keep files small.
- No raw satellite scenes or large rasters committed anywhere — simplified exports only.
- Changes to this contract go through the frontend owner in chat first.
