export interface DmMessage {
	id: string;
	from: string;
	text: string;
	timestamp: number;
}

const store = new Map<string, DmMessage[]>();

export function addMessage(sessionId: string, from: string, text: string): void {
	const msg: DmMessage = {
		id: crypto.randomUUID(),
		from,
		text,
		timestamp: Date.now(),
	};
	const arr = store.get(sessionId) ?? [];
	arr.push(msg);
	store.set(sessionId, arr);
}

export function getMessages(sessionId: string): DmMessage[] {
	return store.get(sessionId) ?? [];
}

export function clearMessages(sessionId: string): void {
	store.delete(sessionId);
}
