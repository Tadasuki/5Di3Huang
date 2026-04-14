import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAllLeaders, useFamilies } from '../../hooks/useDynasties'
import './MapView.css'

import { MAPTILER_KEY, hasMapKey } from '../../config/maptiler'

// --- 引入真实数据 ---
import eventsData from '../../../data/historical_events.json'
import dynastiesData from '../../../data/dynasties.json'
import regionalData from '../../../data/regional_regimes.json'

// 合并所有政权用于提取都城点，并注入路由类型以便跳转
const allPolities = [
    ...dynastiesData.map(d => ({ ...d, routeType: 'dynasty' })),
    ...regionalData.map(r => ({ ...r, routeType: 'regional' }))
]

// 全局缓存地图 DOM 和实例，避免切换页面时重复加载
let cachedMapElement = null
let cachedMapInstance = null
let cachedMaptilerSDK = null
let globalMapLoaded = false

function raf2(fn) {
    requestAnimationFrame(() => requestAnimationFrame(fn))
}

export default function MapView() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const focusLng = parseFloat(searchParams.get('lng'))
    const focusLat = parseFloat(searchParams.get('lat'))
    const validFocus = !isNaN(focusLng) && !isNaN(focusLat)

    // 获取 URL 中的 event 参数并查找对应的事件数据
    const eventId = searchParams.get('event')
    const targetEvent = eventId ? eventsData.find(e => String(e.id) === eventId) : null

    // 【修复】将 leaders 的声明提前，避免在查找 targetLeader 时报 ReferenceError 导致白屏
    const leaders = useAllLeaders()

    const { families } = useFamilies()

    // 获取 URL 中的 leader, polity 或 family 参数并查找对应数据
    const leaderId = searchParams.get('leader')
    const targetLeader = leaderId ? leaders.find(l => String(l.id) === leaderId) : null

    const polityId = searchParams.get('polity') || searchParams.get('dynasty')
    const targetPolity = polityId ? allPolities.find(p => String(p.id) === polityId) : null

    const familyParam = searchParams.get('family')
    const targetFamily = familyParam ? families.find(f => String(f.id) === familyParam) : null

    // 统一计算初始聚焦坐标
    const focusType = searchParams.get('focus')
    const leaderFocusCoords = focusType === 'birthplace' ? targetLeader?.birthplaceCoords : (targetLeader?.ancestralHomeCoords || targetLeader?.birthplaceCoords)
    const focusCoords = validFocus ? [focusLng, focusLat] : (targetEvent?.coords || targetFamily?.ancestralHomeCoords || leaderFocusCoords || targetPolity?.capitalCoords)

    const mapContainer = useRef(null)
    const map = useRef(null)
    const markersRef = useRef([])
    const [mapLoaded, setMapLoaded] = useState(globalMapLoaded)
    const [filter, setFilter] = useState(searchParams.get('filter') || 'all')

    // 统一的“先 resize 再飞行”：避免容器尺寸未就绪导致图标/画布错位到左上角
    const flyToFocus = useMemo(() => {
        return (center, opts = {}) => {
            if (!center || !map.current) return
            const m = map.current
            raf2(() => {
                try {
                    m.resize()
                } catch {
                    // ignore
                }
                m.flyTo({
                    center,
                    zoom: 10,
                    duration: 700,
                    essential: true,
                    ...opts,
                })
            })
        }
    }, [])

    // 只要容器尺寸变化，就 resize 地图；这能稳定修复“偶发卡到左上角”的渲染错位
    useEffect(() => {
        if (!mapContainer.current) return
        if (!('ResizeObserver' in window)) return

        const ro = new ResizeObserver(() => {
            if (!map.current) return
            raf2(() => {
                try {
                    map.current.resize()
                } catch {
                    // ignore
                }
            })
        })
        ro.observe(mapContainer.current)
        return () => ro.disconnect()
    }, [])

    // 1. 仅初始化一次地图，并使用 DOM 缓存策略
    useEffect(() => {
        if (!hasMapKey()) return // skip if no key
        if (!mapContainer.current) return

        const initMap = async () => {
            if (!cachedMaptilerSDK) {
                const module = await import('@maptiler/sdk')
                await import('@maptiler/sdk/dist/maptiler-sdk.css')
                module.config.apiKey = MAPTILER_KEY
                cachedMaptilerSDK = module
            }

            // 1. 先将缓存 DOM 插入到页面中，使其获得实际物理尺寸，避免 WebGL 初始化为 0x0 导致隐形空白
            if (!cachedMapElement) {
                cachedMapElement = document.createElement('div')
                cachedMapElement.style.width = '100%'
                cachedMapElement.style.height = '100%'
            }

            if (mapContainer.current && !mapContainer.current.contains(cachedMapElement)) {
                mapContainer.current.appendChild(cachedMapElement)
            }

            // 移动/挂载缓存 DOM 后先 resize 一次，避免尺寸滞后
            raf2(() => {
                try {
                    cachedMapInstance?.resize?.()
                } catch {
                    // ignore
                }
            })

            // 2. 确认 DOM 在页面中具有尺寸后，再启动地图渲染
            if (!cachedMapInstance) {
                cachedMapInstance = new cachedMaptilerSDK.Map({
                    container: cachedMapElement,
                    style: '019d846a-8225-7948-b5a8-8421fd25e392',
                    center: [104.0, 35.0],
                    zoom: 4,
                })

                cachedMapInstance.on('load', () => {
                    globalMapLoaded = true
                    setMapLoaded(true)
                    if (focusCoords) {
                        // 点击地名跳转后，地图加载完成即平滑飞行到目标标签/大头针
                        map.current = cachedMapInstance
                        flyToFocus(focusCoords, { duration: 900 })
                    }
                })
            } else {
                // 如果缓存已存在，同步状态并平滑飞行至目标点
                setMapLoaded(globalMapLoaded)
                if (focusCoords && cachedMapInstance) {
                    map.current = cachedMapInstance
                    flyToFocus(focusCoords, { duration: 700 })
                }
                // 强制重绘，防止切换页面时尺寸计算异常
                raf2(() => {
                    try {
                        cachedMapInstance.resize()
                    } catch {
                        // ignore
                    }
                })
            }

            map.current = cachedMapInstance
        }

        initMap()

        return () => {
            // 卸载时不销毁地图，仅将 DOM 从当前组件拔出
            if (cachedMapElement && cachedMapElement.parentNode) {
                cachedMapElement.parentNode.removeChild(cachedMapElement)
            }
        }
    }, [focusLng, focusLat, eventId, leaderId, polityId, flyToFocus, focusCoords])

    // 新增：监听地图容器内的点击事件，拦截弹窗中的跳转按钮
    useEffect(() => {
        const handleMapClick = (e) => {
            const target = e.target.closest('.map-popup-nav-btn')
            if (target) {
                e.preventDefault()
                const url = target.getAttribute('data-url')
                if (url) navigate(url)
            }
        }

        const container = mapContainer.current
        if (container) {
            container.addEventListener('click', handleMapClick)
        }
        return () => {
            if (container) container.removeEventListener('click', handleMapClick)
        }
    }, [navigate])

    // 2. 监听数据变化与地图加载状态，独立添加 Marker
    useEffect(() => {
        if (!mapLoaded || !map.current || leaders.length === 0) return

        import('@maptiler/sdk').then(maptilerSDK => {
            // 先清理旧的 Markers
            markersRef.current.forEach(m => m.remove())
            markersRef.current = []

            // 1a. 添加家族/统治者祖籍点 (符合 "all" 或 "祖籍" 过滤条件时显示)
            if (filter === 'all' || filter === '祖籍') {
                // 1) 绘制家族
                families.forEach(fam => {
                    if (fam.ancestralHomeCoords) {
                        const popup = new maptilerSDK.Popup({ offset: 25 })
                            .setHTML(`
                <div style="font-family: sans-serif; padding: 4px;">
                  <strong style="color: ${fam.color || '#c9a96e'}">${fam.name}</strong>
                  <br/><small>发迹地: ${fam.ancestralHome}</small>
                  <button class="map-popup-nav-btn btn btn-outline btn-sm" data-url="/family/${fam.id}" style="margin-top: 8px; width: 100%; cursor: pointer; padding: 4px 8px; font-size: 12px;">家族详情</button>
                </div>
              `)
                        const marker = new maptilerSDK.Marker({ color: '#c9a96e' })
                            .setLngLat(fam.ancestralHomeCoords)
                            .setPopup(popup)
                            .addTo(map.current)
                        markersRef.current.push(marker)

                        if (String(fam.id) === familyParam || (leaderId && targetLeader?.familyId === String(fam.id) && searchParams.get('focus') !== 'birthplace')) {
                            flyToFocus(fam.ancestralHomeCoords, { duration: 500 })
                            marker.togglePopup()
                        }
                    }
                })

                // 2) 绘制没有单独归类家族的统治者个体祖籍
                leaders.forEach(leader => {
                    if (!leader.familyId && leader.ancestralHomeCoords) {
                        const popup = new maptilerSDK.Popup({ offset: 25 })
                            .setHTML(`
                <div style="font-family: sans-serif; padding: 4px;">
                  <strong>${leader.name}</strong>
                  <br/><small>祖籍: ${leader.ancestralHome}</small>
                  <button class="map-popup-nav-btn btn btn-outline btn-sm" data-url="/leader/${leader.id}" style="margin-top: 8px; width: 100%; cursor: pointer; padding: 4px 8px; font-size: 12px;">人物详情</button>
                </div>
              `)
                        const marker = new maptilerSDK.Marker({ color: '#c9a96e' })
                            .setLngLat(leader.ancestralHomeCoords)
                            .setPopup(popup)
                            .addTo(map.current)
                        markersRef.current.push(marker)

                        // 如果该标记是 URL 中指定的人物且需要聚焦在该祖籍
                        if (String(leader.id) === leaderId && searchParams.get('focus') !== 'birthplace') {
                            flyToFocus(leader.ancestralHomeCoords, { duration: 500 })
                            marker.togglePopup()
                        }
                    }
                })
            }

            // 1b. 添加统治者出生地点 (符合 "all" 或 "出生地" 过滤条件时显示)
            if (filter === 'all' || filter === '出生地') {
                leaders.forEach(leader => {
                    if (leader.birthplaceCoords) {
                        const popup = new maptilerSDK.Popup({ offset: 25 })
                            .setHTML(`
                <div style="font-family: sans-serif; padding: 4px;">
                  <strong>${leader.name}</strong>
                  <br/><small>出生地: ${leader.birthplace}</small>
                  <button class="map-popup-nav-btn btn btn-outline btn-sm" data-url="/leader/${leader.id}" style="margin-top: 8px; width: 100%; cursor: pointer; padding: 4px 8px; font-size: 12px;">人物详情</button>
                </div>
              `)
                        const marker = new maptilerSDK.Marker({ color: '#3a7cb3' })
                            .setLngLat(leader.birthplaceCoords)
                            .setPopup(popup)
                            .addTo(map.current)
                        markersRef.current.push(marker)

                        // 如果该标记是 URL 中指定的人物且需要聚焦于出生地
                        if (String(leader.id) === leaderId && searchParams.get('focus') === 'birthplace') {
                            flyToFocus(leader.birthplaceCoords, { duration: 500 })
                            marker.togglePopup()
                        }
                    }
                })
            }

            // 2. 添加历史事件点 (符合 "all" 或 "事件" 过滤条件时显示)
            if (filter === 'all' || filter === '事件') {
                eventsData.forEach(evt => {
                    if (evt.coords) {
                        const timeStr = evt.year < 0 ? `公元前${Math.abs(evt.year)}年` : `公元${evt.year}年`
                        const popup = new maptilerSDK.Popup({ offset: 25 })
                            .setHTML(`
                <div style="font-family: sans-serif; padding: 4px; max-width: 200px;">
                  <strong style="color: var(--color-vermilion);">${evt.name}</strong> <small>(${timeStr})</small>
                  <br/><span style="font-size: 0.8rem;">${evt.location}</span>
                  <br/><small style="display: block; margin-top: 4px; line-height: 1.4;">${evt.summary}</small>
                  <button class="map-popup-nav-btn btn btn-outline btn-sm" data-url="/event/${evt.id}" style="margin-top: 8px; width: 100%; cursor: pointer; padding: 4px 8px; font-size: 12px;">事件详情</button>
                </div>
              `)
                        const marker = new maptilerSDK.Marker({ color: '#b33a3a' })
                            .setLngLat(evt.coords)
                            .setPopup(popup)
                            .addTo(map.current)
                        markersRef.current.push(marker)

                        // 如果该标记是 URL 中指定的事件，自动打开其弹窗
                        if (String(evt.id) === eventId) {
                            flyToFocus(evt.coords, { duration: 500 })
                            marker.togglePopup()
                        }
                    }
                })
            }

            // 3. 添加历代都城点 (符合 "all" 或 "建都" 过滤条件时显示)
            if (filter === 'all' || filter === '建都') {
                allPolities.forEach(polity => {
                    if (polity.capitalCoords) {
                        const popup = new maptilerSDK.Popup({ offset: 25 })
                            .setHTML(`
                <div style="font-family: sans-serif; padding: 4px;">
                  <strong style="color: var(--color-jade);">${polity.name}都城：${polity.capital}</strong>
                  <button class="map-popup-nav-btn btn btn-outline btn-sm" data-url="/${polity.routeType}/${polity.id}" style="margin-top: 8px; width: 100%; cursor: pointer; padding: 4px 8px; font-size: 12px;">政权详情</button>
                </div>
              `)
                        const marker = new maptilerSDK.Marker({ color: '#4a8b6f' })
                            .setLngLat(polity.capitalCoords)
                            .setPopup(popup)
                            .addTo(map.current)
                        markersRef.current.push(marker)

                        // 如果该标记是 URL 中指定的政权/朝代，自动打开其弹窗
                        if (String(polity.id) === polityId) {
                            flyToFocus(polity.capitalCoords, { duration: 500 })
                            marker.togglePopup()
                        }
                    }
                })
            }
        })

        // 卸载组件时清理缓存地图上的旧标记，防止重复叠加
        return () => {
            markersRef.current.forEach(m => m.remove())
            markersRef.current = []
        }
    }, [mapLoaded, leaders, families, filter, eventId, leaderId, polityId, familyParam])

    const showPlaceholder = !hasMapKey()

    const filters = ['all', '祖籍', '出生地', '事件', '建都']

    return (
        <div className="map-page" id="map-page">
            <div className="map-header container">
                <h1 className="map-title">历史地图</h1>
                <div className="map-filters">
                    {filters.map(f => (
                        <button
                            key={f}
                            className={`map-filter-btn ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? '全部' : f}
                        </button>
                    ))}
                </div>
            </div>

            {showPlaceholder ? (
                <div className="map-placeholder">
                    <div className="map-placeholder-icon">🗺️</div>
                    <div className="map-placeholder-text">
                        地图功能需要 MapTiler API Key
                    </div>
                    <div className="map-placeholder-tip">
                        请前往 <a href="https://www.maptiler.com/" target="_blank" rel="noopener noreferrer">maptiler.com</a> 注册获取免费 API Key，<br />
                        然后在 <code>src/components/map/MapView.jsx</code> 中替换 <code>YOUR_MAPTILER_API_KEY</code>
                    </div>
                    <div style={{ marginTop: '24px', padding: '16px', background: 'var(--color-bg-tertiary)', borderRadius: '12px', maxWidth: '500px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                            <strong>📍 已录入地理坐标：</strong>
                        </p>
                        {leaders.map(l => (
                            <div key={l.id} style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', padding: '2px 0' }}>
                                {l.name} — 祖籍: {l.ancestralHome} [{l.ancestralHomeCoords?.join(', ')}] | 出生地: {l.birthplace} [{l.birthplaceCoords?.join(', ')}]
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="map-container">
                    {/* 增加一层隔离的原生挂载点，彻底防止 React 渲染下方图例时误杀地图节点 */}
                    <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                    {mapLoaded && (
                        <div className="map-legend">
                            <div className="map-legend-title">图例</div>
                            <div className="map-legend-item">
                                <span className="map-legend-dot" style={{ background: '#c9a96e' }} />
                                统治者祖籍
                            </div>
                            <div className="map-legend-item">
                                <span className="map-legend-dot" style={{ background: '#3a7cb3' }} />
                                统治者出生地
                            </div>
                            <div className="map-legend-item">
                                <span className="map-legend-dot" style={{ background: '#b33a3a' }} />
                                历史事件
                            </div>
                            <div className="map-legend-item">
                                <span className="map-legend-dot" style={{ background: '#4a8b6f' }} />
                                历代都城
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
