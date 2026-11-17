import { MotionProvider } from "@/components/landing/motion-provider";
import { Benefits } from "@/components/landing/benefits";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNav } from "@/components/landing/landing-nav";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { SmartAccess } from "@/components/landing/smart-access";
import { ValueStrip } from "@/components/landing/value-strip";

export default function HomePage() {
  return (
    <MotionProvider>
      <a
        href="#main"
        className="sr-only z-[60] rounded-lg bg-charcoal px-4 py-2 text-label text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <LandingNav />
      <main id="main" tabIndex={-1} className="overflow-x-clip outline-none">
        <Hero />
        <ValueStrip />
        <ProductShowcase />
        <SmartAccess />
        <Features />
        <HowItWorks />
        <Benefits />
        <FinalCta />
      </main>
      <LandingFooter />
    </MotionProvider>
  );
}
