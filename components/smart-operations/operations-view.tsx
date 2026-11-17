"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/shared/simple-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { initialOperationTasks, type OperationTask } from "@/data/smart-operations";
import { useAppData } from "@/hooks/use-app-data";
import { roomLabel } from "@/data/rooms";
import { Button } from "@/components/ui/button";
import { DetailDrawer, DetailGrid, MetricStrip, ModuleFrame, Panel, StatePill } from "./shared";

const taskStatuses: OperationTask["status"][] = ["Pending", "In progress", "Completed", "Requires attention"];

export function OperationsView() {
  const { model: m } = useAppData();
  const [tasks, setTasks] = useState(() => {
    const offline = m.locks.find((lock) => lock.status === "Offline");
    const room = offline ? m.by.room.get(offline.roomId) : undefined;
    const mapping = m.reservations.find((reservation) => reservation.mappingIssue) ?? m.reservations[0];
    return initialOperationTasks.map((task) => {
      if (task.id === "OPS-401" && offline) {
        return { ...task, propertyId: offline.propertyId, related: `${room ? roomLabel(room) : offline.roomId} · ${offline.id}` };
      }
      if ((task.id === "OPS-402" || task.id === "OPS-405") && mapping) {
        return { ...task, propertyId: mapping.propertyId, related: `Reservation ${mapping.id} · ${mapping.checkIn}` };
      }
      return task;
    });
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<OperationTask | null>(null);
  const updateStatus = (id: string, value: string) => {
    const status = taskStatuses.find((item) => item === value);
    if (!status) return;
    setTasks((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    setSelected((item) => item?.id === id ? { ...item, status } : item);
    toast.success("Task status updated", { description: `${id} · ${status} (local prototype state)` });
  };
  const visible = useMemo(() => tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (propertyFilter !== "all" && task.propertyId !== propertyFilter) return false;
    const property = m.by.property.get(task.propertyId)?.name ?? "";
    return `${task.title} ${task.id} ${task.assignee} ${task.related} ${property}`.toLowerCase().includes(query.toLowerCase());
  }), [tasks, statusFilter, propertyFilter, query, m]);
  const propertyOptions = [{ value: "all", label: "All properties" }, ...m.properties.filter((property) => property.status === "Active").map((property) => ({ value: property.id, label: property.name }))];

  return (
    <ModuleFrame title="Tasks & operations" description="Prioritize property work, assign ownership and track resolution across the portfolio.">
      <MetricStrip items={[
        { label: "Pending", value: tasks.filter((task) => task.status === "Pending").length },
        { label: "In progress", value: tasks.filter((task) => task.status === "In progress").length },
        { label: "Completed", value: tasks.filter((task) => task.status === "Completed").length },
        { label: "Requires attention", value: tasks.filter((task) => task.status === "Requires attention").length, detail: "Review urgent exceptions first" },
      ]} />
      <Panel title="Operations task list" detail={`${visible.length} of ${tasks.length} tasks · status changes are stored in frontend state`}>
        <div className="flex flex-wrap gap-3 border-b border-border p-4">
          <div className="relative min-w-56 flex-1 sm:max-w-sm"><Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search task, staff or reference" aria-label="Search operational tasks" className="pl-9" /></div>
          <SimpleSelect label="Status" value={statusFilter} onChange={setStatusFilter} className="w-full sm:w-48" options={[{ value: "all", label: "All statuses" }, ...taskStatuses.map((status) => ({ value: status, label: status }))]} />
          <SimpleSelect label="Property" value={propertyFilter} onChange={setPropertyFilter} className="w-full sm:w-56" options={propertyOptions} />
          {(query || statusFilter !== "all" || propertyFilter !== "all") && <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setStatusFilter("all"); setPropertyFilter("all"); }}>Clear filters</Button>}
        </div>
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Task</TableHead><TableHead>Priority</TableHead><TableHead className="hidden lg:table-cell">Assigned to</TableHead><TableHead className="hidden md:table-cell">Due</TableHead><TableHead className="hidden xl:table-cell">Property / related</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{visible.map((task) => {
            const property = m.by.property.get(task.propertyId);
            return <TableRow key={task.id} className="cursor-pointer" onClick={() => setSelected(task)}>
              <TableCell><button type="button" className="text-left"><span className="block text-label">{task.title}</span><span className="text-meta">{task.id}</span></button></TableCell>
              <TableCell><StatePill value={task.priority} /></TableCell>
              <TableCell className="hidden text-body lg:table-cell">{task.assignee}</TableCell>
              <TableCell className="hidden text-body md:table-cell">{task.due}</TableCell>
              <TableCell className="hidden xl:table-cell"><span className="block text-body">{property?.name ?? task.propertyId}</span><span className="text-meta">{task.related}</span></TableCell>
              <TableCell onClick={(event) => event.stopPropagation()}><SimpleSelect label={`Status for ${task.title}`} value={task.status} onChange={(value) => updateStatus(task.id, value)} className="min-w-40" options={taskStatuses.map((status) => ({ value: status, label: status }))} /></TableCell>
            </TableRow>;
          })}
          {visible.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No tasks match these filters.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Panel>
      <DetailDrawer open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title={selected?.title ?? "Task details"} description={selected ? `${selected.id} · operational task simulation` : undefined}>
        {selected && <>
          <DetailGrid items={[
            { label: "Priority", value: <StatePill value={selected.priority} /> },
            { label: "Status", value: <StatePill value={selected.status} /> },
            { label: "Assigned staff", value: selected.assignee },
            { label: "Due date", value: selected.due },
            { label: "Property", value: m.by.property.get(selected.propertyId)?.name ?? selected.propertyId },
            { label: "Related reference", value: selected.related },
          ]} />
          <section className="space-y-2"><h3 className="text-card-title">Update task status</h3><SimpleSelect label="Task status" value={selected.status} onChange={(value) => updateStatus(selected.id, value)} options={taskStatuses.map((status) => ({ value: status, label: status }))} /></section>
          <p className="rounded-lg border border-border bg-muted/40 p-3 text-body text-muted-foreground">Changes update only this frontend prototype. No external operations system is connected.</p>
        </>}
      </DetailDrawer>
    </ModuleFrame>
  );
}
