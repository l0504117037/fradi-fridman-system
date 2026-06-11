export interface Payment {
  amount: number;
  date: string;
}

export interface Product {
  _id: string;
  type: string;
  price: number;
  quantity: number;
  warrantyTime: number;
}

export interface Wig {
  _id: string;
  code?: string;
  name: string;
  color?: string;
  size?: string;
  price: number;
  quantity: number;
  warrantyTime: number;
  supplier?: Supplier | string;
}

export interface ServiceItem {
  _id: string;
  name: string;
  price: number;
  duration?: number;
  description?: string;
}

export interface SupplierTransaction {
  _id?: string;
  type: "purchase" | "return" | "payment";
  amount: number;
  date: string;
  note?: string;
}

export interface SupplierSummary {
  totalPurchased: number;
  totalReturned: number;
  totalPaid: number;
  balance: number;
}

export interface Supplier {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  transactions: SupplierTransaction[];
  summary?: SupplierSummary;
}

export interface Customer {
  _id: string;
  firstname: string;
  lastname: string;
  phone: string;
  mail: string;
}

export interface HistoryItem {
  kind: "purchase" | "service";
  _id: string;
  date: string;
  paid: number;
  balance: number;
  payments: Payment[];
  // purchase-only fields
  itemType?: "Product" | "Wig";
  item?: Product | Wig;
  totalPrice?: number;
  warrantyEnd?: string;
  // service-only fields
  service?: ServiceItem;
  price?: number;
  note?: string;
}

export interface CustomerHistory {
  customer: Customer;
  history: HistoryItem[];
}

export type AppointmentStatus = "scheduled" | "done" | "cancelled" | "no-show";
export type ActionKind = "purchase" | "service";

export interface Appointment {
  _id: string;
  customer: Customer;
  date: string;
  time: string;
  status: AppointmentStatus;
  note?: string;
  actionKind: ActionKind;
  actionId: string;
  actionLabel: string;
  actionPrice: number;
}

// בקשה ליצירת תור + פעולה (רכישה/שירות) חדשה ללקוחה
export interface CreateAppointmentInput {
  customer: string;
  date: string;
  time: string;
  note?: string;
  status?: AppointmentStatus;
  actionKind: ActionKind;
  // לפעולת רכישה
  itemType?: "Product" | "Wig";
  itemId?: string;
  totalPrice?: number;
  // לפעולת שירות
  serviceId?: string;
  price?: number;
  // משותף
  payment?: { amount: number; date?: string };
}
