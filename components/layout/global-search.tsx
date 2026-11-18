"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, Building2, CalendarDays, CornerDownLeft, Search, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { allNavItems } from "@/lib/navigation";
import { roomLabel } from "@/data/rooms";
import { useAppData, type Intent } from "@/hooks/use-app-data";
import { cn } from "@/lib/utils";

type Result = { key: string; group: string; title: string; detail?: string; href: string; icon: typeof Search; intent?: Intent };

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const { model: m, openIntent } = useAppData();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) {
      return allNavItems.slice(0, 6).map((n) => ({ key: n.href, group: "Go to", title: n.label, detail: n.description, href: n.href, icon: n.icon }));
    }
    const out: Result[] = [];
    allNavItems
      .filter((n) => n.label.toLowerCase().includes(term))
      .slice(0, 3)
      .forEach((n) => out.push({ key: n.href, group: "Pages", title: n.label, detail: n.description, href: n.href, icon: n.icon }));
    m.properties
      .filter((p) => p.name.toLowerCase().includes(term) || p.city.toLowerCase().includes(term))
      .forEach((p) => out.push({ key: p.id, group: "Properties", title: p.name, detail: `${p.type} · ${p.city}`, href: "/properties", icon: Building2, intent: { type: "property", id: p.id } }));
    m.rooms
      .filter((r) => roomLabel(r).toLowerCase().includes(term) || r.id.toLowerCase().includes(term))
      .slice(0, 4)
      .forEach((r) => out.push({ key: r.id, group: "Units", title: `${roomLabel(r)} · ${m.by.property.get(r.propertyId)?.name}`, detail: r.type, href: "/rooms", icon: BedDouble, intent: { type: "room", id: r.id } }));
    m.guests
      .filter((g) => g.name.toLowerCase().includes(term) || g.email.includes(term))
      .slice(0, 5)
      .forEach((g) => out.push({ key: g.id, group: "Guests", title: g.name, detail: `${g.country} · ${g.language}`, href: "/guests", icon: User, intent: { type: "guest", id: g.id } }));
    m.reservations
      .filter((r) => r.id.toLowerCase().includes(term) || m.by.guest.get(r.guestId)!.name.toLowerCase().includes(term))
      .slice(0, 5)
      .forEach((r) =>
        out.push({
          key: r.id,
          group: "Reservations",
          title: `${r.id} · ${m.by.guest.get(r.guestId)!.name}`,
          detail: `${m.by.property.get(r.propertyId)?.name} · ${roomLabel(m.by.room.get(r.roomId)!)} · ${r.checkIn}`,
          href: "/reservations",
          icon: CalendarDays,
          intent: { type: "reservation", id: r.id },
        })
      );
    return out.slice(0, 12);
  }, [q, m]);

  const go = (r: Result) => {
    if (r.intent) openIntent(r.intent);
    onOpenChange(false);
    setQ("");
    router.push(r.href);
  };

  let lastGroup = "";
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setQ("");
      }}
    >
      <DialogContent showCloseButton={false} className="top-[18%] max-w-xl -translate-y-0 gap-0 p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">Search guests, reservations, properties and pages</DialogDescription>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter" && results[active]) go(results[active]);
            }}
            placeholder="Search guests, reservations, properties…"
            aria-label="Search"
            className="h-11 w-full bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-[360px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-body text-muted-foreground">No results for “{q}”.</p>
          ) : (
            results.map((r, i) => {
              const header = r.group !== lastGroup ? r.group : null;
              lastGroup = r.group;
              return (
                <div key={r.key + i}>
                  {header && <p className="px-3 pb-1 pt-3 text-eyebrow first:pt-1">{header}</p>}
                  <button
                    type="button"
                    onClick={() => go(r)}
                    onMouseEnter={() => setActive(i)}
                    className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left", i === active && "bg-accent")}
                  >
                    <r.icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-label">{r.title}</span>
                      {r.detail && <span className="block truncate text-meta">{r.detail}</span>}
                    </span>
                    {i === active && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
