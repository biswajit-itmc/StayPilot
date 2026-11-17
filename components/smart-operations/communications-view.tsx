"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CalendarClock, Eye, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/shared/simple-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { initialMessageTemplates, type MessageTemplate } from "@/data/smart-operations";
import { guestMessages } from "@/lib/model";
import { useAppData } from "@/hooks/use-app-data";
import { roomLabel } from "@/data/rooms";
import { MetricStrip, ModuleFrame, Panel, StatePill, Timeline, dateLabel } from "./shared";
import { NOW, TODAY_ISO, shift, stamp } from "@/lib/dates";

type ScheduledMessage = { id: string; reservationId: string; guest: string; template: string; property: string; scheduledAt: string; status: string };
const fill = (text: string, guest: string, property: string, reservation: string, unit: string, checkIn: string, checkOut: string, checkInTime: string, checkOutTime: string) =>
  text.replaceAll("{{guest}}", guest).replaceAll("{{property}}", property).replaceAll("{{reservation}}", reservation).replaceAll("{{unit}}", unit).replaceAll("{{checkIn}}", checkIn).replaceAll("{{checkOut}}", checkOut).replaceAll("{{checkInTime}}", checkInTime).replaceAll("{{checkOutTime}}", checkOutTime);

export function CommunicationsView() {
  const { model: m } = useAppData();
  const [templates, setTemplates] = useState(initialMessageTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialMessageTemplates[0].id);
  const [activeView, setActiveView] = useState<"templates" | "scheduled" | "history">("templates");
  const [scheduled, setScheduled] = useState<ScheduledMessage[]>(() => m.reservations
    .filter((reservation) => reservation.status !== "Cancelled" && reservation.checkIn > TODAY_ISO)
    .slice(0, 2)
    .map((reservation, index) => ({
      id: `SIM-${reservation.id}`,
      reservationId: reservation.id,
      guest: m.by.guest.get(reservation.guestId)?.name ?? "Guest",
      template: index === 0 ? "Pre-arrival" : "Checkout reminder",
      property: m.by.property.get(reservation.propertyId)?.name ?? reservation.propertyId,
      scheduledAt: `${dateLabel(shift(reservation.checkIn, -1))} · ${index === 0 ? "11:00" : "18:00"}`,
      status: "Simulated · scheduled",
    })));
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const [selectedTemplateForSchedule, setSelectedTemplateForSchedule] = useState(initialMessageTemplates[1].id);
  const [scheduledAt, setScheduledAt] = useState("2026-11-18T09:00");
  const [timelineGuestId, setTimelineGuestId] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draft, setDraft] = useState<MessageTemplate>(initialMessageTemplates[0]);
  const previewReservation = m.reservations.find((reservation) => reservation.status !== "Cancelled");
  const previewGuest = previewReservation ? m.by.guest.get(previewReservation.guestId) : undefined;
  const previewRoom = previewReservation ? m.by.room.get(previewReservation.roomId) : undefined;
  const previewProperty = previewReservation ? m.by.property.get(previewReservation.propertyId) : undefined;
  const previewSubject = previewReservation && previewGuest && previewProperty && previewRoom
    ? fill(draft.subject, previewGuest.name, previewProperty.name, previewReservation.id, roomLabel(previewRoom), dateLabel(previewReservation.checkIn), dateLabel(previewReservation.checkOut), previewReservation.checkInTime, previewReservation.checkOutTime)
    : draft.subject;
  const previewBody = previewReservation && previewGuest && previewProperty && previewRoom
    ? fill(draft.body, previewGuest.name, previewProperty.name, previewReservation.id, roomLabel(previewRoom), dateLabel(previewReservation.checkIn), dateLabel(previewReservation.checkOut), previewReservation.checkInTime, previewReservation.checkOutTime)
    : draft.body;
  const reservationsForChoice = m.reservations
    .filter((reservation) => reservation.status !== "Cancelled" && reservation.checkIn >= TODAY_ISO)
    .slice(0, 100);
  const history = useMemo(() => {
    const messages = m.messages.map((message) => ({
      id: message.id,
      guestId: message.guestId,
      guest: m.by.guest.get(message.guestId)?.name ?? "Guest",
      reservationId: message.reservationId ?? "—",
      subject: message.subject,
      channel: message.channel,
      time: `${dateLabel(message.at)} · ${message.at.slice(11, 16)}`,
      status: "Simulated · delivered",
    }));
    const generated = m.guests.slice(0, 3).flatMap((guest) => guestMessages(m, guest.id).slice(0, 2).map((message) => ({
      id: message.id,
      guestId: guest.id,
      guest: guest.name,
      reservationId: message.reservationId ?? "—",
      subject: message.subject,
      channel: message.channel,
      time: `${dateLabel(message.at)} · ${message.at.slice(11, 16)}`,
      status: "Simulated · delivered",
    })));
    return [...messages, ...generated].slice(0, 12);
  }, [m]);
  const timelineGuest = m.by.guest.get(timelineGuestId) ?? m.guests[0];
  const timeline = timelineGuest ? guestMessages(m, timelineGuest.id).slice(0, 8) : [];

  const selectTemplate = (item: MessageTemplate) => {
    setSelectedTemplateId(item.id);
    setDraft({ ...item });
  };
  const saveTemplate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTemplates((items) => items.map((item) => item.id === draft.id ? { ...draft } : item));
    toast.success("Template saved", { description: "The updated template is stored in this browser session only." });
  };
  const schedule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reservation = m.by.reservation.get(selectedReservationId);
    if (!reservation || !scheduledAt) {
      toast.error("Choose a reservation and schedule time");
      return;
    }
    if (scheduledAt <= stamp(NOW)) {
      toast.error("Choose a future schedule time", { description: "Scheduled message entries must be later than the prototype reference time." });
      return;
    }
    const guest = m.by.guest.get(reservation.guestId);
    const property = m.by.property.get(reservation.propertyId);
    const selectedTemplate = templates.find((item) => item.id === selectedTemplateForSchedule);
    const next: ScheduledMessage = {
      id: `MSG-${Date.now().toString().slice(-5)}`,
      reservationId: reservation.id,
      guest: guest?.name ?? "Guest",
      template: selectedTemplate?.name ?? "Message",
      property: property?.name ?? reservation.propertyId,
      scheduledAt: `${dateLabel(scheduledAt)} · ${scheduledAt.slice(11, 16)}`,
      status: "Simulated · scheduled",
    };
    setScheduled((items) => [next, ...items]);
    setScheduleOpen(false);
    toast("Message scheduled (simulated)", { description: "A local queue entry was created. Nothing will be sent." });
  };

  const openScheduleDialog = () => {
    const reservation = reservationsForChoice.find((item) => item.checkIn > TODAY_ISO) ?? reservationsForChoice[0];
    setSelectedReservationId(reservation?.id ?? "");
    setScheduledAt(reservation ? `${reservation.checkIn > TODAY_ISO ? shift(reservation.checkIn, -1) : reservation.checkIn}T11:00` : `${TODAY_ISO}T11:00`);
    setScheduleOpen(true);
  };

  const tabClass = (view: typeof activeView) => `border-b-2 px-3 py-2.5 text-label ${activeView === view ? "border-charcoal text-charcoal" : "border-transparent text-muted-foreground hover:text-charcoal"}`;
  return (
    <ModuleFrame title="Communications" description="Manage guest message templates, planned messages and illustrative delivery history.">
      <MetricStrip items={[
        { label: "Templates", value: templates.length, detail: "Editable local content" },
        { label: "Scheduled", value: scheduled.length, detail: "No messages will be sent" },
        { label: "History", value: history.length, detail: "Statuses are simulated" },
        { label: "Channels", value: "Email · SMS · WhatsApp", detail: "Preview labels only" },
      ]} />
      <div role="tablist" aria-label="Communication views" className="flex gap-1 overflow-x-auto border-b border-border">
        {(["templates", "scheduled", "history"] as const).map((view) => <button key={view} type="button" role="tab" aria-selected={activeView === view} className={tabClass(view)} onClick={() => setActiveView(view)}>{view === "templates" ? "Templates" : view === "scheduled" ? "Scheduled messages" : "Message history"}</button>)}
      </div>
      {activeView === "templates" && <div className="grid gap-5 xl:grid-cols-[minmax(210px,0.7fr)_minmax(0,1.3fr)]">
        <Panel title="Message templates" detail="Select a template to review or edit.">
          <ul className="divide-y divide-border">{templates.map((item) => <li key={item.id}><button type="button" onClick={() => selectTemplate(item)} className={`w-full px-4 py-3 text-left hover:bg-muted/40 ${item.id === selectedTemplateId ? "bg-accent/60" : ""}`}><span className="block text-label">{item.name}</span><span className="text-meta">{item.timing}</span></button></li>)}</ul>
        </Panel>
        <div className="space-y-5">
          <Panel title="Template editor" detail={draft.timing}>
            <form onSubmit={saveTemplate} className="space-y-4 p-4 sm:p-5">
              <label className="block space-y-1.5"><span className="text-label">Template name</span><Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} required /></label>
              <label className="block space-y-1.5"><span className="text-label">Subject</span><Input value={draft.subject} onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))} required /></label>
              <label className="block space-y-1.5"><span className="text-label">Message body</span><textarea rows={7} className="min-h-36 w-full rounded-lg border border-input bg-surface px-3 py-2 text-body outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40" value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} required /></label>
              <div className="flex flex-wrap justify-between gap-2"><Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}><Eye /> Preview</Button><Button type="submit"><Save /> Save template</Button></div>
            </form>
          </Panel>
          <Panel title="Guest communication timeline" detail="Reservation-linked sample history · not a live conversation">
            <div className="border-b border-border p-4"><SimpleSelect label="Guest" value={timelineGuest?.id ?? ""} onChange={setTimelineGuestId} className="w-full sm:max-w-sm" options={m.guests.slice(0, 80).map((guest) => ({ value: guest.id, label: guest.name }))} /></div>
            <div className="p-4 sm:p-5">{timeline.length ? <Timeline items={timeline.map((message) => ({ title: `${message.direction} · ${message.subject}`, detail: `${message.channel} · ${message.reservationId ?? "No reservation"}. Delivery is simulated.`, time: `${dateLabel(message.at)} · ${message.at.slice(11, 16)}` }))} /> : <p className="text-body text-muted-foreground">No sample messages for this guest.</p>}</div>
          </Panel>
        </div>
      </div>}
      {activeView === "scheduled" && <Panel title="Scheduled message queue" detail="All entries are simulated queue records and will not be delivered." action={<Button variant="accent" onClick={openScheduleDialog}><CalendarClock /> Schedule message</Button>}>
        <Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead>Guest / reservation</TableHead><TableHead className="hidden lg:table-cell">Property</TableHead><TableHead>Template</TableHead><TableHead>Scheduled for</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
          {scheduled.map((item) => <TableRow key={item.id}><TableCell><span className="block text-label">{item.guest}</span><span className="text-meta">{item.reservationId} · {item.id}</span></TableCell><TableCell className="hidden text-body lg:table-cell">{item.property}</TableCell><TableCell className="text-body">{item.template}</TableCell><TableCell className="text-body">{item.scheduledAt}</TableCell><TableCell><StatePill value={item.status} /></TableCell></TableRow>)}
          {!scheduled.length && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No scheduled messages.</TableCell></TableRow>}
        </TableBody></Table>
      </Panel>}
      {activeView === "history" && <Panel title="Message history" detail="Every delivery state below is a fabricated demonstration outcome.">
        <Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead>Guest / reservation</TableHead><TableHead>Message</TableHead><TableHead className="hidden md:table-cell">Channel</TableHead><TableHead className="hidden lg:table-cell">Activity</TableHead><TableHead>Delivery status</TableHead></TableRow></TableHeader><TableBody>
          {history.map((item) => <TableRow key={item.id}><TableCell><span className="block text-label">{item.guest}</span><span className="text-meta">{item.reservationId}</span></TableCell><TableCell className="max-w-64 truncate text-body">{item.subject}</TableCell><TableCell className="hidden text-body md:table-cell">{item.channel}</TableCell><TableCell className="hidden text-body lg:table-cell">{item.time}</TableCell><TableCell><StatePill value={item.status} /></TableCell></TableRow>)}
        </TableBody></Table>
      </Panel>}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Message preview</DialogTitle><DialogDescription>Preview uses a sample reservation. It is not sent or queued.</DialogDescription></DialogHeader>
        <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4"><p className="text-meta">To: {previewGuest?.name ?? "Sample guest"} · Email preview</p><p className="text-label">{previewSubject}</p><p className="whitespace-pre-wrap text-body">{previewBody}</p><StatePill value="Simulated · scheduled" /></div>
        <DialogFooter><Button variant="outline" onClick={() => setPreviewOpen(false)}>Close preview</Button></DialogFooter>
      </DialogContent></Dialog>
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Schedule a message</DialogTitle><DialogDescription>Creates a simulated schedule entry only. No email, SMS or WhatsApp is sent.</DialogDescription></DialogHeader>
        <form onSubmit={schedule} className="space-y-4">
          <label className="block space-y-1.5"><span className="text-label">Reservation</span><select className="h-9 w-full rounded-lg border border-input bg-surface px-3 text-body" value={selectedReservationId} onChange={(event) => setSelectedReservationId(event.target.value)} required>{reservationsForChoice.map((reservation) => <option key={reservation.id} value={reservation.id}>{reservation.id} · {m.by.guest.get(reservation.guestId)?.name} · {reservation.checkIn}</option>)}</select></label>
          <label className="block space-y-1.5"><span className="text-label">Template</span><SimpleSelect label="Template" value={selectedTemplateForSchedule} onChange={setSelectedTemplateForSchedule} options={templates.map((item) => ({ value: item.id, label: item.name }))} /></label>
          <label className="block space-y-1.5"><span className="text-label">Schedule for</span><Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} required /></label>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button><Button type="submit"><Send /> Add simulated schedule</Button></DialogFooter>
        </form>
      </DialogContent></Dialog>
    </ModuleFrame>
  );
}
