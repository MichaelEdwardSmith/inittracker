<!-- "Insights" tab on /admin — onboarding funnel, feature adoption, weekly trend, the cross-DM
     activity feed, and system health. Funnel and adoption are computed from the engagement report
     the page already loads; trend/feed/health are fetched from /admin/* JSON routes. Every number
     is derived from the dmActivity log, which only starts when logging shipped, so "0" means
     "nothing logged", not necessarily "never did it". -->
<script lang="ts">
	import { ACTIVITY_LABELS, type ActivityFeature } from '$lib/activity';
	import type { DMSummary, EngagementReport, FeatureTrend } from '$lib/server/dmModel';
	import AdminActivityFeed from './AdminActivityFeed.svelte';
	import AdminSystemHealth from './AdminSystemHealth.svelte';

	let { dms, engagement }: { dms: DMSummary[]; engagement: EngagementReport } = $props();

	const BAR_COLOR = '#3987e5';
	// Dark-surface categorical slots 1–5, in fixed order (validated; see dataviz palette).
	const SERIES_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'];
	const labels: Record<string, string> = ACTIVITY_LABELS;

	// ── Onboarding funnel ───────────────────────────────────────────────────────────
	const funnel = $derived.by(() => {
		const all = Object.values(engagement.perDm);
		const stages = [
			{ label: 'Signed up', count: dms.length },
			{ label: 'Any activity logged', count: all.length },
			{ label: 'Added a player', count: all.filter((e) => e.features['player-added']).length },
			{ label: 'Added enemies', count: all.filter((e) => e.features['enemies-added']).length },
			{ label: 'Started combat', count: all.filter((e) => e.features['combat-started']).length },
			{ label: 'Came back (2+ days)', count: all.filter((e) => e.activeDays >= 2).length }
		];
		return stages.map((s, i) => ({
			...s,
			pctOfSignups: dms.length ? Math.round((s.count / dms.length) * 100) : 0,
			pctOfPrev:
				i === 0 || stages[i - 1].count === 0
					? null
					: Math.round((s.count / stages[i - 1].count) * 100)
		}));
	});

	// ── Adoption ──────────────────────────────────────────────────────────────────────
	const adoption = $derived.by(() => {
		const byFeature = new Map(engagement.adoption.map((a) => [a.feature, a]));
		return (Object.keys(ACTIVITY_LABELS) as ActivityFeature[])
			.map((feature) => ({
				feature,
				label: labels[feature],
				dmsEver: byFeature.get(feature)?.dmsEver ?? 0,
				dms7: byFeature.get(feature)?.dms7 ?? 0
			}))
			.sort((a, b) => b.dmsEver - a.dmsEver || a.label.localeCompare(b.label));
	});

	// ── Trend ─────────────────────────────────────────────────────────────────────────
	let trend = $state<FeatureTrend | null>(null);
	let trendError = $state('');

	$effect(() => {
		fetch('/admin/activity/trend')
			.then((r) => {
				if (!r.ok) throw new Error();
				return r.json();
			})
			.then((t: FeatureTrend) => (trend = t))
			.catch(() => (trendError = 'Could not load trend.'));
	});

	const W = 600;
	const H = 180;
	const PAD = { l: 34, r: 12, t: 10, b: 22 };
	const trendMax = $derived(Math.max(1, ...(trend?.series.flatMap((s) => s.values) ?? [1])));
	const xAt = (i: number, n: number) => PAD.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - PAD.l - PAD.r));
	const yAt = (v: number) => PAD.t + (1 - v / trendMax) * (H - PAD.t - PAD.b);
	const weekLabel = (ts: number) =>
		new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<p class="text-xs text-gray-500">
			Built from the usage log, which only counts activity since logging shipped.
		</p>
		<a
			href="/admin/activity/export"
			class="rounded border border-gray-700 bg-gray-900 px-2.5 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
		>
			Export full usage log (CSV)
		</a>
	</div>

	<div class="grid gap-3 lg:grid-cols-2">
		<!-- Onboarding funnel -->
		<section class="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
			<p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
				Onboarding funnel <span class="font-normal text-gray-600 normal-case"
					>· DMs reaching each step</span
				>
			</p>
			<ul class="space-y-2">
				{#each funnel as stage (stage.label)}
					<li
						class="text-xs"
						title="{stage.label}: {stage.count} DM{stage.count === 1
							? ''
							: 's'} ({stage.pctOfSignups}% of signups)"
					>
						<div class="mb-0.5 flex justify-between gap-2 text-gray-400">
							<span>{stage.label}</span>
							<span class="text-gray-300 tabular-nums">
								{stage.count}
								<span class="text-gray-600">
									· {stage.pctOfSignups}%{#if stage.pctOfPrev !== null}, {stage.pctOfPrev}% of
										previous{/if}
								</span>
							</span>
						</div>
						<div class="h-3 rounded bg-gray-800/60">
							<div
								class="h-3 rounded-r"
								style="width: {stage.pctOfSignups}%; background: {BAR_COLOR};"
							></div>
						</div>
					</li>
				{/each}
			</ul>
			<p class="mt-3 text-[11px] text-gray-600">
				The biggest drop between two steps is where new DMs get stuck.
			</p>
		</section>

		<!-- Adoption -->
		<section class="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
			<p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
				Feature adoption <span class="font-normal text-gray-600 normal-case"
					>· % of all DMs who ever used it</span
				>
			</p>
			<ul class="max-h-80 space-y-1.5 overflow-y-auto pr-2">
				{#each adoption as a (a.feature)}
					{@const pct = dms.length ? Math.round((a.dmsEver / dms.length) * 100) : 0}
					<li
						class="grid grid-cols-[minmax(0,10rem)_1fr_7.5rem] items-center gap-2 text-xs"
						title="{a.label}: {a.dmsEver} of {dms.length} DMs ever, {a.dms7} in the last 7 days"
					>
						<span class="truncate text-right text-gray-400">{a.label}</span>
						<span class="h-3 rounded bg-gray-800/60">
							<span class="block h-3 rounded-r" style="width: {pct}%; background: {BAR_COLOR};"
							></span>
						</span>
						<span class="text-gray-300 tabular-nums">
							{pct}%
							<span class="text-gray-600">· {a.dms7} this wk</span>
						</span>
					</li>
				{/each}
			</ul>
			<p class="mt-2 text-[11px] text-gray-600">
				Features at the bottom with 0% are ones nobody has tried — hard to find, or not wanted.
			</p>
		</section>
	</div>

	<!-- Trend -->
	<section class="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
		<p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
			Feature trend <span class="font-normal text-gray-600 normal-case"
				>· weekly uses, top 5 features</span
			>
		</p>
		{#if trendError}
			<p class="text-xs text-red-400">{trendError}</p>
		{:else if !trend}
			<p class="text-xs text-gray-600">Loading…</p>
		{:else if trend.series.length === 0}
			<p class="text-xs text-gray-600">No activity recorded in the last 8 weeks.</p>
		{:else}
			<svg
				viewBox="0 0 {W} {H}"
				class="w-full"
				role="img"
				aria-label="Weekly uses of the five most-used features"
			>
				{#each [0, 0.25, 0.5, 0.75, 1] as t (t)}
					<line
						x1={PAD.l}
						x2={W - PAD.r}
						y1={yAt(trendMax * t)}
						y2={yAt(trendMax * t)}
						stroke="#1f2937"
						stroke-width="1"
					/>
					<text
						x={PAD.l - 6}
						y={yAt(trendMax * t) + 3}
						text-anchor="end"
						font-size="9"
						fill="#6b7280"
					>
						{Math.round(trendMax * t)}
					</text>
				{/each}
				{#each trend.weekStarts as ts, i (ts)}
					<text
						x={xAt(i, trend.weekStarts.length)}
						y={H - 6}
						text-anchor="middle"
						font-size="9"
						fill="#6b7280"
					>
						{weekLabel(ts)}
					</text>
				{/each}
				{#each trend.series as s, si (s.feature)}
					<polyline
						fill="none"
						stroke={SERIES_COLORS[si]}
						stroke-width="2"
						stroke-linejoin="round"
						points={s.values.map((v, i) => `${xAt(i, s.values.length)},${yAt(v)}`).join(' ')}
					/>
					{#each s.values as v, i (i)}
						<circle
							cx={xAt(i, s.values.length)}
							cy={yAt(v)}
							r="4"
							fill={SERIES_COLORS[si]}
							stroke="#030712"
							stroke-width="2"
						>
							<title>{labels[s.feature]} · week of {weekLabel(trend.weekStarts[i])}: {v}</title>
						</circle>
					{/each}
				{/each}
			</svg>
			<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
				{#each trend.series as s, si (s.feature)}
					<span class="flex items-center gap-1.5">
						<span class="inline-block h-2 w-2 rounded-sm" style="background: {SERIES_COLORS[si]}"
						></span>
						{labels[s.feature]} <span class="text-gray-600">({s.total})</span>
					</span>
				{/each}
			</div>
		{/if}
	</section>

	<AdminActivityFeed />
	<AdminSystemHealth />
</div>
