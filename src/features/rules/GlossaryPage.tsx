import { useState, useMemo } from 'react'
import { rules } from '@/data'

export function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    rules.glossary.forEach((entry) => {
      if (entry.category) cats.add(entry.category)
    })
    return Array.from(cats).sort()
  }, [])

  // Extract available letters
  const availableLetters = useMemo(() => {
    const letters = new Set<string>()
    rules.glossary.forEach((entry) => {
      letters.add(entry.term[0].toUpperCase())
    })
    return Array.from(letters).sort()
  }, [])

  // Filter glossary
  const filteredGlossary = useMemo(() => {
    return rules.glossary
      .filter((entry) => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            entry.term.toLowerCase().includes(query) ||
            entry.description.toLowerCase().includes(query)
          )
        }
        return true
      })
      .filter((entry) => {
        // Letter filter
        if (selectedLetter) {
          return entry.term[0].toUpperCase() === selectedLetter
        }
        return true
      })
      .filter((entry) => {
        // Category filter
        if (selectedCategory) {
          return entry.category === selectedCategory
        }
        return true
      })
      .sort((a, b) => a.term.localeCompare(b.term))
  }, [searchQuery, selectedLetter, selectedCategory])

  // Render bold markdown
  const renderDescription = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-amber-400">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-amber-500">Rules Glossary</h1>
          <p className="text-zinc-400">
            Searchable reference for Gloomhaven: Jaws of the Lion terms
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search terms or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 pr-10 text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-zinc-400">
            Category
          </label>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* A-Z Filter */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-zinc-400">
            Filter by Letter
          </label>
          <div className="flex gap-1 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedLetter(null)}
              className={`shrink-0 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedLetter === null
                  ? 'bg-amber-500 text-zinc-900'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              All
            </button>
            {availableLetters.map((letter) => (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className={`shrink-0 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedLetter === letter
                    ? 'bg-amber-500 text-zinc-900'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-zinc-400">
          {filteredGlossary.length} term{filteredGlossary.length !== 1 ? 's' : ''} found
        </div>

        {/* Glossary Entries */}
        <div className="space-y-3">
          {filteredGlossary.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500">
              No terms found matching your filters.
            </div>
          ) : (
            filteredGlossary.map((entry) => (
              <div
                key={entry.term}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-amber-400">{entry.term}</h3>
                  {entry.category && (
                    <span className="shrink-0 rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-400">
                      {entry.category}
                    </span>
                  )}
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {renderDescription(entry.description)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
