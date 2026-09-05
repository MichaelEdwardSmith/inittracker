// Shared TypeScript interfaces used across client and server. Defines the shapes for
// Combatant, EnemyTemplate, CustomMonster, MonsterDetail, StorageState, CombatRecord,
// CombatEvent, CombatantSummary, and related types.

export interface LootItem {
	id: string;
	name: string;
	quantity: number;
}

export interface Combatant {
	id: string;
	name: string;
	type: 'player' | 'enemy' | 'lair';
	ac: number;
	maxHp: number;
	currentHp: number;
	statuses: string[];
	initiative: number | null;
	tempHp: number;
	// Enemies only — set from the template so display can look up the avatar
	templateName?: string;
	monsterType?: string;
	// False means the player is in the party roster but not in the current combat.
	// Undefined / true means in combat (backwards-compatible with saved state).
	inCombat?: boolean;
	// Players only — DEX modifier used when rolling initiative (e.g. +2, -1, 0)
	dexMod?: number;
	// Players only — character level, set/edited via the Level Up wizard. Treated as 1
	// when unset (new players default to level 1 without needing to store it explicitly).
	level?: number;
	// Players only — passive Perception score
	passivePerception?: number;
	// Players only — base64 JPEG data URL set by the DM via avatar upload
	avatarUrl?: string;
	// Enemies only — avatar image URL (remote for built-ins, base64 for custom monsters)
	imgUrl?: string;
	// Enemies only — source abbreviation for bestiary-imported monsters (e.g. "IDRotF")
	source?: string;
	// Enemies only — challenge rating string (e.g. "1/2", "5") for XP calculation
	cr?: string;
	// Per-condition round countdown. Conditions absent from this map last indefinitely.
	conditionRounds?: Record<string, number>;
	// DM-only freeform notes
	note?: string;
	// Alternate names/spellings for voice command recognition to match against
	// in addition to the real name — e.g. "Call Stag" as a nickname for a
	// player named "Kalstag" that speech recognition consistently mishears.
	voiceAliases?: string[];
	// Enemies only — legendary actions spent this round (resets at start of their turn)
	legendaryActionsSpent?: number;
	// Players only — death saving throw tracker (present when currentHp === 0)
	deathSaves?: { successes: number; failures: number; stable: boolean };
	// Enemies only — loot items rolled/edited by the DM after enemy is slain
	loot?: LootItem[];
}

export interface StorageState {
	combatants: Combatant[];
	currentTurnId: string | null;
	round: number;
	/** Present only on the sync immediately after an AoE action; tells the viewer
	 *  which combatants were hit (in order) so it can animate them sequentially. */
	aoeEvents?: Array<{ id: string; name: string; delta: number }>;
	/** When set, the player display hides combat and shows this dungeon room description. */
	dungeonRoomDescription?: {
		name: string;
		label: string;
		body: string;
		hazard: string;
		theme: string;
	} | null;
	/** When set, the player display shows a fog-of-war dungeon map in the corner. */
	dungeonMapState?: {
		dungeonName: string;
		theme: string;
		floors: Array<{
			n_rows: number;
			n_cols: number;
			n_rooms: number;
			cell: number[][];
			stair: Array<{ row: number; col: number; connects_to_floor?: number }>;
		}>;
		currentFloor: number;
		bossRoomIds: number[];
		revealedRooms: number[][];
		revealedCorridors: string[][];
	} | null;
}

export interface EnemyTemplate {
	name: string;
	ac: number;
	hp: number;
	cr: string;
	monsterType: string;
	/** Parsed DEX modifier (e.g. +2, -1, 0). Defaults to 0 if not provided. */
	dexMod?: number;
	/** Optional avatar — base64 JPEG data URL for custom monsters, or remote URL for built-ins. */
	imgUrl?: string;
	/** Source abbreviation for bestiary-imported monsters (e.g. "IDRotF"). */
	source?: string;
}

export interface CustomMonster extends EnemyTemplate {
	id: string;
	/** Full stat block for monsters imported from 5etools bestiaries. */
	detail?: MonsterDetail;
}

export interface CombatEvent {
	type: 'damage' | 'heal' | 'down' | 'condition_add' | 'condition_remove' | 'round_advance';
	round: number;
	// Who performed the action (the combatant whose turn it was)
	actorId?: string;
	actorName?: string;
	actorType?: 'player' | 'enemy';
	// Who was affected
	combatantId: string;
	combatantName: string;
	combatantType: 'player' | 'enemy';
	value?: number;
	condition?: string;
	hpBefore?: number;
	hpAfter?: number;
	// Set on damage events when the hit dropped the target to 0 HP
	causedDown?: boolean;
}

export interface CombatantSummary {
	id: string;
	name: string;
	type: 'player' | 'enemy';
	maxHp: number;
	startHp: number;
	finalHp: number;
	totalDamage: number;
	totalHealing: number;
	wasSlain: boolean;
	/** Challenge Rating string (enemies only, from template lookup) */
	cr?: string;
	/** Loot items (enemies only, captured when combat ends) */
	loot?: LootItem[];
}

export interface CombatRecord {
	id: string;
	startedAt: string;
	endedAt: string;
	rounds: number;
	participants: CombatantSummary[];
	events: CombatEvent[];
	/** Total XP awarded for slain enemies (sum of D&D 5e XP by CR) */
	totalXp?: number;
}

export interface GameSession {
	id: string; // UUID — internal identifier
	sessionId: string; // 6-char public ID — used in viewer URLs
	name: string; // user-defined name
	ruleset: '2014' | '2024'; // D&D edition; defaults to '2014' for existing sessions
}

// ---------------------------------------------------------------------------
// 2024 Monster Manual stat block (structured arrays, not HTML strings)
// ---------------------------------------------------------------------------

export interface MonsterAbility2024 {
	score: number;
	mod: string;
	save: string;
}

export interface MonsterAbilities2024 {
	STR: MonsterAbility2024;
	DEX: MonsterAbility2024;
	CON: MonsterAbility2024;
	INT: MonsterAbility2024;
	WIS: MonsterAbility2024;
	CHA: MonsterAbility2024;
}

export interface MonsterAction2024 {
	name: string;
	description: string;
}

export interface MonsterDetail2024 {
	slug: string;
	name: string;
	size: string;
	type: string;
	alignment: string;
	initiative: { mod: string; score: number };
	ac: string;
	hp: string;
	speed: string;
	abilities: MonsterAbilities2024;
	skills?: string;
	senses?: string;
	languages?: string;
	cr: string;
	xp?: number;
	proficiencyBonus?: string;
	immunities?: string;
	resistances?: string;
	vulnerabilities?: string;
	conditionImmunities?: string;
	traits: MonsterAction2024[];
	actions: MonsterAction2024[];
	bonusActions: MonsterAction2024[];
	reactions: MonsterAction2024[];
	legendary: {
		preamble: string | null;
		actions: MonsterAction2024[];
	};
	lair: {
		preamble: string | null;
		actions: MonsterAction2024[];
	} | null;
	imgUrl?: string;
	source?: string;
}

export interface EncounterEnemy {
	templateName: string;
	quantity: number;
}

export interface Encounter {
	id: string;
	name: string;
	enemies: EncounterEnemy[];
	createdAt: string;
}

export interface NoteEntry {
	id: string;
	date: string; // ISO date string
	content: string;
}

// ---------------------------------------------------------------------------
// 2024 Spell (flat structure — plain text, not 5etools nested entries)
// ---------------------------------------------------------------------------

export interface Spell2024 {
	name: string;
	level: number; // 0 = cantrip
	school: string; // full lowercase name, e.g. "evocation"
	classes: string[]; // e.g. ["bard", "sorcerer"]
	actionType: 'action' | 'bonusAction' | 'reaction';
	castingTime?: string; // overrides actionType if present, e.g. "1 minute"
	castingTrigger?: string; // reaction condition description
	concentration: boolean;
	ritual: boolean;
	range: string;
	components: string[]; // e.g. ["v", "s", "m"]
	material?: string;
	duration: string;
	description: string;
	higherLevelSlot?: string;
	cantripUpgrade?: string;
}

export interface Spell5e {
	name: string;
	source: string; // "PHB" | "XGE" | "TCE"
	level: number; // 0 = cantrip
	school: string; // "A" | "C" | "D" | "E" | "V" | "I" | "N" | "T"
	time: unknown[]; // raw 5etools time array
	range: unknown; // raw 5etools range object
	components: Record<string, unknown>; // {v, s, m}
	duration: unknown[]; // raw 5etools duration array
	entries: unknown[]; // rich text entries
	entriesHigherLevel?: unknown[];
	classes?: unknown; // 5etools classes object
	ritual?: true;
}

// ---------------------------------------------------------------------------
// Liar's Dice Minigame
// ---------------------------------------------------------------------------

export interface LiarsDicePlayer {
	id: string;
	name: string;
	diceCount: number;
	/** Empty array when hidden from this viewer; populated when it's your own dice or during reveal. */
	dice: number[];
	eliminated: boolean;
}

export interface LiarsDiceBid {
	playerId: string;
	playerName: string;
	quantity: number;
	face: number;
}

export interface LiarsDiceReveal {
	allDice: Array<{ playerId: string; playerName: string; dice: number[] }>;
	bid: LiarsDiceBid;
	/** Actual count of matching dice (including wilds unless Palifico). */
	actual: number;
	callerPlayerId: string;
	callerPlayerName: string;
	callerAction: 'dudo' | 'calza';
	calzaSuccess: boolean;
	loserId: string;
	loserName: string;
	/** -1 normally, +1 if calza success (gained a die back). */
	loserDiceChange: number;
}

export type LiarsDiceStatus = 'lobby' | 'bidding' | 'reveal' | 'game_over' | 'inactive';

export interface LiarsDiceGame {
	sessionId: string;
	status: LiarsDiceStatus;
	players: LiarsDicePlayer[];
	currentTurnPlayerId: string | null;
	currentBid: LiarsDiceBid | null;
	bidHistory: LiarsDiceBid[];
	dmRole: 'player' | 'observer';
	roundNumber: number;
	isPalifico: boolean;
	palificoFace: number | null;
	eventLog: Array<{ type: string; description: string; timestamp: number }>;
	winnerId: string | null;
	winnerName: string | null;
	reveal: LiarsDiceReveal | null;
}

export interface MonsterDetail {
	name: string;
	meta: string;
	armorClass: string;
	hitPoints: string;
	speed: string;
	str: number;
	strMod: string;
	dex: number;
	dexMod: string;
	con: number;
	conMod: string;
	int: number;
	intMod: string;
	wis: number;
	wisMod: string;
	cha: number;
	chaMod: string;
	savingThrows?: string;
	skills?: string;
	damageVulnerabilities?: string;
	damageImmunities?: string;
	damageResistances?: string;
	conditionImmunities?: string;
	senses?: string;
	languages?: string;
	challenge: string;
	traits?: string;
	actions?: string;
	reactions?: string;
	legendaryActions?: string;
	imgUrl?: string;
	/** Source abbreviation for bestiary-imported monsters (e.g. "IDRotF") */
	source?: string;
	/** Page number in the source book */
	page?: number;
}
