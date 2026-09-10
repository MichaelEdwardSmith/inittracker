// Root layout load — runs for every route. Figures out whether the current visitor is a
// logged-in DM or Player with an on-file email that hasn't been verified yet, so the root
// layout can show a persistent nag banner. Deliberately independent of hooks.server.ts's
// per-route DM/Player lookups (which only run on specific path prefixes) — this runs
// everywhere, at the cost of one extra indexed findOne() per navigation, which is fine for
// this app's traffic. Nothing is gated on the result; it's purely for the banner.
import type { LayoutServerLoad } from './$types';
import { getDMBySessionId, type DM } from '$lib/server/dmModel';
import { getPlayerBySessionId, type Player } from '$lib/server/playerModel';

/** True if any OAuth provider is linked — checked live rather than trusting only the stored
 *  emailVerified flag, so an account whose OAuth link predates emailVerified being tracked (or
 *  hasn't triggered another OAuth login since) still isn't nagged. The provider already vouches
 *  for the email regardless of what's persisted. */
function hasOAuth(account: Pick<DM | Player, 'oauth'>): boolean {
	return !!account.oauth && Object.keys(account.oauth).length > 0;
}

export const load: LayoutServerLoad = async ({ cookies }) => {
	const dmSessionId = cookies.get('dm_auth');
	if (dmSessionId) {
		const dm = await getDMBySessionId(dmSessionId);
		if (dm && dm.email && !dm.emailVerified && !hasOAuth(dm)) {
			return { unverifiedEmail: dm.email, accountKind: 'dm' as const };
		}
		return { unverifiedEmail: null, accountKind: null };
	}

	const playerSessionId = cookies.get('player_auth');
	if (playerSessionId) {
		const player = await getPlayerBySessionId(playerSessionId);
		if (player && player.email && !player.emailVerified && !hasOAuth(player)) {
			return { unverifiedEmail: player.email, accountKind: 'player' as const };
		}
	}

	return { unverifiedEmail: null, accountKind: null };
};
