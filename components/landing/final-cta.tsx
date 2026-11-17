import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <section className="mx-auto mt-24 max-w-[1280px] px-5 sm:mt-36 sm:px-8">
      <Reveal className="relative isolate overflow-hidden rounded-2xl bg-charcoal">
        <Image src="/images/landing/dusk-pool.jpg" alt="" aria-hidden fill sizes="(min-width: 1280px) 1216px, 100vw" className="-z-10 object-cover opacity-55" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-charcoal/55" />
        <div className="px-6 py-20 text-background sm:px-14 sm:py-28 lg:py-32">
          <h2 className="text-headline max-w-2xl !text-[clamp(2.25rem,5vw,4rem)]">Make every stay easier to manage.</h2>
          <p className="text-lead mt-5 max-w-lg text-background/80">Bring properties, reservations and guest access into one calm, connected workspace.</p>
          <Link href="/login" className={buttonVariants({ variant: "accent", size: "lg", className: "mt-9" })}>
            Get Started
            <ArrowRight />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
