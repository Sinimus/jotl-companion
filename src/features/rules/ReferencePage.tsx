import { conditions, elements, rules } from '@/data'

export function ReferencePage() {
  const getRemovalLabel = (removal: string) => {
    switch (removal) {
      case 'end_of_turn':
        return 'End of Turn'
      case 'on_heal':
        return 'On Heal'
      case 'on_reveal':
        return 'On Reveal'
      default:
        return removal
    }
  }

  const renderGuideContent = (content: string[]) => {
    return content.map((line, i) => {
      if (!line.trim()) {
        return <br key={i} />
      }
      if (line.startsWith('**')) {
        return (
          <h4 key={i} className="mb-2 mt-4 font-semibold text-amber-400">
            {line.replace(/\*\*/g, '')}
          </h4>
        )
      }
      if (line.startsWith('- ')) {
        return (
          <li key={i} className="ml-4 text-zinc-300">
            {line.slice(2)}
          </li>
        )
      }
      return (
        <p key={i} className="text-zinc-300">
          {line}
        </p>
      )
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-amber-500">Quick Reference</h1>
        <p className="text-zinc-400">
          Visual cards for frequently looked-up game mechanics
        </p>
      </div>

      {/* Conditions Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-zinc-100">Conditions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {conditions.map((condition) => (
            <div
              key={condition.id}
              className={`rounded-lg border-2 bg-zinc-900/50 p-4 ${
                condition.type === 'negative'
                  ? 'border-red-900/50'
                  : 'border-emerald-900/50'
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-zinc-100">{condition.name}</h3>
                <span
                  className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${
                    condition.type === 'negative'
                      ? 'bg-red-900/30 text-red-400'
                      : 'bg-emerald-900/30 text-emerald-400'
                  }`}
                >
                  {getRemovalLabel(condition.removal)}
                </span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {condition.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Elements Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-zinc-100">Elements</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {elements.map((element) => (
            <div
              key={element.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
              style={{
                borderTopColor: element.color,
                borderTopWidth: '4px',
              }}
            >
              <div className="mb-2 flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: element.color }}
                />
                <h3 className="text-lg font-semibold text-zinc-100">{element.name}</h3>
              </div>
              <p className="text-sm text-zinc-400">
                Infused at end of turn, consumed for bonus effects
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Guides Section */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold text-zinc-100">Core Rules</h2>
        <div className="space-y-4">
          {rules.guides.map((guide) => (
            <div
              key={guide.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
            >
              <h3 className="mb-4 text-xl font-semibold text-amber-400">{guide.title}</h3>
              <div className="space-y-2 text-zinc-300">
                {renderGuideContent(guide.content)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
