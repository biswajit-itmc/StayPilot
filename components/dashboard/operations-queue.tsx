"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { QueueItem, QueueSeverity } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./section";

const marker: Record<QueueSeverity, string> = { high: "bg-brown-ink", medium: "bg-olive-deep", low: "bg-sage" };
const sevLabel: Record<QueueSeverity, string> = { high: "Urgent", medium: "Today", low: "Low" };
const LIMIT = 5;

export function OperationsQueue({ items, onAction }: { items: QueueItem[]; onAction: (item: QueueItem) => void }) {
  const [all, setAll] = useState(false);
  const visible = all ? items : items.slice(0, LIMIT);
  const urgent = items.filter((i) => i.severity === "high").length;

  return (
    <section>
      <SectionHeader title="Operations queue" meta={items.length ? `${items.length} open · ${urgent} urgent` : "Nothing needs attention"} />
      {items.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-border-strong px-4 py-8">
          <CheckCircle2 className="size-5 text-olive-deep" aria-hidden />
          <p className="text-body text-muted-foreground">All clear. Exceptions will appear here as they happen.</p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {visible.map((i) => (
            <li key={i.id} className="relative flex items-start gap-3 py-3.5 pl-4">
              <span aria-hidden className={cn("absolute bottom-3.5 left-0 top-3.5 w-1 rounded-full", marker[i.severity])} />
              <div className="min-w-0 flex-1">
                <p className="text-label">
                  <span className="sr-only">{sevLabel[i.severity]}: </span>
                  {i.title}
                </p>
                <p className="mt-0.5 text-body text-muted-foreground">{i.detail}</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => onAction(i)}>
                {i.action}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {items.length > LIMIT && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-3 inline-flex min-h-6 items-center text-label text-muted-foreground hover:text-charcoal">
          {all ? "Show fewer" : `Show ${items.length - LIMIT} more`}
        </button>
      )}
    </section>
  );
}
