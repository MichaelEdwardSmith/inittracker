// POST /api/state  — DM pushes updated combat state; validated, cached in memory, broadcast to
//                    all SSE viewers for that session, and fire-and-forget persisted to MongoDB.
// GET  /api/state  — Two modes:
//   • Accept: text/event-stream + ?session=ID  → opens an SSE stream for a viewer; sends a
//     keepalive ping every 25 s and the current snapshot immediately on connect.
//   • Any other Accept (no query param)        → returns a JSON snapshot for DM page refresh.
import type { RequestHandler } from './$types';
import type { StorageState } from '$lib/types';
import {
	saveCombatState,
	getCombatState,
	getDMByGameSessionId,
	getActiveGameSessionPublicId
} from '$lib/server/dmModel';
import { isValidSessionId, validateStorageState } from '$lib/server/validate';
import { authToGameSession } from '$lib/server/sessionCache';

import { sessionStates, sessionClients, broadcastToSession } from '$lib/server/sseState';

const encoder = new TextEncoder();

function getClients(sessionId: string): Set<ReadableStreamDefaultController<Uint8Array>> {
	if (!sessionClients.has(sessionId)) {
		sessionClients.set(sessionId, new Set());
	}
	return sessionClients.get(sessionId)!;
}

/** Resolves the active game session's public ID for a DM auth sessionId.
 *  Uses the shared in-memory cache; falls back to DB on cache miss. */
async function resolveGameSessionId(authSessionId: string): Promise<string | null> {
	let gameSessionId = authToGameSession.get(authSessionId) ?? null;
	if (!gameSessionId) {
		// Cache miss (e.g. server restart) — fetch from DB and repopulate
		gameSessionId = await getActiveGameSessionPublicId(authSessionId);
		if (gameSessionId) authToGameSession.set(authSessionId, gameSessionId);
	}
	return gameSessionId;
}

// ---------------------------------------------------------------------------
// POST /api/state  — DM screen pushes updated combat state here.
// Identifies the DM via the dm_auth cookie; resolves their active game session.
// Guests use the dm_guest cookie — state is cached in memory only, not persisted.
// ---------------------------------------------------------------------------
export const POST: RequestHandler = async ({ request, cookies }) => {
	const authSessionId = cookies.get('dm_auth');
	const guestSessionId = cookies.get('dm_guest');

	if (!authSessionId && !guestSessionId) return new Response('Unauthorized', { status: 401 });

	let gameSessionId: string | null;
	const isGuest = !authSessionId && !!guestSessionId;

	if (isGuest) {
		if (!isValidSessionId(guestSessionId!))
			return new Response('Invalid guest session', { status: 400 });
		gameSessionId = guestSessionId!;
	} else {
		gameSessionId = await resolveGameSessionId(authSessionId!);
		if (!gameSessionId) return new Response('No active session', { status: 400 });
	}

	const raw = await request.json().catch(() => null);
	const state = validateStorageState(raw);
	if (!state) return new Response('Invalid state payload', { status: 400 });

	sessionStates.set(gameSessionId, state);
	broadcastToSession(gameSessionId, state);

	// Guests: skip MongoDB persistence
	if (!isGuest) {
		saveCombatState(gameSessionId, state).catch(() => {});
	}

	return new Response(null, { status: 204 });
};

// ---------------------------------------------------------------------------
// GET /api/state
//   • Accept: text/event-stream  → SSE stream (viewer subscribes via ?session=ID)
//   • Any other Accept           → plain JSON snapshot (DM screen loads on refresh)
// ---------------------------------------------------------------------------
export const GET: RequestHandler = async ({ request, url, cookies }) => {
	const wantsStream = (request.headers.get('accept') ?? '').includes('text/event-stream');

	if (!wantsStream) {
		// DM screen polling — resolve game session from auth or guest cookie
		const authSessionId = cookies.get('dm_auth');
		const guestSessionId = cookies.get('dm_guest');

		if (!authSessionId && guestSessionId && isValidSessionId(guestSessionId)) {
			// Guest: read from in-memory cache only
			return Response.json(
				sessionStates.get(guestSessionId) ?? { combatants: [], currentTurnId: null, round: 1 }
			);
		}

		if (!authSessionId) return Response.json({ combatants: [], currentTurnId: null, round: 1 });

		const gameSessionId = await resolveGameSessionId(authSessionId);
		if (!gameSessionId) return Response.json({ combatants: [], currentTurnId: null, round: 1 });

		let state = sessionStates.get(gameSessionId);
		if (!state) {
			state = await getCombatState(gameSessionId);
			if (state) sessionStates.set(gameSessionId, state);
		}
		return Response.json(state ?? { combatants: [], currentTurnId: null, round: 1 });
	}

	// SSE viewer — session ID comes from query param (game session public ID)
	const sessionId = url.searchParams.get('session');
	if (!sessionId) {
		return new Response('Missing ?session= parameter', { status: 400 });
	}
	if (!isValidSessionId(sessionId)) {
		return new Response('Invalid session ID', { status: 400 });
	}

	// Validate that this game session actually exists
	const dm = await getDMByGameSessionId(sessionId);
	if (!dm) {
		return new Response('Session not found', { status: 404 });
	}

	// Pre-load state from cache or DB so the viewer gets immediate data on connect
	let initialState = sessionStates.get(sessionId);
	if (!initialState) {
		initialState = await getCombatState(sessionId);
		if (initialState) sessionStates.set(sessionId, initialState);
	}
	const snapshot = initialState ?? { combatants: [], currentTurnId: null, round: 1 };

	let ctrl: ReadableStreamDefaultController<Uint8Array>;
	let keepAlive: ReturnType<typeof setInterval>;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			ctrl = controller;
			getClients(sessionId).add(ctrl);

			// Immediately send current state so the display isn't blank on connect.
			ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`));

			// Ping every 25 s to keep proxies from closing the connection.
			keepAlive = setInterval(() => {
				try {
					ctrl.enqueue(encoder.encode(': ping\n\n'));
				} catch {
					clearInterval(keepAlive);
					getClients(sessionId).delete(ctrl);
				}
			}, 25_000);
		},
		cancel() {
			clearInterval(keepAlive);
			sessionClients.get(sessionId)?.delete(ctrl);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};
