import type { PageServerLoad } from './$types';
import { getDMBySessionId } from '$lib/server/dmModel';

export const load: PageServerLoad = async ({ cookies }) => {
	const sessionId = cookies.get('dm_auth') ?? null;
	let showVoiceCommands = false;
	if (sessionId) {
		const dm = await getDMBySessionId(sessionId);
		showVoiceCommands = dm?.email === 'michael.e.smith.1978@gmail.com';
	}
	return { showVoiceCommands };
};
