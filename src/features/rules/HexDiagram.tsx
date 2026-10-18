// ---------------------------------------------------------------------------
// Tiny inline-SVG hex map for the rules pages: pointy-top hexes placed by
// axial coordinates, an optional marker and short label per hex, and optional
// arrows through hex centres. Schematic only — no rulebook artwork.
// ---------------------------------------------------------------------------

export type HexMarker = 'monster' | 'character' | 'trap' | 'obstacle' | 'path' | 'target'

export interface DiagramHex {
  /** Axial coordinate of the hex. */
  q: number
  r: number
  marker?: HexMarker
  /** Short label drawn on the marker (e.g. "M", "A" or an initiative number). */
  label?: string
}

export interface DiagramArrow {
  /** Hex centres the arrow passes through, in order. */
  points: { q: number; r: number }[]
  dashed?: boolean
}

interface HexDiagramProps {
  hexes: DiagramHex[]
  arrows?: DiagramArrow[]
  /** Description of the picture for screen readers. */
  ariaLabel: string
  className?: string
}

/** Circumradius of one hex in SVG units. */
const SIZE = 26
const SQRT3 = Math.sqrt(3)
const HEX_W = SQRT3 * SIZE
const HEX_H = 2 * SIZE
const PAD = 4
/** End points of arrows are pulled in by this much so they clear figure circles. */
const ARROW_TRIM = 13

/** Pointy-top axial coordinate → SVG centre. */
function centre(q: number, r: number): { x: number; y: number } {
  return { x: SQRT3 * SIZE * (q + r / 2), y: 1.5 * SIZE * r }
}

function hexPoints(cx: number, cy: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30)
    pts.push(`${(cx + SIZE * Math.cos(a)).toFixed(1)},${(cy + SIZE * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

/** Ground markers first, figures last so they draw on top. */
const MARKER_ORDER: Record<HexMarker, number> = {
  path: 0,
  obstacle: 0,
  target: 1,
  trap: 2,
  character: 3,
  monster: 4,
}

function labelSize(label: string): number {
  if (label.length <= 2) return 11
  if (label.length <= 4) return 8
  return 6.5
}

function HexLabel({ x, y, label, cls }: { x: number; y: number; label: string; cls: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={labelSize(label)}
      fontWeight={600}
      className={cls}
    >
      {label}
    </text>
  )
}

/** One arrow as a path through hex centres, ends trimmed, head on the last end. */
function ArrowPath({ arrow }: { arrow: DiagramArrow }) {
  const pts = arrow.points.map((p) => centre(p.q, p.r))
  const trim = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const len = Math.hypot(dx, dy) || 1
    return { x: from.x + (dx / len) * ARROW_TRIM, y: from.y + (dy / len) * ARROW_TRIM }
  }
  const start = pts.length > 1 ? trim(pts[0], pts[1]) : pts[0]
  const end = pts.length > 1 ? trim(pts[pts.length - 1], pts[pts.length - 2]) : pts[0]
  const d =
    `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} ` +
    pts
      .slice(1, -1)
      .map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)} `)
      .join('') +
    `L ${end.x.toFixed(1)} ${end.y.toFixed(1)}`
  // Arrow head at the end, oriented along the last segment.
  const prev = pts[pts.length - 2] ?? pts[0]
  const angle = Math.atan2(end.y - prev.y, end.x - prev.x)
  const head = [
    `${end.x.toFixed(1)},${end.y.toFixed(1)}`,
    `${(end.x - 8 * Math.cos(angle) + 3.5 * Math.sin(angle)).toFixed(1)},${(
      end.y -
      8 * Math.sin(angle) -
      3.5 * Math.cos(angle)
    ).toFixed(1)}`,
    `${(end.x - 8 * Math.cos(angle) - 3.5 * Math.sin(angle)).toFixed(1)},${(
      end.y -
      8 * Math.sin(angle) +
      3.5 * Math.cos(angle)
    ).toFixed(1)}`,
  ].join(' ')
  return (
    <g className="stroke-amber-400">
      <path
        d={d}
        fill="none"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={arrow.dashed ? '6 5' : undefined}
      />
      <polygon points={head} className="fill-amber-400 stroke-none" />
    </g>
  )
}

export function HexDiagram({ hexes, arrows = [], ariaLabel, className }: HexDiagramProps) {
  const allCentres = [...hexes, ...arrows.flatMap((a) => a.points)].map((h) =>
    centre(h.q, h.r),
  )
  const minX = Math.min(...allCentres.map((c) => c.x)) - HEX_W / 2 - PAD
  const maxX = Math.max(...allCentres.map((c) => c.x)) + HEX_W / 2 + PAD
  const minY = Math.min(...allCentres.map((c) => c.y)) - HEX_H / 2 - PAD
  const maxY = Math.max(...allCentres.map((c) => c.y)) + HEX_H / 2 + PAD

  const sorted = [...hexes].sort(
    (a, b) => MARKER_ORDER[a.marker ?? 'path'] - MARKER_ORDER[b.marker ?? 'path'],
  )

  return (
    <svg
      viewBox={`${minX.toFixed(1)} ${minY.toFixed(1)} ${(maxX - minX).toFixed(1)} ${(
        maxY - minY
      ).toFixed(1)}`}
      width="100%"
      role="img"
      aria-label={ariaLabel}
      className={className}
    >
      {sorted.map((hex) => {
        const { x, y } = centre(hex.q, hex.r)
        return (
          <g key={`${hex.q},${hex.r}`}>
            <polygon points={hexPoints(x, y)} className="fill-zinc-900 stroke-zinc-700" />
            {hex.marker === 'path' && (
              <polygon
                points={hexPoints(x, y)}
                strokeWidth={2}
                className="fill-amber-500/10 stroke-amber-500/50"
              />
            )}
            {hex.marker === 'obstacle' && (
              <polygon
                points={hexPoints(x, y)}
                strokeWidth={2}
                className="fill-zinc-600 stroke-zinc-500"
              />
            )}
            {hex.marker === 'target' && (
              <>
                <polygon
                  points={hexPoints(x, y)}
                  strokeWidth={3}
                  fill="none"
                  className="stroke-amber-400"
                />
                {hex.label && <HexLabel x={x} y={y} label={hex.label} cls="fill-amber-400" />}
              </>
            )}
            {hex.marker === 'trap' && (
              <>
                <polygon
                  points={hexPoints(x, y)}
                  strokeWidth={2}
                  className="fill-red-900/40 stroke-red-500"
                />
                <g className="stroke-red-400" strokeWidth={2.5} strokeLinecap="round">
                  <line x1={x - 6} y1={y - 6} x2={x + 6} y2={y + 6} />
                  <line x1={x - 6} y1={y + 6} x2={x + 6} y2={y - 6} />
                </g>
              </>
            )}
            {hex.marker === 'character' && (
              <>
                <circle
                  cx={x}
                  cy={y}
                  r={SIZE * 0.42}
                  className="fill-zinc-100 stroke-zinc-400"
                />
                {hex.label && (
                  <HexLabel x={x} y={y} label={hex.label} cls="fill-zinc-900" />
                )}
              </>
            )}
            {hex.marker === 'monster' && (
              <>
                <circle
                  cx={x}
                  cy={y}
                  r={SIZE * 0.42}
                  className="fill-amber-500 stroke-amber-300"
                />
                {hex.label && (
                  <HexLabel x={x} y={y} label={hex.label} cls="fill-zinc-900" />
                )}
              </>
            )}
          </g>
        )
      })}
      {arrows.map((arrow, i) => (
        <ArrowPath key={i} arrow={arrow} />
      ))}
    </svg>
  )
}
