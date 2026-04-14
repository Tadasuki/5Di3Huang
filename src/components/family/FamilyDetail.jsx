import { useParams, Link } from 'react-router-dom'
import { useFamily } from '../../hooks/useDynasties'
import LeaderCard from '../home/LeaderCard'
import { withOpacity } from '../../utils/colorUtils'
import './FamilyDetail.css'

export default function FamilyDetail() {
  const { id } = useParams()
  const { family, loading } = useFamily(id)

  if (loading) {
    return (
      <div className="family-detail">
        <div className="container">
          <div className="loading-state">载入中...</div>
        </div>
      </div>
    )
  }

  if (!family) {
    return (
      <div className="family-detail">
        <div className="container family-detail-empty">
          <h2>未找到相关家族资料</h2>
          <p>可在 <code>data/families.json</code> 中补充家族条目。</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>返回首页</Link>
        </div>
      </div>
    )
  }

  const color = family.color || '#c9a96e'

  return (
    <div className="family-detail" id={`family-detail-${family.id}`}>
      <div className="container">
        <div className="family-detail-nav">
          <Link to="/" className="family-detail-back">← 首页</Link>
          <Link to="/map" className="family-detail-back">历史地图</Link>
        </div>

        <header className="family-detail-header" style={{ '--family-color': color }}>
          <div
            className="family-detail-badge"
            style={{
              background: `linear-gradient(135deg, ${color}, ${withOpacity(color, 0.6)})`
            }}
          >
            {(family.name || '族').charAt(0)}
          </div>

          <div className="family-detail-intro">
            <p className="family-detail-label">统治者家族</p>
            <h1 className="family-detail-title">
              {family.name}
              {family.yHaplogroup && (
                <span className="family-haplogroup-tag" title="Y染色体单倍群">
                  {family.yHaplogroup}
                </span>
              )}
            </h1>

            {family.description && (
              <p className="family-detail-desc">{family.description}</p>
            )}

            <div className="family-detail-meta">
              <div className="family-detail-meta-item">
                <span>📍 发迹地：</span>
                {family.ancestralHomeCoords ? (
                  <Link
                    to={`/map?family=${family.id}`}
                    className="family-location-link"
                    title="在地图中定位该地区"
                  >
                    {family.ancestralHome} ↗
                  </Link>
                ) : (
                  <span>{family.ancestralHome || '未知'}</span>
                )}
              </div>
              <div className="family-detail-meta-item">
                <span>👥 家族成员：</span>
                <span>{family.leaderData?.length || 0} 位</span>
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="family-members-heading">
          <h2 id="family-members-heading" className="family-detail-section-title">
            家族成员
          </h2>

          {family.leaderData && family.leaderData.length > 0 ? (
            <div className="family-detail-leaders">
              {family.leaderData.map((leader, idx) => (
                <LeaderCard
                  key={leader.id}
                  leader={leader}
                  dynastyColor={color}
                  index={idx}
                />
              ))}
            </div>
          ) : (
            <div className="family-detail-empty">
              暂无已收录的家族成员资料
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
