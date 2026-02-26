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
8. [Conditions & Status Effects](#8-conditions--status-effects)
9. [The Player Display (Viewer Screen)](#9-the-player-display-viewer-screen)
10. [Game Sessions](#10-game-sessions)
11. [Combat Chronicles (History)](#11-combat-chronicles-history)
12. [Contact & Support](#12-contact--support)

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
- **Sessions** — opens the Session Manager modal (see [Game Sessions](#10-game-sessions))
- **Chronicle** — opens the Combat History page
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

### Armor Class Visibility

By default, enemy AC is hidden from the player display. To reveal an enemy's AC to players, check the **Show AC** checkbox on that enemy's row. Players always see their own character's AC.

---

## 8. Conditions & Status Effects

### Adding a Condition

Click the **+ Condition** button on any combatant row. A dropdown menu lists all 17 standard D&D 5e conditions:

Blinded · Charmed · Concentrating · Deafened · Dead · Exhausted · Frightened · Grappled · Incapacitated · Invisible · Paralyzed · Petrified · Poisoned · Prone · Restrained · Stunned · Unconscious

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

The **🔊 / 🔇 button** in the header toggles all sounds on or off.

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

### Deleting Records

- **Delete one**: Click the trash icon on a record card and confirm within 3 seconds
- **Delete all**: Click **Clear All** at the top of the page and confirm

---

## 12. Contact & Support

Have a question, found a bug, or want to suggest a feature? Click the **✉ Contact us** link found on the login page, the join page, and in the header of both the DM dashboard and the player display, or email us directly at **dm@inittracker.com**.
