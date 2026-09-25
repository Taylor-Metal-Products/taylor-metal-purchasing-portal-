import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { normalizeProductTerminology } from "../../panel-config";

export const runtime = "edge";

type OrderPayload = {
  orderNumber: string;
  submitted: string;
  poNumber?: string;
  customer: { name: string; account: string; contact: string; email: string; billingAddress: string; paymentTerms: string };
  project: { jobName: string; projectName?: string; receivingContact: string; requestedDate?: string; delivery: string; notes?: string; address: string };
  panels: Array<{ name: string; coverage: string; gauge: string; finish: string; color: string; options: string; lengths: Array<{ feet: number; inches: number; qty: number }> }>;
  accessories: Array<{ id: string; name: string; unit: string; qty: number }>;
  flashings: Array<{ name: string; qty: number; gauge: string; color: string; pitch?: string }>;
};

const esc = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function setCell(xml: string, ref: string, value: unknown, numeric = false) {
  const cell = new RegExp(`<c([^>]*\\br="${ref}"[^>]*)>[\\s\\S]*?<\\/c>`);
  const body = numeric
    ? `<c$1><v>${Number(value) || 0}</v></c>`
    : `<c$1 t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
  if (cell.test(xml)) return xml.replace(cell, body);
  const rowNumber = ref.replace(/\D/g, "");
  const row = new RegExp(`(<row[^>]*\\br="${rowNumber}"[^>]*>)([\\s\\S]*?)(<\\/row>)`);
  return xml.replace(row, `$1$2<c r="${ref}"${numeric ? "" : ' t="inlineStr"'}>${numeric ? `<v>${Number(value) || 0}</v>` : `<is><t xml:space="preserve">${esc(value)}</t></is>`}</c>$3`);
}

function clearCell(xml: string, ref: string) {
  const cell = new RegExp(`<c([^>]*\\br="${ref}"[^>]*)>[\\s\\S]*?<\\/c>`);
  return xml.replace(cell, `<c$1/>`);
}

export async function POST(request: Request) {
  try {
    const order = await request.json() as OrderPayload;
    const templateResponse = await fetch(new URL("/TMP%20Quote.xlsx", request.url));
    if (!templateResponse.ok) throw new Error("Quote template unavailable");
    const archive = unzipSync(new Uint8Array(await templateResponse.arrayBuffer()));
    let sheet = strFromU8(archive["xl/worksheets/sheet1.xml"]);

    sheet = setCell(sheet, "I2", order.submitted);
    sheet = setCell(sheet, "G3", "Requested Date:");
    sheet = setCell(sheet, "I3", order.project.requestedDate || "Not set");
    sheet = setCell(sheet, "G4", "Order / PO Number:");
    sheet = setCell(sheet, "I4", `${order.orderNumber}${order.poNumber ? ` / ${order.poNumber}` : ""}`);
    sheet = setCell(sheet, "A5", order.project.projectName || order.project.jobName);
    sheet = setCell(sheet, "D5", order.project.address);
    sheet = setCell(sheet, "A7", `${order.customer.name} | ${order.customer.contact} | ${order.customer.email}`);

    for (let row = 13; row <= 88; row++) {
      for (const col of "ABCDEFGHI") sheet = clearCell(sheet, `${col}${row}`);
    }

    const lines: Array<{ unit?: string; qty?: number; description: string; gauge?: string; substrate?: string; finish?: string; color?: string; heading?: boolean }> = [];
    lines.push({ description: "PANELS", heading: true });
    for (const panel of order.panels) {
      for (const length of panel.lengths) {
        lines.push({
          unit: "Panels",
          qty: length.qty,
          description: `${normalizeProductTerminology(panel.name)} | ${panel.coverage} | ${length.feet} ft ${length.inches} in${panel.options ? ` | ${panel.options}` : ""}`,
          gauge: panel.gauge,
          finish: normalizeProductTerminology(panel.finish),
          color: normalizeProductTerminology(panel.color),
        });
      }
    }
    if (order.accessories.length) {
      lines.push({ description: "ACCESSORIES", heading: true });
      for (const item of order.accessories) lines.push({ unit: item.unit, qty: item.qty, description: `${normalizeProductTerminology(item.name)} | ${item.id}` });
    }
    if (order.flashings.length) {
      lines.push({ description: "FLASHINGS", heading: true });
      for (const item of order.flashings) lines.push({ unit: "Each-10Ft", qty: item.qty, description: `${normalizeProductTerminology(item.name)}${item.pitch ? ` | Pitch ${item.pitch}` : ""}`, gauge: item.gauge, finish: "Same as ordered", color: normalizeProductTerminology(item.color) });
    }
    lines.push({ description: "DELIVERY & ORDER NOTES", heading: true });
    lines.push({ unit: "Order", qty: 1, description: `${order.project.delivery} | Receiving: ${order.project.receivingContact}${order.project.notes ? ` | Notes: ${order.project.notes}` : ""}` });

    lines.slice(0, 76).forEach((line, index) => {
      const row = 13 + index;
      sheet = setCell(sheet, `A${row}`, line.heading ? line.description : line.unit || "");
      if (!line.heading) {
        sheet = setCell(sheet, `B${row}`, line.qty || 0, true);
        sheet = setCell(sheet, `C${row}`, line.description);
        sheet = setCell(sheet, `D${row}`, line.gauge || "");
        sheet = setCell(sheet, `E${row}`, line.substrate || "");
        sheet = setCell(sheet, `F${row}`, line.finish || "");
        sheet = setCell(sheet, `G${row}`, line.color || "");
      }
    });

    archive["xl/worksheets/sheet1.xml"] = strToU8(sheet);
    delete archive["xl/calcChain.xml"];
    const contentTypes = strFromU8(archive["[Content_Types].xml"]);
    archive["[Content_Types].xml"] = strToU8(contentTypes.replace(/<Override PartName="\/xl\/calcChain.xml"[^>]*\/>/, ""));
    const rels = strFromU8(archive["xl/_rels/workbook.xml.rels"]);
    archive["xl/_rels/workbook.xml.rels"] = strToU8(rels.replace(/<Relationship[^>]*Target="calcChain.xml"[^>]*\/>/, ""));

    const filename = `TMP-Order-${order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, "-")}.xlsx`;
    return new Response(zipSync(archive, { level: 6 }), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Unable to create Excel order summary", { status: 400 });
  }
}
