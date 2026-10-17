import { useEffect, useRef } from 'react'
import {
  Chart, LineController, LineElement, PointElement, LinearScale, Tooltip,
} from 'chart.js'
import { chartPoints, timeAt } from '../sensors/sessions.js'
import { formatClock } from '../format.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip)
Chart.defaults.font.family = "'DM Sans', sans-serif"

const INK = '#183e32'
const MUTED = '#5b6a60'
const GRID = '#e3e8df'
const WARN_BAND = 'rgba(207, 187, 117, 0.22)'
const DANGER_BAND = 'rgba(176, 72, 52, 0.12)'
const WARN_LINE = '#b89b4c'
const DANGER_LINE = '#b04834'
const MIN_SPAN = { temperature: 1, humidity: 4, pressure: 1 }

// Shades the warning and danger zones behind the line and names each one at
// the right edge, so a reading's distance from a threshold is visible.
const thresholdBands = {
  id: 'thresholdBands',
  beforeDatasetsDraw(chart, _args, opts) {
    const { ctx, chartArea: area, scales: { y } } = chart
    if (!opts.metric) return
    const { warning, danger, unit } = opts.metric
    const yWarn = y.getPixelForValue(warning)
    const yDanger = y.getPixelForValue(danger)
    ctx.save()
    ctx.beginPath()
    ctx.rect(area.left, area.top, area.width, area.height)
    ctx.clip()
    ctx.fillStyle = WARN_BAND
    ctx.fillRect(area.left, yDanger, area.width, yWarn - yDanger)
    ctx.fillStyle = DANGER_BAND
    ctx.fillRect(area.left, area.top, area.width, yDanger - area.top)
    ctx.lineWidth = 1
    ctx.font = `11px 'DM Sans', sans-serif`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    for (const [value, py, color, name] of [
      [warning, yWarn, WARN_LINE, 'Warning'],
      [danger, yDanger, DANGER_LINE, 'Danger'],
    ]) {
      if (py < area.top || py > area.bottom) continue
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(area.left, Math.round(py) + 0.5)
      ctx.lineTo(area.right, Math.round(py) + 0.5)
      ctx.stroke()
      if (py - area.top > 14) {
        ctx.fillStyle = MUTED
        ctx.fillText(`${name} ${value} ${unit}`, area.right - 6, py - 3)
      }
    }
    ctx.restore()
  },
}

const crosshair = {
  id: 'crosshair',
  afterDatasetsDraw(chart) {
    const active = chart.tooltip?.getActiveElements()
    if (!active?.length) return
    const { ctx, chartArea: area } = chart
    const x = Math.round(active[0].element.x) + 0.5
    ctx.save()
    ctx.strokeStyle = MUTED
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, area.top)
    ctx.lineTo(x, area.bottom)
    ctx.stroke()
    ctx.restore()
  },
}

function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(raw))
  const f = raw / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
}

// Y range on round numbers, wide enough that sensor noise doesn't look like a trend.
function yRange(metric, points) {
  let lo = Infinity, hi = -Infinity
  for (const p of points) {
    if (p.y == null) continue
    if (p.y < lo) lo = p.y
    if (p.y > hi) hi = p.y
  }
  if (lo === Infinity) { lo = metric.warning - 2; hi = metric.warning }
  const minSpan = MIN_SPAN[metric.key]
  if (hi - lo < minSpan) {
    const mid = (hi + lo) / 2
    lo = mid - minSpan / 2
    hi = mid + minSpan / 2
  }
  // Bring the warning line into view when the readings are close to it.
  if (metric.warning - hi <= (hi - lo) * 1.5) hi = Math.max(hi, metric.warning + (hi - lo) * 0.2)
  const pad = (hi - lo) * 0.05
  const step = niceStep((hi - lo + 2 * pad) / 4)
  return {
    min: Math.floor((lo - pad) / step) * step,
    max: Math.ceil((hi + pad) / step) * step,
    step,
  }
}

const TIME_STEPS = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200]

// X ticks on whole clock times (14:05, 14:10, …) rather than whole seconds
// since the recording started.
function timeTicks(session, span) {
  const step = TIME_STEPS.find(s => span / s <= 5) ?? TIME_STEPS.at(-1)
  const start = session.startedAt / 1000
  const ticks = []
  for (let x = Math.ceil(start / step) * step - start; x <= span; x += step) ticks.push({ value: x })
  return { ticks, short: step >= 60 }
}

function describe(metric, points, roomLabel) {
  const ys = points.map(p => p.y).filter(v => v != null)
  if (!ys.length) return `${metric.label} in ${roomLabel}: no readings yet.`
  const fmt = v => `${v.toFixed(metric.decimals)} ${metric.unit}`
  return `${metric.label} in ${roomLabel}, ${fmt(Math.min(...ys))} to ${fmt(Math.max(...ys))}, latest ${fmt(ys.at(-1))}.`
}

export default function MetricChart({ session, roomId, roomLabel, metric, span }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    const chart = new Chart(canvasRef.current, {
      type: 'line',
      data: { datasets: [{ data: [] }] },
      options: {
        animation: false,
        maintainAspectRatio: false,
        parsing: false,
        normalized: true,
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        elements: {
          line: { borderColor: INK, borderWidth: 2, tension: 0, spanGaps: false },
          point: { radius: 0, hoverRadius: 4, hoverBorderWidth: 2, backgroundColor: INK, hoverBorderColor: '#fff' },
        },
        scales: {
          x: {
            type: 'linear',
            grid: { display: false },
            border: { color: '#c9d2c5' },
            ticks: { color: MUTED, font: { size: 11 }, maxRotation: 0 },
          },
          y: {
            grid: { color: GRID },
            border: { display: false },
            ticks: { color: MUTED, font: { size: 11 } },
          },
        },
        plugins: {
          legend: { display: false },
          thresholdBands: {},
          tooltip: {
            backgroundColor: '#fff',
            borderColor: '#c9d2c5',
            borderWidth: 1,
            titleColor: MUTED,
            bodyColor: INK,
            titleFont: { weight: 400, size: 11 },
            bodyFont: { weight: 600, size: 13 },
            padding: 8,
            cornerRadius: 4,
            displayColors: false,
            caretSize: 0,
          },
        },
      },
      plugins: [thresholdBands, crosshair],
    })
    chartRef.current = chart
    return () => chart.destroy()
  }, [])

  const points = chartPoints(session, session.rooms[roomId][metric.key])

  useEffect(() => {
    const chart = chartRef.current
    const range = yRange(metric, points)
    const o = chart.options
    chart.data.datasets[0].data = points
    o.plugins.thresholdBands.metric = metric
    const time = timeTicks(session, Math.max(span, 1))
    o.scales.x.min = 0
    o.scales.x.max = Math.max(span, 1)
    o.scales.x.afterBuildTicks = axis => { axis.ticks = time.ticks }
    o.scales.x.ticks.callback = v => formatClock(timeAt(session, v / session.sampleSeconds), time.short)
    o.scales.y.min = range.min
    o.scales.y.max = range.max
    o.scales.y.ticks.stepSize = range.step
    const decimals = (String(+range.step.toPrecision(3)).split('.')[1] ?? '').length
    o.scales.y.ticks.callback = v => v.toFixed(decimals)
    o.plugins.tooltip.callbacks = {
      title: items => formatClock(timeAt(session, items[0].parsed.x / session.sampleSeconds)),
      label: item => `${item.parsed.y.toFixed(2)} ${metric.unit}`,
    }
    chart.update('none')
  })

  return (
    <div className="metric-chart">
      <canvas ref={canvasRef} role="img" aria-label={describe(metric, points, roomLabel)} />
    </div>
  )
}
