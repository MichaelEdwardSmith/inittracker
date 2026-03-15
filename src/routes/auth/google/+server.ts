// GET /auth/google — redirects the browser to Google's consent screen.
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { google } from '$lib/server/oauth';
import { generateState, generateCodeVerifier } from 'arctic';

export const GET: RequestHandler = ({ cookies }) => {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();

	const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

	// Store state + verifier in short-lived cookies (SameSite=Lax to survive cross-site redirect)
	cookies.set('oauth_state', state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 10, // 10 minutes
		secure: false
	});
	cookies.set('oauth_code_verifier', codeVerifier, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 10,
		secure: false
	});

	redirect(302, url.toString());
};
