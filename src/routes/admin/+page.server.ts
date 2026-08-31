// Server logic for /admin — system-wide list of every DM account (gated to a single owner
// email by hooks.server.ts, which also populates locals.isAdmin/dmEmail before this runs).
// The `impersonate` action lets the admin take full read/write control of another DM's
// dashboard by setting the dm_impersonate cookie; `stop` clears it. Both are logged to the
// adminAudit collection for accountability.
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { listAllDMs, getDMBySessionId, logAdminAction } from '$lib/server/dmModel';

export const load: PageServerLoad = async ({ locals }) => {
	const dms = await listAllDMs();
	return {
		dmFirstName: locals.dmFirstName ?? '',
		dms
	};
};

export const actions: Actions = {
	impersonate: async ({ request, cookies, locals }) => {
		if (!locals.isAdmin || !locals.realSessionId || !locals.dmEmail) return fail(403);

		const data = await request.formData();
		const targetSessionId = (data.get('sessionId') as string)?.trim();
		if (!targetSessionId) return fail(400, { error: 'Missing session ID.' });
		if (targetSessionId === locals.realSessionId) {
			return fail(400, { error: "You're already logged in as yourself." });
		}

		const target = await getDMBySessionId(targetSessionId);
		if (!target) return fail(404, { error: 'DM account not found.' });

		cookies.set('dm_impersonate', targetSessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 8, // 8 hours — a support session, not a persistent login
			secure: false // allow plain HTTP for local use, matches dm_auth
		});

		await logAdminAction({
			adminEmail: locals.dmEmail,
			action: 'impersonate-start',
			targetEmail: target.email,
			targetSessionId
		});

		redirect(303, '/dashboard');
	},

	stop: async ({ cookies, locals }) => {
		// This action's requests hit the '/admin' branch in hooks.server.ts (not '/dashboard'),
		// so locals.dmEmail here is always the real admin's own email, never the impersonated
		// target's — impersonation-specific locals (isImpersonating etc.) aren't populated for it.
		const impersonatedSessionId = cookies.get('dm_impersonate') ?? null;
		cookies.delete('dm_impersonate', { path: '/' });

		if (impersonatedSessionId && locals.dmEmail) {
			const target = await getDMBySessionId(impersonatedSessionId);
			if (target) {
				await logAdminAction({
					adminEmail: locals.dmEmail,
					action: 'impersonate-stop',
					targetEmail: target.email,
					targetSessionId: impersonatedSessionId
				});
			}
		}

		redirect(303, '/admin');
	}
};
