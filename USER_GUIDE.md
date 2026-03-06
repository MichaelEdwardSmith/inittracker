# Initiative Tracker — User Guide

A real-time D&D 5e combat management tool for Dungeon Masters and players.

---

## Table of Contents

1. [Getting Started (DM)](#1-getting-started-dm)
2. [Getting Started (Players)](#2-getting-started-players)
3. [The DM Dashboard](#3-the-dm-dashboard)
4. [Managing Your Party (Players)](#4-managing-your-party-players)
5. [Managing Enemies](#5-managing-enemies)
6. [Running Combat](#6-running-combat)
7. [Hit Points, Temp HP & Armor Class](#7-hit-points-temp-hp--armor-class)
   - [Death Saving Throws](#death-saving-throws)
   - [Legendary Actions](#legendary-actions)
   - [Lair Actions](#lair-actions)
8. [Conditions & Status Effects](#8-conditions--status-effects)
9. [The Player Display (Viewer Screen)](#9-the-player-display-viewer-screen) — header actions, rolling initiative, messaging the DM, flash & audio effects
10. [Game Sessions](#10-game-sessions)
11. [Combat Chronicles (History)](#11-combat-chronicles-history)
12. [Dice Roller](#12-dice-roller)
13. [Player Messaging](#13-player-messaging)
14. [Contact & Support](#14-contact--support)

---

## 1. Getting Started (DM)

### Creating an Account

Navigate to `/register` and fill in:

- **First & Last Name**
- **Email** — your login identifier
- **Password** — minimum 8 characters
- **Confirm Password** — must match

Click **Create Account**. You will be taken directly to your DM dashboard.

### Logging In

Go to `/login`, enter your email and password, and click **Enter**. You will land on your DM dashboard, with your last active combat state restored.

### Logging Out

Click the **logout icon** (arrow pointing right) in the top-right corner of the dashboard header.

---

## 2. Getting Started (Players)

Players do **not** need an account. Your DM will give you a **6-character Session ID** (e.g. `AB3X9K`).

1. Navigate to `/join`
2. Type in the Session ID (it auto-formats to uppercase)
3. Click **Join Session**
4. You will be taken to the live **Player Display** for that session

On the display screen, tap **Join Session** to enable live audio effects, or **Continue without sound** if you prefer a silent view.

---

## 3. The DM Dashboard

The dashboard is your command center. It is divided into three panels:

| Panel | Contents |
|---|---|
| **Left sidebar** | Party (Players) |
| **Center** | Initiative Order |
| **Right sidebar** | Enemy Library |

On mobile, the sidebars are hidden behind a bottom action bar — tap **Party** or **Enemies** to open them as overlays.

### Header Bar

The header runs across the top of every screen. From left to right:

- **⚔️ Initiative Tracker** — app title
- **Session display** — shows the active session name and its 6-char public ID
  - Click the **copy icon** next to the ID to copy it to your clipboard (the icon turns into a green checkmark to confirm)
- **Messages** — shows unread player messages; opens the DM inbox
- **Dice** — opens the Dice Roller modal (see [Dice Roller](#12-dice-roller))
- **Sessions** — opens the Session Manager modal (see [Game Sessions](#10-game-sessions))
- **Chronicle** — opens the Combat History page
- **Guide** — opens the in-app user guide
- **Player Display** — opens the viewer screen in a new tab (desktop only)
- **Contact** — opens your email client to contact support
- **Logout** — ends your session

---

## 4. Managing Your Party (Players)

### Adding a Player

In the left sidebar, fill in:

- **Name**
- **AC** (Armor Class, default 10, range 1–30)
- **Max HP** (default 10)

Click **Add Player**. The player appears in the party list and is immediately available to add to the initiative order.

### Player Avatars

Each player card shows a circular avatar. Click the avatar circle to upload an image (JPEG/PNG). The image is automatically cropped to a square and resized to 256×256. To remove an avatar, hover over it and click the **✕** button that appears.

### Editing a Player

Double-click a player card, or click the **pencil icon**, to enter inline edit mode. You can change the name, AC, and max HP. Saving resets the player's HP to their new max HP. Click **Save** or **Cancel**.

### Benching a Player

If a player misses a session, click the **bench icon** on their card. The player stays in your roster but is removed from the current initiative order. A **"Benched"** label appears on their card.

To bring them back into combat, click the **+ Combat** button that appears on their benched card.

### Removing a Player

Click the **red delete button** on a player card to permanently remove them from the roster.

---

## 5. Managing Enemies

### The Enemy Library

The right sidebar contains the full D&D 5e SRD monster list (~380 creatures). Use the controls at the top to find what you need:

- **Search bar** — filters by name in real time
- **Type dropdown** — filters by monster type (Beast, Dragon, Undead, Humanoid, etc.)
- **Source dropdown** — filters by book source; shows "SRD" by default, plus any imported bestiary sources (e.g. "IDRotF")
- **Sort dropdown** — sort A–Z by name, or group by type

Each monster entry shows its name, type, CR, AC, and HP.

### Adding Enemies to Combat

1. Click a monster in the list to select it (it highlights in red)
2. A panel slides out below the list showing the monster's name and a **quantity selector**
3. Set the quantity (1–20) using the **−** and **+** buttons or by typing directly
4. Click **Add to Encounter**

When you add more than one of the same monster, they are automatically numbered (e.g., **Goblin 1**, **Goblin 2**, **Goblin 3**). Each gets a randomly rolled initiative based on its DEX modifier.

**Quick-add:** Double-click any monster to instantly add one copy without going through the quantity selector.

### Viewing a Monster's Stat Block

Click the **ℹ️ info icon** on any built-in monster (in either the library list or the initiative order) to open a full D&D stat block modal, showing:

- Size, type, alignment
- AC, HP, Speed, CR
- All six ability scores with modifiers
- Saving throws, skills, resistances, immunities, senses, languages
- Traits, actions, reactions, and legendary actions
- Monster artwork (if available) — click the image to expand or collapse it

### Custom Monsters

Click the **Custom** button at the top of the right sidebar to open the Custom Monster Manager.

**Creating a custom monster:**

1. Fill in **Name**, **AC**, **HP**, **CR**, and **Monster Type** (all required)
2. Optionally upload an **avatar image**
3. Click **Create**

Your custom monster will appear at the top of the monster list and can be used in any session. Custom monsters support the same quantity and quick-add workflows as built-in ones.

**Editing / Deleting:** Use the **pencil** and **trash** icons next to each custom monster in the manager modal.

---

## 6. Running Combat

### Setting Initiatives

Before starting, each combatant needs an initiative roll. Click the **initiative field** on any row in the center panel and type a number. Fields left blank show **—** and those combatants will sort to the bottom.

### Resolving Initiative Ties

When two or more combatants share the same initiative value, **▲/▼ buttons** appear on the left side of each tied card:

- **▲** — move this combatant above the one directly ahead of it in the tie group
- **▼** — move this combatant below the one directly behind it in the tie group

A button is dimmed and inactive when there is no same-initiative neighbour in that direction (e.g. the topmost card in a tied group has no ▲ to press). The buttons disappear entirely once no tie exists.

### Starting Combat

Once at least one combatant has an initiative set, click **Start Combat**. The combatant with the highest initiative becomes the active turn (highlighted in amber with a glowing border). The round counter starts at **1**.

### Advancing Turns

- Click **Next** to advance to the next combatant in order. When the last combatant acts, the round counter increments and the turn wraps back to the top.
- Click **Prev** to go back one turn (useful for corrections).

Dead enemies (0 HP) are automatically skipped — they are excluded from the turn rotation.

### Ending Combat

Click **End** to conclude the current combat. The encounter is automatically saved to your **Combat Chronicles** (see [section 11](#11-combat-chronicles-history)).

### Utility Buttons

| Button | What it does |
|---|---|
| **Reset Init** | Clears all initiative values and resets the round counter to 1 |
| **Reset Players** | Restores all players to max HP, removes temp HP and all conditions |
| **Clear Enemies** | Removes all enemies from the combat tracker |
| **Save** | Saves a snapshot of the current combat to Chronicles without ending it |

---

## 7. Hit Points, Temp HP & Armor Class

### Dealing Damage

On any combatant row, type an amount in the **damage field** and click **Dmg** (red). Damage is absorbed by Temporary HP first — any overflow reduces current HP. HP cannot go below 0.

### Healing

Type an amount in the damage field and click **Heal** (green). HP cannot exceed the combatant's max HP.

### Temporary HP

For **players only**, a separate Temp HP section appears on each row:

- Type an amount in the THP field and click **Set Temp HP** to assign temporary hit points
- Click the **✕** button to clear all temp HP
- Temp HP is displayed as a yellow **+X THP** badge and as a yellow bar extension on the HP bar
- Damage reduces temp HP before current HP; healing does not affect temp HP

### HP Color Coding

HP values and bars are color-coded based on the percentage of max HP remaining:

| Percentage | Color |
|---|---|
| > 50% | Green |
| 26–50% | Amber |
| 1–25% | Red |
| 0 (dead) | Grey |

### Death Saving Throws

When a **player** drops to 0 HP they are automatically marked **Unconscious**. Under D&D 5e rules, unconscious players must roll a death saving throw at the start of each of their turns: three successes means they stabilize, three failures means they die.

#### DM tracker

A **☠ Death Saves** row appears at the bottom of that player's initiative card (visible only while HP = 0):

- **Failures** (left) — three circles; filled with ☠ (red) when a failure is recorded
- **Successes** (right) — three circles; filled with ♥ (green) when a success is recorded
- Click a **filled** circle to decrement (correct a mistake); click an **empty** circle to increment
- **Stabilize** button — immediately marks the player as stable without needing three successes (use for a healer spending a bonus action, Medicine check, etc.)
- **reset** link (top-right of the row) — clears all saves back to 0/0 for corrections

When the player accumulates **3 failures**, a red **☠ Dead** banner replaces the circles and the **Dead** condition is automatically applied. When they reach **3 successes** or you click Stabilize, a green **♥ Stable** banner is shown instead.

#### Player display

While a player is at 0 HP, the HP bar on the viewer screen is replaced with a large **Death Saving Throws panel**:

- Two columns: **Failures** (red, skull circles) and **Successes** (green, heart circles)
- Circles update in real time as the DM records each roll
- If the player dies, the panel shows a large red **☠ DEAD** banner
- If stable, a large green **♥ STABILIZED** banner is shown

The panel is read-only for players — only the DM can record the rolls.

#### Healing an unconscious player

If a player at 0 HP receives any healing (from a spell, potion, or the DM's Heal button), their HP rises above 0, the Unconscious condition is cleared, and the death saves tracker is reset automatically. The HP bar returns to the player display.

#### Reset Players

Clicking **Reset Players** in the initiative order header also clears death saves on all players, restoring everyone to max HP for the next encounter.

---

### Concentration Checks

When any combatant with the **Concentrating** condition takes damage, a **Concentration Check** modal appears automatically showing:

- The combatant's name and the damage taken
- The **CON Save DC** — the higher of 10 or half the damage taken (per PHB rules)

Two buttons resolve the check:

- **Success** — closes the modal; the Concentrating condition remains
- **Fail** — closes the modal and automatically removes the Concentrating condition from that combatant

This works for both players and enemies.

---

### Legendary Actions

Enemies that have legendary actions (e.g. dragons, liches, and other powerful monsters) automatically show a **Legendary Actions** row on their initiative card. This row only appears when the creature's stat block includes legendary action data.

**The dot tracker:**

Three amber dots represent the three legendary action uses available each round. Filled dots (●) are available; hollow dots (○) are spent.

- Click any filled dot to spend down to that point — for example, clicking the rightmost dot spends one action
- Click any hollow dot to restore actions from that position onward
- All dots automatically refill at the **start of that creature's turn**

**Viewing the action options:**

Click the **ℹ️ icon** beside the dots to open a modal showing the full text of the creature's legendary actions — what each option costs and what it does — as a quick reference while running the encounter.

> **Note:** Legendary actions only appear on enemies that have a full stat block with legendary actions listed (built-in SRD monsters and bestiary imports). Custom monsters created manually do not include a stat block and will not show this row.

---

### Lair Actions

Some powerful creatures (dragons, beholders, and other legendary monsters) can take **lair actions** — special effects that occur on initiative count 20. You can add a dedicated **Lair Actions** card to the initiative order for any enemy.

**Adding a lair card:**

1. Find the enemy's card in the initiative order
2. Click the **building icon** (🏢) in the card header — it appears between the info button and the notes button, and is only visible when no lair card already exists for that creature
3. A purple **Lair Actions** card is immediately added to the initiative at count 20

**How it works:**

- The lair card has a purple border and a **LAIR** badge, and shows the creature's name for reference
- It participates in the normal turn order — when initiative count 20 is reached, the card is highlighted just like any other combatant's turn, prompting you to resolve the lair action
- Only one lair card can exist per creature template at a time; the building icon disappears once a lair card has been added
- When the **last remaining instance** of a creature is removed from combat, its lair card is automatically removed as well

**Removing a lair card:**

Click the **✕** button on the lair card at any time to dismiss it manually.

**On the player display:**

The lair card appears in the player-facing initiative list and active-turn display with purple styling and a "LAIR" label so players know when lair actions are resolving.

---

### Armor Class Visibility

By default, enemy AC is hidden from the player display. To reveal an enemy's AC to players, check the **Show AC** checkbox on that enemy's row. Players always see their own character's AC.

---

## 8. Conditions & Status Effects

### Adding a Condition

Click the **+ Condition** button on any combatant row. A dropdown menu lists 15 conditions:

Blinded · Charmed · Concentrating · Deafened · Exhausted · Frightened · Grappled · Incapacitated · Invisible · Paralyzed · Petrified · Poisoned · Prone · Restrained · Stunned

> **Note:** Dead and Unconscious are not in the selectable list. When a **player** reaches 0 HP, they automatically become Unconscious (all other conditions are cleared) and a death saving throw tracker appears on their row — see [Death Saving Throws](#death-saving-throws). Enemies at 0 HP are simply removed from the turn order.

Click any condition to apply it. Conditions already active are hidden from the list.

### Viewing a Condition Description

Each active condition badge has a small **ⓘ info icon** on its right edge. Clicking it opens a modal with the condition's name and a summary of its mechanical effects (e.g. what saves it imposes, what it prevents, etc.). This works on both the DM dashboard and the Player Display.

### Removing a Condition

On the **DM screen**, click the condition name portion of the badge to remove it immediately. The info icon and the remove action are separate — clicking the ⓘ only opens the description, it does not remove the condition.

Conditions are displayed as color-coded badges on both the DM dashboard and the live player display. Condition changes trigger a visual flash and audio cue on the viewer screen.

---

## 9. The Player Display (Viewer Screen)

The viewer screen at `/display/[sessionId]` is the public-facing display your players watch during combat. It updates in real time via a live connection to the server — no refreshing needed.

### Sharing the Session

Give your players the **6-character Session ID** shown in your dashboard header (or click **Player Display** to open it yourself). Players navigate to `/join`, enter the ID, and are taken directly to the viewer.

### Join Gate

When a player first opens the viewer, an overlay asks them to tap **Join Session**. This is required by browsers before playing audio. Choosing **Continue without sound** skips audio entirely.

### Header Bar

The viewer header contains several actions. On **desktop** they are always visible; on **mobile** they are collapsed behind a **☰ hamburger button** on the right — tap it to expand the menu.

| Action | Description |
|---|---|
| **🔊 / 🔇** | Toggle all sound effects on or off |
| **Message DM** | Send a private message to the DM (appears when party members exist) |
| **Roll Initiative** | Roll your character's initiative and submit it to the tracker (appears when party members exist) |
| **Contact** | Opens your email client to contact support |
| **⛶ Fullscreen** | Toggles fullscreen mode — ideal for a TV or projector |

### What Players See

**When combat is not active:**
- A large sword icon with "Awaiting Combat"
- A list of all combatants with their initiative rolls (if set)

**When combat is active, the screen shows:**

- A **type badge** ("PLAYER CHARACTER" or "ENEMY") with gradient dividers
- The combatant's **avatar** (player photo or monster artwork/emoji) in a glowing circular frame
- The combatant's **name** in large responsive text with a colored glow
- A **stats row**: Initiative · Armor Class · Hit Points (players only)
- An **HP bar** (players only) with color coding and a yellow temp HP extension
- Any **active conditions** as color-coded badges
- An **"Up Next"** strip at the bottom showing the next 1–4 combatants in order

The background subtly glows blue during a player's turn and red during an enemy's turn.

### Rolling Initiative (Players)

If the DM has added player characters to the tracker, a **Roll Initiative** button appears in the header (or in the hamburger menu on mobile).

1. Click **Roll Initiative**
2. Select your **character** from the dropdown
3. Choose a **roll mode**: Normal, Advantage, or Disadvantage
4. Click **Roll d20** (or **Roll 2d20** for advantage/disadvantage) — the result is shown with per-die values
5. If your character has a DEX modifier set, it is applied automatically and shown
6. Click **Submit Initiative** to send your roll to the DM's tracker

The roll is immediately reflected in the DM's initiative order.

### Messaging the DM

Click **Message DM** in the header (or hamburger menu on mobile) to open the message composer.

1. Select your **character name** from the dropdown
2. Type your message
3. Click **Send Message**

A confirmation appears briefly, then the modal closes. The DM sees a live unread count badge on their Messages button and can read the full inbox at any time.

### Flash Effects

Combat events trigger a brief full-screen color flash:

| Event | Flash Color |
|---|---|
| Damage taken | Red |
| HP restored | Green |
| Condition applied | Condition's color |

### Audio Effects

All sounds are procedurally generated (no audio files required):

| Event | Sound |
|---|---|
| Damage | Low thud sweep |
| Heal | Ascending magical chime |
| Condition | Resonant bell tone |
| Temp HP granted | Bright shield shimmer |
| Combat begins | Urgent war-horn fanfare |
| Combat ends | Triumphant brass fanfare |
| Turn advances | Sword whoosh |

The **🔊 / 🔇 button** in the header (or hamburger menu) toggles all sounds on or off.

### Connection Status

A small dot in the header shows the live connection state:

- **Green dot · Live** — receiving updates normally
- **Grey dot · Connecting…** — reconnecting (automatic, no action needed)

---

## 10. Game Sessions

Each DM account can have multiple independent **game sessions** — useful if you run more than one campaign or want to separate one-shots from your main campaign.

### What a Session Contains

- Its own 6-character **public ID** (shared with players)
- A user-defined **name**
- An independent **combat state** (combatants, HP, turn order)
- Its own **combat history**

### Opening the Session Manager

Click the **Sessions** button (≡ icon) in the dashboard header.

### Switching Sessions

Click any session in the list to switch to it. The dashboard reloads with that session's combat state and the header updates to show the new session's name and ID. Players need to use the new session's ID to connect.

### Creating a New Session

1. Click **New Session** at the bottom of the modal
2. Type a name (or leave blank for a default like "Session 2")
3. Click **Create**

### Renaming a Session

Click the **pencil icon** next to any session. Edit the name inline and press **Enter** to save, or **Escape** to cancel.

### Deleting a Session

Click the **trash icon** next to a session. A **"Sure?"** confirmation button appears — click it again to confirm. You cannot delete your last remaining session.

---

## 11. Combat Chronicles (History)

The **Chronicle** page (`/history`) keeps a permanent record of every completed combat encounter.

### How Records Are Created

- **End Combat** — automatically saves the full encounter to history
- **Save** button — creates a manual snapshot of the current combat without ending it (useful for long sessions)

### Reading a Combat Record

Each record card shows:

- **Encounter number** in Roman numerals
- **Enemy roster** — names of all enemies in the encounter (up to 3, with "+X more" if additional)
- **Date, time, and duration**
- **Summary stats**: rounds, number of players, casualties, total events logged

**Participants grid** shows every combatant with:
- Their type (PC or NPC)
- Starting HP → final HP / max HP as a dual-layer bar
- A **☠ Slain** label for any who died

### Reading the Event Log

Click **Show Chronicle** on any record to expand the detailed event log. Events are grouped by round and show:

- ⚔ **Damage** — who dealt it, to whom, amount, before/after HP
- ♥ **Heal** — who healed whom, amount, before/after HP
- ✦ **Condition added** — who inflicted which condition on whom
- ✧ **Condition removed** — which condition was lifted
- ☠ **Death** — when a combatant was knocked out or slain

Click **Hide Chronicle** to collapse the log.

### Exporting a Record to PDF

Click the **download icon** button on any record card header to generate and download a PDF of that encounter. The button shows a spinner while it prepares; the download begins automatically once the PDF is ready.

The PDF contains:
- A header with the encounter number (Roman numerals), date, time, and duration
- A stats row — rounds, number of players, casualties, and total XP (if applicable)
- A participants table with starting HP, final HP, damage dealt, healing done, and outcome (Survived / Slain)
- An XP breakdown table per slain enemy with CR and XP values, plus an even-split total (if any slain enemies had a CR set)
- The full round-by-round event log, paginating automatically if the encounter was long

Files are saved as `encounter-XVIII-2025-01-15.pdf` (Roman-numeral encounter number + ISO date).

### Deleting Records

- **Delete one**: Click the trash icon on a record card and confirm within 3 seconds
- **Delete all**: Click **Clear All** at the top of the page and confirm

---

## 12. Dice Roller

Click the **Dice** button (cube icon) in the dashboard header to open the Dice Roller modal. It is available at any time — in or out of combat.

### Controls

| Control | Description |
|---|---|
| **Die type** | Seven buttons: d4, d6, d8, d10, d12, d20, d100. The selected die is highlighted amber. |
| **Quantity** | How many dice to roll (1–99). Use the **−** / **+** buttons or type directly. |
| **Modifier** | A flat bonus or penalty added to the dice sum (−99 to +99). Color-coded green (positive) or red (negative). |

An expression preview (e.g. `2d6 + 3`) updates live above the **Roll** button so you can confirm your selection before rolling.

### Rolling

Click **Roll** to execute. The result panel shows:

- **Individual die tiles** — one tile per die rolled. On a d20, a natural **20** glows amber and a natural **1** glows red.
- **Dice sum + modifier** — shown when a modifier is set, breaking down the raw sum and the adjustment separately.
- **Total** — the final result in large amber text.
- **Roll Again** — re-rolls the same die type, quantity, and modifier immediately.

### Roll History

The last **5 rolls** are listed below the result in a compact log showing the expression (e.g. `2d6+3`), the individual values, and the total. The most recent roll is fully opaque; older entries are dimmed.

---

## 13. Player Messaging

Players on the viewer screen can send a private message directly to the DM — useful for asking questions, flagging something, or communicating without leaving the display. Messages are visible only to the DM and are not persisted between server restarts.

### Sending a Message (Player)

1. Click the **✉ Message DM** button in the viewer header
2. Select which **party member** you are from the dropdown
3. Type your message
4. Click **Send Message** — the modal closes and the message is delivered instantly

### Receiving Messages (DM)

The **Messages** button in the dashboard header shows an amber badge with the unread count when new messages arrive. On mobile the same badge appears on the hamburger menu button.

### Reading the Inbox

Click **Messages** to open the inbox. Messages are listed newest-first, each showing the sender's name, the time received, and the full message text. Opening the inbox marks all messages as read.

### Clearing Messages

Click **Clear all** in the inbox header to delete all messages for the current session.

---

## 14. Contact & Support

Have a question, found a bug, or want to suggest a feature? Click the **✉ Contact us** link found on the login page, the join page, and in the header of both the DM dashboard and the player display, or email us directly at **dm@inittracker.com**.
