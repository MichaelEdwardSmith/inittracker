// Player account model — separate from DM accounts.
// Lighter weight: display name, email, optional Google OAuth, optional avatar.
// Stored in the 'players' MongoDB collection.
import bcrypt from 'bcryptjs';
import { randomUUID, randomBytes } from 'crypto';
import { getDb } from './db';
import type { NoteEntry } from '$lib/types';
import { generateToken, hashToken, PASSWORD_RESET_TTL_MS, EMAIL_VERIFY_TTL_MS } from './authTokens';

const SESSION_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSessionId(): string {
	return Array.from(
		{ length: 6 },
		() => SESSION_CHARS[Math.floor(Math.random() * SESSION_CHARS.length)]
	).join('');
}

// Readable charset for admin-generated temporary passwords — avoids visually ambiguous
// characters (0/O, 1/l/I) since these get read aloud or typed from a screen. Mirrors dmModel.ts.
const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';

function randomTempPassword(length = 14): string {
	const bytes = randomBytes(length);
	return Array.from(bytes, (b) => TEMP_PASSWORD_CHARS[b % TEMP_PASSWORD_CHARS.length]).join('');
}

export interface PlayerSession {
	sessionId: string; // 6-char public game session ID
	sessionName: string;
	lastSeen: Date;
}

export interface Player {
	displayName: string;
	email: string | null;
	passwordHash: string;
	sessionId: string;
	avatarUrl?: string;
	oauth?: { google?: string; discord?: string };
	joinedSessions?: PlayerSession[];
	notes?: NoteEntry[];
	createdAt: Date;
	/** True once the account's email has been confirmed via a verify-email link. Informational
	 *  only — nothing is gated on this. Absent for accounts created before this field existed. */
	emailVerified?: boolean;
	passwordResetTokenHash?: string;
	passwordResetExpiresAt?: Date;
	emailVerifyTokenHash?: string;
	emailVerifyExpiresAt?: Date;
	/** Set by an admin via the /admin Players tab — blocks login and clears any live session
	 *  (see the suspension check in hooks.server.ts). Mirrors DM.suspendedAt. */
	suspendedAt?: Date;
	/** True once this player has clicked the unsubscribe link on an admin broadcast email.
	 *  Mirrors DM.emailOptOut. */
	emailOptOut?: boolean;
	/** Persistent, non-expiring token embedded in admin broadcast emails' unsubscribe link.
	 *  Mirrors DM.unsubscribeToken. */
	unsubscribeToken?: string;
}

async function col() {
	const db = await getDb();
	return db.collection<Player>('players');
}

export async function getPlayerBySessionId(sessionId: string): Promise<Player | null> {
	const c = await col();
	return (await c.findOne({ sessionId })) ?? null;
}

export async function findOrCreatePlayerByOAuth(profile: {
	provider: 'google' | 'discord';
	providerId: string;
	email: string | null;
	displayName: string;
	avatarUrl?: string;
}): Promise<{ sessionId: string }> {
	const c = await col();
	const providerField = `oauth.${profile.provider}`;

	// Existing account for this provider. Also marks emailVerified (idempotent) — completing
	// this provider's OAuth flow again proves control of it, covering an account created before
	// OAuth logins started implying verification.
	let player = await c.findOne({ [providerField]: profile.providerId });
	if (player) {
		// Keep avatar fresh from provider
		if (profile.avatarUrl && profile.avatarUrl !== player.avatarUrl) {
			await c.updateOne(
				{ sessionId: player.sessionId },
				{ $set: { avatarUrl: profile.avatarUrl, emailVerified: true } }
			);
		} else {
			await c.updateOne({ sessionId: player.sessionId }, { $set: { emailVerified: true } });
		}
		return { sessionId: player.sessionId };
	}

	// Link to existing email account — the provider is directly asserting this exact email
	// address, so it counts as verified.
	if (profile.email) {
		player = await c.findOne({ email: profile.email.toLowerCase() });
		if (player) {
			await c.updateOne(
				{ email: profile.email.toLowerCase() },
				{
					$set: {
						[providerField]: profile.providerId,
						avatarUrl: profile.avatarUrl,
						emailVerified: true
					}
				}
			);
			return { sessionId: player.sessionId };
		}
	}

	// Create new player account. The provider already vouches for this email — no verify-email
	// link is ever sent for a brand-new OAuth signup (unlike createPlayer), so this can't be left
	// to that flow.
	const sessionId = randomSessionId();
	await c.insertOne({
		displayName: profile.displayName,
		email: profile.email ? profile.email.toLowerCase() : null,
		passwordHash: '',
		sessionId,
		avatarUrl: profile.avatarUrl,
		emailVerified: !!profile.email,
		oauth: { [profile.provider]: profile.providerId },
		createdAt: new Date()
	});

	return { sessionId };
}

export async function createPlayer(
	displayName: string,
	email: string,
	password: string
): Promise<{ sessionId: string } | { error: string }> {
	const c = await col();

	const existing = await c.findOne({ email: email.toLowerCase() });
	if (existing) return { error: 'An account with that email already exists.' };

	const sessionId = randomSessionId();
	const passwordHash = await bcrypt.hash(password, 12);

	await c.insertOne({
		displayName: displayName.trim(),
		email: email.toLowerCase(),
		passwordHash,
		sessionId,
		createdAt: new Date()
	});

	return { sessionId };
}

export async function loginPlayer(
	email: string,
	password: string
): Promise<{ sessionId: string; suspended: boolean } | null> {
	const c = await col();
	const player = await c.findOne({ email: email.toLowerCase() });
	if (!player || !player.passwordHash) return null;

	const valid = await bcrypt.compare(password, player.passwordHash);
	if (!valid) return null;

	return { sessionId: player.sessionId, suspended: !!player.suspendedAt };
}

// ---------------------------------------------------------------------------
// Self-serve password reset & email verification (Postmark-backed — see mail.ts).
// Mirrors the equivalent functions in dmModel.ts.
// ---------------------------------------------------------------------------

/**
 * Starts a password-reset flow for the given email. Always safe to call with an unknown email —
 * returns null in that case so the route can show the same generic message either way.
 */
export async function createPlayerPasswordResetToken(email: string): Promise<string | null> {
	const c = await col();
	const lower = email.toLowerCase();
	const player = await c.findOne({ email: lower });
	if (!player) return null;

	const token = generateToken();
	await c.updateOne(
		{ email: lower },
		{
			$set: {
				passwordResetTokenHash: hashToken(token),
				passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS)
			}
		}
	);
	return token;
}

/** Completes a password reset. Returns an error for an invalid, expired, or already-used token. */
export async function resetPlayerPasswordWithToken(
	token: string,
	newPassword: string
): Promise<{ ok: boolean; error?: string }> {
	const c = await col();
	const player = await c.findOne({ passwordResetTokenHash: hashToken(token) });
	if (
		!player ||
		!player.passwordResetExpiresAt ||
		player.passwordResetExpiresAt.getTime() < Date.now()
	) {
		return { ok: false, error: 'This reset link is invalid or has expired.' };
	}

	const passwordHash = await bcrypt.hash(newPassword, 12);
	await c.updateOne(
		{ sessionId: player.sessionId },
		{
			$set: { passwordHash },
			$unset: { passwordResetTokenHash: '', passwordResetExpiresAt: '' }
		}
	);
	return { ok: true };
}

/** Generates a fresh email-verification token for a player account. */
export async function createPlayerEmailVerificationToken(
	playerSessionId: string
): Promise<string | null> {
	const c = await col();
	const player = await c.findOne({ sessionId: playerSessionId });
	if (!player) return null;

	const token = generateToken();
	await c.updateOne(
		{ sessionId: playerSessionId },
		{
			$set: {
				emailVerifyTokenHash: hashToken(token),
				emailVerifyExpiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS)
			}
		}
	);
	return token;
}

/** Marks a player account's email verified from a link token. */
export async function verifyPlayerEmailToken(
	token: string
): Promise<{ ok: boolean; error?: string }> {
	const c = await col();
	const player = await c.findOne({ emailVerifyTokenHash: hashToken(token) });
	if (
		!player ||
		!player.emailVerifyExpiresAt ||
		player.emailVerifyExpiresAt.getTime() < Date.now()
	) {
		return { ok: false, error: 'This verification link is invalid or has expired.' };
	}

	await c.updateOne(
		{ sessionId: player.sessionId },
		{
			$set: { emailVerified: true },
			$unset: { emailVerifyTokenHash: '', emailVerifyExpiresAt: '' }
		}
	);
	return { ok: true };
}

/** Upserts a game session entry on the player's joined-sessions list. */
export async function recordPlayerSession(
	playerSessionId: string,
	gameSessionId: string,
	sessionName: string
): Promise<void> {
	const c = await col();
	const player = await c.findOne({ sessionId: playerSessionId });
	if (!player) return;

	const existing = (player.joinedSessions ?? []).find((s) => s.sessionId === gameSessionId);
	if (existing) {
		await c.updateOne(
			{ sessionId: playerSessionId, 'joinedSessions.sessionId': gameSessionId },
			{
				$set: {
					'joinedSessions.$.sessionName': sessionName,
					'joinedSessions.$.lastSeen': new Date()
				}
			}
		);
	} else {
		await c.updateOne(
			{ sessionId: playerSessionId },
			{
				$push: {
					joinedSessions: { sessionId: gameSessionId, sessionName, lastSeen: new Date() }
				} as never
			}
		);
	}
}

/** Returns all sessions a player has previously joined, newest first. */
export async function getPlayerSessions(playerSessionId: string): Promise<PlayerSession[]> {
	const c = await col();
	const player = await c.findOne({ sessionId: playerSessionId });
	if (!player?.joinedSessions?.length) return [];
	return [...player.joinedSessions].sort(
		(a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
	);
}

/**
 * The invitee roster for a scheduling proposal: every player who has ever joined this game
 * session's display link while logged in (see recordPlayerSession(), called from /join). A
 * player who only ever opened /display/[id] anonymously — without a player account — won't
 * appear here, since there's nothing to record it against.
 */
export interface SessionPlayerSummary {
	playerSessionId: string;
	displayName: string;
	email: string | null;
}

export async function getPlayersForGameSession(
	gameSessionId: string
): Promise<SessionPlayerSummary[]> {
	const c = await col();
	const players = await c
		.find(
			{ 'joinedSessions.sessionId': gameSessionId },
			{ projection: { sessionId: 1, displayName: 1, email: 1, _id: 0 } }
		)
		.toArray();
	return players.map((p) => ({
		playerSessionId: p.sessionId,
		displayName: p.displayName,
		email: p.email
	}));
}

// ── Player notes ──────────────────────────────────────────────────────────────

/** Returns all notes for a player, newest first. */
export async function listPlayerNotes(playerSessionId: string): Promise<NoteEntry[]> {
	const c = await col();
	const player = await c.findOne({ sessionId: playerSessionId });
	const notes = (player?.notes ?? []) as NoteEntry[];
	return [...notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Creates a new note and returns it. */
export async function createPlayerNote(
	playerSessionId: string,
	content: string
): Promise<NoteEntry> {
	const c = await col();
	const note: NoteEntry = { id: randomUUID(), date: new Date().toISOString(), content };
	await c.updateOne({ sessionId: playerSessionId }, { $push: { notes: note } as never });
	return note;
}

/** Updates the content of an existing note. */
export async function updatePlayerNote(
	playerSessionId: string,
	noteId: string,
	content: string
): Promise<void> {
	const c = await col();
	const player = await c.findOne({ sessionId: playerSessionId });
	if (!player) return;
	const notes: NoteEntry[] = (player.notes ?? []).map((n: NoteEntry) =>
		n.id === noteId ? { ...n, content } : n
	);
	await c.updateOne({ sessionId: playerSessionId }, { $set: { notes } });
}

/** Deletes a note by id. */
export async function deletePlayerNote(playerSessionId: string, noteId: string): Promise<void> {
	const c = await col();
	const player = await c.findOne({ sessionId: playerSessionId });
	if (!player) return;
	const notes: NoteEntry[] = (player.notes ?? []).filter((n: NoteEntry) => n.id !== noteId);
	await c.updateOne({ sessionId: playerSessionId }, { $set: { notes } });
}

// ---------------------------------------------------------------------------
// Admin — system-wide player listing + moderation. Mirrors the equivalent section in
// dmModel.ts. Gated by isAdminDM() at the route level (see src/lib/server/admin.ts and
// src/routes/admin/+page.server.ts); these functions themselves are not access-controlled.
// ---------------------------------------------------------------------------
export interface PlayerSummary {
	displayName: string;
	email: string | null;
	/** Auth sessionId — pass to the suspend/delete/reset-password/email actions to target this account. */
	sessionId: string;
	createdAt: Date;
	/** Most recent lastSeen across every game session this player has joined, or null if never. */
	lastActiveAt: Date | null;
	suspended: boolean;
	/** False for OAuth-only accounts that have never had a password set. */
	hasPassword: boolean;
	oauthProviders: ('google' | 'discord')[];
	joinedSessionCount: number;
	noteCount: number;
	emailOptOut: boolean;
}

/** Returns every player account in the system, most recently active first. */
export async function listAllPlayers(): Promise<PlayerSummary[]> {
	const c = await col();
	const players = await c.find({}).toArray();

	return players
		.map((p) => {
			const joined = p.joinedSessions ?? [];
			const lastActiveAt = joined.length
				? joined.reduce(
						(latest, s) => (new Date(s.lastSeen) > latest ? new Date(s.lastSeen) : latest),
						new Date(joined[0].lastSeen)
					)
				: null;
			const oauthProviders: ('google' | 'discord')[] = [];
			if (p.oauth?.google) oauthProviders.push('google');
			if (p.oauth?.discord) oauthProviders.push('discord');
			return {
				displayName: p.displayName,
				email: p.email,
				sessionId: p.sessionId,
				createdAt: p.createdAt,
				lastActiveAt,
				suspended: !!p.suspendedAt,
				hasPassword: !!p.passwordHash,
				oauthProviders,
				joinedSessionCount: joined.length,
				noteCount: p.notes?.length ?? 0,
				emailOptOut: !!p.emailOptOut
			};
		})
		.sort((a, b) => {
			const at = a.lastActiveAt ?? a.createdAt;
			const bt = b.lastActiveAt ?? b.createdAt;
			return new Date(bt).getTime() - new Date(at).getTime();
		});
}

/** Suspends a player account — blocks login and any live /join or /display session (see
 *  hooks.server.ts). */
export async function suspendPlayer(
	playerSessionId: string
): Promise<{ ok: boolean; email?: string | null; error?: string }> {
	const c = await col();
	const player = await c.findOne({ sessionId: playerSessionId });
	if (!player) return { ok: false, error: 'Player account not found.' };
	await c.updateOne({ sessionId: playerSessionId }, { $set: { suspendedAt: new Date() } });
	return { ok: true, email: player.email };
}

/** Lifts a suspension, restoring normal access. */
export async function unsuspendPlayer(
	playerSessionId: string
): Promise<{ ok: boolean; email?: string | null; error?: string }> {
	const c = await col();
	const player = await c.findOne({ sessionId: playerSessionId });
	if (!player) return { ok: false, error: 'Player account not found.' };
	await c.updateOne({ sessionId: playerSessionId }, { $unset: { suspendedAt: '' } });
	return { ok: true, email: player.email };
}

/**
 * Generates a new random password for a locked-out player and returns it in plaintext — shown
 * once in the admin UI for the admin to relay out-of-band. Works for OAuth-only accounts too,
 * giving them a password-login fallback.
 */
export async function adminResetPlayerPassword(
	playerSessionId: string
): Promise<{ ok: boolean; email?: string | null; tempPassword?: string; error?: string }> {
	const c = await col();
	const player = await c.findOne({ sessionId: playerSessionId });
	if (!player) return { ok: false, error: 'Player account not found.' };

	const tempPassword = randomTempPassword();
	const passwordHash = await bcrypt.hash(tempPassword, 12);
	await c.updateOne({ sessionId: playerSessionId }, { $set: { passwordHash } });

	return { ok: true, email: player.email, tempPassword };
}

/** Permanently deletes a player account (joined-session history, notes, everything embedded). */
export async function deletePlayerAccount(
	playerSessionId: string
): Promise<{ ok: boolean; email?: string | null; error?: string }> {
	const c = await col();
	const player = await c.findOne({ sessionId: playerSessionId });
	if (!player) return { ok: false, error: 'Player account not found.' };
	await c.deleteOne({ sessionId: playerSessionId });
	return { ok: true, email: player.email };
}

// ---------------------------------------------------------------------------
// Admin broadcast email — "Email Players" on /admin's Players tab (see mail.ts
// adminBroadcastEmail()). Mirrors the equivalent DM section in dmModel.ts.
// ---------------------------------------------------------------------------

/** Returns this player's unsubscribe token, generating and persisting one on first use. */
export async function getOrCreatePlayerUnsubscribeToken(
	playerSessionId: string
): Promise<string | null> {
	const c = await col();
	const player = await c.findOne({ sessionId: playerSessionId });
	if (!player) return null;
	if (player.unsubscribeToken) return player.unsubscribeToken;

	const token = generateToken();
	await c.updateOne({ sessionId: playerSessionId }, { $set: { unsubscribeToken: token } });
	return token;
}

/** Read-only lookup for the unsubscribe confirmation page — does not unsubscribe anyone. */
export async function getEmailByPlayerUnsubscribeToken(token: string): Promise<string | null> {
	const c = await col();
	const player = await c.findOne({ unsubscribeToken: token });
	return player?.email ?? null;
}

/** Opts a player out of future admin broadcast emails. Called only from the unsubscribe page's
 *  POST action. */
export async function unsubscribePlayerByToken(
	token: string
): Promise<{ ok: boolean; email?: string | null }> {
	const c = await col();
	const player = await c.findOne({ unsubscribeToken: token });
	if (!player) return { ok: false };
	await c.updateOne({ sessionId: player.sessionId }, { $set: { emailOptOut: true } });
	return { ok: true, email: player.email };
}

/** Directly sets a player's subscription state from the admin panel's checkbox. */
export async function setPlayerEmailOptOut(
	playerSessionId: string,
	optOut: boolean
): Promise<{ ok: boolean; email?: string | null; error?: string }> {
	const c = await col();
	const player = await c.findOne({ sessionId: playerSessionId });
	if (!player) return { ok: false, error: 'Player account not found.' };
	await c.updateOne({ sessionId: playerSessionId }, { $set: { emailOptOut: optOut } });
	return { ok: true, email: player.email };
}

/** Players eligible to receive an admin broadcast email — has an email and hasn't opted out. */
export async function getPlayerEmailBlastRecipients(): Promise<
	{ sessionId: string; email: string; displayName: string }[]
> {
	const c = await col();
	const players = await c
		.find(
			{ email: { $ne: null }, emailOptOut: { $ne: true } },
			{ projection: { sessionId: 1, email: 1, displayName: 1, _id: 0 } }
		)
		.toArray();
	return players
		.filter((p): p is typeof p & { email: string } => !!p.email)
		.map((p) => ({ sessionId: p.sessionId, email: p.email, displayName: p.displayName }));
}
