import { z } from "zod";

/** Form validation rules shared by the add/edit dialogs. Messages are written for the person filling the form. */

const required = (what: string) => z.string().trim().min(1, `${what} is required`);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use the 24-hour format, e.g. 15:00");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date");

export const propertySchema = z.object({
  name: required("Property name").max(60, "Keep the name under 60 characters"),
  type: z.enum(["Hotel", "Villas", "Apartments", "Boutique hotel", "Guesthouse"]),
  status: z.enum(["Active", "Onboarding", "Archived"]),
  city: required("City"),
  address: required("Address"),
  manager: required("Manager"),
  phone: z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email address"),
  checkInTime: time,
  checkOutTime: time,
  description: z.string().trim().max(240, "Keep the description under 240 characters"),
});
export type PropertyInput = z.infer<typeof propertySchema>;

export const roomSchema = z.object({
  propertyId: required("Property"),
  number: required("Unit number or name").max(12, "Keep it under 12 characters"),
  type: required("Room type"),
  capacity: z.number({ message: "Enter a number" }).int("Whole guests only").min(1, "At least 1 guest").max(20, "At most 20 guests"),
  nightlyRate: z.number({ message: "Enter a rate" }).min(1, "Enter a rate above 0").max(5000, "That rate looks too high"),
  status: z.enum(["Active", "Maintenance"]),
  notes: z.string().trim().max(200, "Keep notes under 200 characters").optional(),
  assignLock: z.boolean(),
});
export type RoomInput = z.infer<typeof roomSchema>;

export const guestSchema = z.object({
  name: required("Full name").max(60),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number"),
  country: required("Country"),
  language: required("Language"),
  status: z.enum(["Standard", "VIP", "Blocked"]),
});
export type GuestInput = z.infer<typeof guestSchema>;

export const noteSchema = z.object({ text: z.string().trim().min(3, "Write at least a few words").max(400, "Keep notes under 400 characters") });

export const messageSchema = z.object({
  channel: z.enum(["Email", "SMS", "WhatsApp"]),
  subject: required("Subject").max(80),
  body: z.string().trim().min(5, "Write a short message").max(600),
});
export type MessageInput = z.infer<typeof messageSchema>;

export const reservationBase = z.object({
  guestId: z.string(),
  newGuestName: z.string().trim(),
  newGuestEmail: z.string().trim(),
  propertyId: required("Property"),
  roomId: required("Unit"),
  checkIn: date,
  checkOut: date,
  adults: z.number({ message: "Enter a number" }).int("Whole guests only").min(1, "At least 1 guest"),
  source: z.enum(["Direct", "Booking.com", "Airbnb", "Expedia", "Corporate"]),
  status: z.enum(["Confirmed", "Pending", "Checked In", "Checked Out", "Cancelled"]),
  paymentStatus: z.enum(["Paid", "Partial", "Unpaid", "Refunded"]),
  total: z.number({ message: "Enter an amount" }).min(0, "The total cannot be negative").max(100000, "That total looks too high"),
  notes: z.string().trim().max(300, "Keep notes under 300 characters").optional(),
});
export type ReservationFormValues = z.infer<typeof reservationBase>;

export const cancelSchema = z.object({
  reason: required("Reason"),
  refund: z.boolean(),
});
