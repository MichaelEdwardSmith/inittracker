// GET    /api/docshare/annotate?session=<id> — current annotations (viewer join / DM resync).
// POST   /api/docshare/annotate               — DM replaces a page's full stroke list; broadcasts.
// DELETE /api/docshare/annotate?page=<n>       — DM clears one page's strokes (all pages if omitted).
import type { RequestHandler } from './$types';
import type { Cookies } from '@sveltejs/kit';
import { resolveActingSessionId } from '$lib/server/auth';
import { isValidSessionId } from '$lib/server/validate';
import { authToGameSession } from '$lib/server/sessionCache';
import { getActiveGameSessionPublicId } from '$lib/server/dmModel';
import { sessionDocViewStates, sessionDocAnnotations } from '$lib/server/docShareState';
import type { Stroke } from '$lib/server/docShareState';
import { broadcastEventToSession } from '$lib/server/sseState';

const MAX_STROKES_PER_PAGE = 300;
const MAX_POINTS_PER_STROKE = 2000;

async function resolveGameSessionId(authSessionId: string): Promise<string | null> {
	let gameSessionId = authToGameSession.get(authSessionId) ?? null;
	if (!gameSessionId) {
		gameSessionId = await getActiveGameSessionPublicId(authSessionId);
		if (gameSessionId) authToGameSession.set(authSessionId, gameSessionId);
	}
	return gameSessionId;
}

async function resolveDmGameSession(
	cookies: Cookies
): Promise<{ gameSessionId: string } | { error: Response }> {
	const authSessionId = await resolveActingSessionId(cookies);
	const guestSessionId = cookies.get('dm_guest');

	if (!authSessionId && !guestSessionId) {
		return { error: new Response('Unauthorized', { status: 401 }) };
	}
	if (!authSessionId && guestSessionId) {
		if (!isValidSessionId(guestSessionId)) {
			return { error: new Response('Invalid guest session', { status: 400 }) };
		}
		return { gameSessionId: guestSessionId };
	}
	const gameSessionId = await resolveGameSessionId(authSessionId!);
	if (!gameSessionId) return { error: new Response('No active session', { status: 400 }) };
	return { gameSessionId };
}

function isValidStrokes(v: unknown): v is Stroke[] {
	if (!Array.isArray(v) || v.length > MAX_STROKES_PER_PAGE) return false;
	for (const s of v) {
		if (!s || typeof s !== 'object') return false;
		const stroke = s as Record<string, unknown>;
		if (!Array.isArray(stroke.points) || stroke.points.length > MAX_POINTS_PER_STROKE * 2) {
			return false;
		}
		if (stroke.points.some((n) => typeof n !== 'number' || !Number.isFinite(n))) return false;
		if (typeof stroke.color !== 'string' || stroke.color.length > 20) return false;
		if (typeof stroke.width !== 'number' || stroke.width < 0.0005 || stroke.width > 0.1) {
			return false;
		}
	}
	return true;
}

// ---------------------------------------------------------------------------
// GET /api/docshare/annotate?session=<id> — current annotations, or null
// ---------------------------------------------------------------------------
export const GET: RequestHandler = async ({ url }) => {
	const sessionId = url.searchParams.get('session');

	if (!sessionId) return new Response('Missing ?session= parameter', { status: 400 });
	if (!isValidSessionId(sessionId)) return new Response('Invalid session ID', { status: 400 });

	return Response.json(sessionDocAnnotations.get(sessionId) ?? null);
};

// ---------------------------------------------------------------------------
// POST /api/docshare/annotate — DM replaces a page's stroke list
// ---------------------------------------------------------------------------
export const POST: RequestHandler = async ({ request, cookies }) => {
	const resolved = await resolveDmGameSession(cookies);
	if ('error' in resolved) return resolved.error;
	const { gameSessionId } = resolved;

	const view = sessionDocViewStates.get(gameSessionId);
	if (!view) return new Response('No document prepared', { status: 400 });

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') return new Response('Invalid payload', { status: 400 });

	const docId = body.docId;
	const page = body.page;
	if (docId !== view.id) return new Response('Stale document id', { status: 409 });
	if (!Number.isInteger(page) || page < 0 || page >= view.pageCount) {
		return new Response('Invalid page', { status: 400 });
	}
	if (!isValidStrokes(body.strokes)) return new Response('Invalid strokes', { status: 400 });

	let entry = sessionDocAnnotations.get(gameSessionId);
	if (!entry || entry.docId !== docId) {
		entry = { docId, pageStrokes: {} };
		sessionDocAnnotations.set(gameSessionId, entry);
	}
	entry.pageStrokes[page] = body.strokes;

	broadcastEventToSession(gameSessionId, 'docshareAnnotation', {
		docId,
		page,
		strokes: body.strokes
	});

	return new Response(null, { status: 204 });
};

// ---------------------------------------------------------------------------
// DELETE /api/docshare/annotate?page=<n> — clear one page (all pages if omitted)
// ---------------------------------------------------------------------------
export const DELETE: RequestHandler = async ({ url, cookies }) => {
	const resolved = await resolveDmGameSession(cookies);
	if ('error' in resolved) return resolved.error;
	const { gameSessionId } = resolved;

	const entry = sessionDocAnnotations.get(gameSessionId);
	if (!entry) return new Response(null, { status: 204 });

	const pageParam = url.searchParams.get('page');
	if (pageParam === null) {
		sessionDocAnnotations.delete(gameSessionId);
		const view = sessionDocViewStates.get(gameSessionId);
		if (view) {
			broadcastEventToSession(gameSessionId, 'docshareAnnotation', {
				docId: view.id,
				page: view.currentPage,
				strokes: []
			});
		}
		return new Response(null, { status: 204 });
	}

	const page = parseInt(pageParam, 10);
	if (!Number.isInteger(page)) return new Response('Invalid page', { status: 400 });
	delete entry.pageStrokes[page];
	broadcastEventToSession(gameSessionId, 'docshareAnnotation', {
		docId: entry.docId,
		page,
		strokes: []
	});

	return new Response(null, { status: 204 });
};
