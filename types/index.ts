export type PropertyId = string;

export type PropertyType = "Hotel" | "Villas" | "Apartments" | "Boutique hotel" | "Guesthouse";
export type PropertyStatus = "Active" | "Onboarding" | "Archived";

export type Property = {
  id: PropertyId;
  code: string;
  name: string;
  type: PropertyType;
  status: PropertyStatus;
  city: string;
  address: string;
  manager: string;
  phone: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  description: string;
  image?: string;
};

export type RoomStatus = "Active" | "Maintenance";
/** What a unit is doing right now, derived from reservations and the stored status. */
export type RoomState = "Available" | "Occupied" | "Reserved" | "Maintenance";

export type Room = {
  id: string; // e.g. HH-305
  propertyId: PropertyId;
  number: string;
  type: string;
  capacity: number;
  nightlyRate: number;
  status: RoomStatus;
  notes?: string;
};

export type GuestStatus = "Standard" | "VIP" | "Blocked";

export type Guest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  language: string;
  status: GuestStatus;
  createdAt: string; // yyyy-MM-dd
};

export type GuestNote = { id: string; guestId: string; text: string; author: string; at: string };

export type MessageChannel = "Email" | "SMS" | "WhatsApp";
export type GuestMessage = {
  id: string;
  guestId: string;
  reservationId?: string;
  channel: MessageChannel;
  direction: "Outbound" | "Inbound";
  subject: string;
  body: string;
  at: string; // yyyy-MM-ddTHH:mm
};

export type BookingSource = "Direct" | "Booking.com" | "Airbnb" | "Expedia" | "Corporate";
export type ReservationStatus = "Confirmed" | "Pending" | "Checked In" | "Checked Out" | "Cancelled";
export type PaymentStatus = "Paid" | "Partial" | "Unpaid" | "Refunded";

export type Reservation = {
  id: string; // RSV-24817
  guestId: string;
  roomId: string;
  propertyId: PropertyId;
  checkIn: string; // yyyy-MM-dd
  checkOut: string;
  checkInTime: string; // HH:mm
  checkOutTime: string;
  adults: number;
  source: BookingSource;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string; // yyyy-MM-dd
  cancelledAt?: string;
  notes?: string;
  /** OTA booking that could not be matched to a StayPilot unit */
  mappingIssue?: boolean;
  instructionsSent: boolean;
};

export type LockStatus = "Online" | "Offline";

export type Lock = {
  id: string; // LCK-HH-305
  roomId: string;
  propertyId: PropertyId;
  status: LockStatus;
  battery: number;
  lastSeen: string; // yyyy-MM-ddTHH:mm
};

export type AccessTaskStatus = "Completed" | "Pending" | "Failed" | "Scheduled";

export type AccessTask = {
  id: string;
  reservationId: string;
  roomId: string;
  propertyId: PropertyId;
  kind: "Prepare access window" | "Revoke access window";
  status: AccessTaskStatus;
  createdAt: string;
  failureReason?: string;
};

export type AccessStatus = "Ready" | "Pending" | "Failed" | "Instructions not sent";

export type QueueSeverity = "high" | "medium" | "low";
export type QueueKind = "lock-offline" | "access-pending" | "access-failed" | "instructions" | "mapping";

export type QueueItem = {
  id: string;
  kind: QueueKind;
  severity: QueueSeverity;
  title: string;
  detail: string;
  propertyId: PropertyId;
  reservationId?: string;
  lockId?: string;
  taskId?: string;
  action: string;
};

export type ActivityItem = {
  id: string;
  at: string; // yyyy-MM-ddTHH:mm
  propertyId: PropertyId;
  kind: "booking" | "access" | "lock" | "message" | "housekeeping" | "checkin";
  text: string;
  actor: string;
};

export type AppNotification = {
  id: string;
  title: string;
  detail: string;
  at: string;
  href: string;
  read: boolean;
};
