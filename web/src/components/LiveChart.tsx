"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatTime } from "@/lib/utils";

interface LiveChartProps {
  data: Array<{
    ts: number;
    i_ua: number;
    v_mv: number;
    p_uw: number;
    bod_mgl?: number;
  }>;
  title: string;
  metricA: { key: "i_ua" | "bod_mgl" | "p_uw"; name: string; unit: string; color: string };
  metricB?: { key: "v_mv" | "p_uw"; name: string; unit: string; color: string };
}

export const LiveChart: React.FC<LiveChartProps> = ({
  data,
  title,
  metricA,
  metricB,
}) => {
  const chartData = data.map((d) => ({
    ...d,
    time: formatTime(d.ts),
  }));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {title}
        </h4>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: metricA.color }}
            />
            <span className="text-slate-400">{metricA.name} ({metricA.unit})</span>
          </div>
          {metricB && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: metricB.color }}
              />
              <span className="text-slate-400">{metricB.name} ({metricB.unit})</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
            Awaiting telemetry packets...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${metricA.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricA.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={metricA.color} stopOpacity={0.0} />
                </linearGradient>
                {metricB && (
                  <linearGradient id={`grad-${metricB.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metricB.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={metricB.color} stopOpacity={0.0} />
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              />
              <Area
                type="monotone"
                dataKey={metricA.key}
                stroke={metricA.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#grad-${metricA.key})`}
                name={metricA.name}
                isAnimationActive={false}
              />
              {metricB && (
                <Area
                  type="monotone"
                  dataKey={metricB.key}
                  stroke={metricB.color}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill={`url(#grad-${metricB.key})`}
                  name={metricB.name}
                  isAnimationActive={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

