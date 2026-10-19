function pad(n) {
  return String(n).padStart(2, '0')
}

// Wall-clock time of a reading: 14:03:27, or 14:03 when seconds are noise.
export function formatClock(ms, short = false) {
  const d = new Date(ms)
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  return short ? hm : `${hm}:${pad(d.getSeconds())}`
}

// Length of a recording: 4:09, or 1:04:09 past an hour.
export function formatDuration(seconds) {
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`
}

export function formatDate(ms) {
  return new Date(ms).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function formatCount(n) {
  return n.toLocaleString()
}

// 1 threshold event, 3 threshold events.
export function plural(n, word) {
  return `${formatCount(n)} ${word}${n === 1 ? '' : 's'}`
}
