// Announces combat changes (turn, round, HP, conditions) to screen readers via the global
// aria-live region. Call once during component init; it diffs successive state snapshots.
import { untrack } from 'svelte';
import { announce } from './announce.svelte';
import type { Combatant } from './types';

interface CombatSnapshotSource {
	combatants: Combatant[];
	currentTurnId: string | null;
	round: number;
}

interface Options {
	/** Viewers shouldn't hear exact enemy HP changes the display doesn't show. */
	includeEnemyHp: boolean;
	/** DM-only conditions (Advantage/Disadvantage) are never announced on the viewer display. */
	includeDmOnlyStatuses: boolean;
}

const DM_ONLY = /^(Advantage|Disadvantage)/;

export function useCombatAnnouncements(get: () => CombatSnapshotSource, opts: Options) {
	let prev: {
		turn: string | null;
		round: number;
		hp: Map<string, number>;
		statuses: Map<string, string[]>;
	} | null = null;

	$effect(() => {
		const s = get();
		// Touch everything we diff so the effect re-runs on any relevant change.
		const turn = s.currentTurnId;
		const round = s.round;
		const hp = new Map(s.combatants.map((c) => [c.id, c.currentHp]));
		const statuses = new Map(s.combatants.map((c) => [c.id, [...c.statuses]]));
		const combatants = s.combatants;

		untrack(() => {
			if (prev) {
				const msgs: string[] = [];
				for (const c of combatants) {
					if (c.type === 'lair') continue;
					const showHp = c.type === 'player' || opts.includeEnemyHp;
					const before = prev.hp.get(c.id);
					if (showHp && before !== undefined && before !== c.currentHp) {
						const d = c.currentHp - before;
						msgs.push(
							d < 0
								? `${c.name} takes ${-d} damage, ${c.currentHp} of ${c.maxHp} hit points left`
								: `${c.name} heals ${d}, now ${c.currentHp} of ${c.maxHp} hit points`
						);
					}
					const prevSt = prev.statuses.get(c.id);
					if (prevSt) {
						const visible = (st: string) => opts.includeDmOnlyStatuses || !DM_ONLY.test(st);
						for (const st of c.statuses)
							if (!prevSt.includes(st) && visible(st)) msgs.push(`${c.name} is now ${st}`);
						for (const st of prevSt)
							if (!c.statuses.includes(st) && visible(st))
								msgs.push(`${c.name} is no longer ${st}`);
					}
				}
				if (turn !== prev.turn) {
					if (turn === null) msgs.unshift('Combat ended');
					else {
						const c = combatants.find((x) => x.id === turn);
						if (c) {
							const r = round !== prev.round || prev.turn === null ? `Round ${round}. ` : '';
							msgs.unshift(`${r}${c.name}'s turn`);
						}
					}
				}
				if (msgs.length) announce(msgs.join('. '));
			}
			prev = { turn, round, hp, statuses };
		});
	});
}
