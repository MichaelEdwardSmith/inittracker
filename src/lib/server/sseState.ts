// Shared SSE state: in-memory combat state cache and connected viewer registry.
// Extracted here so both /api/state and /api/initiative can broadcast to viewers
// without duplicating the maps.  Both maps are keyed by game session public 6-char ID.
import type { StorageState, CombatRecord } from '$lib/types';
import { ADV_CONDITIONS } from '$lib/enemies';

const DM_ONLY_STATUSES = new Set<string>(ADV_CONDITIONS);

/**
 * Strip DM-only data before state leaves the server for public viewers (display page, OBS
 * overlay). The DM's own state (JSON refresh, local store) is never passed through this.
 * Removes: Advantage/Disadvantage reminder conditions (and their round timers) and the
 * freeform per-combatant `note`.
 */
export function redactForViewers(state: StorageState): StorageState {
	return {
		...state,
		combatants: state.combatants.map((c) => {
			const { note: _note, conditionRounds, ...rest } = c;
			const out = { ...rest, statuses: c.statuses.filter((s) => !DM_ONLY_STATUSES.has(s)) };
			if (conditionRounds) {
				const kept = Object.fromEntries(
					Object.entries(conditionRounds).filter(([k]) => !DM_ONLY_STATUSES.has(k))
				);
				if (Object.keys(kept).length > 0) return { ...out, conditionRounds: kept };
			}
			return out;
		})
	};
}

export const sessionStates = new Map<string, StorageState>();
export const sessionClients = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>();

// In-memory combat history for guest sessions (not persisted to MongoDB).
export const guestHistory = new Map<string, CombatRecord[]>();

const encoder = new TextEncoder();

export function broadcastToSession(sessionId: string, state: StorageState) {
	const clients = sessionClients.get(sessionId);
	if (!clients) return;
	const msg = encoder.encode(`data: ${JSON.stringify(redactForViewers(state))}\n\n`);
	for (const ctrl of clients) {
		try {
			ctrl.enqueue(msg);
		} catch {
			clients.delete(ctrl);
		}
	}
}

export function broadcastEventToSession(sessionId: string, eventName: string, data: unknown) {
	const clients = sessionClients.get(sessionId);
	if (!clients) return;
	const msg = encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
	for (const ctrl of clients) {
		try {
			ctrl.enqueue(msg);
		} catch {
			clients.delete(ctrl);
		}
	}
}
