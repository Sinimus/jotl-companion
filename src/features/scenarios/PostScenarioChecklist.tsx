import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { items, scenarios, tables } from '@/data'
import { cn } from '@/shared/lib/utils'
import { formatSource } from '@/shared/lib/source'
import { useLoadedCampaign } from '@/shared/hooks/useLoadedCampaign'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useCampaignStore } from '@/features/campaign/store'
import { closingConfirmText, computeLevelFromXp, computeScenarioLevel, scenariosClosedByCompleting } from '@/features/campaign/rules'
import {
  computeScenarioResult,
  followUpSteps,
  rewardItemCandidates,
  type CharacterResultInput,
  type ScenarioResult,
} from '@/features/campaign/progression'
import type { Campaign } from '@/shared/schemas'
import { PartyCards } from './PartyCards'

/** Finish Scenario: record a result on the campaign sheet step by step (LtP pp.13-29). */
export function PostScenarioChecklist() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const { isLoaded, campaign } = useLoadedCampaign(campaignId)
  useDocumentTitle('Finish Scenario', campaign?.name)

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-zinc-500">Loading…</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900">
        <p className="mb-4 text-zinc-400">Campaign not found.</p>
        <Link to="/" className="text-sm text-amber-400 hover:text-amber-300">
          ← Back to campaigns
        </Link>
      </div>
    )
  }

  return <FinishScenario campaign={campaign} />
}

type Entry = Omit<CharacterResultInput, 'characterId'>

const EMPTY_ENTRY: Entry = { played: true, moneyTokens: 0, actionXp: 0, battleGoalMet: false }

interface Recorded {
  result: ScenarioResult
  checkmarksBefore: Record<string, number>
}

const inputClass =
  'min-h-11 w-20 rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none'
const sectionClass = 'mt-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4'
const headingClass = 'mb-3 text-sm font-semibold text-zinc-200'

function toCount(value: string): number {
  return Math.max(0, Number.parseInt(value, 10) || 0)
}

export function FinishScenario({ campaign }: { campaign: Campaign }) {
  const recordScenarioResult = useCampaignStore((s) => s.recordScenarioResult)

  const [pickedScenarioId, setPickedScenarioId] = useState<number | null>(null)
  const [success, setSuccess] = useState(true)
  const [levelOverride, setLevelOverride] = useState<number | null>(null)
  const [entries, setEntries] = useState<Record<string, Entry>>({})
  const [itemRecipients, setItemRecipients] = useState<Record<number, string | null>>({})
  const [confirming, setConfirming] = useState(false)
  const [recorded, setRecorded] = useState<Recorded | null>(null)
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set())

  if (recorded) {
    return (
      <Page campaignId={campaign.id}>
        <FollowUp
          campaign={campaign}
          recorded={recorded}
          doneSteps={doneSteps}
          onToggle={(index) =>
            setDoneSteps((prev) => {
              const next = new Set(prev)
              if (next.has(index)) next.delete(index)
              else next.add(index)
              return next
            })
          }
          onAnother={() => {
            setRecorded(null)
            setPickedScenarioId(null)
            setEntries({})
            setItemRecipients({})
            setDoneSteps(new Set())
          }}
        />
      </Page>
    )
  }

  // A completed scenario cannot be replayed (LtP p.13): only unlocked ones.
  const playable = scenarios.filter((s) => campaign.scenarioStatus[s.id] === 'unlocked')
  const selected = playable.find((s) => s.id === pickedScenarioId) ?? playable[0] ?? null

  if (selected === null) {
    return (
      <Page campaignId={campaign.id}>
        <p className="mt-6 text-sm text-zinc-400">No unlocked scenario to finish. Open one in the scenario list first.</p>
        <RecordedLog campaign={campaign} />
      </Page>
    )
  }

  // Scenarios 1-5 are played at level 1 (LtP p.29); from 6 on the party at
  // normal difficulty gives the default, editable 0-7.
  const partyLevels = campaign.characters.map((c) => computeLevelFromXp(c.experience))
  const scenarioLevel = selected.id > 5 ? (levelOverride ?? computeScenarioLevel(partyLevels, 'normal')) : 1

  const entryOf = (characterId: string): Entry => entries[characterId] ?? EMPTY_ENTRY
  const setEntry = (characterId: string, patch: Partial<Entry>) =>
    setEntries((prev) => ({ ...prev, [characterId]: { ...(prev[characterId] ?? EMPTY_ENTRY), ...patch } }))

  const result = computeScenarioResult(campaign, {
    scenarioId: selected.id,
    success,
    scenarioLevel,
    characters: campaign.characters.map((c) => ({ characterId: c.id, ...entryOf(c.id) })),
    itemRecipients,
  })
  const { rules } = result
  const confirmText = success ? closingConfirmText(scenariosClosedByCompleting(selected.id, campaign.scenarioStatus)) : null

  const record = async () => {
    const checkmarksBefore = Object.fromEntries(campaign.characters.map((c) => [c.id, c.checkmarks]))
    try {
      const saved = await recordScenarioResult(campaign.id, {
        scenarioId: selected.id,
        success,
        scenarioLevel,
        characters: campaign.characters.map((c) => ({ characterId: c.id, ...entryOf(c.id) })),
        itemRecipients,
      })
      setRecorded({ result: saved, checkmarksBefore })
      toast.success(success ? `Scenario ${selected.id} recorded as completed` : `Attempt at scenario ${selected.id} recorded`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to record the result')
    }
  }

  const resetFor = () => {
    setLevelOverride(null)
    setItemRecipients({})
    setConfirming(false)
  }

  return (
    <Page campaignId={campaign.id}>
      {/* Step 1 */}
      <section aria-labelledby="step-1" className={sectionClass}>
        <h2 id="step-1" className={headingClass}>1. Scenario and outcome</h2>
        <label htmlFor="finish-scenario" className="mb-1 block text-xs text-zinc-400">Scenario</label>
        <select
          id="finish-scenario"
          value={selected.id}
          onChange={(e) => {
            setPickedScenarioId(Number(e.target.value))
            resetFor()
          }}
          className="min-h-11 w-full rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
        >
          {playable.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id} {s.name}
            </option>
          ))}
        </select>

        <p id="finish-outcome" className="mb-1 mt-4 text-xs text-zinc-400">Outcome</p>
        <div role="group" aria-labelledby="finish-outcome" className="flex gap-2">
          {[true, false].map((won) => (
            <button
              key={String(won)}
              type="button"
              aria-pressed={success === won}
              onClick={() => {
                setSuccess(won)
                setConfirming(false)
              }}
              className={cn(
                'min-h-11 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                success === won
                  ? won
                    ? 'bg-emerald-700 text-white'
                    : 'bg-red-700 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              )}
            >
              {won ? 'Won' : 'Lost'}
            </button>
          ))}
        </div>

        <label htmlFor="finish-level" className="mb-1 mt-4 block text-xs text-zinc-400">Scenario level</label>
        <select
          id="finish-level"
          value={scenarioLevel}
          onChange={(e) => setLevelOverride(Number(e.target.value))}
          disabled={selected.id <= 5}
          className="min-h-11 w-full rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none disabled:cursor-not-allowed"
        >
          {tables.scenarioLevelTable.map((row) => (
            <option key={row.level} value={row.level}>
              Level {row.level}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-zinc-400">
          {selected.id <= 5
            ? 'Scenarios 1–5 are played at level 1 (Learn to Play p.29).'
            : 'Default: party average level ÷ 2, rounded up (Learn to Play p.29).'}{' '}
          {rules.goldPerToken > 0 ? `${rules.goldPerToken} gold per money token` : 'Money tokens pay no gold here'}
          {rules.bonusXp > 0 ? `, ${rules.bonusXp} bonus experience.` : ', no bonus experience.'}
        </p>
        <p className="mt-2 text-xs text-zinc-400">
          {success
            ? 'Play to the end of the round, then read the conclusion and rewards in the Scenario Book (Learn to Play p.18).'
            : 'A lost scenario keeps its money tokens and experience; no rewards, no bonus, no checkmark (Learn to Play p.16, p.25).'}
        </p>
      </section>

      {/* Step 2 */}
      <section aria-labelledby="step-2" className={sectionClass}>
        <h2 id="step-2" className={headingClass}>2. What each character collected</h2>
        {campaign.characters.length === 0 && <p className="text-sm text-zinc-400">No characters in the party yet.</p>}
        <div className="space-y-4">
          {campaign.characters.map((c) => {
            const entry = entryOf(c.id)
            const gain = result.characters.find((g) => g.characterId === c.id)
            return (
              <fieldset key={c.id} className="rounded-md border border-zinc-700 p-3">
                <legend className="px-1 text-sm font-medium text-zinc-200">{c.name}</legend>
                <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={entry.played}
                    onChange={(e) => setEntry(c.id, { played: e.target.checked })}
                    className="h-5 w-5"
                  />
                  Played this scenario
                </label>
                {entry.played && (
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-3">
                    {rules.goldPerToken > 0 && (
                      <div>
                        <label htmlFor={`tokens-${c.id}`} className="mb-1 block text-xs text-zinc-400">Money tokens</label>
                        <input
                          id={`tokens-${c.id}`}
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={entry.moneyTokens}
                          onChange={(e) => setEntry(c.id, { moneyTokens: toCount(e.target.value) })}
                          className={inputClass}
                        />
                      </div>
                    )}
                    {rules.actionXp && (
                      <div>
                        <label htmlFor={`xp-${c.id}`} className="mb-1 block text-xs text-zinc-400">Experience from the dial</label>
                        <input
                          id={`xp-${c.id}`}
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={entry.actionXp}
                          onChange={(e) => setEntry(c.id, { actionXp: toCount(e.target.value) })}
                          className={inputClass}
                        />
                      </div>
                    )}
                    {rules.battleGoals && success && (
                      <label className="flex min-h-11 items-center gap-2 self-end text-sm text-zinc-300">
                        <input
                          type="checkbox"
                          checked={entry.battleGoalMet}
                          onChange={(e) => setEntry(c.id, { battleGoalMet: e.target.checked })}
                          className="h-5 w-5"
                        />
                        Battle goal met
                      </label>
                    )}
                  </div>
                )}
                {gain && (
                  <p className="mt-2 text-xs text-zinc-300">
                    {gainSummary(gain)}
                  </p>
                )}
              </fieldset>
            )
          })}
        </div>
      </section>

      {/* Step 3 */}
      {success && (
        <section aria-labelledby="step-3" className={sectionClass}>
          <h2 id="step-3" className={headingClass}>3. Scenario rewards</h2>
          {selected.rewards.length === 0 ? (
            <p className="text-sm text-zinc-400">No listed rewards.</p>
          ) : (
            <ul className="space-y-1 text-sm text-zinc-300">
              {selected.rewards.map((reward) => (
                <li key={reward}>{reward}</li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-[11px] text-zinc-400">{formatSource(selected.rewardsSource)}; “each” goes to every character who played (Rules Glossary p.18).</p>

          {selected.reward.items.map((itemId) => {
            const item = items.find((i) => i.id === itemId)
            const candidates = rewardItemCandidates(campaign, itemId)
            return (
              <div key={itemId} className="mt-3">
                <label htmlFor={`item-${itemId}`} className="mb-1 block text-xs text-zinc-400">
                  {item?.name ?? `Item ${itemId}`} goes to one character
                </label>
                {candidates.length === 0 ? (
                  <p className="text-sm text-zinc-400">No copy left for the party.</p>
                ) : (
                  <select
                    id={`item-${itemId}`}
                    value={itemRecipients[itemId] ?? ''}
                    onChange={(e) => setItemRecipients((prev) => ({ ...prev, [itemId]: e.target.value || null }))}
                    className="min-h-11 w-full rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Choose later</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )
          })}

          {(result.unlocks.length > 0 || result.closes.length > 0) && (
            <p className="mt-3 text-sm text-zinc-300">
              {result.unlocks.length > 0 && `Unlocks scenario ${result.unlocks.join(', ')}. `}
              {result.closes.length > 0 && `Closes scenario ${result.closes.join(', ')}.`}
            </p>
          )}
          {rules.cityEvent && <p className="mt-2 text-sm text-zinc-300">A city event follows (Learn to Play p.24).</p>}
        </section>
      )}

      {/* Step 4 */}
      <section aria-labelledby="step-4" className={sectionClass}>
        <h2 id="step-4" className={headingClass}>{success ? '4' : '3'}. Record in the campaign</h2>
        <p className="text-sm text-zinc-300">
          {success
            ? `Adds the gold, experience, checkmarks, perks and items above and marks scenario ${selected.id} completed.`
            : 'Adds the gold and experience above; the scenario stays open for another attempt.'}
        </p>
        {result.unassignedItems.length > 0 && success && (
          <p className="mt-2 text-xs text-amber-300">
            A reward item has no character yet; you can give it later from the character's items.
          </p>
        )}
        {result.errors.map((error) => (
          <p key={error} className="mt-2 text-sm text-red-400">
            {error}
          </p>
        ))}
        {confirming && confirmText ? (
          <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
            <p className="text-sm text-amber-300">{confirmText}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirming(false)
                  void record()
                }}
                className="min-h-11 rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="min-h-11 rounded-md bg-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={result.errors.length > 0 || campaign.characters.length === 0}
            onClick={() => (confirmText ? setConfirming(true) : void record())}
            className="mt-3 min-h-11 w-full rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
          >
            {success ? 'Record and complete scenario' : 'Record the attempt'}
          </button>
        )}
      </section>

      <RecordedLog campaign={campaign} />
    </Page>
  )
}

/** "+8 gold (4 tokens × 2), +6 XP …" for one character. */
function gainSummary(gain: ScenarioResult['characters'][number]): string {
  if (!gain.played) return 'Sat this scenario out: gains nothing.'
  const parts = [`+${gain.gold} gold`, `+${gain.experience} XP`]
  if (gain.checkmarks > 0) parts.push(`+${gain.checkmarks} checkmark`)
  if (gain.perks > 0) parts.push(`+${gain.perks} perk`)
  const level = gain.levelAfter > gain.levelBefore ? ` → level ${gain.levelAfter}` : ''
  return `${parts.join(', ')}${level}`
}

function Page({ campaignId, children }: { campaignId: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <Link
          to={`/campaign/${campaignId}`}
          className="inline-flex min-h-11 items-center text-sm text-zinc-400 transition-colors hover:text-amber-400"
        >
          ← Back to campaign
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-amber-500">Finish Scenario</h1>
        {children}
      </div>
    </div>
  )
}

interface FollowUpProps {
  campaign: Campaign
  recorded: Recorded
  doneSteps: Set<number>
  onToggle: (index: number) => void
  onAnother: () => void
}

/** After recording: the gains and what the players still do by hand. */
function FollowUp({ campaign, recorded, doneSteps, onToggle, onAnother }: FollowUpProps) {
  const { result } = recorded
  const steps = followUpSteps(result, recorded.checkmarksBefore)
  return (
    <>
      <section aria-labelledby="recorded" className={sectionClass}>
        <h2 id="recorded" className={headingClass}>
          Recorded: scenario {result.scenarioId} {result.success ? 'completed' : 'lost'}
        </h2>
        <ul className="space-y-1 text-sm text-zinc-300">
          {result.characters.map((gain) => (
            <li key={gain.characterId}>
              <span className="font-medium text-zinc-100">{gain.name}</span>: {gainSummary(gain)}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="next-steps" className={sectionClass}>
        <h2 id="next-steps" className={headingClass}>Now, at the table</h2>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <label
              key={step.text}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3',
                doneSteps.has(index) ? 'border-amber-500/50 bg-amber-500/10' : 'border-zinc-700'
              )}
            >
              <input type="checkbox" checked={doneSteps.has(index)} onChange={() => onToggle(index)} className="mt-0.5 h-5 w-5 shrink-0" />
              <span className="text-sm leading-snug text-zinc-200">
                {step.text}
                <span className="mt-0.5 block text-[11px] text-zinc-400">{formatSource(step.source)}</span>
              </span>
            </label>
          ))}
        </div>
        {result.success && result.scenarioId <= 4 && <PartyCards id={result.scenarioId} party={campaign.characters} />}
        <div className="mt-4 flex flex-col gap-2">
          {result.characters
            .filter((gain) => gain.levelAfter > gain.levelBefore || gain.perks > 0)
            .map((gain) => (
              <Link
                key={gain.characterId}
                to={`/campaign/${campaign.id}/character/${gain.characterId}`}
                className="flex min-h-11 items-center rounded-md border border-zinc-600 px-3 text-sm text-amber-400 hover:border-amber-500/60"
              >
                {gain.name}: choose the new card and perk →
              </Link>
            ))}
        </div>
      </section>

      <button
        type="button"
        onClick={onAnother}
        className="mt-4 min-h-11 w-full rounded-md bg-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-600"
      >
        Finish another scenario
      </button>
    </>
  )
}

/** The last recorded results, newest first. */
function RecordedLog({ campaign }: { campaign: Campaign }) {
  if (campaign.scenarioLog.length === 0) return null
  const latest = [...campaign.scenarioLog].reverse().slice(0, 5)
  return (
    <section aria-labelledby="log" className={sectionClass}>
      <h2 id="log" className={headingClass}>Recently recorded</h2>
      <ul className="space-y-1 text-sm text-zinc-300">
        {latest.map((entry) => (
          <li key={entry.id}>
            Scenario {entry.scenarioId} {entry.success ? 'won' : 'lost'}, level {entry.scenarioLevel},{' '}
            {entry.recordedAt.toLocaleDateString()}
          </li>
        ))}
      </ul>
    </section>
  )
}
