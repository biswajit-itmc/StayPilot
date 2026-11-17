import { Logo } from "@/components/layout/logo";
import { brand } from "@/lib/brand";
import { footerColumns } from "@/data/landing";

export function LandingFooter() {
  return (
    <footer className="mt-24 border-t border-border sm:mt-32">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo />
          <p className="mt-4 max-w-xs text-body text-muted-foreground">
            {brand.tagline} A property management platform for hotels, vacation rentals and hospitality teams.
          </p>
          <p className="mt-6 text-label">Contact</p>
          <p className="text-body text-muted-foreground">hello@staypilot.example</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8 lg:pl-12">
          {footerColumns.map((c) => (
            <div key={c.title}>
              <p className="text-eyebrow">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-body text-charcoal/80 transition-colors hover:text-charcoal hover:underline">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-meta">© 2026 {brand.name}. Prototype with fictional data.</p>
          <div className="flex gap-6 text-meta">
            <a href="#" className="hover:text-charcoal hover:underline">Privacy</a>
            <a href="#" className="hover:text-charcoal hover:underline">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
