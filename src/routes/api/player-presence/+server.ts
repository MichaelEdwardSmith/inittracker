// POST /api/player-presence — logged-in player announces which character they are playing.
// GET  /api/player-presence?session=X — DM fetches the current characterId→name mapping.
import type { RequestHandler } from './$types';
import { getPlayerBySessionId } from '$lib/server/playerModel';
import { setPresence, clearPresence, getPresence } from '$lib/server/presenceState';
import { isValidSessionId } from '$lib/server/validate';

export const GET: RequestHandler = ({ url }) => {
	const session = url.searchParams.get('session') ?? '';
	if (!isValidSessionId(session)) return Response.json({});
	return Response.json(getPresence(session));
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const playerSessionId = cookies.get('player_auth');
	if (!playerSessionId) return new Response('Unauthorized', { status: 401 });

	const player = await getPlayerBySessionId(playerSessionId);
	if (!player) return new Response('Unauthorized', { status: 401 });

	const body = await request.json().catch(() => null);
	const { sessionId, characterId } = body ?? {};

	if (!sessionId || !isValidSessionId(sessionId)) {
		return Response.json({ error: 'Invalid session ID' }, { status: 400 });
	}

	if (characterId) {
		setPresence(sessionId, characterId, player.displayName);
	} else {
		// characterId: null means the player cleared their selection
		for (const [cid, name] of (Object.entries(getPresence(sessionId)) as [string, string][])) {
			if (name === player.displayName) clearPresence(sessionId, cid);
		}
	}

	return Response.json({ ok: true });
};
