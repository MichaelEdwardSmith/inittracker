// Pure utility functions shared across the app. Includes HP bar colour/percentage
// helpers, condition colour maps and descriptions, combatant sort order, CR→XP
// conversion table, and time-formatting helpers.
import type { Combatant } from './types';

export const conditionDescriptions: Record<string, string> = {
	Blinded:
		"Can't see. Automatically fails ability checks requiring sight. Attack rolls against it have advantage; its attack rolls have disadvantage.",
	Charmed:
		"Can't attack the charmer or target them with harmful abilities or magical effects. The charmer has advantage on social ability checks against this creature.",
	Concentrating:
		'Maintaining concentration on a spell. Taking damage requires a CON save (DC 10 or half the damage taken, whichever is higher) or the spell ends.',
	Deafened: "Can't hear. Automatically fails ability checks that require hearing.",
	Dead: "The creature has died and can't take actions, move, or speak.",
	Exhausted:
		'Cumulative (levels 1–6). Lvl 1: Disadvantage on ability checks. Lvl 2: Speed halved. Lvl 3: Disadvantage on attacks & saves. Lvl 4: HP maximum halved. Lvl 5: Speed 0. Lvl 6: Death.',
	Frightened:
		"Disadvantage on ability checks and attack rolls while the source of its fear is in line of sight. Can't willingly move closer to the source of fear.",
	Grappled:
		"Speed becomes 0 and can't benefit from bonuses to speed. Ends if the grappler is incapacitated or the creature is moved beyond the grappler's reach.",
	Incapacitated: "Can't take actions or reactions.",
	Invisible:
		"Can't be seen without magic or a special sense. Attacks against it have disadvantage; its attacks have advantage. It still makes noise and leaves tracks.",
	Paralyzed:
		"Incapacitated and can't move or speak. Automatically fails STR and DEX saves. Attack rolls against it have advantage. Any attack that hits within 5 ft. is a critical hit.",
	Petrified:
		'Transformed into solid inanimate matter. Incapacitated, unaware of surroundings, weight ×10. Automatically fails STR and DEX saves. Resistance to all damage; immune to poison and disease.',
	Poisoned: 'Disadvantage on attack rolls and ability checks.',
	Prone:
		'Can only crawl or use half speed to stand up. Disadvantage on attack rolls. Attacks against it from within 5 ft. have advantage; attacks from farther away have disadvantage.',
	Restrained:
		'Speed becomes 0. Attack rolls against it have advantage; its attack rolls have disadvantage. Disadvantage on DEX saving throws.',
	Stunned:
		"Incapacitated, can't move, and can speak only falteringly. Automatically fails STR and DEX saves. Attack rolls against it have advantage.",
	Unconscious:
		"Incapacitated, can't move or speak, unaware of surroundings. Drops held items, falls prone. Automatically fails STR and DEX saves. Attacks have advantage and hits within 5 ft. are critical hits.",
	'Advantage For':
		'This creature has advantage on its attack rolls or ability checks (DM-tracked reminder).',
	'Advantage Against': 'Attack rolls against this creature have advantage (DM-tracked reminder).',
	'Disadvantage For':
		'This creature has disadvantage on its attack rolls or ability checks (DM-tracked reminder).',
	'Disadvantage Against':
		'Attack rolls against this creature have disadvantage (DM-tracked reminder).'
};

// 2024 condition descriptions — only entries that differ from the 2014 wording are listed here.
// All other conditions fall back to conditionDescriptions (2014).
const conditionDescriptions2024Overrides: Partial<Record<string, string>> = {
	Exhausted:
		'Each level applies a cumulative −1 penalty to all d20 Tests (attack rolls, ability checks, saving throws) and to your Spell Save DC. Speed is also halved at level 5. Death at level 10. A long rest removes one level.',
	Grappled:
		"Speed is 0 and can't benefit from bonuses to Speed. Ends if the grappler becomes Incapacitated, or if the grappled creature escapes (Athletics or Acrobatics vs. grappler's Athletics).",
	Incapacitated: "Can't take Actions, Bonus Actions, or Reactions. Can't concentrate.",
	Prone:
		'Can only crawl, or spend half Speed to stand up. Disadvantage on attack rolls. Attacks from within 5 ft. have advantage; attacks from farther away have disadvantage.'
};

// Descriptions for the SPELL_EFFECTS quick-pick list (see src/lib/enemies.ts). Custom,
// freely-typed spell effect names fall through to the generic "no description" text.
export const spellEffectDescriptions: Record<string, string> = {
	Bless: 'Add 1d4 to attack rolls and saving throws while concentrating.',
	Bane: 'Subtract 1d4 from attack rolls and saving throws while concentrating.',
	"Hunter's Mark":
		'Deals an extra 1d6 damage to the marked target on hit; caster has advantage on Wisdom (Perception) or Wisdom (Survival) checks to find it.',
	Hex: 'Deals an extra 1d6 necrotic damage to the cursed target on hit; caster has disadvantage on ability checks with the chosen ability.',
	Guidance: 'Add 1d4 to one ability check before the spell ends.',
	Resistance: 'Add 1d4 to one saving throw before the spell ends.',
	'Shield of Faith': '+2 bonus to AC while concentrating.',
	'Mage Armor': 'AC becomes 13 + DEX modifier (if not wearing armor) for the duration.',
	Barkskin: "AC can't be lower than 16, regardless of armor worn.",
	Stoneskin: 'Resistance to nonmagical bludgeoning, piercing, and slashing damage.',
	'Fire Shield':
		'Wreathed in flame, shedding light and gaining resistance to cold or fire damage; melee attackers take 2d8 fire or cold damage.',
	Haste:
		'Speed doubled, +2 AC, advantage on DEX saves, and an extra action (attack, dash, disengage, hide, or use object).',
	Slow: 'Speed halved, -2 AC and DEX saves, and can only take an action or a bonus action, not both.',
	Heroism: 'Immune to being frightened; gains temporary HP each turn while concentrating.',
	Enlarge: 'Size doubles, gains advantage on STR checks/saves, and deals an extra 1d4 damage.',
	Reduce: 'Size halved, disadvantage on STR checks/saves, and deals 1d4 less damage.',
	'Faerie Fire':
		'Outlined in light; attacks against it have advantage, and it can’t benefit from being invisible.',
	Sanctuary: 'Attackers must make a Wisdom save or choose a new target; ends if it attacks.',
	'Warding Bond': '+1 AC and saves, resistance to all damage; caster takes the same damage taken.',
	'Bestow Curse':
		'Disadvantage on ability checks/attacks with a chosen ability, disadvantage on saves of one type, or caster deals extra 1d8 damage to it (DM choice of effect).',
	'Mirror Image':
		'Three illusory duplicates; attackers may hit a duplicate instead of the real target.',
	Blur: 'Attackers have disadvantage on attack rolls against it due to its blurred, shifting form.',
	Silenced:
		"Can't cast spells with verbal components and no sound can be heard from within the area.",
	Aid: 'Maximum and current HP increased by 5 (or more at higher levels) for the duration.'
};

/** Returns the correct condition/spell-effect description for the given edition. */
export function getConditionDescription(
	condition: string,
	ruleset: '2014' | '2024' = '2014'
): string {
	if (ruleset === '2024') {
		return (
			conditionDescriptions2024Overrides[condition] ??
			conditionDescriptions[condition] ??
			spellEffectDescriptions[condition] ??
			'No description available.'
		);
	}
	return (
		conditionDescriptions[condition] ??
		spellEffectDescriptions[condition] ??
		'No description available.'
	);
}

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
	'Advantage For': 'bg-emerald-700 text-emerald-100',
	'Advantage Against': 'bg-rose-800 text-rose-200',
	'Disadvantage For': 'bg-orange-800 text-orange-200',
	'Disadvantage Against': 'bg-teal-700 text-teal-100'
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
	'0': 10,
	'1/8': 25,
	'1/4': 50,
	'1/2': 100,
	'1': 200,
	'2': 450,
	'3': 700,
	'4': 1100,
	'5': 1800,
	'6': 2300,
	'7': 2900,
	'8': 3900,
	'9': 5000,
	'10': 5900,
	'11': 7200,
	'12': 8400,
	'13': 10000,
	'14': 11500,
	'15': 13000,
	'16': 15000,
	'17': 18000,
	'18': 20000,
	'19': 22000,
	'20': 25000,
	'21': 33000,
	'22': 41000,
	'23': 50000,
	'24': 62000,
	'25': 75000,
	'26': 90000,
	'27': 105000,
	'28': 120000,
	'29': 135000,
	'30': 155000
};

export function crToXp(cr: string): number {
	return XP_BY_CR[cr] ?? 0;
}

// D&D 5e XP thresholds per player per level [easy, medium, hard, deadly]
const XP_THRESHOLDS: Record<number, [number, number, number, number]> = {
	1: [25, 50, 75, 100],
	2: [50, 100, 150, 200],
	3: [75, 150, 225, 400],
	4: [125, 250, 375, 500],
	5: [250, 500, 750, 1100],
	6: [300, 600, 900, 1400],
	7: [350, 750, 1100, 1700],
	8: [450, 900, 1400, 2100],
	9: [550, 1100, 1600, 2400],
	10: [600, 1200, 1900, 2800],
	11: [800, 1600, 2400, 3600],
	12: [1000, 2000, 3000, 4500],
	13: [1100, 2200, 3400, 5100],
	14: [1250, 2500, 3800, 5700],
	15: [1400, 2800, 4300, 6400],
	16: [1600, 3200, 4800, 7200],
	17: [2000, 3900, 5900, 8800],
	18: [2100, 4200, 6300, 9500],
	19: [2400, 4900, 7300, 10900],
	20: [2800, 5700, 8500, 12700]
};

// D&D 2024 XP budget per character per level [low, moderate, high, severe, deadly]
// Encounter difficulty = compare raw monster XP (no multiplier) to budget × party size.
const XP_THRESHOLDS_2024: Record<number, [number, number, number, number, number]> = {
	1: [50, 75, 100, 150, 200],
	2: [100, 150, 200, 250, 350],
	3: [150, 225, 400, 550, 700],
	4: [250, 375, 500, 750, 1100],
	5: [500, 750, 1100, 1700, 2700],
	6: [600, 1000, 1400, 2100, 3200],
	7: [750, 1100, 1700, 2600, 3900],
	8: [1000, 1400, 2100, 3100, 4700],
	9: [1300, 1600, 2400, 3700, 5400],
	10: [1600, 1900, 2800, 4300, 6400],
	11: [1900, 2400, 3600, 5400, 7800],
	12: [2200, 3000, 4500, 6600, 9600],
	13: [2600, 3400, 5100, 7800, 11200],
	14: [2900, 3800, 5700, 8600, 12400],
	15: [3300, 4300, 6400, 9800, 14000],
	16: [3800, 4800, 7200, 10800, 15800],
	17: [4500, 5900, 8800, 13200, 18800],
	18: [5000, 6300, 9500, 14300, 20800],
	19: [5500, 7300, 10900, 16100, 23000],
	20: [6400, 8500, 12700, 19200, 27200]
};

export type EncounterDifficulty2024 = 'Trivial' | 'Low' | 'Moderate' | 'High' | 'Severe' | 'Deadly';

/**
 * 2024 encounter difficulty — no enemy-count multiplier; uses XP budget thresholds.
 * @param rawXp  Sum of XP for all enemies (no multiplier applied)
 * @param partySize  Number of players
 * @param partyLevel  Average party level (1–20)
 */
export function encounterDifficulty2024(
	rawXp: number,
	partySize: number,
	partyLevel: number
): EncounterDifficulty2024 {
	if (partySize <= 0 || partyLevel <= 0) return 'Trivial';
	const level = Math.max(1, Math.min(20, Math.round(partyLevel)));
	const [low, moderate, high, severe, deadly] = XP_THRESHOLDS_2024[level].map((t) => t * partySize);
	if (rawXp < low) return 'Trivial';
	if (rawXp < moderate) return 'Low';
	if (rawXp < high) return 'Moderate';
	if (rawXp < severe) return 'High';
	if (rawXp < deadly) return 'Severe';
	return 'Deadly';
}

/** D&D 5e encounter multiplier based on total enemy count. */
export function encounterMultiplier(enemyCount: number): number {
	if (enemyCount <= 1) return 1;
	if (enemyCount === 2) return 1.5;
	if (enemyCount <= 6) return 2;
	if (enemyCount <= 10) return 2.5;
	if (enemyCount <= 14) return 3;
	return 4;
}

export type EncounterDifficulty = 'Trivial' | 'Easy' | 'Medium' | 'Hard' | 'Deadly';

/**
 * Returns the encounter difficulty label based on adjusted XP vs party thresholds.
 * @param rawXp  Sum of XP for all enemies (before multiplier)
 * @param enemyCount  Total number of individual enemies
 * @param partySize  Number of players
 * @param partyLevel  Average party level (1–20)
 */
export function encounterDifficulty(
	rawXp: number,
	enemyCount: number,
	partySize: number,
	partyLevel: number
): EncounterDifficulty {
	if (partySize <= 0 || partyLevel <= 0) return 'Trivial';
	const level = Math.max(1, Math.min(20, Math.round(partyLevel)));
	const thresholds = XP_THRESHOLDS[level];
	const adjusted = rawXp * encounterMultiplier(enemyCount);
	const [easy, medium, hard, deadly] = thresholds.map((t) => t * partySize);
	if (adjusted < easy) return 'Trivial';
	if (adjusted < medium) return 'Easy';
	if (adjusted < hard) return 'Medium';
	if (adjusted < deadly) return 'Hard';
	return 'Deadly';
}
