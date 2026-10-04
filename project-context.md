# FloodBeacon: Project Context

Converted from the team's Google Doc "dekkinlarp-satellite" (https://docs.google.com/document/d/1sHgkdy0hEQ8IItieJWBHx6jNgTeVvAPyIRn0vZM-gmw/edit). This is the team's original planning content, reorganized as Markdown with minimal edits (typos fixed, links formatted). It is context, not a final spec. Where it conflicts with `CLAUDE.md`, ask the team.

## Product Goal

Focus on what happens **after** a disaster (flood) happens, not predicting if a flood will happen. We are not building a weather forecast service.

- See infrastructure damage, for example a road or bridge destroyed.
- Plan how incident response can reach those in need (for example: take a truck to X, then a boat, because a bridge is destroyed).
- Severity of each location: where do we need to go first (optimize resource allocation).
- Collect data so we can validate a flood prediction model.

## Overview

Help a community organization protect people across all 50 districts of Bangkok. It does this by learning from past floods, warning members ahead of time, finding hidden victims, and guiding staff to reach them safely.

### Example task delegation

| Person | Owns | Main deliverables |
|---|---|---|
| 1. Satellite pipeline | Turning imagery into estimated inundation | Flood raster, flood polygons, observation metadata |
| 2. Infrastructure impacts | Turning flood polygons into useful findings | Exposed road segments/buildings, inspection list, summary metrics |
| 3. App and integration | Making the results usable | Interactive map, controls, result cards, briefing download, deployment |
| 4. Validation and demo | Establishing credibility and explaining the product | Reference comparison, limitations, case-study narrative, demo script |

## Data Layer

### Core sources

- NASA GPM IMERG, real-time rainfall: https://gpm.nasa.gov/data/imerg
- Open-Meteo API for weather data
- Microsoft Planetary Computer (comes with a Python API): https://planetarycomputer.microsoft.com
- Copernicus Data Space, the official ESA source for Sentinel-1 and Sentinel-2, with a browser search and APIs. Free, but it needs registration: https://dataspace.copernicus.eu/

### Thai sources (ของคนไทย)

- https://water.aiya.ai/

**Water levels and river flow**
- ThaiWater (Hydro-Informatics Institute): water levels, rainfall and dam data for many stations, with historical records. Check its open data service or API, and data.go.th, Thailand's open data portal.
- Royal Irrigation Department: Chao Phraya flow at upstream stations such as Chai Nat and Nakhon Sawan.
- EGAT: daily storage and releases at the Bhumibol and Sirikit dams.
- BMA drainage department: canal levels within Bangkok. Historical data may need to be requested.

**Rainfall**
- CHIRPS: daily rainfall from 1981 to now. Best for long training history.
- GPM IMERG (NASA): every 30 minutes from 2000. Good for short-term models.
- GSMaP (JAXA): hourly and tuned for Asia, so it is often better than IMERG over Thailand.
- Thai Meteorological Department: rain gauge records. Use them to check and correct the satellite rainfall.

**Weather and forecasts**
- ERA5 (Copernicus Climate Data Store): hourly weather history from 1940, including rain, temperature, wind and soil moisture. Good for training.
- ECMWF open data: free real-time forecasts, used as the model's inputs when it predicts the future.
- GloFAS: historical and forecast Chao Phraya river flow. Useful as an extra input.

**Tides**
- Hydrographic Department, Royal Thai Navy: tide predictions for the Chao Phraya river mouth.
- Global tide models such as FES2014 or TPXO: compute tides for any date as a backup.
- University of Hawaii Sea Level Center: check it for historical tide gauge records in the Gulf of Thailand.

**Soil and land**
- ESA CCI Soil Moisture for history from 1978, and SMAP from 2015.
- ESA WorldCover and Dynamic World for land cover.
- Copernicus DEM, FABDEM, MERIT Hydro for elevation, drainage direction and HAND.
- HydroSHEDS for river networks and basin boundaries.
- OpenStreetMap for roads, canals and buildings.

**Past floods**
- JRC Global Surface Water: monthly water maps from 1984.
- Sentinel-1: make your own flood maps for past events.
- GISTDA flood maps.
- Global Flood Database (Cloud to Street): mapped floods from 2000 to 2018, including Thailand in 2011.
- Traffy Fondue and news reports: dates and places of street flooding in Bangkok.

## Decision Layer

- **Satellite evidence:** estimated inundation and observation time.
- **Infrastructure context:** potentially affected roads and facilities.
- **Human reports:** people reportedly trapped, assistance needs, last contact.
- **Operational updates:** assessed, team assigned, reached, or resolved.

People in need of help can text a Twilio number about their situation. The data can be used for human assessment, taken into consideration in the decision layer, or presented for the responder to make a decision.

## Presentation Layer

Existing tools used as references:

- Bangkok FloodWatch: https://flood.autobahn.bot/ and https://github.com/bejranonda/flood2026
- bangkokflood: https://bangkokflood.com/en/
- Floodmap: https://www.floodmap.net/?gi=5911606
- NYU Tandon's GeoFlood Studio: https://geofloodstudio.cusp.nyu.edu/scenarios (LinkedIn announcement: https://www.linkedin.com/posts/nyutandonschoolofengineering_nyu-tandon-researchers-launch-interactive-activity-7389665985785638912-uf2V)

Plan: a web app to show detailed data. Also output to the Gemini API to generate a shareable LINE image and an "automated" Facebook post.

## Users and Web App

**User:** first responder, rescue team.

**Web app features**
- Show map (satellite image) and topography.
- Object detection to see a destroyed bridge or road, and identify its lat/lon.
- Visualization reference: https://www.floodmap.net/?gi=5911606
- Topology map.
- Identify potential areas that need help.
- Could a safe location become unsafe soon?
- Predict whether infrastructure will be destroyed (for example flood over a road: right now you can still travel but it might get destroyed soon).
- **Field feedback loop:** let responders mark a location "reached / cleared" so the map reflects reality and avoids double-dispatch. This also generates the validation data mentioned in the product goal.
- **Routing engine for blocked infrastructure:** formalize "take a truck to X then a boat because the bridge is destroyed." Overlay flood polygons and the OSM road graph, mark impassable segments, and compute multi-modal routes (truck to boat handoff points). This is the natural home for the "recommend path" second-priority item.

## Demo

- Fake the update date so the data visibly changes.

## Second Priority

- Prioritize areas that need help first.
- Recommend equipment and path.
- Model.

## Naming Ideas

Keywords: Flood, Disaster Recovery, First Responder.

Candidate names (with .tech domains): FloodLens.tech, FloodRelief.tech, FloodBeacon.tech, Rimnam.tech, Ainam.tech, Pingflood.tech.

## Notes for Claude Code

- Some doc items are mutually in tension: the goal says "not forecasting," but the web app list includes "could a safe location become unsafe soon" and "predict infrastructure destruction." Treat forward-looking items as labeled heuristics unless the team decides otherwise.
- The data lists are broad. For the 24-hour build, prioritize Sentinel-1 via Planetary Computer, OpenStreetMap, a DEM, and one or two Thai sources, and treat the rest as options.
- Sentinel-1 revisit is roughly 6 to 12 days over Thailand, so this is post-event assessment, not real time.
