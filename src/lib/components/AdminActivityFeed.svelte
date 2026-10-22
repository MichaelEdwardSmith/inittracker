<!-- Cross-DM activity feed for /admin's Insights tab — newest usage-log entries across every DM,
     filterable by feature, auto-refreshing while the tab is open. Data comes from
     GET /admin/activity/feed. -->
<script lang="ts">
	import { ACTIVITY_LABELS, type ActivityFeature } from '$lib/activity';
	import type { ActivityFeedEntry } from '$lib/server/dmModel';

	const labels: Record<string, string> = ACTIVITY_LABELS;
	const REFRESH_MS = 20_000;

	let feature = $state<ActivityFeature | ''>('');
	let entries = $state<ActivityFeedEntry[]>([]);
	let loading = $state(true);
	let error = $state('');
	let auto = $state(true);
	let tick = $state(0);

	async function load(selected: string) {
		try {
			const res = await fetch(
				`/admin/activity/feed?limit=100${selected ? `&feature=${selected}` : ''}`
			);
			if (!res.ok) throw new Error();
			const data: ActivityFeedEntry[] = await res.json();
			if (selected === feature) {
				entries = data;
				error = '';
			}
		} catch {
			error = 'Could not load activity.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		tick; // re-run on manual refresh
		loading = true;
		load(feature);
	});

	$effect(() => {
		if (!auto) return;
		const id = setInterval(() => load(feature), REFRESH_MS);
		return () => clearInterval(id);
	});

	function formatTime(d: string | Date): string {
		return new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });
	}
</script>

<section class="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
	<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
		<p class="text-xs font-semibold tracking-wide text-gray-400 uppercase">
			Activity feed <span class="font-normal text-gray-600 normal-case"
				>· latest across all DMs</span
			>
		</p>
		<div class="flex flex-wrap items-center gap-2 text-xs">
			<select
				aria-label="Filter by feature"
				bind:value={feature}
				class="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-gray-300 focus:border-amber-600 focus:outline-none"
			>
				<option value="">All features</option>
				{#each Object.entries(labels) as [key, label] (key)}
					<option value={key}>{label}</option>
				{/each}
			</select>
			<label class="flex cursor-pointer items-center gap-1.5 text-gray-500">
				<input type="checkbox" bind:checked={auto} class="accent-amber-500" /> Auto-refresh
			</label>
			<button
				onclick={() => tick++}
				class="rounded border border-gray-700 bg-gray-900 px-2.5 py-1 text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
			>
				Refresh
			</button>
		</div>
	</div>

	{#if error}
		<p class="text-xs text-red-400">{error}</p>
	{:else if loading && entries.length === 0}
		<p class="text-xs text-gray-600">Loading…</p>
	{:else if entries.length === 0}
		<p class="text-xs text-gray-600">
			No activity recorded{feature ? ' for this feature' : ''} yet.
		</p>
	{:else}
		<ul class="max-h-96 space-y-1 overflow-y-auto pr-2 text-xs text-gray-400">
			{#each entries as e, i (e.at + e.sessionId + i)}
				<li class="flex flex-wrap gap-x-2">
					<span class="w-36 shrink-0 text-gray-600">{formatTime(e.at)}</span>
					<span class="w-32 shrink-0 truncate font-semibold text-gray-300" title={e.email}
						>{e.name}</span
					>
					<span class="text-gray-300">{labels[e.feature] ?? e.feature}</span>
					{#if e.detail}<span class="text-gray-500">— {e.detail}</span>{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>
