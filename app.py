import os
import csv
import random
import sqlite3
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

DATABASE_URL = os.path.join(os.path.dirname(__file__), "readings.db")
CSV_PATH     = os.path.join(os.path.dirname(__file__), "data.csv")

# ── Danger thresholds ──────────────────────────────────────────────────────────
THRESHOLDS = {
    "temperature_C": {"warning": 27.0, "danger": 29.0},
    "humidity_%":    {"warning": 60.0, "danger": 65.0},
    "pressure_hPa":  {"warning": 1020.0, "danger": 1023.0},
}

# Each room gets a deterministic slice of the CSV rows
ROOM_SLICES = {
    "Processing Area C": (0,   72),
    "Storage Area B":    (72,  144),
    "Floor #01":         (144, 216),
}

def read_csv():
    rows = []
    if not os.path.exists(CSV_PATH):
        return rows
    with open(CSV_PATH, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({
                "timestamp":     row["timestamp"],
                "temperature_C": float(row["temperature_C"]),
                "humidity_%":    float(row["humidity_%"]),
                "pressure_hPa":  float(row["pressure_hPa"]),
            })
    return rows

def rows_for_room(room_name):
    all_rows = read_csv()
    start, end = ROOM_SLICES.get(room_name, (0, len(all_rows)))
    return all_rows[start:end]

# ── DB helpers ─────────────────────────────────────────────────────────────────
def get_db_connection():
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room TEXT, gas TEXT, reading REAL, status TEXT,
            sensor_id TEXT, temperature REAL, humidity REAL,
            pressure REAL, air_quality TEXT,
            screenshot_path TEXT, timestamp TEXT
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS trigger_flags (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            status TEXT NOT NULL DEFAULT 'idle',
            requested_at TEXT,
            completed_at TEXT
        );
    """)
    cur.execute("""
        INSERT OR IGNORE INTO trigger_flags (id, status) VALUES (1, 'idle');
    """)
    conn.commit()
    cur.close()
    conn.close()

init_db()

# ── Chart data API ─────────────────────────────────────────────────────────────
@app.route("/api/chart/<room_name>")
def chart_data(room_name):
    rows         = rows_for_room(room_name)
    labels       = [r["timestamp"][-8:-3] for r in rows]
    temperatures = [r["temperature_C"]    for r in rows]
    humidities   = [r["humidity_%"]       for r in rows]
    pressures    = [r["pressure_hPa"]     for r in rows]
    return jsonify({
        "labels": labels,
        "temperature": {"values": temperatures, "warning_thresh": THRESHOLDS["temperature_C"]["warning"], "danger_thresh": THRESHOLDS["temperature_C"]["danger"], "unit": "°C",  "label": "Temperature"},
        "humidity":    {"values": humidities,   "warning_thresh": THRESHOLDS["humidity_%"]["warning"],    "danger_thresh": THRESHOLDS["humidity_%"]["danger"],    "unit": "%",   "label": "Humidity"},
        "pressure":    {"values": pressures,    "warning_thresh": THRESHOLDS["pressure_hPa"]["warning"],  "danger_thresh": THRESHOLDS["pressure_hPa"]["danger"],  "unit": " hPa","label": "Pressure"},
    })

@app.route("/api/chart/all")
def chart_data_all():
    rows         = read_csv()
    labels       = [r["timestamp"][-8:-3] for r in rows]
    temperatures = [r["temperature_C"]    for r in rows]
    humidities   = [r["humidity_%"]       for r in rows]
    pressures    = [r["pressure_hPa"]     for r in rows]
    return jsonify({
        "labels": labels,
        "temperature": {"values": temperatures, "warning_thresh": THRESHOLDS["temperature_C"]["warning"], "danger_thresh": THRESHOLDS["temperature_C"]["danger"], "unit": "°C",  "label": "Temperature"},
        "humidity":    {"values": humidities,   "warning_thresh": THRESHOLDS["humidity_%"]["warning"],    "danger_thresh": THRESHOLDS["humidity_%"]["danger"],    "unit": "%",   "label": "Humidity"},
        "pressure":    {"values": pressures,    "warning_thresh": THRESHOLDS["pressure_hPa"]["warning"],  "danger_thresh": THRESHOLDS["pressure_hPa"]["danger"],  "unit": " hPa","label": "Pressure"},
    })

# ── Generate fake DB data ──────────────────────────────────────────────────────
@app.route("/generate", methods=["POST"])
def generate_fake_data():
    conn = get_db_connection()
    cur  = conn.cursor()
    rooms   = ["Processing Area C", "Storage Area B", "Floor #01"]
    gases   = ["Carbon Monoxide", "Chlorine", "Hydrogen Sulfide"]
    sensors = ["SEN-C12", "SEN-C08", "SEN-804"]
    for _ in range(15):
        room        = random.choice(rooms)
        gas         = random.choice(gases)
        reading     = round(random.uniform(5, 60), 1)
        sensor_id   = random.choice(sensors)
        temperature = random.randint(65, 75)
        humidity    = random.randint(30, 60)
        pressure    = random.randint(1010, 1015)
        air_quality = random.choice(["Normal", "Moderate", "Poor"])
        status      = "danger" if reading > 40 else "warning" if reading > 20 else "normal"
        cur.execute("""
            INSERT INTO readings (room, gas, reading, status, sensor_id, temperature, humidity, pressure, air_quality, screenshot_path, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (room, gas, reading, status, sensor_id, temperature, humidity, pressure, air_quality, None, datetime.utcnow().isoformat()))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"ok": True, "generated": 15})

# ── Refresh / Trigger API ──────────────────────────────────────────────────────
def generate_csv():
    with open(CSV_PATH, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "temperature_C", "humidity_%", "pressure_hPa"])
        for _ in range(216):
            writer.writerow([
                datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                round(random.uniform(20.0, 30.0), 2),
                round(random.uniform(30.0, 70.0), 2),
                round(random.uniform(990.0, 1025.0), 2),
            ])

@app.route("/api/trigger/request", methods=["POST"])
def trigger_request():
    generate_csv()
    now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("""
        UPDATE trigger_flags SET status='idle', requested_at=?, completed_at=? WHERE id=1;
    """, (now, now))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"ok": True, "status": "idle"})

@app.route("/api/trigger/poll")
def trigger_poll():
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("SELECT status, requested_at FROM trigger_flags WHERE id=1;")
    row = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify({"status": row["status"], "requested_at": row["requested_at"]})

@app.route("/api/trigger/complete", methods=["POST"])
def trigger_complete():
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("""
        UPDATE trigger_flags SET status='idle', completed_at=? WHERE id=1;
    """, (datetime.utcnow().isoformat(),))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"ok": True, "status": "idle"})

@app.route("/api/trigger/status")
def trigger_status():
    conn = get_db_connection()
    cur  = conn.cursor()
    cur.execute("SELECT status, requested_at, completed_at FROM trigger_flags WHERE id=1;")
    row = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify(dict(row))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
