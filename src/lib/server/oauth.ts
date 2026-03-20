// OAuth provider instances (arctic 3.x).
// Env vars required:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
//   FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET
//   DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET
//   OAUTH_REDIRECT_BASE  (e.g. https://inittracker.com or http://localhost:5173)
import { Google, Facebook, Discord } from 'arctic';
import {
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	FACEBOOK_CLIENT_ID,
	FACEBOOK_CLIENT_SECRET,
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
	OAUTH_REDIRECT_BASE
} from '$env/static/private';

const base = OAUTH_REDIRECT_BASE || 'http://localhost:5173';

export const google = new Google(
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	`${base}/auth/google/callback`
);

// Separate Google instance for player accounts — different callback URL.
// Add https://yourdomain.com/auth/player/google/callback to your Google Console
// authorized redirect URIs.
export const googlePlayer = new Google(
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	`${base}/auth/player/google/callback`
);

export const facebook = new Facebook(
	FACEBOOK_CLIENT_ID,
	FACEBOOK_CLIENT_SECRET,
	`${base}/auth/facebook/callback`
);

// Discord OAuth for DM accounts.
// Add https://yourdomain.com/auth/discord/callback to your Discord app's redirect URIs.
export const discord = new Discord(
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
	`${base}/auth/discord/callback`
);

// Separate Discord instance for player accounts — different callback URL.
// Add https://yourdomain.com/auth/player/discord/callback to your Discord app's redirect URIs.
export const discordPlayer = new Discord(
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
	`${base}/auth/player/discord/callback`
);
