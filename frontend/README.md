# Aeris frontend

React + Vite website and monitoring prototype.

Use Node.js 22 LTS or 24 LTS for compatibility with the lint toolchain.

## Run locally

```sh
npm ci
npm run dev
```

The homepage and its interactive sample floor preview work without the API. The existing monitoring app uses the Python API described in the repository's root README; start that server for charts and data-generation actions.

## Pages

- `/`: public homepage. The floor preview contains fixed, explicitly labeled sample readings.
- `/app`: the previous opening screen. Every **Try it** link on the homepage opens this page.
- `/rooms`, `/room/:roomName`, `/immediate`, `/alerts`, `/about`: existing monitoring pages.

The homepage uses `src/pages/Landing.jsx` and scoped styles in `src/styles/landing.css`. The monitoring pages keep their existing `PhoneShell` and `src/styles/app.css` styling.

## Check and build

```sh
npm run lint
npm run build
```

For the existing Railway deployment, Flask serves the built frontend and its client-side routes, including `/app`. Leave `VITE_API_URL` empty so the website uses the API on the same domain. Vite proxies API requests to the local Python server during development.

For separate static hosting, publish `dist` on a host configured to serve `index.html` for client-side routes. `public/_redirects` supplies this fallback for Netlify. Set `VITE_API_URL` to the separate API origin before building.
