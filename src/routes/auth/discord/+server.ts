// GET /auth/discord — redirects the browser to Discord's consent screen for DM login.
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { discord } from '$lib/server/oauth';
import { generateState, generateCodeVerifier } from 'arctic';

export const GET: RequestHandler = ({ cookies }) => {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();

	const url = discord.createAuthorizationURL(state, codeVerifier, ['identify', 'email']);

	cookies.set('discord_state', state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 10,
		secure: false
	});
	cookies.set('discord_code_verifier', codeVerifier, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 10,
		secure: false
	});

	redirect(302, url.toString());
};
