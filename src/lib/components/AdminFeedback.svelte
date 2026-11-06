<!-- In-app feedback inbox for /admin's Insights tab — notes DMs sent with the dashboard's
     "Send Feedback" button. Data comes from GET /admin/feedback; entries can be deleted once
     handled via DELETE /admin/feedback?id=. -->
<script lang="ts">
	import type { FeedbackEntry } from '$lib/server/feedbackStore';

	let entries = $state<FeedbackEntry[]>([]);
	let loading = $state(true);
	let error = $state('');

	async function load() {
		try {
			const res = await fetch('/admin/feedback');
			if (!res.ok) throw new Error();
			entries = await res.json();
			error = '';
		} catch {
			error = 'Could not load feedback.';
		} finally {
			loading = false;
		}
	}

	async function remove(id: string) {
		const res = await fetch(`/admin/feedback?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
		if (res.ok) entries = entries.filter((e) => e.id !== id);
		else error = 'Could not delete that entry.';
	}

	$effect(() => {
		load();
	});

	function formatTime(d: string | Date): string {
		return new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
	}
</script>

<section class="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
	<div class="mb-3 flex items-center justify-between gap-2">
		<p class="text-xs font-semibold tracking-wide text-gray-400 uppercase">
			Feedback <span class="font-normal text-gray-600 normal-case"
				>· sent from the dashboard menu ({entries.length})</span
			>
		</p>
		<button
			onclick={() => load()}
			class="rounded border border-gray-700 px-2 py-1 text-xs text-gray-400 hover:text-white"
		>
			Refresh
		</button>
	</div>

	{#if error}
		<p class="text-sm text-red-400">{error}</p>
	{:else if loading}
		<p class="text-sm text-gray-500">Loading…</p>
	{:else if entries.length === 0}
		<p class="text-sm text-gray-500">No feedback yet.</p>
	{:else}
		<ul class="flex max-h-96 flex-col gap-2 overflow-y-auto">
			{#each entries as entry (entry.id)}
				<li class="rounded border border-gray-800 bg-gray-900 p-3">
					<div class="mb-1 flex items-center justify-between gap-2 text-xs text-gray-500">
						<span>
							<a href="mailto:{entry.email}" class="text-amber-400 hover:underline">{entry.email}</a
							>
							· {formatTime(entry.at)}
						</span>
						<button
							onclick={() => remove(entry.id)}
							aria-label="Delete feedback"
							class="text-gray-600 hover:text-red-400"
						>
							<i class="fa-duotone fa-light fa-trash" aria-hidden="true"></i>
						</button>
					</div>
					<p class="text-sm whitespace-pre-wrap text-gray-300">{entry.message}</p>
				</li>
			{/each}
		</ul>
	{/if}
</section>
