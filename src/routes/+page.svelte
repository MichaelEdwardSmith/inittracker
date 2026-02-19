<script lang="ts">
	import PlayerPanel from '$lib/components/PlayerPanel.svelte';
	import EnemyPanel from '$lib/components/EnemyPanel.svelte';
	import InitiativeTracker from '$lib/components/InitiativeTracker.svelte';
	import { combat } from '$lib/store.svelte';

	// Re-hydrate the client store from the server on every page load so the
	// DM screen recovers its state after a browser refresh.
	$effect(() => {
		combat.loadFromServer();
	});
</script>

<div class="flex h-screen flex-col overflow-hidden bg-gray-950 text-white">
	<!-- App header -->
	<header class="flex shrink-0 items-center border-b border-gray-800 bg-gray-900 px-6 py-3">
		<span class="text-xl">⚔️</span>
		<h1 class="ml-3 text-xl font-bold tracking-widest text-amber-400 uppercase">Initiative Tracker</h1>
		<span class="ml-2 text-xs text-gray-600">D&amp;D 5e</span>
		<div class="ml-auto flex items-center gap-2">
			<a
				href="/display"
				target="_blank"
				rel="noopener"
				title="Open Player Display"
				class="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
				Player Display
			</a>
			<form method="POST" action="/logout">
				<button
					type="submit"
					class="flex items-center gap-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-500 transition hover:border-red-800 hover:text-red-400"
					title="Log out"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
					</svg>
					Log out
				</button>
			</form>
		</div>
	</header>

	<!-- Main layout -->
	<div class="flex min-h-0 flex-1">
		<!-- Left sidebar: Players -->
		<aside class="flex w-64 shrink-0 flex-col border-r border-gray-800 bg-gray-900/50 p-4">
			<PlayerPanel />
		</aside>

		<!-- Center: Initiative tracker -->
		<main class="flex min-w-0 flex-1 flex-col p-4">
			<InitiativeTracker />
		</main>

		<!-- Right sidebar: Enemies -->
		<aside class="flex w-72 shrink-0 flex-col border-l border-gray-800 bg-gray-900/50 p-4">
			<EnemyPanel />
		</aside>
	</div>
</div>
