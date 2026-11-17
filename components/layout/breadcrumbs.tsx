"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { findNavGroup, findNavItem } from "@/lib/navigation";

export function Breadcrumbs() {
  const pathname = usePathname();
  const group = findNavGroup(pathname);
  const item = findNavItem(pathname);
  if (!item) return null;
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-body">
        <li className="hidden text-muted-foreground sm:block">
          <Link href="/dashboard" className="inline-flex min-h-6 items-center hover:text-charcoal">
            StayPilot
          </Link>
        </li>
        {group && (
          <>
            <li aria-hidden className="hidden text-muted-foreground sm:block">
              <ChevronRight className="size-3.5" />
            </li>
            <li className="hidden text-muted-foreground md:block">{group.label}</li>
            <li aria-hidden className="hidden text-muted-foreground md:block">
              <ChevronRight className="size-3.5" />
            </li>
          </>
        )}
        <li aria-current="page" className="truncate text-label !text-charcoal">
          {item.label}
        </li>
      </ol>
    </nav>
  );
}
