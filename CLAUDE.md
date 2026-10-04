# CLAUDE.md

Project: **FloodBeacon**. GitHub org: `dekkinlarp`. Work is split across **separate repos**, one per area. Only `dekkinlarp/FloodBeacon` exists so far (public, README only, as of the last check).

Context for AI coding assistants working on this repo. The team's source of truth is the "dekkinlarp-satellite" Google Doc. Sections marked **(proposed)** are suggestions the team has not agreed on. Update this file when decisions change.

## Project summary

A flood **response** tool for first responders and community rescue organizations in Thailand, built for StormHacks 2026 (Oct 3 to 4, 2026, SFU Burnaby). Submission deadline: **Oct 4, 2026, 12:00pm PDT**. Demo video max 3 minutes. Each prize track must be opted into separately on Devpost.

Context: Bangkok and the central plain flooded in late September 2026. Focus on what happens **after** a flood (damage, access, severity, dispatch). We are **not** building a weather forecast service.

## My role (the person using this file)

I own **visualization and frontend**: the 3D flood map, incident board, scenario controls, result cards, briefing download, share outputs and the demo experience. I do not own the satellite pipeline, the infrastructure analysis, or validation, so I consume their outputs through the data contract below.

When helping me, prioritize: a working, good-looking demo path first, clear data contracts with teammates, mock data so I am never blocked, and performance in the browser.

## Repositories (separate repos per area)

Each teammate works in their own repo under the `dekkinlarp` org. I do not yet know which area `FloodBeacon` is (it is empty, so it could be the frontend, or a hub repo). Confirm with the team. Proposed names below are suggestions, not what exists.

| Repo (proposed) | Owner | Contents |
|---|---|---|
| `FloodBeacon` (or a name like `FloodBeacon-web`) | Me | Frontend app (Vite + React + TS), mock data, the data contract |
| `FloodBeacon-pipeline` | Teammate 1 | Sentinel-1 flood mask scripts (Python), raster and polygon exports |
| `FloodBeacon-analysis` | Teammate 2 | Infrastructure exposure, routing inputs, severity scoring (Python) |
| `FloodBeacon-validation` | Teammate 4 | Reference comparison, limitations, demo script |

Because the repos are separate, the **data contract is the integration point**. Proposed handoff:

- The data contract (field names, types, example files) lives in my frontend repo under `docs/data-contract.md` with example files in `public/mock/`. Teammates read it from there, and any change goes through me in chat first.
- Teammates run their code in their own repo and push **small, simplified export files** (GeoJSON, PNG plus JSON metadata) to my repo's `public/data/` through a pull request. They do not push raw satellite scenes or large rasters to any repo.
- I merge exports as they arrive and the frontend reads them. Everything the demo needs stays committed in `public/data/` so it works offline.
- Avoid git submodules and cross-repo dependencies. They cause merge pain under time pressure. Copying export files is simpler and more reliable.
- Each export includes `acquired_at`, `source` and `method` so the UI can show provenance.
- Until real files arrive I build against `public/mock/`.

Conventions (proposed):
- Short-lived branches (for example `frontend/incident-board`) merged into `main` often. No long-lived branches.
- Never commit secrets. Use `.env` locally and commit `.env.example`. Add a `.gitignore` for data and build output.
- Each repo has a README stating what it does in two lines and how to run it. The frontend README also explains how to run with mock data, so judges can start quickly.
- Add a short link list of all the repos to the Devpost submission, since judges will see more than one repo.

## Team split

| Owner | Area | Deliverables |
|---|---|---|
| 1 | Satellite pipeline | Flood raster, flood polygons, observation metadata |
| 2 | Infrastructure impacts | Exposed road segments and buildings, inspection list, summary metrics |
| **Me (3)** | App, integration, visualization | Interactive 3D map, controls, result cards, briefing download, deployment |
| 4 | Validation and demo | Reference comparison, limitations, case-study narrative, demo script |

## Primary inspiration: NYU GeoFlood Studio

Reference: geofloodstudio.cusp.nyu.edu (the page is JavaScript-rendered, so rely on the NYU articles and paper). It is an interactive **3D** flood explorer. Their pitch is that it shows more than "which areas are underwater": it adds depth, velocity and human vulnerability, supports scenario what-ifs, lets users trace flood pathways across streets, and was planned to add evacuation routing to shelters. NYU studies found dynamic 3D views communicate evacuation needs far better than traditional 2D maps, which is worth citing in the pitch.

Important difference: GeoFlood Studio visualizes outputs of **physics-based hydraulic simulations**. We do not run those. Our water comes from **Sentinel-1 flood extent plus DEM-based depth estimates**, so every depth or "what-if" value is an estimate and must be labeled that way. We borrow the presentation and interaction model, not the hydraulic claims.

What to borrow, and how it maps to our data:

| GeoFlood Studio idea | Our version |
|---|---|
| 3D terrain, buildings, water surface | Extruded translucent flood layer over 3D terrain and OSM buildings (one district at a time) |
| Depth coloring | **Estimated** depth from DEM and flood-edge elevation, labeled as an estimate |
| Scenario selector (storm plus sea level) | Event/date selector across Sentinel-1 passes and past floods (for example 2026, 2021, 2011), plus an optional "water level +X m" what-if slider using DEM only, labeled as heuristic |
| Trace flood pathways across streets | Flow-direction overlay from the DEM (MERIT Hydro or similar) showing where water is draining, labeled as heuristic |
| Human vulnerability | Population exposure (WorldPop) and exposure of hospitals, shelters and schools from teammate 2 |
| Evacuation routing to shelters | Our routing view: impassable segments from flood polygons, multi-modal route (truck then boat) from teammate 2 |
| Street-level, "see your own street" feel | Camera flythrough to incidents, with a street-level view for the demo |
| Compare protection options | Out of scope. Do not build |

Do not copy their code without checking the license and the hackathon rules. Their repo (Climate-Energy-and-Risk-Analytics-Lab/geoflood-studio) is public. Credit it as inspiration in the pitch and submission.

## What the frontend must show

Users are first responders and rescue teams, likely on phones in the field as well as on a laptop.

1. **3D map as the main view**: terrain, extruded buildings and infrastructure colored by status, flood water surface, incident markers. Province-wide overview is 2D, and the 3D scene covers one district.
2. **Incident board** (dispatch-style side panel): incidents sorted by severity score, each with status (clear / at risk / cut off / inundated), people affected, remaining access routes and recommended action. Clicking one flies the camera to it.
3. **Decision layer inputs shown together**: satellite evidence (with observation time), infrastructure context, human reports (from the Twilio number), and operational updates (assessed, team assigned, reached, resolved).
4. **Routing view**: impassable segments marked, multi-modal route drawn over the road graph.
5. **Field feedback loop**: responders mark a location "reached / cleared"; the map updates and avoids double-dispatch. This also produces validation data.
6. **Time slider and before/after swipe** across Sentinel-1 passes, with water rising and receding in 3D. Demo mode supports a **fake update date** so data visibly changes.
7. **Scenario panel** as in the table above (event selector, depth legend, optional what-if slider).
8. **Outputs**: downloadable briefing, plus Gemini-generated shareable LINE image and Facebook post text. Optional spoken Thai alert (ElevenLabs).

## Data contract (proposed, agree with teammates early)

Frontend consumes static files or a thin API. For the demo, **prefer pre-exported static files in the repo** so the demo never depends on live services. Every layer carries provenance.

```
flood_polygons.geojson   properties: acquired_at, source, method, confidence
flood_raster.png + .json   image overlay plus bounds, acquired_at, value legend
depth_estimate.png + .json   estimated depth raster, method, vertical datum note, "estimate": true
road_segments.geojson    properties: osm_id, name, status (clear|at_risk|cut_off|inundated), flooded_fraction
buildings.geojson        footprints with height (OSM), status, population_served where known
incidents.geojson        properties: id, type (hospital|shelter|bridge|pump|school|road|report), severity (0-100), severity_breakdown, population_affected, status, last_updated
routes.geojson           properties: mode (truck|boat), from, to, segments, notes
flow_direction.geojson   optional drainage lines for the pathway overlay (heuristic)
timeseries.json          per district: [{acquired_at, flooded_area_km2}]
reports.json             id, received_at, district, status, summary (no full phone numbers)
```

Until teammates deliver, build against `/public/mock/*` files that follow these shapes, and swap in real exports without changing components.

## Frontend stack (proposed)

- Vite + React + TypeScript.
- **MapLibre GL JS** with 3D terrain, plus **deck.gl** for layers (flood polygons, extruded buildings, incident markers, route arcs, depth raster). Avoid CesiumJS and Three.js unless someone already knows them.
- D3 or plain Canvas/SVG only for small charts (time series sparkline, depth legend).
- Tailwind for styling. Noto Sans Thai for Thai text, with a real fallback stack.
- Optional: Tiger Data for time series, Gemini API for share content (through a small backend so keys are not exposed).

## Design direction (also targets the IATSU Best Design prize)

Inspiration: the calm, friendly feel of the Dia browser (soft off-white surfaces, plain-language copy, generous spacing, rounded shapes, gentle shadows) plus the map interaction patterns of Apple Maps (floating panels over a full-bleed map, frosted translucent materials, a bottom sheet with snap positions, clear label hierarchy, place-card style details, smooth camera moves). Take the feel, not the assets: do not copy logos, icons, fonts or layouts closely enough to look like a clone. SF Pro and SF Symbols are Apple-licensed, so use Inter or a system font stack and an open icon set (for example Lucide or Phosphor).

**Theme and color**
- Default **light** theme (readable in bright sunlight outdoors), with a matching **dark** theme for night use.
- Surfaces around `#F8F8F8`, primary text near `#1C1C1E`, secondary text `#6B6B70`, hairlines at about 8 percent black.
- Floating panels: white at about 72 percent opacity with background blur, 12px margin from screen edges, soft shadow. Keep text contrast at WCAG AA or better over a busy map, and provide a solid fallback when blur is unavailable or slow.
- Roles: a clear cyan-blue for water and flood extent only. Status colors: Clear = green, At risk = amber, Cut off = red-orange, Inundated = deep blue. **Status is always paired with a shape and a text label, never color alone.** "Cut off" must be the most visually prominent state on screen.
- One neutral accent for primary actions. No decorative gradients.
- **Estimates** get a consistent "Estimate" tag plus hatched or dashed styling on the map, so observed and estimated data never look alike.

**Shape and layout**
- Radius: 16px cards, 24 to 28px sheets, fully rounded pills and chips.
- Desktop: full-bleed 3D map with floating panels (top bar, incident panel, bottom time slider). No heavy fixed sidebars.
- Phone: full-bleed map with a bottom sheet that snaps between three heights (peek, half, full). Tap targets 44px or larger, usable one-handed.
- Incident cards in a place-card style: title, status chip, one-line summary, key numbers, two clear actions.
- Layer controls as a clean list of switch rows with short descriptions and an Estimate tag where relevant.

**Type, icons, motion**
- Inter or system sans for English, Noto Sans Thai for Thai, with real fallbacks. Scale about 12 / 13 / 15 / 17 / 22 / 28, weights 400 / 500 / 600.
- One consistent line-icon set with a distinct **shape per incident type** (hospital, shelter, bridge, pump station, school, road, citizen report).
- Motion is short (200 to 300ms) and explains a change: sheet snaps, panel expands, camera flies to an incident, water level rises. No decorative animation. If time is short, cut motion before cutting layout.

**Tone of copy**
- Plain, short, human sentences, for example "3 shelters near the water's edge. Two are still reachable by road." Avoid jargon and alarmist wording. Emergency-tool tone, no game-style points or rewards.

**Signature element: the Situation Brief.** A calm card at the top of the main screen with one or two plain-language sentences summarizing the picture, three key numbers, and a Share action. The same content feeds the downloadable briefing and the LINE/Facebook share image (Gemini generates the sentences; numbers come from data, never from the model).

**Always show on screen:** data source, observation time, and whether a value is an **observation** or an **estimate**. First screen is the demo: open on a real Thai flood scene with an incident flagged and a short guided camera move. Bilingual Thai and English from the start, responsive, low-bandwidth friendly.

**Risks to check early**
- Frosted panels over colored flood water and 3D buildings can drop legibility. Test a worst-case screenshot.
- Backdrop blur can lag on mid-range phones. Use the solid fallback if frame rate drops.
- Soft styling can read as low urgency. Verify the Cut off state is unmistakable.

## Performance and reliability rules

- Simplify polygons before shipping (for example mapshaper or TopoJSON). Keep individual files small.
- Cap building count in the 3D scene. Test on a mid-range phone, not just a laptop.
- Cache everything the demo needs locally. The demo must work with no network.
- Do not hardcode API keys. Use environment variables and `.env.example`.
- Citizen reports are personal data: show the minimum, never full phone numbers, and mention this limitation in the pitch.

## Data limits the UI must be honest about

- Sentinel-1 revisit is roughly 6 to 12 days over Thailand, so this is post-event assessment, not real time.
- SAR struggles in dense urban areas, so do not imply reliable flood extent inside central Bangkok.
- SAR gives extent, not depth. Depth, flow pathways and what-if layers are estimates from the DEM. Bangkok is very flat, so a 30 m DEM makes them noisy. Test one district early and, if depth looks wrong, choose a district with more relief or reduce depth to qualitative bands.
- OSM completeness varies, especially small roads and shelters.

## Prize tracks and scope

Targeting: SFU ALEASAT Earth Observation (core), Enactus UNSDG, SSSS Python, IATSU Best Design, Surge Choice, and MLH Tiger Data, Gemini, ElevenLabs and .Tech. Judging criteria: Technical Complexity, Design, Pitch, Originality.

**Decision: the Huawei "Beyond Euclid" track is dropped.** No hyperbolic or other non-Euclidean features should be built. Note that perspective 3D does not qualify for that track, so do not describe the 3D scene as non-Euclidean.

Existing live Bangkok flood maps (bangkokflood.com, Floodboard, bejranonda/flood2026) already cover real-time sensor aggregation. Differentiate on satellite-derived extent, the 3D scenario experience, infrastructure impact, routing and dispatch.

Other references: floodmap.net, BKK FloodWatch (flood.autobahn.bot), bangkokflood.com.

## Build order (about 22 hours)

1. Scaffold app with mock data, the light map (dark theme later) with 3D terrain, a flood layer and incident markers.
2. Incident board with status states, camera flythrough, then the time slider and fake-date demo mode.
3. Wire real exports from teammates 1 and 2 as they land.
4. Extruded buildings and estimated depth coloring for one district (test depth quality early).
5. Scenario panel, routing overlay, field "reached/cleared" feedback, briefing download.
6. Gemini share outputs, voice alert, design polish.
7. Last 3 hours: demo video and Devpost submission. Do not leave this late.

Cut from the bottom of this list first if behind. If the core flood layer is not rendering real data by hour 8, flag it to the team.

## Open questions

- Which flood event and district is the demo? It decides the 3D scope and whether DEM depth is usable.
- Final data contract: agree field names with teammates 1 and 2.
- Who builds the backend endpoint for Gemini and Twilio (keep keys server-side)?
- Is object detection of destroyed bridges in scope? If not, the UI infers damage from flood polygons and OSM.
- Which repo is which, and are the proposed repo names acceptable?
- Project name looks settled as FloodBeacon (the repo name, also on the doc's candidate list). Confirm with the team, and check whether floodbeacon.tech is available before relying on it.
