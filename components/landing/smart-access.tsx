"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { accessFlow } from "@/data/landing";
import { easeOut, Reveal } from "./reveal";

export function SmartAccess() {
  return (
    <section id="smart-access" className="mt-20 bg-charcoal py-24 text-background sm:mt-32 sm:py-32">
      <div className="mx-auto grid max-w-[1280px] gap-14 px-5 sm:px-8 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="text-eyebrow !text-sage">Smart access</p>
          <h2 className="text-headline mt-4">From reservation to room access, without the manual work.</h2>
          <p className="text-lead mt-5 text-sage">
            StayPilot turns a confirmed booking into the tasks and messages that get a guest through the door, and keeps your team informed along the way.
          </p>

          <div className="mt-10 flex gap-3 rounded-xl border border-white/10 p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-lime" />
            <p className="text-body text-sage">
              Smart-lock operations depend on compatible devices and supported integrations. Availability varies by lock manufacturer, and not every brand is supported today.
            </p>
          </div>
        </Reveal>

        <div className="lg:col-span-6 lg:col-start-7">
          <p className="mb-6 text-meta !text-sage/80">Illustrative flow</p>
          <ol className="relative">
            <span aria-hidden className="absolute bottom-4 left-[19px] top-4 w-px bg-white/10" />
            <motion.span
              aria-hidden
              className="absolute left-[19px] top-4 w-px origin-top bg-lime"
              style={{ height: "calc(100% - 2rem)" }}
              data-motion initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 1.8, ease: easeOut }}
            />
            {accessFlow.map((s, i) => (
              <motion.li
                key={s.title}
                className="relative flex gap-5 pb-10 last:pb-0"
                data-motion initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.18, ease: easeOut }}
              >
                <span className="tabular relative z-10 grid size-10 shrink-0 place-items-center rounded-full border border-lime bg-charcoal text-label !text-lime">
                  {i + 1}
                </span>
                <div className="pt-1.5">
                  <h3 className="text-section">{s.title}</h3>
                  <p className="mt-1 max-w-md text-body text-sage">{s.detail}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
