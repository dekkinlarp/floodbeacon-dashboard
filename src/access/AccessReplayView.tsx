import { useEffect, useMemo, useState } from 'react'
import { useThemeLang } from '../i18n/ThemeLangContext'
import { parseAccessReplay, type AccessReplay, type EdgeStatus } from './types'
import './access.css'

const COLORS: Record<EdgeStatus, string> = { modeled_available: '#21835c', scenario_unavailable: '#dd603e', unknown: '#92979a' }

function fmt(value: number | null, digits = 2) { return value == null ? '—' : value.toFixed(digits) }
function dateLabel(date: string, lang: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-CA', options)
}

export function AccessReplayView() {
  const { ed: E, lang, theme } = useThemeLang()
  const [data, setData] = useState<AccessReplay | null>(null)
  const [error, setError] = useState('')
  const [frameIndex, setFrameIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    fetch('/data/access-replay.json')
      .then((response) => { if (!response.ok) throw new Error(`Replay data could not be loaded (${response.status}).`); return response.json() })
      .then((json: unknown) => { if (live) { const replay = parseAccessReplay(json); setData(replay); setError(''); const bestFrame = replay.frames.findIndex((item) => new Set(item.communities.map((community) => community.first_loss_date).filter(Boolean)).size > 1); setFrameIndex(bestFrame >= 0 ? bestFrame : 0); setSelectedNode(replay.network.community_node_ids[0] ?? null) } })
      .catch((reason: unknown) => { if (live) setError(reason instanceof Error ? reason.message : 'Replay data could not be loaded.') })
    return () => { live = false }
  }, [])

  useEffect(() => {
    if (!playing || !data) return
    const timer = window.setInterval(() => setFrameIndex((i) => (i >= data.frames.length - 1 ? 0 : i + 1)), 1100)
    return () => window.clearInterval(timer)
  }, [playing, data])

  const frame = data?.frames[frameIndex]
  const selected = frame?.communities.find((item) => item.node_id === selectedNode)
  const orderedCommunities = useMemo(() => frame ? [...frame.communities].sort((a, b) => {
    if (!a.first_loss_date) return b.first_loss_date ? 1 : a.name.localeCompare(b.name)
    if (!b.first_loss_date) return -1
    return a.first_loss_date.localeCompare(b.first_loss_date)
  }) : [], [frame])
  const bounds = useMemo(() => {
    if (!data) return null
    const xs = data.network.nodes.map((node) => node.coordinate[0])
    const ys = data.network.nodes.map((node) => node.coordinate[1])
    const padX = Math.max((Math.max(...xs) - Math.min(...xs)) * 0.13, 0.006)
    const padY = Math.max((Math.max(...ys) - Math.min(...ys)) * 0.13, 0.006)
    return { minX: Math.min(...xs) - padX, maxX: Math.max(...xs) + padX, minY: Math.min(...ys) - padY, maxY: Math.max(...ys) + padY }
  }, [data])

  const copy = lang === 'th' ? {
    eyebrow: 'ย้อนหลัง · ข้อมูลวัดจริง', title: 'การเข้าถึงชุมชน', kicker: 'ดูว่าเส้นทางใดอาจถูกตัดขาด และชุมชนใดควรพิจารณาเข้าไปก่อน', replay: 'จำลองย้อนหลัง', outlook: 'ข้อมูลย้อนหลัง 48 ชั่วโมง', observed: 'ข้อมูลวัดจริง', stage: 'ระดับน้ำ', flow: 'อัตราการไหล', noData: 'ไม่มีข้อมูล', play: 'เล่น', pause: 'หยุด', restart: 'เริ่มใหม่', reachable: 'เข้าถึงได้', isolated: 'ถูกตัดขาดในสถานการณ์', unknown: 'ยังไม่ทราบ', consider: 'พิจารณาเข้าไปก่อน', verify: 'ตรวจสอบเส้นทาง', monitor: 'ติดตาม', actionLost: 'เส้นทางถูกตัดในสถานการณ์', network: 'แผนผังพื้นที่ตัวอย่าง', area: 'ชุมชน', why: 'เหตุผล', planning: 'พื้นที่วางแผนตามวันที่อาจเข้าถึงไม่ได้', note: 'เส้นทางและเกณฑ์เป็นตัวอย่าง ไม่ใช่ถนนหรือการปิดถนนจริงในอดีต', source: 'แหล่งข้อมูลและข้อสมมติ', unavailable: 'ข้อมูล replay ใช้งานไม่ได้', load: 'กำลังโหลดข้อมูลย้อนหลัง…', datum: 'ค่าระดับอ้างอิงตามสถานี', quality: 'ธงคุณภาพ', banner: 'ใช้ข้อมูลระดับน้ำจากสถานีจริงย้อนหลัง ข้อมูลอีก 48 ชั่วโมงแสดงสิ่งที่เกิดขึ้นภายหลัง ไม่ใช่การพยากรณ์ที่ทราบได้ในเวลานั้น ส่วนสถานการณ์การเข้าถึงและเกณฑ์เป็นตัวอย่าง', cardTitle: 'การเข้าถึงชุมชน', incomplete: 'ข้อมูลย้อนหลังไม่ครบสำหรับช่วง 48 ชั่วโมงนี้', estimated: 'ค่าประมาณ', triggerStage: 'ระดับน้ำเกินเกณฑ์', triggerFlow: 'อัตราการไหลเกินเกณฑ์', baseline: 'เส้นทางพื้นฐานที่สมมติว่าเปิดอยู่; ยังไม่ได้ตรวจสอบ'
  } : {
    eyebrow: 'HISTORICAL REPLAY · OBSERVED DATA', title: 'Community access', kicker: 'See which links may be lost and which communities responders could consider visiting earlier.', replay: 'Historical replay', outlook: '48-hour hindsight outlook', observed: 'Observed', stage: 'River stage', flow: 'Discharge', noData: 'No data', play: 'Play', pause: 'Pause', restart: 'Restart', reachable: 'Reachable', isolated: 'Isolated in scenario', unknown: 'Unknown', consider: 'Consider an earlier visit', verify: 'Verify access', monitor: 'Monitor', actionLost: 'Route lost in scenario', network: 'Illustrative planning network', area: 'Community', why: 'Why this matters', planning: 'Planning areas ordered by first scenario access loss', note: 'Illustrative corridors and closure thresholds; not actual historical roads or closures.', source: 'Sources and assumptions', unavailable: 'Replay data unavailable', load: 'Loading historical replay…', datum: 'Gauge datum', quality: 'Quality flag', banner: 'Real historical gauge data · illustrative access scenario. Later observations from the same event are shown as a hindsight outlook; they were not a forecast available at the time.', cardTitle: 'Community access', incomplete: 'Historical outlook incomplete for this 48-hour window.', estimated: 'Estimated', triggerStage: 'Stage above assumed trigger', triggerFlow: 'Discharge above assumed trigger', baseline: 'Baseline corridor assumed available; actual access is unverified.', onDate: 'Historical sample on', currentSample: 'Current sample'
  }

  if (error) return <main className="access-view" style={{ '--access-bg': E.bg, '--access-ink': E.ink, '--access-mute': E.mute, '--access-hair': E.hair, '--access-card': E.bg } as React.CSSProperties}><div className="access-state"><span className="access-eyebrow">{copy.eyebrow}</span><h1>{copy.unavailable}</h1><p>{error}</p><button onClick={() => window.location.reload()}>{lang === 'th' ? 'ลองใหม่' : 'Retry'}</button></div></main>
  if (!data || !frame || !bounds) return <main className="access-view" style={{ '--access-bg': E.bg, '--access-ink': E.ink, '--access-mute': E.mute, '--access-hair': E.hair, '--access-card': E.bg } as React.CSSProperties}><div className="access-state">{copy.load}</div></main>

  const xy = (coordinate: [number, number]) => ({ x: 40 + (coordinate[0] - bounds.minX) / (bounds.maxX - bounds.minX) * 720, y: 40 + (bounds.maxY - coordinate[1]) / (bounds.maxY - bounds.minY) * 430 })
  const nodeById = new Map(data.network.nodes.map((node) => [node.id, node]))
  const stateByEdge = new Map(frame.edge_states.map((state) => [state.edge_id, state]))
  const highlight = new Set(selected?.affected_edge_ids ?? [])
  const selectedEdges = data.network.edges.filter((edge) => highlight.has(edge.id))
  const triggerFrame = selected?.action === 'consider_earlier_visit' && selected.first_loss_date
    ? data.frames.find((item) => item.date === selected.first_loss_date) ?? frame
    : frame
  const triggerStateByEdge = new Map(triggerFrame.edge_states.map((state) => [state.edge_id, state]))
  const statusClass = (status: string) => status === 'reachable' ? 'good' : status === 'isolated' ? 'danger' : 'unknown'
  const labelForAction = (action: string) => action === 'consider_earlier_visit' ? copy.consider : action === 'access_lost_in_scenario' ? copy.actionLost : action === 'verify_access' ? copy.verify : copy.monitor
  const statusLabel = (status: string) => status === 'reachable' ? copy.reachable : status === 'isolated' ? copy.isolated : copy.unknown

  return <main className="access-view" data-theme={theme} style={{ '--access-bg': E.bg, '--access-ink': E.ink, '--access-mute': E.mute, '--access-hair': E.hair, '--access-card': E.bg } as React.CSSProperties}>
    <div className="access-layout">
      <section className="access-main">
        <header className="access-header"><div><span className="access-eyebrow">{copy.eyebrow} <i /> {data.title}</span><h1>{copy.title}</h1><p>{copy.kicker}</p></div><div className="access-mode"><strong>{copy.replay}</strong><span>{data.station.name}</span></div></header>
        <div className="access-banner"><span>↺</span>{copy.banner}</div>
        <section className="access-timeline">
          <div className="access-timeline-top"><div><span className="access-eyebrow">{copy.replay}</span><strong>{frame.date && dateLabel(frame.date, lang, { month: 'long', day: 'numeric', year: 'numeric' })}</strong></div><div className="access-controls"><button onClick={() => setPlaying((v) => !v)}>{playing ? `Ⅱ ${copy.pause}` : `▶ ${copy.play}`}</button><button onClick={() => { setPlaying(false); setFrameIndex(0) }}>↺ {copy.restart}</button></div></div>
          <input aria-label={copy.replay} type="range" min={0} max={data.frames.length - 1} value={frameIndex} onChange={(event) => { setPlaying(false); setFrameIndex(Number(event.target.value)) }} style={{ accentColor: '#db663f' }} />
          <div className="access-ticks"><span>{dateLabel(data.frames[0].date, lang)}</span><span>{dateLabel(data.frames[data.frames.length - 1].date, lang)}</span></div>
        </section>
        <section className="access-map-card">
          <div className="access-map-heading"><div><span className="access-eyebrow">{copy.network}</span><h2>{frame.date ? dateLabel(frame.date, lang, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : ''}</h2></div><span className="access-map-legend"><i className="line-open" />{copy.reachable}<i className="line-closed" />{copy.isolated}<i className="line-unknown" />{copy.unknown}</span></div>
          <svg className="access-map" viewBox="0 0 800 510" role="img" aria-label={`${copy.network} · ${frame.date}`}>
            <defs><pattern id="access-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeOpacity=".045" strokeWidth="1" /></pattern></defs>
            <rect width="800" height="510" fill="url(#access-grid)" />
            {data.network.edges.map((edge) => {
              const state = stateByEdge.get(edge.id)
              const coords = edge.coordinates.length > 1 ? edge.coordinates : [nodeById.get(edge.from)?.coordinate, nodeById.get(edge.to)?.coordinate].filter((v): v is [number, number] => Boolean(v))
              const path = coords.map((point, index) => { const p = xy(point); return `${index ? 'L' : 'M'} ${p.x} ${p.y}` }).join(' ')
              const active = highlight.has(edge.id)
              return <g key={edge.id}><path d={path} fill="none" stroke={COLORS[state?.status ?? 'unknown']} strokeWidth={active ? 9 : 6} strokeLinecap="round" strokeLinejoin="round" opacity={active ? 1 : .72} strokeDasharray={state?.status === 'unknown' ? '5 7' : state?.status === 'scenario_unavailable' ? '11 7' : undefined} /><path d={path} fill="none" stroke={E.bg} strokeWidth={1.5} strokeLinecap="round" opacity=".85" />{active && <title>{edge.name} · {state?.reason}</title>}</g>
            })}
            {data.network.nodes.map((node) => { const p = xy(node.coordinate); const item = frame.communities.find((community) => community.node_id === node.id); const isSelected = selectedNode === node.id; return <g key={node.id} onClick={() => node.kind === 'community' && setSelectedNode(node.id)} className={node.kind === 'community' ? 'access-map-node clickable' : 'access-map-node'} role={node.kind === 'community' ? 'button' : undefined} tabIndex={node.kind === 'community' ? 0 : undefined} onKeyDown={(event) => { if (node.kind === 'community' && (event.key === 'Enter' || event.key === ' ')) setSelectedNode(node.id) }}><circle cx={p.x} cy={p.y} r={isSelected ? 13 : node.kind === 'community' ? 11 : 8} fill={node.kind === 'base' ? '#202c35' : item ? COLORS[item.status === 'isolated' ? 'scenario_unavailable' : item.status === 'unknown' ? 'unknown' : 'modeled_available'] : '#63737b'} stroke={E.bg} strokeWidth="3"/><text x={p.x} y={p.y - 17} textAnchor="middle">{node.name}</text></g> })}
          </svg>
          <p className="access-network-note">{copy.note}</p>
        </section>
      </section>
      <aside className="access-side">
        <section className="access-panel"><div className="access-panel-title"><div><span className="access-eyebrow">{copy.observed} · {frame.observation.date}</span><h2>{data.station.name}</h2></div><span className="access-observed-tag">● {copy.observed}</span></div>
          <div className="access-metrics"><div><span>{copy.stage}</span><strong>{fmt(frame.observation.stage_m)} <small>m</small></strong><em>{frame.observation.stage_quality ? `${copy.quality}: ${frame.observation.stage_quality}` : copy.datum}</em></div><div><span>{copy.flow}</span><strong>{fmt(frame.observation.discharge_m3_s, 1)} <small>m³/s</small></strong><em>{frame.observation.discharge_quality ? `${copy.quality}: ${frame.observation.discharge_quality}` : copy.observed}</em></div></div>
          <div className="access-outlook-title"><span className="access-eyebrow">{copy.outlook}</span><span>↗ {data.lookahead_days}d</span></div>
          <div className="access-outlook">{frame.outlook.slice(0, data.lookahead_days).map((obs) => <article key={obs.date}><div><strong>{dateLabel(obs.date, lang, { weekday: 'short', month: 'short', day: 'numeric' })}</strong><span>{copy.observed}</span></div><div><b>{fmt(obs.stage_m)} m</b><small>{copy.stage}</small></div><div><b>{fmt(obs.discharge_m3_s, 1)}</b><small>m³/s</small>{obs.discharge_quality?.toLowerCase().includes('estimat') && <em className="access-estimated">{copy.estimated}</em>}{obs.discharge_quality && !obs.discharge_quality.toLowerCase().includes('estimat') && <em className="access-quality">{obs.discharge_quality}</em>}</div></article>)}</div>
          {frame.outlook.length < data.lookahead_days && <p className="access-incomplete">{copy.incomplete}</p>}
        </section>
        <section className="access-panel access-communities"><div className="access-section-heading"><div><span className="access-eyebrow">{copy.cardTitle}</span><h2>{copy.planning}</h2></div><span className="access-count">{orderedCommunities.length}</span></div>
          {orderedCommunities.map((community) => <button key={community.node_id} className={`access-community ${selectedNode === community.node_id ? 'selected' : ''}`} onClick={() => setSelectedNode(community.node_id)}><span className={`access-status-dot ${statusClass(community.status)}`} /><span className="access-community-copy"><strong>{community.name}</strong><span>{labelForAction(community.action)}</span><small>{community.reason}</small></span><span className={`access-status-label ${statusClass(community.status)}`}>{statusLabel(community.status)}{community.days_until_loss != null && <small>{community.days_until_loss}d</small>}</span></button>)}
        </section>
        <section className="access-panel access-selected"><span className="access-eyebrow">{copy.why}</span><h2>{selected?.name ?? copy.area}</h2><p>{selected?.reason ?? data.network.note}</p>{selected?.first_loss_date && <p className="access-first-loss">{lang === 'th' ? 'วันที่อาจเข้าถึงไม่ได้ในสถานการณ์: ' : 'First scenario access loss: '}{dateLabel(selected.first_loss_date, lang, { month: 'long', day: 'numeric', year: 'numeric' })}</p>}{selectedEdges.length > 0 && <div className="access-triggers"><strong>{lang === 'th' ? 'เส้นทางที่กำหนดสถานการณ์' : 'Scenario links and triggers'}</strong>{selectedEdges.map((edge) => { const state = triggerStateByEdge.get(edge.id); const trigger = edge.trigger; return <div key={edge.id}><span>{edge.name}</span><small>{trigger ? `${selected?.action === 'consider_earlier_visit' ? copy.onDate : copy.currentSample} ${dateLabel(triggerFrame.date, lang, { month: 'short', day: 'numeric' })}: ${trigger.metric === 'stage_m' ? copy.triggerStage : copy.triggerFlow} ${trigger.threshold} ${trigger.metric === 'stage_m' ? 'm' : 'm³/s'}${state?.value != null ? ` · ${lang === 'th' ? 'ค่าที่วัด' : 'observed'} ${fmt(state.value, trigger.metric === 'stage_m' ? 2 : 1)}` : ''}` : copy.baseline}</small></div> })}</div>}<small>{copy.note}</small></section>
        <details className="access-panel access-sources"><summary>{copy.source}</summary><p>{data.station.stage_datum_note}</p><p>{data.network.note}</p><ul>{data.sources.map((source, index) => <li key={index} className="access-source"><div>{source.source_url && <a href={source.source_url} target="_blank" rel="noreferrer">{source.title ?? source.source_url} ↗</a>}{!source.source_url && <strong>{source.title ?? (lang === 'th' ? 'แหล่งข้อมูล' : 'Source')}</strong>}</div>{source.attribution && <span>{source.attribution}</span>}{source.retrieved_at && <span>{lang === 'th' ? 'ดึงข้อมูลเมื่อ' : 'Retrieved'}: {dateLabel(source.retrieved_at.slice(0, 10), lang, { year: 'numeric', month: 'short', day: 'numeric' })}</span>}{source.license && <span>{lang === 'th' ? 'สัญญาอนุญาต' : 'Licence'}: {source.license}{source.license_url && <> · <a href={source.license_url} target="_blank" rel="noreferrer">{lang === 'th' ? 'รายละเอียด' : 'details'} ↗</a></>}</span>}</li>)}</ul><strong className="access-assumption-heading">{lang === 'th' ? 'ข้อสมมติ' : 'Assumptions'}</strong><ul>{data.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></details>
      </aside>
    </div>
  </main>
}
