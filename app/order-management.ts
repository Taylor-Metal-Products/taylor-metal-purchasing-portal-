export type OrderStatus = "draft" | "submitted";

export type StoredOrder<T = Record<string, unknown>> = {
  id: string;
  orderNumber: string;
  customerAccount: string;
  status: OrderStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  payload: T;
};

export function normalizeAccountSegment(account: string) {
  const normalized = account.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  return normalized || "ACCOUNT";
}

export function orderDateSegment(date = new Date()) {
  return date.toISOString().slice(2, 10).replaceAll("-", "");
}

export function formatOrderNumber(account: string, sequence: number, date = new Date()) {
  return `TM-${normalizeAccountSegment(account)}-${orderDateSegment(date)}-${String(sequence).padStart(2, "0")}`;
}

export function safePdfFilename(orderNumber: string) {
  return `TaylorMetal_Order_${orderNumber.replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf`;
}
