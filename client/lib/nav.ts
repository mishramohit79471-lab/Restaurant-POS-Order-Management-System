import { BarChart3, BookOpen, Users, ChefHat, Receipt, LayoutDashboard, ShoppingCart, type LucideIcon } from "lucide-react";
import type { Role } from "./types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[]; // omit = visible to everyone
}

// Entries are added phase by phase as each page ships, so every link works.
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "POS Terminal", icon: ShoppingCart },
  { href: "/orders", label: "Live Orders", icon: ChefHat },
  { href: "/menu", label: "Menu", icon: BookOpen },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["admin"] },
  { href: "/users", label: "Users & Roles", icon: Users, roles: ["admin"] },
];
