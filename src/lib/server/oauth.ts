// OAuth provider instances (arctic 3.x).
// Env vars required:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
//   FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET
//   OAUTH_REDIRECT_BASE  (e.g. https://inittracker.com or http://localhost:5173)
import { Google, Facebook } from 'arctic';
import {
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	FACEBOOK_CLIENT_ID,
	FACEBOOK_CLIENT_SECRET,
	OAUTH_REDIRECT_BASE
} from '$env/static/private';

const base = OAUTH_REDIRECT_BASE || 'http://localhost:5173';


export const google = new Google(
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	`${base}/auth/google/callback`
);

export const facebook = new Facebook(
	FACEBOOK_CLIENT_ID,
	FACEBOOK_CLIENT_SECRET,
	`${base}/auth/facebook/callback`
);
