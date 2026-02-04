import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCampaignStore, computeLevelFromXp, type UpdateCharacterInput } from './store'
import { characters, tables } from '@/data'

export function CharacterDetail() {
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>()

  const isLoaded = useCampaignStore((s) => s.isLoaded)
  const campaigns = useCampaignStore((s) => s.campaigns)
  const updateCharacter = useCampaignStore((s) => s.updateCharacter)

  const campaign = isLoaded ? campaigns.find((c) => c.id === campaignId) : undefined
  const character = campaign?.characters.find((c) => c.id === characterId)

  // ---------------------------------------------------------------------------
  // Local editable state — provides instant UI feedback; persists on blur.
  // Only re-syncs from the store when the active character identity changes
  // (i.e. the user navigates to a different character).
  // ---------------------------------------------------------------------------
  const [xp, setXp] = useState(0)
  const [gold, setGold] = useState(0)
  const [checkmarks, setCheckmarks] = useState(0)

  useEffect(() => {
    if (character) {
      setXp(character.experience)
      setGold(character.gold)
      setCheckmarks(character.checkmarks)
    }
    // Keyed on characterId only — avoids overwriting in-progress edits when
    // the store re-renders after our own blur-triggered persist.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId])

  // ---------------------------------------------------------------------------
  // Loading gate
  // ---------------------------------------------------------------------------
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-zinc-500">Loading…</p>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Not found
  // ---------------------------------------------------------------------------
  if (!campaign || !character) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900">
        <p className="mb-4 text-zinc-400">Character not found.</p>
        <Link
          to={campaignId ? `/campaign/${campaignId}` : '/'}
          className="text-sm text-amber-400 hover:text-amber-300"
        >
          ← Back
        </Link>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Derived display values — computed from LOCAL state for instant feedback
  // ---------------------------------------------------------------------------
  const charDef = characters.find((c) => c.id === character.type)
  const computedLevel = computeLevelFromXp(xp)
  const maxHp = (charDef?.hitPoints as Record<string, number>)?.[String(computedLevel)] ?? 0

  const levelThresholds = tables.levelThresholds as Record<string, number>
  const currentThreshold = levelThresholds[String(computedLevel)]
  const nextThreshold = computedLevel < 9 ? levelThresholds[String(computedLevel + 1)] : null
  const xpProgress = nextThreshold
    ? ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 100

  const perksFromCheckmarks = Math.floor(checkmarks / 3)

  // ---------------------------------------------------------------------------
  // Persist to store — reads value from the blur event target to avoid stale
  // closure over local state.
  // ---------------------------------------------------------------------------
  const commit = (updates: UpdateCharacterInput) => {
    void updateCharacter(campaignId!, characterId!, updates)
  }

  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Back link */}
        <Link
          to={`/campaign/${campaignId}`}
          className="text-sm text-zinc-500 hover:text-amber-400 transition-colors"
        >
          ← Back to {campaign.name}
        </Link>

        {/* Header */}
        <div className="mt-4">
          <span className="text-xs font-medium text-amber-400">
            {charDef?.name ?? character.type}
            {charDef ? ` (${charDef.race})` : ''}
          </span>
          <h1 className="text-2xl font-bold text-zinc-100">{character.name}</h1>
        </div>

        {/* Level + HP + XP progress bar */}
        <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-semibold text-amber-400">Level {computedLevel}</span>
            <span className="text-sm text-zinc-400">HP {maxHp}</span>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-zinc-500">
              <span>XP</span>
              <span>
                {nextThreshold
                  ? `${xp} / ${nextThreshold} to Lv${computedLevel + 1}`
                  : `${xp} (MAX)`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-700">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${Math.min(xpProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Editable stats grid */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {/* XP */}
          <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3">
            <label className="mb-1 block text-xs text-zinc-500">XP</label>
            <input
              type="number"
              min={0}
              value={xp}
              onChange={(e) => setXp(Math.max(0, parseInt(e.target.value, 10) || 0))}
              onBlur={(e) => commit({ experience: Math.max(0, parseInt(e.target.value, 10) || 0) })}
              className="w-full bg-transparent text-sm text-zinc-100 focus:outline-none"
            />
          </div>

          {/* Gold */}
          <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3">
            <label className="mb-1 block text-xs text-zinc-500">Gold</label>
            <input
              type="number"
              min={0}
              value={gold}
              onChange={(e) => setGold(Math.max(0, parseInt(e.target.value, 10) || 0))}
              onBlur={(e) => commit({ gold: Math.max(0, parseInt(e.target.value, 10) || 0) })}
              className="w-full bg-transparent text-sm text-zinc-100 focus:outline-none"
            />
          </div>

          {/* Checkmarks */}
          <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3">
            <label className="mb-1 block text-xs text-zinc-500">Checks</label>
            <input
              type="number"
              min={0}
              max={18}
              value={checkmarks}
              onChange={(e) => setCheckmarks(Math.min(18, Math.max(0, parseInt(e.target.value, 10) || 0)))}
              onBlur={(e) => commit({ checkmarks: Math.min(18, Math.max(0, parseInt(e.target.value, 10) || 0)) })}
              className="w-full bg-transparent text-sm text-zinc-100 focus:outline-none"
            />
          </div>
        </div>

        {/* Checkmarks summary */}
        <p className="mt-2 text-xs text-zinc-500">
          {checkmarks} / 18 checkmarks &bull; {perksFromCheckmarks} perk{perksFromCheckmarks !== 1 ? 's' : ''} earned
        </p>

        {/* Perks + Items placeholders */}
        <div className="mt-6 space-y-3">
          <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
            <h3 className="text-sm font-semibold text-zinc-300">Perks</h3>
            <p className="mt-1 text-sm text-zinc-500">
              {character.perkIds.length > 0
                ? `${character.perkIds.length} selected`
                : 'Perk selection coming soon'}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
            <h3 className="text-sm font-semibold text-zinc-300">Items</h3>
            <p className="mt-1 text-sm text-zinc-500">
              {character.itemIds.length > 0
                ? `${character.itemIds.length} owned`
                : 'Item management coming soon'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
