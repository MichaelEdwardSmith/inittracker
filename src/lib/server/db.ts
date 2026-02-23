import { MongoClient } from 'mongodb';
import { MONGODB_URI } from '$env/static/private';

let client: MongoClient | null = null;

export async function getDb() {
	if (!client) {
		client = new MongoClient(MONGODB_URI);
		await client.connect();
		// Ensure indexes exist
		const db = client.db('initiative');
		const col = db.collection('dms');
		await col.createIndex({ email: 1 }, { unique: true });
		await col.createIndex({ sessionId: 1 }, { unique: true });
	}
	return client.db('initiative');
}
