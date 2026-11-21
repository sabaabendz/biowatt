import React from "react";

interface MetricGaugeProps {
  label: string;
  value: number | string;
  unit?: string;
  min?: number;
  max?: number;
  indicatorText?: string;
  colorScheme?: "emerald" | "cyan" | "amber" | "rose" | "purple";
  icon?: React.ReactNode;
}

export const MetricGauge: React.FC<MetricGaugeProps> = ({
  label,
  value,
  unit,
  min = 0,
  max = 100,
  indicatorText,
  colorScheme = "emerald",
  icon,
}) => {
  const numericVal = typeof value === "number" ? value : parseFloat(value) || 0;
  const percentage = Math.min(100, Math.max(0, ((numericVal - min) / (max - min)) * 100));

  const colorStyles = {
    emerald: {
      bar: "bg-emerald-500",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    },
    cyan: {
      bar: "bg-cyan-500",
      text: "text-cyan-400",
      border: "border-cyan-500/30",
      glow: "shadow-[0_0_15px_rgba(6,182,212,0.15)]",
    },
    amber: {
      bar: "bg-amber-500",
      text: "text-amber-400",
      border: "border-amber-500/30",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    },
    rose: {
      bar: "bg-rose-500",
      text: "text-rose-400",
      border: "border-rose-500/30",
      glow: "shadow-[0_0_15px_rgba(244,63,94,0.15)]",
    },
    purple: {
      bar: "bg-purple-500",
      text: "text-purple-400",
      border: "border-purple-500/30",
      glow: "shadow-[0_0_15px_rgba(168,85,247,0.15)]",
    },
  }[colorScheme];

  return (
    <div className={`p-4 rounded-2xl border ${colorStyles.border} bg-slate-900/60 backdrop-blur-sm ${colorStyles.glow}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {icon && <span className={colorStyles.text}>{icon}</span>}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${colorStyles.text}`}>
          {value}
        </span>
        {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
      </div>

      {/* Progress Bar Gauge */}
      <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full ${colorStyles.bar} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {indicatorText && (
        <p className="mt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between">
          <span>{indicatorText}</span>
          <span className="text-[9px] uppercase px-1 rounded bg-slate-800 text-slate-400">
            Indicator
          </span>
        </p>
      )}
    </div>
  );
};

