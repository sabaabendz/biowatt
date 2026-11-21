# BioWatt Sentinel - Node Firmware Specification & MQTT Contract

## Concept
The **BioWatt Sentinel** node integrates a Microbial Fuel Cell (MFC) with an ultra-low-power ESP32 micro-controller. 
The electrogenic bacteria living on the anode oxidize organic pollutants (BOD/COD) in wastewater and release electrons to the electrode. 
Thus, **electric current is BOTH electrical power and an organic pollution signal**.

## Hardware Architecture
- **MCU**: ESP32-WROOM-32 (Deep sleep capable, 15 µA sleep current)
- **Power Harvester / Sensor**: Texas Instruments INA219 (High-side I2C current & voltage sensor, precision shunt)
- **Actuator**: Solenoid latch valve / relay (Normally-open irrigation line, locks autonomously on toxic shock)
- **Optical Turbidity Sensor**: Analog turbidity sensor calibrated for NTU (Optional / Node specific)
- **Power Supply**: Energy harvesting capacitor bank charged by the MFC itself + boost converter (e.g. BQ25570), with lithium backup for demonstration.

```
       +---------------------------------------------+
       |           Microbial Fuel Cell (MFC)         |
       |  Anode (Biofilm oxidizes BOD) -> Cathode     |
       +----------------------+----------------------+
                              |
                     [Shunt Resistor / INA219]
                              |
       +----------------------+----------------------+
       |                   ESP32 MCU                 |
       |  - Reads V (mV), I (µA), P (µW)             |
       |  - Publishes MQTT QoS 1 to biowatt/home1/.. |
       |  - Listens to biowatt/home1/cmd             |
       |  - Actuates Emergency Valve                 |
       +----------------------+----------------------+
                              |
                    [Irrigation Valve Relay]
```

---

## MQTT Contract (QoS 1, JSON)

All topics are prefixed with `biowatt/{node_id}/`.
Primary node IDs: `home1` (LIVE ESP32), `oued1` (SIM), `outfall1` (SIM), `rades1` (SIM).

### 1. Telemetry Output
- **Topic**: `biowatt/{node}/telemetry`
- **Direction**: Node -> Broker
- **Frequency**: Adaptive (`recommended_interval_s`, default 30s-1800s depending on power generation)
- **Payload Schema**:
```json
{
  "ts": 1700000000000,
  "v_mv": 620.5,
  "i_ua": 480.2,
  "p_uw": 298.0,
  "e_mwh": 12.45,
  "turb_ntu": 18.2,
  "src": "live"
}
```
*Note: Firmware must ALWAYS set `"src": "live"` to distinguish itself from simulation generators.*

### 2. Autonomous Action / Insights Input
- **Topic**: `biowatt/{node}/insights`
- **Direction**: AI Engine -> Broker / UI
- **Payload Schema**:
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

### 3. Events Output
- **Topic**: `biowatt/{node}/event`
- **Direction**: Node / AI / API -> Broker
- **Payload Schema**:
```json
{
  "ts": 1700000000000,
  "type": "TOXIC_SHOCK" | "VALVE_LOCK" | "SAFE" | "FEED",
  "detail": "Current dropped >40% relative to 5-min baseline. Biological shock suspected."
}
```

### 4. Actuator Command Input
- **Topic**: `biowatt/{node}/cmd`
- **Direction**: Rules Engine / Dashboard -> Node
- **Payload Schema**:
```json
{
  "valve": "lock" | "open",
  "report_interval_s": 60
}
```
When `valve: "lock"` is received, the ESP32 energizes the cutoff relay, preventing contaminated wastewater from entering downstream irrigation canals.

