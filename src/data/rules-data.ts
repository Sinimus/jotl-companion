// Rules texts (glossary, guides, conditions, elements) are imported only by the
// lazily loaded rules pages, so they stay out of the entry bundle.
import conditionsRaw from './conditions.json'
import elementsRaw from './elements.json'
import rulesRaw from './rules.json'
import type { Condition, Element, RulesData } from './types.ts'

export const conditions = conditionsRaw as Condition[]
export const elements = elementsRaw as Element[]
export const rules = rulesRaw as RulesData
