import type { Combatant } from './types';

export const conditionColors: Record<string, string> = {
	Blinded: 'bg-gray-600 text-gray-200',
	Charmed: 'bg-pink-800 text-pink-200',
	Concentrating: 'bg-cyan-800 text-cyan-200',
	Deafened: 'bg-yellow-800 text-yellow-200',
	Dead: 'bg-gray-900 text-gray-400',
	Exhausted: 'bg-orange-900 text-orange-200',
	Frightened: 'bg-purple-800 text-purple-200',
	Grappled: 'bg-orange-700 text-orange-100',
	Incapacitated: 'bg-red-800 text-red-200',
	Invisible: 'bg-blue-800 text-blue-200',
	Paralyzed: 'bg-red-900 text-red-300',
	Petrified: 'bg-stone-700 text-stone-200',
	Poisoned: 'bg-green-800 text-green-200',
	Prone: 'bg-yellow-900 text-yellow-300',
	Restrained: 'bg-amber-800 text-amber-200',
	Stunned: 'bg-yellow-700 text-yellow-100',
	Unconscious: 'bg-gray-800 text-gray-500'
};

export function sortCombatants(list: Combatant[]): Combatant[] {
	return [...list].sort((a, b) => {
		if (a.initiative === null && b.initiative === null) return 0;
		if (a.initiative === null) return 1;
		if (b.initiative === null) return -1;
		return b.initiative - a.initiative;
	});
}

export function hpPercent(c: Combatant): number {
	if (c.maxHp === 0) return 0;
	return Math.max(0, Math.min(100, (c.currentHp / c.maxHp) * 100));
}

export function hpBarColor(pct: number): string {
	if (pct <= 0) return 'bg-gray-700';
	if (pct <= 25) return 'bg-red-600';
	if (pct <= 50) return 'bg-amber-500';
	return 'bg-green-600';
}

export function hpTextColor(pct: number): string {
	if (pct <= 0) return 'text-gray-500';
	if (pct <= 25) return 'text-red-400';
	if (pct <= 50) return 'text-amber-400';
	return 'text-green-400';
}
