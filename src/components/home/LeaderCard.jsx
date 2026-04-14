import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatLifeYearRange } from '../../utils/yearFormat'
import { withOpacity } from '../../utils/colorUtils'
import { getLeaderImageSrc } from '../../utils/leaderImage'
import { getLeaderShortTitle } from '../../utils/leaderTitle'
import './LeaderCard.css'

export default function LeaderCard({ leader, dynastyColor, index }) {
  const imageSrc = getLeaderImageSrc(leader)
  const [imgFailed, setImgFailed] = useState(false)
  const customColor = typeof leader?.color === 'string' ? leader.color.trim() : ''
  const themeColor = customColor || dynastyColor

  useEffect(() => {
    setImgFailed(false)
  }, [leader.id, imageSrc])

  const delay = Math.min(index * 0.08, 0.4)
  const titleDisplay = getLeaderShortTitle(leader)
  const factionTag = typeof leader?.factionTag === 'string' ? leader.factionTag.trim() : ''

  return (
    <Link
      to={`/leader/${leader.id}`}
      className="leader-card"
      style={{ animationDelay: `${delay}s` }}
      id={`leader-card-${leader.id}`}
    >
      <div
        className="leader-avatar"
        style={{ background: `linear-gradient(135deg, ${themeColor}, ${withOpacity(themeColor, 0.5)})` }}
      >
        {imageSrc && !imgFailed ? (
          <img
            src={imageSrc}
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

      <div className="leader-card-info">
        <div className="leader-card-name">
          {leader.name}
          {titleDisplay && (
            <span
              className="leader-card-title"
              style={{
                background: withOpacity(themeColor, 0.15),
                color: themeColor,
                border: `1px solid ${withOpacity(themeColor, 0.3)}`
              }}
            >
              {titleDisplay}
            </span>
          )}
        </div>
        <div className="leader-card-detail">
          {formatLifeYearRange(leader.birthYear, leader.deathYear)}
          {leader.eraName && ` · ${leader.eraName}`}
          {factionTag && ` · ${factionTag}`}
        </div>
      </div>

      <span className="leader-card-arrow">›</span>
    </Link>
  )
}
