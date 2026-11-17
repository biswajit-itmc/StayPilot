"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/shared/simple-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { useAppData } from "@/hooks/use-app-data";
import { initialAutomationExecutions } from "@/data/smart-operations";
import { initialStaffUsers } from "@/data/admin";
import { DetailDrawer, DetailGrid, Panel, StatePill, dateLabel } from "@/components/smart-operations/shared";

type AuditCategory = "User actions" | "Reservation changes" | "Access task events" | "Lock status changes" | "Automation events" | "Administrative changes";
type AuditEvent = {
  id: string;
  category: AuditCategory;
  event: string;
  actor: string;
  related: string;
  propertyId?: string;
  timestamp: string;
  result: string;
  detail: string;
};

const categories: AuditCategory[] = ["User actions", "Reservation changes", "Access task events", "Lock status changes", "Automation events", "Administrative changes"];
const resultLabel = (result: string) => result.startsWith("Simulated") ? result : result === "Failed" ? "Simulated · failed" : "Prototype state updated";
const timestampLabel = (value: string) => format(parseISO(value), "d MMM yyyy · HH:mm");

function eventsFromModel(m: ReturnType<typeof useAppData>["model"]): AuditEvent[] {
  const events: AuditEvent[] = [];
  const reservation = m.reservations.find((item) => item.status === "Confirmed") ?? m.reservations[0];
  if (reservation) {
    events.push({
      id: `audit-${reservation.id}`,
      category: "Reservation changes",
      event: "Reservation confirmed · sample record",
      actor: "System simulation",
      related: `${reservation.id} · ${m.by.guest.get(reservation.guestId)?.name ?? "Guest"}`,
      propertyId: reservation.propertyId,
      timestamp: `${reservation.createdAt}T10:00`,
      result: "Simulated · recorded",
      detail: "A sample reservation lifecycle event for interface review. No booking channel was contacted.",
    });
  }
  const task = m.tasks.find((item) => item.status === "Failed") ?? m.tasks[0];
  if (task) {
    const linkedReservation = m.by.reservation.get(task.reservationId);
    events.push({
      id: `audit-${task.id}`,
      category: "Access task events",
      event: task.status === "Failed" ? "Access preparation flagged · sample event" : `${task.kind} · sample event`,
      actor: "System simulation",
      related: `${task.id} · ${linkedReservation?.id ?? task.reservationId}`,
      propertyId: task.propertyId,
      timestamp: task.createdAt,
      result: task.status === "Failed" ? "Simulated · failed" : "Simulated · completed",
      detail: "Local access-task fixture only. No PIN was generated and no smart lock was contacted.",
    });
  }
  const lock = m.locks.find((item) => item.status === "Offline") ?? m.locks[0];
  if (lock) {
    events.push({
      id: `audit-${lock.id}`,
      category: "Lock status changes",
      event: `Connection status shown as ${lock.status} · sample`,
      actor: "System simulation",
      related: lock.id,
      propertyId: lock.propertyId,
      timestamp: lock.lastSeen,
      result: "Simulated · recorded",
      detail: "Connection state is seeded demonstration data, not a physical device report.",
    });
  }
  for (const [index, execution] of initialAutomationExecutions.entries()) {
    events.push({
      id: `audit-${execution.ruleId}-${index}`,
      category: "Automation events",
      event: execution.title,
      actor: "Automation simulation",
      related: execution.ruleId,
      timestamp: index === 0 ? "2026-11-17T09:18" : index === 1 ? "2026-11-17T08:42" : "2026-11-12T11:24",
      result: execution.outcome,
      detail: `${execution.detail} No action was sent to an external system.`,
    });
  }
  events.push({
    id: "audit-admin-example",
    category: "Administrative changes",
    event: "Workspace preference saved · sample event",
    actor: initialStaffUsers[0].name,
    related: "Settings · General Settings",
    propertyId: m.properties[0]?.id,
    timestamp: "2026-11-17T09:28",
    result: "Simulated · recorded",
    detail: "This row is a seeded audit example. Settings changes in this demo remain frontend-only.",
  });
  for (const activity of m.activity) {
    const category: AuditCategory =
      activity.kind === "booking" || activity.kind === "checkin" ? "Reservation changes"
        : activity.kind === "access" ? "Access task events"
          : activity.kind === "lock" ? "Lock status changes"
            : activity.kind === "message" ? "User actions" : "Administrative changes";
    events.push({
      id: activity.id,
      category,
      event: activity.text,
      actor: activity.actor,
      related: m.by.property.get(activity.propertyId)?.name ?? activity.propertyId,
      propertyId: activity.propertyId,
      timestamp: activity.at,
      result: "Prototype state updated",
      detail: "Recorded by a local frontend interaction. No external service or hardware operation was performed.",
    });
  }
  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function AuditLogsView() {
  const { model: m } = useAppData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [propertyId, setPropertyId] = useState("all");
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const events = useMemo(() => eventsFromModel(m), [m]);
  const visible = events.filter((event) => {
    const text = `${event.event} ${event.actor} ${event.related} ${event.result} ${event.detail}`.toLowerCase();
    return text.includes(query.trim().toLowerCase())
      && (category === "all" || event.category === category)
      && (propertyId === "all" || event.propertyId === propertyId);
  });
  const properties = m.properties.filter((property) => property.status !== "Archived");

  return (
    <div className="space-y-6">
      <PageHeader title="Audit logs" description="Review sample user, reservation, access, lock, automation and administrative events." />
      <p className="rounded-xl border border-border bg-surface px-4 py-3 text-body text-muted-foreground"><strong className="font-semibold text-charcoal">Prototype audit history.</strong> Seeded system events are illustrative. User-initiated changes shown here are frontend state only.</p>
      <Panel title="Event history" detail={`${visible.length} of ${events.length} events · sorted newest first`}>
        <div className="flex flex-wrap gap-3 border-b border-border p-4">
          <div className="relative min-w-56 flex-1 sm:max-w-sm"><Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events, actor or entity" aria-label="Search audit logs" className="pl-9" /></div>
          <SimpleSelect label="Event category" value={category} onChange={setCategory} className="w-full sm:w-56" options={[{ value: "all", label: "All event categories" }, ...categories.map((item) => ({ value: item, label: item }))]} />
          <SimpleSelect label="Property" value={propertyId} onChange={setPropertyId} className="w-full sm:w-56" options={[{ value: "all", label: "All properties" }, ...properties.map((property) => ({ value: property.id, label: property.name }))]} />
        </div>
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Event</TableHead><TableHead className="hidden md:table-cell">Actor</TableHead><TableHead>Related entity</TableHead><TableHead className="hidden lg:table-cell">Timestamp</TableHead><TableHead>Result</TableHead></TableRow></TableHeader>
          <TableBody>{visible.map((event) => <TableRow key={event.id} className="cursor-pointer" onClick={() => setSelected(event)}>
            <TableCell><button type="button" className="text-left"><span className="block text-label">{event.event}</span><span className="text-meta">{event.category}</span></button></TableCell>
            <TableCell className="hidden text-body md:table-cell">{event.actor}</TableCell>
            <TableCell><span className="block max-w-48 truncate text-body">{event.related}</span><span className="text-meta md:hidden">{event.actor}</span></TableCell>
            <TableCell className="hidden tabular text-body lg:table-cell">{timestampLabel(event.timestamp)}</TableCell>
            <TableCell><StatePill value={resultLabel(event.result)} /></TableCell>
          </TableRow>)}
          {!visible.length && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No audit events match these filters.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Panel>
      <DetailDrawer open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title="Audit event" description={selected?.category}>
        {selected && <DetailGrid items={[
          { label: "Event", value: selected.event },
          { label: "Actor", value: selected.actor },
          { label: "Related entity", value: selected.related },
          { label: "Timestamp", value: timestampLabel(selected.timestamp) },
          { label: "Result", value: <StatePill value={resultLabel(selected.result)} /> },
          { label: "Property", value: selected.propertyId ? m.by.property.get(selected.propertyId)?.name ?? selected.propertyId : "Portfolio" },
          { label: "Details", value: selected.detail },
          { label: "Reference date", value: dateLabel(selected.timestamp) },
        ]} />}
      </DetailDrawer>
    </div>
  );
}
