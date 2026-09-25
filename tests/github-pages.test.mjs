import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

test("GitHub Pages has a standalone entry point and deployment workflow", () => {
  assert.ok(existsSync(path.join(root, "index.html")));
  assert.ok(existsSync(path.join(root, "app", "client-main.tsx")));
  const config = readFileSync(path.join(root, "vite.pages.config.ts"), "utf8");
  assert.match(config, /base:\s*["']\/taylor-metal-purchasing-portal-\/["']/);
  const workflow = readFileSync(path.join(root, ".github", "workflows", "deploy-pages.yml"), "utf8");
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /npm run test:pages/);
});

test("standalone order persistence does not require the server API", () => {
  const source = readFileSync(path.join(root, "app", "browser-order-store.ts"), "utf8");
  assert.match(source, /localStorage/);
  assert.match(source, /VITE_ORDER_API_BASE_URL/);
  assert.doesNotMatch(readFileSync(path.join(root, "app", "page.tsx"), "utf8"), /fetch\(["']\/api\/orders/);
});
