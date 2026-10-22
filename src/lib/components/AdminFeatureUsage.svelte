<!-- "Most used features" chart for /admin — ranked horizontal bars of how often DMs used each
     tracked feature (see $lib/activity.ts), with a range toggle. Totals are aggregated
     server-side and fetched from /admin/activity; generators are split out per generator.
     Single series, so no legend: the title names it. Same blue as the other admin charts. -->
<script lang="ts">
	import { ACTIVITY_LABELS } from '$lib/activity';
	import type { FeatureUsageRow } from '$lib/server/dmModel';

	const BAR_COLOR = '#3987e5';
	const RANGES = [
		{ label: '7d', days: '7' },
		{ label: '30d', days: '30' },
		{ label: 'All', days: '' }
	];
	const SHOWN = 10;

	let days = $state('30');
	let rows = $state<FeatureUsageRow[]>([]);
	let loading = $state(true);
	let error = $state('');

	const labels: Record<string, string> = ACTIVITY_LABELS;

	$effect(() => {
		const range = days;
		loading = true;
		error = '';
		fetch(`/admin/activity${range ? `?days=${range}` : ''}`)
			.then((r) => {
				if (!r.ok) throw new Error();
				return r.json();
			})
			.then((data: FeatureUsageRow[]) => {
				if (range === days) rows = data;
			})
			.catch(() => (error = 'Could not load feature usage.'))
			.finally(() => {
				if (range === days) loading = false;
			});
	});

	const allRows = $derived(
		rows.map((r) => ({
			label: r.generator ? `Generator: ${r.generator}` : (labels[r.feature] ?? r.feature),
			count: r.count,
			dmCount: r.dmCount
		}))
	);
	const bars = $derived(allRows.slice(0, SHOWN));

	// Quoted, with a leading apostrophe on formula-looking cells: generator labels come from
	// client-reported detail text, which a spreadsheet would otherwise evaluate.
	function csvCell(value: string | number): string {
		const text = String(value);
		const safe = /^[=+@\t\r-]/.test(text) ? `'${text}` : text;
		return `"${safe.replace(/"/g, '""')}"`;
	}

	function exportCsv() {
		const lines = [
			['Feature', 'Times used', 'Distinct DMs'].map(csvCell).join(','),
			...allRows.map((r) => [r.label, r.count, r.dmCount].map(csvCell).join(','))
		];
		const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/csv' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = `feature-usage-${RANGES.find((r) => r.days === days)?.label ?? 'all'}-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	const max = $derived(Math.max(1, ...bars.map((b) => b.count)));
</script>

<div class="mb-6 rounded-lg border border-gray-800 bg-gray-900/40 p-4">
	<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
		<p class="text-xs font-semibold tracking-wide text-gray-400 uppercase">
			Most used features <span class="font-normal text-gray-600 normal-case">· times used</span>
		</p>
		<div class="flex items-center gap-2">
			<button
				onclick={exportCsv}
				disabled={allRows.length === 0}
				class="rounded border border-gray-700 bg-gray-900 px-2.5 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300 disabled:opacity-40"
			>
				Export CSV
			</button>
			<div class="flex rounded border border-gray-700 bg-gray-900 text-xs">
				{#each RANGES as r (r.label)}
					<button
						onclick={() => (days = r.days)}
						aria-pressed={days === r.days}
						class="px-2.5 py-1 transition {days === r.days
							? 'bg-amber-900/40 text-amber-300'
							: 'text-gray-400 hover:text-gray-200'}"
					>
						{r.label}
					</button>
				{/each}
			</div>
		</div>
	</div>

	{#if error}
		<p class="text-xs text-red-400">{error}</p>
	{:else if loading && bars.length === 0}
		<p class="text-xs text-gray-600">Loading…</p>
	{:else if bars.length === 0}
		<p class="text-xs text-gray-600">No activity recorded in this range.</p>
	{:else}
		<ul class="space-y-1.5" class:opacity-60={loading}>
			{#each bars as b (b.label)}
				<li
					class="grid grid-cols-[minmax(0,11rem)_1fr_2.5rem] items-center gap-2 text-xs sm:grid-cols-[14rem_1fr_2.5rem]"
					title="{b.label}: {b.count} use{b.count === 1 ? '' : 's'} by {b.dmCount} DM{b.dmCount ===
					1
						? ''
						: 's'}"
				>
					<span class="truncate text-right text-gray-400">{b.label}</span>
					<span
						class="h-3 rounded-r"
						style="width: {(b.count / max) * 100}%; background: {BAR_COLOR};"
					></span>
					<span class="text-gray-300 tabular-nums">{b.count}</span>
				</li>
			{/each}
		</ul>
		<p class="mt-2 text-[11px] text-gray-600">
			Hover a bar for how many different DMs used it. Showing the top {bars.length} of {allRows.length};
			Export CSV includes all.
		</p>
	{/if}
</div>
