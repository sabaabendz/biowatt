"use client";

import React from "react";
import { EventData } from "@/types";
import { formatTime } from "@/lib/utils";
import { AlertOctagon, Lock, ShieldCheck, Utensils, Bell } from "lucide-react";

interface EventFeedProps {
  events: EventData[];
  maxItems?: number;
}

export const EventFeed: React.FC<EventFeedProps> = ({ events, maxItems = 15 }) => {
  const displayEvents = events.slice(0, maxItems);

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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Autonomous Event Stream
          </h4>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          MQTT biowatt/+/event
        </span>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {displayEvents.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 font-mono">
            No events recorded yet. Ready to catch autonomous actions.
          </div>
        ) : (
          displayEvents.map((evt, idx) => {
            const badge = getEventBadge(evt.type);
            const Icon = badge.icon;
            return (
              <div
                key={evt.id || idx}
                className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/30 transition-colors"
              >
                <span className={`p-1.5 rounded-lg border ${badge.color} mt-0.5 shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {evt.node}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {formatTime(evt.ts)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                    {evt.detail}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

