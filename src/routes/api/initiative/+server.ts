// POST /api/initiative — player display submits a rolled initiative for a named player.
// No auth required; validates that the playerId belongs to the given public game session.
// Updates the player's initiative in the in-memory cache, broadcasts via SSE, and persists.
import type { RequestHandler } from './$types';
import { isValidSessionId } from '$lib/server/validate';
import { getDMByGameSessionId, getCombatState, saveCombatState } from '$lib/server/dmModel';
import { sessionStates, broadcastToSession } from '$lib/server/sseState';

export const POST: RequestHandler = async ({ request }) => {
	const raw = await request.json().catch(() => null);
	if (!raw || typeof raw !== 'object') return new Response('Invalid body', { status: 400 });

	const { sessionId, playerId, initiative } = raw as Record<string, unknown>;

	if (typeof sessionId !== 'string' || !isValidSessionId(sessionId))
		return new Response('Invalid sessionId', { status: 400 });
	if (typeof playerId !== 'string' || !playerId)
		return new Response('Invalid playerId', { status: 400 });
	if (
		typeof initiative !== 'number' ||
		!Number.isInteger(initiative) ||
		initiative < -10 ||
		initiative > 40
	)
		return new Response('Invalid initiative value', { status: 400 });

	// Load state from cache or DB
	let state = sessionStates.get(sessionId);
	if (!state) {
		const dm = await getDMByGameSessionId(sessionId);
		if (!dm) return new Response('Session not found', { status: 404 });
		state = (await getCombatState(sessionId)) ?? { combatants: [], currentTurnId: null, round: 1 };
		sessionStates.set(sessionId, state);
	}

	// Verify the target combatant exists and is a player
	const target = state.combatants.find((c) => c.id === playerId && c.type === 'player');
	if (!target) return new Response('Player not found in session', { status: 404 });

	const newState = {
		...state,
		combatants: state.combatants.map((c) => (c.id === playerId ? { ...c, initiative } : c))
	};

	sessionStates.set(sessionId, newState);
	broadcastToSession(sessionId, newState);
	saveCombatState(sessionId, newState).catch(() => {});

	return new Response(null, { status: 204 });
};
