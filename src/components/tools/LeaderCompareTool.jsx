import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDynasties } from '../../hooks/useDynasties'
import { useRegionalRegimes } from '../../hooks/useRegionalRegime'
import { useAllLeaders } from '../../hooks/useDynasties'
import { getLeaderImageSrc } from '../../utils/leaderImage'
import { withOpacity } from '../../utils/colorUtils'
import { formatLifeYearRange, formatYearRangeOngoing } from '../../utils/yearFormat'
import { computeTotalScore } from '../../utils/ratings'
import CompareRadar from './CompareRadar'
import SearchSelect from './SearchSelect'
import AnnotatedText from '../common/AnnotatedText'
import './LeaderCompareTool.css'

function toDateUTC(y, m = 1, d = 1) {
  const dt = new Date(Date.UTC(y, m - 1, d, 0, 0, 0))
  return Number.isFinite(dt.getTime()) ? dt : null
}

function todayUTC() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))
}

function parseISODate(s) {
  if (typeof s !== 'string') return null
  const t = s.trim()
  if (!t) return null
  // Prefer strict YYYY-MM-DD parsing as UTC to avoid timezone shifts.
  const m = /^(-?\d{1,6})-(\d{2})-(\d{2})$/.exec(t)
  if (m) {
    const y = Number(m[1])
    const mo = Number(m[2])
    const d = Number(m[3])
    if (Number.isFinite(y) && mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return toDateUTC(y, mo, d)
    }
  }

  // Fallback: full ISO strings with time.
  const dt = new Date(t)
  return Number.isFinite(dt.getTime()) ? dt : null
}

function normalizeYear(y) {
  // Important: Number(null) === 0, which would turn "unknown" into year 0 (1900 in JS Date).
  if (y == null) return null
  if (typeof y === 'string' && !y.trim()) return null
  const n = Number(y)
  return Number.isFinite(n) ? n : null
}

function extractBirthDateFromBio(leader) {
  const bio = typeof leader?.bio === 'string' ? leader.bio : ''
  if (!bio) return null

  // Try to find an explicit birth date in bio.
  // Prefer matches whose year equals leader.birthYear (if provided) to avoid false positives.
  const by = normalizeYear(leader?.birthYear)

  const full = /(-?\d{1,6})年(\d{1,2})月(\d{1,2})日/g
  let match
  while ((match = full.exec(bio))) {
    const y = Number(match[1])
    const m = Number(match[2])
    const d = Number(match[3])
    if (!Number.isFinite(y)) continue
    if (by != null && y !== by) continue
    const dt = toDateUTC(y, m, d)
    if (dt) return dt
  }

  // Fallback: "YYYY年M月生" (no day)
  const monthOnly = /(-?\d{1,6})年(\d{1,2})月生/g
  while ((match = monthOnly.exec(bio))) {
    const y = Number(match[1])
    const m = Number(match[2])
    if (!Number.isFinite(y)) continue
    if (by != null && y !== by) continue
    const dt = toDateUTC(y, m, 1)
    if (dt) return dt
  }

  return null
}

function getBirthDate(leader) {
  return (
    parseISODate(leader?.birthDate) ||
    extractBirthDateFromBio(leader) ||
    (normalizeYear(leader?.birthYear) != null ? toDateUTC(normalizeYear(leader.birthYear), 1, 1) : null)
  )
}

function getDeathDateOrNow(leader) {
  return (
    parseISODate(leader?.deathDate) ||
    (normalizeYear(leader?.deathYear) != null ? toDateUTC(normalizeYear(leader.deathYear), 12, 31) : null) ||
    todayUTC()
  )
}

function getReignStartDate(leader) {
  return (
    parseISODate(leader?.reignStartDate) ||
    (normalizeYear(leader?.reignStart) != null ? toDateUTC(normalizeYear(leader.reignStart), 1, 1) : null)
  )
}

function getReignEndDateOrNow(leader) {
  return (
    parseISODate(leader?.reignEndDate) ||
    (normalizeYear(leader?.reignEnd) != null ? toDateUTC(normalizeYear(leader.reignEnd), 12, 31) : null) ||
    todayUTC()
  )
}

function getReignSegments(leader) {
  const periods = Array.isArray(leader?.reignPeriods) ? leader.reignPeriods : []
  const segs = periods
    .map(p => {
      const startY = normalizeYear(p?.start)
      const endY = normalizeYear(p?.end)
      const start = startY != null ? toDateUTC(startY, 1, 1) : null
      const end = endY != null ? toDateUTC(endY, 12, 31) : null
      if (!start) return null
      return {
        start,
        end: end || todayUTC(),
        polityId: p?.polityId ? String(p.polityId) : '',
        role: typeof p?.role === 'string' ? p.role : '',
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
  if (segs.length > 0) return segs

  const start = getReignStartDate(leader)
  const end = start ? getReignEndDateOrNow(leader) : null
  return start && end ? [{ start, end, polityId: String(leader?.dynastyId || ''), role: '' }] : []
}

function yearLabelFromDate(dt) {
  if (!dt) return '—'
  const y = dt.getUTCFullYear()
  return y < 0 ? `前${Math.abs(y)}年` : `${y}年`
}

function formatDateLabel(dt) {
  if (!dt) return '—'
  const y = dt.getUTCFullYear()
  if (y < 0) return `前${Math.abs(y)}年`
  return `${y}年`
}

function durationYears(start, end) {
  if (!start || !end) return null
  const ms = end.getTime() - start.getTime()
  if (!Number.isFinite(ms)) return null
  const years = ms / (365.2425 * 24 * 3600 * 1000)
  return years >= 0 ? years : null
}

function sumDurationYears(segs) {
  const list = Array.isArray(segs) ? segs : []
  const total = list.reduce((acc, s) => acc + (durationYears(s?.start, s?.end) || 0), 0)
  return total > 0 ? total : null
}

function clamp01(x) {
  if (x < 0) return 0
  if (x > 1) return 1
  return x
}

function TimelineBar({ leader, color, minMs, maxMs, start, end, kind, scaleMode = 'absolute', maxDurationYears = 1 }) {
  if (!leader) return null
  if (!start || !end) return null
  const lenYears = durationYears(start, end)
  const span = Math.max(1, maxMs - minMs)

  let left = 0
  let right = 0
  if (scaleMode === 'relative') {
    // Start-aligned length comparison: width is proportional to duration among the two people.
    const r = clamp01(((lenYears || 0) / Math.max(0.0001, maxDurationYears)))
    left = 0
    right = r * 100
  } else {
    left = clamp01((start.getTime() - minMs) / span) * 100
    right = clamp01((end.getTime() - minMs) / span) * 100
  }
  const width = Math.max(0.8, right - left)

  return (
    <div className="lct-line">
      <div className="lct-line-label">
        <span className="lct-dot" style={{ background: color }} />
        {leader.name}
        <span className="lct-line-years">
          {formatDateLabel(start)}–{formatDateLabel(end)} {lenYears != null ? `(${lenYears.toFixed(1)}年)` : ''}
        </span>
      </div>
      <div className="lct-track">
        <div
          className={`lct-bar ${kind === 'reign' ? 'lct-bar-reign' : ''}`}
          style={{
            left: `${left}%`,
            width: `${width}%`,
            background: `linear-gradient(90deg, ${withOpacity(color, 0.55)}, ${withOpacity(color, 0.18)})`,
            borderColor: withOpacity(color, 0.45),
          }}
        />
        <div className="lct-pin" style={{ left: `${left}%`, background: color }} title={`${kind === 'reign' ? '开始' : '出生'}：${formatDateLabel(start)}`} />
        <div className="lct-pin" style={{ left: `${right}%`, background: color }} title={`${kind === 'reign' ? '结束/至今' : '去世/至今'}：${formatDateLabel(end)}`} />
      </div>
    </div>
  )
}

function DurationBar({ leader, color, lenYears, maxDurationYears = 1, kind }) {
  if (!leader) return null
  const r = clamp01(((lenYears || 0) / Math.max(0.0001, maxDurationYears)))
  const width = Math.max(0.8, r * 100)
  return (
    <div className="lct-line">
      <div className="lct-line-label">
        <span className="lct-dot" style={{ background: color }} />
        {leader.name}
        <span className="lct-line-years">
          {lenYears != null ? `合计${lenYears.toFixed(1)}年` : '—'}
        </span>
      </div>
      <div className="lct-track">
        <div
          className={`lct-bar ${kind === 'reign' ? 'lct-bar-reign' : ''}`}
          style={{
            left: '0%',
            width: `${width}%`,
            background: `linear-gradient(90deg, ${withOpacity(color, 0.55)}, ${withOpacity(color, 0.18)})`,
            borderColor: withOpacity(color, 0.45),
          }}
        />
      </div>
    </div>
  )
}

function LeaderInfoCard({ leader, color, side }) {
  if (!leader) {
    return (
      <div className={`lct-side lct-side-${side}`}>
        <div className="lct-side-empty">请选择人物</div>
      </div>
    )
  }

  const img = getLeaderImageSrc(leader)
  const [imgFailed, setImgFailed] = useState(false)
  useEffect(() => setImgFailed(false), [leader?.id, img])
  const tag = typeof leader?.factionTag === 'string' ? leader.factionTag.trim() : ''

  const info = [
    { k: '姓名', v: leader.name },
    { k: '头衔', v: leader.title || '—' },
    { k: '民族', v: leader.ethnicity || '—' },
    { k: '祖籍', v: leader.birthplace || '—' },
    { k: '生卒', v: formatLifeYearRange(leader.birthYear, leader.deathYear) },
    { k: '在位', v: formatYearRangeOngoing(leader.reignStart, leader.reignEnd) },
    tag ? { k: '派别', v: tag } : null,
  ].filter(Boolean)

  return (
    <div className={`lct-side lct-side-${side}`} style={{ '--lct-color': color }}>
      <div className="lct-profile">
        <div
          className="lct-avatar"
          style={{ background: `linear-gradient(135deg, ${color}, ${withOpacity(color, 0.45)})` }}
        >
          {img && !imgFailed ? (
            <img
              src={img}
              alt={leader.name}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
            />
          ) : (
            leader.name.charAt(0)
          )}
        </div>
        <div className="lct-profile-main">
          <div className="lct-name-row">
            <div className="lct-name">{leader.name}</div>
            <Link
              to={`/leader/${leader.id}`}
              className="lct-open"
              style={{ color }}
              title="打开人物详情"
            >
              详情 ↗
            </Link>
          </div>
          <div className="lct-title" style={{ color }}>{leader.shortTitle || leader.templeName || leader.title || ''}</div>
        </div>
      </div>

      <div className="lct-kv">
        {info.map(row => (
          <div className="lct-kv-row" key={row.k}>
            <div className="lct-k">{row.k}</div>
            <div className="lct-v">{row.v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MultiSegmentBar({ leader, color, minMs, maxMs, segs, kind }) {
  if (!leader) return null
  const list = Array.isArray(segs) ? segs : []
  if (list.length === 0) return null

  const span = Math.max(1, maxMs - minMs)
  const totalYears = sumDurationYears(list)

  return (
    <div className="lct-line">
      <div className="lct-line-label">
        <span className="lct-dot" style={{ background: color }} />
        {leader.name}
        <span className="lct-line-years">{totalYears != null ? `合计${totalYears.toFixed(1)}年` : ''}</span>
      </div>
      <div className="lct-track">
        {list.map((seg, idx) => {
          const left = clamp01((seg.start.getTime() - minMs) / span) * 100
          const right = clamp01((seg.end.getTime() - minMs) / span) * 100
          const width = Math.max(0.8, right - left)
          return (
            <div
              key={idx}
              className={`lct-bar ${kind === 'reign' ? 'lct-bar-reign' : ''}`}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: `linear-gradient(90deg, ${withOpacity(color, 0.55)}, ${withOpacity(color, 0.18)})`,
                borderColor: withOpacity(color, 0.45),
              }}
              title={`${formatDateLabel(seg.start)}–${formatDateLabel(seg.end)}`}
            />
          )
        })}

        {/* Pins at the very first/last segment edge to keep the "start/end" affordance */}
        <div
          className="lct-pin"
          style={{
            left: `${clamp01((list[0].start.getTime() - minMs) / span) * 100}%`,
            background: color,
          }}
          title={`开始：${formatDateLabel(list[0].start)}`}
        />
        <div
          className="lct-pin"
          style={{
            left: `${clamp01((list[list.length - 1].end.getTime() - minMs) / span) * 100}%`,
            background: color,
          }}
          title={`结束/至今：${formatDateLabel(list[list.length - 1].end)}`}
        />
      </div>
    </div>
  )
}

export default function LeaderCompareTool() {
  const [searchParams] = useSearchParams()
  const { dynasties, loading } = useDynasties()
  const regionalRegimes = useRegionalRegimes()
  const leaders = useAllLeaders()

  const polities = useMemo(() => {
    const central = (dynasties || []).map(d => ({ ...d, kind: 'dynasty' }))
    const regional = (regionalRegimes || []).map(r => ({ ...r, kind: 'regional' }))
    return [...central, ...regional]
  }, [dynasties, regionalRegimes])

  const polityById = useMemo(() => {
    const map = new Map()
    polities.forEach(p => map.set(String(p.id), p))
    return map
  }, [polities])

  function getLeaderThemeColor(leader, fallback) {
    if (!leader) return fallback || '#c9a96e'
    const customColor = typeof leader.color === 'string' ? leader.color.trim() : ''
    if (customColor) return customColor
    const polity = polityById.get(String(leader.dynastyId))
    return polity?.color || fallback || '#c9a96e'
  }

  function normalizeHexColor(input) {
    if (typeof input !== 'string') return null
    const c = input.trim().toLowerCase()
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(c)
    if (!m) return null
    const hex = m[1]
    if (hex.length === 3) {
      return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
    }
    return `#${hex}`
  }

  function hexToRgb(hex) {
    const n = normalizeHexColor(hex)
    if (!n) return null
    const raw = n.slice(1)
    const r = parseInt(raw.slice(0, 2), 16)
    const g = parseInt(raw.slice(2, 4), 16)
    const b = parseInt(raw.slice(4, 6), 16)
    return Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b) ? { r, g, b } : null
  }

  function rgbToHex({ r, g, b }) {
    const clamp = (x) => Math.max(0, Math.min(255, Math.round(x)))
    const to2 = (x) => clamp(x).toString(16).padStart(2, '0')
    return `#${to2(r)}${to2(g)}${to2(b)}`
  }

  function mixRgb(a, b, t) {
    // t=0 -> a, t=1 -> b
    const tt = Math.max(0, Math.min(1, t))
    return {
      r: a.r + (b.r - a.r) * tt,
      g: a.g + (b.g - a.g) * tt,
      b: a.b + (b.b - a.b) * tt,
    }
  }

  function tweakColorForSide(color, side) {
    const rgb = hexToRgb(color)
    if (!rgb) return color
    const white = { r: 255, g: 255, b: 255 }
    const black = { r: 0, g: 0, b: 0 }
    // 使被对比方颜色变浅、对比方颜色加深以增加区分度
    const tweaked = side === 'left'
      ? mixRgb(rgb, white, 0.50)
      : mixRgb(rgb, black, 0.50)
    return rgbToHex(tweaked)
  }

  const centralOptions = useMemo(() => {
    return (dynasties || [])
      .slice()
      .sort((a, b) => (a.startYear ?? 999999) - (b.startYear ?? 999999))
      .map(d => ({ value: String(d.id), label: d.fullName || d.name }))
  }, [dynasties])

  const regionalByCentral = useMemo(() => {
    const map = new Map()
      ; (regionalRegimes || []).forEach(r => {
        const cid = r?.relatedCentralDynastyId
        if (!cid) return
        const key = String(cid)
        if (!map.has(key)) map.set(key, [])
        map.get(key).push(r)
      })
    map.forEach(list => list.sort((a, b) => (a.startYear ?? 999999) - (b.startYear ?? 999999)))
    return map
  }, [regionalRegimes])

  function polityOptionsForCentral(centralId) {
    const cid = String(centralId || '')
    if (!cid) return []
    const central = dynasties.find(d => String(d.id) === cid)
    const opts = []
    if (central) opts.push({ value: String(central.id), label: `${central.fullName || central.name}（中央）` })
    const regionals = regionalByCentral.get(cid) || []
    regionals.forEach(r => {
      opts.push({ value: String(r.id), label: r.fullName || r.name })
    })
    return opts
  }

  function leaderInPolity(leader, polityId) {
    if (!leader || !polityId) return false
    const pid = String(polityId)
    if (String(leader.dynastyId || '') === pid) return true
    const positions = Array.isArray(leader.positions) ? leader.positions : []
    return positions.some(p => String(p?.polityId || '') === pid)
  }

  function leaderLabel(leader) {
    if (!leader) return ''
    const years = normalizeYear(leader.birthYear) != null ? `（${normalizeYear(leader.birthYear)}）` : ''
    const t = typeof leader.shortTitle === 'string' && leader.shortTitle.trim()
      ? leader.shortTitle.trim()
      : (leader.templeName || leader.title || '')
    return `${leader.name}${t ? ` · ${t}` : ''}${years}`
  }

  const [leftCentralId, setLeftCentralId] = useState(centralOptions[0]?.value || '')
  const [leftPolityId, setLeftPolityId] = useState(() => {
    const cid = centralOptions[0]?.value || ''
    return polityOptionsForCentral(cid)[0]?.value || ''
  })
  const [leftLeaderId, setLeftLeaderId] = useState('')

  const [rightCentralId, setRightCentralId] = useState(centralOptions[0]?.value || '')
  const [rightPolityId, setRightPolityId] = useState(() => {
    const cid = centralOptions[0]?.value || ''
    const opts = polityOptionsForCentral(cid)
    return opts[1]?.value || opts[0]?.value || ''
  })
  const [rightLeaderId, setRightLeaderId] = useState('')

  const suppressCentralReset = useMemo(() => ({ left: false, right: false }), [])

  const leftPolityOptions = useMemo(() => polityOptionsForCentral(leftCentralId), [leftCentralId, dynasties, regionalByCentral])
  const rightPolityOptions = useMemo(() => polityOptionsForCentral(rightCentralId), [rightCentralId, dynasties, regionalByCentral])

  const leftLeaderOptions = useMemo(() => {
    return (leaders || [])
      .filter(l => leaderInPolity(l, leftPolityId))
      .slice()
      .sort((a, b) => (a.birthYear ?? 999999) - (b.birthYear ?? 999999))
      .map(l => ({ value: String(l.id), label: leaderLabel(l) }))
  }, [leaders, leftPolityId])

  const rightLeaderOptions = useMemo(() => {
    return (leaders || [])
      .filter(l => leaderInPolity(l, rightPolityId))
      .slice()
      .sort((a, b) => (a.birthYear ?? 999999) - (b.birthYear ?? 999999))
      .map(l => ({ value: String(l.id), label: leaderLabel(l) }))
  }, [leaders, rightPolityId])

  useEffect(() => {
    // When central changes, reset polity to central default and clear leader.
    if (suppressCentralReset.left) {
      suppressCentralReset.left = false
      return
    }
    const opts = polityOptionsForCentral(leftCentralId)
    const nextPolity = opts[0]?.value || ''
    setLeftPolityId(nextPolity)
    setLeftLeaderId('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftCentralId])

  useEffect(() => {
    if (suppressCentralReset.right) {
      suppressCentralReset.right = false
      return
    }
    const opts = polityOptionsForCentral(rightCentralId)
    const nextPolity = opts[0]?.value || ''
    setRightPolityId(nextPolity)
    setRightLeaderId('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightCentralId])

  useEffect(() => {
    const leftFromUrl = searchParams.get('left')
    if (!leftFromUrl) return

    const leader = (leaders || []).find(l => String(l?.id) === String(leftFromUrl)) ?? null
    if (!leader) return

    const centralIdSet = new Set((dynasties || []).map(d => String(d?.id)))
    const regionalById = new Map((regionalRegimes || []).map(r => [String(r?.id), r]))

    const positions = Array.isArray(leader.positions) ? leader.positions : []
    let best = null
    for (const p of positions) {
      const pid = p?.polityId
      if (!pid) continue
      const start = typeof p?.start === 'number' ? p.start : Number(p?.start)
      const startNum = Number.isFinite(start) ? start : -Infinity
      if (!best || startNum > best.startNum) best = { pid: String(pid), startNum }
    }
    let polityId = best?.pid ? String(best.pid) : String(leader.dynastyId || '')
    if (!polityId) polityId = String(leader.dynastyId || '')

    let centralId = ''
    if (polityId && centralIdSet.has(polityId)) {
      centralId = polityId
    } else {
      const reg = polityId ? regionalById.get(String(polityId)) : null
      centralId = String(reg?.relatedCentralDynastyId || leader.dynastyId || '')
      if (centralId && !centralIdSet.has(centralId)) {
        centralId = centralOptions[0]?.value || ''
      }
    }

    if (centralId && polityId) {
      suppressCentralReset.left = true
      setLeftCentralId(centralId)
      setLeftPolityId(polityId)
      setLeftLeaderId(String(leader.id))
    }
  }, [searchParams, leaders, dynasties, regionalRegimes, centralOptions, suppressCentralReset])

  useEffect(() => {
    if (leftLeaderId) return
    const first = leftLeaderOptions[0]?.value || ''
    if (first) setLeftLeaderId(first)
  }, [leftLeaderOptions, leftLeaderId])

  useEffect(() => {
    if (rightLeaderId) return
    const first = rightLeaderOptions[0]?.value || ''
    if (first) setRightLeaderId(first)
  }, [rightLeaderOptions, rightLeaderId])

  const left = useMemo(() => (leaders || []).find(l => String(l.id) === String(leftLeaderId)) ?? null, [leaders, leftLeaderId])
  const right = useMemo(() => (leaders || []).find(l => String(l.id) === String(rightLeaderId)) ?? null, [leaders, rightLeaderId])

  const rawLeftColor = getLeaderThemeColor(left, '#b33a3a')
  const rawRightColor = getLeaderThemeColor(right, '#2a4a7f')
  const sameBaseColor = normalizeHexColor(rawLeftColor) && normalizeHexColor(rawRightColor)
    ? normalizeHexColor(rawLeftColor) === normalizeHexColor(rawRightColor)
    : rawLeftColor === rawRightColor
  const leftColor = sameBaseColor ? tweakColorForSide(rawLeftColor, 'left') : rawLeftColor
  const rightColor = sameBaseColor ? tweakColorForSide(rawRightColor, 'right') : rawRightColor

  const lifeLeftStart = useMemo(() => getBirthDate(left), [left])
  const lifeLeftEnd = useMemo(() => getDeathDateOrNow(left), [left])
  const lifeRightStart = useMemo(() => getBirthDate(right), [right])
  const lifeRightEnd = useMemo(() => getDeathDateOrNow(right), [right])

  const reignLeftSegs = useMemo(() => getReignSegments(left), [left])
  const reignRightSegs = useMemo(() => getReignSegments(right), [right])

  const reignLeftStart = useMemo(() => reignLeftSegs[0]?.start ?? null, [reignLeftSegs])
  const reignLeftEnd = useMemo(() => reignLeftSegs.length ? reignLeftSegs[reignLeftSegs.length - 1]?.end ?? null : null, [reignLeftSegs])
  const reignRightStart = useMemo(() => reignRightSegs[0]?.start ?? null, [reignRightSegs])
  const reignRightEnd = useMemo(() => reignRightSegs.length ? reignRightSegs[reignRightSegs.length - 1]?.end ?? null : null, [reignRightSegs])

  const axis = useMemo(() => {
    const starts = [lifeLeftStart, lifeRightStart, reignLeftStart, reignRightStart].filter(Boolean)
    const ends = [lifeLeftEnd, lifeRightEnd, reignLeftEnd, reignRightEnd].filter(Boolean)
    if (starts.length === 0 || ends.length === 0) return { minMs: 0, maxMs: 1 }
    let minMs = Math.min(...starts.map(d => d.getTime()))
    let maxMs = Math.max(...ends.map(d => d.getTime()))
    if (minMs === maxMs) maxMs = minMs + 1
    const pad = Math.max(24 * 3600 * 1000, Math.round((maxMs - minMs) * 0.06))
    return { minMs: minMs - pad, maxMs: maxMs + pad }
  }, [lifeLeftStart, lifeRightStart, reignLeftStart, reignRightStart, lifeLeftEnd, lifeRightEnd, reignLeftEnd, reignRightEnd])

  const [scaleMode, setScaleMode] = useState('absolute') // 'absolute' | 'relative'

  const lifeDurLeft = useMemo(() => durationYears(lifeLeftStart, lifeLeftEnd), [lifeLeftStart, lifeLeftEnd])
  const lifeDurRight = useMemo(() => durationYears(lifeRightStart, lifeRightEnd), [lifeRightStart, lifeRightEnd])
  const maxLifeDur = useMemo(() => Math.max(lifeDurLeft || 0, lifeDurRight || 0) || 1, [lifeDurLeft, lifeDurRight])

  const reignDurLeft = useMemo(() => sumDurationYears(reignLeftSegs), [reignLeftSegs])
  const reignDurRight = useMemo(() => sumDurationYears(reignRightSegs), [reignRightSegs])
  const maxReignDur = useMemo(() => Math.max(reignDurLeft || 0, reignDurRight || 0) || 1, [reignDurLeft, reignDurRight])

  const leftTotal = useMemo(
    () => (left?.ratings ? computeTotalScore(left.ratings) : null),
    [left]
  )
  const rightTotal = useMemo(
    () => (right?.ratings ? computeTotalScore(right.ratings) : null),
    [right]
  )

  if (loading) {
    return <div className="lct-loading">载入中...</div>
  }

  return (
    <section className="leader-compare-tool" id="leader-compare">
      <div className="lct-head">
        <h2 className="lct-title">人物对比</h2>
        <p className="lct-sub">左右对照人物信息，中心区域叠加时间轴与八维评分，便于同时比较年份位置与跨度长短。</p>
      </div>

      <div className="lct-pickers" role="group" aria-label="人物对比选择">
        <div className="lct-picker-stack">
          <SearchSelect
            label="选择时期"
            placeholder="搜索中央朝代/政府..."
            options={centralOptions}
            value={leftCentralId}
            onChange={setLeftCentralId}
          />
          <SearchSelect
            label="选择政权"
            placeholder="搜索政权..."
            options={leftPolityOptions}
            value={leftPolityId}
            onChange={(v) => {
              setLeftPolityId(v)
              setLeftLeaderId('')
            }}
            disabled={!leftCentralId}
          />
          <SearchSelect
            label="选择人物"
            placeholder="搜索人物..."
            options={leftLeaderOptions}
            value={leftLeaderId}
            onChange={setLeftLeaderId}
            disabled={!leftPolityId}
          />
        </div>

        <div className="lct-vs">VS</div>

        <div className="lct-picker-stack">
          <SearchSelect
            label="选择时期"
            placeholder="搜索中央朝代/政府..."
            options={centralOptions}
            value={rightCentralId}
            onChange={setRightCentralId}
          />
          <SearchSelect
            label="选择政权"
            placeholder="搜索政权..."
            options={rightPolityOptions}
            value={rightPolityId}
            onChange={(v) => {
              setRightPolityId(v)
              setRightLeaderId('')
            }}
            disabled={!rightCentralId}
          />
          <SearchSelect
            label="选择人物"
            placeholder="搜索人物..."
            options={rightLeaderOptions}
            value={rightLeaderId}
            onChange={setRightLeaderId}
            disabled={!rightPolityId}
          />
        </div>
      </div>

      <div className="lct-grid">
        <LeaderInfoCard leader={left} color={leftColor} side="left" />

        <div className="lct-center">
          <div className="lct-panel">
            <div className="lct-panel-title-row">
              <div className="lct-panel-title">生卒时间轴</div>
              <div className="lct-scale-toggle" role="group" aria-label="时间轴缩放模式">
                <button
                  type="button"
                  className={`lct-scale-btn ${scaleMode === 'absolute' ? 'active' : ''}`}
                  onClick={() => setScaleMode('absolute')}
                >
                  绝对时间
                </button>
                <button
                  type="button"
                  className={`lct-scale-btn ${scaleMode === 'relative' ? 'active' : ''}`}
                  onClick={() => setScaleMode('relative')}
                >
                  相对长度
                </button>
              </div>
            </div>
            <div className="lct-axis">
              <div className="lct-axis-label">
                {scaleMode === 'absolute' ? yearLabelFromDate(new Date(axis.minMs)) : '起点对齐'}
              </div>
              <div className="lct-axis-line" />
              <div className="lct-axis-label">
                {scaleMode === 'absolute' ? yearLabelFromDate(new Date(axis.maxMs)) : '跨度对比'}
              </div>
            </div>
            <div className="lct-lines">
              <TimelineBar
                leader={left}
                color={leftColor}
                minMs={axis.minMs}
                maxMs={axis.maxMs}
                start={lifeLeftStart}
                end={lifeLeftEnd}
                kind="life"
                scaleMode={scaleMode}
                maxDurationYears={maxLifeDur}
              />
              <TimelineBar
                leader={right}
                color={rightColor}
                minMs={axis.minMs}
                maxMs={axis.maxMs}
                start={lifeRightStart}
                end={lifeRightEnd}
                kind="life"
                scaleMode={scaleMode}
                maxDurationYears={maxLifeDur}
              />
            </div>
          </div>

          <div className="lct-panel">
            <div className="lct-panel-title">在位时间轴</div>
            <div className="lct-axis">
              <div className="lct-axis-label">
                {scaleMode === 'absolute' ? yearLabelFromDate(new Date(axis.minMs)) : '起点对齐'}
              </div>
              <div className="lct-axis-line" />
              <div className="lct-axis-label">
                {scaleMode === 'absolute' ? yearLabelFromDate(new Date(axis.maxMs)) : '跨度对比'}
              </div>
            </div>
            <div className="lct-lines">
              {reignLeftSegs.length > 0 ? (
                scaleMode === 'relative' ? (
                  <DurationBar
                    leader={left}
                    color={leftColor}
                    lenYears={reignDurLeft}
                    kind="reign"
                    maxDurationYears={maxReignDur}
                  />
                ) : (
                  <MultiSegmentBar
                    leader={left}
                    color={leftColor}
                    minMs={axis.minMs}
                    maxMs={axis.maxMs}
                    segs={reignLeftSegs}
                    kind="reign"
                  />
                )
              ) : (
                <div className="lct-line lct-line-missing">被对比方暂无在位时间数据</div>
              )}

              {reignRightSegs.length > 0 ? (
                scaleMode === 'relative' ? (
                  <DurationBar
                    leader={right}
                    color={rightColor}
                    lenYears={reignDurRight}
                    kind="reign"
                    maxDurationYears={maxReignDur}
                  />
                ) : (
                  <MultiSegmentBar
                    leader={right}
                    color={rightColor}
                    minMs={axis.minMs}
                    maxMs={axis.maxMs}
                    segs={reignRightSegs}
                    kind="reign"
                  />
                )
              ) : (
                <div className="lct-line lct-line-missing">对比方暂无在位时间数据</div>
              )}
            </div>
          </div>

          <div className="lct-panel">
            <div className="lct-panel-title">八维评分叠加</div>
            <div className="lct-total-row" aria-label="综合评分对比">
              <div className="lct-total-side" style={{ '--lct-total-color': leftColor }}>
                <div className="lct-total-name">{left?.name || '被对比方'}</div>
                <div className="lct-total-score">
                  <span className="lct-total-num">{Number.isFinite(leftTotal) ? leftTotal : '—'}</span>
                  <span className="lct-total-den">/100</span>
                </div>
                <div className="lct-total-bar" aria-hidden="true">
                  <div
                    className="lct-total-fill"
                    style={{ width: `${Number.isFinite(leftTotal) ? leftTotal : 0}%` }}
                  />
                </div>
              </div>

              <div className="lct-total-vs">VS</div>

              <div className="lct-total-side align-right" style={{ '--lct-total-color': rightColor }}>
                <div className="lct-total-name">{right?.name || '对比方'}</div>
                <div className="lct-total-score">
                  <span className="lct-total-num">{Number.isFinite(rightTotal) ? rightTotal : '—'}</span>
                  <span className="lct-total-den">/100</span>
                </div>
                <div className="lct-total-bar" aria-hidden="true">
                  <div
                    className="lct-total-fill"
                    style={{ width: `${Number.isFinite(rightTotal) ? rightTotal : 0}%` }}
                  />
                </div>
              </div>
            </div>
            <CompareRadar
              left={left}
              right={right}
              leftColor={leftColor}
              rightColor={rightColor}
            />
          </div>
        </div>

        <LeaderInfoCard leader={right} color={rightColor} side="right" />
      </div>

      <div className="lct-summary-grid" aria-label="总结对比">
        <div className="lct-summary" style={{ borderColor: withOpacity(leftColor, 0.35) }}>
          <div className="lct-summary-title" style={{ color: leftColor }}>
            总结（{left?.name || '被对比方'}）
          </div>
          <div className="lct-summary-text"><AnnotatedText text={left?.summary || '—'} /></div>
        </div>
        <div className="lct-summary" style={{ borderColor: withOpacity(rightColor, 0.35) }}>
          <div className="lct-summary-title" style={{ color: rightColor }}>
            总结（{right?.name || '对比方'}）
          </div>
          <div className="lct-summary-text"><AnnotatedText text={right?.summary || '—'} /></div>
        </div>
      </div>
    </section>
  )
}
