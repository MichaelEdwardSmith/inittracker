import type { Combatant } from './types';

export const conditionDescriptions: Record<string, string> = {
	Blinded:       "Can't see. Automatically fails ability checks requiring sight. Attack rolls against it have advantage; its attack rolls have disadvantage.",
	Charmed:       "Can't attack the charmer or target them with harmful abilities or magical effects. The charmer has advantage on social ability checks against this creature.",
	Concentrating: "Maintaining concentration on a spell. Taking damage requires a CON save (DC 10 or half the damage taken, whichever is higher) or the spell ends.",
	Deafened:      "Can't hear. Automatically fails ability checks that require hearing.",
	Dead:          "The creature has died and can't take actions, move, or speak.",
	Exhausted:     "Cumulative (levels 1–6). Lvl 1: Disadvantage on ability checks. Lvl 2: Speed halved. Lvl 3: Disadvantage on attacks & saves. Lvl 4: HP maximum halved. Lvl 5: Speed 0. Lvl 6: Death.",
	Frightened:    "Disadvantage on ability checks and attack rolls while the source of its fear is in line of sight. Can't willingly move closer to the source of fear.",
	Grappled:      "Speed becomes 0 and can't benefit from bonuses to speed. Ends if the grappler is incapacitated or the creature is moved beyond the grappler's reach.",
	Incapacitated: "Can't take actions or reactions.",
	Invisible:     "Can't be seen without magic or a special sense. Attacks against it have disadvantage; its attacks have advantage. It still makes noise and leaves tracks.",
	Paralyzed:     "Incapacitated and can't move or speak. Automatically fails STR and DEX saves. Attack rolls against it have advantage. Any attack that hits within 5 ft. is a critical hit.",
	Petrified:     "Transformed into solid inanimate matter. Incapacitated, unaware of surroundings, weight ×10. Automatically fails STR and DEX saves. Resistance to all damage; immune to poison and disease.",
	Poisoned:      "Disadvantage on attack rolls and ability checks.",
	Prone:         "Can only crawl or use half speed to stand up. Disadvantage on attack rolls. Attacks against it from within 5 ft. have advantage; attacks from farther away have disadvantage.",
	Restrained:    "Speed becomes 0. Attack rolls against it have advantage; its attack rolls have disadvantage. Disadvantage on DEX saving throws.",
	Stunned:       "Incapacitated, can't move, and can speak only falteringly. Automatically fails STR and DEX saves. Attack rolls against it have advantage.",
	Unconscious:          "Incapacitated, can't move or speak, unaware of surroundings. Drops held items, falls prone. Automatically fails STR and DEX saves. Attacks have advantage and hits within 5 ft. are critical hits.",
	'Advantage For':      "This creature has advantage on its attack rolls or ability checks (DM-tracked reminder).",
	'Advantage Against':  "Attack rolls against this creature have advantage (DM-tracked reminder).",
	'Disadvantage For':   "This creature has disadvantage on its attack rolls or ability checks (DM-tracked reminder).",
	'Disadvantage Against': "Attack rolls against this creature have disadvantage (DM-tracked reminder).",
};

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
	Unconscious: 'bg-gray-800 text-gray-500',
	'Advantage For':      'bg-emerald-700 text-emerald-100',
	'Advantage Against':  'bg-rose-800 text-rose-200',
	'Disadvantage For':   'bg-orange-800 text-orange-200',
	'Disadvantage Against': 'bg-teal-700 text-teal-100',
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

// D&D 5e XP awards by Challenge Rating (DMG table)
const XP_BY_CR: Record<string, number> = {
	'0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
	'1': 200, '2': 450, '3': 700, '4': 1100,
	'5': 1800, '6': 2300, '7': 2900, '8': 3900,
	'9': 5000, '10': 5900, '11': 7200, '12': 8400,
	'13': 10000, '14': 11500, '15': 13000, '16': 15000,
	'17': 18000, '18': 20000, '19': 22000, '20': 25000,
	'21': 33000, '22': 41000, '23': 50000, '24': 62000,
	'25': 75000, '26': 90000, '27': 105000, '28': 120000,
	'29': 135000, '30': 155000
};

export function crToXp(cr: string): number {
	return XP_BY_CR[cr] ?? 0;
}
