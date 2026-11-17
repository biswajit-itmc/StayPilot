"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Property } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, controlClass, textareaClass } from "@/components/shared/field";
import { SimpleSelect } from "@/components/shared/simple-select";
import { useAppData } from "@/hooks/use-app-data";
import { isActiveStay } from "@/lib/model";
import { propertySchema, type PropertyInput } from "@/lib/schemas";

const TYPES = ["Hotel", "Boutique hotel", "Guesthouse", "Villas", "Apartments"].map((t) => ({ value: t, label: t }));
const STATUSES = ["Active", "Onboarding", "Archived"].map((t) => ({ value: t, label: t }));

const empty: PropertyInput = {
  name: "",
  type: "Hotel",
  status: "Onboarding",
  city: "",
  address: "",
  manager: "",
  phone: "",
  email: "",
  checkInTime: "15:00",
  checkOutTime: "11:00",
  description: "",
};

export function PropertyDialog({ open, onOpenChange, property, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; property?: Property; onSaved?: (p: Property) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{property ? `Edit ${property.name}` : "Add property"}</DialogTitle>
          <DialogDescription>
            {property ? "Update the details guests and staff see for this property." : "Set up a new property. You can add its rooms and units afterwards."}
          </DialogDescription>
        </DialogHeader>
        <PropertyForm key={property?.id ?? "new"} property={property} onDone={(p) => { onOpenChange(false); onSaved?.(p); }} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function PropertyForm({ property, onDone, onCancel }: { property?: Property; onDone: (p: Property) => void; onCancel: () => void }) {
  const { model: m, actions } = useAppData();
  const managers = Array.from(new Set(m.properties.map((p) => p.manager)));
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: property ? { ...property } : empty,
    mode: "onTouched",
  });

  const submit = handleSubmit((values) => {
    const clash = m.properties.some((p) => p.id !== property?.id && p.name.trim().toLowerCase() === values.name.trim().toLowerCase());
    if (clash) {
      setError("name", { message: "A property with this name already exists" });
      return;
    }
    if (property && property.status === "Active" && values.status !== "Active") {
      const n = m.reservations.filter((r) => r.propertyId === property.id && isActiveStay(r)).length;
      if (n > 0) {
        setError("status", { message: `${n} active ${n === 1 ? "reservation is" : "reservations are"} still booked here. Check out, move or cancel them first.` });
        return;
      }
    }
    if (property) {
      actions.updateProperty(property.id, values);
      toast.success("Property updated", { description: values.name });
      onDone({ ...property, ...values });
    } else {
      const created = actions.addProperty({ ...values });
      toast.success("Property added", { description: `${created.name} is ${created.status.toLowerCase()}.` });
      onDone(created);
    }
  });

  const err = (k: keyof PropertyInput) => errors[k]?.message as string | undefined;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="p-name" label="Property name" error={err("name")} className="sm:col-span-2">
          <input id="p-name" className={controlClass} aria-invalid={!!errors.name} aria-describedby={errors.name ? "p-name-error" : undefined} {...register("name")} />
        </Field>
        <Field id="p-type" label="Property type" error={err("type")}>
          <Controller control={control} name="type" render={({ field }) => <SimpleSelect id="p-type" label="Property type" value={field.value} onChange={field.onChange} options={TYPES} />} />
        </Field>
        <Field id="p-status" label="Status" error={err("status")} hint="Archived properties leave the dashboard.">
          <Controller control={control} name="status" render={({ field }) => <SimpleSelect id="p-status" label="Status" value={field.value} onChange={field.onChange} options={STATUSES} />} />
        </Field>
        <Field id="p-city" label="City" error={err("city")}>
          <input id="p-city" className={controlClass} aria-invalid={!!errors.city} {...register("city")} />
        </Field>
        <Field id="p-manager" label="Assigned manager" error={err("manager")}>
          <input id="p-manager" list="p-managers" className={controlClass} aria-invalid={!!errors.manager} {...register("manager")} />
          <datalist id="p-managers">
            {managers.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </Field>
        <Field id="p-address" label="Address" error={err("address")} className="sm:col-span-2">
          <input id="p-address" className={controlClass} aria-invalid={!!errors.address} {...register("address")} />
        </Field>
        <Field id="p-phone" label="Phone" error={err("phone")}>
          <input id="p-phone" type="tel" className={controlClass} aria-invalid={!!errors.phone} {...register("phone")} />
        </Field>
        <Field id="p-email" label="Email" error={err("email")}>
          <input id="p-email" type="email" className={controlClass} aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field id="p-in" label="Check-in from" error={err("checkInTime")}>
          <input id="p-in" className={controlClass} placeholder="15:00" aria-invalid={!!errors.checkInTime} {...register("checkInTime")} />
        </Field>
        <Field id="p-out" label="Check-out by" error={err("checkOutTime")}>
          <input id="p-out" className={controlClass} placeholder="11:00" aria-invalid={!!errors.checkOutTime} {...register("checkOutTime")} />
        </Field>
        <Field id="p-desc" label="Description" error={err("description")} className="sm:col-span-2">
          <textarea id="p-desc" rows={3} className={textareaClass} aria-invalid={!!errors.description} {...register("description")} />
        </Field>
      </div>
      <DialogFooter className="sticky -bottom-4 z-10 bg-popover">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {property ? "Save changes" : "Add property"}
        </Button>
      </DialogFooter>
    </form>
  );
}
