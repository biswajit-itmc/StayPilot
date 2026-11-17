"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navGroups, type NavItem } from "@/lib/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function NavLink({ item, active, collapsed, onNavigate }: { item: NavItem; active: boolean; collapsed: boolean; onNavigate?: () => void }) {
  const className = cn(
    "flex items-center rounded-lg text-nav transition-colors",
    collapsed ? "size-10 justify-center" : "gap-2.5 px-3 py-2",
    active ? "bg-accent text-charcoal" : "text-muted-foreground hover:bg-muted hover:text-charcoal"
  );
  const content = (
    <>
      <item.icon className="size-4 shrink-0" strokeWidth={active ? 2 : 1.75} />
      {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
    </>
  );
  if (!collapsed) {
    return (
      <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger render={<Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={className} />}>
        {content}
      </TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function SidebarNav({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className={cn("flex flex-col", collapsed ? "items-center gap-3" : "gap-5")}>
      {navGroups.map((group, gi) => (
        <div key={group.label} className={cn(collapsed && gi > 0 && "border-t border-border pt-3")}>
          {!collapsed && <p className="mb-1.5 px-3 text-meta font-medium uppercase tracking-[0.08em]">{group.label}</p>}
          <ul className={cn("space-y-0.5", collapsed && "flex flex-col items-center")}>
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <NavLink item={item} active={active} collapsed={collapsed} onNavigate={onNavigate} />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
