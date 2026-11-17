"use client";

import { motion } from "framer-motion";
import { howItWorks } from "@/data/landing";
import { easeOut, SectionIntro } from "./reveal";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mt-24 bg-surface py-24 sm:mt-36 sm:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <SectionIntro eyebrow="How it works" title="Four steps from set-up to day-to-day." />

        <div className="relative mt-16">
          <div aria-hidden className="absolute left-0 right-0 top-[27px] hidden h-px bg-border lg:block" />
          <motion.div
            aria-hidden
            className="absolute left-0 right-0 top-[27px] hidden h-px origin-left bg-olive lg:block"
            data-motion initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.6, ease: easeOut }}
          />
          <ol className="grid gap-10 lg:grid-cols-4 lg:gap-8">
            {howItWorks.map((s, i) => (
              <motion.li
                key={s.title}
                data-motion initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: easeOut }}
                className="relative"
              >
                <span className="tabular relative grid size-14 place-items-center rounded-full border border-border-strong bg-surface text-section">
                  {i + 1}
                </span>
                <h3 className="text-section mt-6">{s.title}</h3>
                <p className="mt-2 max-w-xs text-body text-muted-foreground">{s.detail}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
