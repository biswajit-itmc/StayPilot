"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Building2, LayoutGrid, List, MoreHorizontal, Pencil, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import type { Property } from "@/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { SimpleSelect } from "@/components/shared/simple-select";
import { PropertyStatusBadge } from "@/components/shared/status-badges";
import { useAppData, useIntent } from "@/hooks/use-app-data";
import { isActiveStay, propertyStats, type Model } from "@/lib/model";
import { cn } from "@/lib/utils";
import { PropertyDetails, PropertyImage } from "./property-details";
import { PropertyDialog } from "./property-dialog";

const STATUS = [
  { value: "all", label: "All statuses" },
  { value: "Active", label: "Active" },
  { value: "Onboarding", label: "Onboarding" },
  { value: "Archived", label: "Archived" },
];
const TYPE = [{ value: "all", label: "All types" }, ...["Hotel", "Boutique hotel", "Guesthouse", "Villas", "Apartments"].map((t) => ({ value: t, label: t }))];

function Occupancy({ m, p, compact }: { m: Model; p: Property; compact?: boolean }) {
  const s = propertyStats(m, p.id);
  if (p.status !== "Active") return <span className="text-meta">Not open</span>;
  return (
    <div className={cn("min-w-0", compact ? "w-28" : "w-full")}>
      <div className="flex items-baseline justify-between">
        <span className="tabular text-label">{s.occupancy}%</span>
        <span className="tabular text-meta">
          {s.occupied}/{s.sellable}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border-strong" role="img" aria-label={`${p.name} ${s.occupancy}% occupied tonight`}>
        <div className="h-full rounded-full bg-olive-deep" style={{ width: `${s.occupancy}%` }} />
      </div>
    </div>
  );
}

function RowActions({ p, onOpen, onEdit, onArchive, onRestore }: { p: Property; onOpen: () => void; onEdit: () => void; onArchive: () => void; onRestore: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${p.name}`} />}>
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onOpen}>View details</DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {p.status === "Archived" ? (
          <DropdownMenuItem onClick={onRestore}>
            <ArchiveRestore /> Restore
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onArchive}>
            <Archive /> Archive
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PropertiesView() {
  const router = useRouter();
  const { model: m, actions, openIntent } = useAppData();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Property | "new" | null>(null);
  const [archiving, setArchiving] = useState<Property | null>(null);

  useIntent(["property"], (i) => i.type === "property" && setSelectedId(i.id));

  const q = query.trim().toLowerCase();
  const list = useMemo(
    () =>
      m.properties.filter(
        (p) =>
          (status === "all" || p.status === status) &&
          (type === "all" || p.type === type) &&
          (!q || [p.name, p.city, p.manager, p.type].some((s) => s.toLowerCase().includes(q)))
      ),
    [m.properties, q, status, type]
  );
  const selected = selectedId ? (m.by.property.get(selectedId) ?? null) : null;
  const filtersActive = q !== "" || status !== "all" || type !== "all";
  const clear = () => {
    setQuery("");
    setStatus("all");
    setType("all");
  };

  const archive = (p: Property) => {
    actions.setPropertyStatus(p.id, "Archived");
    toast.success(`${p.name} archived`, { description: "It no longer appears on the dashboard. You can restore it any time." });
  };
  const restore = (p: Property) => {
    actions.setPropertyStatus(p.id, "Active");
    toast.success(`${p.name} restored`, { description: "It is active again." });
  };

  // A property cannot be archived while any stay is still in the house or arriving: that would orphan live bookings.
  const activeStays = archiving ? m.reservations.filter((r) => r.propertyId === archiving.id && isActiveStay(r)) : [];
  const inHouse = activeStays.filter((r) => r.status === "Checked In").length;
  const upcoming = activeStays.length - inHouse;

  const open = (p: Property) => setSelectedId(p.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="Every hotel, villa and apartment you manage, with how full it is tonight."
        actions={
          <Button variant="accent" onClick={() => setEditing("new")}>
            <Plus /> Add property
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 sm:gap-3" role="search" aria-label="Property filters">
        <div className="relative min-w-0 flex-1 basis-56 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, city or manager"
            aria-label="Search properties by name, city or manager"
            className="h-9.5 w-full rounded-lg border border-input bg-surface pl-9 pr-8 text-body outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-charcoal">
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
        <SimpleSelect label="Status" value={status} onChange={setStatus} options={STATUS} className="w-[calc(50%-0.25rem)] sm:w-40" />
        <SimpleSelect label="Property type" value={type} onChange={setType} options={TYPE} className="w-[calc(50%-0.25rem)] sm:w-44" />
        <div className="ml-auto flex items-center gap-3">
          <p className="hidden text-meta sm:block" aria-live="polite">
            <span className="tabular !text-charcoal">{list.length}</span> of {m.properties.length} properties
          </p>
          <SegmentedControl
            label="Layout"
            value={view}
            onChange={setView}
            options={[
              { value: "grid", label: "Grid", icon: LayoutGrid },
              { value: "list", label: "List", icon: List },
            ]}
          />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong">
          <EmptyState
            icon={Building2}
            title={filtersActive ? "No properties match your filters" : "No properties yet"}
            description={filtersActive ? "Try a different search, or clear the filters to see everything." : "Add your first property to start managing rooms and reservations."}
            action={
              filtersActive ? (
                <Button variant="outline" onClick={clear}>
                  Clear filters
                </Button>
              ) : (
                <Button variant="accent" onClick={() => setEditing("new")}>
                  <Plus /> Add property
                </Button>
              )
            }
          />
        </div>
      ) : view === "grid" ? (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <li key={p.id} className={cn("group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-shadow hover:shadow-pop", p.status === "Archived" && "opacity-75")}>
              <button type="button" onClick={() => open(p)} className="block w-full text-left">
                <span className="relative block aspect-[16/10] w-full overflow-hidden bg-muted">
                  <PropertyImage property={p} className={cn("object-cover transition-transform duration-500 group-hover:scale-[1.03]", p.status === "Archived" && "grayscale")} />
                  <span className="absolute left-3 top-3 rounded-md bg-surface p-0.5 shadow-card">
                    <PropertyStatusBadge status={p.status} />
                  </span>
                </span>
                <span className="block p-4">
                  <span className="block text-section">{p.name}</span>
                  <span className="mt-0.5 block text-body text-muted-foreground">
                    {p.city} · {p.type}
                  </span>
                  <span className="mt-4 grid grid-cols-[auto_1fr] items-end gap-x-6">
                    <span>
                      <span className="block text-meta">Units</span>
                      <span className="tabular text-card-title">{propertyStats(m, p.id).units}</span>
                    </span>
                    <Occupancy m={m} p={p} />
                  </span>
                  <span className="mt-4 block border-t border-border pt-3 text-meta">
                    Managed by <span className="text-label !text-charcoal">{p.manager}</span>
                  </span>
                </span>
              </button>
              <div className="absolute right-2 top-2">
                <div className="rounded-lg bg-surface/90 backdrop-blur">
                  <RowActions p={p} onOpen={() => open(p)} onEdit={() => setEditing(p)} onArchive={() => setArchiving(p)} onRestore={() => restore(p)} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <ul className="divide-y divide-border">
            {list.map((p) => (
              <li key={p.id} className={cn("flex items-center gap-4 px-4 py-3 hover:bg-accent/40", p.status === "Archived" && "opacity-75")}>
                <button type="button" onClick={() => open(p)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                  <span className="relative block h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-14 sm:w-20">
                    <PropertyImage property={p} sizes="80px" className={cn("object-cover", p.status === "Archived" && "grayscale")} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-label">{p.name}</span>
                    <span className="block truncate text-meta">
                      {p.city} · {p.type}
                    </span>
                    <span className="mt-1 block sm:hidden">
                      <PropertyStatusBadge status={p.status} />
                    </span>
                  </span>
                  <span className="hidden w-16 text-right md:block">
                    <span className="block text-meta">Units</span>
                    <span className="tabular text-label">{propertyStats(m, p.id).units}</span>
                  </span>
                  <span className="hidden w-32 xl:block">
                    <Occupancy m={m} p={p} compact />
                  </span>
                  <span className="hidden w-36 text-body xl:block">
                    <span className="block text-meta">Manager</span>
                    {p.manager}
                  </span>
                  <span className="hidden shrink-0 sm:block">
                    <PropertyStatusBadge status={p.status} />
                  </span>
                </button>
                <RowActions p={p} onOpen={() => open(p)} onEdit={() => setEditing(p)} onArchive={() => setArchiving(p)} onRestore={() => restore(p)} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <PropertyDetails
        property={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(p) => setEditing(p)}
        onArchive={(p) => setArchiving(p)}
        onRestore={restore}
        onViewUnits={(p) => {
          openIntent({ type: "rooms", propertyId: p.id });
          router.push("/rooms");
        }}
        onAddUnit={(p) => {
          openIntent({ type: "new-room", propertyId: p.id });
          router.push("/rooms");
        }}
        onViewReservations={(p) => {
          openIntent({ type: "reservations", propertyId: p.id });
          router.push("/reservations");
        }}
      />

      <PropertyDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        property={editing && editing !== "new" ? editing : undefined}
        onSaved={(p) => setSelectedId(p.id)}
      />

      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(o) => !o && setArchiving(null)}
        title={`Archive ${archiving?.name ?? ""}?`}
        description="Archived properties are hidden from the dashboard and no longer take new bookings. Nothing is deleted, and you can restore it later."
        confirmLabel="Archive property"
        cancelLabel="Keep active"
        destructive
        confirmDisabled={activeStays.length > 0}
        onConfirm={() => archiving && archive(archiving)}
      >
        {archiving && (
          <div className="space-y-3 rounded-lg bg-muted p-3 text-body" role={activeStays.length > 0 ? "alert" : undefined}>
            {activeStays.length > 0 ? (
              <>
                <p className="!text-brown-ink">
                  <strong className="tabular">{inHouse}</strong> in the house and <strong className="tabular">{upcoming}</strong> upcoming {activeStays.length === 1 ? "reservation is" : "reservations are"} still active. Check guests out, move the stays or cancel them before archiving.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    openIntent({ type: "reservations", propertyId: archiving.id });
                    setArchiving(null);
                    router.push("/reservations");
                  }}
                >
                  View reservations
                </Button>
              </>
            ) : (
              <p>No active reservations. This property can be archived safely.</p>
            )}
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
