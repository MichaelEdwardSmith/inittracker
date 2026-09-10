// DM → Player polling API — in-memory poll state + personalized SSE per client.
// POST handles DM/player actions; GET streams a personalized poll view to each viewer
// (their own `myVote` is filled in, everyone sees the same live tallies).
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { PollState } from '$lib/types';
import { polls, pollClients, type ServerPoll } from '$lib/server/pollState';

const encoder = new TextEncoder();

const MAX_OPTIONS = 10;
const MIN_OPTIONS = 2;
const MAX_QUESTION_LEN = 300;
const MAX_OPTION_LEN = 100;

function buildClientView(poll: ServerPoll, voterId: string | null): PollState {
	const tally = new Map<string, number>();
	for (const o of poll.options) tally.set(o.id, 0);
	for (const v of poll.votes) tally.set(v.optionId, (tally.get(v.optionId) ?? 0) + 1);
	const myVote = voterId ? (poll.votes.find((v) => v.voterId === voterId)?.optionId ?? null) : null;
	return {
		id: poll.id,
		question: poll.question,
		options: poll.options.map((o) => ({ id: o.id, text: o.text, votes: tally.get(o.id) ?? 0 })),
		totalVotes: poll.votes.length,
		open: poll.open,
		myVote
	};
}

function broadcast(poll: ServerPoll): void {
	const clients = pollClients.get(poll.sessionId);
	if (!clients) return;
	for (const [ctrl, voterId] of clients) {
		const view = buildClientView(poll, voterId);
		try {
			ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(view)}\n\n`));
		} catch {
			clients.delete(ctrl);
		}
	}
}

function broadcastInactive(sessionId: string): void {
	const clients = pollClients.get(sessionId);
	if (!clients) return;
	for (const [ctrl] of clients) {
		try {
			ctrl.enqueue(encoder.encode(`data: null\n\n`));
		} catch {
			clients.delete(ctrl);
		}
	}
}

// ── GET — SSE stream (or JSON snapshot with ?json=true) ─────────────────────

export const GET: RequestHandler = ({ url }) => {
	const sessionId = url.searchParams.get('session');
	if (!sessionId) return new Response('Missing session', { status: 400 });

	const voterId = url.searchParams.get('voter') || null;

	if (url.searchParams.get('json') === 'true') {
		const poll = polls.get(sessionId);
		return json(poll ? buildClientView(poll, voterId) : null);
	}

	let ctrl!: ReadableStreamDefaultController<Uint8Array>;

	const stream = new ReadableStream<Uint8Array>({
		start(c) {
			ctrl = c;
			if (!pollClients.has(sessionId)) pollClients.set(sessionId, new Map());
			pollClients.get(sessionId)!.set(ctrl, voterId);

			const poll = polls.get(sessionId);
			const initial = poll ? JSON.stringify(buildClientView(poll, voterId)) : 'null';
			ctrl.enqueue(encoder.encode(`data: ${initial}\n\n`));

			const ping = setInterval(() => {
				try {
					ctrl.enqueue(encoder.encode(': ping\n\n'));
				} catch {
					clearInterval(ping);
				}
			}, 25000);
		},
		cancel() {
			pollClients.get(sessionId)?.delete(ctrl);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};

// ── POST — DM/player actions ─────────────────────────────────────────────────

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	if (!body?.action || !body?.sessionId) {
		return json({ error: 'Missing action or sessionId' }, { status: 400 });
	}
	const { action, sessionId } = body as { action: string; sessionId: string };

	// ── create — DM opens a new poll, replacing any existing one for this session ──
	if (action === 'create') {
		const { question, options } = body as { question: string; options: string[] };
		const q = typeof question === 'string' ? question.trim() : '';
		const opts = Array.isArray(options)
			? options.map((o) => (typeof o === 'string' ? o.trim() : '')).filter((o) => o.length > 0)
			: [];

		if (!q) return json({ error: 'Question is required' }, { status: 400 });
		if (q.length > MAX_QUESTION_LEN)
			return json({ error: 'Question is too long' }, { status: 400 });
		if (opts.length < MIN_OPTIONS)
			return json({ error: `At least ${MIN_OPTIONS} options are required` }, { status: 400 });
		if (opts.length > MAX_OPTIONS)
			return json({ error: `At most ${MAX_OPTIONS} options are allowed` }, { status: 400 });
		if (opts.some((o) => o.length > MAX_OPTION_LEN))
			return json({ error: 'An option is too long' }, { status: 400 });

		const poll: ServerPoll = {
			sessionId,
			id: crypto.randomUUID(),
			question: q,
			options: opts.map((text) => ({ id: crypto.randomUUID(), text })),
			votes: [],
			open: true,
			createdAt: Date.now()
		};
		polls.set(sessionId, poll);
		broadcast(poll);
		return json({ ok: true });
	}

	const poll = polls.get(sessionId);
	if (!poll) return json({ error: 'No active poll for this session' }, { status: 404 });

	// ── vote — a player casts or changes their vote ──────────────────────────────
	if (action === 'vote') {
		const { voterId, voterName, optionId } = body as {
			voterId: string;
			voterName: string;
			optionId: string;
		};
		if (!voterId || !optionId)
			return json({ error: 'Missing voterId or optionId' }, { status: 400 });
		if (!poll.open) return json({ error: 'Voting is closed' }, { status: 400 });
		if (!poll.options.some((o) => o.id === optionId))
			return json({ error: 'Invalid option' }, { status: 400 });

		poll.votes = poll.votes.filter((v) => v.voterId !== voterId);
		poll.votes.push({ voterId, voterName: voterName?.trim() || 'A player', optionId });
		broadcast(poll);
		return json({ ok: true });
	}

	// ── close — DM stops accepting new votes but keeps results visible ───────────
	if (action === 'close') {
		poll.open = false;
		broadcast(poll);
		return json({ ok: true });
	}

	// ── reopen — DM resumes accepting votes on the same poll ──────────────────────
	if (action === 'reopen') {
		poll.open = true;
		broadcast(poll);
		return json({ ok: true });
	}

	// ── end — DM dismisses the poll entirely ──────────────────────────────────────
	if (action === 'end') {
		polls.delete(sessionId);
		broadcastInactive(sessionId);
		return json({ ok: true });
	}

	return json({ error: 'Unknown action' }, { status: 400 });
};
