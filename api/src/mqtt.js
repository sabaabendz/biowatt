const mqtt = require('mqtt');
const db = require('./db');
const { sendTelegramAlert } = require('./telegram');
const sim = require('./sim');

let client = null;
let ioInstance = null;

function initMqtt(io) {
  ioInstance = io;
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883';
  console.log(`[MQTT] Connecting to broker at ${brokerUrl}...`);

  client = mqtt.connect(brokerUrl, {
    clientId: `biowatt-api-${Math.random().toString(16).substring(2, 8)}`,
    reconnectPeriod: 2500,
    connectTimeout: 10000,
    clean: true
  });

  sim.setMqttClient(client);

  client.on('connect', () => {
    console.log('[MQTT] Connected to Mosquitto broker!');
    // Subscribe to all biowatt topics with QoS 1
    client.subscribe('biowatt/+/telemetry', { qos: 1 });
    client.subscribe('biowatt/+/insights', { qos: 1 });
    client.subscribe('biowatt/+/event', { qos: 1 });
    client.subscribe('biowatt/+/cmd', { qos: 1 });
    console.log('[MQTT] Subscribed to biowatt/+/telemetry, insights, event, cmd');
  });

  client.on('reconnect', () => {
    console.log('[MQTT] Reconnecting to broker...');
  });

  client.on('error', (err) => {
    console.warn(`[MQTT] Broker communication error: ${err.message}`);
  });

  client.on('message', (topic, message) => {
    handleMqttMessage(topic, message.toString());
  });

  return client;
}

function handleMqttMessage(topic, payloadStr) {
  try {
    const parts = topic.split('/');
    if (parts.length < 3 || parts[0] !== 'biowatt') return;

    const nodeId = parts[1];
    const channel = parts[2]; // 'telemetry' | 'insights' | 'event' | 'cmd'
    const data = JSON.parse(payloadStr);

    if (channel === 'telemetry') {
      const src = data.src || 'sim';
      
      // Update node seen timestamp and src (live vs sim)
      db.updateNodeSeen(nodeId, data.ts || Date.now(), src);

      // If live hardware, update simulation controller so it pauses simulation for this node
      if (src === 'live') {
        sim.notifyLiveHardware(nodeId);
      }

      // Record telemetry in database
      db.insertTelemetry({
        node: nodeId,
        ts: data.ts || Date.now(),
        v_mv: data.v_mv,
        i_ua: data.i_ua,
        p_uw: data.p_uw,
        e_mwh: data.e_mwh || 0,
        turb_ntu: data.turb_ntu,
        src: src
      });

      // Broadcast to all connected websocket clients
      if (ioInstance) {
        ioInstance.emit('telemetry', { node: nodeId, ...data });
      }
    } else if (channel === 'insights') {
      db.insertInsight({
        node: nodeId,
        ts: data.ts || Date.now(),
        bod_mgl: data.bod_mgl,
        cod_destroyed_mg: data.cod_destroyed_mg,
        liters_treated: data.liters_treated,
        irrigation_score: data.irrigation_score,
        swim_index: data.swim_index,
        toxic: data.toxic ? 1 : 0,
        recommended_interval_s: data.recommended_interval_s,
        model: data.model || 'demo-linear-v1',
        label: data.label || 'indicator',
        hours_until_unsafe: data.hours_until_unsafe != null ? data.hours_until_unsafe : null
      });

      if (ioInstance) {
        ioInstance.emit('insights', { node: nodeId, ...data });
      }
    } else if (channel === 'event') {
      db.insertEvent({
        node: nodeId,
        ts: data.ts || Date.now(),
        type: data.type,
        detail: data.detail
      });

      if (ioInstance) {
        ioInstance.emit('event', { node: nodeId, ...data });
      }

      // Dispatch Telegram alert if TOXIC_SHOCK
      if (data.type === 'TOXIC_SHOCK') {
        sendTelegramAlert(nodeId, data.detail, data.ts);
      }
    } else if (channel === 'cmd') {
      if (data.valve) {
        db.updateNodeValve(nodeId, data.valve);
      }

      if (ioInstance) {
        ioInstance.emit('cmd', { node: nodeId, ...data });
      }
    }
  } catch (err) {
    console.error(`[MQTT] Error processing message on ${topic}:`, err.message);
  }
}

function publishMqtt(topic, payload, qos = 1) {
  if (client && client.connected) {
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    client.publish(topic, payloadStr, { qos }, (err) => {
      if (err) console.error(`[MQTT] Publish error on ${topic}:`, err.message);
    });
  }
}

module.exports = {
  initMqtt,
  publishMqtt,
  getClient: () => client
};

