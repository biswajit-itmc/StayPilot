"use client";

import { Search, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Property } from "@/types";
import { EARLIEST_RANGE_START, MAX_RANGE_DAYS, type DateRange, type PropertyFilter } from "@/lib/dashboard";
import { TODAY_ISO } from "@/lib/dates";

export type RangePreset = "7" | "14" | "30" | "custom";

export const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];


type Props = {
  properties: Property[];
  property: PropertyFilter;
  onProperty: (v: PropertyFilter) => void;
  preset: RangePreset;
  onPreset: (v: RangePreset) => void;
  custom: DateRange;
  onCustom: (v: DateRange) => void;
  rangeError: string | null;
  query: string;
  onQuery: (v: string) => void;
};

const dateInput =
  "h-9 w-full rounded-lg border border-input bg-surface px-2.5 text-body outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

export function DashboardFilters({ properties, property, onProperty, preset, onPreset, custom, onCustom, rangeError, query, onQuery }: Props) {
  const propertyItems = [{ value: "all", label: "All properties" }, ...properties.map((p) => ({ value: p.id, label: p.name }))];
  return (
    <div className="space-y-3" role="search" aria-label="Dashboard filters">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Select items={propertyItems} value={property} onValueChange={(v) => v && onProperty(v as PropertyFilter)}>
          <SelectTrigger aria-label={`Property: ${propertyItems.find((p) => p.value === property)?.label}`} className="w-full min-w-0 sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {propertyItems.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select items={RANGES} value={preset} onValueChange={(v) => v && onPreset(v as RangePreset)}>
          <SelectTrigger aria-label={`Activity date range: ${RANGES.find((r) => r.value === preset)?.label}`} className="w-[calc(50%-0.25rem)] min-w-0 sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative min-w-0 flex-1 sm:min-w-56 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Filter by guest or room"
            aria-label="Filter arrivals and departures by guest, room or booking"
            className="h-9 w-full rounded-lg border border-input bg-surface pl-9 pr-8 text-body outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQuery("")}
              aria-label="Clear filter"
              className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-charcoal"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {preset === "custom" && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="block w-[calc(50%-0.375rem)] sm:w-40">
            <span className="mb-1 block text-label">From</span>
            <input
              type="date"
              className={dateInput}
              value={custom.from}
              min={EARLIEST_RANGE_START}
              max={TODAY_ISO}
              onChange={(e) => onCustom({ ...custom, from: e.target.value })}
              aria-invalid={rangeError ? true : undefined}
              aria-describedby="range-help"
            />
          </label>
          <label className="block w-[calc(50%-0.375rem)] sm:w-40">
            <span className="mb-1 block text-label">To</span>
            <input
              type="date"
              className={dateInput}
              value={custom.to}
              min={EARLIEST_RANGE_START}
              max={TODAY_ISO}
              onChange={(e) => onCustom({ ...custom, to: e.target.value })}
              aria-invalid={rangeError ? true : undefined}
              aria-describedby="range-help"
            />
          </label>
          <p id="range-help" role={rangeError ? "alert" : undefined} className={rangeError ? "pb-2 text-body text-brown-ink" : "pb-2 text-meta"}>
            {rangeError ?? `Up to ${MAX_RANGE_DAYS} days. Compared with the preceding period of the same length.`}
          </p>
        </div>
      )}
    </div>
  );
}
