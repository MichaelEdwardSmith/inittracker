// Shared in-memory cache mapping each DM's auth sessionId to their active game session's
// public 6-char ID. Avoids a DB round-trip on every POST /api/state request.
// Avoids a DB round-trip on every POST /api/state.
// Invalidated when the DM switches sessions (via /api/sessions).
export const authToGameSession = new Map<string, string>();
