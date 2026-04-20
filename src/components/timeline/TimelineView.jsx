import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatYearShort, formatYearShortOngoing } from '../../utils/yearFormat'
import { useDynasties } from '../../hooks/useDynasties'
import { useRegionalRegimeIdSet, useRegionalRegimes } from '../../hooks/useRegionalRegime'
import AnnotatedText from '../common/AnnotatedText'
import SearchSelect from '../tools/SearchSelect'
import './TimelineView.css'

const TIMELINE_MODE = {
  central: 'central',
  korea: 'korea',
  japan: 'japan',
}

const TIMELINE_META = {
  [TIMELINE_MODE.central]: {
    label: '中国',
    title: '中国历代政权时间线',
    subtitle: '中央轴线为时间主轴；大方块为中央政权，左右交替；旁侧小方块为割据或并立政权（可点击查看详情）。',
  },
  [TIMELINE_MODE.korea]: {
    label: '朝鲜',
    title: '朝鲜半岛历代政权时间线',
    subtitle: '中央轴线为时间主轴；大方块为主要政权，左右交替；旁侧小方块为并立政权（可点击查看详情）。',
  },
  [TIMELINE_MODE.japan]: {
    label: '日本',
    title: '日本列岛历代政权时间线',
    subtitle: '中央轴线为时间主轴；大方块为主要时代政权，左右交替；旁侧小方块为并立政权（可点击查看详情）。',
  },
}

function CentralDynastyCard({ entry }) {
  const yearText = entry?.yearLabel
    || `${formatYearShort(entry.startYear)} — ${formatYearShortOngoing(entry.endYear)}`

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
        {yearText}
      </div>
    </div>
  )
}

function CentralBlock({ entry, centralLink }) {
  const inner = <CentralDynastyCard entry={entry} />
  if (centralLink) {
    return (
      <Link
        to={centralLink}
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [timelineDataByMode, setTimelineDataByMode] = useState({
    [TIMELINE_MODE.central]: [],
    [TIMELINE_MODE.korea]: [],
    [TIMELINE_MODE.japan]: [],
  })
  const { dynasties, loading: dynLoading } = useDynasties()
  const regionalIdSet = useRegionalRegimeIdSet()
  const regionalRegimes = useRegionalRegimes()

  const modeParam = searchParams.get('region')
  const mode = Object.prototype.hasOwnProperty.call(TIMELINE_META, modeParam)
    ? modeParam
    : TIMELINE_MODE.central

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
    Promise.all([
      import('/data/timeline.json'),
      import('/data/timeline_korea.json'),
      import('/data/timeline_japan.json'),
    ]).then(([centralModule, koreaModule, japanModule]) => {
      setTimelineDataByMode({
        [TIMELINE_MODE.central]: centralModule.default || centralModule,
        [TIMELINE_MODE.korea]: koreaModule.default || koreaModule,
        [TIMELINE_MODE.japan]: japanModule.default || japanModule,
      })
    })
  }, [])

  const timelineData = timelineDataByMode[mode] || []

  const enrichedTimeline = useMemo(() => {
    return (timelineData || []).map(entry => {
      const dyn = entry?.central?.id ? dynMap.get(entry.central.id) : null
      const regCentral = entry?.central?.id ? regMap.get(entry.central.id) : null
      const central = dyn
        ? { ...entry.central, name: dyn.name, color: dyn.color }
        : regCentral
          ? { ...entry.central, name: regCentral.name, color: regCentral.color || entry.central.color }
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

  const headerCopy = TIMELINE_META[mode] || TIMELINE_META[TIMELINE_MODE.central]
  const regionOptions = useMemo(
    () => Object.entries(TIMELINE_META).map(([value, item]) => ({ value, label: item.label })),
    []
  )
  const startOnLeft = enrichedTimeline.length % 2 === 0

  function handleModeChange(nextMode) {
    const next = Object.prototype.hasOwnProperty.call(TIMELINE_META, nextMode)
      ? nextMode
      : TIMELINE_MODE.central
    const nextParams = new URLSearchParams(searchParams)
    if (next === TIMELINE_MODE.central) nextParams.delete('region')
    else nextParams.set('region', next)
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <div className="timeline-page" id="timeline-page">
      <div className="container timeline-page-inner">
        <header className="timeline-page-header">
          <div className="timeline-mode-select" aria-label="时间线视图切换">
            <SearchSelect
              label="地域"
              placeholder="选择地域"
              options={regionOptions}
              value={mode}
              onChange={handleModeChange}
            />
          </div>
          <h1 className="timeline-page-title">{headerCopy.title}</h1>
          <p className="timeline-page-subtitle">
            {headerCopy.subtitle}
          </p>
        </header>

        <div className="timeline-container">
          <div className="timeline-axis" aria-hidden />

          {enrichedTimeline.map((entry, i) => {
            const centralOnLeft = startOnLeft ? (i % 2 === 0) : (i % 2 !== 0)
            let centralLink = null
            if (!dynLoading) {
              if (dynastyIdsWithDetail.has(entry.central.id)) centralLink = `/dynasty/${entry.central.id}`
              else if (entry.central.id && regionalIdSet.has(entry.central.id)) centralLink = `/regional/${entry.central.id}`
            }
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
                        centralLink={centralLink}
                      />
                    </>
                  ) : (
                    <>
                      <CentralBlock
                        entry={entry}
                        centralLink={centralLink}
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
