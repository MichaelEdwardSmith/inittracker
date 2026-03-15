// GET /auth/facebook — redirects the browser to Facebook's consent screen.
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { facebook } from '$lib/server/oauth';
import { generateState } from 'arctic';

export const GET: RequestHandler = ({ cookies }) => {
	const state = generateState();

	// Facebook uses plain OAuth2 (no PKCE), request email scope
	const url = facebook.createAuthorizationURL(state, ['email', 'public_profile']);

	cookies.set('oauth_state', state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 10,
		secure: false
	});

	redirect(302, url.toString());
};
