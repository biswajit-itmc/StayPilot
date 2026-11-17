"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Room } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, controlClass, textareaClass } from "@/components/shared/field";
import { SimpleSelect } from "@/components/shared/simple-select";
import { useAppData } from "@/hooks/use-app-data";
import { roomLabel } from "@/data/rooms";
import { isActiveStay } from "@/lib/model";
import { roomSchema, type RoomInput } from "@/lib/schemas";

export function RoomDialog({
  open,
  onOpenChange,
  room,
  defaultPropertyId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  room?: Room;
  defaultPropertyId?: string;
  onSaved?: (r: Room) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{room ? `Edit ${roomLabel(room)}` : "Add room or unit"}</DialogTitle>
          <DialogDescription>{room ? "Change how this unit is sold and described." : "Create a unit and optionally assign a smart lock to it."}</DialogDescription>
        </DialogHeader>
        <RoomForm key={room?.id ?? "new"} room={room} defaultPropertyId={defaultPropertyId} onCancel={() => onOpenChange(false)} onDone={(r) => { onOpenChange(false); onSaved?.(r); }} />
      </DialogContent>
    </Dialog>
  );
}

function RoomForm({ room, defaultPropertyId, onDone, onCancel }: { room?: Room; defaultPropertyId?: string; onDone: (r: Room) => void; onCancel: () => void }) {
  const { model: m, actions } = useAppData();
  const selectable = m.properties.filter((p) => p.status !== "Archived" || p.id === room?.propertyId);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RoomInput>({
    resolver: zodResolver(roomSchema),
    defaultValues: room
      ? { propertyId: room.propertyId, number: room.number, type: room.type, capacity: room.capacity, nightlyRate: room.nightlyRate, status: room.status, notes: room.notes ?? "", assignLock: false }
      : { propertyId: defaultPropertyId && selectable.some((p) => p.id === defaultPropertyId) ? defaultPropertyId : (selectable[0]?.id ?? ""), number: "", type: "", capacity: 2, nightlyRate: 120, status: "Active", notes: "", assignLock: true },
    mode: "onTouched",
  });
  const propertyId = useWatch({ control, name: "propertyId" });
  const suggestions = Array.from(new Set(m.rooms.filter((r) => r.propertyId === propertyId).map((r) => r.type)));

  const submit = handleSubmit((v) => {
    if (room) {
      // Edits must not strand bookings that are already in this unit.
      const stays = (m.by.reservationsByRoom.get(room.id) ?? []).filter(isActiveStay);
      const maxGuests = stays.reduce((mx, r) => Math.max(mx, r.adults), 0);
      let blocked = false;
      if (v.capacity < maxGuests) {
        setError("capacity", { message: `Bookings here include ${maxGuests} guests. Capacity cannot drop below that.` });
        blocked = true;
      }
      if (v.status === "Maintenance" && room.status !== "Maintenance" && stays.length > 0) {
        setError("status", { message: `${stays.length} active ${stays.length === 1 ? "reservation is" : "reservations are"} booked in this unit. Move or cancel them first.` });
        blocked = true;
      }
      if (blocked) return;
      const { propertyId: _p, number: _n, assignLock: _a, ...patch } = v;
      void _p; void _n; void _a;
      actions.updateRoom(room.id, patch);
      toast.success("Unit updated", { description: roomLabel(room) });
      onDone({ ...room, ...patch });
      return;
    }
    const code = m.by.property.get(v.propertyId)?.code;
    if (m.by.room.has(`${code}-${v.number.trim()}`)) {
      setError("number", { message: "This property already has a unit with that number" });
      return;
    }
    const created = actions.addRoom(v);
    toast.success("Unit added", { description: `${roomLabel(created)} · ${m.by.property.get(created.propertyId)?.name}` });
    onDone(created);
  });

  const err = (k: keyof RoomInput) => errors[k]?.message as string | undefined;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="r-prop" label="Property" error={err("propertyId")} className="sm:col-span-2" hint={room ? "A unit cannot move to another property." : undefined}>
          <Controller
            control={control}
            name="propertyId"
            render={({ field }) => (
              <SimpleSelect id="r-prop" label="Property" value={field.value} onChange={field.onChange} options={selectable.map((p) => ({ value: p.id, label: p.name }))} disabled={!!room} invalid={!!errors.propertyId} />
            )}
          />
        </Field>
        <Field id="r-num" label="Unit number or name" error={err("number")} hint={room ? "Unit numbers cannot change once created." : "For example 305, Loft 12 or A."}>
          <input id="r-num" className={controlClass} disabled={!!room} aria-invalid={!!errors.number} {...register("number")} />
        </Field>
        <Field id="r-type" label="Room type" error={err("type")}>
          <input id="r-type" list="r-types" className={controlClass} aria-invalid={!!errors.type} {...register("type")} />
          <datalist id="r-types">
            {suggestions.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>
        <Field id="r-cap" label="Capacity (guests)" error={err("capacity")}>
          <input id="r-cap" type="number" min={1} className={controlClass} aria-invalid={!!errors.capacity} {...register("capacity", { valueAsNumber: true })} />
        </Field>
        <Field id="r-rate" label="Nightly rate (EUR)" error={err("nightlyRate")}>
          <input id="r-rate" type="number" min={1} className={controlClass} aria-invalid={!!errors.nightlyRate} {...register("nightlyRate", { valueAsNumber: true })} />
        </Field>
        <Field id="r-status" label="Status" error={err("status")} className="sm:col-span-2" hint="Units in maintenance cannot be booked.">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <SimpleSelect id="r-status" label="Status" value={field.value} onChange={field.onChange} options={[{ value: "Active", label: "In service" }, { value: "Maintenance", label: "Maintenance" }]} />
            )}
          />
        </Field>
        <Field id="r-notes" label="Notes" error={err("notes")} className="sm:col-span-2">
          <textarea id="r-notes" rows={2} className={textareaClass} aria-invalid={!!errors.notes} {...register("notes")} />
        </Field>
        {!room && (
          <label className="flex items-start gap-2.5 sm:col-span-2">
            <input type="checkbox" className="mt-1 size-4 accent-[var(--olive-deep)]" {...register("assignLock")} />
            <span>
              <span className="block text-label">Assign a smart lock</span>
              <span className="block text-meta">Creates a simulated lock for this unit so access windows can be planned.</span>
            </span>
          </label>
        )}
      </div>
      <DialogFooter className="sticky -bottom-4 z-10 bg-popover">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{room ? "Save changes" : "Add unit"}</Button>
      </DialogFooter>
    </form>
  );
}
