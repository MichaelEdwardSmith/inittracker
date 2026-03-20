// GET /auth/discord/callback — single callback for both DM and player Discord flows.
// The state parameter is prefixed with "dm:" or "player:" to indicate which flow initiated it.
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { discord } from '$lib/server/oauth';
import { findOrCreateDMByOAuth } from '$lib/server/dmModel';
import { findOrCreatePlayerByOAuth } from '$lib/server/playerModel';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('discord_oauth_state');
	const codeVerifier = cookies.get('discord_oauth_verifier');

	cookies.delete('discord_oauth_state', { path: '/' });
	cookies.delete('discord_oauth_verifier', { path: '/' });

	if (!code || !state || state !== storedState || !codeVerifier) {
		redirect(303, '/login?oauth_error=invalid_state');
	}

	// Parse the flow type from the state prefix ("dm:<random>" or "player:<random>")
	const flowType = state.startsWith('player:') ? 'player' : 'dm';
	const errorRedirect =
		flowType === 'player' ? '/player/login?oauth_error=' : '/login?oauth_error=';

	let tokens;
	try {
		tokens = await discord.validateAuthorizationCode(code, codeVerifier);
	} catch (err) {
		console.error('[Discord CB] token_exchange error:', err);
		redirect(303, errorRedirect + 'token_exchange');
	}

	// Fetch user profile from Discord's API
	let discordUser: {
		id: string;
		username: string;
		global_name?: string;
		email?: string;
		avatar?: string;
	};
	try {
		const res = await fetch('https://discord.com/api/users/@me', {
			headers: { Authorization: `Bearer ${tokens.accessToken()}` }
		});
		discordUser = await res.json();
	} catch (err) {
		console.error('[Discord CB] profile_fetch error:', err);
		redirect(303, errorRedirect + 'profile_fetch');
	}

	const displayName = discordUser.global_name ?? discordUser.username;

	if (flowType === 'player') {
		const avatarUrl = discordUser.avatar
			? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
			: undefined;

		const { sessionId } = await findOrCreatePlayerByOAuth({
			provider: 'discord',
			providerId: discordUser.id,
			email: discordUser.email ?? null,
			displayName,
			avatarUrl
		});

		cookies.set('player_auth', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30,
			secure: false
		});

		redirect(303, '/join');
	} else {
		const nameParts = displayName.split(' ');

		const { sessionId } = await findOrCreateDMByOAuth({
			provider: 'discord',
			providerId: discordUser.id,
			email: discordUser.email ?? null,
			firstName: nameParts[0] ?? displayName,
			lastName: nameParts.slice(1).join(' ') ?? ''
		});

		cookies.set('dm_auth', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30,
			secure: false
		});

		redirect(303, '/dashboard');
	}
};
