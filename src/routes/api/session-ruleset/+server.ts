// GET /api/session-ruleset?session=<6-char-id>
// Public endpoint — returns the ruleset for a given game session public ID.
// Used by the viewer display to know which D&D edition the session uses.
import type { RequestHandler } from './$types';
import { getDMByGameSessionId } from '$lib/server/dmModel';
import { isValidSessionId } from '$lib/server/validate';

export const GET: RequestHandler = async ({ url }) => {
	const sessionId = url.searchParams.get('session');
	if (!sessionId || !isValidSessionId(sessionId)) {
		return new Response('Invalid session ID', { status: 400 });
	}

	const dm = await getDMByGameSessionId(sessionId);
	if (!dm) {
		return new Response('Session not found', { status: 404 });
	}

	const sessions = (dm.gameSessions ?? []) as Array<{ sessionId: string; ruleset?: string }>;
	const session = sessions.find((s) => s.sessionId === sessionId);
	const ruleset = session?.ruleset === '2024' ? '2024' : '2014';

	return Response.json({ ruleset });
};
