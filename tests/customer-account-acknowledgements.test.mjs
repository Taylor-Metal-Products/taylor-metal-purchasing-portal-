import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

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

test("official app name and proportional responsive logo styling are present", () => {
  assert.match(page, /<small>Purchasing Portal<\/small>/);
  assert.doesNotMatch(page, /Purchasing Portal Prototype|Interactive prototype/);
  assert.match(layout, /title: "Purchasing Portal"/);
  assert.match(styles, /\.brandLogo\{[^}]*width:160px;[^}]*height:auto/);
  assert.match(styles, /@media\(max-width:620px\)[\s\S]*\.brandLogo\{width:124px;height:auto\}/);
});
