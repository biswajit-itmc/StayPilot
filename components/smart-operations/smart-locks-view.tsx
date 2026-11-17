"use client";

import { useMemo, useState } from "react";
import { Battery, LockKeyhole, Search, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppData } from "@/hooks/use-app-data";
import { roomLabel } from "@/data/rooms";
import { DetailDrawer, DetailGrid, MetricStrip, ModuleFrame, Panel, StatePill, Timeline, dateLabel } from "./shared";

const makers = ["Yale", "August", "Schlage", "Kwikset", "TTLock", "Salto"];
const models = ["Assure 2", "Wi-Fi Smart Lock", "Encode Plus", "Halo Touch", "Pro V3", "XS4 One"];

export function SmartLocksView() {
  const { model: m } = useAppData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const devices = useMemo(() => m.locks.map((lock, index) => {
    const room = m.by.room.get(lock.roomId);
    const property = m.by.property.get(lock.propertyId);
    return {
      ...lock,
      manufacturer: makers[index % makers.length],
      model: models[index % models.length],
      roomName: room ? roomLabel(room) : lock.roomId,
      propertyName: property?.name ?? lock.propertyId,
      capabilities: index % 2 ? ["PIN support · illustrative", "Activity log · illustrative"] : ["Remote status · illustrative", "Auto-lock · illustrative"],
    };
  }), [m]);
  const selected = devices.find((lock) => lock.id === selectedId);
  const filtered = devices.filter((lock) => [lock.id, lock.roomName, lock.propertyName, lock.manufacturer, lock.model].some((value) => value.toLowerCase().includes(query.toLowerCase())));
  const connected = devices.filter((lock) => lock.status === "Online").length;
  const offline = devices.filter((lock) => lock.status === "Offline").length;
  const attention = devices.filter((lock) => lock.status === "Offline" || lock.battery <= 20).length;

  const simulate = (action: string) => {
    toast(`${action} demonstration`, { description: "Simulation only — no lock or door was operated." });
  };

  return (
    <ModuleFrame title="Smart locks" description="Illustrative device inventory and connection health across your properties.">
      <MetricStrip items={[
        { label: "Total locks", value: devices.length, detail: "Illustrative inventory" },
        { label: "Connected", value: connected, detail: "Simulated connection state" },
        { label: "Offline", value: offline, detail: "No real devices are queried" },
        { label: "Requiring attention", value: attention, detail: "Offline or low illustrative battery" },
      ]} />
      <Panel title="Device inventory" detail={`${filtered.length} illustrative locks · manufacturer integrations and capabilities are unverified`}>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative w-full max-w-sm">
            <Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lock, property or manufacturer" aria-label="Search locks" className="pl-9" />
          </div>
          <p className="text-meta">Yale, August, Schlage, Kwikset, TTLock and Salto are examples only.</p>
        </div>
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Lock</TableHead><TableHead>Manufacturer / model</TableHead><TableHead className="hidden lg:table-cell">Property / unit</TableHead><TableHead>Connection</TableHead><TableHead className="hidden md:table-cell">Last activity</TableHead><TableHead className="hidden xl:table-cell">Capabilities</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.slice(0, 30).map((lock) => (
              <TableRow key={lock.id} className="cursor-pointer" onClick={() => setSelectedId(lock.id)}>
                <TableCell><button type="button" className="text-left"><span className="block text-label">{lock.id}</span><span className="text-meta">{lock.roomName}</span></button></TableCell>
                <TableCell><span className="block text-body">{lock.manufacturer}</span><span className="text-meta">{lock.model}</span></TableCell>
                <TableCell className="hidden lg:table-cell"><span className="block text-body">{lock.propertyName}</span><span className="text-meta">{lock.roomName}</span></TableCell>
                <TableCell><div className="flex items-center gap-2"><StatePill value={lock.status} />{lock.battery <= 20 && <span className="text-meta text-brown-ink">Low battery</span>}</div></TableCell>
                <TableCell className="hidden md:table-cell">{dateLabel(lock.lastSeen)} · {lock.lastSeen.slice(11, 16)}</TableCell>
                <TableCell className="hidden max-w-52 truncate text-meta xl:table-cell">{lock.capabilities.join(" · ")}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No illustrative locks match this search.</TableCell></TableRow>}
          </TableBody>
        </Table>
        {filtered.length > 30 && <p className="border-t border-border px-4 py-3 text-meta">Showing 30 of {filtered.length} locks. Search to narrow the inventory.</p>}
      </Panel>
      <DetailDrawer open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)} title={selected?.id ?? "Lock details"} description="Illustrative device record · capabilities and connection are not verified">
        {selected && <>
          <DetailGrid items={[
            { label: "Manufacturer", value: selected.manufacturer },
            { label: "Model", value: selected.model },
            { label: "Property", value: selected.propertyName },
            { label: "Room / unit", value: selected.roomName },
            { label: "Connection", value: <StatePill value={selected.status} /> },
            { label: "Battery estimate", value: <span className="inline-flex items-center gap-1"><Battery className="size-4" />{selected.battery}% · illustrative</span> },
          ]} />
          <section><h3 className="mb-3 text-card-title">Supported capabilities</h3><ul className="space-y-2">{selected.capabilities.map((capability) => <li key={capability} className="rounded-lg border border-border px-3 py-2 text-body">{capability}</li>)}</ul><p className="mt-2 text-meta">Illustrative only. No manufacturer integration is connected or verified.</p></section>
          <section><h3 className="mb-3 text-card-title">Connection history</h3><Timeline items={[
            { title: selected.status === "Online" ? "Simulated connection check" : "Simulated connection lost", detail: selected.status === "Online" ? "Device reported as connected in sample data." : "Sample data marks this device offline.", time: `${dateLabel(selected.lastSeen)} · ${selected.lastSeen.slice(11, 16)}` },
            { title: "Inventory record created", detail: "Device record is part of the local demonstration dataset.", time: "17 Nov 2026 · 08:00" },
          ]} /></section>
          <section><h3 className="mb-3 text-card-title">Recent activity</h3><Timeline items={[
            { title: "Illustrative status event", detail: `${selected.status} state shown from seeded sample data; no device was queried.`, time: `${dateLabel(selected.lastSeen)} · ${selected.lastSeen.slice(11, 16)}` },
            { title: "Device record viewed", detail: "Local prototype activity only.", time: "17 Nov 2026 · 09:42" },
          ]} /></section>
          <section><h3 className="mb-1 text-card-title">Demonstration controls</h3><p className="mb-3 text-meta">These controls only add a local simulation notice; they cannot operate a door.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={selected.status !== "Online"} onClick={() => simulate("Lock") }><LockKeyhole /> Simulate lock</Button>
              <Button variant="outline" disabled={selected.status !== "Online"} onClick={() => simulate("Unlock")}><Wifi /> Simulate unlock</Button>
              <Button variant="ghost" size="sm" onClick={() => simulate("Connection refresh")}><WifiOff /> Simulate refresh</Button>
            </div>
          </section>
        </>}
      </DetailDrawer>
    </ModuleFrame>
  );
}
