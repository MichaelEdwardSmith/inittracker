// GET /admin/export/<sessionId> — downloads a DM's full account document as JSON (minus their
// password hash). Admin-only; hooks.server.ts already gates every /admin/* route to isAdmin
// before this handler runs. Used as a plain <a href> link so the browser triggers a download.
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDMBySessionId, logAdminAction } from '$lib/server/dmModel';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.isAdmin || !locals.dmEmail) error(403, 'Forbidden');

	const dm = await getDMBySessionId(params.sessionId);
	if (!dm) error(404, 'DM account not found');

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { passwordHash, _id, ...exportable } = dm as typeof dm & { _id: unknown };

	await logAdminAction({
		adminEmail: locals.dmEmail,
		action: 'export-data',
		targetEmail: dm.email,
		targetSessionId: dm.sessionId
	});

	const filename = `dm-export-${dm.email.replace(/[^a-z0-9.@-]/gi, '_')}.json`;
	return new Response(JSON.stringify(exportable, null, 2), {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
