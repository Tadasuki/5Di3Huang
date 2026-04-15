import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLeader } from '../../hooks/useLeader'
import { useDynasties, useAllLeaders, useFamily } from '../../hooks/useDynasties'
import { useHistoricalEvents } from '../../hooks/useHistoricalEvents'
import { useFactions } from '../../hooks/useFactions'
import { formatLifeYearRange, formatYearRangeOngoing, formatYearShort } from '../../utils/yearFormat'
import { withOpacity } from '../../utils/colorUtils'
import { getLeaderImageSrc } from '../../utils/leaderImage'
import { computeTotalScore } from '../../utils/ratings'
import RadarChart from './RadarChart'
import './LeaderDetail.css'

const regionalModules = import.meta.glob('/data/regional_regimes.json', { eager: true })
function getRegionalList() {
    const path = Object.keys(regionalModules)[0]
    if (!path) return []
    const raw = regionalModules[path]?.default || regionalModules[path]
    return Array.isArray(raw) ? raw : []
}

const TAB_LIST = [
    { key: 'bio', label: '简介', icon: '📖' },
    { key: 'timeline', label: '时间线', icon: '📅' },
    { key: 'achievements', label: '功绩', icon: '🏆' },
    { key: 'controversies', label: '争议', icon: '⚡' },
    { key: 'events', label: '事件', icon: '🧭' },
    { key: 'summary', label: '总结', icon: '📊' },
]

export default function LeaderDetail() {
    const { id } = useParams()
    const { leader, loading } = useLeader(id)
    const { dynasties } = useDynasties()
    const allLeaders = useAllLeaders()
    const events = useHistoricalEvents()
    const { factionById } = useFactions()
    const { family } = useFamily(leader?.familyId)
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = searchParams.get('tab') || 'bio'

    const setActiveTab = useCallback((newTab) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev)
            if (newTab === 'bio') {
                next.delete('tab')
            } else {
                next.set('tab', newTab)
            }
            return next
        }, { replace: true })
    }, [setSearchParams])

    const [avatarImgFailed, setAvatarImgFailed] = useState(false)
    const avatarSrc = leader ? getLeaderImageSrc(leader) : ''

    // Find dynasty info
    const dynasty = dynasties.find(d => d.id === leader?.dynastyId)
    const regionalRegime = leader?.dynastyId
        ? (getRegionalList().find(r => r.id === leader.dynastyId) ?? null)
        : null
    const customColor = typeof leader?.color === 'string' ? leader.color.trim() : ''
    const themeColor = customColor || dynasty?.color || regionalRegime?.color || '#c9a96e'

    const polityLinks = useMemo(() => {
        if (!leader?.dynastyId) return []
        const regList = getRegionalList()
        const regMap = new Map(regList.map(r => [r.id, r]))
        const dynMap = new Map(dynasties.map(d => [d.id, d]))

        const mainId = leader.dynastyId
        const ids = [mainId]
        const positions = Array.isArray(leader.positions) ? leader.positions : []
        positions.forEach(p => {
            const pid = p?.polityId
            if (pid && !ids.includes(pid)) ids.push(pid)
        })

        return ids
            .filter(id => id !== 'prc_sec')
            .map(id => {
                const d = dynMap.get(id)
                if (d) return { id, label: d.fullName, to: `/dynasty/${id}`, color: d.color }
                const r = regMap.get(id)
                if (r) return { id, label: r.fullName || r.name, to: `/regional/${id}`, color: r.color }
                return null
            })
            .filter(Boolean)
    }, [dynasties, leader?.dynastyId, leader?.positions])

    const centralPolityIds = useMemo(() => {
        // Central polities are those defined in dynasties.json with type === 'central'.
        // Non-central (regional/parallel regimes, ROC Taiwan, etc.) should navigate within themselves.
        return new Set((dynasties || []).filter(d => d?.type === 'central' && d?.id).map(d => String(d.id)))
    }, [dynasties])

    function pickNavPolityId(l) {
        if (!l) return null
        const positions = Array.isArray(l.positions) ? l.positions : []
        // If a leader served multiple polities, navigate within the latest polity they actually served.
        // This makes e.g. 蒋介石 fall into roc_taiwan sequence (position start 1949) and connect to 蔡英文.
        let best = null
        for (const p of positions) {
            const pid = p?.polityId
            if (!pid) continue
            const start = typeof p?.start === 'number' ? p.start : Number(p?.start)
            const startNum = Number.isFinite(start) ? start : null
            const key = startNum ?? -Infinity
            if (!best || key > best.key) best = { pid: String(pid), key }
        }
        if (best?.pid) return best.pid
        return l.dynastyId ? String(l.dynastyId) : null
    }

    const navGroupId = useMemo(() => {
        if (!leader) return null

        // If the leader ever served a central polity (or has a central dynastyId), prefer central navigation.
        const positions = Array.isArray(leader.positions) ? leader.positions : []
        const servedCentral = positions.some(p => {
            const pid = p?.polityId
            return pid && centralPolityIds.has(String(pid))
        })
        if (servedCentral || (leader.dynastyId && centralPolityIds.has(String(leader.dynastyId)))) return 'central'

        const pid = pickNavPolityId(leader)
        if (!pid) return null
        return centralPolityIds.has(pid) ? 'central' : pid
    }, [leader, centralPolityIds])

    const leaderNavGroupId = useMemo(() => {
        function leaderGroupIds(l) {
            if (!l) return []
            const ids = []
            const positions = Array.isArray(l.positions) ? l.positions : []
            positions.forEach(p => {
                const pid = p?.polityId
                if (pid) ids.push(String(pid))
            })
            if (l.dynastyId) ids.push(String(l.dynastyId))
            const mapped = ids
                .map(pid => (centralPolityIds.has(pid) ? 'central' : pid))
                .filter(Boolean)
            return Array.from(new Set(mapped))
        }

        function leaderHasGroup(l, groupId) {
            if (!groupId) return false
            return leaderGroupIds(l).includes(groupId)
        }

        function groupStartKey(l, groupId) {
            if (!l || !groupId) return 999999
            const positions = Array.isArray(l.positions) ? l.positions : []
            // Prefer the start year from the position matching this group (or any central position when groupId === 'central').
            let best = null
            for (const p of positions) {
                const pid = p?.polityId ? String(p.polityId) : null
                if (!pid) continue
                const mapped = centralPolityIds.has(pid) ? 'central' : pid
                if (mapped !== groupId) continue
                const start = typeof p?.start === 'number' ? p.start : Number(p?.start)
                const startNum = Number.isFinite(start) ? start : null
                if (startNum == null) continue
                if (best == null || startNum < best) best = startNum
            }
            if (best != null) return best
            return (l.reignStart ?? l.birthYear ?? 999999)
        }

        function groupLabel(groupId) {
            if (!groupId) return ''
            if (groupId === 'central') return '领导核心'
            const d = (dynasties || []).find(x => String(x?.id) === String(groupId))
            if (d) return d.fullName || d.name || String(groupId)
            const r = getRegionalList().find(x => String(x?.id) === String(groupId))
            if (r) return r.fullName || r.name || String(groupId)
            return String(groupId)
        }

        return { leaderGroupIds, leaderHasGroup, groupStartKey, groupLabel }
    }, [centralPolityIds, dynasties])

    // Must be declared before any early returns to keep hook order stable.
    const { prevLeaders, nextLeaders } = useMemo(() => {
        try {
            if (!navGroupId) return { prevLeaders: [], nextLeaders: [] }

            const { leaderGroupIds, leaderHasGroup, groupStartKey, groupLabel } = leaderNavGroupId

            function groupPrevNext(groupId) {
                const list = (allLeaders || [])
                    .filter(l => l && l.id && (l.reignStart != null || l.birthYear != null))
                    .filter(l => leaderHasGroup(l, groupId))
                    .slice()
                    .sort((a, b) => {
                        const ak = groupStartKey(a, groupId)
                        const bk = groupStartKey(b, groupId)
                        if (ak !== bk) return ak - bk
                        return String(a.id).localeCompare(String(b.id))
                    })
                const idx = list.findIndex(l => String(l.id) === String(id))
                return {
                    prev: idx > 0 ? list[idx - 1] : null,
                    next: idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null,
                }
            }

            const groups = leaderGroupIds(leader)
            const orderedGroups = groups.slice().sort((a, b) => {
                if (a === 'central' && b !== 'central') return -1
                if (b === 'central' && a !== 'central') return 1
                const ak = groupStartKey(leader, a)
                const bk = groupStartKey(leader, b)
                if (ak !== bk) return ak - bk
                return String(a).localeCompare(String(b))
            })

            const primary = groupPrevNext(navGroupId)
            const nextList = []
            for (const gid of orderedGroups) {
                const { next } = groupPrevNext(gid)
                if (!next) continue
                nextList.push({ leader: next, groupId: gid, groupLabel: groupLabel(gid) })
            }

            // -------------------------------------------------------------
            // 手动为特殊支线追加跳转（不将华、江加入 prc_sec 的前提下）
            // -------------------------------------------------------------
            let finalPrevList = primary.prev ? [{ leader: primary.prev, groupId: navGroupId, groupLabel: groupLabel(navGroupId) }] : []
            let finalNextList = [...nextList]

            if (id === 'hua_guofeng') {
                const hyb = allLeaders.find(l => l.id === 'hu_yaobang')
                if (hyb) {
                    finalNextList.push({ leader: hyb, groupId: 'prc_sec', groupLabel: '总书记' })
                }
            }
            if (id === 'deng_xiaoping') {
                const jzm = allLeaders.find(l => l.id === 'jiang_zemin')
                if (jzm) {
                    // 邓小平直接跳转到江泽民，绕过胡、赵
                    finalNextList = [{ leader: jzm, groupId: 'central', groupLabel: '领导核心' }]
                }
            }
            if (id === 'hu_yaobang') {
                const hgf = allLeaders.find(l => l.id === 'hua_guofeng')
                if (hgf) {
                    finalPrevList = [{ leader: hgf, groupId: 'central', groupLabel: '中央政权' }]
                }
            }
            if (id === 'zhao_ziyang') {
                const jzm = allLeaders.find(l => l.id === 'jiang_zemin')
                if (jzm) {
                    finalNextList.push({ leader: jzm, groupId: 'central', groupLabel: '中央政权' })
                }
            }
            if (id === 'jiang_zemin') {
                const dxp = allLeaders.find(l => l.id === 'deng_xiaoping')
                const zzy = allLeaders.find(l => l.id === 'zhao_ziyang')
                finalPrevList = []
                if (dxp) finalPrevList.push({ leader: dxp, groupId: 'central', groupLabel: '领导核心' })
                if (zzy) finalPrevList.push({ leader: zzy, groupId: 'prc_sec', groupLabel: '总书记' })
            }

            const seenPrev = new Set()
            const dedupedPrev = finalPrevList.filter(x => {
                const key = String(x?.leader?.id ?? '')
                if (!key || seenPrev.has(key)) return false
                seenPrev.add(key)
                return true
            })

            const seenNext = new Set()
            const dedupedNext = finalNextList.filter(x => {
                const key = String(x?.leader?.id ?? '')
                if (!key || seenNext.has(key)) return false
                seenNext.add(key)
                return true
            })

            return {
                prevLeaders: dedupedPrev,
                nextLeaders: dedupedNext,
            }
        } catch {
            // Never let prev/next calculation break the whole page.
            return { prevLeaders: [], nextLeaders: [] }
        }
    }, [allLeaders, id, leader, navGroupId, leaderNavGroupId])

    useEffect(() => {
        window.scrollTo(0, 0)
        setAvatarImgFailed(false)
    }, [id])

    if (loading) {
        return (
            <div className="leader-detail">
                <div className="container">
                    <div className="leader-loading">载入中...</div>
                </div>
            </div>
        )
    }

    if (!leader) {
        return (
            <div className="leader-detail">
                <div className="container">
                    <div className="leader-not-found">
                        <h2>未找到该统治者</h2>
                        <p style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-lg)' }}>
                            您查找的统治者不存在或尚未录入数据
                        </p>
                        <Link to="/" className="btn btn-primary">返回首页</Link>
                    </div>
                </div>
            </div>
        )
    }

    const leaderName = typeof leader.name === 'string' ? leader.name : (leader.name != null ? String(leader.name) : '')
    const leaderInitial = leaderName ? leaderName.charAt(0) : '?'

    function formatReignValue(l) {
        const periods = Array.isArray(l?.reignPeriods) ? l.reignPeriods : []
        const normalized = periods
            .map(p => ({
                start: typeof p?.start === 'number' ? p.start : Number(p?.start),
                end: typeof p?.end === 'number' ? p.end : Number(p?.end),
            }))
            .filter(p => Number.isFinite(p.start))
            .sort((a, b) => (a.start ?? 999999) - (b.start ?? 999999))
        if (normalized.length > 0) {
            return normalized
                .map(p => formatYearRangeOngoing(p.start, Number.isFinite(p.end) ? p.end : null))
                .join('；')
        }
        return formatYearRangeOngoing(l?.reignStart, l?.reignEnd)
    }

    const infoItems = [
        { label: '姓名', value: leader.fullName || leaderName || '—' },
        leader.alternateNames && { label: '其他名称', value: leader.alternateNames },
        leader.templeName && { label: '庙号', value: leader.templeName },
        leader.posthumousName && { label: '谥号', value: leader.posthumousName },
        leader.eraName && { label: '年号', value: leader.eraName },
        { label: '头衔', value: leader.title },
        leader.factionId && (() => {
            const f = factionById.get(String(leader.factionId)) ?? null
            const base = f?.shortName || f?.name || String(leader.factionId)
            const tag = typeof leader?.factionTag === 'string' ? leader.factionTag.trim() : ''
            const label = tag ? `${base} · ${tag}` : base
            const title = f?.name ? `查看阵营：${f.name}` : '查看阵营'
            return {
                label: '阵营',
                value: (
                    <Link
                        to={`/faction/${leader.factionId}`}
                        className="location-link tag-clickable"
                        title={title}
                    >
                        {label} <span className="jump-icon">↗</span>
                    </Link>
                )
            }
        })(),
        { label: '生卒', value: formatLifeYearRange(leader.birthYear, leader.deathYear) },
        { label: '在位', value: formatReignValue(leader) },
        (family?.ancestralHome || leader.ancestralHome) && {
            label: '祖籍',
            value: (
                <Link
                    to={family ? `/map?family=${family.id}` : `/map?leader=${leader.id}`}
                    className="location-link tag-clickable"
                    title="在地图中定位详细祖籍地"
                >
                    {family ? `${family.ancestralHome} ` : leader.ancestralHome} <span className="jump-icon">↗</span>
                </Link>
            )
        },
        leader.birthplace && {
            label: '出生地',
            value: (
                <Link
                    to={`/map?leader=${leader.id}&focus=birthplace`}
                    className="location-link tag-clickable"
                    title="在地图中定位详细出生地"
                >
                    {leader.birthplace} <span className="jump-icon">↗</span>
                </Link>
            )
        },
        { label: '民族', value: leader.ethnicity },
    ].filter(Boolean)

    const relatedEvents = (leader?.id && Array.isArray(events))
        ? events
            .filter(e => Array.isArray(e?.leaderIds) && e.leaderIds.includes(leader.id))
            .slice()
            .sort((a, b) => (a.year ?? 0) - (b.year ?? 0))
        : []

    // Defensive: some leader entries may miss these arrays; also route switches render once before activeTab resets.
    const safeTimeline = Array.isArray(leader.timeline) ? leader.timeline : []
    const safeAchievements = Array.isArray(leader.achievements) ? leader.achievements : []
    const safeControversies = Array.isArray(leader.controversies) ? leader.controversies : []
    const totalScore = leader?.ratings ? computeTotalScore(leader.ratings) : null

    return (
        <div className="leader-detail" id="leader-detail">
            <div className="container">
                <Link to="/" className="leader-back">
                    ← 返回首页
                </Link>

                {/* Profile Card */}
                <div
                    className="profile-card"
                    style={{ '--profile-color': themeColor }}
                >
                    <div
                        className="profile-card"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: `linear-gradient(90deg, ${themeColor}, ${withOpacity(themeColor, 0.3)})`,
                            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                            padding: 0,
                            border: 'none',
                            margin: 0,
                        }}
                    />
                    <div className="profile-avatar-section">
                        <div
                            className="profile-avatar"
                            style={{ background: `linear-gradient(135deg, ${themeColor}, ${withOpacity(themeColor, 0.5)})` }}
                        >
                            {avatarSrc && !avatarImgFailed ? (
                                <img
                                    src={avatarSrc}
                                    alt={leaderName}
                                    loading="eager"
                                    decoding="async"
                                    referrerPolicy="no-referrer"
                                    onError={() => setAvatarImgFailed(true)}
                                />
                            ) : (
                                leaderInitial
                            )}
                        </div>
                        {polityLinks.length > 0 && (
                            <div className="profile-polity-badges">
                                {polityLinks.map(p => (
                                    <Link
                                        key={p.id}
                                        to={p.to}
                                        className="profile-dynasty-badge"
                                        style={{
                                            background: withOpacity(p.color || themeColor, 0.15),
                                            color: p.color || themeColor,
                                            border: `1px solid ${withOpacity(p.color || themeColor, 0.3)}`
                                        }}
                                    >
                                        {p.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="profile-info">
                        <h1 className="profile-name">
                            {leaderName}
                            <span className="profile-title-badge">{leader.title}</span>
                            {family && (
                                <Link
                                    to={`/family/${family.id}`}
                                    className="leader-family-tag"
                                    style={{ '--family-color': family.color || '#c9a96e' }}
                                    title={`查看家族：${family.name}`}
                                >
                                    {family.name}
                                </Link>
                            )}
                        </h1>

                        <div className="profile-info-grid">
                            {infoItems.map(item => (
                                <div className="profile-info-item" key={item.label}>
                                    <span className="profile-info-label">{item.label}</span>
                                    <span className="profile-info-value">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="detail-tabs">
                    <div className="tab-bar">
                        {TAB_LIST.map(tab => (
                            <button
                                key={tab.key}
                                className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                                id={`tab-${tab.key}`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                        <div className="tab-bar-spacer" />
                        <Link
                            to={`/tools/leader-compare?left=${encodeURIComponent(String(leader.id))}`}
                            className="tab-compare-btn"
                            title="打开人物对比工具（当前人物在左侧）"
                        >
                            对比 ↗
                        </Link>
                    </div>

                    <div className="detail-tab-content" key={activeTab}>
                        {activeTab === 'bio' && (
                            <div className="bio-content">{leader.bio}</div>
                        )}

                        {activeTab === 'timeline' && (
                            <div className="leader-timeline">
                                {safeTimeline.map((item, i) => (
                                    <div
                                        className="leader-timeline-item"
                                        key={i}
                                        style={{ animationDelay: `${i * 0.05}s` }}
                                    >
                                        <div className="leader-timeline-dot" />
                                        <div className="leader-timeline-year">{formatYearShort(item.year)}</div>
                                        <div className="leader-timeline-event">{item.event}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'achievements' && (
                            <div className="achievement-list">
                                {safeAchievements.map((item, i) => (
                                    <div
                                        className="achievement-item"
                                        key={i}
                                        style={{ animationDelay: `${i * 0.08}s` }}
                                    >
                                        <div className="achievement-title">✦ {item.title}</div>
                                        <div className="achievement-desc">{item.description}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'controversies' && (
                            <div className="controversy-list">
                                {safeControversies.map((item, i) => (
                                    <div
                                        className="controversy-item"
                                        key={i}
                                        style={{ animationDelay: `${i * 0.08}s` }}
                                    >
                                        <div className="controversy-title">⚡ {item.title}</div>
                                        <div className="controversy-desc">{item.description}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'events' && (
                            <div className="leader-event-list">
                                {relatedEvents.map((evt, i) => (
                                    <Link
                                        key={evt.id}
                                        to={`/event/${evt.id}`}
                                        className="leader-event-item"
                                        style={{ animationDelay: `${i * 0.08}s` }}
                                    >
                                        <div className="leader-event-head">
                                            <div className="leader-event-title">
                                                ✦ {evt.name}
                                                <span className="leader-event-year">{formatYearShort(evt.year)}</span>
                                            </div>
                                        </div>
                                        <div className="leader-event-desc">
                                            {(evt.location ? `${evt.location} · ` : '')}{evt.summary || evt.impact || ''}
                                        </div>
                                    </Link>
                                ))}
                                {relatedEvents.length === 0 && (
                                    <div className="leader-event-empty">
                                        暂无关联事件（可在 <code>data/historical_events.json</code> 的事件条目里补充 leaderIds）。
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'summary' && (
                            <div className="summary-content">
                                <div className="summary-chart">
                                    <RadarChart leader={leader} ratings={leader.ratings} color={themeColor} />
                                </div>
                                <div className="summary-text">
                                    <div className="summary-title-row">
                                        <h3>综合评述</h3>
                                        {Number.isFinite(totalScore) ? (
                                            <div className="summary-score" aria-label="综合评价分数">
                                                (
                                                <span className="summary-score-num">{totalScore}</span>
                                                <span className="summary-score-den">/100</span>
                                                )
                                            </div>
                                        ) : null}
                                    </div>
                                    <p>{leader.summary}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {((prevLeaders && prevLeaders.length > 0) || (nextLeaders && nextLeaders.length > 0)) && (
                    <nav className="detail-prev-next" aria-label="上一领导人与下一领导人">
                        <div className="detail-prev-next-col">
                            {prevLeaders && prevLeaders.length > 0 ? (
                                prevLeaders.map(p => (
                                    <Link
                                        key={`${p.groupId || 'prev'}:${p.leader.id}`}
                                        to={`/leader/${p.leader.id}${activeTab !== 'bio' ? `?tab=${activeTab}` : ''}`}
                                        className="detail-prev-next-card"
                                    >
                                        <div className="detail-prev-next-k">
                                            上一领导人
                                            {prevLeaders.length > 1 && p.groupLabel ? (
                                                <span className="detail-prev-next-sub"> · {p.groupLabel}</span>
                                            ) : null}
                                        </div>
                                        <div className="detail-prev-next-v">{p.leader.name}</div>
                                    </Link>
                                ))
                            ) : (
                                <div className="detail-prev-next-spacer" />
                            )}
                        </div>

                        <div className="detail-prev-next-col align-right">
                            {nextLeaders && nextLeaders.length > 0 ? (
                                nextLeaders.map(n => (
                                    <Link
                                        key={`${n.groupId}:${n.leader.id}`}
                                        to={`/leader/${n.leader.id}${activeTab !== 'bio' ? `?tab=${activeTab}` : ''}`}
                                        className="detail-prev-next-card align-right"
                                    >
                                        <div className="detail-prev-next-k">
                                            下一领导人
                                            {nextLeaders.length > 1 && n.groupLabel ? (
                                                <span className="detail-prev-next-sub"> · {n.groupLabel}</span>
                                            ) : null}
                                        </div>
                                        <div className="detail-prev-next-v">{n.leader.name}</div>
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
