import { HexDiagram, type DiagramArrow, type DiagramHex } from './HexDiagram'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'

// ---------------------------------------------------------------------------
// The monster turn as a step-by-step procedure with small hex diagrams,
// replacing the removed focus calculator (owner's ruling r195).
// ---------------------------------------------------------------------------

interface StepDiagram {
  ariaLabel: string
  caption: string
  hexes: DiagramHex[]
  arrows?: DiagramArrow[]
}

interface Step {
  title: string
  /** Page reference shown next to the step title. */
  ref: string
  body: string
  diagram?: StepDiagram
  /** Extra diagrams lettered (a), (b), … shown under the body. */
  subDiagrams?: StepDiagram[]
}

const STEP_1: Step = {
  title: 'Check what the monster can do',
  ref: 'Rules Glossary p.26',
  body: 'Stunned: it does nothing this turn. Immobilized: it skips all Move abilities. Disarmed or without an Attack ability: it still finds a focus as if it had a melee attack against one target.',
  diagram: {
    ariaLabel:
      'A stunned monster on a hex map: it takes no focus, does not move and does not attack',
    caption: 'Stunned: no focus, no move, no attack',
    hexes: [
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 },
      { q: 0, r: 0, marker: 'monster', label: 'Stun' },
    ],
  },
}

const STEP_2: Step = {
  title: 'Find a hex to attack from',
  ref: 'Rules Glossary p.26',
  body: 'Look for an unoccupied hex from which it could attack an enemy (line of sight needed). No such hex reachable at all: no focus, the monster neither moves nor attacks.',
}

const STEP_3A: StepDiagram = {
  ariaLabel:
    'The monster takes the longer path around a trap to reach character A: fewest traps first',
  caption: 'Fewest traps first, even if longer',
  hexes: [
    { q: 1, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 0, marker: 'monster', label: 'M' },
    { q: 0, r: 1, marker: 'trap' },
    { q: 1, r: 0, marker: 'path' },
    { q: 1, r: 1, marker: 'path' },
    { q: 0, r: 2, marker: 'target' },
    { q: 0, r: 3, marker: 'character', label: 'A' },
  ],
  arrows: [
    { points: [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 1, r: 1 },
      { q: 0, r: 2 },
    ] },
    {
      dashed: true,
      points: [
        { q: 0, r: 0 },
        { q: 0, r: 1 },
        { q: 0, r: 2 },
      ],
    },
  ],
}

const STEP_3B: StepDiagram = {
  ariaLabel:
    'Character A stands two hexes from the monster, character B four hexes: the monster focuses A',
  caption: 'Shorter path: focus A',
  hexes: [
    { q: 1, r: 0 },
    { q: 3, r: -2 },
    { q: 0, r: 0, marker: 'monster', label: 'M' },
    { q: 1, r: -1, marker: 'path' },
    { q: 2, r: -1, marker: 'character', label: 'A' },
    { q: 4, r: -2, marker: 'character', label: 'B' },
  ],
  arrows: [
    { points: [
      { q: 0, r: 0 },
      { q: 1, r: -1 },
      { q: 2, r: -1 },
    ] },
  ],
}

const STEP_3C: StepDiagram = {
  ariaLabel:
    'Characters A and B are equally far from the monster; B has the earlier initiative and becomes the focus',
  caption: 'Equal distance: earlier initiative (B)',
  hexes: [
    { q: 0, r: 0, marker: 'monster', label: 'M' },
    { q: 1, r: 0, marker: 'path' },
    { q: 0, r: 1, marker: 'path' },
    { q: 2, r: 0, marker: 'character', label: 'A 35' },
    { q: 0, r: 2, marker: 'character', label: 'B 15' },
  ],
  arrows: [
    { points: [
      { q: 0, r: 0 },
      { q: 0, r: 1 },
      { q: 0, r: 2 },
    ] },
    {
      dashed: true,
      points: [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
        { q: 2, r: 0 },
      ],
    },
  ],
}

const STEP_3: Step = {
  title: 'Pick the focus, in this order',
  ref: 'Rules Glossary p.10, p.26; Learn to Play p.11',
  body: '(a) the path that springs the fewest traps, even if it is much longer; (b) the shortest path (fewest movement points); (c) the enemy earliest in initiative. Line of sight to the enemy right now does not matter, and neither does whether it can reach this turn. Ties between characters with the same initiative: see the initiative rules on p.26.',
  subDiagrams: [STEP_3A, STEP_3B, STEP_3C],
}

const STEP_4: Step = {
  title: 'Move',
  ref: 'Learn to Play p.11, p.18; Rules Glossary p.14, p.26',
  body: 'It moves only as far as needed to attack its focus (and as many extra targets as its attack allows). A ranged monster that would stand next to its focus moves away, as far as its move allows, so it does not attack with Disadvantage; it does not bother if it has Disadvantage anyway (for example Muddle).',
  diagram: {
    ariaLabel:
      'A ranged monster standing next to its focus A steps one hex away and shoots from distance',
    caption: 'Ranged: steps away to avoid Disadvantage',
    hexes: [
      { q: 1, r: -2 },
      { q: -1, r: 0 },
      { q: 0, r: 0, marker: 'monster', label: 'M' },
      { q: 1, r: 0, marker: 'character', label: 'A' },
      { q: 1, r: -1, marker: 'path' },
      { q: 2, r: -2, marker: 'target' },
    ],
    arrows: [
      { points: [
        { q: 0, r: 0 },
        { q: 1, r: -1 },
        { q: 2, r: -2 },
      ] },
      {
        dashed: true,
        points: [
          { q: 2, r: -2 },
          { q: 1, r: 0 },
        ],
      },
    ],
  },
}

const STEP_5: Step = {
  title: 'Attack',
  ref: 'Learn to Play p.11',
  body: 'It attacks the focus; with several targets, the other targets are chosen as described on Rules Glossary p.26.',
}

const STEP_6: Step = {
  title: 'Players decide ties',
  ref: 'Rules Glossary p.26',
  body: 'Whenever two choices are equally good under these rules, the players choose.',
}

const STEPS: Step[] = [STEP_1, STEP_2, STEP_3, STEP_4, STEP_5, STEP_6]

/** Diagram letters shown under a step body: (a), (b), (c) … */
const SUB_DIAGRAM_LETTERS = ['a', 'b', 'c', 'd', 'e'] as const

function StepDiagramCard({ diagram }: { diagram: StepDiagram }) {
  return (
    <figure className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="mx-auto max-w-[320px]">
        <HexDiagram
          hexes={diagram.hexes}
          arrows={diagram.arrows}
          ariaLabel={diagram.ariaLabel}
        />
      </div>
      <figcaption className="mt-2 text-center text-sm text-zinc-400">
        {diagram.caption}
      </figcaption>
    </figure>
  )
}

export function MonsterTurnPage() {
  useDocumentTitle('Monster Turn')
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-amber-500">Monster Turn</h1>
        <p className="text-zinc-400">
          The monster turn procedure step by step (Rules Glossary p.26)
        </p>
      </div>

      {/* Steps */}
      <ol className="space-y-4">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
          >
            <div className="flex items-baseline gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-zinc-900">
                {index + 1}
              </span>
              <h2 className="text-lg font-semibold text-amber-400">{step.title}</h2>
            </div>
            <p className="mt-2 text-xs text-zinc-500">{step.ref}</p>
            <p className="mt-2 leading-relaxed text-zinc-300">{step.body}</p>
            {step.diagram && <StepDiagramCard diagram={step.diagram} />}
            {step.subDiagrams?.map((diagram, i) => (
              <div key={i} className="mt-4">
                <p className="mb-1 text-sm font-semibold text-zinc-300">
                  ({SUB_DIAGRAM_LETTERS[i]})
                </p>
                <StepDiagramCard diagram={diagram} />
              </div>
            ))}
          </li>
        ))}
      </ol>
    </div>
  )
}
