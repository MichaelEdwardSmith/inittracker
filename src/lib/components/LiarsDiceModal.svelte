<!-- Liar's Dice minigame modal for the DM. Shows lobby management, full game control,
     and (if observing) all players' dice at once. If the DM joins as a player they get
     the same interface as the players on the display page. -->
<script lang="ts">
	import type { LiarsDiceGame, LiarsDicePlayer } from '$lib/types';
	import { triggerRoll } from '$lib/diceOverlay.svelte';

	interface Props {
		sessionId: string;
		dmName: string;
		onclose: () => void;
	}
	let { sessionId, dmName, onclose }: Props = $props();

	// ── Connection & state ───────────────────────────────────────────────────
	let game = $state<LiarsDiceGame | null>(null);
	let error = $state<string | null>(null);

	// ── Lobby UI ─────────────────────────────────────────────────────────────
	let dmRole = $state<'player' | 'observer'>('observer');
	let lobbyCreated = $state(false);

	// ── Bid UI (DM as player) ────────────────────────────────────────────────
	let bidQty = $state(1);
	let bidFace = $state(1);

	// ── Auto-advance countdown ────────────────────────────────────────────────
	let countdown = $state(0);
	let countdownTimer: ReturnType<typeof setInterval> | null = null;

	// ── SSE subscription ─────────────────────────────────────────────────────
	$effect(() => {
		const dmParam = dmRole === 'observer' ? 'dm=observer' : 'player=dm';
		const source = new EventSource(`/api/liars-dice?session=${sessionId}&${dmParam}`);

		source.onmessage = (e) => {
			try {
				const data = JSON.parse(e.data);
				if (data.status === 'inactive') {
					if (lobbyCreated) game = null;
					return;
				}
				game = data as LiarsDiceGame;

				// Start countdown on reveal
				if (game.status === 'reveal') {
					startCountdown();
				} else {
					stopCountdown();
				}

				// Auto-advance bid qty/face suggestion
				if (game.status === 'bidding' && game.currentBid) {
					const bid = game.currentBid;
					if (bid.face < 6) {
						bidFace = bid.face + 1;
						bidQty = bid.quantity;
					} else {
						bidFace = bid.face;
						bidQty = bid.quantity + 1;
					}
				} else if (game.status === 'bidding' && !game.currentBid) {
					bidQty = 1;
					bidFace = 2;
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

	// Polling fallback — poll for the entire lifetime of the lobby/game so all
	// state transitions (joins, bids, reveals) reach the DM even if SSE is unreliable.
	$effect(() => {
		if (!lobbyCreated) return;
		async function fetchSnapshot() {
			const qs = new URLSearchParams({ session: sessionId, json: 'true' });
			if (dmRole === 'observer') qs.set('dm', 'observer');
			else qs.set('player', 'dm');
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
		const id = setInterval(fetchSnapshot, 2000);
		return () => clearInterval(id);
	});

	function startCountdown() {
		stopCountdown();
		countdown = 8;
		countdownTimer = setInterval(() => {
			countdown--;
			if (countdown <= 0) stopCountdown();
		}, 1000);
	}

	function stopCountdown() {
		if (countdownTimer) {
			clearInterval(countdownTimer);
			countdownTimer = null;
		}
		countdown = 0;
	}

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
			error = j.error ?? 'Unknown error';
		}
	}

	async function createLobby() {
		await post({ action: 'create', dmRole, dmName });
		lobbyCreated = true;
	}

	// ── Auto-roll for DM when playing ────────────────────────────────────────
	// Plain let (not $state) so writing it doesn't re-trigger the effect.
	let hasRolledThisRound = false;
	$effect(() => {
		if (dmRole !== 'player') return;
		if (!game || game.status !== 'bidding') {
			hasRolledThisRound = false;
			return;
		}
		if (hasRolledThisRound) return;
		const me = game.players.find((p) => p.id === 'dm');
		if (!me || me.eliminated || me.dice.length > 0) return;
		hasRolledThisRound = true;
		triggerRoll(`${me.diceCount}d6`, (rolls) => {
			post({ action: 'submit_roll', playerId: 'dm', dice: rolls });
		});
	});

	const myPlayer = $derived(game?.players.find((p) => p.id === 'dm') ?? null);
	const isMyTurn = $derived(game?.currentTurnPlayerId === 'dm' && dmRole === 'player');
	const activePlayers = $derived(game?.players.filter((p) => !p.eliminated) ?? []);
	const totalDice = $derived(activePlayers.reduce((s, p) => s + p.diceCount, 0));

	// ── Die face SVG ─────────────────────────────────────────────────────────
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

	function faceName(face: number): string {
		return ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'][face] ?? String(face);
	}

	function validBidQty(): boolean {
		if (!game) return false;
		const prev = game.currentBid;
		if (!prev) return bidQty >= 1;
		if (game.isPalifico) return bidQty > prev.quantity;
		if (bidFace > prev.face) return bidQty >= 1;
		if (bidFace === prev.face) return bidQty > prev.quantity;
		return false;
	}
</script>

<!-- Backdrop -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm"
	onclick={(e) => e.target === e.currentTarget && onclose()}
></div>

<!-- Panel -->
<div
	class="fixed top-[50%] left-[50%] z-[151] flex max-h-[90vh] w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-2xl border border-amber-800/60 bg-gray-900 shadow-2xl"
>
	<!-- Header -->
	<div
		class="flex shrink-0 items-center justify-between border-b border-gray-700/60 bg-gradient-to-r from-amber-950/60 to-gray-900 px-6 py-4"
	>
		<div class="flex items-center gap-3">
			<i class="fa-solid fa-dice text-2xl" aria-hidden="true"></i>
			<div>
				<h2 class="text-lg font-black tracking-wider text-amber-300 uppercase">Liar's Dice</h2>
				{#if game}
					<p class="text-xs text-gray-500">
						{#if game.status === 'lobby'}
							Lobby — {game.players.length} joined
						{:else if game.status === 'bidding'}
							Round {game.roundNumber}{#if game.isPalifico}
								· <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> PALIFICO
							{/if} — {totalDice} dice in play
						{:else if game.status === 'reveal'}
							Reveal — next round in {countdown}s
						{:else if game.status === 'game_over'}
							Game Over
						{/if}
					</p>
				{/if}
			</div>
		</div>
		<button
			onclick={onclose}
			aria-label="Close"
			class="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-white"
			><i class="fa-solid fa-xmark" aria-hidden="true"></i></button
		>
	</div>

	<!-- Body -->
	<div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
		<!-- ── Pre-lobby: setup ──────────────────────────────────────────────── -->
		{#if !lobbyCreated}
			<div class="flex flex-col items-center gap-6 py-4">
				<p class="text-center text-sm text-gray-400">
					Set up a Liar's Dice game for your players. Choose your role then open the lobby.
				</p>

				<div class="flex gap-3">
					<button
						onclick={() => (dmRole = 'observer')}
						class="flex flex-col items-center gap-2 rounded-xl border-2 px-6 py-4 transition {dmRole ===
						'observer'
							? 'border-amber-500 bg-amber-950/40 text-amber-300'
							: 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-gray-200'}"
					>
						<i class="fa-solid fa-eye text-3xl" aria-hidden="true"></i>
						<span class="font-bold">Observe</span>
						<span class="text-center text-xs opacity-70">See all dice, manage the game</span>
					</button>
					<button
						onclick={() => (dmRole = 'player')}
						class="flex flex-col items-center gap-2 rounded-xl border-2 px-6 py-4 transition {dmRole ===
						'player'
							? 'border-amber-500 bg-amber-950/40 text-amber-300'
							: 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-gray-200'}"
					>
						<i class="fa-solid fa-dice text-3xl" aria-hidden="true"></i>
						<span class="font-bold">Play</span>
						<span class="text-center text-xs opacity-70">Join the game as a player</span>
					</button>
				</div>

				<button
					onclick={createLobby}
					class="rounded-xl bg-amber-600 px-8 py-3 font-black tracking-wider text-white uppercase transition hover:bg-amber-500 active:scale-95"
				>
					Open Lobby
				</button>
			</div>

			<!-- ── Lobby ───────────────────────────────────────────────────────────── -->
		{:else if game?.status === 'lobby'}
			<div class="flex flex-col gap-5">
				<div class="rounded-xl border border-gray-700/60 bg-gray-800/40 p-4">
					<h3 class="mb-3 text-xs font-bold tracking-widest text-gray-400 uppercase">Players</h3>
					{#if game.players.length === 0}
						<p class="text-sm text-gray-500 italic">
							Waiting for players to join on the display screen…
						</p>
					{:else}
						<ul class="flex flex-col gap-2">
							{#each game.players as player}
								<li class="flex items-center gap-3">
									<span
										class="flex h-7 w-7 items-center justify-center rounded-full bg-amber-900/40 text-xs font-black text-amber-400"
										><i class="fa-solid fa-dice" aria-hidden="true"></i></span
									>
									<span class="font-semibold text-gray-200">{player.name}</span>
									{#if player.id === 'dm'}
										<span
											class="rounded-full border border-purple-700/60 bg-purple-950/40 px-2 py-0.5 text-[10px] font-bold text-purple-400"
											>DM</span
										>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</div>

				<div class="flex gap-3">
					<button
						onclick={() => post({ action: 'start' })}
						disabled={game.players.length < 2}
						class="flex-1 rounded-xl bg-emerald-700 py-3 font-black tracking-wider text-white uppercase transition hover:bg-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Start Game ({game.players.length} players)
					</button>
					<button
						onclick={() => {
							post({ action: 'end_game' });
							lobbyCreated = false;
							game = null;
						}}
						class="rounded-xl border border-gray-600 bg-gray-800 px-4 py-3 text-sm text-gray-400 transition hover:text-white"
					>
						Cancel
					</button>
				</div>
			</div>

			<!-- ── Bidding + Reveal (observer view: all dice visible) ──────────────── -->
		{:else if game && (game.status === 'bidding' || game.status === 'reveal')}
			<div class="flex flex-col gap-4">
				<!-- Current bid banner -->
				{#if game.currentBid}
					<div
						class="flex items-center gap-4 rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-3"
					>
						<div class="flex-1">
							<p class="text-[10px] font-bold tracking-widest text-amber-600 uppercase">
								Current Bid — {game.currentBid.playerName}
							</p>
							<p class="text-2xl font-black text-amber-300">
								{game.currentBid.quantity} × {faceName(game.currentBid.face)}S
							</p>
						</div>
						{#if !game.isPalifico}
							<p class="text-xs text-gray-500">Ones are wild</p>
						{:else}
							<p class="text-xs text-amber-600">
								<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> No wilds
							</p>
						{/if}
					</div>
				{:else}
					<div class="rounded-xl border border-gray-700/40 bg-gray-800/30 px-4 py-3 text-center">
						<p class="text-sm text-gray-500">No bid yet — waiting for first bid</p>
					</div>
				{/if}

				<!-- Reveal result -->
				{#if game.status === 'reveal' && game.reveal}
					{@const rev = game.reveal}
					<div
						class="rounded-xl border {rev.calzaSuccess
							? 'border-emerald-700/60 bg-emerald-950/30'
							: 'border-red-800/60 bg-red-950/20'} px-4 py-3"
					>
						<p
							class="mb-1 text-sm font-bold {rev.calzaSuccess
								? 'text-emerald-400'
								: 'text-red-400'}"
						>
							{#if rev.callerAction === 'dudo'}
								<i class="fa-solid fa-dice" aria-hidden="true"></i> LIAR!
							{:else if rev.calzaSuccess}
								<i class="fa-solid fa-circle-check" aria-hidden="true"></i> CALZA!
							{:else}
								<i class="fa-solid fa-circle-xmark" aria-hidden="true"></i> CALZA MISSED!
							{/if}
						</p>
						<p class="text-xs text-gray-300">
							Bid: {rev.bid.quantity} × {faceName(rev.bid.face)}s · Actual:
							<strong class={rev.actual >= rev.bid.quantity ? 'text-emerald-400' : 'text-red-400'}
								>{rev.actual}</strong
							>
						</p>
						<p class="mt-1 text-xs text-gray-400">
							{#if rev.calzaSuccess}
								{rev.loserName} gains a die!
							{:else}
								{rev.loserName} loses a die!
							{/if}
						</p>
						<p class="mt-2 text-xs text-gray-500">Next round in {countdown}s…</p>
					</div>
				{/if}

				<!-- Player rows — all dice visible for observer -->
				<div class="flex flex-col gap-2">
					{#each game.players as player}
						{@const isCurrent = game.currentTurnPlayerId === player.id && game.status === 'bidding'}
						{@const isLoser = game.status === 'reveal' && game.reveal?.loserId === player.id}
						<div
							class="flex items-center gap-3 rounded-xl border px-3 py-2.5 transition {player.eliminated
								? 'border-gray-800 bg-gray-900/30 opacity-40'
								: isCurrent
									? 'border-amber-600/60 bg-amber-950/20'
									: isLoser
										? 'border-red-700/60 bg-red-950/20'
										: 'border-gray-700/40 bg-gray-800/30'}"
						>
							<!-- Name + die count -->
							<div class="w-28 shrink-0">
								<p
									class="truncate text-sm font-bold {isCurrent
										? 'text-amber-300'
										: player.eliminated
											? 'text-gray-600'
											: 'text-gray-200'}"
								>
									{#if player.id === 'dm'}<i class="fa-solid fa-crown" aria-hidden="true"></i>
									{/if}{player.name}
								</p>
								<p class="text-[10px] text-gray-500">
									{#if player.eliminated}
										eliminated
									{:else}
										{player.diceCount} <i class="fa-solid fa-dice" aria-hidden="true"></i>
									{/if}
								</p>
							</div>

							<!-- Dice faces -->
							<div class="flex flex-wrap gap-1">
								{#if player.dice.length > 0}
									{#each player.dice as face}
										<svg
											width="32"
											height="32"
											viewBox="0 0 60 60"
											class="rounded-lg"
											style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5))"
										>
											<rect
												x="2"
												y="2"
												width="56"
												height="56"
												rx="10"
												fill={face === 1 && !game.isPalifico && game.currentBid?.face !== 1
													? '#78350f'
													: '#1e293b'}
												stroke={face === 1 && !game.isPalifico && game.currentBid?.face !== 1
													? '#d97706'
													: '#374151'}
												stroke-width="2"
											/>
											{#each PIP_COORDS[face] ?? [] as [cx, cy]}
												<circle {cx} {cy} r="6" fill="#e5e7eb" />
											{/each}
										</svg>
									{/each}
								{:else if !player.eliminated}
									{#each { length: player.diceCount } as _}
										<div
											class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-xs text-gray-600"
										>
											?
										</div>
									{/each}
								{/if}
							</div>

							<!-- Current turn / loser indicator -->
							{#if isCurrent}
								<span class="ml-auto text-xs font-bold text-amber-400"
									><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> TURN</span
								>
							{:else if isLoser && game.reveal && !game.reveal.calzaSuccess}
								<span class="ml-auto text-xs font-bold text-red-400"
									><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> LOSES</span
								>
							{:else if isLoser && game.reveal?.calzaSuccess}
								<span class="ml-auto text-xs font-bold text-emerald-400"
									><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> GAINS</span
								>
							{/if}
						</div>
					{/each}
				</div>

				<!-- DM player bid controls -->
				{#if dmRole === 'player' && game.status === 'bidding' && isMyTurn}
					<div class="rounded-xl border border-blue-700/50 bg-blue-950/20 px-4 py-4">
						<p class="mb-3 text-xs font-bold tracking-widest text-blue-400 uppercase">
							Your Turn — Place a Bid
						</p>
						<div class="flex flex-wrap items-end gap-3">
							<!-- Quantity -->
							<div class="flex flex-col gap-1">
								<span class="text-[10px] text-gray-500 uppercase">Quantity</span>
								<div class="flex items-center gap-1">
									<button
										onclick={() => (bidQty = Math.max(1, bidQty - 1))}
										class="h-8 w-8 rounded-lg bg-gray-700 font-bold text-gray-300 hover:bg-gray-600"
										>−</button
									>
									<span class="min-w-[2rem] text-center text-xl font-black text-white"
										>{bidQty}</span
									>
									<button
										onclick={() => bidQty++}
										class="h-8 w-8 rounded-lg bg-gray-700 font-bold text-gray-300 hover:bg-gray-600"
										>+</button
									>
								</div>
							</div>

							<!-- Face -->
							<div class="flex flex-col gap-1">
								<span class="text-[10px] text-gray-500 uppercase">Face</span>
								<div class="flex gap-1">
									{#each [1, 2, 3, 4, 5, 6] as f}
										<button
											onclick={() => (bidFace = f)}
											class="h-8 w-8 rounded-lg text-sm font-bold transition {bidFace === f
												? 'bg-amber-600 text-white'
												: 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">{f}</button
										>
									{/each}
								</div>
							</div>

							<!-- Action buttons -->
							<div class="flex gap-2">
								<button
									onclick={() =>
										post({ action: 'bid', playerId: 'dm', quantity: bidQty, face: bidFace })}
									disabled={!validBidQty()}
									class="rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white uppercase transition hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
								>
									Bid!
								</button>
								{#if game.currentBid}
									<button
										onclick={() => post({ action: 'dudo', playerId: 'dm' })}
										class="rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white uppercase transition hover:bg-red-600 active:scale-95"
									>
										<i class="fa-solid fa-dice" aria-hidden="true"></i> Liar!
									</button>
									<button
										onclick={() => post({ action: 'calza', playerId: 'dm' })}
										class="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white uppercase transition hover:bg-emerald-600 active:scale-95"
									>
										<i class="fa-solid fa-check" aria-hidden="true"></i> Calza
									</button>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<!-- Bid history -->
				{#if game.bidHistory.length > 0}
					<div class="rounded-xl border border-gray-700/40 bg-gray-800/20 px-3 py-3">
						<h4 class="mb-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
							Bid History
						</h4>
						<div class="flex flex-col gap-1">
							{#each game.bidHistory.slice().reverse() as bid, i}
								<div
									class="flex items-center gap-2 {i === 0
										? 'text-amber-300'
										: 'text-gray-500'} text-xs"
								>
									<span class="w-24 truncate font-semibold">{bid.playerName}</span>
									<span>{bid.quantity} × {faceName(bid.face)}s</span>
									{#if i === 0}<span class="ml-auto text-[10px] text-amber-600">latest</span>{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Event log -->
				<div class="rounded-xl border border-gray-700/40 bg-gray-800/20 px-3 py-3">
					<h4 class="mb-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase">Log</h4>
					<div class="flex flex-col gap-1 text-xs text-gray-400">
						{#each game.eventLog.slice().reverse().slice(0, 6) as entry}
							<p class="truncate">{entry.description}</p>
						{/each}
					</div>
				</div>
			</div>

			<!-- ── Game over ───────────────────────────────────────────────────────── -->
		{:else if game?.status === 'game_over'}
			<div class="flex flex-col items-center gap-4 py-6">
				<i class="fa-solid fa-trophy text-6xl" aria-hidden="true"></i>
				<h3 class="text-2xl font-black text-amber-300">{game.winnerName ?? 'Someone'} Wins!</h3>
				<p class="text-sm text-gray-400">
					Game lasted {game.roundNumber} round{game.roundNumber !== 1 ? 's' : ''}.
				</p>
				<button
					onclick={() => {
						post({ action: 'end_game' });
						lobbyCreated = false;
						game = null;
					}}
					class="mt-2 rounded-xl bg-gray-700 px-6 py-2.5 font-bold text-gray-200 transition hover:bg-gray-600"
				>
					Close
				</button>
			</div>
		{/if}

		{#if error}
			<p class="mt-3 text-center text-xs text-red-400">{error}</p>
		{/if}
	</div>

	<!-- Footer controls (in-game) -->
	{#if game && game.status !== 'lobby' && game.status !== 'game_over'}
		<div class="flex shrink-0 items-center justify-between border-t border-gray-700/60 px-6 py-3">
			{#if game.status === 'reveal'}
				<button
					onclick={() => post({ action: 'next_round' })}
					class="rounded-lg bg-amber-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
				>
					Next Round <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
				</button>
			{:else}
				<span class="text-xs text-gray-600">Round {game.roundNumber}</span>
			{/if}
			<button
				onclick={() => {
					if (confirm("End the Liar's Dice game?")) {
						post({ action: 'end_game' });
						lobbyCreated = false;
						game = null;
					}
				}}
				class="rounded-lg border border-gray-600 px-3 py-1.5 text-xs text-gray-400 transition hover:border-red-700 hover:text-red-400"
			>
				End Game
			</button>
		</div>
	{/if}
</div>
