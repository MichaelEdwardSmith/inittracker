<!-- DM login page (/login).
     SHA-256 hashes the password client-side before submission (reduces plaintext exposure over HTTP).
     On success the server sets the dm_auth cookie and redirects to /. -->
<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { form }: { form: ActionData } = $props();

	async function sha256(text: string): Promise<string> {
		const data = new TextEncoder().encode(text);
		const hash = await crypto.subtle.digest('SHA-256', data);
		return Array.from(new Uint8Array(hash))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
	}
</script>

<svelte:head>
	<title>DM Login — Initiative Tracker</title>
</svelte:head>

<div class="flex h-screen flex-col items-center justify-center overflow-hidden bg-gray-950 text-white">
	<div aria-hidden="true" class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
		<div class="bg-orb orb-1"></div>
		<div class="bg-orb orb-2"></div>
		<div class="bg-orb orb-3"></div>
		<div class="bg-orb orb-4"></div>
	</div>

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
			<form
				method="POST"
				action="?/login"
				use:enhance={async ({ formData }) => {
					const pw = formData.get('password');
					if (typeof pw === 'string' && pw) formData.set('password', await sha256(pw));
				}}
			>
				<label
					for="email"
					class="mb-2 block text-xs font-bold tracking-widest text-gray-400 uppercase"
				>
					Email
				</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600
					       transition outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40
					       {form?.error ? 'border-red-700 focus:border-red-500 focus:ring-red-500/40' : ''}"
					placeholder="dungeon@master.com"
				/>

				<label
					for="password"
					class="mt-4 mb-2 block text-xs font-bold tracking-widest text-gray-400 uppercase"
				>
					Password
				</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600
					       transition outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40
					       {form?.error ? 'border-red-700 focus:border-red-500 focus:ring-red-500/40' : ''}"
					placeholder="••••••••"
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

		<!-- Guest access -->
		<div class="mt-4">
			<form method="POST" action="?/guest">
				<button
					type="submit"
					class="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-4 py-3 text-sm font-semibold tracking-widest text-gray-400 uppercase
					       transition hover:border-gray-500 hover:text-gray-200 active:scale-[0.98]"
				>
					Enter as Guest
				</button>
			</form>
			<p class="mt-2 text-center text-xs text-gray-600">
				Guest sessions are not saved and will be<br />lost when you close the tab.
			</p>
		</div>

		<p class="mt-6 text-center text-xs text-gray-600">
			New Dungeon Master?
			<a href="/register" class="text-amber-500 transition hover:text-amber-400"
				>Create an account</a
			>
		</p>
		<p class="mt-3 text-center text-xs text-gray-700">
			Players join at <a href="/join" class="text-gray-500 transition hover:text-gray-400">/join</a>
		</p>
		<p class="mt-3 text-center text-xs text-gray-700">
			<a href="mailto:dm@inittracker.com" class="text-gray-600 transition hover:text-gray-400"
				>✉ Contact us</a
			>
		</p>
	</div>
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
