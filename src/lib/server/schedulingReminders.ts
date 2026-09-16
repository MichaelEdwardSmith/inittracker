// Background scan for confirmed scheduling proposals whose session starts in ~24 hours, sending
// a one-shot reminder email to the roster. This app runs on a persistent Node process
// (adapter-node), not serverless, so an in-process interval is enough — no external cron needed.
// Same "module-level setInterval, .unref() so it never keeps the process alive on its own" shape
// as rateLimit.ts's stale-bucket sweep. Importing this module (see hooks.server.ts) is what
// starts the scan; it does nothing on its own otherwise.
import { getDb } from './db';
import { getPlayersForGameSession } from './playerModel';
import { markReminderSent } from './schedulingModel';
import { sendMail, appBaseUrl, schedulingReminderEmail } from './mail';
import type { SchedulingProposal } from '$lib/types';

const SCAN_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
// A slot is eligible once it's 23-25h out — a 2h-wide window so a slot never gets skipped
// entirely if a scan is delayed, while still comfortably landing on "tomorrow" for the reader.
const WINDOW_MIN_MS = 23 * 60 * 60 * 1000;
const WINDOW_MAX_MS = 25 * 60 * 60 * 1000;

interface DMGameSessionLite {
	sessionId: string;
	name: string;
	schedulingProposals?: SchedulingProposal[];
}

interface DMLite {
	gameSessions?: DMGameSessionLite[];
}

async function sendReminders(
	gameSessionId: string,
	sessionName: string,
	proposal: SchedulingProposal,
	confirmedStart: string
): Promise<void> {
	const roster = await getPlayersForGameSession(gameSessionId);
	const link = `${appBaseUrl()}/display/${gameSessionId}`;
	const { subject, html, text } = schedulingReminderEmail(
		sessionName,
		confirmedStart,
		proposal.timeZone || 'UTC',
		link
	);
	await Promise.allSettled(
		roster
			.filter((p) => p.email)
			.map((p) => sendMail({ to: p.email!, subject, html, text, tag: 'scheduling-reminder' }))
	);
}

async function scanOnce(): Promise<void> {
	try {
		const db = await getDb();
		const c = db.collection<DMLite>('dms');
		// Narrows the collection scan with a filter Mongo can use directly; the precise time-window
		// and remindersSent checks still happen in JS below since they need per-proposal logic.
		const dms = await c
			.find(
				{ 'gameSessions.schedulingProposals.status': 'confirmed' },
				{ projection: { gameSessions: 1 } }
			)
			.toArray();

		const now = Date.now();
		for (const dm of dms) {
			for (const session of dm.gameSessions ?? []) {
				for (const proposal of session.schedulingProposals ?? []) {
					if (proposal.status !== 'confirmed' || !proposal.confirmedSlotId) continue;
					if (proposal.remindersSent?.reminder24h) continue;

					const slot = proposal.slots.find((s) => s.id === proposal.confirmedSlotId);
					if (!slot) continue;

					const msUntil = new Date(slot.start).getTime() - now;
					if (msUntil < WINDOW_MIN_MS || msUntil > WINDOW_MAX_MS) continue;

					await sendReminders(session.sessionId, session.name, proposal, slot.start);
					await markReminderSent(session.sessionId, proposal.id, 'reminder24h');
				}
			}
		}
	} catch (err) {
		console.error('[schedulingReminders] scan failed', err);
	}
}

setInterval(scanOnce, SCAN_INTERVAL_MS).unref?.();
// Also run shortly after startup instead of waiting a full interval for the first pass.
setTimeout(scanOnce, 30_000).unref?.();
