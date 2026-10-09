// MongoDB singleton. Connects lazily on first call to getDb() and reuses the
// connection for the lifetime of the process. Ensures unique indexes on email
// and sessionId (plus a multikey index on gameSessions.sessionId) in the 'dms'
// collection of the 'initiative' database, and runs one-time data migrations (migrations.ts).
import { MongoClient, type Db } from 'mongodb';
import { env } from '$env/dynamic/private';
import { ensureCombatHistoryIndexes } from './combatHistoryStore';
import { migrateCombatHistoryToCollection } from './migrations';

let client: MongoClient | null = null;
let connectPromise: Promise<MongoClient> | null = null;
let initPromise: Promise<void> | null = null;
let migrationPromise: Promise<void> | null = null;
let lastMigrationFailure = 0;
const MIGRATION_RETRY_MS = 60_000;

async function getClient(): Promise<MongoClient> {
	if (client) return client;

	if (!connectPromise) {
		const uri = env.MONGODB_URI;
		if (!uri) throw new Error('MONGODB_URI is not set');

		client = new MongoClient(uri);
		connectPromise = client.connect().then(() => client!);
	}

	return connectPromise;
}

async function ensureIndexes(db: Db) {
	const col = db.collection('dms');

	// Create indexes once per process startup (safe to call multiple times, but we gate it anyway)
	await col.createIndex({ email: 1 }, { unique: true });
	await col.createIndex({ sessionId: 1 }, { unique: true });
	// Multikey index: viewer SSE, state saves, notes and history all look up by game session public ID
	await col.createIndex({ 'gameSessions.sessionId': 1 });
	await ensureCombatHistoryIndexes(db);
}

// Runs once per process; a failure is logged (not thrown, so the app stays up) and retried
// at most once a minute on later requests.
async function runMigrations(db: Db) {
	if (!migrationPromise) {
		if (Date.now() - lastMigrationFailure < MIGRATION_RETRY_MS) return;
		migrationPromise = migrateCombatHistoryToCollection(db).catch((err) => {
			console.error('[migrations] failed', err);
			lastMigrationFailure = Date.now();
			migrationPromise = null;
		});
	}
	await migrationPromise;
}

export async function getDb(): Promise<Db> {
	const c = await getClient();
	const db = c.db('initiative');

	if (!initPromise) {
		initPromise = ensureIndexes(db).catch((err) => {
			// If index creation fails, allow retries on next request
			initPromise = null;
			throw err;
		});
	}

	await initPromise;
	await runMigrations(db);
	return db;
}
