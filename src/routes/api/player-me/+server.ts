// GET /api/player-me — returns the logged-in player's display name and avatar,
// or null if no player_auth cookie is present / valid.
import type { RequestHandler } from './$types';
import { getPlayerBySessionId } from '$lib/server/playerModel';

export const GET: RequestHandler = async ({ cookies }) => {
	const sessionId = cookies.get('player_auth');
	if (!sessionId) return Response.json(null);

	const player = await getPlayerBySessionId(sessionId);
	if (!player) return Response.json(null);

	return Response.json({ name: player.displayName, avatarUrl: player.avatarUrl ?? null });
};
