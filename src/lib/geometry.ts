// Procedural flood/depth/risk geometry, ported from the FloodBeacon Editorial design.
//
// There is no real flood_polygons.geojson yet (teammate 1's satellite pipeline hasn't
// delivered one) — this generates a synthetic water/depth/risk shape from a single
// "flood factor" 0..1, in a local pixel grid centered on Phra Nakhon Si Ayutthaya,
// projected to lng/lat via LL(). When a real export arrives, replace polys()/depthBands()/
// riskBands() with a loader for it; everything downstream (classify() in MapCanvas) only
// needs obs/deep/est FeatureCollections and keeps working unchanged.

export type Ring = [number, number][]

export const AOI = { cx: 1100, cy: 780, rx: 580, ry: 754 }

const ORIGIN_LNG = 100.5166
const ORIGIN_LAT = 14.3712
const LNG_SCALE = 0.00004
const LAT_SCALE = 0.00003

export function LL(x: number, y: number): [number, number] {
  return [ORIGIN_LNG + x * LNG_SCALE, ORIGIN_LAT - y * LAT_SCALE]
}

export function XY(lng: number, lat: number): [number, number] {
  return [(lng - ORIGIN_LNG) / LNG_SCALE, (ORIGIN_LAT - lat) / LAT_SCALE]
}

export function fc(features: GeoJSON.Feature[]): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features }
}

export function ring(points: Ring): [number, number][] {
  const r = points.map((p) => LL(p[0], p[1]))
  r.push(r[0])
  return r
}

export function inAOI(x: number, y: number): boolean {
  return ((x - AOI.cx) / AOI.rx) ** 2 + ((y - AOI.cy) / AOI.ry) ** 2 <= 1
}

export function aoiRing(): Ring {
  const r: Ring = []
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2
    r.push([AOI.cx + AOI.rx * Math.cos(a), AOI.cy + AOI.ry * Math.sin(a)])
  }
  return r
}

export function aoiFc(): GeoJSON.FeatureCollection {
  return fc([{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring(aoiRing())] } }])
}

let cachedAoiRing: Ring | null = null
export function clip(subject: Ring): Ring {
  const clipPoly = cachedAoiRing || (cachedAoiRing = aoiRing())
  let out: Ring = subject
  for (let i = 0; i < clipPoly.length && out.length; i++) {
    const a = clipPoly[i]
    const b = clipPoly[(i + 1) % clipPoly.length]
    const input = out
    out = []
    const sideOf = (p: [number, number]) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
    for (let j = 0; j < input.length; j++) {
      const p = input[j]
      const q = input[(j + 1) % input.length]
      const sp = sideOf(p)
      const sq = sideOf(q)
      if (sp >= 0) out.push(p)
      if (sp >= 0 !== sq >= 0) {
        const t = sp / (sp - sq)
        out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])])
      }
    }
  }
  return out
}

function edge(f: number): Ring {
  const k = (1 - f) * 360
  return (
    [
      [620, 2300],
      [580, 1050],
      [600, 860],
      [720, 640],
      [900, 480],
      [1150, 370],
      [1450, 260],
      [1800, 150],
      [2800, -200],
    ] as Ring
  ).map(([x, y]) => [x + k, y + k])
}

export const DR = ['#D6F1F7', '#A8E0EC', '#6FC8E0', '#3AA6CC', '#2377B3', '#153F8C']
export const DS = ['#B3D2D9', '#7FB9C9', '#4C9FBA', '#2A81A8', '#195A8E', '#0C2A63']
export const DL = ['0–0.3', '0.3–0.6', '0.6–1.0', '1.0–1.5', '1.5–2.5', '> 2.5']
export const RR = ['#FFF1C9', '#FFD27A', '#F7A44B', '#E5683A', '#B3282D']
export const RS = ['#D9C894', '#D9AC56', '#C9803A', '#B24E28', '#7E1A1F']

export function depthBands(f: number): GeoJSON.FeatureCollection {
  const E = edge(f)
  const pts: Ring = []
  const nr: Ring = []
  for (let i = 0; i < E.length - 1; i++) {
    const [ax, ay] = E[i]
    const [bx, by] = E[i + 1]
    const L = Math.hypot(bx - ax, by - ay)
    const n = Math.max(1, Math.ceil(L / 110))
    for (let j = 0; j < n; j++) {
      pts.push([ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n])
      nr.push([-(by - ay) / L, (bx - ax) / L])
    }
  }
  pts.push(E[E.length - 1])
  nr.push(nr[nr.length - 1])
  const R = [25, 55, 110, 190, 330]
  const s = 0.4 + 0.6 * f
  const off = R.map((r, q) =>
    pts.map((p, i) => {
      const w = r * s + 7 * Math.sin(i * 1.7 + q * 2.3) * (q + 1) * 0.5
      return [p[0] + nr[i][0] * w, p[1] + nr[i][1] * w] as [number, number]
    }),
  )
  const rings: Ring[] = [pts.concat(off[0].slice().reverse())]
  for (let q = 1; q < 5; q++) rings.push(off[q - 1].concat(off[q].slice().reverse()))
  const lastRow = off[4]
  rings.push(lastRow.concat([[3600, lastRow[lastRow.length - 1][1]], [3600, 2900], [lastRow[0][0], 2900]]))
  return fc(
    rings
      .map((r, q) => ({ r: clip(r), q }))
      .filter((o) => o.r.length > 2)
      .map((o) => ({
        type: 'Feature',
        properties: { c: DR[o.q], s: DS[o.q] },
        geometry: { type: 'Polygon', coordinates: [ring(o.r)] },
      })),
  )
}

function blob(cx: number, cy: number, rx: number, ry: number, seed: number): Ring {
  const a0 = -0.45
  const out: Ring = []
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2
    const w = 1 + 0.1 * Math.sin(3 * a + seed) + 0.06 * Math.sin(5 * a + 2 * seed)
    const x = Math.cos(a) * rx * w
    const y = Math.sin(a) * ry * w
    out.push([cx + x * Math.cos(a0) - y * Math.sin(a0), cy + x * Math.sin(a0) + y * Math.cos(a0)])
  }
  return out
}

export function riskBands(f: number, anchorX: number, anchorY: number): GeoJSON.FeatureCollection {
  const R = [1100, 760, 500, 290, 140].map((r) => r * (0.7 + 0.3 * f))
  const H = [2, 6, 14, 26, 46]
  const rg = R.map((r) => blob(anchorX, anchorY, r * 1.35, r * 0.85, 1.3))
  const cl = rg.map((r) => clip(r))
  return fc(
    cl
      .map((r, q) => ({ r, q }))
      .filter((o) => o.r.length > 2)
      .map(({ r, q }) => ({
        type: 'Feature',
        properties: { c: RR[q], s: RS[q], h: H[q] },
        geometry: {
          type: 'Polygon',
          coordinates: q < 4 && cl[q + 1].length > 2 ? [ring(r), ring(cl[q + 1]).reverse()] : [ring(r)],
        },
      })),
  )
}

export function polys(f: number): { obs: Ring; deep: Ring; est: Ring } {
  const k = (1 - f) * 360
  const shift = (a: Ring): Ring => a.map(([x, y]) => [x + k, y + k])
  const E = shift([
    [620, 2300], [580, 1050], [600, 860], [720, 640], [900, 480], [1150, 370], [1450, 260], [1800, 150], [2800, -200],
  ])
  const O = shift([
    [480, 2300], [440, 1040], [470, 820], [600, 560], [800, 400], [1080, 280], [1400, 170], [1800, 50], [2800, -320],
  ])
  const D = shift([
    [760, 2300], [720, 1100], [820, 900], [1000, 760], [1250, 640], [1550, 540], [1900, 440], [2800, 240],
  ])
  const close = (a: Ring): Ring => [...a, [3600, a[a.length - 1][1]], [3600, 2900], [a[0][0], 2900]]
  return { obs: close(E), deep: close(D), est: [...O, ...E.slice().reverse()] }
}

export interface WaterData {
  obs: GeoJSON.FeatureCollection
  deep: GeoJSON.FeatureCollection
  est: GeoJSON.FeatureCollection
  depth: GeoJSON.FeatureCollection
  risk: GeoJSON.FeatureCollection
}

export function waterData(f: number, riskAnchorX: number, riskAnchorY: number): WaterData {
  const P = polys(f)
  const one = (p: Ring) => fc([{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring(clip(p))] } }])
  return {
    obs: one(P.obs),
    deep: one(P.deep),
    est: one(P.est),
    depth: depthBands(f),
    risk: riskBands(f, riskAnchorX, riskAnchorY),
  }
}

export function pip(x: number, y: number, poly: Ring): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
