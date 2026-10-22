// GET /admin/activity/export[?sessionId=] — raw usage log as CSV, newest first. With a
// sessionId it's that one DM's log; without, every DM's (capped at 50,000 rows).
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ACTIVITY_LABELS } from '$lib/activity';
import { csvRow } from '$lib/csv';
import { getActivityFeed } from '$lib/server/dmModel';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.isAdmin) error(403);
	const sessionId = url.searchParams.get('sessionId') || undefined;
	const entries = await getActivityFeed({ limit: 50000, sessionId });
	const labels: Record<string, string> = ACTIVITY_LABELS;

	const lines = [
		csvRow(['Time (UTC)', 'DM', 'Email', 'Feature', 'Detail']),
		...entries.map((e) =>
			csvRow([
				new Date(e.at).toISOString(),
				e.name,
				e.email,
				labels[e.feature] ?? e.feature,
				e.detail
			])
		)
	];
	const stamp = new Date().toISOString().slice(0, 10);
	// BOM so Excel reads the file as UTF-8 (details contain characters like "×").
	return new Response('﻿' + lines.join('\r\n'), {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="dm-usage-log-${sessionId ?? 'all'}-${stamp}.csv"`
		}
	});
};
