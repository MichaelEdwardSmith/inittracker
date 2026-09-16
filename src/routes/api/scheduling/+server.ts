// GET  /api/scheduling         — DM view: active proposal + history + invitee roster for their
//                                 active game session (dm_auth cookie, no query params — same
//                                 convention as /api/notes).
// GET  /api/scheduling?session — player view: the active proposal for one game session
//                                 (player_auth cookie identifies the viewer; a player can have
//                                 several joined sessions, so there's no single "active" one).
// POST /api/scheduling         — action dispatch. 'propose' / 'confirm' / 'cancel' are DM-only
//                                 (act on the DM's active game session); 'vote' is player-only
//                                 (takes an explicit sessionId in the body).
import type { RequestHandler } from './$types';
import { resolveActingSessionId } from '$lib/server/auth';
import { getActiveGameSessionPublicId, getGameSessionName } from '$lib/server/dmModel';
import { authToGameSession } from '$lib/server/sessionCache';
import { getPlayerBySessionId, getPlayersForGameSession } from '$lib/server/playerModel';
import { isValidSessionId } from '$lib/server/validate';
import {
	listProposals,
	getActiveProposal,
	createProposal,
	castVote,
	confirmProposal,
	cancelProposal,
	markReminderSent
} from '$lib/server/schedulingModel';
import {
	sendMail,
	appBaseUrl,
	schedulingProposedEmail,
	schedulingConfirmedEmail
} from '$lib/server/mail';
import type { SchedulingAvailability, SchedulingProposal } from '$lib/types';

const MAX_SLOTS = 8;
const MAX_LABEL_LEN = 100;
const VALID_AVAIL = new Set<string>(['yes', 'no', 'maybe']);

async function resolveGameSessionId(authSessionId: string): Promise<string | null> {
	let gameSessionId = authToGameSession.get(authSessionId) ?? null;
	if (!gameSessionId) {
		gameSessionId = await getActiveGameSessionPublicId(authSessionId);
		if (gameSessionId) authToGameSession.set(authSessionId, gameSessionId);
	}
	return gameSessionId;
}

/** A user-supplied IANA zone (or undefined/garbage) falls back to UTC — worst case the email
 *  shows an offset time rather than throwing. */
function sanitizeTimeZone(raw: unknown): string {
	if (typeof raw === 'string') {
		try {
			new Intl.DateTimeFormat('en-US', { timeZone: raw });
			return raw;
		} catch {
			/* falls through to UTC */
		}
	}
	return 'UTC';
}

// ── Email side effects — fire-and-forget so the DM's action isn't held up on Postmark round
// trips to every invited player (same fire-and-forget spirit as the combat-state sync in
// store.svelte.ts). Failures are logged, never surfaced to the caller. ──────────────────────────

async function notifyProposed(gameSessionId: string, proposal: SchedulingProposal): Promise<void> {
	try {
		const [sessionName, roster] = await Promise.all([
			getGameSessionName(gameSessionId),
			getPlayersForGameSession(gameSessionId)
		]);
		const link = `${appBaseUrl()}/display/${gameSessionId}`;
		const { subject, html, text } = schedulingProposedEmail(
			sessionName ?? 'your game',
			proposal.slots,
			proposal.timeZone || 'UTC',
			link
		);
		await Promise.allSettled(
			roster
				.filter((p) => p.email)
				.map((p) => sendMail({ to: p.email!, subject, html, text, tag: 'scheduling-proposed' }))
		);
	} catch (err) {
		console.error('[scheduling] Failed to send proposed emails', err);
	}
}

async function notifyConfirmed(
	gameSessionId: string,
	proposalId: string,
	confirmedStart: string,
	timeZone: string | undefined
): Promise<void> {
	try {
		const [sessionName, roster] = await Promise.all([
			getGameSessionName(gameSessionId),
			getPlayersForGameSession(gameSessionId)
		]);
		const link = `${appBaseUrl()}/display/${gameSessionId}`;
		const { subject, html, text } = schedulingConfirmedEmail(
			sessionName ?? 'your game',
			confirmedStart,
			timeZone || 'UTC',
			link
		);
		await Promise.allSettled(
			roster
				.filter((p) => p.email)
				.map((p) => sendMail({ to: p.email!, subject, html, text, tag: 'scheduling-confirmed' }))
		);
		await markReminderSent(gameSessionId, proposalId, 'confirmedEmail');
	} catch (err) {
		console.error('[scheduling] Failed to send confirmed emails', err);
	}
}

// ── GET ───────────────────────────────────────────────────────────────────────

export const GET: RequestHandler = async ({ url, cookies }) => {
	const authSessionId = await resolveActingSessionId(cookies);
	if (authSessionId) {
		const gameSessionId = await resolveGameSessionId(authSessionId);
		if (!gameSessionId) return Response.json({ active: null, history: [], roster: [] });

		const [proposals, roster] = await Promise.all([
			listProposals(gameSessionId),
			getPlayersForGameSession(gameSessionId)
		]);
		const active = proposals.find((p) => p.status === 'open' || p.status === 'confirmed') ?? null;
		const history = proposals.filter((p) => p.id !== active?.id);
		return Response.json({ active, history, roster });
	}

	// Not a DM — treat as a player request.
	const gameSessionId = url.searchParams.get('session') ?? '';
	if (!isValidSessionId(gameSessionId)) {
		return new Response('Missing or invalid session', { status: 400 });
	}
	const playerSessionId = cookies.get('player_auth');
	if (!playerSessionId) return new Response('Unauthorized', { status: 401 });

	const active = await getActiveProposal(gameSessionId);
	const myAvail = active?.votes.find((v) => v.playerSessionId === playerSessionId)?.avail ?? null;
	return Response.json({ active, myAvail });
};

// ── POST ──────────────────────────────────────────────────────────────────────

export const POST: RequestHandler = async ({ request, cookies }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}
	if (!body || typeof body !== 'object') return new Response('Invalid body', { status: 400 });
	const b = body as Record<string, unknown>;

	// ── DM actions ────────────────────────────────────────────────────────────
	if (b.action === 'propose' || b.action === 'confirm' || b.action === 'cancel') {
		const authSessionId = await resolveActingSessionId(cookies);
		if (!authSessionId) return new Response('Unauthorized', { status: 401 });
		const gameSessionId = await resolveGameSessionId(authSessionId);
		if (!gameSessionId) return new Response('No active session', { status: 400 });

		if (b.action === 'propose') {
			const rawSlots = b.slots;
			if (!Array.isArray(rawSlots) || rawSlots.length === 0) {
				return new Response('At least one slot is required', { status: 400 });
			}
			if (rawSlots.length > MAX_SLOTS) {
				return new Response(`At most ${MAX_SLOTS} slots are allowed`, { status: 400 });
			}

			const slots: { start: string; label?: string }[] = [];
			for (const raw of rawSlots) {
				if (!raw || typeof raw !== 'object') return new Response('Invalid slot', { status: 400 });
				const r = raw as Record<string, unknown>;
				if (typeof r.start !== 'string' || Number.isNaN(Date.parse(r.start))) {
					return new Response('Invalid slot start time', { status: 400 });
				}
				const label = typeof r.label === 'string' ? r.label.slice(0, MAX_LABEL_LEN) : undefined;
				slots.push({ start: r.start, label });
			}

			const timeZone = sanitizeTimeZone(b.timeZone);
			const proposal = await createProposal(gameSessionId, slots, timeZone);
			void notifyProposed(gameSessionId, proposal);
			return Response.json({ ok: true, proposal });
		}

		if (b.action === 'confirm') {
			const { proposalId, slotId } = b as { proposalId?: unknown; slotId?: unknown };
			if (typeof proposalId !== 'string' || typeof slotId !== 'string') {
				return new Response('Missing proposalId or slotId', { status: 400 });
			}
			const result = await confirmProposal(gameSessionId, proposalId, slotId);
			if (!result.ok) return new Response(result.error, { status: 400 });

			const updated = await getActiveProposal(gameSessionId);
			const confirmedStart = updated?.slots.find((s) => s.id === slotId)?.start;
			if (updated && confirmedStart) {
				void notifyConfirmed(gameSessionId, proposalId, confirmedStart, updated.timeZone);
			}
			return Response.json({ ok: true });
		}

		// b.action === 'cancel'
		const { proposalId } = b as { proposalId?: unknown };
		if (typeof proposalId !== 'string') return new Response('Missing proposalId', { status: 400 });
		const result = await cancelProposal(gameSessionId, proposalId);
		if (!result.ok) return new Response(result.error, { status: 400 });
		return Response.json({ ok: true });
	}

	// ── Player action: vote ───────────────────────────────────────────────────
	if (b.action === 'vote') {
		const gameSessionId = typeof b.sessionId === 'string' ? b.sessionId : '';
		if (!isValidSessionId(gameSessionId)) return new Response('Invalid session', { status: 400 });

		const playerSessionId = cookies.get('player_auth');
		if (!playerSessionId) return new Response('Unauthorized', { status: 401 });
		const player = await getPlayerBySessionId(playerSessionId);
		if (!player) return new Response('Unauthorized', { status: 401 });

		const { proposalId, avail: rawAvail } = b as { proposalId?: unknown; avail?: unknown };
		if (typeof proposalId !== 'string' || !rawAvail || typeof rawAvail !== 'object') {
			return new Response('Missing proposalId or avail', { status: 400 });
		}

		const active = await getActiveProposal(gameSessionId);
		if (!active || active.id !== proposalId) {
			return new Response('Proposal not found or no longer open', { status: 404 });
		}

		// Only keep entries for slots that actually belong to this proposal, with a valid value —
		// drops anything else rather than trusting client-supplied slot ids wholesale.
		const avail: Record<string, SchedulingAvailability> = {};
		for (const slot of active.slots) {
			const v = (rawAvail as Record<string, unknown>)[slot.id];
			if (typeof v === 'string' && VALID_AVAIL.has(v)) {
				avail[slot.id] = v as SchedulingAvailability;
			}
		}

		const result = await castVote(
			gameSessionId,
			proposalId,
			playerSessionId,
			player.displayName,
			avail
		);
		if (!result.ok) return new Response(result.error, { status: 400 });
		return Response.json({ ok: true });
	}

	return new Response('Invalid action', { status: 400 });
};
