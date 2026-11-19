"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, UserRound, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Guest } from "@/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { SimpleSelect } from "@/components/shared/simple-select";
import { GuestStatusBadge } from "@/components/shared/status-badges";
import { useAppData, useIntent } from "@/hooks/use-app-data";
import { roomLabel } from "@/data/rooms";
import { guestStats } from "@/lib/model";
import { cn } from "@/lib/utils";
import { GuestDialog } from "./guest-dialog";
import { GuestProfile } from "./guest-profile";
import { MessageDialog } from "./message-dialog";

const STATUS = [{ value: "all", label: "All statuses" }, ...["Standard", "VIP", "Blocked"].map((s) => ({ value: s, label: s }))];
const SEGMENT = [
  { value: "all", label: "All guests" },
  { value: "inhouse", label: "Staying now" },
  { value: "upcoming", label: "Upcoming reservation" },
  { value: "returning", label: "Returning (3+ stays)" },
  { value: "never", label: "No stays yet" },
];
const SORT = [
  { value: "name", label: "Name A–Z" },
  { value: "last", label: "Most recent stay" },
  { value: "stays", label: "Most stays" },
];
const PAGE_SIZE = 20;
const short = (s: string) => format(parseISO(s), "d MMM yyyy");
const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2);

export function GuestsView() {
  const router = useRouter();
  const { model: m, openIntent } = useAppData();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [segment, setSegment] = useState("all");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Guest | "new" | null>(null);
  const [messaging, setMessaging] = useState<Guest | null>(null);

  useIntent(["guest"], (i) => i.type === "guest" && setSelectedId(i.id));

  const stats = useMemo(() => new Map(m.guests.map((g) => [g.id, guestStats(m, g.id)])), [m]);
  const q = query.trim().toLowerCase();

  const rows = useMemo(() => {
    const list = m.guests.filter((g) => {
      const s = stats.get(g.id)!;
      if (status !== "all" && g.status !== status) return false;
      if (segment === "inhouse" && !s.inHouse) return false;
      if (segment === "upcoming" && !s.upcoming) return false;
      if (segment === "returning" && s.stays < 3) return false;
      if (segment === "never" && s.stays > 0) return false;
      return !q || [g.name, g.email, g.phone, g.country].some((x) => x.toLowerCase().includes(q));
    });
    return list.sort((a, b) => {
      const sa = stats.get(a.id)!;
      const sb = stats.get(b.id)!;
      if (sort === "last") return (sb.last?.checkOut ?? "").localeCompare(sa.last?.checkOut ?? "") || a.name.localeCompare(b.name);
      if (sort === "stays") return sb.stays - sa.stays || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }, [m.guests, stats, q, status, segment, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const selected = selectedId ? (m.by.guest.get(selectedId) ?? null) : null;
  const filtersActive = q !== "" || status !== "all" || segment !== "all";
  const filter = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };
  const reset = () => {
    setQuery("");
    setStatus("all");
    setSegment("all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guests"
        description="Everyone who has booked with you, with their history, messages and notes in one place."
        actions={
          <Button variant="accent" onClick={() => setEditing("new")}>
            <Plus /> Add guest
          </Button>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
        {/* List pane: on small screens it is replaced by the profile once a guest is chosen. */}
        <section aria-label="Guest list" className={cn("min-w-0 space-y-4", selected && "hidden xl:block")}>
          <div className="flex flex-wrap items-center gap-2" role="search" aria-label="Guest filters">
            <div className="relative min-w-0 flex-1 basis-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => filter(setQuery)(e.target.value)}
                placeholder="Search name, email or phone"
                aria-label="Search guests by name, email or phone"
                className="h-9.5 w-full rounded-lg border border-input bg-surface pl-9 pr-8 text-body outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button type="button" onClick={() => filter(setQuery)("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-charcoal">
                  <X className="size-3.5" aria-hidden />
                </button>
              )}
            </div>
            <SimpleSelect label="Guests" value={segment} onChange={filter(setSegment)} options={SEGMENT} className="w-[calc(50%-0.25rem)] sm:w-52" />
            <SimpleSelect label="Status" value={status} onChange={filter(setStatus)} options={STATUS} className="w-[calc(50%-0.25rem)] sm:w-36" />
            <SimpleSelect label="Sort" value={sort} onChange={setSort} options={SORT} className="w-full sm:w-44" />
            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={reset}>
                Clear filters
              </Button>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            {rows.length === 0 ? (
              <EmptyState
                icon={UserRound}
                title="No guests match"
                description={filtersActive ? "Try a different search or clear the filters." : "Add your first guest to get started."}
                action={
                  filtersActive ? (
                    <Button variant="outline" onClick={reset}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {visible.map((g) => {
                    const s = stats.get(g.id)!;
                    const active = g.id === selectedId;
                    return (
                      <li key={g.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(g.id)}
                          aria-current={active ? "true" : undefined}
                          className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40", active && "bg-accent")}
                        >
                          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-sage text-label">
                            {initials(g.name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-label">{g.name}</span>
                            <span className="block truncate text-meta">
                              {g.email}
                              <span className="hidden xl:inline 2xl:hidden"> · last {s.last ? short(s.last.checkOut) : "none"}</span>
                            </span>
                          </span>
                          <span className="hidden w-16 text-right sm:block">
                            <span className="block text-meta">Stays</span>
                            <span className="tabular text-label">{s.stays}</span>
                          </span>
                          <span className="hidden w-28 text-right md:block xl:hidden 2xl:block">
                            <span className="block text-meta">Last stay</span>
                            <span className="tabular text-body">{s.last ? short(s.last.checkOut) : "–"}</span>
                          </span>
                          <span className="hidden w-36 text-right lg:block xl:hidden 2xl:block">
                            <span className="block text-meta">Upcoming</span>
                            <span className="tabular text-body">{s.inHouse ? "In house" : s.upcoming ? `${short(s.upcoming.checkIn)}` : "–"}</span>
                            {s.upcoming && !s.inHouse && <span className="block truncate text-meta">{roomLabel(m.by.room.get(s.upcoming.roomId)!)}</span>}
                          </span>
                          <span className="flex w-24 shrink-0 justify-end">
                            <GuestStatusBadge status={g.status} />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <Pagination page={current} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} noun="guests" />
              </>
            )}
          </div>
        </section>

        {/* Profile pane */}
        <div className={cn("min-w-0 xl:sticky xl:top-24", !selected && "hidden xl:block")}>
          {selected ? (
            <GuestProfile
              key={selected.id}
              guest={selected}
              onBack={() => setSelectedId(null)}
              onEdit={setEditing}
              onMessage={setMessaging}
              onOpenReservation={(id) => {
                openIntent({ type: "reservation", id });
                router.push("/reservations");
              }}
              onNewReservation={(g) => {
                openIntent({ type: "new-reservation", guestId: g.id });
                router.push("/reservations");
              }}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border-strong">
              <EmptyState icon={UserRound} title="Select a guest" description="Their profile, reservations, stays, messages and notes appear here." />
            </div>
          )}
        </div>
      </div>

      <GuestDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} guest={editing && editing !== "new" ? editing : undefined} onSaved={(g) => setSelectedId(g.id)} />
      <MessageDialog open={!!messaging} onOpenChange={(o) => !o && setMessaging(null)} guestId={messaging?.id ?? ""} />
    </div>
  );
}
