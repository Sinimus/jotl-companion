import { useState, useMemo, useEffect } from 'react'
import { useCampaignStore } from '@/features/campaign'

interface Target {
  id: string
  name: string
  initiative: number
  movementToReach: number
  proximity: number
}

type TieBreaker = 'movement' | 'proximity' | 'initiative' | 'none'

export function FocusHelperPage() {
  const campaigns = useCampaignStore((s) => s.campaigns)
  const activeId = useCampaignStore((s) => s.activeCampaignId)
  const activeCampaign = useMemo(() => campaigns.find(c => c.id === activeId), [campaigns, activeId])

  const [targets, setTargets] = useState<Target[]>([
    { id: '1', name: 'Character 1', initiative: 10, movementToReach: 3, proximity: 4 },
    { id: '2', name: 'Character 2', initiative: 25, movementToReach: 3, proximity: 2 },
    { id: '3', name: 'Character 3', initiative: 40, movementToReach: 5, proximity: 6 },
  ])

  const [result, setResult] = useState<{ target: Target | null; tieBreaker: TieBreaker }>({
    target: null,
    tieBreaker: 'none',
  })

  // Sync with active campaign characters on mount
  useEffect(() => {
    if (activeCampaign && activeCampaign.characters.length > 0) {
      syncWithCampaign()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const syncWithCampaign = () => {
    if (!activeCampaign) return
    const campaignTargets: Target[] = activeCampaign.characters.map(char => ({
      id: char.id,
      name: char.name,
      initiative: 99, // Standard default for characters
      movementToReach: 0,
      proximity: 0,
    }))
    setTargets(campaignTargets)
    setResult({ target: null, tieBreaker: 'none' })
  }

  // Calculate focus using the 3-step algorithm
  const calculateFocus = () => {
    if (targets.length === 0) {
      setResult({ target: null, tieBreaker: 'none' })
      return
    }

    const remaining = [...targets]
    let tieBreaker: TieBreaker = 'none'

    // Step 1: Filter by lowest movement
    const minMovement = Math.min(...remaining.map(t => t.movementToReach))
    const afterMovement = remaining.filter(t => t.movementToReach === minMovement)

    if (afterMovement.length === 1) {
      tieBreaker = 'movement'
      setResult({ target: afterMovement[0], tieBreaker })
      return
    }

    // Step 2: Filter by lowest proximity (tie-breaker)
    const minProximity = Math.min(...afterMovement.map(t => t.proximity))
    const afterProximity = afterMovement.filter(t => t.proximity === minProximity)

    if (afterProximity.length === 1) {
      tieBreaker = 'proximity'
      setResult({ target: afterProximity[0], tieBreaker })
      return
    }

    // Step 3: Filter by lowest initiative (final tie-breaker)
    const minInitiative = Math.min(...afterProximity.map(t => t.initiative))
    const afterInitiative = afterProximity.filter(t => t.initiative === minInitiative)

    tieBreaker = 'initiative'
    setResult({ target: afterInitiative[0], tieBreaker })
  }

  const updateTarget = (id: string, field: keyof Target, value: number | string) => {
    setTargets(targets.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ))
    // Clear result when data changes
    setResult({ target: null, tieBreaker: 'none' })
  }

  const addTarget = () => {
    const newId = String(Date.now())
    setTargets([
      ...targets,
      { id: newId, name: `Target ${targets.length + 1}`, initiative: 99, movementToReach: 0, proximity: 0 },
    ])
    setResult({ target: null, tieBreaker: 'none' })
  }

  const removeTarget = (id: string) => {
    setTargets(targets.filter(t => t.id !== id))
    setResult({ target: null, tieBreaker: 'none' })
  }

  const reset = () => {
    setTargets([
      { id: '1', name: 'Character 1', initiative: 10, movementToReach: 3, proximity: 4 },
      { id: '2', name: 'Character 2', initiative: 25, movementToReach: 3, proximity: 2 },
      { id: '3', name: 'Character 3', initiative: 40, movementToReach: 5, proximity: 6 },
    ])
    setResult({ target: null, tieBreaker: 'none' })
  }

  const getTieBreakerExplanation = (tieBreaker: TieBreaker) => {
    switch (tieBreaker) {
      case 'movement':
        return 'Focus determined by least movement required'
      case 'proximity':
        return 'Focus determined by proximity (closest target)'
      case 'initiative':
        return 'Focus determined by lowest initiative'
      default:
        return ''
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-amber-500">Monster Focus Helper</h1>
        <p className="text-zinc-400">
          Determine which character a monster focuses on using the official algorithm
        </p>
      </div>

      {/* Algorithm Summary */}
      <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h3 className="mb-2 font-semibold text-zinc-100">Focus Algorithm (Appendix G)</h3>
        <ol className="list-inside list-decimal space-y-1 text-sm text-zinc-400">
          <li><strong className="text-zinc-300">Least Movement:</strong> Enemy reachable with the fewest movement points</li>
          <li><strong className="text-zinc-300">Closest Proximity:</strong> If tied, closest in straight-line hex distance</li>
          <li><strong className="text-zinc-300">Lowest Initiative:</strong> If still tied, earliest initiative in the round</li>
        </ol>
      </div>

      {/* Target Input Table */}
      <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-zinc-100">Step 1: Enter Target Data</h3>
          <div className="flex gap-2">
            {activeCampaign && (
              <button
                onClick={syncWithCampaign}
                className="rounded border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20"
              >
                Sync with Party
              </button>
            )}
            <button
              onClick={addTarget}
              className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              + Add Target
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-3 py-2 text-left font-medium text-zinc-400">Name</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-400">Initiative</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-400">Movement</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-400">Proximity</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((target) => (
                <tr key={target.id} className="border-b border-zinc-800/50">
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={target.name}
                      onChange={(e) => updateTarget(target.id, 'name', e.target.value)}
                      className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={target.initiative}
                      onChange={(e) => updateTarget(target.id, 'initiative', parseInt(e.target.value) || 0)}
                      className="w-20 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={target.movementToReach}
                      onChange={(e) => updateTarget(target.id, 'movementToReach', parseInt(e.target.value) || 0)}
                      className="w-20 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={target.proximity}
                      onChange={(e) => updateTarget(target.id, 'proximity', parseInt(e.target.value) || 0)}
                      className="w-20 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => removeTarget(target.id)}
                      className="rounded text-red-400 hover:bg-red-900/20 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={calculateFocus}
            className="rounded bg-amber-500 px-4 py-2 font-medium text-zinc-900 hover:bg-amber-600"
          >
            Calculate Focus
          </button>
          <button
            onClick={reset}
            className="rounded border border-zinc-700 px-4 py-2 font-medium text-zinc-400 hover:bg-zinc-800"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result.target ? (
        <div className="rounded-lg border-2 border-emerald-900/50 bg-emerald-950/20 p-6">
          <h2 className="mb-2 text-2xl font-bold text-emerald-400">
            ✓ Focus Found!
          </h2>
          <p className="mb-2 text-lg text-zinc-200">
            The monster focuses on: <strong className="text-amber-400">{result.target.name}</strong>
          </p>
          <p className="text-sm text-zinc-400">
            {getTieBreakerExplanation(result.tieBreaker)}
          </p>
          <div className="mt-4 rounded bg-zinc-900/50 p-3">
            <p className="text-sm text-zinc-400">
              Initiative: <span className="text-zinc-200">{result.target.initiative}</span> | 
              Movement: <span className="text-zinc-200">{result.target.movementToReach}</span> | 
              Proximity: <span className="text-zinc-200">{result.target.proximity}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500">
          Enter target data and click "Calculate Focus" to determine the monster's focus
        </div>
      )}
    </div>
  )
}
