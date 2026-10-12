# Aeris frontend

React + Vite website and monitoring prototype for the Aeris.AI factory monitoring solution.

Use Node.js 22 LTS or 24 LTS for compatibility with the lint toolchain.

## Run locally

```sh
npm ci
npm run dev
```

The homepage and its interactive sample floor preview work without the API. The existing monitoring app uses the Python API described in the repository's root README; start that server for charts and data-generation actions.

## Pages

- `/`: public homepage. The floor preview contains fixed, explicitly labeled sample readings.
- `/app`: the previous opening screen. Every Try it link on the homepage opens this page.
- `/rooms`, `/room/:roomName`, `/immediate`, `/alerts`, `/about`: existing monitoring pages.

## Full-stack local setup

Start the backend from the repository root:

```bash
pip install -r requirements.txt
python app.py
```

Then run the frontend in the `frontend` directory:

```bash
cd frontend
npm ci
npm run dev
```

Vite proxies `/api` requests to the local Python server during development. Leave `VITE_API_URL` empty so the website uses the API on the same domain for the local Railway-style deployment.

## Check and build

```sh
npm run lint
npm run build
```

For the existing Railway deployment, Flask serves the built frontend and its client-side routes, including `/app`. Leave `VITE_API_URL` empty so the website uses the API on the same domain.

For separate static hosting, publish `dist` on a host configured to serve `index.html` for client-side routes. `public/_redirects` supplies this fallback for Netlify. Set `VITE_API_URL` to the separate API origin before building.

## Project context

The repository root README documents the Python API, sensor data workflow, alert thresholds, and deployment steps for the full application. This file focuses on the frontend website and its Vite/React workflow.
