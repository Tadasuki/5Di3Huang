import { Link } from 'react-router-dom'
import './ToolsView.css'

const tools = [
  {
    id: 'leader-compare',
    icon: '🧑‍🤝‍🧑',
    name: '人物对比',
    desc: '左右对照人物信息；生卒时间轴比较年份位置与跨度长短；八维评分叠加；总结文字并排对读。',
    status: 'available',
    to: '/tools/leader-compare',
  },
  {
    id: 'rating-rank',
    icon: '🏆',
    name: '治国评分排行',
    desc: '根据军事、仁德、历史影响等八项指标对历代执政者进行综合排名。',
    status: 'available',
    to: '/tools/rating-rank',
  },
  {
    id: 'dynasty-compare',
    icon: '⚖️',
    name: '朝代对比',
    desc: '选择两个或多个朝代，对比其国土面积、人口数量、经济实力、文化成就等各项指标。',
    status: 'coming'
  },
  {
    id: 'reign-stats',
    icon: '📊',
    name: '统治时长统计',
    desc: '可视化展示各朝代、各帝王的在位时长，找出最长和最短的统治时期。',
    status: 'coming'
  },
  {
    id: 'region-analysis',
    icon: '🌏',
    name: '地域分布分析',
    desc: '分析历代执政者的祖籍分布，探索权力中心的地理变迁规律。',
    status: 'coming'
  },
  {
    id: 'family-tree',
    icon: '🌳',
    name: '皇族世系图',
    desc: '以家族树的形式展示各朝代皇室的世系传承关系。',
    status: 'coming'
  },
  {
    id: 'era-search',
    icon: '🔎',
    name: '年号速查',
    desc: '输入年号快速查询对应的帝王、朝代和具体年份。',
    status: 'coming'
  },
]

export default function ToolsView() {
  return (
    <div className="tools-page" id="tools-page">
      <div className="container">
        <h1 className="tools-title">分析工具</h1>
        <p className="tools-subtitle">
          多维度分析中国历史数据，发现隐藏在时间长河中的规律与趋势
        </p>

        <div className="tools-grid">
          {tools.map((tool, i) => (
            tool.status === 'available' ? (
              <Link
                to={tool.to || '/tools'}
                className="tool-card"
                key={tool.id}
                id={`tool-${tool.id}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="tool-card-icon">{tool.icon}</div>
                <div className="tool-card-name">{tool.name}</div>
                <p className="tool-card-desc">{tool.desc}</p>
                <span className="tool-card-status status-available">可用</span>
              </Link>
            ) : (
              <div
                className="tool-card"
                key={tool.id}
                id={`tool-${tool.id}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="tool-card-icon">{tool.icon}</div>
                <div className="tool-card-name">{tool.name}</div>
                <p className="tool-card-desc">{tool.desc}</p>
                <span className="tool-card-status status-coming">开发中</span>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  )
}
