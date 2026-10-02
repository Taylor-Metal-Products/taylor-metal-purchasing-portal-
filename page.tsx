"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { type OrderStatus } from "./order-management";
import { assetPath } from "./asset-path";
import { saveOrder } from "./browser-order-store";
import {
  armortechColors,
  getGaugeOptions,
  getMaterialAvailability,
  getPanelColors,
  kynar500Colors,
  materialLabel,
  normalizeMaterialId,
  normalizeProductTerminology,
  panelImageCatalog,
  panelProfiles,
  type MaterialFinishId,
  type PanelId,
  type PanelProfile,
} from "./panel-config";

type LengthRow = { id: number; feet: number; inches: number; qty: number };
type Accessory = { id: string; category: string; name: string; unit: string; price: number | null };
type AddressSuggestion = { label: string };
type PanelSnapshot = { panelId?:PanelId;materialId:MaterialFinishId;finish:string;name:string;coverage:string;gauge:string;color:string;pan?:string;notching?:string;roofPitch?:string;clip?:string;coil?:string;lengths:LengthRow[];totalPanels:number;area:number };
type HemType = "closed" | "open-1/8";
type HemTarget = "start" | "end";
type HemSide = "left" | "right";
type HemConfig = { type:HemType; side:HemSide };
type HemControlId = "first" | "second";
type HemControl = { target:HemTarget; side:HemSide };
type FlashingSegment = { length:number; direction:number; hem?:HemType|HemConfig; startHem?:HemType|HemConfig };
type CustomFlashingRequest = { description:string; attachment?:{name:string;dataUrl:string}; sketchDataUrl?:string; drawingDataUrl?:string; segments?:FlashingSegment[]; paintSide?:HemSide };
type OrderDraftPayload = {
  customer:string;customerAccount:string;purchasingContact:string;email:string;billingAddress:string;billingAddressVerified:boolean;paymentTerms:string;
  jobName:string;poNumber:string;projectName:string;receivingContact:string;requestedDate:string;delivery:string;willCallBranch:string;jobsiteAddress:string;jobsiteAddressVerified:boolean;projectNotes:string;
  panels:PanelSnapshot[];accessoryQty:Record<string,number>;flashingQty:Record<string,number>;flashingSameAsPanel:boolean;flashingGauge:string;flashingColor:string;
  flashingPitchMode:Record<string,"panel"|"custom">;flashingCustomPitch:Record<string,string>;customFlashing:CustomFlashingRequest;
};

const flashingGroups = [
    { name: "Eave Flashings", items: ["1 1-2 Inch Eave", "EL 1x3 Eave Flashing", "Eave Low", "Hook Eave"] },
    { name: "Gable Flashings", items: ["Alternate Gable", "Alternate Gable Cleat", "Box Gable", "Box Gable No Hem", "Compensating Gable", "Compensating Gable Hemmed", "Gable Cleat", "Gable G-17", "Narrow Gable"] },
    { name: "Endwall & Sidewall Flashings", items: ["Compensating Sidewall", "EW-17 Vented Endwall", "Field Notched Endwall", "Hemmed Endwall", "Sidewall", "WT Vented Endwall Flashing"] },
    { name: "Ridge, Hip & Peak Flashings", items: ["Field Notched Hip", "Field Notched Peak Flashing", "Field Notched Ridge Unvented", "Hemmed Peak Flashing", "Hip-Ridge 5.625", "Hip-Ridge 7", "Peak Cleat", "R-17 Ridge", "Ridge Full Vented", "Vented Peak Flashing", "WT Ridge Full Vented", "WT Vented Peak Flashing"] },
    { name: "Pitch Change Flashings", items: ["Field Notched Inside Pitch Change", "Inside Pitch Change Hemmed", "Field Notched Outside Pitch Change", "Outside Pitch Change Hemmed"] },
    { name: "Valley Flashings", items: ["Valley Flashing 24", "Valley Flashing 24 Hemmed", "Valley Wide Flashing"] },
    { name: "Gutter Flashings", items: ["Box Gutter", "Gutter Hanger"] },
    { name: "Roof Cleats, Closures & Supports", items: ["4 Inch Perf Strip", "Offset Cleat", "Prow", "Reversing Strip", "Support Flashing", "Zee Closure"] },
    { name: "Base, Pan & Bottom Flashings", items: ["2.5 Side and Bottom Flashing", "3.5 Inch Pan Flashing", "4.5 Side and Bottom Flashing", "5.5 Inch Pan Flashing", "Easy Lock Base Flashing", "Pan"] },
    { name: "Corner Flashings", items: ["Easy Lock Inside Corner", "Easy Lock Inside Corner Post", "Easy Lock Outside Corner", "Easy Lock Outside Corner Post"] },
    { name: "C-Flashings", items: ["C-Flashing", "C-Flashing Hemmed"] },
    { name: "Zee Flashings", items: ["Easy Lock Zee Flashing Hemmed"] }
] as const;

const flashingCatalog = flashingGroups.flatMap(group => [...group.items]);

const panProfileIds = new Set<PanelId>(["ms-100", "ms-150", "ms-200", "versa-span", "easy-lock", "slim-lock"]);
const panOptions = ["Striations", "Accent ribs", "Flat pan"];
const inquiryColors = new Set(["Vintage", "Metallic Silver"]);

const accessoryCatalog: Accessory[] = [
  { id:"AIWTMPSAMHT", category:"Underlayment", name:"TMP SAM-HT Ice & Water Underlayment", unit:"Roll", price:88.65 },
  { id:"AIWBAU", category:"Underlayment", name:"Blue Armor HT Ice & Water Underlayment", unit:"Roll", price:113.22 },
  { id:"ATUDL25", category:"Underlayment", name:"Titanium UDL 25 Synthetic Underlayment", unit:"Roll", price:114.14 },
  { id:"APXFRU", category:"Underlayment", name:"Polystick XFR Class A Fire Rated Ice & Water Underlayment", unit:"Roll", price:115.80 },
  { id:"APF2", category:"Pipe Flashings", name:'Pipe Flashing #2 (1-3/4" - 3-1/4")', unit:"Each", price:6.31 },
  { id:"APF3", category:"Pipe Flashings", name:'Pipe Flashing #3 (1/4" - 5")', unit:"Each", price:6.30 },
  { id:"APF4", category:"Pipe Flashings", name:'Pipe Flashing #4 (3" - 6")', unit:"Each", price:10.74 },
  { id:"APF6", category:"Pipe Flashings", name:'Pipe Flashing #6 (5" - 9")', unit:"Each", price:13.13 },
  { id:"APF8", category:"Pipe Flashings", name:'Pipe Flashing #8 (7" - 13")', unit:"Each", price:23.72 },
  { id:"APF9", category:"Pipe Flashings", name:'Pipe Flashing #9 (10" - 18")', unit:"Each", price:42.80 },
  { id:"APFHT4", category:"Pipe Flashings", name:'High Temp Pipe Flashing #4 (3" - 6")', unit:"Each", price:14.59 },
  { id:"APFHT8", category:"Pipe Flashings", name:'High Temp Pipe Flashing #8 (7" - 13")', unit:"Each", price:45.32 },
  { id:"APFRS", category:"Pipe Flashings", name:'Retro Fit Small (3/4" - 2-3/4")', unit:"Each", price:14.24 },
  { id:"APFRM", category:"Pipe Flashings", name:'Retro Fit Medium (2" - 7-1/4")', unit:"Each", price:20.93 },
  { id:"APFRL", category:"Pipe Flashings", name:'Retro Fit Large (3-1/4" - 10")', unit:"Each", price:31.60 },
  { id:"APP-BL", category:"Paint & Sealants", name:"Touch Up Paint Pen - Standard Colors", unit:"Each", price:7.10 },
  { id:"APSC", category:"Paint & Sealants", name:"Paint - 16 oz Can", unit:"Each", price:11.64 },
  { id:"AM1S", category:"Paint & Sealants", name:"M-1 Structural Sealant - Black", unit:"Each", price:6.12 },
  { id:"ADLS-WH", category:"Paint & Sealants", name:"DuraLink 50 Super Adhesion Sealant", unit:"Tube", price:5.83 },
  { id:"AMLS-WH", category:"Paint & Sealants", name:"MetalLink Silicone Sealant", unit:"Tube", price:7.51 },
  { id:"ACLS-CLEAR", category:"Paint & Sealants", name:"ChemLink Clear Adhesion Sealant", unit:"Tube", price:7.69 },
  { id:"ABC-Grey", category:"Paint & Sealants", name:"XB1500 Butyl Caulking - skinning", unit:"Tube", price:3.03 },
  { id:"ABCS-Grey", category:"Paint & Sealants", name:"XB1500 Butyl Caulking - non-skinning", unit:"Tube", price:3.07 },
  { id:"ABT075-50", category:"Tapes", name:'Butyl Tape 3/32" x 3/4" x 50 ft', unit:"Roll", price:5.07 },
  { id:"ABTTBM", category:"Tapes", name:"Triple Bead Butyl Tape", unit:"Roll", price:8.59 },
  { id:"ABTDBM", category:"Tapes", name:"Double Bead Butyl Tape", unit:"Roll", price:3.59 },
  { id:"APRC64", category:"Fasteners", name:"#64 Stainless Closed End Rivet - Bag 100", unit:"Bag", price:36.32 },
  { id:"ASZACT087-GA", category:"Fasteners", name:'#14 x 7/8" Lap Tek Stitch Screw - Bag 250', unit:"Bag", price:31.06 },
  { id:"AST150", category:"Fasteners", name:'#12 x 1-1/2" Tek Self Driller Screw - Bag 250', unit:"Bag", price:22.24 },
  { id:"ASPHS150", category:"Fasteners", name:'#10 x 1-1/2" Pancake Head Screws - Bag 250', unit:"Bag", price:12.05 },
  { id:"ASPHS100", category:"Fasteners", name:'#10 x 1" Pancake Head Screws - Bag 250', unit:"Bag", price:9.00 },
  { id:"ASZEL12", category:"Clips & Snap Z", name:'Snap Z - Easy-Lock™ 12"', unit:"Each", price:3.75 },
  { id:"ASZEL16", category:"Clips & Snap Z", name:'Snap Z - Easy-Lock™ 16"', unit:"Each", price:3.68 },
  { id:"ASZMS15012", category:"Clips & Snap Z", name:'Snap Z - MS-150™ 12"', unit:"Each", price:3.67 },
  { id:"ASZMS15016", category:"Clips & Snap Z", name:'Snap Z - MS-150™ 16"', unit:"Each", price:3.75 },
  { id:"ASZMS20018", category:"Clips & Snap Z", name:'Snap Z - MS-200™ 18"', unit:"Each", price:4.79 },
  { id:"ASZVS14", category:"Clips & Snap Z", name:'Snap Z - Versa-Span™ 14"', unit:"Each", price:4.90 },
  { id:"ASZVS16", category:"Clips & Snap Z", name:'Snap Z - Versa-Span™ 16"', unit:"Each", price:4.07 },
  { id:"ASZVS18", category:"Clips & Snap Z", name:'Snap Z - Versa-Span™ 18"', unit:"Each", price:3.58 },
  { id:"AVSCLIP-UL", category:"Clips & Snap Z", name:"Versa-Span™ Fixed Clip - UL Rated", unit:"Each", price:0.37 },
  { id:"AMSCLIP200NT", category:"Clips & Snap Z", name:'MS-200™ 2" Fixed Clip with Sealant', unit:"Each", price:0.25 },
  { id:"AMSCLIPF200NT", category:"Clips & Snap Z", name:'22 ga MS-200™ 2" UL Floating Clip with Sealant', unit:"Each", price:0.60 },
  { id:"AMSCLIPF150", category:"Clips & Snap Z", name:'24 ga MS-150™ 1-1/2" UL Floating Clip', unit:"Each", price:0.59 },
  { id:"AMSCLIP150", category:"Clips & Snap Z", name:'MS-150™ 1-1/2" Fixed Clip with Sealant', unit:"Each", price:0.19 },
  { id:"ASMCLIP", category:"Clips & Snap Z", name:"Slim-Lock™ Fixed Clip", unit:"Each", price:0.20 },
  { id:"AFCHR34", category:"Closures", name:'HR-34™ 34" Formed Foam Closure with Adhesive', unit:"Each", price:0.66 },
  { id:"AFCEL", category:"Closures", name:'12" Easy-Lock™ Closed Cell Foam Closure', unit:"Each", price:0.98 },
  { id:"AFCELV", category:"Closures", name:'12" Easy-Lock™ Vented Ridge Foam Closure', unit:"Each", price:4.91 },
  { id:"AFCSL", category:"Closures", name:'16" Easy-Lock™ Closed Cell Foam Closure', unit:"Each", price:0.81 },
  { id:"AFCCC", category:"Closures", name:'Classic 7/8″ Corrugated™ Formed Foam Closure', unit:"Each", price:0.71 },
  { id:"AFCGR7I", category:"Closures", name:"GR-7™ Inside / Outside Formed Foam Closure", unit:"Each", price:0.37 },
  { id:"AFCMSVS", category:"Closures", name:'MS / Versa-Span™ Foam Closure 18" x 2"', unit:"Each", price:1.86 },
  { id:"AFCPBRI", category:"Closures", name:"PBR Inside / Outside Formed Foam Closure", unit:"Each", price:0.59 },
  { id:"AFCT3I", category:"Closures", name:"T-3™ Inside / Outside Formed Foam Closure", unit:"Each", price:0.38 },
  { id:"AFCTRI", category:"Closures", name:"Tuff Rib Inside / Outside Formed Foam Closure", unit:"Each", price:0.50 },
  { id:"AFCVV", category:"Closures", name:'Versa Vent Universal Closure 1" x 10 ft', unit:"Each", price:18.36 },
  { id:"S5-S", category:"Snow Retention", name:"S-5-S Clamp", unit:"Each", price:null },
  { id:"S5-N", category:"Snow Retention", name:"S-5-N Clamp - Easy-Lock™ / StreamLine™", unit:"Each", price:null },
  { id:"S5-U", category:"Snow Retention", name:"S-5-U Universal Clamp", unit:"Each", price:null },
  { id:"COLORGARD", category:"Snow Retention", name:'ColorGard Unpunched - 7 ft 8 in', unit:"Each", price:null },
  { id:"XGARD2", category:"Snow Retention", name:"X-Gard 2.0", unit:"Each", price:null },
];
const accessoryCategories = ["Underlayment", "Screws", "Sealants and Tapes", "Pipe Boots", "Closures"];

function accessoryGroup(item: Accessory) {
  if (item.category === "Underlayment") return "Underlayment";
  if (item.category === "Fasteners" && item.name.toLowerCase().includes("screw")) return "Screws";
  if (item.category === "Tapes" || (item.category === "Paint & Sealants" && !item.name.toLowerCase().includes("paint"))) return "Sealants and Tapes";
  if (item.category === "Pipe Flashings") return "Pipe Boots";
  if (item.category === "Closures") return "Closures";
  return null;
}

function clipOptionsFor(panelId: PanelId) {
  if (panelId === "ms-200") return ["Fixed Clip", "Low Profile Floating Clip", "3/8 Stand off floating clip"];
  if (["ms-100", "ms-150"].includes(panelId)) return ["Fixed Clip", "Floating Clip"];
  if (["max-corr", "slim-lock", "versa-span", "easy-lock"].includes(panelId)) return ["Clip"];
  return [];
}

const steps = ["Customer Information", "Project Info", "Panel Order", "Accessories", "Flashings", "Review"];

function profileSort(a: PanelProfile, b: PanelProfile) {
  const byName = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  if (byName !== 0) return byName;
  return (parseFloat(a.coverages[0]) || 0) - (parseFloat(b.coverages[0]) || 0);
}

const configuredProfiles = panelProfiles
  .flatMap(item => item.coverages.map(size => ({ ...item, coverages: [size] })))
  .sort(profileSort);

function isRoofPanel(panelId:PanelId){return !["board-and-batten","smoothwall-soffit-shadowline","flat-sheet"].includes(panelId);}
function allowsNotching(panelId:PanelId){return new Set<PanelId>(["ms-100","ms-150","ms-200","versa-span","easy-lock"]).has(panelId)}
function pitchType(name:string){const n=name.toLowerCase();if(n.includes("peak cleat"))return "peak";if(n.includes("wide valley")||n.includes("valley wide"))return "wide-valley";if(n.includes("valley"))return "valley";if(n.includes("hook eave"))return "hook-eave";if(n.includes("standard eave"))return "eave";if(n.includes("eave"))return "eave";if(n.includes("ridge"))return "ridge";if(n.includes("peak"))return "peak";if(n.includes("hip"))return "hip";return ""}
function flashingDrawing(name:string){return assetPath(`/flashing-line-drawings/${encodeURIComponent(name)}.jpg`)}
function FlashingSketch({name}:{name:string}){return <img className="flashingSketch" src={flashingDrawing(name)} alt={`${name} reference profile`}/>}
function PanelPreview({profile}:{profile?:PanelProfile}){
  const [failed,setFailed]=useState(false);
  if(!profile)return <section className="panelPreview panelPreviewEmpty"><div className="panelPreviewUnavailable">Select a panel to view profile.</div></section>;
  const image=panelImageCatalog[profile.id];
  return <section className="panelPreview" aria-label={`${profile.name} panel preview`} data-panel-id={profile.id}>
    <div className="panelPreviewHead"><div><span>Panel Preview</span><strong>{profile.name}</strong></div>{(!image||failed)&&<small>Visual reference unavailable</small>}</div>
    <div className={`panelPreviewMedia ${!image||failed?"unavailable":""}`}>
      {image&&!failed?<img src={assetPath(image.src)} alt={`${image.name} panel profile`} onError={()=>setFailed(true)}/>:<div className="panelPreviewUnavailable"><strong>Panel image not available</strong><span>No verified image is mapped to {profile.name}.</span></div>}
    </div>
  </section>;
}
function CustomFlashingSketch({segments,paintSide,onChange,onPaintSideChange,onDrawingChange,onExportDrawing,drawingCaptureRef}:{segments?:FlashingSegment[];paintSide?:HemSide;onChange:(segments:FlashingSegment[])=>void;onPaintSideChange:(side?:HemSide)=>void;onDrawingChange:(drawingDataUrl?:string)=>void;onExportDrawing:(drawingDataUrl:string)=>Promise<void>;drawingCaptureRef:{current:(()=>Promise<string>)|null}}){
  // Keep a local draft in sync with the order state. This makes the drawing
  // respond immediately to the first Add Segment click while still persisting
  // every edit through the parent's order draft callback.
  const [draftSegments,setDraftSegments]=useState<FlashingSegment[]>(()=>segments??[]);
  const [zoom,setZoom]=useState(1);
  const [hemControls,setHemControls]=useState<Record<HemControlId,HemControl>>(()=>({first:{target:"start",side:"left"},second:{target:"end",side:"left"}}));
  const [pan,setPan]=useState({x:0,y:0});
  const [isPanning,setIsPanning]=useState(false);
  const [exportingDrawing,setExportingDrawing]=useState(false);
  const panStart=useRef<{pointerId:number;clientX:number;clientY:number;panX:number;panY:number}|null>(null);
  const drawingRef=useRef<SVGSVGElement|null>(null);
  useEffect(()=>setDraftSegments(segments??[]),[segments]);
  const current=draftSegments;
  const commitSegments=(next:FlashingSegment[])=>{setDraftSegments(next);onChange(next)};
  // Seed the reduction with the origin so the first segment has a connected
  // start point. The previous implementation reduced an empty array, which
  // left `previous` undefined and crashed the component on the first click.
  const points=current.reduce((result,segment)=>{const previous=result[result.length-1],r=segment.direction*Math.PI/180;result.push({x:previous.x+Math.cos(r)*segment.length,y:previous.y-Math.sin(r)*segment.length});return result},[{x:0,y:0}] as Array<{x:number;y:number}>);
  const xs=points.map(point=>point.x),ys=points.map(point=>point.y),minX=Math.min(...xs,0),maxX=Math.max(...xs,0),minY=Math.min(...ys,0),maxY=Math.max(...ys,0),scale=Math.min(700/Math.max(1,maxX-minX),285/Math.max(1,maxY-minY)),pad=36;
  const toSvg=(point:{x:number;y:number})=>({x:(point.x-minX)*scale+pad,y:(maxY-point.y)*scale+pad});
  const svgPoints=points.map(toSvg);
  const paintSideLines=paintSide?current.map((segment,index)=>{
    const start=points[index],end=points[index+1],dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx,dy)||1,side=paintSide==="left"?1:-1,offset=.12;
    const normal={x:-dy/length*side*offset,y:dx/length*side*offset};
    return {start:toSvg({x:start.x+normal.x,y:start.y+normal.y}),end:toSvg({x:end.x+normal.x,y:end.y+normal.y})};
  }):[];
  const normalizeHem=(hem?:HemType|HemConfig):HemConfig|undefined=>hem?(typeof hem==="string"?{type:hem,side:"left"}:hem):undefined;
  const endHem=normalizeHem(current.at(-1)?.hem),startHem=normalizeHem(current[0]?.startHem);
  const buildHem=(hem:HemConfig,anchor:{x:number;y:number},direction:number,key:"start"|"end")=>{
    // A hem is a 180° return: it leaves the profile in its local direction,
    // rounds through the selected side, then runs back parallel to the parent.
    // Keeping every point in the local tangent/normal frame makes the same
    // geometry work for horizontal, vertical, and angled profile ends.
    // These dimensions are in profile inches before converting to SVG space,
    // so the hem stays proportional to the flashing at every zoom level.
    // An open hem uses a tight 1/64 in opening without exposing that shop
    // dimension in the customer-facing drawing or order output.
    // A closed hem has an even tighter radius so its return visually butts
    // against the parent profile, like a compressed folded edge.
    const angle=direction*Math.PI/180,ux=Math.cos(angle),uy=-Math.sin(angle),side=hem.side==="left"?1:-1,nx=-uy*side,ny=ux*side,gap=hem.type==="open-1/8"?0.015625:0,radius=hem.type==="open-1/8"?.05:.025,returnLength=hem.type==="open-1/8"?.24:.2,controlDistance=radius*1.2;
    const foldEnd={x:anchor.x+nx*(radius*2+gap),y:anchor.y+ny*(radius*2+gap)},returnEnd={x:foldEnd.x-ux*returnLength,y:foldEnd.y-uy*returnLength},control1={x:anchor.x+ux*controlDistance,y:anchor.y+uy*controlDistance},control2={x:foldEnd.x+ux*controlDistance,y:foldEnd.y+uy*controlDistance},label={x:returnEnd.x+nx*.2,y:returnEnd.y+ny*.2};
    const a=toSvg(anchor),c1=toSvg(control1),c2=toSvg(control2),d=toSvg(foldEnd),e=toSvg(returnEnd),text=toSvg(label);
    return {key,type:hem.type,d:`M ${a.x} ${a.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${d.x} ${d.y} L ${e.x} ${e.y}`,label:text};
  };
  const hemDrawings=[startHem&&current[0]?buildHem(startHem,points[0],current[0].direction+180,"start"):undefined,endHem&&current.at(-1)?buildHem(endHem,points.at(-1)!,current.at(-1)!.direction,"end"):undefined].filter((hem):hem is NonNullable<typeof hem>=>Boolean(hem));
  const zoomViewWidth=780/zoom,zoomViewHeight=350/zoom,zoomViewX=(780-zoomViewWidth)/2,zoomViewY=(350-zoomViewHeight)/2;
  const panLimits={x:Math.max(140,(780-zoomViewWidth)*.75),y:Math.max(100,(350-zoomViewHeight)*.75)};
  const clampPan=(value:{x:number;y:number},limits=panLimits)=>({x:Math.max(-limits.x,Math.min(limits.x,value.x)),y:Math.max(-limits.y,Math.min(limits.y,value.y))});
  const viewBoxX=zoomViewX+pan.x,viewBoxY=zoomViewY+pan.y;
  useEffect(()=>setPan(value=>clampPan(value)),[zoom]);
  const angleAt=(index:number)=>{const first=current[index-1],second=current[index];if(!first||!second)return 0;const delta=(second.direction-first.direction)*Math.PI/180;return Math.round(Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta)))*180/Math.PI)};
  const updateSegment=(index:number,key:"length"|"direction",raw:string)=>{const next=[...current];next[index]={...next[index],[key]:Math.max(key==="length"?0.25:-360,Number(raw)||0)};commitSegments(next)};
  const updateBend=(index:number,raw:string)=>{if(index===0)return;const next=[...current],angle=Number(raw)||0;next[index]={...next[index],direction:next[index-1].direction+angle};commitSegments(next)};
  const readHem=(segments:FlashingSegment[],target:HemTarget)=>target==="start"?normalizeHem(segments[0]?.startHem):normalizeHem(segments.at(-1)?.hem);
  const writeHem=(segments:FlashingSegment[],target:HemTarget,hem?:HemConfig)=>{
    if(!segments.length)return;
    if(target==="start"){
      const first={...segments[0]};
      if(hem)first.startHem={...hem};else delete first.startHem;
      segments[0]=first;
    }else{
      const last=segments.length-1,lastSegment={...segments[last]};
      if(hem)lastSegment.hem={...hem};else delete lastSegment.hem;
      segments[last]=lastSegment;
    }
  };
  const addSegment=()=>{const direction=current.length?current[current.length-1].direction+90:90;const next=[...current];if(next.length&&next[next.length-1].hem){const {...withoutHem}=next[next.length-1];next[next.length-1]=withoutHem}commitSegments([...next,{length:4,direction}])};
  const selectHemEnd=(control:HemControlId,nextTarget:HemTarget)=>{
    // Each control selects an endpoint independently. Choosing one never
    // moves, replaces, or alters the hem stored at the other endpoint.
    const nextHem=readHem(current,nextTarget);
    setHemControls(previous=>({...previous,[control]:{target:nextTarget,side:nextHem?.side??previous[control].side}}));
  };
  const selectHemSide=(control:HemControlId,side:HemSide)=>{
    const target=hemControls[control].target,activeHem=readHem(current,target);
    setHemControls(previous=>({...previous,[control]:{...previous[control],side}}));
    if(!activeHem)return;
    const next=[...current];writeHem(next,target,{...activeHem,side});commitSegments(next);
  };
  const addHem=(control:HemControlId,type:HemType)=>{if(!current.length)return;const {target,side}=hemControls[control],next=[...current];writeHem(next,target,{type,side});commitSegments(next)};
  const clearHem=(control:HemControlId)=>{if(!current.length)return;const next=[...current];writeHem(next,hemControls[control].target);commitSegments(next)};
  const flipHem=(control:HemControlId)=>{const {target}=hemControls[control],activeHem=readHem(current,target);if(!activeHem)return;const flipped={...activeHem,side:activeHem.side==="left"?"right":"left"} as HemConfig,next=[...current];writeHem(next,target,flipped);setHemControls(previous=>({...previous,[control]:{...previous[control],side:flipped.side}}));commitSegments(next)};
  const removeSegment=()=>commitSegments(current.slice(0,-1));
  const startPan=(event:ReactPointerEvent<SVGSVGElement>)=>{if(event.button!==0)return;panStart.current={pointerId:event.pointerId,clientX:event.clientX,clientY:event.clientY,panX:pan.x,panY:pan.y};event.currentTarget.setPointerCapture(event.pointerId);setIsPanning(true)};
  const movePan=(event:ReactPointerEvent<SVGSVGElement>)=>{const start=panStart.current;if(!start||start.pointerId!==event.pointerId)return;const rect=event.currentTarget.getBoundingClientRect(),dx=(event.clientX-start.clientX)*(zoomViewWidth/rect.width),dy=(event.clientY-start.clientY)*(zoomViewHeight/rect.height);setPan(clampPan({x:start.panX-dx,y:start.panY-dy}))};
  const endPan=(event:ReactPointerEvent<SVGSVGElement>)=>{if(panStart.current?.pointerId!==event.pointerId)return;panStart.current=null;setIsPanning(false);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)};
  const captureDrawing=()=>new Promise<string>((resolve,reject)=>{
    const source=drawingRef.current;if(!source){reject(new Error("Add a segment before exporting the drawing."));return;}
    const clone=source.cloneNode(true) as SVGSVGElement,namespace="http://www.w3.org/2000/svg",background=document.createElementNS(namespace,"rect"),style=document.createElementNS(namespace,"style");
    clone.setAttribute("xmlns",namespace);clone.setAttribute("viewBox","0 0 780 350");clone.setAttribute("width","1560");clone.setAttribute("height","700");background.setAttribute("width","780");background.setAttribute("height","350");background.setAttribute("fill","#ffffff");
    style.textContent=".drawingAxis{stroke:#c2d5df;stroke-width:1;stroke-dasharray:5 6}.flashingProfileLine{fill:none;stroke:#12699b;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.paintSideLine{stroke:#2382b7;stroke-width:3;stroke-linecap:round;stroke-dasharray:6 4}.flashingHemLine{fill:none;stroke:#c56624;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.flashingHemLabel{fill:#99551e;font:700 11px Arial,sans-serif}.flashingDimension line{stroke:#6f8b9c;stroke-width:1}.flashingDimension text,.flashingAngle text{fill:#294f67;font:700 12px Arial,sans-serif}.flashingAngle circle{fill:#fff;stroke:#12699b;stroke-width:2}";
    clone.insertBefore(background,clone.firstChild);clone.insertBefore(style,background.nextSibling);const objectUrl=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:"image/svg+xml"})),image=new Image();
    image.onload=()=>{const canvas=document.createElement("canvas");canvas.width=1560;canvas.height=700;const context=canvas.getContext("2d");if(!context){URL.revokeObjectURL(objectUrl);reject(new Error("Unable to prepare the drawing export."));return;}context.drawImage(image,0,0,canvas.width,canvas.height);URL.revokeObjectURL(objectUrl);resolve(canvas.toDataURL("image/png"));};image.onerror=()=>{URL.revokeObjectURL(objectUrl);reject(new Error("Unable to prepare the drawing export."));};image.src=objectUrl;
  });
  const exportDrawing=async()=>{if(!current.length)return;setExportingDrawing(true);try{await onExportDrawing(await captureDrawing());}finally{setExportingDrawing(false)}};
  useEffect(()=>{
    if(!current.length){onDrawingChange(undefined);return;}
    const frame=window.requestAnimationFrame(()=>{captureDrawing().then(onDrawingChange).catch(()=>undefined)});
    return ()=>window.cancelAnimationFrame(frame);
  },[current,paintSide]);
  useEffect(()=>{
    drawingCaptureRef.current=current.length?captureDrawing:null;
    return ()=>{drawingCaptureRef.current=null;};
  },[current,paintSide]);
  return <div className="customSketch">
    <div className="customSketchHead">
      <div><strong>Fabrication profile drawing</strong><span>Set each leg in inches. Bend angles and dimension callouts update automatically.</span></div>
      <div className="customSketchActions">
        <button type="button" className="ghost" onClick={removeSegment} disabled={!current.length}>Remove segment</button>
        <button type="button" className="ghost" aria-label="Add custom flashing segment" onClick={addSegment}>+ Add segment</button>
        <button type="button" className="ghost" aria-label="Export custom flashing drawing PDF" onClick={exportDrawing} disabled={!current.length||exportingDrawing}>{exportingDrawing?"Preparing drawing…":"Export Drawing PDF"}</button>
        <label className="paintSideControl">Color / paint side<select value={paintSide??""} onChange={event=>onPaintSideChange(event.target.value?event.target.value as HemSide:undefined)}><option value="">Not shown</option><option value="left">Left / inward</option><option value="right">Right / outward</option></select></label>
        {(["first","second"] as HemControlId[]).map((control,index)=>{
          const {target,side}=hemControls[control],activeHem=readHem(current,target),label=`Hem ${index+1}`;
          return <span className="hemControls" aria-label={`${label} controls`} key={control}>
            <label>{label} end<select value={target} onChange={event=>selectHemEnd(control,event.target.value as HemTarget)}><option value="start">Profile start</option><option value="end">Profile end</option></select></label>
            <label>Fold side<select value={side} onChange={event=>selectHemSide(control,event.target.value as HemSide)}><option value="left">Left / inward</option><option value="right">Right / outward</option></select></label>
            <button type="button" className="ghost" aria-label={`Add closed hem to ${label}`} onClick={()=>addHem(control,"closed")} disabled={!current.length}>Add Closed Hem</button>
            <button type="button" className="ghost" aria-label={`Add open hem to ${label}`} onClick={()=>addHem(control,"open-1/8")} disabled={!current.length}>Add Open Hem</button>
            {activeHem&&<><button type="button" className="ghost" aria-label={`Flip ${label}`} onClick={()=>flipHem(control)}>Flip hem</button><button type="button" className="ghost" aria-label={`Clear ${label}`} onClick={()=>clearHem(control)}>Clear hem</button></>}
          </span>;
        })}
        <span className="zoomControls" aria-label="Drawing zoom controls">
          <button type="button" className="ghost" aria-label="Zoom out" onClick={()=>setZoom(value=>Math.max(.6,Number((value-.2).toFixed(2))))} disabled={zoom<=.6}>−</button>
          <span aria-live="polite">{Math.round(zoom*100)}%</span>
          <button type="button" className="ghost" aria-label="Zoom in" onClick={()=>setZoom(value=>Math.min(2.5,Number((value+.2).toFixed(2))))} disabled={zoom>=2.5}>+</button>
          <button type="button" className="ghost" aria-label="Reset drawing zoom" onClick={()=>{setZoom(1);setPan({x:0,y:0})}} disabled={zoom===1&&!pan.x&&!pan.y}>Reset Zoom</button>
        </span>
      </div>
    </div>
    <div className="flashingDrawingCanvas">
      {current.length?<svg ref={drawingRef} className={isPanning?"isPanning":""} viewBox={`${viewBoxX} ${viewBoxY} ${zoomViewWidth} ${zoomViewHeight}`} role="img" aria-label="Parametric custom flashing fabrication drawing" onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} onPointerLeave={endPan}>
        <defs><marker id="flashing-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#6f8b9c"/></marker></defs>
        <line className="drawingAxis" x1="0" y1={pad} x2="780" y2={pad}/>
        <polyline className="flashingProfileLine" points={svgPoints.map(point=>`${point.x},${point.y}`).join(" ")}/>
        {paintSideLines.map((line,index)=><line className="paintSideLine" key={`paint-side-${index}`} x1={line.start.x} y1={line.start.y} x2={line.end.x} y2={line.end.y}/>)}
        {hemDrawings.map(hem=><g key={hem.key}><path className={`flashingHemLine ${hem.type==="open-1/8"?"openHem":"closedHem"}`} d={hem.d}/><text className="flashingHemLabel" x={hem.label.x+10} y={hem.label.y-10}>{hem.type==="open-1/8"?"OPEN HEM":"CLOSED HEM"}</text></g>)}
        {svgPoints.slice(0,-1).map((point,index)=>{const next=svgPoints[index+1],dx=next.x-point.x,dy=next.y-point.y,length=Math.hypot(dx,dy)||1,nx=-dy/length*15,ny=dx/length*15;return <g key={`dimension-${index}`} className="flashingDimension"><line x1={point.x+nx} y1={point.y+ny} x2={next.x+nx} y2={next.y+ny} markerStart="url(#flashing-arrow)" markerEnd="url(#flashing-arrow)"/><text x={(point.x+next.x)/2+nx} y={(point.y+next.y)/2+ny-5} textAnchor="middle">{current[index].length.toFixed(2)} in</text></g>})}
        {svgPoints.slice(1,-1).map((point,index)=>{const angle=angleAt(index+1);return <g key={`angle-${index}`} className="flashingAngle"><circle cx={point.x} cy={point.y} r="3"/><text x={point.x+14} y={point.y-14}>∠ {angle}°</text></g>})}
      </svg>:<div className="drawingEmpty">Add a segment to begin a dimensioned flashing profile.</div>}
    </div>
    {paintSide&&<p className="paintSideLegend"><i aria-hidden="true"/>Color / paint side is marked in blue. The opposite face is primer.</p>}
    <div className="segmentEditor">
      {current.map((segment,index)=>{const leadingHem=normalizeHem(segment.startHem),trailingHem=normalizeHem(segment.hem);return <div className="segmentRow" key={index}>
        <strong>Section {index+1}</strong>
        <label>Length (in)<input type="number" min="0.25" step="0.25" value={segment.length} onChange={event=>updateSegment(index,"length",event.target.value)}/></label>
        <label>Direction (°)<input type="number" step="1" value={segment.direction} onChange={event=>updateSegment(index,"direction",event.target.value)}/></label>
        {index>0&&<label>Bend angle (°)<input type="number" min="0" max="360" step="1" value={angleAt(index)} onChange={event=>updateBend(index,event.target.value)}/></label>}
        {leadingHem&&<span className="hemStatus">Start: {leadingHem.type==="open-1/8"?"OPEN":"CLOSED"}</span>}
        {trailingHem&&<span className="hemStatus">End: {trailingHem.type==="open-1/8"?"OPEN":"CLOSED"}</span>}
      </div>})}
    </div>
  </div>;
}
function PanelQueueThumbnail({panel}:{panel:PanelSnapshot}){
  const [failed,setFailed]=useState(false);
  const panelId=panel.panelId??panelProfiles.find(candidate=>candidate.name===normalizeProductTerminology(panel.name))?.id;
  const image=panelId?panelImageCatalog[panelId]:undefined;
  return <div className={`panelQueueThumbnail ${!image||failed?"unavailable":""}`} aria-hidden="true">
    {image&&!failed
      ?<img src={assetPath(image.src)} alt="" onError={()=>setFailed(true)}/>
      :<span className="panelQueueThumbnailFallback"><i></i><i></i><i></i></span>}
  </div>;
}
export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [showPrintSummary, setShowPrintSummary] = useState(false);
  const [pdfDownload, setPdfDownload] = useState<{url:string;filename:string} | null>(null);
  const [pdfError, setPdfError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderOwnerAccount, setOrderOwnerAccount] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("draft");
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [step, setStep] = useState(0);
  const profiles = configuredProfiles;
  const [profileIndex, setProfileIndex] = useState(-1);
  const hasSelectedProfile = profileIndex >= 0 && profileIndex < profiles.length;
  const profile = hasSelectedProfile ? profiles[profileIndex] : undefined;
  const [materialId, setMaterialId] = useState<MaterialFinishId | "">("");
  const materialAvailability = profile && materialId ? getMaterialAvailability(profile, materialId) : null;
  const [coverage, setCoverage] = useState("");
  const [gauge, setGauge] = useState("");
  const [color, setColor] = useState("");
  const [lengthRows, setLengthRows] = useState<LengthRow[]>([{ id: 1, feet: 0, inches: 0, qty: 0 }]);
  const [nextRowId, setNextRowId] = useState(2);
  const [pan, setPan] = useState("");
  const [notching, setNotching] = useState<"Notched" | "No Notch" | "">("");
  const [roofPitch, setRoofPitch] = useState("");
  const [savedPanels, setSavedPanels] = useState<PanelSnapshot[]>([]);
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [customer, setCustomer] = useState("");
  const [customerAccount, setCustomerAccount] = useState("");
  const [purchasingContact, setPurchasingContact] = useState("");
  const [email, setEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingAddressVerified, setBillingAddressVerified] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [jobName, setJobName] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [projectName, setProjectName] = useState("");
  const [receivingContact, setReceivingContact] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [delivery, setDelivery] = useState("");
  const [willCallBranch, setWillCallBranch] = useState("");
  const [jobsiteAddress, setJobsiteAddress] = useState("");
  const [jobsiteAddressVerified, setJobsiteAddressVerified] = useState(false);
  const [projectNotes, setProjectNotes] = useState("");
  const [selectedClip, setSelectedClip] = useState("");
  const [accessoryQty, setAccessoryQty] = useState<Record<string, number>>({});
  const [activeAccessoryCategory, setActiveAccessoryCategory] = useState(accessoryCategories[0]);
  const [accessorySearch, setAccessorySearch] = useState("");
  const [flashingQty, setFlashingQty] = useState<Record<string, number>>({});
  const [flashingSearch, setFlashingSearch] = useState("");
  const [flashingSameAsPanel, setFlashingSameAsPanel] = useState(true);
  const [flashingGauge, setFlashingGauge] = useState("26 ga");
  const [flashingColor, setFlashingColor] = useState("Glacier White");
  const [flashingPitchMode, setFlashingPitchMode] = useState<Record<string,"panel"|"custom">>({});
  const [flashingCustomPitch, setFlashingCustomPitch] = useState<Record<string,string>>({});
  const [showCustomFlashing, setShowCustomFlashing] = useState(false);
  const [customFlashing, setCustomFlashing] = useState<CustomFlashingRequest>({description:""});
  const [customFlashingMessage, setCustomFlashingMessage] = useState("");
  const customDrawingCaptureRef=useRef<(()=>Promise<string>)|null>(null);
  const [oilCanningAcknowledged, setOilCanningAcknowledged] = useState(false);
  const [orderReviewAcknowledged, setOrderReviewAcknowledged] = useState(false);
  const [acknowledgementError, setAcknowledgementError] = useState("");

  const colors = profile && materialId ? getPanelColors(profile, materialId, gauge) : [];
  const coverageInches = parseFloat(coverage) || 36;
  const totalPanels = lengthRows.reduce((sum, row) => sum + row.qty, 0);
  const totalLinearFeet = lengthRows.reduce((sum, row) => sum + (row.feet + row.inches / 12) * row.qty, 0);
  const area = useMemo(() => Math.round((coverageInches / 12) * totalLinearFeet), [coverageInches, totalLinearFeet]);
  const selectedAccessories = accessoryCatalog.filter(item => accessoryGroup(item) && (accessoryQty[item.id] || 0) > 0);
  const selectedAccessoryUnits = selectedAccessories.reduce((sum, item) => sum + accessoryQty[item.id], 0);
  const filteredAccessories = accessoryCatalog.filter(item => accessoryGroup(item) === activeAccessoryCategory && `${item.name} ${item.id}`.toLowerCase().includes(accessorySearch.toLowerCase()));
  const clipOptions = profile ? clipOptionsFor(profile.id) : [];
  const effectiveClip = profile ? selectedClip || clipOptions[0] || "" : "";
  const selectedFlashings = flashingCatalog.filter(name => (flashingQty[name] || 0) > 0);
  const selectedFlashingPieces = selectedFlashings.reduce((sum, name) => sum + flashingQty[name], 0);
  const hasCustomFlashing = Boolean(customFlashing.description.trim() || customFlashing.attachment || customFlashing.sketchDataUrl || customFlashing.drawingDataUrl || customFlashing.segments?.length);
  const filteredFlashingGroups = flashingGroups.map(group => ({
    ...group,
    items: group.items.filter(name => name.toLowerCase().includes(flashingSearch.toLowerCase()))
  })).filter(group => group.items.length > 0);
  const effectiveFlashingGauge = flashingSameAsPanel ? hasSelectedProfile ? gauge : "" : flashingGauge;
  const effectiveFlashingColor = flashingSameAsPanel ? hasSelectedProfile ? color : "" : flashingColor;
  const currentPanel:PanelSnapshot | null = profile && materialId ? {panelId:profile.id,materialId,finish:materialLabel(materialId),name:profile.name,coverage,gauge,color,pan:panProfileIds.has(profile.id)?pan:undefined,notching:allowsNotching(profile.id)?notching||undefined:undefined,roofPitch:isRoofPanel(profile.id)?roofPitch:undefined,clip:effectiveClip||undefined,coil:materialAvailability?.coil,lengths:lengthRows.map(row=>({...row})),totalPanels,area} : null;
  const allPanels = savedPanels.length
    ? [...savedPanels.map((item,index)=>index===activePanelIndex&&currentPanel?currentPanel:item), ...(currentPanel&&activePanelIndex>=savedPanels.length?[currentPanel]:[])]
    : currentPanel ? [currentPanel] : [];
  const orderPanelCount = allPanels.reduce((sum,item)=>sum+item.totalPanels,0);
  const orderArea = allPanels.reduce((sum,item)=>sum+item.area,0);
  const activeRoofPitch = allPanels.find(item=>item.roofPitch)?.roofPitch || roofPitch;
  const flashingPitch=(name:string)=>pitchType(name)?(flashingPitchMode[name]==="custom"?(flashingCustomPitch[name]||"Custom pitch not entered"):activeRoofPitch):"";
  const addOnCount = selectedAccessories.length + selectedFlashings.length + (effectiveClip ? 1 : 0);
  const inquiry = Boolean(profile?.note?.toLowerCase().includes("inquiry"));
  const complete = hasSelectedProfile && customer.trim() && jobName.trim() && receivingContact.trim() && requestedDate && lengthRows.every(row => row.qty > 0 && (row.feet > 0 || row.inches > 0)) && color;
  const accessorySubtotal = selectedAccessories.reduce((sum,item)=>sum+(item.price??0)*(accessoryQty[item.id]||0),0);
  const tax = 0;
  const orderTotal = accessorySubtotal + tax;

  function chooseProfile(i: number) {
    const nextProfile=profiles[i],nextMaterial=nextProfile.materials[0],nextGauge=nextMaterial.gauges[0];
    setProfileIndex(i);setCoverage(nextProfile.coverages[0]);setMaterialId(nextMaterial.id);setGauge(nextGauge);setColor(getPanelColors(nextProfile,nextMaterial.id,nextGauge)[0]);setPan("Striations");setNotching("No Notch");setSelectedClip(clipOptionsFor(nextProfile.id)[0]||"");
  }

  function startBlankPanel() {
    setProfileIndex(-1);setMaterialId("");setCoverage("");setGauge("");setColor("");setPan("");setNotching("");setRoofPitch("");setSelectedClip("");setLengthRows([{id:nextRowId,feet:0,inches:0,qty:0}]);setNextRowId(id=>id+1);
  }

  function chooseMaterial(next:MaterialFinishId){const selectedProfile=profile!;const nextGauge=getGaugeOptions(selectedProfile,next)[0];setMaterialId(next);setGauge(nextGauge);setColor(getPanelColors(selectedProfile,next,nextGauge)[0]);}
  function chooseGauge(next: string) { setGauge(next); setColor(getPanelColors(profile!, materialId as MaterialFinishId, next)[0]); }
  function updateLength(id: number, key: "feet" | "inches" | "qty", value: number) { setLengthRows(rows => rows.map(row => row.id === id ? { ...row, [key]: value } : row)); }
  function addLength() { setLengthRows(rows => [...rows, { id: nextRowId, feet: 0, inches: 0, qty: 0 }]); setNextRowId(id => id + 1); }
  function removeLength(id: number) { if (lengthRows.length > 1) setLengthRows(rows => rows.filter(row => row.id !== id)); }
  function loadPanel(item:PanelSnapshot){
    const canonicalName=normalizeProductTerminology(item.name);
    const index=Math.max(0,profiles.findIndex(panel=>(item.panelId?panel.id===item.panelId:panel.name===canonicalName)&&panel.coverages[0]===item.coverage));
    const nextProfile=profiles[index],requestedMaterial=normalizeMaterialId(item.materialId||item.finish,item.gauge),nextMaterial=nextProfile.materials.some(option=>option.id===requestedMaterial)?requestedMaterial:nextProfile.materials[0].id;
    const allowedGauges=getGaugeOptions(nextProfile,nextMaterial),nextGauge=allowedGauges.includes(item.gauge)?item.gauge:allowedGauges[0],allowedColors=getPanelColors(nextProfile,nextMaterial,nextGauge),nextColor=allowedColors.includes(item.color)?item.color:allowedColors[0];
    setProfileIndex(index);setCoverage(nextProfile.coverages[0]);setMaterialId(nextMaterial);setGauge(nextGauge);setColor(nextColor);setPan(item.pan||"Striations");setNotching((item.notching||"No Notch") as "Notched"|"No Notch");setRoofPitch(item.roofPitch||"");setSelectedClip(item.clip||"");setLengthRows(item.lengths.map(row=>({...row})));setNextRowId(Math.max(...item.lengths.map(row=>row.id),0)+1);
  }
  function addNewPanel(){
    const panels=[...allPanels];setSavedPanels(panels);setActivePanelIndex(panels.length);startBlankPanel();
  }
  function switchPanel(index:number){const panels=[...allPanels];setSavedPanels(panels);setActivePanelIndex(index);loadPanel(panels[index]);}
  function removePanel(index:number){
    if(allPanels.length===1)return;const wasEditingBlank=!hasSelectedProfile&&activePanelIndex>=savedPanels.length;const panels=allPanels.filter((_,i)=>i!==index);
    const nextIndex=index===activePanelIndex?Math.min(index,panels.length-1):index<activePanelIndex?activePanelIndex-1:activePanelIndex;
    setSavedPanels(panels);setActivePanelIndex(wasEditingBlank?panels.length:nextIndex);if(wasEditingBlank)startBlankPanel();else loadPanel(panels[nextIndex]);
  }
  function toggleAccessory(id: string) { setAccessoryQty(current => ({ ...current, [id]: current[id] > 0 ? 0 : 1 })); }
  function setAccessoryQuantity(id: string, quantity: number) { setAccessoryQty(current => ({ ...current, [id]: Math.max(0, quantity) })); }
  function toggleFlashing(name: string) { setFlashingQty(current => ({ ...current, [name]: current[name] > 0 ? 0 : 1 })); }
  function setFlashingQuantity(name: string, quantity: number) { setFlashingQty(current => ({ ...current, [name]: Math.max(0, quantity) })); }
  function handleCustomFlashingAttachment(file?:File){
    if(!file)return;
    if(!["image/jpeg","image/png"].includes(file.type)){setCustomFlashingMessage("Please upload a PNG or JPG drawing.");return;}
    if(file.size>2*1024*1024){setCustomFlashingMessage("Please choose an image smaller than 2 MB.");return;}
    const reader=new FileReader();reader.onload=()=>{setCustomFlashing(value=>({...value,attachment:{name:file.name,dataUrl:String(reader.result)}}));setCustomFlashingMessage("Drawing attached to this order.");};reader.onerror=()=>setCustomFlashingMessage("We couldn't read that image. Please try another file.");reader.readAsDataURL(file);
  }
  async function exportCustomFlashingDrawing(drawingDataUrl:string){
    try{
      setCustomFlashing(value=>({...value,drawingDataUrl}));
      const {downloadCustomFlashingDrawingPdf}=await import("./client-pdf"),download=await downloadCustomFlashingDrawingPdf({drawingDataUrl,orderNumber,description:customFlashing.description,paintSide:customFlashing.paintSide});
      const link=document.createElement("a");link.href=download.url;link.download=download.filename;link.click();setCustomFlashingMessage("Drawing PDF created and attached to this order. Save the draft to retain it.");
    }catch(error){setCustomFlashingMessage(error instanceof Error?error.message:"Unable to export the drawing PDF.");}
  }

  function buildDraftPayload():OrderDraftPayload{return {customer,customerAccount,purchasingContact,email,billingAddress,billingAddressVerified,paymentTerms,jobName,poNumber,projectName,receivingContact,requestedDate,delivery,willCallBranch,jobsiteAddress,jobsiteAddressVerified,projectNotes,panels:allPanels.map(item=>({...item,lengths:item.lengths.map(row=>({...row}))})),accessoryQty:{...accessoryQty},flashingQty:{...flashingQty},flashingSameAsPanel,flashingGauge,flashingColor,flashingPitchMode:{...flashingPitchMode},flashingCustomPitch:{...flashingCustomPitch},customFlashing}}
  function buildReportPayload(number=orderNumber){
    const fulfillmentDetail=delivery==="Will call"?`${delivery} - ${willCallBranch}`:delivery==="Deliver to Jobsite"?`${delivery} - ${jobsiteAddress}`:`${delivery} - ${billingAddress}`;
    return {orderNumber:number,submitted:new Date().toLocaleDateString(),poNumber,company:{name:customer,account:customerAccount,contact:purchasingContact,email,address:billingAddress,payment:paymentTerms},project:{jobName,projectName,receivingContact,requestedDate,delivery:fulfillmentDetail,notes:projectNotes,address:jobsiteAddress||billingAddress},submittedBy:purchasingContact,panels:allPanels,accessories:selectedAccessories.map(item=>({quantity:accessoryQty[item.id],unit:item.unit,category:accessoryGroup(item),name:item.name,part:item.id,unitPrice:item.price,lineTotal:item.price===null?null:item.price*accessoryQty[item.id]})),flashings:selectedFlashings.map(name=>({quantity:flashingQty[name],name,pitch:flashingPitch(name)})),customFlashing,flashingFinish:{gauge:effectiveFlashingGauge,color:effectiveFlashingColor},totals:{panels:orderPanelCount,area:orderArea,subtotal:accessorySubtotal,tax,total:orderTotal}};
  }
  async function persistOrder(status:OrderStatus){
    if(!customerAccount.trim()){setOrderMessage("Enter a customer account number before saving.");return null;}
    setSavingOrder(true);setOrderMessage("");
    try{
      const saved=await saveOrder<OrderDraftPayload>({id:orderId||undefined,ownerAccount:orderOwnerAccount||undefined,customerAccount,status,payload:buildDraftPayload()});
      setOrderId(saved.id);setOrderOwnerAccount(saved.customerAccount);setOrderNumber(saved.orderNumber);setOrderStatus(saved.status);setOrderMessage(status==="submitted"?"Order finalized and saved.":"Draft saved successfully.");
      return saved;
    }catch(error){console.error(error);setOrderMessage("We couldn't save your draft. Please try again.");return null;}finally{setSavingOrder(false);}
  }
  async function exportPdf(number=orderNumber){
    if(!number){setPdfError("Save the order to assign an order number before exporting PDF.");return null;}
    setPdfError("");
    try{const {downloadOrderPdf}=await import("./client-pdf");const download=await downloadOrderPdf(buildReportPayload(number));setPdfDownload(download);const link=document.createElement("a");link.href=download.url;link.download=download.filename;link.click();return download.url;}catch(error){setPdfError(error instanceof Error?error.message:"Unable to generate PDF");return null;}
  }
  async function navigateToStep(nextStep:number){
    if(step===4&&nextStep>4&&customDrawingCaptureRef.current){
      try{const drawingDataUrl=await customDrawingCaptureRef.current();setCustomFlashing(value=>({...value,drawingDataUrl}));}catch{setCustomFlashingMessage("The custom flashing drawing could not be attached. Please try exporting it again.");}
    }
    setStep(nextStep);
  }
  async function submitOrder(){
    const missingAcknowledgements=[
      !oilCanningAcknowledged?"Oil Canning acknowledgement":"",
      !orderReviewAcknowledged?"Profile and order review confirmation":"",
    ].filter(Boolean);
    if(missingAcknowledgements.length){
      setAcknowledgementError(`Required before submission: ${missingAcknowledgements.join("; ")}.`);
      setOrderMessage("");
      return;
    }
    setAcknowledgementError("");setPdfError("");const saved=await persistOrder("submitted");if(!saved)return;setSubmitted(true);await exportPdf(saved.orderNumber);setShowPrintSummary(true);
  }

  if(showPrintSummary){
    const fulfillmentDetail=delivery==="Will call"?`${delivery} - ${willCallBranch}`:delivery==="Deliver to Jobsite"?`${delivery} - ${jobsiteAddress}`:`${delivery} - ${billingAddress}`;
    return <main className="printSummaryPage"><div className="printToolbar"><button onClick={()=>setShowPrintSummary(false)}>← Back to order</button><div><strong>Order summary</strong><span>Review the completed order below.</span></div></div><article className="printSheet">
      <header className="printHeader"><img src={assetPath("/taylor-metal-logo.png")} alt="Taylor Metal Products"/><div><h1>ORDER SUMMARY</h1><dl><div><dt>Order #</dt><dd>{orderNumber}</dd></div><div><dt>PO #</dt><dd>{poNumber||"Not provided"}</dd></div><div><dt>Date</dt><dd>{new Date().toLocaleDateString()}</dd></div><div><dt>Requested</dt><dd>{requestedDate||"Not set"}</dd></div></dl></div></header>
      <section className="printInfoGrid"><div><h2>PURCHASING COMPANY</h2><p><strong>{customer}</strong><br/>Account: {customerAccount}<br/>Contact: {purchasingContact}<br/>{email}<br/>{billingAddress}<br/>Payment: {paymentTerms}</p></div><div><h2>PROJECT INFORMATION</h2><p><strong>Job: {jobName}</strong><br/>Project: {projectName||"Not provided"}<br/>Receiving: {receivingContact}<br/>Delivery: {fulfillmentDetail}<br/>Submitted by: {purchasingContact||"Not provided"}</p></div></section>
      <section className="printSection"><h2>PANELS</h2><table><thead><tr><th>QTY</th><th>ITEM DESCRIPTION</th><th>GA./MATERIAL</th><th>FINISH</th><th>COLOR</th><th>OPTIONS</th></tr></thead><tbody>{allPanels.map((item,index)=><Fragment key={`${item.name}-${index}`}><tr className="parentRow"><td>{item.totalPanels}</td><td>{index+1}. {item.name} - {item.coverage}</td><td>{item.gauge}</td><td>{item.finish}</td><td>{item.color}</td><td>{[item.pan,item.notching,item.roofPitch?`Pitch ${item.roofPitch}`:"",item.clip].filter(Boolean).join(" | ")}</td></tr>{item.lengths.map((row,rowIndex)=><tr key={`${row.id}-${rowIndex}`}><td>{row.qty}</td><td>Length: {row.feet} ft {row.inches} in</td><td colSpan={4}></td></tr>)}</Fragment>)}</tbody></table><div className="printTotals"><strong>PANEL TOTAL: {orderPanelCount}</strong><strong>COVERAGE AREA: {orderArea.toLocaleString()} SQ FT</strong></div></section>
      <section className="printSection"><h2>ACCESSORIES</h2><table><thead><tr><th>QTY</th><th>UNIT</th><th>TYPE</th><th>ITEM DESCRIPTION</th><th>PART</th></tr></thead><tbody>{selectedAccessories.length?selectedAccessories.map(item=><tr key={item.id}><td>{accessoryQty[item.id]}</td><td>{item.unit}</td><td>{accessoryGroup(item)}</td><td>{item.name}</td><td>{item.id}</td></tr>):<tr><td colSpan={5}>No accessories selected</td></tr>}</tbody></table></section>
      <section className="printSection"><h2>FLASHINGS</h2><table><thead><tr><th>QTY</th><th>ITEM DESCRIPTION</th><th>GA./MATERIAL</th><th>COLOR</th><th>PITCH</th></tr></thead><tbody>{selectedFlashings.length?selectedFlashings.map(name=><tr key={name}><td>{flashingQty[name]}</td><td>{name}</td><td>{effectiveFlashingGauge}</td><td>{effectiveFlashingColor}</td><td>{flashingPitch(name)||"N/A"}</td></tr>):<tr><td colSpan={5}>No flashings selected</td></tr>}</tbody></table></section>
      {hasCustomFlashing&&<section className="printSection"><h2>CUSTOM FLASHING REQUEST</h2><p>{customFlashing.description||"Customer drawing/sketch attached for Taylor Metal review."}</p>{customFlashing.paintSide&&<p>Color / paint side: {customFlashing.paintSide==="left"?"Left / inward":"Right / outward"}. Opposite face: primer.</p>}{customFlashing.segments?.length&&<table><thead><tr><th>SECTION</th><th>LENGTH (IN)</th><th>DIRECTION (°)</th><th>BEND (°)</th><th>HEM</th></tr></thead><tbody>{customFlashing.segments.map((segment,index)=><tr key={index}><td>{index+1}</td><td>{segment.length.toFixed(2)}</td><td>{segment.direction.toFixed(0)}</td><td>{index?Math.abs(Math.round(segment.direction-customFlashing.segments![index-1].direction)):"—"}</td><td>{segment.hem==="open-1/8"?"Open hem":segment.hem==="closed"?"Closed hem":"—"}</td></tr>)}</tbody></table>}{customFlashing.attachment&&<p>Customer drawing: {customFlashing.attachment.name}</p>}{customFlashing.sketchDataUrl&&<img className="printCustomSketch" src={customFlashing.sketchDataUrl} alt="Custom flashing sketch"/>}{customFlashing.drawingDataUrl&&<><p>Generated fabrication drawing attached.</p><img className="printCustomSketch" src={customFlashing.drawingDataUrl} alt="Generated custom flashing fabrication drawing"/></>}</section>}
      <section className="printSection printPricing"><h2>PRICING SUMMARY</h2><p><span>Priced accessory subtotal</span><strong>${accessorySubtotal.toFixed(2)}</strong></p><p><span>Taxes / other charges</span><strong>${tax.toFixed(2)}</strong></p><p className="grandTotal"><span>Current order total</span><strong>${orderTotal.toFixed(2)}</strong></p><small>Panel, flashing, freight, and inquiry-item pricing is pending Taylor Metal review and is not included above.</small></section>
      {projectNotes&&<section className="printSection printNotes"><h2>PROJECT NOTES</h2><p>{projectNotes}</p></section>}<footer className="printFooter">RIVERSIDE CA | SACRAMENTO CA | SALEM OR | AUBURN WA | SPOKANE WA | TAYLORMETAL.COM</footer>
    </article></main>
  }

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <img className="brandLogo" src={assetPath("/taylor-metal-logo.png")} alt="Taylor Metal Products"/>
          <span className="brandDivider" aria-hidden="true"/>
          <img className="portalLogo" src={assetPath("/purchasing-portal-logo.png")} alt="Purchasing Portal"/>
        </div>
      </header>

      <section className="hero">
        <div><p className="eyebrow">New material order</p><h1>Build a purchase package</h1><p>Configure panels, attachment items, delivery, and customer information in one guided order.</p></div>
        <div className="orderPill"><span>Customer Account</span><strong>{customerAccount||"Enter account number"}</strong></div>
      </section>

      <nav className="steps" aria-label="Order steps">
        {steps.map((label, i) => <button key={label} onClick={() => navigateToStep(i)} className={i === step ? "active" : i < step ? "done" : ""}><span>{i < step ? "✓" : i + 1}</span>{label}</button>)}
      </nav>

      <div className="workspace">
        <section className="formCard">
          {step === 0 && <>
            <SectionHead n="01" title="Customer Information" sub="Company and account information for this order." />
            <div className="grid2"><Field label="Purchasing company"><input value={customer} onChange={e=>setCustomer(e.target.value)} /></Field><Field label="Customer account"><input value={customerAccount} onChange={e=>setCustomerAccount(e.target.value)} /></Field><Field label="Purchasing contact"><input value={purchasingContact} onChange={e=>setPurchasingContact(e.target.value)} /></Field><Field label="Email"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} /></Field><AddressField label="Billing / company yard address" value={billingAddress} onChange={setBillingAddress} verified={billingAddressVerified} onVerifiedChange={setBillingAddressVerified}/><Field label="Payment terms"><select value={paymentTerms} onChange={e=>setPaymentTerms(e.target.value)}><option value="" disabled>Select payment terms</option><option>Use Account</option><option>Pay with Credit Card</option></select></Field></div>
          </>}
          {step === 1 && <>
            <SectionHead n="02" title="Project Info" sub="Job, receiving contact, requested date, and delivery method." />
            <div className="grid2"><Field label="Job Name"><input value={jobName} onChange={e=>setJobName(e.target.value)} /></Field><Field label="Project Name (Optional)"><input value={projectName} onChange={e=>setProjectName(e.target.value)} /></Field><Field label="PO Number"><input value={poNumber} onChange={e=>setPoNumber(e.target.value)} /></Field><Field label="Contact info for person receiving material"><input value={receivingContact} onChange={e=>setReceivingContact(e.target.value)} /></Field><Field label="Date material requested"><input type="date" value={requestedDate} onChange={e=>setRequestedDate(e.target.value)} /></Field><Field label="Delivery"><select value={delivery} onChange={e=>setDelivery(e.target.value)}><option value="" disabled>Select delivery method</option><option>Deliver to purchasing company yard</option><option>Deliver to Jobsite</option><option>Will call</option></select></Field>{delivery==="Will call"&&<Field label="Will call branch"><select value={willCallBranch} onChange={e=>setWillCallBranch(e.target.value)}><option value="" disabled>Select branch</option>{["Spokane","Auburn","Salem","Sacramento","Riverside"].map(branch=><option key={branch}>{branch}</option>)}</select></Field>}{delivery==="Deliver to Jobsite"&&<AddressField label="Jobsite delivery address" value={jobsiteAddress} onChange={setJobsiteAddress} verified={jobsiteAddressVerified} onVerifiedChange={setJobsiteAddressVerified}/>}<Field label="Project Notes" wide><textarea value={projectNotes} onChange={e=>setProjectNotes(e.target.value)} /></Field></div>
          </>}
          {step === 2 && <>
            <SectionHead n="03" title="Panel Order" sub="Configure the panel, roof options, and required lengths." />
            <div className="panelOrderHeader"><div><strong>Panels in this order</strong><span>{allPanels.length} panel type{allPanels.length===1?"":"s"}</span></div><button type="button" onClick={addNewPanel}>+ New Panel</button></div>
            <div className="panelQueue">{allPanels.map((item,index)=><div key={`${index}-${item.name}`} className={index===activePanelIndex?"current":""} role="button" tabIndex={0} aria-label={`Edit panel ${index+1}: ${item.name}`} onClick={()=>switchPanel(index)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();switchPanel(index)}}}><PanelQueueThumbnail panel={item}/><div className="panelQueueCopy"><span>Panel {index+1}{index===activePanelIndex?" · editing":" · click to edit"}</span><strong>{item.name} · {item.coverage}</strong><small>{item.totalPanels} panels · {item.color}</small></div>{allPanels.length>1&&<button type="button" onClick={event=>{event.stopPropagation();removePanel(index)}} aria-label={`Remove panel ${index+1}`}>×</button>}</div>)}</div>
            <div className="grid2">
              <Field label="Panel profile"><select value={profileIndex} onChange={e=>chooseProfile(Number(e.target.value))}><option value={-1} disabled>Please Select a Panel</option>{profiles.map((p,i)=><option key={`${p.name}-${p.coverages[0]}-${i}`} value={i}>{p.name} · {p.coverages[0]}</option>)}</select></Field>
              <Field label="Material / finish"><select value={hasSelectedProfile?materialId:""} disabled={!hasSelectedProfile} onChange={e=>chooseMaterial(e.target.value as MaterialFinishId)}>{hasSelectedProfile?profile!.materials.map(option=><option key={option.id} value={option.id}>{materialLabel(option.id)}</option>):<option value=""></option>}</select></Field>
              <Field label="Gauge / thickness"><select value={hasSelectedProfile?gauge:""} disabled={!hasSelectedProfile} onChange={e=>chooseGauge(e.target.value)}>{hasSelectedProfile?getGaugeOptions(profile!,materialId as MaterialFinishId).map(x=><option key={x}>{x}</option>):<option value=""></option>}</select></Field>
              <Field label="Color (profile-filtered)"><select value={hasSelectedProfile?color:""} disabled={!hasSelectedProfile} onChange={e=>setColor(e.target.value)}>{hasSelectedProfile?colors.map(x=><option key={x} value={x}>{x}{inquiryColors.has(x)&&materialId!=="unpainted-steel"?" · inquire":""}</option>):<option value=""></option>}</select></Field>
              {hasSelectedProfile&&panProfileIds.has(profile!.id) && <Field label="Pan option"><select value={pan} onChange={e=>setPan(e.target.value)}>{panOptions.map(x=><option key={x}>{x}</option>)}</select></Field>}
              {hasSelectedProfile&&allowsNotching(profile!.id)&&<Field label="Panel notching"><select value={notching} onChange={e=>setNotching(e.target.value as "Notched" | "No Notch")}><option>No Notch</option><option>Notched</option></select></Field>}
              {hasSelectedProfile&&isRoofPanel(profile!.id) && <Field label="Roof pitch"><input value={roofPitch} onChange={e=>setRoofPitch(e.target.value)} inputMode="text" /></Field>}
              {hasSelectedProfile&&clipOptions.length>0 && <Field label="Clip"><select value={effectiveClip} onChange={e=>setSelectedClip(e.target.value)}>{clipOptions.map(option=><option key={option}>{option}</option>)}</select></Field>}
            </div>
            <PanelPreview key={profile?.id??"no-panel-selected"} profile={profile}/>
            {hasSelectedProfile&&!panProfileIds.has(profile!.id) && <div className="noPan"><strong>Profile-controlled pan</strong><span>Pan options are not offered for {profile!.name}.</span></div>}
            <div className="lengthBlock">
              <div className="lengthHead"><div><strong>Panel lengths</strong><span>Add a row for every required cut length.</span></div><button onClick={addLength} disabled={!hasSelectedProfile}>+ Add panel length</button></div>
              <div className="lengthLabels"><span>Feet</span><span>Inches</span><span>Quantity</span><span></span></div>
              {lengthRows.map((row, i)=><div className="lengthRow" key={row.id}><input aria-label={`Length ${i+1} feet`} type="number" min="0" max="60" value={row.feet||""} disabled={!hasSelectedProfile} onChange={e=>updateLength(row.id,"feet",Number(e.target.value))}/><input aria-label={`Length ${i+1} inches`} type="number" min="0" max="11" value={row.inches||""} disabled={!hasSelectedProfile} onChange={e=>updateLength(row.id,"inches",Number(e.target.value))}/><input aria-label={`Length ${i+1} quantity`} type="number" min="1" value={row.qty||""} disabled={!hasSelectedProfile} onChange={e=>updateLength(row.id,"qty",Number(e.target.value))}/><button aria-label={`Remove length ${i+1}`} onClick={()=>removeLength(row.id)} disabled={!hasSelectedProfile||lengthRows.length===1}>×</button></div>)}
            </div>
            {inquiry&&<div className="ruleNote warning"><strong>Sales review required</strong><span>{profile?.note || `${profile?.name} is available in ${materialLabel(materialId as MaterialFinishId)} at ${gauge}.`}</span>{materialAvailability?.coil && <em>Derived coil: {materialAvailability.coil}</em>}</div>}
          </>}
          {step === 3 && <>
            <SectionHead n="04" title="Accessories" sub="Choose a material category, then select items and enter quantities." />
            <div className="catalogHead"><div><strong>Accessory materials</strong><span>{selectedAccessories.length} items selected · {selectedAccessoryUnits} total units</span></div></div>
            <div className="categoryButtons" role="tablist" aria-label="Accessory categories">{accessoryCategories.map(group=>{const selectedCount=selectedAccessories.filter(item=>accessoryGroup(item)===group).length;return <button key={group} role="tab" aria-selected={activeAccessoryCategory===group} className={activeAccessoryCategory===group?"selected":""} onClick={()=>{setActiveAccessoryCategory(group);setAccessorySearch("")}}><span>{group}</span>{selectedCount>0&&<b>{selectedCount}</b>}</button>})}</div>
            <div className="catalogTools singleTool"><input aria-label="Search accessories" placeholder="Search accessory or part number" value={accessorySearch} onChange={e=>setAccessorySearch(e.target.value)}/></div>
            <div className="activeCategoryHead"><strong>{activeAccessoryCategory}</strong><span>{filteredAccessories.length} available item{filteredAccessories.length===1?"":"s"}</span></div>
            <div className="catalogGrid">{filteredAccessories.map(item=>{const selected=(accessoryQty[item.id]||0)>0;return <article key={item.id} className={selected?"selected":""}><button className="catalogSelect" onClick={()=>toggleAccessory(item.id)} aria-pressed={selected}><span className="catalogCheck">{selected?"✓":"+"}</span><span><strong>{item.name}</strong><small>{item.id} · {item.unit}</small></span></button>{selected&&<div className="qtyControl"><span>Order quantity</span><button onClick={()=>setAccessoryQuantity(item.id,(accessoryQty[item.id]||1)-1)}>−</button><input aria-label={`${item.name} quantity`} type="number" min="1" value={accessoryQty[item.id]} onChange={e=>setAccessoryQuantity(item.id,Number(e.target.value))}/><button onClick={()=>setAccessoryQuantity(item.id,(accessoryQty[item.id]||0)+1)}>+</button></div>}</article>})}</div>
            {filteredAccessories.length===0&&<div className="emptyCatalog">No {activeAccessoryCategory.toLowerCase()} match this search.</div>}
            <button className="addCustom">+ Add a custom accessory request</button>
          </>}
          {step === 4 && <>
            <SectionHead n="05" title="Flashings" sub="Select flashing names, finish, and order quantities." />
            <div className="catalogHead"><div><strong>Flashing order</strong><span>{selectedFlashings.length} names selected · {selectedFlashingPieces} pieces</span></div></div>
            <p className="catalogIntro">Choose a flashing from the current Taylor Metal line drawing catalog.</p>
            <div className="finishToggle" role="group" aria-label="Flashing color and gauge selection"><button className={flashingSameAsPanel?"selected":""} onClick={()=>setFlashingSameAsPanel(true)}><strong>Same as panel</strong><small>{hasSelectedProfile?`${color} · ${gauge}`:""}</small></button><button className={!flashingSameAsPanel?"selected":""} onClick={()=>setFlashingSameAsPanel(false)}><strong>Select separately</strong><small>Choose flashing color and gauge</small></button></div>
            {!flashingSameAsPanel&&<div className="grid2 flashingFinish"><Field label="Flashing gauge / material"><select value={flashingGauge} onChange={e=>setFlashingGauge(e.target.value)}>{["22 ga","24 ga","26 ga","29 ga",".032″ Aluminum"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Flashing color"><select value={flashingColor} onChange={e=>setFlashingColor(e.target.value)}>{Array.from(new Set([...armortechColors,...kynar500Colors])).sort().map(x=><option key={x}>{x}</option>)}</select></Field></div>}
            <div className="catalogTools flashingTools"><input aria-label="Search flashing names" placeholder="Search flashing names" value={flashingSearch} onChange={e=>setFlashingSearch(e.target.value)}/><div className="finishReadout"><span>Order finish</span><strong>{effectiveFlashingColor} · {effectiveFlashingGauge}</strong></div></div>
            <div className="flashingGroupedCatalog">{filteredFlashingGroups.map(group=><section className="flashingGroup" key={group.name}><div className="flashingGroupHead"><strong>{group.name}</strong><span>{group.items.length} profile{group.items.length===1?"":"s"}</span></div><div className="catalogGrid flashingGrid">{group.items.map(name=>{const selected=(flashingQty[name]||0)>0,needsPitch=Boolean(pitchType(name)),mode=flashingPitchMode[name]||"panel";return <article key={name} className={selected?"selected":""}><button className="catalogSelect flashingSelect" onClick={()=>toggleFlashing(name)} aria-pressed={selected}><span className="catalogCheck">{selected?"✓":"+"}</span><span className="flashingIdentity"><FlashingSketch name={name}/><strong>{name}</strong></span></button>{selected&&<><div className="qtyControl"><span>Order quantity</span><button onClick={()=>setFlashingQuantity(name,(flashingQty[name]||1)-1)}>−</button><input aria-label={`${name} quantity`} type="number" min="1" value={flashingQty[name]} onChange={e=>setFlashingQuantity(name,Number(e.target.value))}/><button onClick={()=>setFlashingQuantity(name,(flashingQty[name]||0)+1)}>+</button></div>{needsPitch&&<div className="flashingPitch"><label><span>{pitchType(name)==="peak"?"Peak pitch":"Flashing pitch"}</span><select value={mode} onChange={e=>setFlashingPitchMode(value=>({...value,[name]:e.target.value as "panel"|"custom"}))}><option value="panel">Panel pitch ({activeRoofPitch})</option><option value="custom">Custom Pitch</option></select></label>{mode==="custom"&&<label><span>Custom Pitch</span><input value={flashingCustomPitch[name]||""} onChange={e=>setFlashingCustomPitch(value=>({...value,[name]:e.target.value}))} placeholder="Example: 6:12"/></label>}</div>}</>}</article>})}</div></section>)}</div>
            {filteredFlashingGroups.length===0&&<div className="emptyCatalog">No flashing names match this search.</div>}
            <button type="button" className="addCustom" onClick={()=>setShowCustomFlashing(open=>!open)} aria-expanded={showCustomFlashing}>+ Add a custom flashing request</button>
            {showCustomFlashing&&<section className="customFlashingRequest" aria-label="Custom flashing request"><div className="customFlashingHead"><div><strong>Custom flashing request</strong><span>Attach the customer drawing or make a sketch for the order team.</span></div></div><Field label="Custom flashing details"><textarea value={customFlashing.description} onChange={event=>setCustomFlashing(value=>({...value,description:event.target.value}))} placeholder="Describe the profile, dimensions, bends, quantity, and any special requirements." /></Field><div className="customFlashingUpload"><div><strong>Customer drawing</strong><span>Upload a PNG or JPG image, up to 2 MB.</span></div><label className="uploadButton"><input type="file" accept="image/png,image/jpeg" onChange={event=>handleCustomFlashingAttachment(event.target.files?.[0])}/>Upload drawing</label></div>{customFlashing.attachment&&<div className="customFlashingAttachment"><img src={customFlashing.attachment.dataUrl} alt={`Customer drawing: ${customFlashing.attachment.name}`}/><div><strong>{customFlashing.attachment.name}</strong><span>Attached to this order</span><button type="button" className="ghost" onClick={()=>{setCustomFlashing(value=>({...value,attachment:undefined}));setCustomFlashingMessage("");}}>Remove drawing</button></div></div>}{customFlashingMessage&&<p className="customFlashingMessage" role="status">{customFlashingMessage}</p>}<CustomFlashingSketch segments={customFlashing.segments} paintSide={customFlashing.paintSide} onChange={segments=>setCustomFlashing(value=>({...value,segments,drawingDataUrl:undefined}))} onPaintSideChange={paintSide=>setCustomFlashing(value=>({...value,paintSide,drawingDataUrl:undefined}))} onDrawingChange={drawingDataUrl=>setCustomFlashing(value=>value.drawingDataUrl===drawingDataUrl?value:{...value,drawingDataUrl})} onExportDrawing={exportCustomFlashingDrawing} drawingCaptureRef={customDrawingCaptureRef}/></section>}
          </>}
          {step === 5 && <>
            <SectionHead n="06" title="Review & submit" sub="Review the order, then open the complete order summary." />
            <div className="reviewGrid"><Review label="Purchasing company" value={customer}/><Review label="Job" value={jobName}/><Review label="PO Number" value={poNumber || "Not provided"}/><Review label="Project" value={projectName || "Not provided"}/><Review label="Delivery" value={delivery==="Will call"?`${delivery} · ${willCallBranch}`:delivery}/><Review label="Panel types" value={`${allPanels.length} configured`}/><Review label="Panel order" value={`${orderPanelCount} panels · ${orderArea.toLocaleString()} sq ft`}/>{allPanels.map((item,index)=><Review key={`${item.name}-${index}`} label={`Panel ${index+1}`} value={`${item.finish} · ${item.name} · ${item.coverage} · ${item.gauge} · ${item.color}${item.roofPitch?` · Pitch ${item.roofPitch}`:""}`}/>)}<Review label="Accessories" value={`${selectedAccessories.length} items · ${selectedAccessoryUnits} units`}/><Review label="Flashing" value={`${selectedFlashings.length} names · ${selectedFlashingPieces} pieces · ${effectiveFlashingColor} · ${effectiveFlashingGauge}`}/>{hasCustomFlashing&&<Review label="Custom flashing request" value={`${customFlashing.segments?.length||0} sections${customFlashing.attachment?" · Customer drawing":""}${customFlashing.drawingDataUrl?" · Fabrication drawing":""}${customFlashing.description?" · Details included":""}`}/>}</div>
            <div className="financialSummary"><div><span>Priced accessory subtotal</span><strong>${accessorySubtotal.toFixed(2)}</strong></div><div><span>Taxes / other charges</span><strong>${tax.toFixed(2)}</strong></div><div className="total"><span>Current total</span><strong>${orderTotal.toFixed(2)}</strong></div><small>Unpriced panels, flashings, freight, and inquiry items require Taylor Metal review.</small></div>
            <label className="ack"><input type="checkbox" checked={oilCanningAcknowledged} onChange={event=>{setOilCanningAcknowledged(event.target.checked);setAcknowledgementError("")}}/><span>I acknowledge that oil canning can occur in light-gauge metal and is not considered a defect.</span></label>
            <label className="ack"><input type="checkbox" checked={orderReviewAcknowledged} onChange={event=>{setOrderReviewAcknowledged(event.target.checked);setAcknowledgementError("")}}/><span>I have reviewed the profile, finish, color, quantities, delivery details, and accessory assumptions.</span></label>
            {acknowledgementError&&<div className="ackError" role="alert">{acknowledgementError}</div>}
            <div className="reportActions"><button type="button" className="ghost" onClick={()=>persistOrder("draft")} disabled={savingOrder}>Save changes</button><button type="button" className="ghost" onClick={()=>exportPdf()} disabled={!orderNumber}>Export PDF</button></div>
            {submitted&&pdfDownload&&<div className="submittedNotice"><strong>Order summary created</strong><span>If the automatic download did not begin, use this direct PDF link.</span><a href={pdfDownload.url} download={pdfDownload.filename}>Download PDF order summary</a></div>}
            {pdfError&&<div className="pdfError" role="alert">{pdfError}</div>}
          </>}

          {orderMessage&&<div className="orderMessage" role="status">{orderMessage}</div>}
          <div className="formActions"><button type="button" className="back" onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0}>Back</button><button type="button" className="next" onClick={()=>step<5?navigateToStep(step+1):submitOrder()} disabled={savingOrder}>{step===5?(orderStatus==="submitted"?"Resubmit & generate PDF":"Submit & generate PDF"):"Continue"}<span>→</span></button></div>
        </section>

        <aside className="summary">
          <div className="summaryTop"><span>Live order summary</span><b>{complete?"Ready":"Needs attention"}</b></div>
          <div className="productSketch"><div className="roofLine"></div><p>{allPanels.length} panel type{allPanels.length===1?"":"s"}</p><small>{orderPanelCount} panels · {orderArea.toLocaleString()} sq ft</small></div>
          <dl><div><dt>Current panel</dt><dd>{profile?`${profile.name} · ${coverage}`:""}</dd></div><div><dt>Finish</dt><dd>{profile?materialLabel(materialId as MaterialFinishId):""}</dd></div><div><dt>Material</dt><dd>{profile?gauge:""}</dd></div><div><dt>Color</dt><dd>{profile?color:""}</dd></div>{profile&&panProfileIds.has(profile.id)&&<div><dt>Pan option</dt><dd>{pan}</dd></div>}{profile&&allowsNotching(profile.id)&&<div><dt>Panel notching</dt><dd>{notching}</dd></div>}{profile&&isRoofPanel(profile.id)&&<div><dt>Roof pitch</dt><dd>{roofPitch}</dd></div>}{profile&&effectiveClip&&<div><dt>Clip</dt><dd>{effectiveClip}</dd></div>}<div><dt>Delivery</dt><dd>{delivery==="Will call"?`${delivery} · ${willCallBranch}`:delivery}</dd></div>{materialAvailability?.coil&&<div><dt>Coil width</dt><dd>{materialAvailability.coil}</dd></div>}<div><dt>Panel types</dt><dd>{allPanels.length}</dd></div><div><dt>Order panels</dt><dd>{orderPanelCount}</dd></div><div><dt>Coverage area</dt><dd>{orderArea.toLocaleString()} sq ft</dd></div><div><dt>Accessories</dt><dd>{selectedAccessories.length} items · {selectedAccessoryUnits} units</dd></div><div><dt>Flashing</dt><dd>{selectedFlashings.length} names · {selectedFlashingPieces} pcs</dd></div><div><dt>Flashing finish</dt><dd>{flashingSameAsPanel?"Same as panel":`${effectiveFlashingColor} · ${effectiveFlashingGauge}`}</dd></div><div><dt>Child categories</dt><dd>{addOnCount} selected</dd></div></dl>
          <div className="statusBox"><span className={!hasSelectedProfile?"":inquiry?"amber":"green"}></span><div><strong>{!hasSelectedProfile?"Panel not selected":inquiry?"Inquiry configuration":"Configuration valid"}</strong><small>{!hasSelectedProfile?"Select a panel profile to configure this order":inquiry?"Availability and pricing review required":"No catalog conflicts detected"}</small></div></div>
        </aside>
      </div>
    </main>
  );
}

function Field({label,children,wide}:{label:string;children:React.ReactNode;wide?:boolean}){return <label className={wide?"wide":""}><span>{label}</span>{children}</label>}
function SectionHead({n,title,sub}:{n:string;title:string;sub:string}){return <div className="sectionHead"><span>{n}</span><div><h2>{title}</h2><p>{sub}</p></div></div>}
function Review({label,value}:{label:string;value:string}){return <div><span>{label}</span><strong>{value}</strong></div>}

function AddressField({label,value,onChange,verified,onVerifiedChange}:{label:string;value:string;onChange:(value:string)=>void;verified:boolean;onVerifiedChange:(verified:boolean)=>void}){
  const [suggestions,setSuggestions]=useState<AddressSuggestion[]>([]);
  const [checking,setChecking]=useState(false);
  const [open,setOpen]=useState(false);
  const [lookupFailed,setLookupFailed]=useState(false);

  useEffect(()=>{
    if(verified||value.trim().length<4){const reset=window.setTimeout(()=>{setSuggestions([]);setChecking(false)},0);return()=>window.clearTimeout(reset);}
    const controller=new AbortController();
    const timer=window.setTimeout(async()=>{
      setChecking(true);setLookupFailed(false);
      try{
        const response=await fetch(`https://photon.komoot.io/api/?limit=5&lang=en&q=${encodeURIComponent(`${value}, USA`)}`,{signal:controller.signal});
        if(!response.ok)throw new Error("Address lookup failed");
        const data=await response.json();
        const labels=(data.features||[]).map((feature:{properties:Record<string,string>})=>{
          const p=feature.properties||{};
          const street=[p.housenumber,p.street||p.name].filter(Boolean).join(" ");
          return [street,p.city||p.county,p.state,p.postcode].filter(Boolean).join(", ");
        }).filter(Boolean);
        setSuggestions(Array.from(new Set<string>(labels)).slice(0,5).map(label=>({label})));setOpen(true);
      }catch(error){if((error as Error).name!=="AbortError"){setLookupFailed(true);setSuggestions([]);}}
      finally{setChecking(false);}
    },350);
    return()=>{window.clearTimeout(timer);controller.abort();};
  },[value,verified]);

  function selectAddress(address:string){onChange(address);onVerifiedChange(true);setSuggestions([]);setOpen(false);setLookupFailed(false);}
  const listId=`address-${label.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-suggestions`;
  return <label className="wide addressField"><span>{label}</span><div className="addressInput"><input value={value} autoComplete="street-address" role="combobox" aria-controls={listId} onFocus={()=>setOpen(true)} onBlur={()=>window.setTimeout(()=>setOpen(false),150)} onChange={e=>{onChange(e.target.value);onVerifiedChange(false);setOpen(true)}} aria-autocomplete="list" aria-expanded={open&&suggestions.length>0}/>{checking&&<i>Checking…</i>}{verified&&<i className="verified">✓ Verified</i>}</div>{open&&suggestions.length>0&&<div id={listId} className="addressSuggestions" role="listbox">{suggestions.map(item=><button type="button" role="option" aria-selected="false" key={item.label} onMouseDown={e=>e.preventDefault()} onClick={()=>selectAddress(item.label)}>{item.label}</button>)}</div>}{!verified&&!checking&&value.trim().length>=4&&<small className={lookupFailed?"lookupFailed":"addressHint"}>{lookupFailed?"Address lookup is temporarily unavailable. You may continue and try again later.":"Select a suggested address to verify it."}</small>}</label>;
}
