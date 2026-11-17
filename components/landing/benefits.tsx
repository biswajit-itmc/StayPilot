import Image from "next/image";
import { benefits } from "@/data/landing";
import { Reveal, SectionIntro } from "./reveal";

const audiences = ["Hotels", "Vacation rentals", "Property managers", "Hospitality groups"];

export function Benefits() {
  return (
    <section id="solutions" className="mx-auto max-w-[1280px] px-5 pt-24 sm:px-8 sm:pt-36">
      <div className="grid gap-14 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl lg:sticky lg:top-28">
            <Image src="/images/landing/room-modern.jpg" alt="Bright, calm hotel bedroom with a city view" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </div>
        </Reveal>

        <div className="lg:col-span-6 lg:col-start-7">
          <SectionIntro eyebrow="Solutions" title="Less juggling. More hospitality." lead="Built for teams that run more than one thing at once." />
          <Reveal delay={0.05} className="mt-6 flex flex-wrap gap-2">
            {audiences.map((a) => (
              <span key={a} className="rounded-lg border border-border-strong px-3 py-1.5 text-label">
                {a}
              </span>
            ))}
          </Reveal>
          <ul className="mt-12 divide-y divide-border border-y border-border">
            {benefits.map((b, i) => (
              <li key={b.title}>
                <Reveal delay={i * 0.04} className="group grid grid-cols-[2.5rem_1fr] gap-2 py-6">
                  <span className="tabular text-meta pt-1">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-section transition-transform duration-300 group-hover:translate-x-1">{b.title}</h3>
                    <p className="mt-1 text-body text-muted-foreground">{b.detail}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
