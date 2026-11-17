import type { LucideIcon } from "lucide-react";
import { PageHeader } from "./page-header";

/** Temporary body for modules that are built in later phases. */
export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="space-y-8">
      <PageHeader title={title} description={description} />
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border-strong px-6 py-10">
        <span className="grid size-9 place-items-center rounded-lg bg-accent text-charcoal">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-card-title">Coming in a later phase</p>
          <p className="text-body text-muted-foreground">This module is routed and themed; its screens have not been built yet.</p>
        </div>
      </div>
    </div>
  );
}
