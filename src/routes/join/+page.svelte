<!-- Player join page (/join).
     Shows saved sessions for logged-in players, or a plain session ID input for guests. -->
<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();

	let sessionId = $state('');
	// Show the new-session input immediately if no saved sessions; user can also open/close it manually.
	let newSessionOpen = $state(false);
	const showNewSessionInput = $derived(data.sessions.length === 0 || newSessionOpen);

	function handleInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		sessionId = val.toUpperCase().replace(/[^A-Z2-9]/g, '');
	}
</script>

<svelte:head>
	<title>Join Session — Initiative Tracker</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 py-10 text-white"
>
	<div
		class="pointer-events-none absolute inset-0"
		style="background: radial-gradient(ellipse 60% 50% at 50% 45%, rgba(59,130,246,0.06) 0%, transparent 70%);"
	></div>

	<div class="relative z-10 w-full max-w-sm">
		<!-- Header -->
		<div class="mb-8 text-center">
			<i class="fa-solid fa-dice text-5xl" aria-hidden="true"></i>
			<h1 class="text-2xl font-black tracking-[0.25em] text-blue-400 uppercase">
				Initiative Tracker
			</h1>
			<p class="mt-1 text-xs tracking-widest text-gray-600 uppercase">Player View</p>
		</div>

		<!-- Logged-in player greeting -->
		{#if data.player}
			<div
				class="mb-4 flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/80 px-4 py-3"
			>
				{#if data.player.avatarUrl}
					<img
						src={data.player.avatarUrl}
						alt={data.player.name}
						class="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-blue-500/40"
					/>
				{:else}
					<div
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-blue-300"
					>
						{data.player.name[0].toUpperCase()}
					</div>
				{/if}
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-semibold text-white">{data.player.name}</p>
					<a href="/player/logout" class="text-xs text-gray-500 transition hover:text-gray-400">
						Not you? Sign out
					</a>
				</div>
			</div>

			<!-- Saved sessions list -->
			{#if data.sessions.length > 0}
				<div class="mb-4 rounded-xl border border-gray-800 bg-gray-900/80 shadow-2xl backdrop-blur">
					<p
						class="border-b border-gray-800 px-4 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase"
					>
						Your Sessions
					</p>
					<div class="divide-y divide-gray-800/60">
						{#each data.sessions as session}
							<form method="POST">
								<input type="hidden" name="sessionId" value={session.sessionId} />
								<button
									type="submit"
									class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-gray-800/60 active:bg-gray-800"
								>
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-semibold text-white">{session.sessionName}</p>
										<p class="mt-0.5 font-mono text-xs tracking-widest text-gray-500">
											{session.sessionId}
										</p>
									</div>
									<i
										class="fa-solid fa-chevron-right shrink-0 text-base text-gray-600"
										aria-hidden="true"
									></i>
								</button>
							</form>
						{/each}
					</div>
					<!-- Toggle for new session input -->
					{#if !showNewSessionInput}
						<div class="border-t border-gray-800 px-4 py-3">
							<button
								type="button"
								onclick={() => (newSessionOpen = true)}
								class="flex w-full items-center justify-center gap-2 text-xs text-gray-500 transition hover:text-gray-300"
							>
								<i class="fa-solid fa-plus text-sm" aria-hidden="true"></i>
								Join a different session
							</button>
						</div>
					{/if}
				</div>
			{/if}

			<!-- New session input (shown when no sessions, or user clicked "Join a different session") -->
			{#if showNewSessionInput}
				<div class="rounded-xl border border-gray-800 bg-gray-900/80 p-6 shadow-2xl backdrop-blur">
					{#if data.sessions.length > 0}
						<div class="mb-4 flex items-center justify-between">
							<p class="text-sm font-semibold text-white">Join a Different Session</p>
							<button
								type="button"
								onclick={() => (newSessionOpen = false)}
								class="text-xs text-gray-600 transition hover:text-gray-400"
							>
								Cancel
							</button>
						</div>
					{:else}
						<p class="mb-5 text-center text-sm text-gray-400">
							Enter the session ID provided by your Dungeon Master.
						</p>
					{/if}

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
							       transition outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40
							       {form?.error ? 'border-red-700 focus:border-red-500 focus:ring-red-500/40' : ''}"
							placeholder="AB3X9K"
						/>

						{#if form?.error}
							<p class="mt-2 text-center text-xs text-red-400">{form.error}</p>
						{/if}

						<button
							type="submit"
							class="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-black tracking-widest text-white uppercase
							       transition hover:bg-blue-500 active:scale-[0.98]"
						>
							Join Session
						</button>
					</form>
				</div>
			{/if}
		{:else}
			<!-- Guest flow — plain session ID entry + sign-in options -->
			<div class="rounded-xl border border-gray-800 bg-gray-900/80 p-6 shadow-2xl backdrop-blur">
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
						       transition outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40
						       {form?.error ? 'border-red-700 focus:border-red-500 focus:ring-red-500/40' : ''}"
						placeholder="AB3X9K"
					/>

					{#if form?.error}
						<p class="mt-2 text-center text-xs text-red-400">{form.error}</p>
					{/if}

					<button
						type="submit"
						class="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-black tracking-widest text-white uppercase
						       transition hover:bg-blue-500 active:scale-[0.98]"
					>
						Continue as Guest
					</button>
				</form>

				<!-- Sign-in options -->
				<div class="mt-5">
					<div class="mb-4 flex items-center gap-3">
						<div class="h-px flex-1 bg-gray-800"></div>
						<span class="text-xs text-gray-600">sign in for a better experience</span>
						<div class="h-px flex-1 bg-gray-800"></div>
					</div>

					<a
						href="/auth/player/google"
						class="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 active:scale-[0.98]"
					>
						<i class="fa-brands fa-google shrink-0 text-lg" aria-hidden="true"></i>
						Continue with Google
					</a>
					<a
						href="/auth/player/discord"
						class="mt-2 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 active:scale-[0.98]"
					>
						<i class="fa-brands fa-discord shrink-0 text-lg" aria-hidden="true"></i>
						Continue with Discord
					</a>

					<p class="mt-3 text-center text-xs text-gray-600">
						Have an email account?
						<a href="/player/login" class="text-gray-400 transition hover:text-white">Sign in</a>
						·
						<a href="/player/register" class="text-gray-400 transition hover:text-white">Register</a
						>
					</p>
				</div>
			</div>
		{/if}

		<div class="mt-5 space-y-2 text-center text-xs text-gray-700">
			<p>
				Dungeon Master?
				<a href="/login" class="text-gray-500 transition hover:text-gray-400">Sign in here</a>
			</p>
			<p>
				<a href="mailto:dm@inittracker.com" class="text-gray-600 transition hover:text-gray-400"
					>✉ Contact us</a
				>
				<span class="mx-1 text-gray-800">·</span>
				<a href="/privacy" class="text-gray-600 transition hover:text-gray-400">Privacy Policy</a>
			</p>
		</div>
	</div>
</div>
