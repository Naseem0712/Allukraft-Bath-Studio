import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type SetStateAction } from "react";
import Drawing from "./Drawing";
import QuoteDocument from "./QuoteDocument";
import {
  CEILING_MODULES,
  CHANNEL_EDGES,
  CHANNEL_TYPES,
  COLOURS,
  COLOUR_HEX,
  EXTRA_LABEL,
  NOTE_LIMIT,
  PLAIN_FINISHES,
  PULL_FINISHES,
  PULL_LENGTHS,
  WOOD_FINISHES,
  GST_RATE,
  actualSqFt,
  ceilingAreaSqFt,
  ceilingPrice,
  glassPrice,
  money,
  pricePair,
  quoteSubtotal,
  sideCeilingModel,
  applyStarter,
  BACKUP_APP,
  backupFileName,
  parseBackup,
  BRAND_LOGO,
  balanceWidth,
  cloneShower,
  defaultLockHeight,
  describeHardware,
  designedSqFt,
  clamp,
  SHOWER_ID,
  WC_ID,
  findItem,
  formatFt,
  formatLength,
  formatMm,
  hardwareColourLabel,
  hardwareForQuote,
  infillSpecText,
  inr,
  loadCompany,
  loadWork,
  openingSqFt,
  normalizeShower,
  packageQuoteLines,
  saveWork,
  sheetBreakdown,
  loadCustomer,
  loadQuoteNo,
  loadSetups,
  moveItemX,
  patchItem,
  profileLabel,
  removeItem,
  removeSide,
  saveCompany,
  saveCustomer,
  saveQuoteNo,
  saveSetups,
  setChannelEdge,
  setWastage,
  showerAmount,
  sizeLabel,
  sqmFromSqFt,
  wastageAmountOf,
  wastageExtraSqFt,
  wastagePrice,
  wastageRateOf,
  unitToMm,
  updateSide,
  withItem,
  type CeilingAlong,
  type CeilingFinishKind,
  type ChannelSet,
  type ColourName,
  type ExtraWorkKind,
  type GlassTough,
  type CompanyProfile,
  type CustomerDetails,
  type FileNameMode,
  type Finish,
  type Infill,
  type InfillSpec,
  type ItemKind,
  type Material,
  type Origin,
  type PlanFacing,
  type PartitionFace,
  type ProductKind,
  type LegMaterial,
  type RailMaterial,
  clampFixturePoint,
  innerDepth,
  type PlacedItem,
  type HandleKind,
  type LegPoint,
  type LockStyle,
  type PullAxis,
  type QuoteEntry,
  type DoorSwing,
  type SlideSeat,
  type SavedSetup,
  type Shower,
  type Side,
  type SurfaceWork,
  type TopSpan,
  type UnitId,
  type UserDim,
  type WallCut,
  type WallFace,
  uid,
  usedWidth,
} from "./model";

const UNITS: UnitId[] = ["mm", "cm", "inch", "ft"];

/** Drop placed pieces and marks. Opening size, depth, and quote settings stay. */
function clearPlacedDesign(shower: Shower): Shower {
  return {
    ...shower,
    items: [],
    sides: [],
    dims: [],
    labelNudge: {},
    wc: { ...shower.wc, enabled: false },
    showerPoint: { ...shower.showerPoint, enabled: false },
    ceiling: { ...shower.ceiling, enabled: false, lights: [], image: "" },
  };
}

const PALETTE: { kind: ItemKind; label: string; note: string }[] = [
  { kind: "fixed", label: "Fixed glass", note: "Into the frame" },
  { kind: "door", label: "Door", note: "Sliding or openable" },
  { kind: "wall", label: "Wall", note: "Brick, either side" },
  { kind: "return", label: "Return / T", note: "A side to design" },
];

export default function App() {
  const [saved] = useState(() => loadWork());
  const [unit, setUnit] = useState<UnitId>(saved?.unit ?? "mm");
  const [draft, setDraftState] = useState<Shower>(() => saved?.draft ?? cloneShower({ width: 2000, height: 2100, depth: 900 } as Shower));
  const history = useRef<{ past: Shower[]; future: Shower[] }>({ past: [], future: [] });
  const [historyTick, setHistoryTick] = useState(0);
  const setDraft = (action: SetStateAction<Shower>) => {
    setDraftState((current) => {
      const next = typeof action === "function" ? (action as (value: Shower) => Shower)(current) : action;
      if (next !== current) {
        history.current.past.push(current);
        if (history.current.past.length > 60) history.current.past.shift();
        history.current.future = [];
        setHistoryTick((tick) => tick + 1);
      }
      return next;
    });
  };
  function undoDraft() {
    const prev = history.current.past.pop();
    if (!prev) return;
    setDraftState((current) => {
      history.current.future.push(current);
      return prev;
    });
    setHistoryTick((tick) => tick + 1);
  }
  function redoDraft() {
    const next = history.current.future.pop();
    if (!next) return;
    setDraftState((current) => {
      history.current.past.push(current);
      return next;
    });
    setHistoryTick((tick) => tick + 1);
  }
  function duplicateSelected() {
    if (!selectedId) return;
    setDraft((current) => {
      const found = findItem(current, selectedId);
      if (found) {
        const copy = { ...found.item, id: uid("copy"), x: found.item.x + 80, channels: { ...found.item.channels } };
        if (found.runId === "front") return { ...current, items: [...current.items, copy] };
        return { ...current, sides: current.sides.map((side) => (side.id === found.runId ? { ...side, items: [...side.items, copy] } : side)) };
      }
      const side = current.sides.find((item) => item.id === selectedId);
      if (!side) return current;
      const copy = {
        ...side,
        id: uid("side"),
        name: `${side.name} copy`,
        attachX: side.attachX + 120,
        ceiling: { ...side.ceiling, lights: side.ceiling.lights.map((light) => ({ ...light, id: uid("light") })) },
        items: side.items.map((item) => ({ ...item, id: uid("copy"), channels: { ...item.channels } })),
      };
      return { ...current, sides: [...current.sides, copy] };
    });
  }
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState(saved?.activeRun ?? "front");
  const [quote, setQuote] = useState<QuoteEntry[]>(saved?.quote ?? []);
  const [nextSerial, setNextSerial] = useState(saved?.nextSerial ?? 1);
  const [editingSerial, setEditingSerial] = useState<number | null>(saved?.editingSerial ?? null);
  const [setups, setSetups] = useState<SavedSetup[]>(() => loadSetups());
  const [setupName, setSetupName] = useState("");
  const [setupPick, setSetupPick] = useState("");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [company, setCompany] = useState<CompanyProfile>(() => loadCompany());
  const [customer, setCustomer] = useState<CustomerDetails>(() => loadCustomer());
  const [quoteNo, setQuoteNo] = useState(() => loadQuoteNo());
  const [fileMode, setFileMode] = useState<FileNameMode>(saved?.fileMode ?? "customer");
  const [status, setStatus] = useState("Type the full size. Add it to the quote when the frame is ready.");
  const backupRef = useRef<HTMLInputElement>(null);
  const [ghost, setGhost] = useState<{ label: string; x: number; y: number } | null>(null);
  const [dimArmed, setDimArmed] = useState(false);
  const projectRef = useRef<(clientX: number, clientY: number) => number | null>(() => null);
  const pending = useRef<{ kind: ItemKind; x: number; y: number; moved: boolean } | null>(null);
  const addRef = useRef<(kind: ItemKind, atX?: number | null) => void>(() => undefined);

  const located = findItem(draft, selectedId);
  const selected = located?.item ?? null;
  const activeSide = draft.sides.find((side) => side.id === activeRun) ?? null;
  const focusItem = Boolean(selected) || selectedId === WC_ID || selectedId === SHOWER_ID || draft.sides.some((side) => side.id === selectedId);
  const rows = useMemo(() => [...quote].sort((a, b) => a.serial - b.serial), [quote]);
  const amount = showerAmount(draft);

  useEffect(() => {
    saveCompany(company);
  }, [company]);
  useEffect(() => {
    saveCustomer(customer);
  }, [customer]);
  useEffect(() => {
    saveQuoteNo(quoteNo);
  }, [quoteNo]);
  useEffect(() => {
    saveWork({ unit, draft, quote, nextSerial, editingSerial, fileMode, activeRun });
  }, [unit, draft, quote, nextSerial, editingSerial, fileMode, activeRun]);
  useEffect(() => {
    if (activeRun !== "front" && !draft.sides.some((side) => side.id === activeRun)) setActiveRun("front");
  }, [draft.sides, activeRun]);

  function addKind(kind: ItemKind, atX?: number | null) {
    if (kind === "return") {
      let id = "";
      setDraft((current) => {
        const next = withItem(current, "return", atX, activeRun);
        id = next.sides[next.sides.length - 1]?.id ?? "";
        return next;
      });
      if (id) setActiveRun(id);
      setSelectedId(null);
      return;
    }
    let created = "";
    setDraft((current) => {
      const next = withItem(current, kind, atX, activeRun);
      const pool = activeRun === "front" ? next.items : (next.sides.find((side) => side.id === activeRun)?.items ?? []);
      created = pool[pool.length - 1]?.id ?? "";
      return next;
    });
    if (created) setSelectedId(created);
  }

  addRef.current = addKind;

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = pending.current;
      if (!drag) return;
      if (Math.abs(event.clientX - drag.x) > 4 || Math.abs(event.clientY - drag.y) > 4) drag.moved = true;
      if (drag.moved) {
        const label = PALETTE.find((item) => item.kind === drag.kind)?.label ?? drag.kind;
        setGhost({ label, x: event.clientX + 12, y: event.clientY + 12 });
      }
    };
    const up = (event: PointerEvent) => {
      const drag = pending.current;
      if (!drag) return;
      pending.current = null;
      setGhost(null);
      const mm = projectRef.current(event.clientX, event.clientY);
      if (mm != null) addRef.current(drag.kind, mm);
      else if (!drag.moved) addRef.current(drag.kind, null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  function patchSelected(patch: Partial<PlacedItem>) {
    if (!selected) return;
    setDraft((current) => patchItem(current, selected.id, patch));
  }

  function placeFixture(kind: "wc" | "shower") {
    setDraft((current) => {
      const depth = current.depth > 50 ? current.depth : 900;
      if (kind === "wc") {
        return {
          ...current,
          useDepth: true,
          depth,
          wc: {
            ...current.wc,
            enabled: true,
            x: current.wc.enabled ? current.wc.x : Math.round(current.width * 0.2),
            y: current.wc.enabled ? current.wc.y : Math.round(depth * 0.38),
          },
        };
      }
      return {
        ...current,
        useDepth: true,
        depth,
        showerPoint: {
          ...current.showerPoint,
          enabled: true,
          x: current.showerPoint.enabled ? current.showerPoint.x : Math.round(current.width * 0.55),
          y: current.showerPoint.enabled ? current.showerPoint.y : Math.round(depth * 0.42),
          height: current.showerPoint.height || 1900,
        },
      };
    });
    setSelectedId(kind === "wc" ? WC_ID : SHOWER_ID);
  }

  function patchFixture(kind: "wc" | "shower", patch: Partial<{ x: number; y: number; facing: PlanFacing; height: number; enabled: boolean }>) {
    setDraft((current) => {
      const point = kind === "wc" ? current.wc : current.showerPoint;
      const next = { ...point, ...patch };
      const placed = clampFixturePoint(current, next.x, next.y);
      const fixed = { ...next, x: placed.x, y: placed.y };
      return kind === "wc" ? { ...current, wc: fixed } : { ...current, showerPoint: fixed };
    });
  }

  function placeWall(wall: PlacedItem, edge: "left" | "right") {
    const host = draft.items.find((item) => item.id === wall.wallHost && (item.kind === "fixed" || item.kind === "door"));
    if (!host) return;
    const x = edge === "left" ? host.x : host.x + host.width - wall.width;
    patchSelected({ x });
  }

  function setMaterial(patch: Partial<Material>) {
    setDraft((current) => ({ ...current, material: { ...current.material, ...patch } }));
  }

  function setProfilePart(key: "profileFace" | "profileDepth", mm: number) {
    setDraft((current) => {
      const material = { ...current.material, [key]: Math.max(1, mm) };
      material.profileName = `${formatMm(material.profileFace)} × ${formatMm(material.profileDepth)}`;
      return { ...current, material };
    });
  }

  function newQuote() {
    if (!window.confirm("Start a new quote? The showers on this quote will be cleared. Company and customer details stay.")) return;
    setQuote([]);
    setDraft(cloneShower({ width: 2000, height: 2100, depth: 900 } as Shower));
    setNextSerial(1);
    setEditingSerial(null);
    setSelectedId(null);
    setActiveRun("front");
    setQuoteOpen(false);
    setDocOpen(false);
    setStatus("New quote. Company and customer details stay.");
  }

  function commitQuote() {
    if (editingSerial != null) {
      const serial = editingSerial;
      setQuote((list) => list.map((entry) => (entry.serial === serial ? { serial, shower: cloneShower(draft) } : entry)));
      setEditingSerial(null);
      setStatus(`Saved to S.No ${serial}. That row kept its serial number.`);
      return;
    }
    const serial = nextSerial;
    const savedShower = cloneShower(draft);
    setQuote((list) => [...list, { serial, shower: savedShower }]);
    setNextSerial(serial + 1);
    setDraft(clearPlacedDesign(draft));
    setSelectedId(null);
    setActiveRun("front");
    setDimArmed(false);
    setStatus(`Added as S.No ${serial}.`);
  }

  function clearCanvas() {
    setDraft((current) => clearPlacedDesign(current));
    setSelectedId(null);
    setActiveRun("front");
    setDimArmed(false);
  }

  function beginEdit(serial: number) {
    const entry = quote.find((row) => row.serial === serial);
    if (!entry) return;
    setDraft(cloneShower(entry.shower));
    setEditingSerial(serial);
    setSelectedId(null);
    setActiveRun("front");
    setQuoteOpen(false);
    setDocOpen(false);
    setStatus(`Editing S.No ${serial}. Saving keeps this serial number.`);
  }

  function cancelEdit() {
    if (editingSerial == null) return;
    const entry = quote.find((row) => row.serial === editingSerial);
    if (entry) setDraft(cloneShower(entry.shower));
    setEditingSerial(null);
    setSelectedId(null);
    setStatus("Edit cancelled. The quote row was left as saved.");
  }

  function removeEntry(serial: number) {
    setQuote((list) => list.filter((entry) => entry.serial !== serial));
    if (editingSerial === serial) {
      setEditingSerial(null);
      setSelectedId(null);
    }
    setStatus(`Removed S.No ${serial}. Other serial numbers stay as they are.`);
  }

  function saveSetup() {
    const name = setupName.trim() || `Setup ${setups.length + 1}`;
    const channels = selected?.channels ?? draft.ceiling.channels;
    const setup: SavedSetup = {
      id: uid("s"),
      name,
      material: { ...draft.material },
      channels: { ...channels },
    };
    const next = [...setups, setup];
    setSetups(next);
    saveSetups(next);
    setSetupPick(setup.id);
    setSetupName("");
    setStatus(`Saved “${name}”. Apply it on the next shower.`);
  }

  function applySetup() {
    const setup = setups.find((item) => item.id === setupPick);
    if (!setup) return;
    setDraft((current) => ({
      ...current,
      material: { ...setup.material },
      ceiling: { ...current.ceiling, channels: { ...setup.channels } },
      items: current.items.map((item) => (item.kind === "wall" ? item : { ...item, channels: { ...setup.channels } })),
      sides: current.sides.map((side) => ({
        ...side,
        items: side.items.map((item) => (item.kind === "wall" ? item : { ...item, channels: { ...setup.channels } })),
      })),
    }));
    setStatus(`Applied “${setup.name}”.`);
  }

  function downloadBackup() {
    const payload = {
      app: BACKUP_APP,
      version: 1,
      savedAt: new Date().toISOString(),
      unit,
      quoteNo,
      fileMode,
      activeRun,
      nextSerial,
      editingSerial,
      company,
      customer,
      draft,
      quote,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFileName(customer.name, quoteNo);
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Backup downloaded.");
  }

  function readBackup(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseBackup(JSON.parse(String(reader.result)));
        if (!parsed) {
          setStatus("This file is not a backup from this app.");
          return;
        }
        history.current.past = [];
        history.current.future = [];
        setHistoryTick((tick) => tick + 1);
        setUnit(parsed.unit);
        setDraftState(parsed.draft);
        setQuote(parsed.quote);
        setNextSerial(parsed.nextSerial);
        setEditingSerial(parsed.editingSerial);
        setFileMode(parsed.fileMode);
        setActiveRun(parsed.activeRun);
        setCompany(parsed.company);
        setCustomer(parsed.customer);
        setQuoteNo(parsed.quoteNo);
        setSelectedId(null);
        setStatus("Backup loaded. You can keep editing.");
      } catch {
        setStatus("This file is not a backup from this app.");
      }
    };
    reader.readAsText(file);
  }

  function paletteDown(event: ReactPointerEvent, kind: ItemKind) {
    event.preventDefault();
    pending.current = { kind, x: event.clientX, y: event.clientY, moved: false };
  }

  const fixedChoices = draft.items.filter((item) => item.kind === "fixed");
  const doorChoices = draft.items.filter((item) => item.kind === "door");

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo" src={BRAND_LOGO} alt="" data-testid="app-logo" />
          <div>
            <h1 data-testid="app-title">ALLUKRAFT<sup>™</sup> Bath Studio</h1>
            <p className="brand-tagline" data-testid="app-tagline">Showers • Mirrors • Cubicles</p>
          </div>
        </div>
        <p className="top-note" data-testid="serial-preview">
          {editingSerial != null ? `Editing S.No ${editingSerial}` : `Next S.No ${nextSerial}`}
        </p>
        <div className="quote-tools">
          <label className="stack quote-unit">
            Quote unit
            <select data-testid="unit-select" aria-label="Quote unit" value={unit} onChange={(event) => setUnit(event.target.value as UnitId)}>
              {UNITS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="quote-launcher" data-testid="open-quote" aria-expanded={quoteOpen} onClick={() => setQuoteOpen(true)}>
            Quote / Showers
            <span>{rows.length}</span>
          </button>
          <p className="product-grand" data-testid="product-grand">
            <span>Grand total {inr(quoteSubtotal(rows))}</span>
            <span>GST 18% {inr(quoteSubtotal(rows) * GST_RATE)}</span>
            <span>G.Total {inr(quoteSubtotal(rows) * (1 + GST_RATE))}</span>
          </p>
          <button type="button" className="quote-launcher secondary" data-testid="generate-quote" onClick={() => setDocOpen(true)}>
            Generate quote
          </button>
          <button type="button" className="quote-launcher secondary" data-testid="new-quote" onClick={newQuote}>
            New quote
          </button>
          <button type="button" className="top-mini" data-testid="download-backup" onClick={downloadBackup}>
            Download backup
          </button>
          <button type="button" className="top-mini" data-testid="upload-backup" onClick={() => backupRef.current?.click()}>
            Upload backup
          </button>
          <input
            ref={backupRef}
            data-testid="backup-file"
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) readBackup(file);
            }}
          />
        </div>
      </header>

      <aside className="panel controls">
        {draft.sides.some((side) => side.id === selectedId) && (
          <aside className="item-dock" data-testid="item-editor" aria-label="Partition">
            <h2>Partition</h2>
            <PartitionFields
              side={draft.sides.find((side) => side.id === selectedId)!}
              shower={draft}
              unit={unit}
              onChange={(patch) => selectedId && setDraft((current) => updateSide(current, selectedId, patch))}
              onRemove={() => {
                if (!selectedId) return;
                setDraft((current) => removeSide(current, selectedId));
                setSelectedId(null);
                setActiveRun("front");
              }}
            />
          </aside>
        )}
        {(selectedId === WC_ID || selectedId === SHOWER_ID) && (
          <aside className="item-dock" data-testid="item-editor" aria-label={selectedId === WC_ID ? "WC" : "Shower"}>
            <h2>{selectedId === WC_ID ? "WC" : "Shower"}</h2>
            <FixturePlace
              kind={selectedId === WC_ID ? "wc" : "shower"}
              shower={draft}
              unit={unit}
              onChange={(patch) => patchFixture(selectedId === WC_ID ? "wc" : "shower", patch)}
            />
            {selectedId === SHOWER_ID && (
              <LengthField label="Height" testId="fixture-height" mm={draft.showerPoint.height} unit={unit} onChange={(mm) => patchFixture("shower", { height: mm })} />
            )}
            <button type="button" className="danger" data-testid="remove-fixture" onClick={() => { patchFixture(selectedId === WC_ID ? "wc" : "shower", { enabled: false }); setSelectedId(null); }}>
              Remove
            </button>
          </aside>
        )}
        {selected && (
          <aside className="item-dock" data-testid="item-editor" aria-label={itemTitle(selected)}>
            <h2>{itemTitle(selected)}</h2>
            <div key={selected.id}>
              <div className="field-row">
                <LengthField label="Position" testId="item-x" mm={selected.x} unit={unit} onChange={(mm) => patchSelected({ x: mm })} />
                <LengthField label="Width" testId="item-width" mm={selected.width} unit={unit} onChange={(mm) => patchSelected({ width: mm })} />
              </div>
              <LengthField label="Height" testId="item-height" mm={selected.height} unit={unit} onChange={(mm) => patchSelected({ height: mm })} />
              {selected.kind === "wall" && (
                <>
                  <label className="stack">
                    Sits on
                    <select
                      data-testid="wall-panel"
                      value={selected.wallHost}
                      onChange={(event) => patchSelected({ wallHost: event.target.value })}
                    >
                      <option value="">Typed position</option>
                      {draft.items.filter((item) => item.kind === "fixed" || item.kind === "door").map((item) => (
                        <option key={item.id} value={item.id}>{itemTitle(item)} · {formatMm(item.width)}</option>
                      ))}
                    </select>
                  </label>
                  <div className="toggle" role="group" aria-label="Wall edge">
                    <button type="button" data-testid="wall-left" onClick={() => placeWall(selected, "left")}>Left</button>
                    <button type="button" data-testid="wall-right" onClick={() => placeWall(selected, "right")}>Right</button>
                  </div>
                  <div className="toggle" role="group" aria-label="Wall cut">
                    <button type="button" data-testid="wall-notch" aria-pressed={selected.wallCut !== "overlap"} onClick={() => patchSelected({ wallCut: "notch" satisfies WallCut })}>Notch</button>
                    <button type="button" data-testid="wall-overlap" aria-pressed={selected.wallCut === "overlap"} onClick={() => patchSelected({ wallCut: "overlap" satisfies WallCut })}>Overlap</button>
                  </div>
                  <div className="toggle" role="group" aria-label="Wall face">
                    <button type="button" data-testid="wall-outside" aria-pressed={selected.wallSide !== "inside"} onClick={() => patchSelected({ wallSide: "outside" satisfies WallFace })}>Outside</button>
                    <button type="button" data-testid="wall-inside" aria-pressed={selected.wallSide === "inside"} onClick={() => patchSelected({ wallSide: "inside" satisfies WallFace })}>Inside</button>
                  </div>
                  <label className="check depth-check">
                    <input data-testid="cut-fee" type="checkbox" checked={selected.cutFee} onChange={(event) => patchSelected({ cutFee: event.target.checked })} />
                    Extra cut charge
                  </label>
                  {selected.cutFee && (
                    <label className="stack">
                      Cut charge
                      <NumberField testId="cut-fee-amount" value={selected.cutFeeAmount} onChange={(cutFeeAmount) => patchSelected({ cutFeeAmount })} />
                    </label>
                  )}
                </>
              )}
              {selected.kind === "return" && (
                <LengthField label="Return depth" testId="return-depth" mm={selected.depth} unit={unit} onChange={(mm) => patchSelected({ depth: mm })} />
              )}
              {selected.kind === "door" && (
                <>
                  <div className="toggle" role="group" aria-label="Door type">
                    <button type="button" data-testid="door-sliding" aria-pressed={selected.doorStyle === "sliding"} onClick={() => patchSelected({ doorStyle: "sliding" })}>Sliding</button>
                    <button type="button" data-testid="door-openable" aria-pressed={selected.doorStyle === "openable"} onClick={() => patchSelected({ doorStyle: "openable" })}>Openable</button>
                  </div>
                  <div className="handle-row">
                    <span>Handle side</span>
                    <div className="toggle mini">
                      <button type="button" data-testid="handle-left" aria-pressed={selected.handleSide === "left"} onClick={() => patchSelected({ handleSide: "left" satisfies Side })}>Left</button>
                      <button type="button" data-testid="handle-right" aria-pressed={selected.handleSide === "right"} onClick={() => patchSelected({ handleSide: "right" })}>Right</button>
                    </div>
                  </div>
                  <div className="handle-row">
                    <span>Opens</span>
                    <div className="toggle mini" role="group" aria-label="Door swing">
                      <button type="button" data-testid="swing-inside" aria-pressed={selected.swing !== "outside"} onClick={() => patchSelected({ swing: "inside" satisfies DoorSwing })}>Inside</button>
                      <button type="button" data-testid="swing-outside" aria-pressed={selected.swing === "outside"} onClick={() => patchSelected({ swing: "outside" satisfies DoorSwing })}>Outside</button>
                    </div>
                  </div>
                  <label className="stack">
                    Door fill
                    <input data-testid="door-fill-name" value={selected.doorFillName} placeholder="Glass, laminate, HPL, film" onChange={(event) => patchSelected({ doorFillName: event.target.value })} />
                  </label>
                  <label className="stack">
                    Fill colour
                    <input data-testid="door-fill-colour" value={selected.doorFillColour} placeholder="#d8d2c8 or a colour name" onChange={(event) => patchSelected({ doorFillColour: event.target.value })} />
                  </label>
                  <label className="stack">
                    Fill image
                    <input
                      data-testid="door-fill-file"
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => patchSelected({ doorFillImage: String(reader.result || "") });
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {selected.doorStyle === "sliding" && (
                    <>
                      <label className="stack">
                        Wheel name
                        <input data-testid="wheel-name" value={selected.wheelName} placeholder="Wheel" onChange={(event) => patchSelected({ wheelName: event.target.value })} />
                      </label>
                      <label className="check depth-check">
                        <input data-testid="soft-close" type="checkbox" checked={selected.softClose} onChange={(event) => patchSelected({ softClose: event.target.checked })} />
                        Soft-closing
                      </label>
                      <div className="field-row">
                        <LengthField label="Top cover" testId="top-cover" mm={selected.topCover} unit={unit} onChange={(mm) => patchSelected({ topCover: mm })} />
                        <LengthField label="Track" testId="track-size" mm={selected.trackSize} unit={unit} onChange={(mm) => patchSelected({ trackSize: mm })} />
                      </div>
                      <label className="stack">
                        Door sits
                        <select data-testid="slide-seat" value={selected.slideSeat} onChange={(event) => patchSelected({ slideSeat: event.target.value as SlideSeat })}>
                          <option value="outside">Outside the fixed glass</option>
                          <option value="inside">Inside the fixed glass</option>
                        </select>
                      </label>
                    </>
                  )}
                  {selected.doorStyle === "openable" && (
                    <>
                      <label className="check depth-check">
                        <input data-testid="outer-frame-toggle" type="checkbox" checked={selected.outerFrame} onChange={(event) => patchSelected({ outerFrame: event.target.checked })} />
                        Outer frame around the door
                      </label>
                      <div className="field-row">
                        <label className="stack">
                          Hinge name
                          <input data-testid="hinge-name" value={selected.hingeName} onChange={(event) => patchSelected({ hingeName: event.target.value })} />
                        </label>
                        <label className="stack">
                          Hinge count
                          <NumberField testId="hinge-count" value={selected.hingeCount} min={2} onChange={(hingeCount) => patchSelected({ hingeCount: Math.max(2, Math.round(hingeCount)) })} />
                        </label>
                      </div>
                    </>
                  )}
                  <HandleEditor item={selected} unit={unit} onChange={patchSelected} />
                  <button type="button" className="primary" data-testid="apply-hardware" onClick={() => setMaterial({ hardware: describeHardware(draft) })}>
                    Apply hardware
                  </button>
                </>
              )}
              {selected.kind !== "wall" && (
                <ChannelFields channels={selected.channels} testPrefix="channel" onChange={(channels) => patchSelected({ channels })} />
              )}
              <ExtraHardwareFields shower={draft} onChange={setDraft} />
              <button type="button" className="danger" onClick={() => { setDraft((current) => removeItem(current, selected.id)); setSelectedId(null); }}>
                Remove item
              </button>
            </div>
          </aside>
        )}
        <section>
          <h2>Shower size</h2>
          <div className="toggle" role="group" aria-label="Product">
            <button type="button" data-testid="product-shower" aria-pressed={draft.product !== "cubicle"} onClick={() => setDraft((current) => normalizeShower({ ...current, product: "shower" satisfies ProductKind }))}>Shower</button>
            <button type="button" data-testid="product-cubicle" aria-pressed={draft.product === "cubicle"} onClick={() => setDraft((current) => normalizeShower({ ...current, product: "cubicle" satisfies ProductKind }))}>Cubicle</button>
          </div>
          {draft.product === "cubicle" && (
            <div data-testid="cubicle-fields">
              <p className="hint">Cubicle: HPL on legs, slim headrail.</p>
              <div className="field-row">
                <LengthField
                  label="Bottom gap"
                  testId="cubicle-gap"
                  mm={draft.cubicle.gap}
                  unit={unit}
                  onChange={(mm) =>
                    setDraft((current) =>
                      normalizeShower({
                        ...current,
                        cubicle: {
                          ...current.cubicle,
                          gap: mm,
                          legHeight: current.cubicle.legHeight === current.cubicle.gap ? mm : current.cubicle.legHeight,
                        },
                      }),
                    )
                  }
                />
                <LengthField label="Door top clearance" testId="cubicle-door-clear" mm={draft.cubicle.doorClearance} unit={unit} onChange={(mm) => setDraft((current) => normalizeShower({ ...current, cubicle: { ...current.cubicle, doorClearance: mm } }))} />
              </div>
              <div className="field-row">
                <label className="stack">
                  Legs
                  <NumberField testId="cubicle-leg-qty" value={draft.cubicle.legQty} min={0} onChange={(legQty) => setDraft((current) => normalizeShower({ ...current, cubicle: { ...current.cubicle, legQty } }))} />
                </label>
                <LengthField label="Leg height" testId="cubicle-leg-height" mm={draft.cubicle.legHeight} unit={unit} onChange={(mm) => setDraft((current) => normalizeShower({ ...current, cubicle: { ...current.cubicle, legHeight: mm } }))} />
              </div>
              <label className="stack">
                Leg material
                <select data-testid="cubicle-leg-material" value={draft.cubicle.legMaterial} onChange={(event) => setDraft((current) => normalizeShower({ ...current, cubicle: { ...current.cubicle, legMaterial: event.target.value as LegMaterial } }))}>
                  <option value="SS305">SS305</option>
                  <option value="Nylon">Nylon</option>
                  <option value="Iron">Iron</option>
                  <option value="Aluminium">Aluminium</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label className="stack">
                Custom leg name
                <input data-testid="cubicle-leg-name" value={draft.cubicle.legName} placeholder="Type a material name" onChange={(event) => setDraft((current) => normalizeShower({ ...current, cubicle: { ...current.cubicle, legName: event.target.value } }))} />
              </label>
              <RateAmount
                testId="cubicle-leg"
                rateTestId="cubicle-leg-rate"
                areaLabel="Legs"
                basis={draft.cubicle.legQty}
                rate={pricePair(draft.cubicle.legRate, draft.cubicle.legAmount, draft.cubicle.legQty, draft.cubicle.legPriceFrom).rate}
                amount={pricePair(draft.cubicle.legRate, draft.cubicle.legAmount, draft.cubicle.legQty, draft.cubicle.legPriceFrom).amount}
                onRate={(next) => setDraft((current) => ({ ...current, cubicle: { ...current.cubicle, legPriceFrom: "rate", legRate: money(next) } }))}
                onAmount={(next) => setDraft((current) => ({ ...current, cubicle: { ...current.cubicle, legPriceFrom: "amount", legAmount: money(next) } }))}
              />
              <div className="toggle" role="group" aria-label="Top rail">
                <button type="button" data-testid="rail-aluminium" aria-pressed={draft.cubicle.railMaterial !== "SS"} onClick={() => setDraft((current) => normalizeShower({ ...current, cubicle: { ...current.cubicle, railMaterial: "Aluminium" satisfies RailMaterial } }))}>Aluminium</button>
                <button type="button" data-testid="rail-ss" aria-pressed={draft.cubicle.railMaterial === "SS"} onClick={() => setDraft((current) => normalizeShower({ ...current, cubicle: { ...current.cubicle, railMaterial: "SS" satisfies RailMaterial } }))}>SS</button>
              </div>
              <RateAmount
                testId="cubicle-rail"
                rateTestId="cubicle-rail-rate"
                areaLabel="Rail"
                basis={1}
                rate={pricePair(draft.cubicle.railRate, draft.cubicle.railAmount, 1, draft.cubicle.railPriceFrom).rate}
                amount={pricePair(draft.cubicle.railRate, draft.cubicle.railAmount, 1, draft.cubicle.railPriceFrom).amount}
                onRate={(next) => setDraft((current) => ({ ...current, cubicle: { ...current.cubicle, railPriceFrom: "rate", railRate: money(next) } }))}
                onAmount={(next) => setDraft((current) => ({ ...current, cubicle: { ...current.cubicle, railPriceFrom: "amount", railAmount: money(next) } }))}
              />
            </div>
          )}
          <div className="field-row">
            <LengthField label="Width" testId="width-input" mm={draft.width} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, width: Math.max(10, mm) }))} />
            <LengthField label="Height" testId="height-input" mm={draft.height} unit={unit} onChange={(mm) => setDraft((current) => normalizeShower({ ...current, height: Math.max(10, mm) }))} />
          </div>
          <LengthField label="Bathroom depth" testId="depth-input" mm={draft.depth} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, depth: Math.max(0, mm) }))} />
          <label className="stack">
            Location
            <input
              data-testid="location-input"
              value={draft.location}
              placeholder="MBR, CMR, Parents bedroom"
              onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
            />
          </label>
          <label className="check depth-check">
            <input
              data-testid="use-depth"
              type="checkbox"
              checked={draft.useDepth}
              onChange={(event) => setDraft((current) => ({ ...current, useDepth: event.target.checked }))}
            />
            Show bathroom depth
          </label>
          <p className="balance-panel" data-testid="balance-width">
            Opening {formatLength(draft.width, unit)} {unit}
            {" · "}Used {formatLength(usedWidth(draft.items), unit)} {unit}
            {" · "}Balance {formatLength(balanceWidth(draft.width, draft.items), unit)} {unit}
          </p>
          <p className="hint" data-testid="area-balance">
            Area {designedSqFt(draft).toFixed(2)} sq ft of {openingSqFt(draft.width, draft.height).toFixed(2)} sq ft.
          </p>
        </section>

        <section>
          <h2>Palette</h2>
          {(draft.sides.length > 0 || activeRun !== "front") && (
            <>
              <div className="run-switch" role="group" aria-label="Which run">
                <button type="button" data-testid="run-front" aria-pressed={activeRun === "front"} onClick={() => { setActiveRun("front"); setSelectedId(null); }}>
                  Front
                </button>
                {draft.sides.map((side) => (
                  <button
                    key={side.id}
                    type="button"
                    data-testid="run-side"
                    aria-pressed={activeRun === side.id}
                    onClick={() => { setActiveRun(side.id); setSelectedId(null); }}
                  >
                    {side.name}
                  </button>
                ))}
              </div>
            </>
          )}
          {activeSide && !focusItem && (
            <div className="side-box">
              <PartitionFields
                side={activeSide}
                shower={draft}
                unit={unit}
                onChange={(patch) => setDraft((current) => updateSide(current, activeSide.id, patch))}
                onRemove={() => { setDraft((current) => removeSide(current, activeSide.id)); setActiveRun("front"); }}
              />
            </div>
          )}
          <div className="palette">
            {PALETTE.map((item) => (
              <div key={item.kind} className="palette-item" data-testid={`palette-${item.kind}`} onPointerDown={(event) => paletteDown(event, item.kind)}>
                <strong>{item.label}</strong>
                <span>{item.note}</span>
              </div>
            ))}
          </div>
          <div className="row-actions three">
            <button type="button" data-testid="add-fixed" onClick={() => addKind("fixed")}>Add fixed</button>
            <button type="button" data-testid="add-door" onClick={() => addKind("door")}>Add door</button>
            <button type="button" data-testid="add-wall" onClick={() => addKind("wall")}>Add wall</button>
          </div>
          <div className="row-actions">
            <button type="button" data-testid="add-return" onClick={() => addKind("return")}>Add return</button>
            <button type="button" data-testid="add-wc" onClick={() => placeFixture("wc")}>{draft.wc.enabled ? "Edit WC" : "Add WC"}</button>
            <button type="button" data-testid="add-shower" onClick={() => placeFixture("shower")}>{draft.showerPoint.enabled ? "Edit shower" : "Add shower"}</button>
            <button
              type="button"
              data-testid="clear-items"
              onClick={() => {
                setDraft((current) =>
                  activeRun === "front"
                    ? { ...current, items: [] }
                    : { ...current, sides: current.sides.map((side) => (side.id === activeRun ? { ...side, items: [] } : side)) },
                );
                setSelectedId(null);
              }}
            >
              Clear frame
            </button>
          </div>
          {draft.items.length + draft.sides.reduce((sum, side) => sum + side.items.length, 0) > 0 && (
            <ul className="item-list">
              {draft.items.map((item) => (
                <li key={item.id}>
                  <button type="button" data-testid="item-select" data-kind={item.kind} data-id={item.id} aria-pressed={item.id === selectedId} onClick={() => { setActiveRun("front"); setSelectedId(item.id); }}>
                    Front · {itemTitle(item)} · {formatLength(item.width, unit)} {unit}
                  </button>
                </li>
              ))}
              {draft.sides.map((side) =>
                side.items.map((item) => (
                  <li key={item.id}>
                    <button type="button" data-testid="item-select" data-kind={item.kind} data-id={item.id} aria-pressed={item.id === selectedId} onClick={() => { setActiveRun(side.id); setSelectedId(item.id); }}>
                      {side.name} · {itemTitle(item)} · {formatLength(item.width, unit)} {unit}
                    </button>
                  </li>
                )),
              )}
            </ul>
          )}
        </section>

        {!focusItem && (
        <section>
          <h2>Top fixed glass</h2>
          {draft.topFixed.enabled ? (
            <>
              <LengthField
                label="Top height"
                testId="top-fixed-height"
                mm={draft.topFixed.height}
                unit={unit}
                onChange={(mm) =>
                  setDraft((current) => ({
                    ...current,
                    topFixed: { ...current.topFixed, height: clamp(mm, 10, Math.max(10, current.height - 40)) },
                  }))
                }
              />
              <label className="stack">
                Width
                <select
                  data-testid="top-fixed-span"
                  value={draft.topFixed.span}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      topFixed: { ...current.topFixed, span: event.target.value as TopSpan },
                    }))
                  }
                >
                  <option value="full">Full width (poora)</option>
                  <option value="fixed">Match the fixed panel below</option>
                  <option value="door">Match the door below</option>
                  <option value="custom">Custom width and position</option>
                </select>
              </label>
              {draft.topFixed.span === "fixed" && (
                <AlignPick
                  testId="top-fixed-align"
                  items={fixedChoices}
                  value={draft.topFixed.alignId}
                  unit={unit}
                  empty="Add a fixed panel to match."
                  onChange={(alignId) => setDraft((current) => ({ ...current, topFixed: { ...current.topFixed, alignId } }))}
                />
              )}
              {draft.topFixed.span === "door" && (
                <AlignPick
                  testId="top-fixed-align"
                  items={doorChoices}
                  value={draft.topFixed.alignId}
                  unit={unit}
                  empty="Add a door to match."
                  onChange={(alignId) => setDraft((current) => ({ ...current, topFixed: { ...current.topFixed, alignId } }))}
                />
              )}
              {draft.topFixed.span === "custom" && (
                <div className="field-row">
                  <LengthField label="Position" testId="top-fixed-x" mm={draft.topFixed.x} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, topFixed: { ...current.topFixed, x: mm } }))} />
                  <LengthField label="Custom width" testId="top-fixed-width-input" mm={draft.topFixed.width || draft.width} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, topFixed: { ...current.topFixed, width: mm } }))} />
                </div>
              )}
              <ChannelFields
                channels={draft.topFixed.channels}
                testPrefix="top-fixed-channel"
                onChange={(channels) => setDraft((current) => ({ ...current, topFixed: { ...current.topFixed, channels } }))}
              />
              <button type="button" data-testid="remove-top-fixed" onClick={() => setDraft((current) => ({ ...current, topFixed: { ...current.topFixed, enabled: false } }))}>
                Remove top fixed
              </button>
            </>
          ) : (
            <button
              type="button"
              data-testid="add-top-fixed"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  topFixed: {
                    ...current.topFixed,
                    enabled: true,
                    auto: false,
                    span: current.topFixed.span || "full",
                    height: clamp(Math.round(current.height * 0.18), 80, Math.max(80, current.height - 200)),
                    width: current.topFixed.width || current.width,
                  },
                }))
              }
            >
              Add top fixed
            </button>
          )}
        </section>
        )}

        <section>
          <h2>Material</h2>
          <div className="toggle" role="group" aria-label="Finish">
            <button type="button" data-testid="finish-profile" aria-pressed={draft.material.finish === "profile"} onClick={() => setMaterial({ finish: "profile" satisfies Finish })}>Profiles</button>
            <button type="button" data-testid="finish-glass" aria-pressed={draft.material.finish === "glass"} onClick={() => setMaterial({ finish: "glass" })}>Glass only</button>
          </div>
          <div className="field-row">
            <LengthField label="Face" testId="profile-face" mm={draft.material.profileFace} unit={unit} onChange={(mm) => setProfilePart("profileFace", mm)} />
            <LengthField label="Depth" testId="profile-depth" mm={draft.material.profileDepth} unit={unit} onChange={(mm) => setProfilePart("profileDepth", mm)} />
          </div>
          <label className="check depth-check">
            <input
              data-testid="print-section"
              type="checkbox"
              checked={draft.material.printSection !== false}
              onChange={(event) => {
                const on = event.target.checked;
                setMaterial(
                  on
                    ? { printSection: true }
                    : { printSection: false, quoteFace: draft.material.quoteFace || 16, quoteDepth: draft.material.quoteDepth || 45 },
                );
              }}
            />
            Print this section size
          </label>
          {draft.material.printSection === false && (
            <div className="field-row" data-testid="quote-section">
              <LengthField label="Actual face" testId="quote-face" mm={draft.material.quoteFace || 16} unit={unit} onChange={(quoteFace) => setMaterial({ quoteFace: Math.max(1, quoteFace) })} />
              <LengthField label="Actual depth" testId="quote-depth" mm={draft.material.quoteDepth || 45} unit={unit} onChange={(quoteDepth) => setMaterial({ quoteDepth: Math.max(1, quoteDepth) })} />
            </div>
          )}
          <label className="stack">
            Profile name
            <input data-testid="profile-name" value={draft.material.profileName} onChange={(event) => setMaterial({ profileName: event.target.value })} />
          </label>
          <ColourField label="Colour" testId="colour" value={draft.material.colour} onChange={(colour) => setMaterial({ colour })} />
          <div className="toggle" role="group" aria-label="Origin">
            <button type="button" data-testid="origin-imported" aria-pressed={draft.material.origin === "Imported"} onClick={() => setMaterial({ origin: "Imported" satisfies Origin })}>Imported</button>
            <button type="button" data-testid="origin-indian" aria-pressed={draft.material.origin === "Indian"} onClick={() => setMaterial({ origin: "Indian" })}>Indian</button>
          </div>
          <div className="toggle" role="group" aria-label="Infill">
            <button type="button" data-testid="infill-glass" aria-pressed={draft.material.infill === "glass"} onClick={() => setMaterial({ infill: "glass" satisfies Infill })}>Glass</button>
            <button type="button" data-testid="infill-sheet" aria-pressed={draft.material.infill === "sheet"} onClick={() => setMaterial({ infill: "sheet" })}>Sheet</button>
          </div>
          {draft.material.infill === "glass" ? (
            <SpecFields
              title="Glass specification"
              spec={draft.material.glass}
              testPrefix="glass"
              onChange={(glass) => setMaterial({ glass })}
            />
          ) : (
            <>
              <SpecFields
                title="Sheet specification"
                spec={draft.material.sheet}
                testPrefix="sheet"
                onChange={(sheet) => setMaterial({ sheet: { ...draft.material.sheet, ...sheet } })}
              />
              <label className="stack">
                Metal / material
                <input data-testid="sheet-metal" value={draft.material.sheet.metal} onChange={(event) => setMaterial({ sheet: { ...draft.material.sheet, metal: event.target.value } })} />
              </label>
              <label className="stack">
                Sheet colour
                <input data-testid="sheet-colour" value={draft.material.sheet.colour} onChange={(event) => setMaterial({ sheet: { ...draft.material.sheet, colour: event.target.value } })} />
              </label>
            </>
          )}
          <label className="stack">
            Hardware
            <input data-testid="hardware-name" value={draft.material.hardware} onChange={(event) => setMaterial({ hardware: event.target.value })} />
          </label>
          <label className="check depth-check">
            <input
              data-testid="hardware-match"
              type="checkbox"
              checked={draft.material.hardwareMatchProfile}
              onChange={(event) => {
                const on = event.target.checked;
                setMaterial(
                  on
                    ? { hardwareMatchProfile: true }
                    : { hardwareMatchProfile: false, hardwareColourName: draft.material.hardwareColourName || draft.material.colour },
                );
              }}
            />
            Same colour as profile
          </label>
          {!draft.material.hardwareMatchProfile && (
            <>
              <ColourField
                label="Hardware colour"
                testId="hardware-colour"
                value={draft.material.hardwareColour}
                onChange={(hardwareColour) => setMaterial({ hardwareColour, hardwareColourName: hardwareColour })}
              />
              <label className="stack">
                Colour name
                <input
                  data-testid="hardware-colour-name"
                  value={draft.material.hardwareColourName}
                  placeholder="Grey, Brush Gold, or a typed name"
                  onChange={(event) => setMaterial({ hardwareColourName: event.target.value })}
                />
              </label>
            </>
          )}
          <h3 className="subhead">Rate and amount</h3>
          <p className="hint" data-testid="package-size-ref">
            {actualSqFt(draft).toFixed(2)} sq ft · {sqmFromSqFt(actualSqFt(draft)).toFixed(2)} sq m
          </p>
          <RateAmount
            testId="glass"
            rateTestId="rate-per-sqft"
            areaLabel="Glass"
            basis={actualSqFt(draft)}
            rate={glassPrice(draft).rate}
            amount={glassPrice(draft).amount}
            onRate={(next) =>
              setDraft((current) => ({
                ...current,
                glassPriceFrom: "rate",
                material: {
                  ...current.material,
                  ratePerSqFt: money(next),
                  sheet: { ...current.material.sheet, ratePerSqFt: money(next) },
                },
              }))
            }
            onAmount={(next) => setDraft((current) => ({ ...current, glassPriceFrom: "amount", packageAmount: money(next) }))}
          />
          <label className="check depth-check">
            <input
              data-testid="ceiling-toggle"
              type="checkbox"
              checked={draft.ceiling.enabled}
              onChange={(event) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, enabled: event.target.checked }, useDepth: current.useDepth || event.target.checked }))}
            />
            Ceiling
          </label>
            {draft.ceiling.enabled && (
            <div data-testid="ceiling-options">
              <LengthField label="Level" testId="ceiling-level" mm={draft.ceiling.level} unit={unit} minMm={-4000} onChange={(mm) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, level: mm } }))} />
              <div className="field-row">
                <label className="stack">
                  Ceiling material
                  <input data-testid="ceiling-material" value={draft.ceiling.materialName} onChange={(event) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, materialName: event.target.value } }))} />
                </label>
                <label className="stack">
                  Ceiling colour
                  <input data-testid="ceiling-colour" value={draft.ceiling.colour} onChange={(event) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, colour: event.target.value } }))} />
                </label>
              </div>
              <label className="stack">
                Panel module
                <select
                  data-testid="ceiling-module"
                  value={draft.ceiling.customModule ? "custom" : String(draft.ceiling.moduleFt)}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDraft((current) => ({
                      ...current,
                      ceiling: {
                        ...current.ceiling,
                        customModule: value === "custom",
                        moduleFt: value === "custom" ? current.ceiling.moduleFt : Number(value),
                      },
                    }));
                  }}
                >
                  {CEILING_MODULES.map((ft) => (
                    <option key={ft} value={ft}>
                      {ft} ft
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </label>
              {draft.ceiling.customModule && (
                <LengthField
                  label="Custom module"
                  testId="ceiling-custom"
                  mm={draft.ceiling.customModuleMm}
                  unit={unit}
                  onChange={(mm) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, customModuleMm: Math.max(50, mm), customModule: true } }))}
                />
              )}
              <div className="toggle" role="group" aria-label="Ceiling direction">
                <button type="button" data-testid="ceiling-along-width" aria-pressed={draft.ceiling.along === "width"} onClick={() => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, along: "width" satisfies CeilingAlong } }))}>
                  Along width
                </button>
                <button type="button" data-testid="ceiling-along-depth" aria-pressed={draft.ceiling.along === "depth"} onClick={() => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, along: "depth" satisfies CeilingAlong } }))}>
                  Along depth
                </button>
              </div>
              <div className="toggle" role="group" aria-label="Ceiling finish">
                <button type="button" data-testid="ceiling-wood" aria-pressed={draft.ceiling.finishKind === "wood"} onClick={() => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, finishKind: "wood" satisfies CeilingFinishKind, finishId: "oak" } }))}>
                  Wood
                </button>
                <button type="button" data-testid="ceiling-plain" aria-pressed={draft.ceiling.finishKind === "plain"} onClick={() => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, finishKind: "plain" satisfies CeilingFinishKind, finishId: "white" } }))}>
                  Plain
                </button>
              </div>
              <div className="finish-swatches">
                {(draft.ceiling.finishKind === "wood" ? WOOD_FINISHES : PLAIN_FINISHES).map((finish) => (
                  <button
                    key={finish.id}
                    type="button"
                    data-testid={`ceiling-finish-${finish.id}`}
                    aria-pressed={draft.ceiling.finishId === finish.id}
                    className="swatch"
                    style={{ background: finish.hex }}
                    onClick={() => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, finishId: finish.id } }))}
                  >
                    {finish.name}
                  </button>
                ))}
              </div>
              <h3 className="subhead">Lights</h3>
              {draft.ceiling.lights.map((light) => (
                <div key={light.id} className="side-box" data-testid="ceiling-light-row">
                  <div className="field-row">
                    <LengthField label="Position across" testId="light-x" mm={light.x} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, lights: current.ceiling.lights.map((row) => (row.id === light.id ? { ...row, x: mm } : row)) } }))} />
                    <LengthField label="Position back" testId="light-y" mm={light.y} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, lights: current.ceiling.lights.map((row) => (row.id === light.id ? { ...row, y: mm } : row)) } }))} />
                  </div>
                  <LengthField label="Light size" testId="light-size" mm={light.size} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, lights: current.ceiling.lights.map((row) => (row.id === light.id ? { ...row, size: mm } : row)) } }))} />
                  <button type="button" onClick={() => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, lights: current.ceiling.lights.filter((row) => row.id !== light.id) } }))}>
                    Remove light
                  </button>
                </div>
              ))}
              <button
                type="button"
                data-testid="add-light"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    ceiling: {
                      ...current.ceiling,
                      lights: [...current.ceiling.lights, { id: uid("light"), x: Math.round(current.width / 2), y: Math.round(current.depth / 2), size: 180 }],
                    },
                  }))
                }
              >
                Add light
              </button>
              <ChannelFields
                channels={draft.ceiling.channels}
                testPrefix="ceiling-channel"
                onChange={(channels) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, channels } }))}
              />
              <div className="toggle" role="group" aria-label="Ceiling area">
                <button type="button" data-testid="ceiling-room" aria-pressed={draft.ceiling.scope !== "rect"} onClick={() => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, scope: "room" } }))}>Whole room</button>
                <button type="button" data-testid="ceiling-rect" aria-pressed={draft.ceiling.scope === "rect"} onClick={() => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, scope: "rect" } }))}>One area</button>
              </div>
              {draft.ceiling.scope === "rect" && (
                <div className="field-row" data-testid="ceiling-rect-fields">
                  <LengthField label="From left" testId="ceiling-rect-x" mm={draft.ceiling.rect.x} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, rect: { ...current.ceiling.rect, x: mm } } }))} />
                  <LengthField label="From back" testId="ceiling-rect-y" mm={draft.ceiling.rect.y} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, rect: { ...current.ceiling.rect, y: mm } } }))} />
                  <LengthField label="Width" testId="ceiling-rect-w" mm={draft.ceiling.rect.w} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, rect: { ...current.ceiling.rect, w: mm } } }))} />
                  <LengthField label="Depth" testId="ceiling-rect-d" mm={draft.ceiling.rect.d} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, rect: { ...current.ceiling.rect, d: mm } } }))} />
                  <LengthField label="Up / down" testId="ceiling-lift" mm={draft.ceiling.rect.lift} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, rect: { ...current.ceiling.rect, lift: mm } } }))} />
                </div>
              )}
              <label className="check depth-check">
                <input data-testid="ceiling-trap" type="checkbox" checked={draft.ceiling.trap.enabled} onChange={(event) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, trap: { ...current.ceiling.trap, enabled: event.target.checked } } }))} />
                Trap door
              </label>
              {draft.ceiling.trap.enabled && (
                <div className="field-row">
                  <LengthField label="Trap from left of ceiling" testId="trap-x" mm={draft.ceiling.trap.x} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, trap: { ...current.ceiling.trap, x: mm } } }))} />
                  <LengthField label="Trap from back of ceiling" testId="trap-y" mm={draft.ceiling.trap.y} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, trap: { ...current.ceiling.trap, y: mm } } }))} />
                  <LengthField label="Trap width" testId="trap-w" mm={draft.ceiling.trap.w} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, trap: { ...current.ceiling.trap, w: mm } } }))} />
                  <LengthField label="Trap depth" testId="trap-h" mm={draft.ceiling.trap.h} unit={unit} onChange={(mm) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, trap: { ...current.ceiling.trap, h: mm } } }))} />
                </div>
              )}
              <label className="stack">
                Outside finish image
                <input
                  data-testid="ceiling-image-file"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, image: String(reader.result || "") } }));
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              {draft.ceiling.image && (
                <button type="button" data-testid="ceiling-image-clear" onClick={() => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, image: "" } }))}>Use named colour</button>
              )}
              <p className="hint" data-testid="ceiling-area">
                {ceilingAreaSqFt(draft.ceiling, draft.width, Math.max(draft.depth, 1)).toFixed(2)} sq ft · {sqmFromSqFt(ceilingAreaSqFt(draft.ceiling, draft.width, Math.max(draft.depth, 1))).toFixed(2)} sq m
              </p>
              <RateAmount
                testId="ceiling"
                areaLabel="Ceiling"
                basis={ceilingAreaSqFt(draft.ceiling, draft.width, Math.max(draft.depth, 1))}
                rate={ceilingPrice(draft.ceiling, draft.width, Math.max(draft.depth, 1)).rate}
                amount={ceilingPrice(draft.ceiling, draft.width, Math.max(draft.depth, 1)).amount}
                onRate={(next) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, priceFrom: "rate", ratePerSqFt: money(next) } }))}
                onAmount={(next) => setDraft((current) => ({ ...current, ceiling: { ...current.ceiling, priceFrom: "amount", amount: money(next) } }))}
              />
            </div>
          )}
          <h3 className="subhead">Extra work</h3>
          <label className="stack">
            Extra work
            <select
              data-testid="extra-work"
              value={draft.extraWork.kind}
              onChange={(event) => setDraft((current) => ({ ...current, extraWork: { ...current.extraWork, kind: event.target.value as ExtraWorkKind } }))}
            >
              {(Object.keys(EXTRA_LABEL) as ExtraWorkKind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {EXTRA_LABEL[kind]}
                </option>
              ))}
            </select>
          </label>
          {draft.extraWork.kind !== "none" && (
            <>
              <label className="stack">
                Extra glass area (sq ft)
                <NumberField
                  testId="extra-area"
                  value={draft.extraWork.areaSqFt}
                  onChange={(next) => setDraft((current) => ({ ...current, extraWork: { ...current.extraWork, areaSqFt: next } }))}
                />
              </label>
              <RateAmount
                testId="extra"
                amountTestId="extra-amount"
                areaLabel="Extra"
                basis={draft.extraWork.areaSqFt}
                rate={pricePair(draft.extraWork.rate, draft.extraWork.amount, draft.extraWork.areaSqFt, draft.extraWork.priceFrom).rate}
                amount={pricePair(draft.extraWork.rate, draft.extraWork.amount, draft.extraWork.areaSqFt, draft.extraWork.priceFrom).amount}
                onRate={(next) => setDraft((current) => ({ ...current, extraWork: { ...current.extraWork, priceFrom: "rate", rate: money(next) } }))}
                onAmount={(next) => setDraft((current) => ({ ...current, extraWork: { ...current.extraWork, priceFrom: "amount", amount: money(next) } }))}
              />
            </>
          )}
          <BillEditor shower={draft} unit={unit} onChange={setDraft} />
          <p className="draft-total" data-testid="draft-amount">
            {amount > 0 ? inr(amount) : inr(0)}
          </p>
        </section>

        <section>
          <h2>Saved setup</h2>
          <label className="stack">
            Name
            <input data-testid="setup-name" value={setupName} placeholder="Standard matt black" onChange={(event) => setSetupName(event.target.value)} />
          </label>
          <div className="row-actions">
            <button type="button" data-testid="save-setup" onClick={saveSetup}>Save setup</button>
            <button type="button" data-testid="apply-setup" onClick={applySetup} disabled={!setupPick}>Apply saved setup</button>
          </div>
          <label className="stack">
            Library
            <select data-testid="setup-pick" value={setupPick} onChange={(event) => setSetupPick(event.target.value)}>
              <option value="">Choose a setup</option>
              {setups.map((setup) => (
                <option key={setup.id} value={setup.id}>{setup.name}</option>
              ))}
            </select>
          </label>
        </section>

        <section>
          <div className="presets">
            {[
              ["single", "Fixed, door, fixed"],
              ["openable", "Fixed and openable door"],
              ["wall", "Wall with glass on top"],
              ["return", "Front run plus a return"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                data-testid={`starter-${id}`}
                onClick={() => {
                  setDraft((current) => applyStarter(current, id));
                  setSelectedId(null);
                  if (id === "return") setActiveRun("front");
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="commit-block">
          <label className="stack">
            Notes
            <textarea data-testid="shower-notes" rows={3} maxLength={NOTE_LIMIT} value={draft.notes} placeholder="Which sheet, which colour, or any other note" onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value.slice(0, NOTE_LIMIT) }))} />
            <span className="hint">{draft.notes.length}/{NOTE_LIMIT}</span>
          </label>
          {editingSerial != null && (
            <p className="edit-banner" data-testid="edit-banner">Editing S.No {editingSerial}. Saving keeps this serial number.</p>
          )}
          <button type="button" className="primary" data-testid="commit-quote" onClick={commitQuote}>
            {editingSerial != null ? "Save update" : "Add to quote"}
          </button>
          {editingSerial != null && (
            <button type="button" onClick={cancelEdit}>Cancel edit</button>
          )}
          <p className="hint" data-testid="status">{status}</p>
        </section>
      </aside>

      <main className="panel stage">
        <Drawing
          shower={draft}
          unit={unit}
          selectedId={selectedId}
          activeRun={activeRun}
          onSelect={(id) => {
            setSelectedId(id);
            if (id && draft.sides.some((side) => side.id === id)) setActiveRun(id);
          }}
          onMove={(id, x) => setDraft((current) => moveItemX(current, id, x))}
          onResize={(id, next) => setDraft((current) => patchItem(current, id, next))}
          onResizeSide={(id, length) => setDraft((current) => updateSide(current, id, { length }))}
          onMoveSide={(id, attachX) => setDraft((current) => updateSide(current, id, { attachX }))}
          onMoveFixture={(kind, x, y) => patchFixture(kind, { x, y })}
          projectRef={projectRef}
          watermark={company.logo || BRAND_LOGO}
          dimArmed={dimArmed}
          onArmDim={() => setDimArmed((on) => !on)}
          onAddDim={(dim: UserDim) => {
            setDraft((current) => ({ ...current, dims: [...current.dims, dim] }));
            setDimArmed(false);
          }}
          onMoveDim={(id, offset) => setDraft((current) => ({ ...current, dims: current.dims.map((dim) => (dim.id === id ? { ...dim, offset } : dim)) }))}
          onNudgeLabel={(key, x, y) => setDraft((current) => ({ ...current, labelNudge: { ...current.labelNudge, [key]: { x, y } } }))}
          onNudgeHandle={(id, part, x, y) =>
            setDraft((current) =>
              patchItem(
                current,
                id,
                part === "lock" ? { lockDx: x, lockHeight: y } : part === "body" ? { handleDx: x, handleDy: y } : { handleLabelDx: x, handleLabelDy: y },
              ),
            )
          }
          onMoveView={(key, x, y) => setDraft((current) => ({ ...current, viewShift: { ...current.viewShift, [key]: { x, y } } }))}
          onUndo={undoDraft}
          onRedo={redoDraft}
          onDuplicate={duplicateSelected}
          onClearCanvas={clearCanvas}
          canUndo={historyTick >= 0 && history.current.past.length > 0}
          canRedo={history.current.future.length > 0}
        />
      </main>

      {quoteOpen && (
        <div className="drawer-root">
          <button type="button" className="drawer-backdrop" aria-label="Close quote" onClick={() => setQuoteOpen(false)} />
          <aside className="drawer" data-testid="quote-drawer" aria-label="Quote showers">
            <div className="quote-head">
              <div>
                <p className="eyebrow">Quote</p>
                <h2>Showers</h2>
              </div>
              <button type="button" data-testid="close-quote" onClick={() => setQuoteOpen(false)}>Close</button>
            </div>
            <p className="hint">Edit keeps the S.No. Sizes are in {unit}.</p>
            <button type="button" className="primary" data-testid="generate-from-list" onClick={() => { setQuoteOpen(false); setDocOpen(true); }}>
              Generate quote
            </button>
            {rows.length === 0 ? (
              <p className="hint empty-quote">No showers in the quote yet. Design one, then Add to quote.</p>
            ) : (
              <div className="shower-list" data-testid="quote-table">
                {rows.map((entry) => {
                  const lines = packageQuoteLines(entry.shower, unit);
                  return (
                    <article key={entry.serial} className="shower-card" data-testid="quote-row" data-serial={entry.serial}>
                      <div className="card-top">
                        <strong data-testid="serial">S.No {entry.serial}{entry.shower.location.trim() ? ` · ${entry.shower.location.trim()}` : ""}</strong>
                        <div className="actions">
                          <button type="button" data-testid={`edit-${entry.serial}`} onClick={() => beginEdit(entry.serial)}>Edit</button>
                          <button type="button" data-testid={`delete-${entry.serial}`} onClick={() => removeEntry(entry.serial)}>Delete</button>
                        </div>
                      </div>
                      <p className="note-line" data-testid="quote-note">{entry.shower.notes.trim() ? entry.shower.notes : "No note yet"}</p>
                      <p className="card-meta">
                        {entry.shower.product === "cubicle" ? "HPL cubicle" : `${profileLabel(entry.shower.material)} · ${entry.shower.material.colour} · ${entry.shower.material.origin} · ${entry.shower.material.infill === "glass" ? "Glass" : "Sheet"}`}
                        {infillSpecText(entry.shower) ? ` · ${infillSpecText(entry.shower)}` : ""}
                      </p>
                      <p className="card-meta">
                        {hardwareForQuote(entry.shower)} · {hardwareColourLabel(entry.shower.material)}
                      </p>
                      <p data-testid="sizes">{sizeLabel(entry.shower, unit)}</p>
                      <p className="card-meta">
                        Opening {formatLength(entry.shower.width, unit)} · Used {formatLength(usedWidth(entry.shower.items), unit)} · Balance {formatLength(balanceWidth(entry.shower.width, entry.shower.items), unit)} {unit}
                      </p>
                      <ul className="glass-lines">
                        {lines.map((line) => (
                          <li key={line.id} data-testid={line.kind === "wastage" ? "wastage-line" : line.kind === "package" ? "package-line" : line.kind === "handle" ? "handle-line" : line.kind === "legs" ? "legs-line" : line.kind === "rail" ? "rail-line" : line.kind === "ceiling" ? "ceiling-line" : "lock-line"}>
                            <strong>{line.description}</strong>
                            <span>{line.size}</span>
                            <span>{line.kind === "package" || line.kind === "wastage" ? `${line.area.toFixed(2)} sq ft` : line.kind}</span>
                            <span>{inr(line.amount)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="card-rate">
                        <span>{inr(showerAmount(entry.shower))}</span>
                        <button type="button" onClick={() => beginEdit(entry.serial)}>Edit rates</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            {rows.length > 0 && (
              <p className="quote-total">Total {inr(rows.reduce((sum, entry) => sum + showerAmount(entry.shower), 0))}</p>
            )}
          </aside>
        </div>
      )}

      {docOpen && (
        <QuoteDocument
          rows={rows}
          unit={unit}
          company={company}
          customer={customer}
          quoteNo={quoteNo}
          fileMode={fileMode}
          onCompany={setCompany}
          onCustomer={setCustomer}
          onQuoteNo={setQuoteNo}
          onFileMode={setFileMode}
          onClose={() => setDocOpen(false)}
        />
      )}

      {ghost && (
        <div className="drag-ghost" style={{ left: ghost.x, top: ghost.y }}>
          {ghost.label}
        </div>
      )}
    </div>
  );
}

function itemTitle(item: PlacedItem): string {
  if (item.kind === "fixed") return "Fixed glass";
  if (item.kind === "wall") return "Wall";
  if (item.kind === "return") return "Return";
  return item.doorStyle === "openable" ? "Openable door" : "Sliding door";
}

function BillEditor({ shower, onChange }: { shower: Shower; unit: UnitId; onChange: (shower: Shower) => void }) {
  const pieces = sheetBreakdown(shower);
  const waste = shower.wastage.package;
  const sameRate = !waste?.ownRate;
  const wasteArea = wastageExtraSqFt(shower);
  return (
    <div className="bill-editor">
      <h3 className="subhead">Wastage</h3>
      {pieces.length === 0 ? (
        <p className="hint">Add a fixed panel or a door to see the sheet size.</p>
      ) : (
        <ul className="mini-lines" data-testid="sheet-breakdown">
          {pieces.map((piece) => (
            <li key={piece.id} data-testid="sheet-piece" data-role={piece.role} data-sheet={piece.sheetLabel} data-actual={piece.actualSqFt.toFixed(6)} data-waste={piece.wasteSqFt.toFixed(6)}>
              <strong>{piece.name}</strong>
              <span>
                Actual {formatFt(piece.widthFt)} × {formatFt(piece.heightFt)} ft · {piece.actualSqFt.toFixed(2)} sq ft
              </span>
              <span>Sheet {piece.sheetLabel} · {piece.sheetSqFt.toFixed(2)} sq ft</span>
              <span>Wastage {piece.wasteSqFt.toFixed(2)} sq ft</span>
            </li>
          ))}
        </ul>
      )}
      <label className="check">
        <input
          data-testid="wastage-same-rate"
          type="checkbox"
          checked={sameRate}
          onChange={(event) =>
            onChange(setWastage(shower, "package", { enabled: true, ownRate: !event.target.checked, priceFrom: event.target.checked ? "rate" : waste?.priceFrom, rate: waste?.rate || shower.material.ratePerSqFt }))
          }
        />
        Same rate as glass
      </label>
      <p className="hint">{wasteArea.toFixed(2)} sq ft · {sqmFromSqFt(wasteArea).toFixed(2)} sq m</p>
      <RateAmount
        testId="wastage"
        rateTestId="wastage-rate"
        areaLabel="Wastage"
        basis={wasteArea}
        rate={wastagePrice(shower).rate}
        amount={wastagePrice(shower).amount}
        onRate={(next) => onChange(setWastage(shower, "package", { enabled: true, ownRate: true, priceFrom: "rate", rate: money(next) }))}
        onAmount={(next) => onChange(setWastage(shower, "package", { enabled: true, ownRate: true, priceFrom: "amount", amount: money(next) }))}
      />
      <p className="wastage-note" data-testid="wastage-line">
        Wastage {inr(wastageAmountOf(shower))} at {inr(wastageRateOf(shower))} / sq ft
      </p>
    </div>
  );
}

function HandleEditor({
  item,
  unit,
  onChange,
}: {
  item: PlacedItem;
  unit: UnitId;
  onChange: (patch: Partial<PlacedItem>) => void;
}) {
  return (
    <div className="spec-box" data-testid="handle-editor">
      <div className="handle-row">
        <h3 className="subhead">Handle</h3>
        {item.handleKind !== "none" && (
          <button
            type="button"
            data-testid="remove-handle"
            onClick={() => onChange({ handleKind: "none", handleName: "", handleRate: 0, handlePhoto: "" })}
          >
            Remove handle
          </button>
        )}
      </div>
      <label className="stack">
        Handle
        <select
          data-testid="handle-kind"
          value={item.handleKind}
          onChange={(event) => {
            const handleKind = event.target.value as HandleKind;
            if (handleKind === "none") {
              onChange({ handleKind: "none", handleName: "", handleRate: 0, handlePhoto: "" });
              return;
            }
            const reach = handleKind === "pull" ? item.pullLength / 2 + 80 : handleKind === "lpipe" ? item.pipeVertLen + 80 : 0;
            const blocked = item.lockStyle === "lever" && Math.abs(item.lockHeight - item.handleHeight) <= reach;
            onChange({
              handleKind,
              ...(blocked ? { lockHeight: defaultLockHeight({ ...item, handleKind, lockStyle: "lever" }) } : {}),
            });
          }}
        >
          <option value="none">None</option>
          <option value="lpipe">L-type round pipe</option>
          <option value="pull">Rectangular pull</option>
        </select>
      </label>
      {item.handleKind !== "none" && (
        <>
          <label className="stack">
            Handle name
            <input data-testid="handle-name" value={item.handleName} placeholder={item.handleKind === "lpipe" ? "L-type round pipe" : "Rectangular pull"} onChange={(event) => onChange({ handleName: event.target.value })} />
          </label>
          <RateAmount
            testId="handle"
            rateTestId="handle-rate"
            areaLabel="Handle"
            basis={1}
            rate={money(item.handleRate)}
            amount={money(item.handleRate)}
            onRate={(next) => onChange({ handleRate: money(next) })}
            onAmount={(next) => onChange({ handleRate: money(next) })}
          />
          <label className="stack">
            Handle photo
            <input
              data-testid="handle-photo-upload"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => onChange({ handlePhoto: String(reader.result || "") });
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {item.handlePhoto && <img className="handle-thumb" data-testid="handle-photo-preview" src={item.handlePhoto} alt="" />}
          <LengthField label="Height from floor" testId="handle-height" mm={item.handleHeight} unit={unit} onChange={(mm) => onChange({ handleHeight: mm })} />
          <p className="hint">Drag the handle on the drawing. The lock keeps its own place.</p>
          {item.handleKind === "lpipe" && (
            <>
              <p className="hint">Pipe L. Ø30 × 250, bar 405, tube Ø25, return 184.</p>
              <div className="field-row">
                <LengthField label="Vertical Ø" testId="pipe-vert-dia" mm={item.pipeVertDia} unit={unit} onChange={(mm) => onChange({ pipeVertDia: mm })} />
                <LengthField label="Vertical leg" testId="pipe-vert-len" mm={item.pipeVertLen} unit={unit} onChange={(mm) => onChange({ pipeVertLen: mm })} />
              </div>
              <div className="field-row">
                <LengthField label="Horizontal leg" testId="pipe-horiz" mm={item.pipeHorizLen} unit={unit} onChange={(mm) => onChange({ pipeHorizLen: mm })} />
                <LengthField label="Tube Ø" testId="pipe-tube" mm={item.pipeTubeDia} unit={unit} onChange={(mm) => onChange({ pipeTubeDia: mm })} />
              </div>
              <LengthField label="Return" testId="pipe-return" mm={item.pipeReturn} unit={unit} onChange={(mm) => onChange({ pipeReturn: mm })} />
              <label className="stack">
                Leg points
                <select data-testid="leg-point" value={item.legPoint} onChange={(event) => onChange({ legPoint: event.target.value as LegPoint })}>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </label>
            </>
          )}
          {item.handleKind === "pull" && (
            <>
              <label className="stack">
                Finish
                <select data-testid="pull-finish" value={item.pullFinish} onChange={(event) => onChange({ pullFinish: event.target.value })}>
                  {PULL_FINISHES.map((finish) => (
                    <option key={finish.name} value={finish.name}>{finish.name}</option>
                  ))}
                </select>
              </label>
              <label className="stack">
                Pull height
                <select
                  data-testid="pull-length"
                  value={item.pullCustom || !(PULL_LENGTHS as readonly number[]).includes(item.pullLength) ? "custom" : String(item.pullLength)}
                  onChange={(event) => {
                    if (event.target.value === "custom") onChange({ pullCustom: true });
                    else onChange({ pullCustom: false, pullLength: Number(event.target.value) });
                  }}
                >
                  {PULL_LENGTHS.map((length) => (
                    <option key={length} value={length}>{length} mm</option>
                  ))}
                  <option value="custom">Custom size</option>
                </select>
              </label>
              {item.pullCustom && (
                <LengthField label="Custom length" testId="pull-custom" mm={item.pullLength} unit={unit} onChange={(mm) => onChange({ pullLength: mm, pullCustom: true })} />
              )}
              <div className="toggle" role="group" aria-label="Pull direction">
                <button type="button" data-testid="pull-vertical" aria-pressed={item.pullAxis === "vertical"} onClick={() => onChange({ pullAxis: "vertical" satisfies PullAxis })}>Vertical</button>
                <button type="button" data-testid="pull-horizontal" aria-pressed={item.pullAxis === "horizontal"} onClick={() => onChange({ pullAxis: "horizontal" })}>Horizontal</button>
              </div>
            </>
          )}
        </>
      )}
      <div className="handle-row">
        <h3 className="subhead">Lock</h3>
        {item.lockStyle !== "none" && (
          <button
            type="button"
            data-testid="remove-lock"
            onClick={() => onChange({ lockStyle: "none", lockName: "", lockRate: 0 })}
          >
            Remove lock
          </button>
        )}
      </div>
      <label className="stack">
        Lock
        <select
          data-testid="lock-style"
          value={item.lockStyle}
          onChange={(event) => {
            const lockStyle = event.target.value as LockStyle;
            if (lockStyle === "none") {
              onChange({ lockStyle: "none", lockName: "", lockRate: 0 });
              return;
            }
            const reach = item.handleKind === "pull" ? item.pullLength / 2 + 80 : item.handleKind === "lpipe" ? item.pipeVertLen + 80 : 0;
            const blocked = item.handleKind !== "none" && Math.abs(item.lockHeight - item.handleHeight) <= reach;
            onChange({
              lockStyle,
              ...(blocked ? { lockHeight: defaultLockHeight({ ...item, lockStyle }) } : {}),
            });
          }}
        >
          <option value="none">None</option>
          <option value="lever">Lever lock handle</option>
        </select>
      </label>
      {item.lockStyle !== "none" && (
        <>
          <label className="stack">
            Lock name
            <input data-testid="lock-name" value={item.lockName} placeholder="Lever lock" onChange={(event) => onChange({ lockName: event.target.value })} />
          </label>
          <RateAmount
            testId="lock"
            rateTestId="lock-rate"
            areaLabel="Lock"
            basis={1}
            rate={money(item.lockRate)}
            amount={money(item.lockRate)}
            onRate={(next) => onChange({ lockRate: money(next) })}
            onAmount={(next) => onChange({ lockRate: money(next) })}
          />
          <LengthField label="Lock height from floor" testId="lock-height" mm={item.lockHeight} unit={unit} onChange={(mm) => onChange({ lockHeight: mm })} />
          <label className="stack">
            Lock across from the stile (mm)
            <NumberField testId="lock-across" value={item.lockDx} min={-4000} onChange={(lockDx) => onChange({ lockDx: Math.round(lockDx) })} />
          </label>
          <p className="hint">Drag the lock on the drawing to move it on its own. It does not follow the handle.</p>
        </>
      )}
    </div>
  );
}

function SpecFields({
  title,
  spec,
  testPrefix,
  onChange,
}: {
  title: string;
  spec: InfillSpec;
  testPrefix: string;
  onChange: (spec: InfillSpec) => void;
}) {
  return (
    <div className="spec-box">
      <h3 className="subhead">{title}</h3>
      <div className="field-row">
        <label className="stack">
          Thickness
          <input data-testid={`${testPrefix}-thickness`} value={spec.thickness} placeholder="10" onChange={(event) => onChange({ ...spec, thickness: event.target.value })} />
        </label>
        <label className="stack">
          Colour
          <input data-testid={`${testPrefix}-colour`} value={spec.colour} placeholder="Clear" onChange={(event) => onChange({ ...spec, colour: event.target.value })} />
        </label>
      </div>
      <label className="stack">
        Brand name
        <input data-testid={`${testPrefix}-brand`} value={spec.brand} onChange={(event) => onChange({ ...spec, brand: event.target.value })} />
      </label>
      {testPrefix === "glass" && (
        <div className="toggle" role="group" aria-label="Toughened glass">
          <button type="button" data-testid="glass-tough" aria-pressed={spec.tough !== "nontough"} onClick={() => onChange({ ...spec, tough: "tough" satisfies GlassTough })}>Toughened glass</button>
          <button type="button" data-testid="glass-nontough" aria-pressed={spec.tough === "nontough"} onClick={() => onChange({ ...spec, tough: "nontough" satisfies GlassTough })}>Non-toughened</button>
        </div>
      )}
      <label className="stack">
        Surface work
        <select data-testid={`${testPrefix}-surface`} value={spec.surface} onChange={(event) => onChange({ ...spec, surface: event.target.value as SurfaceWork })}>
          <option value="none">None</option>
          <option value="frosting">Frosting</option>
          <option value="other">Other</option>
        </select>
      </label>
      {spec.surface === "other" && (
        <label className="stack">
          Work
          <input data-testid={`${testPrefix}-surface-note`} value={spec.surfaceNote} placeholder="Etching, sandblast, logo" onChange={(event) => onChange({ ...spec, surfaceNote: event.target.value })} />
        </label>
      )}
    </div>
  );
}

function AlignPick({
  items,
  value,
  unit,
  empty,
  testId,
  onChange,
}: {
  items: PlacedItem[];
  value: string;
  unit: UnitId;
  empty: string;
  testId: string;
  onChange: (id: string) => void;
}) {
  if (!items.length) return <p className="hint">{empty}</p>;
  return (
    <label className="stack">
      Which one
      <select data-testid={testId} value={value || items[0].id} onChange={(event) => onChange(event.target.value)}>
        {items.map((item, index) => (
          <option key={item.id} value={item.id}>
            {itemTitle(item)} {index + 1} · {formatLength(item.width, unit)} {unit}
          </option>
        ))}
      </select>
    </label>
  );
}

function draftNumber(raw: string): boolean {
  return raw === "" || /^-?\d*\.?\d*$/.test(raw);
}

function commitNumber(raw: string, min: number): number {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "." || trimmed === "-" || trimmed === "-.") return min;
  const next = Number(trimmed);
  return Number.isFinite(next) ? Math.max(min, next) : min;
}

function PartitionFields({
  side,
  shower,
  unit,
  onChange,
  onRemove,
}: {
  side: Shower["sides"][number];
  shower: Shower;
  unit: UnitId;
  onChange: (patch: Partial<Shower["sides"][number]>) => void;
  onRemove: () => void;
}) {
  const limit = innerDepth(shower);
  return (
    <>
      <label className="stack">
        Name
        <input data-testid="side-name" value={side.name} onChange={(event) => onChange({ name: event.target.value })} />
      </label>
      <div className="field-row">
        <LengthField label="Partition depth" testId="side-length" mm={side.length} unit={unit} onChange={(length) => onChange({ length })} />
        <LengthField label="From the left" testId="side-attach" mm={side.attachX} unit={unit} onChange={(attachX) => onChange({ attachX })} />
      </div>
      <p className="hint" data-testid="partition-limit">Inside the front frame, the deepest this return can be is {formatLength(limit, unit)} {unit}.</p>
      <div className="toggle" role="group" aria-label="Partition face">
        <button type="button" data-testid="partition-glass" aria-pressed={side.face !== "wall"} onClick={() => onChange({ face: "glass" satisfies PartitionFace })}>Glass side</button>
        <button type="button" data-testid="partition-wall" aria-pressed={side.face === "wall"} onClick={() => onChange({ face: "wall" satisfies PartitionFace })}>Wall side</button>
      </div>
      <div className="toggle" role="group" aria-label="Partition design">
        <button type="button" data-testid="partition-fixed" aria-pressed={!side.door} onClick={() => onChange({ door: false })}>Fixed glass</button>
        <button type="button" data-testid="partition-sliding" aria-pressed={side.door && side.doorStyle !== "openable"} onClick={() => onChange({ door: true, doorStyle: "sliding" })}>Sliding</button>
        <button type="button" data-testid="partition-openable" aria-pressed={side.door && side.doorStyle === "openable"} onClick={() => onChange({ door: true, doorStyle: "openable" })}>Openable</button>
      </div>
      <label className="check">
        <input data-testid="partition-door" type="checkbox" checked={side.door} onChange={(event) => onChange({ door: event.target.checked })} />
        Door in this partition
      </label>
      {side.door && (
        <>
          <LengthField label="Door width" testId="partition-door-width" mm={side.doorWidth} unit={unit} onChange={(doorWidth) => onChange({ doorWidth })} />
          <div className="handle-row">
            <span>Handle side</span>
            <div className="toggle mini">
              <button type="button" data-testid="partition-handle-left" aria-pressed={side.doorHandle === "left"} onClick={() => onChange({ doorHandle: "left" satisfies Side })}>Left</button>
              <button type="button" data-testid="partition-handle-right" aria-pressed={side.doorHandle !== "left"} onClick={() => onChange({ doorHandle: "right" satisfies Side })}>Right</button>
            </div>
          </div>
          <div className="handle-row">
            <span>Opens</span>
            <div className="toggle mini" role="group" aria-label="Partition door swing">
              <button type="button" data-testid="partition-swing-inside" aria-pressed={side.doorSwing !== "outside"} onClick={() => onChange({ doorSwing: "inside" satisfies DoorSwing })}>Inside</button>
              <button type="button" data-testid="partition-swing-outside" aria-pressed={side.doorSwing === "outside"} onClick={() => onChange({ doorSwing: "outside" satisfies DoorSwing })}>Outside</button>
            </div>
          </div>
        </>
      )}
      <label className="check depth-check">
        <input
          data-testid="side-ceiling"
          type="checkbox"
          checked={side.ceiling.enabled}
          onChange={(event) => {
            const bayX = side.attachX <= shower.width / 2 ? 0 : side.attachX;
            const bayW = side.attachX <= shower.width / 2 ? Math.max(10, side.attachX) : Math.max(10, shower.width - side.attachX);
            onChange({
              ceiling: {
                ...side.ceiling,
                enabled: event.target.checked,
                scope: "rect",
                rect: { ...side.ceiling.rect, x: bayX, y: 0, w: bayW, d: Math.max(10, side.length) },
              },
            });
          }}
        />
        Ceiling on this side only
      </label>
      {side.ceiling.enabled && (
        <div data-testid="side-ceiling-options">
          <p className="hint" data-testid="side-ceiling-area">
            {ceilingAreaSqFt(sideCeilingModel(shower, side), shower.width, Math.max(shower.depth, 1)).toFixed(2)} sq ft · {sqmFromSqFt(ceilingAreaSqFt(sideCeilingModel(shower, side), shower.width, Math.max(shower.depth, 1))).toFixed(2)} sq m
          </p>
          <RateAmount
            testId="side-ceiling"
            areaLabel="This side"
            basis={ceilingAreaSqFt(sideCeilingModel(shower, side), shower.width, Math.max(shower.depth, 1))}
            rate={ceilingPrice(sideCeilingModel(shower, side), shower.width, Math.max(shower.depth, 1)).rate}
            amount={ceilingPrice(sideCeilingModel(shower, side), shower.width, Math.max(shower.depth, 1)).amount}
            onRate={(next) => onChange({ ceiling: { ...side.ceiling, priceFrom: "rate", ratePerSqFt: money(next) } })}
            onAmount={(next) => onChange({ ceiling: { ...side.ceiling, priceFrom: "amount", amount: money(next) } })}
          />
          <LengthField label="Level" testId="side-ceiling-level" mm={side.ceiling.level} unit={unit} minMm={-4000} onChange={(mm) => onChange({ ceiling: { ...side.ceiling, level: mm } })} />
          <LengthField label="Module" testId="side-ceiling-module" mm={side.ceiling.customModule ? side.ceiling.customModuleMm : side.ceiling.moduleFt * 304.8} unit={unit} onChange={(mm) => onChange({ ceiling: { ...side.ceiling, customModule: true, customModuleMm: mm } })} />
          <div className="toggle" role="group" aria-label="Side ceiling finish">
            <button type="button" data-testid="side-ceiling-wood" aria-pressed={side.ceiling.finishKind === "wood"} onClick={() => onChange({ ceiling: { ...side.ceiling, finishKind: "wood" satisfies CeilingFinishKind, finishId: "oak" } })}>Wood</button>
            <button type="button" data-testid="side-ceiling-plain" aria-pressed={side.ceiling.finishKind === "plain"} onClick={() => onChange({ ceiling: { ...side.ceiling, finishKind: "plain" satisfies CeilingFinishKind, finishId: "white" } })}>Plain</button>
          </div>
        </div>
      )}
      <button type="button" className="danger" onClick={onRemove}>Remove this partition</button>
    </>
  );
}

function FixturePlace({
  kind,
  shower,
  unit,
  onChange,
}: {
  kind: "wc" | "shower";
  shower: Shower;
  unit: UnitId;
  onChange: (patch: Partial<{ x: number; y: number; facing: PlanFacing }>) => void;
}) {
  const point = kind === "wc" ? shower.wc : shower.showerPoint;
  const room = Math.max(shower.depth, 1);
  const fromGlass = Math.max(0, room - point.y);
  const step = unitToMm(1, unit);
  return (
    <>
      <div className="field-row">
        <button type="button" data-testid="fixture-x-minus" onClick={() => onChange({ x: Math.max(0, point.x - step) })}>−</button>
        <LengthField label="From left wall" testId="fixture-x" mm={point.x} unit={unit} onChange={(x) => onChange({ x })} />
        <button type="button" data-testid="fixture-x-plus" onClick={() => onChange({ x: Math.min(shower.width, point.x + step) })}>+</button>
      </div>
      <div className="field-row">
        <button type="button" data-testid="fixture-y-minus" onClick={() => onChange({ y: Math.min(room, point.y + step) })}>−</button>
        <LengthField label="From glass" testId="fixture-y" mm={fromGlass} unit={unit} onChange={(mm) => onChange({ y: room - mm })} />
        <button type="button" data-testid="fixture-y-plus" onClick={() => onChange({ y: Math.max(0, point.y - step) })}>+</button>
      </div>
      <div className="toggle" role="group" aria-label="Faces">
        {(["up", "down", "left", "right"] as PlanFacing[]).map((facing) => (
          <button key={facing} type="button" data-testid={`face-${facing}`} aria-pressed={point.facing === facing} onClick={() => onChange({ facing })}>
            {facing}
          </button>
        ))}
      </div>
    </>
  );
}

function RateAmount({
  testId,
  rateTestId,
  amountTestId,
  areaLabel,
  rate,
  amount,
  onRate,
  onAmount,
}: {
  testId: string;
  rateTestId?: string;
  amountTestId?: string;
  areaLabel: string;
  basis: number;
  rate: number;
  amount: number;
  onRate: (value: number) => void;
  onAmount: (value: number) => void;
}) {
  return (
    <div className="rate-row" data-testid={`${testId}-row`}>
      <span>{areaLabel}</span>
      <label className="stack">
        Rate
        <span className="unit">
          ₹
          <NumberField testId={rateTestId ?? `${testId}-rate`} value={rate} onChange={onRate} />
        </span>
      </label>
      <label className="stack">
        Amount
        <span className="unit">
          ₹
          <NumberField testId={amountTestId ?? `${testId}-amount`} value={amount} onChange={onAmount} />
        </span>
      </label>
    </div>
  );
}

function NumberField({
  testId,
  value,
  onChange,
  min = 0,
}: {
  testId: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}) {
  const shown = Number.isFinite(value) ? String(value) : "";
  const [text, setText] = useState(shown);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(shown);
  }, [shown, focused]);

  return (
    <input
      data-testid={testId}
      aria-label={testId}
      inputMode="decimal"
      autoComplete="off"
      value={focused ? text : shown}
      onFocus={() => {
        setFocused(true);
        setText(shown);
      }}
      onChange={(event) => {
        const raw = event.target.value;
        if (draftNumber(raw)) setText(raw);
      }}
      onBlur={(event) => {
        setFocused(false);
        onChange(commitNumber(event.currentTarget.value, min));
      }}
    />
  );
}

function LengthField({
  label,
  testId,
  mm,
  unit,
  minMm = 0,
  onChange,
}: {
  label: string;
  testId: string;
  mm: number;
  unit: UnitId;
  minMm?: number;
  onChange: (mm: number) => void;
}) {
  const shown = formatLength(mm, unit);
  const [text, setText] = useState(shown);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(shown);
  }, [shown, focused]);

  return (
    <label className="stack">
      {label}
      <span className="unit">
        <input
          data-testid={testId}
          aria-label={label}
          inputMode="decimal"
          autoComplete="off"
          value={focused ? text : shown}
          onFocus={() => {
            setFocused(true);
            setText(shown);
          }}
          onChange={(event) => {
            const raw = event.target.value;
            if (draftNumber(raw)) setText(raw);
          }}
          onBlur={(event) => {
            setFocused(false);
            onChange(unitToMm(commitNumber(event.currentTarget.value, minMm / unitToMm(1, unit)), unit));
          }}
        />
        <em data-testid={`${testId}-unit`}>{unit}</em>
      </span>
    </label>
  );
}

function ColourField({
  label,
  testId,
  value,
  onChange,
}: {
  label: string;
  testId: string;
  value: ColourName;
  onChange: (colour: ColourName) => void;
}) {
  return (
    <label className="stack">
      {label}
      <span className="colour-line">
        <i style={{ background: COLOUR_HEX[value] }} />
        <select data-testid={testId} aria-label={label} value={value} onChange={(event) => onChange(event.target.value as ColourName)}>
          {COLOURS.map((colour) => (
            <option key={colour} value={colour}>{colour}</option>
          ))}
        </select>
      </span>
    </label>
  );
}

function ExtraHardwareFields({ shower, onChange }: { shower: Shower; onChange: (next: Shower) => void }) {
  return (
    <div className="channels" data-testid="extra-hardware">
      <h3 className="subhead">Extra hardware</h3>
      <label className="check">
        <input
          data-testid="show-wastage"
          type="checkbox"
          checked={shower.showWastage !== false}
          onChange={(event) => onChange({ ...shower, showWastage: event.target.checked })}
        />
        Show wastage on the quote
      </label>
      <label className="check">
        <input
          data-testid="hardware-breakdown"
          type="checkbox"
          checked={shower.hardwareBreakdown}
          onChange={(event) => onChange({ ...shower, hardwareBreakdown: event.target.checked })}
        />
        List each hardware rate in the price column
      </label>
      <p className="hint">Add a row only if you want one. A rate prints and adds to the total. A blank rate prints the name only.</p>
      {shower.extraHardware.map((row) => (
        <div key={row.id} className="field-row" data-testid="extra-hardware-row">
          <label className="stack">
            Name
            <input
              data-testid="extra-hardware-name"
              value={row.name}
              placeholder="Closer, seal, ..."
              onChange={(event) =>
                onChange({
                  ...shower,
                  extraHardware: shower.extraHardware.map((item) => (item.id === row.id ? { ...item, name: event.target.value.slice(0, 80) } : item)),
                })
              }
            />
          </label>
          <label className="stack">
            Rate
            <input
              data-testid="extra-hardware-rate"
              inputMode="decimal"
              value={row.rate ? String(row.rate) : ""}
              placeholder="Optional"
              onChange={(event) => {
                const raw = event.target.value.trim();
                if (raw !== "" && !Number.isFinite(Number(raw))) return;
                const rate = raw === "" ? 0 : money(Math.max(0, Number(raw)));
                onChange({
                  ...shower,
                  extraHardware: shower.extraHardware.map((item) => (item.id === row.id ? { ...item, rate } : item)),
                });
              }}
            />
          </label>
          <button
            type="button"
            data-testid="remove-hardware-row"
            onClick={() => onChange({ ...shower, extraHardware: shower.extraHardware.filter((item) => item.id !== row.id) })}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        data-testid="add-hardware-row"
        onClick={() => onChange({ ...shower, extraHardware: [...shower.extraHardware, { id: uid("hw"), name: "", rate: 0 }] })}
      >
        Add row
      </button>
    </div>
  );
}

const CHANNEL_LABELS: Record<string, string> = {
  "U-channel": "U-channel",
  "Bottom seal": "Door seal",
  "Side gasket": "EPDM",
  "Head channel": "Head seal",
};

function channelSlug(type: string): string {
  if (type === "U-channel") return "u";
  if (type === "Bottom seal") return "door-seal";
  if (type === "Side gasket") return "epdm";
  return "head";
}

function ChannelFields({
  channels,
  onChange,
  testPrefix,
}: {
  channels: ChannelSet;
  onChange: (channels: ChannelSet) => void;
  testPrefix: string;
}) {
  const parts = channels.parts?.length ? channels.parts : CHANNEL_TYPES.map((type) => ({ type, top: type === channels.type && channels.top, bottom: type === channels.type && channels.bottom, left: type === channels.type && channels.left, right: type === channels.type && channels.right }));
  return (
    <div className="channels">
      {CHANNEL_TYPES.map((type) => {
        const part = parts.find((row) => row.type === type) ?? { type, top: false, bottom: false, left: false, right: false };
        const slug = channelSlug(type);
        return (
          <div key={type} data-testid={`${testPrefix}-${slug}`}>
            <p className="subhead">{CHANNEL_LABELS[type] ?? type}</p>
            <div className="edge-checks">
              {CHANNEL_EDGES.map((edge) => (
                <label key={edge} className="check">
                  <input
                    data-testid={type === "U-channel" ? `${testPrefix}-${edge}` : `${testPrefix}-${slug}-${edge}`}
                    type="checkbox"
                    checked={part[edge]}
                    onChange={(event) => onChange(setChannelEdge(channels, type, edge, event.target.checked))}
                  />
                  {edge}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
