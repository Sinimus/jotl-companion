/** Name of the query parameter that carries the open tab, for example `?tab=scenarios`. */
export const TAB_PARAM = 'tab'

/** The tab named by `value` when it is one of `allowed`, otherwise `fallback`. */
export function parseTab<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.find((tab) => tab === value) ?? fallback
}

/**
 * Query string for opening `tab`, other parameters kept. The default tab has no parameter,
 * so the plain address of a screen is its first tab.
 */
export function tabSearch(current: URLSearchParams, tab: string, fallback: string): string {
  const next = new URLSearchParams(current)
  if (tab === fallback) next.delete(TAB_PARAM)
  else next.set(TAB_PARAM, tab)
  const text = next.toString()
  return text ? `?${text}` : ''
}
