import { useEffect, useRef } from 'react'
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
import './RadarChart.css'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

function wrapTooltipText(text, maxChars = 18) {
  if (typeof text !== 'string') return []
  const t = text.trim()
  if (!t) return []
  const lines = []
  for (let i = 0; i < t.length; i += maxChars) {
    lines.push(t.slice(i, i + maxChars))
  }
  return lines
}

export default function RadarChart({ leader, ratings, color = '#c9a96e' }) {
  const srcRatings = ratings || leader?.ratings
  if (!srcRatings) return null

  const data = {
    labels: RATING_DIMENSIONS.map(d => d.label),
    datasets: [
      {
        label: '综合评分',
        data: RATING_DIMENSIONS.map(d => getRatingValue(srcRatings, d.key)),
        backgroundColor: withOpacity(color, 0.2),
        borderColor: color,
        borderWidth: 2,
        pointBackgroundColor: color,
        pointBorderColor: '#f7f4ee',
        pointBorderWidth: 1,
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        angleLines: {
          color: 'rgba(44, 40, 32, 0.1)',
        },
        grid: {
          color: 'rgba(44, 40, 32, 0.06)',
        },
        pointLabels: {
          color: '#5c5548',
          font: {
            size: 13,
            family: "'OPPO Sans', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
            weight: 600,
          },
        },
        ticks: {
          display: false,
          stepSize: 20,
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(44, 40, 32, 0.92)',
        titleColor: '#f7f4ee',
        bodyColor: '#e8e2d6',
        titleFont: {
          family: "'OPPO Sans', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
          size: 13,
        },
        bodyFont: {
          family: "'OPPO Sans', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
          size: 12,
        },
        borderColor: 'rgba(201, 169, 110, 0.3)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: (items) => {
            const first = items?.[0]
            return first?.label || '评分'
          },
          label: (ctx) => `${ctx.raw}/100`,
          afterLabel: (ctx) => {
            const dim = RATING_DIMENSIONS[ctx.dataIndex]
            if (!dim) return ''
            return wrapTooltipText(getRatingExplain(leader, dim.key), 18)
          },
        },
      },
    },
  }

  return (
    <div className="radar-chart-container">
      <Radar data={data} options={options} />
    </div>
  )
}
