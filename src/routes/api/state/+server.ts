import type { RequestHandler } from './$types';
import type { StorageState } from '$lib/types';
import { saveCombatState, getCombatState } from '$lib/server/dmModel';

// ---------------------------------------------------------------------------
// Per-session in-memory state cache and SSE client registry.
// State is also persisted to MongoDB so it survives server restarts.
// ---------------------------------------------------------------------------

const sessionStates = new Map<string, StorageState>();
const sessionClients = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>();
const encoder = new TextEncoder();

function getClients(sessionId: string): Set<ReadableStreamDefaultController<Uint8Array>> {
	if (!sessionClients.has(sessionId)) {
		sessionClients.set(sessionId, new Set());
	}
	return sessionClients.get(sessionId)!;
}

function broadcastToSession(sessionId: string, state: StorageState) {
	const clients = sessionClients.get(sessionId);
	if (!clients) return;
	const msg = encoder.encode(`data: ${JSON.stringify(state)}\n\n`);
	for (const ctrl of clients) {
		try {
			ctrl.enqueue(msg);
		} catch {
			clients.delete(ctrl);
		}
	}
}

// ---------------------------------------------------------------------------
// POST /api/state  — DM screen pushes updated combat state here.
// Identifies the session via the dm_auth cookie (which holds the sessionId).
// ---------------------------------------------------------------------------
export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionId = cookies.get('dm_auth');
	if (!sessionId) return new Response('Unauthorized', { status: 401 });

	const state = (await request.json()) as StorageState;
	sessionStates.set(sessionId, state);
	broadcastToSession(sessionId, state);

	// Persist to MongoDB (fire-and-forget — don't block the response)
	saveCombatState(sessionId, state).catch(() => {});

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
		// DM screen polling — identify session from cookie
		const sessionId = cookies.get('dm_auth');
		if (!sessionId) return Response.json({ combatants: [], currentTurnId: null, round: 1 });

		// Return from in-memory cache, or fall back to MongoDB
		let state = sessionStates.get(sessionId);
		if (!state) {
			state = await getCombatState(sessionId);
			if (state) sessionStates.set(sessionId, state);
		}
		return Response.json(state ?? { combatants: [], currentTurnId: null, round: 1 });
	}

	// SSE viewer — session ID comes from query param
	const sessionId = url.searchParams.get('session');
	if (!sessionId) {
		return new Response('Missing ?session= parameter', { status: 400 });
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
