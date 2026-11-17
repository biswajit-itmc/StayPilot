import { BarChart3, Bell, Building2, CalendarDays, Gauge, KeyRound, Lock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, SectionIntro } from "./reveal";

function Bars({ values, className }: { values: number[]; className?: string }) {
  return (
    <div className={cn("flex h-16 items-end gap-1.5", className)} aria-hidden>
      {values.map((v, i) => (
        <span key={i} className="flex-1 rounded-sm bg-olive/80" style={{ height: `${v}%` }} />
      ))}
    </div>
  );
}

const plain = [
  { icon: Users, title: "Guest profiles", text: "Stay history, preferences and notes attached to every guest." },
  { icon: Lock, title: "Smart-lock visibility", text: "Battery, connectivity and status for supported devices." },
  { icon: KeyRound, title: "Access-code workflows", text: "Access windows planned and tracked around each stay." },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-[1280px] px-5 pt-24 sm:px-8 sm:pt-36">
      <SectionIntro eyebrow="Features" title="Built for the way hospitality actually runs." />

      <div className="mt-14 grid gap-4 lg:grid-cols-12">
        <Reveal className="rounded-2xl bg-mint/45 p-7 sm:p-9 lg:col-span-7">
          <Building2 className="size-6" strokeWidth={1.6} />
          <h3 className="text-section mt-5">Multi-property management</h3>
          <p className="mt-2 max-w-md text-body text-charcoal/75">
            Run a hotel, a row of villas and a handful of apartments side by side, each with its own units, status and team.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Harbor House Hotel", "Casa Alma Villas", "Northgate Lofts", "Seaview Suites"].map((n) => (
              <span key={n} className="rounded-lg bg-surface/80 px-3 py-1.5 text-label">
                {n}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.08} className="rounded-2xl bg-charcoal p-7 text-background sm:p-9 lg:col-span-5">
          <CalendarDays className="size-6 text-lime" strokeWidth={1.6} />
          <h3 className="text-section mt-5">Reservation calendar</h3>
          <p className="mt-2 text-body text-sage">One timeline for every unit, with gaps and conflicts easy to see.</p>
          <div className="mt-8 space-y-2" aria-hidden>
            {[
              [0, 45, "bg-lime"],
              [30, 60, "bg-sage"],
              [10, 40, "bg-mint"],
            ].map(([l, w, c], i) => (
              <div key={i} className="relative h-5 rounded bg-white/5">
                <span className={cn("absolute inset-y-0 rounded", c as string)} style={{ left: `${l}%`, width: `${w}%` }} />
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal className="mt-4 grid divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {plain.map((f) => (
          <div key={f.title} className="py-8 md:px-8 md:first:pl-0 md:last:pr-0">
            <f.icon className="size-5 text-olive" strokeWidth={1.75} />
            <h3 className="text-card-title mt-4">{f.title}</h3>
            <p className="mt-1.5 text-body text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </Reveal>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Reveal className="rounded-2xl bg-sage/50 p-7 sm:p-9 lg:col-span-5">
          <Bell className="size-6" strokeWidth={1.6} />
          <h3 className="text-section mt-5">Automated notifications</h3>
          <p className="mt-2 text-body text-charcoal/75">Pre-arrival details and check-in reminders sent from templates you control.</p>
          <div className="mt-6 space-y-2">
            <p className="max-w-[85%] rounded-xl rounded-bl-sm bg-surface px-3.5 py-2.5 text-body">Hi Elena, your suite is ready from 14:00. Here is how to get in.</p>
            <p className="ml-auto max-w-[70%] rounded-xl rounded-br-sm bg-charcoal px-3.5 py-2.5 text-body text-background">Wonderful, thank you!</p>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="grid gap-8 rounded-2xl border border-border bg-surface p-7 sm:p-9 md:grid-cols-2 lg:col-span-7">
          <div>
            <Gauge className="size-6" strokeWidth={1.6} />
            <h3 className="text-section mt-5">Operational monitoring</h3>
            <p className="mt-2 text-body text-muted-foreground">Pending tasks, late turnovers and device issues collected in one exceptions view.</p>
            <ul className="mt-5 space-y-2 text-body">
              <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-brown" />Low battery · Villa B</li>
              <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-olive" />Turnover on track · Loft 3</li>
            </ul>
          </div>
          <div className="flex flex-col">
            <BarChart3 className="size-6" strokeWidth={1.6} />
            <h3 className="text-section mt-5">Reports and analytics</h3>
            <p className="mt-2 text-body text-muted-foreground">Occupancy and revenue trends across properties and date ranges.</p>
            <Bars className="mt-auto pt-6" values={[40, 55, 48, 70, 62, 85, 74]} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
