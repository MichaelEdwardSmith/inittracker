import type { PageServerLoad } from './$types';
import { listGameSessions } from '$lib/server/dmModel';
import type { GameSession } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
	const authSessionId = locals.sessionId ?? '';
	const gameSessionId = locals.gameSessionId ?? '';

	const sessions = await listGameSessions(authSessionId);

	const activeSession: GameSession =
		sessions.find((s) => s.sessionId === gameSessionId) ??
		sessions[0] ?? { id: '', sessionId: gameSessionId, name: 'Session' };

	return {
		dmFirstName: locals.dmFirstName ?? '',
		sessions,
		activeSession
	};
};
