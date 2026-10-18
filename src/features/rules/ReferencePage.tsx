import { conditions, elements, rules, type ConditionRemoval } from '@/data'
import { formatSource } from '@/shared/lib/source'

/** When a condition token comes off the figure (LtP p.22). */
const REMOVAL_LABELS: Record<ConditionRemoval, string> = {
  end_of_turn: 'End of next turn',
  on_heal: 'On heal',
  on_reveal: 'When drawn',
}

/** The element board: every infused element steps Strong → Waning → Inert (LtP p.26). */
function ElementBoardDiagram() {
  const box = (x: number, label: string, cls: string, textCls: string, dashed = false) => (
    <g>
      <rect
        x={x}
        y={14}
        width={68}
        height={32}
        rx={6}
        strokeWidth={1.5}
        strokeDasharray={dashed ? '4 3' : undefined}
        className={cls}
      />
      <text x={x + 34} y={34} textAnchor="middle" fontSize={11} className={textCls}>
        {label}
      </text>
    </g>
  )

  const arrow = (x1: number, x2: number) => {
    const head = x2 - 6
    return (
      <g className="stroke-zinc-500">
        <line x1={x1} y1={30} x2={head} y2={30} strokeWidth={1.5} />
        <polygon
          points={`${head},25 ${x2},30 ${head},35`}
          className="fill-zinc-500 stroke-none"
        />
      </g>
    )
  }

  return (
    <svg
      viewBox="0 0 280 60"
      width="100%"
      role="img"
      aria-label="Element board: an infused element starts Strong, moves to Waning at the end of every round and then to Inert; it can be consumed while Strong or Waning"
      className="max-w-[280px]"
    >
      {box(6, 'Strong', 'fill-amber-500/10 stroke-amber-500', 'fill-amber-400 font-medium')}
      {arrow(78, 102)}
      {box(106, 'Waning', 'fill-zinc-800 stroke-zinc-500', 'fill-zinc-300')}
      {arrow(178, 202)}
      {box(206, 'Inert', 'fill-zinc-900 stroke-zinc-700', 'fill-zinc-500', true)}
    </svg>
  )
}

type GuideBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }

/** Split guide content into paragraphs, `**heading**` lines, `- ` and `1. ` lists. */
function guideBlocks(content: string[]): GuideBlock[] {
  const blocks: GuideBlock[] = []
  for (const raw of content) {
    const line = raw.trim()
    if (!line) continue
    const last = blocks[blocks.length - 1]
    if (line.startsWith('**') && line.endsWith('**')) {
      blocks.push({ kind: 'heading', text: line.slice(2, -2) })
    } else if (line.startsWith('- ')) {
      if (last?.kind === 'ul') last.items.push(line.slice(2))
      else blocks.push({ kind: 'ul', items: [line.slice(2)] })
    } else if (/^\d+\. /.test(line)) {
      const text = line.replace(/^\d+\. /, '')
      if (last?.kind === 'ol') last.items.push(text)
      else blocks.push({ kind: 'ol', items: [text] })
    } else {
      blocks.push({ kind: 'paragraph', text: line })
    }
  }
  return blocks
}

function GuideContent({ content }: { content: string[] }) {
  return (
    <div className="space-y-2 text-zinc-300">
      {guideBlocks(content).map((block, i) => {
        switch (block.kind) {
          case 'heading':
            return (
              <h4 key={i} className="mb-2 mt-4 font-semibold text-amber-400">
                {block.text}
              </h4>
            )
          case 'ul':
            return (
              <ul key={i} className="ml-4 list-disc space-y-1">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="ml-4 list-decimal space-y-1">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ol>
            )
          default:
            return <p key={i}>{block.text}</p>
        }
      })}
    </div>
  )
}

export function ReferencePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-amber-500">Quick Reference</h1>
        <p className="text-zinc-400">
          Visual cards for frequently looked-up game mechanics
        </p>
      </div>

      {/* Conditions Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-zinc-100">Conditions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {conditions.map((condition) => (
            <div
              key={condition.id}
              className={`rounded-lg border-2 bg-zinc-900/50 p-4 ${
                condition.type === 'negative'
                  ? 'border-red-900/50'
                  : 'border-emerald-900/50'
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-zinc-100">{condition.name}</h3>
                <span
                  className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${
                    condition.type === 'negative'
                      ? 'bg-red-900/30 text-red-400'
                      : 'bg-emerald-900/30 text-emerald-400'
                  }`}
                >
                  {condition.type === 'negative' ? 'Negative' : 'Positive'}
                </span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {condition.description}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-800 pt-3">
                <span className="rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-400">
                  Removed: {REMOVAL_LABELS[condition.removal]}
                </span>
                <span className="text-right text-xs text-zinc-500">
                  {formatSource(condition.source)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Elements Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-zinc-100">Elements</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {elements.map((element) => (
            <div
              key={element.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
              style={{
                borderTopColor: element.color,
                borderTopWidth: '4px',
              }}
            >
              <div className="mb-2 flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: element.color }}
                  aria-hidden="true"
                />
                <h3 className="text-lg font-semibold text-zinc-100">{element.name}</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {element.description}
              </p>
              <p className="mt-3 text-xs text-zinc-500">{formatSource(element.source)}</p>
            </div>
          ))}

          {/* Element board: the shared Strong → Waning → Inert track */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="mb-3 text-lg font-semibold text-zinc-100">Element board</h3>
            <div className="mb-3 flex justify-center">
              <ElementBoardDiagram />
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Infused elements start Strong; at the end of every round each element
              moves one step toward Inert. Consuming works from Strong or Waning.
              (Learn to Play p.26)
            </p>
          </div>
        </div>
      </section>

      {/* Core Guides Section */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold text-zinc-100">Core Rules</h2>
        <div className="space-y-4">
          {rules.guides.map((guide) => (
            <div
              key={guide.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
            >
              <h3 className="mb-1 text-xl font-semibold text-amber-400">{guide.title}</h3>
              <p className="mb-4 text-xs text-zinc-500">{formatSource(guide.source)}</p>
              <GuideContent content={guide.content} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
