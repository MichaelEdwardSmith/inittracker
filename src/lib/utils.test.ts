import { describe, it, expect } from 'vitest';
import { crToXp, sortCombatants, hpPercent, XP_THRESHOLDS } from './utils';
import type { Combatant } from './types';

function combatant(overrides: Partial<Combatant>): Combatant {
	return {
		id: 'x',
		name: 'X',
		type: 'enemy',
		ac: 10,
		maxHp: 10,
		currentHp: 10,
		statuses: [],
		initiative: null,
		tempHp: 0,
		...overrides
	};
}

describe('crToXp', () => {
	it('maps whole and fractional challenge ratings', () => {
		expect(crToXp('0')).toBe(10);
		expect(crToXp('1/8')).toBe(25);
		expect(crToXp('1/4')).toBe(50);
		expect(crToXp('1/2')).toBe(100);
		expect(crToXp('1')).toBe(200);
		expect(crToXp('5')).toBe(1800);
		expect(crToXp('20')).toBe(25000);
		expect(crToXp('30')).toBe(155000);
	});

	it('returns 0 for unknown or malformed CRs', () => {
		expect(crToXp('')).toBe(0);
		expect(crToXp('31')).toBe(0);
		expect(crToXp('abc')).toBe(0);
	});
});

describe('XP_THRESHOLDS', () => {
	it('covers levels 1-20 with ascending easy → deadly values', () => {
		for (let level = 1; level <= 20; level++) {
			const t = XP_THRESHOLDS[level];
			expect(t).toBeDefined();
			expect([...t].sort((a, b) => a - b)).toEqual(t);
		}
	});
});

describe('sortCombatants', () => {
	it('orders by initiative, highest first', () => {
		const sorted = sortCombatants([
			combatant({ id: 'a', initiative: 5 }),
			combatant({ id: 'b', initiative: 18 }),
			combatant({ id: 'c', initiative: 12 })
		]);
		expect(sorted.map((c) => c.id)).toEqual(['b', 'c', 'a']);
	});

	it('puts combatants with no initiative last', () => {
		const sorted = sortCombatants([
			combatant({ id: 'none', initiative: null }),
			combatant({ id: 'low', initiative: 1 }),
			combatant({ id: 'zero', initiative: 0 })
		]);
		expect(sorted.map((c) => c.id)).toEqual(['low', 'zero', 'none']);
	});

	it('honours decimal tiebreaker initiatives', () => {
		const sorted = sortCombatants([
			combatant({ id: 'a', initiative: 15 }),
			combatant({ id: 'b', initiative: 15.5 })
		]);
		expect(sorted.map((c) => c.id)).toEqual(['b', 'a']);
	});

	it('keeps insertion order for equal initiatives and does not mutate the input', () => {
		const input = [
			combatant({ id: 'first', initiative: 10 }),
			combatant({ id: 'second', initiative: 10 })
		];
		const snapshot = [...input];
		expect(sortCombatants(input).map((c) => c.id)).toEqual(['first', 'second']);
		expect(input).toEqual(snapshot);
	});
});

describe('hpPercent', () => {
	it('computes a percentage of max HP', () => {
		expect(hpPercent(combatant({ currentHp: 5, maxHp: 10 }))).toBe(50);
	});

	it('clamps to 0-100 and handles zero max HP', () => {
		expect(hpPercent(combatant({ currentHp: -5, maxHp: 10 }))).toBe(0);
		expect(hpPercent(combatant({ currentHp: 20, maxHp: 10 }))).toBe(100);
		expect(hpPercent(combatant({ currentHp: 0, maxHp: 0 }))).toBe(0);
	});
});
