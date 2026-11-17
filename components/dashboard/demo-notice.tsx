import { Info } from "lucide-react";
import { DEMO_REFERENCE_LABEL } from "@/lib/dates";

/** Makes it explicit that every figure is simulated and anchored to a fixed reference moment, not live time. */
export function DemoNotice() {
  return (
    <p className="flex items-start gap-2 text-meta text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        <strong className="font-semibold text-charcoal">Demo data.</strong> Figures are simulated and fixed to a reference time of{" "}
        <time dateTime="2026-11-17T09:42" className="tabular text-charcoal">
          {DEMO_REFERENCE_LABEL}
        </time>
        . Nothing here updates in real time, and “ago” times are measured from that moment.
      </span>
    </p>
  );
}
