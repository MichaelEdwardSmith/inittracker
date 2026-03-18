// 2024 Monster Manual bestiary.
// ENEMY_TEMPLATES_2024 and MONSTER_TYPES_2024 are built from a pre-generated lightweight JSON
// (~44 KB) so the 1.28 MB monsters-2024.json is excluded from the initial bundle.
// Full stat blocks are loaded on demand via preloadMonsterDetails2024().
import type { EnemyTemplate, MonsterDetail2024 } from '$lib/types';
import rawTemplates from '$lib/data/enemy-templates-2024.json';

// ---------------------------------------------------------------------------
// ENEMY_TEMPLATES_2024 — built from the pre-generated lightweight JSON
// ---------------------------------------------------------------------------

export const ENEMY_TEMPLATES_2024: EnemyTemplate[] = rawTemplates as EnemyTemplate[];

// ---------------------------------------------------------------------------
// Monster type list for filtering
// ---------------------------------------------------------------------------

export const MONSTER_TYPES_2024: string[] = [
	...new Set(ENEMY_TEMPLATES_2024.map((m) => m.monsterType).filter(Boolean))
].sort();

// ---------------------------------------------------------------------------
// Monster detail lookup — full stat block for the info modal
// Loaded lazily; call preloadMonsterDetails2024() once (e.g. on EnemyPanel mount).
// ---------------------------------------------------------------------------

let detailByName: Map<string, MonsterDetail2024> | null = null;
let detailBySlug: Map<string, MonsterDetail2024> | null = null;
let loadPromise: Promise<void> | null = null;

export function preloadMonsterDetails2024(): Promise<void> {
	if (detailByName) return Promise.resolve();
	if (loadPromise) return loadPromise;
	loadPromise = import('$lib/data/monsters-2024.json').then(({ default: raw }) => {
		const monsters = raw as MonsterDetail2024[];
		detailByName = new Map(monsters.map((m) => [m.name, m]));
		detailBySlug = new Map(monsters.map((m) => [m.slug, m]));
	});
	return loadPromise;
}

export function getMonsterDetail2024(name: string): MonsterDetail2024 | undefined {
	return detailByName?.get(name) ?? detailBySlug?.get(name);
}
