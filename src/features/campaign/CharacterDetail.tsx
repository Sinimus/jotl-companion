import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCampaignStore, computeLevelFromXp, type UpdateCharacterInput } from './store'
import { characters, tables } from '@/data'
import { PerkList } from './PerkList'
import { ItemManager } from '@/features/characters'

export function CharacterDetail() {
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>()

  const isLoaded = useCampaignStore((s) => s.isLoaded)
  const campaigns = useCampaignStore((s) => s.campaigns)
  const updateCharacter = useCampaignStore((s) => s.updateCharacter)

  const campaign = isLoaded ? campaigns.find((c) => c.id === campaignId) : undefined
  const character = campaign?.characters.find((c) => c.id === characterId)

  // Local state for stats editing
  const [xp, setXp] = useState(0)
  const [gold, setGold] = useState(0)
  const [checkmarks, setCheckmarks] = useState(0)
  const [activeTab, setActiveTab] = useState<'stats' | 'perks' | 'items'>('stats')

  useEffect(() => {
    if (character) {
      setXp(character.experience)
      setGold(character.gold)
      setCheckmarks(character.checkmarks)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-zinc-500">Loading…</p>
      </div>
    )
  }

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

  const commit = (updates: UpdateCharacterInput) => {
    void updateCharacter(campaignId!, characterId!, updates)
  }

  const handleUpdateItems = (itemIds: number[]) => {
    updateCharacter(campaignId!, characterId!, { itemIds })
  }

  const handleTogglePerk = (perkId: string, isSelected: boolean) => {
    const currentIds = new Set(character.perkIds)
    if (isSelected) {
      currentIds.add(perkId)
    } else {
      currentIds.delete(perkId)
    }
    updateCharacter(campaignId!, characterId!, {
      perkIds: Array.from(currentIds),
    })
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="px-4 py-3">
          <Link
            to={`/campaign/${campaignId}`}
            className="mb-2 block text-xs font-medium text-zinc-500 hover:text-zinc-300"
          >
            ← {campaign.name}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-zinc-100">{character.name}</h1>
              <span className="text-xs text-amber-500">
                Level {computedLevel} {charDef?.name}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-2xl font-bold text-red-500">{maxHp}</span>
              <span className="text-[10px] uppercase text-zinc-500">Max HP</span>
            </div>
          </div>
          
          {/* XP Bar */}
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[10px] uppercase text-zinc-500">
              <span>{xp} XP</span>
              <span>{nextThreshold ? `Next: ${nextThreshold}` : 'Max'}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-amber-600 transition-all duration-500"
                style={{ width: `${Math.min(xpProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-zinc-800">
          {(['stats', 'perks', 'items'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-amber-500 text-amber-500'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">Current XP</label>
                <input
                  type="number"
                  min={0}
                  value={xp}
                  onChange={(e) => setXp(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  onBlur={(e) => commit({ experience: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                  className="w-full bg-transparent text-3xl font-bold text-zinc-100 focus:outline-none"
                />
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">Gold</label>
                <input
                  type="number"
                  min={0}
                  value={gold}
                  onChange={(e) => setGold(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  onBlur={(e) => commit({ gold: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                  className="w-full bg-transparent text-3xl font-bold text-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Battle Goals */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-4 flex items-center justify-between">
                <label className="text-xs font-medium uppercase text-zinc-500">Battle Goal Checkmarks</label>
                <span className="text-xs text-amber-500">
                  {perksFromCheckmarks} Perk{perksFromCheckmarks !== 1 ? 's' : ''} Earned
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    const newValue = Math.max(0, checkmarks - 1)
                    setCheckmarks(newValue)
                    commit({ checkmarks: newValue })
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-xl text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                >
                  -
                </button>
                <span className="flex-1 text-center text-3xl font-bold text-zinc-100">{checkmarks}</span>
                <button
                  onClick={() => {
                    const newValue = Math.min(18, checkmarks + 1)
                    setCheckmarks(newValue)
                    commit({ checkmarks: newValue })
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-xl text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-zinc-600">Max 18 checkmarks</p>
            </div>
          </div>
        )}

        {activeTab === 'perks' && (
          <PerkList character={character} onToggle={handleTogglePerk} />
        )}

        {activeTab === 'items' && (
          <ItemManager character={character} onUpdateItems={handleUpdateItems} />
        )}
      </div>
    </div>
  )
}