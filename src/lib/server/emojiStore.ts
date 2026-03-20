// In-memory store for emoji reactions sent from viewers to the DM.
import { randomUUID } from 'crypto';

export interface EmojiReaction {
	id: string;
	from: string;
	emoji: string;
	timestamp: number;
}

const store = new Map<string, EmojiReaction[]>(); // gameSessionId → reactions

export function addEmojiReaction(
	gameSessionId: string,
	from: string,
	emoji: string
): EmojiReaction {
	const reaction: EmojiReaction = {
		id: randomUUID(),
		from,
		emoji,
		timestamp: Date.now()
	};
	const list = store.get(gameSessionId) ?? [];
	list.push(reaction);
	// Prune anything older than 10 minutes
	const cutoff = Date.now() - 10 * 60 * 1000;
	store.set(
		gameSessionId,
		list.filter((r) => r.timestamp > cutoff)
	);
	return reaction;
}

export function getEmojiReactionsSince(gameSessionId: string, since: number): EmojiReaction[] {
	const list = store.get(gameSessionId) ?? [];
	return list.filter((r) => r.timestamp > since);
}
