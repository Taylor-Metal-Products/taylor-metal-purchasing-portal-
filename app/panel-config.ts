export type MaterialFinishId = "armortech" | "kynar500" | "kynar500-aluminum";

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
  streamline: { name: "StreamLine", src: "/panel-profiles/streamline.jpg", sourceUrl: "https://taylormetal.com/wp-content/uploads/2020/07/StreamLine-1622-Striations-Screw-Concealer-Notched-1536x823.jpg" },
  "slim-lock": { name: "Slim-Lock", src: "/panel-profiles/slim-lock.jpg", sourceUrl: "https://taylormetal.com/wp-content/uploads/2025/08/Slim-Lock-Accent-Ribs-1200x927.jpg" },
  "ms-150": { name: "MS-150", src: "/panel-profiles/ms-150.jpg", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/MS150-Striation.jpg" },
  "board-and-batten": { name: "Board and Batten", src: "/panel-profiles/board-and-batten.jpg", sourceUrl: "https://taylormetal.com/wp-content/uploads/2025/09/Board-and-Batten-12in-Lightly-Striated-1200x927.jpg" },
  "tuff-rib": { name: "Tuff Rib", src: "/panel-profiles/tuff-rib.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/Tuff-Rib-cocoa-brown.png" },
  "t-3": { name: "T-3", src: "/panel-profiles/t-3.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/T-3.png" },
  pbr: { name: "PBR", src: "/panel-profiles/pbr.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/PBR.png" },
  "marion-r-panel": { name: "Marion R Panel", src: "/panel-profiles/marion-r-panel.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/Marion-R-Panel.png" },
  "hr-34": { name: "HR-34", src: "/panel-profiles/hr-34.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/HR34.png" },
  "gr-7": { name: "GR-7", src: "/panel-profiles/gr-7.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/GR-7-flat.png" },
  "max-corr": { name: "Max Corr", src: "/panel-profiles/2-12-corrugated.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/2-12-corrugated.png" },
  "classic-7-8-corrugated": { name: "Classic 7/8 Corrugated", src: "/panel-profiles/classic-7-8-corrugated.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/78-corrugated.png" },
  "two-and-a-half-corrugated": { name: "2-1/2 Corrugated", src: "/panel-profiles/2-12-corrugated.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/2-12-corrugated.png" },
  "easy-lock": { name: "Easy-Lock", src: "/panel-profiles/easy-lock.jpg", sourceUrl: "https://taylormetal.com/wp-content/uploads/2026/08/Easy-Lock-1in-Clip-Relief-Striations.jpg" },
  "ms-100": { name: "MS-100", src: "/panel-profiles/ms-100.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/MS100-accent-ribs.png" },
  "ms-200": { name: "MS-200", src: "/panel-profiles/ms-200.jpg", sourceUrl: "https://taylormetal.com/wp-content/uploads/2024/08/MS200-Striations-Clip-Relief-scaled-1-1200x667.jpg" },
  "versa-span": { name: "Versa-Span", src: "/panel-profiles/versa-span.png", sourceUrl: "https://taylormetal.com/wp-content/uploads/2019/05/Versa-Span-accent-ribs.png" },
  contour: { name: "Contour", src: "/panel-profiles/contour.jpg", sourceUrl: "https://taylormetal.com/wp-content/uploads/2024/09/C-8-Clip-24ga-Panel-scaled-1-1200x928.jpg" },
};

export const materialFinishLabels: Record<MaterialFinishId, string> = {
  armortech: "Armortech™",
  kynar500: "Kynar 500®",
  "kynar500-aluminum": "Kynar 500® Painted Aluminum",
};

export const armortechColors = [
  "Glacier White", "Stone White", "Light Stone", "Hickory", "Sterling Grey",
  "Charcoal Grey", "Tile Red", "Tahoe Blue", "Pacific Blue", "Forest Green",
  "Pine Green", "Cocoa Brown", "Kodiak Brown", "Weathered Copper",
  "Obsidian Black", "Copper Penny", "Satin Black", "Zincalume", "Galvanized",
];

export const kynar500Colors = [
  "Glacier White", "Sierra Tan", "Parchment", "Sterling Grey", "Zinc Grey",
  "Charcoal Grey", "Medium Bronze", "Tahoe Blue", "Pacific Blue", "Hemlock Green",
  "Forest Green", "Pine Green", "Dark Bronze", "Graphite Black", "Matte Black",
  "Musket", "Terra Cotta", "Tile Red", "Vintage", "Zincalume Plus", "Galvanized",
  "Colonial Red", "Retro Red", "Metallic Silver", "Copper Penny", "Weathered Zinc",
];

const aluminumColors = kynar500Colors.filter(color => ![
  "Sierra Tan", "Hemlock Green", "Pine Green", "Terra Cotta", "Tile Red",
  "Copper Penny", "Vintage", "Galvanized", "Zincalume Plus",
].includes(color));

const ARMORTECH_26 = (): MaterialAvailability => ({
  id: "armortech",
  gauges: ["26 ga"],
});

type Kynar500SteelGauge = "24 ga" | "22 ga";

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

/*
 * Panel availability is maintained here. Each profile explicitly opts into its
 * material systems. KYNAR_500_STEEL accepts a per-profile gauge list, such as
 * KYNAR_500_STEEL("20 in", ["24 ga"]), and colorsByGauge can narrow colors for
 * an individual gauge when Taylor Metal supplies revised manufacturing rules.
 */
export const panelProfiles: PanelProfile[] = [
  { id: "streamline", name: "StreamLine", coverages: ["12 in", "16 in"], materials: [ARMORTECH_26()], group: "S1" },
  { id: "slim-lock", name: "Slim-Lock", coverages: ["16 in nominal"], materials: [ARMORTECH_26(), KYNAR_500_STEEL("20 in"), KYNAR_500_ALUMINUM("20 in")], note: "Accent ribs, striations or flat pan" },
  { id: "ms-150", name: "MS-150", coverages: ["12 in"], materials: [ARMORTECH_26(), KYNAR_500_STEEL("16 in")], note: "Accent ribs, striations or flat pan" },
  { id: "ms-150", name: "MS-150", coverages: ["16 in"], materials: [ARMORTECH_26(), KYNAR_500_STEEL("20 in"), KYNAR_500_ALUMINUM("20 in")], note: "Accent ribs, striations or flat pan" },
  { id: "ms-150", name: "MS-150", coverages: ["20 in"], materials: [ARMORTECH_26(), KYNAR_500_STEEL("24 in"), KYNAR_500_ALUMINUM("24 in")], note: "Accent ribs, striations or flat pan" },
  { id: "board-and-batten", name: "Board and Batten", coverages: ["12 in"], materials: [ARMORTECH_26(), KYNAR_500_STEEL("16 in")], group: "S1" },
  { id: "board-and-batten", name: "Board and Batten", coverages: ["16 in"], materials: [ARMORTECH_26(), KYNAR_500_STEEL("20 in"), KYNAR_500_ALUMINUM("20 in")], group: "S1" },
  { id: "tuff-rib", name: "Tuff Rib", coverages: ["36 in"], materials: [ARMORTECH_26()], group: "S2" },
  { id: "t-3", name: "T-3", coverages: ["36 in"], materials: [ARMORTECH_26()], note: "Standard or wall profile", group: "S2" },
  { id: "pbr", name: "PBR", coverages: ["36 in"], materials: [ARMORTECH_26(), KYNAR_500_STEEL("43 in"), KYNAR_500_ALUMINUM("43 in")], group: "S4" },
  { id: "marion-r-panel", name: "Marion R Panel", coverages: ["36 in"], materials: [ARMORTECH_26(), KYNAR_500_STEEL("43 in"), KYNAR_500_ALUMINUM("43 in")], group: "S4" },
  { id: "hr-34", name: "HR-34", coverages: ["34 in"], materials: [ARMORTECH_26(), KYNAR_500_STEEL("43 in"), KYNAR_500_ALUMINUM("43 in")], group: "S4" },
  { id: "gr-7", name: "GR-7", coverages: ["36 in"], materials: [ARMORTECH_26()], group: "S2" },
  { id: "max-corr", name: "Max Corr", coverages: ["34-5/8 in", "37-1/4 in"], materials: [ARMORTECH_26(), KYNAR_500_STEEL("43 in"), KYNAR_500_ALUMINUM("43 in")], group: "S4" },
  { id: "classic-7-8-corrugated", name: "Classic 7/8 Corrugated", coverages: ["32 in"], materials: [ARMORTECH_26(), KYNAR_500_STEEL("43 in"), KYNAR_500_ALUMINUM("43 in")], group: "S5" },
  { id: "two-and-a-half-corrugated", name: "2-1/2 Corrugated", coverages: ["24 in"], materials: [ARMORTECH_26()], note: "Wall use", group: "S6" },
  { id: "easy-lock", name: "Easy-Lock", coverages: ["12 in"], materials: [KYNAR_500_STEEL("16 in")] },
  { id: "easy-lock", name: "Easy-Lock", coverages: ["16 in"], materials: [KYNAR_500_STEEL("20 in"), KYNAR_500_ALUMINUM("20 in")] },
  { id: "easy-lock", name: "Easy-Lock", coverages: ["18 in"], materials: [KYNAR_500_STEEL("24 in"), KYNAR_500_ALUMINUM("24 in")], note: "Inquiry / availability review" },
  { id: "ms-100", name: "MS-100", coverages: ["13 in"], materials: [KYNAR_500_STEEL("16 in")] },
  { id: "ms-100", name: "MS-100", coverages: ["17 in"], materials: [KYNAR_500_STEEL("20 in"), KYNAR_500_ALUMINUM("20 in")] },
  { id: "ms-200", name: "MS-200", coverages: ["14 in"], materials: [KYNAR_500_STEEL("20 in"), KYNAR_500_ALUMINUM("20 in")] },
  { id: "ms-200", name: "MS-200", coverages: ["16 in", "18 in"], materials: [KYNAR_500_STEEL("24 in"), KYNAR_500_ALUMINUM("24 in")] },
  { id: "versa-span", name: "Versa-Span", coverages: ["12 in", "14 in"], materials: [KYNAR_500_STEEL("20 in"), KYNAR_500_ALUMINUM("20 in")] },
  { id: "versa-span", name: "Versa-Span", coverages: ["16 in", "18 in"], materials: [KYNAR_500_STEEL("24 in"), KYNAR_500_ALUMINUM("24 in")] },
  { id: "smoothwall-soffit-shadowline", name: "SmoothWall / Soffit / ShadowLine", coverages: ["1 in depth"], materials: [KYNAR_500_STEEL("16 in")] },
  { id: "smoothwall-soffit-shadowline", name: "SmoothWall / Soffit / ShadowLine", coverages: ["1-1/2 in depth"], materials: [KYNAR_500_STEEL("20 in"), KYNAR_500_ALUMINUM("20 in")] },
  { id: "contour", name: "Contour", coverages: ["16 in"], materials: [KYNAR_500_STEEL("24 in"), KYNAR_500_ALUMINUM("24 in")], note: "12 in Contour excluded" },
  { id: "flat-sheet", name: "Flat Sheet", coverages: ["48 x 120 in"], materials: [KYNAR_500_STEEL("48 in"), KYNAR_500_ALUMINUM("48 in")] },
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
  if (id === "armortech") {
    return profile.group === "S6" ? ["Zincalume", "Galvanized"] : armortechColors;
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
  if (normalized.includes("kynar")) return "kynar500";
  return "armortech";
}

export function normalizeProductTerminology(value: unknown) {
  return String(value ?? "")
    .replace(/Armortech(?!™)/gi, "Armortech™")
    .replace(/Kynar 500 PVDF/gi, "Kynar 500®")
    .replace(/Kynar 500(?!®)/gi, "Kynar 500®")
    .replace(/Kynar(?! 500®)/gi, "Kynar 500®");
}
