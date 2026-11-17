"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/use-notifications";
import { DEMO_REFERENCE_TIME, timeAgo } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function NotificationsPopover() {
  const { notifications, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative" />}
      >
        <Bell />
        {unread > 0 && (
          <span className="tabular absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-lime px-1 text-[10px] font-semibold leading-4 text-charcoal">
            {unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" aria-label="Notifications" className="w-[min(24rem,calc(100vw-2rem))] gap-0 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-card-title">Notifications</p>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unread === 0}
            className="inline-flex items-center gap-1.5 text-label text-muted-foreground transition-colors hover:text-charcoal disabled:pointer-events-none disabled:opacity-40"
          >
            <CheckCheck className="size-3.5" />
            Mark all read
          </button>
        </div>
        <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
          {notifications.map((n) => (
            <li key={n.id}>
              <Link
                href={n.href}
                onClick={() => {
                  markRead(n.id);
                  setOpen(false);
                }}
                className={cn("flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60", !n.read && "bg-accent/40")}
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-olive-deep")} aria-hidden />
                <span className="min-w-0">
                  <span className="block text-label">{n.title}</span>
                  <span className="mt-0.5 block text-body text-muted-foreground">{n.detail}</span>
                  <span className="mt-1 block text-meta">{timeAgo(n.at)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="border-t border-border px-4 py-2 text-meta">Demo data: times are measured from {DEMO_REFERENCE_TIME}.</p>
      </PopoverContent>
    </Popover>
  );
}
