import Image from "next/image";
import { KeyRound, MessageSquare, ShieldCheck } from "lucide-react";
import { CalendarMock, GuestProfileMock, LockTableMock, MiniChip, PropertyListMock } from "./mockups";
import { Reveal, SectionIntro } from "./reveal";

function Label({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-eyebrow">
      <span className="tabular !text-charcoal">{n}</span>
      <span className="h-px w-8 bg-border-strong" />
      {children}
    </p>
  );
}

export function ProductShowcase() {
  return (
    <section id="product" className="mx-auto max-w-[1280px] px-5 pt-24 sm:px-8 sm:pt-32">
      <SectionIntro
        eyebrow="The platform"
        title="Every part of a stay, in one place."
        lead="From the building to the guest to the door, StayPilot connects the workflows that usually live in separate tools."
      />

      {/* 1 — Properties: image-led, panel overlaps */}
      <div className="mt-20 grid items-center gap-10 lg:mt-28 lg:grid-cols-12">
        <Reveal className="relative lg:col-span-7">
          <div className="relative aspect-[16/11] overflow-hidden rounded-2xl">
            <Image src="/images/landing/villa-exterior.jpg" alt="Modern white villa with a rooftop terrace and private pool" fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
          </div>
          <PropertyListMock className="relative z-10 -mt-14 ml-auto mr-4 max-w-md sm:absolute sm:-bottom-10 sm:-right-6 sm:mt-0 sm:mr-0 lg:-right-16" />
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-4 lg:col-start-9 lg:pt-0">
          <Label n="01">Property management</Label>
          <h3 className="text-headline mt-4 !text-[clamp(1.75rem,3vw,2.5rem)]">One portfolio, however it is built.</h3>
          <p className="text-lead mt-4 text-muted-foreground">
            Organise hotels, villas and apartments with their rooms and units. See status, size and pending work for each property without opening a spreadsheet.
          </p>
        </Reveal>
      </div>

      {/* 2 — Reservations: wide calendar band */}
      <div className="mt-20 sm:mt-32">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-5">
            <Label n="02">Reservation management</Label>
            <h3 className="text-headline mt-4 !text-[clamp(1.75rem,3vw,2.5rem)]">A calendar that shows the whole picture.</h3>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-5 lg:col-start-8">
            <p className="text-lead text-muted-foreground">
              Stays, holds and gaps across every unit on a single timeline, so double bookings and idle nights are easy to spot.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="relative mt-10 rounded-2xl bg-sage/40 p-4 sm:p-8 lg:p-12">
          <CalendarMock />
        </Reveal>
      </div>

      {/* 3 — Guests: profile card beside portrait crop */}
      <div className="mt-36 grid items-center gap-10 sm:mt-44 lg:grid-cols-12">
        <Reveal className="order-2 lg:order-1 lg:col-span-5 lg:col-start-1">
          <GuestProfileMock />
        </Reveal>
        <Reveal delay={0.1} className="order-1 lg:order-2 lg:col-span-6 lg:col-start-7">
          <Label n="03">Guest management</Label>
          <h3 className="text-headline mt-4 !text-[clamp(1.75rem,3vw,2.5rem)]">Know the guest before they arrive.</h3>
          <p className="text-lead mt-4 max-w-lg text-muted-foreground">
            Stay details, preferences and check-in progress live on one profile, so every team member greets guests with the same information.
          </p>
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl">
            <Image src="/images/landing/suite-classic.jpg" alt="Classic hotel suite with a tufted sofa and warm bedside lighting" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            <MiniChip icon={MessageSquare} title="Instructions sent" detail="Elena · Portuguese template" className="absolute bottom-4 left-4 w-60" />
          </div>
        </Reveal>
      </div>

      {/* 4 — Smart locks: dark panel */}
      <Reveal className="mt-36 overflow-hidden rounded-2xl bg-charcoal text-background sm:mt-44">
        <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-12 lg:p-14">
          <div className="lg:col-span-5">
            <p className="flex items-center gap-3 text-eyebrow !text-sage">
              <span className="tabular !text-lime">04</span>
              <span className="h-px w-8 bg-background/20" />
              Smart-lock operations
            </p>
            <h3 className="text-headline mt-4 !text-[clamp(1.75rem,3vw,2.5rem)]">See every door at a glance.</h3>
            <p className="text-lead mt-4 text-sage">
              Battery, connectivity and status for each lock, with the units they protect. Problems surface before a guest finds them.
            </p>
            <ul className="mt-8 space-y-3 text-body">
              {[
                [ShieldCheck, "Spot low batteries and offline devices"],
                [KeyRound, "Tie access windows to reservations"],
              ].map(([Icon, t]) => {
                const I = Icon as typeof ShieldCheck;
                return (
                  <li key={t as string} className="flex items-center gap-3">
                    <I className="size-4 text-lime" />
                    {t as string}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="lg:col-span-7">
            <LockTableMock className="!border-white/10" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
