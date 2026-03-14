# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm check        # TypeScript + Svelte type check
pnpm check:watch  # Type check in watch mode
pnpm lint         # Check formatting (prettier)
pnpm format       # Auto-format all files
```

**Prerequisites:** MongoDB running at `mongodb://localhost:27017` with `MONGODB_URI` in `.env`.

## Architecture

This is a **D&D 5e initiative tracker** with two UIs:

- **DM dashboard** at `/` — authenticated, manages combat
- **Viewer display** at `/display/[sessionId]` — public, read-only, syncs via SSE

### Auth flow

`dm_auth` cookie holds a stable 6-char auth session ID. `hooks.server.ts` validates it against MongoDB on every `/` and `/history` request, then resolves the active game session's public ID into `event.locals.gameSessionId`.

### State sync (the core data flow)

1. DM actions mutate `combat` store (`src/lib/store.svelte.ts`) — a Svelte 5 `$state` class
2. Every mutation calls `sync()` → fire-and-forget `POST /api/state` with full `StorageState`
3. Server validates, writes to `sessionStates` Map (in-memory), broadcasts to all SSE clients for that session via `broadcastToSession()`, then fire-and-forget persists to MongoDB
4. Viewers subscribe via `GET /api/state?session=<6-char-id>` with `Accept: text/event-stream`

### Session identity — two IDs per game session

- **Auth session ID** (stable): stored in `dm_auth` cookie; identifies the DM account
- **Game session public ID** (6-char): in viewer URLs like `/display/AB3X9K`; changes per game session
- `authToGameSession` Map in `src/lib/server/sessionCache.ts` caches the auth→public mapping

### Key server modules

| File                             | Purpose                                                                   |
| -------------------------------- | ------------------------------------------------------------------------- |
| `src/lib/server/db.ts`           | MongoDB singleton                                                         |
| `src/lib/server/dmModel.ts`      | All DM CRUD: auth, combat state, history, sessions, monsters              |
| `src/lib/server/sseState.ts`     | Shared `sessionStates` + `sessionClients` Maps and `broadcastToSession()` |
| `src/lib/server/sessionCache.ts` | `authToGameSession` Map (auth ID → public game session ID)                |
| `src/lib/server/validate.ts`     | Input validation for `StorageState` and session IDs                       |

### Key client modules

| File                      | Purpose                                                                          |
| ------------------------- | -------------------------------------------------------------------------------- |
| `src/lib/store.svelte.ts` | All combat state + DM actions; syncs to server on every mutation                 |
| `src/lib/types.ts`        | Shared TypeScript interfaces (`Combatant`, `StorageState`, `CombatRecord`, etc.) |
| `src/lib/enemies.ts`      | `ENEMY_TEMPLATES`, `CONDITIONS`, `ADV_CONDITIONS`, `getMonsterDetail()`          |
| `src/lib/utils.ts`        | `sortCombatants()`, `crToXp()`, condition colors/descriptions                    |

### API routes

| Route                  | Method          | Purpose                                                    |
| ---------------------- | --------------- | ---------------------------------------------------------- |
| `/api/state`           | POST            | DM pushes combat state; broadcasts to viewers              |
| `/api/state`           | GET (JSON)      | DM screen refresh — returns current `StorageState`         |
| `/api/state?session=X` | GET (SSE)       | Viewer subscribes to live updates                          |
| `/api/sessions`        | POST            | Game session CRUD (`create`, `rename`, `delete`, `switch`) |
| `/api/history`         | GET/POST        | Combat chronicle                                           |
| `/api/monsters`        | GET/POST/DELETE | Custom monster management                                  |
| `/api/notes`           | GET/POST/DELETE | Session notes                                              |
| `/api/encounters`      | GET/POST/DELETE | Saved encounters                                           |
| `/api/messages`        | GET/POST        | Player→DM messages                                         |
| `/api/voice-command`   | POST            | AI voice command interpretation (Anthropic SDK)            |

### Svelte 5 patterns

Use runes throughout: `$state`, `$derived`, `$effect`, `$props`. The `combat` store is a plain object returned from a factory function — all reactive state is `$state` inside the factory closure.

### Combatant types

`Combatant.type` is `'player' | 'enemy' | 'lair'`. Lair cards are pseudo-combatants at initiative 20 that appear when a monster with lair actions is added. Players can be benched (`inCombat: false`) without being removed from the roster.

### MongoDB schema (DM document in `dms` collection)

Each DM document has `gameSessions[]` with embedded `combatState`, `combatHistory`, and `notes`. Legacy documents (pre-multi-session) are auto-migrated on first access by `ensureGameSessions()` in `dmModel.ts`.

### Session ID format

6 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excludes O, 0, I, 1 to avoid visual confusion).
