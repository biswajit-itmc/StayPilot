"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeaderUtilities } from "./header-utilities";
import { useShell } from "./shell-context";

type Props = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

/** The single page-level header: title and description on the left, page actions and compact utilities on the right. */
export function PageHeader({ title, description, actions, className }: Props) {
  const { openNav } = useShell();
  return (
    <header className={cn("flex flex-wrap items-center gap-x-3 gap-y-3", className)}>
      <Button variant="ghost" size="icon" className="-ml-2 self-start lg:hidden" onClick={openNav} aria-label="Open navigation">
        <Menu />
      </Button>
      <div className="order-1 min-w-0 flex-1 basis-48">
        <h1 className="text-page-title">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-body text-muted-foreground">{description}</p>}
      </div>
      <div className="order-3 sm:order-4">
        <HeaderUtilities />
      </div>
      {actions && <div className="order-4 flex w-full shrink-0 flex-wrap items-center gap-2 sm:order-3 sm:w-auto">{actions}</div>}
    </header>
  );
}
