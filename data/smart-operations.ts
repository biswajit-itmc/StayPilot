export type AutomationRule = {
  id: string;
  name: string;
  trigger: string;
  conditions: string;
  action: string;
  enabled: boolean;
  lastExecuted: string;
};

export const initialAutomationRules: AutomationRule[] = [
  { id: "AUT-001", name: "Prepare access after confirmation", trigger: "Reservation confirmed", conditions: "Reservation has a mapped room", action: "Create a simulated access task", enabled: true, lastExecuted: "Today, 09:18" },
  { id: "AUT-002", name: "Prepare arrival instructions", trigger: "24 hours before check-in", conditions: "Guest email is available", action: "Prepare guest instructions for review", enabled: true, lastExecuted: "Today, 08:42" },
  { id: "AUT-003", name: "Activate arrival access", trigger: "Check-in time reached", conditions: "Access task is prepared", action: "Mark simulated access task active", enabled: true, lastExecuted: "Yesterday, 16:00" },
  { id: "AUT-004", name: "Flag cancelled access", trigger: "Reservation cancelled", conditions: "An access task exists", action: "Flag simulated task for revocation", enabled: false, lastExecuted: "12 Nov, 11:24" },
  { id: "AUT-005", name: "Expire checkout access", trigger: "Checkout completed", conditions: "Reservation is checked out", action: "Mark simulated access task expired", enabled: true, lastExecuted: "Yesterday, 11:02" },
];

export type AutomationDemoExecution = {
  ruleId: string;
  title: string;
  detail: string;
  time: string;
  outcome: string;
};

export const initialAutomationExecutions: AutomationDemoExecution[] = [
  { ruleId: "AUT-001", title: "Reservation confirmed", detail: "Sample reservation · local access task preview created.", time: "Today, 09:18", outcome: "Simulated · completed" },
  { ruleId: "AUT-002", title: "Pre-arrival preparation", detail: "Guest instructions prepared for staff review; nothing was sent.", time: "Today, 08:42", outcome: "Simulated · completed" },
  { ruleId: "AUT-004", title: "Cancellation review", detail: "Access task flagged for staff review; no credential was revoked.", time: "12 Nov, 11:24", outcome: "Simulated · flagged" },
];

export type MessageTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  timing: string;
};

export const initialMessageTemplates: MessageTemplate[] = [
  { id: "booking", name: "Booking confirmation", subject: "Your stay is confirmed — {{property}}", body: "Hello {{guest}},\n\nYour stay at {{property}} is confirmed for {{checkIn}} to {{checkOut}}. Your reservation reference is {{reservation}}.\n\nWe look forward to welcoming you.", timing: "After booking" },
  { id: "pre-arrival", name: "Pre-arrival", subject: "Getting ready for your stay", body: "Hello {{guest}},\n\nWe are looking forward to your arrival at {{property}} on {{checkIn}}. Check-in begins at {{checkInTime}}.\n\nPlease reply if you have any questions.", timing: "24 hours before arrival" },
  { id: "check-in", name: "Check-in instructions", subject: "Your arrival information", body: "Hello {{guest}},\n\nYour room at {{property}} is {{unit}}. These arrival details are for planning only; please confirm them with the property team.\n\nWe look forward to seeing you.", timing: "On check-in day" },
  { id: "access", name: "Access instructions", subject: "Access information for your stay", body: "Hello {{guest}},\n\nYour host will confirm entry arrangements before arrival. Do not rely on this prototype for door access or credentials.\n\nReservation: {{reservation}}", timing: "After staff review" },
  { id: "checkout", name: "Checkout reminder", subject: "A reminder for checkout", body: "Hello {{guest}},\n\nWe hope you have enjoyed your stay at {{property}}. Checkout is by {{checkOutTime}} on {{checkOut}}.\n\nThank you for staying with us.", timing: "Evening before checkout" },
];

export type OperationTask = {
  id: string;
  title: string;
  priority: "Urgent" | "High" | "Normal";
  assignee: string;
  due: string;
  propertyId: string;
  status: "Pending" | "In progress" | "Completed" | "Requires attention";
  related: string;
};

export const initialOperationTasks: OperationTask[] = [
  { id: "OPS-401", title: "Check offline lock", priority: "Urgent", assignee: "Miguel Duarte", due: "Today · 10:30", propertyId: "prp_harbor", status: "Requires attention", related: "Room 207 · LCK-HH-207" },
  { id: "OPS-402", title: "Review reservation mapping", priority: "High", assignee: "Inês Carvalho", due: "Today · 12:00", propertyId: "prp_north", status: "Pending", related: "Reservation mapping queue" },
  { id: "OPS-403", title: "Review pending access task", priority: "High", assignee: "Sofia Almeida", due: "Today · 13:30", propertyId: "prp_harbor", status: "In progress", related: "Today's arrivals" },
  { id: "OPS-404", title: "Verify guest instructions", priority: "Normal", assignee: "Rui Matos", due: "Today · 15:00", propertyId: "prp_sea", status: "Pending", related: "Pre-arrival messages" },
  { id: "OPS-405", title: "Resolve booking conflict", priority: "Urgent", assignee: "Inês Carvalho", due: "Today · 11:15", propertyId: "prp_north", status: "Requires attention", related: "Reservation RSV-24186" },
  { id: "OPS-406", title: "Confirm room turnover", priority: "Normal", assignee: "Sofia Almeida", due: "Tomorrow · 11:00", propertyId: "prp_harbor", status: "Pending", related: "Room 304" },
  { id: "OPS-407", title: "Review access window", priority: "Normal", assignee: "Miguel Duarte", due: "Tomorrow · 14:00", propertyId: "prp_alma", status: "Completed", related: "Villa C · guest arrival" },
];
