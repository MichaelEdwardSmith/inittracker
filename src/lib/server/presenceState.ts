// In-memory map of which player account is playing which character in each session.
// sessionId (public 6-char) → characterId → playerDisplayName
export const sessionPresence = new Map<string, Map<string, string>>();

export function setPresence(sessionId: string, characterId: string, displayName: string) {
	if (!sessionPresence.has(sessionId)) {
		sessionPresence.set(sessionId, new Map());
	}
	sessionPresence.get(sessionId)!.set(characterId, displayName);
}

export function clearPresence(sessionId: string, characterId: string) {
	sessionPresence.get(sessionId)?.delete(characterId);
}

export function getPresence(sessionId: string): Record<string, string> {
	const map = sessionPresence.get(sessionId);
	if (!map) return {};
	return Object.fromEntries(map);
}
