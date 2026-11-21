"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Map, Calculator, AlertTriangle, ShieldCheck, Zap } from "lucide-react";

interface NavbarProps {
  connected: boolean;
  activeValveAlert?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ connected, activeValveAlert = false }) => {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Live Dashboard", icon: Activity },
    { href: "/map", label: "Gulf of Tunis Chain", icon: Map },
    { href: "/national", label: "National Calculator", icon: Calculator },
    { href: "/events", label: "Event Feed", icon: AlertTriangle },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.35)] group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-black fill-current stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                BioWatt Sentinel
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                MFC v1.0
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Wastewater Sensing & Self-Powered Autonomous Defense
            </p>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          {activeValveAlert ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-semibold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>VALVE LOCKED</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chain Safe</span>
            </div>
          )}

          <div
            className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border ${
              connected
                ? "bg-slate-900/80 border-slate-700 text-emerald-400"
                : "bg-slate-900/80 border-slate-700 text-amber-400"
            }`}
            title={connected ? "Socket.IO + MQTT connected" : "Connecting to telemetry broker..."}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-amber-400 animate-ping"
              }`}
            />
            <span className="hidden lg:inline">{connected ? "LIVE BUS" : "CONNECTING"}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

