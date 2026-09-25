import { jsPDF } from "jspdf";
import { normalizeProductTerminology } from "../../panel-config";
import { safePdfFilename } from "../../order-management";

export const runtime = "edge";

type LengthRow = { feet:number; inches:number; qty:number };
type ReportPanel = { totalPanels:number; name:string; coverage:string; gauge:string; finish:string; color:string; pan?:string; notching?:string; roofPitch?:string; clip?:string; coil?:string; lengths:LengthRow[] };
type ReportAccessory = { quantity:number; unit:string; category:string; name:string; part:string; unitPrice:number|null; lineTotal:number|null };
type ReportFlashing = { quantity:number; name:string; pitch?:string };
type ReportPayload = {
  orderNumber:string;submitted:string;poNumber?:string;submittedBy?:string;
  company:{name:string;account:string;contact:string;email:string;address:string;payment:string};
  project:{jobName:string;projectName?:string;receivingContact:string;requestedDate?:string;delivery:string;notes?:string};
  panels:ReportPanel[];accessories:ReportAccessory[];flashings:ReportFlashing[];flashingFinish:{gauge:string;color:string};
  totals:{panels:number;area:number;subtotal:number;tax:number;total:number};
};

const clean=(value:unknown)=>String(value??"").replace(/[•·]/g," | ").replace(/[–—]/g,"-");
const money=(value:number|null)=>value===null?"Pending":`$${value.toFixed(2)}`;

function createPdf(order:ReportPayload,logoBytes:Uint8Array){
  try{
    const document=new jsPDF({unit:"pt",format:"letter"}),left=28,width=556;
    let y=102;
    const logoProperties=document.getImageProperties(logoBytes);
    const logoScale=Math.min(150/logoProperties.width,54/logoProperties.height);
    const logoWidth=logoProperties.width*logoScale,logoHeight=logoProperties.height*logoScale;
    const logo=()=>document.addImage(logoBytes,"PNG",left,20,logoWidth,logoHeight,undefined,"FAST");
    const frame=()=>{logo();document.setFillColor(197,210,227);document.setDrawColor(148,165,184);document.rect(335,20,249,66,"FD");document.setTextColor(21,47,72);document.setFont("helvetica","bold");document.setFontSize(15);document.text("ORDER CONFIRMATION",347,38);document.setFont("helvetica","normal");document.setFontSize(7.2);document.text(`Order #: ${clean(order.orderNumber)}`,347,52);document.text(`PO #: ${clean(order.poNumber)||"Not provided"}`,347,64);document.text(`Date: ${clean(order.submitted)}`,347,76);document.text(`Requested: ${clean(order.project?.requestedDate)||"Not set"}`,462,76)};
    const next=()=>{document.addPage();frame();y=102};
    const ensure=(height:number)=>{if(y+height>742)next()};
    const band=(title:string)=>{ensure(24);document.setFillColor(174,194,219);document.setDrawColor(93,118,146);document.rect(left,y,width,20,"FD");document.setTextColor(18,48,76);document.setFont("helvetica","bold");document.setFontSize(9);document.text(title,left+7,y+14);y+=20};
    const info=(x:number,title:string,rows:string[])=>{document.setFillColor(197,210,227);document.rect(x,y,271,19,"F");document.setTextColor(21,47,72);document.setFont("helvetica","bold");document.setFontSize(8);document.text(title,x+6,y+13);document.setFont("helvetica","normal");document.setTextColor(30,43,55);let rowY=y+32;rows.forEach(row=>{const lines=document.splitTextToSize(clean(row),259);document.text(lines,x+6,rowY);rowY+=Math.max(11,lines.length*9)});document.setDrawColor(180,190,200);document.rect(x,y,271,Math.max(94,rowY-y));return Math.max(94,rowY-y)};
    const table=(headers:string[],widths:number[],rows:Array<Array<string|number>>)=>{const head=()=>{let x=left;headers.forEach((header,index)=>{document.setFillColor(207,218,232);document.setDrawColor(110,130,150);document.rect(x,y,widths[index],20,"FD");document.setTextColor(24,51,76);document.setFont("helvetica","bold");document.setFontSize(7.2);document.text(header,x+4,y+13);x+=widths[index]});y+=20};head();rows.forEach(row=>{const wrapped=row.map((value,index)=>document.splitTextToSize(clean(value),widths[index]-8)),height=Math.max(21,...wrapped.map(value=>value.length*9+7));if(y+height>742){next();head()}let x=left;wrapped.forEach((value,index)=>{document.setFillColor(255,255,255);document.setDrawColor(177,188,199);document.rect(x,y,widths[index],height,"FD");document.setTextColor(25,38,50);document.setFont("helvetica","normal");document.setFontSize(7.5);document.text(value,x+4,y+12);x+=widths[index]});y+=height})};

    frame();
    const companyHeight=info(left,"PURCHASING COMPANY",[order.company.name,`Account: ${order.company.account||"Not provided"}`,`Contact: ${order.company.contact||"Not provided"}`,order.company.email,order.company.address,`Payment: ${order.company.payment}`]);
    const projectHeight=info(left+285,"PROJECT INFORMATION",[`Job: ${order.project.jobName}`,`Project: ${order.project.projectName||"Not provided"}`,`Receiving: ${order.project.receivingContact}`,`Delivery: ${order.project.delivery}`,`Submitted by: ${order.submittedBy||"Not provided"}`]);
    y+=Math.max(companyHeight,projectHeight)+12;

    band("PANELS");
    const panelRows:Array<Array<string|number>>=[];
    order.panels.forEach((panel,index)=>{panelRows.push([panel.totalPanels,`${index+1}. ${normalizeProductTerminology(panel.name)} - ${panel.coverage}`,panel.gauge,normalizeProductTerminology(panel.finish),normalizeProductTerminology(panel.color),[panel.pan,panel.notching,panel.roofPitch?`Pitch ${panel.roofPitch}`:"",panel.clip,panel.coil?`Coil ${panel.coil}`:""].filter(Boolean).join(" | ")]);panel.lengths.forEach(row=>panelRows.push([row.qty,`Length: ${row.feet} ft ${row.inches} in`,"","","",""]))});
    table(["QTY","ITEM DESCRIPTION","GA./MATERIAL","FINISH","COLOR","OPTIONS"],[38,170,72,72,100,104],panelRows.length?panelRows:[[0,"No panels configured","","","",""]]);
    document.setFillColor(237,242,247);document.rect(left,y,width,22,"F");document.setTextColor(35,55,73);document.setFont("helvetica","bold");document.setFontSize(8);document.text(`PANEL TOTAL: ${order.totals.panels||0}`,left+7,y+15);document.text(`COVERAGE AREA: ${(order.totals.area||0).toLocaleString()} SQ FT`,left+180,y+15);y+=30;

    band("ACCESSORIES");
    table(["QTY","UNIT","ITEM DESCRIPTION","UNIT PRICE","LINE TOTAL"],[42,54,270,85,105],order.accessories.length?order.accessories.map(item=>[item.quantity,item.unit,`${normalizeProductTerminology(item.name)} | ${item.part}`,money(item.unitPrice),money(item.lineTotal)]):[[0,"","No accessories selected","",""]]);
    y+=10;band("FLASHINGS");
    table(["QTY","ITEM DESCRIPTION","GA./MATERIAL","COLOR"],[45,286,105,120],order.flashings.length?order.flashings.map(item=>[item.quantity,`${normalizeProductTerminology(item.name)}${item.pitch?` | Pitch ${item.pitch}`:""}`,order.flashingFinish.gauge,normalizeProductTerminology(order.flashingFinish.color)]):[[0,"No flashings selected",order.flashingFinish.gauge,normalizeProductTerminology(order.flashingFinish.color)]]);

    y+=10;band("PRICING SUMMARY");ensure(86);document.setFontSize(9);document.setTextColor(30,43,55);document.text("Priced accessory subtotal",left+300,y+16);document.text(money(order.totals.subtotal),left+548,y+16,{align:"right"});document.text("Taxes / other charges",left+300,y+32);document.text(money(order.totals.tax),left+548,y+32,{align:"right"});document.setFont("helvetica","bold");document.setFontSize(11);document.text("CURRENT ORDER TOTAL",left+300,y+52);document.text(money(order.totals.total),left+548,y+52,{align:"right"});document.setFont("helvetica","normal");document.setFontSize(7);document.text(document.splitTextToSize("Panel, flashing, freight, and inquiry-item pricing is pending Taylor Metal review and is not included in the current total.",260),left+7,y+16);y+=70;
    if(order.project.notes){band("PROJECT NOTES");const notes=document.splitTextToSize(clean(order.project.notes),width-14);document.setTextColor(30,43,55);document.setFont("helvetica","normal");document.setFontSize(8);document.text(notes,left+7,y+13)}

    const pages=document.getNumberOfPages();for(let page=1;page<=pages;page++){document.setPage(page);frame();document.setDrawColor(155,171,188);document.line(left,757,left+width,757);document.setTextColor(53,73,92);document.setFont("helvetica","bold");document.setFontSize(7);document.text("RIVERSIDE CA | SACRAMENTO CA | SALEM OR | AUBURN WA | SPOKANE WA | TAYLORMETAL.COM",left,772);document.text(`Page ${page} of ${pages}`,584,772,{align:"right"})}
    return new Response(document.output("arraybuffer"),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${safePdfFilename(order.orderNumber)}"`,"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  }catch(error){console.error(error);return new Response("Unable to generate order PDF",{status:400})}
}

export async function POST(request:Request){
  try{
    const logoResponse=await fetch(new URL("/taylor-metal-logo.png",request.url));
    if(!logoResponse.ok)throw new Error("Taylor Metal logo asset is unavailable");
    const logoBytes=new Uint8Array(await logoResponse.arrayBuffer());
    return createPdf(await request.json() as ReportPayload,logoBytes);
  }catch(error){console.error(error);return new Response("Unable to generate order PDF",{status:400})}
}
