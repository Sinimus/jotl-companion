import { useSearchParams } from 'react-router-dom'
import { TAB_PARAM, parseTab } from '@/shared/lib/tabs'

/** The open tab of a screen, read from `?tab=`; an unknown value opens the default tab. */
export function useTabParam<T extends string>(allowed: readonly T[], fallback: T): T {
  const [params] = useSearchParams()
  return parseTab(params.get(TAB_PARAM), allowed, fallback)
}
