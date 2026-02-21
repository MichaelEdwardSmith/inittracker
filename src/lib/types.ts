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
	// False means the player is in the party roster but not in the current combat.
	// Undefined / true means in combat (backwards-compatible with saved state).
	inCombat?: boolean;
	// Players only — base64 JPEG data URL set by the DM via avatar upload
	avatarUrl?: string;
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
}

export interface CustomMonster extends EnemyTemplate {
	id: string;
}
