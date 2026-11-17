"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export const easeOut = [0.22, 1, 0.36, 1] as const;

type RevealProps = HTMLMotionProps<"div"> & { delay?: number; y?: number };

/** Scroll-triggered fade/rise. Plays once. Reduced motion is handled by MotionConfig. */
export function Reveal({ delay = 0, y = 20, className, children, ...props }: RevealProps) {
  return (
    <motion.div
      data-motion initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: easeOut }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Eyebrow + headline + optional lead, used at the top of most sections. */
export function SectionIntro({
  eyebrow,
  title,
  lead,
  className,
  tone = "light",
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <Reveal className={cn("max-w-2xl", className)}>
      <p className={cn("text-eyebrow", tone === "dark" && "!text-sage")}>{eyebrow}</p>
      <h2 className="text-headline mt-4">{title}</h2>
      {lead && (
        <p className={cn("text-lead mt-5", tone === "dark" ? "text-sage" : "text-muted-foreground")}>{lead}</p>
      )}
    </Reveal>
  );
}
