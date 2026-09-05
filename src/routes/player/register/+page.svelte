<!-- Player registration page (/player/register). Mobile-first design. -->
<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Create Player Account — Initiative Tracker</title>
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
			<div class="mb-3 text-5xl">🎲</div>
			<h1 class="text-2xl font-black tracking-[0.25em] text-blue-400 uppercase">
				Initiative Tracker
			</h1>
			<p class="mt-1 text-xs tracking-widest text-gray-600 uppercase">Create Player Account</p>
		</div>

		<div class="rounded-xl border border-gray-800 bg-gray-900/80 p-6 shadow-2xl backdrop-blur">
			<!-- Google SSO -->
			<a
				href="/auth/player/google"
				class="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 active:scale-[0.98]"
			>
				<i class="fa-brands fa-google shrink-0 text-lg" aria-hidden="true"></i>
				Sign up with Google
			</a>

			<div class="my-5 flex items-center gap-3">
				<div class="h-px flex-1 bg-gray-800"></div>
				<span class="text-xs text-gray-600">or create with email</span>
				<div class="h-px flex-1 bg-gray-800"></div>
			</div>

			{#if form?.error}
				<p
					class="mb-4 rounded-lg border border-red-800 bg-red-950/60 px-3 py-2 text-center text-sm text-red-400"
				>
					{form.error}
				</p>
			{/if}

			<form method="POST" class="space-y-4">
				<div>
					<label
						for="displayName"
						class="mb-1.5 block text-xs font-bold tracking-widest text-gray-400 uppercase"
					>
						Display Name
					</label>
					<input
						id="displayName"
						name="displayName"
						type="text"
						autocomplete="nickname"
						required
						class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600 transition outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
						placeholder="Smitty"
					/>
				</div>

				<div>
					<label
						for="email"
						class="mb-1.5 block text-xs font-bold tracking-widest text-gray-400 uppercase"
					>
						Email
					</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600 transition outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
						placeholder="you@example.com"
					/>
				</div>

				<div>
					<label
						for="password"
						class="mb-1.5 block text-xs font-bold tracking-widest text-gray-400 uppercase"
					>
						Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						required
						minlength="8"
						class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600 transition outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
						placeholder="Min. 8 characters"
					/>
				</div>

				<div>
					<label
						for="confirm"
						class="mb-1.5 block text-xs font-bold tracking-widest text-gray-400 uppercase"
					>
						Confirm Password
					</label>
					<input
						id="confirm"
						name="confirm"
						type="password"
						autocomplete="new-password"
						required
						class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600 transition outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
						placeholder="••••••••"
					/>
				</div>

				<button
					type="submit"
					class="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-black tracking-widest text-white uppercase transition hover:bg-blue-500 active:scale-[0.98]"
				>
					Create Account
				</button>
			</form>
		</div>

		<div class="mt-5 space-y-2 text-center text-xs text-gray-600">
			<p>
				Already have an account?
				<a href="/player/login" class="text-gray-400 transition hover:text-white">Sign in</a>
			</p>
			<p>
				<a href="/join" class="text-gray-500 transition hover:text-gray-400">← Continue as Guest</a>
			</p>
		</div>
	</div>
</div>
