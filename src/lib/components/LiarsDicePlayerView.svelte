<!-- Liar's Dice panel shown on the player display page when a game is active.
     Subscribes to /api/liars-dice SSE. Shows the player's dice, bid history, and
     controls for their turn. Non-players see a spectator view. -->
<script lang="ts">
	import type { LiarsDiceGame } from '$lib/types';

	interface Props {
		sessionId: string;
		playerId: string | null;
		playerName: string | null;
		/** When true the panel is forced open even if no game is active yet. */
		show?: boolean;
		onclose?: () => void;
	}
	let { sessionId, playerId, playerName, show = false, onclose }: Props = $props();

	// ── State ────────────────────────────────────────────────────────────────
	let game = $state<LiarsDiceGame | null>(null);
	let minimized = $state(false);
	let joined = $state(false);
	let error = $state<string | null>(null);

	// Bid controls
	let bidQty = $state(1);
	let bidFace = $state(2);

	// Countdown display for reveal phase
	let countdown = $state(0);
	let countdownTimer: ReturnType<typeof setInterval> | null = null;

	// ── SSE subscription ─────────────────────────────────────────────────────
	$effect(() => {
		const qs = new URLSearchParams({ session: sessionId });
		if (playerId) qs.set('player', playerId);
		const source = new EventSource(`/api/liars-dice?${qs.toString()}`);

		source.onmessage = (e) => {
			try {
				const data = JSON.parse(e.data);
				if (data.status === 'inactive') {
					game = null;
					joined = false;
					stopCountdown();
					return;
				}
				game = data as LiarsDiceGame;

				// Check if we're in the game already
				if (playerId && game.players.some((p) => p.id === playerId)) {
					joined = true;
				}

				if (game.status === 'reveal') {
					startCountdown();
				} else {
					stopCountdown();
				}

				// Pre-fill bid controls
				if (game.status === 'bidding') {
					if (game.currentBid) {
						const b = game.currentBid;
						if (b.face < 6) {
							bidFace = b.face + 1;
							bidQty = b.quantity;
						} else {
							bidFace = b.face;
							bidQty = b.quantity + 1;
						}
					} else {
						bidQty = 1;
						bidFace = 2;
					}
				}
			} catch {
				/* ignore */
			}
		};
		source.onerror = () => {};

		return () => {
			source.close();
			stopCountdown();
		};
	});

	// Polling fallback — poll whenever the panel is open so all game state transitions
	// (lobby → bidding → reveal) reach the player even if SSE is unreliable.
	$effect(() => {
		if (!show) return;
		async function fetchSnapshot() {
			const qs = new URLSearchParams({ session: sessionId, json: 'true' });
			if (playerId) qs.set('player', playerId);
			try {
				const r = await fetch(`/api/liars-dice?${qs}`);
				if (!r.ok) return;
				const data = await r.json();
				if (data?.status && data.status !== 'inactive') game = data;
			} catch {
				/* ignore */
			}
		}
		fetchSnapshot();
		const id = setInterval(fetchSnapshot, 3000);
		return () => clearInterval(id);
	});

	function startCountdown() {
		stopCountdown();
		countdown = 8;
		countdownTimer = setInterval(() => {
			countdown = Math.max(0, countdown - 1);
			if (countdown <= 0) stopCountdown();
		}, 1000);
	}

	function stopCountdown() {
		if (countdownTimer) {
			clearInterval(countdownTimer);
			countdownTimer = null;
		}
	}

	// ── Derived ──────────────────────────────────────────────────────────────
	const myPlayer = $derived(game?.players.find((p) => p.id === playerId) ?? null);
	const isMyTurn = $derived(!!playerId && game?.currentTurnPlayerId === playerId);
	const activePlayers = $derived(game?.players.filter((p) => !p.eliminated) ?? []);
	const totalDice = $derived(activePlayers.reduce((s, p) => s + p.diceCount, 0));
	const currentBidder = $derived(
		game?.players.find((p) => p.id === game?.currentTurnPlayerId) ?? null
	);

	// ── Actions ──────────────────────────────────────────────────────────────
	async function post(body: Record<string, unknown>) {
		error = null;
		const r = await fetch('/api/liars-dice', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...body, sessionId })
		});
		if (!r.ok) {
			const j = await r.json().catch(() => ({}));
			const dbg = j.debug
				? ` | sent: ${j.debug.receivedSessionId} | known: [${j.debug.knownSessions?.join(', ')}]`
				: '';
			error = (j.error ?? 'Action failed') + dbg;
			setTimeout(() => (error = null), 8000);
		}
	}

	function joinGame() {
		if (!playerId || !playerName) return;
		post({ action: 'join', playerId, playerName });
	}

	function isValidBid(): boolean {
		if (!game) return false;
		const prev = game.currentBid;
		if (!prev) return bidQty >= 1;
		if (game.isPalifico) {
			if (game.palificoFace !== null && bidFace !== game.palificoFace) return false;
			return bidQty > prev.quantity;
		}
		if (bidFace > prev.face) return bidQty >= 1;
		if (bidFace === prev.face) return bidQty > prev.quantity;
		return false;
	}

	// ── Die face SVG helper ───────────────────────────────────────────────────
	const PIP_COORDS: Record<number, [number, number][]> = {
		1: [[30, 30]],
		2: [
			[42, 18],
			[18, 42]
		],
		3: [
			[42, 18],
			[30, 30],
			[18, 42]
		],
		4: [
			[18, 18],
			[42, 18],
			[18, 42],
			[42, 42]
		],
		5: [
			[18, 18],
			[42, 18],
			[30, 30],
			[18, 42],
			[42, 42]
		],
		6: [
			[18, 16],
			[18, 30],
			[18, 44],
			[42, 16],
			[42, 30],
			[42, 44]
		]
	};

	function faceName(f: number): string {
		return ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'][f] ?? String(f);
	}
</script>

{#if show || (game && game.status !== 'inactive')}
	<!-- Fixed panel — bottom of screen, full width on mobile, right-aligned on desktop -->
	<div
		class="fixed right-4 bottom-4 z-[120] w-full max-w-sm overflow-hidden rounded-2xl border border-amber-800/60 bg-gray-950/95 shadow-2xl backdrop-blur-md sm:right-6 sm:bottom-6"
		style="box-shadow: 0 0 40px rgba(180,83,9,0.25), 0 20px 60px rgba(0,0,0,0.7)"
	>
		<!-- Header bar -->
		<div
			class="flex items-center gap-2 border-b border-gray-800/60 bg-gradient-to-r from-amber-950/70 to-gray-950 px-4 py-2.5"
		>
			<span class="text-base">🎲</span>
			<span class="flex-1 text-sm font-black tracking-wider text-amber-300 uppercase">
				{#if !game}
					Liar's Dice
				{:else if game.status === 'lobby'}
					Liar's Dice — Lobby
				{:else if game.status === 'game_over'}
					Liar's Dice — Game Over
				{:else}
					Liar's Dice — Round {game.roundNumber}{game.isPalifico ? ' ⚠️' : ''}
				{/if}
			</span>
			{#if !game && onclose}
				<button
					onclick={onclose}
					class="rounded p-1 text-gray-500 transition hover:text-red-400"
					aria-label="Close"
				>
					✕
				</button>
			{:else}
				<button
					onclick={() => (minimized = !minimized)}
					class="rounded p-1 text-gray-500 transition hover:text-amber-400"
					aria-label={minimized ? 'Expand' : 'Minimize'}
				>
					{minimized ? '▲' : '▼'}
				</button>
			{/if}
		</div>

		{#if !minimized}
			<div class="flex flex-col gap-3 p-4">
				<!-- ── NO GAME YET (manually opened) ─────────────────────────────────── -->
				{#if !game}
					<div class="flex flex-col items-center gap-3 py-4 text-center">
						<span class="text-4xl opacity-50">🎲</span>
						<p class="text-sm font-semibold text-gray-300">No game in progress</p>
						<p class="text-xs text-gray-500">Waiting for the DM to open a Liar's Dice lobby…</p>
					</div>

					<!-- ── LOBBY ──────────────────────────────────────────────────────────── -->
				{:else if game.status === 'lobby'}
					<div class="flex flex-col gap-3">
						<p class="text-xs text-gray-400">
							{game.players.length} player{game.players.length !== 1 ? 's' : ''} in lobby
						</p>

						<div class="flex flex-col gap-1">
							{#each game.players as p}
								<div class="flex items-center gap-2 text-xs">
									<span class="text-amber-500">🎲</span>
									<span class={p.id === playerId ? 'font-bold text-amber-300' : 'text-gray-300'}
										>{p.name}{p.id === playerId ? ' (You)' : ''}</span
									>
								</div>
							{/each}
						</div>

						{#if !joined && playerId && playerName}
							<button
								onclick={joinGame}
								class="w-full rounded-xl bg-amber-700 py-2.5 text-sm font-black tracking-wider text-white uppercase transition hover:bg-amber-600 active:scale-95"
							>
								Join Game
							</button>
						{:else if joined}
							<p class="text-center text-xs text-emerald-400 italic">
								✓ You're in! Waiting for DM to start…
							</p>
						{:else}
							<p class="text-center text-xs text-gray-500 italic">Log in to join the game.</p>
						{/if}
					</div>

					<!-- ── BIDDING ────────────────────────────────────────────────────────── -->
				{:else if game.status === 'bidding'}
					<!-- Other players' dice counts -->
					<div class="flex flex-wrap gap-2">
						{#each activePlayers as p}
							{#if p.id !== playerId}
								<div
									class="flex items-center gap-1.5 rounded-lg border border-gray-700/60 bg-gray-800/40 px-2 py-1 text-xs"
								>
									<span class="font-medium text-gray-300">{p.name}</span>
									<span class="text-amber-500">{p.diceCount}🎲</span>
								</div>
							{/if}
						{/each}
					</div>

					<!-- My dice -->
					{#if myPlayer && !myPlayer.eliminated}
						<div>
							<p class="mb-1.5 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
								Your Dice ({myPlayer.diceCount})
							</p>
							<div class="flex flex-wrap gap-1.5">
								{#if myPlayer.dice.length > 0}
									{#each myPlayer.dice as face}
										{@const isWild =
											face === 1 && !game.isPalifico && (game.currentBid?.face ?? 0) !== 1}
										<svg
											width="44"
											height="44"
											viewBox="0 0 60 60"
											class="rounded-xl transition"
											style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6)){isWild
												? ' drop-shadow(0 0 8px rgba(251,191,36,0.8))'
												: ''}"
										>
											<rect
												x="2"
												y="2"
												width="56"
												height="56"
												rx="11"
												fill={isWild ? '#78350f' : '#1e293b'}
												stroke={isWild ? '#d97706' : '#4b5563'}
												stroke-width="2.5"
											/>
											{#each PIP_COORDS[face] ?? [] as [cx, cy]}
												<circle {cx} {cy} r="6.5" fill={isWild ? '#fbbf24' : '#e5e7eb'} />
											{/each}
										</svg>
									{/each}
								{:else}
									<!-- Dice not yet received (shouldn't happen) -->
									{#each { length: myPlayer.diceCount } as _}
										<div
											class="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-xs text-gray-600"
										>
											?
										</div>
									{/each}
								{/if}
							</div>
							{#if !game.isPalifico && game.currentBid?.face !== 1}
								<p class="mt-1 text-[10px] text-amber-700/80">
									★ Gold-highlighted dice are wild (ones)
								</p>
							{/if}
						</div>
					{:else if myPlayer?.eliminated}
						<p class="text-center text-xs text-gray-500 italic">
							You've been eliminated — spectating.
						</p>
					{:else if !joined}
						<p class="text-center text-xs text-gray-500 italic">Spectating the game.</p>
					{/if}

					<!-- Current bid display -->
					{#if game.currentBid}
						<div
							class="flex items-center gap-3 rounded-xl border border-amber-800/40 bg-amber-950/20 px-3 py-2"
						>
							<div class="flex-1">
								<p class="text-[10px] tracking-wide text-amber-600/80 uppercase">Current Bid</p>
								<p class="text-lg font-black text-amber-300">
									{game.currentBid.quantity} × {faceName(game.currentBid.face)}s
								</p>
								<p class="text-[10px] text-gray-500">by {game.currentBid.playerName}</p>
							</div>
							<div class="text-right text-[10px] text-gray-500">
								<p>{totalDice} dice total</p>
								{#if !game.isPalifico}<p class="text-amber-700">1s wild</p>{/if}
							</div>
						</div>
					{:else}
						<div class="rounded-xl border border-gray-700/40 bg-gray-800/20 px-3 py-2 text-center">
							<p class="text-xs text-gray-500">No bid yet</p>
						</div>
					{/if}

					<!-- Turn indicator -->
					{#if isMyTurn}
						<div class="rounded-xl border border-blue-600/60 bg-blue-950/30 px-3 py-2 text-center">
							<p class="text-sm font-black text-blue-300">⚡ YOUR TURN</p>
						</div>
					{:else}
						<p class="text-center text-xs text-gray-500">
							{currentBidder?.name ?? '…'}'s turn
						</p>
					{/if}

					<!-- Bid controls — only on player's turn -->
					{#if isMyTurn && myPlayer && !myPlayer.eliminated}
						<div class="flex flex-col gap-2">
							<div class="flex items-center gap-3">
								<!-- Quantity spinner -->
								<div class="flex flex-col gap-1">
									<span class="text-[10px] text-gray-500 uppercase">Qty</span>
									<div class="flex items-center gap-1">
										<button
											onclick={() => (bidQty = Math.max(1, bidQty - 1))}
											class="h-8 w-8 rounded-lg bg-gray-700 font-bold text-gray-200 hover:bg-gray-600"
											>−</button
										>
										<span class="min-w-[2rem] text-center text-xl font-black text-white"
											>{bidQty}</span
										>
										<button
											onclick={() => bidQty++}
											class="h-8 w-8 rounded-lg bg-gray-700 font-bold text-gray-200 hover:bg-gray-600"
											>+</button
										>
									</div>
								</div>

								<span class="mt-4 text-gray-600">×</span>

								<!-- Face picker -->
								<div class="flex flex-col gap-1">
									<span class="text-[10px] text-gray-500 uppercase">Face</span>
									<div class="flex gap-1">
										{#each [1, 2, 3, 4, 5, 6] as f}
											<button
												onclick={() => (bidFace = f)}
												disabled={game.isPalifico &&
													game.palificoFace !== null &&
													f !== game.palificoFace}
												class="h-8 w-8 rounded-lg text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-30 {bidFace ===
												f
													? 'bg-amber-600 text-white'
													: 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">{f}</button
											>
										{/each}
									</div>
								</div>
							</div>

							<div class="flex gap-2">
								<button
									onclick={() => post({ action: 'bid', playerId, quantity: bidQty, face: bidFace })}
									disabled={!isValidBid()}
									class="flex-1 rounded-xl bg-blue-700 py-2 text-sm font-black text-white uppercase transition hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
								>
									Bid!
								</button>
								{#if game.currentBid}
									<button
										onclick={() => post({ action: 'dudo', playerId })}
										class="flex-1 rounded-xl bg-red-700 py-2 text-sm font-black text-white uppercase transition hover:bg-red-600 active:scale-95"
									>
										🎲 Liar!
									</button>
									<button
										onclick={() => post({ action: 'calza', playerId })}
										class="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-black text-white uppercase transition hover:bg-emerald-600 active:scale-95"
										title="Claim exact count"
									>
										✓
									</button>
								{/if}
							</div>
						</div>
					{/if}

					<!-- ── REVEAL ──────────────────────────────────────────────────────────── -->
				{:else if game.status === 'reveal' && game.reveal}
					{@const rev = game.reveal}
					<div class="flex flex-col gap-3">
						<!-- Result banner -->
						<div
							class="rounded-xl border {rev.calzaSuccess
								? 'border-emerald-700/60 bg-emerald-950/30'
								: 'border-red-800/50 bg-red-950/20'} px-3 py-2.5 text-center"
						>
							<p
								class="text-base font-black {rev.calzaSuccess
									? 'text-emerald-400'
									: 'text-red-400'}"
							>
								{rev.callerAction === 'dudo'
									? '🎲 LIAR!'
									: rev.calzaSuccess
										? '✅ CALZA!'
										: '❌ CALZA MISSED!'}
							</p>
							<p class="mt-0.5 text-xs text-gray-300">
								Bid: {rev.bid.quantity} × {faceName(rev.bid.face)}s · Actual:
								<strong class={rev.actual >= rev.bid.quantity ? 'text-emerald-400' : 'text-red-400'}
									>{rev.actual}</strong
								>
							</p>
							<p class="mt-1 text-xs {rev.calzaSuccess ? 'text-emerald-300' : 'text-red-300'}">
								{rev.calzaSuccess
									? `${rev.loserName} gains a die!`
									: `${rev.loserName} loses a die!`}
							</p>
						</div>

						<!-- All dice revealed -->
						<div class="flex flex-col gap-2">
							{#each rev.allDice as row}
								{@const isMe = row.playerId === playerId}
								{@const isLoser = row.playerId === rev.loserId}
								<div class="flex items-center gap-2">
									<span
										class="w-20 shrink-0 truncate text-xs font-semibold {isMe
											? 'text-amber-300'
											: isLoser
												? 'text-red-400'
												: 'text-gray-400'}"
										>{isMe ? 'You' : row.playerName}{isLoser ? ' 💸' : ''}</span
									>
									<div class="flex flex-wrap gap-1">
										{#each row.dice as face}
											{@const isMatch =
												face === rev.bid.face ||
												(!game.isPalifico && face === 1 && rev.bid.face !== 1)}
											<svg width="28" height="28" viewBox="0 0 60 60" class="rounded-lg">
												<rect
													x="2"
													y="2"
													width="56"
													height="56"
													rx="10"
													fill={isMatch ? (face === 1 ? '#78350f' : '#1e3a5f') : '#111827'}
													stroke={isMatch ? (face === 1 ? '#d97706' : '#3b82f6') : '#374151'}
													stroke-width="2"
												/>
												{#each PIP_COORDS[face] ?? [] as [cx, cy]}
													<circle
														{cx}
														{cy}
														r="6"
														fill={isMatch ? (face === 1 ? '#fbbf24' : '#93c5fd') : '#6b7280'}
													/>
												{/each}
											</svg>
										{/each}
									</div>
								</div>
							{/each}
						</div>

						<p class="text-center text-[10px] text-gray-500">
							Next round in {countdown}s…
						</p>
					</div>

					<!-- ── GAME OVER ───────────────────────────────────────────────────────── -->
				{:else if game.status === 'game_over'}
					<div class="flex flex-col items-center gap-2 py-2">
						<span class="text-4xl">🏆</span>
						<p class="text-lg font-black text-amber-300">{game.winnerName ?? '?'} Wins!</p>
						<p class="text-xs text-gray-500">
							{game.roundNumber} round{game.roundNumber !== 1 ? 's' : ''}
						</p>
					</div>
				{/if}

				{#if error}
					<p class="text-center text-xs text-red-400">{error}</p>
				{/if}
			</div>
		{/if}
	</div>
{/if}
