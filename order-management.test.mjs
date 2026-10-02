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

test("custom flashing drawings and sketches are retained with the order and PDF", async () => {
  const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const pdfSource = await readFile(new URL("../app/client-pdf.ts", import.meta.url), "utf8");
  const cssSource = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
    assert.match(pageSource, /type HemType = "closed" \| "open-1\/8"/);
    assert.match(pageSource, /type HemSide = "left" \| "right"/);
    assert.match(pageSource, /type HemConfig = \{ type:HemType; side:HemSide \}/);
    assert.match(pageSource, /type HemControlId = "first" \| "second"/);
    assert.match(pageSource, /type FlashingSegment = \{ length:number; direction:number; hem\?:HemType\|HemConfig; startHem\?:HemType\|HemConfig \}/);
    assert.match(pageSource, /type CustomFlashingRequest = \{ description:string; attachment\?:\{name:string;dataUrl:string\}; sketchDataUrl\?:string; drawingDataUrl\?:string; segments\?:FlashingSegment\[\]; paintSide\?:HemSide \}/);
  assert.match(pageSource, /function handleCustomFlashingAttachment\(file\?:File\)/);
  assert.match(pageSource, /accept="image\/png,image\/jpeg"/);
  assert.match(pageSource, /<CustomFlashingSketch segments=\{customFlashing\.segments\}/);
    assert.match(pageSource, /paintSide=\{customFlashing\.paintSide\}/);
    assert.match(pageSource, /onPaintSideChange=\{paintSide=>setCustomFlashing/);
    assert.match(pageSource, /onExportDrawing=\{exportCustomFlashingDrawing\}/);
    assert.match(pageSource, /const points=current\.reduce\(.*\[\{x:0,y:0\}\]/s);
    assert.match(pageSource, /const commitSegments=\(next:FlashingSegment\[\]\)=>\{setDraftSegments\(next\);onChange\(next\)\}/);
    assert.match(pageSource, /aria-label="Add custom flashing segment" onClick=\{addSegment\}/);
    assert.match(pageSource, /const addHem=\(control:HemControlId,type:HemType\)=>\{if\(!current.length\)return/);
    assert.match(pageSource, /if\(next.length&&next\[next.length-1\]\.hem\)/);
    assert.match(pageSource, /Add Closed Hem/);
    assert.match(pageSource, /Add Open Hem/);
    assert.match(pageSource, /flashingHemLine/);
    assert.match(pageSource, /className="paintSideControl"/);
    assert.match(pageSource, /Color \/ paint side/);
    assert.match(pageSource, /const paintSideLines=paintSide\?current\.map/);
    assert.match(pageSource, /className="paintSideLine"/);
    assert.match(pageSource, /The opposite face is primer/);
    assert.match(pageSource, /const captureDrawing=\(\)=>new Promise<string>/);
    assert.match(pageSource, /aria-label="Export custom flashing drawing PDF"/);
    assert.match(pageSource, /onDrawingChange=\{drawingDataUrl=>setCustomFlashing/);
    assert.match(pageSource, /requestAnimationFrame\(\(\)=>\{captureDrawing\(\)\.then\(onDrawingChange\)/);
    assert.match(pageSource, /async function navigateToStep\(nextStep:number\)/);
    assert.match(pageSource, /customDrawingCaptureRef\.current\(\)/);
    assert.match(pageSource, /downloadCustomFlashingDrawingPdf/);
    assert.match(pageSource, /const buildHem=\(hem:HemConfig,anchor:/);
    assert.match(pageSource, /hem\.type==="open-1\/8"\?0\.015625:0/);
    assert.match(pageSource, />Add Open Hem<\/button>/);
    assert.match(pageSource, /\?"OPEN HEM":"CLOSED HEM"/);
    assert.doesNotMatch(pageSource, /OPEN HEM · 1\/8/);
    assert.match(pageSource, /radius=hem\.type==="open-1\/8"\?\.05:\.025,returnLength=hem\.type==="open-1\/8"\?\.24:\.2,controlDistance=radius\*1\.2/);
    assert.match(pageSource, /dimensions are in profile inches before converting to SVG space/);
    assert.match(pageSource, /buildHem\(startHem,points\[0\],current\[0\]\.direction\+180,"start"\)/);
    assert.match(pageSource, /buildHem\(endHem,points\.at\(-1\)!/,);
    assert.match(pageSource, /const \[hemControls,setHemControls\]=useState<Record<HemControlId,HemControl>>\(\(\)=>\(\{first:\{target:"start",side:"left"\},second:\{target:"end",side:"left"\}\}\)\)/);
    assert.match(pageSource, /aria-label=\{`\$\{label\} controls`\}/);
    assert.match(pageSource, /Profile start/);
    assert.match(pageSource, /Profile end/);
    assert.match(pageSource, /const selectHemEnd=\(control:HemControlId,nextTarget:HemTarget\)=>/);
    assert.match(pageSource, /const selectHemSide=\(control:HemControlId,side:HemSide\)=>/);
    assert.match(pageSource, /const nextHem=readHem\(current,nextTarget\);/);
    assert.match(pageSource, /setHemControls\(previous=>\(\{\.\.\.previous,\[control\]:\{target:nextTarget,side:nextHem\?\.side\?\?previous\[control\]\.side\}\}\)\);/);
    assert.doesNotMatch(pageSource, /writeHem\(next,nextTarget,sourceHem\);writeHem\(next,hemTarget,destinationHem\)/);
    assert.match(pageSource, /const clearHem=\(control:HemControlId\)=>/);
    assert.match(pageSource, /const flipHem=\(control:HemControlId\)=>/);
    assert.match(pageSource, /const hemDrawings=\[startHem&&current\[0\]\?buildHem\(startHem,points\[0\]/);
    assert.match(pageSource, /endHem&&current\.at\(-1\)\?buildHem\(endHem,points\.at\(-1\)!/);
    assert.match(pageSource, /onChange=\{event=>selectHemEnd\(control,event\.target\.value as HemTarget\)\}/);
    assert.match(pageSource, /onChange=\{event=>selectHemSide\(control,event\.target\.value as HemSide\)\}/);
    assert.match(pageSource, /Flip hem/);
    assert.match(pageSource, /OPEN HEM/);
    assert.match(pageSource, /CLOSED HEM/);
      assert.match(pageSource, /const \[zoom,setZoom\]=useState\(1\)/);
      assert.match(pageSource, /aria-label="Zoom in"/);
      assert.match(pageSource, /aria-label="Zoom out"/);
      assert.match(pageSource, /aria-label="Reset drawing zoom"/);
      assert.match(pageSource, /viewBox=\{`\$\{viewBoxX\}/);
      assert.match(pageSource, /const \[pan,setPan\]=useState\(\{x:0,y:0\}\)/);
      assert.match(pageSource, /const startPan=\(event:ReactPointerEvent<SVGSVGElement>\)/);
      assert.match(pageSource, /onPointerDown=\{startPan\}/);
      assert.match(pageSource, /onPointerMove=\{movePan\}/);
      assert.match(pageSource, /onPointerUp=\{endPan\}/);
      assert.match(pageSource, /viewBox=\{`\$\{viewBoxX\} \$\{viewBoxY\}/);
      assert.match(pageSource, /setPan\(\{x:0,y:0\}\)/);
  assert.match(cssSource, /\.flashingDrawingCanvas svg\{cursor:grab;touch-action:none\}/);
  assert.match(cssSource, /\.flashingDrawingCanvas svg\.isPanning\{cursor:grabbing\}/);
  assert.match(cssSource, /\.flashingHemLine\{stroke:#c56624;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none\}/);
  assert.match(cssSource, /\.paintSideLine\{stroke:#2382b7/);
  assert.match(pageSource, /customFlashing\}\}/);
  assert.match(pdfSource, /CUSTOM FLASHING REQUEST/);
  assert.match(pdfSource, /Color \/ paint side:/);
  assert.match(pdfSource, /drawingDataUrl\?:string/);
  assert.match(pdfSource, /Generated fabrication drawing attached\./);
  assert.match(pdfSource, /export async function downloadCustomFlashingDrawingPdf/);
  assert.match(pdfSource, /customFlashing\.attachment\?\.dataUrl,customFlashing\.sketchDataUrl/);
});
