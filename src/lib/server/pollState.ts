// Shared in-memory state for the DM → Player polling feature.
// Extracted into its own module so the Maps survive Vite HMR re-evaluation of
// the route handler (+server.ts), just like liarsDiceState.ts and sseState.ts do.

export interface ServerPollOption {
	id: string;
	text: string;
}

export interface ServerPollVote {
	voterId: string;
	voterName: string;
	optionId: string;
}

export interface ServerPoll {
	sessionId: string;
	id: string;
	question: string;
	options: ServerPollOption[];
	/** One entry per voterId — casting a new vote replaces the voter's previous entry. */
	votes: ServerPollVote[];
	open: boolean;
	createdAt: number;
}

export const polls = new Map<string, ServerPoll>();
// Each connected client is registered under its own voterId (null for the DM, who never votes)
// so broadcasts can be personalized with that viewer's own choice.
export const pollClients = new Map<
	string,
	Map<ReadableStreamDefaultController<Uint8Array>, string | null>
>();
