# TASK-015: PWA Support (Offline & Installable)

**Status:** `TODO`
**Priority:** `MEDIUM`
**Complexity:** `MEDIUM`
**Depends On:** TASK-001

---

## Goal

Transform the application into a Progressive Web App (PWA) so players can install it on their devices and use it offline during gaming sessions.

---

## Rules of Engagement

- **Offline First:** Ensure all static assets and game data are cached.
- **Installable:** Provide a valid manifest and icons.
- **Library:** Use `vite-plugin-pwa`.
- **Feedback:** Show a subtle indicator or toast when an update is available.

---

## Context

### Why PWA?
Gloomhaven sessions often happen in basements or places with poor connectivity. Offline access to rules and campaign data is critical.

---

## Files to Touch

```
EDIT  package.json
EDIT  vite.config.ts
EDIT  src/app/main.tsx
NEW   public/manifest.webmanifest
NEW   public/icon-192.png (Placeholder or simple shape)
NEW   public/icon-512.png (Placeholder or simple shape)
```

---

## Specifications

### 1. `vite.config.ts`

Configure `vite-plugin-pwa`:
```typescript
import { VitePWA } from 'vite-plugin-pwa'

// ...
plugins: [
  react(),
  tailwindcss(),
  VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
    manifest: {
      name: 'JotL Companion',
      short_name: 'JotL',
      description: 'Companion app for Gloomhaven: Jaws of the Lion',
      theme_color: '#09090b', // zinc-950
      icons: [
        {
          src: 'icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }
  })
]
```

### 2. `src/app/main.tsx`

Ensure the service worker is registered (the plugin handles most of it, but sometimes manual registration is preferred for control).

### 3. Assets

Create simple placeholder icons (e.g. a solid amber square or circle) to satisfy the manifest requirements.

---

## Constraints

- Use `pnpm` to install the plugin.
- Don't use heavy icon generation tools; simple 192/512 PNGs are enough for now.

---

## Acceptance Criteria

| # | Check |
|---|-------|
| 1 | `vite-plugin-pwa` is installed. |
| 2 | `pnpm build` generates a service worker (`sw.js`). |
| 3 | Manifest is correctly linked in `index.html` (automatic via plugin). |
| 4 | App remains functional after refreshing without internet (test in dev tools). |
| 5 | Browser offers "Install" option (if supported). |

---
