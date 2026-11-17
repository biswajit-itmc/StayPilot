"use client";

import { useState, type FormEvent } from "react";
import { Play, Plus, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { initialAutomationExecutions, initialAutomationRules, type AutomationDemoExecution, type AutomationRule } from "@/data/smart-operations";
import { DetailDrawer, DetailGrid, MetricStrip, ModuleFrame, Panel, StatePill, Timeline } from "./shared";

const emptyRule: AutomationRule = { id: "", name: "", trigger: "", conditions: "", action: "", enabled: true, lastExecuted: "Never" };

export function AutomationView() {
  const [rules, setRules] = useState(initialAutomationRules);
  const [executions, setExecutions] = useState<AutomationDemoExecution[]>(initialAutomationExecutions);
  const [selected, setSelected] = useState<AutomationRule | null>(null);
  const [editing, setEditing] = useState<AutomationRule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<AutomationRule>(emptyRule);
  const enabled = rules.filter((rule) => rule.enabled).length;
  const selectedHistory = selected ? executions.filter((execution) => execution.ruleId === selected.id) : [];

  const createRule = () => {
    setEditing(null);
    setDraft({ ...emptyRule });
    setDialogOpen(true);
  };
  const editRule = (rule: AutomationRule) => {
    setEditing(rule);
    setDraft({ ...rule });
    setDialogOpen(true);
  };
  const saveRule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editing) {
      setRules((items) => items.map((item) => item.id === editing.id ? { ...draft } : item));
      setSelected((item) => item?.id === editing.id ? { ...draft } : item);
      toast.success("Rule updated", { description: "Changes are stored in this local simulation only." });
    } else {
      const rule = { ...draft, id: `AUT-${String(Date.now()).slice(-4)}`, lastExecuted: "Never" };
      setRules((items) => [rule, ...items]);
      toast.success("Rule created (simulated)", { description: "This prototype will not run a connected automation." });
    }
    setDialogOpen(false);
  };
  const simulate = (rule: AutomationRule) => {
    const execution: AutomationDemoExecution = {
      ruleId: rule.id,
      title: rule.trigger,
      detail: `${rule.action}. No external service or hardware was contacted.`,
      time: "17 Nov 2026 · just now",
      outcome: "Simulated · completed",
    };
    setExecutions((items) => [execution, ...items]);
    setRules((items) => items.map((item) => item.id === rule.id ? { ...item, lastExecuted: "Just now" } : item));
    setSelected((item) => item?.id === rule.id ? { ...item, lastExecuted: "Just now" } : item);
    toast("Workflow simulated", { description: "Local execution history updated; no action was performed externally." });
  };

  return (
    <ModuleFrame title="Automation" description="Review local rules for reservation, access and guest communication workflows.">
      <MetricStrip items={[
        { label: "Rules", value: rules.length, detail: "Local rule definitions" },
        { label: "Enabled", value: enabled, detail: "Not connected to an event source" },
        { label: "Executions", value: executions.length, detail: "Prototype history only" },
        { label: "External actions", value: "None", detail: "No APIs or services connected" },
      ]} />
      <Panel title="Automation rules" detail="Each run is a local demonstration; rules do not listen to live reservations." action={<Button variant="accent" onClick={createRule}><Plus /> Create rule</Button>}>
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Rule</TableHead><TableHead className="hidden lg:table-cell">Trigger / conditions</TableHead><TableHead className="hidden xl:table-cell">Action</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Last executed</TableHead><TableHead className="w-40">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{rules.map((rule) => <TableRow key={rule.id} className="cursor-pointer" onClick={() => setSelected(rule)}>
            <TableCell><button type="button" className="flex items-start gap-2 text-left"><Workflow className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span><span className="block text-label">{rule.name}</span><span className="text-meta">{rule.id}</span></span></button></TableCell>
            <TableCell className="hidden max-w-64 lg:table-cell"><span className="block text-body">{rule.trigger}</span><span className="block truncate text-meta">{rule.conditions}</span></TableCell>
            <TableCell className="hidden max-w-64 truncate text-body xl:table-cell">{rule.action}</TableCell>
            <TableCell><StatePill value={rule.enabled ? "Active" : "Disabled"} /></TableCell>
            <TableCell className="hidden text-body md:table-cell">{rule.lastExecuted}</TableCell>
            <TableCell onClick={(event) => event.stopPropagation()}><div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setRules((items) => items.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item))}>{rule.enabled ? "Disable" : "Enable"}</Button>
              <Button variant="ghost" size="icon-sm" disabled={!rule.enabled} aria-label={`Simulate ${rule.name}`} onClick={() => simulate(rule)}><Play /></Button>
            </div></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </Panel>
      <Panel title="Execution history" detail="Recent outcomes are labeled simulated and were not delivered to devices or guests.">
        <div className="divide-y divide-border">
          {executions.slice(0, 8).map((execution, index) => <button key={`${execution.ruleId}-${index}`} type="button" className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 sm:px-5" onClick={() => {
            const rule = rules.find((item) => item.id === execution.ruleId);
            if (rule) setSelected(rule);
          }}>
            <span className="min-w-0"><span className="block text-label">{execution.title}</span><span className="block truncate text-meta">{execution.detail}</span></span>
            <span className="flex shrink-0 items-center gap-3"><StatePill value={execution.outcome} /><span className="text-meta">{execution.time}</span></span>
          </button>)}
        </div>
      </Panel>
      <DetailDrawer open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title={selected?.name ?? "Rule details"} description={selected ? `${selected.id} · execution is simulated locally` : undefined}>
        {selected && <>
          <DetailGrid items={[
            { label: "Trigger", value: selected.trigger },
            { label: "Conditions", value: selected.conditions },
            { label: "Action", value: selected.action },
            { label: "Status", value: <StatePill value={selected.enabled ? "Active" : "Disabled"} /> },
            { label: "Last executed", value: selected.lastExecuted },
          ]} />
          <section><h3 className="mb-3 text-card-title">Execution details</h3>{selectedHistory.length ? <Timeline items={selectedHistory.map((item) => ({ title: item.outcome, detail: item.detail, time: item.time }))} /> : <p className="rounded-lg border border-dashed border-border p-4 text-body text-muted-foreground">No execution recorded for this rule. Use “Simulate” to add a local example.</p>}</section>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => editRule(selected)}>Edit rule</Button><Button disabled={!selected.enabled} onClick={() => simulate(selected)}><Play /> Simulate run</Button></div>
        </>}
      </DetailDrawer>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit automation rule" : "Create automation rule"}</DialogTitle><DialogDescription>Rules are saved locally and never run against live bookings, devices, or messaging services.</DialogDescription></DialogHeader>
          <form onSubmit={saveRule} className="space-y-4">
            {([
              ["name", "Rule name"],
              ["trigger", "Trigger"],
              ["conditions", "Conditions"],
              ["action", "Action"],
            ] as const).map(([field, label]) => <label key={field} className="block space-y-1.5"><span className="text-label">{label}</span><Input value={draft[field]} onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} required /></label>)}
            <label className="flex items-center gap-2 text-body"><input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.checked }))} /> Enabled in local prototype</label>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">{editing ? "Save changes" : "Create simulated rule"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ModuleFrame>
  );
}
