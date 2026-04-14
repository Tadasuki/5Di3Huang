import { Link, useParams } from 'react-router-dom'
import { useRegionalRegime } from '../../hooks/useRegionalRegime'
import LeaderCard from '../home/LeaderCard'
import { formatYearRangeOngoing, calculateDuration } from '../../utils/yearFormat'
import { withOpacity } from '../../utils/colorUtils'
import './RegionalRegimeDetail.css'

export default function RegionalRegimeDetail() {
  const { id } = useParams()
  const { regime } = useRegionalRegime(id)
  const color = regime?.color || '#8B7355'

  if (!regime || id === 'prc_sec') {
    return (
      <div className="regional-detail">
        <div className="container regional-detail-not-found">
          <h2>未找到该政权</h2>
          <p>可在 <code>data/regional_regimes.json</code> 中补充该割据政权的条目。</p>
          <p style={{ marginTop: 'var(--space-md)' }}>
            <Link to="/timeline" className="btn btn-primary">返回时间线</Link>
            {' '}
            <Link to="/" className="btn btn-outline">首页</Link>
          </p>
        </div>
      </div>
    )
  }

  const related = regime.relatedCentralDynastyId

  return (
    <div className="regional-detail" id={`regional-detail-${regime.id}`}>
      <div className="container">
        <div className="regional-detail-nav">
          <Link to="/timeline" className="regional-detail-back">← 时间线</Link>
          <Link to="/" className="regional-detail-back">首页</Link>
        </div>

        <header
          className="regional-detail-header"
          style={{ '--regional-color': color }}
        >
          <div
            className="regional-detail-badge"
            style={{
              background: `linear-gradient(135deg, ${color}, ${withOpacity(color, 0.55)})`,
            }}
          >
            {regime.name.charAt(0)}
          </div>
          <div className="regional-detail-intro">
            <p className="regional-detail-label">割据 / 并立政权</p>
            <h1 className="regional-detail-title">{regime.fullName || regime.name}</h1>
            <div className="regional-detail-meta">
              <span>📅 {formatYearRangeOngoing(regime.startYear, regime.endYear)}</span>
              {regime.endYear != null && (
                <span>⏱ {calculateDuration(regime.startYear, regime.endYear)}年</span>
              )}
              {regime.capital && <span>🏰 {regime.capital}</span>}
            </div>
            {regime.description && (
              <p className="regional-detail-desc">{regime.description}</p>
            )}
            {related && (
              <p className="regional-detail-related">
                同段时期中央政权：
                <Link to={`/dynasty/${related}`}>查看朝代详情</Link>
              </p>
            )}
          </div>
        </header>

        <section aria-labelledby="regional-leaders-heading">
          <h2 id="regional-leaders-heading" className="regional-detail-section-title">
            统治者
          </h2>
          <div className="regional-detail-leaders">
            {(regime.leaderData || []).map((leader, i) => (
              <LeaderCard
                key={leader.id}
                leader={leader}
                dynastyColor={color}
                index={i}
              />
            ))}
            {(regime.leaderData || []).length === 0 && (
              <p className="regional-detail-empty">
                暂无统治者条目，可在「data/leaders/{regime.id}/」下添加 JSON，并在
                「data/regional_regimes.json」中为该政权补充 leaders 字段。
              </p>
            )}
          </div>
        </section>

        {regime.id === 'roc_taiwan' && (
          <nav className="detail-prev-next" aria-label="上一时期与下一时期">
            <div className="detail-prev-next-col">
              <Link to="/dynasty/roc" className="detail-prev-next-card">
                <div className="detail-prev-next-k">上一时期</div>
                <div className="detail-prev-next-v">中华民国</div>
              </Link>
            </div>
            <div className="detail-prev-next-col align-right">
              <div className="detail-prev-next-spacer" />
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}
