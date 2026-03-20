// GET /auth/player/discord/callback — validates the code, creates/fetches the player, sets cookie.
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { discordPlayer } from '$lib/server/oauth';
import { findOrCreatePlayerByOAuth } from '$lib/server/playerModel';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('player_discord_state');
	const codeVerifier = cookies.get('player_discord_code_verifier');

	cookies.delete('player_discord_state', { path: '/' });
	cookies.delete('player_discord_code_verifier', { path: '/' });

	if (!code || !state || state !== storedState || !codeVerifier) {
		redirect(303, '/player/login?oauth_error=invalid_state');
	}

	let tokens;
	try {
		tokens = await discordPlayer.validateAuthorizationCode(code, codeVerifier);
	} catch {
		redirect(303, '/player/login?oauth_error=token_exchange');
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
	} catch {
		redirect(303, '/player/login?oauth_error=profile_fetch');
	}

	const displayName = discordUser.global_name ?? discordUser.username;
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
		sameSite: 'strict',
		maxAge: 60 * 60 * 24 * 30,
		secure: false
	});

	redirect(303, '/join');
};
