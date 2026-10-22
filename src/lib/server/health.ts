// Snapshot for the admin "System health" panel. Everything here is cheap to read; the in-memory
// numbers are per-process, so after a PM2 restart they start from zero by design.
import { getDb } from './db';
import { sessionClients, sessionStates } from './sseState';
import { isMailConfigured } from './mail';

export interface SystemHealth {
	uptimeSeconds: number;
	memoryRssMb: number;
	memoryHeapMb: number;
	/** Open SSE connections (viewers + overlays) across all game sessions. */
	sseConnections: number;
	/** Game sessions with state cached in memory. */
	liveSessions: number;
	/** Game sessions that currently have at least one connected viewer. */
	sessionsWithViewers: number;
	mailConfigured: boolean;
	emailsSent30d: number;
	emailsFailed30d: number;
	lastEmailFailureAt: Date | null;
	db: { dataMb: number; storageMb: number; collections: number; documents: number } | null;
	counts: { dms: number; players: number; activityEntries: number; auditEntries: number };
	checkedAt: Date;
}

const MB = 1024 * 1024;
const round1 = (n: number) => Math.round(n * 10) / 10;

export async function getSystemHealth(): Promise<SystemHealth> {
	let sseConnections = 0;
	let sessionsWithViewers = 0;
	for (const clients of sessionClients.values()) {
		sseConnections += clients.size;
		if (clients.size > 0) sessionsWithViewers++;
	}
	const mem = process.memoryUsage();
	const since = new Date(Date.now() - 30 * 86400 * 1000);

	let db: SystemHealth['db'] = null;
	let emails = { sent: 0, failed: 0 };
	let lastFailure: Date | null = null;
	let counts = { dms: 0, players: 0, activityEntries: 0, auditEntries: 0 };

	try {
		const database = await getDb();
		const [stats, emailAgg, failed, dms, players, activity, audit] = await Promise.all([
			database.command({ dbStats: 1 }),
			database
				.collection('sentEmails')
				.aggregate<{ _id: null; sent: number; failed: number }>([
					{ $match: { sentAt: { $gte: since }, isTest: false } },
					{
						$group: {
							_id: null,
							sent: { $sum: '$recipientCount' },
							failed: { $sum: '$failedCount' }
						}
					}
				])
				.toArray(),
			database
				.collection('sentEmails')
				.find(
					{ failedCount: { $gt: 0 } },
					{ projection: { sentAt: 1 }, sort: { sentAt: -1 }, limit: 1 }
				)
				.toArray(),
			database.collection('dms').estimatedDocumentCount(),
			database.collection('players').estimatedDocumentCount(),
			database.collection('dmActivity').estimatedDocumentCount(),
			database.collection('adminAudit').estimatedDocumentCount()
		]);
		db = {
			dataMb: round1(Number(stats.dataSize ?? 0) / MB),
			storageMb: round1(Number(stats.storageSize ?? 0) / MB),
			collections: Number(stats.collections ?? 0),
			documents: Number(stats.objects ?? 0)
		};
		emails = { sent: emailAgg[0]?.sent ?? 0, failed: emailAgg[0]?.failed ?? 0 };
		lastFailure = failed[0]?.sentAt ?? null;
		counts = { dms, players, activityEntries: activity, auditEntries: audit };
	} catch (err) {
		console.error('Failed to read database health', err);
	}

	return {
		uptimeSeconds: Math.round(process.uptime()),
		memoryRssMb: round1(mem.rss / MB),
		memoryHeapMb: round1(mem.heapUsed / MB),
		sseConnections,
		liveSessions: sessionStates.size,
		sessionsWithViewers,
		mailConfigured: isMailConfigured(),
		emailsSent30d: emails.sent,
		emailsFailed30d: emails.failed,
		lastEmailFailureAt: lastFailure,
		db,
		counts,
		checkedAt: new Date()
	};
}
