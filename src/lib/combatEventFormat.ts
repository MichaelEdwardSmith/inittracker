// Shared plain-language rendering for CombatEvent — used by the Combat Chronicle
// (post-combat, history page) and the live Combat Log panel (during combat). No Svelte
// dependency — safe to import from both.
import type { CombatEvent } from './types';

/** Font Awesome markup for the event's icon — always one of the fixed cases below
 *  (never derived from event/player data), so rendering it via {@html} is safe. */
export function eventIcon(e: CombatEvent): string {
	if (e.causedDown) return '<i class="fa-duotone fa-light fa-skull"></i>';
	switch (e.type) {
		case 'damage':
			return '<i class="fa-duotone fa-light fa-swords"></i>';
		case 'heal':
			return '<i class="fa-duotone fa-light fa-heart"></i>';
		case 'down':
			return '<i class="fa-duotone fa-light fa-skull"></i>';
		case 'condition_add':
			return '<i class="fa-duotone fa-light fa-star"></i>';
		case 'condition_remove':
			return '<i class="fa-regular fa-star"></i>';
		case 'turn_start':
			return '<i class="fa-duotone fa-light fa-hourglass-start"></i>';
		case 'round_advance':
			return '<i class="fa-duotone fa-light fa-arrows-rotate"></i>';
		default:
			return '&middot;';
	}
}

export function eventColor(e: CombatEvent): string {
	if (e.causedDown) return 'text-red-300';
	switch (e.type) {
		case 'damage':
			return 'text-red-400';
		case 'heal':
			return 'text-green-400';
		case 'down':
			return 'text-red-300';
		case 'condition_add':
			return 'text-purple-400';
		case 'condition_remove':
			return 'text-purple-300/70';
		case 'turn_start':
			return 'text-blue-300/80';
		case 'round_advance':
			return 'text-amber-400';
		default:
			return 'text-gray-400';
	}
}

export function eventDesc(e: CombatEvent): string {
	const actor = e.actorName;
	const target = e.combatantName;
	const isSelf = !actor || e.actorId === e.combatantId;

	switch (e.type) {
		case 'damage': {
			const hpNote = `(${e.hpBefore} → ${e.hpAfter} HP)`;
			let line = isSelf
				? `${target} took ${e.value} damage ${hpNote}`
				: `${actor} dealt ${e.value} damage to ${target} ${hpNote}`;
			if (e.causedDown) {
				const suffix =
					e.combatantType === 'player'
						? `${target} was knocked unconscious!`
						: `${target} was slain!`;
				line += ` — ${suffix}`;
			}
			return line;
		}
		case 'heal':
			return isSelf
				? `${target} recovered ${e.value} HP (${e.hpBefore} → ${e.hpAfter} HP)`
				: `${actor} healed ${target} for ${e.value} HP (${e.hpBefore} → ${e.hpAfter} HP)`;
		case 'down':
			// Legacy records before causedDown was introduced
			return e.combatantType === 'player'
				? `${target} was knocked unconscious!`
				: `${target} was slain!`;
		case 'condition_add':
			return isSelf
				? `${target} became ${e.condition}`
				: `${actor} inflicted ${e.condition} on ${target}`;
		case 'condition_remove':
			return `${target} shook off ${e.condition}`;
		case 'turn_start':
			return `${target}'s turn began`;
		case 'round_advance':
			return `Round ${e.round} began`;
		default:
			return '';
	}
}
