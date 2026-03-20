// Server load for the DM dashboard (/).
// Fetches all game sessions for the authenticated DM and resolves the active one,
// passing both down as page data.
import type { PageServerLoad } from './$types';
import { listGameSessions, activeSessionNeedsRulesetSetup } from '$lib/server/dmModel';
import type { GameSession } from '$lib/types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (locals.isGuest) {
		return {
			dmFirstName: 'Guest',
			isGuest: true,
			showVoiceCommands: false,
			sessions: [] as GameSession[],
			needsEditionSetup: true, // guests always choose on each visit
			activeSession: {
				id: '',
				sessionId: locals.gameSessionId ?? '',
				name: 'Guest Session',
				ruleset: '2014' as const // placeholder until guest picks
			} as GameSession
		};
	}

	const authSessionId = locals.sessionId ?? '';
	const gameSessionId = locals.gameSessionId ?? '';

	const [sessions, needsEditionSetup] = await Promise.all([
		listGameSessions(authSessionId),
		activeSessionNeedsRulesetSetup(authSessionId)
	]);

	const activeSession: GameSession = sessions.find((s) => s.sessionId === gameSessionId) ??
		sessions[0] ?? { id: '', sessionId: gameSessionId, name: 'Session', ruleset: '2014' };

	return {
		dmFirstName: locals.dmFirstName ?? '',
		isGuest: false,
		showVoiceCommands: true,
		sessions,
		activeSession,
		needsEditionSetup
	};
};
