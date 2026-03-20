// GET /auth/discord/callback — validates the code, creates/fetches the DM, sets cookie.
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { discord } from '$lib/server/oauth';
import { findOrCreateDMByOAuth } from '$lib/server/dmModel';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('discord_state');
	const codeVerifier = cookies.get('discord_code_verifier');

	cookies.delete('discord_state', { path: '/' });
	cookies.delete('discord_code_verifier', { path: '/' });

	if (!code || !state || state !== storedState || !codeVerifier) {
		redirect(303, '/login?oauth_error=invalid_state');
	}

	let tokens;
	try {
		tokens = await discord.validateAuthorizationCode(code, codeVerifier);
	} catch {
		redirect(303, '/login?oauth_error=token_exchange');
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
		redirect(303, '/login?oauth_error=profile_fetch');
	}

	const displayName = discordUser.global_name ?? discordUser.username;
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
		sameSite: 'strict',
		maxAge: 60 * 60 * 24 * 30,
		secure: false
	});

	redirect(303, '/dashboard');
};
