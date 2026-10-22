// GET /admin/health — process + database + email snapshot for the "System health" panel.
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSystemHealth } from '$lib/server/health';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.isAdmin) error(403);
	return json(await getSystemHealth());
};
