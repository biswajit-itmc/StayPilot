"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppDataProvider } from "@/hooks/use-app-data";
import { NotificationsProvider } from "@/hooks/use-notifications";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
import { hasDemoSession, subscribeToDemoSession } from "@/lib/demo-auth";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "./breadcrumbs";
import { GlobalSearch, GlobalSearchButton } from "./global-search";
import { Logo, LogoMark } from "./logo";
import { NotificationsPopover } from "./notifications-popover";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

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
        <p role="status" className="text-body text-muted-foreground">Checking demo session…</p>
      </main>
    );
  }

  return (
    <NotificationsProvider>
      <AppDataProvider>
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
          <div className={cn("flex h-16 shrink-0 items-center", collapsed ? "justify-center" : "px-5")}>
            {collapsed ? (
              <Link href="/dashboard" aria-label="StayPilot dashboard">
                <LogoMark />
              </Link>
            ) : (
              <Logo href="/dashboard" />
            )}
          </div>
          <div className="sidebar-scroll flex-1 overflow-y-auto px-3 pb-4 pt-2">
            <SidebarNav collapsed={collapsed} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur sm:gap-3 sm:px-6 lg:px-8">
            <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open navigation">
              <Menu />
            </Button>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="-ml-2 hidden lg:inline-flex"
                    onClick={toggle}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-expanded={!collapsed}
                  />
                }
              >
                {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
              </TooltipTrigger>
              <TooltipContent side="bottom">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
            </Tooltip>
            <Breadcrumbs />
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <div className="hidden w-[min(26.5rem,38vw)] xl:block">
                <GlobalSearchButton onOpen={() => setSearchOpen(true)} />
              </div>
              <Button variant="ghost" size="icon" className="xl:hidden" onClick={() => setSearchOpen(true)} aria-label="Search">
                <Search />
              </Button>
              <NotificationsPopover />
              <UserMenu />
            </div>
          </header>
          <main id="main" tabIndex={-1} className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
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
      </AppDataProvider>
    </NotificationsProvider>
  );
}
