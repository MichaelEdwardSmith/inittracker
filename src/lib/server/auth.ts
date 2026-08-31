// Resolves which DM auth sessionId server actions (mainly /api/* routes) should operate on
// for the current request. Normally this is just the dm_auth cookie value. When the
// logged-in account belongs to the system admin (see admin.ts) and an active `dm_impersonate`
// cookie is set, requests act as the impersonated DM instead — giving the admin full
// read/write control of that account from /admin for support and debugging.
import type { Cookies } from '@sveltejs/kit';
import { getDMBySessionId } from './dmModel';
import { isAdminDM } from './admin';

export async function resolveActingSessionId(cookies: Cookies): Promise<string | null> {
	const realSessionId = cookies.get('dm_auth') ?? null;
	if (!realSessionId) return null;

	const impersonateId = cookies.get('dm_impersonate') ?? null;
	if (!impersonateId) return realSessionId;

	const [real, target] = await Promise.all([
		getDMBySessionId(realSessionId),
		getDMBySessionId(impersonateId)
	]);

	// Only a verified admin can act as someone else; fall back silently otherwise
	// (e.g. a stale/tampered cookie).
	if (!real || !isAdminDM(real) || !target) return realSessionId;
	return impersonateId;
}
