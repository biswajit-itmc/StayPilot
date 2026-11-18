"use client";

import { useState } from "react";
import { formatStayTime } from "@/lib/dates";
import { MoreHorizontal, Star } from "lucide-react";
import type { AccessStatus, Reservation } from "@/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { describe } from "@/lib/dashboard";
import { accessStatusFor, type Model } from "@/lib/model";
import { SectionHeader, StatusText } from "./section";

const ACCESS_TONE: Record<AccessStatus, "ok" | "neutral" | "warn" | "bad"> = {
  Ready: "ok",
  Pending: "neutral",
  "Instructions not sent": "warn",
  Failed: "bad",
};

type Props = {
  m: Model;
  rows: Reservation[];
  total: number;
  onCheckIn: (r: Reservation) => void;
  onSendInstructions: (r: Reservation) => void;
  onView: (r: Reservation) => void;
  filtered: boolean;
};

const LIMIT = 8;

export function ArrivalsTable({ m, rows, total, onCheckIn, onSendInstructions, onView, filtered }: Props) {
  const [all, setAll] = useState(false);
  const visible = all ? rows : rows.slice(0, LIMIT);
  const ready = rows.filter((r) => accessStatusFor(m, r) === "Ready").length;

  return (
    <section>
      <SectionHeader
        title="Today's arrivals"
        meta={
          <>
            <span className="tabular text-charcoal">{rows.length}</span>
            {filtered && ` of ${total}`} arriving · <span className="tabular text-charcoal">{ready}</span> with access ready
          </>
        }
      />
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        <Table
          containerClassName="table-scroll"
          containerProps={{ role: "region", "aria-label": "Today's arrivals table", tabIndex: 0 }}
          className="[&_th]:px-2.5 [&_td]:px-2.5 [&_td]:py-2.5 sm:[&_th]:px-3 sm:[&_td]:px-3"
        >
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Guest</TableHead>
              <TableHead className="hidden md:table-cell">Property / unit</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead className="hidden min-[1600px]:table-cell">Source</TableHead>
              <TableHead>Access</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No arrivals match your filters.
                </TableCell>
              </TableRow>
            )}
            {visible.map((r) => {
              const d = describe(m, r);
              const isIn = r.status === "Checked In";
              const access = accessStatusFor(m, r);
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-label">{d.guest.name}</span>
                      {d.guest.status === "VIP" && <Star className="size-3.5 fill-lime text-olive-deep" aria-label="VIP guest" />}
                    </div>
                    <p className="text-meta md:hidden">
                      {d.property.name.split(" ")[0]} · {d.roomName}
                    </p>
                    <p className="hidden text-meta md:block">
                      {r.id} · {r.adults} {r.adults === 1 ? "adult" : "adults"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-label">{d.property.name}</p>
                    <p className="text-meta">
                      {d.roomName} · {d.room.type}
                    </p>
                  </TableCell>
                  <TableCell>
                    {isIn ? (
                      <StatusText tone="ok">Checked in</StatusText>
                    ) : (
                      <span className="tabular">{formatStayTime(r.checkInTime) ?? "—"}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground min-[1600px]:table-cell">{r.source}</TableCell>
                  <TableCell>
                    {isIn ? (
                      <StatusText tone="ok">
                        <span className="max-w-28 truncate sm:max-w-none">In house</span>
                      </StatusText>
                    ) : (
                      <StatusText tone={ACCESS_TONE[access]}>
                        <span className="max-w-28 truncate sm:max-w-none">{access}</span>
                      </StatusText>
                    )}
                  </TableCell>
                  <TableCell className="pl-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${d.guest.name}`} />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem disabled={isIn} onClick={() => onCheckIn(r)}>
                          Check in guest
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={access === "Ready" || access === "Failed"} onClick={() => onSendInstructions(r)}>
                          {access === "Ready" ? "Instructions sent" : "Send check-in instructions"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onView(r)}>View reservation</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {rows.length > LIMIT && (
          <div className="border-t border-border px-4 py-2.5 text-center">
            <button type="button" onClick={() => setAll((v) => !v)} className="inline-flex min-h-6 items-center text-label text-muted-foreground hover:text-charcoal">
              {all ? "Show fewer" : `Show all ${rows.length} arrivals`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
