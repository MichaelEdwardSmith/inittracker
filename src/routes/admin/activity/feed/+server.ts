// GET /admin/activity/feed?feature=&sessionId=&limit= — newest usage entries across all DMs
// (or one), for the cross-DM feed on the Insights tab.
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isActivityFeature } from '$lib/activity';
import { getActivityFeed } from '$lib/server/dmModel';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.isAdmin) error(403);
	const feature = url.searchParams.get('feature');
	const sessionId = url.searchParams.get('sessionId');
	const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 100, 1), 500);
	return json(
		await getActivityFeed({
			limit,
			...(isActivityFeature(feature) ? { feature } : {}),
			...(sessionId ? { sessionId } : {})
		})
	);
};
