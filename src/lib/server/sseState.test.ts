import { describe, it, expect } from 'vitest';
import { redactForViewers } from './sseState';
import type { StorageState, Combatant } from '$lib/types';

function combatant(overrides: Partial<Combatant> = {}): Combatant {
	return {
		id: 'a',
		name: 'Goblin',
		type: 'enemy',
		ac: 13,
		maxHp: 10,
		currentHp: 10,
		statuses: [],
		initiative: 12,
		tempHp: 0,
		...overrides
	};
}

function state(c: Combatant): StorageState {
	return { combatants: [c], currentTurnId: null, round: 1 };
}

describe('redactForViewers', () => {
	it('removes Advantage/Disadvantage statuses but keeps real conditions', () => {
		const out = redactForViewers(
			state(combatant({ statuses: ['Prone', 'Advantage For', 'Disadvantage Against', 'Poisoned'] }))
		);
		expect(out.combatants[0].statuses).toEqual(['Prone', 'Poisoned']);
	});

	it('removes DM notes', () => {
		const out = redactForViewers(state(combatant({ note: 'secretly the BBEG' })));
		expect('note' in out.combatants[0]).toBe(false);
	});

	it('drops timers for DM-only conditions but keeps the rest', () => {
		const out = redactForViewers(
			state(
				combatant({
					statuses: ['Prone'],
					conditionRounds: { Prone: 2, 'Advantage For': 3 }
				})
			)
		);
		expect(out.combatants[0].conditionRounds).toEqual({ Prone: 2 });
	});

	it('does not mutate the original state', () => {
		const original = state(combatant({ statuses: ['Advantage For'], note: 'x' }));
		redactForViewers(original);
		expect(original.combatants[0].statuses).toEqual(['Advantage For']);
		expect(original.combatants[0].note).toBe('x');
	});
});
