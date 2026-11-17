"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Guest } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, controlClass } from "@/components/shared/field";
import { SimpleSelect } from "@/components/shared/simple-select";
import { useAppData } from "@/hooks/use-app-data";
import { guestSchema, type GuestInput } from "@/lib/schemas";

const STATUS = ["Standard", "VIP", "Blocked"].map((s) => ({ value: s, label: s }));
const LANGUAGES = ["English", "Portuguese", "Spanish", "French", "German", "Dutch", "Italian", "Swedish"].map((s) => ({ value: s, label: s }));

export function GuestDialog({ open, onOpenChange, guest, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; guest?: Guest; onSaved?: (g: Guest) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{guest ? `Edit ${guest.name}` : "Add guest"}</DialogTitle>
          <DialogDescription>{guest ? "Update contact details and status." : "Create a guest profile. You can attach reservations to it afterwards."}</DialogDescription>
        </DialogHeader>
        <GuestForm key={guest?.id ?? "new"} guest={guest} onCancel={() => onOpenChange(false)} onDone={(g) => { onOpenChange(false); onSaved?.(g); }} />
      </DialogContent>
    </Dialog>
  );
}

function GuestForm({ guest, onDone, onCancel }: { guest?: Guest; onDone: (g: Guest) => void; onCancel: () => void }) {
  const { model: m, actions } = useAppData();
  const countries = Array.from(new Set(m.guests.map((g) => g.country))).sort();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<GuestInput>({
    resolver: zodResolver(guestSchema),
    defaultValues: guest ? { name: guest.name, email: guest.email, phone: guest.phone, country: guest.country, language: guest.language, status: guest.status } : { name: "", email: "", phone: "", country: "Portugal", language: "English", status: "Standard" },
    mode: "onTouched",
  });

  const submit = handleSubmit((v) => {
    const clash = m.guests.find((g) => g.id !== guest?.id && g.email.toLowerCase() === v.email.toLowerCase());
    if (clash) {
      setError("email", { message: `${clash.name} already uses this email address` });
      return;
    }
    if (guest) {
      actions.updateGuest(guest.id, v);
      toast.success("Guest updated", { description: v.name });
      onDone({ ...guest, ...v });
    } else {
      const created = actions.addGuest(v);
      toast.success("Guest added", { description: created.name });
      onDone(created);
    }
  });
  const err = (k: keyof GuestInput) => errors[k]?.message as string | undefined;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="g-name" label="Full name" error={err("name")} className="sm:col-span-2">
          <input id="g-name" className={controlClass} aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field id="g-email" label="Email" error={err("email")}>
          <input id="g-email" type="email" className={controlClass} aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field id="g-phone" label="Phone" error={err("phone")}>
          <input id="g-phone" type="tel" className={controlClass} aria-invalid={!!errors.phone} {...register("phone")} />
        </Field>
        <Field id="g-country" label="Country" error={err("country")}>
          <input id="g-country" list="g-countries" className={controlClass} aria-invalid={!!errors.country} {...register("country")} />
          <datalist id="g-countries">
            {countries.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field id="g-lang" label="Language">
          <Controller control={control} name="language" render={({ field }) => <SimpleSelect id="g-lang" label="Language" value={field.value} onChange={field.onChange} options={LANGUAGES} />} />
        </Field>
        <Field id="g-status" label="Status" className="sm:col-span-2" hint="Blocked guests cannot be booked.">
          <Controller control={control} name="status" render={({ field }) => <SimpleSelect id="g-status" label="Status" value={field.value} onChange={field.onChange} options={STATUS} />} />
        </Field>
      </div>
      <DialogFooter className="sticky -bottom-4 z-10 bg-popover">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{guest ? "Save changes" : "Add guest"}</Button>
      </DialogFooter>
    </form>
  );
}
