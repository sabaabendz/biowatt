# ⚡ BioWatt Sentinel

> **Self-Powered Microbial Fuel Cell (MFC) Wastewater Sentinel & Autonomous Defense System**  
> *Built for the 4-Hour Hackathon Checkpoint*

---

## 🌊 1. Concept: Current is Both Power & Pollution Signal

In traditional wastewater treatment, sensor telemetry and aeration consume heavy grid electricity. **BioWatt Sentinel** flips this paradigm using self-powered **Microbial Fuel Cells (MFCs)** installed along the wastewater drainage network in the **Gulf of Tunis**:

$$\text{Wastewater Organics (BOD/COD)} + \text{Electrogenic Biofilm} \longrightarrow \text{Electrons } (e^-) + \text{Protons } (H^+) + \text{Treated Effluent}$$

1. **Dual-Role Bio-Current ($I_{\mu A}$)**:
   - **Power Harvest**: Generates continuous micro-power ($P_{\mu W} = V \cdot I$) stored in capacitor banks to self-power the node's microcontroller and radio.
   - **Live BOD Soft-Sensor**: The metabolic rate of exoelectrogenic bacteria is proportional to organic load ($\text{BOD}_{5} = 0.9 \cdot I_{\mu A} + 20\text{ mg/L}$).
2. **Autonomous Ecological Safeguard**:
   - When toxic industrial waste or detergents poison the biofilm, cellular respiration collapses instantly.
   - If current drops **$>40\%$ vs the 5-minute baseline**, the node autonomously engages an emergency latching solenoid valve on the irrigation canal, dispatches emergency MQTT events, and sounds Telegram alarms to protect downstream agriculture and beaches.
3. **Gulf of Tunis Chain**:
   $$\text{Home MFC (Sidi Rezig)} \xrightarrow{+45\text{m}} \text{Oued Meliane Confluence} \xrightarrow{+90\text{m}} \text{Industrial Outfall} \xrightarrow{+180\text{m}} \text{Radès Coastal Beach}$$

---

## 🏗️ 2. System Architecture & Monorepo Structure

```
hackathon/
├── docker-compose.yml          # One-command orchestration (Broker + API + AI + Web)
├── .env.example                # Sample environment variables
├── README.md                   # Complete specification, contract, choreography
├── /mosquitto                  # Eclipse Mosquitto MQTT Broker (port 1883 & 9001)
│   └── config/mosquitto.conf
├── /firmware                   # Physical ESP32 Hardware + INA219 C++ Implementation
│   ├── README.md               # Hardware wiring diagram & pinout
│   └── BioWatt_ESP32_MFC.ino   # Arduino/ESP32 firmware code (publishes src:"live")
├── /api                        # Node.js Express, SQLite, mqtt.js, socket.io rules engine
│   ├── src/db.js               # Dual-engine SQLite (better-sqlite3 + node:sqlite fallback)
│   ├── src/mqtt.js             # MQTT QoS 1 subscriber and publisher
│   ├── src/sim.js              # Bio-electrochemical simulation generator & stimulus
│   ├── src/telegram.js         # Instant push alerts for toxic shock
│   └── src/server.js           # REST API endpoints & WebSocket broadcaster
├── /ai                         # Python Autonomous Engine (paho-mqtt, numpy, scikit-learn)
│   ├── requirements.txt
│   ├── service.py              # Soft-sensor, Coulombic ledger, NT 106.03, Ridge forecast
│   └── Dockerfile
└── /web                        # Next.js 14 App Router, TypeScript, Tailwind, Recharts PWA
    ├── src/app/page.tsx        # Live Dashboard with gauges, Recharts, & DemoPanel
    ├── src/app/map/page.tsx    # SVG Gulf of Tunis chain map & plume lag vectors
    ├── src/app/national/page.tsx # Interactive national macroeconomic calculator
    ├── src/app/events/page.tsx # Audit feed for autonomous actions
    └── public/manifest.json    # PWA configuration
```

---

## 🚀 3. One-Command Startup (Clean Machine)

### Option A: Docker Compose (Recommended)

Run the full stack (Mosquitto broker, API, Python AI, Next.js Web) in one command:

```bash
docker compose up -d --build
```
*(Or `docker-compose up -d --build`)*

- **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **API & Rules Engine**: [http://localhost:4000](http://localhost:4000)
- **Mosquitto MQTT Broker**: `localhost:1883` (WebSockets on `localhost:9001`)

*All synthetic nodes (`oued1`, `outfall1`, `rades1`, and default `home1`) start publishing immediately on boot, ensuring the UI is alive in $<10\text{ seconds}$ with zero hardware connected.*

---

### Option B: Local Direct Execution (Without Docker)

1. **Start Mosquitto Broker** (or local MQTT broker on port 1883).
2. **Start API Engine**:
   ```bash
   cd api
   npm install --no-optional
   npm start
   ```
3. **Start Python AI Service**:
   ```bash
   cd ai
   pip install -r requirements.txt
   python service.py
   ```
4. **Start Web Frontend**:
   ```bash
   cd web
   npm install
   npm run dev
   ```

---

## 🌐 4. Cloudflared Quick Tunnel for Public Access

To expose the dashboard to judges, mentors, or mobile devices during the checkpoint:

```bash
cloudflared tunnel --url http://localhost:3000
```

Cloudflared will output a temporary public HTTPS URL (e.g. `https://random-name.trycloudflare.com`) routing directly into the live Next.js PWA.

---

## 📡 5. MQTT Contract (QoS 1, JSON)

All MQTT channels use QoS 1 with JSON serialization. Topics are partitioned by node ID: `home1`, `oued1`, `outfall1`, `rades1`.

### 1. Node Telemetry: `biowatt/{node}/telemetry`
Published by nodes (physical ESP32 or simulation generator).
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
*Note: Hardware nodes ALWAYS publish `"src": "live"`. Simulation generators ALWAYS publish `"src": "sim"`.*

### 2. Autonomous Insights: `biowatt/{node}/insights`
Computed and published by the Python AI service.
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

### 3. Event Trail: `biowatt/{node}/event`
Published on state transitions and autonomous triggers.
```json
{
  "ts": 1700000000000,
  "type": "TOXIC_SHOCK" | "VALVE_LOCK" | "SAFE" | "FEED",
  "detail": "Electrogenic metabolic collapse on home1: current plunged 80.0% vs 5-min baseline. Contaminant suspected."
}
```

### 4. Actuation Commands: `biowatt/{node}/cmd`
Published by the rules engine to the ESP32 actuator or simulation.
```json
{
  "valve": "lock" | "open",
  "report_interval_s": 30
}
```

---

## 🎭 6. Demo Choreography for Hackathon Checkpoint

Follow this exact 5-step choreography to demonstrate the system to judges:

### Step 1: Zero-Hardware Boot & Dashboard Tour (0:00 - 1:00)
1. Open [http://localhost:3000](http://localhost:3000).
2. Point out that all 4 Gulf of Tunis nodes (`home1`, `oued1`, `outfall1`, `rades1`) are streaming live telemetry with clear `SIMULATION` Twin badges.
3. Show the live gauges: Cell Voltage ($mV$), Harvested Power ($\mu W$), Bio-Current ($\mu A$), and Energy Counter ($mWh$).
4. Highlight the AI soft-sensor cards: **BOD estimate**, **Coulombic ledger** ($mg$ COD destroyed and $L$ treated), **Tunisian NT 106.03 Irrigation Index**, and **Gulf Beach Swim Index**.

### Step 2: Live ESP32 Hardware Integration (< 2s switch) (1:00 - 1:45)
1. Simulate or power on physical ESP32 sending `{ "v_mv": 650, "i_ua": 510, "p_uw": 331, "src": "live" }` to `biowatt/home1/telemetry`.
   *(Or trigger via python/curl test script: `python -c "import paho.mqtt.publish as p; p.single('biowatt/home1/telemetry', '{\"v_mv\":640,\"i_ua\":520,\"p_uw\":332,\"e_mwh\":0.5,\"turb_ntu\":19,\"src\":\"live\"}', hostname='localhost')"`)*
2. Observe that within **2 seconds**, the `home1` badge switches to **`LIVE ESP32` with a green pulsing radio beacon**, while downstream nodes remain labeled `SIMULATION`.

### Step 3: Stimulus "Food Waste" Surge (1:45 - 2:30)
1. On the dashboard DemoPanel, click **`Pour Food Waste`**.
2. Within **5 seconds**:
   - Simulated organic load surges $3\times$.
   - Biofilm current ($I_{\mu A}$) surges from $\sim 450\mu A \rightarrow \sim 1350\mu A$.
   - Estimated BOD surges from $\sim 425\text{ mg/L} \rightarrow \sim 1235\text{ mg/L}$.
   - **Adaptive Telemetry**: Because power increased, the recommended reporting interval drops from $60s \rightarrow 30s$ (*"dirtier water = more energy = report faster"*).
   - A `FEED` event appears in the Autonomous Event Stream.

### Step 4: Stimulus "Toxic Shock & Autonomous Valve Lock" (2:30 - 3:15)
1. On the DemoPanel, click **`Drop Detergent (Toxic)`**.
2. Observe immediate autonomous reaction:
   - Biofilm current plunges to $0.2\times$ ($>40\%$ drop relative to baseline).
   - AI service flags `toxic: true`.
   - The red emergency banner engages across the screen: **`AUTONOMOUS SAFEGUARD ENGAGED: TOXIC SHOCK DETECTED`**.
   - Valve state badge immediately shifts from `OPEN (NORMAL)` to **`VALVE LOCKED (EMERGENCY)`**.
   - An autonomous command `{"valve":"lock"}` is transmitted on `biowatt/home1/cmd`.
   - If `TELEGRAM_BOT_TOKEN` and `CHAT_ID` are configured in `.env`, an instant Telegram push alert arrives on mobile!

### Step 5: Reset Baseline & Recovery (3:15 - 3:45)
1. Click **`Reset Baseline`**.
2. Current returns to nominal; AI service detects recovery ($<20\%$ drop), publishes a `SAFE` event, and transmits `{"valve":"open"}`. The lock clears.

### Step 6: Map & National Impact Calculator (3:45 - 4:00)
1. Navigate to `/map`: Show the SVG map of the Gulf of Tunis with flow vectors and travel time lags from Sidi Rezig along Oued Meliane to Radès beach.
2. Navigate to `/national`: Adjust sliders to demonstrate national scaling across Tunisia (12.45M population $\rightarrow$ $\sim 129\text{ GWh/yr}$, powering $\sim 43,000$ homes and generating $\sim 25.7\text{ Million TND}$ in annual utility savings).

---

## 🔬 7. Engineering & Scientific Assumptions

1. **Tunisian Standard NT 106.03 (Wastewater Reuse in Agriculture)**:
   - Sets strict maximum permissible concentrations for agricultural irrigation:
     - $\text{COD} \le 90\text{ mg/L}$
     - $\text{BOD}_5 \le 30\text{ mg/L}$
     - $\text{TSS} \le 30\text{ mg/L}$
   - Penalty function penalizes exceedances proportionally from an initial score of 100.
2. **Recreational Bathing Standard**:
   - Reference limit: **100 fecal coliforms / 100 mL** based on European Bathing Water Directive 2006/7/EC and Tunisian coastal protection criteria.
3. **Coulombic Efficiency ($\text{CE}$)**:
   - Literature benchmark: In microbial fuel cells treating raw domestic sewage, coulombic efficiency ranges between **1.4% and 10.7%** (*Logan et al., 2006; Rabaey et al., 2005*), with the balance consumed via competing methanogenesis and biomass synthesis.
4. **Faraday Coulombic Ledger**:
   $$Q_C = \int I \cdot dt, \quad \text{COD}_{\text{destroyed}} (\text{mg}) = \frac{Q_C}{96485 \text{ C/mol } e^-} \times 8000 \text{ mg } O_2/\text{mol } e^-$$
5. **National Macroeconomic Calculator**:
   - **Per capita wastewater**: $120\text{ L/person/day}$ (ONAS Tunisian national statistical average).
   - **MFC energy density**: $0.0298\text{ kWh/m}^3$ of raw municipal sewage treated.
   - **STEG household consumption**: $3,000\text{ kWh/year}$ average residential meter.
   - **Electricity tariff**: $0.200\text{ TND/kWh}$ (STEG low-voltage subsidized tariff).
   - **Smartphone battery**: $15\text{ Wh}$ ($4000\text{ mAh} \times 3.7\text{V}$).
   - **Default outputs for 12.45M population at 80% capture**:
     - $\mathbf{\sim 129\text{ GWh/yr}}$
     - $\mathbf{\sim 43,000\text{ homes powered}}$
     - $\mathbf{\sim 25.7\text{ Million TND saved}}$
     - $\mathbf{\sim 2\text{ full smartphone charges / person / day}}$
6. **Regulatory Disclaimers**:
   - All AI values are labeled **`indicator, not certification`** and model labeled **`demo-linear-v1`**.

---

## 🏆 Acceptance Criteria Checklist

- [x] **Criterion 1**: `docker compose up` on clean machine launches broker + api + ai + web; simulation alive in $<10$s.
- [x] **Criterion 2**: ESP32 publishing `src: "live"` to `biowatt/home1/telemetry` appears as `LIVE` within 2s end-to-end.
- [x] **Criterion 3**: Stimulus `"food"` raises BOD, shortens adaptive interval, and logs `FEED` event within 5s.
- [x] **Criterion 4**: Stimulus `"toxic"` triggers `TOXIC_SHOCK`, locks valve, sends actuation cmd, and triggers Telegram.
- [x] **Criterion 5**: SIM data always badged with `TwinBadge`; no unlabeled synthetic numbers anywhere.
- [x] **Criterion 6**: Complete README with setup, MQTT contract, `cloudflared` command, demo choreography, and scientific assumptions.

