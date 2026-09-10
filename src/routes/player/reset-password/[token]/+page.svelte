<!-- Player reset-password page (/player/reset-password/[token]). Mobile-first design. -->
<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Reset Password — Initiative Tracker</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 py-10 text-white"
>
	<div class="w-full max-w-sm">
		<div class="mb-8 text-center">
			<i class="fa-duotone fa-light fa-key text-5xl" aria-hidden="true"></i>
			<h1 class="text-2xl font-black tracking-[0.25em] text-blue-400 uppercase">New Password</h1>
		</div>

		<div class="rounded-xl border border-gray-800 bg-gray-900/80 p-6 shadow-2xl backdrop-blur">
			<form method="POST" class="space-y-4">
				<div>
					<label
						for="password"
						class="mb-1.5 block text-xs font-bold tracking-widest text-gray-400 uppercase"
					>
						New Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						required
						class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600 transition outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
						placeholder="At least 8 characters"
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

				{#if form?.error}
					<p class="text-xs text-red-400">{form.error}</p>
				{/if}

				<button
					type="submit"
					class="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-black tracking-widest text-white uppercase transition hover:bg-blue-500 active:scale-[0.98]"
				>
					Set New Password
				</button>
			</form>
		</div>
	</div>
</div>
