import { MongoClient, type Db } from 'mongodb';
import { env } from '$env/dynamic/private';

let client: MongoClient | null = null;
let connectPromise: Promise<MongoClient> | null = null;
let initPromise: Promise<void> | null = null;

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
	return db;
}