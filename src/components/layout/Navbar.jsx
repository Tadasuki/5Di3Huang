import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchVisibility } from '../../context/SearchVisibilityContext'
import { useSearchIndex } from '../../hooks/useSearchIndex'
import { getLeaderImageSrc } from '../../utils/leaderImage'
import { withOpacity } from '../../utils/colorUtils'
import './Navbar.css'

const navItems = [
  { path: '/', label: '主页', icon: '🏛' },
  { path: '/events', label: '事件', icon: '🧭' },
  { path: '/timeline', label: '时间线', icon: '📜' },
  { path: '/map', label: '地图', icon: '🗺' },
  { path: '/tools', label: '工具', icon: '⚙' },
  { path: '/about', label: '关于', icon: 'ℹ' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { homeSearchVisible } = useSearchVisibility()
  const { dynasties, regional, leaders, events } = useSearchIndex()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const isComposingRef = useRef(false)

  const showNavSearch = useMemo(() => {
    if (location.pathname !== '/') return true
    return !homeSearchVisible
  }, [homeSearchVisible, location.pathname])

  const polityMap = useMemo(() => {
    const m = new Map()
    dynasties.forEach(d => m.set(d.id, d))
    regional.forEach(r => m.set(r.id, r))
    return m
  }, [dynasties, regional])

  const suggestions = useMemo(() => {
    const raw = q.trim()
    if (!raw) return []
    const query = raw.toLowerCase()
    const match = s => (typeof s === 'string' ? s.toLowerCase().includes(query) : false)

    const leaderHits = leaders
      .filter(l => match(l.name) || match(l.templeName) || match(l.eraName) || match(l.birthplace))
      .slice(0, 6)
      .map(l => ({ type: 'leader', id: l.id, title: l.name, subtitle: l.templeName || l.title || '人物', data: l }))

    const eventHits = events
      .filter(e => match(e.name) || match(e.location) || match(e.summary) || match(e.impact))
      .slice(0, 4)
      .map(e => ({ type: 'event', id: e.id, title: e.name, subtitle: `${e.year}${e.location ? ` · ${e.location}` : ''}`, data: e }))

    const polityHits = [...dynasties, ...regional]
      .filter(p => match(p.name) || match(p.fullName) || match(p.capital) || match(p.description))
      .slice(0, 4)
      .map(p => ({ type: p.kind === 'regional' ? 'regional' : 'dynasty', id: p.id, title: p.fullName || p.name, subtitle: p.capital || '', data: p }))

    return [...leaderHits, ...eventHits, ...polityHits].slice(0, 12)
  }, [dynasties, events, leaders, q, regional])

  useEffect(() => {
    function onDown(e) {
      if (!rootRef.current) return
      if (rootRef.current.contains(e.target)) return
      setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  function onSubmit(e) {
    e.preventDefault()
    if (isComposingRef.current) return
    if (suggestions.length > 0) {
      goTo(suggestions[0])
    } else {
      setOpen(false)
    }
  }

  function goTo(item) {
    setIsOpen(false)
    setOpen(false)
    if (!item) return
    if (item.type === 'leader') navigate(`/leader/${item.id}`)
    if (item.type === 'event') navigate(`/event/${item.id}`)
    if (item.type === 'regional') navigate(`/regional/${item.id}`)
    if (item.type === 'dynasty') navigate(`/dynasty/${item.id}`)
  }

  function leaderThemeColor(leader) {
    const customColor = typeof leader?.color === 'string' ? leader.color.trim() : ''
    if (customColor) return customColor
    const polity = leader?.dynastyId ? polityMap.get(leader.dynastyId) : null
    return polity?.color || '#c9a96e'
  }

  return (
    <nav className="navbar" id="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={() => setIsOpen(false)}>
          <div className="navbar-brand-icon">🕰️</div>
          <span className="navbar-brand-text">五帝三皇神圣事</span>
        </NavLink>

        <button 
          className="navbar-toggle" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation"
        >
          {isOpen ? '✕' : '☰'}
        </button>

        <ul className={`navbar-nav ${isOpen ? 'open' : ''}`}>
          {showNavSearch && (
            <li className="navbar-search-item" ref={rootRef}>
              <form className="navbar-search" onSubmit={onSubmit}>
                <span className="navbar-search-icon">🔎</span>
                <input
                  value={q}
                  onChange={e => {
                    setQ(e.target.value)
                    setOpen(true)
                  }}
                  onFocus={() => setOpen(true)}
                  onCompositionStart={() => { isComposingRef.current = true }}
                  onCompositionEnd={() => { isComposingRef.current = false }}
                  placeholder="搜索人物/事件/政权..."
                  aria-label="全局搜索"
                />
              </form>

              {open && q.trim() && (
                <div className="navbar-search-popover" role="listbox" aria-label="搜索建议">
                  {suggestions.length === 0 ? (
                    <div className="navbar-search-empty">无匹配结果</div>
                  ) : (
                    suggestions.map(item => {
                      if (item.type === 'leader') {
                        const l = item.data
                        const color = leaderThemeColor(l)
                        const img = getLeaderImageSrc(l)
                        return (
                          <button
                            key={`leader:${item.id}`}
                            className="search-card"
                            type="button"
                            onClick={() => goTo(item)}
                          >
                            <div
                              className="search-card-avatar"
                              style={{ background: `linear-gradient(135deg, ${color}, ${withOpacity(color, 0.5)})` }}
                            >
                              {l.name.charAt(0)}
                              {img && (
                                <img
                                  src={img}
                                  alt={l.name}
                                  loading="lazy"
                                  decoding="async"
                                  referrerPolicy="no-referrer"
                                  onError={e => { e.currentTarget.remove() }}
                                  style={{ position: 'absolute', inset: 0 }}
                                />
                              )}
                            </div>
                            <div className="search-card-main">
                              <div className="search-card-title">
                                {item.title}
                                <span className="search-card-type">人物</span>
                              </div>
                              <div className="search-card-sub">{item.subtitle}</div>
                            </div>
                          </button>
                        )
                      }

                      if (item.type === 'event') {
                        return (
                          <button
                            key={`event:${item.id}`}
                            className="search-card"
                            type="button"
                            onClick={() => goTo(item)}
                          >
                            <div className="search-card-badge event">事</div>
                            <div className="search-card-main">
                              <div className="search-card-title">
                                {item.title}
                                <span className="search-card-type">事件</span>
                              </div>
                              <div className="search-card-sub">{item.subtitle}</div>
                            </div>
                          </button>
                        )
                      }

                      const p = item.data
                      return (
                        <button
                          key={`${item.type}:${item.id}`}
                          className="search-card"
                          type="button"
                          onClick={() => goTo(item)}
                        >
                          <div
                            className="search-card-badge polity"
                            style={{ background: `linear-gradient(135deg, ${p.color || '#c9a96e'}, ${withOpacity(p.color || '#c9a96e', 0.55)})` }}
                          >
                            {(p.name || p.fullName || '政').charAt(0)}
                          </div>
                          <div className="search-card-main">
                            <div className="search-card-title">
                              {item.title}
                              <span className="search-card-type">{item.type === 'regional' ? '政权' : '朝代'}</span>
                            </div>
                            <div className="search-card-sub">{item.subtitle}</div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </li>
          )}
          {navItems.map(item => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  isActive && (item.path === '/' ? location.pathname === '/' : true) 
                    ? 'active' : ''
                }
                end={item.path === '/'}
                onClick={() => setIsOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
