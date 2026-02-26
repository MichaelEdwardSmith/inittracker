export interface Combatant {
	id: string;
	name: string;
	type: 'player' | 'enemy';
	ac: number;
	maxHp: number;
	currentHp: number;
	statuses: string[];
	initiative: number | null;
	tempHp: number;
	// Enemies only — set from the template so display can look up the avatar
	templateName?: string;
	monsterType?: string;
	// Enemies only — whether the AC is visible on the player display (default true)
	showAc?: boolean;
	// False means the player is in the party roster but not in the current combat.
	// Undefined / true means in combat (backwards-compatible with saved state).
	inCombat?: boolean;
	// Players only — base64 JPEG data URL set by the DM via avatar upload
	avatarUrl?: string;
	// Enemies only — avatar image URL (remote for built-ins, base64 for custom monsters)
	imgUrl?: string;
}

export interface StorageState {
	combatants: Combatant[];
	currentTurnId: string | null;
	round: number;
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
}

export interface CustomMonster extends EnemyTemplate {
	id: string;
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
}

export interface CombatRecord {
	id: string;
	startedAt: string;
	endedAt: string;
	rounds: number;
	participants: CombatantSummary[];
	events: CombatEvent[];
}

export interface GameSession {
	id: string; // UUID — internal identifier
	sessionId: string; // 6-char public ID — used in viewer URLs
	name: string; // user-defined name
}

export interface MonsterDetail {
	name: string;
	meta: string;
	armorClass: string;
	hitPoints: string;
	speed: string;
	str: number; strMod: string;
	dex: number; dexMod: string;
	con: number; conMod: string;
	int: number; intMod: string;
	wis: number; wisMod: string;
	cha: number; chaMod: string;
	savingThrows?: string;
	skills?: string;
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
}
