import { useEffect, useRef, useState, type MutableRefObject } from "react";
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
}

export default function Drawing({ shower, unit, selectedId, activeRun, onSelect, onMove, onResize, onResizeSide, onMoveSide, onMoveFixture, projectRef, watermark, dimArmed, onArmDim, onAddDim, onMoveDim, onNudgeLabel, onNudgeHandle }: DrawingProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 900, h: 640 });

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => setBox({ w: Math.max(360, el.clientWidth), h: Math.max(420, el.clientHeight) });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const plan = shower.useDepth || shower.ceiling.enabled || shower.sides.length > 0;
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
        <button type="button" data-testid="dim-tool" aria-pressed={dimArmed} onClick={onArmDim}>
          {dimArmed ? "Pick two points" : "Dimension"}
        </button>
      </div>
      <div className="svg-host" ref={hostRef}>
        <ShowerFigure
          shower={shower}
          unit={unit}
          width={box.w}
          height={box.h}
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
        />
      </div>
    </div>
  );
}
