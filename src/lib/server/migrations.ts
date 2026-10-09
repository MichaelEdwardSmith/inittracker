// One-time data migrations, run from getDb() after indexes are ensured. Each is guarded by a
// marker document in the 'migrations' collection so it runs once and can't resurrect data the
// user has since deleted. Migrations copy rather than move, so a code rollback loses nothing.
import type { Db, Document } from 'mongodb';
import type { CombatRecord } from '$lib/types';
import { insertMany } from './combatHistoryStore';

const COMBAT_HISTORY_MARKER = 'combatHistoryToCollection';

/**
 * Copies every gameSessions[].combatHistory array into the 'combatHistory' collection.
 * The embedded arrays are left in place (a later cleanup step removes them).
 */
export async function migrateCombatHistoryToCollection(db: Db): Promise<void> {
	const markers = db.collection('migrations');
	if (await markers.findOne({ _id: COMBAT_HISTORY_MARKER } as Document)) return;

	let sessions = 0;
	let records = 0;
	const cursor = db
		.collection('dms')
		.find(
			{ 'gameSessions.combatHistory.0': { $exists: true } },
			{ projection: { 'gameSessions.sessionId': 1, 'gameSessions.combatHistory': 1 } }
		);
	for await (const dm of cursor) {
		for (const s of (dm.gameSessions as { sessionId: string; combatHistory?: CombatRecord[] }[]) ??
			[]) {
			if (!s.combatHistory?.length) continue;
			sessions++;
			records += await insertMany(db, s.sessionId, s.combatHistory);
		}
	}

	await markers.updateOne(
		{ _id: COMBAT_HISTORY_MARKER } as Document,
		{ $set: { completedAt: new Date(), sessions, records } },
		{ upsert: true }
	);
	console.log(`[migrations] combatHistory: copied ${records} records from ${sessions} sessions`);
}
