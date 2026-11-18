"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationsPopover } from "./notifications-popover";
import { useShell } from "./shell-context";
import { UserMenu } from "./user-menu";

/** Compact search, notifications and account controls that sit at the end of every page header. */
export function HeaderUtilities() {
  const { openSearch } = useShell();
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger render={<Button variant="ghost" size="icon" onClick={openSearch} aria-label="Search" aria-keyshortcuts="Control+K" />}>
          <Search />
        </TooltipTrigger>
        <TooltipContent side="bottom">Search (Ctrl K)</TooltipContent>
      </Tooltip>
      <NotificationsPopover />
      <UserMenu />
    </div>
  );
}
