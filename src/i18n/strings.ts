// UI copy (not data-contract content), bilingual EN/TH, ported from the FloodBeacon
// Editorial design's `N` object.

export type Lang = 'en' | 'th'

export interface LayerCatalogEntry {
  key: string
  name: string
  tagKind: 'o' | 'e' | 'u' // observed | estimate | unverified
  desc: string
}

export interface ScenarioEntry {
  key: 'cur' | 'p05' | 'p10' | 'm05'
  name: string
  desc: string
}

export interface LimitEntry {
  name: string
  desc: string
}

export interface Strings {
  nav: { incidents: string; routes: string; reports: string; layers: string; scenarios: string; briefings: string; response: string }
  navCounts: number[]
  search: string
  explore: string
  sSituation: string
  dSituation: string
  sIncidents: string
  dIncidents: string
  sRoutes: string
  dRoutes: string
  sReports: string
  dReports: string
  sLayers: string
  dLayers: string
  sScn: string
  dScn: string
  sLim: string
  dLim: string
  showing: string
  selected: string
  allRoutes: string
  revisit: string
  navigate: string
  contact: string
  team: string
  repo: string
  meth: string
  data: string
  lim: string
  credit: string
  on: string
  off: string
  chosen: string
  unv: string
  share: string
  copied: string
  print: string
  briefKick: string
  pageLayers: string
  pageLayersP: string
  noResult: string
  ph: string
  kinds: { inc: string; dis: string; lay: string; scn: string }
  layers: LayerCatalogEntry[]
  scns: ScenarioEntry[]
  limits: LimitEntry[]
  st: Record<'cut' | 'inund' | 'risk' | 'clear', string>
  observed: string
  estimate: string
  unverified: string
  people: string
  roads: string
  shelters: string
  hatchNote: string
  lDepth: string
  lRisk: string
  lOff: string
  depthTitle: string
  depthUnit: string
  depthSrc: string
  riskTitle: string
  riskUnit: string
  riskSrc: string
  riskCls: string[]
  aoi: string
  places: { a: string; b: string; c: string; d: string }
}

export const STRINGS: Record<Lang, Strings> = {
  en: {
    nav: { incidents: 'Incidents', routes: 'Routes', reports: 'Reports', layers: 'Layers', scenarios: 'Scenarios', briefings: 'Briefings', response: 'Response' },
    navCounts: [5, 5, 4, 9, 4, 1, 0],
    search: 'Search', explore: 'Explore',
    sSituation: 'Situation', dSituation: 'What the latest satellite pass shows.',
    sIncidents: 'Incidents', dIncidents: 'Where to go first.',
    sRoutes: 'Routes', dRoutes: 'How to reach them.',
    sReports: 'Reports', dReports: 'What people on the ground are saying. Unverified.',
    sLayers: 'Layers', dLayers: 'What can be drawn on the map.',
    sScn: 'Scenarios', dScn: 'What-if water levels. Not a forecast.',
    sLim: 'Limitations', dLim: 'What this map can and cannot tell you.',
    showing: 'Showing 5 of 5, sorted by severity', selected: 'Selected', allRoutes: 'All routes (5)',
    revisit: 'Satellite revisit is about 6 to 12 days.',
    navigate: 'Navigate', contact: 'Contact', team: 'Team', repo: 'Repository',
    meth: 'Methodology', data: 'Data sources', lim: 'Limitations',
    credit: 'FloodBeacon, StormHacks 2026. Contains modified Copernicus Sentinel data.',
    on: 'ON', off: 'OFF', chosen: 'SELECTED', unv: 'Unverified',
    share: 'Copy link', copied: 'Copied', print: 'Print',
    briefKick: 'Briefing',
    pageLayers: 'Layers and scenarios',
    pageLayersP: 'Choose what the map draws. Each entry states its source and observation time.',
    noResult: 'No matches', ph: 'Jump to an incident, district or layer',
    kinds: { inc: 'Incident', dis: 'District', lay: 'Layer', scn: 'Scenario' },
    layers: [
      { key: 'depth', name: 'Estimated flood depth', tagKind: 'e', desc: 'Banded depth from Sentinel-1 extent and DEM.' },
      { key: 'risk', name: 'Response priority', tagKind: 'e', desc: 'Area class from exposure, population and access.' },
      { key: 'ext', name: 'Observed flood extent', tagKind: 'o', desc: 'Sentinel-1 radar.' },
      { key: 'poss', name: 'Possible extent', tagKind: 'e', desc: 'Hatched edge beyond the observed water.' },
      { key: 'roads', name: 'Road closures', tagKind: 'o', desc: 'Closed and likely closed segments.' },
      { key: 'fac', name: 'Facilities and shelters', tagKind: 'o', desc: 'Hospitals, schools, shelters. OpenStreetMap.' },
      { key: 'pump', name: 'Pump stations', tagKind: 'o', desc: 'Status from operator signals.' },
      { key: 'rep', name: 'Citizen reports', tagKind: 'u', desc: 'Unverified until a responder confirms.' },
      { key: 'bld', name: 'Buildings', tagKind: 'o', desc: 'Extruded footprints. OpenStreetMap.' },
    ],
    scns: [
      { key: 'cur', name: 'Current, as observed', desc: 'Latest satellite pass. No assumptions.' },
      { key: 'p05', name: 'Water level +0.5 m', desc: 'What-if on the DEM. Not a forecast.' },
      { key: 'p10', name: 'Water level +1.0 m', desc: 'What-if on the DEM. Not a forecast.' },
      { key: 'm05', name: 'Water level −0.5 m', desc: 'What-if on the DEM. Not a forecast.' },
    ],
    limits: [
      { name: 'Not real time', desc: 'Satellite revisit is about 6 to 12 days. Conditions may have changed since the last pass.' },
      { name: 'Depth is modelled', desc: 'Depth comes from a DEM and the radar extent. Treat every value as an estimate.' },
      { name: 'Reports are unverified', desc: 'Citizen reports show where to look, not what is confirmed.' },
    ],
    st: { cut: 'Cut off', inund: 'Inundated', risk: 'At risk', clear: 'Clear' },
    observed: 'Observed', estimate: 'Estimate', unverified: 'Unverified',
    people: 'people exposed', roads: 'road segments impassable', shelters: 'shelters at risk',
    hatchNote: 'Hatched dashed edge: estimated extent',
    lDepth: 'Depth', lRisk: 'Risk', lOff: 'Off',
    depthTitle: 'Estimated flood depth', depthUnit: 'metres above ground', depthSrc: 'Sentinel-1 extent + DEM · {d}',
    riskTitle: 'Response priority', riskUnit: 'area class: exposure, population, access', riskSrc: 'Exposure, population, road access · {d}',
    riskCls: ['Low', 'Moderate', 'High', 'Severe', 'Critical'],
    aoi: 'Response area · 2.5 km radius',
    places: { a: 'Phra Nakhon Si Ayutthaya', b: 'Ayothaya', c: 'Ho Rattanachai', d: 'Pratu Chai' },
  },
  th: {
    nav: { incidents: 'เหตุการณ์', routes: 'เส้นทาง', reports: 'รายงาน', layers: 'ชั้นข้อมูล', scenarios: 'สถานการณ์จำลอง', briefings: 'สรุป', response: 'การตอบสนอง' },
    navCounts: [5, 5, 4, 9, 4, 1, 0],
    search: 'ค้นหา', explore: 'สำรวจ',
    sSituation: 'สถานการณ์', dSituation: 'ข้อมูลจากดาวเทียมรอบล่าสุด',
    sIncidents: 'เหตุการณ์', dIncidents: 'ควรไปที่ไหนก่อน',
    sRoutes: 'เส้นทาง', dRoutes: 'ไปถึงได้อย่างไร',
    sReports: 'รายงาน', dReports: 'เสียงจากพื้นที่ ยังไม่ยืนยัน',
    sLayers: 'ชั้นข้อมูล', dLayers: 'สิ่งที่แสดงบนแผนที่ได้',
    sScn: 'สถานการณ์จำลอง', dScn: 'ระดับน้ำสมมติ ไม่ใช่การพยากรณ์',
    sLim: 'ข้อจำกัด', dLim: 'สิ่งที่แผนที่นี้บอกได้และบอกไม่ได้',
    showing: 'แสดง 5 จาก 5 เรียงตามความรุนแรง', selected: 'ที่เลือก', allRoutes: 'เส้นทางทั้งหมด (5)',
    revisit: 'ดาวเทียมโคจรกลับมาประมาณทุก 6 ถึง 12 วัน',
    navigate: 'เมนู', contact: 'ติดต่อ', team: 'ทีม', repo: 'ที่เก็บโค้ด',
    meth: 'วิธีการ', data: 'แหล่งข้อมูล', lim: 'ข้อจำกัด',
    credit: 'FloodBeacon, StormHacks 2026 มีข้อมูล Copernicus Sentinel ที่ปรับแก้แล้ว',
    on: 'เปิด', off: 'ปิด', chosen: 'เลือกอยู่', unv: 'ยังไม่ยืนยัน',
    share: 'คัดลอกลิงก์', copied: 'คัดลอกแล้ว', print: 'พิมพ์',
    briefKick: 'สรุป',
    pageLayers: 'ชั้นข้อมูลและสถานการณ์จำลอง',
    pageLayersP: 'เลือกสิ่งที่แผนที่แสดง ทุกรายการระบุแหล่งที่มาและเวลาสังเกตการณ์',
    noResult: 'ไม่พบ', ph: 'ไปที่เหตุการณ์ ตำบล หรือชั้นข้อมูล',
    kinds: { inc: 'เหตุการณ์', dis: 'ตำบล', lay: 'ชั้น', scn: 'จำลอง' },
    layers: [
      { key: 'depth', name: 'ความลึกน้ำท่วมโดยประมาณ', tagKind: 'e', desc: 'ความลึกแบบช่วงจาก Sentinel-1 และ DEM' },
      { key: 'risk', name: 'ลำดับความสำคัญในการเข้าช่วย', tagKind: 'e', desc: 'ระดับพื้นที่จากการเผชิญภัย ประชากร และการเข้าถึง' },
      { key: 'ext', name: 'ขอบเขตน้ำท่วมที่ตรวจพบ', tagKind: 'o', desc: 'เรดาร์ Sentinel-1' },
      { key: 'poss', name: 'ขอบเขตที่อาจท่วม', tagKind: 'e', desc: 'ขอบลายขีดประเลยขอบเขตที่ตรวจพบ' },
      { key: 'roads', name: 'ถนนที่ปิด', tagKind: 'o', desc: 'ช่วงที่ปิดและอาจปิด' },
      { key: 'fac', name: 'สถานที่และศูนย์พักพิง', tagKind: 'o', desc: 'โรงพยาบาล โรงเรียน ศูนย์พักพิง จาก OpenStreetMap' },
      { key: 'pump', name: 'สถานีสูบน้ำ', tagKind: 'o', desc: 'สถานะจากสัญญาณผู้ดูแล' },
      { key: 'rep', name: 'รายงานจากประชาชน', tagKind: 'u', desc: 'ยังไม่ยืนยันจนกว่าผู้ตอบสนองจะตรวจสอบ' },
      { key: 'bld', name: 'อาคาร', tagKind: 'o', desc: 'รูปทรงอาคารจาก OpenStreetMap' },
    ],
    scns: [
      { key: 'cur', name: 'ปัจจุบัน ตามที่ตรวจพบ', desc: 'รอบดาวเทียมล่าสุด ไม่มีการสมมติ' },
      { key: 'p05', name: 'ระดับน้ำ +0.5 ม.', desc: 'สมมติบน DEM ไม่ใช่การพยากรณ์' },
      { key: 'p10', name: 'ระดับน้ำ +1.0 ม.', desc: 'สมมติบน DEM ไม่ใช่การพยากรณ์' },
      { key: 'm05', name: 'ระดับน้ำ −0.5 ม.', desc: 'สมมติบน DEM ไม่ใช่การพยากรณ์' },
    ],
    limits: [
      { name: 'ไม่ใช่เวลาจริง', desc: 'ดาวเทียมโคจรกลับมาประมาณทุก 6 ถึง 12 วัน สถานการณ์อาจเปลี่ยนไปแล้วนับจากรอบล่าสุด' },
      { name: 'ความลึกเป็นแบบจำลอง', desc: 'ความลึกมาจาก DEM และขอบเขตเรดาร์ ถือว่าทุกค่าเป็นการประมาณการ' },
      { name: 'รายงานยังไม่ยืนยัน', desc: 'รายงานจากประชาชนบอกจุดที่ควรไปดู ไม่ใช่สิ่งที่ยืนยันแล้ว' },
    ],
    st: { cut: 'ถูกตัดขาด', inund: 'น้ำท่วม', risk: 'เสี่ยง', clear: 'ปกติ' },
    observed: 'สังเกตการณ์', estimate: 'ประมาณการ', unverified: 'ยังไม่ยืนยัน',
    people: 'คนในพื้นที่น้ำท่วม', roads: 'ช่วงถนนที่สัญจรไม่ได้', shelters: 'ศูนย์พักพิงที่มีความเสี่ยง',
    hatchNote: 'ขอบลายขีดประ: ขอบเขตประมาณการ',
    lDepth: 'ความลึก', lRisk: 'ความเสี่ยง', lOff: 'ปิด',
    depthTitle: 'ความลึกน้ำท่วมโดยประมาณ', depthUnit: 'เมตรเหนือพื้นดิน', depthSrc: 'Sentinel-1 + DEM · {d}',
    riskTitle: 'ลำดับความสำคัญในการเข้าช่วย', riskUnit: 'ระดับพื้นที่: การเผชิญภัย ประชากร การเข้าถึง', riskSrc: 'การเผชิญภัย ประชากร การเข้าถึงถนน · {d}',
    riskCls: ['ต่ำ', 'ปานกลาง', 'สูง', 'รุนแรง', 'วิกฤต'],
    aoi: 'พื้นที่ปฏิบัติการ · รัศมี 2.5 กม.',
    places: { a: 'พระนครศรีอยุธยา', b: 'อโยธยา', c: 'หอรัตนไชย', d: 'ประตูชัย' },
  },
}

export interface SituationCopy {
  s1: string
  s2: string
  olderNote: string
}

export const SITUATION: Record<Lang, SituationCopy> = {
  en: {
    s1: 'Floodwater still covers most of the eastern subdistricts, and the district hospital can’t be reached by road.',
    s2: 'Start with hospital access and the river bridge, then check on the school shelter.',
    olderNote: 'You’re viewing an earlier pass. The incident list reflects the latest one.',
  },
  th: {
    s1: 'น้ำยังท่วมพื้นที่ส่วนใหญ่ของตำบลฝั่งตะวันออก และยังเดินทางไปโรงพยาบาลอำเภอทางถนนไม่ได้',
    s2: 'เริ่มจากเส้นทางเข้าโรงพยาบาลและสะพานข้ามแม่น้ำ จากนั้นไปดูศูนย์พักพิงที่โรงเรียน',
    olderNote: 'กำลังดูรอบดาวเทียมก่อนหน้า รายการเหตุการณ์อ้างอิงรอบล่าสุด',
  },
}

export const PLACES: Record<'a' | 'b' | 'c' | 'd', [number, number]> = {
  a: [1110, 860],
  b: [1803, 237],
  c: [1527, 633],
  d: [1000, 700],
}
