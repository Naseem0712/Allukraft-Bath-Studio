import { useEffect, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent } from "react";
import ShowerFigure from "./scene";
import { DOOR_SHORT_MM, type Shower, type UnitId, type UserDim } from "./model";

interface DrawingProps {
  shower: Shower;
  unit: UnitId;
  selectedId: string | null;
  activeRun?: string;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number) => void;
  onResize: (id: string, next: { x: number; width: number }) => void;
  onResizeSide: (id: string, length: number) => void;
  onMoveSide: (id: string, attachX: number) => void;
  onMoveFixture: (kind: "wc" | "shower", x: number, y: number) => void;
  projectRef: MutableRefObject<(clientX: number, clientY: number) => number | null>;
  watermark?: string | null;
  dimArmed?: boolean;
  onArmDim?: () => void;
  onAddDim?: (dim: UserDim) => void;
  onMoveDim?: (id: string, offset: number) => void;
  onNudgeLabel?: (key: string, x: number, y: number) => void;
  onNudgeHandle?: (id: string, part: "body" | "label", x: number, y: number) => void;
  onMoveView?: (key: string, x: number, y: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDuplicate?: () => void;
  onClearCanvas?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const ZOOM_MIN = 0.35;
const ZOOM_MAX = 4;

function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));
}

export default function Drawing({ shower, unit, selectedId, activeRun, onSelect, onMove, onResize, onResizeSide, onMoveSide, onMoveFixture, projectRef, watermark, dimArmed, onArmDim, onAddDim, onMoveDim, onNudgeLabel, onNudgeHandle, onMoveView, onUndo, onRedo, onDuplicate, onClearCanvas, canUndo, canRedo }: DrawingProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const spaceRef = useRef(false);
  const panRef = useRef<{ id: number; x: number; y: number; px: number; py: number } | null>(null);
  const [box, setBox] = useState({ w: 900, h: 640 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 24 });
  const zoomRef = useRef(1);
  const panStateRef = useRef(pan);
  const [space, setSpace] = useState(false);
  const [panning, setPanning] = useState(false);
  zoomRef.current = zoom;
  panStateRef.current = pan;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => setBox({ w: Math.max(360, el.clientWidth), h: Math.max(420, el.clientHeight) });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (event.target as HTMLElement | null)?.isContentEditable) return;
      event.preventDefault();
      spaceRef.current = true;
      setSpace(true);
    };
    const up = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      spaceRef.current = false;
      setSpace(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  function zoomAt(clientX: number, clientY: number, factor: number) {
    const host = hostRef.current;
    const current = zoomRef.current;
    const next = clampZoom(current * factor);
    if (!host) {
      zoomRef.current = next;
      setZoom(next);
      return;
    }
    const rect = host.getBoundingClientRect();
    const ox = clientX - rect.left;
    const oy = clientY - rect.top;
    const origin = panStateRef.current;
    const worldX = (ox - origin.x) / current;
    const worldY = (oy - origin.y) / current;
    const nextPan = { x: ox - worldX * next, y: oy - worldY * next };
    zoomRef.current = next;
    panStateRef.current = nextPan;
    setZoom(next);
    setPan(nextPan);
  }

  function zoomButton(factor: number) {
    const host = hostRef.current;
    if (!host) {
      setZoom((current) => clampZoom(current * factor));
      return;
    }
    const rect = host.getBoundingClientRect();
    zoomAt(rect.left + host.clientWidth / 2, rect.top + host.clientHeight / 2, factor);
  }

  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
      zoomAtRef.current(event.clientX, event.clientY, factor);
    };
    host.addEventListener("wheel", wheel, { passive: false });
    return () => host.removeEventListener("wheel", wheel);
  }, []);

  function beginPan(event: ReactPointerEvent) {
    panRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, px: pan.x, py: pan.y };
    setPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerDownCapture(event: ReactPointerEvent<HTMLDivElement>) {
    if (!spaceRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    beginPan(event);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (spaceRef.current) return;
    const target = event.target as Element;
    if (target.getAttribute?.("data-canvas") !== "paper") return;
    beginPan(event);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const panDrag = panRef.current;
    if (!panDrag || panDrag.id !== event.pointerId) return;
    setPan({ x: panDrag.px + (event.clientX - panDrag.x), y: panDrag.py + (event.clientY - panDrag.y) });
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (panRef.current?.id !== event.pointerId) return;
    panRef.current = null;
    setPanning(false);
  }

  const plan = shower.useDepth || shower.ceiling.enabled || shower.sides.length > 0;
  const shifts = Object.values(shower.viewShift ?? {});
  const growX = shifts.reduce((max, shift) => Math.max(max, shift.x), 0);
  const growY = shifts.reduce((max, shift) => Math.max(max, shift.y), 0);
  const svgW = Math.round(Math.max(640, box.w) + 800 + Math.max(0, growX));
  const svgH = Math.round(Math.max(480, box.h) + 600 + Math.max(0, growY));
  return (
    <div className="canvas-wrap">
      <div className="stage-head">
        <div>
          <p className="eyebrow">{plan ? "Plan and elevation" : "Elevation"}</p>
          <h2>Drawing</h2>
        </div>
        <p className="stage-meta">
          {shower.material.finish === "profile"
            ? `Profile ${shower.material.profileFace} × ${shower.material.profileDepth} mm · 45° miters`
            : "Glass only"}
          {" · "}
          door leaf −{DOOR_SHORT_MM} mm
          {" · "}
          dimensions in {unit}
        </p>
        <div className="stage-tools">
          <button type="button" data-testid="undo" onClick={onUndo} disabled={!canUndo}>Undo</button>
          <button type="button" data-testid="redo" onClick={onRedo} disabled={!canRedo}>Redo</button>
          <button type="button" data-testid="duplicate" onClick={onDuplicate}>Duplicate</button>
          <button type="button" data-testid="clear-canvas" onClick={onClearCanvas}>Clear canvas</button>
          <button type="button" data-testid="zoom-out" onClick={() => zoomButton(1 / 1.1)}>Zoom out</button>
          <button type="button" data-testid="zoom-in" onClick={() => zoomButton(1.1)}>Zoom in</button>
          <span data-testid="zoom-level">{Math.round(zoom * 100)}%</span>
          <button type="button" data-testid="dim-tool" aria-pressed={dimArmed} onClick={onArmDim}>
            {dimArmed ? "Pick two points" : "Dimension"}
          </button>
        </div>
      </div>
      <div
        className={`svg-host${space ? " is-space" : ""}${panning ? " is-panning" : ""}`}
        ref={hostRef}
        onPointerDownCapture={onPointerDownCapture}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0", width: svgW, height: svgH }}>
          <ShowerFigure
            shower={shower}
            unit={unit}
            width={svgW}
            height={svgH}
            fitWidth={Math.max(320, box.w)}
            fitHeight={Math.max(280, box.h)}
            mode="studio"
            selectedId={selectedId}
            activeRun={activeRun}
            onSelect={onSelect}
            onMove={onMove}
            onResize={onResize}
            onResizeSide={onResizeSide}
            onMoveSide={onMoveSide}
            onMoveFixture={onMoveFixture}
            projectRef={projectRef}
            watermark={watermark}
            dimArmed={dimArmed}
            onAddDim={onAddDim}
            onMoveDim={onMoveDim}
            onNudgeLabel={onNudgeLabel}
            onNudgeHandle={onNudgeHandle}
            onMoveView={onMoveView}
          />
        </div>
      </div>
    </div>
  );
}
