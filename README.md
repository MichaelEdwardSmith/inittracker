# Initiative Tracker

A real-time D&D 5e combat tracker for DMs. The DM manages the encounter on their own screen; players watch a live viewer on any device — no accounts or installs required for players (though players can optionally sign in for a persistent account).

## Features

- **Initiative order** — drag-free, sorted automatically; advance/rewind turns with a single click; when two or more combatants share the same initiative value, ▲/▼ buttons appear on their cards to set the tiebreak order
- **Undo** — a header ↺ Undo button reverts the most recent damage/heal, condition/effect, or turn-advance action; single-level (any other action taken in between clears it), and safely ignores the DM's own SSE self-echo so it stays available as long as nothing else has changed
- **Hit points** — damage, healing, and temp HP with colour-coded HP bars (green → amber → red → grey)
- **Conditions & status effects** — all 15 standard D&D 5e conditions, four Advantage/Disadvantage markers, and a quick-pick list of common spell effects (Bless, Hex, Haste, Bane, etc., plus a freeform custom entry) from a combined "+ Condition/Spell Effect" menu; each can be applied for a set number of rounds or indefinitely; applied and removed with audio/visual cues on the player display
- **Concentration checks** — when a combatant with the Concentrating condition takes damage, a modal automatically shows the CON save DC (max(10, damage ÷ 2)); click **Success** to dismiss or **Fail** to dismiss and automatically remove the Concentrating condition
- **Death saving throws** — when a player drops to 0 HP a compact tracker appears on their DM row to record successes and failures (click each circle to toggle); 3 successes or a "Stabilize" click = Stable, 3 failures = Dead (Dead condition auto-applied); the player display replaces the HP bar with a large death saves panel that updates in real time via SSE
- **Bulk actions (AoE)** — a modal for applying one action to multiple combatants at once, with **Damage/Heal** and **Condition/Effect** tabs; per-combatant "Saved" checkbox means half damage in Damage/Heal mode, or "made their save — unaffected" in Condition/Effect mode; the Condition/Effect tab can apply any standard condition, Advantage/Disadvantage marker, quick-pick spell effect, or custom name to every selected combatant in one sync, with an optional round duration
- **Avatar preview** — click a player's avatar on their initiative card to open it full-size in a lightbox
- **Enemy library** — ~380 SRD monsters with full stat blocks (ability scores, traits, actions, artwork)
- **D&D Beyond character import** — paste a character URL or numeric ID into the Player Panel to auto-fill name, max HP, AC, DEX modifier, and passive perception; the character's portrait is imported automatically; supports both 2014 and 2024 ruleset characters (including 2024 initiative proficiency)
- **Custom monsters** — create your own enemies with name, AC, HP, CR, type, and an optional avatar
- **Bestiary import** — drop in any 5etools bestiary JSON (e.g. `bestiary-idrotf.json`) to bulk-import non-SRD monsters with full stat blocks; imported monsters are tagged with their source (e.g. `IDRotF`)
- **Encounter builder** — a dedicated modal (header → **Encounters**) for designing reusable encounter templates before combat begins; add enemies with quantities, set party size and average level, and see live XP totals and a difficulty rating (Trivial / Easy / Medium / Hard / Deadly) calculated from the D&D 5e DMG thresholds with the standard enemy-count multiplier; click **Load to Initiative** to push the whole encounter into the tracker in one click, or **Delete** to remove it from your list; encounters are saved to your account and shared across all sessions
- **Dice roller** — a dedicated modal in the header for rolling any combination of dice (d4 through d100) with adjustable quantity (1–99) and a positive or negative modifier; shows individual die results with nat-20/nat-1 highlights on d20 rolls, a dice sum + modifier breakdown, a large amber total, a Roll Again button, and a compact history of the last 5 rolls
- **Virtual 3D dice** — every roll in the app triggers a full-screen 3D physics simulation (Three.js + Cannon ES) where dice tumble across the screen with metal sound effects; the face values that come to rest are the authoritative result; fires on the Dice Roller, stat-block expressions, attack rolls, saving throws, skill checks, spell descriptions, legendary actions, Liar's Dice rolls, and voice commands; a **Disable virtual dice** checkbox in the Dice Roller modal footer switches to instant results
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
- **Liar's Dice** — click the **Liar's Dice** button in the DM header to run a full multiplayer round of the classic bluffing dice game with your party over the same live session, separate from combat: choose to Observe or Play, open a lobby, and start once 2+ players have joined; players bid on the total count of a face across everyone's hidden dice, or call **Liar!** (Dudo) / claim an exact count (Calza); ones are wild except during auto-triggered **Palifico** rounds; eliminated players (0 dice) drop out until one winner remains; every roll uses the app's 3D dice animation
- **Stream overlay** — a dedicated transparent view at `/overlay/[sessionId]` designed as an OBS/streaming browser source; shows the active combatant's portrait/HP/conditions, a scrolling combat event ticker, and an "Up Next" bar, all synced live to the DM's combat state
- **Quick Reference** — a full-screen rules-lookup panel opened from the DM hamburger menu, with 15 tabs covering the most-referenced 5e rules mid-session: _Ability Check DCs, Actions in Combat, Bonus Actions, Common Save DCs, Concentration, Conditions, Cover, Death Saving Throws, Encounter Difficulty, Exhaustion, Light & Vision, Magic & Casting, Magic Items List, Movement & Position, Resting_ — ruleset-aware (2014/2024) where relevant, with a searchable/filterable Magic Items List
- **Generators** — a full-screen hub (header → **Generators**) of 16 D&D 5e content generators, each with its own controls, live/seeded regeneration, and (for most) a "Save" list persisted to your browser:
  - **Weather & Travel** — 7-day weather table by biome/season, a dynamic travel-pace table, a Navigation DC table, and an on-demand Weather Event generator
  - **Random Encounter** — biome, party size/level, and difficulty (Easy–Deadly) drive a fully XP-budgeted combat encounter with tactics/terrain notes and one-click **Add to Initiative**
  - **Wilderness Encounter** — terrain + time-of-day driven non-combat-friendly encounters across six types (Combat, Hazard, Discovery, Flora & Fauna, Travelers, Mystery) with a complication/opportunity pair and relevant skills — narrative variety rather than a stat-blocked fight
  - **Name Generator** — first/surnames for 11 races/types plus tavern and town names, with one-click Save to Notes
  - **Town Generator** — a full settlement (size, wealth, optional keep) with named buildings, NPCs, and per-building shop inventories and floor plans (via an embedded third-party layout generator)
  - **Shop Generator** — a stocked shop for any of 11 trade types and 6 affluence tiers, with three price tiers and a "Load from Notes" history of previously visited shops
  - **Inn Generator** — a full tavern (owner, staff, food/drink menu, room rates) plus 3–6 level-scaled guest quest hooks and a true/false rumor mill
  - **Dungeon Generator** — a from-scratch Donjon-algorithm dungeon map (configurable size, corridor style, up to 9 floors, 6 themes, optional boss room) with room encounters, treasure, traps, hazards, puzzles, multi-floor stairs, one-click **Add to Initiative** per room, a manual fog-of-war map shared live to players, and Save/Load/PDF export
  - **Wizard's Tower** — a multi-floor wizard's lair with a present/absent/deceased wizard status, room-by-room magical anomalies, apprentices, and dangerous experiments scaled to party level
  - **Cult / Secret Society** — an organization's doctrine, goal and operational stage, rituals, leadership structure, and covert recognition signs
  - **Thieves' Guild** — a criminal den's layout, leadership hierarchy, fence inventory, and an expandable current job board with risk/payout/twist per job
  - **Trade Caravan** — a merchant caravan encountered on the road, with a cargo manifest (35% chance of hidden/illegal cargo), guards, a complication, and an overheard rumor
  - **Black Market** — an illicit marketplace with a broker, a situational "today's condition" event, and an inventory priced at both legal and street rates
  - **Noble House** — a heraldically-accurate noble family (shield/motto/rank), holdings, political alliances, a rival house, current scandals, succession, and reputation
  - **Graveyard / Crypt** — a burial site scaled to party size/level with layout sections, notable graves and hooks, expandable hauntings and buried-treasure hooks, and a keeper NPC
  - **NPC Generator** — a complete NPC (appearance, personality, motivation, secret, plot hook) with a full D&D 5e stat block, plus PDF export
- **Sign in with Google/Discord** — DMs and players can register or log in with email/password, Google, or Discord (in addition to anonymous guest access for both); signed-in players get a persistent account with a "Your Sessions" list for one-tap rejoining, and their account name/avatar is used as their default identity in messaging and Liar's Dice when no character is picked

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

### Optional: Google / Discord sign-in

Email/password and guest access work out of the box with no extra configuration. To enable "Continue with Google" / "Continue with Discord" for DM and player accounts, add OAuth app credentials to `.env`:

```sh
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
```

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
