import { cn } from "@/lib/utils";
import type { GuestStatus, PaymentStatus, PropertyStatus, ReservationStatus, RoomState } from "@/types";

const base = "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-label";

const reservation: Record<ReservationStatus, string> = {
  Confirmed: "bg-sage/45 text-charcoal",
  Pending: "bg-lime/45 text-charcoal",
  "Checked In": "bg-charcoal text-background",
  "Checked Out": "bg-muted text-muted-foreground",
  Cancelled: "bg-brown/12 text-brown-ink line-through decoration-brown-ink/60",
};

/** Restrained palette for dense lists: the strong charcoal "Checked In" becomes a soft mint tint. */
const reservationSubtle: Record<ReservationStatus, string> = {
  ...reservation,
  "Checked In": "bg-mint/55 text-charcoal",
};

export function ReservationStatusBadge({ status, className, subtle }: { status: ReservationStatus; className?: string; subtle?: boolean }) {
  return (
    <span className={cn(base, (subtle ? reservationSubtle : reservation)[status], subtle && "h-[22px] px-2 text-[12px] leading-none", className)}>{status}</span>
  );
}

const payment: Record<PaymentStatus, string> = {
  Paid: "bg-olive-deep",
  Partial: "bg-lime ring-1 ring-charcoal/40",
  Unpaid: "bg-border-strong ring-1 ring-muted-foreground/60",
  Refunded: "bg-brown-ink",
};

/** Dot plus text so the state never depends on colour. */
export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-body">
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", payment[status])} />
      {status}
    </span>
  );
}

const roomState: Record<RoomState, string> = {
  Available: "bg-mint/60 text-charcoal",
  Occupied: "bg-charcoal text-background",
  Reserved: "bg-lime/45 text-charcoal",
  Maintenance: "bg-brown/12 text-brown-ink",
};

export function RoomStateBadge({ state }: { state: RoomState }) {
  return <span className={cn(base, roomState[state])}>{state}</span>;
}

const propertyStatus: Record<PropertyStatus, string> = {
  Active: "bg-mint/60 text-charcoal",
  Onboarding: "bg-lime/45 text-charcoal",
  Archived: "bg-muted text-muted-foreground",
};

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return <span className={cn(base, propertyStatus[status])}>{status}</span>;
}

const guestStatus: Record<GuestStatus, string> = {
  Standard: "bg-muted text-muted-foreground",
  VIP: "bg-lime/55 text-charcoal",
  Blocked: "bg-brown/12 text-brown-ink",
};

export function GuestStatusBadge({ status }: { status: GuestStatus }) {
  return <span className={cn(base, guestStatus[status])}>{status}</span>;
}
