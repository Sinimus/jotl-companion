import { test, expect, type Page } from '@playwright/test'
import routes from './routes.json' with { type: 'json' }

// Every page must render its heading from the JavaScript bundle (the shell in
// index.html has no headings) without an uncaught error or a console error.
function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
  })
  return errors
}

for (const route of routes) {
  test(`${route.path} renders "${route.heading}"`, async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto(route.path)
    await expect(page.getByRole('heading', { level: 1, name: route.heading, exact: true })).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('a new campaign opens its dashboard', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/')
  await page.getByPlaceholder('Campaign Name...').fill('Smoke campaign')
  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await page.getByRole('button', { name: /continue/i }).click()
  await expect(page).toHaveURL(/\/campaign\/[^/]+$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Smoke campaign', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('a character and the campaign tools open from the dashboard', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/')
  await page.getByPlaceholder('Campaign Name...').fill('Tools campaign')
  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await page.getByRole('button', { name: /continue/i }).click()
  const dashboard = page.url()

  await page.getByRole('button', { name: /^Red Guard/ }).click()
  await page.getByPlaceholder('Character name…').fill('Smoke hero')
  await page.getByRole('button', { name: 'Add Character', exact: true }).click()
  await page.getByRole('link', { name: /Smoke hero/ }).click()
  await expect(page).toHaveURL(/\/character\/[^/]+$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Smoke hero', exact: true })).toBeVisible()

  for (const [link, heading] of [
    ['Learning Scenarios 1–5', 'Learning Scenarios 1–5'],
    ['Set Up Scenario', 'Set Up Scenario'],
    ['Finish Scenario', 'Finish Scenario'],
  ] as const) {
    await page.goto(dashboard)
    await page.getByRole('link', { name: new RegExp(`^${link}`) }).click()
    await expect(page.getByRole('heading', { level: 1, name: heading, exact: true })).toBeVisible()
  }
  expect(errors).toEqual([])
})
