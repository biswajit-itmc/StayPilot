import {
  BarChart3,
  BedDouble,
  Building2,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  History,
  KeyRound,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Settings,
  UserCog,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export type NavGroup = { label: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Today at a glance across your portfolio." }],
  },
  {
    label: "Property management",
    items: [
      { label: "Properties", href: "/properties", icon: Building2, description: "Hotels, villas and rentals you manage." },
      { label: "Rooms & Units", href: "/rooms", icon: BedDouble, description: "Inventory, status and housekeeping." },
    ],
  },
  {
    label: "Booking management",
    items: [
      { label: "Reservations", href: "/reservations", icon: CalendarDays, description: "Bookings, arrivals and departures." },
      { label: "Calendar", href: "/calendar", icon: CalendarRange, description: "Every stay on one timeline." },
      { label: "Guests", href: "/guests", icon: Users, description: "Guest profiles and stay history." },
    ],
  },
  {
    label: "Smart operations",
    items: [
      { label: "Smart Locks", href: "/smart-locks", icon: Lock, description: "Lock health, battery and connectivity." },
      { label: "Access Codes", href: "/access-codes", icon: KeyRound, description: "Guest and staff access windows." },
      { label: "Automation", href: "/automation", icon: Workflow, description: "Rules that run guest journeys for you." },
      { label: "Communications", href: "/communications", icon: MessageSquare, description: "Guest messages and templates." },
      { label: "Tasks & Operations", href: "/operations", icon: ClipboardList, description: "Tasks, turnovers and maintenance." },
    ],
  },
  {
    label: "Insights",
    items: [{ label: "Reports & Analytics", href: "/reports", icon: BarChart3, description: "Revenue, occupancy and performance." }],
  },
  {
    label: "Administration",
    items: [
      { label: "Users & Roles", href: "/users", icon: UserCog, description: "Staff accounts and permissions." },
      { label: "Settings", href: "/settings", icon: Settings, description: "Workspace and notification preferences." },
      { label: "Audit Logs", href: "/audit-logs", icon: History, description: "Local history of user and system simulation events." },
    ],
  },
];

export const allNavItems = navGroups.flatMap((g) => g.items);

export function findNavItem(pathname: string) {
  return allNavItems.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
}

export function findNavGroup(pathname: string) {
  return navGroups.find((g) => g.items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/")));
}
