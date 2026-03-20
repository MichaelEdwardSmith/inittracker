// GET /auth/player/google/callback — validates the code, creates/fetches the player, sets cookie.
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { googlePlayer } from '$lib/server/oauth';
import { findOrCreatePlayerByOAuth } from '$lib/server/playerModel';
import { decodeIdToken } from 'arctic';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('player_oauth_state');
	const codeVerifier = cookies.get('player_oauth_code_verifier');

	cookies.delete('player_oauth_state', { path: '/' });
	cookies.delete('player_oauth_code_verifier', { path: '/' });

	if (!code || !state || state !== storedState || !codeVerifier) {
		redirect(303, '/player/login?oauth_error=invalid_state');
	}

	let tokens;
	try {
		tokens = await googlePlayer.validateAuthorizationCode(code, codeVerifier);
	} catch {
		redirect(303, '/player/login?oauth_error=token_exchange');
	}

	const claims = decodeIdToken(tokens.idToken()) as {
		sub: string;
		email?: string;
		given_name?: string;
		family_name?: string;
		name?: string;
		picture?: string;
	};

	const displayName =
		claims.given_name
			? `${claims.given_name}${claims.family_name ? ' ' + claims.family_name : ''}`
			: (claims.name ?? 'Player');

	const { sessionId } = await findOrCreatePlayerByOAuth({
		providerId: claims.sub,
		email: claims.email ?? null,
		displayName,
		avatarUrl: claims.picture
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
