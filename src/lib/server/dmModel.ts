// All DM data-access functions. Covers account creation/login, combat state persistence,
// custom monster CRUD, combat history, and game session management (create/rename/delete/switch).
// Also contains ensureGameSessions() which migrates legacy single-session documents to the
// multi-session schema on first access.
import bcrypt from 'bcryptjs';
import { randomUUID, randomBytes, createHash } from 'crypto';
import type { WithId, Document } from 'mongodb';
import { getDb } from './db';
import type {
	StorageState,
	CustomMonster,
	CombatRecord,
	GameSession,
	NoteEntry,
	Encounter
} from '$lib/types';

// ---------------------------------------------------------------------------
// Internal full game-session shape (includes server-only fields)
// ---------------------------------------------------------------------------
interface DMGameSession extends Omit<GameSession, 'ruleset'> {
	combatState: StorageState;
	combatHistory: CombatRecord[];
	notes?: NoteEntry[];
	createdAt: Date;
	ruleset?: '2014' | '2024';
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
	encounters?: Encounter[];
	/** Legacy top-level fields — may exist in documents created before migration. */
	combatState?: StorageState;
	combatHistory?: CombatRecord[];
	createdAt: Date;
	/** Set on every successful password/OAuth login. Absent for accounts that haven't logged in since this field was added. */
	lastLoginAt?: Date;
	/** Bumped (throttled) on every authenticated page hit — see touchDMActivity(). This is what
	 *  the admin panel's "Last active" column actually reflects, since most sessions are a
	 *  standing 30-day cookie that never triggers another loginDM() call. */
	lastActiveAt?: Date;
	/** Set when an admin suspends this account; absent means active. Checked in hooks.server.ts
	 *  to block dashboard/history access, and at login to reject the attempt outright. */
	suspendedAt?: Date;
}

// 6 chars from an unambiguous alphabet (no O/0/I/1 confusion)
const SESSION_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSessionId(): string {
	return Array.from(
		{ length: 6 },
		() => SESSION_CHARS[Math.floor(Math.random() * SESSION_CHARS.length)]
	).join('');
}

// Readable charset for admin-generated temporary passwords — avoids visually ambiguous
// characters (0/O, 1/l/I) since these get read aloud or typed from a screen.
const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';

function randomTempPassword(length = 14): string {
	const bytes = randomBytes(length);
	return Array.from(bytes, (b) => TEMP_PASSWORD_CHARS[b % TEMP_PASSWORD_CHARS.length]).join('');
}

// The login/register forms SHA-256 the password client-side before it ever reaches the server
// (see /login and /register +page.svelte), so passwordHash is always bcrypt(sha256(raw)). A
// server-generated temp password has to go through the same sha256 step to verify later.
function sha256Hex(text: string): string {
	return createHash('sha256').update(text).digest('hex');
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
		ruleset: '2014',
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
	} while (await c.findOne({ $or: [{ sessionId }, { 'gameSessions.sessionId': sessionId }] }));

	const passwordHash = await bcrypt.hash(password, 12);
	const firstSession: DMGameSession = {
		id: randomUUID(),
		sessionId, // first game session shares the auth sessionId
		name: 'Default Session',
		// ruleset intentionally omitted — user will choose on first login
		combatState: { combatants: [], currentTurnId: null, round: 1 },
		combatHistory: [],
		createdAt: new Date()
	};

	const now = new Date();
	await c.insertOne({
		firstName,
		lastName,
		email,
		passwordHash,
		sessionId,
		activeGameSessionId: firstSession.id,
		gameSessions: [firstSession],
		customMonsters: [],
		createdAt: now,
		lastLoginAt: now
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
	if (!valid) return null;
	const lastLoginAt = new Date();
	await c.updateOne({ email }, { $set: { lastLoginAt } });
	return { ...dm, lastLoginAt } as unknown as WithId<Document> & DM;
}

// ---------------------------------------------------------------------------
// OAuth — find-or-create a DM account via a third-party provider.
// ---------------------------------------------------------------------------
export interface OAuthProfile {
	provider: 'google' | 'facebook' | 'discord';
	providerId: string; // stable user ID from the provider
	email: string | null;
	firstName: string;
	lastName: string;
}

export async function findOrCreateDMByOAuth(profile: OAuthProfile): Promise<{ sessionId: string }> {
	const c = await col();

	// 1. Exact match on provider ID
	const providerField = `oauth.${profile.provider}`;
	let dm = await c.findOne({ [providerField]: profile.providerId });
	if (dm) {
		await c.updateOne(
			{ [providerField]: profile.providerId },
			{ $set: { lastLoginAt: new Date() } }
		);
		return { sessionId: dm.sessionId };
	}

	// 2. Email match — link the OAuth identity to an existing account
	if (profile.email) {
		dm = await c.findOne({ email: profile.email });
		if (dm) {
			await c.updateOne(
				{ email: profile.email },
				{ $set: { [providerField]: profile.providerId, lastLoginAt: new Date() } }
			);
			return { sessionId: dm.sessionId };
		}
	}

	// 3. Create a brand-new DM account
	let sessionId: string;
	do {
		sessionId = randomSessionId();
	} while (await c.findOne({ $or: [{ sessionId }, { 'gameSessions.sessionId': sessionId }] }));

	const firstSession: DMGameSession = {
		id: randomUUID(),
		sessionId,
		name: 'Default Session',
		// ruleset intentionally omitted — user will choose on first login
		combatState: { combatants: [], currentTurnId: null, round: 1 },
		combatHistory: [],
		createdAt: new Date()
	};

	const now = new Date();
	await c.insertOne({
		firstName: profile.firstName,
		lastName: profile.lastName,
		email: profile.email ?? '',
		passwordHash: '', // OAuth accounts cannot use password login
		sessionId,
		activeGameSessionId: firstSession.id,
		gameSessions: [firstSession],
		customMonsters: [],
		createdAt: now,
		lastLoginAt: now,
		[providerField]: profile.providerId
	} as unknown as DM);

	return { sessionId };
}

const ACTIVITY_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fire-and-forget: bumps lastActiveAt for a DM, throttled so a burst of requests from the same
 * session doesn't turn into a write per request. Pass the DM's already-known lastActiveAt (from
 * a document the caller already fetched) to skip an extra read.
 */
export function touchDMActivity(authSessionId: string, knownLastActiveAt?: Date | null): void {
	if (
		knownLastActiveAt &&
		Date.now() - new Date(knownLastActiveAt).getTime() < ACTIVITY_THROTTLE_MS
	) {
		return;
	}
	col()
		.then((c) => c.updateOne({ sessionId: authSessionId }, { $set: { lastActiveAt: new Date() } }))
		.catch((err) => console.error('Failed to update DM lastActiveAt', err));
}

/** Look up a DM by their auth sessionId (cookie value). */
export async function getDMBySessionId(sessionId: string): Promise<(WithId<Document> & DM) | null> {
	const c = await col();
	return (await c.findOne({ sessionId })) as unknown as (WithId<Document> & DM) | null;
}

/** Returns the name of a game session by its public 6-char ID, or null if not found. */
export async function getGameSessionName(gameSessionId: string): Promise<string | null> {
	const c = await col();
	const dm = await c.findOne({ 'gameSessions.sessionId': gameSessionId });
	if (!dm) return null;
	const session = (dm.gameSessions as DMGameSession[]).find((s) => s.sessionId === gameSessionId);
	return session?.name ?? null;
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
	const active = (dm.gameSessions as DMGameSession[]).find((s) => s.id === dm.activeGameSessionId);
	return active?.sessionId ?? (dm.gameSessions[0] as DMGameSession).sessionId;
}

/**
 * Returns both the active game session's public ID and its ruleset.
 * Also triggers migration for legacy DM documents.
 */
export async function getActiveGameSession(
	authSessionId: string
): Promise<{ publicId: string; ruleset: '2014' | '2024' } | null> {
	await ensureGameSessions(authSessionId);
	const c = await col();
	const dm = await c.findOne({ sessionId: authSessionId });
	if (!dm?.gameSessions?.length) return null;
	const sessions = dm.gameSessions as DMGameSession[];
	const active = sessions.find((s) => s.id === dm.activeGameSessionId) ?? sessions[0];
	if (!active) return null;
	return { publicId: active.sessionId, ruleset: active.ruleset ?? '2014' };
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
	const session = (dm?.gameSessions as DMGameSession[])?.find((s) => s.sessionId === gameSessionId);
	return session?.combatState ?? { combatants: [], currentTurnId: null, round: 1 };
}

// ---------------------------------------------------------------------------
// Session notes — multiple dated entries per game session
// ---------------------------------------------------------------------------

/** Returns all note entries for a game session, newest first.
 *  Migrates legacy string notes (if any) to the array format on first access. */
export async function listNotes(gameSessionId: string): Promise<NoteEntry[]> {
	const c = await col();
	const dm = await c.findOne({ 'gameSessions.sessionId': gameSessionId });
	const session = (dm?.gameSessions as DMGameSession[])?.find((s) => s.sessionId === gameSessionId);
	if (!session) return [];

	const raw = session.notes as unknown;

	// Migration: legacy single string → single NoteEntry
	if (typeof raw === 'string' && raw.length > 0) {
		const migrated: NoteEntry[] = [
			{ id: randomUUID(), date: new Date().toISOString(), content: raw }
		];
		await c.updateOne(
			{ 'gameSessions.sessionId': gameSessionId },
			{ $set: { 'gameSessions.$.notes': migrated } }
		);
		return migrated;
	}

	if (!Array.isArray(raw)) return [];
	return (raw as NoteEntry[]).sort((a, b) => b.date.localeCompare(a.date));
}

/** Creates a new note entry and returns it. */
export async function createNote(gameSessionId: string, content: string): Promise<NoteEntry> {
	const entry: NoteEntry = { id: randomUUID(), date: new Date().toISOString(), content };
	const c = await col();
	await c.updateOne(
		{ 'gameSessions.sessionId': gameSessionId },
		{ $push: { 'gameSessions.$.notes': entry } as Record<string, unknown> }
	);
	return entry;
}

/** Updates the content of an existing note entry. */
export async function updateNote(
	gameSessionId: string,
	noteId: string,
	content: string
): Promise<void> {
	const c = await col();
	await c.updateOne(
		{ 'gameSessions.sessionId': gameSessionId },
		{ $set: { 'gameSessions.$[s].notes.$[n].content': content } } as Record<string, unknown>,
		{ arrayFilters: [{ 's.sessionId': gameSessionId }, { 'n.id': noteId }] }
	);
}

/** Deletes a note entry by id. */
export async function deleteNote(gameSessionId: string, noteId: string): Promise<void> {
	const c = await col();
	await c.updateOne(
		{ 'gameSessions.sessionId': gameSessionId },
		{ $pull: { 'gameSessions.$[s].notes': { id: noteId } } } as Record<string, unknown>,
		{ arrayFilters: [{ 's.sessionId': gameSessionId }] }
	);
}

// ---------------------------------------------------------------------------
// Custom monsters — per DM account (use auth sessionId)
// ---------------------------------------------------------------------------
export async function getCustomMonsters(sessionId: string): Promise<CustomMonster[]> {
	const c = await col();
	const dm = await c.findOne({ sessionId });
	return (dm?.customMonsters as CustomMonster[]) ?? [];
}

export async function addCustomMonster(sessionId: string, monster: CustomMonster): Promise<void> {
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
	const session = (dm?.gameSessions as DMGameSession[])?.find((s) => s.sessionId === gameSessionId);
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
	return (dm.gameSessions as DMGameSession[]).map(({ id, sessionId, name, ruleset }) => ({
		id,
		sessionId,
		name,
		ruleset: ruleset ?? '2014'
	}));
}

/**
 * Creates a new game session for the DM.
 * Returns the new session's internal UUID and public 6-char sessionId.
 */
export async function createGameSession(
	authSessionId: string,
	name: string,
	ruleset: '2014' | '2024' = '2014'
): Promise<{ id: string; sessionId: string; ruleset: '2014' | '2024' } | null> {
	const c = await col();

	// Generate a public session ID that isn't used anywhere
	let gameSessionId: string;
	do {
		gameSessionId = randomSessionId();
	} while (
		await c.findOne({
			$or: [{ sessionId: gameSessionId }, { 'gameSessions.sessionId': gameSessionId }]
		})
	);

	const newSession: DMGameSession = {
		id: randomUUID(),
		sessionId: gameSessionId,
		name: name.trim() || 'New Session',
		ruleset,
		combatState: { combatants: [], currentTurnId: null, round: 1 },
		combatHistory: [],
		createdAt: new Date()
	};

	const result = await c.updateOne(
		{ sessionId: authSessionId },
		{ $push: { gameSessions: newSession } as never }
	);
	if (!result.matchedCount) return null;

	return { id: newSession.id, sessionId: newSession.sessionId, ruleset: newSession.ruleset! };
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
): Promise<{ ok: boolean; deletedPublicId?: string; error?: string }> {
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
			await c.updateOne({ sessionId: authSessionId }, { $set: { activeGameSessionId: other.id } });
		}
	}

	await c.updateOne({ sessionId: authSessionId }, {
		$pull: { gameSessions: { id: sessionUUID } }
	} as never);
	return { ok: true, deletedPublicId: (sessionToDelete as DMGameSession).sessionId };
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

// ---------------------------------------------------------------------------
// Encounters — per DM account (shared across sessions, like custom monsters)
// ---------------------------------------------------------------------------

export async function getEncounters(authSessionId: string): Promise<Encounter[]> {
	const c = await col();
	const dm = await c.findOne({ sessionId: authSessionId });
	return (dm?.encounters as Encounter[]) ?? [];
}

export async function saveEncounter(authSessionId: string, encounter: Encounter): Promise<void> {
	const c = await col();
	await c.updateOne({ sessionId: authSessionId }, { $push: { encounters: encounter } } as never);
}

export async function deleteEncounter(authSessionId: string, encounterId: string): Promise<void> {
	const c = await col();
	await c.updateOne({ sessionId: authSessionId }, {
		$pull: { encounters: { id: encounterId } }
	} as never);
}

// ---------------------------------------------------------------------------
// Edition setup — first-run detection and ruleset confirmation
// ---------------------------------------------------------------------------

/**
 * Returns true if the active game session has no explicit ruleset set —
 * meaning this is a brand-new account that hasn't chosen an edition yet.
 */
export async function activeSessionNeedsRulesetSetup(authSessionId: string): Promise<boolean> {
	await ensureGameSessions(authSessionId);
	const c = await col();
	const dm = await c.findOne({ sessionId: authSessionId });
	if (!dm?.gameSessions?.length) return false;
	const active =
		(dm.gameSessions as DMGameSession[]).find((s) => s.id === dm.activeGameSessionId) ??
		(dm.gameSessions as DMGameSession[])[0];
	return !active?.ruleset;
}

/**
 * Sets the ruleset on a specific game session (identified by its internal UUID).
 * Used to confirm the edition on first login.
 */
export async function setSessionRuleset(
	authSessionId: string,
	sessionUUID: string,
	ruleset: '2014' | '2024'
): Promise<boolean> {
	const c = await col();
	const result = await c.updateOne(
		{ sessionId: authSessionId, 'gameSessions.id': sessionUUID },
		{ $set: { 'gameSessions.$.ruleset': ruleset } }
	);
	return result.matchedCount > 0;
}

// ---------------------------------------------------------------------------
// Admin — system-wide DM listing + impersonation audit log.
// Gated by isAdminEmail() at the route level (see src/lib/server/admin.ts); these
// functions themselves are not access-controlled.
// ---------------------------------------------------------------------------
export interface DMSummary {
	firstName: string;
	lastName: string;
	email: string;
	/** Auth sessionId — pass to the impersonate/suspend/delete/export actions to target this account. */
	sessionId: string;
	createdAt: Date;
	/** lastActiveAt (real usage) if we have it, else lastLoginAt (explicit sign-in), else never. */
	lastActiveAt: Date | null;
	suspended: boolean;
	/** False for OAuth-only accounts that have never had a password set. */
	hasPassword: boolean;
	/** Public 6-char ID of the DM's currently active game session — for the read-only Inspect link. */
	activeSessionPublicId: string | null;
	gameSessionCount: number;
	customMonsterCount: number;
	encounterCount: number;
	/** Total combat records across all of this DM's game sessions (each capped at 100). */
	combatHistoryCount: number;
}

/** Returns every DM account in the system, most recently active first. */
export async function listAllDMs(): Promise<DMSummary[]> {
	const c = await col();
	const dms = await c
		.find(
			{},
			{
				projection: {
					firstName: 1,
					lastName: 1,
					email: 1,
					sessionId: 1,
					createdAt: 1,
					lastLoginAt: 1,
					lastActiveAt: 1,
					suspendedAt: 1,
					passwordHash: 1,
					activeGameSessionId: 1,
					gameSessions: 1,
					customMonsters: 1,
					encounters: 1
				}
			}
		)
		.toArray();

	return dms
		.map((dm) => {
			const sessions = (dm.gameSessions as DMGameSession[] | undefined) ?? [];
			const active = sessions.find((s) => s.id === dm.activeGameSessionId);
			return {
				firstName: dm.firstName,
				lastName: dm.lastName,
				email: dm.email,
				sessionId: dm.sessionId,
				createdAt: dm.createdAt,
				lastActiveAt: (dm as DM).lastActiveAt ?? (dm as DM).lastLoginAt ?? null,
				suspended: !!(dm as DM).suspendedAt,
				hasPassword: !!dm.passwordHash,
				activeSessionPublicId: active?.sessionId ?? sessions[0]?.sessionId ?? null,
				gameSessionCount: sessions.length,
				customMonsterCount: (dm.customMonsters as CustomMonster[] | undefined)?.length ?? 0,
				encounterCount: (dm.encounters as Encounter[] | undefined)?.length ?? 0,
				combatHistoryCount: sessions.reduce((sum, s) => sum + (s.combatHistory?.length ?? 0), 0)
			};
		})
		.sort((a, b) => {
			const at = a.lastActiveAt ?? a.createdAt;
			const bt = b.lastActiveAt ?? b.createdAt;
			return new Date(bt).getTime() - new Date(at).getTime();
		});
}

/** Suspends a DM account — blocks login and kicks them out of /dashboard and /history. */
export async function suspendDM(
	authSessionId: string
): Promise<{ ok: boolean; email?: string; error?: string }> {
	const c = await col();
	const dm = await c.findOne({ sessionId: authSessionId });
	if (!dm) return { ok: false, error: 'DM account not found.' };
	await c.updateOne({ sessionId: authSessionId }, { $set: { suspendedAt: new Date() } });
	return { ok: true, email: dm.email };
}

/** Lifts a suspension, restoring normal access. */
export async function unsuspendDM(
	authSessionId: string
): Promise<{ ok: boolean; email?: string; error?: string }> {
	const c = await col();
	const dm = await c.findOne({ sessionId: authSessionId });
	if (!dm) return { ok: false, error: 'DM account not found.' };
	await c.updateOne({ sessionId: authSessionId }, { $unset: { suspendedAt: '' } });
	return { ok: true, email: dm.email };
}

/**
 * Generates a new random password for a locked-out DM and returns it in plaintext — shown once
 * in the admin UI for the admin to relay out-of-band (there's no transactional email sender in
 * this app). Works for OAuth-only accounts too, giving them a password-login fallback.
 */
export async function resetDMPassword(
	authSessionId: string
): Promise<{ ok: boolean; email?: string; tempPassword?: string; error?: string }> {
	const c = await col();
	const dm = await c.findOne({ sessionId: authSessionId });
	if (!dm) return { ok: false, error: 'DM account not found.' };

	const tempPassword = randomTempPassword();
	const passwordHash = await bcrypt.hash(sha256Hex(tempPassword), 12);
	await c.updateOne({ sessionId: authSessionId }, { $set: { passwordHash } });

	return { ok: true, email: dm.email, tempPassword };
}

/**
 * Permanently deletes a DM account and everything embedded in it (game sessions, combat
 * history, custom monsters, encounters). Returns the deleted account's email and the public
 * 6-char IDs of its game sessions so the caller can evict them from in-memory caches.
 */
export async function deleteDM(
	authSessionId: string
): Promise<{ ok: boolean; email?: string; gameSessionIds?: string[]; error?: string }> {
	const c = await col();
	const dm = await c.findOne({ sessionId: authSessionId });
	if (!dm) return { ok: false, error: 'DM account not found.' };

	const gameSessionIds = ((dm.gameSessions as DMGameSession[]) ?? []).map((s) => s.sessionId);
	await c.deleteOne({ sessionId: authSessionId });

	return { ok: true, email: dm.email, gameSessionIds };
}

export type AdminAuditAction =
	| 'impersonate-start'
	| 'impersonate-stop'
	| 'suspend'
	| 'unsuspend'
	| 'password-reset'
	| 'export-data'
	| 'delete-account';

export interface AdminAuditEntry {
	adminEmail: string;
	action: AdminAuditAction;
	targetEmail: string;
	targetSessionId: string;
	at: Date;
}

/** Best-effort audit trail for admin actions on other accounts — never blocks the caller on failure. */
export async function logAdminAction(entry: Omit<AdminAuditEntry, 'at'>): Promise<void> {
	try {
		const db = await getDb();
		await db.collection<AdminAuditEntry>('adminAudit').insertOne({ ...entry, at: new Date() });
	} catch (err) {
		console.error('Failed to write admin audit log entry', err);
	}
}

/** Returns the most recent admin audit entries, newest first. Capped so the page stays light —
 *  the UI groups these per-target and shows them progressively disclosed, not as one long feed. */
export async function listAdminAudit(limit = 500): Promise<AdminAuditEntry[]> {
	const db = await getDb();
	return db
		.collection<AdminAuditEntry>('adminAudit')
		.find({}, { sort: { at: -1 }, limit })
		.toArray();
}
