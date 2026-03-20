<!-- Player login page (/player/login). Mobile-first design. -->
<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const oauthError: Record<string, string> = {
		invalid_state: 'Sign-in session expired. Please try again.',
		token_exchange: 'Could not verify your Google account. Please try again.'
	};
</script>

<svelte:head>
	<title>Player Sign In — Initiative Tracker</title>
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
			<p class="mt-1 text-xs tracking-widest text-gray-600 uppercase">Player Sign In</p>
		</div>

		<div class="rounded-xl border border-gray-800 bg-gray-900/80 p-6 shadow-2xl backdrop-blur">
			<!-- OAuth error -->
			{#if form?.error}
				<p
					class="mb-4 rounded-lg border border-red-800 bg-red-950/60 px-3 py-2 text-center text-sm text-red-400"
				>
					{form.error}
				</p>
			{/if}

			<!-- Google SSO -->
			<a
				href="/auth/player/google"
				class="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 active:scale-[0.98]"
			>
				<svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24">
					<path
						fill="#4285F4"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="#34A853"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="#FBBC05"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
					/>
					<path
						fill="#EA4335"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				Continue with Google
			</a>

			<!-- Discord SSO -->
			<a
				href="/auth/player/discord"
				class="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 active:scale-[0.98]"
			>
				<svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24">
					<path
						fill="#5865F2"
						d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.175 13.175 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"
					/>
				</svg>
				Continue with Discord
			</a>

			<!-- Divider -->
			<div class="my-5 flex items-center gap-3">
				<div class="h-px flex-1 bg-gray-800"></div>
				<span class="text-xs text-gray-600">or sign in with email</span>
				<div class="h-px flex-1 bg-gray-800"></div>
			</div>

			<!-- Email / password form -->
			<form method="POST" class="space-y-4">
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
						autocomplete="current-password"
						required
						class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600 transition outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
						placeholder="••••••••"
					/>
				</div>

				<button
					type="submit"
					class="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-black tracking-widest text-white uppercase transition hover:bg-blue-500 active:scale-[0.98]"
				>
					Sign In
				</button>
			</form>
		</div>

		<!-- Footer links -->
		<div class="mt-5 space-y-2 text-center text-xs text-gray-600">
			<p>
				New here?
				<a href="/player/register" class="text-gray-400 transition hover:text-white"
					>Create an account</a
				>
			</p>
			<p>
				<a href="/join" class="text-gray-500 transition hover:text-gray-400">← Continue as Guest</a>
			</p>
			<p class="pt-1">
				Dungeon Master?
				<a href="/login" class="text-gray-500 transition hover:text-gray-400">Sign in here</a>
			</p>
		</div>
	</div>
</div>
