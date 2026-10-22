// POST /api/activity — client-reported feature use ({ feature, detail? }) for the per-DM usage
// log shown in /admin. Only features in ACTIVITY_LABELS are accepted. Guests (no dm_auth) and
// admin impersonation sessions are acknowledged but not recorded.
import type { RequestHandler } from './$types';
import { isActivityFeature } from '$lib/activity';
import { trackDMActivity } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json().catch(() => null);
	if (!body || !isActivityFeature(body.feature)) {
		return new Response('Unknown feature', { status: 400 });
	}
	const detail = typeof body.detail === 'string' ? body.detail : undefined;

	const sessionId = cookies.get('dm_auth');
	if (sessionId) trackDMActivity(cookies, sessionId, body.feature, detail);
	return new Response(null, { status: 204 });
};
