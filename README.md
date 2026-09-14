# Aeris.AI

A dashboard that monitors temperature, humidity, pressure, and gas levels across factory rooms. Connects to a Raspberry Pi that collects and sends sensor data.

---

## Project structure

```
app.py              ← The server. Serves all data to the dashboard.
FAKEDATA.py         ← Generates test sensor data (used until real RPi is connected).
SendData.py         ← Uploads sensor data to the cloud (PythonAnywhere).
pi_data_runner.py   ← Runs on the Raspberry Pi. Waits for requests, then generates and sends data.
requirements.txt    ← Python packages the server needs.
frontend/           ← The website (what users see in their browser).
```

---

## Running locally

You need two terminals open at the same time.

**Terminal 1 — the server:**
```bash
pip install -r requirements.txt
python FAKEDATA.py        # generates test data (only needed the first time)
python app.py             # starts the server at http://localhost:5001
```

**Terminal 2 — the website:**
```bash
cd frontend
npm install               # only needed the first time
npm run dev               # opens the app at http://localhost:5173
```

Open your browser to **http://localhost:5173**

Vite proxies `/api` requests to the local server on port 5001. Leave `VITE_API_URL` empty for local development and for a single Railway service.

---

## Connecting real Raspberry Pi data

When your RPi sensors are ready, only **`FAKEDATA.py`** needs to change. Replace the random number generators with real sensor readings. The data format must stay the same — one row per reading:

```
timestamp, temperature_C, humidity_%, pressure_hPa
2024-01-15 14:32:01, 24.5, 52.3, 1013.2
```

Everything else — `SendData.py`, `pi_data_runner.py`, the server, and the website — stays exactly as-is.

Run `pi_data_runner.py` on the Pi and point it at your live server:
```bash
python pi_data_runner.py --base-url https://your-username.pythonanywhere.com
```

---

## Changing alert thresholds

Warning and danger levels are set at the top of `app.py` in the `THRESHOLDS` section. Change the numbers to match your factory's safety requirements:

```python
THRESHOLDS = {
    "temperature_C": {"warning": 27.0, "danger": 29.0},
    "humidity_%":    {"warning": 60.0, "danger": 65.0},
    "pressure_hPa":  {"warning": 1020.0, "danger": 1023.0},
}
```

After changing, restart the server (`python app.py`).

---

## Deploying

**Website and API together (Railway / Railpack):**

1. Connect the repository and deploy from its root with the Railpack builder. Clear any custom build/start command overrides so the repository configuration is used.
2. `runtime.txt` selects Python 3.11.16. `railpack.json` adds Node 22, installs the locked frontend dependencies (including Vite), and builds `frontend/dist`. `Procfile` starts Gunicorn on `0.0.0.0:$PORT` (port 8000 locally).
3. Leave `RAILPACK_PYTHON_VERSION` unset, or align it with `runtime.txt`. Leave `VITE_API_URL` unset or empty: the website calls the API on the same domain. Changes to `VITE_API_URL` require a rebuild.
4. Set the service's Healthcheck Path to `/health`, then generate a public domain. The health endpoint checks database access. `/` and direct dashboard URLs such as `/rooms` serve the built website.
5. Attach a Railway volume (for example, mounted at `/data`) to retain SQLite and generated CSV data across deployments. The app uses `AERIS_DATA_DIR` when set, otherwise `RAILWAY_VOLUME_MOUNT_PATH`, otherwise the application directory. Use one replica with this file-based storage. Without a volume, data is temporary and is lost on redeploy; existing data must be copied into a new volume separately if it needs to be retained.

If a build reports `No GitHub artifact attestations found for python@3.11.6`, deploy the updated commit and remove any old version override. That 2023 Python download lacks the attestations required by current mise builds; the pinned 3.11.16 download has attestations. Keep verification enabled. See [Railpack's Python version precedence](https://railpack.com/languages/python).

Check the deployment locally with Python 3.11.16 and Node 22:

```bash
pip install -r requirements.txt
npm --prefix frontend ci --include=dev
npm --prefix frontend run build
python -m unittest discover -s tests -v
PORT=8000 gunicorn --bind 0.0.0.0:8000 app:app
```

Then open `http://localhost:8000/rooms` and `http://localhost:8000/health`. The existing refresh action generates simulated readings; it does not establish a live Raspberry Pi connection.

**Server (PythonAnywhere):**
- Upload `app.py`, `requirements.txt`, `FAKEDATA.py`, `SendData.py`, `pi_data_runner.py`
- Install packages: `pip install -r requirements.txt`
- Hit "Reload" in the PythonAnywhere web tab after any changes to `app.py`

**Website (Netlify):**
- Connect your GitHub repo to Netlify
- Set: Base = `frontend`, Build command = `npm run build`, Publish = `frontend/dist`
- Add environment variable: `VITE_API_URL` = `https://your-username.pythonanywhere.com`
- After this, every `git push` automatically updates the website — no manual steps needed
