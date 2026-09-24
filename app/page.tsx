"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { safePdfFilename, type OrderStatus, type StoredOrder } from "./order-management";
import {
  armortechColors,
  getGaugeOptions,
  getMaterialAvailability,
  getPanelColors,
  kynar500Colors,
  materialLabel,
  normalizeMaterialId,
  panelImageCatalog,
  panelProfiles,
  type MaterialFinishId,
  type PanelProfile,
} from "./panel-config";

type LengthRow = { id: number; feet: number; inches: number; qty: number };
type Accessory = { id: string; category: string; name: string; unit: string; price: number | null };
type AddressSuggestion = { label: string };
type PanelSnapshot = { materialId:MaterialFinishId;finish:string;name:string;coverage:string;gauge:string;color:string;pan?:string;notching?:string;roofPitch?:string;clip?:string;coil?:string;lengths:LengthRow[];totalPanels:number;area:number };
type OrderDraftPayload = {
  customer:string;customerAccount:string;purchasingContact:string;email:string;billingAddress:string;billingAddressVerified:boolean;paymentTerms:string;
  jobName:string;poNumber:string;projectName:string;receivingContact:string;requestedDate:string;delivery:string;willCallBranch:string;jobsiteAddress:string;jobsiteAddressVerified:boolean;projectNotes:string;
  panels:PanelSnapshot[];accessoryQty:Record<string,number>;flashingQty:Record<string,number>;flashingSameAsPanel:boolean;flashingGauge:string;flashingColor:string;
  flashingPitchMode:Record<string,"panel"|"custom">;flashingCustomPitch:Record<string,string>;
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

const panProfiles = new Set(["MS-100", "MS-150", "MS-200", "Versa-Span", "Easy-Lock", "Slim-Lock"]);
const panOptions = ["Striations", "Accent ribs", "Flat pan"];
const inquiryColors = new Set(["Vintage", "Galvanized", "Zincalume Plus", "Metallic Silver"]);

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
  { id:"ASZEL12", category:"Clips & Snap Z", name:'Snap Z - Easy-Lock 12"', unit:"Each", price:3.75 },
  { id:"ASZEL16", category:"Clips & Snap Z", name:'Snap Z - Easy-Lock 16"', unit:"Each", price:3.68 },
  { id:"ASZMS15012", category:"Clips & Snap Z", name:'Snap Z - MS-150 12"', unit:"Each", price:3.67 },
  { id:"ASZMS15016", category:"Clips & Snap Z", name:'Snap Z - MS-150 16"', unit:"Each", price:3.75 },
  { id:"ASZMS20018", category:"Clips & Snap Z", name:'Snap Z - MS-200 18"', unit:"Each", price:4.79 },
  { id:"ASZVS14", category:"Clips & Snap Z", name:'Snap Z - Versa-Span 14"', unit:"Each", price:4.90 },
  { id:"ASZVS16", category:"Clips & Snap Z", name:'Snap Z - Versa-Span 16"', unit:"Each", price:4.07 },
  { id:"ASZVS18", category:"Clips & Snap Z", name:'Snap Z - Versa-Span 18"', unit:"Each", price:3.58 },
  { id:"AVSCLIP-UL", category:"Clips & Snap Z", name:"Versa-Span Fixed Clip - UL Rated", unit:"Each", price:0.37 },
  { id:"AMSCLIP200NT", category:"Clips & Snap Z", name:'MS-200 2" Fixed Clip with Sealant', unit:"Each", price:0.25 },
  { id:"AMSCLIPF200NT", category:"Clips & Snap Z", name:'22 ga MS-200 2" UL Floating Clip with Sealant', unit:"Each", price:0.60 },
  { id:"AMSCLIPF150", category:"Clips & Snap Z", name:'24 ga MS-150 1-1/2" UL Floating Clip', unit:"Each", price:0.59 },
  { id:"AMSCLIP150", category:"Clips & Snap Z", name:'MS-150 1-1/2" Fixed Clip with Sealant', unit:"Each", price:0.19 },
  { id:"ASMCLIP", category:"Clips & Snap Z", name:"Slim-Lock Fixed Clip", unit:"Each", price:0.20 },
  { id:"AFCHR34", category:"Closures", name:'HR-34 34" Formed Foam Closure with Adhesive', unit:"Each", price:0.66 },
  { id:"AFCEL", category:"Closures", name:'12" Easy-Lock Closed Cell Foam Closure', unit:"Each", price:0.98 },
  { id:"AFCELV", category:"Closures", name:'12" Easy-Lock Vented Ridge Foam Closure', unit:"Each", price:4.91 },
  { id:"AFCSL", category:"Closures", name:'16" Easy-Lock Closed Cell Foam Closure', unit:"Each", price:0.81 },
  { id:"AFCCC", category:"Closures", name:'Classic 7/8" Corrugated Formed Foam Closure', unit:"Each", price:0.71 },
  { id:"AFCGR7I", category:"Closures", name:"GR-7 Inside / Outside Formed Foam Closure", unit:"Each", price:0.37 },
  { id:"AFCMSVS", category:"Closures", name:'MS / Versa-Span Foam Closure 18" x 2"', unit:"Each", price:1.86 },
  { id:"AFCPBRI", category:"Closures", name:"PBR Inside / Outside Formed Foam Closure", unit:"Each", price:0.59 },
  { id:"AFCT3I", category:"Closures", name:"T-3 Inside / Outside Formed Foam Closure", unit:"Each", price:0.38 },
  { id:"AFCTRI", category:"Closures", name:"Tuff Rib Inside / Outside Formed Foam Closure", unit:"Each", price:0.50 },
  { id:"AFCVV", category:"Closures", name:'Versa Vent Universal Closure 1" x 10 ft', unit:"Each", price:18.36 },
  { id:"S5-S", category:"Snow Retention", name:"S-5-S Clamp", unit:"Each", price:null },
  { id:"S5-N", category:"Snow Retention", name:"S-5-N Clamp - Easy-Lock / StreamLine", unit:"Each", price:null },
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

function clipOptionsFor(profileName: string) {
  if (profileName === "MS-200") return ["Fixed Clip", "Low Profile Floating Clip", "3/8 Stand off floating clip"];
  if (["MS-100", "MS-150"].includes(profileName)) return ["Fixed Clip", "Floating Clip"];
  if (["Max Corr", "Slim-Lock", "Versa-Span", "Easy-Lock"].includes(profileName)) return ["Clip"];
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

function isRoofPanel(name:string){return !["Board and Batten","SmoothWall / Soffit / ShadowLine","Flat Sheet"].includes(name);}
function allowsNotching(name:string){return new Set(["ms100","ms150","ms200","maxrun","versaspan","cliplock","easylock"]).has(name.toLowerCase().replace(/[^a-z0-9]/g,""))}
function pitchType(name:string){const n=name.toLowerCase();if(n.includes("peak cleat"))return "peak";if(n.includes("wide valley")||n.includes("valley wide"))return "wide-valley";if(n.includes("valley"))return "valley";if(n.includes("hook eave"))return "hook-eave";if(n.includes("standard eave"))return "eave";if(n.includes("eave"))return "eave";if(n.includes("ridge"))return "ridge";if(n.includes("peak"))return "peak";if(n.includes("hip"))return "hip";return ""}
function flashingDrawing(name:string){return `/flashing-line-drawings/${encodeURIComponent(name)}.jpg`}
function FlashingSketch({name}:{name:string}){return <img className="flashingSketch" src={flashingDrawing(name)} alt={`${name} reference profile`}/>}
function PanelPreview({profile}:{profile?:PanelProfile}){
  const [failed,setFailed]=useState(false);
  if(!profile)return <section className="panelPreview panelPreviewEmpty"><div className="panelPreviewUnavailable">Select a panel to view profile.</div></section>;
  const image=panelImageCatalog[profile.id];
  return <section className="panelPreview" aria-label={`${profile.name} panel preview`} data-panel-id={profile.id}>
    <div className="panelPreviewHead"><div><span>Panel Preview</span><strong>{profile.name}</strong></div><small>{image&&!failed?"Official Taylor Metal profile image":"Visual reference unavailable"}</small></div>
    <div className={`panelPreviewMedia ${!image||failed?"unavailable":""}`}>
      {image&&!failed?<img src={image.src} alt={`${image.name} panel profile`} onError={()=>setFailed(true)}/>:<div className="panelPreviewUnavailable"><strong>Panel image not available</strong><span>No verified image is mapped to {profile.name}.</span></div>}
    </div>
  </section>;
}
export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [showPrintSummary, setShowPrintSummary] = useState(false);
  const [pdfDownload, setPdfDownload] = useState<{url:string;filename:string} | null>(null);
  const [pdfError, setPdfError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("draft");
  const [orderRevision, setOrderRevision] = useState(0);
  const [orders, setOrders] = useState<StoredOrder<OrderDraftPayload>[]>([]);
  const [showOrders, setShowOrders] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [step, setStep] = useState(0);
  const profiles = configuredProfiles;
  const [profileIndex, setProfileIndex] = useState(0);
  const profile = profiles[Math.min(profileIndex, profiles.length - 1)];
  const [materialId, setMaterialId] = useState<MaterialFinishId>(profile.materials[0].id);
  const materialAvailability = getMaterialAvailability(profile, materialId);
  const [coverage, setCoverage] = useState(profile.coverages[0]);
  const [gauge, setGauge] = useState(materialAvailability.gauges[0]);
  const [color, setColor] = useState("Glacier White");
  const [lengthRows, setLengthRows] = useState<LengthRow[]>([{ id: 1, feet: 0, inches: 0, qty: 0 }]);
  const [nextRowId, setNextRowId] = useState(2);
  const [pan, setPan] = useState("Striations");
  const [notching, setNotching] = useState<"Notched" | "No Notch">("No Notch");
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

  const colors = getPanelColors(profile, materialId, gauge);
  const coverageInches = parseFloat(coverage) || 36;
  const totalPanels = lengthRows.reduce((sum, row) => sum + row.qty, 0);
  const totalLinearFeet = lengthRows.reduce((sum, row) => sum + (row.feet + row.inches / 12) * row.qty, 0);
  const area = useMemo(() => Math.round((coverageInches / 12) * totalLinearFeet), [coverageInches, totalLinearFeet]);
  const selectedAccessories = accessoryCatalog.filter(item => accessoryGroup(item) && (accessoryQty[item.id] || 0) > 0);
  const selectedAccessoryUnits = selectedAccessories.reduce((sum, item) => sum + accessoryQty[item.id], 0);
  const filteredAccessories = accessoryCatalog.filter(item => accessoryGroup(item) === activeAccessoryCategory && `${item.name} ${item.id}`.toLowerCase().includes(accessorySearch.toLowerCase()));
  const clipOptions = clipOptionsFor(profile.name);
  const effectiveClip = selectedClip || clipOptions[0] || "";
  const selectedFlashings = flashingCatalog.filter(name => (flashingQty[name] || 0) > 0);
  const selectedFlashingPieces = selectedFlashings.reduce((sum, name) => sum + flashingQty[name], 0);
  const filteredFlashingGroups = flashingGroups.map(group => ({
    ...group,
    items: group.items.filter(name => name.toLowerCase().includes(flashingSearch.toLowerCase()))
  })).filter(group => group.items.length > 0);
  const effectiveFlashingGauge = flashingSameAsPanel ? gauge : flashingGauge;
  const effectiveFlashingColor = flashingSameAsPanel ? color : flashingColor;
  const currentPanel:PanelSnapshot = {materialId,finish:materialLabel(materialId),name:profile.name,coverage,gauge,color,pan:panProfiles.has(profile.name)?pan:undefined,notching:allowsNotching(profile.name)?notching:undefined,roofPitch:isRoofPanel(profile.name)?roofPitch:undefined,clip:effectiveClip||undefined,coil:materialAvailability.coil,lengths:lengthRows.map(row=>({...row})),totalPanels,area};
  const allPanels = savedPanels.length ? savedPanels.map((item,index)=>index===activePanelIndex?currentPanel:item) : [currentPanel];
  const orderPanelCount = allPanels.reduce((sum,item)=>sum+item.totalPanels,0);
  const orderArea = allPanels.reduce((sum,item)=>sum+item.area,0);
  const activeRoofPitch = allPanels.find(item=>item.roofPitch)?.roofPitch || roofPitch;
  const flashingPitch=(name:string)=>pitchType(name)?(flashingPitchMode[name]==="custom"?(flashingCustomPitch[name]||"Custom pitch not entered"):activeRoofPitch):"";
  const addOnCount = selectedAccessories.length + selectedFlashings.length + (effectiveClip ? 1 : 0);
  const inquiry = Boolean(profile.note?.toLowerCase().includes("inquiry"));
  const complete = customer.trim() && jobName.trim() && receivingContact.trim() && requestedDate && lengthRows.every(row => row.qty > 0 && (row.feet > 0 || row.inches > 0)) && color;
  const accessorySubtotal = selectedAccessories.reduce((sum,item)=>sum+(item.price??0)*(accessoryQty[item.id]||0),0);
  const tax = 0;
  const orderTotal = accessorySubtotal + tax;

  function chooseProfile(i: number) {
    const nextProfile=profiles[i],nextMaterial=nextProfile.materials[0],nextGauge=nextMaterial.gauges[0];
    setProfileIndex(i);setCoverage(nextProfile.coverages[0]);setMaterialId(nextMaterial.id);setGauge(nextGauge);setColor(getPanelColors(nextProfile,nextMaterial.id,nextGauge)[0]);setPan("Striations");setNotching("No Notch");setSelectedClip(clipOptionsFor(nextProfile.name)[0]||"");
  }

  function chooseMaterial(next:MaterialFinishId){const nextGauge=getGaugeOptions(profile,next)[0];setMaterialId(next);setGauge(nextGauge);setColor(getPanelColors(profile,next,nextGauge)[0]);}
  function chooseGauge(next: string) { setGauge(next); setColor(getPanelColors(profile, materialId, next)[0]); }
  function updateLength(id: number, key: "feet" | "inches" | "qty", value: number) { setLengthRows(rows => rows.map(row => row.id === id ? { ...row, [key]: value } : row)); }
  function addLength() { setLengthRows(rows => [...rows, { id: nextRowId, feet: 0, inches: 0, qty: 0 }]); setNextRowId(id => id + 1); }
  function removeLength(id: number) { if (lengthRows.length > 1) setLengthRows(rows => rows.filter(row => row.id !== id)); }
  function loadPanel(item:PanelSnapshot){
    const index=Math.max(0,profiles.findIndex(panel=>panel.name===item.name&&panel.coverages[0]===item.coverage));
    const nextProfile=profiles[index],requestedMaterial=normalizeMaterialId(item.materialId||item.finish,item.gauge),nextMaterial=nextProfile.materials.some(option=>option.id===requestedMaterial)?requestedMaterial:nextProfile.materials[0].id;
    const allowedGauges=getGaugeOptions(nextProfile,nextMaterial),nextGauge=allowedGauges.includes(item.gauge)?item.gauge:allowedGauges[0],allowedColors=getPanelColors(nextProfile,nextMaterial,nextGauge),nextColor=allowedColors.includes(item.color)?item.color:allowedColors[0];
    setProfileIndex(index);setCoverage(nextProfile.coverages[0]);setMaterialId(nextMaterial);setGauge(nextGauge);setColor(nextColor);setPan(item.pan||"Striations");setNotching((item.notching||"No Notch") as "Notched"|"No Notch");setRoofPitch(item.roofPitch||"");setSelectedClip(item.clip||"");setLengthRows(item.lengths.map(row=>({...row})));setNextRowId(Math.max(...item.lengths.map(row=>row.id),0)+1);
  }
  function addNewPanel(){
    const first=profiles[0];const row={id:nextRowId,feet:0,inches:0,qty:0};
    const firstMaterial=first.materials[0],firstGauge=firstMaterial.gauges[0];
    const next:PanelSnapshot={materialId:firstMaterial.id,finish:materialLabel(firstMaterial.id),name:first.name,coverage:first.coverages[0],gauge:firstGauge,color:getPanelColors(first,firstMaterial.id,firstGauge)[0],pan:panProfiles.has(first.name)?"Striations":undefined,notching:allowsNotching(first.name)?"No Notch":undefined,roofPitch:isRoofPanel(first.name)?"":undefined,clip:clipOptionsFor(first.name)[0]||undefined,coil:firstMaterial.coil,lengths:[row],totalPanels:0,area:0};
    const panels=[...allPanels,next];setSavedPanels(panels);setActivePanelIndex(panels.length-1);loadPanel(next);
  }
  function switchPanel(index:number){const panels=[...allPanels];setSavedPanels(panels);setActivePanelIndex(index);loadPanel(panels[index]);}
  function removePanel(index:number){
    if(allPanels.length===1)return;const panels=allPanels.filter((_,i)=>i!==index);
    const nextIndex=index===activePanelIndex?Math.min(index,panels.length-1):index<activePanelIndex?activePanelIndex-1:activePanelIndex;
    setSavedPanels(panels.length>1?panels:[]);setActivePanelIndex(nextIndex);loadPanel(panels[nextIndex]);
  }
  function toggleAccessory(id: string) { setAccessoryQty(current => ({ ...current, [id]: current[id] > 0 ? 0 : 1 })); }
  function setAccessoryQuantity(id: string, quantity: number) { setAccessoryQty(current => ({ ...current, [id]: Math.max(0, quantity) })); }
  function toggleFlashing(name: string) { setFlashingQty(current => ({ ...current, [name]: current[name] > 0 ? 0 : 1 })); }
  function setFlashingQuantity(name: string, quantity: number) { setFlashingQty(current => ({ ...current, [name]: Math.max(0, quantity) })); }

  function buildDraftPayload():OrderDraftPayload{return {customer,customerAccount,purchasingContact,email,billingAddress,billingAddressVerified,paymentTerms,jobName,poNumber,projectName,receivingContact,requestedDate,delivery,willCallBranch,jobsiteAddress,jobsiteAddressVerified,projectNotes,panels:allPanels.map(item=>({...item,lengths:item.lengths.map(row=>({...row}))})),accessoryQty:{...accessoryQty},flashingQty:{...flashingQty},flashingSameAsPanel,flashingGauge,flashingColor,flashingPitchMode:{...flashingPitchMode},flashingCustomPitch:{...flashingCustomPitch}}}
  function buildReportPayload(number=orderNumber){
    const fulfillmentDetail=delivery==="Will call"?`${delivery} - ${willCallBranch}`:delivery==="Deliver to Jobsite"?`${delivery} - ${jobsiteAddress}`:`${delivery} - ${billingAddress}`;
    return {orderNumber:number,submitted:new Date().toLocaleDateString(),poNumber,company:{name:customer,account:customerAccount,contact:purchasingContact,email,address:billingAddress,payment:paymentTerms},project:{jobName,projectName,receivingContact,requestedDate,delivery:fulfillmentDetail,notes:projectNotes,address:jobsiteAddress||billingAddress},submittedBy:purchasingContact,panels:allPanels,accessories:selectedAccessories.map(item=>({quantity:accessoryQty[item.id],unit:item.unit,category:accessoryGroup(item),name:item.name,part:item.id,unitPrice:item.price,lineTotal:item.price===null?null:item.price*accessoryQty[item.id]})),flashings:selectedFlashings.map(name=>({quantity:flashingQty[name],name,pitch:flashingPitch(name)})),flashingFinish:{gauge:effectiveFlashingGauge,color:effectiveFlashingColor},totals:{panels:orderPanelCount,area:orderArea,subtotal:accessorySubtotal,tax,total:orderTotal}};
  }
  async function persistOrder(status:OrderStatus){
    if(!customerAccount.trim()){setOrderMessage("Enter a customer account number before saving.");return null;}
    setSavingOrder(true);setOrderMessage("");
    try{
      const response=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:orderId||undefined,customerAccount,status,payload:buildDraftPayload()})});
      if(!response.ok)throw new Error(await response.text());
      const saved=await response.json() as StoredOrder<OrderDraftPayload>;
      setOrderId(saved.id);setOrderNumber(saved.orderNumber);setOrderStatus(saved.status);setOrderRevision(saved.revision);setOrderMessage(status==="submitted"?"Order finalized and saved.":"Draft saved.");
      return saved;
    }catch(error){setOrderMessage(error instanceof Error?error.message:"Unable to save order");return null;}finally{setSavingOrder(false);}
  }
  async function loadOrderList(){setOrderMessage("");try{const response=await fetch("/api/orders",{cache:"no-store"});if(!response.ok)throw new Error(await response.text());setOrders(await response.json() as StoredOrder<OrderDraftPayload>[]);setShowOrders(true);}catch(error){setOrderMessage(error instanceof Error?error.message:"Unable to load orders");}}
  function openStoredOrder(order:StoredOrder<OrderDraftPayload>){
    const value=order.payload;setOrderId(order.id);setOrderNumber(order.orderNumber);setOrderStatus(order.status);setOrderRevision(order.revision);setCustomer(value.customer||"");setCustomerAccount(value.customerAccount||order.customerAccount);setPurchasingContact(value.purchasingContact||"");setEmail(value.email||"");setBillingAddress(value.billingAddress||"");setBillingAddressVerified(Boolean(value.billingAddressVerified));setPaymentTerms(value.paymentTerms||"");setJobName(value.jobName||"");setPoNumber(value.poNumber||"");setProjectName(value.projectName||"");setReceivingContact(value.receivingContact||"");setRequestedDate(value.requestedDate||"");setDelivery(value.delivery||"");setWillCallBranch(value.willCallBranch||"");setJobsiteAddress(value.jobsiteAddress||"");setJobsiteAddressVerified(Boolean(value.jobsiteAddressVerified));setProjectNotes(value.projectNotes||"");setAccessoryQty(value.accessoryQty||{});setFlashingQty(value.flashingQty||{});setFlashingSameAsPanel(value.flashingSameAsPanel!==false);setFlashingGauge(value.flashingGauge||"26 ga");setFlashingColor(value.flashingColor||"Glacier White");setFlashingPitchMode(value.flashingPitchMode||{});setFlashingCustomPitch(value.flashingCustomPitch||{});
    const panels=value.panels?.length?value.panels:[currentPanel];setSavedPanels(panels.length>1?panels:[]);setActivePanelIndex(0);loadPanel(panels[0]);setStep(0);setSubmitted(order.status==="submitted");setShowOrders(false);setShowPrintSummary(false);setPdfDownload(null);setOrderMessage(`${order.orderNumber} loaded for editing.`);
  }
  async function exportPdf(number=orderNumber){
    if(!number){setPdfError("Save the order to assign an order number before exporting PDF.");return null;}
    setPdfError("");
    try{const response=await fetch("/api/order-pdf",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(buildReportPayload(number))});if(!response.ok)throw new Error(await response.text());const blob=await response.blob(),url=URL.createObjectURL(blob),filename=safePdfFilename(number),link=document.createElement("a");link.href=url;link.download=filename;link.click();setPdfDownload({url,filename});return url;}catch(error){setPdfError(error instanceof Error?error.message:"Unable to generate PDF");return null;}
  }
  async function submitOrder(){setPdfError("");const saved=await persistOrder("submitted");if(!saved)return;setSubmitted(true);await exportPdf(saved.orderNumber);setShowPrintSummary(true);}

  if(showPrintSummary){
    const fulfillmentDetail=delivery==="Will call"?`${delivery} - ${willCallBranch}`:delivery==="Deliver to Jobsite"?`${delivery} - ${jobsiteAddress}`:`${delivery} - ${billingAddress}`;
    return <main className="printSummaryPage"><div className="printToolbar"><button onClick={()=>setShowPrintSummary(false)}>← Back to order</button><div><strong>Order summary</strong><span>Review the completed order below.</span></div></div><article className="printSheet">
      <header className="printHeader"><img src="/taylor-metal-logo.png" alt="Taylor Metal Products"/><div><h1>ORDER SUMMARY</h1><dl><div><dt>Order #</dt><dd>{orderNumber}</dd></div><div><dt>PO #</dt><dd>{poNumber||"Not provided"}</dd></div><div><dt>Date</dt><dd>{new Date().toLocaleDateString()}</dd></div><div><dt>Requested</dt><dd>{requestedDate||"Not set"}</dd></div></dl></div></header>
      <section className="printInfoGrid"><div><h2>PURCHASING COMPANY</h2><p><strong>{customer}</strong><br/>Account: {customerAccount}<br/>Contact: {purchasingContact}<br/>{email}<br/>{billingAddress}<br/>Payment: {paymentTerms}</p></div><div><h2>PROJECT INFORMATION</h2><p><strong>Job: {jobName}</strong><br/>Project: {projectName||"Not provided"}<br/>Receiving: {receivingContact}<br/>Delivery: {fulfillmentDetail}<br/>Submitted by: {purchasingContact||"Not provided"}</p></div></section>
      <section className="printSection"><h2>PANELS</h2><table><thead><tr><th>QTY</th><th>ITEM DESCRIPTION</th><th>GA./MATERIAL</th><th>FINISH</th><th>COLOR</th><th>OPTIONS</th></tr></thead><tbody>{allPanels.map((item,index)=><Fragment key={`${item.name}-${index}`}><tr className="parentRow"><td>{item.totalPanels}</td><td>{index+1}. {item.name} - {item.coverage}</td><td>{item.gauge}</td><td>{item.finish}</td><td>{item.color}</td><td>{[item.pan,item.notching,item.roofPitch?`Pitch ${item.roofPitch}`:"",item.clip].filter(Boolean).join(" | ")}</td></tr>{item.lengths.map((row,rowIndex)=><tr key={`${row.id}-${rowIndex}`}><td>{row.qty}</td><td>Length: {row.feet} ft {row.inches} in</td><td colSpan={4}></td></tr>)}</Fragment>)}</tbody></table><div className="printTotals"><strong>PANEL TOTAL: {orderPanelCount}</strong><strong>COVERAGE AREA: {orderArea.toLocaleString()} SQ FT</strong></div></section>
      <section className="printSection"><h2>ACCESSORIES</h2><table><thead><tr><th>QTY</th><th>UNIT</th><th>TYPE</th><th>ITEM DESCRIPTION</th><th>PART</th></tr></thead><tbody>{selectedAccessories.length?selectedAccessories.map(item=><tr key={item.id}><td>{accessoryQty[item.id]}</td><td>{item.unit}</td><td>{accessoryGroup(item)}</td><td>{item.name}</td><td>{item.id}</td></tr>):<tr><td colSpan={5}>No accessories selected</td></tr>}</tbody></table></section>
      <section className="printSection"><h2>FLASHINGS</h2><table><thead><tr><th>QTY</th><th>ITEM DESCRIPTION</th><th>GA./MATERIAL</th><th>COLOR</th><th>PITCH</th></tr></thead><tbody>{selectedFlashings.length?selectedFlashings.map(name=><tr key={name}><td>{flashingQty[name]}</td><td>{name}</td><td>{effectiveFlashingGauge}</td><td>{effectiveFlashingColor}</td><td>{flashingPitch(name)||"N/A"}</td></tr>):<tr><td colSpan={5}>No flashings selected</td></tr>}</tbody></table></section>
      <section className="printSection printPricing"><h2>PRICING SUMMARY</h2><p><span>Priced accessory subtotal</span><strong>${accessorySubtotal.toFixed(2)}</strong></p><p><span>Taxes / other charges</span><strong>${tax.toFixed(2)}</strong></p><p className="grandTotal"><span>Current order total</span><strong>${orderTotal.toFixed(2)}</strong></p><small>Panel, flashing, freight, and inquiry-item pricing is pending Taylor Metal review and is not included above.</small></section>
      {projectNotes&&<section className="printSection printNotes"><h2>PROJECT NOTES</h2><p>{projectNotes}</p></section>}<footer className="printFooter">RIVERSIDE CA | SACRAMENTO CA | SALEM OR | AUBURN WA | SPOKANE WA | TAYLORMETAL.COM</footer>
    </article></main>
  }

  return (
    <main>
      <header className="topbar">
        <div className="brand"><img className="brandLogo" src="/taylor-metal-logo.png" alt="Taylor Metal Products"/><div><strong>Taylor Metal Products</strong><small>Purchasing Portal Prototype</small></div></div>
        <div className="headerActions"><button className="ghost" type="button" onClick={loadOrderList}>Load orders</button><button className="ghost primaryGhost" type="button" onClick={()=>persistOrder("draft")} disabled={savingOrder}>{savingOrder?"Saving…":"Save draft"}</button></div>
      </header>

      <section className="hero">
        <div><p className="eyebrow">New material order</p><h1>Build a purchase package</h1><p>Configure panels, attachment items, delivery, and customer information in one guided order.</p></div>
        <div className="orderPill"><span>{orderStatus}{orderRevision?` · revision ${orderRevision}`:""}</span><strong>{orderNumber||"Enter account number"}</strong></div>
      </section>

      <nav className="steps" aria-label="Order steps">
        {steps.map((label, i) => <button key={label} onClick={() => setStep(i)} className={i === step ? "active" : i < step ? "done" : ""}><span>{i < step ? "✓" : i + 1}</span>{label}</button>)}
      </nav>

      <div className="workspace">
        <section className="formCard">
          {step === 0 && <>
            <SectionHead n="01" title="Customer Information" sub="Company and account information for this order." />
            <div className="grid2"><Field label="Purchasing company"><input value={customer} onChange={e=>setCustomer(e.target.value)} /></Field><Field label="Customer account"><input value={customerAccount} onChange={e=>setCustomerAccount(e.target.value)} onBlur={()=>{if(customerAccount.trim()&&!orderId)void persistOrder("draft")}} /></Field><Field label="Purchasing contact"><input value={purchasingContact} onChange={e=>setPurchasingContact(e.target.value)} /></Field><Field label="Email"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} /></Field><AddressField label="Billing / company yard address" value={billingAddress} onChange={setBillingAddress} verified={billingAddressVerified} onVerifiedChange={setBillingAddressVerified}/><Field label="Payment terms"><select value={paymentTerms} onChange={e=>setPaymentTerms(e.target.value)}><option value="" disabled>Select payment terms</option><option>Use Account</option><option>Pay with Credit Card</option></select></Field></div>
          </>}
          {step === 1 && <>
            <SectionHead n="02" title="Project Info" sub="Job, receiving contact, requested date, and delivery method." />
            <div className="grid2"><Field label="Job Name"><input value={jobName} onChange={e=>setJobName(e.target.value)} /></Field><Field label="Project Name (Optional)"><input value={projectName} onChange={e=>setProjectName(e.target.value)} /></Field><Field label="PO Number"><input value={poNumber} onChange={e=>setPoNumber(e.target.value)} /></Field><Field label="Contact info for person receiving material"><input value={receivingContact} onChange={e=>setReceivingContact(e.target.value)} /></Field><Field label="Date material requested"><input type="date" value={requestedDate} onChange={e=>setRequestedDate(e.target.value)} /></Field><Field label="Delivery"><select value={delivery} onChange={e=>setDelivery(e.target.value)}><option value="" disabled>Select delivery method</option><option>Deliver to purchasing company yard</option><option>Deliver to Jobsite</option><option>Will call</option></select></Field>{delivery==="Will call"&&<Field label="Will call branch"><select value={willCallBranch} onChange={e=>setWillCallBranch(e.target.value)}><option value="" disabled>Select branch</option>{["Spokane","Auburn","Salem","Sacramento","Riverside"].map(branch=><option key={branch}>{branch}</option>)}</select></Field>}{delivery==="Deliver to Jobsite"&&<AddressField label="Jobsite delivery address" value={jobsiteAddress} onChange={setJobsiteAddress} verified={jobsiteAddressVerified} onVerifiedChange={setJobsiteAddressVerified}/>}<Field label="Project Notes" wide><textarea value={projectNotes} onChange={e=>setProjectNotes(e.target.value)} /></Field></div>
          </>}
          {step === 2 && <>
            <SectionHead n="03" title="Panel Order" sub="Configure the panel, roof options, and required lengths." />
            <div className="panelOrderHeader"><div><strong>Panels in this order</strong><span>{allPanels.length} panel type{allPanels.length===1?"":"s"}</span></div><button type="button" onClick={addNewPanel}>+ New Panel</button></div>
            <div className="panelQueue">{allPanels.map((item,index)=><div key={`${index}-${item.name}`} className={index===activePanelIndex?"current":""} role="button" tabIndex={0} aria-label={`Edit panel ${index+1}`} onClick={()=>switchPanel(index)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();switchPanel(index)}}}><span>Panel {index+1}{index===activePanelIndex?" · editing":" · click to edit"}</span><strong>{item.name} · {item.coverage}</strong><small>{item.totalPanels} panels · {item.color}</small>{allPanels.length>1&&<button type="button" onClick={event=>{event.stopPropagation();removePanel(index)}} aria-label={`Remove panel ${index+1}`}>×</button>}</div>)}</div>
            <div className="grid2">
              <Field label="Panel profile"><select value={profileIndex} onChange={e=>chooseProfile(Number(e.target.value))}>{profiles.map((p,i)=><option key={`${p.name}-${p.coverages[0]}-${i}`} value={i}>{p.name} · {p.coverages[0]}</option>)}</select></Field>
              <Field label="Material / finish"><select value={materialId} onChange={e=>chooseMaterial(e.target.value as MaterialFinishId)}>{profile.materials.map(option=><option key={option.id} value={option.id}>{materialLabel(option.id)}</option>)}</select></Field>
              <Field label="Gauge / thickness"><select value={gauge} onChange={e=>chooseGauge(e.target.value)}>{getGaugeOptions(profile,materialId).map(x=><option key={x}>{x}</option>)}</select></Field>
              <Field label="Color (profile-filtered)"><select value={color} onChange={e=>setColor(e.target.value)}>{colors.map(x=><option key={x}>{x}{inquiryColors.has(x)?" · inquire":""}</option>)}</select></Field>
              {panProfiles.has(profile.name) && <Field label="Pan option"><select value={pan} onChange={e=>setPan(e.target.value)}>{panOptions.map(x=><option key={x}>{x}</option>)}</select></Field>}
              {allowsNotching(profile.name)&&<Field label="Panel notching"><select value={notching} onChange={e=>setNotching(e.target.value as "Notched" | "No Notch")}><option>No Notch</option><option>Notched</option></select></Field>}
              {isRoofPanel(profile.name) && <Field label="Roof pitch"><input value={roofPitch} onChange={e=>setRoofPitch(e.target.value)} inputMode="text" /></Field>}
              {clipOptions.length>0 && <Field label="Clip"><select value={effectiveClip} onChange={e=>setSelectedClip(e.target.value)}>{clipOptions.map(option=><option key={option}>{option}</option>)}</select></Field>}
            </div>
            <PanelPreview key={profile.id} profile={profile}/>
            {!panProfiles.has(profile.name) && <div className="noPan"><strong>Profile-controlled pan</strong><span>Pan options are not offered for {profile.name}.</span></div>}
            <div className="lengthBlock">
              <div className="lengthHead"><div><strong>Panel lengths</strong><span>Add a row for every required cut length.</span></div><button onClick={addLength}>+ Add panel length</button></div>
              <div className="lengthLabels"><span>Feet</span><span>Inches</span><span>Quantity</span><span></span></div>
              {lengthRows.map((row, i)=><div className="lengthRow" key={row.id}><input aria-label={`Length ${i+1} feet`} type="number" min="0" max="60" value={row.feet||""} onChange={e=>updateLength(row.id,"feet",Number(e.target.value))}/><input aria-label={`Length ${i+1} inches`} type="number" min="0" max="11" value={row.inches||""} onChange={e=>updateLength(row.id,"inches",Number(e.target.value))}/><input aria-label={`Length ${i+1} quantity`} type="number" min="1" value={row.qty||""} onChange={e=>updateLength(row.id,"qty",Number(e.target.value))}/><button aria-label={`Remove length ${i+1}`} onClick={()=>removeLength(row.id)} disabled={lengthRows.length===1}>×</button></div>)}
            </div>
            <div className={`ruleNote ${inquiry?"warning":""}`}><strong>{inquiry?"Sales review required":"Catalog rule passed"}</strong><span>{profile.note || `${profile.name} is available in ${materialLabel(materialId)} at ${gauge}.`}</span>{materialAvailability.coil && <em>Derived coil: {materialAvailability.coil}</em>}</div>
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
            <div className="finishToggle" role="group" aria-label="Flashing color and gauge selection"><button className={flashingSameAsPanel?"selected":""} onClick={()=>setFlashingSameAsPanel(true)}><strong>Same as panel</strong><small>{color} · {gauge}</small></button><button className={!flashingSameAsPanel?"selected":""} onClick={()=>setFlashingSameAsPanel(false)}><strong>Select separately</strong><small>Choose flashing color and gauge</small></button></div>
            {!flashingSameAsPanel&&<div className="grid2 flashingFinish"><Field label="Flashing gauge / material"><select value={flashingGauge} onChange={e=>setFlashingGauge(e.target.value)}>{["22 ga","24 ga","26 ga","29 ga",".032″ Aluminum"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Flashing color"><select value={flashingColor} onChange={e=>setFlashingColor(e.target.value)}>{Array.from(new Set([...armortechColors,...kynar500Colors])).sort().map(x=><option key={x}>{x}</option>)}</select></Field></div>}
            <div className="catalogTools flashingTools"><input aria-label="Search flashing names" placeholder="Search flashing names" value={flashingSearch} onChange={e=>setFlashingSearch(e.target.value)}/><div className="finishReadout"><span>Order finish</span><strong>{effectiveFlashingColor} · {effectiveFlashingGauge}</strong></div></div>
            <div className="flashingGroupedCatalog">{filteredFlashingGroups.map(group=><section className="flashingGroup" key={group.name}><div className="flashingGroupHead"><strong>{group.name}</strong><span>{group.items.length} profile{group.items.length===1?"":"s"}</span></div><div className="catalogGrid flashingGrid">{group.items.map(name=>{const selected=(flashingQty[name]||0)>0,needsPitch=Boolean(pitchType(name)),mode=flashingPitchMode[name]||"panel";return <article key={name} className={selected?"selected":""}><button className="catalogSelect flashingSelect" onClick={()=>toggleFlashing(name)} aria-pressed={selected}><span className="catalogCheck">{selected?"✓":"+"}</span><span className="flashingIdentity"><FlashingSketch name={name}/><strong>{name}</strong></span></button>{selected&&<><div className="qtyControl"><span>Order quantity</span><button onClick={()=>setFlashingQuantity(name,(flashingQty[name]||1)-1)}>−</button><input aria-label={`${name} quantity`} type="number" min="1" value={flashingQty[name]} onChange={e=>setFlashingQuantity(name,Number(e.target.value))}/><button onClick={()=>setFlashingQuantity(name,(flashingQty[name]||0)+1)}>+</button></div>{needsPitch&&<div className="flashingPitch"><label><span>{pitchType(name)==="peak"?"Peak pitch":"Flashing pitch"}</span><select value={mode} onChange={e=>setFlashingPitchMode(value=>({...value,[name]:e.target.value as "panel"|"custom"}))}><option value="panel">Panel pitch ({activeRoofPitch})</option><option value="custom">Custom Pitch</option></select></label>{mode==="custom"&&<label><span>Custom Pitch</span><input value={flashingCustomPitch[name]||""} onChange={e=>setFlashingCustomPitch(value=>({...value,[name]:e.target.value}))} placeholder="Example: 6:12"/></label>}</div>}</>}</article>})}</div></section>)}</div>
            {filteredFlashingGroups.length===0&&<div className="emptyCatalog">No flashing names match this search.</div>}
            <button className="addCustom">+ Add a custom flashing request</button>
          </>}
          {step === 5 && <>
            <SectionHead n="06" title="Review & submit" sub="Review the order, then open the complete order summary." />
            <div className="reviewGrid"><Review label="Purchasing company" value={customer}/><Review label="Job" value={jobName}/><Review label="PO Number" value={poNumber || "Not provided"}/><Review label="Project" value={projectName || "Not provided"}/><Review label="Delivery" value={delivery==="Will call"?`${delivery} · ${willCallBranch}`:delivery}/><Review label="Panel types" value={`${allPanels.length} configured`}/><Review label="Panel order" value={`${orderPanelCount} panels · ${orderArea.toLocaleString()} sq ft`}/>{allPanels.map((item,index)=><Review key={`${item.name}-${index}`} label={`Panel ${index+1}`} value={`${item.finish} · ${item.name} · ${item.coverage} · ${item.gauge} · ${item.color}${item.roofPitch?` · Pitch ${item.roofPitch}`:""}`}/>)}<Review label="Accessories" value={`${selectedAccessories.length} items · ${selectedAccessoryUnits} units`}/><Review label="Flashing" value={`${selectedFlashings.length} names · ${selectedFlashingPieces} pieces · ${effectiveFlashingColor} · ${effectiveFlashingGauge}`}/></div>
            <div className="financialSummary"><div><span>Priced accessory subtotal</span><strong>${accessorySubtotal.toFixed(2)}</strong></div><div><span>Taxes / other charges</span><strong>${tax.toFixed(2)}</strong></div><div className="total"><span>Current total</span><strong>${orderTotal.toFixed(2)}</strong></div><small>Unpriced panels, flashings, freight, and inquiry items require Taylor Metal review.</small></div>
            <label className="ack"><input type="checkbox" defaultChecked/><span>I acknowledge that oil canning can occur in light-gauge metal and is not considered a defect.</span></label>
            <label className="ack"><input type="checkbox" defaultChecked/><span>I have reviewed the profile, finish, color, quantities, delivery details, and accessory assumptions.</span></label>
            <div className="reportActions"><button type="button" className="ghost" onClick={()=>persistOrder("draft")} disabled={savingOrder}>Save changes</button><button type="button" className="ghost" onClick={()=>exportPdf()} disabled={!orderNumber}>Export PDF</button></div>
            {submitted&&pdfDownload&&<div className="submittedNotice"><strong>Order summary created</strong><span>If the automatic download did not begin, use this direct PDF link.</span><a href={pdfDownload.url} download={pdfDownload.filename}>Download PDF order summary</a></div>}
            {pdfError&&<div className="pdfError" role="alert">{pdfError}</div>}
          </>}

          {orderMessage&&<div className="orderMessage" role="status">{orderMessage}</div>}
          <div className="formActions"><button type="button" className="back" onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0}>Back</button><button type="button" className="next" onClick={()=>step<5?setStep(step+1):submitOrder()} disabled={savingOrder}>{step===5?(orderStatus==="submitted"?"Resubmit & generate PDF":"Submit & generate PDF"):"Continue"}<span>→</span></button></div>
        </section>

        <aside className="summary">
          <div className="summaryTop"><span>Live order summary</span><b>{complete?"Ready":"Needs attention"}</b></div>
          <div className="productSketch"><div className="roofLine"></div><p>{allPanels.length} panel type{allPanels.length===1?"":"s"}</p><small>{orderPanelCount} panels · {orderArea.toLocaleString()} sq ft</small></div>
          <dl><div><dt>Current panel</dt><dd>{profile.name} · {coverage}</dd></div><div><dt>Finish</dt><dd>{materialLabel(materialId)}</dd></div><div><dt>Material</dt><dd>{gauge}</dd></div><div><dt>Color</dt><dd>{color}</dd></div>{panProfiles.has(profile.name)&&<div><dt>Pan option</dt><dd>{pan}</dd></div>}{allowsNotching(profile.name)&&<div><dt>Panel notching</dt><dd>{notching}</dd></div>}{isRoofPanel(profile.name)&&<div><dt>Roof pitch</dt><dd>{roofPitch}</dd></div>}{effectiveClip&&<div><dt>Clip</dt><dd>{effectiveClip}</dd></div>}<div><dt>Delivery</dt><dd>{delivery==="Will call"?`${delivery} · ${willCallBranch}`:delivery}</dd></div>{materialAvailability.coil&&<div><dt>Coil width</dt><dd>{materialAvailability.coil}</dd></div>}<div><dt>Panel types</dt><dd>{allPanels.length}</dd></div><div><dt>Order panels</dt><dd>{orderPanelCount}</dd></div><div><dt>Coverage area</dt><dd>{orderArea.toLocaleString()} sq ft</dd></div><div><dt>Accessories</dt><dd>{selectedAccessories.length} items · {selectedAccessoryUnits} units</dd></div><div><dt>Flashing</dt><dd>{selectedFlashings.length} names · {selectedFlashingPieces} pcs</dd></div><div><dt>Flashing finish</dt><dd>{flashingSameAsPanel?"Same as panel":`${effectiveFlashingColor} · ${effectiveFlashingGauge}`}</dd></div><div><dt>Child categories</dt><dd>{addOnCount} selected</dd></div></dl>
          <div className="statusBox"><span className={inquiry?"amber":"green"}></span><div><strong>{inquiry?"Inquiry configuration":"Configuration valid"}</strong><small>{inquiry?"Availability and pricing review required":"No catalog conflicts detected"}</small></div></div>
        </aside>
      </div>
      {showOrders&&<div className="orderLibraryBackdrop" role="presentation" onMouseDown={()=>setShowOrders(false)}><section className="orderLibrary" role="dialog" aria-modal="true" aria-label="Saved orders" onMouseDown={event=>event.stopPropagation()}><div className="orderLibraryHead"><div><span>Persistent order storage</span><h2>Saved orders</h2></div><button type="button" onClick={()=>setShowOrders(false)} aria-label="Close saved orders">×</button></div>{orders.length?<div className="orderList">{orders.map(order=><button type="button" key={order.id} onClick={()=>openStoredOrder(order)}><span><strong>{order.orderNumber}</strong><small>{order.customerAccount} · updated {new Date(order.updatedAt).toLocaleString()}</small></span><b className={order.status}>{order.status}</b></button>)}</div>:<div className="emptyOrders">No saved orders yet.</div>}</section></div>}
      <footer><span>Interactive prototype · Catalog rules dated June/August 2026</span><span>12 in Kynar 500® Contour is excluded</span></footer>
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
