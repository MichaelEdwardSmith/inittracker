<!-- Player email-verification landing page (/player/verify-email/[token]).
     Requires an explicit click (POST) — see the DM equivalent's comment for why. -->
<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Verify Email — Initiative Tracker</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 py-10 text-white"
>
	<div class="w-full max-w-sm text-center">
		{#if !form}
			<i class="fa-duotone fa-light fa-envelope-circle-check text-5xl" aria-hidden="true"></i>
			<h1 class="mt-4 text-xl font-black tracking-wide text-white">Verify your email</h1>
			<p class="mt-2 text-sm text-gray-400">Confirm this is your email address.</p>
			<form method="POST" class="mt-6">
				<button
					type="submit"
					class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-black tracking-widest text-white uppercase
					       transition hover:bg-blue-500 active:scale-[0.98]"
				>
					Confirm email
				</button>
			</form>
		{:else}
			<i
				class="fa-duotone fa-light {form.ok
					? 'fa-circle-check text-emerald-500'
					: 'fa-circle-xmark text-red-500'} text-5xl"
				aria-hidden="true"
			></i>
			<h1 class="mt-4 text-xl font-black tracking-wide text-white">
				{form.ok ? 'Email verified' : 'Verification failed'}
			</h1>
			<p class="mt-2 text-sm text-gray-400">
				{form.ok ? 'Your email address has been confirmed.' : form.error}
			</p>
		{/if}
		<a
			href="/player/login"
			class="mt-6 inline-block text-sm text-blue-400 transition hover:text-blue-300"
		>
			Continue to sign in
		</a>
	</div>
</div>
