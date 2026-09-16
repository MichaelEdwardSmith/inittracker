// Scheduling — DM proposes candidate date/time slots for the next session, invited players
// mark their availability, the DM confirms one. Stored as an array of SchedulingProposal
// embedded on the game session document, same tier as notes/combatHistory (see dmModel.ts).
//
// Only one proposal is ever "live" per game session at a time: createProposal() cancels any
// existing 'open' proposal before pushing the new one. Past proposals (confirmed or cancelled)
// are kept around for history rather than deleted.
import { randomUUID } from 'crypto';
import { getDb } from './db';
import type { SchedulingAvailability, SchedulingProposal, SchedulingSlot } from '$lib/types';

interface DMDoc {
	gameSessions?: {
		sessionId: string;
		schedulingProposals?: SchedulingProposal[];
	}[];
}

async function col() {
	const db = await getDb();
	return db.collection<DMDoc>('dms');
}

/** Returns every scheduling proposal for a game session, newest first. */
export async function listProposals(gameSessionId: string): Promise<SchedulingProposal[]> {
	const c = await col();
	const dm = await c.findOne({ 'gameSessions.sessionId': gameSessionId });
	const session = dm?.gameSessions?.find((s) => s.sessionId === gameSessionId);
	return [...(session?.schedulingProposals ?? [])].sort((a, b) =>
		b.createdAt.localeCompare(a.createdAt)
	);
}

/** The proposal players/the DM should currently see: the most recent open or confirmed one. */
export async function getActiveProposal(gameSessionId: string): Promise<SchedulingProposal | null> {
	const proposals = await listProposals(gameSessionId);
	return proposals.find((p) => p.status === 'open' || p.status === 'confirmed') ?? null;
}

/**
 * Creates a new proposal from a list of ISO datetimes (+ optional labels) and returns it.
 * Cancels any proposal still marked 'open' for this session first, so there's never more than
 * one open proposal at once.
 */
export async function createProposal(
	gameSessionId: string,
	slotInputs: { start: string; label?: string }[],
	timeZone?: string
): Promise<SchedulingProposal> {
	const c = await col();

	// Only issue the "cancel the existing open proposal" update when one could actually exist —
	// on a session's very first-ever proposal, schedulingProposals isn't just empty, it's entirely
	// absent, and MongoDB's $[identifier] array filters throw ("...must exist in the document in
	// order to apply array updates") rather than simply matching nothing when the path they walk
	// through doesn't exist at all.
	const dm = await c.findOne({ 'gameSessions.sessionId': gameSessionId });
	const session = dm?.gameSessions?.find((s) => s.sessionId === gameSessionId);
	const hasOpenProposal = (session?.schedulingProposals ?? []).some((p) => p.status === 'open');

	if (hasOpenProposal) {
		await c.updateOne(
			{ 'gameSessions.sessionId': gameSessionId },
			{ $set: { 'gameSessions.$[s].schedulingProposals.$[p].status': 'cancelled' } },
			{ arrayFilters: [{ 's.sessionId': gameSessionId }, { 'p.status': 'open' }] }
		);
	}

	const slots: SchedulingSlot[] = slotInputs.map((s) => ({
		id: randomUUID(),
		start: s.start,
		label: s.label
	}));
	const proposal: SchedulingProposal = {
		id: randomUUID(),
		createdAt: new Date().toISOString(),
		status: 'open',
		slots,
		votes: [],
		timeZone
	};

	await c.updateOne(
		{ 'gameSessions.sessionId': gameSessionId },
		{ $push: { 'gameSessions.$.schedulingProposals': proposal } as Record<string, unknown> }
	);

	return proposal;
}

/**
 * Sets (or replaces) one player's availability across every slot of a proposal. Reads the
 * proposal, mutates its votes array in JS, then writes the whole array back — nested arrays two
 * levels deep (gameSessions[].schedulingProposals[].votes[]) don't upsert cleanly with Mongo
 * positional operators, and this array stays small (one entry per invited player).
 */
export async function castVote(
	gameSessionId: string,
	proposalId: string,
	playerSessionId: string,
	displayName: string,
	avail: Record<string, SchedulingAvailability>
): Promise<{ ok: boolean; error?: string }> {
	const c = await col();
	const dm = await c.findOne({ 'gameSessions.sessionId': gameSessionId });
	const session = dm?.gameSessions?.find((s) => s.sessionId === gameSessionId);
	const proposal = session?.schedulingProposals?.find((p) => p.id === proposalId);
	if (!proposal) return { ok: false, error: 'Proposal not found.' };
	if (proposal.status !== 'open') return { ok: false, error: 'This proposal is no longer open.' };

	const votes = proposal.votes.filter((v) => v.playerSessionId !== playerSessionId);
	votes.push({ playerSessionId, displayName, avail });

	await c.updateOne(
		{ 'gameSessions.sessionId': gameSessionId },
		{ $set: { 'gameSessions.$[s].schedulingProposals.$[p].votes': votes } },
		{ arrayFilters: [{ 's.sessionId': gameSessionId }, { 'p.id': proposalId }] }
	);
	return { ok: true };
}

/** Confirms a proposal on one of its slots. */
export async function confirmProposal(
	gameSessionId: string,
	proposalId: string,
	slotId: string
): Promise<{ ok: boolean; error?: string }> {
	const c = await col();
	const dm = await c.findOne({ 'gameSessions.sessionId': gameSessionId });
	const session = dm?.gameSessions?.find((s) => s.sessionId === gameSessionId);
	const proposal = session?.schedulingProposals?.find((p) => p.id === proposalId);
	if (!proposal) return { ok: false, error: 'Proposal not found.' };
	if (!proposal.slots.some((s) => s.id === slotId)) {
		return { ok: false, error: 'That slot is not part of this proposal.' };
	}

	await c.updateOne(
		{ 'gameSessions.sessionId': gameSessionId },
		{
			$set: {
				'gameSessions.$[s].schedulingProposals.$[p].status': 'confirmed',
				'gameSessions.$[s].schedulingProposals.$[p].confirmedSlotId': slotId
			}
		},
		{ arrayFilters: [{ 's.sessionId': gameSessionId }, { 'p.id': proposalId }] }
	);
	return { ok: true };
}

/** Cancels a proposal outright (DM changed their mind, no slot works, etc). */
export async function cancelProposal(
	gameSessionId: string,
	proposalId: string
): Promise<{ ok: boolean; error?: string }> {
	const c = await col();
	const result = await c.updateOne(
		{ 'gameSessions.sessionId': gameSessionId },
		{ $set: { 'gameSessions.$[s].schedulingProposals.$[p].status': 'cancelled' } },
		{ arrayFilters: [{ 's.sessionId': gameSessionId }, { 'p.id': proposalId }] }
	);
	if (!result.matchedCount) return { ok: false, error: 'Proposal not found.' };
	return { ok: true };
}

/** Flags a one-shot reminder email as sent, so the (future) reminder scanner never double-sends. */
export async function markReminderSent(
	gameSessionId: string,
	proposalId: string,
	key: 'confirmedEmail' | 'reminder24h'
): Promise<void> {
	const c = await col();
	await c.updateOne(
		{ 'gameSessions.sessionId': gameSessionId },
		{ $set: { [`gameSessions.$[s].schedulingProposals.$[p].remindersSent.${key}`]: true } },
		{ arrayFilters: [{ 's.sessionId': gameSessionId }, { 'p.id': proposalId }] }
	);
}
