// Server logic for /admin — system-wide list of every DM account (gated to a single owner
// email by hooks.server.ts, which also populates locals.isAdmin/dmEmail before this runs).
//
// Actions:
//   impersonate    — take full read/write control of a DM's dashboard (dm_impersonate cookie).
//   stop           — exit an active impersonation.
//   suspend/unsuspend — block/restore login + dashboard access without touching their data.
//   resetPassword  — generate a new password for a locked-out DM, shown once in the UI.
//   delete         — permanently remove a DM account and everything embedded in it.
// All except stop/impersonate-cancel are logged to the adminAudit collection.
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	listAllDMs,
	listAdminAudit,
	getDMBySessionId,
	deleteDM,
	suspendDM,
	unsuspendDM,
	setDMAdmin,
	resetDMPassword,
	logAdminAction
} from '$lib/server/dmModel';
import { authToGameSession, authToRuleset } from '$lib/server/sessionCache';
import { sessionStates, sessionClients } from '$lib/server/sseState';

export const load: PageServerLoad = async ({ locals }) => {
	const [dms, auditLog] = await Promise.all([listAllDMs(), listAdminAudit()]);
	return {
		dmFirstName: locals.dmFirstName ?? '',
		realSessionId: locals.realSessionId,
		isRootAdmin: locals.isRootAdmin,
		dms,
		auditLog
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
	},

	suspend: async ({ request, locals }) => {
		if (!locals.isAdmin || !locals.realSessionId || !locals.dmEmail) return fail(403);

		const data = await request.formData();
		const targetSessionId = (data.get('sessionId') as string)?.trim();
		if (!targetSessionId) return fail(400, { error: 'Missing session ID.' });
		if (targetSessionId === locals.realSessionId) {
			return fail(400, { error: 'You cannot suspend your own account.' });
		}

		const result = await suspendDM(targetSessionId);
		if (!result.ok) return fail(404, { error: result.error ?? 'DM account not found.' });

		await logAdminAction({
			adminEmail: locals.dmEmail,
			action: 'suspend',
			targetEmail: result.email ?? 'unknown',
			targetSessionId
		});

		return { suspended: true };
	},

	unsuspend: async ({ request, locals }) => {
		if (!locals.isAdmin || !locals.dmEmail) return fail(403);

		const data = await request.formData();
		const targetSessionId = (data.get('sessionId') as string)?.trim();
		if (!targetSessionId) return fail(400, { error: 'Missing session ID.' });

		const result = await unsuspendDM(targetSessionId);
		if (!result.ok) return fail(404, { error: result.error ?? 'DM account not found.' });

		await logAdminAction({
			adminEmail: locals.dmEmail,
			action: 'unsuspend',
			targetEmail: result.email ?? 'unknown',
			targetSessionId
		});

		return { unsuspended: true };
	},

	promote: async ({ request, locals }) => {
		// Only the root admin can hand out admin access — a promoted admin can't mint further ones.
		if (!locals.isRootAdmin || !locals.dmEmail) return fail(403);

		const data = await request.formData();
		const targetSessionId = (data.get('sessionId') as string)?.trim();
		if (!targetSessionId) return fail(400, { error: 'Missing session ID.' });

		const result = await setDMAdmin(targetSessionId, true);
		if (!result.ok) return fail(400, { error: result.error ?? 'Could not grant admin access.' });

		await logAdminAction({
			adminEmail: locals.dmEmail,
			action: 'promote-admin',
			targetEmail: result.email ?? 'unknown',
			targetSessionId
		});

		return { promoted: true };
	},

	demote: async ({ request, locals }) => {
		if (!locals.isRootAdmin || !locals.dmEmail) return fail(403);

		const data = await request.formData();
		const targetSessionId = (data.get('sessionId') as string)?.trim();
		if (!targetSessionId) return fail(400, { error: 'Missing session ID.' });

		const result = await setDMAdmin(targetSessionId, false);
		if (!result.ok) return fail(400, { error: result.error ?? 'Could not revoke admin access.' });

		await logAdminAction({
			adminEmail: locals.dmEmail,
			action: 'demote-admin',
			targetEmail: result.email ?? 'unknown',
			targetSessionId
		});

		return { demoted: true };
	},

	resetPassword: async ({ request, locals }) => {
		if (!locals.isAdmin || !locals.dmEmail) return fail(403);

		const data = await request.formData();
		const targetSessionId = (data.get('sessionId') as string)?.trim();
		if (!targetSessionId) return fail(400, { error: 'Missing session ID.' });

		const result = await resetDMPassword(targetSessionId);
		if (!result.ok) return fail(404, { error: result.error ?? 'DM account not found.' });

		await logAdminAction({
			adminEmail: locals.dmEmail,
			action: 'password-reset',
			targetEmail: result.email ?? 'unknown',
			targetSessionId
		});

		return { tempPassword: result.tempPassword, tempPasswordFor: result.email };
	},

	delete: async ({ request, cookies, locals }) => {
		if (!locals.isAdmin || !locals.realSessionId || !locals.dmEmail) return fail(403);

		const data = await request.formData();
		const targetSessionId = (data.get('sessionId') as string)?.trim();
		if (!targetSessionId) return fail(400, { error: 'Missing session ID.' });
		if (targetSessionId === locals.realSessionId) {
			return fail(400, { error: 'You cannot delete your own account.' });
		}

		const result = await deleteDM(targetSessionId);
		if (!result.ok) return fail(404, { error: result.error ?? 'DM account not found.' });

		// Evict the deleted account from every in-memory cache so nothing keeps serving or
		// accepting requests for it until the next server restart.
		authToGameSession.delete(targetSessionId);
		authToRuleset.delete(targetSessionId);
		for (const gameSessionId of result.gameSessionIds ?? []) {
			sessionStates.delete(gameSessionId);
			sessionClients.delete(gameSessionId);
		}

		// If the admin was mid-impersonation of the account they just deleted, exit that view.
		if (cookies.get('dm_impersonate') === targetSessionId) {
			cookies.delete('dm_impersonate', { path: '/' });
		}

		await logAdminAction({
			adminEmail: locals.dmEmail,
			action: 'delete-account',
			targetEmail: result.email ?? 'unknown',
			targetSessionId
		});

		return { deleted: true };
	}
};
