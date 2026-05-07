// Shared in-memory state for the Liar's Dice minigame.
// Extracted into its own module so the Maps survive Vite HMR re-evaluation of
// the route handler (+server.ts), just like sseState.ts does for combat SSE.

import type { LiarsDiceBid, LiarsDiceReveal } from '$lib/types';

export interface ServerPlayer {
	id: string;
	name: string;
	dice: number[];
	diceCount: number;
	eliminated: boolean;
}

export interface ServerGame {
	sessionId: string;
	status: 'lobby' | 'bidding' | 'reveal' | 'game_over';
	players: ServerPlayer[];
	currentTurnPlayerId: string | null;
	currentBid: LiarsDiceBid | null;
	bidHistory: LiarsDiceBid[];
	dmRole: 'player' | 'observer';
	roundNumber: number;
	isPalifico: boolean;
	palificoFace: number | null;
	eventLog: Array<{ type: string; description: string; timestamp: number }>;
	winnerId: string | null;
	winnerName: string | null;
	reveal: LiarsDiceReveal | null;
	autoAdvanceTimer: ReturnType<typeof setTimeout> | null;
}

export interface ClientInfo {
	playerId: string | null;
	isDmObserver: boolean;
}

export const games = new Map<string, ServerGame>();
export const clients = new Map<
	string,
	Map<ReadableStreamDefaultController<Uint8Array>, ClientInfo>
>();
