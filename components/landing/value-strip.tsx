import { Building2, CalendarDays, KeyRound, Workflow } from "lucide-react";
import { Reveal } from "./reveal";

const values = [
  { icon: Building2, title: "Multi-property control", detail: "Hotels, villas and apartments in one workspace." },
  { icon: CalendarDays, title: "Centralized reservations", detail: "Every stay on a single calendar." },
  { icon: KeyRound, title: "Smart access management", detail: "Access windows planned around each arrival." },
  { icon: Workflow, title: "Automated guest workflows", detail: "Messages and tasks that trigger on their own." },
];

export function ValueStrip() {
  return (
    <section aria-label="Key benefits" className="mt-16 border-y border-border bg-surface/60 sm:mt-24">
      <Reveal className="mx-auto grid max-w-[1280px] divide-border px-5 sm:px-8 md:grid-cols-4 md:divide-x">
        {values.map((v) => (
          <div key={v.title} className="flex items-start gap-3.5 py-6 md:px-6 md:first:pl-0 md:last:pr-0">
            <v.icon className="mt-0.5 size-5 shrink-0 text-olive" strokeWidth={1.75} />
            <div>
              <p className="text-card-title">{v.title}</p>
              <p className="mt-0.5 text-body text-muted-foreground">{v.detail}</p>
            </div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
