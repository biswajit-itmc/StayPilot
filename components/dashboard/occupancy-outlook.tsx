"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { getOccupancyOutlook } from "@/lib/dashboard";
import { SectionHeader } from "./section";

type Data = ReturnType<typeof getOccupancyOutlook>;
const OLIVE = "#657a1d"; // olive-deep, 4.4:1 on the page background
const OLIVE_LINE = "#657a1d";
const AXIS = "#5b5e58";

function Tip({ active, payload }: { active?: boolean; payload?: { payload: Data[number] }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-pop">
      <p className="text-label">{p.label}</p>
      <p className="text-body">
        <span className="tabular font-medium">{p.pct}%</span> occupied
      </p>
      <p className="text-meta">
        {p.occupied} of {p.sellable} units
      </p>
    </div>
  );
}

export function OccupancyOutlook({ data }: { data: Data }) {
  const peak = data.reduce((a, b) => (b.pct > a.pct ? b : a));
  const low = data.reduce((a, b) => (b.pct < a.pct ? b : a));
  return (
    <section>
      <SectionHeader
        title="Occupancy outlook"
        meta={
          <>
            Next {data.length} days · peak <span className="tabular text-charcoal">{peak.pct}%</span> on {peak.label}, lowest{" "}
            <span className="tabular text-charcoal">{low.pct}%</span> on {low.label}
          </>
        }
      />
      <div className="mt-4 h-[240px] w-full sm:h-[280px]" role="img" aria-label={`Area chart of forecast occupancy for the next ${data.length} days`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#dde4df" />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#c7d0ca" }} tick={{ fill: AXIS, fontSize: 11 }} interval="preserveStartEnd" minTickGap={18} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 11 }} width={40} />
            <Tooltip content={<Tip />} cursor={{ stroke: "#121311", strokeDasharray: "3 3" }} />
            <Area type="monotone" dataKey="pct" stroke={OLIVE_LINE} strokeWidth={2} fill={OLIVE} fillOpacity={0.16} activeDot={{ r: 5, fill: OLIVE_LINE, stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
