import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/order-management.ts", import.meta.url), "utf8");
const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const order = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

test("order numbers include a normalized customer account and stable sequence", () => {
  const date = new Date("2026-09-24T12:00:00.000Z");
  assert.equal(order.formatOrderNumber(" ac-102 / west ", 3, date), "TM-AC102WEST-260924-03");
});

test("order number normalization never exposes punctuation", () => {
  assert.equal(order.normalizeAccountSegment("../../<script>"), "SCRIPT");
  assert.equal(order.normalizeAccountSegment(""), "ACCOUNT");
});

test("PDF filenames use the actual safe order number", () => {
  assert.equal(order.safePdfFilename("TM-AC 12/01"), "TaylorMetal_Order_TM-AC-12-01.pdf");
});

test("order API updates an existing ID instead of inserting a duplicate", async () => {
  const route = await readFile(new URL("../app/api/orders/route.ts", import.meta.url), "utf8");
  assert.match(route, /if\s*\(input\.id\)/);
  assert.match(route, /UPDATE orders SET/);
  assert.match(route, /WHERE id = \?5/);
  assert.match(route, /const id = crypto\.randomUUID\(\)/);
  assert.match(route, /WHERE customer_account = \?1 COLLATE NOCASE/);
  assert.match(route, /ownerAccount/);
});

test("browser drafts persist complete payloads, update in place, and stay account-scoped", async () => {
  const managementUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`;
  const storePath = path.resolve(import.meta.dirname, "../app/browser-order-store.ts");
  const storeSource = await readFile(storePath, "utf8");
  const storeJavascript = ts.transpileModule(storeSource, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: storePath,
  }).outputText.replace('from "./order-management"', `from "${managementUrl}"`);
  const store = await import(`data:text/javascript;base64,${Buffer.from(storeJavascript).toString("base64")}`);
  const values = new Map();
  globalThis.window = { localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } };

  const payload = {
    customer: "Taylor Customer", customerAccount: "AC-100", jobName: "North Roof", projectNotes: "Keep dry",
    panels: [{ panelId: "tuff-rib", gauge: "29 ga", color: "Glacier White", lengths: [{ feet: 20, inches: 6, qty: 8 }] }],
    accessoryQty: { A1: 3 }, flashingQty: { Eave: 4 }, delivery: "Will call", willCallBranch: "Salem",
  };
  const created = store.saveBrowserOrder({ customerAccount: "AC-100", status: "draft", payload });
  assert.equal(store.listBrowserOrders("OTHER").length, 0);
  assert.deepEqual(store.listBrowserOrders("ac100")[0].payload, payload);

  const updatedPayload = { ...payload, jobName: "North Roof Updated", accessoryQty: { A1: 5 } };
  const updated = store.saveBrowserOrder({ id: created.id, ownerAccount: "AC-100", customerAccount: "AC-100", status: "draft", payload: updatedPayload });
  assert.equal(updated.id, created.id);
  assert.equal(updated.orderNumber, created.orderNumber);
  assert.equal(updated.revision, 2);
  assert.equal(store.listBrowserOrders("AC-100").length, 1);
  assert.deepEqual(store.listBrowserOrders("AC-100")[0].payload, updatedPayload);
});

test("draft persistence saves the full configurable state", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /Draft saved successfully\./);
  for (const field of ["panels", "accessoryQty", "flashingQty", "flashingPitchMode", "customerAccount", "projectNotes", "delivery"]) {
    assert.match(page, new RegExp(`buildDraftPayload[\\s\\S]*${field}`), `draft payload must include ${field}`);
  }
});
