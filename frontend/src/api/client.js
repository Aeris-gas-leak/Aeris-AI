const BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:5001'

export const api = {
  chartRoom:      (room) => fetch(`${BASE}/api/chart/${encodeURIComponent(room)}`).then(r => r.json()),
  chartAll:       ()     => fetch(`${BASE}/api/chart/all`).then(r => r.json()),
  triggerRequest: ()     => fetch(`${BASE}/api/trigger/request`, { method: 'POST' }).then(r => r.json()),
  triggerStatus:  ()     => fetch(`${BASE}/api/trigger/status`).then(r => r.json()),
}
