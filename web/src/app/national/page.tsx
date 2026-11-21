"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import {
  Calculator,
  Zap,
  Home,
  Coins,
  Smartphone,
  TrendingUp,
  HelpCircle,
  FileText,
  Sliders,
} from "lucide-react";

export default function NationalCalculatorPage() {
  // Sliders
  const [population, setPopulation] = useState<number>(12.45); // Millions
  const [coverageRate, setCoverageRate] = useState<number>(80); // Percent

  // Calibrated Physical & Economic Constants:
  // - 120 L per capita daily wastewater discharge (Tunisian ONAS benchmark)
  // - 0.0298 kWh net bio-electricity harvest per m³ of treated sewage
  // - 3,000 kWh annual consumption per average Tunisian household (STEG)
  // - 0.200 TND per kWh grid electricity tariff
  // - 15 Wh per full smartphone battery charge (4000 mAh @ 3.7V)
  const dailyLitersPerPerson = 120;
  const kwhPerCubicMeter = 0.0298;
  const householdKwhPerYear = 3000;
  const gridTariffTnd = 0.200;
  const phoneChargeWh = 15;

  // Real-time calculated values
  const totalPeople = population * 1_000_000;
  const annualWastewaterM3 = (totalPeople * dailyLitersPerPerson * 365) / 1000;
  const capturedWastewaterM3 = annualWastewaterM3 * (coverageRate / 100);
  const annualGwh = (capturedWastewaterM3 * kwhPerCubicMeter) / 1_000_000;
  const homesPowered = Math.round((annualGwh * 1_000_000) / householdKwhPerYear);
  const millionTndSaved = (annualGwh * 1_000_000 * gridTariffTnd) / 1_000_000;
  
  const dailyTotalWh = (annualGwh * 1_000_000_000) / 365;
  const dailyWhPerPerson = dailyTotalWh / totalPeople;
  const phoneChargesPerPersonDay = (dailyWhPerPerson / phoneChargeWh).toFixed(1);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100">
      <Navbar connected={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-extrabold uppercase tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                National MFC Scaling & Economic Impact
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Simulate the macroeconomic energy harvest and environmental savings of deploying decentralized Microbial Fuel Cells across Tunisia&apos;s wastewater infrastructure.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <span>Republic of Tunisia Model</span>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm shadow-xl">
          {/* Slider 1: Population */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Tunisian Population Connected</span>
              </label>
              <span className="text-base font-extrabold font-mono text-emerald-400">
                {population.toFixed(2)} Million
              </span>
            </div>
            <input
              type="range"
              min="5.0"
              max="20.0"
              step="0.05"
              value={population}
              onChange={(e) => setPopulation(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>5.0M</span>
              <span className="text-emerald-400 font-semibold">12.45M (National Default)</span>
              <span>20.0M</span>
            </div>
          </div>

          {/* Slider 2: MFC Deployment Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>ONAS Sewage Capture &amp; MFC Adoption</span>
              </label>
              <span className="text-base font-extrabold font-mono text-cyan-400">
                {coverageRate}%
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="1"
              value={coverageRate}
              onChange={(e) => setCoverageRate(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>20% (Pilot)</span>
              <span className="text-cyan-400 font-semibold">80% (Broad Adoption)</span>
              <span>100% (Full Net-Zero)</span>
            </div>
          </div>
        </div>

        {/* Calculated Impact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Output 1: GWh / yr */}
          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-slate-900/60 backdrop-blur-sm shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Bio-Electricity Harvest
              </span>
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-emerald-300">
                ~{annualGwh.toFixed(1)}
              </span>
              <span className="text-sm font-mono text-slate-400">GWh / yr</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Decentralized, continuous baseload generation harvested from microbial oxidation.
            </p>
          </div>

          {/* Output 2: Homes Powered */}
          <div className="p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-900/60 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tunisian Homes Powered
              </span>
              <Home className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-cyan-300">
                ~{homesPowered.toLocaleString()}
              </span>
              <span className="text-sm font-mono text-slate-400">homes</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Equivalent residential supply (based on STEG 3,000 kWh/yr average consumption).
            </p>
          </div>

          {/* Output 3: Million TND Saved */}
          <div className="p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-slate-900/60 backdrop-blur-sm shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Economic Savings
              </span>
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-amber-300">
                ~{millionTndSaved.toFixed(1)}
              </span>
              <span className="text-sm font-mono text-slate-400">Million TND</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Direct grid power cost savings at 0.200 TND/kWh public utility tariff.
            </p>
          </div>

          {/* Output 4: Smartphone Charges / person / day */}
          <div className="p-5 rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/20 to-slate-900/60 backdrop-blur-sm shadow-[0_0_20px_rgba(168,85,247,0.1)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Per-Capita Metric
              </span>
              <Smartphone className="w-5 h-5 text-purple-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-purple-300">
                ~{phoneChargesPerPersonDay}
              </span>
              <span className="text-sm font-mono text-slate-400">charges/day</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Equivalent full smartphone charges per Tunisian citizen every single day.
            </p>
          </div>
        </div>

        {/* Mandatory Assumptions Footnote Card */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Modeling Assumptions &amp; Calibrated Parameters
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-400 font-mono">
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <span className="text-slate-300 font-semibold block">Wastewater Discharge:</span>
              120 Liters / person / day (ONAS Tunisian municipal average).
            </div>
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <span className="text-slate-300 font-semibold block">Net MFC Power Density:</span>
              0.0298 kWh / m³ treated wastewater (coulombic harvest with losses).
            </div>
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <span className="text-slate-300 font-semibold block">Household Consumption:</span>
              3,000 kWh / year (STEG average residential meter).
            </div>
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <span className="text-slate-300 font-semibold block">Electricity Tariff:</span>
              0.200 TND / kWh (Tunisian STEG low-voltage utility tariff).
            </div>
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <span className="text-slate-300 font-semibold block">Smartphone Battery:</span>
              15 Watt-hours (standard 4,000 mAh @ 3.7V battery pack).
            </div>
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <span className="text-slate-300 font-semibold block">Coulombic Efficiency:</span>
              1.4% - 10.7% range from literature (Logan &amp; Rabaey et al.).
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 px-4 text-center text-xs text-slate-500 font-mono">
        BioWatt Sentinel · National Macroeconomic Wastewater Model · Indicators based on Tunisian utility data
      </footer>
    </div>
  );
}

