<!-- Aggregate stats panel for /admin — sits above the DM/Player tabs. Everything here is
     computed client-side from data the page already loads (DMSummary[], PlayerSummary[],
     AdminAuditEntry[]); no new backend endpoints or stored history. Because we only ever have
     each account's *current* lastActiveAt (not a log of every active day), the "Last Active"
     chart is a recency histogram (when was each account last seen), not a true daily/weekly
     active-users time series. -->
<script lang="ts">
	import type { DMSummary, AdminAuditEntry } from '$lib/server/dmModel';
	import type { PlayerSummary } from '$lib/server/playerModel';

	let {
		dms,
		players,
		auditLog
	}: { dms: DMSummary[]; players: PlayerSummary[]; auditLog: AdminAuditEntry[] } = $props();

	type Series = { name: string; color: string; values: number[] };

	// Validated dark-mode categorical pair (blue/orange) — passes lightness band, CVD Delta E,
	// and contrast checks against this page's bg-gray-950 (#030712) surface.
	const DM_COLOR = '#3987e5';
	const PLAYER_COLOR = '#d95926';

	const DAY_MS = 24 * 60 * 60 * 1000;
	const WEEK_MS = 7 * DAY_MS;
	const TRAILING_WEEKS = 8;

	function toTime(d: Date | string): number {
		return new Date(d).getTime();
	}

	function startOfWeek(ts: number): number {
		const d = new Date(ts);
		d.setHours(0, 0, 0, 0);
		d.setDate(d.getDate() - d.getDay());
		return d.getTime();
	}

	function weekLabel(ts: number): string {
		return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	// [0] = everything before the trailing window, [1..n] = one count per week, oldest to newest.
	function bucketByWeek(dates: number[], weekStarts: number[]): number[] {
		const counts = new Array(weekStarts.length + 1).fill(0);
		const first = weekStarts[0];
		for (const t of dates) {
			if (t < first) {
				counts[0]++;
				continue;
			}
			const idx = Math.min(Math.floor((t - first) / WEEK_MS), weekStarts.length - 1);
			counts[idx + 1]++;
		}
		return counts;
	}

	const weekStarts = $derived.by(() => {
		const thisWeek = startOfWeek(Date.now());
		return Array.from(
			{ length: TRAILING_WEEKS },
			(_, i) => thisWeek - (TRAILING_WEEKS - 1 - i) * WEEK_MS
		);
	});

	const weekLabels = $derived(['Earlier', ...weekStarts.map(weekLabel)]);

	const signups = $derived.by(() => {
		const dmCounts = bucketByWeek(
			dms.map((d) => toTime(d.createdAt)),
			weekStarts
		);
		const playerCounts = bucketByWeek(
			players.map((p) => toTime(p.createdAt)),
			weekStarts
		);
		return [
			{ name: 'DMs', color: DM_COLOR, values: dmCounts },
			{ name: 'Players', color: PLAYER_COLOR, values: playerCounts }
		] satisfies Series[];
	});

	const activity = $derived.by(() => {
		const counts = bucketByWeek(
			auditLog.map((e) => toTime(e.at)),
			weekStarts
		);
		return [{ name: 'Admin actions', color: DM_COLOR, values: counts }] satisfies Series[];
	});

	const RECENCY_BUCKETS = [
		{ label: 'This week', maxDays: 7 },
		{ label: '8–30d', maxDays: 30 },
		{ label: '31–90d', maxDays: 90 },
		{ label: '91–180d', maxDays: 180 },
		{ label: '180d+', maxDays: Infinity }
	];

	function recencyIndex(lastActiveAt: Date | string | null, createdAt: Date | string): number {
		const t = toTime(lastActiveAt ?? createdAt);
		const days = (Date.now() - t) / DAY_MS;
		return RECENCY_BUCKETS.findIndex((b) => days <= b.maxDays);
	}

	const recency = $derived.by(() => {
		const dmCounts = new Array(RECENCY_BUCKETS.length).fill(0);
		for (const dm of dms) dmCounts[recencyIndex(dm.lastActiveAt, dm.createdAt)]++;
		const playerCounts = new Array(RECENCY_BUCKETS.length).fill(0);
		for (const p of players) playerCounts[recencyIndex(p.lastActiveAt, p.createdAt)]++;
		return [
			{ name: 'DMs', color: DM_COLOR, values: dmCounts },
			{ name: 'Players', color: PLAYER_COLOR, values: playerCounts }
		] satisfies Series[];
	});

	const stats = $derived.by(() => {
		const weekAgo = Date.now() - WEEK_MS;
		const newThisWeek =
			dms.filter((d) => toTime(d.createdAt) >= weekAgo).length +
			players.filter((p) => toTime(p.createdAt) >= weekAgo).length;
		const suspendedDms = dms.filter((d) => d.suspended).length;
		const suspendedPlayers = players.filter((p) => p.suspended).length;
		return {
			totalDms: dms.length,
			totalPlayers: players.length,
			newThisWeek,
			suspendedDms,
			suspendedPlayers
		};
	});
</script>

{#snippet legend(series: Series[])}
	{#if series.length > 1}
		<div class="flex flex-wrap gap-3 text-[11px] text-gray-500">
			{#each series as s (s.name)}
				<span class="flex items-center gap-1.5">
					<span class="inline-block h-2 w-2 rounded-sm" style="background: {s.color}"></span>
					{s.name}
				</span>
			{/each}
		</div>
	{/if}
{/snippet}

{#snippet barChart(labels: string[], series: Series[])}
	{@const max = Math.max(1, ...series.flatMap((s) => s.values))}
	<div class="flex h-32 items-end gap-1">
		{#each labels as label, i (label + i)}
			<div class="flex h-full flex-1 flex-col items-center justify-end gap-1">
				<div class="flex h-full w-full items-end justify-center gap-0.5">
					{#each series as s (s.name)}
						<div
							class="w-2.5 rounded-t sm:w-3"
							style="height: {s.values[i] > 0
								? Math.max((s.values[i] / max) * 100, 3)
								: 0}%; background: {s.color};"
							title="{s.name} · {label}: {s.values[i]}"
						></div>
					{/each}
				</div>
				<span class="w-full truncate text-center text-[9px] text-gray-600">{label}</span>
			</div>
		{/each}
	</div>
{/snippet}

<div class="mb-6">
	<!-- Headline stat tiles -->
	<div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
			<p class="text-2xl font-bold text-gray-100">{stats.totalDms}</p>
			<p class="text-xs text-gray-500">Total DMs</p>
		</div>
		<div class="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
			<p class="text-2xl font-bold text-gray-100">{stats.totalPlayers}</p>
			<p class="text-xs text-gray-500">Total Players</p>
		</div>
		<div class="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
			<p class="text-2xl font-bold text-amber-400">{stats.newThisWeek}</p>
			<p class="text-xs text-gray-500">New this week</p>
		</div>
		<div class="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
			<p class="text-2xl font-bold text-red-400">{stats.suspendedDms + stats.suspendedPlayers}</p>
			<p class="text-xs text-gray-500">
				Suspended <span class="text-gray-600"
					>({stats.suspendedDms} DM{stats.suspendedDms === 1 ? '' : 's'}, {stats.suspendedPlayers} player{stats.suspendedPlayers ===
					1
						? ''
						: 's'})</span
				>
			</p>
		</div>
	</div>

	<!-- Charts -->
	<div class="grid gap-3 lg:grid-cols-3">
		<div class="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
			<div class="mb-3 flex items-start justify-between gap-2">
				<p class="text-xs font-semibold tracking-wide text-gray-400 uppercase">
					Signups <span class="font-normal text-gray-600 normal-case">· by week</span>
				</p>
				{@render legend(signups)}
			</div>
			{@render barChart(weekLabels, signups)}
		</div>

		<div class="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
			<div class="mb-3 flex items-start justify-between gap-2">
				<p class="text-xs font-semibold tracking-wide text-gray-400 uppercase">
					Last active <span class="font-normal text-gray-600 normal-case">· recency</span>
				</p>
				{@render legend(recency)}
			</div>
			{@render barChart(
				RECENCY_BUCKETS.map((b) => b.label),
				recency
			)}
		</div>

		<div class="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
			<div class="mb-3 flex items-start justify-between gap-2">
				<p class="text-xs font-semibold tracking-wide text-gray-400 uppercase">
					Admin activity <span class="font-normal text-gray-600 normal-case">· by week</span>
				</p>
				{@render legend(activity)}
			</div>
			{@render barChart(weekLabels, activity)}
		</div>
	</div>
</div>
