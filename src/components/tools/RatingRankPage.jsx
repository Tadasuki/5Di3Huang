import { useMemo, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllLeaders, useDynasties } from '../../hooks/useDynasties'
import { useRegionalRegimes } from '../../hooks/useRegionalRegime'
import { useFactions } from '../../hooks/useFactions'
import { RATING_DIMENSIONS, getRatingValue, computeTotalScore } from '../../utils/ratings'
import { getLeaderImageSrc } from '../../utils/leaderImage'
import { getLeaderShortTitle } from '../../utils/leaderTitle'
import { withOpacity } from '../../utils/colorUtils'
import { formatYearShort } from '../../utils/yearFormat'
import { inlineMarkupInitial, inlineMarkupToPlain } from '../../utils/inlineMarkup'
import AnnotatedText from '../common/AnnotatedText'
import SearchSelect from './SearchSelect'
import './RatingRankPage.css'


/** Map dynasty/regime IDs → display objects for quick look-up */
function buildPolityMap(dynasties, regimes) {
  const map = new Map()
    ; (dynasties || []).forEach(d => {
      map.set(String(d.id), { name: inlineMarkupToPlain(d.fullName || d.name), color: d.color || '#888', type: 'dynasty' })
    })
    ; (regimes || []).forEach(r => {
      map.set(String(r.id), { name: inlineMarkupToPlain(r.fullName || r.name), color: r.color || '#888', type: 'regional' })
    })
  return map
}

/** Get the primary polity for a leader (prefer dynastyId for main canonical display) */
function getPrimaryPolityId(leader) {
  if (leader?.dynastyId) return String(leader.dynastyId)
  const positions = Array.isArray(leader?.positions) ? leader.positions : []
  if (positions.length) {
    const sorted = [...positions].sort((a, b) => (b.start ?? 0) - (a.start ?? 0))
    return String(sorted[0]?.polityId || '')
  }
  return ''
}

function scoreGrade(v) {
  if (v >= 85) return 'excellent'
  if (v >= 70) return 'good'
  if (v >= 50) return 'average'
  return 'poor'
}

export default function RatingRankPage() {
  const navigate = useNavigate()
  const leaders = useAllLeaders()
  const { dynasties, loading } = useDynasties()
  const regimes = useRegionalRegimes()
  const { factions } = useFactions()

  const polityMap = useMemo(() => buildPolityMap(dynasties, regimes), [dynasties, regimes])

  // ---- sorting ----
  const [sortKey, setSortKey] = useState('total') // 'total' | dimension key
  const [sortDir, setSortDir] = useState('desc')  // 'asc' | 'desc'
  const [mobileDimKey, setMobileDimKey] = useState(RATING_DIMENSIONS[0]?.key || 'military')

  const handleSort = useCallback((key) => {
    if (key === sortKey) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }, [sortKey])

  const handleMobileDimChange = useCallback((e) => {
    const key = e.target.value
    setMobileDimKey(key)
    setSortKey(key)
    setSortDir('desc')
  }, [])

  // ---- filters ----
  const centralOptions = useMemo(() => {
    return (dynasties || [])
      .slice()
      .sort((a, b) => (a.startYear ?? 999999) - (b.startYear ?? 999999))
      .map(d => ({ value: String(d.id), label: inlineMarkupToPlain(d.fullName || d.name) }))
  }, [dynasties])

  const regionalByCentral = useMemo(() => {
    const map = new Map()
      ; (regimes || []).forEach(r => {
        const cid = r?.relatedCentralDynastyId
        if (!cid) return
        const key = String(cid)
        if (!map.has(key)) map.set(key, [])
        map.get(key).push(r)
      })
    map.forEach(list => list.sort((a, b) => (a.startYear ?? 999999) - (b.startYear ?? 999999)))
    return map
  }, [regimes])

  function polityOptionsForCentral(centralId) {
    const cid = String(centralId || '')
    if (!cid) return []
    const central = dynasties.find(d => String(d.id) === cid)
    const opts = []
    if (central) opts.push({ value: String(central.id), label: `${inlineMarkupToPlain(central.fullName || central.name)}（中央）` })
    const regionals = regionalByCentral.get(cid) || []
    regionals.forEach(r => {
      if (String(r.id) === 'prc_sec') return
      opts.push({ value: String(r.id), label: inlineMarkupToPlain(r.fullName || r.name) })
    })
    return opts
  }

  const [filterCentralId, setFilterCentralId] = useState('')
  const [filterPolityId, setFilterPolityId] = useState('')
  const [filterFactionId, setFilterFactionId] = useState('')

  const handlePolityTagClick = useCallback((e, polityId) => {
    e.stopPropagation();
    if (!polityId) return;

    // Click the same tag again to clear polity-related filters.
    if (filterPolityId === polityId) {
      setFilterCentralId('');
      setFilterPolityId('');
      return;
    }

    // Find if the polityId corresponds to a central dynasty or a regional regime
    let centralId = '';
    const dyn = dynasties.find(d => String(d.id) === polityId);
    if (dyn) {
      centralId = polityId;
    } else {
      const reg = regimes?.find(r => String(r.id) === polityId);
      if (reg) centralId = String(reg.relatedCentralDynastyId || '');
    }

    if (centralId) {
      setFilterCentralId(centralId);
      setFilterPolityId(polityId);
    }
  }, [dynasties, regimes, filterPolityId]);

  const activePolityOptions = useMemo(() => {
    if (!filterCentralId) return []
    return polityOptionsForCentral(filterCentralId)
  }, [filterCentralId, dynasties, regionalByCentral])

  // Reset polity when central changes
  useEffect(() => {
    if (filterCentralId) {
      const opts = polityOptionsForCentral(filterCentralId)
      if (!opts.some(o => o.value === filterPolityId)) {
        setFilterPolityId(opts[0]?.value || '')
      }
    } else {
      setFilterPolityId('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCentralId])

  const factionOptions = useMemo(() => {
    const ids = new Set((leaders || []).map(l => l.factionId).filter(Boolean))
    return (factions || []).filter(f => ids.has(f.id)).map(f => ({ value: String(f.id), label: inlineMarkupToPlain(f.shortName || f.name) }))
  }, [leaders, factions])

  // ---- processed data ----
  const rows = useMemo(() => {
    const list = (leaders || [])
      .filter(l => l.ratings) // only leaders with ratings
      .map(l => {
        const total = computeTotalScore(l.ratings)
        const dims = {}
        RATING_DIMENSIONS.forEach(d => {
          dims[d.key] = getRatingValue(l.ratings, d.key)
        })
        const polityId = getPrimaryPolityId(l)
        const polity = polityMap.get(polityId) || polityMap.get(String(l.dynastyId)) || null
        return {
          leader: l,
          total,
          dims,
          polityId,
          polity,
        }
      })

    // Apply filters
    let filtered = list
    if (filterPolityId) {
      filtered = filtered.filter(r => {
        // Match if primary polity matches, or dynastyId matches, or any position polity matches
        if (r.polityId === filterPolityId) return true
        if (String(r.leader.dynastyId) === filterPolityId) return true
        const positions = Array.isArray(r.leader.positions) ? r.leader.positions : []
        return positions.some(p => String(p?.polityId) === filterPolityId)
      })
    } else if (filterCentralId) {
      // if central is selected but polity isn't specifically filtered (this happens briefly during state updates),
      // we might filter by central. but usually they are tied.
      // A safe fallback is to filter by all options under that central
      const opts = polityOptionsForCentral(filterCentralId).map(o => o.value)
      filtered = filtered.filter(r => {
        if (opts.includes(r.polityId)) return true
        if (opts.includes(String(r.leader.dynastyId))) return true
        const positions = Array.isArray(r.leader.positions) ? r.leader.positions : []
        return positions.some(p => opts.includes(String(p?.polityId)))
      })
    }

    if (filterFactionId) {
      filtered = filtered.filter(r => String(r.leader.factionId) === filterFactionId)
    }

    // Sort
    filtered.sort((a, b) => {
      let va, vb
      if (sortKey === 'total') {
        va = a.total; vb = b.total
      } else {
        va = a.dims[sortKey] ?? 0; vb = b.dims[sortKey] ?? 0
      }
      return sortDir === 'desc' ? vb - va : va - vb
    })

    return filtered
  }, [leaders, polityMap, sortKey, sortDir, filterPolityId, filterCentralId, filterFactionId, dynasties, regionalByCentral])

  const clearFilters = useCallback(() => {
    setFilterCentralId('')
    setFilterPolityId('')
    setFilterFactionId('')
  }, [])

  // ---- image error state ----
  const [failedImgs, setFailedImgs] = useState(new Set())
  useEffect(() => setFailedImgs(new Set()), [leaders])

  if (loading) {
    return (
      <div className="rank-page" id="rating-rank-page">
        <div className="container">
          <div className="rank-empty"><div className="rank-empty-text">载入中...</div></div>
        </div>
      </div>
    )
  }

  const hasFilters = !!filterCentralId || !!filterFactionId
  const sortLabel = sortKey === 'total' ? '综合' : RATING_DIMENSIONS.find(d => d.key === sortKey)?.label || '综合'

  return (
    <div className="rank-page" id="rating-rank-page">
      <div className="container">
        {/* Header */}
        <div className="rank-head">
          <h1 className="rank-title">治国评分排行</h1>
          <p className="rank-sub">
            根据军事、仁德、经济、文化、思想、实践、外交、后世贡献、稳定、能力十项指标综合评估历代执政者
          </p>
        </div>

        {/* Controls */}
        <div className="rank-controls">
          <div className="rank-filter-stack">
            <SearchSelect
              label="大朝代"
              options={[{ value: '', label: '全部' }, ...centralOptions]}
              value={filterCentralId}
              onChange={setFilterCentralId}
              placeholder="选择大朝代"
            />
            <SearchSelect
              label="具体政权"
              options={[{ value: '', label: '全部' }, ...activePolityOptions]}
              value={filterPolityId}
              onChange={setFilterPolityId}
              placeholder="选择具体政权"
              disabled={!filterCentralId}
            />
          </div>

          <div className="rank-filter-group">
            <SearchSelect
              label="政党"
              options={[{ value: '', label: '全部' }, ...factionOptions]}
              value={filterFactionId}
              onChange={setFilterFactionId}
              placeholder="选择政党"
            />
          </div>

          {hasFilters && (
            <button className="rank-clear-btn" onClick={clearFilters} type="button" style={{ alignSelf: 'flex-end', marginBottom: '4px' }}>
              清除筛选
            </button>
          )}
        </div>

        {/* Count info */}
        <div className="rank-count">
          共 <strong>{rows.length}</strong> 位执政者，当前按「{sortLabel}」{sortDir === 'desc' ? '降序' : '升序'}排列
        </div>

        {/* Table */}
        {rows.length > 0 ? (
          <>
          {/* Mobile sort picker — hidden on desktop via CSS */}
          <div className="rank-mobile-sort-bar">
            <span className="rank-mobile-sort-label">指标</span>
            <select
              className="rank-mobile-sort-select"
              value={mobileDimKey}
              onChange={handleMobileDimChange}
            >
              {RATING_DIMENSIONS.map(d => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
            <button
              className="rank-mobile-dir-btn"
              type="button"
              onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            >
              {sortDir === 'desc' ? '↓ 降序' : '↑ 升序'}
            </button>
          </div>
          <div className="rank-table-wrapper">
            <div className="rank-scroll">
              <table className="rank-table">
                <colgroup>
                  <col className="rank-col-rank" />
                  <col className="rank-col-name" />
                  <col className="rank-col-polity" />
                  <col className="rank-col-total" />
                  {RATING_DIMENSIONS.map(d => (
                    <col key={d.key} className="rank-col-dim" />
                  ))}
                </colgroup>

                <thead>
                  <tr>
                    <th className="rank-th-nosort">
                      <span className="rank-th-inner">#</span>
                    </th>
                    <th className="rank-th-nosort" style={{ textAlign: 'left' }}>
                      <span className="rank-th-inner">人物</span>
                    </th>
                    <th className={`rank-col-polity rank-th-nosort`}>
                      <span className="rank-th-inner">朝代/政权</span>
                    </th>
                    <th
                      className={sortKey === 'total' ? 'rank-th-active' : ''}
                      onClick={() => handleSort('total')}
                    >
                      <span className="rank-th-inner">
                        综合
                        <span className="rank-sort-icon">
                          {sortKey === 'total' ? (sortDir === 'desc' ? '▼' : '▲') : '▽'}
                        </span>
                      </span>
                    </th>
                    {RATING_DIMENSIONS.map(dim => (
                      <th
                        key={dim.key}
                        className={`rank-th-dim ${dim.key === mobileDimKey ? 'rank-th-dim--visible' : ''} ${sortKey === dim.key ? 'rank-th-active' : ''}`}
                        onClick={() => handleSort(dim.key)}
                      >
                        <span className="rank-th-inner">
                          {dim.label}
                          <span className="rank-sort-icon">
                            {sortKey === dim.key ? (sortDir === 'desc' ? '▼' : '▲') : '▽'}
                          </span>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, idx) => {
                    const l = row.leader
                    const imgSrc = getLeaderImageSrc(l)
                    const shortTitle = getLeaderShortTitle(l)
                    const reignLabel = l.reignStart
                      ? `${formatYearShort(l.reignStart)}–${formatYearShort(l.reignEnd)}`
                      : ''
                    const polityColor = row.polity?.color || '#888'
                    const rank = idx + 1

                    return (
                      <tr
                        key={l.id}
                        style={{ animationDelay: `${Math.min(idx * 0.03, 0.8)}s` }}
                      >
                        {/* Rank */}
                        <td>
                          <span className={`rank-num ${rank <= 3 ? `rank-${rank}` : ''}`}>
                            {rank}
                          </span>
                        </td>

                        {/* Leader info */}
                        <td>
                          <div
                            className="rank-leader-cell"
                            onClick={() => navigate(`/leader/${l.id}`)}
                            title={`查看 ${inlineMarkupToPlain(l.name)} 详情`}
                            style={{ cursor: 'pointer' }}
                          >
                            <div
                              className="rank-avatar"
                              style={{
                                background: `linear-gradient(135deg, ${withOpacity(polityColor, 0.9)}, ${withOpacity(polityColor, 0.5)})`,
                              }}
                            >
                              {imgSrc && !failedImgs.has(l.id) ? (
                                  <img
                                    src={imgSrc}
                                  alt={inlineMarkupToPlain(l.name)}
                                  loading="lazy"
                                  decoding="async"
                                  referrerPolicy="no-referrer"
                                  onError={() =>
                                    setFailedImgs(prev => new Set(prev).add(l.id))
                                  }
                                />
                              ) : (
                                inlineMarkupInitial(l.name)
                              )}
                            </div>
                            <div className="rank-leader-info">
                              <span className="rank-leader-name"><AnnotatedText text={l.name} /></span>
                              <span className="rank-leader-sub">
                                {shortTitle}{shortTitle && reignLabel ? ' · ' : ''}{reignLabel}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Polity */}
                        <td className="rank-td-polity">
                          {row.polity && (
                            <span
                              className="rank-polity-tag"
                              style={{
                                color: polityColor,
                                borderColor: withOpacity(polityColor, 0.35),
                                background: withOpacity(polityColor, 0.08),
                                cursor: 'pointer'
                              }}
                              onClick={(e) => handlePolityTagClick(e, row.polityId)}
                              title={`筛选 ${inlineMarkupToPlain(row.polity.name)}`}
                            >
                              <AnnotatedText text={row.polity.name} />
                            </span>
                          )}
                        </td>

                        {/* Total score */}
                        <td>
                          <span className={`rank-score-total rank-score-${scoreGrade(row.total)}`}>
                            {row.total}
                          </span>
                        </td>

                        {/* Dimension scores */}
                        {RATING_DIMENSIONS.map(dim => {
                          const v = row.dims[dim.key]
                          const grade = scoreGrade(v)
                          return (
                            <td key={dim.key} className={`rank-td-dim ${dim.key === mobileDimKey ? 'rank-td-dim--visible' : ''}`}>
                              <div className="rank-score-cell">
                                <span className={`rank-score-num rank-score-${grade}`}>
                                  {v}
                                </span>
                                <div className="rank-score-bar">
                                  <div
                                    className={`rank-score-bar-fill rank-bar-${grade}`}
                                    style={{ width: `${v}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </>
        ) : (
          <div className="rank-empty">
            <div className="rank-empty-icon">🏯</div>
            <div className="rank-empty-text">
              {hasFilters ? '当前筛选条件下无匹配结果，请调整筛选范围' : '暂无评分数据'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
