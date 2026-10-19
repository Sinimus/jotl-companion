import { useParams, Link } from 'react-router-dom'
import { characters, scenarios } from '@/data'
import { cn } from '@/shared/lib/utils'
import { formatSource } from '@/shared/lib/source'
import { useLoadedCampaign } from '@/shared/hooks/useLoadedCampaign'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { cardChangesAfter, LEARNING_SCENARIOS, type GuideLine } from '@/features/campaign/learning'
import { learningHandSize, learningStage } from '@/features/campaign/progression'
import type { Campaign, CharacterProgress, ScenarioStatus } from '@/shared/schemas'

type StepState = 'done' | 'next' | 'later'

function stepState(id: number, stage: number): StepState {
  if (id <= stage) return 'done'
  return id === stage + 1 ? 'next' : 'later'
}

const STATE_LABEL: Record<StepState, string> = { done: 'Completed', next: 'Up next', later: 'Later' }

/** One page for the learning scenarios 1-5: new rules before, changes after (LtP p.3-29). */
export function LearningGuidePage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const { isLoaded, campaign } = useLoadedCampaign(campaignId)
  useDocumentTitle('Learning Scenarios', campaign?.name)

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

  return <LearningGuide campaign={campaign} />
}

/** The guide for a loaded campaign. */
export function LearningGuide({ campaign }: { campaign: Campaign }) {
  const stage = learningStage(campaign.scenarioStatus)
  const nextHand = learningHandSize(stage)

  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <Link
          to={`/campaign/${campaign.id}`}
          className="inline-flex min-h-11 items-center text-sm text-zinc-400 transition-colors hover:text-amber-400"
        >
          ← Back to campaign
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-amber-500">Learning Scenarios 1–5</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          The Learn to Play Guide teaches the game over the first five scenarios. What each one adds, and
          what changes for your party once it is done.
        </p>
        <p className="mt-3 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300">
          {stage >= 5
            ? 'Your party has finished the learning scenarios.'
            : `Your party has completed ${stage} of 5. Hand for the next scenario: ${nextHand === null ? 'the hand limit of each character' : `${nextHand} cards`}.`}
        </p>

        <ol className="mt-6 space-y-4">
          {LEARNING_SCENARIOS.map((step) => (
            <LearningStep
              key={step.id}
              id={step.id}
              state={stepState(step.id, stage)}
              status={campaign.scenarioStatus[step.id] ?? 'locked'}
              rulesPages={step.rulesPages}
              introduces={step.introduces}
              afterwards={step.afterwards}
              party={campaign.characters}
            />
          ))}
        </ol>

        <p className="mt-6 text-xs text-zinc-500">
          Paraphrased from the Learn to Play Guide; card names: GHS (community data).
        </p>
      </div>
    </div>
  )
}

interface LearningStepProps {
  id: number
  state: StepState
  status: ScenarioStatus
  rulesPages: string
  introduces: GuideLine[]
  afterwards: GuideLine[]
  party: CharacterProgress[]
}

function LearningStep({ id, state, status, rulesPages, introduces, afterwards, party }: LearningStepProps) {
  // A locked scenario keeps its name to itself (r193); the guide's rules are no spoiler.
  const name = status === 'locked' ? null : (scenarios.find((s) => s.id === id)?.name ?? null)
  const headingId = `learning-${id}`

  return (
    <li
      aria-labelledby={headingId}
      className={cn(
        'rounded-lg border p-4',
        state === 'next' && 'border-amber-500/50 bg-amber-500/5',
        state === 'done' && 'border-emerald-900/60 bg-emerald-950/20',
        state === 'later' && 'border-zinc-700 bg-zinc-800'
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={headingId} className="text-base font-semibold text-zinc-100">
          Scenario {id}
          {name && <span className="font-normal text-zinc-300"> · {name}</span>}
        </h2>
        <span
          className={cn(
            'shrink-0 text-xs font-semibold uppercase tracking-wider',
            state === 'next' && 'text-amber-400',
            state === 'done' && 'text-emerald-400',
            state === 'later' && 'text-zinc-400'
          )}
        >
          {STATE_LABEL[state]}
        </span>
      </div>

      <p className="mt-1 text-xs text-zinc-400">Read first: {formatSource(rulesPages)}</p>

      <h3 className="mt-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">New rules</h3>
      <GuideList lines={introduces} />

      <h3 className="mt-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">After completing it</h3>
      <GuideList lines={afterwards} />

      <PartyCards id={id} party={party} />
    </li>
  )
}

function GuideList({ lines }: { lines: GuideLine[] }) {
  return (
    <ul className="mt-1 space-y-1.5">
      {lines.map((line) => (
        <li key={line.text} className="text-sm leading-snug text-zinc-300">
          {line.text}
          <span className="ml-1.5 text-[11px] text-zinc-400">({formatSource(line.source)})</span>
        </li>
      ))}
    </ul>
  )
}

/** The card changes after this scenario, named for each character of the party. */
function PartyCards({ id, party }: { id: number; party: CharacterProgress[] }) {
  const rows = party
    .map((character) => ({ character, change: cardChangesAfter(id, character.type) }))
    .filter(({ change }) => change.added.length > 0 || change.removed.length > 0)
  if (rows.length === 0) return null

  return (
    <div className="mt-3 space-y-2 rounded-md border border-zinc-700/60 bg-zinc-900/60 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Your party's cards</h3>
      {rows.map(({ character, change }) => (
        <div key={character.id} className="text-sm leading-snug">
          <p className="font-medium text-zinc-200">
            {character.name}
            <span className="font-normal text-zinc-400">
              {' '}
              · {characters.find((c) => c.id === character.type)?.name}
            </span>
          </p>
          {change.added.length > 0 && (
            <p className="text-zinc-300">
              <span className="text-emerald-400">Add:</span> {change.added.map((card) => `${card.name} (${card.level})`).join(', ')}
            </p>
          )}
          {change.removed.length > 0 && (
            <p className="text-zinc-300">
              <span className="text-red-400">Set aside:</span>{' '}
              {change.removed.map((card) => `${card.name} (${card.level})`).join(', ')}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
