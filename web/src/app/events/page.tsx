"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { getSocket } from "@/lib/socket";
import { EventData } from "@/types";
import { formatDateTime } from "@/lib/utils";
import {
  AlertTriangle,
  AlertOctagon,
  Lock,
  ShieldCheck,
  Utensils,
  Bell,
  Filter,
} from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterNode, setFilterNode] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/events?limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
      })
      .catch((err) => console.warn(err));

    const socket = getSocket();
    socket.on("event", (evt: EventData) => {
      setEvents((prev) => [evt, ...prev]);
    });

    return () => {
      socket.off("event");
    };
  }, []);

  const filteredEvents = events.filter((e) => {
    if (filterType !== "ALL" && e.type !== filterType) return false;
    if (filterNode !== "ALL" && e.node !== filterNode) return false;
    return true;
  });

  const getEventBadge = (type: EventData["type"]) => {
    switch (type) {
      case "TOXIC_SHOCK":
        return {
          icon: AlertOctagon,
          label: "TOXIC SHOCK",
          color: "border-red-500/50 bg-red-500/10 text-red-400",
        };
      case "VALVE_LOCK":
        return {
          icon: Lock,
          label: "VALVE LOCK",
          color: "border-amber-500/50 bg-amber-500/10 text-amber-300",
        };
      case "SAFE":
        return {
          icon: ShieldCheck,
          label: "SAFE",
          color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
        };
      case "FEED":
        return {
          icon: Utensils,
          label: "FEED SURGE",
          color: "border-cyan-500/50 bg-cyan-500/10 text-cyan-300",
        };
      default:
        return {
          icon: Bell,
          label: type,
          color: "border-slate-500/50 bg-slate-500/10 text-slate-300",
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100">
      <Navbar connected={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-extrabold uppercase tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-red-400 bg-clip-text text-transparent">
                Autonomous Safeguard &amp; Event Audit Log
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Persistent event trail of biochemical shocks, autonomous valve actuations, organic surges, and safe recovery cycles across all sentinel nodes.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Total Logged:</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 font-bold">
              {events.length}
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 font-semibold">Filter Type:</span>
            {["ALL", "TOXIC_SHOCK", "VALVE_LOCK", "SAFE", "FEED"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-lg border transition-colors ${
                  filterType === t
                    ? "bg-slate-800 border-emerald-500 text-emerald-400 font-bold"
                    : "border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-semibold">Node:</span>
            {["ALL", "home1", "oued1", "outfall1", "rades1"].map((n) => (
              <button
                key={n}
                onClick={() => setFilterNode(n)}
                className={`px-2.5 py-1 rounded-lg border transition-colors ${
                  filterNode === n
                    ? "bg-slate-800 border-cyan-500 text-cyan-400 font-bold"
                    : "border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Events Table / Feed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Node</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Details &amp; Autonomous Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No matching events found in audit log.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt, idx) => {
                    const badge = getEventBadge(evt.type);
                    const Icon = badge.icon;
                    return (
                      <tr key={evt.id || idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {formatDateTime(evt.ts)}
                        </td>
                        <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                          {evt.node}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] ${badge.color}`}>
                            <Icon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-sans">
                          {evt.detail}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 px-4 text-center text-xs text-slate-500 font-mono">
        BioWatt Sentinel · Autonomous Event Audit Trail · Persistent SQLite Store
      </footer>
    </div>
  );
}

