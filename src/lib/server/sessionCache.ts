// Shared in-memory cache mapping each DM's auth sessionId to their active game session's
// public 6-char ID. Avoids a DB round-trip on every POST /api/state request.
// Invalidated when the DM switches sessions (via /api/sessions).
export const authToGameSession = new Map<string, string>();

// Cache: auth sessionId → active session's ruleset ('2014' | '2024')
export const authToRuleset = new Map<string, '2014' | '2024'>();
