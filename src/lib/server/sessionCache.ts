// Shared in-memory cache mapping each DM's auth sessionId to their active game session's
// public 6-char ID. Avoids a DB round-trip on every POST /api/state request.
// Invalidated when the DM switches sessions (via /api/sessions).
export const authToGameSession = new Map<string, string>();

// Cache: auth sessionId → active session's ruleset ('2014' | '2024')
export const authToRuleset = new Map<string, '2014' | '2024'>();

/** Resolves the active game session's public ID for a DM auth sessionId.
 *  Uses the shared in-memory cache; falls back to DB on cache miss. */
export async function resolveGameSessionId(authSessionId: string): Promise<string | null> {
	let gameSessionId = authToGameSession.get(authSessionId) ?? null;
	if (!gameSessionId) {
		const { getActiveGameSessionPublicId } = await import('$lib/server/dmModel');
		gameSessionId = await getActiveGameSessionPublicId(authSessionId);
		if (gameSessionId) authToGameSession.set(authSessionId, gameSessionId);
	}
	return gameSessionId;
}
