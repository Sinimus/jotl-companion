# Gloomhaven: Jaws of the Lion - Unofficial Companion App

![License](https://img.shields.io/badge/license-GPLv3-green.svg)
![React](https://img.shields.io/badge/react-19-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

An offline-first companion app for the board game **Gloomhaven: Jaws of the Lion**. It keeps the campaign between sessions and answers rules questions without replacing the physical tabletop experience. The current version is shown in Settings, in the About section, and comes from `package.json`.

The app is unofficial. Its game data (items, perks, glossary, scenarios) was entered by hand and is being checked against the publisher's rules; at the table the rulebook has the last word.

## Features

- **Campaign management:** several campaigns, scenario unlocks and party progress.
- **Character sheets:** HP, XP, gold, items, perks, ability cards and battle goal checkmarks, with a bonus perks counter for perks earned outside of battle goals.
- **Scenario tracker:** locked, unlocked and completed scenarios with their goals.
- **Tools:**
  - scenario level calculator (party average and difficulty),
  - post-scenario checklist (gold conversion, bonus XP; the tutorial scenarios 1 to 5 skip the steps the rulebook skips),
  - monster focus helper.
- **Rules reference:** searchable glossary and quick reference cards.
- **Offline first:** a Progressive Web App; campaigns are stored in the browser (IndexedDB).
- **Data portability:** export and import of campaign data as JSON backups.

## Tech stack

- React 19, TypeScript 5.9 (strict), Vite 7
- Tailwind CSS v4
- Zustand 5 for state, Dexie.js (IndexedDB) for persistence, Zod v4 for validation of stored and imported data
- vitest for tests, ESLint for linting
- nginx in the production image

## Getting started

Prerequisites: Node.js 24 (see `.nvmrc`) and pnpm 10 (the exact version is pinned in `packageManager`). npm and yarn are not used.

```bash
git clone https://github.com/Sinimus/jotl-companion.git
cd jotl-companion
pnpm install
pnpm dev
```

| Command | What it does |
|---|---|
| `pnpm dev` | development server |
| `pnpm lint` | ESLint |
| `pnpm test` | vitest, one run |
| `pnpm build` | type check and production build into `dist/` |
| `pnpm preview` | serves the production build locally |

## Docker

The production image is a two-stage build: Node 24 builds the app, `nginx:stable-alpine` serves it on port 80. The image has a `HEALTHCHECK` (busybox `wget` on `127.0.0.1`). `nginx.conf` sends `no-cache` for `index.html`, `sw.js`, `registerSW.js` and the manifest so that new versions reach installed apps, and caches the hashed files in `/assets/` for a year.

```bash
docker build -t jotl-companion .
docker run --rm -p 8080:80 jotl-companion
```

## Continuous integration and deployment

- **Pull requests to `main`** (`.github/workflows/pull-request.yml`): `pnpm lint`, `pnpm test`, `pnpm build`, then a Docker build without push and a smoke test of the container (HTTP 200, page title, cache and security headers, manifest type, a hashed bundle, the healthcheck command).
- **Push to `main` and manual runs** (`.github/workflows/docker-publish.yml`): builds the image, pushes it to GitHub Container Registry and triggers the redeploy of the hosting platform. The deploy call answers 200 even when the rollout fails afterwards, so a deployment is verified by the hash of `assets/index-*.js` in the served `index.html`, which must match the build of the merged `main`.

## License

This project is licensed under the **GNU General Public License v3.0**. See the [LICENSE](LICENSE) file for details.
