"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: LucideIcon }[];
  label: string;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border-strong bg-surface p-0.5" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-label transition-colors",
            value === o.value ? "bg-charcoal text-background" : "text-muted-foreground hover:text-charcoal"
          )}
        >
          {o.icon && <o.icon className="size-3.5" aria-hidden />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
