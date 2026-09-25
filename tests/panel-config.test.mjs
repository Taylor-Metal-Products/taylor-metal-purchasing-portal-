import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const configPath = path.join(root, "app", "panel-config.ts");
const source = readFileSync(configPath, "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  fileName: configPath,
}).outputText;
const config = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

test("every panel configuration is internally valid", () => {
  const allowedMaterials = new Set(["armortech", "kynar500", "kynar500-aluminum"]);
  assert.ok(config.panelProfiles.length > 0);
  for (const profile of config.panelProfiles) {
    assert.ok(profile.id && profile.name, "panel ID and name are required");
    assert.ok(profile.coverages.length > 0, `${profile.name} needs coverage`);
    assert.ok(profile.materials.length > 0, `${profile.name} needs material availability`);
    for (const material of profile.materials) {
      assert.ok(allowedMaterials.has(material.id), `${profile.name} has an unknown material`);
      assert.ok(material.gauges.length > 0, `${profile.name}/${material.id} needs a gauge`);
      if (material.id === "armortech") assert.deepEqual(material.gauges, ["26 ga"]);
      if (material.id === "kynar500-aluminum") assert.deepEqual(material.gauges, [".032″ Aluminum"]);
      for (const gauge of material.gauges) {
        const colors = config.getPanelColors(profile, material.id, gauge);
        assert.ok(colors.length > 0, `${profile.name}/${material.id}/${gauge} needs colors`);
        assert.equal(new Set(colors).size, colors.length, `${profile.name} has duplicate colors`);
      }
    }
  }
});

test("panel options never broaden beyond the selected profile", () => {
  for (const profile of config.panelProfiles) {
    for (const material of profile.materials) {
      assert.deepEqual(config.getGaugeOptions(profile, material.id), material.gauges);
      assert.equal(config.getMaterialAvailability(profile, material.id).id, material.id);
    }
  }
});

test("product terminology is normalized for legacy values", () => {
  assert.equal(config.normalizeProductTerminology("Armortech"), "ArmorTech™");
  assert.equal(config.normalizeProductTerminology("versa span"), "Versa-Span™");
  assert.equal(config.normalizeProductTerminology("Zincalume"), "ZINCALUME®");
  assert.equal(config.normalizeProductTerminology("Zincalume Plus"), "ZINCALUME® Plus");
  assert.equal(config.normalizeProductTerminology("galvalume"), "Galvalume®");
  assert.equal(config.normalizeProductTerminology("Marion R Panel"), "Marion “R” Panel™");
  assert.equal(config.normalizeProductTerminology("Board and Batten"), "Board and Batten Siding Panel");
  assert.equal(config.normalizeProductTerminology("SmoothWall / Soffit / ShadowLine"), "SmoothWall™ / Lifetime Soffit™ / ShadowLine™");
  assert.equal(config.normalizeProductTerminology("Contour"), "Contour Classic Series™");
  assert.equal(config.normalizeProductTerminology("Kynar"), "Kynar 500®");
  assert.equal(config.normalizeProductTerminology("Kynar 500"), "Kynar 500®");
  assert.equal(config.normalizeProductTerminology("Kynar 500 PVDF"), "Kynar 500®");
  assert.equal(config.normalizeProductTerminology("ArmorTech™ / Kynar 500®"), "ArmorTech™ / Kynar 500®");
});

test("configured display names match the official product catalog", () => {
  const expected = new Map([
    ["streamline", "StreamLine™"], ["slim-lock", "Slim-Lock™"], ["ms-150", "MS-150™"],
    ["board-and-batten", "Board and Batten Siding Panel"], ["tuff-rib", "Tuff Rib"], ["t-3", "T-3™"],
    ["pbr", "PBR"], ["marion-r-panel", "Marion “R” Panel™"], ["hr-34", "HR-34™"],
    ["gr-7", "GR-7™"], ["max-corr", "Max Corr™"], ["classic-7-8-corrugated", "Classic 7/8″ Corrugated™"],
    ["two-and-a-half-corrugated", "2-1/2″ Corrugated"], ["easy-lock", "Easy-Lock™"],
    ["ms-100", "MS-100™"], ["ms-200", "MS-200™"], ["versa-span", "Versa-Span™"],
    ["smoothwall-soffit-shadowline", "SmoothWall™ / Lifetime Soffit™ / ShadowLine™"],
    ["contour", "Contour Classic Series™"], ["flat-sheet", "Flat Sheet"],
  ]);
  for (const profile of config.panelProfiles) assert.equal(profile.name, expected.get(profile.id), profile.id);
});

test("configured panel previews use existing local assets", () => {
  for (const [panelId, image] of Object.entries(config.panelImageCatalog)) {
    assert.ok(config.panelProfiles.some((profile) => profile.id === panelId), `${panelId} is not a configured panel`);
    assert.ok(image.src.startsWith("/panel-profiles/"), `${panelId} must use a local panel asset`);
    assert.ok(existsSync(path.join(root, "public", image.src.replace(/^\//, ""))), `${panelId} asset is missing: ${image.src}`);
    assert.match(image.sourceUrl, /^https:\/\/taylormetal\.com\//, `${panelId} source URL is not Taylor Metal`);
  }
});

test("panel edit controls reuse mapped panel previews with readable text", () => {
  const pageSource = readFileSync(path.join(root, "app", "page.tsx"), "utf8");
  const styleSource = readFileSync(path.join(root, "app", "globals.css"), "utf8");
  assert.match(pageSource, /function PanelQueueThumbnail/);
  assert.match(pageSource, /panelImageCatalog\[panelId\]/);
  assert.match(pageSource, /<PanelQueueThumbnail panel=\{item\}\/>/);
  assert.match(styleSource, /\.panelQueueCopy strong\{color:#173f5d/);
  assert.match(styleSource, /\.panelQueueThumbnail img\{[^}]*object-fit:contain/);
});

test("deprecated catalog notices are absent from the portal interface", () => {
  const pageSource = readFileSync(path.join(root, "app", "page.tsx"), "utf8");
  assert.doesNotMatch(pageSource, /Official Taylor Metal profile image/i);
  assert.doesNotMatch(pageSource, /Purchasing Portal[^\n]*Catalog rules/i);
  assert.doesNotMatch(pageSource, /June\/August 2026/i);
  assert.doesNotMatch(pageSource, /12\s*in[^\n]*Kynar[^\n]*Contour[^\n]*excluded/i);
});

test("portal background uses the responsive roof-plan blueprint underlay", () => {
  const styleSource = readFileSync(path.join(root, "app", "globals.css"), "utf8");
  const blueprintSource = readFileSync(path.join(root, "public", "roof-blueprint.svg"), "utf8");
  assert.match(styleSource, /url\('\/roof-blueprint\.svg'\)/);
  assert.match(styleSource, /background:url\('\/roof-blueprint\.svg'\) center 35%\/cover no-repeat;opacity:\.12/);
  assert.match(styleSource, /filter:contrast\(\.85\) brightness\(1\.05\)/);
  assert.doesNotMatch(blueprintSource, /<text\b/i);
  assert.doesNotMatch(blueprintSource, /ROOF PLAN|RIDGE|VALLEY|EAVE|GENERAL ROOF NOTES/i);
});

test("generated outputs use the shared terminology normalizer", () => {
  for (const relative of ["app/api/order-pdf/route.ts", "app/api/order-excel/route.ts", "app/client-pdf.ts"]) {
    const outputSource = readFileSync(path.join(root, relative), "utf8");
    assert.match(outputSource, /normalizeProductTerminology/);
  }
});
