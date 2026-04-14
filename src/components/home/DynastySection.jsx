import { Link } from 'react-router-dom'
import LeaderCard from './LeaderCard'
import { formatYearRangeOngoing, calculateDuration } from '../../utils/yearFormat'
import { withOpacity } from '../../utils/colorUtils'
import './DynastySection.css'

export default function DynastySection({ dynasty, index }) {
  const delay = Math.min(index * 0.1, 0.5)
  const kind = dynasty.kind || 'dynasty'
  const detailPath = kind === 'regional' ? `/regional/${dynasty.id}` : `/dynasty/${dynasty.id}`
  const detailLabel = kind === 'regional' ? '政权详情' : '朝代详情'

  return (
    <section
      className="dynasty-section"
      style={{ animationDelay: `${delay}s` }}
      id={`dynasty-${dynasty.id}`}
    >
      <div className="dynasty-header">
        <div
          className="dynasty-badge"
          style={{ background: `linear-gradient(135deg, ${dynasty.color}, ${withOpacity(dynasty.color, 0.6)})` }}
        >
          {dynasty.name.charAt(0)}
        </div>
        <div className="dynasty-info">
          <h2 className="dynasty-name">{dynasty.fullName}</h2>
          <div className="dynasty-meta">
            <span>📅 {formatYearRangeOngoing(dynasty.startYear, dynasty.endYear)}</span>
            <span>⏱ {calculateDuration(dynasty.startYear, dynasty.endYear)}年</span>
            <span>🏰 {dynasty.capital}</span>
          </div>
        </div>
        <Link
          to={detailPath}
          className="dynasty-detail-btn btn btn-outline"
        >
          {detailLabel}
        </Link>
      </div>

      {dynasty.description && (
        <p className="dynasty-desc">{dynasty.description}</p>
      )}

      <div className="dynasty-leaders-grid">
        {dynasty.leaderData.map((leader, i) => (
          <LeaderCard
            key={leader.id}
            leader={leader}
            dynastyColor={dynasty.color}
            index={i}
          />
        ))}
        {dynasty.leaderData.length === 0 && (
          <p style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic', padding: 'var(--space-md)' }}>
            暂无统治者数据，等待填充...
          </p>
        )}
      </div>
    </section>
  )
}
