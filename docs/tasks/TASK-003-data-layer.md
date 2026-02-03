# TASK-003: Data Layer — Zod v4 Schemas + Dexie DB

**Status:** `DONE`
**Priority:** `HIGH`
**Estimated Complexity:** `MEDIUM`
**Depends On:** TASK-002 (complete)

---

## Goal

Create the persistence layer: Zod v4 schemas for runtime validation of player/campaign state, and Dexie.js database for IndexedDB storage. This enables offline-first campaign tracking.

---

## Context

### What We Have (from Task 2)
- Static game data in `src/data/*.json` with TypeScript interfaces
- These represent **immutable game rules** (characters, perks, scenarios, etc.)

### What We Need Now
- **Zod schemas** for **mutable player state** (campaigns, character progress)
- **Dexie database** for persisting that state to IndexedDB
- Clear separation: game data (static JSON) vs player data (Dexie DB)

### Important: Zod v4 API
We're using **Zod v4.3.6** (not v3). Key API differences:
```typescript
// v3 style (DON'T USE)
import { z } from 'zod'
z.string().uuid()

// v4 style (USE THIS)
import { z } from 'zod/v4'
// OR
import * as z from 'zod'
z.string().uuid()  // uuid() is now built-in
```

Zod v4 has `z.uuid()` as a standalone, improved error messages, and slightly different method chaining. Refer to https://zod.dev for v4 docs.

---

## Files to Create

```
src/shared/
├── schemas/
│   ├── index.ts              # Barrel export
│   ├── character.schema.ts   # Character progress schema
│   ├── campaign.schema.ts    # Campaign schema
│   └── common.schema.ts      # Shared primitives (IDs, enums)
└── db/
    ├── index.ts              # Dexie instance export
    ├── database.ts           # Database class definition
    └── migrations.ts         # Version migrations (v1 for now)
```

---

## Data Model: Player State

### Campaign (top-level entity)
```typescript
Campaign {
  id: string (uuid)
  name: string
  createdAt: Date
  updatedAt: Date
  characters: CharacterProgress[]    // Embedded, max 4
  scenarioStatus: Record<number, ScenarioStatus>  // scenario ID → status
  cityEventsDrawn: number[]          // IDs of drawn city events
}
```

### CharacterProgress (embedded in Campaign)
```typescript
CharacterProgress {
  id: string (uuid)
  type: CharacterType               // "demolitionist" | "hatchet" | etc.
  name: string                      // Player-given name
  level: number (1-9)
  experience: number (0+)
  gold: number (0+)
  checkmarks: number (0-18)
  perkIds: string[]                 // IDs of perks taken
  itemIds: number[]                 // IDs of owned items
}
```

### ScenarioStatus (enum)
```typescript
"locked" | "unlocked" | "completed"
```

### CharacterType (enum)
```typescript
"demolitionist" | "red_guard" | "hatchet" | "voidwarden"
```

---

## Schema Specifications

### 1. src/shared/schemas/common.schema.ts

```typescript
import * as z from 'zod'

// Character type enum — must match src/data/characters.json IDs
export const CharacterTypeSchema = z.enum([
  'demolitionist',
  'red_guard',
  'hatchet',
  'voidwarden',
])

// Scenario status for campaign tracking
export const ScenarioStatusSchema = z.enum([
  'locked',
  'unlocked',
  'completed',
])

// Reusable UUID schema
export const UuidSchema = z.string().uuid()

// Timestamp (ISO string or Date coerced to Date)
export const TimestampSchema = z.coerce.date()
```

### 2. src/shared/schemas/character.schema.ts

```typescript
import * as z from 'zod'
import { CharacterTypeSchema, UuidSchema } from './common.schema'

export const CharacterProgressSchema = z.object({
  id: UuidSchema,
  type: CharacterTypeSchema,
  name: z.string().min(1).max(50),
  level: z.number().int().min(1).max(9),
  experience: z.number().int().min(0),
  gold: z.number().int().min(0),
  checkmarks: z.number().int().min(0).max(18),
  perkIds: z.array(z.string()),       // References to perks.json
  itemIds: z.array(z.number().int()), // References to items.json
})

// Infer TypeScript type from schema
export type CharacterProgress = z.infer<typeof CharacterProgressSchema>
```

### 3. src/shared/schemas/campaign.schema.ts

```typescript
import * as z from 'zod'
import { UuidSchema, ScenarioStatusSchema, TimestampSchema } from './common.schema'
import { CharacterProgressSchema } from './character.schema'

export const CampaignSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(100),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  characters: z.array(CharacterProgressSchema).max(4),
  scenarioStatus: z.record(
    z.coerce.number().int().min(1).max(17),  // scenario ID as key
    ScenarioStatusSchema
  ),
  cityEventsDrawn: z.array(z.number().int()),
})

export type Campaign = z.infer<typeof CampaignSchema>

// Schema for creating a new campaign (id/timestamps auto-generated)
export const CreateCampaignSchema = CampaignSchema.pick({
  name: true,
})

export type CreateCampaign = z.infer<typeof CreateCampaignSchema>
```

### 4. src/shared/schemas/index.ts

```typescript
// Barrel export for all schemas
export * from './common.schema'
export * from './character.schema'
export * from './campaign.schema'
```

---

## Database Specifications

### 5. src/shared/db/database.ts

```typescript
import Dexie, { type EntityTable } from 'dexie'
import type { Campaign } from '../schemas'

export class JotlDatabase extends Dexie {
  campaigns!: EntityTable<Campaign, 'id'>

  constructor() {
    super('jotl-companion')

    this.version(1).stores({
      // Primary key is 'id', index on 'name' and 'updatedAt'
      campaigns: 'id, name, updatedAt',
    })
  }
}
```

### 6. src/shared/db/migrations.ts

```typescript
// Future migrations will go here.
// For v1, no migrations needed — just the initial schema.
export const DB_VERSION = 1
```

### 7. src/shared/db/index.ts

```typescript
import { JotlDatabase } from './database'

// Singleton database instance
export const db = new JotlDatabase()

export { JotlDatabase } from './database'
export { DB_VERSION } from './migrations'
```

---

## Constraints

1. **DO NOT** create Zustand stores yet (that's Task 4)
2. **DO NOT** create UI components
3. **DO NOT** implement CRUD operations (just schema + DB setup)
4. **USE Zod v4 API** — import from `'zod'` (not `'zod/v4'` in our setup)
5. **Dexie EntityTable** — use the typed table API
6. **Max 4 characters** per campaign (enforced in schema)
7. **Scenario IDs 1-17** (coerce string keys to numbers in record)

---

## Acceptance Criteria

1. All schema files exist and export correctly from barrel
2. `pnpm build` passes with no TypeScript errors
3. Zod schemas validate correctly (test with sample data)
4. Dexie database class instantiates without error
5. `Campaign` type is properly inferred from `CampaignSchema`
6. `CharacterProgress` type is properly inferred
7. Schema rejects invalid data (e.g., level > 9, checkmarks > 18)

---

## Verification Script

Create a temporary test in `src/app/routes.tsx` (remove after verification):

```typescript
import { CampaignSchema, CharacterProgressSchema } from '@/shared/schemas'
import { db } from '@/shared/db'

// Test schema validation
const validCharacter = CharacterProgressSchema.parse({
  id: crypto.randomUUID(),
  type: 'hatchet',
  name: 'Grunk',
  level: 3,
  experience: 120,
  gold: 45,
  checkmarks: 2,
  perkIds: ['hatchet_1'],
  itemIds: [1, 7],
})
console.log('Character valid:', validCharacter)

// Test DB instantiation
console.log('DB name:', db.name)
console.log('DB tables:', db.tables.map(t => t.name))
```

After verifying in browser console, **remove the test code**.

---

## Reference Files

- `src/data/types.ts` — Existing TypeScript interfaces (for reference, don't duplicate)
- `BLUEPRINT.md` — Section 5 (Data Models)
- Zod v4 docs: https://zod.dev

---

## Notes on Zod v4 vs v3

| Feature | v3 | v4 |
|---------|----|----|
| Import | `import { z } from 'zod'` | `import * as z from 'zod'` or same |
| UUID | `z.string().uuid()` | `z.string().uuid()` (same) |
| Coerce | `z.coerce.date()` | `z.coerce.date()` (same) |
| Infer | `z.infer<typeof Schema>` | `z.infer<typeof Schema>` (same) |
| Record keys | string only | can coerce |

The API is mostly compatible; main difference is improved error messages and tree-shaking.

---

*Task created: 2026-02-03*
*Architect: Claude Opus 4.5*
