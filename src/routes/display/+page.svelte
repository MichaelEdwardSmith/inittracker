<script lang="ts">
	import { conditionColors, sortCombatants, hpPercent, hpBarColor } from '$lib/utils';
	import { getMonsterEmoji, getMonsterStyle } from '$lib/monsterAvatars';
	import type { StorageState, Combatant } from '$lib/types';

	let combatState: StorageState = $state({ combatants: [], currentTurnId: null, round: 1 });
	let connected = $state(false);

	$effect(() => {
		const source = new EventSource('/api/state');

		source.onopen = () => { connected = true; };

		source.onmessage = (e) => {
			try {
				combatState = JSON.parse(e.data) as StorageState;
			} catch {
				// Malformed message — ignore.
			}
		};

		source.onerror = () => {
			connected = false;
			// EventSource automatically retries — no manual reconnect needed.
		};

		return () => source.close();
	});

	const sorted = $derived(sortCombatants(combatState.combatants));
	const currentIndex = $derived(sorted.findIndex((c) => c.id === combatState.currentTurnId));
	const current = $derived<Combatant | null>(currentIndex >= 0 ? sorted[currentIndex] : null);

	const upNext = $derived.by<Combatant[]>(() => {
		if (currentIndex < 0 || sorted.length <= 1) return [];
		const count = Math.min(4, sorted.length - 1);
		return Array.from({ length: count }, (_, i) => sorted[(currentIndex + i + 1) % sorted.length]);
	});

	// The index within upNext where the order wraps back to initiative position 0.
	// null if no wrap occurs within the visible slice.
	const wrapIndex = $derived.by<number | null>(() => {
		if (currentIndex < 0 || sorted.length <= 1) return null;
		const count = Math.min(4, sorted.length - 1);
		const idx = sorted.length - currentIndex - 1;
		return idx < count ? idx : null;
	});

	const backgroundGlow = $derived.by(() => {
		if (!current) return '';
		return current.type === 'player'
			? 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(37,99,235,0.12) 0%, transparent 70%)'
			: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(185,28,28,0.14) 0%, transparent 70%)';
	});

	const typeAccent = $derived.by(() => {
		if (!current) return { badge: 'text-gray-400 border-gray-600', label: '' };
		return current.type === 'player'
			? { badge: 'text-blue-300 border-blue-600 bg-blue-950/60', label: 'PLAYER CHARACTER' }
			: { badge: 'text-red-300 border-red-700 bg-red-950/60', label: 'ENEMY' };
	});
</script>

<svelte:head>
	<title>Initiative Display</title>
</svelte:head>

<div class="flex h-screen flex-col overflow-hidden bg-gray-950 font-sans text-white">
	<!-- Atmospheric background glow -->
	{#if current}
		<div
			class="pointer-events-none absolute inset-0 z-0 transition-all duration-700"
			style="background: {backgroundGlow};"
		></div>
	{/if}

	<!-- Header bar -->
	<header class="relative z-10 flex shrink-0 items-center justify-between border-b border-gray-800/60 bg-gray-900/80 px-8 py-3 backdrop-blur-sm">
		<div class="flex items-center gap-3">
			<span class="text-lg">⚔️</span>
			<span class="text-sm font-bold tracking-[0.3em] text-amber-400 uppercase">Initiative Tracker</span>
			<!-- Live / connecting indicator -->
			<span class="flex items-center gap-1.5 text-xs {connected ? 'text-green-500' : 'text-gray-600'}">
				<span class="inline-block h-1.5 w-1.5 rounded-full {connected ? 'bg-green-500' : 'bg-gray-600'}"></span>
				{connected ? 'Live' : 'Connecting…'}
			</span>
		</div>
		{#if combatState.currentTurnId}
			<div class="flex items-center gap-2">
				<span class="text-xs tracking-widest text-gray-500 uppercase">Round</span>
				<span class="text-2xl font-black text-amber-400">{combatState.round}</span>
			</div>
		{/if}
	</header>

	{#if !current}
		<!-- Waiting for combat -->
		<div class="relative z-10 flex flex-1 flex-col items-center justify-center gap-6">
			<div class="text-6xl opacity-20">⚔️</div>
			<div class="text-center">
				<p class="text-4xl font-black tracking-[0.2em] text-gray-700 uppercase">Awaiting Combat</p>
				<p class="mt-3 text-sm tracking-widest text-gray-600 uppercase">The Dungeon Master will begin shortly…</p>
			</div>
			{#if sorted.length > 0}
				<div class="mt-4 flex flex-wrap justify-center gap-3">
					{#each sorted as c}
						<div class="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-2">
							{#if c.type === 'enemy'}
								<span class="text-lg leading-none">{getMonsterEmoji(c.templateName, c.monsterType)}</span>
							{/if}
							<span class="text-xs font-bold {c.type === 'player' ? 'text-blue-400' : 'text-red-400'}">
								{c.initiative ?? '?'}
							</span>
							<span class="text-sm text-gray-300">{c.name}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Active combatant display -->
		{#key current.id}
			{@const pct = hpPercent(current)}
			<main class="relative z-10 flex flex-1 flex-col items-center justify-center px-12 pb-4">

				<!-- Type label -->
				<div class="mb-5 flex items-center gap-3">
					<div class="h-px w-16 bg-gradient-to-r from-transparent to-gray-600"></div>
					<span class="rounded-full border px-4 py-1 text-xs font-black tracking-[0.25em] uppercase {typeAccent.badge}">
						{typeAccent.label}
					</span>
					<div class="h-px w-16 bg-gradient-to-l from-transparent to-gray-600"></div>
				</div>

				<!-- Enemy avatar token -->
				{#if current.type === 'enemy'}
					{@const style = getMonsterStyle(current.monsterType)}
					{@const emoji = getMonsterEmoji(current.templateName, current.monsterType)}
					<div
						class="mb-6 flex h-44 w-44 items-center justify-center rounded-full ring-4 ring-offset-4 ring-offset-gray-950 {style.bg} {style.ring}"
						style="box-shadow: 0 0 48px -8px var(--tw-ring-color);"
					>
						<span class="select-none" style="font-size: 5rem; line-height: 1;">
							{emoji}
						</span>
					</div>
				{/if}

				<!-- Name — font shrinks to fit; max 4.5rem (player) / 3.75rem (enemy) -->
				<h1
					class="mb-2 text-center font-black tracking-widest uppercase leading-none
					       {current.type === 'player' ? 'text-blue-50' : 'text-red-50'}"
					style="font-size: clamp(1.5rem, calc((100vw - 6rem) / 11), {current.type === 'player' ? '4.5rem' : '3.75rem'}); text-shadow: 0 0 40px {current.type === 'player' ? 'rgba(96,165,250,0.4)' : 'rgba(248,113,113,0.4)'};"
				>
					{current.name}
				</h1>

				<!-- Stats row -->
				<div class="mt-6 flex items-center gap-10">
					{#if current.initiative !== null}
						<div class="text-center">
							<div class="text-xs tracking-widest text-gray-500 uppercase">Initiative</div>
							<div class="text-4xl font-black text-amber-400">{current.initiative}</div>
						</div>
						<div class="h-10 w-px bg-gray-700"></div>
					{/if}
					<div class="text-center">
						<div class="text-xs tracking-widest text-gray-500 uppercase">Armor Class</div>
						<div class="text-4xl font-black text-gray-100">{current.ac}</div>
					</div>
					{#if current.type === 'player'}
						<div class="h-10 w-px bg-gray-700"></div>
						<div class="text-center">
							<div class="text-xs tracking-widest text-gray-500 uppercase">Hit Points</div>
							<div class="text-4xl font-black {pct <= 0 ? 'text-gray-500' : pct <= 25 ? 'text-red-400' : pct <= 50 ? 'text-amber-400' : 'text-green-400'}">
								{current.currentHp}<span class="text-xl text-gray-600">/{current.maxHp}</span>
							</div>
							{#if (current.tempHp ?? 0) > 0}
								<div class="mt-1 text-lg font-bold text-yellow-400">+{current.tempHp} THP</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- HP bar + THP extension (players only) -->
				{#if current.type === 'player'}
					<div class="relative mt-5 h-4 w-full max-w-2xl rounded-full bg-gray-800 shadow-inner">
						<div
							class="h-full rounded-full transition-all duration-500 {hpBarColor(pct)}"
							style="width: {pct}%;"
						></div>
						{#if (current.tempHp ?? 0) > 0}
							{@const thpPct = Math.min((current.tempHp / current.maxHp) * 100, Math.max(0, 100 - pct))}
							<div
								class="absolute top-0 h-full rounded-full bg-yellow-400 transition-all duration-500"
								style="left: {pct}%; width: {thpPct}%;"
							></div>
						{/if}
					</div>
				{/if}

				<!-- Active conditions -->
				{#if current.statuses.length > 0}
					<div class="mt-5 flex flex-wrap justify-center gap-2">
						{#each current.statuses as status}
							<span class="rounded-full px-3 py-1 text-sm font-semibold tracking-wide {conditionColors[status] ?? 'bg-gray-700 text-gray-200'}">
								{status}
							</span>
						{/each}
					</div>
				{/if}
			</main>
		{/key}

		<!-- Up Next strip -->
		{#if upNext.length > 0}
			<footer class="relative z-10 shrink-0 border-t border-gray-800/80 bg-gray-900/90 px-8 py-4 backdrop-blur-sm">
				<div class="flex items-center gap-6">
					<div class="shrink-0">
						<span class="text-xs font-black tracking-[0.3em] text-gray-500 uppercase">Up Next</span>
						<span class="ml-2 text-gray-600">▶</span>
					</div>

					<div class="flex flex-1 items-center gap-3 overflow-hidden">
						{#each upNext as c, i}
							{@const pct = hpPercent(c)}
							{#if i === wrapIndex}
								<div class="hidden sm:flex shrink-0 items-center gap-2">
									<div class="h-8 w-px bg-gray-700/60"></div>
									<span class="whitespace-nowrap text-xs font-black tracking-[0.2em] text-amber-500/60 uppercase">Top of the Order</span>
									<div class="h-8 w-px bg-gray-700/60"></div>
								</div>
							{/if}
							<div
								class="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-2 sm:flex-row sm:gap-3 sm:px-3 sm:py-2.5
								       {c.type === 'player' ? 'border-blue-900/60 bg-blue-950/30' : 'border-red-900/60 bg-red-950/30'}"
							>
								<!-- Avatar token (small) -->
								{#if c.type === 'enemy'}
									{@const style = getMonsterStyle(c.monsterType)}
									<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2 {style.bg} {style.ring}">
										<span class="select-none text-xl leading-none">
											{getMonsterEmoji(c.templateName, c.monsterType)}
										</span>
									</div>
								{:else}
									<!-- Player token -->
									<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-950 ring-2 ring-blue-700">
										<span class="select-none text-xl leading-none">🛡️</span>
									</div>
								{/if}

								<div class="min-w-0 w-full sm:flex-1">
									<!-- Name + type -->
									<div class="flex items-center justify-center gap-1.5 sm:justify-start">
										<span class="hidden shrink-0 rounded px-1 py-0.5 text-xs font-bold sm:inline {c.type === 'player' ? 'bg-blue-900/60 text-blue-400' : 'bg-red-900/60 text-red-400'}">
											{c.type === 'player' ? 'PC' : 'NPC'}
										</span>
										<span class="truncate text-sm font-semibold text-gray-200">{c.name}</span>
										{#if c.initiative !== null}
											<span class="ml-auto hidden shrink-0 text-xs text-amber-500 sm:inline">{c.initiative}</span>
										{/if}
									</div>

									<!-- Mini HP bar (players only) -->
									{#if c.type === 'player'}
										{@const thpPct = Math.min(((c.tempHp ?? 0) / c.maxHp) * 100, Math.max(0, 100 - pct))}
										<div class="relative mt-1.5 hidden h-1.5 w-full overflow-hidden rounded-full bg-gray-800 sm:block">
											<div class="absolute inset-y-0 left-0 {hpBarColor(pct)}" style="width: {pct}%;"></div>
											{#if (c.tempHp ?? 0) > 0}
												<div class="absolute inset-y-0 bg-yellow-400" style="left: {pct}%; width: {thpPct}%;"></div>
											{/if}
										</div>
										<div class="mt-0.5 hidden items-center gap-1.5 text-xs sm:flex">
											<span class="{pct <= 0 ? 'text-gray-600' : pct <= 25 ? 'text-red-400' : pct <= 50 ? 'text-amber-400' : 'text-green-400'}">
												{c.currentHp}/{c.maxHp} HP
											</span>
											{#if (c.tempHp ?? 0) > 0}
												<span class="font-bold text-yellow-400">+{c.tempHp} THP</span>
											{/if}
										</div>
									{/if}
								</div>

								<!-- Condition chips -->
								{#if c.statuses.length > 0}
									<div class="shrink-0 text-right">
										<div class="flex flex-wrap justify-end gap-0.5">
											{#each c.statuses.slice(0, 3) as s}
												<span class="rounded px-1 py-0.5 text-xs {conditionColors[s] ?? 'bg-gray-700 text-gray-300'}">{s}</span>
											{/each}
											{#if c.statuses.length > 3}
												<span class="text-xs text-gray-600">+{c.statuses.length - 3}</span>
											{/if}
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</footer>
		{/if}
	{/if}
</div>
