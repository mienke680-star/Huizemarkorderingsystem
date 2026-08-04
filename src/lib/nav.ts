import type { Role } from "@/lib/constants";
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  ClipboardList,
  CheckSquare,
  Route,
  Package,
  Users,
  Truck,
  BarChart3,
  FileBarChart,
  Bell,
  UserCog,
  Settings,
  ScrollText,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
};

const ALL: Role[] = ["AGENT", "MIENKE", "MJ", "NADIA", "CHANTAL", "ADMIN"];
const MANAGERS_AND_ADMIN: Role[] = ["MIENKE", "MJ", "NADIA", "CHANTAL", "ADMIN"];

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ALL },
  { label: "New Order", href: "/orders/new", icon: PlusCircle, roles: ["AGENT", "ADMIN"] },
  { label: "My Orders", href: "/orders/mine", icon: ListOrdered, roles: ["AGENT"] },
  { label: "All Orders", href: "/orders", icon: ClipboardList, roles: MANAGERS_AND_ADMIN },
  { label: "Approvals", href: "/approvals", icon: CheckSquare, roles: MANAGERS_AND_ADMIN },
  { label: "Order Tracking", href: "/tracking", icon: Route, roles: ALL },
  { label: "Products", href: "/products", icon: Package, roles: ALL },
  { label: "Agents", href: "/agents", icon: Users, roles: MANAGERS_AND_ADMIN },
  { label: "Suppliers", href: "/suppliers", icon: Truck, roles: MANAGERS_AND_ADMIN },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: MANAGERS_AND_ADMIN },
  { label: "Reports", href: "/reports", icon: FileBarChart, roles: MANAGERS_AND_ADMIN },
  { label: "Notifications", href: "/notifications", icon: Bell, roles: ALL },
  { label: "User Management", href: "/admin/users", icon: UserCog, roles: ["ADMIN"] },
  { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText, roles: ["ADMIN"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ALL },
];

export function navForRole(role: Role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
