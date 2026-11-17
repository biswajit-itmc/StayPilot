import { BatteryLow, Building2, CalendarDays, CheckCircle2, KeyRound, LayoutDashboard, Lock, MessageSquare, Users, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { calendarDays, calendarRows, mockArrivals, mockLocks, mockProperties, type Tone } from "@/data/landing";

/** Static, illustrative product previews. Not interactive; data is fictional. */

export function Window({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-surface text-foreground shadow-pop", className)}>
      <div className="flex items-center gap-1.5 border-b border-border bg-background/60 px-4 py-2.5">
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="size-2 rounded-full bg-border-strong" />
        {title && <span className="ml-3 text-meta">{title}</span>}
      </div>
      {children}
    </div>
  );
}

const toneClass: Record<Tone, string> = {
  mint: "bg-mint/70 text-charcoal",
  sage: "bg-sage/70 text-charcoal",
  lime: "bg-lime text-charcoal",
  charcoal: "bg-charcoal text-background",
  brown: "bg-brown/15 text-brown-ink",
};

export function DashboardMock({ className }: { className?: string }) {
  const nav = [LayoutDashboard, CalendarDays, Users, Building2, Lock, MessageSquare];
  return (
    <Window className={className} title="staypilot.app/dashboard">
      <div className="grid grid-cols-[44px_1fr]">
        <div className="flex flex-col items-center gap-3 border-r border-border py-4">
          {nav.map((Icon, i) => (
            <span key={i} className={cn("grid size-7 place-items-center rounded-md", i === 0 ? "bg-accent text-charcoal" : "text-muted-foreground")}>
              <Icon className="size-3.5" />
            </span>
          ))}
        </div>
        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-card-title">Today</p>
            <p className="text-meta">Tue, 17 Nov</p>
          </div>
          <div className="mt-3 grid grid-cols-3 divide-x divide-border border-y border-border py-3">
            {[
              ["Arrivals", "8"],
              ["Departures", "5"],
              ["In house", "31"],
            ].map(([k, v]) => (
              <div key={k} className="px-3 first:pl-0">
                <p className="text-meta">{k}</p>
                <p className="tabular text-section">{v}</p>
              </div>
            ))}
          </div>
          <p className="text-eyebrow mt-4">Next arrivals</p>
          <ul className="mt-2 divide-y divide-border">
            {mockArrivals.map((a) => (
              <li key={a.guest} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-label">{a.guest}</p>
                  <p className="truncate text-meta">{a.unit}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden text-meta sm:inline">{a.state}</span>
                  <span className="tabular rounded-md bg-muted px-2 py-0.5 text-meta !text-charcoal">{a.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Window>
  );
}

export function PropertyListMock({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-5 text-foreground shadow-pop", className)}>
      <div className="flex items-center justify-between">
        <p className="text-card-title">Properties</p>
        <p className="text-meta">{mockProperties.length} active</p>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {mockProperties.map((p) => (
          <li key={p.name} className="flex items-center gap-3 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent">
              <Building2 className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-label">{p.name}</p>
              <p className="truncate text-meta">
                {p.type} · {p.location}
              </p>
            </div>
            <div className="text-right">
              <p className="tabular text-label">{p.units} units</p>
              <p className={cn("text-meta", p.status !== "Operational" && "!text-brown-ink")}>{p.status}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CalendarMock({ className }: { className?: string }) {
  return (
    <Window className={className} title="Reservations · Calendar">
      <div className="overflow-x-auto" role="region" aria-label="Reservation calendar, scrollable" tabIndex={0}>
        <div className="min-w-[720px] p-4">
          <div className="grid grid-cols-[140px_repeat(10,1fr)] text-meta">
            <span />
            {calendarDays.map((d, i) => (
              <span key={d} className={cn("pb-2 text-center", i === 0 && "font-semibold !text-charcoal")}>
                {d}
              </span>
            ))}
          </div>
          {calendarRows.map((row) => (
            <div key={row.unit} className="relative grid grid-cols-[140px_repeat(10,1fr)] items-center border-t border-border py-1.5">
              <span className="truncate pr-3 text-label">{row.unit}</span>
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className={cn("h-8", i === 0 && "bg-accent/40")} />
              ))}
              {row.stays.map((s) => (
                <span
                  key={s.guest + s.start}
                  className={cn("absolute top-1/2 flex h-8 -translate-y-1/2 items-center truncate rounded-md px-2 text-meta !text-inherit", toneClass[s.tone])}
                  style={{
                    left: `calc(140px + (100% - 140px) * ${s.start / 10} + 2px)`,
                    width: `calc((100% - 140px) * ${s.span / 10} - 4px)`,
                  }}
                >
                  {s.guest}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Window>
  );
}

export function GuestProfileMock({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-5 text-foreground shadow-pop", className)}>
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-sage text-label font-semibold">EM</span>
        <div>
          <p className="text-card-title">Elena Martins</p>
          <p className="text-meta">3 stays · Guest since 2024</p>
        </div>
        <span className="ml-auto rounded-md bg-lime px-2 py-0.5 text-meta !text-charcoal">Arriving today</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4">
        {[
          ["Unit", "Harbor Suite 204"],
          ["Stay", "17 – 22 Nov"],
          ["Party", "2 adults"],
          ["Language", "Portuguese"],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-meta">{k}</dt>
            <dd className="text-label">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 rounded-lg bg-background p-3">
        <p className="text-eyebrow">Preferences</p>
        <p className="mt-1 text-body">High floor, late check-out when available. Allergic to feather pillows.</p>
      </div>
      <ul className="mt-4 space-y-2 text-body">
        {["ID verified", "Check-in instructions sent", "Access window prepared"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-olive" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LockTableMock({ className }: { className?: string }) {
  return (
    <Window className={className} title="Smart locks">
      <div className="p-4 sm:p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-card-title">Device overview</p>
          <p className="text-meta">Illustrative data</p>
        </div>
        <ul className="mt-3 divide-y divide-border">
          {mockLocks.map((l) => (
            <li key={l.unit} className="grid grid-cols-[1fr_auto] items-center gap-3 py-2.5 sm:grid-cols-[1.4fr_1fr_90px_auto]">
              <div className="min-w-0">
                <p className="truncate text-label">{l.unit}</p>
                <p className="truncate text-meta">{l.device}</p>
              </div>
              <div className="hidden sm:block">
                <div className="h-1.5 w-full max-w-24 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", l.battery < 25 ? "bg-brown" : "bg-olive")} style={{ width: `${l.battery}%` }} />
                </div>
              </div>
              <p className="tabular hidden text-meta sm:block">{l.battery}%</p>
              <span className={cn("inline-flex items-center gap-1.5 text-meta", l.tone === "warn" ? "!text-brown-ink" : "!text-charcoal")}>
                {l.state === "Offline" ? <WifiOff className="size-3.5" /> : l.state === "Low battery" ? <BatteryLow className="size-3.5" /> : <Wifi className="size-3.5 text-olive" />}
                {l.state}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Window>
  );
}

export function MiniChip({ icon: Icon, title, detail, className }: { icon: typeof KeyRound; title: string; detail: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-3 shadow-pop", className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-mint/60">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-label">{title}</p>
        <p className="truncate text-meta">{detail}</p>
      </div>
    </div>
  );
}

