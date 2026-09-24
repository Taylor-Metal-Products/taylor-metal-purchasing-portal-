import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const workerPath = path.join(root, "dist", "server", "index.js");
const hostingPath = path.join(root, "dist", ".openai", "hosting.json");

const hosting = JSON.parse(await readFile(hostingPath, "utf8"));
const workerSource = await readFile(workerPath, "utf8");
if (!/export\s*\{[^}]*default/u.test(workerSource) && !/export\s+default/u.test(workerSource)) {
  throw new Error("dist/server/index.js must have an ESM default export");
}
if (hosting.d1 && !workerSource.includes("cloudflare:workers")) {
  throw new Error("D1 is configured but the Worker does not include the Cloudflare runtime binding");
}

console.log("Validated Sites artifact: ESM Worker, hosting manifest, and configured runtime bindings are present.");
