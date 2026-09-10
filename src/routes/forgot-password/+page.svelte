<!-- DM forgot-password request page (/forgot-password). -->
<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Forgot Password — Initiative Tracker</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white">
	<div class="w-full max-w-sm">
		<div class="mb-8 text-center">
			<i class="fa-duotone fa-light fa-key text-5xl" aria-hidden="true"></i>
			<h1 class="text-2xl font-black tracking-[0.25em] text-amber-400 uppercase">Reset Password</h1>
		</div>

		<div class="rounded-xl border border-gray-800 bg-gray-900/80 p-8 shadow-2xl backdrop-blur">
			{#if form?.success}
				<p class="text-sm text-gray-300">{form.message}</p>
			{:else}
				<p class="mb-5 text-sm text-gray-400">
					Enter your account email and we'll send you a link to reset your password.
				</p>
				<form method="POST">
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
						required
						class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600
						       transition outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
						placeholder="dungeon@master.com"
					/>
					{#if form?.error}
						<p class="mt-2 text-xs text-red-400">{form.error}</p>
					{/if}
					<button
						type="submit"
						class="mt-5 w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-black tracking-widest text-gray-950 uppercase
						       transition hover:bg-amber-500 active:scale-[0.98]"
					>
						Send Reset Link
					</button>
				</form>
			{/if}
		</div>

		<p class="mt-6 text-center text-xs text-gray-600">
			<a href="/login" class="text-amber-500 transition hover:text-amber-400">Back to sign in</a>
		</p>
	</div>
</div>
