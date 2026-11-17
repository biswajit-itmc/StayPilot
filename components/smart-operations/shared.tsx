"use client";

import { Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function ModuleFrame({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} actions={actions} />
      <p className="flex items-start gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-body text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span><strong className="font-semibold text-charcoal">Prototype simulation.</strong> All devices, integrations, access workflows and delivery outcomes shown here are illustrative. No physical lock, credential, email, SMS or WhatsApp action is performed.</span>
      </p>
      {children}
    </div>
  );
}

export function MetricStrip({ items }: { items: { label: string; value: string | number; detail?: string }[] }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-card lg:grid-cols-4">
      {items.map((item, index) => (
        <div key={item.label} className={cn("min-w-0 px-4 py-4 sm:px-5", index > 0 && "border-l border-border")}>
          <p className="text-eyebrow">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular tracking-tight">{item.value}</p>
          {item.detail && <p className="mt-1 text-meta">{item.detail}</p>}
        </div>
      ))}
    </div>
  );
}

const tone: Record<string, string> = {
  Online: "bg-mint/50 text-charcoal",
  Connected: "bg-mint/50 text-charcoal",
  Active: "bg-mint/50 text-charcoal",
  Completed: "bg-mint/50 text-charcoal",
  "In progress": "bg-sage/45 text-charcoal",
  Scheduled: "bg-muted text-muted-foreground",
  Pending: "bg-muted text-muted-foreground",
  "Requires attention": "bg-brown/12 text-brown-ink",
  Offline: "bg-brown/12 text-brown-ink",
  Failed: "bg-brown/12 text-brown-ink",
  Revoked: "bg-muted text-muted-foreground",
  Expired: "bg-muted text-muted-foreground",
  Disabled: "bg-muted text-muted-foreground",
  Urgent: "bg-brown/12 text-brown-ink",
  High: "bg-sage/45 text-charcoal",
  Normal: "bg-muted text-muted-foreground",
  "Simulated · delivered": "bg-mint/50 text-charcoal",
  "Simulated · completed": "bg-mint/50 text-charcoal",
  "Simulated · flagged": "bg-sage/45 text-charcoal",
  "Simulated · scheduled": "bg-muted text-muted-foreground",
  "Simulated · failed": "bg-brown/12 text-brown-ink",
};

export function StatePill({ value, className }: { value: string; className?: string }) {
  return <span className={cn("inline-flex min-h-6 items-center rounded-md px-2 text-label", tone[value] ?? "bg-muted text-muted-foreground", className)}>{value}</span>;
}

export function Panel({ title, detail, action, children, className }: { title: string; detail?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-border bg-surface shadow-card", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-card-title">{title}</h2>
          {detail && <p className="mt-0.5 text-meta">{detail}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DetailDrawer({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: React.ReactNode }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border p-5 pr-14">
          <SheetTitle className="text-section">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="space-y-5 p-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export function DetailGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-5 gap-y-4 rounded-xl border border-border bg-surface p-4">
      {items.map((item) => <div key={item.label} className="min-w-0"><dt className="text-eyebrow">{item.label}</dt><dd className="mt-1 break-words text-body text-charcoal">{item.value}</dd></div>)}
    </dl>
  );
}

export function Timeline({ items }: { items: { title: string; detail: string; time: string }[] }) {
  return (
    <ol className="space-y-0">
      {items.map((item, index) => (
        <li key={`${item.title}-${item.time}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
          {index < items.length - 1 && <span aria-hidden className="absolute left-[5px] top-3 h-full w-px bg-border" />}
          <span aria-hidden className="relative mt-1 size-3 shrink-0 rounded-full border-2 border-olive-deep bg-surface" />
          <div className="min-w-0 flex-1">
            <p className="text-label">{item.title}</p>
            <p className="mt-0.5 text-body text-muted-foreground">{item.detail}</p>
            <p className="mt-1 text-meta tabular">{item.time}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function dateLabel(iso: string) {
  return format(parseISO(iso.slice(0, 10)), "d MMM yyyy");
}
