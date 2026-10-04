export type EdgeStatus = 'modeled_available' | 'scenario_unavailable' | 'unknown'
export type CommunityStatus = 'reachable' | 'isolated' | 'unknown'

export interface AccessObservation {
  date: string
  stage_m: number | null
  discharge_m3_s: number | null
  stage_quality: string | null
  discharge_quality: string | null
  available_at: string | null
}

export interface AccessReplay {
  schema_version: 1
  case_id: string
  title: string
  mode: 'historical_replay'
  station: { id: string; name: string; coordinate: [number, number]; stage_datum_note: string }
  lookahead_days: number
  network: {
    nodes: { id: string; name: string; coordinate: [number, number]; kind: 'base' | 'junction' | 'community' }[]
    edges: { id: string; name: string; from: string; to: string; coordinates: [number, number][]; trigger: null | { metric: 'stage_m' | 'discharge_m3_s'; threshold: number; reason: string } }[]
    base_node_id: string
    community_node_ids: string[]
    note: string
  }
  sources: { title?: string; source_url?: string; attribution?: string; retrieved_at?: string; license?: string; license_url?: string }[]
  assumptions: string[]
  frames: {
    date: string
    observation: AccessObservation
    outlook: AccessObservation[]
    edge_states: { edge_id: string; status: EdgeStatus; reason: string; metric: string | null; value: number | null; threshold: number | null }[]
    communities: {
      node_id: string; name: string; status: CommunityStatus; first_loss_date: string | null; days_until_loss: number | null
      action: 'consider_earlier_visit' | 'access_lost_in_scenario' | 'monitor' | 'verify_access'; reason: string; affected_edge_ids: string[]
    }[]
  }[]
}

export function parseAccessReplay(value: unknown): AccessReplay {
  const isRecord = (item: unknown): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)
  const isText = (item: unknown): item is string => typeof item === 'string' && item.length > 0
  const isNumber = (item: unknown): item is number => typeof item === 'number' && Number.isFinite(item)
  const isNullableNumber = (item: unknown): item is number | null => item === null || isNumber(item)
  const isObservation = (item: unknown): item is AccessObservation => isRecord(item) && isText(item.date) && isNullableNumber(item.stage_m) && isNullableNumber(item.discharge_m3_s) && (item.stage_quality === null || typeof item.stage_quality === 'string') && (item.discharge_quality === null || typeof item.discharge_quality === 'string') && (item.available_at === null || typeof item.available_at === 'string')
  if (!isRecord(value)) throw new Error('The replay file is empty or is not valid JSON.')
  const data = value as unknown as Partial<AccessReplay>
  if (data.schema_version !== 1 || data.mode !== 'historical_replay' || !Array.isArray(data.frames) || !data.network || !data.station) {
    throw new Error('This replay file does not match the supported schema version.')
  }
  if (data.frames.length === 0 || !Array.isArray(data.network.nodes) || !Array.isArray(data.network.edges)) {
    throw new Error('The replay has no frames or network geometry to display.')
  }
  const nodeIds = new Set<string>()
  for (const node of data.network.nodes) {
    if (!isRecord(node) || !isText(node.id) || !isText(node.name) || !Array.isArray(node.coordinate) || node.coordinate.length !== 2 || !node.coordinate.every(isNumber) || !['base', 'junction', 'community'].includes(String(node.kind))) throw new Error('A network node has invalid fields or coordinates.')
    if (nodeIds.has(node.id)) throw new Error('Network node IDs must be unique.')
    nodeIds.add(node.id)
  }
  if (nodeIds.size === 0 || !nodeIds.has(data.network.base_node_id) || !Array.isArray(data.network.community_node_ids) || !data.network.community_node_ids.every((id) => typeof id === 'string' && nodeIds.has(id))) throw new Error('The replay network has invalid base or community node references.')
  const edgeIds = new Set<string>()
  for (const edge of data.network.edges) {
    if (!isRecord(edge) || !isText(edge.id) || !isText(edge.name) || !nodeIds.has(String(edge.from)) || !nodeIds.has(String(edge.to)) || !Array.isArray(edge.coordinates) || edge.coordinates.length < 2 || !edge.coordinates.every((point) => Array.isArray(point) && point.length === 2 && point.every(isNumber))) throw new Error('A network edge has invalid fields or geometry.')
    if (edgeIds.has(edge.id)) throw new Error('Network edge IDs must be unique.')
    edgeIds.add(edge.id)
    if (edge.trigger !== null && (!isRecord(edge.trigger) || !['stage_m', 'discharge_m3_s'].includes(String(edge.trigger.metric)) || !isNumber(edge.trigger.threshold) || !isText(edge.trigger.reason))) throw new Error('A network edge has an invalid trigger rule.')
  }
  for (const frame of data.frames) {
    if (!isRecord(frame) || !isText(frame.date) || !isObservation(frame.observation) || !Array.isArray(frame.outlook) || !frame.outlook.every(isObservation) || !Array.isArray(frame.edge_states) || !Array.isArray(frame.communities)) throw new Error('A replay frame has invalid observation or outlook data.')
    for (const edgeState of frame.edge_states) if (!isRecord(edgeState) || !edgeIds.has(String(edgeState.edge_id)) || !['modeled_available', 'scenario_unavailable', 'unknown'].includes(String(edgeState.status)) || !isText(edgeState.reason) || !(edgeState.metric === null || ['stage_m', 'discharge_m3_s'].includes(String(edgeState.metric))) || !isNullableNumber(edgeState.value) || !isNullableNumber(edgeState.threshold) || (edgeState.metric === null ? edgeState.threshold !== null || edgeState.value !== null : !isNumber(edgeState.threshold))) throw new Error('A replay frame has an invalid edge state.')
    for (const community of frame.communities) if (!isRecord(community) || !nodeIds.has(String(community.node_id)) || !isText(community.name) || !['reachable', 'isolated', 'unknown'].includes(String(community.status)) || !(community.first_loss_date === null || isText(community.first_loss_date)) || !(community.days_until_loss === null || Number.isInteger(community.days_until_loss)) || !['consider_earlier_visit', 'access_lost_in_scenario', 'monitor', 'verify_access'].includes(String(community.action)) || !isText(community.reason) || !Array.isArray(community.affected_edge_ids) || !community.affected_edge_ids.every((id) => typeof id === 'string' && edgeIds.has(id))) throw new Error('A replay frame has an invalid community status.')
  }
  if (!isText(data.case_id) || !isText(data.title) || !isText(data.station.id) || !isText(data.station.name) || !isText(data.station.stage_datum_note) || !Array.isArray(data.station.coordinate) || data.station.coordinate.length !== 2 || !data.station.coordinate.every(isNumber) || typeof data.lookahead_days !== 'number' || !Number.isInteger(data.lookahead_days) || data.lookahead_days < 1 || !Array.isArray(data.sources) || !data.sources.every(isRecord) || !Array.isArray(data.assumptions) || !data.assumptions.every(isText)) throw new Error('The replay station or provenance fields are invalid.')
  return data as AccessReplay
}
