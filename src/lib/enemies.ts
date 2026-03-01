import type { EnemyTemplate, MonsterDetail } from './types';
import rawMonsters from './data/monsters.json';

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function parseAc(s: string): number {
	const m = s.match(/\d+/);
	return m ? parseInt(m[0]) : 10;
}

function parseHp(s: string): number {
	const m = s.match(/\d+/);
	return m ? parseInt(m[0]) : 1;
}

function parseCr(s: string): string {
	return s.split('(')[0].trim();
}

function parseDexMod(dexModStr: string): number {
	return parseInt(dexModStr.replace(/[()]/g, '')) || 0;
}

function extractMonsterType(meta: string): string {
	const beforeComma = meta.split(',')[0].trim().toLowerCase();
	if (beforeComma.startsWith('swarm')) return 'Beast';
	const sizes = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];
	let t = beforeComma;
	for (const size of sizes) {
		if (t.startsWith(size + ' ')) {
			t = t.slice(size.length + 1);
			break;
		}
	}
	t = t.replace(/\(.*\)/, '').trim();
	const word = t.split(' ')[0];
	return word.charAt(0).toUpperCase() + word.slice(1);
}

// ---------------------------------------------------------------------------
// Type for raw JSON entries
// ---------------------------------------------------------------------------

interface RawMonster {
	name: string;
	meta: string;
	'Armor Class': string;
	'Hit Points': string;
	Speed: string;
	STR: string; STR_mod: string;
	DEX: string; DEX_mod: string;
	CON: string; CON_mod: string;
	INT: string; INT_mod: string;
	WIS: string; WIS_mod: string;
	CHA: string; CHA_mod: string;
	'Saving Throws'?: string;
	Skills?: string;
	'Damage Immunities'?: string;
	'Damage Resistances'?: string;
	'Condition Immunities'?: string;
	Senses?: string;
	Languages?: string;
	Challenge: string;
	Traits?: string;
	Actions?: string;
	Reactions?: string;
	'Legendary Actions'?: string;
	img_url?: string;
}

const monsters = rawMonsters as RawMonster[];

// ---------------------------------------------------------------------------
// ENEMY_TEMPLATES — the lightweight list used for encounter building
// ---------------------------------------------------------------------------

export const ENEMY_TEMPLATES: EnemyTemplate[] = monsters.map((m) => ({
	name: m.name,
	ac: parseAc(m['Armor Class']),
	hp: parseHp(m['Hit Points']),
	cr: parseCr(m.Challenge),
	monsterType: extractMonsterType(m.meta),
	dexMod: parseDexMod(m.DEX_mod)
}));

// ---------------------------------------------------------------------------
// Monster detail lookup — full stat block for the info modal
// ---------------------------------------------------------------------------

const detailMap = new Map<string, MonsterDetail>(
	monsters.map((m) => [
		m.name,
		{
			name: m.name,
			meta: m.meta,
			armorClass: m['Armor Class'],
			hitPoints: m['Hit Points'],
			speed: m.Speed,
			str: parseInt(m.STR), strMod: m.STR_mod,
			dex: parseInt(m.DEX), dexMod: m.DEX_mod,
			con: parseInt(m.CON), conMod: m.CON_mod,
			int: parseInt(m.INT), intMod: m.INT_mod,
			wis: parseInt(m.WIS), wisMod: m.WIS_mod,
			cha: parseInt(m.CHA), chaMod: m.CHA_mod,
			savingThrows: m['Saving Throws'],
			skills: m.Skills,
			damageImmunities: m['Damage Immunities'],
			damageResistances: m['Damage Resistances'],
			conditionImmunities: m['Condition Immunities'],
			senses: m.Senses,
			languages: m.Languages,
			challenge: m.Challenge,
			traits: m.Traits,
			actions: m.Actions,
			reactions: m.Reactions,
			legendaryActions: m['Legendary Actions'],
			imgUrl: m.img_url
		}
	])
);

export function getMonsterDetail(name: string): MonsterDetail | undefined {
	return detailMap.get(name);
}

// ---------------------------------------------------------------------------
// Derived lists
// ---------------------------------------------------------------------------

export const MONSTER_TYPES = ['All', ...new Set(ENEMY_TEMPLATES.map((e) => e.monsterType))].sort();

export const CONDITIONS = [
	'Blinded',
	'Charmed',
	'Concentrating',
	'Deafened',
	'Exhausted',
	'Frightened',
	'Grappled',
	'Incapacitated',
	'Invisible',
	'Paralyzed',
	'Petrified',
	'Poisoned',
	'Prone',
	'Restrained',
	'Stunned',
] as const;

export const ADV_CONDITIONS = [
	'Advantage For',
	'Advantage Against',
	'Disadvantage For',
	'Disadvantage Against',
] as const;
