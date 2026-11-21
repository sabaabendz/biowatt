const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/biowatt.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance;
let isNodeSqlite = false;

try {
  const BetterSqlite3 = require('better-sqlite3');
  dbInstance = new BetterSqlite3(dbPath);
  dbInstance.pragma('journal_mode = WAL');
  console.log('[DB] Using better-sqlite3 engine');
} catch (err) {
  const { DatabaseSync } = require('node:sqlite');
  dbInstance = new DatabaseSync(dbPath);
  isNodeSqlite = true;
  console.log('[DB] Using Node.js native sqlite engine');
}

// Execute initial schema
dbInstance.exec(`
  CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    src TEXT NOT NULL DEFAULT 'sim',
    location TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    valve_state TEXT NOT NULL DEFAULT 'open',
    last_seen INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node TEXT NOT NULL,
    ts INTEGER NOT NULL,
    v_mv REAL NOT NULL,
    i_ua REAL NOT NULL,
    p_uw REAL NOT NULL,
    e_mwh REAL NOT NULL,
    turb_ntu REAL,
    src TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_telemetry_node_ts ON telemetry(node, ts);

  CREATE TABLE IF NOT EXISTS insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node TEXT NOT NULL,
    ts INTEGER NOT NULL,
    bod_mgl REAL NOT NULL,
    cod_destroyed_mg REAL NOT NULL,
    liters_treated REAL NOT NULL,
    irrigation_score INTEGER NOT NULL,
    swim_index INTEGER NOT NULL,
    toxic INTEGER NOT NULL DEFAULT 0,
    recommended_interval_s INTEGER NOT NULL,
    model TEXT NOT NULL DEFAULT 'demo-linear-v1',
    label TEXT NOT NULL DEFAULT 'indicator',
    hours_until_unsafe REAL
  );

  CREATE INDEX IF NOT EXISTS idx_insights_node_ts ON insights(node, ts);

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node TEXT NOT NULL,
    ts INTEGER NOT NULL,
    type TEXT NOT NULL,
    detail TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts DESC);
`);

// Pre-seed Gulf of Tunis chain nodes
const initialNodes = [
  {
    id: 'home1',
    name: 'Home MFC Node (Sidi Rezig)',
    type: 'residential',
    src: 'sim', // Starts in sim until live hardware transmits
    location: 'Sidi Rezig, Ben Arous, Tunisia',
    lat: 36.7538,
    lng: 10.2312,
    valve_state: 'open',
    last_seen: Date.now()
  },
  {
    id: 'oued1',
    name: 'Oued Meliane Confluence',
    type: 'canal',
    src: 'sim',
    location: 'Pont Oued Meliane, Rte de Sousse',
    lat: 36.7321,
    lng: 10.2745,
    valve_state: 'open',
    last_seen: Date.now()
  },
  {
    id: 'outfall1',
    name: 'Industrial Canal Outfall',
    type: 'outfall',
    src: 'sim',
    location: 'Radès Port / Meliane Mouth',
    lat: 36.7480,
    lng: 10.3090,
    valve_state: 'open',
    last_seen: Date.now()
  },
  {
    id: 'rades1',
    name: 'Radès Coastal Beach',
    type: 'marine',
    src: 'sim',
    location: 'Plage de Radès, Gulf of Tunis',
    lat: 36.7645,
    lng: 10.3320,
    valve_state: 'open',
    last_seen: Date.now()
  }
];

// Helper to seed initial nodes
for (const node of initialNodes) {
  const existing = dbInstance.prepare('SELECT id FROM nodes WHERE id = ?').get(node.id);
  if (!existing) {
    dbInstance.prepare(`
      INSERT INTO nodes (id, name, type, src, location, lat, lng, valve_state, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(node.id, node.name, node.type, node.src, node.location, node.lat, node.lng, node.valve_state, node.last_seen);
  }
}

// Prepared statements with universal wrappers
const getNodesStmt = dbInstance.prepare('SELECT * FROM nodes ORDER BY id ASC');
const getNodeByIdStmt = dbInstance.prepare('SELECT * FROM nodes WHERE id = ?');
const updateNodeSeenStmt = dbInstance.prepare('UPDATE nodes SET last_seen = ?, src = ? WHERE id = ?');
const updateNodeValveStmt = dbInstance.prepare('UPDATE nodes SET valve_state = ? WHERE id = ?');

const insertTelemetryStmt = dbInstance.prepare(`
  INSERT INTO telemetry (node, ts, v_mv, i_ua, p_uw, e_mwh, turb_ntu, src)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const getTelemetryRecentStmt = dbInstance.prepare(`
  SELECT * FROM telemetry
  WHERE node = ? AND ts >= ?
  ORDER BY ts ASC
`);

const getTelemetryLimitStmt = dbInstance.prepare(`
  SELECT * FROM telemetry
  WHERE node = ?
  ORDER BY ts DESC
  LIMIT ?
`);

const getLatestTelemetryStmt = dbInstance.prepare(`
  SELECT * FROM telemetry
  WHERE node = ?
  ORDER BY ts DESC
  LIMIT 1
`);

const insertInsightStmt = dbInstance.prepare(`
  INSERT INTO insights (node, ts, bod_mgl, cod_destroyed_mg, liters_treated, irrigation_score, swim_index, toxic, recommended_interval_s, model, label, hours_until_unsafe)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getLatestInsightStmt = dbInstance.prepare(`
  SELECT * FROM insights
  WHERE node = ?
  ORDER BY ts DESC
  LIMIT 1
`);

const getRecentInsightsStmt = dbInstance.prepare(`
  SELECT * FROM insights
  WHERE node = ?
  ORDER BY ts DESC
  LIMIT ?
`);

const insertEventStmt = dbInstance.prepare(`
  INSERT INTO events (node, ts, type, detail)
  VALUES (?, ?, ?, ?)
`);

const getEventsStmt = dbInstance.prepare(`
  SELECT * FROM events
  ORDER BY ts DESC
  LIMIT ?
`);

module.exports = {
  db: dbInstance,
  getNodes: () => getNodesStmt.all(),
  getNodeById: (id) => getNodeByIdStmt.get(id),
  updateNodeSeen: (nodeId, ts, src) => updateNodeSeenStmt.run(ts, src, nodeId),
  updateNodeValve: (nodeId, valveState) => updateNodeValveStmt.run(valveState, nodeId),
  
  insertTelemetry: (t) => insertTelemetryStmt.run(
    t.node,
    t.ts || Date.now(),
    t.v_mv,
    t.i_ua,
    t.p_uw,
    t.e_mwh || 0,
    t.turb_ntu != null ? t.turb_ntu : null,
    t.src || 'sim'
  ),

  getTelemetry: (node, limit = 50, windowMs = null) => {
    if (windowMs) {
      const since = Date.now() - windowMs;
      return getTelemetryRecentStmt.all(node, since);
    }
    const rows = getTelemetryLimitStmt.all(node, limit);
    return rows.reverse();
  },

  getLatestTelemetry: (node) => getLatestTelemetryStmt.get(node),

  insertInsight: (i) => insertInsightStmt.run(
    i.node,
    i.ts || Date.now(),
    i.bod_mgl,
    i.cod_destroyed_mg,
    i.liters_treated,
    i.irrigation_score,
    i.swim_index,
    i.toxic ? 1 : 0,
    i.recommended_interval_s,
    i.model || 'demo-linear-v1',
    i.label || 'indicator',
    i.hours_until_unsafe != null ? i.hours_until_unsafe : null
  ),

  getLatestInsight: (node) => getLatestInsightStmt.get(node),
  getRecentInsights: (node, limit = 50) => {
    const rows = getRecentInsightsStmt.all(node, limit);
    return rows.reverse();
  },

  insertEvent: (e) => insertEventStmt.run(
    e.node,
    e.ts || Date.now(),
    e.type,
    e.detail
  ),

  getEvents: (limit = 50) => getEventsStmt.all(limit)
};
