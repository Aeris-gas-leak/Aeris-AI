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
- `/app`: opening screen. **Start recording** starts a recording and opens the dashboard.
- `/rooms`: dashboard. **Record** / **Stop**, speed (1×, 10× or 60×), live statistics, the factory map with one dot per sensor, and recent recordings.
- `/room/:roomName`: one room's latest readings and a chart per sensor.
- `/immediate`: every sensor, one chart per measurement with a line per room.
- `/alerts`: readings over a threshold right now, and the threshold events of the current or last recording.
- `/recordings` and `/recordings/:id`: recordings saved when you stop. They are kept in this browser's local storage, and each one downloads as a CSV.
- `/about`

While a recording runs, a bar at the top of every screen shows its length and a Stop button.

## Where the data comes from

`src/sensors/simulator.js` stands in for the Raspberry Pi. It models each room (the three rooms in `app.py`) with a baseline, a thermostat cycle, slow drift, sensor noise, the link between temperature and relative humidity, and random heat, moisture, ozone and CO2 events. It also drops the occasional reading the way a real sensor does. Room baselines and event rates live in `src/sensors/rooms.js`, next to the thresholds. Those thresholds mirror `THRESHOLDS` in `app.py`.

CSV exports use the Pi's columns with a `room` column added:

```
timestamp,room,temperature_C,humidity_%,pressure_hPa,ozone_ratio,co2_ppm
2026-10-16 18:33:58,Processing Area C,23.74,50.01,1014.22,1.012,618.4
```

Connecting the Pi means feeding its readings into `src/sensors/recorder.js` in place of `simulator.step()`. Everything downstream stays the same.

## Check and build

```sh
npm run lint
npm run build
```

On Railway, Flask serves the built frontend and its client-side routes, including `/app/recordings`.

For static hosting such as AWS Amplify, publish `dist` and add a rewrite that serves `index.html` (200) for client-side routes. `public/_redirects` supplies this fallback for Netlify.
