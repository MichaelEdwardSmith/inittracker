// Player account model — separate from DM accounts.
// Lighter weight: display name, email, optional Google OAuth, optional avatar.
// Stored in the 'players' MongoDB collection.
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { getDb } from './db';
import type { NoteEntry } from '$lib/types';

const SESSION_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSessionId(): string {
	return Array.from(
		{ length: 6 },
		() => SESSION_CHARS[Math.floor(Math.random() * SESSION_CHARS.length)]
	).join('');
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
	oauth?: { google?: string };
	joinedSessions?: PlayerSession[];
	notes?: NoteEntry[];
	createdAt: Date;
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
	providerId: string;
	email: string | null;
	displayName: string;
	avatarUrl?: string;
}): Promise<{ sessionId: string }> {
	const c = await col();

	// Existing Google account
	let player = await c.findOne({ 'oauth.google': profile.providerId });
	if (player) {
		// Keep avatar fresh from Google
		if (profile.avatarUrl && profile.avatarUrl !== player.avatarUrl) {
			await c.updateOne(
				{ sessionId: player.sessionId },
				{ $set: { avatarUrl: profile.avatarUrl } }
			);
		}
		return { sessionId: player.sessionId };
	}

	// Link to existing email account
	if (profile.email) {
		player = await c.findOne({ email: profile.email.toLowerCase() });
		if (player) {
			await c.updateOne(
				{ email: profile.email.toLowerCase() },
				{ $set: { 'oauth.google': profile.providerId, avatarUrl: profile.avatarUrl } }
			);
			return { sessionId: player.sessionId };
		}
	}

	// Create new player account
	const sessionId = randomSessionId();
	await c.insertOne({
		displayName: profile.displayName,
		email: profile.email ? profile.email.toLowerCase() : null,
		passwordHash: '',
		sessionId,
		avatarUrl: profile.avatarUrl,
		oauth: { google: profile.providerId },
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
): Promise<{ sessionId: string } | null> {
	const c = await col();
	const player = await c.findOne({ email: email.toLowerCase() });
	if (!player || !player.passwordHash) return null;

	const valid = await bcrypt.compare(password, player.passwordHash);
	if (!valid) return null;

	return { sessionId: player.sessionId };
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
