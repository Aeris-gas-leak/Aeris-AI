import argparse
import csv
import math
import random
from datetime import datetime, timedelta
from pathlib import Path

HEADER = ["timestamp", "temperature_C", "humidity_%", "pressure_hPa", "ozone_ratio", "co2_ppm"]

# ozone_ratio = MQ-131 Rs/R0 (about 1.0 in clean air, rises with ozone/oxidizing gas)
# co2_ppm     = MQ-135 CO2-equivalent estimate in ppm


def bump(i, center, width, height):
    """A smooth spike centred on row `center`."""
    return height * math.exp(-((i - center) ** 2) / (2 * width ** 2))


def make_row(i, total, when):
    # Rows are split into 3 rooms (thirds). Room 1 gets gas events, room 2 a warm spell.
    third = total / 3
    temp = 24.0 + 1.5 * math.sin(i / total * 2 * math.pi) + random.gauss(0, 0.25)
    temp += bump(i, third * 1.5, third * 0.12, 4.0)             # warm spell in room 2
    hum = 46.0 + 6.0 * math.sin(i / total * 2 * math.pi + 1) + random.gauss(0, 0.8)
    pres = 1012.0 + 3.0 * math.sin(i / total * math.pi) + random.gauss(0, 0.3)
    ozone = 1.0 + 0.04 * math.sin(i / 9) + random.gauss(0, 0.015)
    ozone += bump(i, third * 0.55, third * 0.06, 0.75)          # ozone event in room 1
    co2 = 520 + 120 * math.sin(i / total * 4 * math.pi) + random.gauss(0, 15)
    co2 += bump(i, third * 0.3, third * 0.08, 650)              # CO2 spike in room 1
    return [
        when.strftime("%Y-%m-%d %H:%M:%S"),
        round(temp, 2), round(hum, 2), round(pres, 2),
        round(ozone, 3), round(max(co2, 400), 1),
    ]


def write_fake_data(filename, samples, step_minutes, append):
    path = Path(filename)
    mode = "a" if append else "w"
    end = datetime.now()

    with path.open(mode=mode, newline="") as file:
        writer = csv.writer(file)
        if file.tell() == 0:
            writer.writerow(HEADER)

        print(f"Generating {samples} fake sensor readings...")
        for i in range(samples):
            when = end - timedelta(minutes=step_minutes * (samples - 1 - i))
            row = make_row(i, samples, when)
            writer.writerow(row)
            print(" | ".join(str(v) for v in row))
    print(f"Wrote {path}")


def main():
    parser = argparse.ArgumentParser(description="Generate fake Aeris sensor CSV data.")
    parser.add_argument("--file", default="sensor_data.csv", help="CSV file to write.")
    parser.add_argument("--samples", type=int, default=216, help="Number of rows to generate.")
    parser.add_argument("--step-minutes", type=float, default=5, help="Minutes between rows (timestamps end at 'now').")
    parser.add_argument("--append", action="store_true", help="Append instead of replacing the CSV.")
    args = parser.parse_args()

    write_fake_data(args.file, args.samples, args.step_minutes, args.append)


if __name__ == "__main__":
    main()