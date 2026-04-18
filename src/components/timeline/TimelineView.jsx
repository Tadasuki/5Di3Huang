import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatYearShort, formatYearShortOngoing } from '../../utils/yearFormat'
import { useDynasties } from '../../hooks/useDynasties'
import { useRegionalRegimeIdSet, useRegionalRegimes } from '../../hooks/useRegionalRegime'
import AnnotatedText from '../common/AnnotatedText'
import './TimelineView.css'

function CentralDynastyCard({ entry }) {
  return (
    <div className="timeline-card timeline-card--central">
      <div className="timeline-card-header">
        <span
          className="timeline-card-color"
          style={{ background: entry.central.color }}
        />
        <span className="timeline-card-name"><AnnotatedText text={entry.central.name} /></span>
      </div>
      <div className="timeline-card-years timeline-card-years--nowrap">
        {formatYearShort(entry.startYear)} — {formatYearShortOngoing(entry.endYear)}
      </div>
    </div>
  )
}

function CentralBlock({ entry, hasDynastyLink }) {
  const inner = <CentralDynastyCard entry={entry} />
  if (hasDynastyLink) {
    return (
      <Link
        to={`/dynasty/${entry.central.id}`}
        className="timeline-dynasty-link"
      >
        {inner}
      </Link>
    )
  }
  return <div className="timeline-central-static">{inner}</div>
}

function RegionalCardInner({ reg, accentColor }) {
  return (
    <div
      className="timeline-card timeline-card--regional"
      style={{ borderLeftColor: accentColor }}
    >
      <div className="timeline-card-header">
        <span
          className="timeline-card-color timeline-card-color--regional"
          style={{ background: accentColor }}
        />
        <span className="timeline-card-name timeline-card-name--regional"><AnnotatedText text={reg.name} /></span>
      </div>
      <div className="timeline-card-years timeline-card-years--nowrap timeline-card-years--small">
        {formatYearShort(reg.startYear)} — {formatYearShortOngoing(reg.endYear)}
      </div>
    </div>
  )
}

function RegionalColumn({ regs, regionalIdSet, accentColor }) {
  if (!regs.length) return null
  return (
    <div className="timeline-regional-column">
      {regs.map(reg => {
        const key = reg.id || reg.name
        const hasPage = reg.id && regionalIdSet.has(reg.id)
        if (hasPage) {
          return (
            <Link
              key={key}
              to={`/regional/${reg.id}`}
              className="timeline-regional-link"
            >
              <RegionalCardInner reg={reg} accentColor={accentColor} />
            </Link>
          )
        }
        return (
          <div key={key} className="timeline-regional-static">
            <RegionalCardInner reg={reg} accentColor={accentColor} />
          </div>
        )
      })}
    </div>
  )
}

export default function TimelineView() {
  const [timelineData, setTimelineData] = useState([])
  const { dynasties, loading: dynLoading } = useDynasties()
  const regionalIdSet = useRegionalRegimeIdSet()
  const regionalRegimes = useRegionalRegimes()

  const dynastyIdsWithDetail = useMemo(
    () => new Set(dynasties.map(d => d.id)),
    [dynasties]
  )

  const dynMap = useMemo(() => new Map(dynasties.map(d => [d.id, d])), [dynasties])
  const regMap = useMemo(
    () => new Map(regionalRegimes.map(r => [r.id, r])),
    [regionalRegimes]
  )

  useEffect(() => {
    import('/data/timeline.json').then(module => {
      setTimelineData(module.default || module)
    })
  }, [])

  const enrichedTimeline = useMemo(() => {
    return (timelineData || []).map(entry => {
      const dyn = entry?.central?.id ? dynMap.get(entry.central.id) : null
      const central = dyn
        ? { ...entry.central, name: dyn.name, color: dyn.color }
        : entry.central

      const regional = (entry.regional || []).map(r => {
        const rr = r?.id ? regMap.get(r.id) : null
        if (!rr) return r
        return {
          ...r,
          name: rr.name,
          startYear: rr.startYear ?? r.startYear,
          endYear: rr.endYear ?? r.endYear,
        }
      })

      return { ...entry, central, regional }
    })
  }, [dynMap, regMap, timelineData])

  return (
    <div className="timeline-page" id="timeline-page">
      <div className="container timeline-page-inner">
        <header className="timeline-page-header">
          <h1 className="timeline-page-title">中国历代政权时间线</h1>
          <p className="timeline-page-subtitle">
            中央轴线为时间主轴；大方块为中央政权，左右交替；旁侧小方块为割据或并立政权（可点击查看详情）。
          </p>
        </header>

        <div className="timeline-container">
          <div className="timeline-axis" aria-hidden />

          {enrichedTimeline.map((entry, i) => {
            const centralOnLeft = i % 2 === 0
            const hasDynastyLink =
              dynastyIdsWithDetail.has(entry.central.id) && !dynLoading
            const accent = entry.central.color || 'var(--color-gold)'

            return (
              <div
                className={`timeline-entry ${centralOnLeft ? 'timeline-entry--left' : 'timeline-entry--right'}`}
                key={`${entry.central.id}-${i}`}
                style={{ animationDelay: `${Math.min(i * 0.05, 1)}s` }}
              >
                <div className="timeline-entry-cluster">
                  {centralOnLeft ? (
                    <>
                      <RegionalColumn
                        regs={entry.regional}
                        regionalIdSet={regionalIdSet}
                        accentColor={accent}
                      />
                      <CentralBlock
                        entry={entry}
                        hasDynastyLink={hasDynastyLink}
                      />
                    </>
                  ) : (
                    <>
                      <CentralBlock
                        entry={entry}
                        hasDynastyLink={hasDynastyLink}
                      />
                      <RegionalColumn
                        regs={entry.regional}
                        regionalIdSet={regionalIdSet}
                        accentColor={accent}
                      />
                    </>
                  )}
                </div>

                <div
                  className="timeline-dot"
                  style={{ background: entry.central.color }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
