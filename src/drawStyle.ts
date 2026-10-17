/**
 * The only place canvas and quote drawing strokes and size text are chosen.
 * ShowerFigure writes this into the SVG. Do not copy the numbers into CSS.
 */
export const drawStyle = {
  /** One dimension stroke on the screen canvas, in CSS pixels. */
  dimStroke: 0.7,
  /** The same stroke, slightly heavier so it reads on paper. */
  dimStrokeQuote: 0.85,
  /** Profile and glass edges. A touch heavier than a 0.6px hairline. */
  profileStroke: 0.75,
  /** Size numbers. Larger than the 12pt details table. */
  sizeFont: "14pt",
  ink: "#111111",
} as const;

export function drawingCss(quote: boolean): string {
  const dim = quote ? drawStyle.dimStrokeQuote : drawStyle.dimStroke;
  const profile = drawStyle.profileStroke;
  return [
    `.dim,.ext{stroke:${drawStyle.ink};fill:none;stroke-width:${dim}px;vector-effect:non-scaling-stroke}`,
    `.dim text,text.dim,.dim-strong text{font-size:${drawStyle.sizeFont};font-weight:650;fill:${drawStyle.ink};stroke:none}`,
    `.miter,[data-testid="glass-edge"],[data-testid="hpl-edge"],[data-testid="plan-room"],[data-testid="plan-frame"],[data-testid="plan-partition"],[data-testid="plan-item"] rect,[data-testid="placed-door"] rect,[data-testid="placed-fixed"] rect,[data-testid="soft-frame"]{stroke-width:${profile}px;vector-effect:non-scaling-stroke}`,
    `.dim rect{stroke:none;fill:transparent}`,
  ].join("");
}
