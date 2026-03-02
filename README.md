# Initiative Tracker

A real-time D&D 5e combat tracker for DMs. The DM manages the encounter on their own screen; players watch a live viewer on any device — no accounts or installs required for players.

## Features

- **Initiative order** — drag-free, sorted automatically; advance/rewind turns with a single click
- **Hit points** — damage, healing, and temp HP with colour-coded HP bars (green → amber → red → grey)
- **Conditions & status effects** — all 15 standard D&D 5e conditions plus four Advantage/Disadvantage markers; applied and removed with audio/visual cues on the player display
- **Enemy library** — ~380 SRD monsters with full stat blocks (ability scores, traits, actions, artwork)
- **Custom monsters** — create your own enemies with name, AC, HP, CR, type, and an optional avatar
- **Bestiary import** — drop in any 5etools bestiary JSON (e.g. `bestiary-idrotf.json`) to bulk-import non-SRD monsters with full stat blocks; imported monsters are tagged with their source (e.g. `IDRotF`)
- **In-stat-block dice roller** — any dice expression in a stat block (e.g. `2d6 + 5`) is clickable; attack phrases (e.g. `Melee Weapon Attack: +9 to hit`) roll a d20 with the modifier; results show per-die values, modifier breakdown, and total in a popup with a Roll Again button
- **Player display** — public SSE-powered viewer at `/display/[sessionId]`; updates in real time with flash effects and spatial audio
- **Game sessions** — run multiple campaigns from one account; each session has its own combat state, history, and 6-character share code
- **Combat chronicles** — permanent encounter history with round-by-round event logs and automatic XP calculation by CR
- **Combatant notes** — per-combatant freeform text for DM-only reminders (concentration, loot, etc.)
- **Resizable panels** — drag the left edge of the enemy panel on desktop to make it wider or narrower; preference is saved in localStorage

## Tech stack

- [SvelteKit 2](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/) (runes)
- [Tailwind CSS 4](https://tailwindcss.com/)
- TypeScript (strict)
- MongoDB (local or Atlas)
- Vite / pnpm

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** (`npm i -g pnpm`)
- **MongoDB** running locally on port 27017, or a remote URI

## Setup

```sh
# 1. Install dependencies
pnpm install

# 2. Create a .env file in the project root
echo 'MONGODB_URI=mongodb://localhost:27017' > .env

# 3. Start the dev server
pnpm dev
```

Navigate to `http://localhost:5173`, register a DM account, and you're ready.

### Production build

```sh
pnpm build
pnpm preview
```

## Importing a bestiary

Non-SRD monsters (e.g. Icewind Dale: Rime of the Frostmaiden) cannot be bundled with the app because the stat blocks are WotC IP. Instead:

1. Download a bestiary JSON file from the [5etools data repository](https://github.com/5etools-mirror-3/5etools-src/tree/main/data/bestiary) (e.g. `bestiary-idrotf.json`)
2. Open the **Enemy Panel** → click **⬆ Import**
3. Select the JSON file — the app parses it entirely client-side
4. Review the monster count and click **Import**

Imported monsters appear in your enemy library tagged with their source abbreviation and carry full stat blocks viewable via the ℹ️ icon.

## User guide

An in-app guide covering all features is available at `/guide` once the dev server is running.
