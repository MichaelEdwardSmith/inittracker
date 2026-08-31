# Initiative Tracker — User Guide

A real-time D&D 5e combat management tool for Dungeon Masters and players.

---

## Table of Contents

1. [Getting Started (DM)](#1-getting-started-dm)
2. [Getting Started (Players)](#2-getting-started-players)
3. [The DM Dashboard](#3-the-dm-dashboard)
4. [Managing Your Party (Players)](#4-managing-your-party-players)
   - [Importing from D&D Beyond](#importing-from-dd-beyond)
   - [Leveling Up a Player](#leveling-up-a-player)
5. [Managing Enemies](#5-managing-enemies)
6. [Running Combat](#6-running-combat)
   - [Undo](#undo)
   - [Bulk Actions (AoE)](#bulk-actions-aoe)
7. [Hit Points, Temp HP & Armor Class](#7-hit-points-temp-hp--armor-class)
   - [Death Saving Throws](#death-saving-throws)
   - [Legendary Actions](#legendary-actions)
   - [Lair Actions](#lair-actions)
8. [Conditions & Status Effects](#8-conditions--status-effects)
9. [The Player Display (Viewer Screen)](#9-the-player-display-viewer-screen) — header actions, rolling initiative, messaging the DM, flash & audio effects
10. [Game Sessions](#10-game-sessions)
11. [Combat Chronicles (History)](#11-combat-chronicles-history)
12. [Dice Roller](#12-dice-roller)
13. [Encounter Builder](#13-encounter-builder)
14. [Spell Reference](#14-spell-reference)
15. [Player Messaging](#15-player-messaging)
16. [Quick Reference](#16-quick-reference)
17. [Generators](#17-generators)
    - [Weather & Travel](#171-weather--travel)
    - [Random Encounter](#172-random-encounter)
    - [Wilderness Encounter](#173-wilderness-encounter)
    - [Name Generator](#174-name-generator)
    - [Town Generator](#175-town-generator)
    - [Shop Generator](#176-shop-generator)
    - [Inn Generator](#177-inn-generator)
    - [Dungeon Generator](#178-dungeon-generator)
    - [Wizard's Tower](#179-wizards-tower)
    - [Cult / Secret Society](#1710-cult--secret-society)
    - [Thieves' Guild](#1711-thieves-guild)
    - [Trade Caravan](#1712-trade-caravan)
    - [Black Market](#1713-black-market)
    - [Noble House](#1714-noble-house)
    - [Graveyard / Crypt](#1715-graveyard--crypt)
    - [NPC Generator](#1716-npc-generator)
18. [Liar's Dice](#18-liars-dice)
19. [Stream Overlay](#19-stream-overlay)
20. [Voice Commands _(Beta)_](#20-voice-commands-beta)
21. [Audio Mixer](#21-audio-mixer)
22. [Contact & Support](#22-contact--support)

---

## 1. Getting Started (DM)

### Creating an Account

Navigate to `/register` and either fill in the email/password form (**First & Last Name**, **Email**, **Password** — minimum 8 characters, **Confirm Password**), or click **Continue with Google** to sign up with your Google account instead. Click **Create Account** (or complete the Google flow). You will be taken directly to your DM dashboard.

### Logging In

Go to `/login` and sign in one of three ways:

- **Email and password** — enter your credentials and click **Enter**
- **Continue with Google**
- **Continue with Discord**

All three land you on your DM dashboard with your last active combat state restored. If you just want to try the app, click **Enter as Guest** on the login page — you'll get a temporary DM account with no email/password required.

### Logging Out

Click the **logout icon** (arrow pointing right) in the top-right corner of the dashboard header.

---

## 2. Getting Started (Players)

Players do **not** need an account — a **6-character Session ID** (e.g. `AB3X9K`) from your DM is enough:

1. Navigate to `/join`
2. Type in the Session ID (it auto-formats to uppercase)
3. Click **Continue as Guest**
4. You will be taken to the live **Player Display** for that session

### Optional: Player Accounts

If you'd rather not retype the Session ID every session, you can sign in on `/join` via the "sign in for a better experience" section (**Continue with Google**, **Continue with Discord**, or an email/password account at `/player/register` / `/player/login`). Signed-in players get:

- A **"Your Sessions"** list on `/join` for one-tap rejoining of any session you've previously joined
- A persistent display name/avatar (pulled from your Google/Discord profile, or set at registration) used as your default identity in DM messaging and Liar's Dice whenever you haven't picked a specific in-game character
- A **"Not you? Sign out"** link if you need to switch accounts

Signing in is entirely optional — the classic "type the code, join as guest" flow still works exactly as before.

### The Join Gate

On the display screen, tap **Join Session** to enable live audio effects, or **Continue without sound** if you prefer a silent view.

---

## 3. The DM Dashboard

The dashboard is your command center. It is divided into three panels:

| Panel             | Contents         |
| ----------------- | ---------------- |
| **Left sidebar**  | Party (Players)  |
| **Center**        | Initiative Order |
| **Right sidebar** | Enemy Library    |

On mobile, the sidebars are hidden behind a bottom action bar — tap **Party** or **Enemies** to open them as overlays. All header actions below are also reachable from a **☰ hamburger menu** on small screens.

### Header Bar

The header runs across the top of every screen. Its actions include:

- **⚔️ Initiative Tracker** — app title
- **Session display** — shows the active session name and its 6-char public ID; click the **copy icon** next to the ID to copy it to your clipboard (the icon turns into a green checkmark to confirm)
- **Guide** — opens the in-app user guide
- **Messages** — shows unread player messages; opens the DM inbox
- **Notes** — opens the current session's DM notes
- **Dice Roller** — opens the Dice Roller modal (see [Dice Roller](#12-dice-roller))
- **Liar's Dice** — starts or joins a Liar's Dice game (see [Liar's Dice](#18-liars-dice))
- **Spells** — opens the Spell Reference (see [Spell Reference](#14-spell-reference))
- **Voice** _(Chrome/Edge only)_ — enables hands-free voice commands (see [Voice Commands](#20-voice-commands-beta))
- **Mixer** — opens the Audio Mixer (see [Audio Mixer](#21-audio-mixer))
- **Quick Reference** — opens the rules-lookup panel (see [Quick Reference](#16-quick-reference))
- **Generators** — opens the content-generator hub (see [Generators](#17-generators))
- **Encounters** — opens the Encounter Builder (see [Encounter Builder](#13-encounter-builder))
- **Sessions** — opens the Session Manager modal (see [Game Sessions](#10-game-sessions))
- **History** — opens the Combat Chronicle page
- **Player Display** — opens the viewer screen in a new tab (desktop only)
- **Contact** — opens your email client to contact support
- **Logout** — ends your session

---

## 4. Managing Your Party (Players)

### Adding a Player

Click **+ Add Player** to open the add-player popup. It offers two ways to add a player: **Manual** entry or **D&D Beyond** import. Click the tab at the top of the popup to switch between them. The popup stays open after each add, so you can add your whole party in one go — close it with the **✕**, **Escape**, or by clicking outside it.

**Manual:**

Fill in:

- **Name**
- **Level** (default 1, range 1–20)
- **AC** (Armor Class, default 10, range 1–30)
- **Max HP** (default 10)

Click **Add Player**. The player appears in the party list and is immediately available to add to the initiative order.

### Importing from D&D Beyond

If your players have characters on D&D Beyond, you can import them directly instead of entering stats manually.

> **Requirement:** The character sheet must be set to **Public** on D&D Beyond (Character Settings → Privacy → Public).

1. Click the **D&D Beyond** tab at the top of the add-player popup
2. Paste a character URL (e.g. `https://www.dndbeyond.com/characters/39615915`) or just the numeric character ID
3. Click **Fetch** — the tracker contacts D&D Beyond and parses the character sheet
4. A preview card appears showing the imported values:
   - **Name**
   - **Level** — total character level across all classes
   - **Max HP** — calculated from hit dice, CON modifier, and any bonuses
   - **AC** — derived from equipped armor, shield, class features, feats, and magic items
   - **DEX mod** — includes 2024 initiative proficiency if the character uses 2024 rules
   - **Passive Perception** — includes proficiency or expertise if applicable
5. Click **Add Player** on the preview card to add them to the roster

The character's **D&D Beyond portrait** is imported automatically and set as their avatar.

> **Tip:** If Fetch returns an error, check that the character's privacy is set to Public in D&D Beyond's Character Settings.

### Player Avatars

Each player card shows a circular avatar. Click the avatar circle to upload an image (JPEG/PNG). The image is automatically cropped to a square and resized to 256×256. To remove an avatar, hover over it and click the **✕** button that appears.

On the initiative order (the DM's center panel), clicking a player's avatar opens it full-size in a lightbox preview — click outside the image, press **Escape**, or click the **✕** to close it.

### Editing a Player

Double-click a player card, or click the **pencil icon**, to enter inline edit mode. You can change the name, AC, and max HP. Saving resets the player's HP to their new max HP. Click **Save** or **Cancel**.

### Leveling Up a Player

Click **⬆ Level Up** below the add-player form to open a wizard that steps through the party one player at a time. Each step shows that player's current stats and lets you enter their new **Level**, **AC**, **Max HP**, **DEX modifier**, and **Passive Perception**. Raising Max HP carries the gain over to current HP rather than fully healing the player. Click **Save & Next** to move on — changes save as you go, so closing partway through keeps whatever you've already stepped past. Use **← Back** to revisit the previous player.

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

Once at least one combatant has an initiative set, click **Start Combat**. The combatant with the highest initiative becomes the active turn (highlighted in amber with a glowing border), the tracker auto-scrolls to bring them into view, and the round counter starts at **1**.

### Advancing Turns

- Click **Next** to advance to the next combatant in order. When the last combatant acts, the round counter increments and the turn wraps back to the top.
- Click **Prev** to go back one turn (useful for corrections).

Both buttons auto-scroll the tracker to keep the active combatant in view. Dead enemies (0 HP) are automatically skipped — they are excluded from the turn rotation.

### Ending Combat

Click **End** to conclude the current combat. The encounter is automatically saved to your **Combat Chronicles** (see [section 11](#11-combat-chronicles-history)).

### Utility Buttons

| Button            | What it does                                                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **↺ Undo**        | Reverts the most recent damage/heal, condition/effect, or turn change (see [Undo](#undo))                                   |
| **AoE**           | Opens the bulk-action modal for damage, healing, conditions, or spell effects (see [Bulk Actions (AoE)](#bulk-actions-aoe)) |
| **Reset Init**    | Clears all initiative values and resets the round counter to 1                                                              |
| **Reset Players** | Restores all players to max HP, removes temp HP and all conditions                                                          |
| **Clear Enemies** | Removes all enemies from the combat tracker                                                                                 |
| **Save**          | Saves a snapshot of the current combat to Chronicles without ending it                                                      |

### Undo

The **↺ Undo** button in the initiative order toolbar reverts the most recent action from this list: a damage/heal, a condition/spell-effect change, a temp HP change, a death-save update, or a turn advance/rewind. It's greyed out when there's nothing to undo.

Undo keeps the last **5** actions — clicking it repeatedly walks back through each one in turn. Taking any other action clears the whole undo history, so you can't reach further back than your most recent unbroken streak of undoable actions. The button stays available across the DM dashboard's own live-update echo of your last change (so it doesn't flicker unavailable a moment after you act), but it does clear if a genuinely different external change comes in first — e.g. a player rolling their own initiative on the viewer screen.

### Bulk Actions (AoE)

Click **AoE** in the initiative order toolbar to open a modal for applying one action to several combatants at once — handy for fireballs, auras, or any effect that hits the whole party or a whole group of enemies. The modal has two tabs:

**Damage / Heal tab:**

1. The combatant list shows every active combatant (benched players and lair cards are excluded) with checkboxes — all are selected by default; click a row to deselect it
2. Check **Saved** on any combatant who made a saving throw for half damage
3. Type an **Amount**, then click **− Damage** or **+ Heal** to apply it to every selected, un-saved combatant at once (saved combatants take half, rounded per the usual damage rules) in a single sync
4. Any concentration checks triggered by the damage are queued and shown after the modal closes, just like single-target damage

**Condition / Effect tab:**

1. Same combatant checklist, but the **Saved** column now means "made their save — unaffected," excluding that combatant from the effect
2. Choose a condition from the dropdown — any of the 15 standard conditions, the four Advantage/Disadvantage markers, a spell effect from the quick-pick list, or **Custom…** to type a freeform name
3. Optionally set a number of **Rounds** for the effect to last (leave blank for indefinite)
4. Click **Apply** to add it to every selected, un-saved combatant in one sync; combatants who already have that status are silently skipped rather than having it toggled off

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
| ---------- | ----- |
| > 50%      | Green |
| 26–50%     | Amber |
| 1–25%      | Red   |
| 0 (dead)   | Grey  |

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

This works for both players and enemies, including when the damage is applied through the [Bulk Actions (AoE)](#bulk-actions-aoe) modal.

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

### Adding a Condition or Spell Effect

Click the **+ Condition/Spell Effect** button on any combatant row. A dropdown menu lists:

- **Conditions** — the 15 standard conditions: Blinded · Charmed · Concentrating · Deafened · Exhausted · Frightened · Grappled · Incapacitated · Invisible · Paralyzed · Petrified · Poisoned · Prone · Restrained · Stunned
- **Adv / Disadv** — the four Advantage/Disadvantage markers (Advantage For, Advantage Against, Disadvantage For, Disadvantage Against)
- **Spell Effects** — a quick-pick list of common buffs/debuffs (Bless, Bane, Haste, Slow, Hunter's Mark, Hex, Mage Armor, Barkskin, and more)
- **Custom** — a text field at the bottom of the menu for any other spell or effect name (up to 50 characters); type a name and click **Add** or press **Enter**

> **Note:** Dead and Unconscious are not in the selectable list. When a **player** reaches 0 HP, they automatically become Unconscious (all other conditions are cleared) and a death saving throw tracker appears on their row — see [Death Saving Throws](#death-saving-throws). Enemies at 0 HP are simply removed from the turn order.

Click any condition or spell effect to apply it. Conditions/effects already active on that combatant are hidden from the list (except the custom field, which is always available). If you set a number of rounds in the timing prompt, the effect is automatically removed once that many rounds have elapsed; leave it blank for an indefinite effect you remove manually.

Standard conditions and Adv/Disadv markers are styled as grey badges; spell effects (whether from the quick-pick list or typed as custom) are styled as fuchsia badges to visually distinguish "official condition" from "tracked spell/buff."

### Viewing a Condition or Spell Effect Description

Each active badge has a small **ⓘ info icon** on its right edge. Clicking it opens a modal with the name and a summary of its mechanical effects — for standard conditions this is the rules text (e.g. what saves it imposes, what it prevents); for the built-in quick-pick spell effects it's a short mechanical summary (e.g. Bless: "Add 1d4 to attack rolls and saving throws while concentrating"); for a freeform custom name with no known description it shows "No description available." The modal labels the badge **"Condition"** or **"Spell Effect"** depending on which it is. This works on both the DM dashboard and the Player Display.

### Removing a Condition or Spell Effect

On the **DM screen**, click the name portion of the badge to remove it immediately. The info icon and the remove action are separate — clicking the ⓘ only opens the description, it does not remove the condition.

Conditions and spell effects are displayed as color-coded badges on both the DM dashboard and the live player display. Changes trigger a visual flash and audio cue on the viewer screen.

### Applying to Multiple Combatants at Once

To apply the same condition or spell effect to several combatants in one action (e.g. a fireball's Frightened save, or a party-wide Bless), use the **Condition / Effect** tab of the [Bulk Actions (AoE)](#bulk-actions-aoe) modal instead of adding it one row at a time.

---

## 9. The Player Display (Viewer Screen)

The viewer screen at `/display/[sessionId]` is the public-facing display your players watch during combat. It updates in real time via a live connection to the server — no refreshing needed.

### Sharing the Session

Give your players the **6-character Session ID** shown in your dashboard header (or click **Player Display** to open it yourself). Players navigate to `/join`, enter the ID, and are taken directly to the viewer.

### Join Gate

When a player first opens the viewer, an overlay asks them to tap **Join Session**. This is required by browsers before playing audio. Choosing **Continue without sound** skips audio entirely.

### Header Bar

The viewer header contains several actions. On **desktop** they are always visible; on **mobile** they are collapsed behind a **☰ hamburger button** on the right — tap it to expand the menu.

| Action              | Description                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| **🔊 / 🔇**         | Toggle all sound effects on or off                                                               |
| **Message DM**      | Send a private message to the DM (appears when party members exist)                              |
| **Roll Initiative** | Roll your character's initiative and submit it to the tracker (appears when party members exist) |
| **Liar's Dice**     | Join and play a Liar's Dice game the DM has started (appears once a game is active)              |
| **Contact**         | Opens your email client to contact support                                                       |
| **⛶ Fullscreen**    | Toggles fullscreen mode — ideal for a TV or projector                                            |

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
- Any **active conditions and spell effects** as color-coded badges
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

A confirmation appears briefly, then the modal closes. The DM sees a live unread count badge on their Messages button and can read the full inbox at any time. If you're signed in with a player account, your account's display name is used as a fallback identity anywhere a character name would otherwise be shown.

### Flash Effects

Combat events trigger a brief full-screen color flash:

| Event             | Flash Color       |
| ----------------- | ----------------- |
| Damage taken      | Red               |
| HP restored       | Green             |
| Condition applied | Condition's color |

### Audio Effects

All sounds are procedurally generated (no audio files required):

| Event           | Sound                    |
| --------------- | ------------------------ |
| Damage          | Low thud sweep           |
| Heal            | Ascending magical chime  |
| Condition       | Resonant bell tone       |
| Temp HP granted | Bright shield shimmer    |
| Combat begins   | Urgent war-horn fanfare  |
| Combat ends     | Triumphant brass fanfare |
| Turn advances   | Sword whoosh             |

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

| Control      | Description                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| **Die type** | Seven buttons: d4, d6, d8, d10, d12, d20, d100. The selected die is highlighted amber.                      |
| **Quantity** | How many dice to roll (1–99). Use the **−** / **+** buttons or type directly.                               |
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

### Virtual Dice

By default, every roll triggers a full-screen 3D physics animation — dice tumble across the screen with metal sound effects, and the face values that come to rest are the authoritative result. The result panel only appears once the dice have settled.

Virtual dice fire on **every roll surface in the app**:

- The Dice Roller modal
- Clickable dice expressions in monster stat blocks (damage rolls, attack rolls, saving throws, skill checks)
- Clickable dice in spell descriptions
- Legendary action dice and attack rolls
- Liar's Dice rolls
- Voice command dice rolls ("Tracker roll d20", etc.)

**Disabling virtual dice:** A **Disable virtual dice** checkbox at the bottom of the Dice Roller modal switches to instant results with no animation. The preference is saved between sessions. When disabled, all rolls across the entire app return to instant results.

---

## 13. Encounter Builder

Click the **Encounters** button (clipboard icon) in the dashboard header to open the Encounter Builder modal. Use it to plan combat encounters before adding anything to the initiative order.

### Party Context

At the top of the modal, two small inputs let you set the **Party size** (number of players) and **Level** (average party level). These affect the difficulty display for all encounters in the list and for the builder preview. They are not persisted — adjust them each session as needed.

### Saved Encounters List

All saved encounters are shown as cards. Each card displays:

- **Name** — the encounter's title
- **Difficulty badge** — Trivial / Easy / Medium / Hard / Deadly based on adjusted XP vs. the D&D 5e DMG thresholds for the current party size and level
- **XP total** — the adjusted XP value (raw XP × the standard D&D 5e enemy-count multiplier)
- **Enemy summary** — each enemy group listed as `2× Goblin, 1× Hobgoblin`, etc.

Two buttons appear on each card:

| Button                 | What it does                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **Load to Initiative** | Adds all enemies in the encounter to the active initiative tracker and closes the modal |
| **Delete**             | Permanently removes the encounter from your account                                     |

### Building a New Encounter

Click **New Encounter** to expand the builder form.

1. **Encounter Name** — type a descriptive name (e.g. _Goblin Ambush_)
2. **Add Enemy** — type in the search box to filter the full enemy library (built-in SRD monsters + your custom monsters); click a result to select it
3. Set a **quantity** in the number input beside the search box
4. Click **Add** — the enemy group appears in the staging list below; adding the same monster again increases its quantity
5. Remove any staged enemy with the **✕** button on its row
6. The **live preview** below the staging list updates automatically:
   - **Total XP** — adjusted XP for the staged enemies
   - **Difficulty badge** — based on the party size and level inputs at the top of the modal
7. Click **Save Encounter** to persist it to your account

> **Tip:** Encounters are stored at the account level and are available in every game session — build your library once and reuse it across campaigns. You can also generate a ready-made encounter with the [Random Encounter](#172-random-encounter) or [Wilderness Encounter](#173-wilderness-encounter) generators and send it straight to the tracker with **Add to Initiative**.

### Difficulty Calculation

XP and difficulty follow the D&D 5e DMG rules:

- **Raw XP** — the sum of each enemy's standard XP value (from the CR table) multiplied by its quantity
- **Adjusted XP** — raw XP × a multiplier based on total enemy count (×1 for 1 enemy, ×1.5 for 2, ×2 for 3–6, ×2.5 for 7–10, etc.)
- **Thresholds** — adjusted XP is compared to the party's Easy / Medium / Hard / Deadly thresholds (per-level values from the DMG × number of players)

| Badge       | Meaning              |
| ----------- | -------------------- |
| **Trivial** | Below Easy threshold |
| **Easy**    | At or above Easy     |
| **Medium**  | At or above Medium   |
| **Hard**    | At or above Hard     |
| **Deadly**  | At or above Deadly   |

---

## 14. Spell Reference

Click the **Spells** button in the dashboard header to open the Spell Reference modal. It is available at any time — in or out of combat.

### Layout

The modal is split into two panels:

| Panel     | Contents                                           |
| --------- | -------------------------------------------------- |
| **Left**  | Search bar, filters, and the scrollable spell list |
| **Right** | Full spell card for the selected spell             |

### Searching and Filtering

- **Search bar** — filters the list by name in real time
- **Level dropdown** — filters by spell level: All Levels, Cantrip, 1st through 9th
- **School dropdown** — filters by school of magic (Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, Transmutation)
- **Class dropdown** — filters by class (Artificer, Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Warlock, Wizard)

Each spell in the list shows its name and a level badge — **C** for cantrips, **1–9** for leveled spells. Click any spell to open its card in the right panel.

### Spell Card

The right panel shows:

- **Name** — in violet
- **Level and school** — e.g. "3rd-level spell · Evocation"
- **Source badge** — the book the spell comes from (e.g. PHB)
- **Ritual badge** — shown when the spell can be cast as a ritual
- **Info grid**: Casting Time · Range · Components · Duration
- **Description** — full spell text
- **At Higher Levels** — shown when applicable (amber-bordered section)
- **Available to** — the classes that can learn the spell

### Clickable Dice

Dice expressions inside spell descriptions (e.g. `8d6`) appear in amber with a dotted underline. Click one to roll it — the same result popup used in stat blocks appears, showing individual die values and the total.

### Opening a Spell from a Stat Block

When viewing a monster's stat block, any spell name in a spell list (e.g. in the monster's _Innate Spellcasting_ or _Spellcasting_ trait) is a clickable button. Click it to close the stat block and open the Spell Reference directly to that spell.

---

## 15. Player Messaging

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

## 16. Quick Reference

Click the **Quick Reference** button (document icon) in the dashboard header to open a full-screen rules-lookup panel — pure D&D 5e reference material, no randomization or content generation (for that, see [Generators](#17-generators)).

### Layout

A left sidebar lists every rules category; the right panel shows the selected one. The panel is aware of your session's ruleset (2014 or 2024) and adjusts tables accordingly where the rules differ.

### Categories

15 tabs, alphabetized:

| Tab                      | Contents                                                                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ability Check DCs**    | Difficulty-to-DC table (Very Easy 5 → Nearly Impossible 30), contested checks, passive checks, group checks                                                                 |
| **Actions in Combat**    | Quick lookup of the standard combat actions                                                                                                                                 |
| **Bonus Actions**        | Common bonus-action options                                                                                                                                                 |
| **Common Save DCs**      | Spell save DC formula, concentration saves, grapple/shove contests, trap and poison DCs, and a save-DC lookup grid by ability modifier × proficiency bonus                  |
| **Concentration**        | Concentration rules summary                                                                                                                                                 |
| **Conditions**           | The 15 standard conditions and their effects                                                                                                                                |
| **Cover**                | Half/three-quarters/full cover rules                                                                                                                                        |
| **Death Saving Throws**  | The death save rules (see also [Death Saving Throws](#death-saving-throws) for the in-tracker version)                                                                      |
| **Encounter Difficulty** | Ruleset-aware: 2014 shows the DMG XP-threshold table and monster-count multiplier; 2024 shows the new XP Budget table                                                       |
| **Exhaustion**           | Exhaustion level effects                                                                                                                                                    |
| **Light & Vision**       | Light-level effects, vision types (Darkvision, Blindsight, Tremorsense, Truesight), obscurement rules                                                                       |
| **Magic & Casting**      | Casting times, ritual casting, spell components, area-of-effect shapes, spell attack vs. saving throw                                                                       |
| **Magic Items List**     | A searchable, filterable DMG magic item database (armor, potions, rings, rods, staffs, wands, weapons) with a detail pane showing source, attunement, cost, and description |
| **Movement & Position**  | Movement, difficult terrain, and positioning rules                                                                                                                          |
| **Resting**              | Short rest / long rest rules                                                                                                                                                |

---

## 17. Generators

Click the **Generators** button (gear/flower icon) in the dashboard header to open a full-screen hub of 16 D&D 5e content generators — names, settlements, factions, dungeons, and more. Unlike Quick Reference, everything here is randomized and can be regenerated, tweaked, and (for most tools) saved for later.

### Layout

A left sidebar lists all 16 generators by icon and name; click one to load it into the right-hand content panel. Most tools regenerate their output **live** as you change any control — there's often no separate "Generate" button beyond a **Randomize** action that rerolls the random seed. Tools that support saving keep a small "Saved [Things]" list in their left panel, backed by your browser's local storage (not your DM account, so saved items are per-browser).

### 17.1 Weather & Travel

Pick a **Season** and **Biome** (4 seasons × 8 biomes), then click **Generate Week** to produce a 7-day weather table across five time slots (Dawn, Morning, Midday, Evening, Night). A **Travel Pace** table dynamically adjusts movement rates by the combined biome × season multiplier, with a badge showing the active modifier, plus a **Navigation DC** table.

A **Generate Weather Event** button produces a standalone dramatic weather event card (intensity: minor/moderate/severe/extreme) with a name, duration, onset, description, a "Mechanics" bullet list, and an "Aftermath" note — driven by your current Season/Biome selection.

### 17.2 Random Encounter

Select a biome/terrain (12 options), **Party Size** (1–8), **Party Level** (1–20), and **Difficulty** (Easy/Medium/Hard/Deadly), then click **Generate** to produce a fully XP-budgeted combat encounter: title, scene flavor text, archetype description, a monster list with individual XP values, an XP breakdown strip (raw → multiplier → adjusted → per-player), an actual difficulty badge, a tactics note, and a terrain feature. **Roll Again** re-generates with the same settings; **Add to Initiative** clears current enemies and loads the generated monsters directly into the initiative tracker, then closes the panel.

### 17.3 Wilderness Encounter

A narrative-first counterpart to Random Encounter: pick a **Terrain** (10 options), **Time of Day** (Dawn/Morning/Afternoon/Dusk/Night), and **Party Level**, then click **Roll Encounter**. The result is one of six encounter types — Combat, Hazard, Discovery, Flora & Fauna, Travelers, or Mystery (weighted toward the non-combat types) — with a headline, a time-of-day-flavored scene line, a terrain-specific detail paragraph, a Complication/Opportunity pair, and 2–3 relevant skills. There's no difficulty control or monster stat block here — use [Random Encounter](#172-random-encounter) when you need an XP-budgeted fight, and Wilderness Encounter when you want an evocative road/travel moment instead.

### 17.4 Name Generator

Select a race/type — 11 options: Human (Male), Human (Female), Elf, Dwarf, Halfling, Gnome, Orc/Half-Orc, Tiefling, Dragonborn, Tavern Name, Town/Village — then click **First Names** and/or **Surnames** to generate 10 of each. Click any name to select it (amber highlight); a preview strip shows "Party met **Firstname Lastname**, a Dwarf," and **Save to Notes** appends the entry to the current session's DM notes (creating a note if none exists).

### 17.5 Town Generator

Set a **Town Name** (auto-filled, freely editable), **Settlement Size** (Thorp → Metropolis), **Wealth** (Poor → Wealthy), and whether it **Has Keep**, then click **Randomize** for a new town (or just edit the fields — the town regenerates live). The output includes a prose "About [Town]" description, an optional Keep section (Great Hall, Barracks, Armory, and size-dependent Chapel/Dungeon/Lord's Chambers), and grouped building sections (Civic & Religious, Inns & Taverns, Trades & Services, Farms & Outbuildings, Residences) — each building has a name, description, and NPC roster.

Buildings with an inventory (shops, smithies, stables, inns, taverns, temples) have a **View Inventory/Menu/Services** button showing 7–10 priced items with a **Restock** option. Every building also has a **Floor Plan** button that opens an embedded third-party floor-plan generator (seeded to that building) with its own **New Layout** reroll and an **Open ↗** link to view it full-page. Click **Save Town** to keep it in a "Saved Towns" list.

### 17.6 Shop Generator

Choose a shop type (11 options: General Store, Weaponsmith, Armorer, Alchemist, Magic Shop, Jeweler, Tavern & Inn, Bookshop, Herbalist, Fletcher & Bowyer, Stable) and town affluence (6 tiers: Impoverished → Opulent), then click **Stock Shop** to generate a random named shop with items priced at three tiers (😊 Friendly −15%, 😐 Neutral, 😠 Hostile +25%); magic items appropriate to affluence are included. Click any item for a detail modal.

Click **Save to Notes** to open a small prompt for which city/town the shop is in (optional), then save — the note records the shop, its city, affluence, and type, plus a full itemized inventory list. A **"Previously Visited Shops"** section with **Load from Notes** lets you pull any shop you've saved back out of your DM notes to view or reload later.

### 17.7 Inn Generator

Pick an **Inn Quality** (Poor → Legendary), **Party Size**, and **Party Level**, then click **Randomize**. You get a named inn with an italic tagline, an owner (with race and backstory), a staff roster, a Food/Drink menu with prices, room types/rates, a set of 3–6 level-scaled **Guests and Quests** (each with a Hook/Complication/Goal/Reward and a difficulty badge), and a **Rumor Mill** of 3–4 overheard rumors (each secretly flagged True or False for the DM's reference). Click **Save Inn** to keep it in a "Saved Inns" list.

### 17.8 Dungeon Generator

A from-scratch port of the classic Donjon dungeon algorithm, wrapped in this app's encounter/treasure/hazard/puzzle systems. Configure **Rows/Cols** (grid size), **Corridors** (Labyrinth/Bent/Straight), **Floors** (1–9), a **Theme** (⚰️ Crypt, Sewer, Cave, 🏰 Fortress, 🔮 Arcane, 🍄 Fungal), an optional **Boss Room**, and **Party Size/Level**/**Difficulty** (recorded for reference), then click **Generate**.

The map renders on a zoomable canvas with a room/corridor/door/trap/loot/stairs legend. The **Encounters** panel lists every room with its monster encounter (dice-based counts, clickable monster names), treasure line, hazard line, and — on about a fifth of empty rooms — a collapsible **puzzle** (Riddle/Logic/Environmental) with a Show/Hide Solution toggle. Each room with an encounter has an **+ Add to Initiative** button. About a quarter of doors (plus some corridor cells) are locked or trapped — click one for a detail popup (name, trigger, detect/pick DC, effect/save).

Multi-floor dungeons link automatically via ▼/▲ stairs between levels, switchable via floor tabs. Toggle **🗺️ Map Live** to push the current floor to players and manually reveal corridors/doors/rooms as you explore (a fog-of-war system, not an instant full reveal). **Save**/**Load** persist dungeons to your browser; **PDF** exports a print-ready, per-floor GM handout with the map and a full room table.

### 17.9 Wizard's Tower

Set **Party Size**, **Party Level** (shown as a Tier, which affects apprentice frequency/tier), and **Number of Floors** (2–8), then click **Randomize**. You get a named tower with a school-of-magic badge, an exterior description, and a Wizard Status (Present, Absent, Deceased, or Transformed, with a specific reason). Each floor has a themed room (Laboratory, Library, Summoning Chamber, etc.), and may include a **Magical Anomaly** (a weird localized physics quirk), an **Apprentice** (with a disposition and interaction note), and/or a dangerous **Experiment** (with a danger-level badge). Click **Save Tower** to keep it in a "Saved Towers" list.

### 17.10 Cult / Secret Society

Set **Party Size** and **Party Level** (higher levels skew the organization toward more advanced/dangerous stages), then click **Randomize**. You get a cult name, type badge, symbol, public cover, doctrine, a goal with an operational **Stage** (cell/established/ascendant/critical), three named rituals, a leadership structure, and two covert recognition signs. Click **Save Cult** to keep it in a "Saved Cults" list.

### 17.11 Thieves' Guild

Click **Generate New Den** for a criminal organization: guild name and internal alias, a **Heat** badge (Cold/Warm/Hot/Burning), district, cover business, secret entrance, a 5-room den layout, a 4-member leadership hierarchy, a 5-item fence inventory, and a **Current Job Board** of 3–4 expandable jobs (type, risk, payout, and — when expanded — target, details, and a twist). Also includes a house rule and a current rumor. Click **Save Den** to keep it in a "Saved Dens" list.

### 17.12 Trade Caravan

Click **Generate New Caravan** for a merchant caravan on the road: a route (origin → destination), size badge, caravan master, a stat strip (wagons, days out/remaining, guard quality), a cargo manifest (with a 35% chance of a hidden/illegal "Not on Manifest" entry), a guard roster, a complication, and an overheard rumor. Click **Save Caravan** to keep it in a "Saved Caravans" list.

### 17.13 Black Market

Click **Generate New Market** for an illicit marketplace: market name, location, **Heat** badge, cover business, access method, a broker NPC, a "Today's Condition" situational event, and 5–7 inventory items each with a legal-status badge, risk badge, and a legal-vs-street price comparison. Also includes a house rule and a "Word on the Street" rumor. Click **Save Market** to keep it in a "Saved Markets" list.

### 17.14 Noble House

Click **Generate New House** for a noble family: a heraldically-accurate shield/motto/rank banner (field and charge tinctures follow the real rule of contrast), holdings (seat, territory, resource, military strength, income tier), political alliances, a rival house with a feud cause, current scandals (type + severity + description), a succession note, and a public-reputation summary. Click **Save House** to keep it in a "Saved Houses" list.

### 17.15 Graveyard / Crypt

Set **Party Size** and **Party Level** (which sets a Tier that skews site type and scales content), then click **Generate New Site**. You get a burial site (Graveyard/Crypt/Catacomb/Barrow/Ossuary) with a condition badge, an optional keeper NPC, a layout of 4–5 sections, several notable graves with epitaphs and plot hooks, expandable **Haunts** (trigger + manifestation + resolution), expandable **Buried Treasure Hooks** (location + contents + complication), a recent event, and a local rumor. Click **Save Site** to keep it in a "Saved Sites" list.

### 17.16 NPC Generator

Choose a **Role** (10 options: Commoner, Merchant, Guard, Innkeeper, Noble, Criminal, Retired Adventurer, Sage, Clergy, Soldier), **Gender**, and cosmetic **Disposition** badge, then let it regenerate (or set a specific **Seed**). You get a full NPC — appearance, personality trait/flaw/voice, motivation and secret, a plot hook, and a complete D&D 5e stat block (AC, HP, speed, ability scores, saves, skills, CR/XP, traits, and actions). Click **Save NPC** to keep it in a "Saved NPCs" list, or **Export PDF** to download the NPC as a handout.

---

## 18. Liar's Dice

Liar's Dice is a built-in bluffing dice minigame you can run with your players as a side activity, separate from combat — useful for a tavern scene, a break between encounters, or just a fun diversion. It runs over the same live session connection as combat, so it updates instantly on the DM dashboard and every player's viewer screen.

### Starting a Game (DM)

Click **Liar's Dice** in the dashboard header. Choose a role:

- **Observe** — see everyone's dice and run the game without playing
- **Play** — join the table yourself with a normal hand

Click **Open Lobby** to create the game; players then join from their viewer screens and appear in the lobby list as they do. Once at least 2 players have joined, click **Start Game (N players)**. Every player starts with 5 dice — there are no other configurable house rules. **Cancel** aborts the lobby.

### Playing (Players)

A **Liar's Dice** entry appears in the viewer's header/hamburger menu once a game is active, opening a floating panel. After joining from the lobby, each round the 3D dice roller animates and automatically rolls and submits your dice (if you don't submit within 5 seconds, the server rolls for you). You'll see everyone's remaining dice counts, your own dice face-up, the current bid, and whose turn it is.

On your turn:

| Action            | Button       | Effect                                                                           |
| ----------------- | ------------ | -------------------------------------------------------------------------------- |
| Raise the bid     | **Bid!**     | Must raise the face value, or keep the same face with a strictly higher quantity |
| Challenge the bid | **🎲 Liar!** | Calls "Dudo" — forces an immediate reveal                                        |
| Claim it's exact  | **✓**        | Calls "Calza" — bets the current bid is exactly right                            |

**Ones are wild** (count toward any face) by default. If any active player is down to their last die, that round automatically becomes a **⚠️ Palifico** round: wilds are disabled, and the face of the first bid that round locks all further bids to that same face.

### Resolving a Round

- **Dudo** (Liar!): the dice are revealed and counted — if the actual count meets or beats the bid, the challenger loses a die; otherwise the bidder does.
- **Calza** (exact call): if the actual count exactly matches the bid, the caller gains a die (up to a cap of 5); otherwise they lose one.
- A player who reaches 0 dice is eliminated and drops out of future rounds.
- The reveal screen shows everyone's dice and highlights matches, then auto-advances after 8 seconds (or click **Next Round →** to advance immediately).
- The game ends when one player remains — they're declared the winner. An **End Game** button (with a confirmation) is available to the DM at any time.

### DM Controls

An Observing DM sees every player's dice face-up at all times, the current bid, bid history, and a live event log, but cannot intervene in bids or force a turn to end. A Playing DM has the same Bid/Liar/exact-call controls as any player.

---

## 19. Stream Overlay

`/overlay/[sessionId]` is a separate, transparent view designed to be added as an **OBS (or similar) browser source** for streaming your combat sessions — it is not part of the normal DM/player workflow and has no Liar's Dice content.

It subscribes to the same live combat-state feed as the player display and shows:

- A **"Now Acting"** panel — portrait, HP bar, condition badges, and the current round number
- A scrolling **combat event ticker** — damage, healing, and condition changes as they happen
- An **"Up Next"** bar across the bottom showing upcoming turns, with a wrap marker at the end of the round

The background is fully transparent and the overlay ignores mouse/click input, so it composites cleanly over your other stream sources without blocking anything underneath.

---

## 20. Voice Commands _(Beta)_

> ⚠️ **Beta feature — still in testing.** Voice commands rely on the browser's built-in Speech Recognition API, which is currently supported in **Chrome and Edge** only. Behaviour may vary depending on your microphone, accent, and ambient noise. Please report any issues.

Click the **🎤 Voice** button in the DM dashboard header to enable hands-free control of the tracker. The button is only visible when your browser supports speech recognition.

### Activating Voice Commands

Click **Voice** to start listening. The button turns amber with a **pulsing dot** to indicate the microphone is active. The browser will prompt for microphone permission the first time you enable it. Click the button again at any time to stop listening.

### Supported Commands

Speak clearly and naturally. Every command begins with the wake word **"Tracker"** so the app ignores normal table conversation.

| Say                                  | Action                                                     |
| ------------------------------------ | ---------------------------------------------------------- |
| **"Tracker Next"**                   | Advance to the next combatant's turn                       |
| **"Tracker Previous"**               | Go back to the previous combatant's turn                   |
| **"Tracker Start Combat"**           | Start the combat (equivalent to clicking **Start Combat**) |
| **"Tracker End Combat"**             | End the current combat and save it to Chronicles           |
| **"Tracker roll d20"**               | Roll a single d20 — 3D dice animate on screen              |
| **"Tracker roll two d6 plus three"** | Roll 2d6+3 — number words and modifiers are supported      |
| **"Tracker roll a d100"**            | Roll a d100 (percentile)                                   |

**Dice rolls via voice** trigger the same 3D virtual dice animation as clicking dice anywhere in the app. The result appears in a toast once the dice settle.

A small **confirmation toast** appears at the bottom of the screen whenever a command is successfully recognized.

### Tips

- Commands only trigger when appropriate — for example, **"Tracker Next"** does nothing if combat has not started yet
- If **"Tracker End Combat"** is not recognized, try saying it slightly more slowly — speech engines sometimes hear "end" as "and"
- The microphone listens continuously and auto-restarts after silence; you do not need to re-click the button between commands
- Click **Voice** again (or navigate away) to stop the microphone

---

## 21. Audio Mixer

Click the **🎚 Mixer** button in the DM dashboard header to open the full-screen audio mixer. Use it to layer ambient sounds — dungeon ambience, tavern noise, battle music — that play in the background while you run your session.

### Opening & Closing

Click **🎚 Mixer** in the header to open the mixer overlay. Click the **✕** button (top-right of the mixer) or press **Escape** to close it. Audio continues playing in the background when the mixer is closed — there is no need to keep it open.

### Channels

The mixer starts with **5 channels**. Each channel strip contains:

| Control                       | Description                                             |
| ----------------------------- | ------------------------------------------------------- |
| **Label** (text field at top) | Editable channel name — click to rename                 |
| **Green dot**                 | Pulses while audio is playing on this channel           |
| **File area**                 | Click to pick an audio file from your computer          |
| **Timer**                     | Counts down the remaining play time for the loaded clip |
| **Volume fader**              | Vertical slider controlling this channel's level        |
| **▶ Play / ■ Stop**           | Start or stop playback with a 400 ms fade-out on stop   |
| **S (Solo)**                  | Mutes all other channels so only soloed channels play   |
| **M (Mute)**                  | Silences this channel without stopping playback         |
| **✕ (Delete)**                | Removes the channel and clears its saved file           |

All clips loop automatically.

### Master Channel

The **Master** strip (leftmost) controls the overall output level with a dedicated vertical fader. The **Stop All** button on the master strip fades out and stops every playing channel at once.

### Adding Channels

Click the **+ Add a Channel** card at the end of the channel row to add a new channel. There is no upper limit.

### What Is Remembered

| Setting              | Persisted                                                                |
| -------------------- | ------------------------------------------------------------------------ |
| Channel labels       | ✅ Always (localStorage)                                                 |
| Volume levels        | ✅ Always (localStorage)                                                 |
| Master volume        | ✅ Always (localStorage)                                                 |
| Selected audio files | ✅ Chrome/Edge (File System Access API)                                  |
| Selected audio files | ⚠️ Firefox — stored in browser cache; large files may hit storage limits |

### File Persistence on Chrome / Edge

When you pick a file on Chrome or Edge, the mixer saves a lightweight **reference** to the file on your hard drive (not the file's content). This means there are no browser storage limits regardless of file size.

- **Same browser session** — files reload silently when you open the page.
- **After a browser restart** — the channel shows **🔒 [filename]**. Click it once and the browser will ask permission to re-read the file. Grant it and the audio loads instantly.

### Tips

- Keep the mixer closed during play — the audio keeps running and the tracker remains fully interactive.
- Use **Solo** to quickly preview one track without changing any volume faders.
- Label your channels with descriptive names (e.g. _Dungeon Ambience_, _Boss Fight Music_) so you can find them at a glance mid-session.
- For the best experience on Chrome or Edge, pick files from a stable location on your drive (not a USB stick or network share) so they are always accessible when the browser requests permission.

---

## 22. Contact & Support

Have a question, found a bug, or want to suggest a feature? Click the **✉ Contact us** link found on the login page, the join page, and in the header of both the DM dashboard and the player display, or email us directly at **dm@inittracker.com**.
