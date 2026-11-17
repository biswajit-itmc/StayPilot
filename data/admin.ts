export const STAFF_ROLES = ["Super Admin", "Property Manager", "Operations", "Maintenance"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
export type StaffStatus = "Active" | "Inactive" | "Invited";

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  propertyIds: string[];
  status: StaffStatus;
  lastActive: string;
};

export const initialStaffUsers: StaffUser[] = [
  { id: "USR-001", name: "Sofia Almeida", email: "sofia.almeida@staypilot.example", role: "Super Admin", propertyIds: ["prp_harbor", "prp_alma", "prp_north", "prp_sea"], status: "Active", lastActive: "Today · 09:42" },
  { id: "USR-002", name: "Inês Carvalho", email: "ines.carvalho@staypilot.example", role: "Property Manager", propertyIds: ["prp_north", "prp_alfama"], status: "Active", lastActive: "Today · 08:55" },
  { id: "USR-003", name: "Miguel Duarte", email: "miguel.duarte@staypilot.example", role: "Property Manager", propertyIds: ["prp_alma"], status: "Active", lastActive: "Yesterday · 17:20" },
  { id: "USR-004", name: "Rui Matos", email: "rui.matos@staypilot.example", role: "Operations", propertyIds: ["prp_harbor", "prp_sea"], status: "Active", lastActive: "Today · 07:46" },
  { id: "USR-005", name: "João Pereira", email: "joao.pereira@staypilot.example", role: "Maintenance", propertyIds: ["prp_harbor", "prp_north"], status: "Active", lastActive: "Yesterday · 15:10" },
  { id: "USR-006", name: "Helena Costa", email: "helena.costa@staypilot.example", role: "Operations", propertyIds: ["prp_sea"], status: "Inactive", lastActive: "10 Nov · 12:31" },
  { id: "USR-007", name: "Daniel Weber", email: "daniel.weber@staypilot.example", role: "Maintenance", propertyIds: ["prp_alma"], status: "Invited", lastActive: "Never" },
];
