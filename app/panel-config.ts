export type MaterialFinishId = "armortech" | "kynar500" | "kynar500-aluminum" | "unpainted-steel";

export type PanelId =
  | "streamline"
  | "slim-lock"
  | "ms-150"
  | "board-and-batten"
  | "tuff-rib"
  | "t-3"
  | "pbr"
  | "marion-r-panel"
  | "hr-34"
  | "gr-7"
  | "max-corr"
  | "classic-7-8-corrugated"
  | "two-and-a-half-corrugated"
  | "easy-lock"
  | "ms-100"
  | "ms-200"
  | "versa-span"
  | "smoothwall-soffit-shadowline"
  | "contour"
  | "flat-sheet";

export type MaterialAvailability = {
  id: MaterialFinishId;
  gauges: string[];
  specialOrderGauges?: string[];
  coil?: string;
  colorsByGauge?: Partial<Record<string, string[]>>;
};

export type PanelProfile = {
  id: PanelId;
  name: string;
  coverages: string[];
  materials: MaterialAvailability[];
  note?: string;
  group?: string;
  sourceUrl?: string;
};

export type PanelImageAsset = {
  name: string;
  src: string;
  sourceUrl: string;
};

/*
 * Official Taylor Metal catalog artwork, stored locally so the purchasing
 * portal never depends on a hotlinked image. Combined or non-profile products
 * are intentionally omitted instead of receiving an incorrect substitute.
 */
export const panelImageCatalog: Partial<Record<PanelId, PanelImageAsset>> = {
  streamline: { name: "StreamLine™", src: "/panel-profiles/streamline.jpg", sourceUrl: "https://taylormetal.com/wp-content/uploads/2020/07/StreamLine-1622-Striations-Screw-Concealer-Notched-1536x823.jpg" },
  "slim-lock": { name: "Slim-Lock™", src: "/panel-profiles/slim-lock.jpg", sourceUrl: "https://taylormetal.com/wp-content/uploads/2025/08/Slim-Lock-Accent-Ribs-1200x927.jpg" },
  "ms-150": { name: "MS-150™", src: "/panel-profiles/ms-150.jpg", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/MS150-Striation.jpg" },
  "board-and-batten": { name: "Board and Batten Siding Panel", src: "/panel-profiles/board-and-batten.jpg", sourceUrl: "https://taylormetal.com/wp-content/uploads/2025/09/Board-and-Batten-12in-Lightly-Striated-1200x927.jpg" },
  "tuff-rib": { name: "Tuff Rib", src: "/panel-profiles/tuff-rib.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/Tuff-Rib-cocoa-brown.png" },
  "t-3": { name: "T-3™", src: "/panel-profiles/t-3.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/T-3.png" },
  pbr: { name: "PBR", src: "/panel-profiles/pbr.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/PBR.png" },
  "marion-r-panel": { name: "Marion “R” Panel™", src: "/panel-profiles/marion-r-panel.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/Marion-R-Panel.png" },
  "hr-34": { name: "HR-34™", src: "/panel-profiles/hr-34.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/HR34.png" },
  "gr-7": { name: "GR-7™", src: "/panel-profiles/gr-7.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/GR-7-flat.png" },
  "max-corr": { name: "Max Corr™", src: "/panel-profiles/2-12-corrugated.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/2-12-corrugated.png" },
  "classic-7-8-corrugated": { name: "Classic 7/8″ Corrugated™", src: "/panel-profiles/classic-7-8-corrugated.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/78-corrugated.png" },
  "two-and-a-half-corrugated": { name: "2-1/2″ Corrugated", src: "/panel-profiles/2-12-corrugated.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/2-12-corrugated.png" },
  "easy-lock": { name: "Easy-Lock™", src: "/panel-profiles/easy-lock.jpg", sourceUrl: "https://taylormetal.com/wp-content/uploads/2026/08/Easy-Lock-1in-Clip-Relief-Striations.jpg" },
  "ms-100": { name: "MS-100™", src: "/panel-profiles/ms-100.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/MS100-accent-ribs.png" },
  "ms-200": { name: "MS-200™", src: "/panel-profiles/ms-200.jpg", sourceUrl: "https://taylormetal.com/wp-content/uploads/2024/08/MS200-Striations-Clip-Relief-scaled-1-1200x667.jpg" },
  "versa-span": { name: "Versa-Span™", src: "/panel-profiles/versa-span.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/Versa-Span-accent-ribs.png" },
  contour: { name: "Contour Classic Series™", src: "/panel-profiles/contour.jpg", sourceUrl: "https://taylormetal.com/wp-content/uploads/2024/09/C-8-Clip-24ga-Panel-scaled-1-1200x928.jpg" },
};

export const materialFinishLabels: Record<MaterialFinishId, string> = {
  armortech: "ArmorTech™",
  kynar500: "Kynar 500®",
  "kynar500-aluminum": "Kynar 500® Painted Aluminum",
  "unpainted-steel": "ZINCALUME® Plus / Galvanized Steel",
};

export const armortechColors = [
  "Glacier White", "Stone White", "Light Stone", "Hickory", "Sterling Grey",
  "Charcoal Grey", "Tile Red", "Tahoe Blue", "Pacific Blue", "Forest Green",
  "Pine Green", "Cocoa Brown", "Kodiak Brown", "Weathered Copper",
  "Obsidian Black", "Copper Penny", "Satin Black", "ZINCALUME®", "Galvanized",
];

export const kynar500Colors = [
  "Glacier White", "Sierra Tan", "Parchment", "Sterling Grey", "Zinc Grey",
  "Charcoal Grey", "Medium Bronze", "Tahoe Blue", "Pacific Blue", "Hemlock Green",
  "Forest Green", "Pine Green", "Dark Bronze", "Graphite Black", "Matte Black",
  "Musket", "Terra Cotta", "Tile Red", "Vintage", "ZINCALUME® Plus", "Galvanized",
  "Colonial Red", "Retro Red", "Metallic Silver", "Copper Penny", "Weathered Zinc",
];

const aluminumColors = kynar500Colors.filter(color => ![
  "Sierra Tan", "Hemlock Green", "Pine Green", "Terra Cotta", "Tile Red",
  "Copper Penny", "Vintage", "Galvanized", "ZINCALUME® Plus",
].includes(color));

const ARMORTECH = (gauges: ("29 ga" | "26 ga")[] = ["26 ga"]): MaterialAvailability => ({
  id: "armortech",
  gauges,
});

type Kynar500SteelGauge = "26 ga" | "24 ga" | "22 ga";

const KYNAR_500_STEEL = (
  coil: string,
  gauges: Kynar500SteelGauge[] = ["24 ga", "22 ga"],
  colorsByGauge?: MaterialAvailability["colorsByGauge"],
): MaterialAvailability => ({
  id: "kynar500",
  gauges,
  coil,
  colorsByGauge,
});

const KYNAR_500_ALUMINUM = (coil: string): MaterialAvailability => ({
  id: "kynar500-aluminum",
  gauges: [".032″ Aluminum"],
  coil,
});

const UNPAINTED_STEEL = (gauges: ("29 ga" | "26 ga" | "24 ga" | "22 ga")[]): MaterialAvailability => ({
  id: "unpainted-steel",
  gauges,
});

const WITH_SPECIAL = (material: MaterialAvailability, specialOrderGauges: string[]): MaterialAvailability => ({
  ...material,
  specialOrderGauges,
});

/*
 * Panel availability is maintained here. Each profile explicitly opts into its
 * material systems. KYNAR_500_STEEL accepts a per-profile gauge list, such as
 * KYNAR_500_STEEL("20 in", ["24 ga"]), and colorsByGauge can narrow colors for
 * an individual gauge when Taylor Metal supplies revised manufacturing rules.
 */
export const panelProfiles: PanelProfile[] = [
  { id: "streamline", name: "StreamLine™", coverages: ["12 in", "16 in"], materials: [ARMORTECH()], group: "S1", sourceUrl: "https://taylormetal.com/products/standing-seam-panels/streamline/" },
  { id: "slim-lock", name: "Slim-Lock™", coverages: ["16 in nominal"], materials: [KYNAR_500_STEEL("20 in"), KYNAR_500_ALUMINUM("20 in")], note: "Accent ribs, striations or flat pan", sourceUrl: "https://taylormetal.com/products/standing-seam-panels/slim-lock-produced-in-or/" },
  { id: "ms-150", name: "MS-150™", coverages: ["12 in"], materials: [KYNAR_500_STEEL("16 in", ["26 ga", "24 ga", "22 ga"]), KYNAR_500_ALUMINUM("16 in")], note: "Accent ribs, striations or flat pan", sourceUrl: "https://taylormetal.com/products/mechanically-seamed-panels/ms-150/" },
  { id: "ms-150", name: "MS-150™", coverages: ["16 in"], materials: [KYNAR_500_STEEL("20 in", ["26 ga", "24 ga", "22 ga"]), KYNAR_500_ALUMINUM("20 in")], note: "Accent ribs, striations or flat pan", sourceUrl: "https://taylormetal.com/products/mechanically-seamed-panels/ms-150/" },
  { id: "ms-150", name: "MS-150™", coverages: ["20 in"], materials: [KYNAR_500_STEEL("24 in", ["26 ga", "24 ga", "22 ga"]), KYNAR_500_ALUMINUM("24 in")], note: "Accent ribs, striations or flat pan", sourceUrl: "https://taylormetal.com/products/mechanically-seamed-panels/ms-150/" },
  { id: "board-and-batten", name: "Board and Batten Siding Panel", coverages: ["12 in"], materials: [ARMORTECH(), KYNAR_500_STEEL("16 in", ["26 ga", "24 ga", "22 ga"]), KYNAR_500_ALUMINUM("16 in")], group: "S1", sourceUrl: "https://taylormetal.com/products/concealed-fastener-panels/board-batten/" },
  { id: "board-and-batten", name: "Board and Batten Siding Panel", coverages: ["16 in"], materials: [ARMORTECH(), KYNAR_500_STEEL("20 in", ["26 ga", "24 ga", "22 ga"]), KYNAR_500_ALUMINUM("20 in")], group: "S1", sourceUrl: "https://taylormetal.com/products/concealed-fastener-panels/board-batten/" },
  { id: "tuff-rib", name: "Tuff Rib", coverages: ["36 in"], materials: [ARMORTECH(["29 ga", "26 ga"]), KYNAR_500_ALUMINUM("43 in")], group: "S2", sourceUrl: "https://taylormetal.com/products/exposed-fastener-panels/tuff-rib/" },
  { id: "t-3", name: "T-3™", coverages: ["36 in"], materials: [ARMORTECH(), KYNAR_500_STEEL("43 in"), WITH_SPECIAL(KYNAR_500_ALUMINUM("43 in"), [".040″ Aluminum"]), UNPAINTED_STEEL(["29 ga"])], note: "Standard or wall profile", group: "S2", sourceUrl: "https://taylormetal.com/products/exposed-fastener-panels/t-3/" },
  { id: "pbr", name: "PBR", coverages: ["36 in"], materials: [ARMORTECH(), KYNAR_500_STEEL("43 in"), WITH_SPECIAL(KYNAR_500_ALUMINUM("43 in"), [".040″ Aluminum"])], group: "S4", sourceUrl: "https://taylormetal.com/products/exposed-fastener-panels/pbr/" },
  { id: "marion-r-panel", name: "Marion “R” Panel™", coverages: ["36 in"], materials: [ARMORTECH(), KYNAR_500_STEEL("43 in"), WITH_SPECIAL(KYNAR_500_ALUMINUM("43 in"), [".040″ Aluminum"])], group: "S4", sourceUrl: "https://taylormetal.com/products/exposed-fastener-panels/marion-r-panel/" },
  { id: "hr-34", name: "HR-34™", coverages: ["34 in"], materials: [ARMORTECH(), WITH_SPECIAL(KYNAR_500_STEEL("43 in"), ["20 ga", "18 ga"]), WITH_SPECIAL(KYNAR_500_ALUMINUM("43 in"), [".040″ Aluminum", ".050″ Aluminum", ".063″ Aluminum"])], group: "S4", sourceUrl: "https://taylormetal.com/products/exposed-fastener-panels/hr-34-produced-in-or/" },
  { id: "gr-7", name: "GR-7™", coverages: ["36 in"], materials: [ARMORTECH(), WITH_SPECIAL(KYNAR_500_STEEL("43 in"), ["20 ga", "18 ga"]), WITH_SPECIAL(KYNAR_500_ALUMINUM("43 in"), [".040″ Aluminum", ".050″ Aluminum", ".063″ Aluminum"]), UNPAINTED_STEEL(["29 ga"])], group: "S2", sourceUrl: "https://taylormetal.com/products/exposed-fastener-panels/gr-7/" },
  { id: "max-corr", name: "Max Corr™", coverages: ["34-5/8 in"], materials: [ARMORTECH(["29 ga"])], group: "S4", sourceUrl: "https://taylormetal.com/products/exposed-fastener-panels/max-corr/" },
  { id: "max-corr", name: "Max Corr™", coverages: ["37-1/4 in"], materials: [ARMORTECH(), KYNAR_500_STEEL("43 in"), WITH_SPECIAL(KYNAR_500_ALUMINUM("43 in"), [".040″ Aluminum"])], group: "S4", sourceUrl: "https://taylormetal.com/products/exposed-fastener-panels/max-corr/" },
  { id: "classic-7-8-corrugated", name: "Classic 7/8″ Corrugated™", coverages: ["32 in"], materials: [ARMORTECH(["29 ga", "26 ga"]), WITH_SPECIAL(KYNAR_500_STEEL("43 in"), ["20 ga", "18 ga"]), WITH_SPECIAL(KYNAR_500_ALUMINUM("43 in"), [".040″ Aluminum", ".050″ Aluminum", ".063″ Aluminum"])], group: "S5", sourceUrl: "https://taylormetal.com/products/exposed-fastener-panels/classic-7-8-corrugated-produced-in-salem/" },
  { id: "two-and-a-half-corrugated", name: "2-1/2″ Corrugated", coverages: ["24 in"], materials: [UNPAINTED_STEEL(["29 ga", "26 ga"])], note: "ZINCALUME® Plus or Galvanized; wall use", group: "S6", sourceUrl: "https://taylormetal.com/products/exposed-fastener-panels/2-1-2-corrugated/" },
  { id: "easy-lock", name: "Easy-Lock™", coverages: ["12 in"], materials: [KYNAR_500_STEEL("16 in", ["26 ga", "24 ga", "22 ga"]), KYNAR_500_ALUMINUM("16 in")], sourceUrl: "https://taylormetal.com/products/standing-seam-panels/easy-lock/" },
  { id: "easy-lock", name: "Easy-Lock™", coverages: ["16 in"], materials: [KYNAR_500_STEEL("20 in", ["26 ga", "24 ga", "22 ga"]), KYNAR_500_ALUMINUM("20 in")], sourceUrl: "https://taylormetal.com/products/standing-seam-panels/easy-lock/" },
  { id: "ms-100", name: "MS-100™", coverages: ["13 in"], materials: [WITH_SPECIAL(KYNAR_500_STEEL("16 in"), ["20 ga", "18 ga"]), WITH_SPECIAL(KYNAR_500_ALUMINUM("16 in"), [".040″ Aluminum", ".050″ Aluminum", ".063″ Aluminum"])], sourceUrl: "https://taylormetal.com/products/mechanically-seamed-panels/ms-100/" },
  { id: "ms-100", name: "MS-100™", coverages: ["17 in", "21 in"], materials: [WITH_SPECIAL(KYNAR_500_STEEL("20 in"), ["20 ga", "18 ga"]), WITH_SPECIAL(KYNAR_500_ALUMINUM("20 in"), [".040″ Aluminum", ".050″ Aluminum", ".063″ Aluminum"])], sourceUrl: "https://taylormetal.com/products/mechanically-seamed-panels/ms-100/" },
  { id: "ms-200", name: "MS-200™", coverages: ["12 in", "14 in"], materials: [KYNAR_500_STEEL("20 in", ["26 ga", "24 ga", "22 ga"]), KYNAR_500_ALUMINUM("20 in")], sourceUrl: "https://taylormetal.com/products/mechanically-seamed-panels/ms-200/" },
  { id: "ms-200", name: "MS-200™", coverages: ["16 in", "18 in"], materials: [KYNAR_500_STEEL("24 in", ["26 ga", "24 ga", "22 ga"]), KYNAR_500_ALUMINUM("24 in")], sourceUrl: "https://taylormetal.com/products/mechanically-seamed-panels/ms-200/" },
  { id: "versa-span", name: "Versa-Span™", coverages: ["12 in", "14 in"], materials: [WITH_SPECIAL(KYNAR_500_STEEL("20 in"), ["20 ga", "18 ga"]), WITH_SPECIAL(KYNAR_500_ALUMINUM("20 in"), [".040″ Aluminum", ".050″ Aluminum", ".063″ Aluminum"])], sourceUrl: "https://taylormetal.com/products/standing-seam-panels/versa-span-produced-in-salem/" },
  { id: "versa-span", name: "Versa-Span™", coverages: ["16 in", "18 in"], materials: [WITH_SPECIAL(KYNAR_500_STEEL("24 in"), ["20 ga", "18 ga"]), WITH_SPECIAL(KYNAR_500_ALUMINUM("24 in"), [".040″ Aluminum", ".050″ Aluminum", ".063″ Aluminum"])], sourceUrl: "https://taylormetal.com/products/standing-seam-panels/versa-span-produced-in-salem/" },
  { id: "smoothwall-soffit-shadowline", name: "SmoothWall™ / Lifetime Soffit™ / ShadowLine™", coverages: ["1 in depth"], materials: [WITH_SPECIAL(KYNAR_500_STEEL("16 in"), ["20 ga", "18 ga"]), WITH_SPECIAL(KYNAR_500_ALUMINUM("16 in"), [".040″ Aluminum", ".050″ Aluminum", ".063″ Aluminum"])], sourceUrl: "https://taylormetal.com/products/concealed-fastener-panels/smoothwall/" },
  { id: "smoothwall-soffit-shadowline", name: "SmoothWall™ / Lifetime Soffit™ / ShadowLine™", coverages: ["1-1/2 in depth"], materials: [WITH_SPECIAL(KYNAR_500_STEEL("20 in"), ["20 ga", "18 ga"]), WITH_SPECIAL(KYNAR_500_ALUMINUM("20 in"), [".040″ Aluminum", ".050″ Aluminum", ".063″ Aluminum"])], sourceUrl: "https://taylormetal.com/products/concealed-fastener-panels/smoothwall/" },
  { id: "contour", name: "Contour Classic Series™", coverages: ["12 in", "16 in"], materials: [WITH_SPECIAL(KYNAR_500_STEEL("24 in"), ["20 ga", "18 ga"]), WITH_SPECIAL(KYNAR_500_ALUMINUM("24 in"), [".040″ Aluminum", ".050″ Aluminum", ".063″ Aluminum"])], sourceUrl: "https://taylormetal.com/products/contour/c-5/" },
  { id: "flat-sheet", name: "Flat Sheet", coverages: ["48 x 120 in"], materials: [KYNAR_500_STEEL("48 in"), KYNAR_500_ALUMINUM("48 in")], sourceUrl: "https://taylormetal.com/wp-content/uploads/2021/11/Flat-Sheet.pdf" },
];

export function materialLabel(id: MaterialFinishId) {
  return materialFinishLabels[id];
}

export function getMaterialAvailability(profile: PanelProfile, id: MaterialFinishId) {
  return profile.materials.find(material => material.id === id) ?? profile.materials[0];
}

export function getGaugeOptions(profile: PanelProfile, id: MaterialFinishId) {
  return getMaterialAvailability(profile, id).gauges;
}

export function getPanelColors(profile: PanelProfile, id: MaterialFinishId, gauge: string) {
  const availability = getMaterialAvailability(profile, id);
  const override = availability.colorsByGauge?.[gauge];
  if (override) return override;
  if (id === "unpainted-steel") return ["ZINCALUME® Plus", "Galvanized"];
  if (id === "armortech") {
    return profile.group === "S6" ? ["ZINCALUME®", "Galvanized"] : armortechColors;
  }
  let colors = id === "kynar500-aluminum" ? [...aluminumColors] : [...kynar500Colors];
  if (availability.coil === "16 in" && gauge === "22 ga") {
    colors = colors.filter(color => !["Pacific Blue", "Hemlock Green", "Pine Green", "Terra Cotta", "Tile Red", "Copper Penny", "Retro Red"].includes(color));
  }
  if (availability.coil === "48 in") {
    colors = colors.filter(color => !["Vintage", "Copper Penny"].includes(color));
  }
  return colors;
}

export function normalizeMaterialId(value: string | undefined, gauge?: string): MaterialFinishId {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("aluminum") || gauge?.toLowerCase().includes("aluminum")) return "kynar500-aluminum";
  if (normalized.includes("zincalume") || normalized.includes("galvanized") || normalized.includes("unpainted")) return "unpainted-steel";
  if (normalized.includes("kynar")) return "kynar500";
  return "armortech";
}

export function normalizeProductTerminology(value: unknown) {
  return String(value ?? "")
    .replace(/ArmorTech™?/gi, "ArmorTech™")
    .replace(/Kynar 500 PVDF/gi, "Kynar 500®")
    .replace(/Kynar 500(?!®)/gi, "Kynar 500®")
    .replace(/Kynar(?! 500®)/gi, "Kynar 500®")
    .replace(/Zincalume®?\s+Plus/gi, "ZINCALUME® Plus")
    .replace(/Zincalume®?/gi, "ZINCALUME®")
    .replace(/Galvalume®?/gi, "Galvalume®")
    .replace(/Versa[ -]Span™?/gi, "Versa-Span™")
    .replace(/Easy-Lock™?/gi, "Easy-Lock™")
    .replace(/StreamLine™?/gi, "StreamLine™")
    .replace(/Slim-Lock™?/gi, "Slim-Lock™")
    .replace(/MS-(100|150|200)™?/gi, "MS-$1™")
    .replace(/\bT-3™?/gi, "T-3™")
    .replace(/\bGR-7™?/gi, "GR-7™")
    .replace(/Max Corr™?/gi, "Max Corr™")
    .replace(/HR-34™?/gi, "HR-34™")
    .replace(/Marion\s+[“\"]?R[”\"]?\s+Panel™?/gi, "Marion “R” Panel™")
    .replace(/Classic 7\/8(?:″|\")? Corrugated™?/gi, "Classic 7/8″ Corrugated™")
    .replace(/2-1\/2(?:″|\")? Corrugated/gi, "2-1/2″ Corrugated")
    .replace(/^Board and Batten$/gi, "Board and Batten Siding Panel")
    .replace(/^SmoothWall\s*\/\s*Soffit\s*\/\s*ShadowLine$/gi, "SmoothWall™ / Lifetime Soffit™ / ShadowLine™")
    .replace(/^Contour$/gi, "Contour Classic Series™");
}
