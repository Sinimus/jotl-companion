export const APP_NAME = 'JotL Companion'

/** "Scenarios · Friday group · JotL Companion": the most specific part first. */
export function formatTitle(...parts: (string | null | undefined)[]): string {
  const named = parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part))
  return [...named, APP_NAME].join(' · ')
}
