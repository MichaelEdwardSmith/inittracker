// GET /admin/activity/trend — weekly uses of the five most-used features, for the trend chart.
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFeatureTrend } from '$lib/server/dmModel';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.isAdmin) error(403);
	return json(await getFeatureTrend(8));
};
