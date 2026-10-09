// Storage for finished combats ("chronicle" records) in their own 'combatHistory' collection,
// one document per record, keyed by the game session's public 6-char ID. Previously these lived
// in an embedded gameSessions[].combatHistory array on the DM document, which grew every DM
// document (and every read of it) without bound. Takes a Db so it can be exercised in isolation.
import type { Db, Collection, Document } from 'mongodb';
import type { CombatRecord } from '$lib/types';

export const COMBAT_HISTORY_COLLECTION = 'combatHistory';
/** Records kept per game session; older ones are dropped as new ones arrive. */
export const MAX_RECORDS_PER_SESSION = 100;

function col(db: Db): Collection<Document> {
	return db.collection(COMBAT_HISTORY_COLLECTION);
}

export async function ensureCombatHistoryIndexes(db: Db): Promise<void> {
	await col(db).createIndex({ gameSessionId: 1, id: 1 }, { unique: true });
}

/** A record's own fields, minus the storage-only keys (and any client-supplied _id). */
function fieldsOf(record: CombatRecord): Document {
	const { _id, gameSessionId, ...rest } = record as unknown as Document;
	void _id;
	void gameSessionId;
	return rest;
}

/** Upserts a record (re-saving the same record id replaces it) and trims to the newest 100. */
export async function saveRecord(
	db: Db,
	gameSessionId: string,
	record: CombatRecord
): Promise<void> {
	const c = col(db);
	await c.updateOne({ gameSessionId, id: record.id }, { $set: fieldsOf(record) }, { upsert: true });

	const stale = await c
		.find({ gameSessionId }, { projection: { _id: 1 } })
		.sort({ _id: -1 })
		.skip(MAX_RECORDS_PER_SESSION)
		.toArray();
	if (stale.length > 0) await c.deleteMany({ _id: { $in: stale.map((d) => d._id) } });
}

/** Records for a session, oldest first (insertion order). */
export async function listRecords(db: Db, gameSessionId: string): Promise<CombatRecord[]> {
	const docs = await col(db).find({ gameSessionId }).sort({ _id: 1 }).toArray();
	return docs.map(({ _id, gameSessionId: _gs, ...record }) => {
		void _id;
		void _gs;
		return record as unknown as CombatRecord;
	});
}

export async function deleteRecord(db: Db, gameSessionId: string, id: string): Promise<void> {
	await col(db).deleteOne({ gameSessionId, id });
}

/** Removes every record for the given session(s). */
export async function deleteForSessions(db: Db, gameSessionIds: string[]): Promise<void> {
	if (gameSessionIds.length === 0) return;
	await col(db).deleteMany({ gameSessionId: { $in: gameSessionIds } });
}

/** Record counts keyed by game session public ID. */
export async function countBySession(db: Db): Promise<Map<string, number>> {
	const rows = await col(db)
		.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$gameSessionId', n: { $sum: 1 } } }])
		.toArray();
	return new Map(rows.map((r) => [r._id, r.n]));
}

/** Inserts records in order, skipping any whose id already exists for the session. */
export async function insertMany(
	db: Db,
	gameSessionId: string,
	records: CombatRecord[]
): Promise<number> {
	const valid = records.filter((r) => r && typeof r.id === 'string');
	if (valid.length === 0) return 0;
	const result = await col(db).bulkWrite(
		valid.map((r) => ({
			updateOne: {
				filter: { gameSessionId, id: r.id },
				update: { $setOnInsert: fieldsOf(r) },
				upsert: true
			}
		})),
		{ ordered: true }
	);
	return result.upsertedCount;
}
