// GET /admin/activity?days=7|30|all — feature-use totals across every DM, for the "Most used
// features" chart on /admin. Gated by hooks.server.ts like the rest of /admin/*.
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFeatureUsage } from '$lib/server/dmModel';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.isAdmin) error(403);
	const days = Number(url.searchParams.get('days'));
	return json(
		await getFeatureUsage(Number.isFinite(days) && days > 0 ? Math.min(days, 365) : null)
	);
};
