import type { StatusKey } from '../lib/palette'

export type Status = 'clear' | 'at_risk' | 'cut_off' | 'inundated'

export type OperationalStatus = 'assessed' | 'team_assigned' | 'reached' | 'resolved'

export type IncidentType = 'hospital' | 'shelter' | 'bridge' | 'pump' | 'school' | 'road' | 'report'

// Data-contract Status <-> design StatusKey (cut/inund/risk/clear). Operational statuses
// (assessed/team_assigned/reached/resolved) have no map-status equivalent and render as 'risk'.
export const STATUS_TO_KEY: Record<Status | OperationalStatus, StatusKey> = {
  clear: 'clear',
  at_risk: 'risk',
  cut_off: 'cut',
  inundated: 'inund',
  assessed: 'risk',
  team_assigned: 'risk',
  reached: 'clear',
  resolved: 'clear',
}

export interface Metric {
  k: string
  v: string
}

export interface IncidentProperties {
  id: string
  type: IncidentType
  name: string
  name_th?: string
  short_name: string
  short_name_th?: string
  desc: string
  desc_th?: string
  long: string
  long_th?: string
  meta: string
  meta_th?: string
  metrics: Metric[]
  metrics_th?: Metric[]
  severity: number
  severity_breakdown?: Record<string, number>
  population_affected: number
  status: Status | OperationalStatus
  unverified?: boolean
  last_updated: string
}

export interface TimeseriesPoint {
  acquired_at: string
  flood_factor: number
  flooded_area_km2: number
  people_exposed: number
  roads_impassable: number
  shelters_at_risk: number
}

export interface TimeseriesFile {
  district: string
  series: TimeseriesPoint[]
}

export interface RouteProperties {
  status: Status | OperationalStatus
  name: string
  name_th?: string
  desc: string
  desc_th?: string
  eta: string
}

export interface Report {
  id: string
  received_at: string
  district: string
  status: Status | OperationalStatus
  title: string
  title_th?: string
  summary: string
  summary_th?: string
  time: string
}

export interface FloodEventMeta {
  acquired_at: string
  source: string
  method: string
  district: string
  district_th: string
  event: string
  event_th: string
}
