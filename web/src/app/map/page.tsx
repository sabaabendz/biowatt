"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { TwinBadge } from "@/components/TwinBadge";
import { getSocket } from "@/lib/socket";
import { NodeInfo, TelemetryData, InsightData } from "@/types";
import {
  MapPin,
  Waves,
  ArrowRight,
  ShieldCheck,
  Lock,
  Droplets,
  Activity,
  Layers,
  Clock,
  Zap,
} from "lucide-react";

export default function GulfMapPage() {
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
      name: "Industrial Canal Outfall",
      type: "outfall",
      src: "sim",
      location: "Radès Port Estuary",
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
      location: "Plage de Radès, Gulf of Tunis",
      lat: 36.7645,
      lng: 10.3320,
      valve_state: "open",
      last_seen: Date.now(),
    },
  ]);

  const [activeNodeId, setActiveNodeId] = useState<string>("home1");
  const [latestTelemetry, setLatestTelemetry] = useState<Record<string, TelemetryData>>({});
  const [latestInsights, setLatestInsights] = useState<Record<string, InsightData>>({});

  useEffect(() => {
    fetch("/api/nodes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setNodes(data);
      })
      .catch((err) => console.warn(err));

    const socket = getSocket();
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("telemetry", (data: TelemetryData) => {
      setLatestTelemetry((prev) => ({ ...prev, [data.node]: data }));
      if (data.src) {
        setNodes((prev) =>
          prev.map((n) => (n.id === data.node ? { ...n, src: data.src } : n))
        );
      }
    });

    socket.on("insights", (data: InsightData) => {
      setLatestInsights((prev) => ({ ...prev, [data.node]: data }));
    });

    socket.on("cmd", (data: any) => {
      if (data.valve && data.node) {
        setNodes((prev) =>
          prev.map((n) => (n.id === data.node ? { ...n, valve_state: data.valve } : n))
        );
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("telemetry");
      socket.off("insights");
      socket.off("cmd");
    };
  }, []);

  const activeNode = nodes.find((n) => n.id === activeNodeId) || nodes[0];
  const activeTel = latestTelemetry[activeNodeId] || {
    node: activeNodeId,
    v_mv: 620.0,
    i_ua: 450.0,
    p_uw: 279.0,
    turb_ntu: 22.0,
    src: activeNode.src,
  };
  const activeIns = latestInsights[activeNodeId] || {
    node: activeNodeId,
    bod_mgl: Math.round(0.9 * activeTel.i_ua + 20),
    irrigation_score: 84,
    swim_index: 78,
    toxic: false,
    recommended_interval_s: 60,
  };

  // Node Map coordinates on SVG viewBox (800 x 500)
  const mapCoordinates: Record<string, { x: number; y: number; label: string; desc: string; lag: string }> = {
    home1: {
      x: 140,
      y: 280,
      label: "Home MFC (Sidi Rezig)",
      desc: "Source: Domestic graywater MFC sentinel",
      lag: "T + 0 min (Origin)",
    },
    oued1: {
      x: 320,
      y: 340,
      label: "Oued Meliane Confluence",
      desc: "Agricultural runoff & river confluence",
      lag: "+45 min travel lag",
    },
    outfall1: {
      x: 520,
      y: 260,
      label: "Industrial Canal Outfall",
      desc: "Radès industrial channel & port mouth",
      lag: "+90 min travel lag",
    },
    rades1: {
      x: 680,
      y: 160,
      label: "Radès Coastal Beach",
      desc: "Gulf of Tunis public bathing waters",
      lag: "+180 min marine dispersion",
    },
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100">
      <Navbar connected={connected} activeValveAlert={nodes.some((n) => n.valve_state === "lock")} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Title & Hydrodynamic Plume Concept */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-extrabold uppercase tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Gulf of Tunis Wastewater & Plume Chain
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Microbial Fuel Cells act as self-powered sentinel nodes tracking pollution propagation from residential origins along Oued Meliane to the Radès coastal beach.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Lag Model:</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
              Hydrodynamic Decay &amp; Travel Plume
            </span>
          </div>
        </div>

        {/* SVG Interactive Map */}
        <div className="relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 shadow-2xl overflow-hidden">
          {/* Map Top Status Bar */}
          <div className="flex items-center justify-between mb-2 px-2 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                Live ESP32 Node
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Digital Twin Node
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <ArrowRight className="w-3.5 h-3.5" />
                Plume Flow Vector
              </span>
            </div>
            <span className="hidden sm:inline">Gulf of Tunis Coastal Basin (Tunisia)</span>
          </div>

          {/* SVG Map Canvas */}
          <div className="w-full h-[380px] sm:h-[460px] relative">
            <svg
              viewBox="0 0 800 500"
              className="w-full h-full select-none"
              style={{ background: "#060b13" }}
            >
              <defs>
                {/* Water gradient */}
                <linearGradient id="gulfWater" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#082f49" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#0c4a6e" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#0369a1" stopOpacity="0.85" />
                </linearGradient>

                {/* River plume gradient */}
                <linearGradient id="plumeStream" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="45%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
                </linearGradient>

                {/* Flow animation arrow marker */}
                <marker
                  id="flowArrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                </marker>
              </defs>

              {/* Landmass Outlines (Tunis / Ben Arous / Radès coastline) */}
              <path
                d="M 0,0 L 450,0 Q 520,60 560,110 T 620,180 T 670,290 T 730,360 L 800,420 L 800,500 L 0,500 Z"
                fill="#0f172a"
                stroke="#1e293b"
                strokeWidth="1.5"
              />

              {/* Gulf of Tunis Open Sea Waters */}
              <path
                d="M 450,0 Q 520,60 560,110 T 620,180 T 670,290 T 730,360 L 800,420 L 800,0 Z"
                fill="url(#gulfWater)"
                stroke="#0284c7"
                strokeWidth="1"
              />

              {/* Lac de Tunis (Lagoon / Lake) */}
              <ellipse
                cx="260"
                cy="140"
                rx="90"
                ry="45"
                fill="#075985"
                opacity="0.45"
                stroke="#0369a1"
                strokeDasharray="4 4"
              />
              <text x="260" y="145" textAnchor="middle" fill="#7dd3fc" fontSize="11" fontFamily="sans-serif" opacity="0.7">
                Lac de Tunis
              </text>

              {/* Geographic Labels */}
              <text x="730" y="70" textAnchor="middle" fill="#38bdf8" fontSize="14" fontWeight="bold" fontFamily="sans-serif" opacity="0.85">
                Gulf of Tunis
              </text>
              <text x="730" y="90" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontFamily="sans-serif" opacity="0.6">
                (Mediterranean Sea)
              </text>
              <text x="110" y="190" fill="#94a3b8" fontSize="12" fontWeight="600" fontFamily="sans-serif">
                Grand Tunis / Ben Arous
              </text>

              {/* Oued Meliane River Channel & Flow Vector */}
              <path
                d="M 140,280 C 220,310 260,335 320,340 C 390,345 460,310 520,260 C 580,210 630,175 680,160"
                fill="none"
                stroke="url(#plumeStream)"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* Animated Flow Pulse Dashes */}
              <path
                d="M 140,280 C 220,310 260,335 320,340 C 390,345 460,310 520,260 C 580,210 630,175 680,160"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeDasharray="10 18"
                strokeLinecap="round"
                className="animate-pulse-subtle"
                markerMid="url(#flowArrow)"
              />

              {/* Flow Arrows & Travel Lag Badges */}
              {/* Segment 1: Home -> Oued */}
              <g transform="translate(220, 290)">
                <rect x="-35" y="-12" width="70" height="20" rx="6" fill="#0f172a" stroke="#0284c7" strokeWidth="0.8" />
                <text x="0" y="2" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                  +45m Lag
                </text>
              </g>

              {/* Segment 2: Oued -> Outfall */}
              <g transform="translate(425, 295)">
                <rect x="-35" y="-12" width="70" height="20" rx="6" fill="#0f172a" stroke="#0284c7" strokeWidth="0.8" />
                <text x="0" y="2" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                  +90m Lag
                </text>
              </g>

              {/* Segment 3: Outfall -> Rades Beach */}
              <g transform="translate(605, 200)">
                <rect x="-38" y="-12" width="76" height="20" rx="6" fill="#0f172a" stroke="#0284c7" strokeWidth="0.8" />
                <text x="0" y="2" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                  +180m Sea
                </text>
              </g>

              {/* 4 Node Markers */}
              {nodes.map((n) => {
                const coords = mapCoordinates[n.id];
                if (!coords) return null;
                const isSelected = n.id === activeNodeId;
                const isLive = n.src === "live";
                const isLocked = n.valve_state === "lock";

                return (
                  <g
                    key={n.id}
                    transform={`translate(${coords.x}, ${coords.y})`}
                    onClick={() => setActiveNodeId(n.id)}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing Beacon Halo */}
                    <circle
                      r={isSelected ? "26" : "18"}
                      fill={isLocked ? "#ef4444" : isLive ? "#10b981" : "#f59e0b"}
                      opacity={isSelected ? "0.3" : "0.15"}
                      className="transition-all"
                    />

                    {/* Central Node Circle */}
                    <circle
                      r={isSelected ? "14" : "10"}
                      fill={isLocked ? "#ef4444" : isLive ? "#10b981" : "#f59e0b"}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? "3" : "1.5"}
                      className="transition-all"
                    />

                    {/* Node Pin Label */}
                    <g transform="translate(0, -22)">
                      <rect
                        x="-60"
                        y="-16"
                        width="120"
                        height="20"
                        rx="5"
                        fill="#020617"
                        stroke={isSelected ? "#10b981" : "#334155"}
                        strokeWidth="1"
                        opacity="0.95"
                      />
                      <text
                        x="0"
                        y="-3"
                        textAnchor="middle"
                        fill="#f8fafc"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {n.name.split(" ")[0]} ({n.id})
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Node Real-Time Inspection Card */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <span>{activeNode.name}</span>
                </h3>
                <TwinBadge src={activeNode.src} size="sm" showDetail />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {activeNode.location} · Lat {activeNode.lat.toFixed(4)}, Lng {activeNode.lng.toFixed(4)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Chain Valve:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 ${
                  activeNode.valve_state === "lock"
                    ? "bg-red-500/20 border-red-500 text-red-400"
                    : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                }`}
              >
                {activeNode.valve_state === "lock" ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>LOCKED</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>OPEN (SAFE)</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
              <div className="text-xs text-slate-400 font-mono">Harvested Power</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-baseline gap-1">
                <span>{activeTel.p_uw.toFixed(1)}</span>
                <span className="text-xs font-normal text-slate-400">µW</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Current: {activeTel.i_ua.toFixed(1)} µA
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
              <div className="text-xs text-slate-400 font-mono">Estimated BOD</div>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1 flex items-baseline gap-1">
                <span>{activeIns.bod_mgl.toFixed(1)}</span>
                <span className="text-xs font-normal text-slate-400">mg/L</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Turbidity: {activeTel.turb_ntu?.toFixed(1) || "20"} NTU
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
              <div className="text-xs text-slate-400 font-mono">Tunisian NT 106.03</div>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1 flex items-baseline gap-1">
                <span>{activeIns.irrigation_score}</span>
                <span className="text-xs font-normal text-slate-400">/ 100</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Irrigation Suitability
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
              <div className="text-xs text-slate-400 font-mono">Bathing Swim Index</div>
              <div className="text-xl font-bold font-mono text-cyan-300 mt-1 flex items-baseline gap-1">
                <span>{activeIns.swim_index}</span>
                <span className="text-xs font-normal text-slate-400">/ 100</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Gulf Beach Suitability
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 px-4 text-center text-xs text-slate-500 font-mono">
        BioWatt Sentinel · Gulf of Tunis Hydrodynamic Dispersion Map · Indicator values only
      </footer>
    </div>
  );
}

