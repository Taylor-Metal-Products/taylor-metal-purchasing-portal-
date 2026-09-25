import { formatOrderNumber, normalizeAccountSegment, type OrderStatus, type StoredOrder } from "./order-management";

const STORAGE_KEY = "taylor-metal-purchasing-portal.orders.v1";

function readOrders<T>(): StoredOrder<T>[] {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) throw new Error("Saved order storage is not in the expected format.");
    return parsed.filter((order): order is StoredOrder<T> => Boolean(
      order && typeof order === "object" &&
      typeof (order as StoredOrder<T>).id === "string" &&
      typeof (order as StoredOrder<T>).customerAccount === "string" &&
      typeof (order as StoredOrder<T>).updatedAt === "string" &&
      (order as StoredOrder<T>).payload && typeof (order as StoredOrder<T>).payload === "object"
    ));
  } catch (error) {
    throw new Error("Saved orders could not be read from this browser.", { cause: error });
  }
}

function writeOrders<T>(orders: StoredOrder<T>[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function listBrowserOrders<T>(customerAccount: string) {
  const owner = normalizeAccountSegment(customerAccount);
  return readOrders<T>()
    .filter(order => normalizeAccountSegment(order.customerAccount) === owner)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveBrowserOrder<T>(input: { id?: string; ownerAccount?: string; customerAccount: string; status: OrderStatus; payload: T }) {
  const orders = readOrders<T>();
  const now = new Date().toISOString();
  const existingIndex = input.id ? orders.findIndex(order => order.id === input.id && (
    !input.ownerAccount || normalizeAccountSegment(order.customerAccount) === normalizeAccountSegment(input.ownerAccount)
  )) : -1;

  if (input.id && existingIndex < 0) throw new Error("The saved draft could not be found for this customer account.");

  if (existingIndex >= 0) {
    const existing = orders[existingIndex];
    const updated: StoredOrder<T> = {
      ...existing,
      customerAccount: input.customerAccount,
      status: input.status,
      revision: existing.revision + 1,
      updatedAt: now,
      submittedAt: input.status === "submitted" ? now : existing.submittedAt,
      payload: input.payload,
    };
    orders[existingIndex] = updated;
    writeOrders(orders);
    return updated;
  }

  let sequence = 1;
  let orderNumber = formatOrderNumber(input.customerAccount, sequence);
  while (orders.some(order => order.orderNumber === orderNumber)) {
    sequence += 1;
    orderNumber = formatOrderNumber(input.customerAccount, sequence);
  }
  const created: StoredOrder<T> = {
    id: crypto.randomUUID(),
    orderNumber,
    customerAccount: input.customerAccount,
    status: input.status,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    submittedAt: input.status === "submitted" ? now : null,
    payload: input.payload,
  };
  orders.push(created);
  writeOrders(orders);
  return created;
}

export async function listOrders<T>(customerAccount: string) {
  const account = customerAccount.trim();
  if (!account) throw new Error("Enter your customer account number before loading orders.");
  const apiBase = import.meta.env.VITE_ORDER_API_BASE_URL?.replace(/\/$/, "");
  if (!apiBase) return listBrowserOrders<T>(account);
  const response = await fetch(`${apiBase}/orders?customerAccount=${encodeURIComponent(account)}`, { cache: "no-store" });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<StoredOrder<T>[]>;
}

export async function saveOrder<T>(input: { id?: string; ownerAccount?: string; customerAccount: string; status: OrderStatus; payload: T }) {
  const apiBase = import.meta.env.VITE_ORDER_API_BASE_URL?.replace(/\/$/, "");
  if (!apiBase) return saveBrowserOrder(input);
  const response = await fetch(`${apiBase}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<StoredOrder<T>>;
}
