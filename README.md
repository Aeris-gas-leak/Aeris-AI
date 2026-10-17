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
frontend/           ← The website (what users see in their browser). Runs on simulated data for now.
```

---

## Running locally

The website runs on its own. The Recorder at `/app` generates simulated sensor readings in the browser, so no server is needed:

```bash
cd frontend
npm install               # only needed the first time
npm run dev               # opens the app at http://localhost:5173
```

The Python server below is for the Raspberry Pi pipeline. The website doesn't use it yet. See `frontend/README.md` for how the simulated data works.

```bash
pip install -r requirements.txt
python app.py             # starts the server at http://localhost:5000
```

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

**Server (PythonAnywhere):**
- Upload `app.py`, `requirements.txt`, `FAKEDATA.py`, `SendData.py`, `pi_data_runner.py`
- Install packages: `pip install -r requirements.txt`
- Hit "Reload" in the PythonAnywhere web tab after any changes to `app.py`

**Website (Netlify):**
- Connect your GitHub repo to Netlify
- Set: Base = `frontend`, Build command = `npm run build`, Publish = `frontend/dist`
- After this, every `git push` automatically updates the website — no manual steps needed
