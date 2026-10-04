export type Coordinate = [number, number]
export type Bounds = [number, number, number, number]

export interface SatelliteImage {
  id: string
  url: string
  bounds: Bounds
  image_coordinates: [Coordinate, Coordinate, Coordinate, Coordinate]
  width: number
  height: number
  attribution: string
  license: string
  license_url: string
  provenance: Record<string, unknown>
}

export interface BridgeFinding {
  bridge_id: string
  name: string
  observation_id: string
  observed_date: string
  finding: string
  status: 'visible_crossing' | 'missing_span' | 'uncertain'
  assessment_method: string
  failure_time: string | null
  annotation: string
}

export interface Bridge {
  id: string
  name: string
  coordinate: Coordinate
  failure_time: string | null
  comparison_url: string | null
  before_url: string | null
  after_url: string | null
  agency_evidence: { source: string; grade?: string; observed_at?: string; source_url?: string; note?: string } | null
  limitations: string[]
}

export interface Observation {
  id: string
  acquired_date: string
  acquired_at: string | null
  label: string
  images: SatelliteImage[]
  bridges: GeoJSON.FeatureCollection<GeoJSON.Polygon, BridgeFinding>
  regional_tiles?: {
    url: string
    bounds: Bounds
    minzoom: number
    maxzoom: number
    tile_size: number
    attribution: string
    license: string
    license_url: string
    provenance: Record<string, unknown>
  } | null
}

export interface ImageryCatalog {
  case_id: string
  name: string
  country: string
  bounds: Bounds
  study_bounds?: Bounds | null
  flood_extent?: GeoJSON.FeatureCollection | null
  run_id: string
  generated_at: string
  bridges: Bridge[]
  limitations: string[]
  observations: Observation[]
}

export const API_ROOT = (import.meta.env.VITE_FLOODBEACON_API_URL || 'http://localhost:8000').replace(/\/$/, '')
export const assetUrl = (url: string) => new URL(url, `${API_ROOT}/`).href

export function observationDate(date: string, lang: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
}
