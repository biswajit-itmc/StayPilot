"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/shared/simple-select";
import { PageHeader } from "@/components/layout/page-header";
import { useAppData } from "@/hooks/use-app-data";
import { Panel } from "@/components/smart-operations/shared";

type SettingsGroup = "general" | "property" | "schedule" | "notifications" | "automation" | "user" | "appearance";
type PreferenceValues = {
  workspaceName: string;
  timezone: string;
  currency: string;
  defaultProperty: string;
  guestLocale: string;
  defaultCheckIn: string;
  defaultCheckOut: string;
  turnaroundMinutes: string;
  earlyCheckInReview: boolean;
  reservationUpdates: boolean;
  accessExceptions: boolean;
  offlineLockAlerts: boolean;
  weeklySummary: boolean;
  reviewAccessTasks: boolean;
  prepareInstructions: boolean;
  flagCancellation: boolean;
  userName: string;
  userEmail: string;
  dateFormat: string;
  weekStarts: string;
  appearance: string;
  compactTables: boolean;
  reducedMotion: boolean;
};

const GROUPS: { id: SettingsGroup; label: string; detail: string }[] = [
  { id: "general", label: "General Settings", detail: "Workspace name, timezone and currency" },
  { id: "property", label: "Property Preferences", detail: "Default property and guest locale" },
  { id: "schedule", label: "Check-in / Check-out Rules", detail: "Arrival, departure and turnover defaults" },
  { id: "notifications", label: "Notification Preferences", detail: "Which demo alerts are shown" },
  { id: "automation", label: "Automation Preferences", detail: "Local workflow review defaults" },
  { id: "user", label: "User Preferences", detail: "Personal display and date preferences" },
  { id: "appearance", label: "Appearance", detail: "Theme preference and visual density" },
];

const initialValues: PreferenceValues = {
  workspaceName: "StayPilot Demo",
  timezone: "Europe/Lisbon",
  currency: "EUR",
  defaultProperty: "prp_harbor",
  guestLocale: "en-PT",
  defaultCheckIn: "15:00",
  defaultCheckOut: "11:00",
  turnaroundMinutes: "60",
  earlyCheckInReview: true,
  reservationUpdates: true,
  accessExceptions: true,
  offlineLockAlerts: true,
  weeklySummary: false,
  reviewAccessTasks: true,
  prepareInstructions: true,
  flagCancellation: true,
  userName: "Sofia Almeida",
  userEmail: "sofia.almeida@staypilot.example",
  dateFormat: "d MMM yyyy",
  weekStarts: "Monday",
  appearance: "Light",
  compactTables: false,
  reducedMotion: false,
};

function PreferenceToggle({ id, label, description, checked, onChange }: { id: string; label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label htmlFor={id} className="flex items-start gap-3 rounded-xl border border-border p-3.5"><input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 size-4 accent-[var(--olive-deep)]" /><span><span className="block text-label">{label}</span><span className="mt-0.5 block text-meta">{description}</span></span></label>;
}

export function SettingsView() {
  const { model: m, actions } = useAppData();
  const [values, setValues] = useState(initialValues);
  const [activeGroup, setActiveGroup] = useState<SettingsGroup>("general");
  const [savedGroups, setSavedGroups] = useState<SettingsGroup[]>([]);
  const selected = GROUPS.find((group) => group.id === activeGroup)!;
  const activeProperties = m.properties.filter((property) => property.status === "Active");
  const update = <K extends keyof PreferenceValues>(key: K, value: PreferenceValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setSavedGroups((current) => current.filter((group) => group !== activeGroup));
  };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavedGroups((current) => current.includes(activeGroup) ? current : [...current, activeGroup]);
    actions.log(activeProperties[0]?.id ?? m.properties[0].id, "housekeeping", `${selected.label} saved in local prototype settings.`);
    toast.success(`${selected.label} saved`, { description: "Preference state is local to this prototype; no account or system setting was changed." });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure workspace and personal preferences for this demonstration." />
      <p className="rounded-xl border border-border bg-surface px-4 py-3 text-body text-muted-foreground"><strong className="font-semibold text-charcoal">Local preferences only.</strong> Settings are held in frontend state for this session and do not change external services or connected systems.</p>
      <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-2 lg:sticky lg:top-20 lg:flex-col">
          {GROUPS.map((group) => <button key={group.id} type="button" aria-current={activeGroup === group.id ? "page" : undefined} onClick={() => setActiveGroup(group.id)} className={`min-w-max rounded-lg px-3 py-2 text-left transition-colors lg:w-full ${activeGroup === group.id ? "bg-accent text-charcoal" : "text-muted-foreground hover:bg-muted hover:text-charcoal"}`}><span className="block text-label">{group.label}</span><span className="hidden text-meta lg:block">{group.detail}</span></button>)}
        </nav>
        <Panel title={selected.label} detail={selected.detail}>
          <form onSubmit={save} className="space-y-5 p-4 sm:p-6">
            {activeGroup === "general" && <>
              <label className="block space-y-1.5"><span className="text-label">Workspace name</span><Input value={values.workspaceName} onChange={(event) => update("workspaceName", event.target.value)} required /></label>
              <label className="block space-y-1.5"><span className="text-label">Timezone</span><select className="h-9 w-full rounded-lg border border-input bg-surface px-3 text-body" value={values.timezone} onChange={(event) => update("timezone", event.target.value)}><option value="Europe/Lisbon">Europe/Lisbon</option><option value="Europe/London">Europe/London</option><option value="UTC">UTC</option><option value="America/New_York">America/New_York</option></select></label>
              <label className="block space-y-1.5"><span className="text-label">Currency</span><SimpleSelect label="Currency" value={values.currency} onChange={(value) => update("currency", value)} options={["EUR", "USD", "GBP"].map((currency) => ({ value: currency, label: currency }))} /></label>
            </>}
            {activeGroup === "property" && <>
              <label className="block space-y-1.5"><span className="text-label">Default property</span><SimpleSelect label="Default property" value={values.defaultProperty} onChange={(value) => update("defaultProperty", value)} options={activeProperties.map((property) => ({ value: property.id, label: property.name }))} /></label>
              <label className="block space-y-1.5"><span className="text-label">Guest communication locale</span><select className="h-9 w-full rounded-lg border border-input bg-surface px-3 text-body" value={values.guestLocale} onChange={(event) => update("guestLocale", event.target.value)}><option value="en-PT">English · Portugal</option><option value="pt-PT">Português · Portugal</option><option value="en-GB">English · United Kingdom</option></select></label>
              <p className="text-meta">The locale selector is an illustrative preference; it does not translate templates automatically.</p>
            </>}
            {activeGroup === "schedule" && <>
              <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-1.5"><span className="text-label">Default check-in</span><Input type="time" value={values.defaultCheckIn} onChange={(event) => update("defaultCheckIn", event.target.value)} required /></label><label className="block space-y-1.5"><span className="text-label">Default check-out</span><Input type="time" value={values.defaultCheckOut} onChange={(event) => update("defaultCheckOut", event.target.value)} required /></label></div>
              <label className="block space-y-1.5"><span className="text-label">Turnaround buffer (minutes)</span><Input type="number" min="0" max="720" value={values.turnaroundMinutes} onChange={(event) => update("turnaroundMinutes", event.target.value)} required /></label>
              <PreferenceToggle id="early-arrival" label="Route early check-in requests for review" description="Records a local preference; it does not approve or notify anyone." checked={values.earlyCheckInReview} onChange={(checked) => update("earlyCheckInReview", checked)} />
            </>}
            {activeGroup === "notifications" && <div className="space-y-3">
              <PreferenceToggle id="reservation-updates" label="Reservation updates" description="Show a demo notification when a reservation changes." checked={values.reservationUpdates} onChange={(checked) => update("reservationUpdates", checked)} />
              <PreferenceToggle id="access-exceptions" label="Access task exceptions" description="Show local alerts for failed or pending sample access tasks." checked={values.accessExceptions} onChange={(checked) => update("accessExceptions", checked)} />
              <PreferenceToggle id="offline-lock-alerts" label="Offline lock indicators" description="Show seeded offline status in the prototype." checked={values.offlineLockAlerts} onChange={(checked) => update("offlineLockAlerts", checked)} />
              <PreferenceToggle id="weekly-summary" label="Weekly summary preview" description="Store a preference only; no email summary will be sent." checked={values.weeklySummary} onChange={(checked) => update("weeklySummary", checked)} />
            </div>}
            {activeGroup === "automation" && <div className="space-y-3">
              <PreferenceToggle id="prepare-access" label="Suggest an access task after booking" description="A local workflow preference; no credentials or device action are created." checked={values.reviewAccessTasks} onChange={(checked) => update("reviewAccessTasks", checked)} />
              <PreferenceToggle id="prepare-instructions" label="Prepare guest instructions for review" description="Does not generate or send a guest message." checked={values.prepareInstructions} onChange={(checked) => update("prepareInstructions", checked)} />
              <PreferenceToggle id="flag-cancellation" label="Flag cancelled access tasks" description="Creates no revocation request; staff review is only represented in demo state." checked={values.flagCancellation} onChange={(checked) => update("flagCancellation", checked)} />
            </div>}
            {activeGroup === "user" && <>
              <label className="block space-y-1.5"><span className="text-label">Display name</span><Input value={values.userName} onChange={(event) => update("userName", event.target.value)} required /></label>
              <label className="block space-y-1.5"><span className="text-label">Email</span><Input type="email" value={values.userEmail} onChange={(event) => update("userEmail", event.target.value)} required /></label>
              <label className="block space-y-1.5"><span className="text-label">Date format</span><SimpleSelect label="Date format" value={values.dateFormat} onChange={(value) => update("dateFormat", value)} options={["d MMM yyyy", "MMM d, yyyy", "yyyy-MM-dd"].map((format) => ({ value: format, label: format }))} /></label>
              <label className="block space-y-1.5"><span className="text-label">Week starts on</span><SimpleSelect label="Week starts on" value={values.weekStarts} onChange={(value) => update("weekStarts", value)} options={["Monday", "Sunday"].map((day) => ({ value: day, label: day }))} /></label>
            </>}
            {activeGroup === "appearance" && <>
              <label className="block space-y-1.5"><span className="text-label">Theme preference</span><SimpleSelect label="Theme preference" value={values.appearance} onChange={(value) => update("appearance", value)} options={["Light", "Dark", "System"].map((theme) => ({ value: theme, label: theme }))} /></label>
              <PreferenceToggle id="compact-tables" label="Compact tables" description="Saved as a display preference; current tables keep the established spacing." checked={values.compactTables} onChange={(checked) => update("compactTables", checked)} />
              <PreferenceToggle id="reduced-motion" label="Reduced motion preference" description="Stores your preference; this prototype uses only minimal transitions." checked={values.reducedMotion} onChange={(checked) => update("reducedMotion", checked)} />
              <p className="text-meta">The demo shell currently renders in its light theme regardless of the saved preference.</p>
            </>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-meta">{savedGroups.includes(activeGroup) ? "Saved in this session" : "Unsaved changes are held locally."}</p>
              <Button type="submit" variant="accent">Save {selected.label.toLowerCase()}</Button>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}
