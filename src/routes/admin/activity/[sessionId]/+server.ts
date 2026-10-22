// GET /admin/activity/[sessionId] — one DM's usage log (newest first), fetched on demand when
// an admin expands that DM's row so /admin's initial load doesn't carry every DM's history.
// Gated by hooks.server.ts like the rest of /admin/*.
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listDMActivity } from '$lib/server/dmModel';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.isAdmin) error(403);
	return json(await listDMActivity(params.sessionId));
};
