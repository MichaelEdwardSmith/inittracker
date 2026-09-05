<!-- OBS Browser Source overlay at /overlay/[sessionId].
     Subscribes to the same SSE stream as the viewer display.
     Designed for a transparent OBS browser source — no background on html/body.
     Set the browser source to your stream resolution (e.g. 1920×1080). -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { sortCombatants, hpPercent } from '$lib/utils';
	import type { StorageState, Combatant } from '$lib/types';

	interface TickerEvent {
		id: string;
		text: string;
		icon: string;
		color: string;
		timestamp: number;
	}

	let { data } = $props();

	let combatState: StorageState = $state({ combatants: [], currentTurnId: null, round: 1 });
	let connected = $state(false);

	const conditionAbbrev: Record<string, string> = {
		Blinded: 'Blind',
		Charmed: 'Chrm',
		Concentrating: 'Conc',
		Deafened: 'Deaf',
		Dead: 'Dead',
		Exhausted: 'Exhst',
		Frightened: 'Frgtn',
		Grappled: 'Grpl',
		Incapacitated: 'Incap',
		Invisible: 'Invis',
		Paralyzed: 'Para',
		Petrified: 'Petri',
		Poisoned: 'Pois',
		Prone: 'Prone',
		Restrained: 'Rstr',
		Stunned: 'Stun',
		Unconscious: 'Uncon',
		'Advantage For': 'Adv ^',
		'Advantage Against': 'Adv v',
		'Disadvantage For': 'Dis ^',
		'Disadvantage Against': 'Dis v'
	};

	const conditionBg: Record<string, string> = {
		Blinded: '#4b5563',
		Charmed: '#9d174d',
		Concentrating: '#155e75',
		Deafened: '#92400e',
		Dead: '#111827',
		Exhausted: '#7c2d12',
		Frightened: '#6b21a8',
		Grappled: '#c2410c',
		Incapacitated: '#991b1b',
		Invisible: '#1e40af',
		Paralyzed: '#7f1d1d',
		Petrified: '#57534e',
		Poisoned: '#166534',
		Prone: '#78350f',
		Restrained: '#92400e',
		Stunned: '#854d0e',
		Unconscious: '#374151',
		'Advantage For': '#065f46',
		'Advantage Against': '#9f1239',
		'Disadvantage For': '#9a3412',
		'Disadvantage Against': '#134e4a'
	};

	$effect(() => {
		const source = new EventSource(`/api/state?session=${data.sessionId}`);
		source.onopen = () => (connected = true);
		source.onmessage = (e) => {
			try {
				combatState = JSON.parse(e.data) as StorageState;
			} catch {
				// ignore malformed messages
			}
		};
		source.onerror = () => (connected = false);
		return () => source.close();
	});

	// Visible combatants: skip lair pseudo-cards and benched players
	const visible = $derived(
		sortCombatants(combatState.combatants.filter((c) => c.type !== 'lair' && c.inCombat !== false))
	);

	const inCombat = $derived(visible.length > 0 && combatState.round > 0);

	const currentIndex = $derived(visible.findIndex((c) => c.id === combatState.currentTurnId));

	// Up to 6 next combatants for the full-width bottom bar
	const upNext = $derived.by<Combatant[]>(() => {
		if (currentIndex < 0 || visible.length <= 1) return [];
		const count = Math.min(6, visible.length - 1);
		return Array.from(
			{ length: count },
			(_, i) => visible[(currentIndex + i + 1) % visible.length]
		).filter((c) => !(c.type === 'enemy' && c.currentHp <= 0));
	});

	const wrapIndex = $derived.by<number | null>(() => {
		if (currentIndex < 0) return null;
		const count = Math.min(6, visible.length - 1);
		const idx = visible.length - currentIndex - 1;
		return idx < count ? idx : null;
	});

	const current = $derived(currentIndex >= 0 ? visible[currentIndex] : null);

	function hpLabel(c: Combatant): string {
		return `${c.currentHp + (c.tempHp ?? 0)}/${c.maxHp}`;
	}

	const avatarSrc = $derived(current ? (current.avatarUrl ?? current.imgUrl ?? null) : null);

	// ── Combat event ticker ──
	let tickerEvents = $state<TickerEvent[]>([]);
	let _prevState: StorageState | null = null;

	function toEventList(prev: StorageState, next: StorageState): TickerEvent[] {
		const events: TickerEvent[] = [];
		const ts = Date.now();

		if (next.round > prev.round) {
			events.push({
				id: `round-${next.round}-${ts}`,
				text: `Round ${next.round}`,
				icon: '<i class="fa-duotone fa-light fa-swords"></i>',
				color: '#fbbf24',
				timestamp: ts
			});
		}

		for (const c of next.combatants) {
			if (c.type === 'lair' || c.inCombat === false) continue;
			const p = prev.combatants.find((x) => x.id === c.id);
			if (!p) continue;

			const delta = c.currentHp - p.currentHp;
			if (delta < 0 && p.currentHp > 0) {
				if (c.currentHp <= 0) {
					events.push({
						id: `down-${c.id}-${ts}`,
						text: `${c.name} downed`,
						icon: '<i class="fa-duotone fa-light fa-xmark"></i>',
						color: '#9ca3af',
						timestamp: ts
					});
				} else {
					events.push({
						id: `dmg-${c.id}-${ts}`,
						text: `${c.name}  ${Math.abs(delta)} dmg`,
						icon: '<i class="fa-duotone fa-light fa-arrow-down"></i>',
						color: '#f87171',
						timestamp: ts
					});
				}
			} else if (delta > 0) {
				events.push({
					id: `heal-${c.id}-${ts}`,
					text: `${c.name}  +${delta} HP`,
					icon: '<i class="fa-duotone fa-light fa-arrow-up"></i>',
					color: '#4ade80',
					timestamp: ts
				});
			}

			for (const s of c.statuses) {
				if (!p.statuses.includes(s)) {
					events.push({
						id: `con-on-${c.id}-${s}-${ts}`,
						text: `${c.name} — ${conditionAbbrev[s] ?? s}`,
						icon: '<i class="fa-duotone fa-light fa-plus"></i>',
						color: '#e2e8f0',
						timestamp: ts
					});
				}
			}
			for (const s of p.statuses) {
				if (!c.statuses.includes(s)) {
					events.push({
						id: `con-off-${c.id}-${s}-${ts}`,
						text: `${c.name} — ${conditionAbbrev[s] ?? s} cleared`,
						icon: '<i class="fa-duotone fa-light fa-minus"></i>',
						color: '#6b7280',
						timestamp: ts
					});
				}
			}
		}

		return events;
	}

	// Detect changes on every state update, prepend new events to the top
	$effect(() => {
		const curr = combatState;
		if (_prevState) {
			const newEvents = toEventList(_prevState, curr);
			if (newEvents.length > 0) {
				untrack(() => {
					tickerEvents = [...newEvents, ...tickerEvents].slice(0, 5);
				});
			}
		}
		_prevState = JSON.parse(JSON.stringify(curr));
	});

	// Prune events older than 8 seconds
	$effect(() => {
		const timer = setInterval(() => {
			const now = Date.now();
			tickerEvents = tickerEvents.filter((e) => now - e.timestamp < 8000);
		}, 500);
		return () => clearInterval(timer);
	});
</script>

<svelte:head>
	<style>
		html,
		body {
			background: transparent !important;
			margin: 0;
			padding: 0;
			overflow: hidden;
			width: 100%;
			height: 100%;
		}
	</style>
</svelte:head>

<!-- Full-screen transparent canvas — OBS browser source fills this -->
<div class="screen">
	{#if !connected}
		<!-- Small connecting indicator top-left -->
		<div class="connecting-chip">
			<span class="dot-pulse"></span>
			Connecting…
		</div>
	{:else if inCombat}
		<!-- ── Left column: Now Acting + event ticker ── -->
		<div class="left-stack">
			{#if current}
				{#key current.id}
					{@const pct = hpPercent(current)}
					<aside class="side-panel">
						<div class="header">
							<i class="fa-duotone fa-light fa-swords sword" aria-hidden="true"></i>
							<span class="round-label">ROUND {combatState.round}</span>
							<span class="type-badge {current.type === 'player' ? 'badge-pc' : 'badge-npc'}">
								{current.type === 'player' ? 'PC' : 'NPC'}
							</span>
						</div>

						<div class="current-body">
							<div class="now-acting-label">Now Acting</div>
							<div class="current-main">
								{#if avatarSrc}
									<div class="avatar-wrap">
										<img src={avatarSrc} alt={current.name} class="avatar-img" />
									</div>
								{/if}
								<div class="current-info">
									<div class="current-name">{current.name}</div>

									{#if current.maxHp > 0}
										<div class="current-hp-row">
											<span
												class="current-hp-num"
												style="color:{pct <= 0
													? '#6b7280'
													: pct <= 25
														? '#f87171'
														: pct <= 50
															? '#fbbf24'
															: '#4ade80'}">{hpLabel(current)}</span
											>
											<span class="current-hp-label">HP</span>
										</div>
										<div class="current-hp-track">
											<div
												class="current-hp-fill"
												style="width:{pct}%;background:{pct <= 0
													? '#374151'
													: pct <= 25
														? '#dc2626'
														: pct <= 50
															? '#d97706'
															: '#16a34a'}"
											></div>
											{#if current.tempHp > 0}
												<div
													class="current-hp-temp"
													style="width:{Math.min(100, (current.tempHp / current.maxHp) * 100)}%"
												></div>
											{/if}
										</div>
									{/if}

									{#if current.statuses.length > 0}
										<div class="current-badges">
											{#each current.statuses as status}
												<span class="badge" style="background:{conditionBg[status] ?? '#374151'}"
													>{conditionAbbrev[status] ?? status}</span
												>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</div>
					</aside>
				{/key}
			{/if}

			<!-- ── Event ticker ── -->
			{#if tickerEvents.length > 0}
				<div class="ticker-panel">
					{#each tickerEvents as event (event.id)}
						<div class="ticker-row" style="--event-color:{event.color}">
							<span class="ticker-icon">{@html event.icon}</span>
							<span class="ticker-text">{event.text}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- ── Up Next bar (full-width, bottom of screen) ── -->
		{#if upNext.length > 0}
			<footer class="up-next-bar">
				<div class="un-label-group">
					<span class="un-label">Up Next</span>
					<i class="fa-duotone fa-light fa-square-arrow-right un-arrow" aria-hidden="true"></i>
				</div>

				<div class="un-cards">
					{#each upNext as c, i}
						{@const pct = hpPercent(c)}
						{#if i === wrapIndex}
							<div class="wrap-divider">
								<div class="wrap-line"></div>
								<span class="wrap-text">Next Round</span>
								<div class="wrap-line"></div>
							</div>
						{/if}
						<div class="un-card {c.type === 'player' ? 'un-player' : 'un-enemy'}">
							<div class="un-top">
								<span class="un-type-badge {c.type === 'player' ? 'badge-pc' : 'badge-npc'}"
									>{c.type === 'player' ? 'PC' : 'NPC'}</span
								>
								<span class="un-name">{c.name}</span>
								{#if c.type === 'enemy' && pct <= 50 && pct > 0}
									<i class="fa-duotone fa-light fa-droplet" title="Bloodied" aria-hidden="true"></i>
								{/if}
								{#if c.initiative !== null}
									<span class="un-init">{c.initiative}</span>
								{/if}
							</div>
							<div class="un-bar-track">
								<div
									class="un-bar-fill"
									style="width:{pct}%;background:{pct <= 0
										? '#374151'
										: pct <= 25
											? '#dc2626'
											: pct <= 50
												? '#d97706'
												: '#16a34a'}"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</footer>
		{/if}
	{/if}
</div>

<style>
	* {
		box-sizing: border-box;
	}

	/* Full-screen transparent canvas */
	.screen {
		position: fixed;
		inset: 0;
		font-family: 'Segoe UI', system-ui, sans-serif;
		pointer-events: none;
	}

	/* ── Connecting chip ── */
	.connecting-chip {
		position: absolute;
		top: 20px;
		left: 20px;
		display: flex;
		align-items: center;
		gap: 10px;
		background: rgba(6, 8, 24, 0.85);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 9px;
		padding: 10px 16px;
		color: rgba(255, 255, 255, 0.4);
		font-size: 15px;
	}

	/* ── Left column stack ── */
	.left-stack {
		position: absolute;
		top: 20px;
		left: 20px;
		width: 290px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	/* ── Side panel ── */
	.side-panel {
		background: rgba(6, 8, 24, 0.88);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		overflow: hidden;
		backdrop-filter: blur(4px);
		animation: turn-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	/* ── Event ticker ── */
	.ticker-panel {
		background: rgba(6, 8, 24, 0.82);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 10px;
		overflow: hidden;
		backdrop-filter: blur(4px);
	}

	.ticker-row {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 7px 14px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		animation: event-in 0.25s ease both;
	}

	.ticker-row:last-child {
		border-bottom: none;
	}

	.ticker-icon {
		font-size: 11px;
		font-weight: 800;
		color: var(--event-color);
		flex-shrink: 0;
		width: 13px;
		text-align: center;
		line-height: 1;
	}

	.ticker-text {
		font-size: 13px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.7);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@keyframes event-in {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes turn-in {
		from {
			opacity: 0;
			transform: translateX(-18px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateX(0) scale(1);
		}
	}

	.header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 11px 16px 10px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
		background: rgba(255, 255, 255, 0.03);
	}

	.sword {
		opacity: 0.5;
		font-size: 16px;
	}

	.round-label {
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: rgba(251, 191, 36, 0.9);
		text-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
		flex: 1;
	}

	.type-badge {
		font-size: 10px;
		font-weight: 800;
		padding: 2px 6px;
		border-radius: 4px;
		letter-spacing: 0.05em;
		flex-shrink: 0;
	}

	.badge-pc {
		background: rgba(30, 64, 175, 0.6);
		color: #93c5fd;
	}

	.badge-npc {
		background: rgba(127, 29, 29, 0.6);
		color: #fca5a5;
	}

	/* Currently Up card body */
	.current-body {
		padding: 14px 16px 16px;
	}

	.now-acting-label {
		font-size: 10px;
		font-weight: 900;
		letter-spacing: 0.25em;
		text-transform: uppercase;
		color: rgba(251, 191, 36, 0.6);
		margin-bottom: 8px;
	}

	.current-main {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.avatar-wrap {
		flex-shrink: 0;
		width: 58px;
		height: 58px;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.05);
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.current-info {
		flex: 1;
		min-width: 0;
	}

	.current-name {
		font-size: 20px;
		font-weight: 700;
		color: #f8fafc;
		text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.15;
		margin-bottom: 10px;
	}

	.current-hp-row {
		display: flex;
		align-items: baseline;
		gap: 5px;
		margin-bottom: 6px;
	}

	.current-hp-num {
		font-size: 18px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
	}

	.current-hp-label {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.3);
		text-transform: uppercase;
	}

	.current-hp-track {
		position: relative;
		height: 7px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
	}

	.current-hp-fill {
		height: 100%;
		border-radius: 4px;
		transition:
			width 0.4s ease,
			background 0.4s ease;
	}

	.current-hp-temp {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: #2dd4bf;
		border-radius: 4px;
		opacity: 0.7;
		transition: width 0.4s ease;
	}

	.current-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 10px;
	}

	.badge {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: rgba(255, 255, 255, 0.9);
		padding: 2px 5px;
		border-radius: 3px;
	}

	/* ── Up Next bar ── */
	.up-next-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 14px 32px;
		background: rgba(6, 8, 24, 0.9);
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(6px);
	}

	.un-label-group {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.un-label {
		font-size: 12px;
		font-weight: 900;
		letter-spacing: 0.25em;
		color: rgba(107, 114, 128, 0.9);
		text-transform: uppercase;
		white-space: nowrap;
	}

	.un-arrow {
		font-size: 12px;
		color: rgba(107, 114, 128, 0.4);
	}

	.un-cards {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	.wrap-divider {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.wrap-line {
		width: 1px;
		height: 34px;
		background: rgba(251, 191, 36, 0.25);
	}

	.wrap-text {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.15em;
		color: rgba(251, 191, 36, 0.5);
		text-transform: uppercase;
		white-space: nowrap;
	}

	.un-card {
		flex: 1;
		min-width: 0;
		max-width: 240px;
		padding: 8px 12px 9px;
		border-radius: 8px;
		border: 1px solid;
	}

	.un-player {
		border-color: rgba(59, 130, 246, 0.35);
		background: rgba(30, 58, 138, 0.3);
	}

	.un-enemy {
		border-color: rgba(185, 28, 28, 0.35);
		background: rgba(69, 10, 10, 0.3);
	}

	.un-top {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 6px;
	}

	.un-type-badge {
		font-size: 10px;
		font-weight: 800;
		padding: 2px 5px;
		border-radius: 3px;
		flex-shrink: 0;
		letter-spacing: 0.05em;
	}

	.badge-pc {
		background: rgba(30, 64, 175, 0.6);
		color: #93c5fd;
	}

	.badge-npc {
		background: rgba(127, 29, 29, 0.6);
		color: #fca5a5;
	}

	.un-name {
		flex: 1;
		font-size: 15px;
		font-weight: 600;
		color: #f1f5f9;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
		min-width: 0;
	}

	.un-init {
		font-size: 13px;
		font-weight: 700;
		color: rgba(251, 191, 36, 0.7);
		flex-shrink: 0;
		font-variant-numeric: tabular-nums;
	}

	.un-bar-track {
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
	}

	.un-bar-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 0.4s ease;
	}

	/* ── Connecting pulse dot ── */
	.dot-pulse {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		animation: pulse 1.4s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.3;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.3);
		}
	}
</style>
