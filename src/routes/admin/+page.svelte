<!-- /admin — system-wide list of every DM account. Owner-only (see hooks.server.ts +
     $lib/server/admin.ts).

     Row actions:
       Enter dashboard — impersonates that DM: sets dm_impersonate and gives full read/write
                          control of their account until the admin exits (banner on /dashboard)
                          or the cookie expires (8h).
       Suspend/Restore — blocks/restores login + dashboard access without touching their data.
       Delete          — permanently removes the account and everything embedded in it.

     Everything else (usage stats, the read-only Inspect link, password reset, JSON export,
     Make/Remove admin, and this user's slice of the audit log) lives behind a per-row "Details"
     toggle — collapsed by default so the table stays scannable as the account list grows.
     Make/Remove admin only appears for the root admin — a promoted admin can't mint further
     admins (see $lib/server/admin.ts). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { AdminAuditAction } from '$lib/server/dmModel';

	let { data, form } = $props();

	type Filter = 'all' | 'suspended' | 'stale';
	let search = $state('');
	let filter = $state<Filter>('all');
	let expanded = $state<Set<string>>(new Set());
	let dismissedTempPassword = $state(false);

	const STALE_MS = 1000 * 60 * 60 * 24 * 90; // 90 days

	function formatDate(d: string | Date | null): string {
		if (!d) return 'Never';
		return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
	}

	function toggleExpand(sessionId: string) {
		const next = new Set(expanded);
		if (next.has(sessionId)) next.delete(sessionId);
		else next.add(sessionId);
		expanded = next;
	}

	function confirmDelete(name: string) {
		return ({ cancel }: { cancel: () => void }) => {
			if (
				!confirm(
					`Permanently delete ${name}'s account? This removes all of their game sessions, combat history, custom monsters, and encounters. This cannot be undone.`
				)
			) {
				cancel();
			}
		};
	}

	function confirmSuspend(name: string) {
		return ({ cancel }: { cancel: () => void }) => {
			if (
				!confirm(
					`Suspend ${name}? They won't be able to log in or reach their dashboard until you restore them.`
				)
			)
				cancel();
		};
	}

	function confirmResetPassword(name: string) {
		return ({ cancel }: { cancel: () => void }) => {
			if (
				!confirm(
					`Generate a new password for ${name}? Their current password will stop working immediately.`
				)
			)
				cancel();
		};
	}

	function confirmPromote(name: string) {
		return ({ cancel }: { cancel: () => void }) => {
			if (
				!confirm(
					`Make ${name} an admin? They'll get full access to this panel — impersonating, suspending, and deleting any account.`
				)
			)
				cancel();
		};
	}

	function confirmDemote(name: string) {
		return ({ cancel }: { cancel: () => void }) => {
			if (!confirm(`Remove admin access from ${name}?`)) cancel();
		};
	}

	const actionLabels: Record<AdminAuditAction, string> = {
		'impersonate-start': 'Started impersonating',
		'impersonate-stop': 'Stopped impersonating',
		suspend: 'Suspended account',
		unsuspend: 'Restored account',
		'promote-admin': 'Granted admin access',
		'demote-admin': 'Revoked admin access',
		'password-reset': 'Reset password',
		'export-data': 'Exported data',
		'delete-account': 'Deleted account'
	};

	let auditByEmail = $derived.by(() => {
		const map = new Map<string, typeof data.auditLog>();
		for (const entry of data.auditLog) {
			const list = map.get(entry.targetEmail) ?? [];
			list.push(entry);
			map.set(entry.targetEmail, list);
		}
		return map;
	});

	let filteredDms = $derived(
		data.dms.filter((dm) => {
			if (filter === 'suspended' && !dm.suspended) return false;
			if (filter === 'stale') {
				const last = new Date(dm.lastActiveAt ?? dm.createdAt).getTime();
				if (Date.now() - last < STALE_MS) return false;
			}
			const q = search.trim().toLowerCase();
			if (q) {
				const hay = `${dm.firstName} ${dm.lastName} ${dm.email}`.toLowerCase();
				if (!hay.includes(q)) return false;
			}
			return true;
		})
	);

	// New temp password just came back from the resetPassword action — surface it and reset the
	// dismiss state so a second reset (for the same or a different DM) shows its own banner.
	$effect(() => {
		if (form && 'tempPassword' in form) dismissedTempPassword = false;
	});
</script>

<svelte:head>
	<title>Admin — Initiative Tracker</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 px-4 py-8 text-gray-200 sm:px-8">
	<div class="mx-auto max-w-6xl">
		<header class="mb-6 flex flex-wrap items-center justify-between gap-3">
			<div>
				<h1 class="text-xl font-bold tracking-widest text-amber-400 uppercase">⚔️ System Admin</h1>
				<p class="mt-1 text-sm text-gray-500">
					Logged in as {data.dmFirstName} · every DM account that has accessed this system.
				</p>
			</div>
			<a
				href="/dashboard"
				class="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition hover:border-amber-600 hover:text-amber-300"
			>
				My dashboard
			</a>
		</header>

		{#if form?.tempPassword && !dismissedTempPassword}
			<div class="mb-4 rounded border border-amber-700 bg-amber-950/40 px-4 py-3 text-sm">
				<div class="flex items-start justify-between gap-3">
					<div>
						<p class="font-semibold text-amber-300">
							New password for {form.tempPasswordFor}
						</p>
						<p class="mt-1 text-gray-400">
							Shown once — copy it and share with them out of band now. It will not be shown again.
						</p>
						<code class="mt-2 inline-block rounded bg-black/40 px-2 py-1 font-mono text-amber-200">
							{form.tempPassword}
						</code>
					</div>
					<button
						onclick={() => (dismissedTempPassword = true)}
						class="shrink-0 rounded p-1 text-gray-500 transition hover:text-gray-300"
						aria-label="Dismiss"
					>
						✕
					</button>
				</div>
			</div>
		{/if}

		{#if form?.error}
			<p class="mb-4 rounded border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
				{form.error}
			</p>
		{/if}

		<!-- Search + filter -->
		<div class="mb-4 flex flex-wrap items-center gap-2">
			<input
				type="text"
				bind:value={search}
				placeholder="Search name or email…"
				class="w-64 rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-amber-600 focus:outline-none"
			/>
			<div class="flex rounded border border-gray-700 bg-gray-900 text-sm">
				{#each [['all', 'All'], ['suspended', 'Suspended'], ['stale', 'Stale (90d+)']] as [value, label] (value)}
					<button
						onclick={() => (filter = value as Filter)}
						class="px-3 py-1.5 transition {filter === value
							? 'bg-amber-900/40 text-amber-300'
							: 'text-gray-400 hover:text-gray-200'}"
					>
						{label}
					</button>
				{/each}
			</div>
			<span class="text-xs text-gray-600">{filteredDms.length} of {data.dms.length}</span>
		</div>

		<div class="overflow-x-auto rounded-lg border border-gray-800">
			<table class="w-full min-w-[820px] border-collapse text-sm">
				<thead>
					<tr
						class="border-b border-gray-800 bg-gray-900 text-left text-xs tracking-wider text-gray-500 uppercase"
					>
						<th class="px-4 py-3 font-medium"></th>
						<th class="px-4 py-3 font-medium">Name</th>
						<th class="px-4 py-3 font-medium">Email</th>
						<th class="px-4 py-3 font-medium">Status</th>
						<th class="px-4 py-3 font-medium">Signed up</th>
						<th class="px-4 py-3 font-medium">Last active</th>
						<th class="px-4 py-3 font-medium"></th>
					</tr>
				</thead>
				<tbody>
					{#each filteredDms as dm (dm.sessionId)}
						{@const isSelf = dm.sessionId === data.realSessionId}
						{@const isExpanded = expanded.has(dm.sessionId)}
						{@const auditEntries = auditByEmail.get(dm.email) ?? []}
						<tr class="border-b border-gray-800/60 bg-gray-900/40 hover:bg-gray-900">
							<td class="px-4 py-3">
								<button
									onclick={() => toggleExpand(dm.sessionId)}
									class="rounded p-1 text-gray-500 transition hover:text-amber-400"
									title={isExpanded ? 'Hide details' : 'Show details'}
									aria-expanded={isExpanded}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-3.5 w-3.5 transition-transform {isExpanded ? 'rotate-90' : ''}"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2.5"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
									</svg>
								</button>
							</td>
							<td class="px-4 py-3 font-semibold text-gray-100">
								<div>
									{dm.firstName}
									{dm.lastName}
									{#if isSelf}<span class="ml-1 text-xs font-normal text-gray-600">(you)</span>{/if}
								</div>
								{#if dm.isAdmin}
									<span
										class="mt-1 inline-block rounded border border-amber-700/60 bg-amber-900/30 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap text-amber-300 uppercase"
										title={dm.isRootAdmin ? 'Root admin' : 'Promoted admin'}
									>
										{dm.isRootAdmin ? '★ Root Admin' : 'Admin'}
									</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-gray-400">{dm.email}</td>
							<td class="px-4 py-3">
								{#if dm.suspended}
									<span
										class="rounded border border-red-800 bg-red-950/40 px-2 py-0.5 text-xs text-red-400"
										>Suspended</span
									>
								{:else}
									<span
										class="rounded border border-green-800 bg-green-950/40 px-2 py-0.5 text-xs text-green-400"
										>Active</span
									>
								{/if}
							</td>
							<td class="px-4 py-3 text-gray-500">{formatDate(dm.createdAt)}</td>
							<td class="px-4 py-3 text-gray-500">{formatDate(dm.lastActiveAt)}</td>
							<td class="px-4 py-3 text-right">
								{#if !isSelf}
									<div class="flex justify-end gap-2">
										<form method="POST" action="?/impersonate" use:enhance>
											<input type="hidden" name="sessionId" value={dm.sessionId} />
											<button
												type="submit"
												class="rounded border border-amber-700/60 bg-amber-900/20 px-3 py-1 text-xs font-semibold text-amber-300 transition hover:border-amber-500 hover:bg-amber-900/40"
											>
												Enter dashboard
											</button>
										</form>
										{#if dm.suspended}
											<form method="POST" action="?/unsuspend" use:enhance>
												<input type="hidden" name="sessionId" value={dm.sessionId} />
												<button
													type="submit"
													class="rounded border border-green-800/60 bg-green-950/20 px-3 py-1 text-xs font-semibold text-green-300 transition hover:border-green-600 hover:bg-green-900/40"
												>
													Restore
												</button>
											</form>
										{:else}
											<form
												method="POST"
												action="?/suspend"
												use:enhance={confirmSuspend(`${dm.firstName} ${dm.lastName}`)}
											>
												<input type="hidden" name="sessionId" value={dm.sessionId} />
												<button
													type="submit"
													class="rounded border border-gray-600 bg-gray-800/60 px-3 py-1 text-xs font-semibold text-gray-300 transition hover:border-gray-500 hover:bg-gray-800"
												>
													Suspend
												</button>
											</form>
										{/if}
										<form
											method="POST"
											action="?/delete"
											use:enhance={confirmDelete(`${dm.firstName} ${dm.lastName}`)}
										>
											<input type="hidden" name="sessionId" value={dm.sessionId} />
											<button
												type="submit"
												class="rounded border border-red-800/60 bg-red-950/20 px-3 py-1 text-xs font-semibold text-red-300 transition hover:border-red-600 hover:bg-red-900/40"
											>
												Delete
											</button>
										</form>
									</div>
								{/if}
							</td>
						</tr>
						{#if isExpanded}
							<tr class="border-b border-gray-800/60 bg-black/20">
								<td colspan="7" class="px-6 py-4">
									<div class="flex flex-wrap gap-6">
										<!-- Usage stats -->
										<div>
											<p class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
												Usage
											</p>
											<div class="flex flex-wrap gap-1.5 text-xs">
												<span
													class="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-gray-300"
													>{dm.gameSessionCount} session{dm.gameSessionCount === 1 ? '' : 's'}</span
												>
												<span
													class="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-gray-300"
													>{dm.customMonsterCount} custom monster{dm.customMonsterCount === 1
														? ''
														: 's'}</span
												>
												<span
													class="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-gray-300"
													>{dm.encounterCount} saved encounter{dm.encounterCount === 1
														? ''
														: 's'}</span
												>
												<span
													class="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-gray-300"
													>{dm.combatHistoryCount} combat record{dm.combatHistoryCount === 1
														? ''
														: 's'}</span
												>
											</div>
										</div>

										<!-- Support tools -->
										{#if !isSelf}
											<div>
												<p
													class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase"
												>
													Support tools
												</p>
												<div class="flex flex-wrap items-center gap-2 text-xs">
													{#if dm.activeSessionPublicId}
														<a
															href="/display/{dm.activeSessionPublicId}"
															target="_blank"
															rel="noopener noreferrer"
															class="rounded border border-gray-600 bg-gray-800 px-2.5 py-1 text-gray-300 transition hover:border-blue-500 hover:text-blue-300"
														>
															Inspect (read-only) ↗
														</a>
													{/if}
													<form
														method="POST"
														action="?/resetPassword"
														use:enhance={confirmResetPassword(`${dm.firstName} ${dm.lastName}`)}
													>
														<input type="hidden" name="sessionId" value={dm.sessionId} />
														<button
															type="submit"
															title={dm.hasPassword
																? 'Generates a new password, shown once, for you to relay to them'
																: 'This account currently uses OAuth only — this adds a password login option'}
															class="rounded border border-gray-600 bg-gray-800 px-2.5 py-1 text-gray-300 transition hover:border-amber-500 hover:text-amber-300"
														>
															Reset password
														</button>
													</form>
													<a
														href="/admin/export/{dm.sessionId}"
														class="rounded border border-gray-600 bg-gray-800 px-2.5 py-1 text-gray-300 transition hover:border-gray-500 hover:text-gray-100"
													>
														Export JSON v
													</a>
													{#if data.isRootAdmin && !dm.isRootAdmin}
														{#if dm.isAdmin}
															<form
																method="POST"
																action="?/demote"
																use:enhance={confirmDemote(`${dm.firstName} ${dm.lastName}`)}
															>
																<input type="hidden" name="sessionId" value={dm.sessionId} />
																<button
																	type="submit"
																	class="rounded border border-gray-600 bg-gray-800 px-2.5 py-1 text-gray-300 transition hover:border-gray-500 hover:text-gray-100"
																>
																	Remove admin
																</button>
															</form>
														{:else}
															<form
																method="POST"
																action="?/promote"
																use:enhance={confirmPromote(`${dm.firstName} ${dm.lastName}`)}
															>
																<input type="hidden" name="sessionId" value={dm.sessionId} />
																<button
																	type="submit"
																	class="rounded border border-amber-700/60 bg-amber-900/20 px-2.5 py-1 text-amber-300 transition hover:border-amber-500 hover:bg-amber-900/40"
																>
																	Make admin
																</button>
															</form>
														{/if}
													{/if}
												</div>
											</div>
										{/if}

										<!-- Activity log — this DM's slice of the admin audit trail -->
										<div class="min-w-[240px] flex-1">
											<p class="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
												Activity log
											</p>
											{#if auditEntries.length === 0}
												<p class="text-xs text-gray-600">
													No admin actions recorded for this account.
												</p>
											{:else}
												<ul class="space-y-1 text-xs text-gray-400">
													{#each auditEntries as entry, i (i)}
														<li>
															<span class="text-gray-300"
																>{actionLabels[entry.action] ?? entry.action}</span
															>
															<span class="text-gray-600"
																>by {entry.adminEmail} · {formatDate(entry.at)}</span
															>
														</li>
													{/each}
												</ul>
											{/if}
										</div>
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>

		{#if filteredDms.length === 0}
			<p class="mt-6 text-center text-gray-500">
				{data.dms.length === 0 ? 'No DM accounts yet.' : 'No accounts match your search/filter.'}
			</p>
		{/if}
	</div>
</div>
