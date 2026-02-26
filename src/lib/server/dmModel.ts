import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { WithId, Document } from 'mongodb';
import { getDb } from './db';
import type { StorageState, CustomMonster, CombatRecord, GameSession } from '$lib/types';

// ---------------------------------------------------------------------------
// Internal full game-session shape (includes server-only fields)
// ---------------------------------------------------------------------------
interface DMGameSession extends GameSession {
	combatState: StorageState;
	combatHistory: CombatRecord[];
	createdAt: Date;
}

export interface DM {
	firstName: string;
	lastName: string;
	email: string;
	passwordHash: string;
	/** Stable auth identifier — value stored in dm_auth cookie. */
	sessionId: string;
	/** UUID of the currently active game session. */
	activeGameSessionId: string;
	gameSessions: DMGameSession[];
	customMonsters: CustomMonster[];
	/** Legacy top-level fields — may exist in documents created before migration. */
	combatState?: StorageState;
	combatHistory?: CombatRecord[];
	createdAt: Date;
}

// 6 chars from an unambiguous alphabet (no O/0/I/1 confusion)
const SESSION_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSessionId(): string {
	return Array.from(
		{ length: 6 },
		() => SESSION_CHARS[Math.floor(Math.random() * SESSION_CHARS.length)]
	).join('');
}

async function col() {
	const db = await getDb();
	return db.collection<DM>('dms');
}

// ---------------------------------------------------------------------------
// Migration helper — auto-creates gameSessions for legacy DM documents.
// Called from hooks.server.ts on every authenticated page load so migration
// happens transparently the first time a DM opens the app after the update.
// ---------------------------------------------------------------------------
export async function ensureGameSessions(authSessionId: string): Promise<void> {
	const c = await col();
	const dm = await c.findOne({ sessionId: authSessionId });
	if (!dm) return;
	if (dm.gameSessions && dm.gameSessions.length > 0) return; // already migrated

	const firstSession: DMGameSession = {
		id: randomUUID(),
		// Preserve the existing auth sessionId as the public ID so viewer bookmarks still work.
		sessionId: authSessionId,
		name: 'Default Session',
		combatState: (dm.combatState as StorageState) ?? {
			combatants: [],
			currentTurnId: null,
			round: 1
		},
		combatHistory: (dm.combatHistory as CombatRecord[]) ?? [],
		createdAt: dm.createdAt ?? new Date()
	};

	await c.updateOne(
		{ sessionId: authSessionId },
		{ $set: { gameSessions: [firstSession], activeGameSessionId: firstSession.id } }
	);
}

// ---------------------------------------------------------------------------
// Auth / account functions (use DM auth sessionId)
// ---------------------------------------------------------------------------
export type CreateDMResult = { sessionId: string } | { error: string };

export async function createDM(
	firstName: string,
	lastName: string,
	email: string,
	password: string
): Promise<CreateDMResult> {
	const c = await col();

	if (await c.findOne({ email })) {
		return { error: 'An account with that email already exists.' };
	}

	// Generate a unique auth sessionId that isn't already in use as any kind of session ID
	let sessionId: string;
	do {
		sessionId = randomSessionId();
	} while (
		(await c.findOne({ sessionId })) ||
		(await c.findOne({ 'gameSessions.sessionId': sessionId }))
	);

	const passwordHash = await bcrypt.hash(password, 12);
	const firstSession: DMGameSession = {
		id: randomUUID(),
		sessionId, // first game session shares the auth sessionId
		name: 'Default Session',
		combatState: { combatants: [], currentTurnId: null, round: 1 },
		combatHistory: [],
		createdAt: new Date()
	};

	await c.insertOne({
		firstName,
		lastName,
		email,
		passwordHash,
		sessionId,
		activeGameSessionId: firstSession.id,
		gameSessions: [firstSession],
		customMonsters: [],
		createdAt: new Date()
	});

	return { sessionId };
}

export async function loginDM(
	email: string,
	password: string
): Promise<(WithId<Document> & DM) | null> {
	const c = await col();
	const dm = await c.findOne({ email });
	if (!dm) return null;
	const valid = await bcrypt.compare(password, dm.passwordHash);
	return valid ? (dm as unknown as WithId<Document> & DM) : null;
}

/** Look up a DM by their auth sessionId (cookie value). */
export async function getDMBySessionId(
	sessionId: string
): Promise<(WithId<Document> & DM) | null> {
	const c = await col();
	return (await c.findOne({ sessionId })) as unknown as (WithId<Document> & DM) | null;
}

/** Look up a DM by a game session's public 6-char ID (used by viewer SSE & join). */
export async function getDMByGameSessionId(
	gameSessionId: string
): Promise<(WithId<Document> & DM) | null> {
	const c = await col();
	return (await c.findOne({
		'gameSessions.sessionId': gameSessionId
	})) as unknown as (WithId<Document> & DM) | null;
}

/**
 * Returns the active game session's public 6-char sessionId for a DM.
 * Also triggers migration for legacy DM documents.
 */
export async function getActiveGameSessionPublicId(authSessionId: string): Promise<string | null> {
	await ensureGameSessions(authSessionId);
	const c = await col();
	const dm = await c.findOne({ sessionId: authSessionId });
	if (!dm?.gameSessions?.length) return null;
	const active = (dm.gameSessions as DMGameSession[]).find(
		(s) => s.id === dm.activeGameSessionId
	);
	return active?.sessionId ?? (dm.gameSessions[0] as DMGameSession).sessionId;
}

// ---------------------------------------------------------------------------
// Combat state — keyed by game session public ID
// ---------------------------------------------------------------------------
export async function saveCombatState(gameSessionId: string, state: StorageState): Promise<void> {
	const c = await col();
	await c.updateOne(
		{ 'gameSessions.sessionId': gameSessionId },
		{ $set: { 'gameSessions.$.combatState': state } }
	);
}

export async function getCombatState(gameSessionId: string): Promise<StorageState> {
	const c = await col();
	const dm = await c.findOne({ 'gameSessions.sessionId': gameSessionId });
	const session = (dm?.gameSessions as DMGameSession[])?.find(
		(s) => s.sessionId === gameSessionId
	);
	return session?.combatState ?? { combatants: [], currentTurnId: null, round: 1 };
}

// ---------------------------------------------------------------------------
// Custom monsters — per DM account (use auth sessionId)
// ---------------------------------------------------------------------------
export async function getCustomMonsters(sessionId: string): Promise<CustomMonster[]> {
	const c = await col();
	const dm = await c.findOne({ sessionId });
	return (dm?.customMonsters as CustomMonster[]) ?? [];
}

export async function addCustomMonster(
	sessionId: string,
	monster: CustomMonster
): Promise<void> {
	const c = await col();
	await c.updateOne({ sessionId }, { $push: { customMonsters: monster } as never });
}

export async function updateCustomMonster(
	sessionId: string,
	id: string,
	updates: Omit<CustomMonster, 'id'>
): Promise<void> {
	const c = await col();
	await c.updateOne(
		{ sessionId, 'customMonsters.id': id },
		{
			$set: {
				'customMonsters.$.name': updates.name,
				'customMonsters.$.ac': updates.ac,
				'customMonsters.$.hp': updates.hp,
				'customMonsters.$.cr': updates.cr,
				'customMonsters.$.monsterType': updates.monsterType,
				'customMonsters.$.imgUrl': updates.imgUrl ?? null
			}
		}
	);
}

export async function deleteCustomMonster(sessionId: string, id: string): Promise<void> {
	const c = await col();
	await c.updateOne({ sessionId }, { $pull: { customMonsters: { id } } as never });
}

// ---------------------------------------------------------------------------
// Combat history — keyed by game session public ID (uses MongoDB arrayFilters)
// ---------------------------------------------------------------------------
export async function saveCombatRecord(gameSessionId: string, record: CombatRecord): Promise<void> {
	const c = await col();
	await c.updateOne(
		{ 'gameSessions.sessionId': gameSessionId },
		{
			$push: {
				'gameSessions.$[s].combatHistory': { $each: [record], $slice: -100 }
			} as never
		},
		{ arrayFilters: [{ 's.sessionId': gameSessionId }] }
	);
}

export async function getCombatHistory(gameSessionId: string): Promise<CombatRecord[]> {
	const c = await col();
	const dm = await c.findOne({ 'gameSessions.sessionId': gameSessionId });
	const session = (dm?.gameSessions as DMGameSession[])?.find(
		(s) => s.sessionId === gameSessionId
	);
	return (session?.combatHistory as CombatRecord[]) ?? [];
}

export async function deleteCombatRecord(gameSessionId: string, recordId: string): Promise<void> {
	const c = await col();
	await c.updateOne(
		{ 'gameSessions.sessionId': gameSessionId },
		{ $pull: { 'gameSessions.$[s].combatHistory': { id: recordId } } } as never,
		{ arrayFilters: [{ 's.sessionId': gameSessionId }] }
	);
}

export async function clearCombatHistory(gameSessionId: string): Promise<void> {
	const c = await col();
	await c.updateOne(
		{ 'gameSessions.sessionId': gameSessionId },
		{ $set: { 'gameSessions.$[s].combatHistory': [] } },
		{ arrayFilters: [{ 's.sessionId': gameSessionId }] }
	);
}

// ---------------------------------------------------------------------------
// Game session management — use auth sessionId to identify the DM
// ---------------------------------------------------------------------------

/** Returns all game sessions for a DM (public fields only). */
export async function listGameSessions(authSessionId: string): Promise<GameSession[]> {
	await ensureGameSessions(authSessionId);
	const c = await col();
	const dm = await c.findOne({ sessionId: authSessionId });
	if (!dm?.gameSessions) return [];
	return (dm.gameSessions as DMGameSession[]).map(({ id, sessionId, name }) => ({
		id,
		sessionId,
		name
	}));
}

/**
 * Creates a new game session for the DM.
 * Returns the new session's internal UUID and public 6-char sessionId.
 */
export async function createGameSession(
	authSessionId: string,
	name: string
): Promise<{ id: string; sessionId: string } | null> {
	const c = await col();

	// Generate a public session ID that isn't used anywhere
	let gameSessionId: string;
	do {
		gameSessionId = randomSessionId();
	} while (
		(await c.findOne({ sessionId: gameSessionId })) ||
		(await c.findOne({ 'gameSessions.sessionId': gameSessionId }))
	);

	const newSession: DMGameSession = {
		id: randomUUID(),
		sessionId: gameSessionId,
		name: name.trim() || 'New Session',
		combatState: { combatants: [], currentTurnId: null, round: 1 },
		combatHistory: [],
		createdAt: new Date()
	};

	const result = await c.updateOne(
		{ sessionId: authSessionId },
		{ $push: { gameSessions: newSession } as never }
	);
	if (!result.matchedCount) return null;

	return { id: newSession.id, sessionId: newSession.sessionId };
}

/** Renames an existing game session. */
export async function renameGameSession(
	authSessionId: string,
	sessionUUID: string,
	name: string
): Promise<boolean> {
	const c = await col();
	const result = await c.updateOne(
		{ sessionId: authSessionId, 'gameSessions.id': sessionUUID },
		{ $set: { 'gameSessions.$.name': name.trim() || 'Unnamed Session' } }
	);
	return result.matchedCount > 0;
}

/** Deletes a game session. Refuses to delete the last remaining session. */
export async function deleteGameSession(
	authSessionId: string,
	sessionUUID: string
): Promise<{ ok: boolean; error?: string }> {
	const c = await col();
	const dm = await c.findOne({ sessionId: authSessionId });
	if (!dm) return { ok: false, error: 'DM not found' };

	const sessions = (dm.gameSessions as DMGameSession[]) ?? [];
	if (sessions.length <= 1) {
		return { ok: false, error: 'Cannot delete the last session' };
	}

	const sessionToDelete = sessions.find((s) => s.id === sessionUUID);
	if (!sessionToDelete) return { ok: false, error: 'Session not found' };

	// If deleting the active session, switch to the first remaining session
	if (dm.activeGameSessionId === sessionUUID) {
		const other = sessions.find((s) => s.id !== sessionUUID);
		if (other) {
			await c.updateOne(
				{ sessionId: authSessionId },
				{ $set: { activeGameSessionId: other.id } }
			);
		}
	}

	await c.updateOne(
		{ sessionId: authSessionId },
		{ $pull: { gameSessions: { id: sessionUUID } } } as never
	);
	return { ok: true };
}

/**
 * Switches the active game session.
 * Returns the new session's public 6-char sessionId, or null if not found.
 */
export async function switchActiveGameSession(
	authSessionId: string,
	sessionUUID: string
): Promise<string | null> {
	const c = await col();
	const dm = await c.findOne({ sessionId: authSessionId });
	if (!dm) return null;

	const session = (dm.gameSessions as DMGameSession[])?.find((s) => s.id === sessionUUID);
	if (!session) return null;

	await c.updateOne({ sessionId: authSessionId }, { $set: { activeGameSessionId: sessionUUID } });

	return session.sessionId;
}
