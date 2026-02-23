import type { StorageState, Combatant } from '$lib/types';

// ---------------------------------------------------------------------------
// Session ID — 6 chars from the allowed alphabet (no O/0/I/1)
// ---------------------------------------------------------------------------
export const SESSION_ID_RE = /^[A-Z2-9]{6}$/;

export function isValidSessionId(s: string): boolean {
	return SESSION_ID_RE.test(s);
}

// ---------------------------------------------------------------------------
// StorageState — full runtime validation so the DB only ever receives
// well-typed data and MongoDB operator keys ($gt, $where, etc.) are rejected.
// ---------------------------------------------------------------------------
const MAX_COMBATANTS = 100;
const MAX_NAME_LEN = 100;
const MAX_STATUS_LEN = 50;
const MAX_STATUSES = 20;
const MAX_AVATAR_LEN = 1_000_000; // ~750 KB decoded
const MAX_ROUND = 9_999;

function isStr(v: unknown, max: number): v is string {
	return typeof v === 'string' && v.length <= max;
}

function isInt(v: unknown, min: number, max: number): v is number {
	return typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) && v >= min && v <= max;
}

function validateCombatant(c: unknown): c is Combatant {
	if (!c || typeof c !== 'object' || Array.isArray(c)) return false;
	const o = c as Record<string, unknown>;

	if (!isStr(o.id, 36)) return false;
	if (!isStr(o.name, MAX_NAME_LEN)) return false;
	if (o.type !== 'player' && o.type !== 'enemy') return false;
	if (!isInt(o.ac, 0, 99)) return false;
	if (!isInt(o.maxHp, 1, 99_999)) return false;
	if (!isInt(o.currentHp, -99_999, 99_999)) return false;
	if (!isInt(o.tempHp, 0, 99_999)) return false;

	// initiative may be null or a finite number (allows decimals for tiebreaking)
	if (o.initiative !== null) {
		if (typeof o.initiative !== 'number' || !Number.isFinite(o.initiative)) return false;
	}

	if (!Array.isArray(o.statuses)) return false;
	if (o.statuses.length > MAX_STATUSES) return false;
	for (const s of o.statuses) {
		if (!isStr(s, MAX_STATUS_LEN)) return false;
	}

	// Optional string fields
	if (o.templateName !== undefined && !isStr(o.templateName, MAX_NAME_LEN)) return false;
	if (o.monsterType !== undefined && !isStr(o.monsterType, MAX_NAME_LEN)) return false;
	if (o.avatarUrl !== undefined && !isStr(o.avatarUrl, MAX_AVATAR_LEN)) return false;

	// Optional boolean fields
	if (o.showAc !== undefined && typeof o.showAc !== 'boolean') return false;
	if (o.inCombat !== undefined && typeof o.inCombat !== 'boolean') return false;

	return true;
}

export function validateStorageState(raw: unknown): StorageState | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const o = raw as Record<string, unknown>;

	if (!Array.isArray(o.combatants)) return null;
	if (o.combatants.length > MAX_COMBATANTS) return null;

	for (const c of o.combatants) {
		if (!validateCombatant(c)) return null;
	}

	if (o.currentTurnId !== null && !isStr(o.currentTurnId, 36)) return null;
	if (!isInt(o.round, 1, MAX_ROUND)) return null;

	return o as unknown as StorageState;
}
