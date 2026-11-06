// GET    /admin/feedback — newest in-app feedback from DMs, for the Insights tab.
// DELETE /admin/feedback?id= — remove one entry once it's been dealt with.
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listFeedback, deleteFeedback } from '$lib/server/feedbackStore';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.isAdmin) error(403);
	return json(await listFeedback());
};

export const DELETE: RequestHandler = async ({ url, locals }) => {
	if (!locals.isAdmin) error(403);
	const id = url.searchParams.get('id') ?? '';
	if (!(await deleteFeedback(id))) error(404, 'Feedback not found');
	return json({ ok: true });
};
