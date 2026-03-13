// Shared SSE state: in-memory combat state cache and connected viewer registry.
// Extracted here so both /api/state and /api/initiative can broadcast to viewers
// without duplicating the maps.  Both maps are keyed by game session public 6-char ID.
import type { StorageState, CombatRecord } from '$lib/types';

export const sessionStates = new Map<string, StorageState>();
export const sessionClients = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>();

// In-memory combat history for guest sessions (not persisted to MongoDB).
export const guestHistory = new Map<string, CombatRecord[]>();

const encoder = new TextEncoder();

export function broadcastToSession(sessionId: string, state: StorageState) {
	const clients = sessionClients.get(sessionId);
	if (!clients) return;
	const msg = encoder.encode(`data: ${JSON.stringify(state)}\n\n`);
	for (const ctrl of clients) {
		try {
			ctrl.enqueue(msg);
		} catch {
			clients.delete(ctrl);
		}
	}
}
