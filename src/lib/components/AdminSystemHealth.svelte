<!-- System health panel for /admin's Insights tab — process, live-session, database and email
     numbers from GET /admin/health. In-memory figures (connections, live sessions, uptime) are
     per-process and reset on a PM2 restart. Refreshes itself while the tab is open. -->
<script lang="ts">
	import type { SystemHealth } from '$lib/server/health';

	const REFRESH_MS = 30_000;

	let health = $state<SystemHealth | null>(null);
	let error = $state('');
	let tick = $state(0);

	async function load() {
		try {
			const res = await fetch('/admin/health');
			if (!res.ok) throw new Error();
			health = await res.json();
			error = '';
		} catch {
			error = 'Could not load system health.';
		}
	}

	$effect(() => {
		tick; // re-run on manual refresh
		load();
		const id = setInterval(load, REFRESH_MS);
		return () => clearInterval(id);
	});

	function uptime(seconds: number): string {
		const d = Math.floor(seconds / 86400);
		const h = Math.floor((seconds % 86400) / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
	}

	const tiles = $derived(
		health
			? [
					{ label: 'Live viewer connections', value: health.sseConnections },
					{ label: 'Sessions with viewers', value: health.sessionsWithViewers },
					{ label: 'Sessions in memory', value: health.liveSessions },
					{ label: 'Server uptime', value: uptime(health.uptimeSeconds) },
					{
						label: 'Memory (RSS / heap)',
						value: `${health.memoryRssMb} / ${health.memoryHeapMb} MB`
					},
					{
						label: 'Database size',
						value: health.db ? `${health.db.dataMb} MB` : '—',
						sub: health.db ? `${health.db.documents.toLocaleString()} docs` : 'unavailable'
					},
					{
						label: 'Emails sent (30d)',
						value: health.emailsSent30d,
						sub: health.mailConfigured ? 'Postmark configured' : 'Postmark NOT configured',
						bad: !health.mailConfigured
					},
					{
						label: 'Email failures (30d)',
						value: health.emailsFailed30d,
						sub: health.lastEmailFailureAt
							? `last ${new Date(health.lastEmailFailureAt).toLocaleDateString()}`
							: 'none recorded',
						bad: health.emailsFailed30d > 0
					}
				]
			: []
	);
</script>

<section class="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
	<div class="mb-3 flex items-center justify-between gap-2">
		<p class="text-xs font-semibold tracking-wide text-gray-400 uppercase">
			System health
			{#if health}
				<span class="font-normal text-gray-600 normal-case">
					· as of {new Date(health.checkedAt).toLocaleTimeString()}
				</span>
			{/if}
		</p>
		<button
			onclick={() => tick++}
			class="rounded border border-gray-700 bg-gray-900 px-2.5 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
		>
			Refresh
		</button>
	</div>

	{#if error}
		<p class="text-xs text-red-400">{error}</p>
	{:else if !health}
		<p class="text-xs text-gray-600">Loading…</p>
	{:else}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{#each tiles as t (t.label)}
				<div class="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2.5">
					<p class="text-lg font-bold {t.bad ? 'text-red-400' : 'text-gray-100'}">{t.value}</p>
					<p class="text-xs text-gray-500">{t.label}</p>
					{#if t.sub}<p class="text-[11px] {t.bad ? 'text-red-400/80' : 'text-gray-600'}">
							{t.sub}
						</p>{/if}
				</div>
			{/each}
		</div>
		<p class="mt-2 text-[11px] text-gray-600">
			{health.counts.dms} DMs · {health.counts.players} players · {health.counts.activityEntries.toLocaleString()}
			usage entries · {health.counts.auditEntries.toLocaleString()} audit entries
		</p>
	{/if}
</section>
