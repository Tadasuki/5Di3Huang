import { Link } from 'react-router-dom'
import LeaderCompareTool from './LeaderCompareTool'
import './LeaderComparePage.css'

export default function LeaderComparePage() {
  return (
    <div className="leader-compare-page" id="leader-compare-page">
      <div className="container">
        <div className="leader-compare-nav">
          <Link to="/tools" className="leader-compare-back">← 工具</Link>
          <Link to="/" className="leader-compare-back">首页</Link>
        </div>
        <LeaderCompareTool />
      </div>
    </div>
  )
}

