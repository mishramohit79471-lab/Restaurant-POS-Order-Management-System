export type Role = "admin" | "staff";
export type OrderStatus = "pending" | "preparing" | "ready" | "completed";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface DashboardData {
  today: { revenue: number; orders: number; averageOrderValue: number };
  sales: { date: string; revenue: number; orders: number }[];
  popularDishes: { name: string; quantity: number; revenue: number }[];
  recentOrders: {
    id: string;
    orderNumber: number;
    type: "dine-in" | "takeaway";
    tableNumber?: string;
    total: number;
    status: OrderStatus;
    itemCount: number;
    createdAt: string;
  }[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  available: boolean;
}

export interface CartLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Quote {
  subtotal: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
}

export type OrderType = "dine-in" | "takeaway";

export interface BoardOrder {
  id: string;
  orderNumber: number;
  type: OrderType;
  tableNumber?: string;
  customerName?: string;
  items: { name: string; quantity: number }[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = "cash" | "upi";
export type DiscountType = "none" | "percent" | "amount";

export interface Bill {
  id: string;
  orderNumber: number;
  type: OrderType;
  tableNumber?: string;
  customerName?: string;
  items: { name: string; price: number; quantity: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  taxRate: number;
  status: OrderStatus;
  paymentStatus: "paid" | "unpaid";
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  amountTendered?: number;
  changeGiven?: number;
  upiReference?: string;
  createdAt: string;
}

export interface ReceiptData {
  order: Bill;
  restaurantName: string;
  address: string;
}

export interface BillQuote {
  subtotal: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
  change?: number;
}

export interface SalesReport {
  range: { from: string; to: string; days: number };
  totals: {
    orders: number;
    revenue: number;
    discount: number;
    tax: number;
    averageOrderValue: number;
    cash: { orders: number; revenue: number };
    upi: { orders: number; revenue: number };
    unpaid: { orders: number; amount: number };
  };
  days: { date: string; orders: number; revenue: number; discount: number; tax: number }[];
  topItems: { name: string; quantity: number; revenue: number }[];
}

export interface ManagedUser extends User {
  active: boolean;
  createdAt: string;
}
