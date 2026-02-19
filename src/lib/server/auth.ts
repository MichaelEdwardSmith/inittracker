import { createHash } from 'node:crypto';
import { DM_PASSWORD } from '$env/static/private';

/** Returns true if the submitted password matches the configured one. */
export function validatePassword(input: string): boolean {
	return input === DM_PASSWORD;
}

/**
 * Derives a stable session token from the password via SHA-256.
 * Stateless — no server-side session store needed, survives restarts.
 */
export function getSessionToken(): string {
	return createHash('sha256').update('dm_auth:' + DM_PASSWORD).digest('hex');
}

/** Returns true if the cookie value is a valid session token. */
export function isValidCookie(value: string | undefined): boolean {
	if (!value) return false;
	return value === getSessionToken();
}
