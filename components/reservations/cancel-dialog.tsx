"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Reservation } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";
import { SimpleSelect } from "@/components/shared/simple-select";
import { useAppData } from "@/hooks/use-app-data";
import { roomLabel } from "@/data/rooms";

const REASONS = ["Guest request", "No-show", "Duplicate booking", "Payment failed", "Property unavailable", "Other"].map((r) => ({ value: r, label: r }));

export function CancelDialog({ reservation, onClose }: { reservation: Reservation | null; onClose: () => void }) {
  return (
    <Dialog open={!!reservation} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">{reservation && <CancelForm key={reservation.id} reservation={reservation} onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}

function CancelForm({ reservation: r, onClose }: { reservation: Reservation; onClose: () => void }) {
  const { model: m, actions } = useAppData();
  const guest = m.by.guest.get(r.guestId);
  const room = m.by.room.get(r.roomId);
  const [reason, setReason] = useState("");
  const [refund, setRefund] = useState(true);
  const [touched, setTouched] = useState(false);
  const refundable = r.paymentStatus === "Paid" || r.paymentStatus === "Partial";
  const blocked = r.status === "Checked In" || r.status === "Checked Out" || r.status === "Cancelled";
  const reasonError = touched && !reason ? "Choose a reason for the cancellation" : undefined;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cancel {r.id}?</DialogTitle>
        <DialogDescription>
          {guest?.name} · {room ? roomLabel(room) : ""} · {r.checkIn} to {r.checkOut}. The unit is released for those dates.
        </DialogDescription>
      </DialogHeader>
      {blocked ? (
        <p role="alert" className="rounded-lg bg-muted p-3 text-body">
          {r.status === "Cancelled" ? "This reservation is already cancelled." : `A reservation that is ${r.status.toLowerCase()} cannot be cancelled. Edit its status instead.`}
        </p>
      ) : (
        <div className="space-y-4">
          <Field id="c-reason" label="Reason" error={reasonError}>
            <SimpleSelect id="c-reason" label="Reason" value={reason} onChange={(v) => { setReason(v); setTouched(true); }} options={REASONS} placeholder="Choose a reason" invalid={!!reasonError} />
          </Field>
          {refundable && (
            <label className="flex items-start gap-2.5">
              <input type="checkbox" checked={refund} onChange={(e) => setRefund(e.target.checked)} className="mt-1 size-4 accent-[var(--olive-deep)]" />
              <span>
                <span className="block text-label">Mark the payment as refunded</span>
                <span className="block text-meta">€{r.total} · currently {r.paymentStatus.toLowerCase()}</span>
              </span>
            </label>
          )}
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Keep reservation
        </Button>
        <Button
          disabled={blocked}
          className="bg-brown-ink text-background hover:bg-brown-ink/90"
          onClick={() => {
            if (!reason) {
              setTouched(true);
              return;
            }
            actions.cancelReservation(r.id, refundable && refund);
            toast.success(`${r.id} cancelled`, { description: `${guest?.name} · ${reason}` });
            onClose();
          }}
        >
          Cancel reservation
        </Button>
      </DialogFooter>
    </>
  );
}
