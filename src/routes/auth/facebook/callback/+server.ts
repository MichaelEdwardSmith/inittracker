// GET /auth/facebook/callback — validates the code, creates/fetches the DM, sets cookie.
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { facebook } from '$lib/server/oauth';
import { findOrCreateDMByOAuth } from '$lib/server/dmModel';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('oauth_state');

	cookies.delete('oauth_state', { path: '/' });

	if (!code || !state || state !== storedState) {
		redirect(303, '/login?oauth_error=invalid_state');
	}

	let tokens;
	try {
		tokens = await facebook.validateAuthorizationCode(code);
	} catch {
		redirect(303, '/login?oauth_error=token_exchange');
	}

	// Fetch the user profile from the Graph API
	const profileRes = await fetch(
		`https://graph.facebook.com/me?fields=id,first_name,last_name,email&access_token=${tokens.accessToken()}`
	);

	if (!profileRes.ok) {
		redirect(303, '/login?oauth_error=profile_fetch');
	}

	const profile = (await profileRes.json()) as {
		id: string;
		first_name?: string;
		last_name?: string;
		email?: string;
	};

	const { sessionId } = await findOrCreateDMByOAuth({
		provider: 'facebook',
		providerId: profile.id,
		email: profile.email ?? null,
		firstName: profile.first_name ?? 'DM',
		lastName: profile.last_name ?? ''
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
