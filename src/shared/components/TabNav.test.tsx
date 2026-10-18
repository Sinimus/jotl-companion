import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { TabNav } from './TabNav'

const TABS = [
  { id: 'party', label: 'Party' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'treasures', label: 'Treasures' },
] as const

function render(entry: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[entry]}>
      <TabNav tabs={TABS} active="scenarios" fallback="party" label="Campaign sections" />
    </MemoryRouter>,
  )
}

describe('TabNav', () => {
  it('gives every tab an address of its own, the default tab none', () => {
    const html = render('/campaign/1?tab=scenarios')
    expect(html).toContain('href="/campaign/1"')
    expect(html).toContain('href="/campaign/1?tab=scenarios"')
    expect(html).toContain('href="/campaign/1?tab=treasures"')
  })

  it('marks only the active tab as the current page', () => {
    const html = render('/campaign/1?tab=scenarios')
    expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    expect(html).toMatch(/aria-current="page"[^>]*>Scenarios</)
  })

  it('is a labelled navigation landmark', () => {
    expect(render('/campaign/1')).toContain('<nav aria-label="Campaign sections"')
  })
})
