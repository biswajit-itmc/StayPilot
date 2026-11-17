"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DashboardMock } from "./mockups";
import { easeOut } from "./reveal";

function Line({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className="block"
        data-motion initial={{ y: "105%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, delay, ease: easeOut }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-36">
      {/* quiet background drift */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 size-[640px] rounded-full bg-mint/30 blur-3xl"
        animate={reduce ? undefined : { x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto grid max-w-[1280px] gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col justify-center lg:col-span-5 lg:pb-24">
          <motion.p
            className="text-eyebrow"
            data-motion initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            Property management for modern hospitality
          </motion.p>
          <h1 className="text-hero mt-5">
            <Line delay={0.1}>Hospitality,</Line>
            <Line delay={0.22}>
              <span className="relative inline-block">
                Simplified.
                <motion.span
                  aria-hidden
                  className="absolute inset-x-0 bottom-[0.06em] -z-10 h-[0.28em] origin-left rounded-sm bg-lime"
                  data-motion initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.95, ease: easeOut }}
                />
              </span>
            </Line>
          </h1>
          <motion.p
            className="text-lead mt-7 max-w-md text-muted-foreground"
            data-motion initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: easeOut }}
          >
            Manage properties, reservations, guest access and daily operations from one intelligent platform built for modern hospitality.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-col gap-3 sm:flex-row"
            data-motion initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65, ease: easeOut }}
          >
            <a href="#product" className={buttonVariants({ variant: "accent", size: "lg" })}>
              Explore StayPilot
              <ArrowRight />
            </a>
            <a href="#how-it-works" className={buttonVariants({ variant: "outline", size: "lg" })}>
              See How It Works
            </a>
          </motion.div>
          <motion.p
            className="mt-8 text-meta"
            data-motion initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1 }}
          >
            One platform. Every property. Seamless stays.
          </motion.p>
        </div>

        {/* Visual composition */}
        <div className="relative lg:col-span-7">
          <motion.div
            className="relative ml-auto aspect-[4/5] w-full max-w-[640px] overflow-hidden rounded-2xl sm:aspect-[5/5] lg:aspect-[4/5] lg:w-[78%]"
            data-motion initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: easeOut }}
          >
            <Image
              src="/images/landing/hero-resort.jpg"
              alt="White boutique hotel facade lit at dusk beside a calm swimming pool"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </motion.div>

          <motion.div
            className="relative z-10 -mt-24 w-[94%] sm:-mt-32 sm:w-[78%] lg:absolute lg:bottom-10 lg:left-0 lg:mt-0 lg:w-[66%]"
            data-motion initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: easeOut }}
          >
            <DashboardMock />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
