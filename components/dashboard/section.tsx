import { cn } from "@/lib/utils";

/** Heading row shared by dashboard sections: title + one-line context on the left, controls on the right. */
export function SectionHeader({
  title,
  meta,
  action,
  className,
}: {
  title: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-section">{title}</h2>
        {meta && <p className="mt-0.5 text-body text-muted-foreground">{meta}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

type Tone = "ok" | "neutral" | "warn" | "bad";
const dot: Record<Tone, string> = {
  ok: "bg-olive-deep",
  neutral: "bg-border-strong",
  warn: "bg-brown",
  bad: "bg-brown-ink ring-2 ring-brown/25",
};

/** Small coloured dot + text. Colour is never the only signal: the label always carries the state. */
export function StatusText({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-body", className)}>
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dot[tone])} />
      {children}
    </span>
  );
}
