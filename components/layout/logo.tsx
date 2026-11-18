import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";

/** Official StayPilot artwork (public/brand). The emblem and wordmark are cut from the supplied logo, never redrawn. */
const EMBLEM = { src: "/brand/staypilot-emblem.png", width: 480, height: 484 };
const WORDMARK = { src: "/brand/staypilot-wordmark.png", width: 960, height: 155 };

/** Emblem only: collapsed sidebar, loading screens. */
export function LogoMark({ className }: { className?: string }) {
  return <Image {...EMBLEM} alt="" aria-hidden unoptimized priority className={cn("h-9 w-auto shrink-0", className)} />;
}

/** Emblem + wordmark, horizontally aligned. */
export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} aria-label={brand.name} className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <Image {...WORDMARK} alt="" aria-hidden unoptimized priority className="h-5 w-auto" />
    </Link>
  );
}
