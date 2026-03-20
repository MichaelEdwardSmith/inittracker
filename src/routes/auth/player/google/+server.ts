// GET /auth/player/google — redirects the browser to Google's consent screen for player login.
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { googlePlayer } from '$lib/server/oauth';
import { generateState, generateCodeVerifier } from 'arctic';

export const GET: RequestHandler = ({ cookies }) => {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();

	const url = googlePlayer.createAuthorizationURL(state, codeVerifier, [
		'openid',
		'profile',
		'email'
	]);

	// Use distinct cookie names so player and DM OAuth flows never collide
	cookies.set('player_oauth_state', state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 10,
		secure: false
	});
	cookies.set('player_oauth_code_verifier', codeVerifier, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 10,
		secure: false
	});

	redirect(302, url.toString());
};
