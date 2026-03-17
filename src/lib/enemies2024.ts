// 2024 Monster Manual bestiary — structured stat blocks sourced from monsters-2024.json.
// Exports ENEMY_TEMPLATES_2024 (for the enemy panel), getMonsterDetail2024() (for stat block
// display), and MONSTER_TYPES_2024 (for filtering).
import type { EnemyTemplate, MonsterDetail2024 } from '$lib/types';
import rawMonsters from '$lib/data/monsters-2024.json';

const monsters = rawMonsters as MonsterDetail2024[];

// ---------------------------------------------------------------------------
// EnemyTemplate list — minimal data needed for the initiative panel
// ---------------------------------------------------------------------------
export const ENEMY_TEMPLATES_2024: EnemyTemplate[] = monsters
	.filter((m) => m.cr !== 'None' && m.cr !== null)
	.map((m) => {
		// Parse AC: strip parenthetical notes, take first number
		const acStr = typeof m.ac === 'string' ? m.ac : String(m.ac);
		const acNum = parseInt(acStr) || 10;

		// Parse HP: take the average (first number before the parenthetical)
		const hpStr = typeof m.hp === 'string' ? m.hp : String(m.hp);
		const hpNum = parseInt(hpStr) || 1;

		// DEX modifier from abilities
		const dexMod = m.abilities?.DEX?.mod
			? parseInt(m.abilities.DEX.mod)
			: 0;

		return {
			name: m.name,
			ac: acNum,
			hp: hpNum,
			cr: m.cr,
			monsterType: m.type ?? 'Unknown',
			dexMod: isNaN(dexMod) ? 0 : dexMod
		};
	});

// ---------------------------------------------------------------------------
// Monster type list for filtering (unique, sorted)
// ---------------------------------------------------------------------------
export const MONSTER_TYPES_2024: string[] = [
	...new Set(monsters.map((m) => m.type).filter(Boolean))
].sort();

// ---------------------------------------------------------------------------
// Detail lookup by name
// ---------------------------------------------------------------------------
const detailByName = new Map<string, MonsterDetail2024>(monsters.map((m) => [m.name, m]));
const detailBySlug = new Map<string, MonsterDetail2024>(monsters.map((m) => [m.slug, m]));

export function getMonsterDetail2024(name: string): MonsterDetail2024 | undefined {
	return detailByName.get(name) ?? detailBySlug.get(name);
}
