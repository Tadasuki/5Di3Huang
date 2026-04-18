import { useParams, Link } from 'react-router-dom'
import { useFamily } from '../../hooks/useDynasties'
import LeaderCard from '../home/LeaderCard'
import { withOpacity } from '../../utils/colorUtils'
import { getFamilyBadgeText } from '../../utils/familyBadge'
import { inlineMarkupToPlain } from '../../utils/inlineMarkup'
import AnnotatedText from '../common/AnnotatedText'
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
  const badgeText = getFamilyBadgeText(family)
  const badgeCompact = badgeText.length >= 3
  const haplogroup = typeof family?.yHaplogroup === 'string' ? family.yHaplogroup.trim() : ''
  const haplogroupUrl = haplogroup ? `https://www.theytree.com/tree/${encodeURIComponent(haplogroup)}` : ''

  return (
    <div className="family-detail" id={`family-detail-${family.id}`}>
      <div className="container">
        <header className="family-detail-header" style={{ '--family-color': color }}>
          <div
            className="family-detail-badge"
            style={{
              background: `linear-gradient(135deg, ${color}, ${withOpacity(color, 0.6)})`
            }}
          >
            {badgeText.length === 4 ? (
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px',
                fontSize: '1.35rem', lineHeight: 1, padding: '0', margin: 'auto',
                fontFamily: 'var(--font-serif)', fontWeight: 900, letterSpacing: 0
              }}>
                {badgeText.split('').map((c, i) => <span key={i} style={{ textAlign: 'center' }}>{c}</span>)}
              </div>
            ) : (
              <span className={`family-detail-badge-text${badgeCompact ? ' family-detail-badge-text--compact' : ''}`}>
                {badgeText}
              </span>
            )}
          </div>

          <div className="family-detail-intro">
            <p className="family-detail-label">执政者家族</p>
            <h1 className="family-detail-title">
              <AnnotatedText text={family.name} />
              {haplogroup && (
                <a
                  className="family-haplogroup-tag family-haplogroup-link family-tag-clickable"
                  title="在 YTree 查看该单倍群"
                  href={haplogroupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {haplogroup} <span className="family-jump-icon">↗</span>
                </a>
              )}
            </h1>

            {family.description && (
              <p className="family-detail-desc"><AnnotatedText text={family.description} /></p>
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
                    <AnnotatedText text={family.ancestralHome} /> ↗
                  </Link>
                ) : (
                  <span><AnnotatedText text={inlineMarkupToPlain(family.ancestralHome || '未知')} /></span>
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
