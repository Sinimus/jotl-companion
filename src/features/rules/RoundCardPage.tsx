import { Link } from 'react-router-dom'
import { formatSource } from '@/shared/lib/source'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { ROUND_STEPS, ROUND_TOPICS, type RoundLine } from './roundCard'

function Lines({ lines }: { lines: readonly RoundLine[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {lines.map((line) => (
        <li key={line.text} className="text-sm leading-snug text-zinc-300">
          {line.text}
          <span className="ml-1.5 text-[11px] text-zinc-400">({formatSource(line.source)})</span>
        </li>
      ))}
    </ul>
  )
}

/** The round on one screen: four steps, then rests, damage, exhaustion and elements. */
export function RoundCardPage() {
  useDocumentTitle('Round')
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-amber-500">Round</h1>
      <p className="text-zinc-400">Every round runs in four steps (Learn to Play p.6, Rules Glossary p.16).</p>

      <ol className="mt-6 space-y-3">
        {ROUND_STEPS.map((step) => (
          <li key={step.title} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="text-lg font-semibold text-amber-400">{step.title}</h2>
            <Lines lines={step.lines} />
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {ROUND_TOPICS.map((topic) => (
          <section key={topic.title} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="text-base font-semibold text-zinc-100">{topic.title}</h2>
            <Lines lines={topic.lines} />
          </section>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link
          to="/rules/monster-turn"
          className="flex min-h-11 flex-1 items-center rounded-lg border border-zinc-700 px-3 text-sm text-amber-400 hover:border-amber-500/60"
        >
          Monster turn step by step →
        </Link>
        <Link
          to="/rules/reference"
          className="flex min-h-11 flex-1 items-center rounded-lg border border-zinc-700 px-3 text-sm text-amber-400 hover:border-amber-500/60"
        >
          Conditions and the element board →
        </Link>
      </div>
    </div>
  )
}
