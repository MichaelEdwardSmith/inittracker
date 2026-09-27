// GET /api/battlemap/library/image?id=<id> — downloads a saved map's image bytes. Owner-only
// (scoped by the DM's auth session), unlike the session-scoped /api/battlemap/image route.
import type { RequestHandler } from './$types';
import { resolveActingSessionId } from '$lib/server/auth';
import { getSavedBattleMapImage } from '$lib/server/dmModel';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const authSessionId = await resolveActingSessionId(cookies);
	if (!authSessionId) return new Response('Unauthorized', { status: 401 });

	const id = url.searchParams.get('id');
	if (!id) return new Response('Missing ?id= parameter', { status: 400 });

	const image = await getSavedBattleMapImage(authSessionId, id);
	if (!image) return new Response('Map not found', { status: 404 });

	return new Response(new Uint8Array(image.data), {
		headers: {
			'Content-Type': image.mimeType,
			'Content-Disposition': 'inline',
			'Cache-Control': 'private, max-age=3600'
		}
	});
};
