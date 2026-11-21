# BioWatt Sentinel

**A self-powered wastewater monitoring and autonomous protection system based on Microbial Fuel Cells (MFCs).**

BioWatt Sentinel uses the electrical current produced by an MFC as both the node's power source and its measurement signal. Each node estimates organic pollution load in real time and automatically closes an irrigation valve when it detects toxic shock, without relying on grid power.

> **Status:** Hackathon prototype. All AI-derived values are indicators and are not regulatory certifications.

---

## Table of Contents

1. [Concept](#1-concept)
2. [Architecture](#2-architecture)
3. [Getting Started](#3-getting-started)
4. [Public Access via Cloudflare Tunnel](#4-public-access-via-cloudflare-tunnel)
5. [MQTT Contract](#5-mqtt-contract)
6. [Demo Walkthrough](#6-demo-walkthrough)
7. [Scientific and Engineering Assumptions](#7-scientific-and-engineering-assumptions)
8. [Acceptance Criteria](#8-acceptance-criteria)

---

## 1. Concept

Conventional wastewater monitoring consumes grid electricity for both sensing and telemetry. BioWatt Sentinel instead deploys MFC-powered nodes along the wastewater drainage network of the Gulf of Tunis.

In an MFC, an electrogenic biofilm oxidizes organic matter and releases electrons:

$$\text{Organics (BOD/COD)} + \text{Electrogenic biofilm} \longrightarrow e^- + H^+ + \text{Treated effluent}$$

The resulting current ($I_{\mu A}$) serves two purposes:

- **Power source.** The cell's micro-power output ($P_{\mu W} = V \cdot I$) is accumulated in a capacitor bank that powers the node's microcontroller and radio.
- **BOD soft sensor.** The metabolic activity of the biofilm scales with organic load. The prototype uses a linear calibration, $\text{BOD}_5 \approx 0.9 \cdot I_{\mu A} + 20\ \text{mg/L}$, which must be recalibrated against laboratory measurements before any real deployment.

### Autonomous safeguard

Toxic industrial discharge or detergents inhibit the biofilm and cause its current to collapse. If the current drops by more than **40% relative to its 5-minute baseline**, the node:

1. Closes a latching solenoid valve on the irrigation canal.
2. Publishes an emergency event over MQTT.
3. Sends a Telegram alert to protect downstream agriculture and beaches.

### Monitoring chain

Nodes are placed along the flow path from the source to the coast:

```
Home MFC (Sidi Rezig) --45 m--> Oued Meliane confluence --90 m--> Industrial outfall --180 m--> Rades beach
```

---

## 2. Architecture

```
hackathon/
├── docker-compose.yml        # Orchestrates broker, API, AI service, and web app
├── .env.example              # Example environment variables
├── README.md
├── mosquitto/                # Eclipse Mosquitto MQTT broker (ports 1883, 9001)
│   └── config/mosquitto.conf
├── firmware/                 # ESP32 + INA219 firmware
│   ├── README.md             # Wiring diagram and pinout
│   └── BioWatt_ESP32_MFC.ino # Publishes telemetry with src:"live"
├── api/                      # Node.js: Express, SQLite, mqtt.js, socket.io
│   └── src/
│       ├── db.js             # SQLite (better-sqlite3 with node:sqlite fallback)
│       ├── mqtt.js           # MQTT QoS 1 subscriber and publisher
│       ├── sim.js            # Bio-electrochemical simulator and stimuli
│       ├── telegram.js       # Push alerts for toxic shock events
│       └── server.js         # REST endpoints and WebSocket broadcaster
├── ai/                       # Python analytics service
│   ├── requirements.txt      # paho-mqtt, numpy, scikit-learn
│   ├── service.py            # Soft sensor, Coulombic ledger, NT 106.03 index, Ridge forecast
│   └── Dockerfile
└── web/                      # Next.js 14 (App Router), TypeScript, Tailwind, Recharts (PWA)
    ├── src/app/page.tsx          # Live dashboard and demo panel
    ├── src/app/map/page.tsx      # Gulf of Tunis map with plume lag vectors
    ├── src/app/national/page.tsx # National impact calculator
    ├── src/app/events/page.tsx   # Audit log of autonomous actions
    └── public/manifest.json      # PWA manifest
```

| Component | Role |
|-----------|------|
| Mosquitto | MQTT message broker |
| API | Rules engine, persistence, REST and WebSocket interface |
| AI service | BOD estimation, Coulombic ledger, quality indices, forecasting |
| Web | Real-time dashboard, map, national calculator, event feed |
| Firmware | Physical measurement and valve actuation on ESP32 |

---

## 3. Getting Started

### Option A: Docker Compose (recommended)

```bash
docker compose up -d --build
```

(`docker-compose up -d --build` on older installations.)

| Service | URL |
|---------|-----|
| Web dashboard | http://localhost:3000 |
| API and rules engine | http://localhost:4000 |
| MQTT broker | `localhost:1883` (WebSockets on `localhost:9001`) |

The simulated nodes (`home1`, `oued1`, `outfall1`, `rades1`) start publishing at boot, so the dashboard is populated within 10 seconds with no hardware connected.

### Option B: Local execution (without Docker)

1. Start an MQTT broker (for example Mosquitto) on port 1883.
2. Start the API:
   ```bash
   cd api
   npm install --no-optional
   npm start
   ```
3. Start the AI service:
   ```bash
   cd ai
   pip install -r requirements.txt
   python service.py
   ```
4. Start the web frontend:
   ```bash
   cd web
   npm install
   npm run dev
   ```

### Configuration

Copy `.env.example` to `.env` and adjust as needed. To enable Telegram alerts, set `TELEGRAM_BOT_TOKEN` and `CHAT_ID`.

---

## 4. Public Access via Cloudflare Tunnel

To share the dashboard with reviewers or mobile devices:

```bash
cloudflared tunnel --url http://localhost:3000
```

Cloudflared prints a temporary public HTTPS address (for example `https://random-name.trycloudflare.com`) that routes to the running web app.

---

## 5. MQTT Contract

All topics use QoS 1 and JSON payloads, partitioned by node ID: `home1`, `oued1`, `outfall1`, `rades1`.

### 5.1 Telemetry: `biowatt/{node}/telemetry`

Published by physical nodes or the simulator.

```json
{
  "ts": 1700000000000,
  "v_mv": 620.5,
  "i_ua": 480.2,
  "p_uw": 298.0,
  "e_mwh": 14.285,
  "turb_ntu": 18.2,
  "src": "live"
}
```

The `src` field identifies the data origin: hardware nodes always publish `"live"`, and the simulator always publishes `"sim"`.

### 5.2 Insights: `biowatt/{node}/insights`

Computed and published by the AI service.

```json
{
  "ts": 1700000000000,
  "bod_mgl": 452.1,
  "cod_destroyed_mg": 142.8,
  "liters_treated": 0.285,
  "irrigation_score": 88,
  "swim_index": 72,
  "toxic": false,
  "recommended_interval_s": 60,
  "model": "demo-linear-v1",
  "label": "indicator",
  "hours_until_unsafe": null
}
```

### 5.3 Events: `biowatt/{node}/event`

Published on state transitions and autonomous actions. `type` is one of `TOXIC_SHOCK`, `VALVE_LOCK`, `SAFE`, or `FEED`.

```json
{
  "ts": 1700000000000,
  "type": "TOXIC_SHOCK",
  "detail": "Electrogenic metabolic collapse on home1: current dropped 80.0% vs 5-min baseline. Contaminant suspected."
}
```

### 5.4 Commands: `biowatt/{node}/cmd`

Published by the rules engine to the actuator or the simulator. `valve` is `"lock"` or `"open"`.

```json
{
  "valve": "lock",
  "report_interval_s": 30
}
```

---

## 6. Demo Walkthrough

The following sequence demonstrates the full system in about four minutes.

**Step 1: Zero-hardware startup (0:00 - 1:00)**
1. Open http://localhost:3000.
2. Show the four nodes streaming telemetry, each marked with a `SIMULATION` badge.
3. Present the live gauges: cell voltage (mV), power (uW), bio-current (uA), and cumulative energy (mWh).
4. Present the AI indicators: BOD estimate, Coulombic ledger (mg COD destroyed, litres treated), NT 106.03 irrigation index, and beach swim index.

**Step 2: Live hardware switch-over (1:00 - 1:45)**
1. Power on the ESP32, or publish a test message:
   ```bash
   python -c "import paho.mqtt.publish as p; p.single('biowatt/home1/telemetry', '{\"v_mv\":640,\"i_ua\":520,\"p_uw\":332,\"e_mwh\":0.5,\"turb_ntu\":19,\"src\":\"live\"}', hostname='localhost')"
   ```
2. Within 2 seconds, the `home1` badge changes to `LIVE ESP32` with a green indicator, while downstream nodes remain on `SIMULATION`.

**Step 3: Organic load surge (1:45 - 2:30)**
1. In the demo panel, click **Pour Food Waste**.
2. Within 5 seconds:
   - Simulated organic load triples.
   - Bio-current rises from about 450 uA to about 1350 uA.
   - Estimated BOD rises from about 425 mg/L to about 1235 mg/L.
   - The recommended reporting interval drops from 60 s to 30 s (more organic load yields more energy, so the node reports more often).
   - A `FEED` event appears in the event stream.

**Step 4: Toxic shock and valve lock (2:30 - 3:15)**
1. In the demo panel, click **Drop Detergent (Toxic)**.
2. The system reacts immediately:
   - Current falls to 0.2x of baseline (a drop of more than 40%).
   - The AI service sets `toxic: true`.
   - A red banner appears: **AUTONOMOUS SAFEGUARD ENGAGED: TOXIC SHOCK DETECTED**.
   - The valve badge changes from `OPEN (NORMAL)` to `VALVE LOCKED (EMERGENCY)`.
   - The command `{"valve":"lock"}` is published on `biowatt/home1/cmd`.
   - If Telegram is configured, an alert is delivered to the configured chat.

**Step 5: Recovery (3:15 - 3:45)**
1. Click **Reset Baseline**.
2. Current returns to nominal. The AI service detects recovery (drop below 20%), publishes a `SAFE` event, and sends `{"valve":"open"}`.

**Step 6: Map and national impact (3:45 - 4:00)**
1. Open `/map` to see the Gulf of Tunis flow path and travel-time lags from Sidi Rezig to Rades beach.
2. Open `/national` and adjust the sliders to see how the concept scales across Tunisia.

---

## 7. Scientific and Engineering Assumptions

### 7.1 Tunisian standard NT 106.03 (wastewater reuse in agriculture)

Maximum permissible concentrations for irrigation:

| Parameter | Limit |
|-----------|-------|
| COD | 90 mg/L |
| BOD5 | 30 mg/L |
| TSS | 30 mg/L |

The irrigation score starts at 100 and is reduced in proportion to each exceedance.

### 7.2 Recreational bathing reference

The reference limit is 100 fecal coliforms per 100 mL, based on the European Bathing Water Directive 2006/7/EC and Tunisian coastal protection criteria.

### 7.3 Coulombic efficiency

Published studies of MFCs treating raw domestic wastewater report coulombic efficiencies between 1.4% and 10.7% (Logan et al., 2006; Rabaey et al., 2005). The remainder of the substrate is consumed by competing processes such as methanogenesis and biomass synthesis.

### 7.4 Coulombic ledger

Charge is integrated from the measured current and converted to an equivalent amount of COD destroyed:

$$Q_C = \int I \, dt, \qquad \text{COD}_{\text{destroyed}}\,(\text{mg}) = \frac{Q_C}{96485\ \text{C/mol } e^-} \times 8000\ \text{mg O}_2/\text{mol } e^-$$

### 7.5 National impact calculator

| Parameter | Value | Source |
|-----------|-------|--------|
| Wastewater per capita | 120 L/person/day | ONAS national average |
| MFC energy density | 0.0298 kWh/m3 of raw sewage | Model assumption |
| Household consumption | 3,000 kWh/year | STEG average residential meter |
| Electricity tariff | 0.200 TND/kWh | STEG low-voltage subsidized tariff |
| Smartphone battery | 15 Wh (4000 mAh at 3.7 V) | Typical device |

Default scenario: 12.45 million inhabitants with 80% capture. Outputs are computed directly from the assumptions above:

| Output | Value |
|--------|-------|
| Annual energy | about 13 GWh/year |
| Homes powered | about 4,300 |
| Annual utility savings | about 2.6 million TND |

These are order-of-magnitude estimates based on a model assumption for energy density. They are not field measurements.

### 7.6 Regulatory disclaimer

All AI-derived values are labelled `indicator, not certification`, and the model is identified as `demo-linear-v1`.

---

## 8. Acceptance Criteria

- [x] `docker compose up` on a clean machine starts the broker, API, AI service, and web app, with simulated data visible in under 10 seconds.
- [x] An ESP32 publishing `src: "live"` to `biowatt/home1/telemetry` appears as `LIVE` within 2 seconds end to end.
- [x] The `food` stimulus raises BOD, shortens the adaptive reporting interval, and logs a `FEED` event within 5 seconds.
- [x] The `toxic` stimulus triggers `TOXIC_SHOCK`, locks the valve, sends the actuation command, and triggers the Telegram alert.
- [x] Simulated data is always labelled with a `TwinBadge`; no unlabelled synthetic values are displayed.
- [x] This README documents setup, the MQTT contract, the `cloudflared` command, the demo walkthrough, and the scientific assumptions.
