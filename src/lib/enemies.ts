// Enemy and condition data.
// ENEMY_TEMPLATES and MONSTER_TYPES are built from a pre-generated lightweight JSON (~27 KB)
// so the 570 KB monsters.json is excluded from the initial server/client bundle.
// Full stat blocks are loaded on demand via preloadMonsterDetails().
import type { EnemyTemplate, MonsterDetail } from './types';
import rawTemplates from './data/enemy-templates-2014.json';

// ---------------------------------------------------------------------------
// ENEMY_TEMPLATES — built from the pre-generated lightweight JSON
// ---------------------------------------------------------------------------

export const ENEMY_TEMPLATES: EnemyTemplate[] = rawTemplates as EnemyTemplate[];

// ---------------------------------------------------------------------------
// Derived lists
// ---------------------------------------------------------------------------

export const MONSTER_TYPES = ['All', ...new Set(ENEMY_TEMPLATES.map((e) => e.monsterType))].sort();

// ---------------------------------------------------------------------------
// Monster detail lookup — full stat block for the info modal
// Loaded lazily; call preloadMonsterDetails() once (e.g. on EnemyPanel mount)
// before using getMonsterDetail().
// ---------------------------------------------------------------------------

let detailMap: Map<string, MonsterDetail> | null = null;
let loadPromise: Promise<void> | null = null;

export function preloadMonsterDetails(): Promise<void> {
	if (detailMap) return Promise.resolve();
	if (loadPromise) return loadPromise;
	loadPromise = import('./data/monsters.json').then(({ default: raw }) => {
		type RawMonster = {
			name: string;
			meta: string;
			'Armor Class': string;
			'Hit Points': string;
			Speed: string;
			STR: string;
			STR_mod: string;
			DEX: string;
			DEX_mod: string;
			CON: string;
			CON_mod: string;
			INT: string;
			INT_mod: string;
			WIS: string;
			WIS_mod: string;
			CHA: string;
			CHA_mod: string;
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
		};
		detailMap = new Map<string, MonsterDetail>(
			(raw as RawMonster[]).map((m) => [
				m.name,
				{
					name: m.name,
					meta: m.meta,
					armorClass: m['Armor Class'],
					hitPoints: m['Hit Points'],
					speed: m.Speed,
					str: parseInt(m.STR),
					strMod: m.STR_mod,
					dex: parseInt(m.DEX),
					dexMod: m.DEX_mod,
					con: parseInt(m.CON),
					conMod: m.CON_mod,
					int: parseInt(m.INT),
					intMod: m.INT_mod,
					wis: parseInt(m.WIS),
					wisMod: m.WIS_mod,
					cha: parseInt(m.CHA),
					chaMod: m.CHA_mod,
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
	});
	return loadPromise;
}

export function getMonsterDetail(name: string): MonsterDetail | undefined {
	return detailMap?.get(name);
}

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

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
	'Stunned'
] as const;

export const ADV_CONDITIONS = [
	'Advantage For',
	'Advantage Against',
	'Disadvantage For',
	'Disadvantage Against'
] as const;
