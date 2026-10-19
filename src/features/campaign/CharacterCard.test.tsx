import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { CharacterProgress } from '@/shared/schemas'
import { CharacterCard } from './CharacterCard'

const hero: CharacterProgress = {
  id: '11111111-2222-4333-8444-555555555555',
  type: 'hatchet',
  name: 'Brightfang',
  experience: 95,
  gold: 40,
  checkmarks: 0,
  perkIds: [],
  itemIds: [1, 2],
  equippedItemIds: [],
  selectedAbilityIds: [],
  unlockedAbilityIds: [],
  bonusPerks: 0,
}

const markup = renderToStaticMarkup(
  <MemoryRouter>
    <CharacterCard character={hero} to="/campaign/c1/character/h1" onDelete={() => undefined} />
  </MemoryRouter>,
)

describe('CharacterCard', () => {
  it('is one link to the character, so the keyboard and a screen reader reach it', () => {
    const links = markup.match(/<a [^>]*>/g) ?? []
    expect(links).toHaveLength(1)
    expect(links[0]).toContain('href="/campaign/c1/character/h1"')
    expect(markup).not.toContain('cursor-pointer')
  })

  it('keeps the remove button outside the link', () => {
    const link = markup.slice(markup.indexOf('<a '), markup.indexOf('</a>'))
    expect(link).toContain('Brightfang')
    expect(link).not.toContain('<button')
    expect(markup).toContain('aria-label="Remove Brightfang"')
  })

  it('gives the remove button a 44 px target', () => {
    expect(markup).toMatch(/<button[^>]*h-11 w-11[^>]*aria-label="Remove Brightfang"/)
  })
})
