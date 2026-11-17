"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarPlus, Mail, MessageSquare, MessageSquareText, Pencil, Phone, Smartphone } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import type { Guest, GuestMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { Field, textareaClass } from "@/components/shared/field";
import { GuestStatusBadge, PaymentBadge, ReservationStatusBadge } from "@/components/shared/status-badges";
import { useAppData } from "@/hooks/use-app-data";
import { roomLabel } from "@/data/rooms";
import { guestMessages, guestStats, nightsOf } from "@/lib/model";
import { noteSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const day = (s: string) => format(parseISO(s), "d MMM yyyy");
const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2);
const channelIcon: Record<GuestMessage["channel"], typeof Mail> = { Email: Mail, SMS: Smartphone, WhatsApp: MessageSquareText };

export function GuestProfile({
  guest,
  onBack,
  onEdit,
  onMessage,
  onOpenReservation,
  onNewReservation,
}: {
  guest: Guest;
  onBack: () => void;
  onEdit: (g: Guest) => void;
  onMessage: (g: Guest) => void;
  onOpenReservation: (id: string) => void;
  onNewReservation: (g: Guest) => void;
}) {
  const { model: m } = useAppData();
  const stats = guestStats(m, guest.id);
  const reservations = m.by.reservationsByGuest.get(guest.id) ?? [];
  const stays = reservations.filter((r) => r.status === "Checked Out" || r.status === "Checked In");
  const messages = guestMessages(m, guest.id);
  const notes = m.notes.filter((n) => n.guestId === guest.id).sort((a, b) => b.at.localeCompare(a.at));

  return (
    <article aria-label={`${guest.name} profile`} className="rounded-2xl border border-border bg-surface shadow-card">
      <div className="p-5">
        <button type="button" onClick={onBack} className="mb-4 inline-flex min-h-6 items-center gap-1.5 text-label text-muted-foreground hover:text-charcoal xl:hidden">
          <ArrowLeft className="size-4" aria-hidden /> All guests
        </button>
        <div className="flex items-start gap-4">
          <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-sage text-section">
            {initials(guest.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-section">{guest.name}</h2>
              <GuestStatusBadge status={guest.status} />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-body text-muted-foreground">
              <Mail className="size-3.5 shrink-0" aria-hidden /> <span className="truncate">{guest.email}</span>
            </p>
            <p className="flex items-center gap-1.5 text-body text-muted-foreground">
              <Phone className="size-3.5 shrink-0" aria-hidden /> {guest.phone}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onNewReservation(guest)} disabled={guest.status === "Blocked"}>
            <CalendarPlus /> New reservation
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMessage(guest)}>
            <MessageSquare /> Message
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(guest)}>
            <Pencil /> Edit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="gap-0">
        <div className="overflow-x-auto border-y border-border px-3">
          <TabsList variant="line" className="h-10 min-w-max gap-1">
            {[
              ["overview", "Overview"],
              ["reservations", `Reservations (${reservations.length})`],
              ["stays", `Stays (${stays.length})`],
              ["messages", `Messages (${messages.length})`],
              ["notes", `Notes (${notes.length})`],
            ].map(([v, l]) => (
              <TabsTrigger key={v} value={v} className="px-3">
                {l}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-5 p-5">
          <dl className="grid grid-cols-2 divide-x divide-y divide-border rounded-xl border border-border sm:grid-cols-4 sm:divide-y-0">
            {[
              ["Stays", stats.stays],
              ["Nights", stats.nights],
              ["Spend", `€${stats.spend.toLocaleString("en-GB")}`],
              ["Cancelled", stats.cancelled],
            ].map(([k, v]) => (
              <div key={k as string} className="px-3 py-3">
                <dt className="text-meta">{k}</dt>
                <dd className="tabular mt-0.5 text-section">{v}</dd>
              </div>
            ))}
          </dl>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {[
              ["Country", guest.country],
              ["Language", guest.language],
              ["Customer since", day(guest.createdAt)],
              ["Last stay", stats.last ? `${day(stats.last.checkOut)} · ${roomLabel(m.by.room.get(stats.last.roomId)!)}` : "No completed stays"],
              ["Staying now", stats.inHouse ? `${roomLabel(m.by.room.get(stats.inHouse.roomId)!)} until ${day(stats.inHouse.checkOut)}` : "Not in house"],
              ["Next reservation", stats.upcoming ? `${day(stats.upcoming.checkIn)} · ${roomLabel(m.by.room.get(stats.upcoming.roomId)!)}` : "None booked"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-meta">{k}</dt>
                <dd className="text-body">{v}</dd>
              </div>
            ))}
          </dl>
        </TabsContent>

        <TabsContent value="reservations" className="p-0">
          {reservations.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="No reservations yet"
              description="Bookings for this guest will appear here."
              action={
                <Button size="sm" variant="accent" onClick={() => onNewReservation(guest)} disabled={guest.status === "Blocked"}>
                  <CalendarPlus /> New reservation
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {reservations.slice(0, 40).map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => onOpenReservation(r.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-left hover:bg-accent/40">
                    <span className="min-w-0 flex-1">
                      <span className="block text-label">
                        {r.id} · {roomLabel(m.by.room.get(r.roomId)!)}
                      </span>
                      <span className="tabular block text-meta">
                        {m.by.property.get(r.propertyId)?.name} · {day(r.checkIn)} – {day(r.checkOut)}
                      </span>
                    </span>
                    <PaymentBadge status={r.paymentStatus} />
                    <ReservationStatusBadge status={r.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="stays" className="p-5">
          {stays.length === 0 ? (
            <EmptyState icon={CalendarPlus} title="No stays yet" description="Completed and in-house stays are listed here." className="py-8" />
          ) : (
            <ol className="space-y-4 border-l border-border pl-5">
              {stays.map((r) => (
                <li key={r.id} className="relative">
                  <span aria-hidden className={cn("absolute -left-[26px] top-1.5 size-2.5 rounded-full", r.status === "Checked In" ? "bg-olive-deep" : "bg-charcoal")} />
                  <p className="text-label">
                    {m.by.property.get(r.propertyId)?.name} · {roomLabel(m.by.room.get(r.roomId)!)}
                  </p>
                  <p className="tabular text-meta">
                    {day(r.checkIn)} – {day(r.checkOut)} · {nightsOf(r)} {nightsOf(r) === 1 ? "night" : "nights"} · €{r.total}
                    {r.status === "Checked In" && " · in house"}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>

        <TabsContent value="messages" className="p-0">
          <div className="flex items-center justify-between px-5 py-3">
            <p className="text-meta">Simulated messages. Nothing is sent outside the prototype.</p>
            <Button size="sm" variant="outline" onClick={() => onMessage(guest)}>
              <MessageSquare /> New message
            </Button>
          </div>
          {messages.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No communication yet" description="Booking confirmations and messages you send will be listed here." className="py-8" action={<Button size="sm" variant="outline" onClick={() => onMessage(guest)}>Send the first message</Button>} />
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {messages.slice(0, 40).map((msg) => {
                const Icon = channelIcon[msg.channel];
                return (
                  <li key={msg.id} className="flex gap-3 px-5 py-3">
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-label">
                        {msg.subject} <span className="text-meta">· {msg.direction === "Inbound" ? "from guest" : "sent"} via {msg.channel}</span>
                      </p>
                      <p className="mt-0.5 text-body text-muted-foreground">{msg.body}</p>
                      <p className="tabular mt-1 text-meta">{format(parseISO(msg.at), "d MMM yyyy, HH:mm")}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4 p-5">
          <NoteForm guestId={guest.id} />
          {notes.length === 0 ? (
            <EmptyState icon={MessageSquareText} title="No internal notes yet" description="Notes are visible to staff only. Use the box above to record preferences or requests." className="py-8" />
          ) : (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="rounded-lg bg-muted p-3">
                  <p className="text-body">{n.text}</p>
                  <p className="mt-1 text-meta">
                    {n.author} · {format(parseISO(n.at), "d MMM yyyy, HH:mm")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </article>
  );
}

function NoteForm({ guestId }: { guestId: string }) {
  const { actions } = useAppData();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ text: string }>({ resolver: zodResolver(noteSchema), defaultValues: { text: "" }, mode: "onSubmit" });
  return (
    <form
      noValidate
      onSubmit={handleSubmit((v) => {
        actions.addNote(guestId, v.text);
        toast.success("Note added", { description: "Visible to staff only" });
        reset({ text: "" });
      })}
      className="space-y-2"
    >
      <Field id={`note-${guestId}`} label="Add an internal note" error={errors.text?.message}>
        <textarea id={`note-${guestId}`} rows={2} className={textareaClass} placeholder="Preferences, requests, things the team should know" aria-invalid={!!errors.text} {...register("text")} />
      </Field>
      <Button type="submit" size="sm">
        Save note
      </Button>
    </form>
  );
}

