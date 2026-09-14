"""Deployment regressions, isolated from checked-in data and frontend builds."""

import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unittest


REPO_ROOT = Path(__file__).resolve().parents[1]


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        self.root = Path(self.temp_dir.name)
        self.app_dir = self.root / "application"
        self.app_dir.mkdir()
        shutil.copy2(REPO_ROOT / "app.py", self.app_dir / "app.py")
        self.working_dir = self.root / "working"
        self.working_dir.mkdir()
        self.env = os.environ.copy()
        for key in ("AERIS_DATA_DIR", "RAILWAY_VOLUME_MOUNT_PATH"):
            self.env.pop(key, None)

    def run_app(self, code, storage_env=None):
        """Start a fresh interpreter so import-time DB initialization is tested."""
        script = (
            "import json, sys\n"
            "sys.path.insert(0, sys.argv[1])\n"
            "import app\n"
            "app.app.testing = True\n"
            "client = app.app.test_client()\n"
        ) + textwrap.dedent(code)
        result = subprocess.run(
            [sys.executable, "-c", script, str(self.app_dir)],
            cwd=self.working_dir,
            env={**self.env, **(storage_env or {})},
            capture_output=True,
            text=True,
            timeout=30,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)

    def create_frontend(self):
        dist = self.app_dir / "frontend" / "dist"
        (dist / "assets").mkdir(parents=True)
        self.index_html = "<!doctype html><html><body>Aeris test SPA</body></html>"
        (dist / "index.html").write_text(self.index_html, encoding="utf-8")
        (dist / "assets" / "app.js").write_text("console.log('Aeris');", encoding="utf-8")

    def test_health_initializes_database_without_a_frontend_build(self):
        result = self.run_app("""
            health = client.get('/health')
            trigger = client.get('/api/trigger/status')
            print(json.dumps({
                'health_status': health.status_code,
                'health': health.get_json(),
                'trigger_status': trigger.status_code,
                'trigger': trigger.get_json(),
                'database': app.DATABASE_URL,
            }))
        """)
        self.assertEqual(result["health_status"], 200)
        self.assertEqual(result["health"], {"ok": True})
        self.assertEqual(result["trigger_status"], 200)
        self.assertEqual(result["trigger"]["status"], "idle")
        self.assertIsNone(result["trigger"]["requested_at"])
        self.assertEqual(Path(result["database"]), self.app_dir / "readings.db")
        self.assertTrue((self.app_dir / "readings.db").is_file())
        self.assertFalse((self.working_dir / "readings.db").exists())

    def test_direct_spa_routes_serve_the_built_index(self):
        self.create_frontend()
        routes = ["/", "/rooms", "/room/Processing%20Area%20C", "/immediate", "/alerts", "/about"]
        result = self.run_app(f"""
            responses = {{}}
            for path in {routes!r}:
                response = client.get(path)
                responses[path] = [response.status_code, response.mimetype, response.get_data(as_text=True)]
            print(json.dumps(responses))
        """)
        for path in routes:
            with self.subTest(path=path):
                self.assertEqual(result[path], [200, "text/html", self.index_html])

    def test_built_static_assets_are_served(self):
        self.create_frontend()
        result = self.run_app("""
            response = client.get('/assets/app.js')
            print(json.dumps({'status': response.status_code, 'body': response.get_data(as_text=True)}))
        """)
        self.assertEqual(result, {"status": 200, "body": "console.log('Aeris');"})

    def test_missing_api_and_asset_paths_do_not_return_spa_html(self):
        self.create_frontend()
        paths = ["/api", "/api/does-not-exist", "/api/chart", "/assets/missing.js", "/assets/missing", "/favicon.ico"]
        result = self.run_app(f"""
            print(json.dumps({{path: client.get(path).status_code for path in {paths!r}}}))
        """)
        for path in paths:
            with self.subTest(path=path):
                self.assertEqual(result[path], 404)

    def test_paths_cannot_escape_the_frontend_directory(self):
        self.create_frontend()
        (self.app_dir / "frontend" / "secret.txt").write_text("private frontend sibling", encoding="utf-8")
        (self.app_dir / "secret.txt").write_text("private application file", encoding="utf-8")
        paths = ["/../secret.txt", "/%2e%2e/secret.txt", "/assets/../../secret.txt", "/%2e%2e/%2e%2e/app.py", "/readings.db"]
        result = self.run_app(f"""
            print(json.dumps({{path: client.get(path).status_code for path in {paths!r}}}))
        """)
        for path in paths:
            with self.subTest(path=path):
                self.assertEqual(result[path], 404)

    def test_database_and_chart_csv_persist_across_process_restarts(self):
        configurations = [
            ("explicit", {"AERIS_DATA_DIR": str(self.root / "explicit")}),
            ("volume", {"RAILWAY_VOLUME_MOUNT_PATH": str(self.root / "volume")}),
            ("override", {
                "AERIS_DATA_DIR": str(self.root / "override"),
                "RAILWAY_VOLUME_MOUNT_PATH": str(self.root / "unused-volume"),
            }),
        ]
        for directory, storage_env in configurations:
            with self.subTest(storage=directory):
                initial = self.run_app("""
                    generated = client.post('/generate')
                    refreshed = client.post('/api/trigger/request')
                    print(json.dumps({
                        'generated_status': generated.status_code,
                        'generated': generated.get_json(),
                        'refreshed_status': refreshed.status_code,
                        'refreshed': refreshed.get_json(),
                        'chart': client.get('/api/chart/all').get_json(),
                        'trigger': client.get('/api/trigger/status').get_json(),
                    }))
                """, storage_env)
                self.assertEqual(initial["generated_status"], 200)
                self.assertEqual(initial["generated"], {"ok": True, "generated": 15})
                self.assertEqual(initial["refreshed_status"], 200)
                self.assertEqual(initial["refreshed"], {"ok": True, "status": "idle"})
                self.assertTrue(initial["trigger"]["requested_at"])
                self.assertTrue(initial["trigger"]["completed_at"])
                self.assertEqual(len(initial["chart"]["labels"]), 216)
                for metric in ("temperature", "humidity", "pressure"):
                    values = initial["chart"][metric]["values"]
                    self.assertEqual(len(values), 216)
                    self.assertTrue(all(isinstance(value, (float, int)) for value in values))

                restarted = self.run_app("""
                    with app.get_db_connection() as connection:
                        count = connection.execute('SELECT COUNT(*) FROM readings').fetchone()[0]
                    rooms = ['Processing Area C', 'Storage Area B', 'Floor #01']
                    from urllib.parse import quote
                    print(json.dumps({
                        'count': count,
                        'database': app.DATABASE_URL,
                        'csv': app.get_csv_path(),
                        'chart': client.get('/api/chart/all').get_json(),
                        'trigger': client.get('/api/trigger/status').get_json(),
                        'room_charts': [client.get('/api/chart/' + quote(room, safe='')).get_json() for room in rooms],
                    }))
                """, storage_env)
                data_dir = self.root / directory
                self.assertEqual(restarted["count"], 15)
                self.assertEqual(Path(restarted["database"]), data_dir / "readings.db")
                self.assertEqual(Path(restarted["csv"]), data_dir / "data.csv")
                self.assertTrue((data_dir / "readings.db").is_file())
                self.assertTrue((data_dir / "data.csv").is_file())
                self.assertEqual(restarted["chart"], initial["chart"])
                self.assertEqual(restarted["trigger"], initial["trigger"])
                for index, chart in enumerate(restarted["room_charts"]):
                    self.assertEqual(len(chart["labels"]), 72)
                    for metric in ("temperature", "humidity", "pressure"):
                        self.assertEqual(chart[metric]["values"], initial["chart"][metric]["values"][index * 72:(index + 1) * 72])
        self.assertFalse((self.root / "unused-volume").exists())
        self.assertFalse((self.app_dir / "readings.db").exists())
        self.assertFalse((self.working_dir / "data.csv").exists())


if __name__ == "__main__":
    unittest.main()
