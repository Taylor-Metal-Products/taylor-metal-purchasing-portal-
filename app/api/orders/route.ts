import { env } from "cloudflare:workers";
import { formatOrderNumber, type OrderStatus, type StoredOrder } from "../../order-management";

export const runtime = "edge";

type OrderRow = {
  id: string;
  order_number: string;
  customer_account: string;
  status: OrderStatus;
  payload_json: string;
  revision: number;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
};

type SaveRequest = {
  id?: string;
  customerAccount?: string;
  status?: OrderStatus;
  payload?: Record<string, unknown>;
};

function database() {
  const db = env.DB;
  if (!db) throw new Error("Order database is not configured");
  return db;
}

async function ensureSchema() {
  await database().prepare(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_account TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted')),
    payload_json TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    submitted_at TEXT
  )`).run();
  await database().prepare("CREATE INDEX IF NOT EXISTS orders_updated_at_idx ON orders(updated_at DESC)").run();
  await database().prepare("CREATE INDEX IF NOT EXISTS orders_customer_account_idx ON orders(customer_account)").run();
}

function serialize(row: OrderRow): StoredOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerAccount: row.customer_account,
    status: row.status,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    payload: JSON.parse(row.payload_json) as Record<string, unknown>,
  };
}

export async function GET(request: Request) {
  try {
    await ensureSchema();
    const id = new URL(request.url).searchParams.get("id");
    if (id) {
      const row = await database().prepare("SELECT * FROM orders WHERE id = ?1").bind(id).first<OrderRow>();
      return row ? Response.json(serialize(row)) : new Response("Order not found", { status: 404 });
    }
    const result = await database().prepare("SELECT * FROM orders ORDER BY updated_at DESC LIMIT 100").all<OrderRow>();
    return Response.json(result.results.map(serialize));
  } catch (error) {
    console.error(error);
    return new Response("Unable to load orders", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const input = await request.json() as SaveRequest;
    const account = String(input.customerAccount ?? "").trim();
    if (!account) return new Response("Customer account is required before an order number can be assigned", { status: 400 });
    const status: OrderStatus = input.status === "submitted" ? "submitted" : "draft";
    const now = new Date().toISOString();
    const payloadJson = JSON.stringify(input.payload ?? {});

    if (input.id) {
      const existing = await database().prepare("SELECT * FROM orders WHERE id = ?1").bind(input.id).first<OrderRow>();
      if (!existing) return new Response("Order not found", { status: 404 });
      await database().prepare(`UPDATE orders SET customer_account = ?1, status = ?2, payload_json = ?3,
        revision = revision + 1, updated_at = ?4, submitted_at = CASE WHEN ?2 = 'submitted' THEN ?4 ELSE submitted_at END
        WHERE id = ?5`).bind(account, status, payloadJson, now, input.id).run();
      const updated = await database().prepare("SELECT * FROM orders WHERE id = ?1").bind(input.id).first<OrderRow>();
      return Response.json(serialize(updated!));
    }

    const id = crypto.randomUUID();
    let sequence = 1;
    let orderNumber = formatOrderNumber(account, sequence);
    while (await database().prepare("SELECT 1 AS found FROM orders WHERE order_number = ?1").bind(orderNumber).first()) {
      sequence += 1;
      orderNumber = formatOrderNumber(account, sequence);
    }
    await database().prepare(`INSERT INTO orders
      (id, order_number, customer_account, status, payload_json, revision, created_at, updated_at, submitted_at)
      VALUES (?1, ?2, ?3, ?4, ?5, 1, ?6, ?6, ?7)`)
      .bind(id, orderNumber, account, status, payloadJson, now, status === "submitted" ? now : null).run();
    const created = await database().prepare("SELECT * FROM orders WHERE id = ?1").bind(id).first<OrderRow>();
    return Response.json(serialize(created!), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response("Unable to save order", { status: 500 });
  }
}
