import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { drawingCss, drawStyle } from "./drawStyle";
import {
  COLOUR_HEX,
  balanceWidth,
  ceilingFinish,
  ceilingModuleMm,
  clamp,
  ceilingPanelGeoms,
  ceilingPanels,
  ceilingSpan,
  sideCeilingModel,
  uid,
  coverageGaps,
  designedSqFt,
  displayDepth,
  elevationShower,
  formatLength,
  geometryOf,
  glassNotches,
  insetLoop,
  shapeLoops,
  hardwareHex,
  openingSqFt,
  SHOWER_ID,
  WC_ID,
  showPlan,
  topFixedBox,
  usedWidth,
  type Geom,
  type MmPoint,
  type MmRect,
  type PlacedItem,
  type UserDim,
  type PlanFacing,
  type Shower,
  type Side,
  type SideRun,
  type UnitId,
  isFullPartition,
  partitionItems,
  cubicleLegXs,
  CUBICLE_RAIL_MM,
} from "./model";

export type FigureMode = "studio" | "elevations" | "elevation" | "plan";

type EditApi = {
  startHandle: (event: ReactPointerEvent, item: PlacedItem, part: "body" | "label" | "lock") => void;
  startLabel: (event: ReactPointerEvent, key: string, axis?: "x" | "y") => void;
  nudge: Record<string, { x: number; y: number }>;
  editable: boolean;
  scale: number;
};
const EditCtx = createContext<EditApi | null>(null);

type DragState =
  | { kind: "move"; id: string; originX: number; itemX: number; screenPerMm: number }
  | { kind: "width"; id: string; edge: "left" | "right"; originX: number; itemX: number; itemW: number; limit: number; screenPerMm: number }
  | { kind: "side"; id: string; axis: "x" | "y"; origin: number; length: number; screenPerMm: number }
  | { kind: "side-x"; id: string; originX: number; attachX: number; screenPerMm: number }
  | { kind: "fixture"; fixture: "wc" | "shower"; originX: number; originY: number; x: number; y: number; screenPerMm: number }
  | { kind: "handle"; id: string; part: "body" | "label" | "lock"; originX: number; originY: number; x: number; y: number; screenPerMm: number }
  | { kind: "user-dim"; id: string; originX: number; originY: number; offset: number; nx: number; ny: number; screenPerMm: number }
  | { kind: "label"; key: string; axis: "x" | "y" | "both"; originX: number; originY: number; x: number; y: number; screenPerMm: number }
  | { kind: "dim-new"; view: string; ax: number; ay: number; bx: number; by: number; originX: number; originY: number; offset: number; nx: number; ny: number; screenPerMm: number }
  | { kind: "view"; key: string; originX: number; originY: number; x: number; y: number; perPx: number };

interface FigureProps {
  shower: Shower;
  unit: UnitId;
  width: number;
  height: number;
  mode?: FigureMode;
  selectedId?: string | null;
  activeRun?: string;
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, x: number) => void;
  onResize?: (id: string, next: { x: number; width: number }) => void;
  onResizeSide?: (id: string, length: number) => void;
  onMoveSide?: (id: string, attachX: number) => void;
  onMoveFixture?: (kind: "wc" | "shower", x: number, y: number) => void;
  projectRef?: MutableRefObject<(clientX: number, clientY: number) => number | null>;
  watermark?: string | null;
  exportAs?: string;
  highlightIds?: string[];
  highlightCeiling?: boolean;
  dimArmed?: boolean;
  onAddDim?: (dim: UserDim) => void;
  onMoveDim?: (id: string, offset: number) => void;
  onNudgeLabel?: (key: string, x: number, y: number) => void;
  onNudgeHandle?: (id: string, part: "body" | "label" | "lock", x: number, y: number) => void;
  onMoveView?: (key: string, x: number, y: number) => void;
  fitWidth?: number;
  fitHeight?: number;
  /** Prefix for dimension keys so a return keeps its own dragged sizes. */
  dimScope?: string;
}

export default function ShowerFigure({
  shower,
  unit,
  width,
  height,
  mode = "studio",
  selectedId = null,
  activeRun = "front",
  onSelect,
  onMove,
  onResize,
  onResizeSide,
  onMoveSide,
  onMoveFixture,
  projectRef,
  watermark,
  exportAs,
  highlightIds = [],
  highlightCeiling = false,
  dimArmed = false,
  onAddDim,
  onMoveDim,
  onNudgeLabel,
  onNudgeHandle,
  onMoveView,
  fitWidth,
  fitHeight,
  dimScope,
}: FigureProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const contentRef = useRef<SVGGElement>(null);
  const [quoteBox, setQuoteBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const figId = useId().replace(/:/g, "");
  const drag = useRef<DragState | null>(null);
  const [live, setLive] = useState<{ x: number; y: number; text: string } | null>(null);
  const [pendingDim, setPendingDim] = useState<UserDim | null>(null);
  const dimA = useRef<{ x: number; y: number; view: string } | null>(null);
  const dimOffset = useRef(0);
  const onMoveRef = useRef(onMove);
  const onResizeRef = useRef(onResize);
  const onResizeSideRef = useRef(onResizeSide);
  const onMoveSideRef = useRef(onMoveSide);
  const onMoveFixtureRef = useRef(onMoveFixture);
  const onSelectRef = useRef(onSelect);
  const onAddDimRef = useRef(onAddDim);
  const onMoveDimRef = useRef(onMoveDim);
  const onNudgeLabelRef = useRef(onNudgeLabel);
  const onNudgeHandleRef = useRef(onNudgeHandle);
  const onMoveViewRef = useRef(onMoveView);
  const unitRef = useRef(unit);
  onMoveRef.current = onMove;
  onResizeRef.current = onResize;
  onResizeSideRef.current = onResizeSide;
  onMoveSideRef.current = onMoveSide;
  onMoveFixtureRef.current = onMoveFixture;
  onSelectRef.current = onSelect;
  onAddDimRef.current = onAddDim;
  onMoveDimRef.current = onMoveDim;
  onNudgeLabelRef.current = onNudgeLabel;
  onNudgeHandleRef.current = onNudgeHandle;
  onMoveViewRef.current = onMoveView;
  unitRef.current = unit;

  const planOn = mode === "plan" || (mode === "studio" && showPlan(shower));
  const swingPad = planOn ? swingMargin(shower) : { left: 0, right: 0, below: 0 };
  const elevOn = mode === "studio" || mode === "elevations" || mode === "elevation";
  const sideViews = mode === "elevation" ? [] : elevOn ? shower.sides : [];
  const depth = displayDepth(shower);
  const faceMm = Math.max(1, shower.material.profileFace || 16);
  const framed = shower.material.finish === "profile";
  const metal = COLOUR_HEX[shower.material.colour] ?? "#7d868c";
  const hardware = hardwareHex(shower.material);

  const views: { key: string; kind: "plan" | "elev"; widthMm: number; heightMm: number; title: string }[] = [];
  if (planOn) views.push({ key: "plan", kind: "plan", widthMm: Math.max(shower.width + swingPad.left + swingPad.right, 1), heightMm: depth + swingPad.below, title: "Plan" });
  if (elevOn) {
    views.push({ key: "front", kind: "elev", widthMm: Math.max(shower.width, 1), heightMm: Math.max(shower.height, 1), title: "Elevation" });
    for (const side of sideViews) {
      views.push({
        key: side.id,
        kind: "elev",
        widthMm: Math.max(side.length, 1),
        heightMm: Math.max(shower.height, 1),
        title: `${side.name} elevation`,
      });
    }
  }

  const quote = mode !== "studio";
  const single = mode === "elevation" || mode === "plan";
  const layoutW = fitWidth ?? width;
  const layoutH = fitHeight ?? height;
  let dimTop = single ? (quote ? 96 : 110) : quote ? 168 : 124;
  let dimBot = single ? (quote ? 48 : 78) : quote ? 96 : 96;
  const gapMm = quote ? 120 : 168;
  const padL = single ? (quote ? 220 : 148) : quote ? 168 : 136;
  const padR = single ? (quote ? 130 : 36) : quote ? 96 : 86;
  const availW = Math.max(40, layoutW - padL - padR);
  const availH = Math.max(40, layoutH - 10);
  const only = views[0];
  if (quote && single && only) {
    const topMm = only.kind === "plan" ? 240 : 176;
    const botMm = only.kind === "plan" ? 96 : 28;
    for (let pass = 0; pass < 4; pass += 1) {
      const room = Math.max(40, availH - dimTop - dimBot);
      const fit = Math.min(availW / Math.max(1, only.widthMm), room / Math.max(1, only.heightMm));
      dimTop = Math.ceil(topMm * fit + 56);
      dimBot = Math.ceil(botMm * fit + 28);
    }
  }
  const arranged = arrangeViews(views, availW, availH, dimTop, dimBot, gapMm);
  const scale = arranged.scale;
  const oxShift = padL + Math.max(0, (availW - arranged.blockW) / 2);
  const tightQuote = quote && single;
  const oyShift = tightQuote ? 4 : 6 + Math.max(0, (availH - arranged.blockH) / 2);
  const svgH = tightQuote ? Math.ceil(arranged.blockH + oyShift + 8) : height;
  const frameBox = `0 0 ${width} ${svgH}`;

  useLayoutEffect(() => {
    if (!tightQuote) return;
    const node = contentRef.current;
    const svg = svgRef.current;
    if (!node || !svg) return;
    let box: SVGRect;
    try {
      box = node.getBBox();
    } catch {
      return;
    }
    if (box.width < 2 || box.height < 2) return;
    const slot = svg.getBoundingClientRect();
    const slotMm = slot.width > 2 ? (slot.width * 25.4) / 96 : 90;
    const pad = (3 * box.width) / Math.max(24, slotMm - 6);
    const next = {
      x: box.x - pad,
      y: box.y - pad,
      w: Math.max(1, box.width + pad * 2),
      h: Math.max(1, box.height + pad * 2),
    };
    setQuoteBox((prev) => {
      if (
        prev &&
        Math.abs(prev.x - next.x) < 0.6 &&
        Math.abs(prev.y - next.y) < 0.6 &&
        Math.abs(prev.w - next.w) < 0.6 &&
        Math.abs(prev.h - next.h) < 0.6
      ) {
        return prev;
      }
      return next;
    });
  }, [tightQuote, shower, width, svgH, scale, unit]);
  const placedViews = arranged.items.map((view) => {
    const shift = quote ? { x: 0, y: 0 } : (shower.viewShift?.[view.key] ?? { x: 0, y: 0 });
    return {
      ...view,
      ox: oxShift + view.x + shift.x,
      top: oyShift + view.y + shift.y,
    };
  });
  const activeView = placedViews.find((view) => view.key === (activeRun === "front" ? "front" : activeRun)) ?? placedViews.find((view) => view.kind === "elev");
  const projectOx = activeView?.ox ?? oxShift;

  useEffect(() => {
    const pointer = (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      const rect = svg?.getBoundingClientRect();
      if (!rect || rect.width < 2 || rect.height < 2) return { x: clientX, y: clientY };
      return {
        x: ((clientX - rect.left) / rect.width) * width,
        y: ((clientY - rect.top) / rect.height) * height,
      };
    };
    const move = (event: PointerEvent) => {
      const active = drag.current;
      if (!active) return;
      if (active.kind === "view") {
        const x = Math.round(active.x + (event.clientX - active.originX) / active.perPx);
        const y = Math.round(active.y + (event.clientY - active.originY) / active.perPx);
        onMoveViewRef.current?.(active.key, x, y);
        return;
      }
      if (active.screenPerMm <= 0) return;
      const spot = pointer(event.clientX, event.clientY);
      if (active.kind === "move") {
        onMoveRef.current?.(active.id, active.itemX + (event.clientX - active.originX) / active.screenPerMm);
        return;
      }
      if (active.kind === "width") {
        const dx = (event.clientX - active.originX) / active.screenPerMm;
        const min = 40;
        const right = active.itemX + active.itemW;
        let x = active.itemX;
        let nextW = active.itemW;
        if (active.edge === "right") {
          nextW = clamp(active.itemW + dx, min, Math.max(min, active.limit - active.itemX));
          x = active.itemX;
        } else {
          x = active.itemX + dx;
          x = Math.max(0, Math.min(x, right - min));
          nextW = right - x;
          if (x + nextW > active.limit) nextW = Math.max(min, active.limit - x);
        }
        onResizeRef.current?.(active.id, { x: Math.round(x), width: Math.round(nextW) });
        setLive({ x: spot.x + 10, y: spot.y - 8, text: `${formatLength(nextW, unitRef.current)} ${unitRef.current}` });
        return;
      }
      if (active.kind === "side-x") {
        const next = Math.max(0, Math.round(active.attachX + (event.clientX - active.originX) / active.screenPerMm));
        onMoveSideRef.current?.(active.id, next);
        setLive({ x: spot.x + 10, y: spot.y - 8, text: `${formatLength(next, unitRef.current)} ${unitRef.current}` });
        return;
      }
      if (active.kind === "fixture") {
        const x = Math.max(0, Math.round(active.x + (event.clientX - active.originX) / active.screenPerMm));
        const y = Math.max(0, Math.round(active.y + (event.clientY - active.originY) / active.screenPerMm));
        onMoveFixtureRef.current?.(active.fixture, x, y);
        setLive({ x: spot.x + 10, y: spot.y - 8, text: `${formatLength(x, unitRef.current)} · ${formatLength(y, unitRef.current)}` });
        return;
      }
      if (active.kind === "handle") {
        const dx = (event.clientX - active.originX) / active.screenPerMm;
        const dy = (event.clientY - active.originY) / active.screenPerMm;
        const x = Math.round(active.x + dx);
        const y = active.part === "lock" ? Math.max(0, Math.round(active.y - dy)) : Math.round(active.y + dy);
        onNudgeHandleRef.current?.(active.id, active.part, x, y);
        return;
      }
      if (active.kind === "label") {
        const dx = (event.clientX - active.originX) / active.screenPerMm;
        const dy = (event.clientY - active.originY) / active.screenPerMm;
        const x = active.axis === "y" ? 0 : Math.round(active.x + dx);
        const y = active.axis === "x" ? 0 : Math.round(active.y + dy);
        onNudgeLabelRef.current?.(active.key, x, y);
        return;
      }
      if (active.kind === "user-dim" || active.kind === "dim-new") {
        const dx = (event.clientX - active.originX) / active.screenPerMm;
        const dy = (event.clientY - active.originY) / active.screenPerMm;
        const offset = Math.round(active.offset + dx * active.nx + dy * active.ny);
        dimOffset.current = offset;
        if (active.kind === "user-dim") onMoveDimRef.current?.(active.id, offset);
        else setPendingDim({ id: "pending", view: active.view, ax: active.ax, ay: active.ay, bx: active.bx, by: active.by, offset, nudgeX: 0, nudgeY: 0 });
        return;
      }
      const delta = (active.axis === "x" ? event.clientX - active.origin : event.clientY - active.origin) / active.screenPerMm;
      const next = Math.max(10, Math.round(active.length + (active.axis === "y" ? -delta : delta)));
      onResizeSideRef.current?.(active.id, next);
      setLive({ x: spot.x + 10, y: spot.y - 8, text: `${formatLength(next, unitRef.current)} ${unitRef.current}` });
    };
    const up = () => {
      const active = drag.current;
      if (active?.kind === "dim-new") {
        onAddDimRef.current?.({
          id: uid("dim"),
          view: active.view,
          ax: active.ax,
          ay: active.ay,
          bx: active.bx,
          by: active.by,
          offset: dimOffset.current,
          nudgeX: 0,
          nudgeY: 0,
        });
        setPendingDim(null);
      }
      drag.current = null;
      setLive(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [width, height]);

  if (projectRef) {
    projectRef.current = (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return null;
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
      const svgX = ((clientX - rect.left) / rect.width) * width;
      return (svgX - projectOx) / scale;
    };
  }

  function pixelsPerMm() {
    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    return rect && rect.width > 2 ? (rect.width / width) * scale : scale;
  }

  function startDrag(event: ReactPointerEvent, item: PlacedItem) {
    if (!onMove) return;
    event.stopPropagation();
    event.preventDefault();
    drag.current = { kind: "move", id: item.id, originX: event.clientX, itemX: item.x, screenPerMm: pixelsPerMm() };
    onSelectRef.current?.(item.id);
  }

  function startEdge(event: ReactPointerEvent, item: PlacedItem, edge: "left" | "right", limit: number) {
    if (!onResize) return;
    event.stopPropagation();
    event.preventDefault();
    drag.current = {
      kind: "width",
      id: item.id,
      edge,
      originX: event.clientX,
      itemX: item.x,
      itemW: item.width,
      limit,
      screenPerMm: pixelsPerMm(),
    };
    onSelectRef.current?.(item.id);
  }

  function startSideMove(event: ReactPointerEvent, side: SideRun) {
    if (!onMoveSide) return;
    event.stopPropagation();
    event.preventDefault();
    drag.current = { kind: "side-x", id: side.id, originX: event.clientX, attachX: side.attachX, screenPerMm: pixelsPerMm() };
    onSelectRef.current?.(side.id);
  }

  function startFixture(event: ReactPointerEvent, fixture: "wc" | "shower") {
    if (!onMoveFixture) return;
    event.stopPropagation();
    event.preventDefault();
    const point = fixture === "wc" ? shower.wc : shower.showerPoint;
    drag.current = {
      kind: "fixture",
      fixture,
      originX: event.clientX,
      originY: event.clientY,
      x: point.x,
      y: point.y,
      screenPerMm: pixelsPerMm(),
    };
    onSelectRef.current?.(fixture === "wc" ? WC_ID : SHOWER_ID);
  }

  function startView(event: ReactPointerEvent, key: string) {
    if (!onMoveView || quote) return;
    event.stopPropagation();
    event.preventDefault();
    const prev = shower.viewShift?.[key] ?? { x: 0, y: 0 };
    const rect = svgRef.current?.getBoundingClientRect();
    const perPx = rect && rect.width > 2 ? rect.width / width : 1;
    drag.current = { kind: "view", key, originX: event.clientX, originY: event.clientY, x: prev.x, y: prev.y, perPx };
  }

  function startHandle(event: ReactPointerEvent, item: PlacedItem, part: "body" | "label" | "lock") {
    if (!onNudgeHandle) return;
    event.stopPropagation();
    event.preventDefault();
    drag.current = {
      kind: "handle",
      id: item.id,
      part,
      originX: event.clientX,
      originY: event.clientY,
      x: part === "lock" ? item.lockDx : part === "body" ? item.handleDx : item.handleLabelDx,
      y: part === "lock" ? item.lockHeight : part === "body" ? item.handleDy : item.handleLabelDy,
      screenPerMm: pixelsPerMm(),
    };
  }

  function startLabel(event: ReactPointerEvent, key: string, axis?: "x" | "y") {
    if (!onNudgeLabel) return;
    event.stopPropagation();
    event.preventDefault();
    const prev = shower.labelNudge[key] ?? { x: 0, y: 0 };
    drag.current = {
      kind: "label",
      key,
      axis: axis ?? "both",
      originX: event.clientX,
      originY: event.clientY,
      x: axis === "y" ? 0 : prev.x,
      y: axis === "x" ? 0 : prev.y,
      screenPerMm: pixelsPerMm(),
    };
  }

  function pickDim(event: ReactPointerEvent, ox: number, top: number, viewKey: string) {
    if (!dimArmed) return;
    event.stopPropagation();
    event.preventDefault();
    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    if (!svg || !rect || rect.width < 2) return;
    const sx = ((event.clientX - rect.left) / rect.width) * width;
    const sy = ((event.clientY - rect.top) / rect.height) * height;
    const mmx = (sx - ox) / scale;
    const mmy = (sy - top) / scale;
    if (!dimA.current || dimA.current.view !== viewKey) {
      dimA.current = { x: mmx, y: mmy, view: viewKey };
      setLive({ x: sx + 8, y: sy, text: "Point A" });
      return;
    }
    const a = dimA.current;
    dimA.current = null;
    const adx = mmx - a.x;
    const ady = mmy - a.y;
    const len = Math.hypot(adx, ady) || 1;
    const nx = -ady / len;
    const ny = adx / len;
    dimOffset.current = 80;
    drag.current = { kind: "dim-new", view: viewKey, ax: a.x, ay: a.y, bx: mmx, by: mmy, originX: event.clientX, originY: event.clientY, offset: 80, nx, ny, screenPerMm: pixelsPerMm() };
    setPendingDim({ id: "pending", view: viewKey, ax: a.x, ay: a.y, bx: mmx, by: mmy, offset: 80, nudgeX: 0, nudgeY: 0 });
  }

  function startUserDim(event: ReactPointerEvent, dim: UserDim) {
    if (!onMoveDim) return;
    event.stopPropagation();
    event.preventDefault();
    const adx = dim.bx - dim.ax;
    const ady = dim.by - dim.ay;
    const len = Math.hypot(adx, ady) || 1;
    drag.current = { kind: "user-dim", id: dim.id, originX: event.clientX, originY: event.clientY, offset: dim.offset, nx: -ady / len, ny: adx / len, screenPerMm: pixelsPerMm() };
  }

  function startSide(event: ReactPointerEvent, side: SideRun, axis: "x" | "y") {
    if (!onResizeSide) return;
    event.stopPropagation();
    event.preventDefault();
    drag.current = {
      kind: "side",
      id: side.id,
      axis,
      origin: axis === "x" ? event.clientX : event.clientY,
      length: side.length,
      screenPerMm: pixelsPerMm(),
    };
  }

  return (
    <svg
      ref={svgRef}
      className="canvas"
      width={tightQuote ? "100%" : width}
      height={tightQuote ? "100%" : svgH}
      viewBox={tightQuote && quoteBox ? `${quoteBox.x} ${quoteBox.y} ${quoteBox.w} ${quoteBox.h}` : frameBox}
      overflow={tightQuote ? "hidden" : undefined}
      preserveAspectRatio="xMidYMid meet"
      data-testid="canvas"
      data-mode={mode}
      data-scale={scale}
      data-uniform="1"
      data-finish={shower.material.finish}
      data-export={exportAs || undefined}
      data-quote={quote ? "yes" : "no"}
      data-view-gap={placedViews.length > 1 ? String(gapMm) : "0"}
      role="img"
      aria-label="Shower drawing"
    >
      <style>{drawingCss(quote)}</style>
      <EditCtx.Provider value={{ startHandle, startLabel, nudge: shower.labelNudge ?? {}, editable: !quote && Boolean(onNudgeLabel), scale }}>
      <Defs figId={figId} metal={metal} />
      <rect data-canvas="paper" width={width} height={svgH} fill={quote ? "none" : "#ffffff"} onPointerDown={() => onSelect?.(null)} />
      {watermark && (
        <image
          href={watermark}
          x={width / 2 - 110}
          y={svgH / 2 - 110}
          width={220}
          height={220}
          opacity={0.16}
          preserveAspectRatio="xMidYMid meet"
          data-testid="logo-watermark"
          pointerEvents="none"
        />
      )}
      <g ref={contentRef} data-testid="quote-fit">
      {placedViews.map((view) => {
        const side = view.kind === "elev" ? shower.sides.find((item) => item.id === view.key) : undefined;
        const dimKey = view.kind === "plan" ? "plan" : side?.id ?? dimScope ?? "front";
        const viewDims = [...shower.dims, ...(pendingDim && pendingDim.view === dimKey ? [pendingDim] : [])].filter((dim) => dim.view === dimKey);
        const X = (mm: number) => view.ox + (mm + (view.kind === "plan" ? swingPad.left : 0)) * scale;
        const Y = (mm: number) => view.top + mm * scale;
        const dimCatch = dimArmed && !quote ? (
          <rect
            data-testid="dim-catch"
            data-view={dimKey}
            x={view.ox}
            y={view.top}
            width={view.widthMm * scale}
            height={view.heightMm * scale}
            fill="transparent"
            onPointerDown={(event) => pickDim(event, view.kind === "plan" ? view.ox + swingPad.left * scale : view.ox, view.top, dimKey)}
          />
        ) : null;
        if (view.kind === "plan") {
          return (
            <g key={view.key} data-testid="plan">
              {!quote && (
                <text x={view.ox} y={Math.max(16, view.top - 108)} className="view-label" data-testid="view-move" style={{ cursor: onMoveView ? "move" : undefined }} onPointerDown={onMoveView ? (event) => startView(event, view.key) : undefined}>
                  Plan
                </text>
              )}
              <PlanView
                shower={shower}
                X={X}
                PY={Y}
                scale={scale}
                depth={depth}
                faceMm={faceMm}
                framed={framed}
                selectedId={selectedId}
                onDrag={onMove ? startDrag : undefined}
                onEdge={onResize ? (event, item, edge) => startEdge(event, item, edge, shower.width) : undefined}
                onSide={onResizeSide ? (event, side) => startSide(event, side, "y") : undefined}
                onSideMove={onMoveSide ? (event, side) => startSideMove(event, side) : undefined}
                onFixture={onMoveFixture ? (event, fixture) => startFixture(event, fixture) : undefined}
                unit={unit}
                captions={false}
                onSelect={onSelect}
                showBalance={!quote}
                highlightIds={highlightIds}
                highlightCeiling={highlightCeiling}
              />
              {shower.useDepth && (
                <DimV x={X(shower.width) + 22 * scale} y1={Y(Math.max(0, depth - Math.max(shower.depth, 1)))} y2={Y(depth)} label={`Depth ${formatLength(shower.depth, unit)} ${unit}`} testId="room-depth" fromX={X(shower.width)} />
              )}
              {viewDims.map((dim) => (
                <UserDimMark
                  key={dim.id}
                  dim={dim}
                  X={X}
                  Y={Y}
                  scale={scale}
                  unit={unit}
                  onDrag={dim.id === "pending" || quote ? undefined : (event) => startUserDim(event, dim)}
                />
              ))}
              {dimCatch}
            </g>
          );
        }
        const model = side ? elevationShower(shower, side) : shower;
        const active = side ? activeRun === side.id : activeRun === "front";
        return (
          <g key={view.key} data-testid={side ? "side-elevation" : "elevation"} data-active={active ? "yes" : "no"}>
            {!quote && (
              <text x={view.ox} y={Math.max(16, view.top - 108)} className="view-label" data-testid="view-move" style={{ cursor: onMoveView ? "move" : undefined }} onPointerDown={onMoveView ? (event) => startView(event, view.key) : undefined}>
                {view.title}
              </text>
            )}
            <Elevation
              shower={model}
              source={shower}
              unit={unit}
              X={X}
              Y={Y}
              scale={scale}
              ox={view.ox}
              top={view.top}
              faceMm={faceMm}
              framed={framed}
              metal={metal}
              hardware={hardware}
              figId={figId}
              showTop={side == null}
              dimScope={side?.id ?? dimScope}
              selectedId={selectedId}
              onDrag={onMove ? startDrag : undefined}
              onEdge={onResize ? (event, item, edge) => startEdge(event, item, edge, model.width) : undefined}
              onSideEdge={side && onResizeSide ? (event) => startSide(event, side, "x") : undefined}
              onSelect={onSelect}
              captions={false}
              showBalance={!quote}
            />
            {viewDims.map((dim) => (
                <UserDimMark
                  key={dim.id}
                  dim={dim}
                  X={X}
                  Y={Y}
                  scale={scale}
                  unit={unit}
                  onDrag={dim.id === "pending" || quote ? undefined : (event) => startUserDim(event, dim)}
                />
              ))}
            {dimCatch}
          </g>
        );
      })}
      </g>
      {live && (
        <g data-testid="live-size" pointerEvents="none">
          <rect x={live.x} y={live.y - 14} width={Math.max(54, live.text.length * 6.4 + 12)} height={18} rx="3" fill="#111111" />
          <text x={live.x + 6} y={live.y} fill="#ffffff" fontSize="11">
            {live.text}
          </text>
        </g>
      )}
      </EditCtx.Provider>
    </svg>
  );
}

function UserDimMark({
  dim,
  X,
  Y,
  unit,
  onDrag,
}: {
  dim: UserDim;
  X: (mm: number) => number;
  Y: (mm: number) => number;
  scale: number;
  unit: UnitId;
  onDrag?: (event: ReactPointerEvent) => void;
}) {
  const dx = dim.bx - dim.ax;
  const dy = dim.by - dim.ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const ox = nx * dim.offset;
  const oy = ny * dim.offset;
  const ax = X(dim.ax + ox);
  const ay = Y(dim.ay + oy);
  const bx = X(dim.bx + ox);
  const by = Y(dim.by + oy);
  const tick = 5;
  const tx = (dx / len) * tick;
  const ty = (dy / len) * tick;
  return (
    <g data-testid="user-dim" data-mm={Math.round(len)} data-axis="normal" data-span={Math.hypot(bx - ax, by - ay)} onPointerDown={onDrag} style={{ cursor: onDrag ? "move" : undefined }}>
      <line className="ext" x1={X(dim.ax)} y1={Y(dim.ay)} x2={ax} y2={ay} />
      <line className="ext" x1={X(dim.bx)} y1={Y(dim.by)} x2={bx} y2={by} />
      <BrokenSpan x1={ax} y1={ay} x2={bx} y2={by} label={formatLength(len, unit)} />
      <line className="dim" x1={ax - tx - ty} y1={ay - ty + tx} x2={ax + tx + ty} y2={ay + ty - tx} />
      <line className="dim" x1={bx - tx - ty} y1={by - ty + tx} x2={bx + tx + ty} y2={by + ty - tx} />
    </g>
  );
}

function arrangeViews(
  views: { key: string; kind: "plan" | "elev"; widthMm: number; heightMm: number; title: string }[],
  availW: number,
  availH: number,
  dimTop: number,
  dimBot: number,
  gapMm: number,
) {
  const blank = {
    scale: 0.02,
    blockW: 0,
    blockH: 0,
    items: [] as { key: string; kind: "plan" | "elev"; widthMm: number; heightMm: number; title: string; x: number; y: number }[],
  };
  if (!views.length) return blank;
  const options = [false, views.length > 1].map((horizontal) => {
    const gaps = Math.max(0, views.length - 1);
    const gapPx = gaps ? Math.max(72, gapMm) : 0;
    const contentW = horizontal ? views.reduce((sum, view) => sum + view.widthMm, 0) : Math.max(...views.map((view) => view.widthMm));
    const contentH = horizontal ? Math.max(...views.map((view) => view.heightMm)) : views.reduce((sum, view) => sum + view.heightMm, 0);
    const chromeH = horizontal ? dimTop + dimBot : views.length * (dimTop + dimBot);
    const scale = Math.max(
      0.01,
      Math.min(
        Math.max(80, availW - gaps * gapPx) / Math.max(1, contentW),
        Math.max(40, availH - chromeH - (horizontal ? 0 : gaps * gapPx)) / Math.max(1, contentH),
      ),
    );
    let cursorX = 0;
    let cursorY = 0;
    const items = views.map((view) => {
      if (horizontal) {
        const x = cursorX;
        cursorX += view.widthMm * scale + gapPx;
        return { ...view, x, y: dimTop };
      }
      const y = cursorY + dimTop;
      cursorY = y + view.heightMm * scale + dimBot + gapPx;
      return { ...view, x: 0, y };
    });
    const blockW = horizontal ? Math.max(0, cursorX - gapPx) : contentW * scale;
    const blockH = horizontal ? contentH * scale + chromeH : cursorY;
    return { scale, blockW, blockH, items };
  });
  return options.sort((a, b) => b.scale - a.scale)[0];
}

function Defs({ figId, metal }: { figId: string; metal: string }) {
  return (
    <defs>
      <linearGradient id={`${figId}-glass`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
        <stop offset="100%" stopColor="#f4f6f7" stopOpacity="0.28" />
      </linearGradient>
      <pattern id={`${figId}-sheet`} width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="#ffffff" />
        <path d="M0 8 L8 0" stroke="#9aa3a8" strokeWidth="0.7" />
      </pattern>
      <pattern id={`${figId}-hatch`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="5" stroke={metal} strokeWidth="1.2" />
      </pattern>
    </defs>
  );
}

function Elevation({
  shower,
  source,
  unit,
  X,
  Y,
  scale,
  faceMm,
  framed,
  metal,
  hardware,
  figId,
  showTop,
  selectedId,
  onDrag,
  onEdge,
  onSideEdge,
  onSelect,
  captions,
  showBalance,
  dimScope,
}: {
  shower: Shower;
  source: Shower;
  unit: UnitId;
  X: (mm: number) => number;
  Y: (mm: number) => number;
  scale: number;
  ox: number;
  top: number;
  faceMm: number;
  framed: boolean;
  metal: string;
  hardware: string;
  figId: string;
  showTop: boolean;
  selectedId: string | null;
  onDrag?: (event: ReactPointerEvent, item: PlacedItem) => void;
  onEdge?: (event: ReactPointerEvent, item: PlacedItem, edge: "left" | "right") => void;
  onSideEdge?: (event: ReactPointerEvent) => void;
  onSelect?: (id: string | null) => void;
  captions: boolean;
  showBalance: boolean;
  dimScope?: string;
}) {
  const dimId = (id?: string) => (id ? (dimScope ? `${dimScope}-${id}` : id) : undefined);
  const u = (mm: number) => mm * scale;
  const face = faceMm * scale;
  const topBox = showTop ? topFixedBox(shower) : null;
  const dims = segmentDims(shower, unit);
  const labelDy = captions ? captionShifts(shower, X, Y, scale, unit) : new Map<string, number>();
  return (
    <g>
      <rect
        data-testid={showTop ? "soft-frame" : undefined}
        data-width={shower.width}
        data-height={shower.height}
        x={X(0)}
        y={Y(0)}
        width={Math.max(0, shower.width) * scale}
        height={Math.max(0, shower.height) * scale}
        fill="#ffffff"
        stroke="none"
        onPointerDown={() => onSelect?.(null)}
      />
      {topBox && (
        <TopFixedView
          layer="fill"
          shower={shower}
          box={topBox}
          X={X}
          Y={Y}
          scale={scale}
          face={face}
          faceMm={faceMm}
          framed={framed}
          metal={metal}
          figId={figId}
          unit={unit}
          gaps={hingeGaps(shower, X, Y, scale)}
        />
      )}
      {ordered(shower.items)
        .filter((item) => item.kind !== "wall")
        .map((item) => (
          <ItemView
            key={`fill-${item.id}`}
            layer="fill"
            shower={shower}
            item={item}
            geom={geometryOf(shower, item)}
            X={X}
            Y={Y}
            scale={scale}
            face={face}
            faceMm={faceMm}
            metal={metal}
            hardware={hardware}
            framed={framed}
            figId={figId}
            unit={unit}
            selected={false}
            gaps={[]}
            captions={captions}
            onDrag={onDrag}
            onEdge={onEdge}
          />
        ))}
      {ordered(shower.items)
        .filter((item) => item.kind === "wall" && item.wallSide === "inside")
        .map((item) => (
          <ItemView
            key={`in-${item.id}`}
            layer="wall"
            shower={shower}
            item={item}
            geom={geometryOf(shower, item)}
            X={X}
            Y={Y}
            scale={scale}
            face={face}
            faceMm={faceMm}
            metal={metal}
            hardware={hardware}
            framed={framed}
            figId={figId}
            unit={unit}
            selected={item.id === selectedId}
            gaps={[]}
            captions={captions}
            labelDy={labelDy.get(item.id) ?? 0}
            onDrag={onDrag}
            onEdge={onEdge}
          />
        ))}
      {ordered(shower.items)
        .filter((item) => item.kind === "wall" && item.wallSide !== "inside")
        .map((item) => (
          <ItemView
            key={`out-${item.id}`}
            layer="wall"
            shower={shower}
            item={item}
            geom={geometryOf(shower, item)}
            X={X}
            Y={Y}
            scale={scale}
            face={face}
            faceMm={faceMm}
            metal={metal}
            hardware={hardware}
            framed={framed}
            figId={figId}
            unit={unit}
            selected={item.id === selectedId}
            gaps={[]}
            captions={captions}
            labelDy={labelDy.get(item.id) ?? 0}
            onDrag={onDrag}
            onEdge={onEdge}
          />
        ))}
      {topBox && (
        <TopFixedView
          layer="line"
          shower={shower}
          box={topBox}
          X={X}
          Y={Y}
          scale={scale}
          face={face}
          faceMm={faceMm}
          framed={framed}
          metal={metal}
          figId={figId}
          unit={unit}
          gaps={hingeGaps(shower, X, Y, scale)}
        />
      )}
      {ordered(shower.items)
        .filter((item) => item.kind !== "wall")
        .map((item) => (
          <ItemView
            key={`line-${item.id}`}
            layer="line"
            shower={shower}
            item={item}
            geom={geometryOf(shower, item)}
            X={X}
            Y={Y}
            scale={scale}
            face={face}
            faceMm={faceMm}
            metal={metal}
            hardware={hardware}
            framed={framed}
            figId={figId}
            unit={unit}
            selected={item.id === selectedId}
            gaps={[...hingeGaps(shower, X, Y, scale), ...overlapHideGaps(shower, item, X, Y, scale, faceMm)]}
            captions={captions}
            labelDy={labelDy.get(item.id) ?? 0}
            labelScope={dimScope ?? ""}
            onDrag={undefined}
            onEdge={onEdge}
          />
        ))}
      <HingeLayer shower={shower} X={X} Y={Y} scale={scale} />
      {framed && shower.items.length === 0 && !topBox && shower.product !== "cubicle" && (
        <g pointerEvents="none">
          <MiterFrame x={X(0)} y={Y(0)} w={shower.width * scale} h={shower.height * scale} t={face} faceMm={faceMm} gaps={[]} />
        </g>
      )}
      {!framed && shower.product !== "cubicle" && (
        <rect x={X(0)} y={Y(0)} width={shower.width * scale} height={shower.height * scale} fill="none" stroke="#243038" strokeWidth="0.6" pointerEvents="none" />
      )}
      {shower.product === "cubicle" && <CubicleTrim shower={shower} X={X} Y={Y} scale={scale} unit={unit} />}
      {coverageGaps(shower.width, shower.items).map((gap) => (
        <g key={`gap-${gap.x}`} data-testid="balance-gap" data-width={Math.round(gap.width)} data-x={Math.round(gap.x)} pointerEvents="none">
          <rect
            x={X(gap.x)}
            y={Y(0)}
            width={Math.max(0, gap.width) * scale}
            height={Math.max(0, shower.height) * scale}
            fill="none"
            stroke="#111111"
            strokeWidth="0.9"
            strokeDasharray="5 3"
          />
          {showBalance && (
            <text x={X(gap.x + gap.width / 2)} y={Y(shower.height / 2)} textAnchor="middle" className="panel-label">
              Balance
            </text>
          )}
        </g>
      ))}
      {dims.map((dim, index) => (
        <DimH
          key={`${dim.testId}-${index}`}
          x1={X(dim.x1)}
          x2={X(dim.x2)}
          y={Y(0) - u(dim.row === 0 ? 48 : 112)}
          fromY={Y(0)}
          label={dim.label}
          testId={dimId(dim.testId)}
        />
      ))}
      <DimH
        x1={X(0)}
        x2={X(shower.width)}
        y={Y(0) - u(176)}
        fromY={Y(0)}
        label={`${formatLength(shower.width, unit)} ${unit}`}
        testId={dimId("overall-width")}
        strong
      />
      <DimV x={X(0) - u(48)} y1={Y(0)} y2={Y(shower.height)} label={`${formatLength(shower.height, unit)} ${unit}`} testId={dimId("overall-height")} fromX={X(0)} />
      <StackHeights shower={shower} X={X} Y={Y} scale={scale} unit={unit} />
      {showBalance && <BalanceNote shower={shower} source={source} unit={unit} x={X(0)} y={Y(shower.height) + 58} />}
      {showTop &&
        source.sides.map((side, index) => {
          const taken = dims.some((dim) => Math.abs(dim.x1 - X(0)) < 3 && Math.abs(dim.x2 - X(side.attachX)) < 3);
          return (
            <g key={side.id} data-testid="elev-partition" data-x={Math.round(side.attachX)} data-length={Math.round(side.length)} data-face={side.face} pointerEvents="none">
              {side.face === "wall" ? (
                <line x1={X(side.attachX)} y1={Y(0)} x2={X(side.attachX)} y2={Y(shower.height)} stroke="#111111" strokeWidth="1.1" strokeDasharray="5 3" />
              ) : (
                <>
                  <line x1={X(side.attachX - faceMm / 2)} y1={Y(0)} x2={X(side.attachX - faceMm / 2)} y2={Y(shower.height)} stroke="#111111" strokeWidth="0.6" />
                  <line x1={X(side.attachX + faceMm / 2)} y1={Y(0)} x2={X(side.attachX + faceMm / 2)} y2={Y(shower.height)} stroke="#111111" strokeWidth="0.6" />
                </>
              )}
              {!taken && side.attachX > 15 && (
                <DimH
                  x1={X(0)}
                  x2={X(side.attachX)}
                  y={Y(0) - u(112 + index * 64)}
                  fromY={Y(0)}
                  label={formatLength(side.attachX, unit)}
                  testId={`elev-partition-x-${side.id}`}
                />
              )}
            </g>
          );
        })}
      {source.ceiling.enabled && showTop && <CeilingBand shower={source} X={X} Y={Y} scale={scale} unit={unit} />}
      {onSideEdge && (
        <rect
          data-testid="resize-side"
          x={X(shower.width) - 6}
          y={Y(0)}
          width={12}
          height={Math.max(shower.height * scale, 8)}
          fill="transparent"
          style={{ cursor: "ew-resize" }}
          onPointerDown={onSideEdge}
        />
      )}
    </g>
  );
}

function cornerJoint(shower: Shower, x: number): boolean {
  if (shower.sides.some((side) => Math.abs(side.attachX - x) < 28)) return true;
  return shower.items.some((item) => item.kind === "return" && (Math.abs(item.x - x) < 28 || Math.abs(item.x + Math.max(item.width, item.depth) - x) < 28));
}

function fixedNeighbor(shower: Shower, item: PlacedItem, side: "left" | "right"): boolean {
  if (item.kind !== "fixed") return false;
  const edge = side === "left" ? item.x : item.x + item.width;
  if (cornerJoint(shower, edge)) return false;
  return shower.items.some((other) => {
    if (other.id === item.id || other.kind !== "fixed") return false;
    const otherEdge = side === "left" ? other.x + other.width : other.x;
    return Math.abs(otherEdge - edge) < 8;
  });
}

function sharedMullionSkip(shower: Shower, item: PlacedItem, faceMm: number): number[] {
  if (!fixedNeighbor(shower, item, "left")) return [];
  return [item.x, item.x + faceMm];
}

function sharedMullionOwner(shower: Shower, item: PlacedItem): boolean {
  return fixedNeighbor(shower, item, "right");
}

/** The stile behind a sliding overlap, in screen pixels, for the height of the joint. */
function overlapHideGaps(
  shower: Shower,
  item: PlacedItem,
  X: (mm: number) => number,
  Y: (mm: number) => number,
  scale: number,
  faceMm: number,
): ScreenGap[] {
  const gaps: ScreenGap[] = [];
  for (const door of shower.items) {
    if (door.kind !== "door" || door.doorStyle !== "sliding") continue;
    const side: "left" | "right" = door.handleSide === "right" ? "left" : "right";
    const edge = side === "left" ? door.x : door.x + door.width;
    const neighbor = shower.items.find((other) => {
      if (other.id === door.id || (other.kind !== "fixed" && other.kind !== "door")) return false;
      const otherEdge = side === "left" ? other.x + other.width : other.x;
      return Math.abs(otherEdge - edge) <= 45;
    });
    if (!neighbor) continue;
    const geom = geometryOf(shower, door);
    const span = geom.overlap > 0.5 ? geom.overlap : faceMm;
    const zoneLeft = side === "left" ? edge - span : edge;
    const doorInFront = door.slideSeat !== "inside";
    const neighborInFront =
      neighbor.kind === "door" &&
      neighbor.slideSeat !== "inside" &&
      doorInFront &&
      shower.items.indexOf(door) < shower.items.indexOf(neighbor);
    if (neighborInFront) continue;
    const rear = doorInFront ? neighbor : door;
    if (rear.id !== item.id) continue;
    const y0 = geom.leafY;
    const h = Math.max(geom.leafH, geom.h);
    gaps.push({
      x: X(zoneLeft) - 1.5,
      y: Y(y0) - 1,
      w: span * scale + 3,
      h: h * scale + 2,
    });
  }
  return gaps;
}

function ordered(items: PlacedItem[]): PlacedItem[] {
  const rank: Record<PlacedItem["kind"], number> = { wall: 0, fixed: 1, return: 2, door: 3 };
  return [...items].sort((a, b) => rank[a.kind] - rank[b.kind]);
}

function dimPieces(items: PlacedItem[]): PlacedItem[] {
  const glass = items.filter((item) => item.kind !== "return" && item.kind !== "wall" && item.width > 1);
  const walls = items.filter((item) => item.kind === "wall" && item.width > 1).filter((wall) => {
    return !glass.some((panel) => {
      const shared = Math.min(wall.x + wall.width, panel.x + panel.width) - Math.max(wall.x, panel.x);
      return shared > Math.min(wall.width, panel.width) * 0.45;
    });
  });
  return [...glass, ...walls];
}

function StackHeights({
  shower,
  X,
  Y,
  scale,
  unit,
}: {
  shower: Shower;
  X: (mm: number) => number;
  Y: (mm: number) => number;
  scale: number;
  unit: UnitId;
}) {
  const walls = shower.items.filter((item) => item.kind === "wall");
  const glasses = shower.items.filter((item) => item.kind === "fixed" || item.kind === "door");
  return (
    <g data-testid="stack-heights">
      {walls.map((wall) => {
        const box = geometryOf(shower, wall);
        return (
          <g key={wall.id}>
            <DimV x={X(box.x) - 36 * scale} y1={Y(box.y)} y2={Y(box.y + box.h)} label={formatLength(box.h, unit)} testId={`wall-height-${wall.id}`} fromX={X(box.x)} />
            <DimH x1={X(box.x)} x2={X(box.x + box.w)} y={Y(box.y + box.h) + 28 * scale} label={formatLength(box.w, unit)} testId={`wall-width-${wall.id}`} fromY={Y(box.y + box.h)} />
            {glasses.map((glass) => {
              const panel = geometryOf(shower, glass);
              const shared = Math.min(box.x + box.w, panel.x + panel.w) - Math.max(box.x, panel.x);
              const above = box.y - panel.y;
              if (shared < 20 || above < 40) return null;
              const left = Math.max(box.x, panel.x);
              return (
                <DimV
                  key={glass.id}
                  x={X(left) - 32 * scale}
                  y1={Y(panel.y)}
                  y2={Y(box.y)}
                  label={formatLength(above, unit)}
                  testId={`glass-above-${glass.id}`}
                  fromX={X(left)}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

function segmentDims(shower: Shower, unit: UnitId) {
  const pieces = dimPieces(shower.items)
    .map((item, index) => ({
      x: item.x,
      width: item.width,
      label: formatLength(item.width, unit),
      testId: `seg-dim-${index}`,
    }));
  const gaps = coverageGaps(shower.width, shower.items).map((gap, index) => ({
    x: gap.x,
    width: gap.width,
    label: formatLength(gap.width, unit),
    testId: index === 0 ? "balance-dim" : `balance-dim-${index}`,
  }));
  const rights = [-Infinity, -Infinity];
  return [...pieces, ...gaps]
    .sort((a, b) => a.x - b.x)
    .map((piece) => {
      const x1 = piece.x;
      const x2 = piece.x + piece.width;
      const mid = (x1 + x2) / 2;
      const half = piece.label.length * 28 + 10;
      let row = 0;
      if (mid - half < rights[0] + 8) row = 1;
      rights[row] = Math.max(rights[row], mid + half);
      return { x1, x2, label: piece.label, row, testId: piece.testId };
    });
}

function BalanceNote({
  shower,
  source,
  unit,
  x,
  y,
}: {
  shower: Shower;
  source: Shower;
  unit: UnitId;
  x: number;
  y: number;
}) {
  const total = shower.width;
  const used = usedWidth(shower.items);
  const left = balanceWidth(total, shower.items);
  const designed = designedSqFt(source);
  const opening = openingSqFt(source.width, source.height);
  return (
    <g pointerEvents="none">
      <text data-testid="balance-readout" data-total={Math.round(total)} data-used={Math.round(used)} data-balance={Math.round(left)} x={x} y={y} className="balance-note">
        Opening {formatLength(total, unit)} · Used {formatLength(used, unit)} · Balance {formatLength(left, unit)} {unit}
      </text>
      <text data-testid="area-readout" data-designed={designed.toFixed(2)} data-opening={opening.toFixed(2)} x={x} y={y + 22} className="balance-note">
        Area {designed.toFixed(2)} / {opening.toFixed(2)} sq ft
      </text>
    </g>
  );
}

function TopFixedView({
  layer,
  shower,
  box,
  X,
  Y,
  scale,
  face,
  faceMm,
  framed,
  figId,
  unit,
  gaps,
}: {
  layer: "fill" | "line";
  shower: Shower;
  box: { x: number; width: number; height: number };
  X: (mm: number) => number;
  Y: (mm: number) => number;
  scale: number;
  face: number;
  faceMm: number;
  framed: boolean;
  metal: string;
  figId: string;
  unit: UnitId;
  gaps: ScreenGap[];
}) {
  const x = X(box.x);
  const y = Y(0);
  const w = box.width * scale;
  const h = box.height * scale;
  const panel = { x: box.x, y: 0, w: box.width, h: box.height };
  return (
    <g data-testid={layer === "fill" ? "top-fixed" : undefined} data-width={Math.round(box.width)} data-height={Math.round(box.height)} data-x={Math.round(box.x)} data-span={shower.topFixed.span}>
      <PanelFace
        layer={layer}
        panel={panel}
        cuts={[]}
        x={x}
        y={y}
        w={w}
        h={h}
        framed={framed}
        face={face}
        faceMm={faceMm}
        infill={shower.material.infill}
        figId={figId}
        X={X}
        Y={Y}
        gaps={gaps}
      />
      {layer === "line" && <Channels x={x} y={y} w={w} h={h} channels={shower.topFixed.channels} inset={framed ? face : 3} />}
      {layer === "line" && w > 70 && h > 18 && <Label x={x + w / 2} y={y + h / 2} title="Top fixed" />}
      {layer === "line" && <DimV x={X(box.x + box.width) + 14 * scale} y1={y} y2={y + h} label={formatLength(box.height, unit)} testId="top-fixed-dim" fromX={X(box.x + box.width)} />}
      {layer === "line" && shower.topFixed.span !== "full" && (
        <DimH x1={x} x2={x + w} y={y + Math.min(h - 4, 14)} label={formatLength(box.width, unit)} testId="top-fixed-width" fromY={y} />
      )}
    </g>
  );
}

function ItemView({
  layer,
  shower,
  item,
  geom,
  X,
  Y,
  scale,
  face,
  faceMm,
  hardware,
  framed,
  figId,
  unit,
  selected,
  gaps,
  captions = true,
  labelDy = 0,
  labelScope = "",
  onDrag,
  onEdge,
}: {
  layer: "fill" | "line" | "wall";
  shower: Shower;
  item: PlacedItem;
  geom: Geom;
  X: (mm: number) => number;
  Y: (mm: number) => number;
  scale: number;
  face: number;
  faceMm: number;
  metal: string;
  hardware: string;
  framed: boolean;
  figId: string;
  unit: UnitId;
  selected: boolean;
  gaps: ScreenGap[];
  captions?: boolean;
  labelDy?: number;
  labelScope?: string;
  onDrag?: (event: ReactPointerEvent, item: PlacedItem) => void;
  onEdge?: (event: ReactPointerEvent, item: PlacedItem, edge: "left" | "right") => void;
}) {
  const down = onDrag ? (event: ReactPointerEvent) => onDrag(event, item) : undefined;
  const edge = onEdge
    ? (event: ReactPointerEvent, which: "left" | "right") => onEdge(event, item, which)
    : undefined;
  if (item.kind === "wall") {
    if (layer !== "wall") return null;
    const hint = item.wallSide === "inside";
    return (
      <g
        data-testid="placed-wall"
        data-id={item.id}
        data-x={item.x}
        data-width={item.width}
        data-height={Math.round(item.height)}
        data-cut={item.wallCut}
        data-side={item.wallSide}
        opacity={hint ? 0.38 : 1}
        onPointerDown={down}
      >
        <Bricks x={X(geom.x)} y={Y(geom.y)} w={Math.max(geom.w * scale, 2)} h={Math.max(geom.h * scale, 2)} scale={scale} />
        {captions && <SizeMark x={X(geom.x) + (geom.w * scale) / 2} y={Y(geom.y) + Math.min(geom.h * scale, 16)} dy={labelDy} label={`Wall ${formatLength(geom.w, unit)} × ${formatLength(geom.h, unit)}`} testId="wall-size" />}
        {selected && <Selection x={X(geom.x)} y={Y(geom.y)} w={geom.w * scale} h={geom.h * scale} />}
        <EdgeHandles x={X(geom.x)} y={Y(geom.y)} w={Math.max(geom.w * scale, 2)} h={Math.max(geom.h * scale, 2)} onEdge={edge} />
      </g>
    );
  }
  if (layer === "wall") return null;
  if (item.kind === "door") {
    return (
      <DoorView
        layer={layer}
        shower={shower}
        item={item}
        geom={geom}
        X={X}
        Y={Y}
        scale={scale}
        face={face}
        faceMm={faceMm}
        hardware={hardware}
        framed={framed}
        figId={figId}
        unit={unit}
        selected={selected}
        gaps={gaps}
        captions={captions}
        labelDy={labelDy}
        labelScope={labelScope}
        onDrag={onDrag}
        onEdge={edge}
      />
    );
  }
  const x = X(geom.x);
  const y = Y(geom.y);
  const w = Math.max(geom.w * scale, 1);
  const h = Math.max(geom.h * scale, 1);
  const panel = { x: geom.leafX, y: geom.leafY, w: geom.leafW, h: geom.leafH };
  const skipX = sharedMullionSkip(shower, item, faceMm);
  return (
    <g data-testid={layer === "fill" ? (item.kind === "return" ? "placed-return" : "placed-fixed") : undefined} data-id={item.id} data-x={item.x} data-width={item.width} data-y={Math.round(geom.y)} data-h={Math.round(geom.h)} data-shared-mullion={layer === "line" && sharedMullionOwner(shower, item) ? "yes" : undefined} onPointerDown={layer === "fill" ? down : undefined}>
      <PanelFace
        layer={layer}
        panel={panel}
        cuts={glassNotches(shower, item)}
        x={x}
        y={y}
        w={w}
        h={h}
        framed={framed && shower.product !== "cubicle"}
        hpl={shower.product === "cubicle"}
        face={face}
        faceMm={faceMm}
        infill={shower.material.infill}
        figId={figId}
        X={X}
        Y={Y}
        gaps={gaps}
        skipX={skipX}
      />
      {layer === "line" && <Channels x={x} y={y} w={w} h={h} channels={item.channels} inset={framed ? face : 3} />}
      {layer === "line" && selected && <Selection x={x} y={y} w={w} h={h} />}
      {layer === "line" && captions && (
        <SizeMark
          x={x + w / 2}
          y={y + h / 2}
          dy={labelDy}
          label={`${item.kind === "return" ? "Return" : "Fixed"} ${formatLength(geom.w, unit)} × ${formatLength(geom.h, unit)}`}
          testId="panel-size"
        />
      )}
      {layer === "line" && <EdgeHandles x={x} y={y} w={w} h={h} onEdge={edge} />}
    </g>
  );
}

function EdgeHandles({
  x,
  y,
  w,
  h,
  onEdge,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  onEdge?: (event: ReactPointerEvent, edge: "left" | "right") => void;
}) {
  if (!onEdge || w < 12 || h < 8) return null;
  const hit = Math.max(8, Math.min(12, w * 0.2));
  return (
    <g>
      <rect data-testid="resize-handle" data-edge="left" x={x - hit / 2} y={y} width={hit} height={h} fill="transparent" style={{ cursor: "ew-resize" }} onPointerDown={(event) => onEdge(event, "left")} />
      <rect data-testid="resize-handle" data-edge="right" x={x + w - hit / 2} y={y} width={hit} height={h} fill="transparent" style={{ cursor: "ew-resize" }} onPointerDown={(event) => onEdge(event, "right")} />
    </g>
  );
}

function sittingOnWall(shower: Shower, item: PlacedItem): boolean {
  return shower.items.some((wall) => {
    if (wall.kind !== "wall" || wall.wallRelation !== "ontop") return false;
    const shared = Math.min(item.x + item.width, wall.x + wall.width) - Math.max(item.x, wall.x);
    return shared > item.width * 0.55;
  });
}

function DoorView({
  layer,
  shower,
  item,
  geom,
  X,
  Y,
  scale,
  face,
  faceMm,
  hardware,
  framed,
  figId,
  unit,
  selected,
  gaps,
  captions = true,
  labelDy = 0,
  labelScope = "",
  onDrag,
  onEdge,
}: {
  layer: "fill" | "line";
  shower: Shower;
  item: PlacedItem;
  geom: Geom;
  X: (mm: number) => number;
  Y: (mm: number) => number;
  scale: number;
  face: number;
  faceMm: number;
  hardware: string;
  framed: boolean;
  figId: string;
  unit: UnitId;
  selected: boolean;
  gaps: ScreenGap[];
  captions?: boolean;
  labelDy?: number;
  labelScope?: string;
  onDrag?: (event: ReactPointerEvent, item: PlacedItem) => void;
  onEdge?: (event: ReactPointerEvent, edge: "left" | "right") => void;
}) {
  const x = X(geom.leafX);
  const y = Y(geom.leafY);
  const w = Math.max(geom.leafW * scale, 2);
  const h = Math.max(geom.leafH * scale, 2);
  const chokhat = Math.max(2.4, Math.min(face * 0.48, 8 * scale));
  const openingX = X(geom.x);
  const openingY = Y(geom.y);
  const openingW = Math.max(geom.w * scale, 2);
  const openingH = Math.max(geom.h * scale, 2);
  const coverH = Math.max(face, item.topCover * scale);
  const slideTowards: Side = item.handleSide === "right" ? "left" : "right";
  return (
    <g
      data-testid={layer === "fill" ? "placed-door" : undefined}
      data-id={item.id}
      data-x={item.x}
      data-width={item.width}
      data-door={item.doorStyle}
      data-outer-frame={item.outerFrame ? "on" : "off"}
      data-handle-side={item.handleSide}
      data-overlap={geom.overlap}
      data-seat={item.slideSeat}
      data-handle-kind={item.handleKind}
      data-y={Math.round(geom.y)}
      data-h={Math.round(geom.h)}
      data-fill={item.doorFillName || item.doorFillColour || item.doorFillImage ? "custom" : "glass"}
      onPointerDown={layer === "fill" && onDrag ? (event) => onDrag(event, item) : undefined}
    >
      {layer === "line" && item.doorStyle === "openable" && item.outerFrame && framed && (
        <g data-testid="outer-frame" data-gap="0" data-slim={Math.round(chokhat)} pointerEvents="none">
          <path
            data-testid="outer-frame-face"
            d={frameRing(x - chokhat, y - chokhat, w + chokhat * 2, h + chokhat * 2, chokhat)}
            fill="#f3efe6"
            stroke="none"
            fillRule="evenodd"
          />
          <MiterFrame x={x - chokhat} y={y - chokhat} w={w + chokhat * 2} h={h + chokhat * 2} t={chokhat} faceMm={faceMm} gaps={gaps} />
        </g>
      )}
      <PanelFace
        layer={layer}
        panel={{ x: geom.leafX, y: geom.leafY, w: geom.leafW, h: geom.leafH }}
        cuts={glassNotches(shower, item)}
        x={x}
        y={y}
        w={w}
        h={h}
        framed={framed && shower.product !== "cubicle"}
        hpl={shower.product === "cubicle"}
        doorFill={item.doorFillColour || item.doorFillImage ? { colour: item.doorFillColour, image: item.doorFillImage } : undefined}
        face={face}
        faceMm={faceMm}
        infill={shower.material.infill}
        figId={figId}
        X={X}
        Y={Y}
        gaps={gaps}
      />
      {layer === "line" && (
        <Channels
          x={x}
          y={y}
          w={w}
          h={h}
          channels={item.channels}
          inset={framed && shower.product !== "cubicle" ? face : 3}
          floorGap={Math.max(0, openingY + openingH - (y + h))}
          besideFrame={item.doorStyle === "openable" && item.outerFrame && framed}
        />
      )}
      {layer === "line" && item.doorStyle === "sliding" && (
        <g pointerEvents="none">
          {framed ? (
            <MiterFrame x={openingX} y={openingY} w={openingW} h={coverH} t={Math.min(face, coverH / 2)} faceMm={faceMm} gaps={gaps} />
          ) : (
            <rect data-testid="sliding-cover" x={openingX} y={openingY} width={openingW} height={coverH} fill="none" stroke="#111111" strokeWidth="1.1" />
          )}
          <g data-testid="sliding-track">
            <line x1={openingX + 2} y1={openingY + coverH + 2} x2={openingX + openingW - 2} y2={openingY + coverH + 2} stroke={hardware} strokeWidth="1.4" />
          </g>
          <SlideWheels x={x} y={openingY + coverH + Math.max(5, item.trackSize * scale * 0.35)} w={w} scale={scale} />
          <SlideArrow x={openingX} y={openingY} w={openingW} h={openingH} towards={slideTowards} />
        </g>
      )}
      {layer === "line" && <DoorHardware item={item} shower={shower} Y={Y} openingX={openingX} openingW={openingW} openingY={openingY} scale={scale} unit={unit} labelScope={labelScope} />}
      {layer === "line" && selected && <Selection x={openingX} y={openingY} w={openingW} h={openingH} />}
      {layer === "line" && captions && (
        <SizeMark
          x={openingX + openingW / 2}
          y={openingY + openingH * 0.42}
          dy={labelDy}
          label={`${item.doorStyle === "sliding" ? "Sliding" : "Openable"} ${formatLength(item.width, unit)} × ${formatLength(geom.leafH, unit)}`}
          testId="door-size"
        />
      )}
      {layer === "line" && <EdgeHandles x={openingX} y={openingY} w={openingW} h={openingH} onEdge={onEdge} />}
    </g>
  );
}

function PlanView({
  shower,
  X,
  PY,
  scale,
  depth,
  faceMm,
  selectedId,
  onDrag,
  onEdge,
  onSide,
  onSideMove,
  onFixture,
  unit,
  captions = true,
  onSelect,
  showBalance = false,
  highlightIds = [],
  highlightCeiling = false,
}: {
  shower: Shower;
  X: (mm: number) => number;
  PY: (mm: number) => number;
  scale: number;
  depth: number;
  faceMm: number;
  framed: boolean;
  selectedId: string | null;
  onDrag?: (event: ReactPointerEvent, item: PlacedItem) => void;
  onEdge?: (event: ReactPointerEvent, item: PlacedItem, edge: "left" | "right") => void;
  onSide?: (event: ReactPointerEvent, side: SideRun) => void;
  onSideMove?: (event: ReactPointerEvent, side: SideRun) => void;
  onFixture?: (event: ReactPointerEvent, fixture: "wc" | "shower") => void;
  unit: UnitId;
  captions?: boolean;
  onSelect?: (id: string | null) => void;
  showBalance?: boolean;
  highlightIds?: string[];
  highlightCeiling?: boolean;
}) {
  const shaped = shower.useDepth || shower.sides.length > 0 || shower.wc.enabled || shower.showerPoint.enabled || shower.ceiling.enabled;
  const room = shaped ? Math.max(shower.depth, 1) : depth;
  const back = Math.max(0, depth - room);
  const planItems = shower.items.filter((item) => item.kind !== "return");
  const sectionMm = Math.max(1, shower.material.profileDepth || 45);
  const planDy = captions
    ? staggerBoxes(planItems.map((item) => {
        const label = planItemLabel(shower, item);
        return { id: item.id, x: X(item.x + item.width / 2), y: PY(depth - sectionMm) - 14, hw: Math.max(28, label.length * 3.2), hh: 8 };
      }))
    : new Map<string, number>();
  return (
    <g>
      <rect data-testid="plan-room" data-depth={Math.round(room)} x={X(0)} y={PY(back)} width={shower.width * scale} height={room * scale} fill="#ffffff" stroke="#111111" strokeWidth="0.6" />
      {highlightCeiling && (
        <rect data-testid="plan-highlight" data-for="ceiling" x={X(0)} y={PY(back)} width={shower.width * scale} height={room * scale} fill="#0e7490" opacity="0.14" pointerEvents="none" />
      )}
      {shower.sides.filter((side) => highlightIds.includes(side.id)).map((side) => (
        <rect
          key={`hi-${side.id}`}
          data-testid="plan-highlight"
          data-for={side.id}
          x={X(side.attachX) - 10}
          y={PY(back)}
          width={20}
          height={room * scale}
          fill="#0e7490"
          opacity="0.22"
          pointerEvents="none"
        />
      ))}
      {shower.ceiling.enabled && <CeilingPlan shower={shower} X={X} PY={PY} scale={scale} unit={unit} />}
      {shower.sides.map((side) =>
        side.ceiling.enabled ? <SideCeiling key={side.id} shower={shower} side={side} X={X} PY={PY} scale={scale} depth={depth} unit={unit} /> : null,
      )}
      {shower.items
        .filter((item) => item.kind !== "return")
        .map((item) => {
          const wall = item.kind === "wall";
          const yFront = PY(depth);
          const yInner = PY(depth - sectionMm);
          const bandTop = Math.min(yFront, yInner);
          const band = Math.abs(yFront - yInner);
          return (
            <g key={`front-${item.id}`} data-testid="plan-item" data-kind={item.kind} data-seat={item.kind === "door" ? item.slideSeat : undefined} onPointerDown={onDrag ? (event) => onDrag(event, item) : undefined}>
              {wall ? (
                <rect x={X(item.x)} y={yFront - 3} width={Math.max(2, item.width * scale)} height={6} fill="#d9d3ce" stroke="#111111" strokeWidth="0.75" />
              ) : (
                <>
                  {item.kind === "door" && (
                    <rect x={X(item.x)} y={bandTop} width={Math.max(2, item.width * scale)} height={Math.max(band, 1)} fill="#1c1917" stroke="none" />
                  )}
                  <g data-testid="plan-section" fill="none" stroke="#111111">
                    <line x1={X(item.x)} y1={yFront} x2={X(item.x + item.width)} y2={yFront} />
                    <line x1={X(item.x)} y1={yInner} x2={X(item.x + item.width)} y2={yInner} />
                  </g>
                </>
              )}
              {captions && (
              <SizeMark
                x={X(item.x + item.width / 2)}
                y={bandTop - 14}
                dy={planDy.get(item.id) ?? 0}
                label={planItemLabel(shower, item)}
                testId={item.kind === "wall" ? "plan-wall-size" : item.kind === "door" ? "plan-door-size" : "plan-fixed-size"}
              />
              )}
              {item.kind === "door" && item.doorStyle === "sliding" && (
                <SlideArrow x={X(item.x)} y={bandTop - 22} w={item.width * scale} h={14} towards={item.handleSide === "right" ? "left" : "right"} />
              )}
              {item.kind === "door" && item.doorStyle === "openable" && (
                <SwingMark X={X} PY={PY} hinge={frontHinge(item, depth)} swing={item.swing} />
              )}
              <EdgeHandles x={X(item.x)} y={bandTop} w={Math.max(2, item.width * scale)} h={Math.max(16, band)} onEdge={onEdge ? (event, edge) => onEdge(event, item, edge) : undefined} />
            </g>
          );
        })}
      {shower.product === "cubicle" && (
        <g data-testid="cubicle-plan" pointerEvents="none">
          <text data-testid="cubicle-plan-note" x={X(8)} y={PY(back) + 14} className="tiny-label">HPL cubicle</text>
          {cubicleLegXs(shower).map((x, index) => (
            <rect key={`plan-leg-${index}`} data-testid="plan-leg" x={X(x) - 2} y={PY(depth) - 7} width={4} height={7} fill="#111111" />
          ))}
        </g>
      )}
      {shower.wc.enabled && (
        <WcSymbol x={X(shower.wc.x)} y={PY(back + shower.wc.y)} scale={scale} facing={shower.wc.facing} selected={selectedId === WC_ID} onSelect={onSelect ? () => onSelect(WC_ID) : undefined} onDrag={onFixture ? (event) => onFixture(event, "wc") : undefined} />
      )}
      {shower.showerPoint.enabled && (
        <ShowerMark where="plan" x={X(shower.showerPoint.x)} y={PY(back + shower.showerPoint.y)} scale={scale} facing={shower.showerPoint.facing} selected={selectedId === SHOWER_ID} onSelect={onSelect ? () => onSelect(SHOWER_ID) : undefined} onDrag={onFixture ? (event) => onFixture(event, "shower") : undefined} />
      )}
      {shower.items
        .filter((item) => item.kind === "return")
        .map((item) => (
          <g key={`ret-${item.id}`} onPointerDown={onDrag ? (event) => onDrag(event, item) : undefined}>
            <line
              x1={X(item.x + item.width / 2)}
              y1={PY(depth)}
              x2={X(item.x + item.width / 2)}
              y2={PY(Math.max(0, depth - item.depth))}
              stroke="#111111"
              strokeWidth="0.75"
            />
          </g>
        ))}
      {shower.sides.map((side) => (
        <SidePlan key={side.id} shower={shower} side={side} X={X} PY={PY} scale={scale} depth={depth} back={back} selected={selectedId === side.id} captions={captions} onDrag={onDrag} onSide={onSide} onSideMove={onSideMove} onSelect={onSelect} />
      ))}
      <PlanChain shower={shower} X={X} PY={PY} depth={depth} unit={unit} scale={scale} showBalance={showBalance} />
      <PlanLayout shower={shower} X={X} PY={PY} depth={depth} back={back} faceMm={faceMm} unit={unit} scale={scale} />
    </g>
  );
}

function planSeat(item: PlacedItem, faceMm: number): number {
  if (item.kind !== "door" || item.doorStyle !== "sliding") return 0;
  return item.slideSeat === "inside" ? faceMm : -faceMm;
}

function planItemLabel(shower: Shower, item: PlacedItem): string {
  if (item.kind === "wall") return `Wall ${formatMm(item.width)} × H ${formatMm(item.height)}`;
  if (item.kind === "door") return `${item.doorStyle === "sliding" ? "Sliding" : "Openable"} ${formatMm(item.width)}`;
  const onWall = sittingOnWall(shower, item);
  const geom = geometryOf(shower, item);
  if (onWall) return `Glass ${formatMm(geom.w)} × ${formatMm(geom.h)}`;
  return `Fixed ${formatMm(item.width)}`;
}

function formatMm(mm: number): string {
  const rounded = Math.round(mm * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function PlanChain({
  shower,
  X,
  PY,
  depth,
  unit,
  scale,
  showBalance = false,
}: {
  shower: Shower;
  X: (mm: number) => number;
  PY: (mm: number) => number;
  depth: number;
  unit: UnitId;
  scale: number;
  showBalance?: boolean;
}) {
  const pieces = dimPieces(shower.items)
    .map((item, index) => ({ x: item.x, width: item.width, label: formatLength(item.width, unit), testId: `plan-seg-${index}` }));
  const gaps = coverageGaps(shower.width, shower.items).map((gap, index) => ({
    x: gap.x,
    width: gap.width,
    label: formatLength(gap.width, unit),
    testId: `plan-balance-${index}`,
  }));
  const chain = [...pieces, ...gaps].sort((a, b) => a.x - b.x);
  const y = PY(depth) + 64 * scale;
  const used = usedWidth(shower.items);
  const left = balanceWidth(shower.width, shower.items);
  return (
    <g data-testid="plan-dims">
      {chain.map((piece, index) => (
        <DimH key={`${piece.testId}-${index}`} x1={X(piece.x)} x2={X(piece.x + piece.width)} y={y} fromY={PY(depth)} label={piece.label} testId={piece.testId} />
      ))}
      {showBalance && (
        <text data-testid="plan-balance-readout" data-balance={Math.round(left)} data-used={Math.round(used)} x={X(0)} y={y + 40} className="balance-note" pointerEvents="none">
          Opening {formatLength(shower.width, unit)} · Used {formatLength(used, unit)} · Balance {formatLength(left, unit)} {unit}
        </text>
      )}
    </g>
  );
}

function swingReach(width: number): number {
  return Math.min(Math.max(40, width), 720);
}

function roomSide(shower: Shower, attachX: number): number {
  const marks: number[] = [];
  if (shower.wc.enabled) marks.push(shower.wc.x);
  if (shower.showerPoint.enabled) marks.push(shower.showerPoint.x);
  const useful = marks.filter((x) => Math.abs(x - attachX) > 40);
  if (useful.length) {
    const mean = useful.reduce((sum, x) => sum + x, 0) / useful.length;
    return mean >= attachX ? 1 : -1;
  }
  return attachX <= shower.width / 2 ? 1 : -1;
}

function swingMargin(shower: Shower): { left: number; right: number; below: number } {
  let left = 0;
  let right = 0;
  let below = 0;
  for (const item of shower.items) {
    if (item.kind === "door" && item.doorStyle === "openable" && item.swing === "outside") below = Math.max(below, swingReach(item.width));
  }
  for (const side of shower.sides) {
    const pieces = side.door || side.items.length ? partitionItems(shower, side) : [];
    for (const item of pieces) {
      if (item.kind !== "door" || item.doorStyle !== "openable" || item.swing !== "outside") continue;
      const tip = side.attachX - roomSide(shower, side.attachX) * swingReach(item.width);
      if (tip < 0) left = Math.max(left, -tip);
      if (tip > shower.width) right = Math.max(right, tip - shower.width);
    }
  }
  return { left, right, below };
}

function frontHinge(item: PlacedItem, line: number) {
  const hingeLeft = item.handleSide !== "left";
  const hinge = { x: hingeLeft ? item.x : item.x + item.width, y: line };
  const closed = { x: hingeLeft ? item.x + item.width : item.x, y: line };
  const reach = swingReach(item.width);
  const open = { x: hinge.x, y: item.swing === "outside" ? line + reach : line - reach };
  return { hinge, closed, open };
}

function SidePlan({
  shower,
  side,
  X,
  PY,
  scale,
  depth,
  back,
  selected,
  captions = true,
  onDrag,
  onSide,
  onSideMove,
  onSelect,
}: {
  shower: Shower;
  side: SideRun;
  X: (mm: number) => number;
  PY: (mm: number) => number;
  scale: number;
  depth: number;
  back: number;
  selected: boolean;
  captions?: boolean;
  onDrag?: (event: ReactPointerEvent, item: PlacedItem) => void;
  onSide?: (event: ReactPointerEvent, side: SideRun) => void;
  onSideMove?: (event: ReactPointerEvent, side: SideRun) => void;
  onSelect?: (id: string | null) => void;
}) {
  const inward = side.attachX <= shower.width / 2 ? 1 : -1;
  const thick = 2.2;
  const left = X(side.attachX) - thick / 2;
  const glass = side.face !== "wall";
  const span = Math.max(10, side.length);
  const y0 = glass ? depth - span : back;
  const full = isFullPartition(shower, side);
  const pieces = side.door || side.items.length ? partitionItems(shower, side) : [];
  const pick = (event: ReactPointerEvent) => {
    event.stopPropagation();
    onSelect?.(side.id);
    onSideMove?.(event, side);
  };
  return (
    <g data-testid="plan-return" data-side={side.id} data-x={Math.round(side.attachX)} data-length={Math.round(side.length)} data-face={side.face} data-full={full ? "yes" : "no"}>
      <rect
        data-testid="plan-partition"
        x={left}
        y={PY(y0)}
        width={thick}
        height={span * scale}
        fill={side.face === "wall" ? "#d9d3ce" : "none"}
        stroke={selected ? "#0e7490" : "#111111"}
        strokeWidth="0.6"
        onPointerDown={pick}
        style={{ cursor: onSideMove ? "ew-resize" : "pointer" }}
      />
      {pieces.map((item) => {
        const along = glass ? depth - item.x - item.width : back + item.x;
        return (
          <g key={item.id} data-kind={item.kind} onPointerDown={onDrag ? (event) => onDrag(event, item) : undefined}>
            {item.kind === "door" && (
              <rect x={left} y={PY(along)} width={thick} height={Math.max(2, item.width * scale)} fill="#ffffff" stroke="#0e7490" strokeWidth="1.3" />
            )}
            {item.kind === "door" && item.doorStyle === "sliding" && (
              <SlideArrow
                x={left + (inward > 0 ? thick + 4 : -18)}
                y={PY(along)}
                w={14}
                h={Math.max(12, item.width * scale)}
                towards={item.handleSide === "right" ? "left" : "right"}
                vertical
              />
            )}
            {item.kind === "door" && item.doorStyle === "openable" && (
              <SwingMark X={X} PY={PY} hinge={sideHinge(shower, side, item, glass ? depth : back, glass)} swing={item.swing} />
            )}
          </g>
        );
      })}
      {captions && (
        <SizeMark x={left + thick + 28} y={PY(y0 + span / 2)} label={`${formatMm(side.length)}`} testId="plan-side-size" />
      )}
      {onSide && (
        <rect
          data-testid="resize-side"
          x={left - 4}
          y={PY(glass ? y0 : y0 + span) - 6}
          width={Math.max(thick + 8, 22)}
          height={12}
          fill="transparent"
          style={{ cursor: "ns-resize" }}
          onPointerDown={(event) => onSide(event, side)}
        />
      )}
    </g>
  );
}

function PlanLayout({
  shower,
  X,
  PY,
  depth,
  back,
  faceMm,
  unit,
  scale,
}: {
  shower: Shower;
  X: (mm: number) => number;
  PY: (mm: number) => number;
  depth: number;
  back: number;
  faceMm: number;
  scale: number;
  unit: UnitId;
}) {
  const seen = new Set<string>();
  const rows: { x1: number; x2: number; label: string; testId: string }[] = [];
  const claim = (x1: number, x2: number, testId: string) => {
    const a = Math.round(Math.min(x1, x2));
    const b = Math.round(Math.max(x1, x2));
    if (b - a < 15) return;
    const key = `${a}:${b}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ x1: a, x2: b, label: formatLength(b - a, unit), testId });
  };
  for (const side of shower.sides) claim(0, side.attachX, "plan-partition-x");
  const door = shower.items.find((item) => item.kind === "door");
  if (door) claim(0, door.x, "plan-door-left");
  if (shower.wc.enabled) claim(0, shower.wc.x, "plan-wc-left");
  const seat = door ? Math.abs(planSeat(door, faceMm)) : 0;
  return (
    <g data-testid="plan-layout">
      {rows.map((row, index) => (
        <DimH key={row.testId} x1={X(row.x1)} x2={X(row.x2)} y={PY(back) - (48 + index * 64) * scale} fromY={PY(back)} label={row.label} testId={row.testId} />
      ))}
      {door && seat >= 8 && (
        <DimV x={X(door.x + door.width / 2)} y1={PY(depth - seat)} y2={PY(depth)} label={formatLength(seat, unit)} testId="plan-door-glass" fromX={X(door.x + door.width / 2)} />
      )}
      {shower.sides.map((side) => {
        const glass = side.face !== "wall";
        const y1 = glass ? depth - side.length : back;
        const y2 = y1 + side.length;
        return (
          <DimV
            key={side.id}
            x={X(side.attachX) + (Math.max(faceMm, 16) / 2 + 36) * scale}
            y1={PY(y1)}
            y2={PY(y2)}
            label={formatLength(side.length, unit)}
            testId={`plan-partition-length-${side.id}`}
            fromX={X(side.attachX)}
          />
        );
      })}
      {shower.wc.enabled && shower.showerPoint.enabled && (
        <WcGap X={X} PY={PY} back={back} wc={shower.wc} shower={shower.showerPoint} unit={unit} />
      )}
    </g>
  );
}

function WcGap({
  X,
  PY,
  back,
  wc,
  shower,
  unit,
}: {
  X: (mm: number) => number;
  PY: (mm: number) => number;
  back: number;
  wc: { x: number; y: number };
  shower: { x: number; y: number };
  unit: UnitId;
}) {
  const gap = Math.hypot(shower.x - wc.x, shower.y - wc.y);
  if (gap < 15) return null;
  const x1 = X(wc.x);
  const y1 = PY(back + wc.y);
  const x2 = X(shower.x);
  const y2 = PY(back + shower.y);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - 12;
  return (
    <g data-testid="plan-wc-gap" data-mm={Math.round(gap)}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111111" strokeWidth="0.7" strokeDasharray="3 2" />
      <text x={mx} y={my} textAnchor="middle" className="dim">
        {formatLength(gap, unit)} {unit}
      </text>
    </g>
  );
}

function sideHinge(shower: Shower, side: SideRun, item: PlacedItem, origin: number, fromGlass: boolean) {
  const hingeAtStart = item.handleSide === "right";
  const hingeLocal = hingeAtStart ? item.x : item.x + item.width;
  const tipLocal = hingeAtStart ? item.x + item.width : item.x;
  const at = (along: number) => (fromGlass ? origin - along : origin + along);
  const intoRoom = roomSide(shower, side.attachX);
  const sign = item.swing === "outside" ? -intoRoom : intoRoom;
  const hinge = { x: side.attachX, y: at(hingeLocal) };
  const closed = { x: side.attachX, y: at(tipLocal) };
  const open = { x: side.attachX + sign * swingReach(item.width), y: at(hingeLocal) };
  return { hinge, closed, open };
}

function SwingMark({
  X,
  PY,
  hinge,
  swing,
}: {
  X: (mm: number) => number;
  PY: (mm: number) => number;
  hinge: { hinge: { x: number; y: number }; closed: { x: number; y: number }; open: { x: number; y: number } };
  swing: "inside" | "outside";
}) {
  const pts = perpArc(hinge.hinge, hinge.closed, hinge.open, 10);
  return (
    <g
      data-testid="swing-mark"
      data-swing={swing}
      data-dx={Math.round(hinge.open.x - hinge.hinge.x)}
      data-dy={Math.round(hinge.open.y - hinge.hinge.y)}
      pointerEvents="none"
    >
      <polyline
        fill="none"
        stroke="#111111"
        strokeWidth="1.15"
        strokeDasharray="3 3"
        points={pts.map((point) => `${X(point.x)},${PY(point.y)}`).join(" ")}
      />
      <line x1={X(hinge.hinge.x)} y1={PY(hinge.hinge.y)} x2={X(hinge.open.x)} y2={PY(hinge.open.y)} stroke="#111111" strokeWidth="1" strokeDasharray="2 3" />
    </g>
  );
}

function perpArc(
  hinge: { x: number; y: number },
  closed: { x: number; y: number },
  open: { x: number; y: number },
  steps: number,
) {
  const cx = closed.x - hinge.x;
  const cy = closed.y - hinge.y;
  const ox = open.x - hinge.x;
  const oy = open.y - hinge.y;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * (Math.PI / 2);
    pts.push({
      x: hinge.x + cx * Math.cos(t) + ox * Math.sin(t),
      y: hinge.y + cy * Math.cos(t) + oy * Math.sin(t),
    });
  }
  return pts;
}

function CeilingPlan({
  shower,
  X,
  PY,
  scale,
  unit,
}: {
  shower: Shower;
  X: (mm: number) => number;
  PY: (mm: number) => number;
  scale: number;
  unit: UnitId;
}) {
  const panels = ceilingPanelGeoms(shower);
  const finish = ceilingFinish(shower.ceiling);
  const lift = (shower.ceiling.level + shower.ceiling.rect.lift) * scale;
  const span = ceilingSpan(shower.ceiling, shower.width, Math.max(shower.depth, 1));
  const pat = "ceil-main";
  return (
    <g data-testid="ceiling-grid" data-panels={panels.length} data-finish={finish.id} transform={`translate(0 ${-lift})`}>
      {shower.ceiling.image && (
        <defs>
          <pattern id={pat} patternUnits="userSpaceOnUse" width={Math.max(1, span.w * scale)} height={Math.max(1, span.d * scale)}>
            <image data-testid="ceiling-image" href={shower.ceiling.image} width={Math.max(1, span.w * scale)} height={Math.max(1, span.d * scale)} preserveAspectRatio="xMidYMid slice" />
          </pattern>
        </defs>
      )}
      {panels.map((panel) => (
        <g key={panel.index} data-testid="ceiling-panel" data-index={panel.index}>
          <rect x={X(panel.x)} y={PY(panel.y)} width={Math.max(1, panel.w * scale)} height={Math.max(1, panel.h * scale)} fill={shower.ceiling.image ? `url(#${pat})` : finish.hex} stroke="#111111" strokeWidth="1.15" />
          <text x={X(panel.x + panel.w / 2)} y={PY(panel.y + panel.h / 2)} textAnchor="middle" className="tiny-label" fill="#111111">
            {formatLength(panel.w, unit)} × {formatLength(panel.h, unit)}
          </text>
        </g>
      ))}
      {shower.ceiling.trap.enabled && (
        <rect
          data-testid="ceiling-trap"
          x={X(span.x + shower.ceiling.trap.x)}
          y={PY(span.y + shower.ceiling.trap.y)}
          width={Math.max(4, shower.ceiling.trap.w * scale)}
          height={Math.max(4, shower.ceiling.trap.h * scale)}
          fill="none"
          stroke="#111111"
          strokeWidth="1.1"
          strokeDasharray="4 2"
        />
      )}
      {shower.ceiling.lights.map((light) => (
        <LightMark key={light.id} cx={X(light.x)} cy={PY(light.y)} r={Math.max(7, (light.size * scale) / 2)} />
      ))}
    </g>
  );
}

function SideCeiling({
  shower,
  side,
  X,
  PY,
  scale,
  depth,
  unit,
}: {
  shower: Shower;
  side: SideRun;
  X: (mm: number) => number;
  PY: (mm: number) => number;
  scale: number;
  depth: number;
  unit: UnitId;
}) {
  const ceiling = sideCeilingModel(shower, side);
  const panels = ceilingPanels(ceiling, shower.width, Math.max(shower.depth, depth, 1));
  const finish = ceilingFinish(ceiling);
  const span = ceilingSpan(ceiling, shower.width, Math.max(shower.depth, 1));
  const lift = (ceiling.level + ceiling.rect.lift) * scale;
  const pat = `side-ceil-${side.id}`;
  return (
    <g data-testid="side-ceiling" data-side={side.id} transform={`translate(0 ${-lift})`}>
      {ceiling.image && (
        <defs>
          <pattern id={pat} patternUnits="userSpaceOnUse" width={Math.max(1, span.w * scale)} height={Math.max(1, span.d * scale)}>
            <image data-testid="ceiling-image" href={ceiling.image} width={Math.max(1, span.w * scale)} height={Math.max(1, span.d * scale)} preserveAspectRatio="xMidYMid slice" />
          </pattern>
        </defs>
      )}
      {panels.map((panel) => (
        <rect key={panel.index} x={X(panel.x)} y={PY(panel.y)} width={Math.max(1, panel.w * scale)} height={Math.max(1, panel.h * scale)} fill={ceiling.image ? `url(#${pat})` : finish.hex} stroke="#111111" strokeWidth="1" />
      ))}
      {ceiling.trap.enabled && (
        <rect data-testid="ceiling-trap" x={X(span.x + ceiling.trap.x)} y={PY(span.y + ceiling.trap.y)} width={Math.max(4, ceiling.trap.w * scale)} height={Math.max(4, ceiling.trap.h * scale)} fill="none" stroke="#111111" strokeDasharray="4 2" />
      )}
      <text x={X(span.x + span.w / 2)} y={PY(span.y + span.d / 2)} textAnchor="middle" className="tiny-label">
        {side.name} {formatLength(span.w, unit)}
      </text>
    </g>
  );
}

function CeilingBand({
  shower,
  X,
  Y,
  scale,
  unit,
}: {
  shower: Shower;
  X: (mm: number) => number;
  Y: (mm: number) => number;
  scale: number;
  unit: UnitId;
}) {
  const panels = ceilingPanelGeoms(shower);
  const finish = ceilingFinish(shower.ceiling);
  const band = Math.min(140, Math.max(70, shower.height * 0.07));
  const across = shower.ceiling.along === "depth";
  const rise = shower.ceiling.level * scale;
  return (
    <g data-testid="ceiling-elevation" data-level={Math.round(shower.ceiling.level)} pointerEvents="none" transform={`translate(0 ${-rise})`}>
      {across
        ? panels.map((panel) => (
            <rect key={panel.index} data-testid="ceiling-panel" x={X(panel.x)} y={Y(0)} width={Math.max(1, panel.w * scale)} height={band * scale} fill={finish.hex} stroke="#111111" strokeWidth="1" />
          ))
        : (
            <rect data-testid="ceiling-panel" x={X(0)} y={Y(0)} width={shower.width * scale} height={band * scale} fill={finish.hex} stroke="#111111" strokeWidth="1" />
          )}
      <text x={X(shower.width / 2)} y={Y(band * 0.62)} textAnchor="middle" className="tiny-label" fill="#111111">
        Ceiling {finish.name} · {formatLength(ceilingModuleMm(shower.ceiling), unit)} {unit}
      </text>
      {shower.ceiling.lights.map((light) => (
        <LightMark key={light.id} cx={X(Math.min(light.x, shower.width))} cy={Y(band / 2)} r={Math.max(6, Math.min(16, (light.size * scale) / 2))} />
      ))}
    </g>
  );
}

function LightMark({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <g data-testid="ceiling-light" pointerEvents="none">
      {rays.map((deg) => {
        const a = (deg * Math.PI) / 180;
        return <line key={deg} x1={cx + Math.cos(a) * r * 0.45} y1={cy + Math.sin(a) * r * 0.45} x2={cx + Math.cos(a) * r * 1.45} y2={cy + Math.sin(a) * r * 1.45} stroke="#111111" strokeWidth="1.1" />;
      })}
      <circle cx={cx} cy={cy} r={r} fill="#fff6cc" stroke="#111111" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={Math.max(2, r * 0.38)} fill="#e6b325" stroke="#111111" strokeWidth="0.8" />
    </g>
  );
}

type ScreenGap = { x: number; y: number; w: number; h: number };
type ScreenPoint = { x: number; y: number };

function hingeCenters(count: number, height: number): number[] {
  const n = Math.max(2, Math.round(count));
  const capsule = 100;
  const clear = 20;
  if (n < 4) {
    const inset = Math.min(Math.max(80, height * 0.16), Math.max(40, height / 2 - capsule));
    const top = inset + capsule / 2;
    const bottom = height - inset - capsule / 2;
    if (n === 2) return [top, bottom];
    return [top, (top + bottom) / 2, bottom];
  }
  const endGap = n > 5 ? 100 : 60;
  const topUpper = endGap + capsule / 2;
  const topLower = topUpper + capsule + clear;
  const bottomLower = height - endGap - capsule / 2;
  const bottomUpper = bottomLower - capsule - clear;
  const middles = n - 4;
  const between: number[] = [];
  for (let i = 1; i <= middles; i += 1) between.push(topLower + ((bottomUpper - topLower) * i) / (middles + 1));
  return [topUpper, topLower, ...between, bottomUpper, bottomLower];
}

function hingeGaps(shower: Shower, X: (mm: number) => number, Y: (mm: number) => number, scale: number): ScreenGap[] {
  const gaps: ScreenGap[] = [];
  const half = 1.5;
  for (const item of shower.items) {
    if (item.kind !== "door" || item.doorStyle !== "openable") continue;
    const geom = geometryOf(shower, item);
    const side: Side = item.handleSide === "left" ? "right" : "left";
    const edge = side === "left" ? geom.x : geom.x + geom.w;
    for (const center of hingeCenters(item.hingeCount, geom.h)) {
      gaps.push({ x: X(edge - half), y: Y(geom.y + center - 50), w: half * 2 * scale, h: 100 * scale });
    }
  }
  return gaps;
}

function HingeLayer({ shower, X, Y, scale }: { shower: Shower; X: (mm: number) => number; Y: (mm: number) => number; scale: number }) {
  return (
    <g>
      {shower.items
        .filter((item) => item.kind === "door" && item.doorStyle === "openable")
        .map((item) => {
          const geom = geometryOf(shower, item);
          const side: Side = item.handleSide === "left" ? "right" : "left";
          return (
            <Hinges
              key={item.id}
              side={side}
              x={X(geom.x)}
              y={Y(geom.y)}
              w={Math.max(geom.w * scale, 2)}
              h={Math.max(geom.h * scale, 2)}
              count={item.hingeCount}
              scale={scale}
            />
          );
        })}
    </g>
  );
}

function CubicleTrim({
  shower,
  X,
  Y,
  scale,
  unit,
}: {
  shower: Shower;
  X: (mm: number) => number;
  Y: (mm: number) => number;
  scale: number;
  unit: UnitId;
}) {
  const gap = Math.min(Math.max(0, shower.cubicle.gap), Math.max(0, shower.height - 30));
  const rail = Math.min(CUBICLE_RAIL_MM, Math.max(8, shower.height * 0.02));
  const legH = Math.min(Math.max(0, shower.cubicle.legHeight), gap);
  const door = shower.items.find((item) => item.kind === "door");
  const doorGeom = door ? geometryOf(shower, door) : null;
  return (
    <g data-testid="cubicle-trim" pointerEvents="none">
      <rect
        data-testid="cubicle-rail"
        data-material={shower.cubicle.railMaterial}
        x={X(0)}
        y={Y(0)}
        width={Math.max(0, shower.width) * scale}
        height={Math.max(2, rail * scale)}
        fill={shower.cubicle.railMaterial === "SS" ? "#d9dde2" : "#c5cdd4"}
        stroke="#111111"
        strokeWidth="0.6"
      />
      {cubicleLegXs(shower).map((x, index) => (
        <rect
          key={`leg-${index}`}
          data-testid="cubicle-leg"
          data-x={Math.round(x)}
          x={X(x) - 3}
          y={Y(shower.height - legH)}
          width={6}
          height={Math.max(2, legH * scale)}
          fill="#f4f4f4"
          stroke="#111111"
          strokeWidth="0.6"
        />
      ))}
      <DimV
        x={X(shower.width) + 28 * scale}
        y1={Y(shower.height - gap)}
        y2={Y(shower.height)}
        label={formatLength(gap, unit)}
        testId="cubicle-gap-dim"
        fromX={X(shower.width)}
      />
      {doorGeom && shower.cubicle.doorClearance > 0 && (
        <g data-testid="cubicle-clear-dim" data-mm={Math.round(shower.cubicle.doorClearance)}>
          <line x1={X(doorGeom.x) - 14} y1={Y(0)} x2={X(doorGeom.x) - 14} y2={Y(doorGeom.y)} className="dim" />
          <text x={X(doorGeom.x) - 18} y={(Y(0) + Y(doorGeom.y)) / 2} textAnchor="end" className="dim">
            {formatLength(shower.cubicle.doorClearance, unit)}
          </text>
        </g>
      )}
    </g>
  );
}

function PanelFace({
  layer,
  panel,
  cuts,
  w,
  h,
  framed,
  hpl = false,
  doorFill,
  faceMm,
  infill,
  figId,
  X,
  Y,
  gaps,
  skipX = [],
}: {
  layer: "fill" | "line";
  panel: MmRect;
  cuts: MmRect[];
  x: number;
  y: number;
  w: number;
  h: number;
  framed: boolean;
  hpl?: boolean;
  doorFill?: { colour: string; image: string };
  face: number;
  faceMm: number;
  infill: Shower["material"]["infill"];
  figId: string;
  X: (mm: number) => number;
  Y: (mm: number) => number;
  gaps: ScreenGap[];
  skipX?: number[];
}) {
  if (w < 1 || h < 1 || panel.w < 1 || panel.h < 1) return null;
  const loops = shapeLoops(panel, cuts);
  if (!loops.length) return null;
  const screen = (loop: MmPoint[]) => loop.map((point) => ({ x: X(point.x), y: Y(point.y) }));
  if (layer === "fill") {
    const custom = Boolean(doorFill && (doorFill.colour || doorFill.image));
    const patId = `${figId}-doorfill-${Math.round(panel.x)}-${Math.round(panel.y)}`;
    const fill = custom ? (doorFill?.image ? `url(#${patId})` : doorFill?.colour || "#d8d2c8") : hpl ? "#efe6d6" : infill === "sheet" ? `url(#${figId}-sheet)` : `url(#${figId}-glass)`;
    const d = loops.map((loop) => ringPath(screen(loop))).join(" ");
    return (
      <g data-testid="glass-panel" data-infill={custom ? "custom" : infill} data-corners={loops[0].length} data-loops={loops.length}>
        {custom && doorFill?.image && (
          <defs>
            <pattern id={patId} patternUnits="userSpaceOnUse" width={w} height={h}>
              <image href={doorFill.image} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
            </pattern>
          </defs>
        )}
        <path data-testid="glass-outline" d={d} fill={fill} fillOpacity={hpl || custom ? 1 : 0.92} fillRule="evenodd" stroke="none" />
      </g>
    );
  }
  if (!framed || hpl) {
    return (
      <path data-testid={hpl ? "hpl-edge" : "glass-edge"} d={loops.map((loop) => ringPath(screen(loop))).join(" ")} fill="none" stroke="#111111" strokeWidth="0.6" pointerEvents="none" />
    );
  }
  return <ProfileLines loops={loops} faceMm={faceMm} X={X} Y={Y} gaps={gaps} skipX={skipX ?? []} />;
}

function ringPath(points: ScreenPoint[]): string {
  if (!points.length) return "";
  return `M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} Z`;
}

function ProfileLines({
  loops,
  faceMm,
  X,
  Y,
  gaps,
  skipX = [],
}: {
  loops: MmPoint[][];
  faceMm: number;
  X: (mm: number) => number;
  Y: (mm: number) => number;
  gaps: ScreenGap[];
  skipX?: number[];
}) {
  const lines: ReactNode[] = [];
  const dropped = (xMm: number) => skipX.some((skip) => Math.abs(skip - xMm) < 1.2);
  loops.forEach((loop, loopIndex) => {
    const inner = insetLoop(loop, faceMm);
    const drawRing = (ring: MmPoint[], prefix: string) => {
      for (let index = 0; index < ring.length; index += 1) {
        const start = ring[index];
        const end = ring[(index + 1) % ring.length];
        if (Math.abs(start.x - end.x) < 0.8 && dropped(start.x)) continue;
        const segments = clipSegment({ x: X(start.x), y: Y(start.y) }, { x: X(end.x), y: Y(end.y) }, gaps);
        segments.forEach((segment, part) => {
          lines.push(<line key={`${prefix}-${loopIndex}-${index}-${part}`} x1={segment[0].x} y1={segment[0].y} x2={segment[1].x} y2={segment[1].y} />);
        });
      }
    };
    drawRing(loop, "o");
    drawRing(inner, "i");
    loop.forEach((point, index) => {
      const mate = inner[index];
      if (!mate) return;
      if (dropped(point.x) && dropped(mate.x)) return;
      const a = { x: X(point.x), y: Y(point.y) };
      const b = { x: X(mate.x), y: Y(mate.y) };
      if (pointInside(mid(a, b), gaps)) return;
      lines.push(<line key={`m-${loopIndex}-${index}`} data-miter="45" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />);
    });
  });
  return (
    <g data-testid="miter" data-miter="45" data-face={faceMm} data-filled="no" fill="none" stroke="#111111" strokeWidth="0.6" strokeLinejoin="miter" pointerEvents="none" shapeRendering="geometricPrecision">
      {lines}
    </g>
  );
}

function mid(a: ScreenPoint, b: ScreenPoint): ScreenPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function pointInside(point: ScreenPoint, gaps: ScreenGap[]): boolean {
  return gaps.some((gap) => point.x >= gap.x && point.x <= gap.x + gap.w && point.y >= gap.y && point.y <= gap.y + gap.h);
}

function walkEdges(points: ScreenPoint[], gaps: ScreenGap[]): [ScreenPoint, ScreenPoint][] {
  const segments: [ScreenPoint, ScreenPoint][] = [];
  for (let i = 0; i < points.length; i += 1) {
    const start = points[i];
    const end = points[(i + 1) % points.length];
    segments.push(...clipSegment(start, end, gaps));
  }
  return segments;
}

function clipSegment(a: ScreenPoint, b: ScreenPoint, gaps: ScreenGap[]): [ScreenPoint, ScreenPoint][] {
  const vertical = Math.abs(a.x - b.x) < 0.8;
  const horizontal = Math.abs(a.y - b.y) < 0.8;
  if (!vertical && !horizontal) {
    return pointInside(mid(a, b), gaps) ? [] : [[a, b]];
  }
  if (vertical) {
    const x = (a.x + b.x) / 2;
    let spans: [number, number][] = [[Math.min(a.y, b.y), Math.max(a.y, b.y)]];
    for (const gap of gaps) {
      if (x < gap.x - 0.4 || x > gap.x + gap.w + 0.4) continue;
      spans = spans.flatMap(([start, end]) => subtractSpan(start, end, gap.y, gap.y + gap.h));
    }
    return spans.filter(([start, end]) => end - start > 0.6).map(([start, end]) => [{ x, y: start }, { x, y: end }]);
  }
  const y = (a.y + b.y) / 2;
  let spans: [number, number][] = [[Math.min(a.x, b.x), Math.max(a.x, b.x)]];
  for (const gap of gaps) {
    if (y < gap.y - 0.75 || y > gap.y + gap.h + 0.75) continue;
    spans = spans.flatMap(([start, end]) => subtractSpan(start, end, gap.x, gap.x + gap.w));
  }
  return spans.filter(([start, end]) => end - start > 0.6).map(([start, end]) => [{ x: start, y }, { x: end, y }]);
}

function subtractSpan(start: number, end: number, cutStart: number, cutEnd: number): [number, number][] {
  if (cutEnd <= start || cutStart >= end) return [[start, end]];
  const parts: [number, number][] = [];
  if (cutStart > start) parts.push([start, Math.min(end, cutStart)]);
  if (cutEnd < end) parts.push([Math.max(start, cutEnd), end]);
  return parts;
}

function MiterFrame({
  x,
  y,
  w,
  h,
  t,
  faceMm,
  gaps,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  t: number;
  faceMm: number;
  gaps: ScreenGap[];
}) {
  const inset = Math.max(0, Math.min(t, w / 2 - 0.2, h / 2 - 0.2));
  if (w < 1 || h < 1) return null;
  const outer = [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];
  const inner =
    inset > 0.4
      ? [
          { x: x + inset, y: y + inset },
          { x: x + w - inset, y: y + inset },
          { x: x + w - inset, y: y + h - inset },
          { x: x + inset, y: y + h - inset },
        ]
      : [];
  const lines = [...walkEdges(outer, gaps)];
  if (inner.length) {
    lines.push(...walkEdges(inner, gaps));
    outer.forEach((point, index) => {
      const mate = inner[index];
      if (!pointInside(mid(point, mate), gaps)) lines.push([point, mate]);
    });
  }
  return (
    <g data-testid="miter" data-miter="45" data-face={faceMm} data-inset={inset} data-filled="no" fill="none" stroke="#111111" strokeWidth="0.6" pointerEvents="none" shapeRendering="geometricPrecision">
      {lines.map((segment, index) => (
        <line key={index} x1={segment[0].x} y1={segment[0].y} x2={segment[1].x} y2={segment[1].y} />
      ))}
    </g>
  );
}

function frameRing(x: number, y: number, w: number, h: number, t: number): string {
  const inner = Math.max(0, Math.min(t, w / 2 - 0.2, h / 2 - 0.2));
  return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z M ${x + inner} ${y + inner} V ${y + h - inner} H ${x + w - inner} V ${y + inner} Z`;
}

/** Outer edge, inner edge, and a 45° diagonal, the same joint as the door profile. */
function miterMembers(
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  edge: { top: boolean; bottom: boolean; left: boolean; right: boolean },
  skipBottomRail = false,
): [number, number, number, number][] {
  const span = Math.max(0, Math.min(t, w / 2 - 0.2, h / 2 - 0.2));
  if (span < 0.6 || w < 2 || h < 2) return [];
  const oL = x;
  const oT = y;
  const oR = x + w;
  const oB = y + h;
  const iL = x + span;
  const iT = y + span;
  const iR = x + w - span;
  const iB = y + h - span;
  const lines: [number, number, number, number][] = [];
  const add = (x1: number, y1: number, x2: number, y2: number) => lines.push([x1, y1, x2, y2]);
  if (edge.top) {
    add(oL, oT, oR, oT);
    add(edge.left ? iL : oL, iT, edge.right ? iR : oR, iT);
    if (!edge.left) add(oL, oT, oL, iT);
    if (!edge.right) add(oR, oT, oR, iT);
  }
  if (edge.bottom && !skipBottomRail) {
    add(oL, oB, oR, oB);
    add(edge.left ? iL : oL, iB, edge.right ? iR : oR, iB);
    if (!edge.left) add(oL, oB, oL, iB);
    if (!edge.right) add(oR, oB, oR, iB);
  }
  if (edge.left) {
    add(oL, edge.top ? oT : oT, oL, edge.bottom ? oB : oB);
    add(iL, edge.top ? iT : oT, iL, edge.bottom ? iB : oB);
    if (!edge.top) add(oL, oT, iL, oT);
    if (!edge.bottom && !skipBottomRail) add(oL, oB, iL, oB);
  }
  if (edge.right) {
    add(oR, oT, oR, oB);
    add(iR, edge.top ? iT : oT, iR, edge.bottom ? iB : oB);
    if (!edge.top) add(oR, oT, iR, oT);
    if (!edge.bottom && !skipBottomRail) add(oR, oB, iR, oB);
  }
  if (edge.top && edge.left) add(oL, oT, iL, iT);
  if (edge.top && edge.right) add(oR, oT, iR, iT);
  if (edge.bottom && edge.left) add(oL, oB, iL, iB);
  if (edge.bottom && edge.right) add(oR, oB, iR, iB);
  return lines;
}

function isSealChannel(type: string): boolean {
  return /seal|gasket/i.test(type);
}

function BrushSeal({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  if (w < 2 || h < 1) return null;
  const ticks = [];
  const step = Math.max(2.2, Math.min(3.2, w / 36));
  for (let i = step; i < w - 1; i += step) {
    const sway = ((Math.round(i * 5) % 4) - 1) * 0.45;
    const len = h * (0.58 + ((Math.round(i * 3) % 5) / 14));
    ticks.push(
      <line key={i} x1={x + i} y1={y + 0.3} x2={x + i + sway} y2={y + Math.min(h, len)} stroke="#4e473f" strokeWidth={drawStyle.dimStroke} />,
    );
  }
  return (
    <g data-testid="door-brush">
      <rect x={x} y={y} width={w} height={Math.max(1, h * 0.32)} fill="#6d645c" opacity="0.45" />
      {ticks}
    </g>
  );
}

function Channels({
  x,
  y,
  w,
  h,
  channels,
  inset,
  floorGap = 0,
  besideFrame = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  channels: PlacedItem["channels"];
  inset: number;
  floorGap?: number;
  besideFrame?: boolean;
}) {
  const parts = channels.parts?.length
    ? channels.parts
    : [{ type: channels.type, top: channels.top, bottom: channels.bottom, left: channels.left, right: channels.right }];
  const active = parts.filter((part) => part.top || part.bottom || part.left || part.right);
  if (!active.length || w < 8 || h < 8) return null;
  const slim = Math.max(1.25, Math.min(2.05, inset > 0 ? inset * 0.14 : 1.6));
  let channelStep = 0;
  let sealStep = 0;
  return (
    <g data-testid="channels" data-miter="45" data-join="45" fill="none" stroke={drawStyle.ink} strokeWidth={drawStyle.sectionStroke} pointerEvents="none">
      {active.map((part) => {
        const edge = { top: part.top, bottom: part.bottom, left: part.left, right: part.right };
        const seal = isSealChannel(part.type);
        if (seal) {
          const step = sealStep;
          sealStep += 1;
          const out = slim + step * (slim + 0.35);
          const lines = miterMembers(x - out, y - out, w + out * 2, h + out * 2, slim, edge, edge.bottom);
          const brushH = besideFrame ? slim : floorGap > 1.5 ? Math.max(slim, Math.min(floorGap, slim + 6)) : slim;
          return (
            <g key={part.type} data-testid="door-seal" data-channel={part.type} data-miter="45">
              {lines.map((segment, index) => (
                <line key={index} data-miter="45" x1={segment[0]} y1={segment[1]} x2={segment[2]} y2={segment[3]} />
              ))}
              {edge.bottom && <BrushSeal x={x} y={y + h + step * 0.8} w={w} h={brushH} />}
            </g>
          );
        }
        const step = channelStep;
        channelStep += 1;
        const pad = Math.min(Math.max(0, inset) + step * (slim + 0.45), w / 3, h / 3);
        const lines = miterMembers(x + pad, y + pad, Math.max(2, w - pad * 2), Math.max(2, h - pad * 2), slim, edge);
        return (
          <g key={part.type} data-channel={part.type} data-miter="45">
            {lines.map((segment, index) => (
              <line key={index} data-miter="45" x1={segment[0]} y1={segment[1]} x2={segment[2]} y2={segment[3]} />
            ))}
          </g>
        );
      })}
    </g>
  );
}

function SlideWheels({ x, y, w, scale }: { x: number; y: number; w: number; scale: number }) {
  const r = Math.max(3.2, 6.5 * scale);
  const inset = Math.min(100 * scale, Math.max(r + 2, (w - r * 4) / 2));
  return (
    <g data-testid="sliding-wheels" data-inset-mm="100" pointerEvents="none">
      {[x + inset, x + w - inset].map((cx) => (
        <g key={cx} data-testid="sliding-wheel">
          <circle cx={cx} cy={y} r={r} fill="#ffffff" stroke="#111111" strokeWidth="1.15" />
          <circle cx={cx} cy={y} r={Math.max(1.2, r * 0.35)} fill="none" stroke="#111111" strokeWidth="0.8" />
        </g>
      ))}
    </g>
  );
}

function SlideArrow({
  x,
  y,
  w,
  h,
  towards,
  vertical,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  towards: Side;
  vertical?: boolean;
}) {
  if (vertical) {
    const len = Math.max(10, Math.min(h * 0.45, 36));
    const cx = x + w / 2;
    const tip = towards === "left" ? y + 4 : y + h - 4;
    const tail = towards === "left" ? tip + len : tip - len;
    const head = 5;
    return (
      <g data-testid="slide-arrow" data-towards={towards} pointerEvents="none" fill="#111111" stroke="#111111" strokeWidth="1.4">
        <line x1={cx} y1={tail} x2={cx} y2={tip} />
        <polygon points={towards === "left" ? `${cx},${tip} ${cx - head},${tip + head} ${cx + head},${tip + head}` : `${cx},${tip} ${cx - head},${tip - head} ${cx + head},${tip - head}`} />
      </g>
    );
  }
  const len = Math.max(16, Math.min(w * 0.28, 54));
  const cy = y + Math.min(Math.max(18, h * 0.34), h - 12);
  const edge = Math.min(28, w * 0.16);
  const tip = towards === "left" ? x + edge : x + w - edge;
  const tail = towards === "left" ? tip + len : tip - len;
  const head = 6;
  return (
    <g data-testid="slide-arrow" data-towards={towards} pointerEvents="none" fill="#111111" stroke="#111111" strokeWidth="1.6">
      <line x1={tail} y1={cy} x2={tip} y2={cy} />
      <polygon points={towards === "left" ? `${tip},${cy} ${tip + head},${cy - head} ${tip + head},${cy + head}` : `${tip},${cy} ${tip - head},${cy - head} ${tip - head},${cy + head}`} />
    </g>
  );
}

function Bricks({ x, y, w, h, scale }: { x: number; y: number; w: number; h: number; scale: number }) {
  const mortar = Math.max(1, 8 * scale);
  const bh = Math.max(7, 62 * scale);
  const bw = Math.max(16, 210 * scale);
  const nodes: ReactNode[] = [];
  let row = 0;
  for (let yy = y; yy < y + h - 0.5; yy += bh + mortar) {
    const height = Math.min(bh, y + h - yy);
    const offset = row % 2 === 0 ? 0 : (bw + mortar) / 2;
    let col = 0;
    for (let xx = x - offset; xx < x + w; xx += bw + mortar) {
      const left = Math.max(x, xx);
      const right = Math.min(x + w, xx + bw);
      if (right - left < 1 || height < 1) {
        col += 1;
        continue;
      }
      const tone = (row + col) % 3 === 0 ? "#a34b38" : (row + col) % 3 === 1 ? "#c4624c" : "#b65540";
      nodes.push(<rect key={`${row}-${col}`} x={left} y={yy} width={right - left} height={height} fill={tone} />);
      col += 1;
    }
    row += 1;
  }
  return (
    <g data-testid="brick-wall">
      <rect x={x} y={y} width={w} height={h} fill="#eadfd6" />
      {nodes}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#6e4338" strokeWidth="1" />
    </g>
  );
}

function Selection({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <rect data-testid="selection" x={x - 3} y={y - 3} width={Math.max(0, w + 6)} height={Math.max(0, h + 6)} fill="none" stroke="#0e7490" strokeWidth="1.4" strokeDasharray="5 3" pointerEvents="none" />
  );
}

function Label({ x, y, title }: { x: number; y: number; title: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" className="panel-label" pointerEvents="none">
      {title}
    </text>
  );
}

function captionShifts(shower: Shower, X: (mm: number) => number, Y: (mm: number) => number, scale: number, unit: UnitId) {
  return staggerBoxes(shower.items.map((item) => {
    const geom = geometryOf(shower, item);
    const label = item.kind === "wall"
      ? `Wall ${formatLength(geom.w, unit)} × ${formatLength(geom.h, unit)}`
      : item.kind === "door"
        ? `${item.doorStyle === "sliding" ? "Sliding" : "Openable"} ${formatLength(item.width, unit)}`
        : `Fixed ${formatLength(geom.w, unit)}`;
    const y = item.kind === "wall"
      ? Y(geom.y) + Math.min(geom.h * scale, 16)
      : item.kind === "door"
        ? Y(geom.y) + geom.h * scale * 0.42
        : Y(geom.y) + (geom.h * scale) / 2;
    return { id: item.id, x: X(geom.x + geom.w / 2), y, hw: Math.max(36, label.length * 3.3), hh: 9 };
  }));
}

function staggerBoxes(boxes: { id: string; x: number; y: number; hw: number; hh: number }[]) {
  const placed = boxes.map((box) => ({ ...box, y0: box.y }));
  for (let pass = 0; pass < 8; pass += 1) {
    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        const a = placed[i];
        const b = placed[j];
        if (Math.abs(a.x - b.x) >= a.hw + b.hw) continue;
        const gap = a.hh + b.hh + 18;
        if (Math.abs(a.y - b.y) >= gap) continue;
        const push = Math.max(14, (gap - Math.abs(a.y - b.y)) / 2);
        if (a.y0 <= b.y0) {
          a.y -= push;
          b.y += push;
        } else {
          b.y -= push;
          a.y += push;
        }
      }
    }
  }
  return new Map(placed.map((box) => [box.id, box.y - box.y0]));
}

function facingDeg(facing: PlanFacing) {
  if (facing === "up") return 180;
  if (facing === "left") return -90;
  if (facing === "right") return 90;
  return 0;
}

function WcSymbol({
  x,
  y,
  scale,
  facing,
  selected,
  onSelect,
  onDrag,
}: {
  x: number;
  y: number;
  scale: number;
  facing: PlanFacing;
  selected: boolean;
  onSelect?: () => void;
  onDrag?: (event: ReactPointerEvent) => void;
}) {
  const w = Math.max(18, 380 * scale);
  const d = Math.max(24, 560 * scale);
  const cistern = d * 0.26;
  return (
    <g data-testid="plan-wc" data-x={Math.round(x)} data-facing={facing} transform={`translate(${x} ${y}) rotate(${facingDeg(facing)})`} onPointerDown={(event) => { event.stopPropagation(); if (onDrag) onDrag(event); else onSelect?.(); }} style={{ cursor: onSelect || onDrag ? "pointer" : undefined }}>
      <rect x={-w / 2 - 6} y={-d / 2 - 6} width={w + 12} height={d + 12} fill="transparent" />
      <rect x={-w / 2} y={-d / 2} width={w} height={cistern} fill="#ffffff" stroke="#111111" strokeWidth="1.4" />
      <path d={`M ${-w / 2} ${-d / 2 + cistern} L ${-w / 2} ${d * 0.08} A ${w / 2} ${d * 0.34} 0 0 0 ${w / 2} ${d * 0.08} L ${w / 2} ${-d / 2 + cistern} Z`} fill="#ffffff" stroke="#111111" strokeWidth="1.4" />
      <ellipse cx="0" cy={d * 0.02} rx={w * 0.22} ry={d * 0.12} fill="none" stroke="#111111" strokeWidth="1.1" />
      {selected && <rect data-testid="selection" x={-w / 2 - 4} y={-d / 2 - 4} width={w + 8} height={d + 8} fill="none" stroke="#0e7490" strokeWidth="1.3" strokeDasharray="4 3" />}
    </g>
  );
}

function ShowerMark({
  where,
  x,
  y,
  scale,
  facing,
  selected,
  onSelect,
  onDrag,
}: {
  where: "plan" | "elev";
  x: number;
  y: number;
  scale: number;
  facing: PlanFacing;
  selected: boolean;
  onSelect?: () => void;
  onDrag?: (event: ReactPointerEvent) => void;
}) {
  const k = where === "plan" ? 1 : 0.55;
  const r = Math.max(7, 70 * scale * k);
  return (
    <g data-testid={where === "plan" ? "plan-shower" : "elev-shower"} data-facing={facing} transform={`translate(${x} ${y}) rotate(${facingDeg(facing)})`} onPointerDown={(event) => { event.stopPropagation(); if (onDrag) onDrag(event); else onSelect?.(); }} style={{ cursor: onSelect || onDrag ? "pointer" : undefined }}>
      <circle r={r + 16 * k} fill="transparent" />
      <circle r={r} fill="#ffffff" stroke="#111111" strokeWidth="1.4" />
      <circle r={r * 0.38} fill="none" stroke="#111111" strokeWidth="1.1" />
      <path d={`M ${-r * 0.7} ${r * 0.55} Q 0 ${r * 1.7} ${r * 0.7} ${r * 0.55}`} fill="none" stroke="#111111" strokeWidth="1.15" />
      <path d={`M ${-r * 0.28} ${r * 0.7} L ${-r * 0.45} ${r * 1.25}`} fill="none" stroke="#111111" strokeWidth="1" />
      <path d={`M 0 ${r * 0.75} L 0 ${r * 1.35}`} fill="none" stroke="#111111" strokeWidth="1" />
      <path d={`M ${r * 0.28} ${r * 0.7} L ${r * 0.45} ${r * 1.25}`} fill="none" stroke="#111111" strokeWidth="1" />
      {selected && <circle data-testid="selection" r={r + 5} fill="none" stroke="#0e7490" strokeWidth="1.3" strokeDasharray="4 3" />}
    </g>
  );
}

function SizeMark({ x, y, label, testId, dy = 0 }: { x: number; y: number; label: string; testId: string; dy?: number }) {
  const edit = useContext(EditCtx);
  const nudge = edit?.nudge[testId];
  const s = edit?.scale || 1;
  const nx = (nudge?.x ?? 0) * s;
  const ny = (nudge?.y ?? 0) * s;
  const canDrag = Boolean(edit?.editable);
  return (
    <text
      data-testid={testId}
      data-dy={Math.round(dy)}
      x={x + nx}
      y={y + dy + ny}
      textAnchor="middle"
      className="panel-size"
      pointerEvents={canDrag ? "all" : "none"}
      style={{ cursor: canDrag ? "move" : undefined }}
      onPointerDown={canDrag ? (event) => edit?.startLabel(event, testId) : undefined}
    >
      {label}
    </text>
  );
}

function labelKey(scope: string, name: string, id: string): string {
  return scope ? `${scope}-${name}-${id}` : `${name}-${id}`;
}

function DoorHardware({
  item,
  shower,
  Y,
  openingX,
  openingY,
  openingW,
  scale,
  unit,
  labelScope,
}: {
  item: PlacedItem;
  shower: Shower;
  Y: (mm: number) => number;
  openingX: number;
  openingY: number;
  openingW: number;
  scale: number;
  unit: UnitId;
  labelScope: string;
}) {
  const edit = useContext(EditCtx);
  const inset = 12;
  const hx = item.handleSide === "left" ? openingX + inset : openingX + openingW - inset;
  const mount = Y(shower.height - item.handleHeight);
  const floor = Y(shower.height);
  const bodyX = hx + item.handleDx * scale;
  const bodyY = mount + item.handleDy * scale;
  const lockX = hx + item.lockDx * scale;
  const lockY = Y(shower.height - item.lockHeight);
  const sideSign = item.handleSide === "left" ? -1 : 1;
  const into = -sideSign;
  const bar = Math.max(6, 32 * scale);
  const horizontalPull = item.handleKind === "pull" && item.pullAxis === "horizontal";
  const halfReach =
    item.handleKind === "pull"
      ? horizontalPull
        ? bar / 2
        : Math.max(14, item.pullLength * scale) / 2
      : item.handleKind === "lpipe"
        ? Math.max(12, item.pipeVertLen * scale) / 2
        : 8;
  const nameNudge = edit?.nudge[labelKey(labelScope, "handle-name", item.id)] ?? { x: 0, y: 0 };
  const labelX = bodyX + into * (bar / 2 + 28) + (item.handleLabelDx + nameNudge.x) * scale;
  const labelY = (horizontalPull ? bodyY - bar / 2 - 18 : bodyY) + (item.handleLabelDy + nameNudge.y) * scale;
  const lengthMm = item.handleKind === "lpipe" ? Math.max(item.pipeVertLen, item.pipeHorizLen) : item.pullLength;
  const marked = item.handleKind !== "none" || item.lockStyle !== "none";
  const canDrag = Boolean(edit?.editable);
  const heightKey = labelKey(labelScope, "handle-height", item.id);
  const heightNudge = edit?.nudge[heightKey] ?? { x: 0, y: 0 };
  const nameKey = labelKey(labelScope, "handle-name", item.id);
  const leaderX = bodyX + into * (bar / 2 + 14);
  const leaderEnd = Math.min(floor - 28, bodyY + halfReach + 8);
  return (
    <g data-testid="handle" data-side={item.handleSide} data-kind={item.handleKind} data-dx={item.handleDx} data-dy={item.handleDy} data-lock-dx={item.lockDx} data-lock-height={item.lockHeight} data-label-dx={item.handleLabelDx} data-label-dy={item.handleLabelDy}>
      {marked && item.handleKind !== "none" && (
        <g
          data-testid="handle-height-label"
          transform={`translate(${heightNudge.x * scale} ${heightNudge.y * scale})`}
          pointerEvents={canDrag ? "all" : "none"}
          style={{ cursor: canDrag ? "move" : undefined }}
          onPointerDown={canDrag ? (event) => edit?.startLabel(event, heightKey) : undefined}
        >
          {leaderEnd < floor - 30 && (
            <line x1={leaderX} y1={floor - 18} x2={leaderX} y2={leaderEnd} stroke={drawStyle.ink} strokeWidth={drawStyle.dimStroke} strokeDasharray="2 2" pointerEvents="none" />
          )}
          <text data-testid="handle-height" x={leaderX + into * 8} y={floor - 14} textAnchor={into > 0 ? "start" : "end"} className="panel-size" pointerEvents="none">
            {formatLength(item.handleHeight, unit)} fl
          </text>
        </g>
      )}
      {item.handleKind !== "none" && (
        <g data-testid="handle-body" onPointerDown={canDrag ? (event) => edit?.startHandle(event, item, "body") : undefined} style={{ cursor: canDrag ? "move" : undefined }}>
          {item.handleKind === "lpipe" && <RoundPipeL x={bodyX} y={bodyY} scale={scale} item={item} labelKey={labelKey(labelScope, "pipe-size", item.id)} />}
          {item.handleKind === "pull" && <PullBar x={bodyX} y={bodyY} scale={scale} item={item} />}
        </g>
      )}
      {item.lockStyle === "lever" && (
        <g data-testid="lock-body" data-dx={item.lockDx} data-height={item.lockHeight} onPointerDown={canDrag ? (event) => edit?.startHandle(event, item, "lock") : undefined} style={{ cursor: canDrag ? "move" : undefined }}>
          <LeverLock x={lockX} y={lockY} side={item.handleSide} />
        </g>
      )}
      {item.lockStyle === "lever" && (
        <LockName x={lockX} y={lockY} side={item.handleSide} name={item.lockName.trim() || "Lever lock"} labelKey={labelKey(labelScope, "lock-name", item.id)} />
      )}
      {item.handleKind !== "none" && item.handlePhoto && (
        <image
          href={item.handlePhoto}
          x={item.handleSide === "left" ? bodyX + 8 : bodyX - 56}
          y={openingY + 8}
          width="48"
          height="48"
          preserveAspectRatio="xMidYMid meet"
          data-testid="handle-photo-drawing"
        />
      )}
      {item.handleKind !== "none" && (
        <text
          data-testid="handle-direction"
          data-axis={item.handleKind === "pull" ? item.pullAxis : "lpipe"}
          x={labelX}
          y={labelY}
          textAnchor={into > 0 ? "start" : "end"}
          className="panel-size"
          pointerEvents={canDrag ? "all" : "none"}
          onPointerDown={canDrag ? (event) => edit?.startLabel(event, nameKey) : undefined}
          style={{ cursor: canDrag ? "move" : undefined }}
        >
          {item.handleKind === "pull"
            ? `${formatLength(lengthMm, unit)} ${item.handleSide === "left" ? "L" : "R"}`
            : `Pipe ${item.handleSide === "left" ? "L" : "R"}`}
        </text>
      )}
    </g>
  );
}

function tubeOutline(x1: number, y1: number, x2: number, y2: number, dia: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (dia / 2);
  const ny = (dx / len) * (dia / 2);
  return `M ${x1 + nx} ${y1 + ny} L ${x2 + nx} ${y2 + ny} L ${x2 - nx} ${y2 - ny} L ${x1 - nx} ${y1 - ny} Z`;
}

function RoundPipeL({ x, y, scale, item, labelKey: key }: { x: number; y: number; scale: number; item: PlacedItem; labelKey: string }) {
  const edit = useContext(EditCtx);
  const vLen = Math.max(12, item.pipeVertLen * scale);
  const hLen = Math.max(16, item.pipeHorizLen * scale);
  const vW = Math.max(5, item.pipeVertDia * scale);
  const hW = Math.max(4, item.pipeTubeDia * scale);
  const dir = item.legPoint === "left" ? -1 : 1;
  const y1 = y - vLen;
  const x2 = x + dir * hLen;
  const nudge = edit?.nudge[key] ?? { x: 0, y: 0 };
  const canDrag = Boolean(edit?.editable);
  const ink = drawStyle.ink;
  const stroke = drawStyle.sectionStroke;
  return (
    <g data-testid="handle-lpipe" data-vert={item.pipeVertLen} data-horiz={item.pipeHorizLen} data-tube={item.pipeTubeDia} data-return={item.pipeReturn} data-leg={item.legPoint} stroke={ink} fill="transparent" strokeWidth={stroke}>
      <path d={tubeOutline(x, y, x, y1, vW)} />
      <path d={tubeOutline(x, y1, x2, y1, hW)} />
      <circle cx={x} cy={y} r={vW / 2} />
      <circle cx={x2} cy={y1} r={hW / 2} />
      <text
        data-testid="pipe-size"
        x={(x + x2) / 2 + nudge.x * scale}
        y={y1 - hW / 2 - 16 + nudge.y * scale}
        textAnchor="middle"
        className="panel-size"
        pointerEvents={canDrag ? "all" : "none"}
        style={{ cursor: canDrag ? "move" : undefined }}
        onPointerDown={canDrag ? (event) => edit?.startLabel(event, key) : undefined}
      >
        {formatMm(item.pipeHorizLen)} · {formatMm(item.pipeReturn)}
      </text>
    </g>
  );
}

function PullBar({
  x,
  y,
  scale,
  item,
}: {
  x: number;
  y: number;
  scale: number;
  item: PlacedItem;
}) {
  const length = Math.max(14, item.pullLength * scale);
  const thick = Math.max(5, 18 * scale);
  const horizontal = item.pullAxis === "horizontal";
  const w = horizontal ? length : thick;
  const h = horizontal ? thick : length;
  const left = x - w / 2;
  const top = y - h / 2;
  const inset = Math.max(1.4, Math.min(w, h) * 0.28);
  return (
    <g data-testid="handle-pull" data-axis={item.pullAxis} data-length={item.pullLength} data-finish={item.pullFinish} fill="transparent" stroke={drawStyle.ink} strokeWidth={drawStyle.sectionStroke}>
      <rect x={left} y={top} width={w} height={h} />
      <rect x={left + inset} y={top + inset} width={Math.max(0, w - inset * 2)} height={Math.max(0, h - inset * 2)} fill="none" />
    </g>
  );
}

function LeverLock({ x, y, side }: { x: number; y: number; side: Side }) {
  const dir = side === "left" ? 1 : -1;
  const lever = 40;
  const leverX = dir > 0 ? x : x - lever;
  const stroke = drawStyle.sectionStroke;
  const ink = drawStyle.ink;
  return (
    <g data-testid="lock-lever" data-side={side} fill="transparent" stroke={ink} strokeWidth={stroke}>
      <rect x={x - 6} y={y - 8} width="12" height="16" rx="1.5" />
      <rect x={leverX} y={y - 2.5} width={lever} height="5" />
      <rect x={dir > 0 ? leverX + lever - 8 : leverX} y={y - 4} width="8" height="8" />
      <rect x={x - 3} y={y - 15} width="6" height="6" fill="none" />
    </g>
  );
}

function LockName({ x, y, side, name, labelKey: key }: { x: number; y: number; side: Side; name: string; labelKey: string }) {
  const edit = useContext(EditCtx);
  const dir = side === "left" ? 1 : -1;
  const lever = 40;
  const nudge = edit?.nudge[key] ?? { x: 0, y: 0 };
  const s = edit?.scale || 1;
  const canDrag = Boolean(edit?.editable);
  const baseX = dir > 0 ? x + lever + 18 : x - lever - 18;
  const baseY = y - 26;
  return (
    <g
      data-testid="lock-name"
      transform={`translate(${nudge.x * s} ${nudge.y * s})`}
      pointerEvents={canDrag ? "all" : "none"}
      style={{ cursor: canDrag ? "move" : undefined }}
      onPointerDown={canDrag ? (event) => edit?.startLabel(event, key) : undefined}
    >
      <rect x={dir > 0 ? baseX - 2 : baseX - 86} y={baseY - 14} width="90" height="18" fill="transparent" stroke="none" />
      <text x={baseX} y={baseY} textAnchor={dir > 0 ? "start" : "end"} className="panel-size" pointerEvents="none">
        {name}
      </text>
    </g>
  );
}

function Hinges({ side, x, y, w, h, count, scale }: { side: Side; x: number; y: number; w: number; h: number; count: number; scale: number }) {
  const edge = side === "left" ? x : x + w;
  const centers = hingeCenters(count, h / Math.max(scale, 0.001));
  const n = centers.length;
  const plateW = 20 * scale;
  const plateH = 100 * scale;
  const nodes = [];
  for (let i = 0; i < n; i += 1) {
    const cy = y + centers[i] * scale;
    const left = edge - plateW / 2;
    const top = cy - plateH / 2;
    nodes.push(
      <g key={i} data-testid="hinge" data-side={side} data-count={n} data-width-mm="20" data-height-mm="100" data-shape="capsule">
        <rect x={left} y={top} width={plateW} height={plateH} rx={plateW / 2} ry={plateW / 2} fill="#ffffff" stroke="#111111" strokeWidth="1.25" />
        <line data-testid="hinge-knuckle" x1={left} y1={cy} x2={left + plateW} y2={cy} stroke="#111111" strokeWidth="1.05" />
      </g>,
    );
  }
  return <g pointerEvents="none">{nodes}</g>;
}

function useLabelSpan(label: string) {
  const ref = useRef<SVGTextElement>(null);
  const [span, setSpan] = useState(() => Math.max(16, label.length * 7.4));
  useLayoutEffect(() => {
    const next = ref.current?.getComputedTextLength();
    if (!next || !Number.isFinite(next)) return;
    setSpan((current) => (Math.abs(current - next) > 0.5 ? next : current));
  }, [label]);
  return { ref, span };
}

/** Pieces of a dimension line with a gap where the size is written. */
function spanPieces(start: number, end: number, gap: number): [number, number][] {
  const mid = (start + end) / 2;
  const half = gap / 2;
  const cutA = mid - half;
  const cutB = mid + half;
  const parts: [number, number][] = [];
  if (cutA > start + 0.75) parts.push([start, Math.min(cutA, end)]);
  if (cutB < end - 0.75) parts.push([Math.max(cutB, start), end]);
  return parts;
}

function DimH({ x1, x2, y, label, testId, strong, fromY }: { x1: number; x2: number; y: number; label: string; testId?: string; strong?: boolean; fromY?: number }) {
  const edit = useContext(EditCtx);
  const span = Math.abs(x2 - x1);
  const { ref, span: textSpan } = useLabelSpan(label);
  if (span < 8) return null;
  const left = Math.min(x1, x2);
  const right = Math.max(x1, x2);
  const mid = (left + right) / 2;
  const nudge = testId ? edit?.nudge[testId] : undefined;
  const s = edit?.scale || 1;
  const lineY = y + (nudge?.y ?? 0) * s;
  const canDrag = Boolean(edit?.editable && testId);
  const gap = textSpan + Math.max(8, textSpan * 0.18);
  const parts = spanPieces(left, right, gap);
  return (
    <g
      className={strong ? "dim dim-strong" : "dim"}
      data-axis="y"
      data-span={span}
      pointerEvents={canDrag ? "all" : "none"}
      style={{ cursor: canDrag ? "ns-resize" : undefined }}
      onPointerDown={canDrag && testId ? (event) => edit?.startLabel(event, testId, "y") : undefined}
    >
      {canDrag && <rect className="dim-hit" x={left} y={lineY - 14} width={span} height={28} fill="transparent" stroke="none" />}
      {fromY != null && (
        <g className="ext">
          <line x1={left} y1={fromY} x2={left} y2={lineY} />
          <line x1={right} y1={fromY} x2={right} y2={lineY} />
        </g>
      )}
      {parts.map(([xA, xB]) => (
        <line key={`${xA}-${xB}`} className="dim dim-span" x1={xA} y1={lineY} x2={xB} y2={lineY} />
      ))}
      <line x1={left} y1={lineY - 3.5} x2={left} y2={lineY + 3.5} />
      <line x1={right} y1={lineY - 3.5} x2={right} y2={lineY + 3.5} />
      <text ref={ref} data-testid={testId} x={mid} y={lineY} textAnchor="middle" dominantBaseline="middle">
        {label}
      </text>
    </g>
  );
}

function DimV({ x, y1, y2, label, testId, fromX }: { x: number; y1: number; y2: number; label: string; testId?: string; fromX?: number }) {
  const edit = useContext(EditCtx);
  const span = Math.abs(y2 - y1);
  const { ref, span: textSpan } = useLabelSpan(label);
  if (span < 10) return null;
  const top = Math.min(y1, y2);
  const bottom = Math.max(y1, y2);
  const mid = (top + bottom) / 2;
  const nudge = testId ? edit?.nudge[testId] : undefined;
  const s = edit?.scale || 1;
  const lineX = x + (nudge?.x ?? 0) * s;
  const canDrag = Boolean(edit?.editable && testId);
  const gap = textSpan + Math.max(8, textSpan * 0.18);
  const parts = spanPieces(top, bottom, gap);
  return (
    <g
      className="dim"
      data-axis="x"
      data-span={span}
      pointerEvents={canDrag ? "all" : "none"}
      style={{ cursor: canDrag ? "ew-resize" : undefined }}
      onPointerDown={canDrag && testId ? (event) => edit?.startLabel(event, testId, "x") : undefined}
    >
      {canDrag && <rect className="dim-hit" x={lineX - 14} y={top} width={28} height={span} fill="transparent" stroke="none" />}
      {fromX != null && (
        <g className="ext">
          <line x1={fromX} y1={top} x2={lineX} y2={top} />
          <line x1={fromX} y1={bottom} x2={lineX} y2={bottom} />
        </g>
      )}
      {parts.map(([yA, yB]) => (
        <line key={`${yA}-${yB}`} className="dim dim-span" x1={lineX} y1={yA} x2={lineX} y2={yB} />
      ))}
      <line x1={lineX - 3.5} y1={top} x2={lineX + 3.5} y2={top} />
      <line x1={lineX - 3.5} y1={bottom} x2={lineX + 3.5} y2={bottom} />
      <text ref={ref} data-testid={testId} x={lineX} y={mid} textAnchor="middle" dominantBaseline="middle" transform={`rotate(-90 ${lineX} ${mid})`}>
        {label}
      </text>
    </g>
  );
}

function BrokenSpan({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label: string }) {
  const { ref, span } = useLabelSpan(label);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const gap = span + Math.max(8, span * 0.18);
  const parts = spanPieces(0, len, gap);
  const ux = dx / len;
  const uy = dy / len;
  return (
    <>
      {parts.map(([a, b]) => (
        <line key={`${a}-${b}`} className="dim dim-span" x1={x1 + ux * a} y1={y1 + uy * a} x2={x1 + ux * b} y2={y1 + uy * b} />
      ))}
      <text ref={ref} className="dim" x={(x1 + x2) / 2} y={(y1 + y2) / 2} textAnchor="middle" dominantBaseline="middle">
        {label}
      </text>
    </>
  );
}
