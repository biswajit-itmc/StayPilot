"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, controlClass, textareaClass } from "@/components/shared/field";
import { SimpleSelect } from "@/components/shared/simple-select";
import { useAppData } from "@/hooks/use-app-data";
import { messageSchema, type MessageInput } from "@/lib/schemas";

const CHANNELS = ["Email", "SMS", "WhatsApp"].map((c) => ({ value: c, label: c }));
const TEMPLATES = [
  { value: "none", label: "Write from scratch", subject: "", body: "" },
  { value: "instructions", label: "Check-in instructions", subject: "Your check-in instructions", body: "Hello, your arrival details and door access instructions are attached. Reply here if you need anything before you arrive." },
  { value: "late", label: "Late arrival confirmation", subject: "Late arrival confirmed", body: "Thank you for letting us know. We have noted your late arrival and your access window will stay open." },
  { value: "thanks", label: "Thank you after the stay", subject: "Thank you for staying with us", body: "We hope you enjoyed your stay. We would love to hear your feedback and welcome you back soon." },
];

export function MessageDialog({ open, onOpenChange, guestId, reservationId }: { open: boolean; onOpenChange: (o: boolean) => void; guestId: string; reservationId?: string }) {
  const { model: m } = useAppData();
  const guest = m.by.guest.get(guestId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Message {guest?.name}</DialogTitle>
          <DialogDescription>Messages are simulated in this prototype. They appear in the guest&apos;s communication history, but nothing is actually sent.</DialogDescription>
        </DialogHeader>
        {open && <MessageForm key={guestId + (reservationId ?? "")} guestId={guestId} reservationId={reservationId} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function MessageForm({ guestId, reservationId, onDone }: { guestId: string; reservationId?: string; onDone: () => void }) {
  const { actions, model: m } = useAppData();
  const guest = m.by.guest.get(guestId);
  const [template, setTemplate] = useState("");
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<MessageInput>({
    resolver: zodResolver(messageSchema),
    defaultValues: { channel: "Email", subject: "", body: "" },
    mode: "onTouched",
  });

  const submit = handleSubmit((v) => {
    actions.sendMessage(guestId, v, reservationId);
    toast.success("Message sent", { description: `${v.channel} to ${guest?.name} (simulated)` });
    onDone();
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="m-channel" label="Channel">
          <Controller control={control} name="channel" render={({ field }) => <SimpleSelect id="m-channel" label="Channel" value={field.value} onChange={field.onChange} options={CHANNELS} />} />
        </Field>
        <Field id="m-template" label="Template">
          <SimpleSelect
            id="m-template"
            label="Template"
            value={template}
            placeholder="Choose a template"
            options={TEMPLATES.map((t) => ({ value: t.value, label: t.label }))}
            onChange={(v) => {
              setTemplate(v);
              const t = TEMPLATES.find((x) => x.value === v);
              if (t) {
                setValue("subject", t.subject, { shouldValidate: !!t.subject });
                setValue("body", t.body, { shouldValidate: !!t.body });
              }
            }}
          />
        </Field>
      </div>
      <Field id="m-subject" label="Subject" error={errors.subject?.message}>
        <input id="m-subject" className={controlClass} aria-invalid={!!errors.subject} {...register("subject")} />
      </Field>
      <Field id="m-body" label="Message" error={errors.body?.message}>
        <textarea id="m-body" rows={5} className={textareaClass} aria-invalid={!!errors.body} {...register("body")} />
      </Field>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Send message</Button>
      </DialogFooter>
    </form>
  );
}
