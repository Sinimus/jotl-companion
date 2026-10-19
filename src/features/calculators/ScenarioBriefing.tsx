import { useState } from 'react'
import { Link } from 'react-router-dom'
import { scenarios } from '@/data'
import { formatSource } from '@/shared/lib/source'
import { scenarioLabel, scenarioLevelRow } from '@/features/campaign/rules'
import { handCheck, learningStage, levelUpPicks, scenarioRules } from '@/features/campaign/progression'
import type { Campaign } from '@/shared/schemas'

interface ScenarioBriefingProps {
  campaign: Campaign
  /** Scenario level the party chose (difficulty applied); scenarios 1-5 use 1. */
  partyScenarioLevel: number
}

/**
 * Before a scenario: what to set out (level, traps, monster sets), what each
 * character still has to pick, and behind a reveal what the scenario unlocks,
 * closes and rewards.  No special rules: they are in the Scenario Book.
 */
export function ScenarioBriefing({ campaign, partyScenarioLevel }: ScenarioBriefingProps) {
  const playable = scenarios.filter((s) => campaign.scenarioStatus[s.id] === 'unlocked')
  const [pickedId, setPickedId] = useState<number | null>(null)
  const [revealedId, setRevealedId] = useState<number | null>(null)
  const selected = playable.find((s) => s.id === pickedId) ?? playable[0] ?? null

  if (selected === null) {
    return (
      <section aria-labelledby="briefing" className="mt-6 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
        <h2 id="briefing" className="text-sm font-semibold text-zinc-200">Next scenario</h2>
        <p className="mt-2 text-sm text-zinc-400">No unlocked scenario.</p>
      </section>
    )
  }

  const rules = scenarioRules(selected.id, true, partyScenarioLevel)
  const row = scenarioLevelRow(rules.effectiveLevel)
  const stage = learningStage(campaign.scenarioStatus)
  const spoilersShown = revealedId === selected.id

  return (
    <section aria-labelledby="briefing" className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
      <h2 id="briefing" className="text-sm font-semibold text-zinc-200">Next scenario</h2>
      <label htmlFor="briefing-scenario" className="mb-1 mt-3 block text-xs text-zinc-400">Scenario</label>
      <select
        id="briefing-scenario"
        value={selected.id}
        onChange={(e) => setPickedId(Number(e.target.value))}
        className="min-h-11 w-full rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
      >
        {playable.map((s) => (
          <option key={s.id} value={s.id}>
            {s.id} {s.name}
          </option>
        ))}
      </select>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md bg-zinc-900 p-2">
          <dt className="text-xs text-zinc-400">Location</dt>
          <dd className="text-zinc-100">{selected.location}</dd>
        </div>
        <div className="rounded-md bg-zinc-900 p-2">
          <dt className="text-xs text-zinc-400">Goal</dt>
          <dd className="text-zinc-100">{selected.goal}</dd>
        </div>
        <div className="rounded-md bg-zinc-900 p-2">
          <dt className="text-xs text-zinc-400">Scenario and monster level</dt>
          <dd className="text-zinc-100">{rules.effectiveLevel}</dd>
        </div>
        <div className="rounded-md bg-zinc-900 p-2">
          <dt className="text-xs text-zinc-400">Trap damage</dt>
          <dd className="text-zinc-100">{row.trapDamage}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-zinc-400">
        {selected.id <= 5
          ? 'Scenarios 1–5 are played at level 1 (Learn to Play p.29).'
          : 'Level from the calculator below (Learn to Play p.29).'}
        {rules.battleGoals ? ' Deal two battle goals to each character; each keeps one (Learn to Play p.25).' : ''}
      </p>

      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Hands</h3>
      <ul className="mt-1 space-y-1">
        {campaign.characters.map((c) => {
          const check = handCheck(c, stage)
          const picks = levelUpPicks(c)
          const ready = check.selected === check.size && !check.overLimit && check.notInPool.length === 0
          return (
            <li key={c.id}>
              <Link
                to={`/campaign/${campaign.id}/character/${c.id}`}
                className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-zinc-700 px-3 text-sm hover:border-amber-500/60"
              >
                <span className="text-zinc-200">{c.name}</span>
                <span className={ready && picks.pending === 0 ? 'text-emerald-400' : 'text-amber-300'}>
                  {picks.pending > 0
                    ? `${picks.pending} level-up card to choose`
                    : `hand ${check.selected} / ${check.size}`}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      {!spoilersShown ? (
        <button
          type="button"
          onClick={() => setRevealedId(selected.id)}
          className="mt-4 min-h-11 rounded-md border border-zinc-600 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:border-amber-500/50 hover:text-amber-400"
        >
          Reveal monsters and rewards
        </button>
      ) : (
        <div className="mt-4 space-y-2 text-sm">
          <SpoilerLine label="Monster sets" values={selected.monsters} source={selected.source} />
          <SpoilerLine label="Unlocks" values={selected.unlocks.map(scenarioLabel)} source={selected.unlocksSource} />
          <SpoilerLine label="Closes" values={selected.blocks.map(scenarioLabel)} source={selected.blocksSource} />
          <SpoilerLine label="Rewards" values={selected.rewards} source={selected.rewardsSource} />
          <SpoilerLine label="Treasure tiles" values={selected.treasures.map(String)} source={selected.treasuresSource} />
          <p className="text-xs text-zinc-400">Special rules and the map are in the Scenario Book.</p>
        </div>
      )}
    </section>
  )
}

function SpoilerLine({ label, values, source }: { label: string; values: string[]; source: string }) {
  return (
    <div>
      <p className="text-zinc-300">
        <span className="font-semibold text-zinc-400">{label}: </span>
        {values.length > 0 ? values.join(', ') : 'none'}
      </p>
      <p className="text-[11px] text-zinc-400">{formatSource(source)}</p>
    </div>
  )
}
