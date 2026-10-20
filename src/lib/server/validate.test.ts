import { describe, it, expect } from 'vitest';
import { isValidSessionId, validateStorageState } from './validate';

const validCombatant = {
	id: 'abc',
	name: 'Goblin',
	type: 'enemy',
	ac: 15,
	maxHp: 7,
	currentHp: 7,
	tempHp: 0,
	initiative: 12,
	statuses: []
};

const validState = { combatants: [validCombatant], currentTurnId: null, round: 1 };

const withCombatant = (patch: object) => ({
	...validState,
	combatants: [{ ...validCombatant, ...patch }]
});

describe('isValidSessionId', () => {
	it('accepts 6 chars from the allowed alphabet', () => {
		expect(isValidSessionId('AB3X9K')).toBe(true);
		expect(isValidSessionId('ZZZZZZ')).toBe(true);
	});

	it('rejects ambiguous characters, wrong lengths and lowercase', () => {
		expect(isValidSessionId('ABCDE0')).toBe(false);
		expect(isValidSessionId('ABCDE1')).toBe(false);
		expect(isValidSessionId('AB3X9')).toBe(false);
		expect(isValidSessionId('AB3X9KK')).toBe(false);
		expect(isValidSessionId('ab3x9k')).toBe(false);
		expect(isValidSessionId('')).toBe(false);
	});
});

describe('validateStorageState', () => {
	it('accepts a minimal valid state', () => {
		expect(validateStorageState(validState)).not.toBeNull();
	});

	it('rejects non-objects and arrays', () => {
		expect(validateStorageState(null)).toBeNull();
		expect(validateStorageState('x')).toBeNull();
		expect(validateStorageState([])).toBeNull();
	});

	it('rejects bad round values', () => {
		expect(validateStorageState({ ...validState, round: 0 })).toBeNull();
		expect(validateStorageState({ ...validState, round: 1.5 })).toBeNull();
		expect(validateStorageState({ ...validState, round: 10_000 })).toBeNull();
	});

	it('rejects invalid combatants', () => {
		expect(validateStorageState(withCombatant({ type: 'dragon' }))).toBeNull();
		expect(validateStorageState(withCombatant({ ac: 100 }))).toBeNull();
		expect(validateStorageState(withCombatant({ name: 'x'.repeat(101) }))).toBeNull();
		expect(validateStorageState(withCombatant({ initiative: NaN }))).toBeNull();
		expect(validateStorageState(withCombatant({ statuses: [1] }))).toBeNull();
		expect(validateStorageState(withCombatant({ level: 21 }))).toBeNull();
	});

	it('allows null initiative and the lair/player types', () => {
		expect(validateStorageState(withCombatant({ initiative: null }))).not.toBeNull();
		expect(validateStorageState(withCombatant({ type: 'lair' }))).not.toBeNull();
		expect(validateStorageState(withCombatant({ type: 'player', level: 5 }))).not.toBeNull();
	});

	it('rejects Mongo-operator-shaped payloads in typed fields', () => {
		expect(validateStorageState(withCombatant({ name: { $gt: '' } }))).toBeNull();
		expect(validateStorageState({ ...validState, currentTurnId: { $ne: null } })).toBeNull();
	});

	it('rejects more than 100 combatants', () => {
		const many = Array.from({ length: 101 }, (_, i) => ({ ...validCombatant, id: String(i) }));
		expect(validateStorageState({ ...validState, combatants: many })).toBeNull();
	});

	it('validates the optional turn timer fields', () => {
		expect(validateStorageState({ ...validState, turnTimerSeconds: 60 })).not.toBeNull();
		expect(validateStorageState({ ...validState, turnTimerSeconds: 0 })).toBeNull();
		expect(validateStorageState({ ...validState, turnTimerSeconds: 3601 })).toBeNull();
		expect(validateStorageState({ ...validState, turnStartedAt: 'now' })).toBeNull();
	});
});
