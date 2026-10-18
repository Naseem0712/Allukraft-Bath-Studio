/**
 * The only place canvas and quote drawing strokes and size text are chosen.
 * ShowerFigure writes this into the SVG. Do not copy the numbers into CSS.
 */
export const drawStyle = {
  /** One dimension stroke on the screen canvas. Slimmer than the section. */
  dimStroke: 0.5,
  /** The same stroke on the quote, still slimmer than the section. */
  dimStrokeQuote: 0.62,
  /** Glass edges. Still one CAD line. */
  profileStroke: 0.75,
  /**
   * Each edge of the 16 mm profile section.
   * A solid stroke, a little slimmer than 0.9px, and still heavier than a dimension line.
   * The 16 mm gap between the edges stays.
   */
  sectionStroke: 0.75,
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
    `[data-testid="glass-edge"],[data-testid="hpl-edge"],[data-testid="plan-room"],[data-testid="plan-frame"],[data-testid="plan-partition"],[data-testid="plan-item"] rect,[data-testid="placed-door"] rect,[data-testid="placed-fixed"] rect,[data-testid="soft-frame"]{stroke-width:${profile}px;vector-effect:non-scaling-stroke}`,
    `[data-testid="miter"],[data-testid="plan-section"]{stroke-width:${drawStyle.sectionStroke}px;vector-effect:non-scaling-stroke}`,
    `.dim rect{stroke:none;fill:transparent}`,
  ].join("");
}
