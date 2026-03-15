// GET /auth/google/callback — validates the code, creates/fetches the DM, sets cookie.
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { google } from '$lib/server/oauth';
import { findOrCreateDMByOAuth } from '$lib/server/dmModel';
import { decodeIdToken } from 'arctic';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('oauth_state');
	const codeVerifier = cookies.get('oauth_code_verifier');

	// Clean up the short-lived cookies
	cookies.delete('oauth_state', { path: '/' });
	cookies.delete('oauth_code_verifier', { path: '/' });

	if (!code || !state || state !== storedState || !codeVerifier) {
		redirect(303, '/login?oauth_error=invalid_state');
	}

	let tokens;
	try {
		tokens = await google.validateAuthorizationCode(code, codeVerifier);
	} catch {
		redirect(303, '/login?oauth_error=token_exchange');
	}

	// Decode the ID token — Google always includes profile + email in the payload
	const claims = decodeIdToken(tokens.idToken()) as {
		sub: string;
		email?: string;
		given_name?: string;
		family_name?: string;
		name?: string;
	};

	const nameParts = (claims.name ?? '').split(' ');
	const { sessionId } = await findOrCreateDMByOAuth({
		provider: 'google',
		providerId: claims.sub,
		email: claims.email ?? null,
		firstName: claims.given_name ?? nameParts[0] ?? 'DM',
		lastName: claims.family_name ?? nameParts.slice(1).join(' ') ?? ''
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
