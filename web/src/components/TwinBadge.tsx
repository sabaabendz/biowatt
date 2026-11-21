import React from "react";
import { Cpu, Radio } from "lucide-react";

interface TwinBadgeProps {
  src?: "live" | "sim";
  size?: "sm" | "md" | "lg";
  showDetail?: boolean;
}

export const TwinBadge: React.FC<TwinBadgeProps> = ({
  src = "sim",
  size = "md",
  showDetail = false
}) => {
  const isLive = src === "live";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
  }[size];

  if (isLive) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)] ${sizeClasses}`}
        title="Real-time telemetry streaming from physical ESP32 hardware"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Radio className="w-3.5 h-3.5" />
        <span>LIVE ESP32</span>
        {showDetail && <span className="text-emerald-500/80 font-normal ml-1">· Physical Bench</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)] ${sizeClasses}`}
      title="Calibrated Bio-Electrochemical Digital Twin simulation"
    >
      <Cpu className="w-3.5 h-3.5 text-amber-400" />
      <span>SIMULATION</span>
      {showDetail && <span className="text-amber-400/70 font-normal ml-1">· Digital Twin</span>}
    </span>
  );
};

