"use client";

import React, { useState } from "react";
import { Utensils, AlertOctagon, RotateCcw, Loader2, Sparkles } from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface DemoPanelProps {
  selectedNode: string;
  onStimulusTriggered?: (kind: string) => void;
}

export const DemoPanel: React.FC<DemoPanelProps> = ({
  selectedNode,
  onStimulusTriggered,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const triggerStimulus = async (kind: "food" | "toxic" | "reset") => {
    try {
      setLoading(kind);
      setFeedback(null);
      const url = getApiUrl("/api/demo/stimulus");
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node: selectedNode, kind }),
      });
      const data = await res.json();
      if (data.success) {
        if (kind === "food") {
          setFeedback("⚡ Food surge applied: 3x load injected. Watch BOD rise & interval shorten!");
        } else if (kind === "toxic") {
          setFeedback("🚨 Detergent injected: Current plunged >40%. Autonomous valve locked!");
        } else {
          setFeedback("🔄 Baseline restored: Valve unlocked, biofilm normalized.");
        }
        if (onStimulusTriggered) onStimulusTriggered(kind);
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(null);
      setTimeout(() => setFeedback(null), 7000);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Autonomous Demo & Stress Choreography
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Inject biochemical stress on <span className="text-emerald-300 font-mono font-semibold">{selectedNode}</span> to test self-powered reaction loop
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 self-start sm:self-auto">
          REST /api/demo/stimulus
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Pour Food Waste */}
        <button
          onClick={() => triggerStimulus("food")}
          disabled={loading !== null}
          className="group relative flex flex-col items-start p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/30 transition-all text-left disabled:opacity-50"
        >
          <div className="flex items-center gap-2 w-full justify-between">
            <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              {loading === "food" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Utensils className="w-4 h-4" />}
            </span>
            <span className="text-[10px] font-mono uppercase text-emerald-400/80 bg-emerald-950/80 px-1.5 py-0.5 rounded">
              BOD +200%
            </span>
          </div>
          <span className="font-semibold text-sm text-emerald-300 mt-2">Pour Food Waste</span>
          <span className="text-[11px] text-slate-400 mt-0.5 leading-snug">
            3x organic load for 10 min. Current surges, adaptive telemetry accelerates.
          </span>
        </button>

        {/* Drop Detergent (Toxic Shock) */}
        <button
          onClick={() => triggerStimulus("toxic")}
          disabled={loading !== null}
          className="group relative flex flex-col items-start p-3.5 rounded-xl border border-red-500/40 bg-red-950/20 hover:bg-red-900/30 transition-all text-left disabled:opacity-50"
        >
          <div className="flex items-center gap-2 w-full justify-between">
            <span className="p-2 rounded-lg bg-red-500/20 text-red-400 group-hover:scale-110 transition-transform">
              {loading === "toxic" ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertOctagon className="w-4 h-4" />}
            </span>
            <span className="text-[10px] font-mono uppercase text-red-400/80 bg-red-950/80 px-1.5 py-0.5 rounded">
              Shock &gt;40%
            </span>
          </div>
          <span className="font-semibold text-sm text-red-300 mt-2">Drop Detergent (Toxic)</span>
          <span className="text-[11px] text-slate-400 mt-0.5 leading-snug">
            Decays current to 0.2x. Triggers TOXIC_SHOCK, locks irrigation valve & alerts.
          </span>
        </button>

        {/* Reset Baseline */}
        <button
          onClick={() => triggerStimulus("reset")}
          disabled={loading !== null}
          className="group relative flex flex-col items-start p-3.5 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-800/80 transition-all text-left disabled:opacity-50"
        >
          <div className="flex items-center gap-2 w-full justify-between">
            <span className="p-2 rounded-lg bg-slate-700/40 text-slate-300 group-hover:scale-110 transition-transform">
              {loading === "reset" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            </span>
            <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
              Nominal
            </span>
          </div>
          <span className="font-semibold text-sm text-slate-200 mt-2">Reset Baseline</span>
          <span className="text-[11px] text-slate-400 mt-0.5 leading-snug">
            Restores 1.0x baseline, clears shock state, and unlocks emergency valve.
          </span>
        </button>
      </div>

      {feedback && (
        <div className="mt-3 p-2.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs font-mono text-emerald-300 animate-fadeIn">
          {feedback}
        </div>
      )}
    </div>
  );
};

