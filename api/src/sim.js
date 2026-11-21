/**
 * BioWatt Sentinel - Simulation Generator & Stimulus Controller
 * Provides realistic bio-electrochemical telemetry for Gulf of Tunis nodes:
 * home1 (when no live hardware is transmitting), oued1, outfall1, rades1.
 * Supports stimulus injection:
 * - 'food': 3x organic load for 10 min (simulating high BOD pulse)
 * - 'toxic': rapid decay to 0.2x baseline (>40% drop triggering autonomous alarm)
 * - 'reset': restores nominal baseline
 */

const { updateNodeSeen } = require('./db');

const NODE_PROFILES = {
  home1: {
    base_i_ua: 450.0,
    base_v_mv: 620.0,
    base_turb: 22.0,
    interval_s: 3
  },
  oued1: {
    base_i_ua: 550.0,
    base_v_mv: 660.0,
    base_turb: 38.0,
    interval_s: 4
  },
  outfall1: {
    base_i_ua: 820.0,
    base_v_mv: 710.0,
    base_turb: 58.0,
    interval_s: 4
  },
  rades1: {
    base_i_ua: 210.0,
    base_v_mv: 490.0,
    base_turb: 12.0,
    interval_s: 5
  }
};

class SimulationManager {
  constructor() {
    this.mqttClient = null;
    this.io = null;
    this.timers = {};
    this.lastLiveHardware = {}; // Track last live timestamp per node
    this.state = {};

    for (const [nodeId, profile] of Object.entries(NODE_PROFILES)) {
      this.state[nodeId] = {
        multiplier: 1.0,
        decayTarget: null,
        stimulusKind: null,
        expiresAt: 0,
        e_mwh: 14.2 + Math.random() * 5.0,
        last_ts: Date.now()
      };
    }
  }

  setMqttClient(client) {
    this.mqttClient = client;
  }

  setSocketIo(io) {
    this.io = io;
  }

  notifyLiveHardware(nodeId) {
    this.lastLiveHardware[nodeId] = Date.now();
  }

  isLiveHardwareActive(nodeId) {
    const last = this.lastLiveHardware[nodeId];
    return last && (Date.now() - last < 15000);
  }

  applyStimulus(nodeId, kind) {
    const nodeState = this.state[nodeId];
    if (!nodeState) return { success: false, error: 'Unknown node' };

    const now = Date.now();
    if (kind === 'food') {
      nodeState.stimulusKind = 'food';
      nodeState.multiplier = 3.0; // 3x load for 10 min
      nodeState.expiresAt = now + 10 * 60 * 1000;
      nodeState.decayTarget = null;
      console.log(`[SIM] Applied FOOD stimulus to ${nodeId} (3x load for 10 min)`);
    } else if (kind === 'toxic') {
      nodeState.stimulusKind = 'toxic';
      nodeState.decayTarget = 0.2; // Plunges to 20% (>40% drop)
      nodeState.multiplier = 0.2;
      nodeState.expiresAt = now + 10 * 60 * 1000;
      console.log(`[SIM] Applied TOXIC stimulus to ${nodeId} (decay to 0.2x baseline)`);
    } else if (kind === 'reset') {
      nodeState.stimulusKind = null;
      nodeState.multiplier = 1.0;
      nodeState.decayTarget = null;
      nodeState.expiresAt = 0;
      console.log(`[SIM] Reset stimulus on ${nodeId} to baseline`);
    }

    return {
      success: true,
      node: nodeId,
      kind,
      multiplier: nodeState.multiplier,
      expiresAt: nodeState.expiresAt
    };
  }

  start() {
    console.log('[SIM] Starting synthetic MFC generators for Gulf of Tunis nodes...');

    for (const [nodeId, profile] of Object.entries(NODE_PROFILES)) {
      this.timers[nodeId] = setInterval(() => {
        // If node is home1 and live hardware is publishing, do not simulate!
        if (nodeId === 'home1' && this.isLiveHardwareActive('home1')) {
          return;
        }

        this.generateStep(nodeId, profile);
      }, profile.interval_s * 1000);

      // Trigger first run immediately
      this.generateStep(nodeId, profile);
    }
  }

  stop() {
    for (const timer of Object.values(this.timers)) {
      clearInterval(timer);
    }
  }

  generateStep(nodeId, profile) {
    const nodeState = this.state[nodeId];
    const now = Date.now();

    // Check stimulus expiration
    if (nodeState.expiresAt && now > nodeState.expiresAt) {
      console.log(`[SIM] Stimulus expired for ${nodeId}, reverting to baseline.`);
      nodeState.stimulusKind = null;
      nodeState.multiplier = 1.0;
      nodeState.decayTarget = null;
      nodeState.expiresAt = 0;
    }

    // Diurnal variation (mimics wastewater morning & evening organic surges)
    const diurnalFactor = 1.0 + 0.15 * Math.sin((now / 1000 / 60) * 0.1);
    const noise = (Math.random() - 0.5) * 20.0;

    let i_ua = (profile.base_i_ua * diurnalFactor + noise) * nodeState.multiplier;
    if (i_ua < 10.0) i_ua = 10.0; // Minimal baseline

    // MFC polarization curve relation: V increases with current up to activation limit
    const v_mv = Math.min(850.0, profile.base_v_mv + 0.18 * (i_ua - profile.base_i_ua) + (Math.random() - 0.5) * 8.0);
    const p_uw = (v_mv * i_ua) / 1000.0;

    const dt_h = (now - nodeState.last_ts) / 3600000.0;
    nodeState.last_ts = now;
    nodeState.e_mwh += (p_uw / 1000.0) * dt_h;

    // Turbidity follows organic load
    let turb_ntu = profile.base_turb * (nodeState.multiplier > 1.0 ? 1.8 : 1.0) + (Math.random() - 0.5) * 3.0;
    if (turb_ntu < 1.0) turb_ntu = 1.0;

    const payload = {
      ts: now,
      v_mv: Math.round(v_mv * 10) / 10,
      i_ua: Math.round(i_ua * 10) / 10,
      p_uw: Math.round(p_uw * 10) / 10,
      e_mwh: Math.round(nodeState.e_mwh * 1000) / 1000,
      turb_ntu: Math.round(turb_ntu * 10) / 10,
      src: 'sim' // Synthetic simulation
    };

    const topic = `biowatt/${nodeId}/telemetry`;

    if (this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.publish(topic, JSON.stringify(payload), { qos: 1 });
    }
  }
}

module.exports = new SimulationManager();

