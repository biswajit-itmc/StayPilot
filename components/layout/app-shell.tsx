"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppDataProvider } from "@/hooks/use-app-data";
import { NotificationsProvider } from "@/hooks/use-notifications";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
import { hasDemoSession, subscribeToDemoSession } from "@/lib/demo-auth";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./global-search";
import { Logo, LogoMark } from "./logo";
import { ShellProvider } from "./shell-context";
import { SidebarNav } from "./sidebar-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [collapsed, toggle] = useSidebarCollapsed();
  const [searchOpen, setSearchOpen] = useState(false);
  const authenticated = useSyncExternalStore(
    subscribeToDemoSession,
    hasDemoSession,
    () => false,
  );

  useEffect(() => {
    if (!hasDemoSession()) {
      router.replace("/login");
    }
  }, [router]);

  if (!authenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <LogoMark className="h-12" />
          <p role="status" className="text-body text-muted-foreground">Checking demo session…</p>
        </div>
      </main>
    );
  }

  return (
    <NotificationsProvider>
      <AppDataProvider>
      <ShellProvider value={{ openSearch: () => setSearchOpen(true), openNav: () => setDrawer(true) }}>
      <a
        href="#main"
        className="sr-only z-[60] rounded-lg bg-charcoal px-4 py-2 text-label text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <div
        className="min-h-screen lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)] lg:transition-[grid-template-columns] lg:duration-200"
        style={{ "--sidebar-w": collapsed ? "72px" : "256px" } as React.CSSProperties}
      >
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-sidebar lg:flex" aria-label="Sidebar">
          <div className={cn("flex shrink-0 items-center", collapsed ? "flex-col gap-1 py-3" : "h-16 justify-between pl-5 pr-3")}>
            {collapsed ? (
              <Link href="/dashboard" aria-label="StayPilot dashboard">
                <LogoMark />
              </Link>
            ) : (
              <Logo href="/dashboard" />
            )}
            <Tooltip>
              <TooltipTrigger render={<Button variant="ghost" size="icon" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} />}>
                {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
              </TooltipTrigger>
              <TooltipContent side="right">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
            </Tooltip>
          </div>
          <div className="sidebar-scroll flex-1 overflow-y-auto px-3 pb-4 pt-2">
            <SidebarNav collapsed={collapsed} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <main id="main" tabIndex={-1} className="flex-1 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-6">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </main>
        </div>

        <Sheet open={drawer} onOpenChange={setDrawer}>
          <SheetContent side="left" className="w-72 bg-sidebar p-0 data-[side=left]:max-w-[85vw]">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">Main navigation for StayPilot</SheetDescription>
            <div className="flex h-16 items-center px-5">
              <Logo href="/dashboard" />
            </div>
            <div className="overflow-y-auto px-3 pb-6">
              <SidebarNav onNavigate={() => setDrawer(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
      </ShellProvider>
      </AppDataProvider>
    </NotificationsProvider>
  );
}
