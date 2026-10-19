import { useRef, useEffect } from 'react'
import {
  Chart, LineElement, PointElement, LineController,
  LinearScale, Filler, Tooltip,
} from 'chart.js'
import { chartPoints, timeAt } from '../sensors/sessions.js'
import { levelFor } from '../sensors/rooms.js'
import { formatClock } from '../format.js'

Chart.register(LineElement, PointElement, LineController, LinearScale, Filler, Tooltip)

const LEVEL_RANK = { normal: 0, warning: 1, danger: 2 }
const TICK_STEPS = [10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600]

function lastValue(values) {
  for (let i = values.length - 1; i >= 0; i--) if (values[i] != null) return values[i]
  return null
}

function fade(color) {
  return (ctx) => {
    const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 180)
    g.addColorStop(0, color + '44')
    g.addColorStop(1, color + '00')
    return g
  }
}

// series: [{ label, color, values }], values one per second of `session`.
// With one series the chart fills under the line; with several, each room
// gets its own line and the legend names them.
export default function ChartBlock({ title, emoji, metric, session, series }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)
  const single = series.length === 1
  const unit = metric.unit ? (metric.unit === '%' ? '%' : ` ${metric.unit}`) : ''

  const latest = series.map(s => lastValue(s.values))
  const status = latest.reduce((worst, v) => {
    const l = levelFor(metric, v)
    return LEVEL_RANK[l] > LEVEL_RANK[worst] ? l : worst
  }, 'normal')

  useEffect(() => {
    const chart = new Chart(canvasRef.current, {
      type: 'line',
      data: { datasets: [] },
      options: {
        responsive: true,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false } },
        scales: {
          x: { type: 'linear', ticks: { color: '#6b7280', font: { size: 10 }, maxRotation: 0, includeBounds: false }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.06)' } },
        },
      },
    })
    chartRef.current = chart
    return () => chart.destroy()
  }, [])

  // Runs after every render: the recorder fills its arrays in place, so the
  // chart is refreshed rather than rebuilt.
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    const end = Math.max(1, (session.length - 1) * session.sampleSeconds)
    const threshold = (value, color) => ({
      data: [{ x: 0, y: value }, { x: end, y: value }],
      borderColor: color, borderWidth: 1.5, borderDash: [5, 4],
      pointRadius: 0, pointHoverRadius: 0, fill: false, tension: 0,
    })

    chart.data.datasets = [
      ...series.map(s => ({
        label: s.label,
        data: chartPoints(session, s.values),
        borderColor: s.color,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        spanGaps: true,
        fill: single,
        backgroundColor: single ? fade(s.color) : s.color,
      })),
      threshold(metric.warning, '#f5a623'),
      threshold(metric.danger, '#ff4c4c'),
    ]
    chart.options.scales.x.min = 0
    chart.options.scales.x.max = end
    const step = TICK_STEPS.find(s => end / s <= 4) ?? 7200
    chart.options.scales.x.ticks.stepSize = step
    chart.options.scales.x.ticks.callback = x => formatClock(timeAt(session, x / session.sampleSeconds), step >= 60)
    chart.options.plugins.tooltip = {
      filter: item => item.datasetIndex < series.length,
      callbacks: {
        title: items => items.length ? formatClock(timeAt(session, items[0].parsed.x / session.sampleSeconds)) : '',
        label: c => ` ${single ? '' : c.dataset.label + ': '}${c.parsed.y.toFixed(metric.decimals)}${unit}`,
      },
    }
    chart.update('none')
  })

  const shown = single ? latest[0] : null

  return (
    <div className="chart-block">
      <div className="chart-block-header">
        <span className="chart-metric-name">{emoji} {title}</span>
        <span className={`danger-badge badge-${status}`}>{status.toUpperCase()}</span>
      </div>
      {single && (
        <div className="chart-current">{shown == null ? '–' : shown.toFixed(metric.decimals)}{unit}</div>
      )}
      <div className="legend-row">
        {series.map(s => (
          <div className="legend-dot" key={s.label}>
            <div className="legend-line" style={{ background: s.color }}></div>
            {single ? 'Reading' : `${s.label} ${lastValue(s.values)?.toFixed(metric.decimals) ?? '–'}${unit}`}
          </div>
        ))}
        <div className="legend-dot">
          <div className="legend-line" style={{ background: '#f5a623', opacity: 0.7 }}></div>
          Warning ≥{metric.warning}{unit}
        </div>
        <div className="legend-dot">
          <div className="legend-line" style={{ background: '#ff4c4c', opacity: 0.7 }}></div>
          Danger ≥{metric.danger}{unit}
        </div>
      </div>
      <canvas ref={canvasRef} height={120} role="img" aria-label={`${title} chart`}></canvas>
    </div>
  )
}
