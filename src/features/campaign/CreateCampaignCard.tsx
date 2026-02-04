import { useState } from 'react'

interface CreateCampaignCardProps {
  onCreate: (name: string) => void
}

export function CreateCampaignCard({ onCreate }: CreateCampaignCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [name, setName] = useState('')

  const handleSubmit = () => {
    if (name.trim()) {
      onCreate(name)
      setName('')
      setIsExpanded(false)
    }
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex h-full min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 p-6 text-zinc-500 transition-colors hover:border-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300"
      >
        <span className="text-2xl">+</span>
        <span className="font-medium">New Campaign</span>
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6">
      <h3 className="mb-4 font-semibold text-zinc-100">Create New Campaign</h3>
      <input
        type="text"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Campaign Name..."
        className="mb-4 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-50 hover:bg-amber-500"
        >
          Create
        </button>
        <button
          onClick={() => setIsExpanded(false)}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
