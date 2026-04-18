import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useDynasty } from '../../hooks/useDynasties'
import { useDynasties } from '../../hooks/useDynasties'
import LeaderCard from '../home/LeaderCard'
import { formatYearRangeOngoing, calculateDuration } from '../../utils/yearFormat'
import { withOpacity } from '../../utils/colorUtils'
import AnnotatedText from '../common/AnnotatedText'
import './DynastyDetail.css'

// 引入割据政权数据，以便在需要时建立跨表跳转联系
const regionalModules = import.meta.glob('/data/regional_regimes.json', { eager: true })
function getRegionalList() {
  const path = Object.keys(regionalModules)[0]
  if (!path) return []
  const raw = regionalModules[path]?.default || regionalModules[path]
  return Array.isArray(raw) ? raw : []
}

export default function DynastyDetail() {
  const { id } = useParams()
  const { dynasty, loading } = useDynasty(id)
  const { dynasties } = useDynasties()
  const color = dynasty?.color || '#c9a96e'

  const { prevDynasty, nextDynasties } = useMemo(() => {
    const list = (dynasties || [])
      .filter(d => d && d.id && d.startYear != null)
      .slice()
      .sort((a, b) => (a.startYear ?? 999999) - (b.startYear ?? 999999))
    const idx = list.findIndex(d => String(d.id) === String(id))

    const prev = idx > 0 ? list[idx - 1] : null
    const nexts = []

    if (idx >= 0 && idx < list.length - 1) {
      nexts.push({
        ...list[idx + 1],
        routeType: 'dynasty',
        groupLabel: id === 'roc' ? '大陆' : null
      })
    }

    // 针对“中华民国”页面，手动追加一个通往“台湾”政权的分支跳转
    if (id === 'roc') {
      const regList = getRegionalList()
      const rocTaiwan = regList.find(r => r.id === 'roc_taiwan')
      if (rocTaiwan) {
        nexts.push({
          ...rocTaiwan,
          routeType: 'regional',
          groupLabel: '台湾'
        })
      }
    }

    return {
      prevDynasty: prev,
      nextDynasties: nexts,
    }
  }, [dynasties, id])

  if (loading) {
    return (
      <div className="dynasty-detail">
        <div className="container">
          <div className="dynasty-detail-loading">载入中...</div>
        </div>
      </div>
    )
  }

  if (!dynasty) {
    return (
      <div className="dynasty-detail">
        <div className="container dynasty-detail-not-found">
          <h2>未找到该朝代</h2>
          <p>资料库中尚未收录该政权，或链接有误。</p>
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
    <div className="dynasty-detail" id={`dynasty-detail-${dynasty.id}`}>
      <div className="container">
        <header
          className="dynasty-detail-header"
          style={{ '--dynasty-color': color }}
        >
          <div
            className="dynasty-detail-badge"
            style={{
              background: `linear-gradient(135deg, ${color}, ${withOpacity(color, 0.55)})`,
            }}
          >
            {dynasty.name.charAt(0)}
          </div>
          <div className="dynasty-detail-intro">
            <h1 className="dynasty-detail-title">{dynasty.fullName}</h1>
            <div className="dynasty-detail-meta">
              <span>📅 {formatYearRangeOngoing(dynasty.startYear, dynasty.endYear)}</span>
              <span>⏱ {calculateDuration(dynasty.startYear, dynasty.endYear)}年</span>
              {dynasty.capital && (
                <Link
                  to={`/map?polity=${dynasty.id}`}
                  className="location-link tag-clickable"
                  title="在地图中定位该都城"
                >
                  🏰 {dynasty.capital} <span className="jump-icon">↗</span>
                </Link>
              )}
            </div>
            {dynasty.description && (
              <p className="dynasty-detail-desc"><AnnotatedText text={dynasty.description} /></p>
            )}
          </div>
        </header>

        <section aria-labelledby="dynasty-leaders-heading">
          <h2 id="dynasty-leaders-heading" className="dynasty-detail-section-title">
            执政者
          </h2>
          <div className="dynasty-detail-leaders">
            {dynasty.leaderData.map((leader, i) => (
              <LeaderCard
                key={leader.id}
                leader={leader}
                dynastyColor={color}
                index={i}
              />
            ))}
            {dynasty.leaderData.length === 0 && (
              <p className="dynasty-detail-empty">暂无执政者条目，可在「data/leaders/{dynasty.id}/」下添加 JSON。</p>
            )}
          </div>
        </section>

        {(prevDynasty || (nextDynasties && nextDynasties.length > 0)) && (
          <nav className="detail-prev-next" aria-label="上一时期与下一时期">
            <div className="detail-prev-next-col">
              {prevDynasty ? (
                <Link to={`/dynasty/${prevDynasty.id}`} className="detail-prev-next-card">
                  <div className="detail-prev-next-k">上一时期</div>
                  <div className="detail-prev-next-v">{prevDynasty.fullName || prevDynasty.name}</div>
                </Link>
              ) : (
                <div className="detail-prev-next-spacer" />
              )}
            </div>

            <div className="detail-prev-next-col align-right">
              {nextDynasties && nextDynasties.length > 0 ? (
                nextDynasties.map(n => (
                  <Link
                    key={n.id}
                    to={`/${n.routeType || 'dynasty'}/${n.id}`}
                    className="detail-prev-next-card align-right"
                  >
                    <div className="detail-prev-next-k">
                      下一时期
                      {nextDynasties.length > 1 && n.groupLabel ? (
                        <span className="detail-prev-next-sub"> · {n.groupLabel}</span>
                      ) : null}
                    </div>
                    <div className="detail-prev-next-v">{n.fullName || n.name}</div>
                  </Link>
                ))
              ) : (
                <div className="detail-prev-next-spacer" />
              )}
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}
