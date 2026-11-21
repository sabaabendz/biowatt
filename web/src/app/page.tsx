"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { TwinBadge } from "@/components/TwinBadge";
import { MetricGauge } from "@/components/MetricGauge";
import { LiveChart } from "@/components/LiveChart";
import { DemoPanel } from "@/components/DemoPanel";
import { EventFeed } from "@/components/EventFeed";
import { getSocket } from "@/lib/socket";
import { NodeInfo, TelemetryData, InsightData, EventData } from "@/types";
import { getApiUrl } from "@/lib/api";
import {
  Zap,
  BatteryCharging,
  Gauge,
  Droplets,
  Sprout,
  Waves,
  Lock,
  Unlock,
  Clock,
  Sparkles,
  Info,
  ShieldAlert,
} from "lucide-react";

export default function DashboardPage() {
  const [connected, setConnected] = useState(false);
  const [nodes, setNodes] = useState<NodeInfo[]>([
    {
      id: "home1",
      name: "Home MFC (Sidi Rezig)",
      type: "residential",
      src: "sim",
      location: "Sidi Rezig, Ben Arous",
      lat: 36.7538,
      lng: 10.2312,
      valve_state: "open",
      last_seen: Date.now(),
    },
    {
      id: "oued1",
      name: "Oued Meliane Confluence",
      type: "canal",
      src: "sim",
      location: "Pont Oued Meliane",
      lat: 36.7321,
      lng: 10.2745,
      valve_state: "open",
      last_seen: Date.now(),
    },
    {
      id: "outfall1",
      name: "Industrial Outfall",
      type: "outfall",
      src: "sim",
      location: "Radès Estuary",
      lat: 36.7480,
      lng: 10.3090,
      valve_state: "open",
      last_seen: Date.now(),
    },
    {
      id: "rades1",
      name: "Radès Coastal Beach",
      type: "marine",
      src: "sim",
      location: "Plage de Radès",
      lat: 36.7645,
      lng: 10.3320,
      valve_state: "open",
      last_seen: Date.now(),
    },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string>("home1");
  const [telemetryHistory, setTelemetryHistory] = useState<Record<string, TelemetryData[]>>({});
  const [latestTelemetry, setLatestTelemetry] = useState<Record<string, TelemetryData>>({});
  const [latestInsights, setLatestInsights] = useState<Record<string, InsightData>>({});
  const [events, setEvents] = useState<EventData[]>([]);

  useEffect(() => {
    // 1. Initial REST fetch for nodes & events
    const fetchInitialData = async () => {
      try {
        const [nodesRes, eventsRes] = await Promise.all([
          fetch(getApiUrl("/api/nodes")),
          fetch(getApiUrl("/api/events?limit=30")),
        ]);
        if (nodesRes.ok) {
          const nData = await nodesRes.json();
          if (Array.isArray(nData) && nData.length > 0) setNodes(nData);
        }
        if (eventsRes.ok) {
          const eData = await eventsRes.json();
          if (Array.isArray(eData)) setEvents(eData);
        }
      } catch (err) {
        console.warn("Error fetching initial REST data:", err);
      }
    };
    fetchInitialData();

    // 2. Connect to Socket.IO
    const socket = getSocket();

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("snapshot", (snapshot: any) => {
      if (snapshot.nodes) setNodes(snapshot.nodes);
      if (snapshot.latestInsights) setLatestInsights(snapshot.latestInsights);
      if (snapshot.recentEvents) setEvents(snapshot.recentEvents);
    });

    socket.on("telemetry", (data: TelemetryData) => {
      setLatestTelemetry((prev) => ({
        ...prev,
        [data.node]: data,
      }));

      setTelemetryHistory((prev) => {
        const currentList = prev[data.node] || [];
        const updated = [...currentList, data].slice(-40);
        return {
          ...prev,
          [data.node]: updated,
        };
      });

      // Update node src if live
      if (data.src) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === data.node ? { ...n, src: data.src, last_seen: data.ts } : n
          )
        );
      }
    });

    socket.on("insights", (data: InsightData) => {
      setLatestInsights((prev) => ({
        ...prev,
        [data.node]: data,
      }));
    });

    socket.on("event", (data: EventData) => {
      setEvents((prev) => [data, ...prev].slice(0, 50));
    });

    socket.on("cmd", (data: any) => {
      if (data.valve && data.node) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === data.node ? { ...n, valve_state: data.valve } : n
          )
        );
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("snapshot");
      socket.off("telemetry");
      socket.off("insights");
      socket.off("event");
      socket.off("cmd");
    };
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];
  const curTel = latestTelemetry[selectedNodeId] || {
    node: selectedNodeId,
    ts: Date.now(),
    v_mv: 620.0,
    i_ua: 450.0,
    p_uw: 279.0,
    e_mwh: 14.28,
    turb_ntu: 22.0,
    src: selectedNode.src,
  };

  const curIns = latestInsights[selectedNodeId] || {
    node: selectedNodeId,
    ts: Date.now(),
    bod_mgl: Math.round(0.9 * curTel.i_ua + 20),
    cod_destroyed_mg: 82.5,
    liters_treated: 0.165,
    irrigation_score: 84,
    swim_index: 78,
    toxic: false,
    recommended_interval_s: Math.max(30, Math.min(1800, Math.round(60000 / (curTel.p_uw || 200)))),
    model: "demo-linear-v1",
    label: "indicator",
    hours_until_unsafe: null,
  };

  const curHistory = telemetryHistory[selectedNodeId] || [];
  const chartData = curHistory.map((t) => ({
    ts: t.ts,
    i_ua: t.i_ua,
    v_mv: t.v_mv,
    p_uw: t.p_uw,
    bod_mgl: Math.round(0.9 * t.i_ua + 20),
  }));

  const isValveLocked = selectedNode.valve_state === "lock" || curIns.toxic;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100">
      <Navbar connected={connected} activeValveAlert={isValveLocked} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Node Selector & Real-Time Status Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          {/* Node Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {nodes.map((node) => {
              const isActive = node.id === selectedNodeId;
              const isNodeLocked = node.valve_state === "lock";
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                    isActive
                      ? "bg-slate-800 border-emerald-500/50 text-white shadow-lg shadow-emerald-950/40"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isNodeLocked ? "bg-red-400 animate-ping" : "bg-emerald-400"
                    }`}
                  />
                  <span>{node.name}</span>
                  <TwinBadge src={node.src} size="sm" />
                </button>
              );
            })}
          </div>

          {/* Current Node Source & Valve Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Source:</span>
              <TwinBadge src={selectedNode.src} size="md" showDetail />
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-colors ${
                isValveLocked
                  ? "bg-red-500/20 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse"
                  : "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
              }`}
            >
              {isValveLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>VALVE LOCKED (EMERGENCY)</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>VALVE OPEN (NORMAL)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Toxic Shock Banner if Active */}
        {isValveLocked && (
          <div className="p-4 rounded-2xl border border-red-500/60 bg-red-950/40 backdrop-blur-md shadow-2xl flex items-center justify-between gap-4 animate-bounce-subtle">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-red-200 text-sm">
                  AUTONOMOUS SAFEGUARD ENGAGED: TOXIC SHOCK DETECTED ON {selectedNode.id.toUpperCase()}
                </h4>
                <p className="text-xs text-red-300/80">
                  Microbial metabolic current dropped &gt;40% vs 5-minute baseline. Downstream irrigation solenoid valve has been autonomously LOCKED to prevent environmental contamination.
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                await fetch(getApiUrl("/api/demo/stimulus"), {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ node: selectedNodeId, kind: "reset" }),
                });
              }}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shrink-0 transition-colors"
            >
              Unlock & Reset
            </button>
          </div>
        )}

        {/* Top Metric Gauges Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cell Potential (mV) */}
          <MetricGauge
            label="Cell Voltage"
            value={curTel.v_mv.toFixed(1)}
            unit="mV"
            min={0}
            max={1000}
            indicatorText="Open/Loaded Cell Potential"
            colorScheme="cyan"
            icon={<Gauge className="w-4 h-4" />}
          />

          {/* Harvested Power (uW) */}
          <MetricGauge
            label="Power Harvested"
            value={curTel.p_uw.toFixed(1)}
            unit="µW"
            min={0}
            max={800}
            indicatorText="Continuous bio-electricity"
            colorScheme="emerald"
            icon={<Zap className="w-4 h-4" />}
          />

          {/* Biofilm Current (uA) */}
          <MetricGauge
            label="Bio-Current"
            value={curTel.i_ua.toFixed(1)}
            unit="µA"
            min={0}
            max={1200}
            indicatorText="Active metabolic electron flux"
            colorScheme="purple"
            icon={<BatteryCharging className="w-4 h-4" />}
          />

          {/* Cumulative Energy Counter (mWh) */}
          <MetricGauge
            label="Energy Ledger"
            value={curTel.e_mwh.toFixed(3)}
            unit="mWh"
            min={0}
            max={50}
            indicatorText="Self-powering budget"
            colorScheme="amber"
            icon={<Zap className="w-4 h-4" />}
          />
        </div>

        {/* AI Bio-Environmental Soft-Sensor Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* BOD Estimate */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                BOD5 Estimate
              </span>
              <Droplets className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-emerald-300">
                {curIns.bod_mgl.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-slate-400">mg/L O₂</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>BOD Soft-Sensor</span>
              <span className="text-[10px] text-emerald-400/90 font-semibold">
                clamp(0.9·I + 20)
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500 italic">
              Indicator, not certification
            </p>
          </div>

          {/* Coulombic Ledger & Treatment */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Coulombic Ledger
              </span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-cyan-300">
                {curIns.cod_destroyed_mg.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-slate-400">mg COD destroyed</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Treated Volume:</span>
              <span className="font-bold text-slate-200">
                {curIns.liters_treated.toFixed(3)} L
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500 italic">
              CE: 1.4-10.7% (Logan/Rabaey et al.)
            </p>
          </div>

          {/* Irrigation Suitability (Tunisian NT 106.03) */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Irrigation Index
              </span>
              <Sprout className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-3xl font-extrabold font-mono ${
                  curIns.irrigation_score >= 80
                    ? "text-emerald-400"
                    : curIns.irrigation_score >= 50
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {curIns.irrigation_score}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 100</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Standard:</span>
              <span className="text-emerald-400/90 font-semibold">NT 106.03</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              COD ≤ 90, BOD5 ≤ 30 mg/L threshold
            </p>
          </div>

          {/* Swim Index & Forecast */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Beach Swim Index
              </span>
              <Waves className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-3xl font-extrabold font-mono ${
                  curIns.swim_index >= 70
                    ? "text-cyan-400"
                    : curIns.swim_index >= 50
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {curIns.swim_index}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 100</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Ridge Forecast:</span>
              <span className="font-semibold text-slate-200">
                {curIns.hours_until_unsafe
                  ? `Unsafe in ${curIns.hours_until_unsafe}h`
                  : "Safe (>12h)"}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Ref limit: 100 coliforms/100mL
            </p>
          </div>
        </div>

        {/* Adaptive Telemetry & Auto-Actuation Bar */}
        <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300">Adaptive Reporting Interval:</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-bold">
              {curIns.recommended_interval_s}s
            </span>
            <span className="text-slate-500 hidden md:inline">
              (clamp(60000 / {curTel.p_uw.toFixed(0)}µW): dirtier = faster)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Info className="w-3.5 h-3.5" />
              <span>Model: <strong className="text-slate-200">{curIns.model}</strong></span>
            </div>
            <div className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
              {curIns.label}
            </div>
          </div>
        </div>

        {/* Interactive Demo Panel */}
        <DemoPanel
          selectedNode={selectedNodeId}
          onStimulusTriggered={(kind) => {
            console.log(`Stimulus triggered: ${kind}`);
          }}
        />

        {/* Live Recharts & Event Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts Column (2 cols wide) */}
          <div className="lg:col-span-2 space-y-6">
            <LiveChart
              data={chartData}
              title={`Real-Time Current & Voltage (${selectedNode.name})`}
              metricA={{ key: "i_ua", name: "Bio-Current", unit: "µA", color: "#10b981" }}
              metricB={{ key: "v_mv", name: "Voltage", unit: "mV", color: "#06b6d4" }}
            />

            <LiveChart
              data={chartData}
              title="Estimated BOD & Power Dynamics"
              metricA={{ key: "bod_mgl", name: "BOD Soft-Sensor", unit: "mg/L", color: "#38bdf8" }}
              metricB={{ key: "p_uw", name: "Harvested Power", unit: "µW", color: "#a855f7" }}
            />
          </div>

          {/* Event Stream Column */}
          <div className="lg:col-span-1">
            <EventFeed events={events} maxItems={25} />
          </div>
        </div>
      </main>

      {/* Global Hackathon Footnote */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 px-4 text-center text-xs text-slate-500 font-mono">
        BioWatt Sentinel · Microbial Fuel Cell Self-Powered Wastewater Sentinel · Gulf of Tunis Chain · Tunisian Standard NT 106.03 Compliant · Indicators Only, Not Certifications
      </footer>
    </div>
  );
}

