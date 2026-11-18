"use client";

import Image from "next/image";
import { ArrowRight, Building2, Pencil, Archive, ArchiveRestore } from "lucide-react";
import type { Property } from "@/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { PropertyStatusBadge, RoomStateBadge } from "@/components/shared/status-badges";
import { useAppData } from "@/hooks/use-app-data";
import { roomLabel } from "@/data/rooms";
import { TODAY_ISO, formatStayTime } from "@/lib/dates";
import { isLive, propertyStats, roomState, unitName } from "@/lib/model";
import { format, parseISO } from "date-fns";

export function PropertyImage({ property, className, sizes }: { property: Pick<Property, "image" | "name">; className?: string; sizes?: string }) {
  return property.image ? (
    <Image src={property.image} alt="" fill sizes={sizes ?? "(min-width: 1024px) 33vw, 100vw"} className={className ?? "object-cover"} />
  ) : (
    <span className="absolute inset-0 grid place-items-center bg-muted text-muted-foreground">
      <Building2 className="size-8" aria-hidden />
    </span>
  );
}

export function PropertyDetails({
  property,
  onClose,
  onEdit,
  onArchive,
  onRestore,
  onViewUnits,
  onAddUnit,
  onViewReservations,
}: {
  property: Property | null;
  onClose: () => void;
  onEdit: (p: Property) => void;
  onArchive: (p: Property) => void;
  onRestore: (p: Property) => void;
  onViewUnits: (p: Property) => void;
  onAddUnit: (p: Property) => void;
  onViewReservations: (p: Property) => void;
}) {
  const { model: m } = useAppData();
  const p = property;
  const stats = p ? propertyStats(m, p.id) : null;
  const units = p ? m.rooms.filter((r) => r.propertyId === p.id) : [];
  const arrivals = p
    ? m.reservations
        .filter((r) => r.propertyId === p.id && isLive(r) && r.checkIn >= TODAY_ISO && r.status !== "Checked Out")
        .sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.checkInTime.localeCompare(b.checkInTime))
        .slice(0, 5)
    : [];

  return (
    <Sheet open={!!p} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {p && stats && (
          <>
            <div className="relative aspect-[16/8] w-full shrink-0 bg-muted">
              <PropertyImage property={p} sizes="512px" />
            </div>
            <div className="space-y-6 p-6">
              <header>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SheetTitle className="text-page-title">{p.name}</SheetTitle>
                    <SheetDescription className="mt-1">
                      {p.type} · {p.city}
                    </SheetDescription>
                  </div>
                  <PropertyStatusBadge status={p.status} />
                </div>
                {p.description && <p className="mt-3 text-body text-muted-foreground">{p.description}</p>}
              </header>

              <dl className="grid grid-cols-4 divide-x divide-border rounded-xl border border-border bg-surface">
                {[
                  ["Units", stats.units],
                  ["Occupancy", p.status === "Active" ? `${stats.occupancy}%` : "–"],
                  ["Arrivals", stats.arrivalsToday],
                  ["Departures", stats.departuresToday],
                ].map(([k, v]) => (
                  <div key={k as string} className="px-3 py-3">
                    <dt className="text-meta">{k}</dt>
                    <dd className="tabular mt-0.5 text-section">{v}</dd>
                  </div>
                ))}
              </dl>

              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {[
                  ["Manager", p.manager],
                  ["Phone", p.phone],
                  ["Email", p.email],
                  ["Check-in / out", `${p.checkInTime} / ${p.checkOutTime}`],
                  ["Address", p.address],
                ].map(([k, v]) => (
                  <div key={k} className={k === "Address" ? "sm:col-span-2" : undefined}>
                    <dt className="text-meta">{k}</dt>
                    <dd className="text-body">{v}</dd>
                  </div>
                ))}
              </dl>

              <section aria-labelledby="pd-units">
                <div className="flex items-center justify-between">
                  <h3 id="pd-units" className="text-card-title">
                    Units
                  </h3>
                  <button type="button" onClick={() => onViewUnits(p)} className="inline-flex min-h-6 items-center gap-1 text-label hover:underline">
                    View all {units.length} <ArrowRight className="size-3.5" aria-hidden />
                  </button>
                </div>
                {units.length === 0 ? (
                  <div className="mt-2 rounded-xl border border-dashed border-border-strong px-4 py-5 text-center">
                    <p className="text-label">No units in this property yet</p>
                    <p className="mt-1 text-body text-muted-foreground">Add rooms or units so the property can take bookings.</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => onAddUnit(p)}>
                      Add a unit
                    </Button>
                  </div>
                ) : (
                  <ul className="mt-2 divide-y divide-border border-y border-border">
                    {units.slice(0, 6).map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                        <span className="text-body">
                          {roomLabel(r)} <span className="text-meta">· {r.type}</span>
                        </span>
                        <RoomStateBadge state={roomState(m, r)} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="pd-arrivals">
                <div className="flex items-center justify-between">
                  <h3 id="pd-arrivals" className="text-card-title">
                    Next arrivals
                  </h3>
                  <button type="button" onClick={() => onViewReservations(p)} className="inline-flex min-h-6 items-center gap-1 text-label hover:underline">
                    All reservations <ArrowRight className="size-3.5" aria-hidden />
                  </button>
                </div>
                {arrivals.length === 0 ? (
                  <p className="mt-2 text-body text-muted-foreground">No upcoming arrivals.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-border border-y border-border">
                    {arrivals.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                        <span className="min-w-0 text-body">
                          <span className="block truncate text-label">{m.by.guest.get(r.guestId)?.name}</span>
                          <span className="text-meta">{unitName(m, r.roomId)}</span>
                        </span>
                        <span className="tabular shrink-0 text-meta">{format(parseISO(r.checkIn), "d MMM")} · {formatStayTime(r.checkInTime) ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="flex flex-wrap gap-2 border-t border-border pt-5">
                <Button onClick={() => onEdit(p)}>
                  <Pencil /> Edit
                </Button>
                {p.status === "Archived" ? (
                  <Button variant="outline" onClick={() => onRestore(p)}>
                    <ArchiveRestore /> Restore
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => onArchive(p)}>
                    <Archive /> Archive
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
