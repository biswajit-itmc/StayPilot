"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SimpleSelect } from "@/components/shared/simple-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { useAppData } from "@/hooks/use-app-data";
import { initialAutomationExecutions, initialAutomationRules, initialOperationTasks } from "@/data/smart-operations";
import { occupiesNight } from "@/lib/model";
import { TODAY_ISO, daysBetween, shift } from "@/lib/dates";
import { roomLabel } from "@/data/rooms";
import { MetricStrip, Panel, StatePill, dateLabel } from "@/components/smart-operations/shared";

const RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "custom", label: "Custom range" },
];
const STATUS_COLORS = ["var(--olive-deep)", "var(--sage)", "var(--brown)", "var(--charcoal)", "var(--border-strong)"];

function makeBuckets(from: string, to: string) {
  const span = Math.max(1, daysBetween(from, to) + 1);
  const step = Math.max(1, Math.ceil(span / 10));
  const count = Math.ceil(span / step);
  return Array.from({ length: count }, (_, index) => {
    const start = shift(from, index * step);
    const end = start > to ? to : shift(start, Math.min(step - 1, daysBetween(start, to)));
    return { start, end, label: format(parseISO(start), "d MMM") };
  });
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function ReportsView() {
  const { model: m } = useAppData();
  const [range, setRange] = useState("30d");
  const [customFrom, setCustomFrom] = useState(shift(TODAY_ISO, -29));
  const [customTo, setCustomTo] = useState(TODAY_ISO);
  const [propertyId, setPropertyId] = useState("all");
  const { from, to } = range === "7d"
    ? { from: shift(TODAY_ISO, -6), to: TODAY_ISO }
    : range === "90d"
      ? { from: shift(TODAY_ISO, -89), to: TODAY_ISO }
      : range === "custom"
        ? { from: customFrom, to: customTo }
        : { from: shift(TODAY_ISO, -29), to: TODAY_ISO };
  const invalidRange = range === "custom" && from > to;
  const activeProperties = useMemo(() => m.properties.filter((property) => property.status === "Active" && (propertyId === "all" || property.id === propertyId)), [m.properties, propertyId]);
  const scopedPropertyIds = useMemo(() => new Set(activeProperties.map((property) => property.id)), [activeProperties]);
  const units = useMemo(() => m.rooms.filter((room) => room.status === "Active" && scopedPropertyIds.has(room.propertyId)), [m.rooms, scopedPropertyIds]);
  const reservations = useMemo(() => invalidRange ? [] : m.reservations.filter((reservation) =>
    scopedPropertyIds.has(reservation.propertyId) && reservation.checkIn >= from && reservation.checkIn <= to
  ), [m.reservations, from, to, invalidRange, scopedPropertyIds]);
  const buckets = useMemo(() => invalidRange ? [] : makeBuckets(from, to), [from, to, invalidRange]);
  const reservationTrend = buckets.map((bucket) => ({
    date: bucket.label,
    reservations: reservations.filter((reservation) => reservation.checkIn >= bucket.start && reservation.checkIn <= bucket.end).length,
  }));
  const statusData = ["Confirmed", "Pending", "Checked In", "Checked Out", "Cancelled"].map((status) => ({
    name: status,
    value: reservations.filter((reservation) => reservation.status === status).length,
  }));
  const sources = ["Direct", "Airbnb", "Booking.com", "Expedia", "Corporate"].map((source) => ({
    name: source,
    bookings: reservations.filter((reservation) => reservation.source === source).length,
  }));
  const currentUnits = units.filter((room) => m.reservations.some((reservation) => reservation.roomId === room.id && occupiesNight(reservation, TODAY_ISO)));
  const occupiedIds = new Set(currentUnits.map((room) => room.id));
  const overallOccupancy = units.length ? Math.round((occupiedIds.size / units.length) * 100) : 0;
  const occupancyByProperty = activeProperties.map((property) => {
    const propertyUnits = units.filter((room) => room.propertyId === property.id);
    const occupied = propertyUnits.filter((room) => m.reservations.some((reservation) => reservation.roomId === room.id && occupiesNight(reservation, TODAY_ISO))).length;
    return { name: property.name.replace(/ (Hotel|Villas|Lofts|Suites|Guesthouse)$/, ""), Occupied: occupied, Available: Math.max(0, propertyUnits.length - occupied) };
  });
  const occupancyTrend = buckets.map((bucket) => {
    const bucketDays = Array.from({ length: Math.max(1, daysBetween(bucket.start, bucket.end) + 1) }, (_, index) => shift(bucket.start, index));
    const occupiedRoomNights = bucketDays.reduce((count, day) => count + units.filter((room) => m.reservations.some((reservation) => reservation.roomId === room.id && occupiesNight(reservation, day))).length, 0);
    const denominator = units.length * bucketDays.length;
    return { date: bucket.label, occupancy: denominator ? Math.round((occupiedRoomNights / denominator) * 100) : 0 };
  });
  const arrivalsDepartures = buckets.map((bucket) => ({
    date: bucket.label,
    Arrivals: m.reservations.filter((reservation) => scopedPropertyIds.has(reservation.propertyId) && reservation.checkIn >= bucket.start && reservation.checkIn <= bucket.end && reservation.status !== "Cancelled").length,
    Departures: m.reservations.filter((reservation) => scopedPropertyIds.has(reservation.propertyId) && reservation.checkOut >= bucket.start && reservation.checkOut <= bucket.end && reservation.status !== "Cancelled").length,
  }));
  const upcomingArrivals = m.reservations
    .filter((reservation) => scopedPropertyIds.has(reservation.propertyId) && reservation.status !== "Cancelled" && reservation.checkIn >= TODAY_ISO && reservation.checkIn <= shift(TODAY_ISO, 7))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    .slice(0, 8);
  const accessTasks = m.tasks.filter((task) => {
    const created = task.createdAt.slice(0, 10);
    return scopedPropertyIds.has(task.propertyId) && created >= from && created <= to;
  });
  const expiredAccess = m.tasks.filter((task) => {
    const reservation = m.by.reservation.get(task.reservationId);
    return accessTasks.includes(task) && !!reservation && reservation.checkOut < TODAY_ISO;
  });
  const accessMetrics = [
    { label: "Created", value: accessTasks.length },
    { label: "Scheduled", value: accessTasks.filter((task) => task.status === "Scheduled").length },
    { label: "Expired", value: expiredAccess.length },
    { label: "Revocation tasks", value: accessTasks.filter((task) => task.kind === "Revoke access window").length },
    { label: "Failed simulations", value: accessTasks.filter((task) => task.status === "Failed").length },
  ];
  const tasks = initialOperationTasks.filter((task) => propertyId === "all" || task.propertyId === propertyId);
  const automationCompleted = initialAutomationExecutions.filter((execution) => execution.outcome.includes("completed")).length;
  const automationFlagged = initialAutomationExecutions.filter((execution) => execution.outcome.includes("flagged")).length;
  const exportCsv = () => {
    if (invalidRange) {
      toast.error("Choose a valid date range", { description: "The start date must be on or before the end date." });
      return;
    }
    const rows = [
      ["Reservation", "Guest", "Property", "Unit", "Check-in", "Check-out", "Status", "Source"],
      ...reservations.map((reservation) => [
        reservation.id,
        m.by.guest.get(reservation.guestId)?.name ?? "Guest",
        m.by.property.get(reservation.propertyId)?.name ?? reservation.propertyId,
        m.by.room.get(reservation.roomId) ? roomLabel(m.by.room.get(reservation.roomId)!) : reservation.roomId,
        reservation.checkIn,
        reservation.checkOut,
        reservation.status,
        reservation.source,
      ]),
    ];
    const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "staypilot-demo-reservations.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Demo CSV exported", { description: `${reservations.length} sample reservations · no external data source.` });
  };
  const propertyOptions = [{ value: "all", label: "All active properties" }, ...m.properties.filter((property) => property.status === "Active").map((property) => ({ value: property.id, label: property.name }))];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & analytics" description="Explore reservation, occupancy and operations summaries from the local demonstration dataset." actions={<Button variant="outline" onClick={exportCsv}><Download /> Export CSV</Button>} />
      <p className="rounded-xl border border-border bg-surface px-4 py-3 text-body text-muted-foreground"><strong className="font-semibold text-charcoal">Demo data.</strong> Charts and tables describe seeded prototype records, not verified or live business performance.</p>
      <section aria-label="Report filters" className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="w-full sm:w-48"><span className="mb-1.5 block text-label">Date range</span><SimpleSelect label="Date range" value={range} onChange={setRange} options={RANGE_OPTIONS} /></div>
        <div className="w-full sm:w-64"><span className="mb-1.5 block text-label">Property</span><SimpleSelect label="Property" value={propertyId} onChange={setPropertyId} options={propertyOptions} /></div>
        {range === "custom" && <>
          <label className="w-[calc(50%-0.375rem)] sm:w-40"><span className="mb-1.5 block text-label">From</span><input aria-label="Date range from" type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} className="h-9.5 w-full rounded-lg border border-input bg-surface px-3 text-body" /></label>
          <label className="w-[calc(50%-0.375rem)] sm:w-40"><span className="mb-1.5 block text-label">To</span><input aria-label="Date range to" type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} className="h-9.5 w-full rounded-lg border border-input bg-surface px-3 text-body" /></label>
        </>}
        {invalidRange && <p role="alert" className="text-body text-brown-ink">Start date must be on or before end date.</p>}
        <p className="ml-auto text-meta">Showing {from} through {to}</p>
      </section>
      <MetricStrip items={[
        { label: "Reservations", value: invalidRange ? "—" : reservations.length, detail: "Check-ins in selected date range" },
        { label: "Overall occupancy", value: `${overallOccupancy}%`, detail: `${occupiedIds.size} occupied · ${Math.max(0, units.length - occupiedIds.size)} available units today` },
        { label: "Upcoming arrivals", value: upcomingArrivals.length, detail: "Next 7 days · selected property" },
        { label: "Access exceptions", value: accessTasks.filter((task) => task.status === "Failed").length, detail: "Failed simulated tasks in range" },
      ]} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Reservation trend" detail="Check-ins by date bucket · selected range">
          <div className="h-64 p-3 sm:p-5"><ResponsiveContainer width="100%" height="100%"><LineChart data={reservationTrend} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={20} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="reservations" name="Reservations" stroke="var(--olive-deep)" strokeWidth={2} dot={{ r: 2 }} /></LineChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Booking status distribution" detail="Reservation status in the selected check-in range">
          <div className="h-64 p-3 sm:p-5"><ResponsiveContainer width="100%" height="100%"><BarChart data={statusData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" name="Reservations" fill="var(--olive-deep)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Booking source distribution" detail="Source labels are from sample reservations">
          <div className="h-64 p-3 sm:p-5"><ResponsiveContainer width="100%" height="100%"><BarChart data={sources} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 18 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="bookings" name="Reservations" fill="var(--charcoal)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Property-wise occupancy" detail="Occupied and available active units today">
          <div className="h-64 p-3 sm:p-5"><ResponsiveContainer width="100%" height="100%"><BarChart data={occupancyByProperty} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="Occupied" stackId="units" fill="var(--olive-deep)" /><Bar dataKey="Available" stackId="units" fill="var(--sage)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Occupancy trend" detail="Occupied room-nights as a share of active units">
          <div className="h-64 p-3 sm:p-5"><ResponsiveContainer width="100%" height="100%"><LineChart data={occupancyTrend} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={20} /><YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => [`${value}%`, "Occupancy"]} /><Line type="monotone" dataKey="occupancy" name="Occupancy" stroke="var(--olive-deep)" strokeWidth={2} dot={{ r: 2 }} /></LineChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Arrivals & departures" detail="Non-cancelled check-in and check-out dates">
          <div className="h-64 p-3 sm:p-5"><ResponsiveContainer width="100%" height="100%"><LineChart data={arrivalsDepartures} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={20} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="Arrivals" stroke="var(--olive-deep)" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="Departures" stroke="var(--charcoal)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Upcoming arrivals" detail="Next 7 days · linked guest, property and unit">
          <Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead>Guest / reservation</TableHead><TableHead className="hidden sm:table-cell">Property / unit</TableHead><TableHead>Check-in</TableHead><TableHead className="hidden md:table-cell">Status</TableHead></TableRow></TableHeader><TableBody>
            {upcomingArrivals.map((reservation) => <TableRow key={reservation.id}><TableCell><span className="block text-label">{m.by.guest.get(reservation.guestId)?.name}</span><span className="text-meta">{reservation.id}</span></TableCell><TableCell className="hidden sm:table-cell"><span className="block text-body">{m.by.property.get(reservation.propertyId)?.name}</span><span className="text-meta">{m.by.room.get(reservation.roomId) ? roomLabel(m.by.room.get(reservation.roomId)!) : reservation.roomId}</span></TableCell><TableCell className="text-body">{dateLabel(reservation.checkIn)}<span className="block text-meta">{reservation.checkInTime}</span></TableCell><TableCell className="hidden md:table-cell"><StatePill value={reservation.status} /></TableCell></TableRow>)}
            {!upcomingArrivals.length && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No upcoming arrivals match this property.</TableCell></TableRow>}
          </TableBody></Table>
        </Panel>
        <Panel title="Access operations" detail="Counters describe sample access-task records">
          <div className="divide-y divide-border">          {accessMetrics.map((metric, index) => <div key={metric.label} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"><span className="flex items-center gap-2 text-body"><span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[index] }} />{metric.label}</span><span className="tabular text-label">{invalidRange ? "—" : metric.value}</span></div>)}</div>
          <div className="border-t border-border p-4 text-meta">Access tasks are demonstrations; counts do not represent credentials or physical door activity.</div>
        </Panel>
        <Panel title="Operational performance" detail="Frontend task fixtures and sample automation run outcomes">
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
            {[
              ["Pending tasks", tasks.filter((task) => task.status === "Pending").length],
              ["Completed tasks", tasks.filter((task) => task.status === "Completed").length],
              ["Exceptions", tasks.filter((task) => task.status === "Requires attention").length],
              ["Automation successes (demo)", automationCompleted],
              ["Automation failures (demo)", automationFlagged],
              ["Enabled rules", initialAutomationRules.filter((rule) => rule.enabled).length],
            ].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-muted/30 p-3"><p className="text-meta">{label}</p><p className="mt-1 text-xl font-semibold tabular">{value}</p></div>)}
          </div>
          <p className="border-t border-border px-4 py-3 text-meta">Counts come from three seeded simulated executions. The flagged sample is counted as a failure for illustration, not as a real success rate.</p>
        </Panel>
      </div>
      {invalidRange && <p role="alert" className="text-body text-brown-ink">No report data is shown until the date range is valid.</p>}
    </div>
  );
}
