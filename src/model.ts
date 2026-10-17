export type UnitId = "mm" | "cm" | "inch" | "ft";
export type ColourName =
  | "Grey"
  | "Brush Gold"
  | "Gold"
  | "Matt Black"
  | "Champion Gold"
  | "Rose Gold Glossy";
export type Origin = "Imported" | "Indian";
export type Infill = "glass" | "sheet";
export type Finish = "profile" | "glass";
export type ItemKind = "fixed" | "door" | "wall" | "return";
export type DoorStyle = "sliding" | "openable";
export type Side = "left" | "right";
export type WallRelation = "ontop" | "beside";
export type WallCut = "notch" | "overlap";
export type WallFace = "inside" | "outside";
export type ChannelEdge = "top" | "bottom" | "left" | "right";
export type TopSpan = "full" | "fixed" | "door" | "custom";
export type SurfaceWork = "none" | "frosting" | "other";
export type GlassTough = "tough" | "nontough";
export type ExtraWorkKind = "none" | "frosting" | "nr" | "nano";
export type CeilingAlong = "width" | "depth";
export type CeilingFinishKind = "wood" | "plain";
export type PartKey = "fixed" | "door" | "return" | "topFixed" | "ceiling";
export type FileNameMode = "customer" | "quote";
export type HandleKind = "none" | "lpipe" | "pull";
export type PullAxis = "vertical" | "horizontal";
export type LegPoint = "left" | "right";
export type SlideSeat = "inside" | "outside";
export type ProductKind = "shower" | "cubicle";
export type LegMaterial = "SS305" | "Nylon" | "Iron" | "Aluminium" | "custom";
export type RailMaterial = "Aluminium" | "SS";
/** Inside swings into the bathroom. Outside swings out of the room. */
export type DoorSwing = "inside" | "outside";
export type LockStyle = "none" | "lever";

export const PULL_LENGTHS = [280, 300, 450, 600, 900] as const;
export const NOTE_LIMIT = 1000;
export const GST_RATE = 0.18;
export const SQM_PER_SQFT = 0.09290304;
/** Standard glass sheet widths, in feet. */
export const SHEET_WIDTHS_FT = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8] as const;
export const CEILING_MODULES = [1, 1.5, 2, 2.5, 3] as const;

export const WOOD_FINISHES: { id: string; name: string; hex: string }[] = [
  { id: "oak", name: "Oak", hex: "#c4a574" },
  { id: "walnut", name: "Walnut", hex: "#6b4423" },
  { id: "teak", name: "Teak", hex: "#b5793a" },
  { id: "cherry", name: "Cherry", hex: "#8e3b2f" },
];

export const PLAIN_FINISHES: { id: string; name: string; hex: string }[] = [
  { id: "white", name: "White", hex: "#f7f7f5" },
  { id: "grey", name: "Grey", hex: "#9aa0a6" },
  { id: "black", name: "Black", hex: "#1a1a1a" },
  { id: "beige", name: "Beige", hex: "#e4d5c3" },
  { id: "blue", name: "Blue", hex: "#3d6f8f" },
];

export const EXTRA_LABEL: Record<ExtraWorkKind, string> = {
  none: "None",
  frosting: "Frosting",
  nr: "NR",
  nano: "Nano-Coated Shower Glass",
};

export const PULL_FINISHES: { name: string; hex: string }[] = [
  { name: "Brushed Gold", hex: "#b08d57" },
  { name: "Black", hex: "#161616" },
  { name: "Rose Gold", hex: "#b76e79" },
  { name: "White powder coating", hex: "#f7f7f5" },
  { name: "Brushed nickel", hex: "#c5c8cb" },
  { name: "Grey powder coating", hex: "#8b9096" },
  { name: "Matte black", hex: "#2c2c2c" },
];

export const COLOURS: ColourName[] = [
  "Grey",
  "Brush Gold",
  "Gold",
  "Matt Black",
  "Champion Gold",
  "Rose Gold Glossy",
];

export const COLOUR_HEX: Record<ColourName, string> = {
  Grey: "#7d868c",
  "Brush Gold": "#b08d57",
  Gold: "#c5a035",
  "Matt Black": "#2c2c2c",
  "Champion Gold": "#8d6a2f",
  "Rose Gold Glossy": "#b76e79",
};

export const CHANNEL_TYPES = ["U-channel", "Bottom seal", "Side gasket", "Head channel"] as const;
export const CHANNEL_EDGES: ChannelEdge[] = ["top", "bottom", "left", "right"];

export const UNIT_TO_MM: Record<UnitId, number> = {
  mm: 1,
  cm: 10,
  inch: 25.4,
  ft: 304.8,
};
/** Main glass stops here when the shower is taller than 10 ft. 9 ft 10 in. */
export const GLASS_CUT_MM = 9 * UNIT_TO_MM.ft + 10 * UNIT_TO_MM.inch;
export const TEN_FT_MM = 10 * UNIT_TO_MM.ft;

export const SQFT_PER_MM2 = 304.8 * 304.8;
export const DOOR_SHORT_MM = 20;
/** Sliding overlap is the profile face, never a fixed 25 mm guess. */
export const OVERLAP_MM = 16;

export const PART_LABELS: { key: PartKey; label: string }[] = [
  { key: "fixed", label: "Fixed glass rate" },
  { key: "door", label: "Door rate" },
  { key: "return", label: "Return / T rate" },
  { key: "topFixed", label: "Top fixed rate" },
  { key: "ceiling", label: "Ceiling rate" },
];

export interface ChannelSet {
  type: string;
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

export interface PlacedItem {
  id: string;
  kind: ItemKind;
  x: number;
  width: number;
  height: number;
  doorStyle: DoorStyle;
  handleSide: Side;
  swing: DoorSwing;
  outerFrame: boolean;
  topCover: number;
  trackSize: number;
  wallRelation: WallRelation;
  wallCut: WallCut;
  wallSide: WallFace;
  wallHost: string;
  cutFee: boolean;
  cutFeeAmount: number;
  depth: number;
  channels: ChannelSet;
  slideSeat: SlideSeat;
  handleKind: HandleKind;
  handleName: string;
  handleRate: number;
  handlePhoto: string;
  pipeVertDia: number;
  pipeVertLen: number;
  pipeHorizLen: number;
  pipeTubeDia: number;
  pipeReturn: number;
  legPoint: LegPoint;
  pullFinish: string;
  pullLength: number;
  pullCustom: boolean;
  pullAxis: PullAxis;
  handleHeight: number;
  /** Millimetres from the default handle position. Positive x moves right, positive y moves down. */
  handleDx: number;
  handleDy: number;
  handleLabelDx: number;
  handleLabelDy: number;
  doorFillName: string;
  doorFillColour: string;
  doorFillImage: string;
  lockStyle: LockStyle;
  lockName: string;
  lockRate: number;
  hingeCount: number;
  hingeName: string;
  wheelName: string;
  softClose: boolean;
}

export interface InfillSpec {
  thickness: string;
  colour: string;
  brand: string;
  surface: SurfaceWork;
  surfaceNote: string;
  tough: GlassTough;
}

export type PriceFrom = "rate" | "amount";

export interface ExtraWorkSpec {
  kind: ExtraWorkKind;
  areaSqFt: number;
  amount: number;
  rate: number;
  priceFrom: PriceFrom;
}

export interface CeilingLight {
  id: string;
  x: number;
  y: number;
  size: number;
}

export interface SheetSpec extends InfillSpec {
  metal: string;
  ratePerSqFt: number;
}

export interface PartRates {
  fixed: number;
  door: number;
  return: number;
  topFixed: number;
  ceiling: number;
}

export interface WastageSpec {
  enabled: boolean;
  extraSqFt: number;
  ownRate: boolean;
  rate: number;
  amount: number;
  priceFrom: PriceFrom;
}

export interface CeilingRect {
  x: number;
  y: number;
  w: number;
  d: number;
  /** Millimetres. Positive draws the ceiling slightly higher on the plan. */
  lift: number;
}

export interface CeilingTrap {
  enabled: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Ceiling {
  enabled: boolean;
  /** Room covers the bathroom. Rect covers one offset rectangle. */
  scope: "room" | "rect";
  rect: CeilingRect;
  trap: CeilingTrap;
  /** Uploaded finish. A named colour is used when this is empty. */
  image: string;
  channels: ChannelSet;
  materialName: string;
  colour: string;
  cols: number;
  rows: number;
  moduleFt: number;
  customModule: boolean;
  customModuleMm: number;
  along: CeilingAlong;
  finishKind: CeilingFinishKind;
  finishId: string;
  lights: CeilingLight[];
  ratePerSqFt: number;
  amount: number;
  priceFrom: PriceFrom;
  /** Millimetres up (positive) or down (negative) from the drawing line. */
  level: number;
}

export interface UserDim {
  id: string;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  /** Signed millimetres along the left normal of A to B. */
  offset: number;
  nudgeX: number;
  nudgeY: number;
}

export interface TopFixed {
  enabled: boolean;
  height: number;
  span: TopSpan;
  alignId: string;
  x: number;
  width: number;
  channels: ChannelSet;
  /** Set when the 10 ft rule created this lite. Cleared if the shower drops to 10 ft or under. */
  auto: boolean;
}

export type PlanFacing = "up" | "down" | "left" | "right";
export type PartitionFace = "glass" | "wall";

export interface PlanFixture {
  enabled: boolean;
  x: number;
  y: number;
  facing: PlanFacing;
  height: number;
}

export const WC_ID = "fixture-wc";
export const SHOWER_ID = "fixture-shower";

export interface SideRun {
  id: string;
  name: string;
  /** Distance from the left end of the front, in mm. Not snapped to a panel. */
  attachX: number;
  /** How far the partition comes out, in mm. Independent of the bathroom depth. */
  length: number;
  /** Glass side grows off the front glass. Wall side grows off the back wall. */
  face: PartitionFace;
  door: boolean;
  doorStyle: DoorStyle;
  doorWidth: number;
  doorX: number;
  /** Handle side on a door in this return. Hinges sit on the other side. */
  doorHandle: Side;
  /** Inside swings into the bathroom. Outside swings away from that side. */
  doorSwing: DoorSwing;
  ceiling: Ceiling;
  items: PlacedItem[];
}

export interface Material {
  profileName: string;
  profileFace: number;
  profileDepth: number;
  colour: ColourName;
  origin: Origin;
  infill: Infill;
  finish: Finish;
  hardware: string;
  hardwareColour: ColourName;
  hardwareMatchProfile: boolean;
  hardwareColourName: string;
  ratePerSqFt: number;
  glass: InfillSpec;
  sheet: SheetSpec;
}

export interface CubicleSpec {
  /** Clear space under the panels, in mm. */
  gap: number;
  /** Door stops this far below the top of the fixed panels, in mm. */
  doorClearance: number;
  legQty: number;
  legHeight: number;
  legMaterial: LegMaterial;
  legName: string;
  legRate: number;
  legAmount: number;
  legPriceFrom: PriceFrom;
  railMaterial: RailMaterial;
  railRate: number;
  railAmount: number;
  railPriceFrom: PriceFrom;
}

export const CUBICLE_RAIL_MM = 18;

export interface Shower {
  product: ProductKind;
  cubicle: CubicleSpec;
  width: number;
  height: number;
  depth: number;
  useDepth: boolean;
  items: PlacedItem[];
  sides: SideRun[];
  ceiling: Ceiling;
  dims: UserDim[];
  labelNudge: Record<string, { x: number; y: number }>;
  /** Extra shift, in drawing units, so plan and elevation can be dragged. */
  viewShift: Record<string, { x: number; y: number }>;
  glassPriceFrom: PriceFrom;
  topFixed: TopFixed;
  wc: PlanFixture;
  showerPoint: PlanFixture;
  location: string;
  notes: string;
  extraWork: ExtraWorkSpec;
  material: Material;
  rates: PartRates;
  wastage: Record<string, WastageSpec>;
  packageAmount: number;
}

export interface QuoteEntry {
  serial: number;
  shower: Shower;
}

export interface SavedSetup {
  id: string;
  name: string;
  material: Material;
  channels: ChannelSet;
}

export interface Geom {
  x: number;
  y: number;
  w: number;
  h: number;
  leafX: number;
  leafY: number;
  leafW: number;
  leafH: number;
  overlap: number;
}

export interface CompanyProfile {
  logo: string;
  name: string;
  address: string;
  gst: string;
  email: string;
  website: string;
  bank: string;
  description: string;
  terms: string;
  markTm: boolean;
  markReg: boolean;
}

export interface CustomerDetails {
  name: string;
  address: string;
  contact: string;
  gst: string;
}

export interface TopBox {
  x: number;
  width: number;
  height: number;
}

const SETUP_KEY = "shower-material-setups";
const COMPANY_KEY = "shower-company-profile";
const CUSTOMER_KEY = "shower-customer";
const QUOTE_NO_KEY = "shower-quote-no";

export const DEFAULT_TERMS = [
  "This quote is valid for 15 days from the date above.",
  "Sizes follow the drawing. Confirm site sizes before production.",
  "Glass or sheet wastage, when added, is included in the area charged per sq ft.",
  "Profile colour, hardware colour, and glass or sheet specification are as stated on each shower.",
  "Each shower amount is the area, including wastage, times the rate per sq ft. Handles, locks, and extra work are extra lines.",
].join("\n");

let seq = 1;

export function uid(prefix = "i"): string {
  seq += 1;
  return `${prefix}${seq.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function emptyChannels(): ChannelSet {
  return { type: "U-channel", top: false, bottom: false, left: false, right: false };
}

export function emptyInfill(): InfillSpec {
  return { thickness: "", colour: "", brand: "", surface: "none", surfaceNote: "", tough: "tough" };
}

export function emptyExtra(): ExtraWorkSpec {
  return { kind: "none", areaSqFt: 0, amount: 0, rate: 0, priceFrom: "rate" };
}

export function emptySheet(): SheetSpec {
  return { ...emptyInfill(), metal: "", ratePerSqFt: 0 };
}

export function emptyWastage(rate = 0): WastageSpec {
  return { enabled: false, extraSqFt: 0, ownRate: false, rate, amount: 0, priceFrom: "rate" };
}

/** Half-up to 2 decimal places. Rates and amounts are stored and shown at this precision. */
export function money(value: number): number {
  const n = Number.isFinite(value) ? value : 0;
  const sign = n < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(n) * 100 + 1e-8)) / 100;
}

/** Last-edited field wins. The other side is derived and rounded, so the two fields do not chase each other. */
export function pricePair(rate: number, amount: number, basis: number, from: PriceFrom): { rate: number; amount: number } {
  if (from === "amount") {
    const locked = money(amount);
    return { rate: basis > 0 ? money(locked / basis) : money(rate), amount: locked };
  }
  const next = money(rate);
  return { rate: next, amount: money(next * (basis > 0 ? basis : 0)) };
}

export function defaultRates(rate = 450): PartRates {
  return { fixed: rate, door: rate, return: rate, topFixed: rate, ceiling: rate };
}

export function defaultMaterial(): Material {
  return {
    profileName: "16 × 45",
    profileFace: 16,
    profileDepth: 45,
    colour: "Grey",
    origin: "Indian",
    infill: "glass",
    finish: "profile",
    hardware: "",
    hardwareColour: "Grey",
    hardwareMatchProfile: true,
    hardwareColourName: "",
    ratePerSqFt: 450,
    glass: emptyInfill(),
    sheet: { ...emptySheet(), ratePerSqFt: 450 },
  };
}

export const BRAND_LOGO = "/allukraft-logo.png";

export function blankCompany(): CompanyProfile {
  return {
    logo: "",
    name: "",
    address: "",
    gst: "",
    email: "",
    website: "",
    bank: "",
    description: "",
    terms: DEFAULT_TERMS,
    markTm: false,
    markReg: false,
  };
}

export function blankCustomer(): CustomerDetails {
  return { name: "", address: "", contact: "", gst: "" };
}

export function blankShower(): Shower {
  return normalizeShower({
    width: 2000,
    height: 2100,
    depth: 900,
    useDepth: false,
    items: [],
    location: "",
    notes: "",
    material: defaultMaterial(),
  });
}

function num(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeItem(item: Partial<PlacedItem> | PlacedItem): PlacedItem {
  return {
    id: item.id || uid("i"),
    kind: item.kind ?? "fixed",
    x: num(item.x, 0),
    width: Math.max(item.kind === "return" ? 4 : 10, num(item.width, 10)),
    height: Math.max(10, num(item.height, 10)),
    doorStyle: item.doorStyle ?? "sliding",
    handleSide: item.handleSide ?? "right",
    swing: item.swing === "outside" ? "outside" : "inside",
    outerFrame: Boolean(item.outerFrame),
    topCover: Math.max(0, num(item.topCover, 40)),
    trackSize: Math.max(0, num(item.trackSize, 25)),
    wallRelation: item.wallRelation ?? "beside",
    wallCut: item.wallCut === "overlap" ? "overlap" : "notch",
    wallSide: item.wallSide === "inside" ? "inside" : "outside",
    wallHost: item.wallHost ?? "",
    cutFee: Boolean(item.cutFee),
    cutFeeAmount: Math.max(0, num(item.cutFeeAmount, 0)),
    depth: Math.max(0, num(item.depth, 0)),
    channels: { ...emptyChannels(), ...item.channels },
    slideSeat: item.slideSeat === "inside" ? "inside" : "outside",
    handleKind: item.handleKind === "lpipe" || item.handleKind === "pull" ? item.handleKind : "none",
    handleName: item.handleName ?? "",
    handleRate: Math.max(0, num(item.handleRate, 0)),
    handlePhoto: item.handlePhoto ?? "",
    pipeVertDia: Math.max(8, num(item.pipeVertDia, 30)),
    pipeVertLen: Math.max(20, num(item.pipeVertLen, 250)),
    pipeHorizLen: Math.max(20, num(item.pipeHorizLen, 405)),
    pipeTubeDia: Math.max(8, num(item.pipeTubeDia, 25)),
    pipeReturn: Math.max(10, num(item.pipeReturn, 184)),
    legPoint: item.legPoint === "left" ? "left" : "right",
    pullFinish: item.pullFinish || "Matte black",
    pullLength: Math.max(20, num(item.pullLength, 450)),
    pullCustom: Boolean(item.pullCustom),
    pullAxis: item.pullAxis === "horizontal" ? "horizontal" : "vertical",
    handleHeight: Math.max(0, num(item.handleHeight, 1000)),
    handleDx: num(item.handleDx, 0),
    handleDy: num(item.handleDy, 0),
    handleLabelDx: num(item.handleLabelDx, 0),
    handleLabelDy: num(item.handleLabelDy, 0),
    doorFillName: (item.doorFillName ?? "").slice(0, 80),
    doorFillColour: (item.doorFillColour ?? "").slice(0, 40),
    doorFillImage: item.doorFillImage ?? "",
    lockStyle: item.lockStyle === "lever" ? "lever" : "none",
    lockName: item.lockName ?? "",
    lockRate: Math.max(0, num(item.lockRate, 0)),
    hingeCount: Math.max(2, Math.round(num(item.hingeCount, num(item.height, 2100) > 1700 ? 3 : 2))),
    hingeName: item.hingeName?.trim() ? item.hingeName : "Hinge",
    wheelName: item.wheelName ?? "",
    softClose: Boolean(item.softClose),
  };
}

function normalizeMaterial(input?: Partial<Material> | null): Material {
  const base = defaultMaterial();
  const raw = input ?? {};
  const colour = COLOURS.includes(raw.colour as ColourName) ? (raw.colour as ColourName) : base.colour;
  const hardwareColour = COLOURS.includes(raw.hardwareColour as ColourName)
    ? (raw.hardwareColour as ColourName)
    : colour;
  return {
    ...base,
    ...raw,
    colour,
    hardwareColour,
    profileFace: Math.max(1, num(raw.profileFace, base.profileFace)),
    profileDepth: Math.max(1, num(raw.profileDepth, base.profileDepth)),
    ratePerSqFt: money(Math.max(0, num(raw.ratePerSqFt, base.ratePerSqFt))),
    hardwareMatchProfile: raw.hardwareMatchProfile ?? true,
    hardwareColourName: raw.hardwareColourName ?? "",
    glass: {
      ...emptyInfill(),
      ...raw.glass,
      surface: raw.glass?.surface ?? "none",
      tough: raw.glass?.tough === "nontough" ? "nontough" : "tough",
    },
    sheet: {
      ...emptySheet(),
      ...raw.sheet,
      surface: raw.sheet?.surface ?? "none",
      ratePerSqFt: money(Math.max(0, num(raw.sheet?.ratePerSqFt, raw.ratePerSqFt ?? base.ratePerSqFt))),
    },
  };
}

function applyAutoTop(height: number, top: TopFixed): TopFixed {
  if (height > TEN_FT_MM + 0.2) {
    return {
      ...top,
      enabled: true,
      auto: true,
      span: "full",
      height: Math.max(1, height - GLASS_CUT_MM),
    };
  }
  if (top.auto) return { ...top, enabled: false, auto: false };
  return top;
}

/** Keep keys this version does not know, while known fields stay the normalized values. */
function keepExtra<T>(raw: unknown, normalized: T): T {
  if (Array.isArray(normalized)) {
    const source = Array.isArray(raw) ? raw : [];
    return normalized.map((item, index) => keepExtra(source[index], item)) as T;
  }
  if (normalized && typeof normalized === "object") {
    const source = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const base = normalized as Record<string, unknown>;
    const merged: Record<string, unknown> = {};
    for (const key of Object.keys(source)) {
      if (!(key in base)) merged[key] = source[key];
    }
    for (const key of Object.keys(base)) merged[key] = keepExtra(source[key], base[key]);
    return merged as T;
  }
  return normalized;
}

export function normalizeShower(input?: Partial<Shower> | null): Shower {
  const raw = input ?? {};
  const material = normalizeMaterial(raw.material);
  const rate = material.ratePerSqFt;
  const top = raw.topFixed;
  const ceiling = raw.ceiling;
  const span = top?.span ?? "full";
  return keepExtra(raw, {
    product: raw.product === "cubicle" ? "cubicle" : "shower",
    cubicle: normalizeCubicle(raw.cubicle),
    width: Math.max(10, num(raw.width, 2000)),
    height: Math.max(10, num(raw.height, 2100)),
    depth: Math.max(0, num(raw.depth, 900)),
    useDepth: Boolean(raw.useDepth),
    items: (raw.items ?? []).map((item) => normalizeItem(item)),
    sides: (raw.sides ?? []).map((side, index) => ({
      id: side.id || uid("side"),
      name: side.name?.trim() || `Return ${index + 1}`,
      attachX: num(side.attachX, 0),
      length: clampPartitionDepth(
        { depth: Math.max(0, num(raw.depth, 900)), material } as Shower,
        Math.max(10, num(side.length, 300)),
      ),
      face: side.face === "wall" ? "wall" : "glass",
      door: Boolean(side.door),
      doorStyle: side.doorStyle === "openable" ? "openable" : "sliding",
      doorWidth: Math.max(40, num(side.doorWidth, 700)),
      doorX: Math.max(0, num(side.doorX, 0)),
      doorHandle: side.doorHandle === "left" ? "left" : "right",
      doorSwing: side.doorSwing === "outside" ? "outside" : "inside",
      ceiling: normalizeCeiling(side.ceiling),
      items: (side.items ?? []).map((item) => normalizeItem(item)),
    })),
    ceiling: normalizeCeiling(ceiling),
    dims: (raw.dims ?? []).slice(0, 40).map((dim) => ({
      id: dim.id || uid("dim"),
      ax: num(dim.ax, 0),
      ay: num(dim.ay, 0),
      bx: num(dim.bx, 0),
      by: num(dim.by, 0),
      offset: num(dim.offset, 80),
      nudgeX: num(dim.nudgeX, 0),
      nudgeY: num(dim.nudgeY, 0),
    })),
    labelNudge: normalizeNudges(raw.labelNudge),
    viewShift: normalizeNudges(raw.viewShift),
    glassPriceFrom: raw.glassPriceFrom === "amount" ? "amount" : "rate",
    wc: clampFixtureIn(normalizeFixture(raw.wc, "wc"), Math.max(10, num(raw.width, 2000)), Math.max(0, num(raw.depth, 900))),
    showerPoint: clampFixtureIn(normalizeFixture(raw.showerPoint, "shower"), Math.max(10, num(raw.width, 2000)), Math.max(0, num(raw.depth, 900))),
    topFixed: applyAutoTop(Math.max(10, num(raw.height, 2100)), {
      enabled: Boolean(top?.enabled),
      height: Math.max(0, num(top?.height, 300)),
      span: span === "fixed" || span === "door" || span === "custom" ? span : "full",
      alignId: top?.alignId ?? "",
      x: num(top?.x, 0),
      width: Math.max(0, num(top?.width, 0)),
      channels: { ...emptyChannels(), ...top?.channels },
      auto: Boolean(top?.auto),
    }),
    location: (raw.location ?? "").slice(0, 80),
    notes: (raw.notes ?? "").slice(0, NOTE_LIMIT),
    extraWork: normalizeExtra(raw.extraWork),
    material,
    rates: {
      fixed: money(Math.max(0, num(raw.rates?.fixed, rate))),
      door: money(Math.max(0, num(raw.rates?.door, rate))),
      return: money(Math.max(0, num(raw.rates?.return, rate))),
      topFixed: money(Math.max(0, num(raw.rates?.topFixed, rate))),
      ceiling: money(Math.max(0, num(raw.rates?.ceiling, rate))),
    },
    wastage: normalizeWastage(raw.wastage),
    packageAmount: money(Math.max(0, num(raw.packageAmount, 0))),
  });
}

export const BACKUP_APP = "allukraft-bath-studio";

export interface QuoteBackup {
  app: typeof BACKUP_APP;
  version: 1;
  unit: UnitId;
  quoteNo: string;
  fileMode: FileNameMode;
  activeRun: string;
  nextSerial: number;
  editingSerial: number | null;
  company: CompanyProfile;
  customer: CustomerDetails;
  draft: Shower;
  quote: QuoteEntry[];
}

export function backupFileName(customer: string, quoteNo: string): string {
  const raw = customer.trim() || quoteNo.trim() || "quote";
  const safe = raw.replace(/[^\w\-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "quote";
  return `${safe}.allukraft.json`;
}

function restoreCompany(raw: unknown): CompanyProfile {
  const parsed = (raw && typeof raw === "object" ? raw : {}) as Partial<CompanyProfile>;
  return keepExtra(parsed, {
    logo: typeof parsed.logo === "string" ? parsed.logo : "",
    name: String(parsed.name ?? ""),
    address: String(parsed.address ?? ""),
    gst: String(parsed.gst ?? "").toUpperCase(),
    email: String(parsed.email ?? ""),
    website: String(parsed.website ?? ""),
    bank: String(parsed.bank ?? ""),
    description: String(parsed.description ?? ""),
    terms: typeof parsed.terms === "string" && parsed.terms.trim() ? parsed.terms : DEFAULT_TERMS,
    markTm: Boolean(parsed.markTm),
    markReg: Boolean(parsed.markReg),
  });
}

function restoreCustomer(raw: unknown): CustomerDetails {
  const parsed = (raw && typeof raw === "object" ? raw : {}) as Partial<CustomerDetails>;
  return keepExtra(parsed, {
    name: String(parsed.name ?? ""),
    address: String(parsed.address ?? ""),
    contact: String(parsed.contact ?? ""),
    gst: String(parsed.gst ?? "").toUpperCase(),
  });
}

/** Null when the file is not a backup written by this app. */
export function parseBackup(raw: unknown): QuoteBackup | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (row.app !== BACKUP_APP) return null;
  if (!row.draft || typeof row.draft !== "object") return null;
  if (!row.company || typeof row.company !== "object" || !row.customer || typeof row.customer !== "object") return null;
  if (!Array.isArray(row.quote)) return null;
  const unit = row.unit === "cm" || row.unit === "inch" || row.unit === "ft" || row.unit === "mm" ? row.unit : null;
  if (!unit) return null;
  const quote = row.quote
    .filter((entry): entry is { serial: number; shower: Shower } => {
      if (!entry || typeof entry !== "object") return false;
      const item = entry as { serial?: unknown; shower?: unknown };
      return typeof item.serial === "number" && !!item.shower && typeof item.shower === "object";
    })
    .map((entry) => keepExtra(entry, { serial: entry.serial, shower: normalizeShower(entry.shower) }));
  const serials = quote.map((entry) => entry.serial);
  const editing = typeof row.editingSerial === "number" && serials.includes(row.editingSerial) ? row.editingSerial : null;
  return {
    app: BACKUP_APP,
    version: 1,
    unit,
    quoteNo: typeof row.quoteNo === "string" && row.quoteNo.trim() ? row.quoteNo : "Q-001",
    fileMode: row.fileMode === "quote" ? "quote" : "customer",
    activeRun: typeof row.activeRun === "string" && row.activeRun ? row.activeRun : "front",
    nextSerial: Math.max(1, num(row.nextSerial, 1), ...serials.map((serial) => serial + 1)),
    editingSerial: editing,
    company: restoreCompany(row.company),
    customer: restoreCustomer(row.customer),
    draft: normalizeShower(row.draft as Partial<Shower>),
    quote,
  };
}

export function emptyCubicle(): CubicleSpec {
  return {
    gap: 150,
    doorClearance: 30,
    legQty: 2,
    legHeight: 150,
    legMaterial: "SS305",
    legName: "",
    legRate: 0,
    legAmount: 0,
    legPriceFrom: "rate",
    railMaterial: "Aluminium",
    railRate: 0,
    railAmount: 0,
    railPriceFrom: "rate",
  };
}

function normalizeCubicle(raw?: Partial<CubicleSpec> | null): CubicleSpec {
  const base = emptyCubicle();
  const material = raw?.legMaterial;
  const legMaterial: LegMaterial =
    material === "Nylon" || material === "Iron" || material === "Aluminium" || material === "custom" || material === "SS305" ? material : "SS305";
  return {
    gap: Math.max(0, num(raw?.gap, base.gap)),
    doorClearance: Math.max(0, num(raw?.doorClearance, base.doorClearance)),
    legQty: Math.max(0, Math.round(num(raw?.legQty, base.legQty))),
    legHeight: Math.max(0, num(raw?.legHeight, raw?.gap ?? base.legHeight)),
    legMaterial,
    legName: (raw?.legName ?? "").slice(0, 40),
    legRate: money(Math.max(0, num(raw?.legRate, 0))),
    legAmount: money(Math.max(0, num(raw?.legAmount, 0))),
    legPriceFrom: raw?.legPriceFrom === "amount" ? "amount" : "rate",
    railMaterial: raw?.railMaterial === "SS" ? "SS" : "Aluminium",
    railRate: money(Math.max(0, num(raw?.railRate, 0))),
    railAmount: money(Math.max(0, num(raw?.railAmount, 0))),
    railPriceFrom: raw?.railPriceFrom === "amount" ? "amount" : "rate",
  };
}

export function legMaterialLabel(spec: CubicleSpec): string {
  const typed = spec.legName.trim();
  if (typed) return typed;
  return spec.legMaterial === "custom" ? "Custom" : spec.legMaterial;
}

/** Leg positions along the run. Uses the uprights when there are enough of them. */
export function cubicleLegXs(shower: Shower): number[] {
  if (shower.product !== "cubicle") return [];
  const qty = Math.max(0, Math.round(shower.cubicle.legQty));
  if (qty <= 0) return [];
  const width = Math.max(shower.width, 1);
  const marks = new Set<number>([0, width]);
  for (const item of shower.items) {
    if (item.kind === "wall") continue;
    marks.add(clamp(item.x, 0, width));
    marks.add(clamp(item.x + item.width, 0, width));
  }
  const posts = [...marks].sort((a, b) => a - b);
  if (qty === 1) return [width / 2];
  if (qty <= posts.length) {
    const picked: number[] = [];
    for (let i = 0; i < qty; i += 1) picked.push(posts[Math.round((i * (posts.length - 1)) / (qty - 1))]);
    return picked;
  }
  return Array.from({ length: qty }, (_, i) => (width * i) / (qty - 1));
}

function normalizeFacing(value: unknown): PlanFacing {
  return value === "up" || value === "left" || value === "right" || value === "down" ? value : "down";
}

function normalizeFixture(raw: Partial<PlanFixture> | undefined, kind: "wc" | "shower"): PlanFixture {
  return {
    enabled: Boolean(raw?.enabled),
    x: num(raw?.x, kind === "wc" ? 280 : 900),
    y: num(raw?.y, kind === "wc" ? 280 : 360),
    facing: normalizeFacing(raw?.facing),
    height: Math.max(200, num(raw?.height, kind === "shower" ? 1900 : 400)),
  };
}

function normalizeExtra(raw: Partial<ExtraWorkSpec> | undefined): ExtraWorkSpec {
  const kind = raw?.kind === "frosting" || raw?.kind === "nr" || raw?.kind === "nano" ? raw.kind : "none";
  return {
    kind,
    areaSqFt: Math.max(0, num(raw?.areaSqFt, 0)),
    amount: money(Math.max(0, num(raw?.amount, 0))),
    rate: money(Math.max(0, num(raw?.rate, 0))),
    priceFrom: raw?.priceFrom === "amount" ? "amount" : "rate",
  };
}

export function emptyCeiling(): Ceiling {
  return normalizeCeiling(undefined);
}

function normalizeCeiling(ceiling: Partial<Ceiling> | undefined): Ceiling {
  const moduleFt = CEILING_MODULES.includes(ceiling?.moduleFt as (typeof CEILING_MODULES)[number]) ? Number(ceiling?.moduleFt) : 2;
  const finishKind = ceiling?.finishKind === "plain" ? "plain" : "wood";
  const finishes = finishKind === "plain" ? PLAIN_FINISHES : WOOD_FINISHES;
  const finishId = finishes.some((row) => row.id === ceiling?.finishId) ? (ceiling?.finishId as string) : finishes[0].id;
  return {
    enabled: Boolean(ceiling?.enabled),
    scope: ceiling?.scope === "rect" ? "rect" : "room",
    rect: {
      x: num(ceiling?.rect?.x, 0),
      y: num(ceiling?.rect?.y, 0),
      w: Math.max(10, num(ceiling?.rect?.w, 800)),
      d: Math.max(10, num(ceiling?.rect?.d, 800)),
      lift: num(ceiling?.rect?.lift, 0),
    },
    trap: {
      enabled: Boolean(ceiling?.trap?.enabled),
      x: Math.max(0, num(ceiling?.trap?.x, 80)),
      y: Math.max(0, num(ceiling?.trap?.y, 80)),
      w: Math.max(40, num(ceiling?.trap?.w, 450)),
      h: Math.max(40, num(ceiling?.trap?.h, 450)),
    },
    image: ceiling?.image ?? "",
    channels: { ...emptyChannels(), ...ceiling?.channels },
    materialName: ceiling?.materialName ?? "",
    colour: ceiling?.colour ?? "",
    cols: clamp(Math.round(num(ceiling?.cols, 2)), 1, 12),
    rows: clamp(Math.round(num(ceiling?.rows, 2)), 1, 12),
    moduleFt,
    customModule: Boolean(ceiling?.customModule),
    customModuleMm: Math.max(50, num(ceiling?.customModuleMm, 304.8)),
    along: ceiling?.along === "depth" ? "depth" : "width",
    finishKind,
    finishId,
    level: num(ceiling?.level, 0),
    ratePerSqFt: money(Math.max(0, num(ceiling?.ratePerSqFt, 0))),
    amount: money(Math.max(0, num(ceiling?.amount, 0))),
    priceFrom: ceiling?.priceFrom === "amount" ? "amount" : "rate",
    lights: (ceiling?.lights ?? []).slice(0, 24).map((light) => ({
      id: light.id || uid("light"),
      x: Math.max(0, num(light.x, 0)),
      y: Math.max(0, num(light.y, 0)),
      size: Math.max(40, num(light.size, 150)),
    })),
  };
}

function normalizeNudges(raw: unknown): Record<string, { x: number; y: number }> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, { x: number; y: number }> = {};
  for (const [key, value] of Object.entries(raw as Record<string, { x?: number; y?: number }>)) {
    if (!value || typeof value !== "object") continue;
    out[key] = { x: num(value.x, 0), y: num(value.y, 0) };
  }
  return out;
}

function normalizeWastage(raw: unknown): Record<string, WastageSpec> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, WastageSpec> = {};
  for (const [key, value] of Object.entries(raw as Record<string, Partial<WastageSpec>>)) {
    if (!value || typeof value !== "object") continue;
    out[key] = {
      enabled: Boolean(value.enabled),
      extraSqFt: Math.max(0, num(value.extraSqFt, 0)),
      ownRate: Boolean(value.ownRate),
      rate: money(Math.max(0, num(value.rate, 0))),
      amount: money(Math.max(0, num(value.amount, 0))),
      priceFrom: value.priceFrom === "amount" ? "amount" : "rate",
    };
  }
  return out;
}

export function cloneShower(shower: Shower): Shower {
  return normalizeShower(shower);
}

export function mmToUnit(mm: number, unit: UnitId): number {
  return mm / UNIT_TO_MM[unit];
}

export function unitToMm(value: number, unit: UnitId): number {
  return value * UNIT_TO_MM[unit];
}

export function formatLength(mm: number, unit: UnitId): string {
  const value = mm / UNIT_TO_MM[unit];
  if (!Number.isFinite(value)) return "0";
  if (unit === "mm") {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

export function formatMm(mm: number): string {
  const rounded = Math.round(mm * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

function overlapAmount(a0: number, a1: number, b0: number, b1: number): number {
  return Math.min(a1, b1) - Math.max(a0, b0);
}

export function topFixedBox(shower: Shower): TopBox | null {
  const top = shower.topFixed;
  if (!top?.enabled) return null;
  const height = clamp(top.height, 0, Math.max(0, shower.height - 40));
  if (height <= 0) return null;
  if (top.span === "custom") {
    const width = clamp(top.width || shower.width, 10, shower.width);
    const x = clamp(top.x || 0, 0, Math.max(0, shower.width - width));
    return { x, width, height };
  }
  if (top.span === "fixed" || top.span === "door") {
    const kind = top.span === "door" ? "door" : "fixed";
    const list = shower.items.filter((item) => item.kind === kind);
    const match = list.find((item) => item.id === top.alignId) ?? list[0];
    if (match) return { x: match.x, width: match.width, height };
  }
  return { x: 0, width: shower.width, height };
}

export function headForItem(shower: Shower, item: PlacedItem): number {
  if (item.kind === "wall") return 0;
  const box = topFixedBox(shower);
  if (!box) return 0;
  const shared = overlapAmount(item.x, item.x + item.width, box.x, box.x + box.width);
  if (shared > Math.max(8, item.width * 0.45)) return box.height;
  return 0;
}

export interface MmRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MmPoint {
  x: number;
  y: number;
}

export function clipRect(panel: MmRect, cut: MmRect): MmRect | null {
  const x1 = Math.max(panel.x, cut.x);
  const y1 = Math.max(panel.y, cut.y);
  const x2 = Math.min(panel.x + panel.w, cut.x + cut.w);
  const y2 = Math.min(panel.y + panel.h, cut.y + cut.h);
  if (x2 - x1 < 0.4 || y2 - y1 < 0.4) return null;
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** Wall rectangles that cut this glass. Overlap mode does not cut. */
export function glassNotches(shower: Shower, item: PlacedItem): MmRect[] {
  if (item.kind === "wall") return [];
  const geom = geometryOf(shower, item);
  const panel = { x: geom.leafX, y: geom.leafY, w: geom.leafW, h: geom.leafH };
  const cuts: MmRect[] = [];
  for (const wall of shower.items) {
    if (wall.kind !== "wall" || wall.wallCut === "overlap") continue;
    const box = geometryOf(shower, wall);
    const hit = clipRect(panel, { x: box.x, y: box.y, w: box.w, h: box.h });
    if (hit) cuts.push(hit);
  }
  return cuts;
}

function uniqSorted(values: number[]): number[] {
  const out: number[] = [];
  for (const value of [...values].sort((a, b) => a - b)) {
    if (!out.length || Math.abs(out[out.length - 1] - value) > 0.15) out.push(value);
  }
  return out;
}

function polyArea(loop: MmPoint[]): number {
  let sum = 0;
  for (let i = 0; i < loop.length; i += 1) {
    const a = loop[i];
    const b = loop[(i + 1) % loop.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

function simplifyLoop(loop: MmPoint[]): MmPoint[] {
  if (loop.length < 3) return loop;
  const out: MmPoint[] = [];
  for (let i = 0; i < loop.length; i += 1) {
    const prev = loop[(i + loop.length - 1) % loop.length];
    const cur = loop[i];
    const next = loop[(i + 1) % loop.length];
    const cross = (cur.x - prev.x) * (next.y - cur.y) - (cur.y - prev.y) * (next.x - cur.x);
    if (Math.abs(cross) < 0.4) continue;
    out.push(cur);
  }
  return out.length >= 3 ? out : loop;
}

/** Remaining glass as loops. The first is the outer boundary. Later loops are holes. */
export function shapeLoops(panel: MmRect, cuts: MmRect[]): MmPoint[][] {
  const holes = cuts.map((cut) => clipRect(panel, cut)).filter((cut): cut is MmRect => cut != null);
  const xs = uniqSorted([panel.x, panel.x + panel.w, ...holes.flatMap((cut) => [cut.x, cut.x + cut.w])]);
  const ys = uniqSorted([panel.y, panel.y + panel.h, ...holes.flatMap((cut) => [cut.y, cut.y + cut.h])]);
  const cols = xs.length - 1;
  const rows = ys.length - 1;
  if (cols < 1 || rows < 1) return [];
  const filled: boolean[][] = [];
  for (let j = 0; j < rows; j += 1) {
    filled[j] = [];
    const cy = (ys[j] + ys[j + 1]) / 2;
    for (let i = 0; i < cols; i += 1) {
      const cx = (xs[i] + xs[i + 1]) / 2;
      const cut = holes.some((hole) => cx > hole.x + 0.05 && cx < hole.x + hole.w - 0.05 && cy > hole.y + 0.05 && cy < hole.y + hole.h - 0.05);
      filled[j][i] = !cut;
    }
  }
  type Edge = { x1: number; y1: number; x2: number; y2: number };
  const edges: Edge[] = [];
  const stamp = (x: number, y: number) => `${Math.round(x * 10)}:${Math.round(y * 10)}`;
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      if (!filled[j][i]) continue;
      const x0 = xs[i];
      const x1 = xs[i + 1];
      const y0 = ys[j];
      const y1 = ys[j + 1];
      if (j === 0 || !filled[j - 1][i]) edges.push({ x1: x0, y1: y0, x2: x1, y2: y0 });
      if (i === cols - 1 || !filled[j][i + 1]) edges.push({ x1: x1, y1: y0, x2: x1, y2: y1 });
      if (j === rows - 1 || !filled[j + 1][i]) edges.push({ x1: x1, y1: y1, x2: x0, y2: y1 });
      if (i === 0 || !filled[j][i - 1]) edges.push({ x1: x0, y1: y1, x2: x0, y2: y0 });
    }
  }
  const unused = new Map<string, Edge[]>();
  for (const edge of edges) {
    const start = stamp(edge.x1, edge.y1);
    const list = unused.get(start) ?? [];
    list.push(edge);
    unused.set(start, list);
  }
  const loops: MmPoint[][] = [];
  for (const edge of edges) {
    const bucket = unused.get(stamp(edge.x1, edge.y1));
    if (!bucket?.includes(edge)) continue;
    const loop: MmPoint[] = [];
    let current: Edge | undefined = edge;
    let guard = 0;
    while (current && guard < 400) {
      guard += 1;
      const from = stamp(current.x1, current.y1);
      const list = unused.get(from);
      const index = list?.indexOf(current) ?? -1;
      if (!list || index < 0) break;
      list.splice(index, 1);
      loop.push({ x: current.x1, y: current.y1 });
      const endX: number = current.x2;
      const endY: number = current.y2;
      if (loop.length > 2 && Math.abs(endX - loop[0].x) < 0.2 && Math.abs(endY - loop[0].y) < 0.2) {
        current = undefined;
        break;
      }
      current = unused.get(stamp(endX, endY))?.[0];
    }
    if (loop.length >= 3) loops.push(simplifyLoop(loop));
  }
  loops.sort((a, b) => Math.abs(polyArea(b)) - Math.abs(polyArea(a)));
  return loops;
}

/** Offset an orthogonal loop into the glass by `dist` mm. Positive area is the outer loop. */
export function insetLoop(loop: MmPoint[], dist: number): MmPoint[] {
  if (loop.length < 3 || Math.abs(dist) < 0.15) return loop;
  const towardGlass = polyArea(loop) >= 0 ? dist : -dist;
  const count = loop.length;
  const next: MmPoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const prev = loop[(i + count - 1) % count];
    const cur = loop[i];
    const after = loop[(i + 1) % count];
    let d1x = cur.x - prev.x;
    let d1y = cur.y - prev.y;
    let d2x = after.x - cur.x;
    let d2y = after.y - cur.y;
    const l1 = Math.hypot(d1x, d1y) || 1;
    const l2 = Math.hypot(d2x, d2y) || 1;
    d1x /= l1;
    d1y /= l1;
    d2x /= l2;
    d2y /= l2;
    const n1x = -d1y;
    const n1y = d1x;
    const n2x = -d2y;
    const n2y = d2x;
    next.push({ x: cur.x + (n1x + n2x) * towardGlass, y: cur.y + (n1y + n2y) * towardGlass });
  }
  return next;
}

function fixedBeside(shower: Shower, door: PlacedItem, side: Side): boolean {
  const edge = side === "left" ? door.x : door.x + door.width;
  return shower.items.some((item) => {
    if (item.kind !== "fixed") return false;
    const other = side === "left" ? item.x + item.width : item.x;
    return Math.abs(other - edge) <= 45;
  });
}

export function geometryOf(shower: Shower, item: PlacedItem): Geom {
  const head = headForItem(shower, item);
  const room = Math.max(0, shower.height - head);

  if (item.kind === "wall") {
    const h = clamp(item.height, 0, shower.height);
    const y = shower.height - h;
    return {
      x: item.x,
      y,
      w: item.width,
      h,
      leafX: item.x,
      leafY: y,
      leafW: item.width,
      leafH: h,
      overlap: 0,
    };
  }

  if (item.kind === "fixed") {
    if (shower.product === "cubicle") {
      const bottom = shower.height - Math.min(Math.max(0, shower.cubicle.gap), Math.max(0, shower.height - 30));
      const h = Math.max(0, Math.min(item.height, bottom - head));
      return { x: item.x, y: head, w: item.width, h, leafX: item.x, leafY: head, leafW: item.width, leafH: h, overlap: 0 };
    }
    const h = Math.min(Math.max(0, item.height), room);
    return { x: item.x, y: head, w: item.width, h, leafX: item.x, leafY: head, leafW: item.width, leafH: h, overlap: 0 };
  }

  if (item.kind === "door") {
    if (shower.product === "cubicle") {
      const gap = Math.min(Math.max(0, shower.cubicle.gap), Math.max(0, shower.height - 30));
      const bottom = shower.height - gap;
      const y = head + Math.max(0, shower.cubicle.doorClearance);
      const h = Math.max(0, Math.min(item.height, bottom - y));
      let leafX = item.x;
      let leafW = item.width;
      let overlap = 0;
      if (item.doorStyle === "sliding") {
        const side: Side = item.handleSide === "right" ? "left" : "right";
        if (fixedBeside(shower, item, side)) {
          overlap = slideOverlapMm(shower);
          if (side === "left") {
            leafX = item.x - overlap;
            leafW = item.width + overlap;
          } else {
            leafW = item.width + overlap;
          }
        }
      }
      return { x: item.x, y, w: item.width, h, leafX, leafY: y, leafW, leafH: h, overlap };
    }
    const openingH = Math.min(Math.max(0, item.height), room);
    const leafH = Math.max(0, openingH - DOOR_SHORT_MM);
    let leafX = item.x;
    let leafW = item.width;
    let overlap = 0;
    if (item.doorStyle === "sliding") {
      const side: Side = item.handleSide === "right" ? "left" : "right";
      if (fixedBeside(shower, item, side)) {
        overlap = slideOverlapMm(shower);
        if (side === "left") {
          leafX = item.x - overlap;
          leafW = item.width + overlap;
        } else {
          leafW = item.width + overlap;
        }
      }
    }
    return {
      x: item.x,
      y: head,
      w: item.width,
      h: openingH,
      leafX,
      leafY: head,
      leafW,
      leafH,
      overlap,
    };
  }

  if (shower.product === "cubicle") {
    const bottom = shower.height - Math.min(Math.max(0, shower.cubicle.gap), Math.max(0, shower.height - 30));
    const h = Math.max(0, Math.min(item.height, bottom - head));
    return { x: item.x, y: head, w: item.width, h, leafX: item.x, leafY: head, leafW: item.width, leafH: h, overlap: 0 };
  }
  const h = Math.min(Math.max(0, item.height), room);
  return { x: item.x, y: head, w: item.width, h, leafX: item.x, leafY: head, leafW: item.width, leafH: h, overlap: 0 };
}

export function showPlan(shower: Shower): boolean {
  const door =
    shower.items.some((item) => item.kind === "door") ||
    shower.sides.some((side) => side.items.some((item) => item.kind === "door"));
  return (
    door ||
    shower.useDepth ||
    shower.ceiling.enabled ||
    shower.sides.length > 0 ||
    shower.items.some((item) => item.kind === "return") ||
    shower.wc.enabled ||
    shower.showerPoint.enabled ||
    shower.product === "cubicle"
  );
}

export function roomDepth(shower: Shower): number {
  return Math.max(0, shower.depth);
}

export function displayDepth(shower: Shower): number {
  const room = Math.max(roomDepth(shower), 1);
  const shaped = shower.useDepth || shower.ceiling.enabled || shower.sides.length > 0 || shower.items.some((item) => item.kind === "return") || shower.wc.enabled || shower.showerPoint.enabled;
  if (!shaped) {
    const widest = eachItem(shower).reduce((max, row) => (row.item.kind === "door" ? Math.max(max, row.item.width) : max), 0);
    return Math.max(180, Math.min(room, widest + 60));
  }
  let extent = room;
  for (const side of shower.sides) extent = Math.max(extent, side.length);
  if (shower.wc.enabled) extent = Math.max(extent, shower.wc.y + 40);
  if (shower.showerPoint.enabled) extent = Math.max(extent, shower.showerPoint.y + 40);
  for (const item of shower.items) {
    if (item.kind === "return") extent = Math.max(extent, item.depth);
  }
  return Math.max(extent, 1);
}

/** Bathroom size on the plan. A short partition does not stretch this. */
export function planDepthOf(shower: Shower): number {
  return Math.max(roomDepth(shower), 1);
}

export function frameDepth(shower: Shower): number {
  return Math.max(1, shower.material.profileDepth || 45);
}

/** Room inside the front frame. A return cannot cross that frame. */
export function innerDepth(shower: Shower): number {
  return Math.max(10, roomDepth(shower) - frameDepth(shower));
}

export function clampPartitionDepth(shower: Shower, length: number): number {
  return clamp(Math.max(10, length), 10, innerDepth(shower));
}

export function clampFixturePoint(shower: Shower, x: number, y: number): { x: number; y: number } {
  return {
    x: clamp(x, 0, Math.max(0, shower.width)),
    y: clamp(y, 0, Math.max(0, roomDepth(shower))),
  };
}

function clampFixtureIn(point: PlanFixture, width: number, depth: number): PlanFixture {
  return { ...point, x: clamp(point.x, 0, Math.max(0, width)), y: clamp(point.y, 0, Math.max(0, depth)) };
}

export function isFullPartition(shower: Shower, side: SideRun): boolean {
  const room = innerDepth(shower);
  return room >= 20 && side.length >= room - 2;
}

export function partitionItems(shower: Shower, side: SideRun): PlacedItem[] {
  const height = shower.height;
  const length = Math.max(10, side.length);
  const depth = shower.depth;
  if (side.door) {
    const doorW = clamp(side.doorWidth, 40, length);
    const doorX = clamp(side.doorX, 0, Math.max(0, length - doorW));
    const door = baseItem("door", doorX, doorW, height, depth);
    door.id = `${side.id}-door`;
    door.doorStyle = side.doorStyle;
    door.handleSide = side.doorHandle === "left" ? "left" : "right";
    door.swing = side.doorSwing === "outside" ? "outside" : "inside";
    const parts: PlacedItem[] = [];
    if (doorX > 8) {
      const fixed = baseItem("fixed", 0, doorX, height, depth);
      fixed.id = `${side.id}-fixed-a`;
      parts.push(fixed);
    }
    parts.push(door);
    const rest = length - doorX - doorW;
    if (rest > 8) {
      const fixed = baseItem("fixed", doorX + doorW, rest, height, depth);
      fixed.id = `${side.id}-fixed-b`;
      parts.push(fixed);
    }
    return parts;
  }
  if (side.items.length) return side.items;
  const panel = baseItem("fixed", 0, length, height, depth);
  panel.id = `${side.id}-leaf`;
  return [panel];
}

export function contentExtents(shower: Shower): { minX: number; maxX: number; planDepth: number } {
  let minX = 0;
  let maxX = Math.max(shower.width, 1);
  for (const item of shower.items) {
    const geom = geometryOf(shower, item);
    minX = Math.min(minX, geom.x, geom.leafX);
    maxX = Math.max(maxX, geom.x + geom.w, geom.leafX + geom.leafW);
  }
  const top = topFixedBox(shower);
  if (top) {
    minX = Math.min(minX, top.x);
    maxX = Math.max(maxX, top.x + top.width);
  }
  return { minX, maxX, planDepth: planDepthOf(shower) };
}

export function elevationShower(shower: Shower, side: SideRun): Shower {
  return normalizeShower({
    ...shower,
    width: Math.max(10, side.length),
    height: shower.height,
    items: partitionItems(shower, side).map((item) => ({ ...item, channels: { ...item.channels } })),
    sides: [],
    useDepth: false,
    topFixed: { ...shower.topFixed, enabled: false },
    ceiling: { ...shower.ceiling, enabled: false },
  });
}

export function glassSides(shower: Shower): SideRun[] {
  return shower.sides.filter((side) => side.items.some((item) => item.kind !== "wall"));
}

export interface LocatedItem {
  item: PlacedItem;
  runId: string;
  runName: string;
  length: number;
}

export function eachItem(shower: Shower): LocatedItem[] {
  const rows: LocatedItem[] = shower.items.map((item) => ({
    item,
    runId: "front",
    runName: "Front",
    length: shower.width,
  }));
  for (const side of shower.sides) {
    for (const item of side.items) {
      rows.push({ item, runId: side.id, runName: side.name, length: side.length });
    }
  }
  return rows;
}

export function findItem(shower: Shower, id: string | null): LocatedItem | null {
  if (!id) return null;
  return eachItem(shower).find((row) => row.item.id === id) ?? null;
}

export function hardwareColourLabel(material: Material): string {
  if (material.hardwareMatchProfile) return material.colour;
  const typed = material.hardwareColourName.trim();
  return typed || material.hardwareColour;
}

export function hardwareHex(material: Material): string {
  const name = material.hardwareMatchProfile ? material.colour : material.hardwareColour;
  return COLOUR_HEX[name] ?? COLOUR_HEX.Grey;
}

export function surfaceLabel(spec: InfillSpec): string {
  if (spec.surface === "frosting") return "Frosting";
  if (spec.surface === "other") return spec.surfaceNote.trim() || "Other";
  return "";
}

export function infillSpecText(shower: Shower): string {
  if (shower.material.infill === "sheet") {
    const sheet = shower.material.sheet;
    return [sheet.thickness && `${sheet.thickness} mm`, sheet.metal, sheet.colour, sheet.brand, surfaceLabel(sheet)]
      .filter(Boolean)
      .join(" · ");
  }
  const glass = shower.material.glass;
  const tough = glass.tough === "nontough" ? "Non-toughened" : "Toughened glass";
  return [glass.thickness && `${glass.thickness} mm`, glass.colour, glass.brand, tough, surfaceLabel(glass)].filter(Boolean).join(" · ");
}

function sqFt(widthMm: number, heightMm: number): number {
  return (Math.max(0, widthMm) * Math.max(0, heightMm)) / SQFT_PER_MM2;
}

export function slideOverlapMm(shower: Shower): number {
  return Math.max(1, shower.material.profileFace || 16);
}

export interface GapSpan {
  x: number;
  width: number;
}

export function usedWidth(items: PlacedItem[]): number {
  const spans = items
    .filter((item) => item.kind !== "return" && item.width > 1)
    .map((item) => ({ a: item.x, b: item.x + item.width }))
    .filter((span) => span.b - span.a > 1)
    .sort((a, b) => a.a - b.a);
  const merged: { a: number; b: number }[] = [];
  for (const span of spans) {
    const last = merged[merged.length - 1];
    if (!last || span.a > last.b + 0.5) merged.push({ ...span });
    else last.b = Math.max(last.b, span.b);
  }
  return merged.reduce((sum, span) => sum + (span.b - span.a), 0);
}

export function coverageGaps(length: number, items: PlacedItem[]): GapSpan[] {
  const spans = items
    .filter((item) => item.kind !== "return" && item.width > 1)
    .map((item) => ({ a: Math.max(0, item.x), b: Math.min(length, item.x + item.width) }))
    .filter((span) => span.b - span.a > 1)
    .sort((a, b) => a.a - b.a);
  const merged: { a: number; b: number }[] = [];
  for (const span of spans) {
    const last = merged[merged.length - 1];
    if (!last || span.a > last.b + 1) merged.push({ ...span });
    else last.b = Math.max(last.b, span.b);
  }
  const gaps: GapSpan[] = [];
  let cursor = 0;
  for (const span of merged) {
    if (span.a > cursor + 1) gaps.push({ x: cursor, width: span.a - cursor });
    cursor = Math.max(cursor, span.b);
  }
  if (length - cursor > 1) gaps.push({ x: cursor, width: length - cursor });
  return gaps;
}

export function balanceWidth(length: number, items: PlacedItem[]): number {
  return length - usedWidth(items);
}

export function openingSqFt(widthMm: number, heightMm: number): number {
  return sqFt(widthMm, heightMm);
}

export function designedSqFt(shower: Shower): number {
  const current = normalizeShower(shower);
  let area = 0;
  const top = topFixedBox(current);
  if (top) area += sqFt(top.width, top.height);
  for (const item of current.items) {
    if (item.kind === "return") {
      area += sqFt(Math.max(item.depth, item.width), item.height);
      continue;
    }
    const geom = geometryOf(current, item);
    const width = item.kind === "door" ? geom.leafW : geom.w;
    const height = item.kind === "door" ? geom.leafH : geom.h;
    area += sqFt(width, height);
  }
  for (const side of current.sides) {
    const host = elevationShower(current, side);
    for (const item of side.items) {
      if (item.kind === "return") continue;
      const geom = geometryOf(host, item);
      const width = item.kind === "door" ? geom.leafW : geom.w;
      const height = item.kind === "door" ? geom.leafH : geom.h;
      area += sqFt(width, height);
    }
  }
  return area;
}

export interface PackageLine {
  id: string;
  kind: "package" | "handle" | "lock" | "wastage" | "size" | "extra" | "cut" | "legs" | "rail" | "ceiling";
  description: string;
  size: string;
  area: number;
  rate: number;
  amount: number;
  photo: string;
}

export function handleOptionName(item: PlacedItem): string {
  const typed = item.handleName.trim();
  if (typed) return typed;
  if (item.handleKind === "lpipe") return "L-type round pipe";
  if (item.handleKind === "pull") {
    const axis = item.pullAxis === "horizontal" ? "horizontal" : "vertical";
    return `Rectangular pull ${formatMm(item.pullLength)} mm ${axis}`;
  }
  return "Handle";
}

export function lockOptionName(item: PlacedItem): string {
  const typed = item.lockName.trim();
  if (typed) return typed;
  if (item.lockStyle === "lever") return "Lever lock";
  return "Lock";
}

function doorHasHandle(item: PlacedItem): boolean {
  return item.kind === "door" && (item.handleKind !== "none" || item.handleName.trim() !== "" || item.handleRate > 0);
}

function doorHasLock(item: PlacedItem): boolean {
  return item.kind === "door" && (item.lockStyle !== "none" || item.lockName.trim() !== "" || item.lockRate > 0);
}

export function sqmFromSqFt(sqFt: number): number {
  return Math.max(0, sqFt) * SQM_PER_SQFT;
}

export function mmToFt(mm: number): number {
  return mm / UNIT_TO_MM.ft;
}

export function formatFt(ft: number): string {
  const rounded = Math.round(ft * 1000) / 1000;
  return String(rounded);
}

/** Round a width in feet up to the next standard sheet width. Widths over 8 ft split into 8 ft sheets plus a remainder. */
export function standardWidths(widthFt: number): number[] {
  if (widthFt <= 1e-9) return [];
  const parts: number[] = [];
  let left = widthFt;
  while (left > 8 + 1e-6) {
    parts.push(8);
    left -= 8;
  }
  const next = SHEET_WIDTHS_FT.find((size) => left <= size + 1e-6);
  parts.push(next ?? 8);
  return parts;
}

/** Round a height in feet up the sheet ladder. Heights over 12 ft split into 12 ft sheets plus a remainder. */
export function standardHeights(heightFt: number): number[] {
  if (heightFt <= 1e-9) return [];
  const parts: number[] = [];
  let left = heightFt;
  while (left > 12 + 1e-6) {
    parts.push(12);
    left -= 12;
  }
  parts.push(ceilSheetHeight(left));
  return parts;
}

function ceilSheetHeight(heightFt: number): number {
  if (heightFt <= 5 + 1e-6) {
    for (const size of [1, 2, 3, 4, 5]) {
      if (heightFt <= size + 1e-6) return size;
    }
  }
  if (heightFt <= 7 + 1e-6) return 7;
  if (heightFt <= 8 + 1e-6) return 8;
  if (heightFt <= 10 + 1e-6) return 10;
  return 12;
}

export interface SheetCut {
  widthFt: number;
  heightFt: number;
}

export interface SheetPiece {
  id: string;
  name: string;
  role: "glass" | "top" | "cut";
  widthMm: number;
  heightMm: number;
  widthFt: number;
  heightFt: number;
  actualSqFt: number;
  sheetSqFt: number;
  wasteSqFt: number;
  sheets: SheetCut[];
  sheetLabel: string;
}

export function sheetYield(widthMm: number, heightMm: number): Omit<SheetPiece, "id" | "name" | "role"> {
  const widthFt = Math.max(0, mmToFt(widthMm));
  const heightFt = Math.max(0, mmToFt(heightMm));
  const widths = standardWidths(widthFt);
  const heights = standardHeights(heightFt);
  const sheets: SheetCut[] = [];
  for (const width of widths) {
    for (const height of heights) sheets.push({ widthFt: width, heightFt: height });
  }
  const actualSqFt = widthFt * heightFt;
  const sheetSqFt = sheets.reduce((sum, sheet) => sum + sheet.widthFt * sheet.heightFt, 0);
  const wasteSqFt = Math.max(0, sheetSqFt - actualSqFt);
  const sheetLabel = sheets.map((sheet) => `${formatFt(sheet.widthFt)} × ${formatFt(sheet.heightFt)} ft`).join(" + ");
  return { widthMm, heightMm, widthFt, heightFt, actualSqFt, sheetSqFt, wasteSqFt, sheets, sheetLabel };
}

function pushSheetPiece(pieces: SheetPiece[], id: string, name: string, role: "glass" | "top" | "cut", widthMm: number, heightMm: number) {
  if (widthMm < 1 || heightMm < 1) return;
  pieces.push({ id, name, role, ...sheetYield(widthMm, heightMm) });
}

function rectSqFt(widthMm: number, heightMm: number): number {
  return Math.max(0, mmToFt(widthMm) * mmToFt(heightMm));
}

function pushCutBand(pieces: SheetPiece[], id: string, name: string, widthMm: number, heightMm: number, fullSheet: boolean) {
  if (widthMm < 1 || heightMm < 1) return;
  const band = sheetYield(widthMm, heightMm);
  const charged = fullSheet ? band.sheetSqFt : band.actualSqFt;
  pieces.push({
    ...band,
    id,
    name,
    role: "cut",
    actualSqFt: 0,
    sheetSqFt: charged,
    wasteSqFt: charged,
    sheetLabel: fullSheet ? band.sheetLabel : "cutout",
  });
}

function pushGlassWithCuts(shower: Shower, item: PlacedItem, pieces: SheetPiece[], id: string, name: string, widthMm: number, heightMm: number, role: "glass" | "top") {
  const geom = geometryOf(shower, item);
  const panel = { x: geom.leafX, y: geom.leafY, w: Math.max(geom.leafW, 0), h: Math.max(geom.leafH, 0) };
  const cuts = glassNotches(shower, item);
  if (!cuts.length || panel.w < 1 || panel.h < 1) {
    pushSheetPiece(pieces, id, name, role, widthMm, heightMm);
    return;
  }
  const fullWidth = cuts.filter((cut) => cut.w >= panel.w - 1.5);
  if (fullWidth.length === cuts.length) {
    const cutH = fullWidth.reduce((sum, cut) => sum + cut.h, 0);
    const remainH = panel.h - cutH;
    if (remainH > 1) pushSheetPiece(pieces, id, name, role, panel.w, remainH);
    fullWidth.forEach((cut, index) => pushCutBand(pieces, `${id}:cut:${index}`, `Cutout · ${name}`, panel.w, cut.h, true));
    return;
  }
  const cutSq = cuts.reduce((sum, cut) => sum + rectSqFt(cut.w, cut.h), 0);
  const base = sheetYield(widthMm, heightMm);
  pieces.push({
    ...base,
    id,
    name,
    role,
    actualSqFt: Math.max(0, base.actualSqFt - cutSq),
    wasteSqFt: base.wasteSqFt,
  });
  pushCutBand(pieces, `${id}:cut`, `Cutout · ${name}`, cuts.reduce((sum, cut) => sum + cut.w, 0), cuts[0]?.h ?? 0, false);
  if (cuts.length) {
    const last = pieces[pieces.length - 1];
    if (last && last.role === "cut") {
      last.wasteSqFt = cutSq;
      last.sheetSqFt = cutSq;
      last.heightMm = cuts.reduce((sum, cut) => sum + cut.h, 0);
      last.widthMm = Math.max(...cuts.map((cut) => cut.w));
    }
  }
}

function glassPiecesOf(shower: Shower, items: PlacedItem[], runId: string, runName: string, pieces: SheetPiece[]) {
  const split = shower.height > TEN_FT_MM + 0.2;
  for (const item of items) {
    if (item.kind === "wall") continue;
    const widthMm = item.kind === "return" ? Math.max(item.depth, item.width) : item.width;
    const geom = geometryOf(shower, item);
    const heightMm = shower.product === "cubicle" ? (item.kind === "door" ? geom.leafH : geom.h) : Math.min(item.height, shower.height);
    const place = runId === "front" ? "" : `${runName} · `;
    const label = shower.product === "cubicle"
      ? (item.kind === "door" ? (item.doorStyle === "sliding" ? "HPL sliding door" : "HPL door") : "HPL panel")
      : item.kind === "door" ? (item.doorStyle === "sliding" ? "Sliding door" : "Openable door") : item.kind === "return" ? "Return" : "Fixed glass";
    if (split && heightMm > TEN_FT_MM + 0.2 && !glassNotches(shower, item).length) {
      pushSheetPiece(pieces, `${runId}:${item.id}:glass`, `${place}${label}`, "glass", widthMm, GLASS_CUT_MM);
      pushSheetPiece(pieces, `${runId}:${item.id}:top`, `${place}Top fixed · ${label}`, "top", widthMm, heightMm - GLASS_CUT_MM);
    } else {
      pushGlassWithCuts(shower, item, pieces, `${runId}:${item.id}`, `${place}${label}`, widthMm, heightMm, "glass");
    }
  }
}

export function sheetBreakdown(shower: Shower): SheetPiece[] {
  const current = normalizeShower(shower);
  const pieces: SheetPiece[] = [];
  glassPiecesOf(current, current.items, "front", "Front", pieces);
  for (const side of current.sides) glassPiecesOf(current, side.items, side.id, side.name, pieces);
  if (current.height <= TEN_FT_MM + 0.2 && current.topFixed.enabled) {
    const box = topFixedBox(current);
    if (box) pushSheetPiece(pieces, "top-fixed", "Top fixed", "top", box.width, box.height);
  }
  return pieces;
}

export function actualSqFt(shower: Shower): number {
  return sheetBreakdown(shower).reduce((sum, piece) => sum + (piece.role === "cut" ? 0 : piece.actualSqFt), 0);
}

export function wastageExtraSqFt(shower: Shower): number {
  return sheetBreakdown(shower).reduce((sum, piece) => sum + piece.wasteSqFt, 0);
}

export function glassPrice(shower: Shower): { rate: number; amount: number; area: number } {
  const current = normalizeShower(shower);
  const area = actualSqFt(current);
  return { area, ...pricePair(current.material.ratePerSqFt, current.packageAmount, area, current.glassPriceFrom) };
}

export function productRate(shower: Shower): number {
  return glassPrice(shower).rate;
}

export function wastagePrice(shower: Shower): { rate: number; amount: number; area: number } {
  const current = normalizeShower(shower);
  const area = wastageExtraSqFt(current);
  const waste = current.wastage.package;
  if (waste?.priceFrom === "amount") return { area, ...pricePair(waste.rate, waste.amount, area, "amount") };
  const rate = waste?.ownRate ? waste.rate : productRate(current);
  return { area, ...pricePair(rate, 0, area, "rate") };
}

export function wastageRateOf(shower: Shower): number {
  return wastagePrice(shower).rate;
}

export function productGlassAmount(shower: Shower): number {
  return glassPrice(shower).amount;
}

export function wastageAmountOf(shower: Shower): number {
  return wastagePrice(shower).amount;
}

export function ceilingAreaSqFt(ceiling: Ceiling, width: number, depth: number): number {
  if (!ceiling.enabled) return 0;
  const span = ceilingSpan(ceiling, width, Math.max(depth, 1));
  return (span.w * span.d) / (304.8 * 304.8);
}

export function ceilingPrice(ceiling: Ceiling, width: number, depth: number): { rate: number; amount: number; area: number } {
  const area = ceilingAreaSqFt(ceiling, width, depth);
  return { area, ...pricePair(ceiling.ratePerSqFt, ceiling.amount, area, ceiling.priceFrom) };
}

export function sideCeilingModel(shower: Shower, side: SideRun): Ceiling {
  if (side.ceiling.scope === "rect") return side.ceiling;
  const frame = Math.max(1, shower.material.profileDepth || 45);
  const bayW = side.attachX <= shower.width / 2 ? Math.max(10, side.attachX) : Math.max(10, shower.width - side.attachX);
  const bayX = side.attachX <= shower.width / 2 ? 0 : side.attachX;
  const bayD = Math.max(10, side.length);
  const room = Math.max(shower.depth, 1);
  const bayY = side.face === "wall" ? 0 : Math.max(0, room - frame - bayD);
  return { ...side.ceiling, scope: "rect", rect: { x: bayX, y: bayY, w: bayW, d: bayD, lift: side.ceiling.rect.lift } };
}

export function packageQuoteLines(shower: Shower, unit: UnitId): PackageLine[] {
  const current = normalizeShower(shower);
  const lines: PackageLine[] = [];
  const glass = glassPrice(current);
  const area = glass.area;
  const rate = glass.rate;
  lines.push({
    id: "package",
    kind: "package",
    description: "Package",
    size: sizeLabel(current, unit),
    area,
    rate,
    amount: glass.amount,
    photo: "",
  });
  const waste = wastagePrice(current);
  const wasteArea = waste.area;
  const wasteRate = waste.rate;
  const pieces = sheetBreakdown(current);
  if (wasteArea > 0.0001) {
    lines.push({
      id: "package:wastage",
      kind: "wastage",
      description: pieces.some((piece) => piece.role === "cut") ? `Wastage · cutout ${pieces.filter((piece) => piece.role === "cut").reduce((sum, piece) => sum + piece.wasteSqFt, 0).toFixed(2)} sq ft` : "Wastage",
      size: "—",
      area: wasteArea,
      rate: wasteRate,
      amount: waste.amount,
      photo: "",
    });
  }
  for (const row of eachItem(current)) {
    const item = row.item;
    if (!doorHasHandle(item) && !doorHasLock(item)) continue;
    const place = row.runId === "front" ? "" : `${row.runName} · `;
    const ref = `${formatLength(item.width, unit)} × ${formatLength(item.height, unit)} ${unit}`;
    if (doorHasHandle(item)) {
      lines.push({
        id: `handle:${item.id}`,
        kind: "handle",
        description: `${place}${handleOptionName(item)}`,
        size: ref,
        area: 0,
        rate: money(item.handleRate),
        amount: money(item.handleRate),
        photo: item.handlePhoto,
      });
    }
    if (doorHasLock(item)) {
      lines.push({
        id: `lock:${item.id}`,
        kind: "lock",
        description: `${place}${lockOptionName(item)}`,
        size: ref,
        area: 0,
        rate: money(item.lockRate),
        amount: money(item.lockRate),
        photo: "",
      });
    }
  }
  for (const row of eachItem(current)) {
    const item = row.item;
    if (item.kind !== "wall" || item.wallCut === "overlap" || !item.cutFee || item.cutFeeAmount <= 0) continue;
    const place = row.runId === "front" ? "" : `${row.runName} · `;
    lines.push({
      id: `cut:${item.id}`,
      kind: "cut",
      description: `${place}Cut charge`,
      size: "—",
      area: 0,
      rate: 0,
      amount: item.cutFeeAmount,
      photo: "",
    });
  }
  if (current.product === "cubicle") {
    const spec = current.cubicle;
    const legs = pricePair(spec.legRate, spec.legAmount, spec.legQty, spec.legPriceFrom);
    const rail = pricePair(spec.railRate, spec.railAmount, 1, spec.railPriceFrom);
    lines.push({
      id: "cubicle-legs",
      kind: "legs",
      description: `Legs × ${spec.legQty} · ${formatLength(spec.legHeight, unit)} ${unit} · ${legMaterialLabel(spec)}`,
      size: `${formatLength(spec.legHeight, unit)} ${unit}`,
      area: spec.legQty,
      rate: legs.rate,
      amount: legs.amount,
      photo: "",
    });
    lines.push({
      id: "cubicle-rail",
      kind: "rail",
      description: `Top rail · ${spec.railMaterial} · ${formatLength(current.width, unit)} ${unit}`,
      size: `${formatLength(current.width, unit)} ${unit}`,
      area: 1,
      rate: rail.rate,
      amount: rail.amount,
      photo: "",
    });
  }
  const ceilings: { id: string; name: string; ceiling: Ceiling }[] = [];
  if (current.ceiling.enabled) ceilings.push({ id: "ceiling", name: "Ceiling", ceiling: current.ceiling });
  for (const side of current.sides) {
    if (!side.ceiling.enabled) continue;
    ceilings.push({ id: `ceiling:${side.id}`, name: `${side.name} ceiling`, ceiling: sideCeilingModel(current, side) });
  }
  for (const row of ceilings) {
    const priced = ceilingPrice(row.ceiling, current.width, Math.max(current.depth, 1));
    lines.push({
      id: row.id,
      kind: "ceiling",
      description: `${row.name} · ${priced.area.toFixed(2)} sq ft`,
      size: "—",
      area: priced.area,
      rate: priced.rate,
      amount: priced.amount,
      photo: "",
    });
  }
  if (current.extraWork.kind !== "none") {
    const extra = pricePair(current.extraWork.rate, current.extraWork.amount, current.extraWork.areaSqFt, current.extraWork.priceFrom);
    lines.push({
      id: "extra",
      kind: "extra",
      description: EXTRA_LABEL[current.extraWork.kind],
      size: "—",
      area: current.extraWork.areaSqFt,
      rate: extra.rate,
      amount: extra.amount,
      photo: "",
    });
  }
  return lines;
}

export function quoteSubtotal(rows: { shower: Shower }[]): number {
  return rows.reduce((sum, row) => sum + showerAmount(row.shower), 0);
}

export function ceilingFinish(ceiling: Ceiling): { id: string; name: string; hex: string } {
  const list = ceiling.finishKind === "plain" ? PLAIN_FINISHES : WOOD_FINISHES;
  return list.find((row) => row.id === ceiling.finishId) ?? list[0];
}

export function ceilingModuleMm(ceiling: Ceiling): number {
  if (ceiling.customModule) return Math.max(50, ceiling.customModuleMm || UNIT_TO_MM.ft);
  const ft = CEILING_MODULES.includes(ceiling.moduleFt as (typeof CEILING_MODULES)[number]) ? ceiling.moduleFt : 2;
  return ft * UNIT_TO_MM.ft;
}

export interface CeilingPanelGeom {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function ceilingSpan(ceiling: Ceiling, width: number, depth: number): { x: number; y: number; w: number; d: number } {
  if (ceiling.scope === "rect") {
    return {
      x: ceiling.rect.x,
      y: ceiling.rect.y,
      w: Math.max(10, ceiling.rect.w || width),
      d: Math.max(10, ceiling.rect.d || depth),
    };
  }
  return { x: 0, y: 0, w: Math.max(width, 1), d: Math.max(depth, 1) };
}

export function ceilingPanels(ceiling: Ceiling, width: number, depth: number): CeilingPanelGeom[] {
  const mod = ceilingModuleMm(ceiling);
  const span = ceilingSpan(ceiling, width, depth);
  const panels: CeilingPanelGeom[] = [];
  if (ceiling.along === "depth") {
    let x = span.x;
    let index = 0;
    while (x < span.x + span.w - 0.5 && index < 48) {
      const w = Math.min(mod, span.x + span.w - x);
      if (w < 1) break;
      panels.push({ index, x, y: span.y, w, h: span.d });
      x += w;
      index += 1;
    }
  } else {
    let y = span.y;
    let index = 0;
    while (y < span.y + span.d - 0.5 && index < 48) {
      const h = Math.min(mod, span.y + span.d - y);
      if (h < 1) break;
      panels.push({ index, x: span.x, y, w: span.w, h });
      y += h;
      index += 1;
    }
  }
  return panels;
}

export function ceilingPanelGeoms(shower: Shower): CeilingPanelGeom[] {
  const current = normalizeShower(shower);
  if (!current.ceiling.enabled) return [];
  return ceilingPanels(current.ceiling, current.width, Math.max(current.depth, 1));
}

export function handleSizeText(item: PlacedItem, unit: UnitId): string {
  if (item.handleKind === "lpipe") {
    return `Ø${formatLength(item.pipeVertDia, unit)} × ${formatLength(item.pipeVertLen, unit)} / ${formatLength(item.pipeHorizLen, unit)} ${unit}`;
  }
  if (item.handleKind === "pull") {
    return `${formatLength(item.pullLength, unit)} ${unit} ${item.pullAxis}`;
  }
  return "—";
}

export function showerAmount(shower: Shower): number {
  return packageQuoteLines(shower, "mm").reduce((sum, line) => sum + line.amount, 0);
}

export function splitMarks(text: string): { bold: boolean; text: string }[] {
  const parts: { bold: boolean; text: string }[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push({ bold: false, text: text.slice(last, match.index) });
    parts.push({ bold: true, text: (match[1] ?? match[2] ?? "").trim() ? (match[1] ?? match[2] ?? "") : "" });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ bold: false, text: text.slice(last) });
  if (!parts.length) parts.push({ bold: false, text });
  return parts;
}

/** Drop a typed TM / ® so the tick can print the mark once, tight against the name. */
export function stripMarks(name: string): string {
  return name
    .replace(/[™®]/g, "")
    .replace(/\s*\(TM\)/gi, "")
    .replace(/\s*\(R\)/gi, "")
    .replace(/\s*\bTM\b/gi, "")
    .trim();
}

export function companyTitle(company: { name: string; markTm?: boolean; markReg?: boolean }): string {
  const name = stripMarks(company.name) || "Company";
  return `${name}${company.markTm ? "™" : ""}${company.markReg ? "®" : ""}`;
}

export function describeHardware(shower: Shower): string {
  const doors = eachItem(shower).filter((row) => row.item.kind === "door");
  if (!doors.length) return shower.material.hardware.trim();
  return doors
    .map((row) => {
      const door = row.item;
      const place = row.runId === "front" ? "" : `${row.runName}: `;
      const handle = doorHasHandle(door) ? handleOptionName(door) : "handle";
      const lock = doorHasLock(door) ? `, ${lockOptionName(door)}` : "";
      return door.doorStyle === "sliding"
        ? `${place}Sliding track ${formatMm(door.trackSize)} mm, cover ${formatMm(door.topCover)} mm, wheel ${door.wheelName || "wheel"}, soft-closing ${door.softClose ? "yes" : "no"}, ${handle} ${door.handleSide}${lock}`
        : `${place}Openable ${door.hingeName} × ${door.hingeCount}, ${handle} ${door.handleSide}, opens ${door.swing === "outside" ? "outside" : "inside"}${lock}${door.outerFrame ? ", outer frame" : ""}`;
    })
    .join("; ");
}

export function hardwareForQuote(shower: Shower): string {
  const typed = shower.material.hardware.trim();
  if (typed) return typed;
  const live = describeHardware(shower);
  return live || "—";
}

export function profileLabel(material: Material): string {
  if (material.finish === "glass") return "Glass only";
  return `${material.profileName} mm`;
}

export function sizeLabel(shower: Shower, unit: UnitId): string {
  return `${formatLength(shower.width, unit)} × ${formatLength(shower.height, unit)} × ${formatLength(shower.depth, unit)} ${unit}`;
}

export function inr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Math.round(Number.isFinite(value) ? value : 0));
}

export function todayLabel(date = new Date()): string {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function baseItem(kind: ItemKind, x: number, width: number, height: number, depth: number): PlacedItem {
  return {
    id: uid(kind.slice(0, 1)),
    kind,
    x: Math.round(x),
    width: Math.round(width),
    height: Math.round(height),
    doorStyle: "sliding",
    handleSide: "right",
    swing: "inside",
    outerFrame: false,
    topCover: 40,
    trackSize: 25,
    wallRelation: "beside",
    wallCut: "notch",
    wallSide: "outside",
    wallHost: "",
    cutFee: false,
    cutFeeAmount: 0,
    depth,
    channels: emptyChannels(),
    slideSeat: "outside",
    handleKind: "none",
    handleName: "",
    handleRate: 0,
    handlePhoto: "",
    pipeVertDia: 30,
    pipeVertLen: 250,
    pipeHorizLen: 405,
    pipeTubeDia: 25,
    pipeReturn: 184,
    legPoint: "right",
    pullFinish: "Matte black",
    pullLength: 450,
    pullCustom: false,
    pullAxis: "vertical",
    handleHeight: 1000,
    handleDx: 0,
    handleDy: 0,
    handleLabelDx: 0,
    handleLabelDy: 0,
    doorFillName: "",
    doorFillColour: "",
    doorFillImage: "",
    lockStyle: "none",
    lockName: "",
    lockRate: 0,
    hingeCount: height > 1700 ? 3 : 2,
    hingeName: "Hinge",
    wheelName: "",
    softClose: false,
  };
}

function slotX(shower: Shower, width: number): number {
  const end = shower.items.reduce((max, item) => {
    if (item.kind === "return") return max;
    return Math.max(max, item.x + item.width);
  }, 0);
  if (end + Math.min(width, shower.width) <= shower.width + 1) return end;
  return Math.max(0, shower.width - width);
}

export function createItem(shower: Shower, kind: ItemKind, atX?: number | null): PlacedItem {
  const face = Math.max(8, shower.material.profileFace || 16);
  const width =
    kind === "door"
      ? clamp(Math.round(shower.width * 0.4), Math.min(280, shower.width), shower.width)
      : kind === "wall"
        ? clamp(Math.round(shower.width * 0.24), Math.min(160, shower.width), shower.width)
        : kind === "return"
          ? face
          : clamp(Math.round(shower.width * 0.3), Math.min(200, shower.width), shower.width);
  const raw = atX == null ? slotX(shower, width) : atX - width / 2;
  const x = clamp(raw, 0, Math.max(0, shower.width - Math.min(width, shower.width)));
  const box = topFixedBox(shower);
  const shared = box ? overlapAmount(x, x + width, box.x, box.x + box.width) : 0;
  const under = Boolean(box && shared > width * 0.45 && !shower.topFixed.auto);
  const height =
    kind === "wall"
      ? Math.min(1000, Math.max(200, shower.height * 0.48))
      : Math.max(40, shower.height - (under && box ? box.height : 0));
  const item = baseItem(kind, x, width, height, shower.depth > 0 ? shower.depth : 900);
  if (kind === "door") item.doorStyle = "sliding";
  return item;
}

export function addSide(shower: Shower, attachX?: number): Shower {
  const current = normalizeShower(shower);
  const length = 300;
  const index = current.sides.length;
  const dropped = attachX == null ? Math.min(400, current.width) : attachX;
  const side: SideRun = {
    id: uid("side"),
    name: `Return ${index + 1}`,
    attachX: clamp(dropped, 0, current.width),
    length,
    face: "glass",
    door: false,
    doorStyle: "sliding",
    doorWidth: 700,
    doorX: 0,
    doorHandle: "right",
    doorSwing: "inside",
    ceiling: emptyCeiling(),
    items: [],
  };
  return {
    ...current,
    useDepth: true,
    depth: current.depth > 50 ? current.depth : 900,
    sides: [...current.sides, side],
  };
}

export function withItem(shower: Shower, kind: ItemKind, atX?: number | null, runId = "front"): Shower {
  const current = normalizeShower(shower);
  if (kind === "return") return addSide(current, atX ?? undefined);
  if (runId !== "front") {
    return {
      ...current,
      sides: current.sides.map((side) => {
        if (side.id !== runId) return side;
        const item = createItem(elevationShower(current, side), kind, atX);
        return { ...side, items: [...side.items, item] };
      }),
    };
  }
  return { ...current, items: [...current.items, createItem(current, kind, atX)] };
}

function mapLocated(
  shower: Shower,
  id: string,
  fn: (item: PlacedItem, limit: number) => PlacedItem,
): Shower {
  if (shower.items.some((item) => item.id === id)) {
    return {
      ...shower,
      items: shower.items.map((item) => (item.id === id ? fn(item, shower.width) : item)),
    };
  }
  return {
    ...shower,
    sides: shower.sides.map((side) => ({
      ...side,
      items: side.items.map((item) => (item.id === id ? fn(item, side.length) : item)),
    })),
  };
}

export function moveItemX(shower: Shower, id: string, x: number): Shower {
  return mapLocated(normalizeShower(shower), id, (item, limit) => {
    const max = Math.max(0, limit - Math.min(item.width, limit));
    return { ...item, x: Math.round(clamp(x, 0, max)) };
  });
}

export function patchItem(shower: Shower, id: string, patch: Partial<PlacedItem>): Shower {
  return mapLocated(normalizeShower(shower), id, (item, limit) => {
    const next = normalizeItem({
      ...item,
      ...patch,
      channels: patch.channels ? { ...patch.channels } : item.channels,
    });
    const max = Math.max(0, limit - Math.min(next.width, limit));
    next.x = Math.round(clamp(next.x, 0, max));
    return next;
  });
}

export function removeItem(shower: Shower, id: string): Shower {
  const current = normalizeShower(shower);
  return {
    ...current,
    items: current.items.filter((item) => item.id !== id),
    sides: current.sides.map((side) => ({ ...side, items: side.items.filter((item) => item.id !== id) })),
  };
}

export function updateSide(shower: Shower, id: string, patch: Partial<SideRun>): Shower {
  const current = normalizeShower(shower);
  return {
    ...current,
    sides: current.sides.map((side) => {
      if (side.id !== id) return side;
      const length = clampPartitionDepth(current, num(patch.length ?? side.length, side.length));
      const attachX = clamp(num(patch.attachX ?? side.attachX, side.attachX), 0, current.width);
      const doorWidth = Math.max(40, num(patch.doorWidth ?? side.doorWidth, side.doorWidth));
      return {
        ...side,
        ...patch,
        name: (patch.name ?? side.name).trim() || side.name,
        length,
        attachX,
        face: patch.face === "wall" || (patch.face == null && side.face === "wall") ? "wall" : "glass",
        door: patch.door ?? side.door,
        doorStyle: (patch.doorStyle ?? side.doorStyle) === "openable" ? "openable" : "sliding",
        doorWidth,
        doorX: clamp(num(patch.doorX ?? side.doorX, side.doorX), 0, Math.max(0, length - Math.min(doorWidth, length))),
        doorHandle: (patch.doorHandle ?? side.doorHandle) === "left" ? "left" : "right",
        doorSwing: (patch.doorSwing ?? side.doorSwing) === "outside" ? "outside" : "inside",
        ceiling: normalizeCeiling(patch.ceiling ?? side.ceiling),
        items: (patch.items ?? side.items).map((item) => {
          const next = normalizeItem(item);
          const max = Math.max(0, length - Math.min(next.width, length));
          next.x = Math.round(clamp(next.x, 0, max));
          return next;
        }),
      };
    }),
  };
}

export function removeSide(shower: Shower, id: string): Shower {
  const current = normalizeShower(shower);
  return { ...current, sides: current.sides.filter((side) => side.id !== id) };
}

export function setWastage(shower: Shower, id: string, patch: Partial<WastageSpec>): Shower {
  const current = normalizeShower(shower);
  const prev = current.wastage[id] ?? emptyWastage();
  return {
    ...current,
    wastage: {
      ...current.wastage,
      [id]: {
        enabled: patch.enabled ?? prev.enabled,
        extraSqFt: Math.max(0, num(patch.extraSqFt ?? prev.extraSqFt, 0)),
        ownRate: patch.ownRate ?? prev.ownRate,
        rate: money(Math.max(0, num(patch.rate ?? prev.rate, 0))),
        amount: money(Math.max(0, num(patch.amount ?? prev.amount, 0))),
        priceFrom: patch.priceFrom ?? prev.priceFrom ?? "rate",
      },
    },
  };
}

export function setPartRate(shower: Shower, part: PartKey, rate: number): Shower {
  const current = normalizeShower(shower);
  const next = Math.max(0, num(rate, 0));
  const rates = { ...current.rates, [part]: next };
  const material = { ...current.material, ratePerSqFt: part === "fixed" ? next : current.material.ratePerSqFt };
  return { ...current, rates, material };
}

export function applySheetRate(shower: Shower, rate: number): Shower {
  const current = normalizeShower(shower);
  const next = Math.max(0, num(rate, 0));
  return {
    ...current,
    material: { ...current.material, sheet: { ...current.material.sheet, ratePerSqFt: next } },
    rates: { ...current.rates, fixed: next, door: next, return: next, topFixed: next },
  };
}

function starterFront(shower: Shower, id: string): PlacedItem[] {
  const w = shower.width;
  const h = shower.height;
  const depth = shower.depth > 0 ? shower.depth : 900;
  if (id === "single" || id === "return") {
    const doorW = clamp(Math.round(w * 0.4), Math.min(300, w), w);
    const left = Math.max(0, Math.round((w - doorW) / 2));
    const right = Math.max(0, w - left - doorW);
    return [baseItem("fixed", 0, left, h, depth), baseItem("door", left, doorW, h, depth), baseItem("fixed", left + doorW, right, h, depth)];
  }
  if (id === "openable") {
    const doorW = clamp(Math.round(w * 0.42), Math.min(280, w), w);
    const door = baseItem("door", w - doorW, doorW, h, depth);
    door.doorStyle = "openable";
    door.outerFrame = true;
    return [baseItem("fixed", 0, Math.max(0, w - doorW), h, depth), door];
  }
  if (id === "wall") {
    const wallW = clamp(Math.round(w * 0.26), Math.min(140, w), w);
    const remain = Math.max(0, w - wallW);
    const doorW = clamp(Math.round(remain * 0.55), Math.min(220, remain), remain || w);
    const mid = Math.max(0, w - wallW - doorW);
    const wall = baseItem("wall", 0, wallW, Math.min(1000, Math.max(200, h * 0.48)), depth);
    wall.wallCut = "notch";
    wall.wallSide = "outside";
    const door = baseItem("door", wallW + mid, doorW, h, depth);
    door.doorStyle = "openable";
    return [wall, baseItem("fixed", 0, wallW, h, depth), baseItem("fixed", wallW, mid, h, depth), door];
  }
  return shower.items.map((item) => ({ ...item, channels: { ...item.channels } }));
}

export function starterItems(shower: Shower, id: string): PlacedItem[] {
  return starterFront(shower, id);
}

export function applyStarter(shower: Shower, id: string): Shower {
  const current = normalizeShower({
    ...shower,
    useDepth: id === "return" ? true : shower.useDepth,
    items: starterFront(shower, id),
  });
  if (id !== "return" || current.sides.length > 0) return current;
  const depth = current.depth > 50 ? current.depth : 900;
  const fixedW = Math.round(depth * 0.55);
  const fixed = baseItem("fixed", 0, fixedW, current.height, depth);
  const door = baseItem("door", fixedW, Math.max(120, depth - fixedW), current.height, depth);
  door.doorStyle = "sliding";
  door.handleSide = "left";
  return {
    ...current,
    depth,
    useDepth: true,
    sides: [
      {
        id: uid("side"),
        name: "Return 1",
        attachX: 0,
        length: depth,
        face: "glass",
        door: true,
        doorStyle: "sliding",
        doorWidth: door.width,
        doorX: fixedW,
        doorHandle: "left",
        doorSwing: "inside",
        ceiling: emptyCeiling(),
        items: [fixed, door],
      },
    ],
  };
}

export function loadSetups(): SavedSetup[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(SETUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSetup).map((setup) => ({
      ...setup,
      material: normalizeMaterial(setup.material),
      channels: { ...emptyChannels(), ...setup.channels },
    }));
  } catch {
    return [];
  }
}

export function saveSetups(setups: SavedSetup[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SETUP_KEY, JSON.stringify(setups));
}

export function loadCompany(): CompanyProfile {
  if (typeof localStorage === "undefined") return blankCompany();
  try {
    const raw = localStorage.getItem(COMPANY_KEY);
    if (!raw) return blankCompany();
    const parsed = JSON.parse(raw) as Partial<CompanyProfile>;
    return {
      ...blankCompany(),
      ...parsed,
      gst: (parsed.gst ?? "").toUpperCase(),
      description: parsed.description ?? "",
      terms: parsed.terms?.trim() ? parsed.terms : DEFAULT_TERMS,
      markTm: Boolean(parsed.markTm),
      markReg: Boolean(parsed.markReg),
    };
  } catch {
    return blankCompany();
  }
}

export function saveCompany(profile: CompanyProfile): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(COMPANY_KEY, JSON.stringify({ ...profile, gst: profile.gst.toUpperCase() }));
}

export function loadCustomer(): CustomerDetails {
  if (typeof localStorage === "undefined") return blankCustomer();
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    if (!raw) return blankCustomer();
    const parsed = JSON.parse(raw) as Partial<CustomerDetails>;
    return { ...blankCustomer(), ...parsed, gst: (parsed.gst ?? "").toUpperCase() };
  } catch {
    return blankCustomer();
  }
}

export function saveCustomer(customer: CustomerDetails): void {
  if (typeof localStorage === "undefined") return;
  const next = { ...customer, gst: customer.gst.toUpperCase() };
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(next));
}

export function loadQuoteNo(): string {
  if (typeof localStorage === "undefined") return "Q-001";
  return localStorage.getItem(QUOTE_NO_KEY) || "Q-001";
}

export function saveQuoteNo(value: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(QUOTE_NO_KEY, value);
}

const WORK_KEY = "weos-work";

export interface WorkSnapshot {
  unit: UnitId;
  draft: Shower;
  quote: QuoteEntry[];
  nextSerial: number;
  editingSerial: number | null;
  fileMode: FileNameMode;
  activeRun: string;
}

export function loadWork(): WorkSnapshot | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(WORK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WorkSnapshot>;
    const quote = Array.isArray(parsed.quote)
      ? parsed.quote
          .filter((entry) => entry && typeof entry.serial === "number" && entry.shower)
          .map((entry) => ({ serial: entry.serial, shower: normalizeShower(entry.shower) }))
      : [];
    const unit = parsed.unit === "cm" || parsed.unit === "inch" || parsed.unit === "ft" || parsed.unit === "mm" ? parsed.unit : "mm";
    const serials = quote.map((entry) => entry.serial + 1);
    return {
      unit,
      draft: normalizeShower(parsed.draft),
      quote,
      nextSerial: Math.max(1, num(parsed.nextSerial, 1), ...serials),
      editingSerial: typeof parsed.editingSerial === "number" && quote.some((entry) => entry.serial === parsed.editingSerial) ? parsed.editingSerial : null,
      fileMode: parsed.fileMode === "quote" ? "quote" : "customer",
      activeRun: typeof parsed.activeRun === "string" && parsed.activeRun ? parsed.activeRun : "front",
    };
  } catch {
    return null;
  }
}

export function saveWork(snapshot: WorkSnapshot): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(WORK_KEY, JSON.stringify(snapshot));
}

function isSetup(value: unknown): value is SavedSetup {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<SavedSetup>;
  return typeof row.id === "string" && typeof row.name === "string" && !!row.material && !!row.channels;
}
