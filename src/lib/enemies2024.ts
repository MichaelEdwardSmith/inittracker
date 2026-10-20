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

// ---------------------------------------------------------------------------
// Legendary Actions / Resistance — 2024 stat blocks keep these as structured fields, so
// unlike the 2014 free-text parsing we read the counts from the trait name and preamble.
// Counts use the out-of-lair value (e.g. "3/Day, or 4/Day in Lair" → 3).
// ---------------------------------------------------------------------------

export interface Legendary2024 {
	actions: { max: number; text: string } | null;
	resistance: { max: number; text: string } | null;
}

function actionHtml(a: { name: string; description: string }): string {
	return `<p><strong>${a.name}.</strong> ${a.description}</p>`;
}

export function getLegendaryInfo2024(detail: MonsterDetail2024 | undefined): Legendary2024 {
	const result: Legendary2024 = { actions: null, resistance: null };
	if (!detail) return result;

	const lrTrait = detail.traits.find((t) => /^Legendary Resistance/i.test(t.name));
	const lrMax = lrTrait?.name.match(/\((\d+)\s*\/\s*Day/i)?.[1];
	if (lrTrait && lrMax) result.resistance = { max: parseInt(lrMax, 10), text: actionHtml(lrTrait) };

	const { preamble, actions } = detail.legendary;
	if (actions.length > 0) {
		const uses = preamble?.match(/Uses:\s*(\d+)/i)?.[1];
		result.actions = {
			max: uses ? parseInt(uses, 10) : 3,
			text: (preamble ? `<p>${preamble}</p>` : '') + actions.map(actionHtml).join('')
		};
	}
	return result;
}
