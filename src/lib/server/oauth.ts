// OAuth provider instances (arctic 3.x).
// Env vars required:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
//   FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET
//   OAUTH_REDIRECT_BASE  (e.g. https://inittracker.com or http://localhost:5173)
import { Google, Facebook } from 'arctic';
import { env } from '$env/dynamic/private';

export const google = new Google(
	env.GOOGLE_CLIENT_ID ?? '',
	env.GOOGLE_CLIENT_SECRET ?? '',
	`${env.OAUTH_REDIRECT_BASE ?? 'http://localhost:5173'}/auth/google/callback`
);

export const facebook = new Facebook(
	env.FACEBOOK_CLIENT_ID ?? '',
	env.FACEBOOK_CLIENT_SECRET ?? '',
	`${env.OAUTH_REDIRECT_BASE ?? 'http://localhost:5173'}/auth/facebook/callback`
);
