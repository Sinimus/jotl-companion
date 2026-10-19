// ---------------------------------------------------------------------------
// Source citations: the short codes of the data files ("SB p.12", "LtP p.24",
// "GHS", "card") expanded into the names shown under lists in the UI.
// ---------------------------------------------------------------------------

/** One comma-separated part of a source citation. */
function formatSourcePart(part: string): string {
  if (part === 'GHS') return 'GHS (community data)'
  if (part === 'card') return 'card'
  const book = /^(LtP|SB|Glossary) (p\.\d+(?:-\d+)?)$/.exec(part)
  if (book) {
    const name =
      book[1] === 'LtP' ? 'Learn to Play' : book[1] === 'SB' ? 'Scenario Book' : 'Rules Glossary'
    return `${name} ${book[2]}`
  }
  return part
}

/**
 * Expand the source codes of the data files for display:
 * "SB p.12" → "Scenario Book p.12", "LtP p.24" → "Learn to Play p.24",
 * "Glossary p.18" → "Rules Glossary p.18", "LtP p.3-12" → "Learn to Play p.3-12",
 * "GHS" → "GHS (community data)",
 * "card" stays as it is; comma-separated lists keep their commas.
 */
export function formatSource(source: string): string {
  return source
    .split(',')
    .map((part) => formatSourcePart(part.trim()))
    .join(', ')
}
