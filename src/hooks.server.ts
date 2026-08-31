// SvelteKit server hook — runs on every request.
// Reads the dm_auth cookie and protects / and /history by redirecting unauthenticated
// requests to /login. Also resolves the active game session public ID and stores it in
// event.locals for downstream load functions.
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { getDMBySessionId, getActiveGameSession, touchDMActivity } from '$lib/server/dmModel';
import { getPlayerBySessionId } from '$lib/server/playerModel';
import { authToGameSession, authToRuleset } from '$lib/server/sessionCache';
import { isAdminEmail } from '$lib/server/admin';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('dm_auth') ?? null;
	const guestSessionId = event.cookies.get('dm_guest') ?? null;
	const playerSessionId = event.cookies.get('player_auth') ?? null;
	event.locals.sessionId = sessionId;
	event.locals.gameSessionId = null;
	event.locals.ruleset = '2014';
	event.locals.dmFirstName = null;
	event.locals.dmEmail = null;
	event.locals.isGuest = false;
	event.locals.isAdmin = false;
	event.locals.realSessionId = null;
	event.locals.isImpersonating = false;
	event.locals.impersonatingAdminEmail = null;
	event.locals.playerName = null;
	event.locals.playerAvatarUrl = null;

	// Resolve player identity for join and display routes
	const { pathname } = event.url;
	if (playerSessionId && (pathname === '/join' || pathname.startsWith('/display/'))) {
		const player = await getPlayerBySessionId(playerSessionId);
		if (player) {
			event.locals.playerName = player.displayName;
			event.locals.playerAvatarUrl = player.avatarUrl ?? null;
		} else {
			// Stale cookie — clear it
			event.cookies.delete('player_auth', { path: '/' });
		}
	}

	// Admin-only page: system-wide list of every DM account, gated to a single owner email.
	if (pathname === '/admin') {
		if (!sessionId) redirect(303, '/login');
		const dm = await getDMBySessionId(sessionId);
		if (!dm) {
			event.cookies.delete('dm_auth', { path: '/' });
			redirect(303, '/login');
		}
		event.locals.realSessionId = sessionId;
		event.locals.isAdmin = isAdminEmail(dm.email);
		if (!event.locals.isAdmin) redirect(303, '/dashboard');
		event.locals.dmFirstName = dm.firstName;
		event.locals.dmEmail = dm.email;
		touchDMActivity(sessionId, dm.lastActiveAt ?? null);
		return resolve(event);
	}

	// Protect DM-only pages. /display/*, /login, /register, /join, /api/* are open.
	if (pathname === '/dashboard' || pathname === '/history') {
		// Guest access — allowed on dashboard and history.
		if (!sessionId && guestSessionId) {
			event.locals.isGuest = true;
			event.locals.gameSessionId = guestSessionId;
			event.locals.dmFirstName = 'Guest';
			return resolve(event);
		}

		if (!sessionId) redirect(303, '/login');
		const realDm = await getDMBySessionId(sessionId);
		if (!realDm) {
			event.cookies.delete('dm_auth', { path: '/' });
			redirect(303, '/login');
		}
		event.locals.realSessionId = sessionId;
		event.locals.isAdmin = isAdminEmail(realDm.email);
		// Track the real account's activity, not the impersonated target's — impersonation is
		// the admin looking at someone else's dashboard, not that DM actually using the system.
		touchDMActivity(sessionId, realDm.lastActiveAt ?? null);

		// Admin impersonation — act as the target DM's account instead of the admin's own.
		let actingSessionId = sessionId;
		let actingDm = realDm;
		const impersonateId = event.cookies.get('dm_impersonate') ?? null;
		if (impersonateId && event.locals.isAdmin) {
			const target = await getDMBySessionId(impersonateId);
			if (target) {
				actingSessionId = impersonateId;
				actingDm = target;
				event.locals.isImpersonating = true;
				event.locals.impersonatingAdminEmail = realDm.email;
			} else {
				// Stale cookie (deleted account, etc.) — clear it.
				event.cookies.delete('dm_impersonate', { path: '/' });
			}
		}

		event.locals.sessionId = actingSessionId;
		event.locals.dmFirstName = actingDm.firstName;
		event.locals.dmEmail = actingDm.email;

		// Resolve active game session (triggers migration for legacy documents).
		let gameSessionId = authToGameSession.get(actingSessionId) ?? null;
		let ruleset = authToRuleset.get(actingSessionId) ?? null;
		if (!gameSessionId || !ruleset) {
			const active = await getActiveGameSession(actingSessionId);
			if (active) {
				gameSessionId = active.publicId;
				ruleset = active.ruleset;
				authToGameSession.set(actingSessionId, active.publicId);
				authToRuleset.set(actingSessionId, active.ruleset);
			}
		}
		event.locals.gameSessionId = gameSessionId;
		event.locals.ruleset = ruleset ?? '2014';
	}

	return resolve(event);
};
