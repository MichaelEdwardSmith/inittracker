// Chase complication tables (DMG chase rules) — shared by QuickRulesModal and the
// Chase Tracker's "draw a complication" button so the two never drift apart.

export interface ChaseComplication {
	roll: string;
	name: string;
	effect: string;
}

export const URBAN_CHASE_COMPLICATIONS: ChaseComplication[] = [
	{
		roll: '1',
		name: 'Large obstacle (cart/horse)',
		effect: 'DC 15 Dex (Acrobatics) or 10 ft. difficult terrain'
	},
	{
		roll: '2',
		name: 'Crowd blocks the way',
		effect: 'DC 10 Str (Athletics)/Dex (Acrobatics) or 10 ft. difficult terrain'
	},
	{ roll: '3', name: 'Stained-glass window', effect: 'DC 10 Str save or fall prone' },
	{
		roll: '4',
		name: 'Maze of barrels/crates',
		effect: 'DC 10 Dex (Acrobatics)/Int or 10 ft. difficult terrain'
	},
	{ roll: '5', name: 'Slippery ground', effect: 'DC 10 Dex save or fall prone' },
	{
		roll: '6',
		name: 'Pack of dogs',
		effect: 'DC 10 Dex (Acrobatics) or 1d4 piercing + difficult terrain'
	},
	{
		roll: '7',
		name: 'Brawl in progress',
		effect: 'DC 15 Str/Dex/Cha or 2d4 bludgeoning + difficult terrain'
	},
	{
		roll: '8',
		name: 'Beggar in the way',
		effect: 'Toss a coin (auto-avoid) or DC 10 check / difficult terrain'
	},
	{ roll: '9', name: 'Overzealous guard', effect: 'OA if you move 20+ ft (+3 to hit, 1d6+1)' },
	{ roll: '10', name: 'Sharp turn', effect: 'DC 10 Dex save or 1d4 bludgeoning' },
	{ roll: '11–20', name: 'No complication', effect: '—' }
];

export const WILDERNESS_CHASE_COMPLICATIONS: ChaseComplication[] = [
	{
		roll: '1',
		name: 'Rough brush',
		effect: 'DC 10 Str (Athletics)/Dex (Acrobatics) or 5 ft. difficult terrain'
	},
	{
		roll: '2',
		name: 'Uneven ground',
		effect: 'DC 10 Dex (Acrobatics) or 10 ft. difficult terrain'
	},
	{ roll: '3', name: 'Insect swarm', effect: 'OA (+3 to hit, 4d4 piercing)' },
	{
		roll: '4',
		name: 'Stream, ravine, or rocky bed',
		effect: 'DC 10 Str (Athletics)/Dex (Acrobatics) or 10 ft. difficult terrain'
	},
	{
		roll: '5',
		name: 'Blinding elements',
		effect: 'DC 10 CON save or blinded until end of turn, speed halved'
	},
	{
		roll: '6',
		name: 'Sudden drop',
		effect: 'DC 10 Dex save or fall 1d4 × 5 ft, 1d6/10 ft, prone'
	},
	{ roll: '7', name: "Hunter's snare", effect: 'DC 15 Dex save or restrained (netted)' },
	{
		roll: '8',
		name: 'Animal stampede',
		effect: 'DC 10 Dex save or 1d4 bludgeoning + 1d4 piercing'
	},
	{
		roll: '9',
		name: 'Razorvine patch',
		effect: 'DC 15 Dex save or 1d10 slashing (or lose 10 ft. movement)'
	},
	{ roll: '10', name: 'Indigenous creature joins the chase', effect: "DM's choice" },
	{ roll: '11–20', name: 'No complication', effect: '—' }
];

/** Rolls a d20 against the complication table and returns the matching entry
 *  (the "11–20 / No complication" row on a roll above 10, per the DMG rule). */
export function rollChaseComplication(table: ChaseComplication[]): ChaseComplication {
	const roll = 1 + Math.floor(Math.random() * 20);
	return roll <= 10 ? table[roll - 1] : table[table.length - 1];
}
