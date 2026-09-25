import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const portalLogo = await readFile(new URL("../public/purchasing-portal-logo.png", import.meta.url));

test("customer account display is bound directly to the editable account value", () => {
  assert.match(page, /<span>Customer Account<\/span><strong>\{customerAccount\|\|"Enter account number"\}<\/strong>/);
  assert.doesNotMatch(page, /onBlur=\{\(\)=>\{if\(customerAccount/);
});

test("required acknowledgements are controlled, unchecked by default, and validated", () => {
  assert.match(page, /useState\(false\).*oilCanningAcknowledged|oilCanningAcknowledged.*useState\(false\)/s);
  assert.match(page, /checked=\{oilCanningAcknowledged\}/);
  assert.match(page, /checked=\{orderReviewAcknowledged\}/);
  assert.doesNotMatch(page, /defaultChecked/);
  assert.match(page, /Required before submission:/);
});

test("official app name and supplied responsive logo assets are present", () => {
  assert.match(page, /className="portalLogo"[^>]*purchasing-portal-logo\.png/);
  assert.doesNotMatch(page, /Purchasing Portal Prototype|Interactive prototype/);
  assert.match(layout, /title: "Purchasing Portal"/);
  assert.deepEqual([...portalLogo.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(portalLogo.readUInt32BE(16), 2172);
  assert.equal(portalLogo.readUInt32BE(20), 724);
  assert.match(styles, /\.brandLogo\{width:230px;height:auto;max-height:64px/);
  assert.match(styles, /\.portalLogo\{[^}]*height:auto;[^}]*object-fit:contain/);
  assert.match(styles, /@media\(max-width:620px\)[\s\S]*\.brandLogo\{width:150px;height:auto;max-height:48px\}/);
});

test("header actions share typography and enabled buttons have pointer-only hover feedback", () => {
  assert.match(styles, /\.headerActions \.ghost\{[^}]*font-family:Arial,Helvetica,sans-serif;[^}]*font-weight:750;[^}]*letter-spacing:\.005em;[^}]*text-align:center;[^}]*text-transform:none;[^}]*color:#29475c/);
  assert.match(styles, /\.headerActions \.primaryGhost\{[^}]*color:#29475c;[^}]*text-shadow:none/);
  assert.match(styles, /@media\(hover:hover\) and \(pointer:fine\)\{[\s\S]*button:not\(:disabled\):hover\{[^}]*filter:brightness\(1\.06\)[^}]*translate:0 -1px/);
  assert.doesNotMatch(styles, /@media\(hover:none\)[\s\S]*button[^}]*:hover/);
});
