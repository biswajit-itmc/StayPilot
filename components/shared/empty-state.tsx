import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-14 text-center", className)}>
      <span className="grid size-10 place-items-center rounded-xl bg-accent text-charcoal">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <p className="text-card-title">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-body text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
