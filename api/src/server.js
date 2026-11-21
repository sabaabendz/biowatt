require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const db = require('./db');
const { initMqtt, publishMqtt } = require('./mqtt');
const sim = require('./sim');

const app = express();
const server = http.createServer(app);

// CORS for web dashboard
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach Socket.io to simulation and MQTT
sim.setSocketIo(io);
const mqttClient = initMqtt(io);

// Client socket connection handler
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Send current state snapshot
  const nodes = db.getNodes();
  const latestInsights = {};
  for (const n of nodes) {
    const insight = db.getLatestInsight(n.id);
    if (insight) latestInsights[n.id] = insight;
  }
  const recentEvents = db.getEvents(20);

  socket.emit('snapshot', {
    nodes,
    latestInsights,
    recentEvents
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// REST API Endpoints

// 1. GET /api/nodes
app.get('/api/nodes', (req, res) => {
  try {
    const nodes = db.getNodes();
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/telemetry?node&window
app.get('/api/telemetry', (req, res) => {
  try {
    const node = req.query.node || 'home1';
    const windowParam = req.query.window || '5m';
    const limit = parseInt(req.query.limit, 10) || 50;

    let windowMs = null;
    if (windowParam === '5m') windowMs = 5 * 60 * 1000;
    else if (windowParam === '15m') windowMs = 15 * 60 * 1000;
    else if (windowParam === '1h') windowMs = 60 * 60 * 1000;
    else if (windowParam === '24h') windowMs = 24 * 60 * 60 * 1000;
    else if (!isNaN(parseInt(windowParam, 10))) windowMs = parseInt(windowParam, 10) * 1000;

    const rows = db.getTelemetry(node, limit, windowMs);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/insights?node
app.get('/api/insights', (req, res) => {
  try {
    const node = req.query.node;
    if (node) {
      const latest = db.getLatestInsight(node);
      const history = db.getRecentInsights(node, 30);
      res.json({ latest, history });
    } else {
      const nodes = db.getNodes();
      const result = {};
      for (const n of nodes) {
        result[n.id] = db.getLatestInsight(n.id);
      }
      res.json(result);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/events
app.get('/api/events', (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const events = db.getEvents(limit);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/demo/stimulus {node, kind: "food" | "toxic" | "reset"}
app.post('/api/demo/stimulus', (req, res) => {
  try {
    const { node, kind } = req.body;
    const targetNode = node || 'home1';

    if (!['food', 'toxic', 'reset'].includes(kind)) {
      return res.status(400).json({ error: 'kind must be "food", "toxic", or "reset"' });
    }

    const result = sim.applyStimulus(targetNode, kind);
    const now = Date.now();

    if (kind === 'food') {
      const eventPayload = {
        ts: now,
        type: 'FEED',
        detail: `Organic surge applied to ${targetNode}: high COD/BOD feed injected (3x load for 10 min).`
      };
      publishMqtt(`biowatt/${targetNode}/event`, eventPayload, 1);
    } else if (kind === 'toxic') {
      // Publish event immediately and send valve lock command
      const eventPayload = {
        ts: now,
        type: 'TOXIC_SHOCK',
        detail: `Biological shock applied to ${targetNode}: rapid electrogenic metabolic decay (>40% drop vs baseline).`
      };
      const cmdPayload = {
        valve: 'lock',
        report_interval_s: 30
      };
      publishMqtt(`biowatt/${targetNode}/event`, eventPayload, 1);
      publishMqtt(`biowatt/${targetNode}/cmd`, cmdPayload, 1);
      db.updateNodeValve(targetNode, 'lock');
    } else if (kind === 'reset') {
      const eventPayload = {
        ts: now,
        type: 'SAFE',
        detail: `System baseline restored for ${targetNode}. Biofilm metabolism nominal.`
      };
      const cmdPayload = {
        valve: 'open',
        report_interval_s: 60
      };
      publishMqtt(`biowatt/${targetNode}/event`, eventPayload, 1);
      publishMqtt(`biowatt/${targetNode}/cmd`, cmdPayload, 1);
      db.updateNodeValve(targetNode, 'open');
    }

    res.json({
      success: true,
      node: targetNode,
      kind,
      details: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'biowatt-api',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// Start simulation generator
sim.start();

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(` BioWatt Sentinel API & Rules Engine`);
  console.log(` HTTP/Socket.IO Server listening on port ${PORT}`);
  console.log(` Nodes active: home1, oued1, outfall1, rades1`);
  console.log(`===============================================`);
});

