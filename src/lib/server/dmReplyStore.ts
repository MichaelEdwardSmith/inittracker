// In-memory store for DM-to-player messages, keyed by game session public ID.
// Ephemeral — lost on server restart, never persisted to MongoDB.
export interface DmReply {
	id: string;
	to: string; // player/character name, or 'all'
	text: string;
	timestamp: number;
}

const store = new Map<string, DmReply[]>();

export function addReply(sessionId: string, to: string, text: string): DmReply {
	const reply: DmReply = { id: crypto.randomUUID(), to, text, timestamp: Date.now() };
	const arr = store.get(sessionId) ?? [];
	arr.push(reply);
	// Keep only the last 100 replies per session
	if (arr.length > 100) arr.splice(0, arr.length - 100);
	store.set(sessionId, arr);
	return reply;
}

export function getReplies(sessionId: string): DmReply[] {
	return store.get(sessionId) ?? [];
}
