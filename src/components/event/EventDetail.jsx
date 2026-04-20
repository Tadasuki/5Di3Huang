import { Link, useParams } from 'react-router-dom'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { useHistoricalEvent, useHistoricalEvents } from '../../hooks/useHistoricalEvents'
import { useAllLeaders } from '../../hooks/useDynasties'
import { inlineMarkupInitial } from '../../utils/inlineMarkup'
import LeaderCard from '../home/LeaderCard'
import AnnotatedText from '../common/AnnotatedText'
import './EventDetail.css'

const CANDLE_COUNTER_API = 'https://api.countapi.xyz'
const CANDLE_COUNTER_NAMESPACE = '5di3huang-candle'

function localCandleKey(eventId) {
  return `event-candle-count:${String(eventId || '')}`
}

function safeLocalGet(eventId) {
  try {
    const raw = localStorage.getItem(localCandleKey(eventId))
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null
  } catch {
    return null
  }
}

function safeLocalSet(eventId, value) {
  try {
    localStorage.setItem(localCandleKey(eventId), String(value))
  } catch {
    // ignore local storage failures
  }
}

async function getRemoteCandleCount(eventId) {
  const key = encodeURIComponent(String(eventId || '').trim())
  if (!key) return null
  const res = await fetch(`${CANDLE_COUNTER_API}/get/${CANDLE_COUNTER_NAMESPACE}/${key}`)
  if (res.status === 404) return 0
  if (!res.ok) throw new Error('Failed to fetch candle count')
  const data = await res.json()
  const value = Number(data?.value)
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
}

async function hitRemoteCandleCount(eventId) {
  const key = encodeURIComponent(String(eventId || '').trim())
  if (!key) return null
  const res = await fetch(`${CANDLE_COUNTER_API}/hit/${CANDLE_COUNTER_NAMESPACE}/${key}`)
  if (!res.ok) throw new Error('Failed to hit candle count')
  const data = await res.json()
  const value = Number(data?.value)
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : null
}

export default function EventDetail() {
  const { id } = useParams()
  const event = useHistoricalEvent(id)
  const events = useHistoricalEvents()
  const leaders = useAllLeaders()
  const [candleCount, setCandleCount] = useState(0)
  const [candleSyncing, setCandleSyncing] = useState(false)

  const isMemorialEvent = event?.type === '惨案'
  const isMemorialLit = !isMemorialEvent || candleCount > 0

  useEffect(() => {
    if (!isMemorialEvent || !event?.id) {
      setCandleCount(0)
      return
    }

    const cached = safeLocalGet(event.id)
    if (cached != null) setCandleCount(cached)
    else setCandleCount(0)

    let cancelled = false
    getRemoteCandleCount(event.id)
      .then((count) => {
        if (cancelled || count == null) return
        setCandleCount(count)
        safeLocalSet(event.id, count)
      })
      .catch(() => {
        // keep showing cached/local count on failure
      })

    return () => {
      cancelled = true
    }
  }, [event?.id, isMemorialEvent])

  const handleCandleClick = useCallback(async () => {
    if (!event?.id || candleSyncing) return
    setCandleSyncing(true)
    try {
      const next = await hitRemoteCandleCount(event.id)
      if (next != null) {
        setCandleCount(next)
        safeLocalSet(event.id, next)
        return
      }
      throw new Error('Invalid candle count')
    } catch {
      const fallback = candleCount + 1
      setCandleCount(fallback)
      safeLocalSet(event.id, fallback)
    } finally {
      setCandleSyncing(false)
    }
  }, [event?.id, candleSyncing, candleCount])

  const leaderList = useMemo(() => {
    if (!event?.leaderIds?.length) return []
    const map = new Map(leaders.map(l => [l.id, l]))
    return event.leaderIds.map(x => map.get(x)).filter(Boolean)
  }, [event?.leaderIds, leaders])

  const sameTypeEvents = useMemo(() => {
    if (!event?.type) return []
    return events
      .filter(e => e?.type === event.type)
      .slice()
      .sort((a, b) => (a.year ?? 0) - (b.year ?? 0))
  }, [event?.type, events])

  if (!event) {
    return (
      <div className="event-detail">
        <div className="container event-not-found">
          <h2>未找到该事件</h2>
          <p>可在 <code>data/historical_events.json</code> 中补充事件条目。</p>
          <p style={{ marginTop: 'var(--space-md)' }}>
            <Link to="/" className="btn btn-primary">返回首页</Link>
            {' '}
            <Link to="/timeline" className="btn btn-outline">时间线</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`event-detail${isMemorialEvent ? ' event-detail-memorial' : ''}${isMemorialEvent && !isMemorialLit ? ' event-detail-memorial-muted' : ''}${isMemorialEvent && isMemorialLit ? ' event-detail-memorial-lit' : ''}`}
      id={`event-detail-${event.id}`}
    >
      <div className="container">
        <header className="event-header">
          <div className="event-badge">{inlineMarkupInitial(event.name)}</div>
          <div className="event-header-main">
            <h1 className="event-title"><AnnotatedText text={event.name} /></h1>
            <div className="event-meta">
              <span>📅 {event.year}</span>
              {event.location && (
                <Link to={`/map?event=${event.id}`} className="location-link tag-clickable" title="在地图中定位该地点">
                  📍 <AnnotatedText text={event.location} /> <span className="jump-icon">↗</span>
                </Link>
              )}
              {event.type && (
                <Link to={`/events/type/${encodeURIComponent(event.type)}`} className="event-type-tag tag-clickable">
                  🏷 <AnnotatedText text={event.type} /> <span className="jump-icon">↗</span>
                </Link>
              )}
            </div>
            {event.summary && <p className="event-summary"><AnnotatedText text={event.summary} /></p>}
          </div>
          {isMemorialEvent && (
            <aside className="event-memorial-aside" aria-label="遇难者纪念">
              <div className="event-memorial-stat">
                <div className="event-memorial-value">300000+</div>
                <div className="event-memorial-label">遇难者</div>
              </div>
              <div className="event-candle-wrap">
                <button
                  type="button"
                  className="event-candle-btn"
                  onClick={handleCandleClick}
                  title="点亮蜡烛"
                  aria-label="点亮蜡烛纪念遇难者"
                  disabled={candleSyncing}
                >
                  🕯️
                </button>
                <span className="event-candle-count">{candleCount}</span>
              </div>
            </aside>
          )}
        </header>

        <section className="event-section" aria-labelledby="event-impact-heading">
          <h2 id="event-impact-heading" className="event-section-title">影响</h2>
          <p className="event-text"><AnnotatedText text={event.impact || '暂无影响描述。'} /></p>
        </section>

        <section className="event-section" aria-labelledby="event-people-heading">
          <h2 id="event-people-heading" className="event-section-title">相关领导人</h2>
          <div className="event-leaders">
            {leaderList.map((leader, i) => (
              <LeaderCard
                key={leader.id}
                leader={leader}
                dynastyColor="#c9a96e"
                index={i}
              />
            ))}
            {leaderList.length === 0 && (
              <p className="event-empty">暂无关联人物（可在事件条目中补充 leaderIds）。</p>
            )}
          </div>
        </section>

        {sameTypeEvents.length > 1 && (
          <section className="event-section" aria-labelledby="event-same-type-heading">
            <h2 id="event-same-type-heading" className="event-section-title">
              同类事件：<AnnotatedText text={event.type} />
            </h2>
            <div className="event-timeline-container">
              {sameTypeEvents.map(e => (
                <Link
                  key={e.id}
                  to={`/event/${e.id}`}
                  className={`event-timeline-item ${e.id === event.id ? 'active' : ''}`}
                >
                  <div className="event-timeline-marker" />
                  <div className="event-timeline-content">
                    <div className="event-timeline-date">
                      {e.year < 0 ? `公元前${Math.abs(e.year)}年` : `${e.year}年`}
                    </div>
                    <div className="event-timeline-name"><AnnotatedText text={e.name} /></div>
                    <div className="event-timeline-desc">
                      {e.location && <span>📍 <AnnotatedText text={e.location} /> · </span>}
                      <AnnotatedText text={e.summary || e.impact || ''} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
