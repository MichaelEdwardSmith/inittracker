# Initiative Tracker

A real-time D&D 5e combat tracker for DMs. The DM manages the encounter on their own screen; players watch a live viewer on any device — no accounts or installs required for players.

## Features

- **Initiative order** — drag-free, sorted automatically; advance/rewind turns with a single click; when two or more combatants share the same initiative value, ▲/▼ buttons appear on their cards to set the tiebreak order
- **Hit points** — damage, healing, and temp HP with colour-coded HP bars (green → amber → red → grey)
- **Conditions & status effects** — all 15 standard D&D 5e conditions plus four Advantage/Disadvantage markers; applied and removed with audio/visual cues on the player display
- **Concentration checks** — when a combatant with the Concentrating condition takes damage, a modal automatically shows the CON save DC (max(10, damage ÷ 2)); click **Success** to dismiss or **Fail** to dismiss and automatically remove the Concentrating condition
- **Death saving throws** — when a player drops to 0 HP a compact tracker appears on their DM row to record successes and failures (click each circle to toggle); 3 successes or a "Stabilize" click = Stable, 3 failures = Dead (Dead condition auto-applied); the player display replaces the HP bar with a large death saves panel that updates in real time via SSE
- **Enemy library** — ~380 SRD monsters with full stat blocks (ability scores, traits, actions, artwork)
- **Custom monsters** — create your own enemies with name, AC, HP, CR, type, and an optional avatar
- **Bestiary import** — drop in any 5etools bestiary JSON (e.g. `bestiary-idrotf.json`) to bulk-import non-SRD monsters with full stat blocks; imported monsters are tagged with their source (e.g. `IDRotF`)
- **Encounter builder** — a dedicated modal (header → **Encounters**) for designing reusable encounter templates before combat begins; add enemies with quantities, set party size and average level, and see live XP totals and a difficulty rating (Trivial / Easy / Medium / Hard / Deadly) calculated from the D&D 5e DMG thresholds with the standard enemy-count multiplier; click **Load to Initiative** to push the whole encounter into the tracker in one click, or **Delete** to remove it from your list; encounters are saved to your account and shared across all sessions
- **Dice roller** — a dedicated modal in the header for rolling any combination of dice (d4 through d100) with adjustable quantity (1–99) and a positive or negative modifier; shows individual die results with nat-20/nat-1 highlights on d20 rolls, a dice sum + modifier breakdown, a large amber total, a Roll Again button, and a compact history of the last 5 rolls
- **Virtual 3D dice** — every roll in the app triggers a full-screen 3D physics simulation (Three.js + Cannon ES) where dice tumble across the screen with metal sound effects; the face values that come to rest are the authoritative result; fires on the Dice Roller, stat-block expressions, attack rolls, saving throws, skill checks, spell descriptions, legendary actions, and voice commands; a **Disable virtual dice** checkbox in the Dice Roller modal footer switches to instant results
- **In-stat-block dice roller** — any dice expression in a stat block (e.g. `2d6 + 5`) is clickable; attack phrases (e.g. `Melee Weapon Attack: +9 to hit`) roll a d20 with the modifier; results show per-die values, modifier breakdown, and total in a popup with a Roll Again button
- **Spell reference** — a built-in D&D 5e spell compendium searchable by name and filterable by level (cantrip through 9th), school (8 schools), and class (9 classes); each spell card shows casting time, range, components, duration, full description, and "at higher levels" text; dice expressions in spell descriptions are clickable; spell names inside monster stat blocks are clickable and open directly to that spell
- **Player display** — public SSE-powered viewer at `/display/[sessionId]`; updates in real time with flash effects and spatial audio; fully responsive with a mobile hamburger menu that collapses header actions on small screens
- **Player initiative rolling** — players can roll their own initiative directly from the viewer screen (normal, advantage, or disadvantage), with DEX modifier applied automatically; the result is submitted to the DM's tracker instantly
- **Fullscreen mode** — a fullscreen toggle button on both the DM dashboard and the player display for TV/projector use
- **Game sessions** — run multiple campaigns from one account; each session has its own combat state, history, and 6-character share code
- **Combat chronicles** — permanent encounter history with round-by-round event logs, automatic XP calculation by CR, and one-click **PDF export** for archiving or sharing with players
- **Legendary actions** — enemies with legendary actions show a three-dot tracker on their initiative card; click a dot to mark actions as spent (dots deplete right-to-left); dots automatically refill at the start of that creature's next turn; click the ℹ️ icon to open a quick-reference modal of the creature's legendary action options
- **Lair actions** — click the building icon on any enemy card to add a purple **Lair Actions** card to the initiative order at count 20; the card participates in the normal turn rotation so the DM is prompted at the right moment each round; removing the last instance of a creature automatically removes its lair card
- **Combatant notes** — per-combatant freeform text for DM-only reminders (concentration, loot, etc.)
- **Player-to-DM messaging** — players on the viewer screen can send a private message to the DM; choose which party member you are, type your message, and hit Send. The DM sees a live unread count badge on the Messages button in the header (and on the mobile hamburger menu) and can read the full inbox at any time
- **Resizable panels** — drag the left edge of the enemy panel on desktop to make it wider or narrower; preference is saved in localStorage
- **Voice commands** _(Beta — Chrome/Edge only)_ — click the **🎤 Voice** button in the DM header to enable hands-free control via the browser's Speech Recognition API; say **"Tracker Next"**, **"Tracker Previous"**, **"Tracker Start Combat"**, or **"Tracker End Combat"** to trigger those actions; say **"Tracker roll d20"**, **"Tracker roll two d6 plus three"**, etc. to roll dice — the 3D virtual dice animate on screen and the result appears in a toast; a pulsing amber dot shows when the mic is active; the button is hidden on unsupported browsers
- **Audio Mixer** — click the **🎚 Mixer** button in the DM header to open a full-screen, multi-channel ambient audio board; starts with 5 channels (add more via **+ Add a Channel**); each channel has an audio file picker, editable label, vertical volume fader, play/stop button, solo (S), and mute (M); a master volume fader and **Stop All** button sit in the leftmost strip; audio keeps playing in the background when the mixer is closed; channel labels and volumes are always remembered across reloads; on Chrome/Edge the selected audio files are also remembered using the File System Access API (no storage quota issues) — after a browser restart channels show **🔒 [filename]** and a single click re-grants read permission and reloads the file
- **Quick Reference** — a full-screen reference panel opened from the DM hamburger menu, organised into 17 tabs:
  - **Rules tabs** — _Actions in Combat_, _Bonus Actions_, _Movement & Position_, _Conditions_, _Concentration_, _Death Saving Throws_, _Exhaustion_, _Cover_, _Resting_, _Skills & Ability Checks_, _Spellcasting_, _Magic & Casting_ — each is a concise lookup table for the most-referenced 5e rules mid-session
  - **Name Generator** — select a race/type (Human, Elf, Dwarf, Halfling, Gnome, Orc, Tiefling, Dragonborn, Tavern, Town) and generate 10 first names and/or 10 surnames; click any name to select it (amber highlight); a strip at the bottom previews _"Party met Firstname Lastname, a Dwarf"_ and a **Save to Notes** button appends the entry to the current session's DM notes (creating a note if none exists)
  - **Weather & Travel** — pick a biome (8 options) and season (4 options); click **Generate Week** to produce a 7-day weather table with conditions across five time slots (Dawn, Morning, Midday, Afternoon, Night); the Travel Pace table dynamically adjusts movement rates by the combined biome × season multiplier with a badge showing the active modifier; a Navigation DC table is also included
  - **Shop Generator** — choose a shop type (11 options: General, Weapon, Armor, Alchemist, Magic, Jeweler, Tavern, Book, Herbalist, Fletcher, Stable) and town affluence (6 tiers: Impoverished → Opulent); click **Stock Shop** to generate a random named shop with a list of items showing three price columns (😊 Friendly −15%, 😐 Neutral base, 😠 Hostile +25%); magic items of appropriate rarity are included based on affluence; clicking any item opens a detail modal with its description; a **Save to Notes** button at the bottom appends _"The party went to [Shop Name], a common general store"_ to the current session notes
  - **Random Encounter Generator** — select biome/terrain (12 options), party size (1–8), party level (1–20), and difficulty (Easy/Medium/Hard/Deadly); click **Generate Encounter** to produce a full encounter: title, scene flavor text, archetype description, a monster list with individual XP values, a full XP breakdown strip (raw → multiplier → adjusted → per-player), actual difficulty badge, tactics note, and terrain feature; **Roll Again** re-generates with the same settings; **Add to Initiative** clears current enemies and loads the generated monsters directly into the initiative tracker, then closes the panel

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

Imported monsters appear in your enemy library tagged with their source abbreviation and carry full stat blocks viewable via the ℹ️ icon. Use the **Source** filter dropdown in the enemy panel to show only monsters from a specific book.

## User guide

An in-app guide covering all features is available at `/guide` once the dev server is running.
