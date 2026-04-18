import { useEffect, useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDynasties, useFamilies } from '../../hooks/useDynasties'
import { useRegionalRegimes } from '../../hooks/useRegionalRegime'
import { useHistoricalEvents } from '../../hooks/useHistoricalEvents'
import { useSearchVisibility } from '../../context/SearchVisibilityContext'
import { getLeaderImageSrc } from '../../utils/leaderImage'
import { getFamilyBadgeText } from '../../utils/familyBadge'
import { getLeaderShortTitle } from '../../utils/leaderTitle'
import { inlineMarkupInitial, inlineMarkupToPlain } from '../../utils/inlineMarkup'
import AnnotatedText from '../common/AnnotatedText'
import LeaderCard from './LeaderCard'
import DynastySection from './DynastySection'
import './HomePage.css'

function pickRandomItems(items, count, seed) {
  if (!Array.isArray(items) || items.length === 0) return []
  const result = []
  const used = new Set()
  let t = Math.max(0.00001, Math.min(0.99999, seed))

  for (let i = 0; i < Math.min(count, items.length); i++) {
    t = (t * 9301 + 49297) % 233280
    const r = t / 233280
    let idx = Math.floor(r * items.length)
    while (used.has(idx) && used.size < items.length) {
      idx = (idx + 1) % items.length
    }
    used.add(idx)
    result.push(items[idx])
  }
  return result
}

export default function HomePage() {
  const { dynasties, loading } = useDynasties()
  const regionalRegimes = useRegionalRegimes()
  const { families } = useFamilies()
  const eventsLibrary = useHistoricalEvents()
  const [seed] = useState(() => Math.random())
  const { setHomeSearchVisible } = useSearchVisibility()
  const searchRef = useRef(null)
  const [featuredImgFailed, setFeaturedImgFailed] = useState({})

  const [search, setSearch] = useState('')

  useEffect(() => {
    if (loading) return
    const raw = sessionStorage.getItem('homeScrollRestoreY')
    if (!raw) return
    sessionStorage.removeItem('homeScrollRestoreY')
    const y = Number(raw)
    if (!Number.isFinite(y) || y < 0) return
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: 'auto' })
    })
  }, [loading])

  useEffect(() => {
    const el = searchRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setHomeSearchVisible(Boolean(entry?.isIntersecting)),
      { root: null, threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [setHomeSearchVisible])

  const polities = useMemo(() => {
    const central = dynasties.map(d => ({ ...d, kind: 'dynasty' }))
    const regional = regionalRegimes.map(r => ({ ...r, kind: 'regional' }))
    return [...central, ...regional]
  }, [dynasties, regionalRegimes])

  const polityById = useMemo(() => {
    const map = new Map()
    polities.forEach(p => map.set(p.id, p))
    return map
  }, [polities])

  const allLeaders = useMemo(() => {
    const seen = new Set()
    const out = []
    polities.forEach(p => {
      ; (p.leaderData || []).forEach(l => {
        if (l?.id && !seen.has(l.id)) {
          seen.add(l.id)
          out.push(l)
        }
      })
    })
    return out
  }, [polities])

  function getLeaderThemeColor(leader) {
    if (!leader) return '#c9a96e'
    const customColor = typeof leader.color === 'string' ? leader.color.trim() : ''
    if (customColor) return customColor
    const polity = polityById.get(leader.dynastyId)
    return polity?.color || '#c9a96e'
  }

  const featuredLeaders = useMemo(
    () => pickRandomItems(allLeaders, 3, seed + 0.13),
    [allLeaders, seed]
  )

  const events = useMemo(
    () => pickRandomItems(eventsLibrary, 4, seed + 0.37),
    [eventsLibrary, seed]
  )

  const filteredPolities = useMemo(() => {
    const raw = search.trim()
    if (!raw) return polities
    const q = raw.toLowerCase()
    const match = s => inlineMarkupToPlain(s).toLowerCase().includes(q)

    return polities
      .map(p => ({
        ...p,
        leaderData: (p.leaderData || []).filter(l =>
          match(l.name) ||
          match(l.templeName) ||
          match(l.eraName) ||
          match(l.birthplace)
        ),
      }))
      .filter(p => p.leaderData.length > 0 || match(p.name) || match(p.fullName))
  }, [polities, search])

  const totalLeaders = allLeaders.length

  const filteredLeaders = useMemo(() => {
    const raw = search.trim()
    if (!raw) return []
    const q = raw.toLowerCase()
    const match = s => inlineMarkupToPlain(s).toLowerCase().includes(q)

    return allLeaders.filter(l =>
      match(l.name) ||
      match(l.templeName) ||
      match(l.eraName) ||
      match(l.birthplace)
    )
  }, [allLeaders, search])

  if (loading) {
    return (
      <div className="home-page">
        <div className="hero">
          <div className="container">
            <h1 className="hero-title">载入中...</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="home-page" id="home-page">
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">五帝三皇神圣事</h1>
          <div className="hero-subtitle" style={{
            margin: 'var(--space-2xl) auto var(--space-2xl)',
            padding: 'var(--space-md) clamp(10px, 3vw, var(--space-xl))',
            maxWidth: '680px',
            borderTop: '1px dashed var(--color-border)',
            borderBottom: '1px dashed var(--color-border)',
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', background: 'transparent', fontSize: '2rem', color: 'var(--color-gold-light)', lineHeight: '1', fontFamily: 'var(--font-serif)' }}>
              ❝
            </div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(0.88rem, 4.5vw, 1.25rem)', lineHeight: '2.2', color: 'var(--color-text-primary)', textAlign: 'center', margin: 'var(--space-lg) 0 var(--space-sm) 0', whiteSpace: 'nowrap' }}>
              五帝三皇神圣事，骗了无涯过客。<br/>
              有多少风流人物？<br/>
              盗跖庄蹻流誉后，更陈王奋起挥黄钺。<br/>
              歌未竟，东方白。
            </p>
            <div style={{ textAlign: 'right', fontSize: 'clamp(0.75rem, 3.8vw, 1.05rem)', color: 'var(--color-gold)', fontFamily: 'var(--font-serif)', whiteSpace: 'nowrap' }}>
              —— <Link to="/leader/mao_zedong" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationThickness: '0.7px' }}>毛泽东</Link>《贺新郎·读史》
            </div>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">{polities.length}</div>
              <div className="hero-stat-label">朝代/政权</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">{totalLeaders}</div>
              <div className="hero-stat-label">执政者</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">4000+</div>
              <div className="hero-stat-label">年历史跨度</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="home-search" ref={searchRef}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="搜索执政者姓名、庙号、年号或祖籍..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="leader-search"
          />
        </div>

        {!search.trim() && (
          <section className="home-panels" aria-label="首页导航与推荐">
            <div className="home-panel">
              <div className="panel-title-row">
                <h2 className="panel-title">推荐人物</h2>
                <Link to="/timeline" className="panel-link">去时间线 →</Link>
              </div>
              {featuredLeaders.length > 0 ? (
                <div className="featured-grid">
                  {featuredLeaders.map(leader => {
                    const imageSrc = getLeaderImageSrc(leader)
                    const showImage = imageSrc && !featuredImgFailed[leader.id]
                    return (
                      <Link
                        key={leader.id}
                        to={`/leader/${leader.id}`}
                        className="featured-leader"
                        style={{ '--featured-color': getLeaderThemeColor(leader) }}
                      >
                        <div className="featured-leader-badge">
                          {showImage ? (
                            <img
                              src={imageSrc}
                              alt={inlineMarkupToPlain(leader.name)}
                              className="featured-leader-avatar-img"
                              loading="lazy"
                              onError={() => {
                                setFeaturedImgFailed(prev => ({ ...prev, [leader.id]: true }))
                              }}
                            />
                          ) : (
                            inlineMarkupInitial(leader.name)
                          )}
                        </div>
                        <div className="featured-leader-info">
                          <div className="featured-leader-name">
                            <AnnotatedText text={leader.name} />
                            {leader.templeName && (
                              <span className="featured-leader-tag"><AnnotatedText text={leader.templeName} /></span>
                            )}
                          </div>
                          <div className="featured-leader-sub">
                            {getLeaderShortTitle(leader) || '执政者'}
                            {typeof leader?.factionTag === 'string' && leader.factionTag.trim()
                              ? ` · ${leader.factionTag.trim()}`
                              : ''}
                            {leader.reignStart != null && leader.reignEnd != null
                              ? ` · ${leader.reignStart}—${leader.reignEnd}`
                              : ''}
                          </div>
                          {leader.summary && (
                            <div className="featured-leader-desc">
                              <AnnotatedText text={leader.summary} />
                            </div>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="panel-empty">暂无人物数据</div>
              )}
            </div>

            <div className="home-panel">
              <h2 className="panel-title">快速入口</h2>
              <div className="quick-links">
                <Link to="/timeline" className="quick-link">时间线</Link>
                <Link to="/map" className="quick-link">地图</Link>
                <Link to="/tools" className="quick-link">工具</Link>
                <Link to="/about" className="quick-link">关于</Link>
              </div>

              <h2 className="panel-title" style={{ marginTop: 'var(--space-lg)' }}>历史事件</h2>
              <div className="event-list">
                {events.map(evt => (
                  <Link key={evt.id} className="event-item" to={`/event/${evt.id}`}>
                    <div className="event-year">{evt.year}</div>
                    <div className="event-body">
                      <div className="event-name"><AnnotatedText text={evt.name} /></div>
                      <div className="event-desc"><AnnotatedText text={evt.summary || evt.impact || ''} /></div>
                    </div>
                  </Link>
                ))}
                {events.length === 0 && (
                  <div className="panel-empty">暂无事件数据</div>
                )}
              </div>
            </div>
          </section>
        )}

        {search.trim() ? (
          <section className="search-results" aria-label="搜索结果">
            <div className="panel-title-row" style={{ marginTop: 'var(--space-xl)' }}>
              <h2 className="panel-title" style={{ marginBottom: 0 }}>搜索结果</h2>
              <span className="panel-link" style={{ pointerEvents: 'none' }}>
                人物 {filteredLeaders.length} · 朝代/政权 {filteredPolities.length}
              </span>
            </div>

            <div className="dynasty-list">
              {filteredPolities.map((dynasty, i) => (
                <DynastySection
                  key={dynasty.id}
                  dynasty={dynasty}
                  index={i}
                />
              ))}
              {filteredPolities.length === 0 && (
                <div className="panel-empty">未找到匹配的朝代/政权或人物</div>
              )}
            </div>
          </section>
        ) : (
          <section className="home-discover" aria-label="随便看看">
            <div className="panel-title-row">
              <h2 className="panel-title" style={{ marginBottom: 0 }}>随便看看</h2>
              <Link to="/timeline" className="panel-link">更多 →</Link>
            </div>
            <div className="search-leaders-grid">
              {pickRandomItems(allLeaders, 6, seed + 0.77).map((leader, i) => (
                <LeaderCard
                  key={leader.id}
                  leader={leader}
                  dynastyColor={getLeaderThemeColor(leader)}
                  index={i}
                />
              ))}
              {allLeaders.length === 0 && (
                <div className="panel-empty">暂无人物数据</div>
              )}
            </div>
          </section>
        )}

        {!search.trim() && families && families.length > 0 && (
          <section
            id="home-families"
            className="home-families"
            aria-label="执政者家族"
            style={{ marginTop: 'var(--space-2xl)', paddingBottom: 'var(--space-xl)' }}
          >
            <div className="panel-title-row">
              <h2 className="panel-title">历史家族</h2>
              <Link to="/map" className="panel-link">去地图查看发迹地 →</Link>
            </div>
            <div className="search-leaders-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {families.map(fam => (
                <Link
                  key={fam.id}
                  to={`/family/${fam.id}`}
                  className="featured-leader"
                  style={{ '--featured-color': fam.color || '#8c7a52', height: '100%' }}
                  onClick={() => {
                    sessionStorage.setItem('homeScrollRestoreY', String(window.scrollY))
                  }}
                >
                  <div className="featured-leader-badge">
                    {getFamilyBadgeText(fam).length === 4 ? (
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px',
                        fontSize: '1.05rem', lineHeight: 1, padding: '0', margin: 'auto',
                        fontFamily: 'var(--font-serif)', fontWeight: 900, letterSpacing: 0
                      }}>
                        {getFamilyBadgeText(fam).split('').map((c, i) => <span key={i} style={{ textAlign: 'center' }}>{c}</span>)}
                      </div>
                    ) : (
                      getFamilyBadgeText(fam)
                    )}
                  </div>
                    <div className="featured-leader-info">
                      <div className="featured-leader-name">
                        <AnnotatedText text={fam.name} />
                      </div>
                      <div className="featured-leader-sub" style={{ marginTop: 4 }}>
                        发迹地：<AnnotatedText text={fam.ancestralHome || '未知'} />
                      {fam.leaderData?.length > 0 ? ` · ${fam.leaderData.length} 位相关人物` : ''}
                      </div>
                    {fam.description && (
                      <div className="featured-leader-desc" style={{ marginTop: 8, opacity: 0.85 }}>
                        <AnnotatedText text={fam.description} />
                      </div>
                    )}
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
