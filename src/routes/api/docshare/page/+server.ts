// POST   /api/docshare/page — DM uploads one page of a document (image bytes, held in memory
//                              only). Uploading page 0 of a fresh doc id replaces any prior doc.
// GET    /api/docshare/page — viewer/DM downloads a single page by session + doc id + page index.
// DELETE /api/docshare/page — DM removes the current doc entirely and broadcasts the removal.
import type { RequestHandler } from './$types';
import type { Cookies } from '@sveltejs/kit';
import { resolveActingSessionId } from '$lib/server/auth';
import { isValidSessionId } from '$lib/server/validate';
import { authToGameSession } from '$lib/server/sessionCache';
import { getActiveGameSessionPublicId } from '$lib/server/dmModel';
import {
	sessionDocs,
	sessionDocViewStates,
	sessionDocAnnotations
} from '$lib/server/docShareState';
import { broadcastEventToSession } from '$lib/server/sseState';

const MAX_PAGES = 60;
const MAX_PAGE_BYTES = 8_000_000; // ~8 MB per rendered page

/** Resolves the active game session's public ID for a DM auth sessionId.
 *  Uses the shared in-memory cache; falls back to DB on cache miss. */
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

// ---------------------------------------------------------------------------
// POST /api/docshare/page — DM uploads one page's image bytes
// ---------------------------------------------------------------------------
export const POST: RequestHandler = async ({ request, cookies }) => {
	const resolved = await resolveDmGameSession(cookies);
	if ('error' in resolved) return resolved.error;
	const { gameSessionId } = resolved;

	const docId = request.headers.get('X-Doc-Id');
	const rawDocName = request.headers.get('X-Doc-Name');
	const docName = rawDocName
		? (() => {
				try {
					return decodeURIComponent(rawDocName);
				} catch {
					return rawDocName;
				}
			})()
		: null;
	const pageIndex = parseInt(request.headers.get('X-Doc-Page') ?? '', 10);
	const pageCount = parseInt(request.headers.get('X-Doc-Page-Count') ?? '', 10);
	const mimeType = request.headers.get('Content-Type') ?? 'application/octet-stream';

	if (!docId || !docName) return new Response('Missing doc headers', { status: 400 });
	if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= MAX_PAGES) {
		return new Response('Invalid page index', { status: 400 });
	}
	if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > MAX_PAGES) {
		return new Response('Invalid page count', { status: 400 });
	}

	const arrayBuffer = await request.arrayBuffer().catch(() => null);
	if (!arrayBuffer) return new Response('Failed to read body', { status: 400 });
	if (arrayBuffer.byteLength > MAX_PAGE_BYTES) {
		return new Response('Page too large', { status: 413 });
	}

	let doc = sessionDocs.get(gameSessionId);
	if (!doc || doc.id !== docId) {
		doc = { id: docId, name: docName, pageCount, pages: [] };
		sessionDocs.set(gameSessionId, doc);
		// A fresh doc invalidates any annotations drawn on the previous one.
		sessionDocAnnotations.delete(gameSessionId);
	}
	doc.pages[pageIndex] = { mimeType, data: new Uint8Array(arrayBuffer) };

	// The first page establishes (or resets) the view pointer — always starts hidden so a
	// fresh upload never accidentally flashes onto the player display mid-transfer.
	if (pageIndex === 0) {
		sessionDocViewStates.set(gameSessionId, {
			id: docId,
			name: docName,
			pageCount,
			currentPage: 0,
			visible: false
		});
	}

	return new Response(null, { status: 204 });
};

// ---------------------------------------------------------------------------
// GET /api/docshare/page?session=<id>&id=<docId>&page=<n> — download one page's bytes
// ---------------------------------------------------------------------------
export const GET: RequestHandler = async ({ url }) => {
	const sessionId = url.searchParams.get('session');
	const docId = url.searchParams.get('id');
	const pageIndex = parseInt(url.searchParams.get('page') ?? '', 10);

	if (!sessionId) return new Response('Missing ?session= parameter', { status: 400 });
	if (!isValidSessionId(sessionId)) return new Response('Invalid session ID', { status: 400 });
	if (!docId) return new Response('Missing ?id= parameter', { status: 400 });
	if (!Number.isInteger(pageIndex))
		return new Response('Missing ?page= parameter', { status: 400 });

	const doc = sessionDocs.get(sessionId);
	if (!doc || doc.id !== docId) return new Response('Document not found', { status: 404 });
	const page = doc.pages[pageIndex];
	if (!page) return new Response('Page not found', { status: 404 });

	return new Response(page.data.buffer as ArrayBuffer, {
		headers: {
			'Content-Type': page.mimeType,
			'Content-Disposition': 'inline',
			'Cache-Control': 'no-store'
		}
	});
};

// ---------------------------------------------------------------------------
// DELETE /api/docshare/page — DM removes the current doc entirely
// ---------------------------------------------------------------------------
export const DELETE: RequestHandler = async ({ cookies }) => {
	const resolved = await resolveDmGameSession(cookies);
	if ('error' in resolved) return resolved.error;
	const { gameSessionId } = resolved;

	sessionDocs.delete(gameSessionId);
	sessionDocViewStates.delete(gameSessionId);
	sessionDocAnnotations.delete(gameSessionId);
	broadcastEventToSession(gameSessionId, 'docshareRemoved', {});

	return new Response(null, { status: 204 });
};
