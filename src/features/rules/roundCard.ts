// ---------------------------------------------------------------------------
// Round card: one screen with the order of a round and the rules looked up
// most often during one.  Paraphrased from the Learn to Play Guide and the
// Rules Glossary (Cephalofair); every line carries its pages.
// ---------------------------------------------------------------------------

export interface RoundLine {
  text: string
  source: string
}

export interface RoundStep {
  title: string
  lines: RoundLine[]
}

export const ROUND_STEPS: readonly RoundStep[] = [
  {
    title: '1. Card selection',
    lines: [
      {
        text: 'Each character secretly picks two cards from hand and marks one as the initiative card.',
        source: 'LtP p.6, Glossary p.5',
      },
      { text: 'Or declares a long rest, if at least two cards are in the discard pile.', source: 'Glossary p.5' },
      { text: 'A character who can do neither is exhausted.', source: 'LtP p.12, Glossary p.9' },
    ],
  },
  {
    title: '2. Ordering of initiative',
    lines: [
      {
        text: 'Reveal the cards, initiative card on top, and flip one ability card for every monster set on the map.',
        source: 'Glossary p.16',
      },
      { text: 'Lowest initiative acts first; a long rest counts as 99.', source: 'LtP p.7, Glossary p.16' },
      {
        text: 'Ties: a character before a monster; two characters compare their second card, then the players choose.',
        source: 'LtP p.7, Glossary p.16',
      },
    ],
  },
  {
    title: '3. Turns',
    lines: [
      {
        text: 'A character performs the top action of one card and the bottom action of the other, in either order, or its long rest.',
        source: 'LtP p.7, Glossary p.21',
      },
      {
        text: 'A monster set acts on its initiative: elites first in standee number order, then normals in number order.',
        source: 'LtP p.10',
      },
      { text: 'Each monster finishes its whole turn before the next one starts.', source: 'LtP p.10' },
      { text: 'Monsters of a room opened this round act in this round.', source: 'Glossary p.17' },
    ],
  },
  {
    title: '4. End of round',
    lines: [
      {
        text: 'Shuffle every attack modifier or monster deck that revealed a shuffle card.',
        source: 'LtP p.12, Glossary p.9',
      },
      { text: 'Every infused element moves one step down: Strong to Waning, Waning to Inert.', source: 'LtP p.26' },
      { text: 'Round-bonus cards go to the discard or lost pile.', source: 'LtP p.21' },
      { text: 'Characters with two or more discarded cards may short rest.', source: 'LtP p.12' },
      {
        text: 'Goal met this round: the scenario ends now. All characters exhausted: it is lost.',
        source: 'LtP p.12, Glossary p.14',
      },
    ],
  },
]

export interface RoundTopic {
  title: string
  lines: RoundLine[]
}

export const ROUND_TOPICS: readonly RoundTopic[] = [
  {
    title: 'Short rest',
    lines: [
      { text: 'At the end of a round, with at least two cards in the discard pile; it takes no turn.', source: 'LtP p.12' },
      {
        text: 'Shuffle the discard pile, lose one card at random, take the rest back into hand.',
        source: 'LtP p.12',
      },
      {
        text: 'Once per short rest: suffer 1 damage to lose a different random card instead.',
        source: 'LtP p.12',
      },
    ],
  },
  {
    title: 'Long rest',
    lines: [
      {
        text: 'Declared at card selection, with at least two cards in the discard pile; it is the whole turn, on initiative 99.',
        source: 'LtP p.22, Glossary p.17',
      },
      {
        text: 'Lose one discarded card of your choice, take the rest back, heal 2 on yourself, ready your spent items.',
        source: 'LtP p.22, Glossary p.17',
      },
    ],
  },
  {
    title: 'Negating damage',
    lines: [
      {
        text: 'Whenever a character would suffer damage, from any source, it may lose one card from hand or two from the discard pile to cancel all of it.',
        source: 'LtP p.16, Glossary p.15',
      },
      {
        text: 'The two cards chosen for this round are in neither pile, so they cannot be lost this way.',
        source: 'Glossary p.15',
      },
    ],
  },
  {
    title: 'Exhaustion',
    lines: [
      {
        text: 'At 0 hit points, or unable to play two cards or rest at card selection: the figure leaves the map for the rest of the scenario.',
        source: 'LtP p.12, Glossary p.9',
      },
      { text: 'If every character is exhausted, the scenario is lost.', source: 'LtP p.12' },
      { text: 'It is not death: the character is fully restored after the scenario.', source: 'LtP p.12' },
    ],
  },
  {
    title: 'Elements',
    lines: [
      {
        text: 'An action showing an element infuses it: Strong at the end of that turn, so it cannot be used in the same turn.',
        source: 'LtP p.26',
      },
      {
        text: 'A Strong or Waning element can be consumed for the bonus an ability names; it goes to Inert.',
        source: 'LtP p.26',
      },
      {
        text: 'Monsters always consume an element when they can, and every monster of that set gets the bonus.',
        source: 'LtP p.26',
      },
      { text: 'The multi-coloured icon means any one element; the players choose which.', source: 'LtP p.26' },
    ],
  },
  {
    title: 'Monster turn in short',
    lines: [
      {
        text: 'Find a focus first, then move, then attack, top to bottom of the ability card.',
        source: 'LtP p.11, Glossary p.26',
      },
    ],
  },
]
