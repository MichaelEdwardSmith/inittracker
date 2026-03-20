// Server load + action for /join.
// Load exposes any logged-in player identity and their saved sessions.
// Action validates the submitted 6-char session ID and redirects to /display/[sessionId].
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDMByGameSessionId, getGameSessionName } from '$lib/server/dmModel';
import { isValidSessionId } from '$lib/server/validate';
import {
	getPlayerBySessionId,
	getPlayerSessions,
	recordPlayerSession
} from '$lib/server/playerModel';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.playerName) {
		return { player: null, sessions: [] };
	}

	const playerSessionId = cookies.get('player_auth') ?? '';
	const sessions = playerSessionId ? await getPlayerSessions(playerSessionId) : [];

	return {
		player: { name: locals.playerName, avatarUrl: locals.playerAvatarUrl },
		sessions
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const raw = (data.get('sessionId') as string) ?? '';
		const sessionId = raw.trim().toUpperCase();

		if (!sessionId) {
			return fail(400, { error: 'Please enter a session ID.' });
		}

		if (!isValidSessionId(sessionId)) {
			return fail(404, { error: 'Session not found. Double-check your session ID.' });
		}

		const dm = await getDMByGameSessionId(sessionId);
		if (!dm) {
			return fail(404, { error: 'Session not found. Double-check your session ID.' });
		}

		// Record the session on the player's account if they're logged in
		const playerSessionId = cookies.get('player_auth') ?? '';
		if (playerSessionId) {
			const player = await getPlayerBySessionId(playerSessionId);
			if (player) {
				const sessionName = (await getGameSessionName(sessionId)) ?? 'Unknown Session';
				await recordPlayerSession(playerSessionId, sessionId, sessionName);
			}
		}

		redirect(303, `/display/${sessionId}`);
	}
};
