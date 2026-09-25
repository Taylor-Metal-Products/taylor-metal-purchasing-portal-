import { jsPDF } from "jspdf";
import { assetPath } from "./asset-path";
import { safePdfFilename } from "./order-management";
import { normalizeProductTerminology } from "./panel-config";

type ReportPayload = { orderNumber:string;submitted:string;poNumber?:string;submittedBy?:string;company:{name:string;account:string;contact:string;email:string;address:string;payment:string};project:{jobName:string;projectName?:string;receivingContact:string;requestedDate?:string;delivery:string;notes?:string};panels:Array<{totalPanels:number;name:string;coverage:string;gauge:string;finish:string;color:string;lengths:Array<{feet:number;inches:number;qty:number}>}>;accessories:Array<{quantity:number;unit:string;name:string;part:string;unitPrice:number|null;lineTotal:number|null}>;flashings:Array<{quantity:number;name:string;pitch?:string}>;flashingFinish:{gauge:string;color:string};totals:{panels:number;area:number;subtotal:number;tax:number;total:number} };
const text=(value:unknown)=>String(value??"").replace(/[•·]/g," | ").replace(/[–—]/g,"-");
const money=(value:number|null)=>value===null?"Pending":`$${value.toFixed(2)}`;

export async function downloadOrderPdf(order:ReportPayload){
  const pdf=new jsPDF({unit:"pt",format:"letter"}),left=28,width=556;let y=100;
  const logoResponse=await fetch(assetPath("/taylor-metal-logo.png"));
  if(logoResponse.ok){const logo=new Uint8Array(await logoResponse.arrayBuffer()),size=pdf.getImageProperties(logo),scale=Math.min(150/size.width,54/size.height);pdf.addImage(logo,"PNG",left,20,size.width*scale,size.height*scale,undefined,"FAST")}
  pdf.setFillColor(197,210,227);pdf.rect(335,20,249,66,"F");pdf.setTextColor(21,47,72);pdf.setFont("helvetica","bold");pdf.setFontSize(15);pdf.text("ORDER CONFIRMATION",347,39);pdf.setFont("helvetica","normal");pdf.setFontSize(8);pdf.text(`Order #: ${text(order.orderNumber)}`,347,54);pdf.text(`Date: ${text(order.submitted)}`,347,69);
  const section=(title:string)=>{if(y>700){pdf.addPage();y=40}pdf.setFillColor(174,194,219);pdf.rect(left,y,width,20,"F");pdf.setTextColor(18,48,76);pdf.setFont("helvetica","bold");pdf.setFontSize(9);pdf.text(title,left+7,y+14);y+=30};
  const line=(value:string,indent=0)=>{const rows=pdf.splitTextToSize(text(value),width-14-indent);if(y+rows.length*11>750){pdf.addPage();y=40}pdf.setTextColor(30,43,55);pdf.setFont("helvetica","normal");pdf.setFontSize(8);pdf.text(rows,left+7+indent,y);y+=Math.max(12,rows.length*10)};
  section("PURCHASING COMPANY / PROJECT");line(`${order.company.name} | Account: ${order.company.account} | Contact: ${order.company.contact} | ${order.company.email}`);line(`${order.company.address} | Payment: ${order.company.payment}`);line(`Job: ${order.project.jobName} | Project: ${order.project.projectName||"Not provided"} | Delivery: ${order.project.delivery}`);
  section("PANELS");order.panels.forEach((panel,index)=>{line(`${index+1}. ${normalizeProductTerminology(panel.name)} | ${panel.coverage} | ${panel.gauge} | ${normalizeProductTerminology(panel.finish)} | ${normalizeProductTerminology(panel.color)} | Qty ${panel.totalPanels}`);panel.lengths.forEach(length=>line(`Length: ${length.feet} ft ${length.inches} in | Qty ${length.qty}`,14))});line(`Panel total: ${order.totals.panels} | Coverage area: ${order.totals.area.toLocaleString()} sq ft`);
  section("ACCESSORIES");if(!order.accessories.length)line("No accessories selected");order.accessories.forEach(item=>line(`${item.quantity} ${item.unit} | ${normalizeProductTerminology(item.name)} | ${item.part} | ${money(item.lineTotal)}`));
  section("FLASHINGS");if(!order.flashings.length)line("No flashings selected");order.flashings.forEach(item=>line(`${item.quantity} | ${item.name}${item.pitch?` | Pitch ${item.pitch}`:""} | ${order.flashingFinish.gauge} | ${normalizeProductTerminology(order.flashingFinish.color)}`));
  section("PRICING SUMMARY");line(`Subtotal: ${money(order.totals.subtotal)} | Taxes / charges: ${money(order.totals.tax)} | Current total: ${money(order.totals.total)}`);if(order.project.notes){section("PROJECT NOTES");line(order.project.notes)}
  const filename=safePdfFilename(order.orderNumber),blob=pdf.output("blob"),url=URL.createObjectURL(blob);return {filename,url};
}
