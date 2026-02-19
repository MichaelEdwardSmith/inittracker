<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let password = $state('');
	let inputEl: HTMLInputElement;
</script>

<svelte:head>
	<title>DM Login — Initiative Tracker</title>
</svelte:head>

<div class="flex h-screen flex-col items-center justify-center bg-gray-950 text-white">
	<!-- Subtle background glow -->
	<div
		class="pointer-events-none absolute inset-0"
		style="background: radial-gradient(ellipse 60% 50% at 50% 45%, rgba(180,130,20,0.07) 0%, transparent 70%);"
	></div>

	<div class="relative z-10 w-full max-w-sm px-6">
		<!-- Header -->
		<div class="mb-8 text-center">
			<div class="mb-3 text-5xl">⚔️</div>
			<h1 class="text-2xl font-black tracking-[0.25em] text-amber-400 uppercase">
				Initiative Tracker
			</h1>
			<p class="mt-1 text-xs tracking-widest text-gray-600 uppercase">Dungeon Master Access</p>
		</div>

		<!-- Login card -->
		<div class="rounded-xl border border-gray-800 bg-gray-900/80 p-8 shadow-2xl backdrop-blur">
			<form method="POST">
				<label for="password" class="mb-2 block text-xs font-bold tracking-widest text-gray-400 uppercase">
					Password
				</label>
				<input
					bind:this={inputEl}
					bind:value={password}
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600
					       outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40
					       {form?.error ? 'border-red-700 focus:border-red-500 focus:ring-red-500/40' : ''}"
					placeholder="Enter DM password"
				/>

				{#if form?.error}
					<p class="mt-2 text-xs text-red-400">{form.error}</p>
				{/if}

				<button
					type="submit"
					class="mt-5 w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-black tracking-widest text-gray-950 uppercase
					       transition hover:bg-amber-500 active:scale-[0.98]"
				>
					Enter
				</button>
			</form>
		</div>

		<p class="mt-6 text-center text-xs text-gray-700">
			Player display is at <span class="text-gray-500">/display</span>
		</p>
	</div>
</div>
