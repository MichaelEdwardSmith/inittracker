<!-- DM combat chronicle page (/history). Displays all past CombatRecords for the active
     game session; supports expanding individual encounters to see the turn log, XP totals,
     participant summaries, and the ability to delete individual records or clear all history. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import type { CombatRecord, CombatEvent } from '$lib/types';
	import { crToXp } from '$lib/utils';

	let { data } = $props();
	let expanded = $state<Set<string>>(new Set());

	function toggle(id: string) {
		const next = new Set(expanded);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		expanded = next;
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString(undefined, {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function durationMinutes(start: string, end: string) {
		const ms = new Date(end).getTime() - new Date(start).getTime();
		const min = Math.round(ms / 60000);
		return min < 1 ? '<1 min' : `${min} min`;
	}

	function toRoman(n: number): string {
		const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
		const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
		let result = '';
		for (let i = 0; i < vals.length; i++) {
			while (n >= vals[i]) {
				result += syms[i];
				n -= vals[i];
			}
		}
		return result;
	}

	function hpBarWidth(hp: number, max: number): number {
		return max > 0 ? Math.max(0, Math.min(100, (hp / max) * 100)) : 0;
	}

	function hpBgColor(hp: number, max: number): string {
		const pct = max > 0 ? hp / max : 0;
		if (pct <= 0) return 'bg-gray-700';
		if (pct <= 0.25) return 'bg-red-600';
		if (pct <= 0.5) return 'bg-amber-500';
		return 'bg-green-600';
	}

	function hpTextColor(hp: number, max: number): string {
		const pct = max > 0 ? hp / max : 0;
		if (pct <= 0) return 'text-gray-500';
		if (pct <= 0.25) return 'text-red-400';
		if (pct <= 0.5) return 'text-amber-400';
		return 'text-green-400';
	}

	// Group events by round, excluding round_advance separators
	function groupByRound(events: CombatEvent[]): Map<number, CombatEvent[]> {
		const map = new Map<number, CombatEvent[]>();
		for (const e of events) {
			if (e.type === 'round_advance') continue;
			const arr = map.get(e.round) ?? [];
			arr.push(e);
			map.set(e.round, arr);
		}
		return map;
	}

	function eventIcon(e: CombatEvent): string {
		if (e.causedDown) return '☠';
		switch (e.type) {
			case 'damage':
				return '⚔';
			case 'heal':
				return '♥';
			case 'down':
				return '☠';
			case 'condition_add':
				return '✦';
			case 'condition_remove':
				return '✧';
			default:
				return '·';
		}
	}

	function eventColor(e: CombatEvent): string {
		if (e.causedDown) return 'text-red-300';
		switch (e.type) {
			case 'damage':
				return 'text-red-400';
			case 'heal':
				return 'text-green-400';
			case 'down':
				return 'text-red-300';
			case 'condition_add':
				return 'text-purple-400';
			case 'condition_remove':
				return 'text-purple-300/70';
			default:
				return 'text-gray-400';
		}
	}

	function eventDesc(e: CombatEvent): string {
		const actor = e.actorName;
		const target = e.combatantName;
		const isSelf = !actor || e.actorId === e.combatantId;

		switch (e.type) {
			case 'damage': {
				const hpNote = `(${e.hpBefore} → ${e.hpAfter} HP)`;
				let line = isSelf
					? `${target} took ${e.value} damage ${hpNote}`
					: `${actor} dealt ${e.value} damage to ${target} ${hpNote}`;
				if (e.causedDown) {
					const suffix =
						e.combatantType === 'player'
							? `${target} was knocked unconscious!`
							: `${target} was slain!`;
					line += ` — ${suffix}`;
				}
				return line;
			}
			case 'heal':
				return isSelf
					? `${target} recovered ${e.value} HP (${e.hpBefore} → ${e.hpAfter} HP)`
					: `${actor} healed ${target} for ${e.value} HP (${e.hpBefore} → ${e.hpAfter} HP)`;
			case 'down':
				// Legacy records before causedDown was introduced
				return e.combatantType === 'player'
					? `${target} was knocked unconscious!`
					: `${target} was slain!`;
			case 'condition_add':
				return isSelf
					? `${target} became ${e.condition}`
					: `${actor} inflicted ${e.condition} on ${target}`;
			case 'condition_remove':
				return `${target} shook off ${e.condition}`;
			default:
				return '';
		}
	}

	let records = $state<CombatRecord[]>(untrack(() => data.records));
	let exportingId = $state<string | null>(null);
	let confirmDeleteId = $state<string | null>(null);
	let confirmClearAll = $state(false);
	let confirmTimer: ReturnType<typeof setTimeout> | null = null;

	// ── Search / filter / sort ─────────────────────────────────────────────────
	let searchQuery = $state('');
	let filterCasualties = $state<'all' | 'with' | 'without'>('all');
	let sortBy = $state<'newest' | 'oldest' | 'rounds' | 'xp'>('newest');

	// Preserve original encounter numbers (newest = highest, oldest = 1)
	let indexedRecords = $derived(records.map((r, i) => ({ record: r, num: records.length - i })));

	let filteredRecords = $derived.by(() => {
		let result = indexedRecords;

		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			result = result.filter(({ record }) =>
				record.participants.some((p) => p.name.toLowerCase().includes(q))
			);
		}

		if (filterCasualties === 'with') {
			result = result.filter(({ record }) => record.participants.some((p) => p.wasSlain));
		} else if (filterCasualties === 'without') {
			result = result.filter(({ record }) => !record.participants.some((p) => p.wasSlain));
		}

		if (sortBy === 'oldest') {
			result = [...result].reverse();
		} else if (sortBy === 'rounds') {
			result = [...result].sort((a, b) => b.record.rounds - a.record.rounds);
		} else if (sortBy === 'xp') {
			result = [...result].sort((a, b) => (b.record.totalXp ?? 0) - (a.record.totalXp ?? 0));
		}

		return result;
	});

	// ── Campaign stats ─────────────────────────────────────────────────────────
	let statTotalRounds = $derived(records.reduce((s, r) => s + r.rounds, 0));
	let statTotalXp = $derived(records.reduce((s, r) => s + (r.totalXp ?? 0), 0));
	let statEnemiesSlain = $derived(
		records.reduce(
			(s, r) => s + r.participants.filter((p) => p.type === 'enemy' && p.wasSlain).length,
			0
		)
	);
	let statPlayersFallen = $derived(
		records.reduce(
			(s, r) => s + r.participants.filter((p) => p.type === 'player' && p.wasSlain).length,
			0
		)
	);
	let statCombatMinutes = $derived(
		records.reduce((s, r) => {
			const ms = new Date(r.endedAt).getTime() - new Date(r.startedAt).getTime();
			return s + Math.round(ms / 60000);
		}, 0)
	);

	function formatCombatTime(minutes: number): string {
		if (minutes < 1) return '<1 min';
		if (minutes < 60) return `${minutes} min`;
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	}

	function armConfirm(id: string | 'all') {
		if (confirmTimer) clearTimeout(confirmTimer);
		if (id === 'all') {
			confirmClearAll = true;
			confirmDeleteId = null;
		} else {
			confirmDeleteId = id;
			confirmClearAll = false;
		}
		confirmTimer = setTimeout(() => {
			confirmDeleteId = null;
			confirmClearAll = false;
		}, 3000);
	}

	async function handleExport(record: CombatRecord, num: number) {
		exportingId = record.id;
		try {
			const { exportChronicle } = await import('$lib/pdfExport');
			await exportChronicle(record, num);
		} catch (err) {
			console.error('PDF export failed:', err);
		} finally {
			exportingId = null;
		}
	}

	async function deleteRecord(id: string) {
		await fetch(`/api/history?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
		records = records.filter((r) => r.id !== id);
		expanded.delete(id);
		confirmDeleteId = null;
	}

	async function clearAll() {
		await fetch('/api/history', { method: 'DELETE' });
		records = [];
		expanded = new Set();
		confirmClearAll = false;
	}
</script>

<div class="min-h-screen bg-gray-950 text-white">
	<div aria-hidden="true" class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
		<div class="bg-orb orb-1"></div>
		<div class="bg-orb orb-2"></div>
		<div class="bg-orb orb-3"></div>
		<div class="bg-orb orb-4"></div>
	</div>

	<!-- Header -->
	<header
		class="sticky top-0 z-10 flex items-center border-b border-gray-800 bg-gray-900/95 px-6 py-3 backdrop-blur"
	>
		<div class="flex items-center gap-2">
			<span class="text-amber-500">⚔</span>
			<h1 class="text-lg font-bold tracking-widest text-amber-400 uppercase">Combat Chronicles</h1>
		</div>
		<span class="ml-3 rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
			{records.length}
			{records.length === 1 ? 'encounter' : 'encounters'}
		</span>
		<a
			href="/dashboard"
			aria-label="Back to Dashboard"
			class="ml-auto rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition hover:border-gray-500 hover:text-white"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</a>
	</header>

	<main class="mx-auto max-w-3xl px-4 py-8">
		{#if records.length === 0}
			<!-- Empty state -->
			<div class="flex flex-col items-center justify-center py-24 text-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mb-4 h-16 w-16 text-gray-800"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
					/>
				</svg>
				<p class="text-xl font-semibold text-gray-700">No battles recorded yet</p>
				<p class="mt-2 text-sm text-gray-600">
					End a combat or save to chronicle to begin your history.
				</p>
			</div>
		{:else}
			<!-- ── Campaign Stats ──────────────────────────────────────────────── -->
			<div class="mb-8 overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
				<div class="flex items-center justify-between border-b border-gray-800/60 px-5 py-3">
					<span class="text-xs font-bold tracking-widest text-amber-600/80 uppercase"
						>Campaign Overview</span
					>
					{#if confirmClearAll}
						<button
							onclick={clearAll}
							class="rounded border border-red-700 bg-red-900/40 px-3 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-800"
						>
							Erase all? This cannot be undone.
						</button>
					{:else}
						<button
							onclick={() => armConfirm('all')}
							class="rounded border border-gray-700 bg-gray-800 px-3 py-1 text-xs text-gray-500 transition hover:border-red-800 hover:text-red-400"
						>
							Clear All
						</button>
					{/if}
				</div>
				<div class="grid grid-cols-3 divide-x divide-gray-800 sm:grid-cols-6">
					<div class="flex flex-col items-center gap-0.5 px-4 py-4">
						<span class="text-2xl font-bold text-white">{records.length}</span>
						<span class="text-center text-xs text-gray-500">Encounters</span>
					</div>
					<div class="flex flex-col items-center gap-0.5 px-4 py-4">
						<span class="text-2xl font-bold text-amber-400">{statTotalRounds}</span>
						<span class="text-center text-xs text-gray-500">Rounds</span>
					</div>
					<div class="flex flex-col items-center gap-0.5 px-4 py-4">
						<span class="text-2xl font-bold text-amber-300"
							>{statTotalXp > 0 ? statTotalXp.toLocaleString() : '—'}</span
						>
						<span class="text-center text-xs text-gray-500">XP Earned</span>
					</div>
					<div class="flex flex-col items-center gap-0.5 px-4 py-4">
						<span class="text-2xl font-bold text-red-400">{statEnemiesSlain}</span>
						<span class="text-center text-xs text-gray-500">Enemies Slain</span>
					</div>
					<div class="flex flex-col items-center gap-0.5 px-4 py-4">
						<span
							class="text-2xl font-bold {statPlayersFallen > 0
								? 'text-orange-400'
								: 'text-green-500'}">{statPlayersFallen}</span
						>
						<span class="text-center text-xs text-gray-500">Players Fallen</span>
					</div>
					<div class="flex flex-col items-center gap-0.5 px-4 py-4">
						<span class="text-2xl font-bold text-blue-400"
							>{formatCombatTime(statCombatMinutes)}</span
						>
						<span class="text-center text-xs text-gray-500">Combat Time</span>
					</div>
				</div>
			</div>

			<!-- ── Search & Filter ────────────────────────────────────────────── -->
			<div class="mb-6 flex flex-col gap-3">
				<!-- Search input -->
				<div class="relative">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-4.35-4.35M17 11A6 6 0 1 0 5 11a6 6 0 0 0 12 0z"
						/>
					</svg>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search by combatant name…"
						class="w-full rounded-lg border border-gray-700 bg-gray-900 py-2 pr-4 pl-9 text-sm text-gray-200 placeholder-gray-600 transition outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-800"
					/>
					{#if searchQuery}
						<button
							onclick={() => (searchQuery = '')}
							title="Clear search"
							class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-600 hover:text-gray-400"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-3.5 w-3.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					{/if}
				</div>

				<!-- Filter pills + sort -->
				<div class="flex flex-wrap items-center gap-2">
					<!-- Casualty filter pills -->
					<div class="flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900 p-1">
						{#each [['all', 'All'], ['with', 'Casualties'], ['without', 'No Casualties']] as [val, label]}
							<button
								onclick={() => (filterCasualties = val as typeof filterCasualties)}
								class="rounded px-3 py-1 text-xs font-medium transition
									{filterCasualties === val ? 'bg-amber-700/40 text-amber-300' : 'text-gray-500 hover:text-gray-300'}"
							>
								{label}
							</button>
						{/each}
					</div>

					<!-- Sort dropdown -->
					<div class="ml-auto flex items-center gap-2">
						<span class="text-xs text-gray-600">Sort:</span>
						<select
							bind:value={sortBy}
							class="rounded-lg border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-gray-300 transition outline-none focus:border-amber-700"
						>
							<option value="newest">Newest First</option>
							<option value="oldest">Oldest First</option>
							<option value="rounds">Most Rounds</option>
							<option value="xp">Most XP</option>
						</select>
					</div>
				</div>

				<!-- Result count when filtering -->
				{#if searchQuery || filterCasualties !== 'all'}
					<p class="text-xs text-gray-600">
						Showing {filteredRecords.length} of {records.length} encounters
					</p>
				{/if}
			</div>

			{#if filteredRecords.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-center">
					<p class="text-base font-semibold text-gray-700">No encounters match your search</p>
					<button
						onclick={() => {
							searchQuery = '';
							filterCasualties = 'all';
						}}
						class="mt-3 text-xs text-amber-700 hover:text-amber-500"
					>
						Clear filters
					</button>
				</div>
			{:else}
				<div class="flex flex-col gap-6">
					{#each filteredRecords as { record, num } (record.id)}
						{@const roundsLabel = `${record.rounds} ${record.rounds === 1 ? 'round' : 'rounds'}`}
						{@const isExpanded = expanded.has(record.id)}
						{@const grouped = groupByRound(record.events)}
						{@const slain = record.participants.filter((p) => p.wasSlain)}
						{@const players = record.participants.filter((p) => p.type === 'player')}
						{@const enemies = record.participants.filter((p) => p.type === 'enemy')}

						<article
							class="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-lg shadow-black/40"
						>
							<!-- Card header -->
							<div class="border-b border-gray-800/60 bg-gray-900 px-5 py-4">
								<div class="flex flex-wrap items-start justify-between gap-2">
									<div>
										<div class="flex items-center gap-2">
											<span
												class="font-serif text-xs font-bold tracking-[0.2em] text-amber-600/80 uppercase"
											>
												Encounter {toRoman(num)}
											</span>
											<span class="h-px flex-1 bg-amber-900/30"></span>
										</div>
										<h2 class="mt-1 text-base font-bold text-white">
											{#if enemies.length > 0}
												{enemies
													.map((e) => e.name)
													.slice(0, 3)
													.join(', ')}{enemies.length > 3 ? ` +${enemies.length - 3} more` : ''}
											{:else}
												Unknown Enemies
											{/if}
										</h2>
									</div>
									<div class="flex items-start gap-3">
										<div class="flex flex-col items-end gap-0.5 text-right">
											<span class="text-xs font-semibold text-gray-400"
												>{formatDate(record.startedAt)}</span
											>
											<span class="text-xs text-gray-600"
												>{formatTime(record.startedAt)} · {durationMinutes(
													record.startedAt,
													record.endedAt
												)}</span
											>
										</div>
										<!-- PDF export button -->
										<button
											onclick={() => handleExport(record, num)}
											disabled={exportingId === record.id}
											title="Export to PDF"
											class="shrink-0 rounded p-1 text-gray-700 transition hover:bg-gray-800 hover:text-amber-400 disabled:opacity-40"
										>
											{#if exportingId === record.id}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-4 w-4 animate-spin"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 12a8 8 0 018-8V4"
													/>
												</svg>
											{:else}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
													/>
												</svg>
											{/if}
										</button>
										<!-- Delete button -->
										{#if confirmDeleteId === record.id}
											<button
												onclick={() => deleteRecord(record.id)}
												class="shrink-0 rounded border border-red-700 bg-red-900/40 px-2 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-800"
											>
												Delete?
											</button>
										{:else}
											<button
												onclick={() => armConfirm(record.id)}
												title="Delete this encounter"
												class="shrink-0 rounded p-1 text-gray-700 transition hover:bg-gray-800 hover:text-red-400"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
											</button>
										{/if}
									</div>
								</div>

								<!-- Stats row -->
								<div class="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
									<span class="flex items-center gap-1">
										<span class="text-amber-600">◈</span>
										{roundsLabel}
									</span>
									<span class="flex items-center gap-1">
										<span class="text-blue-600">🛡</span>
										{players.length}
										{players.length === 1 ? 'player' : 'players'}
									</span>
									{#if slain.length > 0}
										<span class="flex items-center gap-1 text-red-500">
											<span>☠</span>
											{slain.length} slain
										</span>
									{:else}
										<span class="flex items-center gap-1 text-green-600">
											<span>✓</span>
											No casualties
										</span>
									{/if}
									<span class="flex items-center gap-1">
										<span>📜</span>
										{record.events.filter((e) => e.type !== 'round_advance').length} events
									</span>
									{#if record.totalXp !== undefined}
										<span class="flex items-center gap-1 text-amber-500">
											<span>✦</span>
											{record.totalXp.toLocaleString()} XP
										</span>
									{/if}
								</div>
							</div>

							<!-- Participants -->
							<div class="px-5 py-3">
								<div class="flex flex-col gap-2">
									{#each record.participants as p (p.id)}
										{@const startPct = hpBarWidth(p.startHp, p.maxHp)}
										{@const finalPct = hpBarWidth(p.finalHp, p.maxHp)}
										<div class="flex items-center gap-3">
											<!-- Type badge -->
											<span
												class="w-8 shrink-0 rounded px-1 py-0.5 text-center text-xs font-bold
											       {p.type === 'player' ? 'bg-blue-900/50 text-blue-400' : 'bg-red-900/50 text-red-400'}"
											>
												{p.type === 'player' ? 'PC' : 'NPC'}
											</span>
											<!-- Name -->
											<span
												class="w-28 shrink-0 truncate text-sm {p.wasSlain
													? 'text-gray-600 line-through'
													: 'text-gray-200'}"
											>
												{p.name}
											</span>
											<!-- HP bar -->
											<div class="relative flex-1">
												<div class="h-2 w-full overflow-hidden rounded-full bg-gray-800">
													<!-- Start HP (ghost) -->
													<div
														class="absolute top-0 h-full rounded-full opacity-20 {hpBgColor(
															p.startHp,
															p.maxHp
														)}"
														style="width: {startPct}%"
													></div>
													<!-- Final HP -->
													<div
														class="h-full rounded-full transition-all {hpBgColor(
															p.finalHp,
															p.maxHp
														)}"
														style="width: {finalPct}%"
													></div>
												</div>
											</div>
											<!-- HP numbers -->
											<div class="w-24 shrink-0 text-right text-xs">
												{#if p.wasSlain}
													<span class="font-bold text-red-500">☠ Slain</span>
												{:else}
													<span class="text-gray-500">{p.startHp}</span>
													<span class="text-gray-700"> → </span>
													<span class={hpTextColor(p.finalHp, p.maxHp)}>{p.finalHp}</span>
													<span class="text-gray-700"> / {p.maxHp}</span>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							</div>

							<!-- Expand toggle -->
							{#if record.events.filter((e) => e.type !== 'round_advance').length > 0}
								<div class="border-t border-gray-800/60">
									<button
										onclick={() => toggle(record.id)}
										class="flex w-full items-center justify-between px-5 py-2.5 text-xs text-gray-500 transition hover:bg-gray-800/40 hover:text-gray-300"
									>
										<span class="font-semibold tracking-wider uppercase">
											{isExpanded ? 'Hide Chronicle' : 'Show Chronicle'}
										</span>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4 transition-transform {isExpanded ? 'rotate-180' : ''}"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									</button>

									{#if isExpanded}
										{@const slainWithCr = record.participants.filter(
											(p) => p.wasSlain && p.cr !== undefined
										)}
										{@const slainWithLoot = record.participants.filter(
											(p) => p.wasSlain && p.loot?.length
										)}
										<div class="border-t border-gray-800/40 bg-gray-950/60 px-5 py-4">
											<!-- Loot -->
											{#if slainWithLoot.length > 0}
												<div class="mb-5">
													<div class="mb-2 flex items-center gap-2">
														<span
															class="text-xs font-bold tracking-widest text-amber-700/80 uppercase"
															>Loot</span
														>
														<div class="h-px flex-1 bg-amber-900/20"></div>
													</div>
													<div class="flex flex-col gap-3 pl-2">
														{#each slainWithLoot as p}
															<div>
																<div class="mb-1 flex items-center gap-2 text-xs">
																	<span class="w-4 shrink-0 text-center text-red-400">☠</span>
																	<span class="font-semibold text-gray-300">{p.name}</span>
																</div>
																<div class="flex flex-col gap-0.5 pl-6">
																	{#each p.loot! as item}
																		<div class="flex items-center gap-2 text-xs text-gray-400">
																			<span class="text-amber-600">•</span>
																			<span>{item.quantity}× {item.name}</span>
																		</div>
																	{/each}
																</div>
															</div>
														{/each}
													</div>
												</div>
											{/if}
											<!-- XP Breakdown -->
											{#if slainWithCr.length > 0}
												<div class="mb-5">
													<div class="mb-2 flex items-center gap-2">
														<span
															class="text-xs font-bold tracking-widest text-amber-700/80 uppercase"
															>Experience</span
														>
														<div class="h-px flex-1 bg-amber-900/20"></div>
													</div>
													<div class="flex flex-col gap-1 pl-2">
														{#each slainWithCr as p}
															<div class="flex items-center gap-2 text-xs">
																<span class="w-4 shrink-0 text-center text-red-400">☠</span>
																<span class="flex-1 text-gray-400">{p.name}</span>
																<span class="text-gray-600">CR {p.cr}</span>
																<span class="w-20 text-right font-mono text-amber-500/80"
																	>{crToXp(p.cr!).toLocaleString()} XP</span
																>
															</div>
														{/each}
														<div
															class="mt-1.5 flex items-center gap-2 border-t border-gray-800/60 pt-1.5 text-xs"
														>
															<span class="w-4 shrink-0"></span>
															<span class="flex-1 font-semibold text-amber-400">Total XP</span>
															<span class="w-20 text-right font-mono font-bold text-amber-400"
																>{record.totalXp!.toLocaleString()} XP</span
															>
														</div>
														{#if players.length > 1}
															<div class="flex items-center gap-2 text-xs text-gray-600">
																<span class="w-4 shrink-0"></span>
																<span class="flex-1">Split {players.length} ways</span>
																<span class="w-20 text-right font-mono"
																	>{Math.floor(record.totalXp! / players.length).toLocaleString()} XP
																	ea.</span
																>
															</div>
														{/if}
													</div>
												</div>
											{/if}
											{#each [...grouped.entries()].sort(([a], [b]) => a - b) as [roundNum, events]}
												<div class="mb-4 last:mb-0">
													<!-- Round divider -->
													<div class="mb-2 flex items-center gap-2">
														<span
															class="text-xs font-bold tracking-widest text-amber-700/80 uppercase"
															>Round {roundNum}</span
														>
														<div class="h-px flex-1 bg-amber-900/20"></div>
													</div>
													<!-- Events -->
													<div class="flex flex-col gap-1 pl-2">
														{#each events as e}
															<div class="flex items-start gap-2 text-xs">
																<span class="mt-0.5 w-4 shrink-0 text-center {eventColor(e)}">
																	{eventIcon(e)}
																</span>
																<span
																	class="{eventColor(e)} {e.causedDown || e.type === 'down'
																		? 'font-semibold'
																		: ''}"
																>
																	{eventDesc(e)}
																</span>
															</div>
														{/each}
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						</article>
					{/each}
				</div>
			{/if}
		{/if}
	</main>
</div>

<style>
	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(90px);
	}
	.orb-1 {
		width: min(65vw, 700px); height: min(65vw, 700px);
		background: rgba(88, 28, 135, 0.45);
		top: -15%; left: -12%;
		animation: orb-drift-1 24s ease-in-out infinite;
	}
	.orb-2 {
		width: min(55vw, 620px); height: min(55vw, 620px);
		background: rgba(30, 58, 138, 0.45);
		bottom: -18%; right: -10%;
		animation: orb-drift-2 30s ease-in-out infinite;
	}
	.orb-3 {
		width: min(45vw, 520px); height: min(45vw, 520px);
		background: rgba(120, 53, 15, 0.35);
		top: 35%; left: 42%;
		transform: translate(-50%, -50%);
		animation: orb-drift-3 20s ease-in-out infinite;
	}
	.orb-4 {
		width: min(38vw, 440px); height: min(38vw, 440px);
		background: rgba(49, 46, 129, 0.4);
		top: 15%; right: 18%;
		animation: orb-drift-4 26s ease-in-out infinite;
	}
	@keyframes orb-drift-1 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		25%       { transform: translate(8vw, 6vh) scale(1.06); }
		55%       { transform: translate(3vw, 12vh) scale(0.94); }
		75%       { transform: translate(-3vw, 7vh) scale(1.03); }
	}
	@keyframes orb-drift-2 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		30%      { transform: translate(-7vw, -9vh) scale(1.08); }
		65%      { transform: translate(-2vw, -4vh) scale(0.92); }
	}
	@keyframes orb-drift-3 {
		0%, 100% { transform: translate(-50%, -50%) scale(1); }
		40%      { transform: translate(calc(-50% + 7vw), calc(-50% - 9vh)) scale(1.1); }
		70%      { transform: translate(calc(-50% - 5vw), calc(-50% + 5vh)) scale(0.9); }
	}
	@keyframes orb-drift-4 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		35%      { transform: translate(6vw, 9vh) scale(0.94); }
		68%      { transform: translate(-5vw, 4vh) scale(1.06); }
	}
</style>
