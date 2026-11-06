// In-app feedback from DMs (the "Send Feedback" button in the dashboard menu). Stored in the
// `feedback` collection and read back on /admin's Insights tab.
import { ObjectId } from 'mongodb';
import { getDb } from './db';

export const FEEDBACK_MAX_LENGTH = 2000;

export interface FeedbackEntry {
	/** String form of the Mongo _id — what the admin UI uses to delete an entry. */
	id: string;
	sessionId: string;
	email: string;
	message: string;
	at: Date;
}

interface FeedbackDoc {
	sessionId: string;
	email: string;
	message: string;
	at: Date;
}

export async function addFeedback(entry: Omit<FeedbackDoc, 'at'>): Promise<void> {
	const db = await getDb();
	await db.collection<FeedbackDoc>('feedback').insertOne({ ...entry, at: new Date() });
}

export async function listFeedback(limit = 200): Promise<FeedbackEntry[]> {
	const db = await getDb();
	const docs = await db
		.collection<FeedbackDoc>('feedback')
		.find({}, { sort: { at: -1 }, limit })
		.toArray();
	// _id is an ObjectId, which can't be serialized to the client — flatten it to a string.
	return docs.map((d) => ({
		id: d._id.toString(),
		sessionId: d.sessionId,
		email: d.email,
		message: d.message,
		at: d.at
	}));
}

export async function deleteFeedback(id: string): Promise<boolean> {
	if (!ObjectId.isValid(id)) return false;
	const db = await getDb();
	const res = await db.collection('feedback').deleteOne({ _id: new ObjectId(id) });
	return res.deletedCount === 1;
}
