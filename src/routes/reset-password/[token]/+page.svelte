<!-- DM reset-password page (/reset-password/[token]).
     SHA-256 hashes the password client-side before submission, matching /login and /register. -->
<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { form }: { form: ActionData } = $props();
	let clientError = $state('');

	async function sha256(text: string): Promise<string> {
		const data = new TextEncoder().encode(text);
		const hash = await crypto.subtle.digest('SHA-256', data);
		return Array.from(new Uint8Array(hash))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
	}
</script>

<svelte:head>
	<title>Reset Password — Initiative Tracker</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white">
	<div class="w-full max-w-sm">
		<div class="mb-8 text-center">
			<i class="fa-duotone fa-light fa-key text-5xl" aria-hidden="true"></i>
			<h1 class="text-2xl font-black tracking-[0.25em] text-amber-400 uppercase">New Password</h1>
		</div>

		<div class="rounded-xl border border-gray-800 bg-gray-900/80 p-8 shadow-2xl backdrop-blur">
			<form
				method="POST"
				use:enhance={async ({ formData, cancel }) => {
					clientError = '';
					const pw = formData.get('password') as string;
					const conf = formData.get('confirm') as string;
					if (pw.length < 8) {
						clientError = 'Password must be at least 8 characters.';
						cancel();
						return;
					}
					if (pw !== conf) {
						clientError = 'Passwords do not match.';
						cancel();
						return;
					}
					const hashed = await sha256(pw);
					formData.set('password', hashed);
					formData.set('confirm', hashed);
				}}
			>
				<label
					for="password"
					class="mb-2 block text-xs font-bold tracking-widest text-gray-400 uppercase"
				>
					New Password
				</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="new-password"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600
					       transition outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
					placeholder="At least 8 characters"
				/>

				<label
					for="confirm"
					class="mt-4 mb-2 block text-xs font-bold tracking-widest text-gray-400 uppercase"
				>
					Confirm Password
				</label>
				<input
					id="confirm"
					name="confirm"
					type="password"
					autocomplete="new-password"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600
					       transition outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
					placeholder="••••••••"
				/>

				{#if clientError || form?.error}
					<p class="mt-3 text-xs text-red-400">{clientError || form?.error}</p>
				{/if}

				<button
					type="submit"
					class="mt-6 w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-black tracking-widest text-gray-950 uppercase
					       transition hover:bg-amber-500 active:scale-[0.98]"
				>
					Set New Password
				</button>
			</form>
		</div>
	</div>
</div>
