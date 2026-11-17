"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { Reservation } from "@/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { daysBetween } from "@/lib/dates";
import { describe } from "@/lib/dashboard";
import type { Model } from "@/lib/model";
import { SectionHeader, StatusText } from "./section";

type Props = {
  m: Model;
  rows: Reservation[];
  total: number;
  onCheckOut: (r: Reservation) => void;
  onLateCheckout: (r: Reservation) => void;
  onView: (r: Reservation) => void;
  filtered: boolean;
};

const LIMIT = 8;

export function DeparturesTable({ m, rows, total, onCheckOut, onLateCheckout, onView, filtered }: Props) {
  const [all, setAll] = useState(false);
  const visible = all ? rows : rows.slice(0, LIMIT);
  const remaining = rows.filter((r) => r.status !== "Checked Out").length;
  return (
    <section>
      <SectionHeader
        title="Today's departures"
        meta={
          <>
            <span className="tabular text-charcoal">{remaining}</span> still to check out
            {filtered && ` (${rows.length} of ${total} shown)`}
          </>
        }
      />
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        <Table
          containerClassName="table-scroll"
          containerProps={{ role: "region", "aria-label": "Today's departures table", tabIndex: 0 }}
          className="[&_th]:px-2.5 [&_td]:px-2.5 [&_td]:py-2.5 sm:[&_th]:px-3 sm:[&_td]:px-3"
        >
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Guest</TableHead>
              <TableHead className="hidden sm:table-cell">Unit</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead className="hidden md:table-cell">Stay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No departures match your filters.
                </TableCell>
              </TableRow>
            )}
            {visible.map((r) => {
              const d = describe(m, r);
              const out = r.status === "Checked Out";
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="text-label">{d.guest.name}</p>
                    <p className="text-meta sm:hidden">{d.roomName}</p>
                    <p className="hidden text-meta sm:block">{r.id}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <p className="text-label">{d.roomName}</p>
                    <p className="text-meta">{d.property.name}</p>
                  </TableCell>
                  <TableCell>
                    <span className="tabular">{r.checkOutTime}</span>
                  </TableCell>
                  <TableCell className="tabular hidden text-muted-foreground md:table-cell">{daysBetween(r.checkIn, r.checkOut)} nights</TableCell>
                  <TableCell>{out ? <StatusText tone="ok">Checked out</StatusText> : <StatusText tone="neutral">Due out</StatusText>}</TableCell>
                  <TableCell className="pl-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${d.guest.name}`} />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem disabled={out} onClick={() => onCheckOut(r)}>
                          Mark as checked out
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={out} onClick={() => onLateCheckout(r)}>
                          Approve late check-out
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
              {all ? "Show fewer" : `Show all ${rows.length} departures`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
