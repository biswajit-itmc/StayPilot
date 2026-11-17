"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string };

/** A single select built on the design-system Select. The accessible name always includes the visible value. */
export function SimpleSelect({
  id,
  value,
  onChange,
  options,
  label,
  className,
  invalid,
  disabled,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  label: string;
  className?: string;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <Select items={options} value={value || null} onValueChange={(v) => v !== null && onChange(v as string)} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={`${label}: ${current?.label ?? placeholder ?? "none"}`}
        aria-invalid={invalid || undefined}
        className={cn("w-full min-w-0", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
