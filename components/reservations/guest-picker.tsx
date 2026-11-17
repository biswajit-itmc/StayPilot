"use client";

import { useId, useState } from "react";
import { Search, UserRound, X } from "lucide-react";
import type { Guest } from "@/types";
import { GuestStatusBadge } from "@/components/shared/status-badges";
import { controlClass } from "@/components/shared/field";
import { useAppData } from "@/hooks/use-app-data";

/** Search-as-you-type guest selector. Shows the chosen guest as a chip with a way to change it. */
export function GuestPicker({ value, onChange, invalid, id }: { value: string; onChange: (id: string) => void; invalid?: boolean; id: string }) {
  const { model: m } = useAppData();
  const [q, setQ] = useState("");
  const listId = useId();
  const chosen = value ? m.by.guest.get(value) : undefined;
  const term = q.trim().toLowerCase();
  const matches: Guest[] = term ? m.guests.filter((g) => g.name.toLowerCase().includes(term) || g.email.toLowerCase().includes(term)).slice(0, 6) : [];

  if (chosen) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-input bg-surface px-3 py-2">
        <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-label">{chosen.name}</span>
          <span className="block truncate text-meta">{chosen.email}</span>
        </span>
        <GuestStatusBadge status={chosen.status} />
        <button type="button" onClick={() => onChange("")} aria-label="Choose a different guest" className="grid size-6 place-items-center rounded text-muted-foreground hover:text-charcoal">
          <X className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        id={id}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or email"
        autoComplete="off"
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        className={`${controlClass} pl-9`}
      />
      <ul id={listId} role="listbox" aria-label="Matching guests" className={matches.length ? "absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-pop" : "hidden"}>
        {matches.map((g) => (
          <li key={g.id} role="option" aria-selected={false}>
            <button
              type="button"
              onClick={() => {
                onChange(g.id);
                setQ("");
              }}
              className="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left hover:bg-accent"
            >
              <span className="min-w-0">
                <span className="block truncate text-label">{g.name}</span>
                <span className="block truncate text-meta">{g.email}</span>
              </span>
              <span className="text-meta">{g.country}</span>
            </button>
          </li>
        ))}
      </ul>
      {term && matches.length === 0 && <p className="mt-1 text-meta">No guest found. Choose “New guest” to add one.</p>}
    </div>
  );
}
