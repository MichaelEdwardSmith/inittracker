// Liar's Dice minigame API — in-memory game state + personalized SSE per client.
// POST handles game actions; GET streams personalized game state to each participant.
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { LiarsDiceGame, LiarsDiceBid, LiarsDiceReveal } from '$lib/types';

// ── Server-side extended state (full dice values, not sent raw to clients) ──

interface ServerPlayer {
	id: string;
	name: string;
	dice: number[];
	diceCount: number;
	eliminated: boolean;
}

interface ServerGame {
	sessionId: string;
	status: 'lobby' | 'bidding' | 'reveal' | 'game_over';
	players: ServerPlayer[];
	currentTurnPlayerId: string | null;
	currentBid: LiarsDiceBid | null;
	bidHistory: LiarsDiceBid[];
	dmRole: 'player' | 'observer';
	roundNumber: number;
	isPalifico: boolean;
	palificoFace: number | null;
	eventLog: Array<{ type: string; description: string; timestamp: number }>;
	winnerId: string | null;
	winnerName: string | null;
	reveal: LiarsDiceReveal | null;
	autoAdvanceTimer: ReturnType<typeof setTimeout> | null;
}

interface ClientInfo {
	playerId: string | null;
	isDmObserver: boolean;
}

// ── In-memory state ──────────────────────────────────────────────────────────

const games = new Map<string, ServerGame>();
const clients = new Map<string, Map<ReadableStreamDefaultController<Uint8Array>, ClientInfo>>();
const encoder = new TextEncoder();

// ── Helpers ──────────────────────────────────────────────────────────────────

function rollDie(): number {
	return Math.ceil(Math.random() * 6);
}

function rollDiceForPlayer(player: ServerPlayer): void {
	player.dice = Array.from({ length: player.diceCount }, rollDie);
}

function getActivePlayers(game: ServerGame): ServerPlayer[] {
	return game.players.filter((p) => !p.eliminated);
}

function countFace(game: ServerGame, face: number, isPalifico: boolean): number {
	let count = 0;
	for (const player of game.players) {
		if (player.eliminated) continue;
		for (const die of player.dice) {
			// Ones are wild unless it's a Palifico round, or the bid itself is on ones
			if (die === face || (!isPalifico && die === 1 && face !== 1)) {
				count++;
			}
		}
	}
	return count;
}

function isValidBid(
	prev: LiarsDiceBid | null,
	next: { quantity: number; face: number },
	isPalifico: boolean,
	palificoFace: number | null
): boolean {
	if (next.quantity < 1 || next.face < 1 || next.face > 6) return false;
	// During Palifico, only quantity may increase and face is locked
	if (isPalifico) {
		if (palificoFace !== null && next.face !== palificoFace) return false;
		if (!prev) return true; // first bid in palifico sets the face
		return next.quantity > prev.quantity;
	}
	if (!prev) return true;
	// Normal: increase face (any quantity ≥ 1), or same face with higher quantity
	if (next.face > prev.face) return next.quantity >= 1;
	if (next.face === prev.face) return next.quantity > prev.quantity;
	return false;
}

function buildClientView(game: ServerGame, info: ClientInfo): LiarsDiceGame {
	const showAll = info.isDmObserver || game.status === 'reveal' || game.status === 'game_over';
	return {
		sessionId: game.sessionId,
		status: game.status,
		players: game.players.map((p) => ({
			id: p.id,
			name: p.name,
			diceCount: p.diceCount,
			dice: showAll || p.id === info.playerId ? [...p.dice] : [],
			eliminated: p.eliminated
		})),
		currentTurnPlayerId: game.currentTurnPlayerId,
		currentBid: game.currentBid,
		bidHistory: game.bidHistory.slice(-30),
		dmRole: game.dmRole,
		roundNumber: game.roundNumber,
		isPalifico: game.isPalifico,
		palificoFace: game.palificoFace,
		eventLog: game.eventLog.slice(-25),
		winnerId: game.winnerId,
		winnerName: game.winnerName,
		reveal: game.reveal
	};
}

function broadcast(game: ServerGame): void {
	const sessionClients = clients.get(game.sessionId);
	if (!sessionClients) return;
	for (const [ctrl, info] of sessionClients) {
		const view = buildClientView(game, info);
		const msg = encoder.encode(`data: ${JSON.stringify(view)}\n\n`);
		try {
			ctrl.enqueue(msg);
		} catch {
			sessionClients.delete(ctrl);
		}
	}
}

function broadcastInactive(sessionId: string): void {
	const sessionClients = clients.get(sessionId);
	if (!sessionClients) return;
	const msg = encoder.encode(`data: ${JSON.stringify({ status: 'inactive' })}\n\n`);
	for (const [ctrl] of sessionClients) {
		try {
			ctrl.enqueue(msg);
		} catch {
			sessionClients.delete(ctrl);
		}
	}
}

function log(game: ServerGame, type: string, description: string): void {
	game.eventLog.push({ type, description, timestamp: Date.now() });
}

function advanceTurnFrom(game: ServerGame, fromId: string): void {
	const active = getActivePlayers(game);
	if (active.length === 0) return;
	const idx = active.findIndex((p) => p.id === fromId);
	const nextIdx = (idx + 1) % active.length;
	game.currentTurnPlayerId = active[nextIdx].id;
}

function startRound(game: ServerGame, firstPlayerId: string): void {
	const active = getActivePlayers(game);

	// Check game over
	if (active.length <= 1) {
		game.status = 'game_over';
		if (active.length === 1) {
			game.winnerId = active[0].id;
			game.winnerName = active[0].name;
			log(game, 'game_over', `🏆 ${active[0].name} wins Liar's Dice!`);
		} else {
			log(game, 'game_over', 'Game over — no players remain.');
		}
		broadcast(game);
		// Clean up game after 5 minutes
		setTimeout(() => games.delete(game.sessionId), 5 * 60 * 1000);
		return;
	}

	game.roundNumber++;
	game.currentBid = null;
	game.bidHistory = [];
	game.reveal = null;

	// Palifico: someone is down to exactly 1 die
	const palifico = active.find((p) => p.diceCount === 1);
	game.isPalifico = !!palifico;
	game.palificoFace = null;

	// Roll all dice
	for (const p of active) rollDiceForPlayer(p);

	game.status = 'bidding';
	// Make sure firstPlayerId is active; fall back to first active player
	const firstIsActive = active.some((p) => p.id === firstPlayerId);
	game.currentTurnPlayerId = firstIsActive ? firstPlayerId : active[0].id;

	const starter = active.find((p) => p.id === game.currentTurnPlayerId);
	const palNote = game.isPalifico ? ' — ⚠️ PALIFICO ROUND (no wilds, face is locked!)' : '';
	log(
		game,
		'round_start',
		`Round ${game.roundNumber} begins. ${starter?.name ?? '?'} bids first.${palNote}`
	);
	broadcast(game);
}

function scheduleAutoAdvance(game: ServerGame, firstPlayerId: string): void {
	if (game.autoAdvanceTimer) clearTimeout(game.autoAdvanceTimer);
	game.autoAdvanceTimer = setTimeout(() => {
		game.autoAdvanceTimer = null;
		if (game.status === 'reveal') {
			startRound(game, firstPlayerId);
		}
	}, 8000);
}

// ── GET — SSE stream ─────────────────────────────────────────────────────────

export const GET: RequestHandler = ({ url }) => {
	const sessionId = url.searchParams.get('session');
	if (!sessionId) return new Response('Missing session', { status: 400 });

	const playerId = url.searchParams.get('player') ?? null;
	const isDmObserver = url.searchParams.get('dm') === 'observer';
	const clientInfo: ClientInfo = { playerId, isDmObserver };

	let ctrl!: ReadableStreamDefaultController<Uint8Array>;

	const stream = new ReadableStream<Uint8Array>({
		start(c) {
			ctrl = c;
			if (!clients.has(sessionId)) clients.set(sessionId, new Map());
			clients.get(sessionId)!.set(ctrl, clientInfo);

			// Send initial snapshot
			const game = games.get(sessionId);
			const initial = game ? buildClientView(game, clientInfo) : { status: 'inactive' };
			ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(initial)}\n\n`));

			// Keepalive ping
			const ping = setInterval(() => {
				try {
					ctrl.enqueue(encoder.encode(': ping\n\n'));
				} catch {
					clearInterval(ping);
				}
			}, 25000);
		},
		cancel() {
			clients.get(sessionId)?.delete(ctrl);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};

// ── POST — game actions ──────────────────────────────────────────────────────

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	if (!body?.action || !body?.sessionId) {
		return json({ error: 'Missing action or sessionId' }, { status: 400 });
	}

	const { action, sessionId } = body as { action: string; sessionId: string };

	// ── create ──────────────────────────────────────────────────────────────
	if (action === 'create') {
		const { dmRole, dmName } = body as { dmRole: 'player' | 'observer'; dmName?: string };

		// Destroy existing game for this session
		const existing = games.get(sessionId);
		if (existing?.autoAdvanceTimer) clearTimeout(existing.autoAdvanceTimer);

		const game: ServerGame = {
			sessionId,
			status: 'lobby',
			players: [],
			currentTurnPlayerId: null,
			currentBid: null,
			bidHistory: [],
			dmRole: dmRole ?? 'observer',
			roundNumber: 0,
			isPalifico: false,
			palificoFace: null,
			eventLog: [],
			winnerId: null,
			winnerName: null,
			reveal: null,
			autoAdvanceTimer: null
		};

		if (dmRole === 'player') {
			game.players.push({
				id: 'dm',
				name: dmName ?? 'Dungeon Master',
				dice: [],
				diceCount: 5,
				eliminated: false
			});
			log(game, 'joined', `${dmName ?? 'Dungeon Master'} (DM) joined the lobby.`);
		}

		games.set(sessionId, game);
		broadcast(game);
		return json({ ok: true });
	}

	const game = games.get(sessionId);
	if (!game) return json({ error: 'No active game for this session' }, { status: 404 });

	// ── join ────────────────────────────────────────────────────────────────
	if (action === 'join') {
		const { playerId, playerName } = body as { playerId: string; playerName: string };
		if (!playerId || !playerName)
			return json({ error: 'Missing playerId or playerName' }, { status: 400 });
		if (game.status !== 'lobby') return json({ error: 'Game already started' }, { status: 400 });
		if (game.players.some((p) => p.id === playerId)) return json({ ok: true }); // already joined

		game.players.push({
			id: playerId,
			name: playerName,
			dice: [],
			diceCount: 5,
			eliminated: false
		});
		log(game, 'joined', `${playerName} joined the lobby.`);
		broadcast(game);
		return json({ ok: true });
	}

	// ── leave ───────────────────────────────────────────────────────────────
	if (action === 'leave') {
		const { playerId } = body as { playerId: string };
		if (game.status === 'lobby') {
			game.players = game.players.filter((p) => p.id !== playerId);
			broadcast(game);
		}
		return json({ ok: true });
	}

	// ── start ───────────────────────────────────────────────────────────────
	if (action === 'start') {
		if (game.status !== 'lobby') return json({ error: 'Game already started' }, { status: 400 });
		if (game.players.length < 2) return json({ error: 'Need at least 2 players' }, { status: 400 });

		log(game, 'game_start', `Game starting with ${game.players.length} players!`);
		// startRound increments roundNumber from 0 → 1
		startRound(game, game.players[0].id);
		return json({ ok: true });
	}

	// ── bid ─────────────────────────────────────────────────────────────────
	if (action === 'bid') {
		const { playerId, quantity, face } = body as {
			playerId: string;
			quantity: number;
			face: number;
		};
		if (game.status !== 'bidding') return json({ error: 'Not in bidding phase' }, { status: 400 });
		if (game.currentTurnPlayerId !== playerId)
			return json({ error: 'Not your turn' }, { status: 400 });

		if (!isValidBid(game.currentBid, { quantity, face }, game.isPalifico, game.palificoFace)) {
			return json({ error: 'Invalid bid — must be higher than current bid' }, { status: 400 });
		}

		const player = game.players.find((p) => p.id === playerId);
		if (!player) return json({ error: 'Player not found' }, { status: 404 });

		const bid: LiarsDiceBid = { playerId, playerName: player.name, quantity, face };
		game.currentBid = bid;
		game.bidHistory.push(bid);

		// Lock Palifico face on first bid
		if (game.isPalifico && game.palificoFace === null) {
			game.palificoFace = face;
		}

		log(game, 'bid', `${player.name} bids ${quantity} × ${face}s.`);
		advanceTurnFrom(game, playerId);
		broadcast(game);
		return json({ ok: true });
	}

	// ── dudo ────────────────────────────────────────────────────────────────
	if (action === 'dudo') {
		const { playerId } = body as { playerId: string };
		if (game.status !== 'bidding') return json({ error: 'Not in bidding phase' }, { status: 400 });
		if (game.currentTurnPlayerId !== playerId)
			return json({ error: 'Not your turn' }, { status: 400 });
		if (!game.currentBid) return json({ error: 'No bid to challenge' }, { status: 400 });

		const challenger = game.players.find((p) => p.id === playerId)!;
		const bid = game.currentBid;
		const actual = countFace(game, bid.face, game.isPalifico);

		// Challenger loses if count >= quantity (bid was valid); bidder loses otherwise
		const bidderWins = actual >= bid.quantity;
		const loserId = bidderWins ? playerId : bid.playerId;
		const loser = game.players.find((p) => p.id === loserId)!;

		// Build reveal
		const reveal: LiarsDiceReveal = {
			allDice: game.players
				.filter((p) => !p.eliminated)
				.map((p) => ({ playerId: p.id, playerName: p.name, dice: [...p.dice] })),
			bid,
			actual,
			callerPlayerId: playerId,
			callerPlayerName: challenger.name,
			callerAction: 'dudo',
			calzaSuccess: false,
			loserId,
			loserName: loser.name,
			loserDiceChange: -1
		};
		game.reveal = reveal;
		game.status = 'reveal';

		// Remove die from loser
		loser.diceCount--;
		if (loser.diceCount <= 0) {
			loser.diceCount = 0;
			loser.eliminated = true;
			log(game, 'eliminated', `💀 ${loser.name} has been eliminated!`);
		}

		const verdict = bidderWins
			? `Bid was valid! ${challenger.name}'s Dudo fails — ${loser.name} loses a die.`
			: `Bluff called! Only ${actual} × ${bid.face}s — ${loser.name} loses a die.`;
		log(
			game,
			'dudo',
			`🎲 DUDO! ${challenger.name} challenges ${bid.playerName}'s bid of ${bid.quantity} × ${bid.face}s. Actual: ${actual}. ${verdict}`
		);

		broadcast(game);
		scheduleAutoAdvance(game, loserId);
		return json({ ok: true });
	}

	// ── calza ───────────────────────────────────────────────────────────────
	if (action === 'calza') {
		const { playerId } = body as { playerId: string };
		if (game.status !== 'bidding') return json({ error: 'Not in bidding phase' }, { status: 400 });
		if (!game.currentBid) return json({ error: 'No bid to calza' }, { status: 400 });

		const caller = game.players.find((p) => p.id === playerId)!;
		const bid = game.currentBid;
		const actual = countFace(game, bid.face, game.isPalifico);
		const calzaSuccess = actual === bid.quantity;

		const reveal: LiarsDiceReveal = {
			allDice: game.players
				.filter((p) => !p.eliminated)
				.map((p) => ({ playerId: p.id, playerName: p.name, dice: [...p.dice] })),
			bid,
			actual,
			callerPlayerId: playerId,
			callerPlayerName: caller.name,
			callerAction: 'calza',
			calzaSuccess,
			loserId: playerId,
			loserName: caller.name,
			loserDiceChange: calzaSuccess ? 1 : -1
		};
		game.reveal = reveal;
		game.status = 'reveal';

		if (calzaSuccess) {
			// Gain a die (max 5)
			if (caller.diceCount < 5) caller.diceCount++;
			log(
				game,
				'calza',
				`✅ CALZA! ${caller.name} called exact — ${actual} × ${bid.face}s! Gains a die!`
			);
		} else {
			caller.diceCount--;
			if (caller.diceCount <= 0) {
				caller.diceCount = 0;
				caller.eliminated = true;
				log(game, 'eliminated', `💀 ${caller.name} has been eliminated!`);
			}
			log(
				game,
				'calza',
				`❌ CALZA missed! ${caller.name} called ${bid.quantity} × ${bid.face}s but there were ${actual}. Loses a die.`
			);
		}

		broadcast(game);
		scheduleAutoAdvance(game, playerId);
		return json({ ok: true });
	}

	// ── next_round ──────────────────────────────────────────────────────────
	if (action === 'next_round') {
		if (game.status !== 'reveal') return json({ error: 'Not in reveal phase' }, { status: 400 });
		if (game.autoAdvanceTimer) {
			clearTimeout(game.autoAdvanceTimer);
			game.autoAdvanceTimer = null;
		}
		const loserId = game.reveal?.loserId ?? getActivePlayers(game)[0]?.id ?? '';
		startRound(game, loserId);
		return json({ ok: true });
	}

	// ── end_game ────────────────────────────────────────────────────────────
	if (action === 'end_game') {
		if (game.autoAdvanceTimer) clearTimeout(game.autoAdvanceTimer);
		games.delete(sessionId);
		broadcastInactive(sessionId);
		return json({ ok: true });
	}

	return json({ error: 'Unknown action' }, { status: 400 });
};
