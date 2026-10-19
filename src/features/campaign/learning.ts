import type { AbilityCard } from '@/data'
import { abilityCardsFor } from './rules'
import { FIRST_LEVEL_1_CARDS } from './progression'

// ---------------------------------------------------------------------------
// The learning scenarios 1-5: what the Learn to Play Guide introduces before
// each of them and what changes for the party after it.  Paraphrased from the
// guide (Cephalofair, Learn to Play Guide), page by page; card names from GHS
// (community data).
// ---------------------------------------------------------------------------

export interface GuideLine {
  text: string
  source: string
}

export interface LearningScenario {
  id: number
  /** Pages of the guide to read before playing it. */
  rulesPages: string
  /** New rules the guide introduces for this scenario. */
  introduces: GuideLine[]
  /** What changes for the party once it is completed. */
  afterwards: GuideLine[]
}

export const LEARNING_SCENARIOS: readonly LearningScenario[] = [
  {
    id: 1,
    rulesPages: 'LtP p.3-12',
    introduces: [
      { text: 'Each character takes its six level A cards and the starting materials', source: 'LtP p.3' },
      { text: 'The round: card selection, initiative, turns, end of round', source: 'LtP p.6, LtP p.7' },
      { text: 'Move, attack, attack modifiers, conditions, line of sight, heal', source: 'LtP p.7-10' },
      { text: 'Monster turns: focus, move and attack', source: 'LtP p.10, LtP p.11' },
      { text: 'Damage, exhaustion and resting when cards run out', source: 'LtP p.12' },
    ],
    afterwards: [
      { text: 'Take a character sheet, name the character and mark level 1', source: 'LtP p.13' },
      { text: 'Swap two A cards for the two B cards of the same name; the hand stays at six cards', source: 'LtP p.13' },
      { text: 'No gold and no experience yet', source: 'LtP p.13' },
    ],
  },
  {
    id: 2,
    rulesPages: 'LtP p.14-18',
    introduces: [
      { text: 'Money tokens, treasure tiles, traps and doors', source: 'LtP p.14' },
      { text: 'Basic and lost actions, looting, area effects', source: 'LtP p.15' },
      { text: 'Push, pull, Disarm, failing a scenario, negating damage with lost cards', source: 'LtP p.16' },
      { text: 'Monster ability decks, monsters and traps, ranged monsters', source: 'LtP p.17, LtP p.18' },
    ],
    afterwards: [
      { text: '25 gold each plus 2 gold per money token the character collected', source: 'LtP p.18' },
      { text: 'Items 01-13 join the shop: buy, sell for half (rounded up) or trade between scenarios', source: 'LtP p.19' },
      { text: 'Add the first two level 1 cards: eight cards in the hand', source: 'LtP p.19' },
    ],
  },
  {
    id: 3,
    rulesPages: 'LtP p.20-23',
    introduces: [
      { text: 'Difficult terrain, section breaks and experience from actions', source: 'LtP p.20' },
      { text: 'Active bonuses, Shield, Jump', source: 'LtP p.21' },
      { text: 'New conditions and the long rest', source: 'LtP p.22' },
    ],
    afterwards: [
      { text: 'Record experience from actions plus 6 bonus experience; 2 gold per money token', source: 'LtP p.23' },
      { text: 'One perk each', source: 'LtP p.24' },
      { text: 'Add the rest of the level 1 cards and put A and B away for good: the hand is the hand limit', source: 'LtP p.24' },
      { text: 'From now on every successful scenario is followed by a city event', source: 'LtP p.24' },
    ],
  },
  {
    id: 4,
    rulesPages: 'LtP p.25-27',
    introduces: [
      { text: 'Full monster ability decks and spawning', source: 'LtP p.25' },
      { text: 'Element board: infuse, wane, consume', source: 'LtP p.25, LtP p.26' },
      { text: 'Battle goals: two dealt, one kept; a checkmark if met and the scenario is won', source: 'LtP p.25' },
      { text: 'Objectives', source: 'LtP p.27' },
    ],
    afterwards: [
      { text: 'Gold, experience with the 6 bonus, and a checkmark for a met battle goal', source: 'LtP p.27' },
      { text: 'A reward item for one character, chosen by the players', source: 'LtP p.27' },
      { text: 'Add the three X cards: from now on choose hand-limit cards from a bigger pool', source: 'LtP p.27' },
    ],
  },
  {
    id: 5,
    rulesPages: 'LtP p.28',
    introduces: [
      { text: 'Bosses and the boss ability deck, immunities, C in stats', source: 'LtP p.28' },
      { text: 'Traps that apply conditions instead of damage', source: 'LtP p.28' },
    ],
    afterwards: [
      { text: 'Gold, checkmarks, experience with the 6 bonus and the scenario reward', source: 'LtP p.28' },
      { text: 'Level up at 45 experience: one card of up to the new level, one perk, higher maximum HP', source: 'LtP p.29' },
      { text: 'From now on the scenario level follows the party: average level ÷ 2, rounded up', source: 'LtP p.29' },
    ],
  },
]

export interface CardChange {
  added: AbilityCard[]
  removed: AbilityCard[]
}

/**
 * The cards a character gains and gives up when a learning scenario is
 * completed (LtP p.13, p.19, p.24, p.27).  Scenario 5 changes no cards by
 * itself; levelling up does.
 */
export function cardChangesAfter(scenarioId: number, characterType: string): CardChange {
  const own = abilityCardsFor(characterType)
  const ofLevel = (level: AbilityCard['level']) => own.filter((card) => card.level === level)
  if (scenarioId === 1) {
    const bCards = ofLevel('B')
    const names = new Set(bCards.map((card) => card.name))
    return { added: bCards, removed: ofLevel('A').filter((card) => names.has(card.name)) }
  }
  if (scenarioId === 2) {
    const ids = FIRST_LEVEL_1_CARDS[characterType] ?? []
    return { added: own.filter((card) => ids.includes(card.id)), removed: [] }
  }
  if (scenarioId === 3) {
    const ids = FIRST_LEVEL_1_CARDS[characterType] ?? []
    const bNames = new Set(ofLevel('B').map((card) => card.name))
    return {
      added: ofLevel('1').filter((card) => !ids.includes(card.id)),
      removed: [...ofLevel('A').filter((card) => !bNames.has(card.name)), ...ofLevel('B')],
    }
  }
  if (scenarioId === 4) return { added: ofLevel('X'), removed: [] }
  return { added: [], removed: [] }
}
