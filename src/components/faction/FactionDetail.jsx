import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useAllLeaders } from '../../hooks/useDynasties'
import { useFactions } from '../../hooks/useFactions'
import LeaderCard from '../home/LeaderCard'
import { withOpacity } from '../../utils/colorUtils'
import './FactionDetail.css'

export default function FactionDetail() {
  const { id } = useParams()
  const leaders = useAllLeaders()
  const { factionById } = useFactions()

  const faction = factionById.get(String(id)) ?? null
  const color = faction?.color || '#c9a96e'

  const members = useMemo(() => {
    if (!id) return []
    return (leaders || [])
      .filter(l => String(l?.factionId || '') === String(id))
      .slice()
      .sort((a, b) => (a.reignStart ?? 999999) - (b.reignStart ?? 999999))
  }, [leaders, id])

  if (!faction) {
    return (
      <div className="faction-detail">
        <div className="container faction-not-found">
          <h2>未找到该阵营</h2>
          <p>可在 <code>data/factions.json</code> 中补充阵营条目。</p>
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
    <div className="faction-detail" id={`faction-detail-${faction.id}`}>
      <div className="container">
        <div className="faction-detail-nav">
          <Link to="/" className="faction-detail-back">← 首页</Link>
          <Link to="/timeline" className="faction-detail-back">时间线</Link>
        </div>

        <header className="faction-detail-header" style={{ '--faction-color': color }}>
          <div
            className="faction-detail-badge"
            style={{ background: `linear-gradient(135deg, ${color}, ${withOpacity(color, 0.55)})` }}
          >
            {(faction.shortName || faction.name || '阵').charAt(0)}
          </div>
          <div className="faction-detail-intro">
            <p className="faction-detail-label">{faction.category || '阵营'}</p>
            <h1 className="faction-detail-title">{faction.name}</h1>
            {faction.description && (
              <p className="faction-detail-desc">{faction.description}</p>
            )}
            <div className="faction-detail-meta">
              <span>👥 成员 {members.length} 人</span>
            </div>
          </div>
        </header>

        <section aria-labelledby="faction-members-heading">
          <h2 id="faction-members-heading" className="faction-detail-section-title">
            同阵营人物
          </h2>
          <div className="faction-detail-leaders">
            {members.map((leader, i) => (
              <LeaderCard
                key={leader.id}
                leader={leader}
                dynastyColor={color}
                index={i}
              />
            ))}
            {members.length === 0 && (
              <p className="faction-detail-empty">
                暂无成员。可在人物 JSON 中添加 <code>factionId</code> 指向该阵营。
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

