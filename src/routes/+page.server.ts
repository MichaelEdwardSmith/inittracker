// Public landing page (/).
// Redirects already-authenticated DMs straight to the dashboard.
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDMBySessionId } from '$lib/server/dmModel';

export const load: PageServerLoad = async ({ cookies }) => {
	const sessionId = cookies.get('dm_auth');
	if (sessionId) {
		const dm = await getDMBySessionId(sessionId);
		if (dm) redirect(303, '/dashboard');
	}
	if (cookies.get('dm_guest')) redirect(303, '/dashboard');
};
