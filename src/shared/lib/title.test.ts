import { describe, expect, it } from 'vitest'
import { APP_NAME, formatTitle } from './title'

describe('formatTitle', () => {
  it('puts the most specific part first and the app name last', () => {
    expect(formatTitle('Scenarios', 'Friday group')).toBe(`Scenarios · Friday group · ${APP_NAME}`)
  })

  it('skips empty and missing parts', () => {
    expect(formatTitle('Rules', undefined, null, '  ')).toBe(`Rules · ${APP_NAME}`)
  })

  it('is just the app name without parts', () => {
    expect(formatTitle()).toBe(APP_NAME)
  })
})
