/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// The installable shell: the files a phone looks for when the app is added to the home
// screen. A build runs without them and only the phone notices, so they are checked here.

const root = resolve(import.meta.dirname, '..')
const read = (file: string) => readFileSync(resolve(root, file), 'utf8')

/** Width and height of a PNG from its header. */
function pngSize(file: string): [number, number] {
  const bytes = readFileSync(resolve(root, file))
  expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG')
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)]
}

describe('PWA shell', () => {
  const html = read('index.html')

  it('has the icons the manifest declares, at their declared sizes', () => {
    expect(pngSize('public/icon-192.png')).toEqual([192, 192])
    expect(pngSize('public/icon-512.png')).toEqual([512, 512])
    expect(pngSize('public/icon-maskable-512.png')).toEqual([512, 512])
    expect(pngSize('public/apple-touch-icon.png')).toEqual([180, 180])
    const config = read('vite.config.ts')
    for (const src of ['/icon-192.png', '/icon-512.png', '/icon-maskable-512.png']) {
      expect(config).toContain(src)
    }
    expect(config).toMatch(/purpose: 'maskable'/)
  })

  it('has one source of the manifest: the plugin, not a file in public/', () => {
    expect(existsSync(resolve(root, 'public/manifest.webmanifest'))).toBe(false)
    expect(html).not.toContain('rel="manifest"')
  })

  it('declares the theme colour, the touch icon and the safe-area viewport', () => {
    expect(html).toContain('<meta name="theme-color" content="#09090b"')
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png"')
    expect(html).toContain('viewport-fit=cover')
    expect(html).toContain('<meta name="description"')
  })

  it('keeps the start title that the deploy smoke test looks for', () => {
    expect(html).toContain(
      '<title>Gloomhaven: Jaws of the Lion: Unofficial Companion App</title>',
    )
  })

  it('pads the bottom navigation by the home-indicator inset', () => {
    const nav = read('src/shared/components/layout/BottomNav.tsx')
    expect(nav).toContain('env(safe-area-inset-bottom)')
    const layout = read('src/shared/components/layout/AppLayout.tsx')
    expect(layout).toContain('env(safe-area-inset-bottom)')
  })
})
