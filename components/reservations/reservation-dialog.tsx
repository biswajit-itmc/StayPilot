"use client";

import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Reservation } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, controlClass, textareaClass } from "@/components/shared/field";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { SimpleSelect } from "@/components/shared/simple-select";
import { useAppData, type ReservationDraft } from "@/hooks/use-app-data";
import { roomLabel } from "@/data/rooms";
import { TODAY_ISO, daysBetween, shift } from "@/lib/dates";
import { findConflicts, type Model } from "@/lib/model";
import { reservationBase, type ReservationFormValues } from "@/lib/schemas";
import { GuestPicker } from "./guest-picker";

const SOURCES = ["Direct", "Booking.com", "Airbnb", "Expedia", "Corporate"].map((s) => ({ value: s, label: s }));
const PAYMENTS = ["Paid", "Partial", "Unpaid", "Refunded"].map((s) => ({ value: s, label: s }));
const NEW_STATUSES = ["Confirmed", "Pending"].map((s) => ({ value: s, label: s }));
const EDIT_STATUSES = ["Confirmed", "Pending", "Checked In", "Checked Out"].map((s) => ({ value: s, label: s }));

export function ReservationDialog({
  open,
  onOpenChange,
  reservation,
  preset,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  reservation?: Reservation;
  preset?: { roomId?: string; date?: string; guestId?: string };
  onSaved?: (r: Reservation) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{reservation ? `Edit ${reservation.id}` : "New reservation"}</DialogTitle>
          <DialogDescription>
            {reservation ? "Change the stay, the unit or the payment. Availability is checked against other bookings." : "Book a unit for a guest. Only units that are free for the chosen dates can be selected."}
          </DialogDescription>
        </DialogHeader>
        <ReservationForm
          key={reservation?.id ?? `new-${preset?.roomId ?? ""}-${preset?.date ?? ""}-${preset?.guestId ?? ""}`}
          reservation={reservation}
          preset={preset}
          onCancel={() => onOpenChange(false)}
          onDone={(r) => {
            onOpenChange(false);
            onSaved?.(r);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function suggestedTotal(m: Model, roomId: string, checkIn: string, checkOut: string) {
  const room = m.by.room.get(roomId);
  if (!room || !checkIn || !checkOut || checkOut <= checkIn) return 0;
  return room.nightlyRate * daysBetween(checkIn, checkOut);
}

function ReservationForm({ reservation, preset, onDone, onCancel }: { reservation?: Reservation; preset?: { roomId?: string; date?: string; guestId?: string }; onDone: (r: Reservation) => void; onCancel: () => void }) {
  const { model: m, actions } = useAppData();
  const editing = !!reservation;
  const [guestMode, setGuestMode] = useState<"existing" | "new">("existing");

  const bookable = m.properties.filter((p) => p.status === "Active" || p.id === reservation?.propertyId);
  const presetRoom = preset?.roomId ? m.by.room.get(preset.roomId) : undefined;
  const startDate = preset?.date && preset.date >= TODAY_ISO ? preset.date : TODAY_ISO;

  const schema = useMemo(
    () =>
      reservationBase.superRefine((v, ctx) => {
        const issue = (path: keyof ReservationFormValues, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
        if (guestMode === "existing" && !v.guestId) issue("guestId", "Choose a guest, or switch to New guest");
        if (guestMode === "existing" && m.by.guest.get(v.guestId)?.status === "Blocked") issue("guestId", "This guest is blocked and cannot be booked");
        if (guestMode === "new") {
          if (v.newGuestName.length < 2) issue("newGuestName", "Enter the guest's full name");
          if (!/^\S+@\S+\.\S+$/.test(v.newGuestEmail)) issue("newGuestEmail", "Enter a valid email address");
        }
        if (v.checkIn && v.checkOut && v.checkOut <= v.checkIn) issue("checkOut", "Check-out must be after check-in");
        if (!editing && v.checkIn && v.checkIn < TODAY_ISO) issue("checkIn", "New reservations cannot start in the past");
        if (v.checkIn && v.checkOut && v.checkOut > v.checkIn && daysBetween(v.checkIn, v.checkOut) > 90) issue("checkOut", "Stays are limited to 90 nights");
        if ((v.status === "Checked In" || v.status === "Checked Out") && v.checkIn && v.checkIn > TODAY_ISO) issue("status", "A guest cannot be checked in before the check-in date");
        if ((v.status === "Confirmed" || v.status === "Pending") && v.checkOut && v.checkOut < TODAY_ISO) issue("status", "A stay that has already ended cannot be confirmed or pending");
        const prop = m.by.property.get(v.propertyId);
        if (prop && prop.status !== "Active" && !(editing && prop.id === reservation?.propertyId)) issue("propertyId", `${prop.name} is ${prop.status.toLowerCase()} and not open for bookings`);
        const room = m.by.room.get(v.roomId);
        if (room) {
          if (room.status === "Maintenance") issue("roomId", "This unit is in maintenance");
          if (v.adults > room.capacity) issue("adults", `This unit sleeps at most ${room.capacity}`);
          if (v.checkIn && v.checkOut && v.checkOut > v.checkIn && v.status !== "Cancelled") {
            const clash = findConflicts(m, room.id, v.checkIn, v.checkOut, reservation?.id)[0];
            if (clash) issue("roomId", `Already booked by ${m.by.guest.get(clash.guestId)?.name} (${clash.checkIn} to ${clash.checkOut})`);
          }
        }
      }),
    [m, guestMode, editing, reservation?.id, reservation?.propertyId]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: reservation
      ? { guestId: reservation.guestId, newGuestName: "", newGuestEmail: "", propertyId: reservation.propertyId, roomId: reservation.roomId, checkIn: reservation.checkIn, checkOut: reservation.checkOut, adults: reservation.adults, source: reservation.source, status: reservation.status, paymentStatus: reservation.paymentStatus, total: reservation.total, notes: reservation.notes ?? "" }
      : {
          guestId: preset?.guestId ?? "",
          newGuestName: "",
          newGuestEmail: "",
          propertyId: presetRoom?.propertyId ?? bookable[0]?.id ?? "",
          roomId: presetRoom?.id ?? "",
          checkIn: startDate,
          checkOut: shift(startDate, 2),
          adults: 2,
          source: "Direct",
          status: "Confirmed",
          paymentStatus: "Unpaid",
          total: 0,
          notes: "",
        },
    mode: "onTouched",
  });

  const [propertyId, roomId, checkIn, checkOut, total] = useWatch({ control, name: ["propertyId", "roomId", "checkIn", "checkOut", "total"] });
  const nights = checkIn && checkOut && checkOut > checkIn ? daysBetween(checkIn, checkOut) : 0;
  const suggestion = suggestedTotal(m, roomId, checkIn, checkOut);

  const unitOptions = m.rooms
    .filter((r) => r.propertyId === propertyId && (r.status === "Active" || r.id === reservation?.roomId))
    .map((r) => {
      const busy = checkIn && checkOut && checkOut > checkIn ? findConflicts(m, r.id, checkIn, checkOut, reservation?.id).length > 0 : false;
      return { value: r.id, label: `${roomLabel(r)} · ${r.type} · sleeps ${r.capacity}${busy ? " · booked" : ""}` };
    });

  const submit = handleSubmit((v) => {
    const room = m.by.room.get(v.roomId)!;
    const property = m.by.property.get(room.propertyId)!;
    if (reservation) {
      const patch: Partial<Reservation> = {
        guestId: v.guestId || reservation.guestId,
        roomId: room.id,
        propertyId: room.propertyId,
        checkIn: v.checkIn,
        checkOut: v.checkOut,
        adults: v.adults,
        source: v.source,
        status: v.status,
        paymentStatus: v.paymentStatus,
        total: v.total,
        notes: v.notes || undefined,
      };
      actions.updateReservation(reservation.id, patch);
      toast.success("Reservation updated", { description: `${reservation.id} · ${roomLabel(room)}` });
      onDone({ ...reservation, ...patch });
      return;
    }
    const draft: ReservationDraft = {
      guestId: guestMode === "existing" ? v.guestId : "",
      roomId: room.id,
      propertyId: room.propertyId,
      checkIn: v.checkIn,
      checkOut: v.checkOut,
      checkInTime: property.checkInTime,
      checkOutTime: property.checkOutTime,
      adults: v.adults,
      source: v.source,
      status: v.status,
      paymentStatus: v.paymentStatus,
      total: v.total,
      notes: v.notes || undefined,
    };
    const created = actions.addReservation(draft, guestMode === "new" ? { name: v.newGuestName, email: v.newGuestEmail } : undefined);
    toast.success("Reservation created", { description: `${created.id} · ${roomLabel(room)} · ${v.checkIn} to ${v.checkOut}` });
    onDone(created);
  });

  const err = (k: keyof ReservationFormValues) => errors[k]?.message as string | undefined;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="text-eyebrow">Guest</legend>
        {!editing && (
          <SegmentedControl
            label="Guest type"
            value={guestMode}
            onChange={(v) => setGuestMode(v)}
            options={[
              { value: "existing", label: "Existing guest" },
              { value: "new", label: "New guest" },
            ]}
          />
        )}
        {guestMode === "existing" ? (
          <Field id="rv-guest" label="Guest" error={err("guestId")}>
            <Controller control={control} name="guestId" render={({ field }) => <GuestPicker id="rv-guest" value={field.value} onChange={field.onChange} invalid={!!errors.guestId} />} />
          </Field>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="rv-gname" label="Full name" error={err("newGuestName")}>
              <input id="rv-gname" className={controlClass} aria-invalid={!!errors.newGuestName} {...register("newGuestName")} />
            </Field>
            <Field id="rv-gemail" label="Email" error={err("newGuestEmail")}>
              <input id="rv-gemail" type="email" className={controlClass} aria-invalid={!!errors.newGuestEmail} {...register("newGuestEmail")} />
            </Field>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-eyebrow">Stay</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="rv-prop" label="Property" error={err("propertyId")}>
            <Controller
              control={control}
              name="propertyId"
              render={({ field }) => (
                <SimpleSelect
                  id="rv-prop"
                  label="Property"
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    setValue("roomId", "", { shouldValidate: false });
                  }}
                  options={bookable.map((p) => ({ value: p.id, label: p.name }))}
                />
              )}
            />
          </Field>
          <Field id="rv-unit" label="Unit" error={err("roomId")}>
            <Controller control={control} name="roomId" render={({ field }) => <SimpleSelect id="rv-unit" label="Unit" value={field.value} onChange={field.onChange} options={unitOptions} placeholder="Choose a unit" invalid={!!errors.roomId} />} />
          </Field>
          <Field id="rv-in" label="Check-in" error={err("checkIn")}>
            <input id="rv-in" type="date" className={controlClass} aria-invalid={!!errors.checkIn} {...register("checkIn")} />
          </Field>
          <Field id="rv-out" label="Check-out" error={err("checkOut")} hint={nights ? `${nights} ${nights === 1 ? "night" : "nights"}` : undefined}>
            <input id="rv-out" type="date" className={controlClass} aria-invalid={!!errors.checkOut} {...register("checkOut")} />
          </Field>
          <Field id="rv-adults" label="Guests" error={err("adults")}>
            <input id="rv-adults" type="number" min={1} className={controlClass} aria-invalid={!!errors.adults} {...register("adults", { valueAsNumber: true })} />
          </Field>
          <Field id="rv-source" label="Booking source" error={err("source")}>
            <Controller control={control} name="source" render={({ field }) => <SimpleSelect id="rv-source" label="Booking source" value={field.value} onChange={field.onChange} options={SOURCES} />} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-eyebrow">Status and payment</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="rv-status" label="Status" error={err("status")}>
            <Controller control={control} name="status" render={({ field }) => <SimpleSelect id="rv-status" label="Status" value={field.value} onChange={field.onChange} options={editing ? EDIT_STATUSES : NEW_STATUSES} />} />
          </Field>
          <Field id="rv-pay" label="Payment">
            <Controller control={control} name="paymentStatus" render={({ field }) => <SimpleSelect id="rv-pay" label="Payment" value={field.value} onChange={field.onChange} options={PAYMENTS} />} />
          </Field>
          <Field id="rv-total" label="Total (EUR)" error={err("total")}>
            <input id="rv-total" type="number" min={0} className={controlClass} aria-invalid={!!errors.total} {...register("total", { valueAsNumber: true })} />
          </Field>
        </div>
        {suggestion > 0 && suggestion !== total && (
          <p className="text-meta">
            Rate × nights is <span className="tabular !text-charcoal">€{suggestion}</span>.{" "}
            <button type="button" className="text-label text-charcoal underline" onClick={() => setValue("total", suggestion, { shouldValidate: true })}>
              Use this total
            </button>
          </p>
        )}
        <Field id="rv-notes" label="Notes" error={err("notes")}>
          <textarea id="rv-notes" rows={2} className={textareaClass} placeholder="Special requests, arrival details…" {...register("notes")} />
        </Field>
      </fieldset>

      <DialogFooter className="sticky -bottom-4 z-10 bg-popover">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{editing ? "Save changes" : "Create reservation"}</Button>
      </DialogFooter>
    </form>
  );
}

