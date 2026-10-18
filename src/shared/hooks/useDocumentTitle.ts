import { useEffect } from 'react'
import { formatTitle } from '@/shared/lib/title'

/** Sets the tab and history title of the current screen; the previous title comes back on unmount. */
export function useDocumentTitle(...parts: (string | null | undefined)[]): void {
  const title = formatTitle(...parts)
  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}
