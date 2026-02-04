import { useState, useMemo } from 'react'
import { items, type ItemSlot } from '@/data'
import { type ScenarioStatus } from '@/shared/schemas'

interface ItemShopProps {
  ownedItemIds: number[]
  scenarioStatus: Record<number, ScenarioStatus>
  onEquip: (itemId: number) => void
  onClose: () => void
}

export function ItemShop({ ownedItemIds, scenarioStatus, onEquip, onClose }: ItemShopProps) {
  const [selectedSlot, setSelectedSlot] = useState<ItemSlot | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showHidden, setShowHidden] = useState(false)

  const filteredItems = useMemo(() => {
    const isScenarioCompleted = (id: number) => scenarioStatus[id] === 'completed'

    return items.filter((item) => {
      // 1. Progress check
      let isUnlocked = false
      if (item.unlockedBy === 'start') isUnlocked = true
      else if (item.unlockedBy === 'scenario_2' && isScenarioCompleted(2)) isUnlocked = true
      else if (item.unlockedBy === 'scenario_9' && isScenarioCompleted(9)) isUnlocked = true
      else if (item.unlockedBy === 'scenario_15' && isScenarioCompleted(15)) isUnlocked = true
      else if (item.unlockedBy === 'solo') isUnlocked = false // Manual reveal only

      if (!isUnlocked && !showHidden && !ownedItemIds.includes(item.id)) return false

      // 2. Slot filter
      const matchesSlot = selectedSlot === 'all' || item.slot === selectedSlot
      
      // 3. Search filter
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesSlot && matchesSearch
    })
  }, [selectedSlot, searchQuery, scenarioStatus, showHidden, ownedItemIds])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[800px] w-full max-w-2xl flex-col rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 p-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Item Shop</h2>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              {showHidden ? 'Showing All Items' : 'Filtered by Progress'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowHidden(!showHidden)}
              className={`text-xs font-medium transition-colors ${showHidden ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {showHidden ? 'Hide Locked' : 'Reveal All'}
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100">
              ✕
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-zinc-700 bg-zinc-800/50 p-4">
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'head', 'body', 'feet', 'hand', 'small'] as const).map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  selectedSlot === slot
                    ? 'bg-amber-600 text-white'
                    : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredItems.map((item) => {
              const isOwned = ownedItemIds.includes(item.id)
              const isScenarioCompleted = (id: number) => scenarioStatus[id] === 'completed'
              
              let isLocked = false
              if (item.unlockedBy === 'scenario_2' && !isScenarioCompleted(2)) isLocked = true
              else if (item.unlockedBy === 'scenario_9' && !isScenarioCompleted(9)) isLocked = true
              else if (item.unlockedBy === 'scenario_15' && !isScenarioCompleted(15)) isLocked = true
              else if (item.unlockedBy === 'solo') isLocked = true

              if (isOwned) isLocked = false

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-lg border p-3 transition-colors ${
                    isOwned
                      ? 'border-emerald-900/50 bg-emerald-950/10'
                      : isLocked
                        ? 'border-zinc-800 bg-zinc-900/30 opacity-60'
                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                  }`}
                >
                  <div>
                    <div className="mb-1 flex items-start justify-between">
                      <div className="min-w-0">
                        <span className={`font-semibold block truncate ${isLocked ? 'text-zinc-500' : 'text-zinc-200'}`}>
                          #{item.id} {item.name}
                        </span>
                        <span className="text-[10px] uppercase text-zinc-500">{item.slot}</span>
                      </div>
                      {isLocked && (
                        <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[8px] font-bold uppercase text-zinc-600">
                          Locked
                        </span>
                      )}
                    </div>
                    <p className={`mb-3 text-xs ${isLocked ? 'text-zinc-600 italic' : 'text-zinc-400'}`}>
                      {isLocked ? 'Complete more scenarios to unlock this item.' : item.effect}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-zinc-700/50 pt-2">
                    <span className={`text-xs font-medium ${isLocked ? 'text-zinc-600' : 'text-amber-500'}`}>
                      {item.cost} Gold
                    </span>
                    {isOwned ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                        ✓ Owned
                      </span>
                    ) : (
                      <button
                        disabled={isLocked && !showHidden}
                        onClick={() => onEquip(item.id)}
                        className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                          isLocked && !showHidden
                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            : 'bg-zinc-700 text-zinc-200 hover:bg-amber-600 hover:text-white'
                        }`}
                      >
                        Buy
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {filteredItems.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-zinc-500">No items found matching your filters.</p>
              {!showHidden && (
                <button 
                  onClick={() => setShowHidden(true)}
                  className="mt-2 text-xs text-amber-500 hover:underline"
                >
                  Reveal all hidden items?
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
