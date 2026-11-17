"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { QueueItem, Reservation } from "@/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { useAppData } from "@/hooks/use-app-data";
import { useNotifications } from "@/hooks/use-notifications";
import { NOW, minutesAgo } from "@/lib/dates";
import {
  buildActivity,
  buildQueue,
  describe,
  getArrivals,
  getDepartures,
  getLockHealth,
  getMetrics,
  getOccupancyBreakdown,
  getOccupancyOutlook,
  getPropertyOccupancy,
  getReservationActivity,
  presetRange,
  validateRange,
  type DateRange,
  type PropertyFilter,
} from "@/lib/dashboard";
import { accessStatusFor } from "@/lib/model";
import { ArrivalsTable } from "./arrivals-table";
import { DashboardFilters, type RangePreset } from "./dashboard-filters";
import { DemoNotice } from "./demo-notice";
import { DeparturesTable } from "./departures-table";
import { LockHealth } from "./lock-health";
import { MetricsStrip } from "./metrics-strip";
import { OccupancyOutlook } from "./occupancy-outlook";
import { OccupancyOverview } from "./occupancy-overview";
import { OperationsQueue } from "./operations-queue";
import { RecentActivity } from "./recent-activity";
import { ReservationActivity } from "./reservation-activity";

export function DashboardView() {
  const router = useRouter();
  const { push } = useNotifications();
  // The dashboard reports on operating properties only; everything it shows is derived from the shared data,
  // so a reservation created or a guest checked in on any page is reflected here.
  const { operating: m, actions, openIntent } = useAppData();

  const [property, setProperty] = useState<PropertyFilter>("all");
  const [preset, setPreset] = useState<RangePreset>("14");
  const [custom, setCustom] = useState<DateRange>(presetRange(14));
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  // If the chosen property stops being operating (archived elsewhere), fall back to all.
  const scope: PropertyFilter = property === "all" || m.by.property.has(property) ? property : "all";

  const metrics = useMemo(() => getMetrics(m, scope), [m, scope]);
  const rangeError = preset === "custom" ? validateRange(custom) : null;
  // An invalid custom range never reaches the chart: it keeps showing the last 14 days until the dates are fixed.
  const activeRange = useMemo<DateRange>(
    () => (preset === "custom" ? (rangeError ? presetRange(14) : custom) : presetRange(Number(preset))),
    [preset, custom, rangeError]
  );
  const activity = useMemo(() => getReservationActivity(m, scope, activeRange), [m, scope, activeRange]);
  const breakdown = useMemo(() => getOccupancyBreakdown(m, scope), [m, scope]);
  const perProperty = useMemo(() => getPropertyOccupancy(m, scope), [m, scope]);
  const outlook = useMemo(() => getOccupancyOutlook(m, scope), [m, scope]);
  const allArrivals = useMemo(() => getArrivals(m, scope), [m, scope]);
  const allDepartures = useMemo(() => getDepartures(m, scope), [m, scope]);
  const matches = (r: Reservation) => {
    if (!q) return true;
    const d = describe(m, r);
    return [d.guest.name, r.id, d.roomName, d.property.name, r.source].some((s) => s.toLowerCase().includes(q));
  };
  const arrivals = allArrivals.filter(matches);
  const departures = allDepartures.filter(matches);
  const health = useMemo(() => getLockHealth(m, scope), [m, scope]);
  const queue = useMemo(() => buildQueue(m).filter((i) => scope === "all" || i.propertyId === scope), [m, scope]);
  const feed = useMemo(() => buildActivity(m).filter((a) => scope === "all" || a.propertyId === scope), [m, scope]);
  const pendingTasks = health.pendingTasks;

  const onCheckIn = (r: Reservation) => {
    const d = describe(m, r);
    actions.setReservationStatus(r.id, "Checked In");
    toast.success(`${d.guest.name} checked in`, { description: `${d.roomName} · ${d.property.name}` });
  };

  const onSendInstructions = (r: Reservation) => {
    const d = describe(m, r);
    const current = accessStatusFor(m, r);
    if (current === "Pending" || current === "Failed") {
      toast.warning("Access isn't ready yet", { description: "Prepare the access window before sending instructions." });
      return;
    }
    actions.sendInstructions(r.id);
    toast.success("Instructions sent", { description: `${d.guest.name} · ${d.guest.language}` });
  };

  const onCheckOut = (r: Reservation) => {
    const d = describe(m, r);
    actions.setReservationStatus(r.id, "Checked Out");
    toast.success(`${d.guest.name} checked out`, { description: "Housekeeping task created" });
  };

  const onLateCheckout = (r: Reservation) => {
    const d = describe(m, r);
    actions.log(r.propertyId, "message", `Late check-out approved for ${d.guest.name} (${d.roomName}) until 13:00.`);
    toast.success("Late check-out approved", { description: `${d.guest.name} may stay until 13:00` });
  };

  const onView = (r: Reservation) => {
    openIntent({ type: "reservation", id: r.id });
    router.push("/reservations");
  };

  const onQueueAction = (item: QueueItem) => {
    const r = item.reservationId ? m.by.reservation.get(item.reservationId) : undefined;
    const where = item.title.split("·")[1]?.trim();
    switch (item.kind) {
      case "access-pending":
        if (r) actions.prepareAccess(r.id);
        toast.success("Access window prepared", { description: where });
        break;
      case "instructions":
        if (r) actions.sendInstructions(r.id);
        toast.success("Instructions sent", { description: where });
        break;
      case "mapping":
        if (r) actions.resolveMapping(r.id);
        toast.success("Reservation mapped", { description: `${item.reservationId} matched to a unit` });
        break;
      case "access-failed":
        toast.error("Retry failed: the lock is still offline", { description: "Send staff to the unit or issue a manual key." });
        push({ title: "Access retry failed", detail: item.detail, at: minutesAgo(0), href: "/access-codes" });
        break;
      case "lock-offline":
        toast.info("Diagnostics queued", { description: "This is a simulated action. No device was contacted." });
        break;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, Sofia`}
        description={`${metrics.properties.value} ${metrics.properties.value === 1 ? "property" : "properties"} · ${metrics.properties.units} units · demo workspace`}
        actions={
          <Button
            variant="accent"
            onClick={() => {
              openIntent({ type: "new-reservation" });
              router.push("/reservations");
            }}
          >
            <Plus /> New reservation
          </Button>
        }
      />

      <DemoNotice />

      <DashboardFilters
        properties={m.properties}
        property={scope}
        onProperty={setProperty}
        preset={preset}
        onPreset={setPreset}
        custom={custom}
        onCustom={setCustom}
        rangeError={rangeError}
        query={query}
        onQuery={setQuery}
      />

      <MetricsStrip m={metrics} filtered={scope !== "all"} />

      <div className="grid gap-x-8 gap-y-12 pt-2 min-[1440px]:grid-cols-12 min-[1440px]:gap-x-12">
        <div className="min-w-0 min-[1440px]:col-span-8">
          <ReservationActivity data={activity} />
        </div>
        <div className="min-w-0 min-[1440px]:col-span-4">
          <OccupancyOverview breakdown={breakdown} perProperty={perProperty} pct={metrics.occupancy.value} />
        </div>

        <div className="min-w-0 min-[1440px]:col-span-8">
          <ArrivalsTable
            m={m}
            rows={arrivals}
            total={allArrivals.length}
            filtered={q.length > 0}
            onCheckIn={onCheckIn}
            onSendInstructions={onSendInstructions}
            onView={onView}
          />
        </div>
        <div className="min-w-0 min-[1440px]:col-span-4">
          <OperationsQueue items={queue} onAction={onQueueAction} />
        </div>

        <div className="min-w-0 min-[1440px]:col-span-7">
          <DeparturesTable
            m={m}
            rows={departures}
            total={allDepartures.length}
            filtered={q.length > 0}
            onCheckOut={onCheckOut}
            onLateCheckout={onLateCheckout}
            onView={onView}
          />
        </div>
        <div className="min-w-0 min-[1440px]:col-span-5">
          <LockHealth m={m} health={health} pendingTasks={pendingTasks} failedTasks={health.failedTasks} />
        </div>

        <div className="min-w-0 min-[1440px]:col-span-5">
          <RecentActivity items={feed} />
        </div>
        <div className="min-w-0 min-[1440px]:col-span-7">
          <OccupancyOutlook data={outlook} />
        </div>
      </div>
    </div>
  );
}

function greeting() {
  const h = NOW.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
