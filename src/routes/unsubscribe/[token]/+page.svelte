<!-- Unsubscribe confirmation page (/unsubscribe/[token]). Requires an explicit click (POST) —
     see +page.server.ts for why a GET must not unsubscribe anyone. -->
<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Unsubscribe — Initiative Tracker</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white">
	<div class="w-full max-w-sm text-center">
		{#if !data.email}
			<i class="fa-duotone fa-light fa-circle-xmark text-5xl text-red-500" aria-hidden="true"></i>
			<h1 class="mt-4 text-xl font-black tracking-wide text-white">Link not recognized</h1>
			<p class="mt-2 text-sm text-gray-400">This unsubscribe link is invalid.</p>
		{:else if form?.ok}
			<i class="fa-duotone fa-light fa-circle-check text-5xl text-emerald-500" aria-hidden="true"
			></i>
			<h1 class="mt-4 text-xl font-black tracking-wide text-white">Unsubscribed</h1>
			<p class="mt-2 text-sm text-gray-400">
				{form.email} won't receive any more admin emails from Initiative Tracker.
			</p>
		{:else}
			<i class="fa-duotone fa-light fa-envelope-circle-check text-5xl" aria-hidden="true"></i>
			<h1 class="mt-4 text-xl font-black tracking-wide text-white">Unsubscribe</h1>
			<p class="mt-2 text-sm text-gray-400">
				Stop sending admin emails to <span class="text-gray-200">{data.email}</span>?
			</p>
			<form method="POST" class="mt-6">
				<button
					type="submit"
					class="rounded-lg border border-gray-700 bg-gray-800 px-6 py-3 text-sm font-black tracking-widest text-gray-200 uppercase
					       transition hover:border-gray-500 active:scale-[0.98]"
				>
					Unsubscribe
				</button>
			</form>
		{/if}
	</div>
</div>
