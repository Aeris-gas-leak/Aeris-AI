# Aeris frontend

React + Vite website and monitoring app.

Use Node.js 22 LTS or 24 LTS for compatibility with the lint toolchain.

## Run locally

```sh
npm ci
npm run dev
```

Everything runs in the browser. The app does not need the Python API.

## Pages

- `/`: public homepage. The floor preview contains fixed, explicitly labeled sample readings.
- `/app`: the Recorder. Press **Record** to stream readings from a simulated sensor node in each room (Rooms A–D). Charts, the rooms table, threshold events and the per-room summary update as readings arrive. Speed runs at real time, 10× or 60×.
- `/app/recordings`: recordings saved when you stop. They are kept in this browser's local storage, and each one downloads as a CSV.
- `/app/recordings/:id`: one saved recording.

Old prototype links (`/rooms`, `/alerts`, …) redirect to `/app`.

## Where the data comes from

`src/sensors/simulator.js` stands in for the Raspberry Pi. It models each room with a baseline, a thermostat cycle, slow drift, sensor noise, the link between temperature and relative humidity, and random heat and moisture events. It also drops the occasional reading the way a real sensor does. Room baselines and event rates live in `src/sensors/rooms.js`, next to the thresholds. Those thresholds mirror `THRESHOLDS` in `app.py`.

CSV exports use the Pi's columns with a `room` column added:

```
timestamp,room,temperature_C,humidity_%,pressure_hPa
2026-10-16 18:33:58,A,23.74,50.01,1014.22
```

Connecting the Pi means feeding its readings into `src/sensors/recorder.js` in place of `simulator.step()`. Everything downstream stays the same.

## Check and build

```sh
npm run lint
npm run build
```

Publish `dist` on a static host configured to serve `index.html` for client-side routes. `public/_redirects` supplies this fallback for Netlify.
