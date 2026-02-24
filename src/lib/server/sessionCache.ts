// Shared in-memory cache: DM auth sessionId → active game session public sessionId.
// Avoids a DB round-trip on every POST /api/state.
// Invalidated when the DM switches sessions (via /api/sessions).
export const authToGameSession = new Map<string, string>();
