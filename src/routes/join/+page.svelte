<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let sessionId = $state('');

	function handleInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		sessionId = val.toUpperCase().replace(/[^A-Z2-9]/g, '');
	}
</script>

<svelte:head>
	<title>Join Session — Initiative Tracker</title>
</svelte:head>

<div class="flex h-screen flex-col items-center justify-center bg-gray-950 text-white">
	<!-- Subtle background glow -->
	<div
		class="pointer-events-none absolute inset-0"
		style="background: radial-gradient(ellipse 60% 50% at 50% 45%, rgba(59,130,246,0.06) 0%, transparent 70%);"
	></div>

	<div class="relative z-10 w-full max-w-sm px-6">
		<!-- Header -->
		<div class="mb-8 text-center">
			<div class="mb-3 text-5xl">🎲</div>
			<h1 class="text-2xl font-black tracking-[0.25em] text-blue-400 uppercase">
				Initiative Tracker
			</h1>
			<p class="mt-1 text-xs tracking-widest text-gray-600 uppercase">Player View</p>
		</div>

		<!-- Join card -->
		<div class="rounded-xl border border-gray-800 bg-gray-900/80 p-8 shadow-2xl backdrop-blur">
			<p class="mb-5 text-center text-sm text-gray-400">
				Enter the session ID provided by your Dungeon Master.
			</p>

			<form method="POST">
				<label
					for="sessionId"
					class="mb-2 block text-xs font-bold tracking-widest text-gray-400 uppercase"
				>
					Session ID
				</label>
				<input
					id="sessionId"
					name="sessionId"
					type="text"
					maxlength="6"
					value={sessionId}
					oninput={handleInput}
					autocomplete="off"
					spellcheck="false"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-center text-2xl font-black tracking-[0.4em] text-white placeholder-gray-700
					       outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40
					       {form?.error ? 'border-red-700 focus:border-red-500 focus:ring-red-500/40' : ''}"
					placeholder="AB3X9K"
				/>

				{#if form?.error}
					<p class="mt-2 text-center text-xs text-red-400">{form.error}</p>
				{/if}

				<button
					type="submit"
					class="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-black tracking-widest text-white uppercase
					       transition hover:bg-blue-500 active:scale-[0.98]"
				>
					Join Session
				</button>
			</form>
		</div>

		<p class="mt-6 text-center text-xs text-gray-700">
			Dungeon Master?
			<a href="/login" class="text-gray-500 transition hover:text-gray-400">Sign in here</a>
		</p>
	</div>
</div>
