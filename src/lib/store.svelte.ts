import type { Combatant, EnemyTemplate, StorageState, CombatEvent, CombatRecord, CombatantSummary } from './types';
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

function saveRecordToServer(record: CombatRecord) {
	if (!browser) return;
	fetch('/api/history', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(record)
	}).catch(() => {});
}

type ParticipantStat = {
	startHp: number;
	totalDamage: number;
	totalHealing: number;
	wasSlain: boolean;
};

function createCombatStore() {
	let combatants = $state<Combatant[]>([]);
	let currentTurnId = $state<string | null>(null);
	let round = $state(1);

	// History tracking
	let combatEvents = $state<CombatEvent[]>([]);
	let combatStartedAt = $state<string | null>(null);
	let participantStats = $state<Map<string, ParticipantStat>>(new Map());

	function sync() {
		syncToServer({ combatants, currentTurnId, round });
	}

	/** Combatants currently participating in the initiative order. */
	function activeCombatants() {
		return combatants.filter((c) => c.inCombat !== false);
	}

	/** Combatants eligible to take a turn — active, and not a dead enemy. */
	function turnEligible() {
		return activeCombatants().filter((c) => !(c.type === 'enemy' && c.currentHp <= 0));
	}

	function snapshotCombatant(c: Combatant) {
		if (!participantStats.has(c.id)) {
			participantStats.set(c.id, {
				startHp: c.currentHp,
				totalDamage: 0,
				totalHealing: 0,
				wasSlain: false
			});
		}
	}

	function buildRecord(endedAt: string): CombatRecord {
		const participants: CombatantSummary[] = combatants.map((c) => {
			const stats = participantStats.get(c.id);
			return {
				id: c.id,
				name: c.name,
				type: c.type,
				maxHp: c.maxHp,
				startHp: stats?.startHp ?? c.maxHp,
				finalHp: c.currentHp,
				totalDamage: stats?.totalDamage ?? 0,
				totalHealing: stats?.totalHealing ?? 0,
				wasSlain: c.currentHp <= 0
			};
		});

		return {
			id: crypto.randomUUID(),
			startedAt: combatStartedAt ?? endedAt,
			endedAt,
			rounds: round,
			participants,
			events: [...combatEvents]
		};
	}

	function resetTracking() {
		combatEvents = [];
		combatStartedAt = null;
		participantStats = new Map();
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
		get hasCombatHistory() {
			return combatStartedAt !== null;
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
			const c: Combatant = {
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
			};
			combatants = [...combatants, c];
			if (combatStartedAt !== null) snapshotCombatant(c);
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
				initiative: quantity > 1 ? Math.max(1, Math.floor(Math.random() * 20) + 1 + (template.dexMod ?? 0)) : null,
				templateName: template.name,
				monsterType: template.monsterType,
				imgUrl: template.imgUrl,
				inCombat: true
			}));
			combatants = [...combatants, ...newEnemies];
			if (combatStartedAt !== null) {
				for (const e of newEnemies) snapshotCombatant(e);
			}
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
			let hpBefore = 0;
			let hpAfter = 0;
			let combatantRef: Combatant | undefined;

			combatants = combatants.map((c) => {
				if (c.id !== id) return c;
				combatantRef = c;
				hpBefore = c.currentHp;
				let updated: Combatant;
				if (delta < 0 && c.tempHp > 0) {
					const absorbed = Math.min(c.tempHp, -delta);
					const spill = -delta - absorbed;
					updated = { ...c, tempHp: c.tempHp - absorbed, currentHp: Math.max(0, c.currentHp - spill) };
				} else {
					updated = { ...c, currentHp: Math.max(0, Math.min(c.maxHp, c.currentHp + delta)) };
				}
				hpAfter = updated.currentHp;
				return updated;
			});

			// Log event if in a tracked combat
			if (combatStartedAt !== null && combatantRef) {
				const c = combatantRef;
				const actor = currentTurnId ? combatants.find((x) => x.id === currentTurnId) : undefined;
				const actorFields = actor
					? { actorId: actor.id, actorName: actor.name, actorType: actor.type }
					: {};
				const actualDelta = hpAfter - hpBefore;
				if (actualDelta < 0) {
					const dmg = -actualDelta;
					const causedDown = hpBefore > 0 && hpAfter === 0;
					combatEvents = [...combatEvents, {
						type: 'damage',
						round,
						...actorFields,
						combatantId: id,
						combatantName: c.name,
						combatantType: c.type,
						value: dmg,
						hpBefore,
						hpAfter,
						causedDown: causedDown || undefined
					}];
					const stats = participantStats.get(id);
					if (stats) {
						participantStats.set(id, {
							...stats,
							totalDamage: stats.totalDamage + dmg,
							wasSlain: stats.wasSlain || causedDown
						});
					}
				} else if (actualDelta > 0) {
					combatEvents = [...combatEvents, {
						type: 'heal',
						round,
						...actorFields,
						combatantId: id,
						combatantName: c.name,
						combatantType: c.type,
						value: actualDelta,
						hpBefore,
						hpAfter
					}];
					const stats = participantStats.get(id);
					if (stats) {
						participantStats.set(id, { ...stats, totalHealing: stats.totalHealing + actualDelta });
					}
				}
			}

			sync();
		},

		setTempHp(id: string, value: number) {
			combatants = combatants.map((c) => (c.id === id ? { ...c, tempHp: Math.max(0, value) } : c));
			sync();
		},

		toggleStatus(id: string, status: string) {
			let adding = false;
			let combatantRef: Combatant | undefined;
			combatants = combatants.map((c) => {
				if (c.id !== id) return c;
				combatantRef = c;
				const has = c.statuses.includes(status);
				adding = !has;
				const statuses = has
					? c.statuses.filter((s) => s !== status)
					: [...c.statuses, status];
				return { ...c, statuses };
			});

			if (combatStartedAt !== null && combatantRef) {
				const actor = currentTurnId ? combatants.find((x) => x.id === currentTurnId) : undefined;
				const actorFields = actor
					? { actorId: actor.id, actorName: actor.name, actorType: actor.type }
					: {};
				combatEvents = [...combatEvents, {
					type: adding ? 'condition_add' : 'condition_remove',
					round,
					...actorFields,
					combatantId: id,
					combatantName: combatantRef.name,
					combatantType: combatantRef.type,
					condition: status
				}];
			}

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
			resetTracking();
			sync();
		},

		resetPlayers() {
			combatants = combatants.map((c) =>
				c.type === 'player'
					? { ...c, currentHp: c.maxHp, tempHp: 0, statuses: [], initiative: null, inCombat: true }
					: c
			);
			sync();
		},

		startCombat() {
			const sorted = sortCombatants(activeCombatants());
			if (sorted.length === 0) return;
			currentTurnId = sorted[0].id;
			round = 1;
			// Begin tracking
			combatStartedAt = new Date().toISOString();
			combatEvents = [];
			participantStats = new Map();
			for (const c of activeCombatants()) snapshotCombatant(c);
			sync();
		},

		nextTurn() {
			const sorted = sortCombatants(turnEligible());
			if (sorted.length === 0) return;
			if (currentTurnId === null) {
				currentTurnId = sorted[0].id;
				round = 1;
			} else {
				const idx = sorted.findIndex((c) => c.id === currentTurnId);
				if (idx === -1) {
					// Current combatant is no longer eligible (died mid-turn) — jump to
					// the first eligible combatant without incrementing the round.
					currentTurnId = sorted[0].id;
				} else {
					const nextIdx = (idx + 1) % sorted.length;
					if (nextIdx === 0) {
						round += 1;
						if (combatStartedAt !== null) {
							combatEvents = [...combatEvents, {
								type: 'round_advance',
								round,
								combatantId: '',
								combatantName: '',
								combatantType: 'player'
							}];
						}
					}
					currentTurnId = sorted[nextIdx].id;
				}
			}
			sync();
		},

		prevTurn() {
			const sorted = sortCombatants(turnEligible());
			if (sorted.length === 0) return;
			if (currentTurnId === null) {
				currentTurnId = sorted[sorted.length - 1].id;
			} else {
				const idx = sorted.findIndex((c) => c.id === currentTurnId);
				if (idx === -1) {
					// Current combatant not eligible — jump to last eligible.
					currentTurnId = sorted[sorted.length - 1].id;
				} else {
					if (idx === 0 && round > 1) round -= 1;
					currentTurnId = sorted[(idx - 1 + sorted.length) % sorted.length].id;
				}
			}
			sync();
		},

		endCombat() {
			if (combatStartedAt !== null) {
				const record = buildRecord(new Date().toISOString());
				saveRecordToServer(record);
				resetTracking();
			}
			currentTurnId = null;
			round = 1;
			sync();
		},

		/** Save a snapshot of the current combat to history without ending it. */
		saveToChronicle() {
			if (combatStartedAt === null) return;
			const record = buildRecord(new Date().toISOString());
			saveRecordToServer(record);
		}
	};
}

export const combat = createCombatStore();
