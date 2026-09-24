import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
});
