import type { Combatant, EnemyTemplate, StorageState } from './types';
import { browser } from '$app/environment';
import { sortCombatants } from './utils';

// Re-export so existing imports from this module still work.
export type { StorageState };

function syncToServer(state: StorageState) {
	if (!browser) return;
	fetch('/api/state', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(state)
	}).catch(() => {
		// Fire-and-forget — nothing to do if the server is unreachable.
	});
}

function createCombatStore() {
	let combatants = $state<Combatant[]>([]);
	let currentTurnId = $state<string | null>(null);
	let round = $state(1);

	function sync() {
		syncToServer({ combatants, currentTurnId, round });
	}

	/** Combatants currently participating in the initiative order. */
	function activeCombatants() {
		return combatants.filter((c) => c.inCombat !== false);
	}

	return {
		get combatants() {
			return combatants;
		},
		get players() {
			return combatants.filter((c) => c.type === 'player');
		},
		get sorted() {
			return sortCombatants(activeCombatants());
		},
		get currentTurnId() {
			return currentTurnId;
		},
		get round() {
			return round;
		},
		get currentTurn() {
			return combatants.find((c) => c.id === currentTurnId) ?? null;
		},
		get isInCombat() {
			return currentTurnId !== null;
		},

		/** Hydrate store from the server — call once on DM page mount. */
		async loadFromServer() {
			if (!browser) return;
			try {
				const res = await fetch('/api/state');
				if (!res.ok) return;
				const s: StorageState = await res.json();
				combatants = s.combatants;
				currentTurnId = s.currentTurnId;
				round = s.round;
			} catch {
				// Server not reachable yet — start fresh.
			}
		},

		addPlayer(name: string, ac: number, maxHp: number) {
			combatants = [
				...combatants,
				{
					id: crypto.randomUUID(),
					name,
					type: 'player',
					ac,
					maxHp,
					currentHp: maxHp,
					tempHp: 0,
					statuses: [],
					initiative: null,
					inCombat: true
				}
			];
			sync();
		},

		addEnemies(template: EnemyTemplate, quantity: number) {
			const newEnemies: Combatant[] = Array.from({ length: quantity }, (_, i) => ({
				id: crypto.randomUUID(),
				name: quantity > 1 ? `${template.name} ${i + 1}` : template.name,
				type: 'enemy' as const,
				ac: template.ac,
				maxHp: template.hp,
				currentHp: template.hp,
				tempHp: 0,
				statuses: [],
				initiative: null,
				templateName: template.name,
				monsterType: template.monsterType,
				inCombat: true
			}));
			combatants = [...combatants, ...newEnemies];
			sync();
		},

		remove(id: string) {
			if (currentTurnId === id) {
				const sorted = sortCombatants(activeCombatants());
				const idx = sorted.findIndex((c) => c.id === id);
				const remaining = sorted.filter((c) => c.id !== id);
				currentTurnId = remaining[idx % remaining.length]?.id ?? null;
			}
			combatants = combatants.filter((c) => c.id !== id);
			sync();
		},

		/** Remove from the initiative order.
		 *  Players are kept in the party roster (inCombat → false).
		 *  Enemies are fully deleted. */
		removeFromCombat(id: string) {
			const target = combatants.find((c) => c.id === id);
			if (!target) return;
			if (currentTurnId === id) {
				const sorted = sortCombatants(activeCombatants());
				const idx = sorted.findIndex((c) => c.id === id);
				const remaining = sorted.filter((c) => c.id !== id);
				currentTurnId = remaining[idx % remaining.length]?.id ?? null;
			}
			if (target.type === 'enemy') {
				combatants = combatants.filter((c) => c.id !== id);
			} else {
				combatants = combatants.map((c) =>
					c.id === id ? { ...c, inCombat: false, initiative: null } : c
				);
			}
			sync();
		},

		/** Re-add a benched player to the initiative order. */
		addToCombat(id: string) {
			combatants = combatants.map((c) => (c.id === id ? { ...c, inCombat: true } : c));
			sync();
		},

		update(id: string, updates: Partial<Combatant>) {
			combatants = combatants.map((c) => (c.id === id ? { ...c, ...updates } : c));
			sync();
		},

		adjustHp(id: string, delta: number) {
			combatants = combatants.map((c) => {
				if (c.id !== id) return c;
				if (delta < 0 && c.tempHp > 0) {
					const absorbed = Math.min(c.tempHp, -delta);
					const spill = -delta - absorbed;
					return { ...c, tempHp: c.tempHp - absorbed, currentHp: Math.max(0, c.currentHp - spill) };
				}
				return { ...c, currentHp: Math.max(0, Math.min(c.maxHp, c.currentHp + delta)) };
			});
			sync();
		},

		setTempHp(id: string, value: number) {
			combatants = combatants.map((c) => (c.id === id ? { ...c, tempHp: Math.max(0, value) } : c));
			sync();
		},

		toggleStatus(id: string, status: string) {
			combatants = combatants.map((c) => {
				if (c.id !== id) return c;
				const statuses = c.statuses.includes(status)
					? c.statuses.filter((s) => s !== status)
					: [...c.statuses, status];
				return { ...c, statuses };
			});
			sync();
		},

		clearEnemies() {
			const current = combatants.find((c) => c.id === currentTurnId);
			if (current?.type === 'enemy') currentTurnId = null;
			combatants = combatants.filter((c) => c.type === 'player');
			sync();
		},

		resetInitiatives() {
			combatants = combatants.map((c) => ({ ...c, initiative: null }));
			currentTurnId = null;
			round = 1;
			sync();
		},

		startCombat() {
			const sorted = sortCombatants(activeCombatants());
			if (sorted.length === 0) return;
			currentTurnId = sorted[0].id;
			round = 1;
			sync();
		},

		nextTurn() {
			const sorted = sortCombatants(activeCombatants());
			if (sorted.length === 0) return;
			if (currentTurnId === null) {
				currentTurnId = sorted[0].id;
				round = 1;
			} else {
				const idx = sorted.findIndex((c) => c.id === currentTurnId);
				const nextIdx = (idx + 1) % sorted.length;
				if (nextIdx === 0) round += 1;
				currentTurnId = sorted[nextIdx].id;
			}
			sync();
		},

		prevTurn() {
			const sorted = sortCombatants(activeCombatants());
			if (sorted.length === 0) return;
			if (currentTurnId === null) {
				currentTurnId = sorted[sorted.length - 1].id;
			} else {
				const idx = sorted.findIndex((c) => c.id === currentTurnId);
				if (idx === 0 && round > 1) round -= 1;
				currentTurnId = sorted[(idx - 1 + sorted.length) % sorted.length].id;
			}
			sync();
		},

		endCombat() {
			currentTurnId = null;
			round = 1;
			sync();
		}
	};
}

export const combat = createCombatStore();
