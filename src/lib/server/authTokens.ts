// Shared helpers for password-reset / email-verification tokens.
// The token emailed to the user is a random opaque string; only its SHA-256 hash is ever
// persisted, so a DB read (or leak) can't be turned directly into a usable token — same
// principle as never storing plaintext passwords.
import { randomBytes, createHash, timingSafeEqual } from 'crypto';

export function generateToken(): string {
	return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

/** Constant-time comparison of two hex digests, to avoid leaking match length via timing. */
export function hashesEqual(a: string, b: string): boolean {
	const bufA = Buffer.from(a, 'hex');
	const bufB = Buffer.from(b, 'hex');
	if (bufA.length !== bufB.length) return false;
	return timingSafeEqual(bufA, bufB);
}

export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes
export const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
