import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import { withOpacity } from '../../utils/colorUtils'
import { RATING_DIMENSIONS, getRatingExplain, getRatingValue } from '../../utils/ratings'
import './CompareRadar.css'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

function wrapTooltipText(text, maxChars = 18) {
  if (typeof text !== 'string') return []
  const t = text.trim()
  if (!t) return []
  // Chart.js tooltips treat arrays as multiple lines. For CJK text, chunk by character count.
  const lines = []
  for (let i = 0; i < t.length; i += maxChars) {
    lines.push(t.slice(i, i + maxChars))
  }
  return lines
}

function getRatings(leader) {
  const r = leader?.ratings
  return RATING_DIMENSIONS.map(d => getRatingValue(r, d.key))
}

export default function CompareRadar({ left, right, leftColor, rightColor }) {
  const has = Boolean(left?.ratings || right?.ratings)
  if (!has) {
    return <div className="cr-empty">暂无评分数据</div>
  }

  const data = {
    labels: RATING_DIMENSIONS.map(d => d.label),
    datasets: [
      {
        label: left?.name || '左侧',
        data: getRatings(left),
        backgroundColor: withOpacity(leftColor, 0.18),
        borderColor: leftColor,
        borderWidth: 2,
        pointBackgroundColor: leftColor,
        pointBorderColor: '#f7f4ee',
        pointBorderWidth: 1,
        pointRadius: 4,
      },
      {
        label: right?.name || '右侧',
        data: getRatings(right),
        backgroundColor: withOpacity(rightColor, 0.14),
        borderColor: rightColor,
        borderWidth: 2,
        pointBackgroundColor: rightColor,
        pointBorderColor: '#f7f4ee',
        pointBorderWidth: 1,
        pointRadius: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        angleLines: { color: 'rgba(44, 40, 32, 0.1)' },
        grid: { color: 'rgba(44, 40, 32, 0.06)' },
        pointLabels: {
          color: '#5c5548',
          font: { size: 13, family: "'Noto Sans SC', sans-serif", weight: 600 },
        },
        ticks: { display: false, stepSize: 20 },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#5c5548',
          font: { family: "'Noto Sans SC', sans-serif", size: 12, weight: 600 },
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(44, 40, 32, 0.92)',
        titleColor: '#f7f4ee',
        bodyColor: '#e8e2d6',
        borderColor: 'rgba(201, 169, 110, 0.3)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: (items) => {
            const first = items?.[0]
            return first?.label || '评分'
          },
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}/100`,
          afterLabel: (ctx) => {
            const dim = RATING_DIMENSIONS[ctx.dataIndex]
            if (!dim) return ''
            const leader = ctx.datasetIndex === 0 ? left : right
            return wrapTooltipText(getRatingExplain(leader, dim.key), 18)
          },
        },
      },
    },
  }

  return (
    <div className="cr-container">
      <Radar data={data} options={options} />
    </div>
  )
}
