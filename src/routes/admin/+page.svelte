<!-- /admin — system-wide list of every DM account. Owner-only (see hooks.server.ts +
     $lib/server/admin.ts). Clicking "Enter dashboard" on a row impersonates that DM: it sets
     the dm_impersonate cookie and gives full read/write control of their account until the
     admin explicitly exits (banner shown on /dashboard) or the cookie expires (8h). -->
<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	function formatDate(d: string | Date | null): string {
		if (!d) return 'Never';
		return new Date(d).toLocaleString(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}

	/** Confirms before letting the delete form actually submit. */
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
</script>

<svelte:head>
	<title>Admin — Initiative Tracker</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 px-4 py-8 text-gray-200 sm:px-8">
	<div class="mx-auto max-w-5xl">
		<header class="mb-6 flex items-center justify-between">
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

		{#if form?.error}
			<p class="mb-4 rounded border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
				{form.error}
			</p>
		{/if}

		<div class="overflow-x-auto rounded-lg border border-gray-800">
			<table class="w-full min-w-[720px] border-collapse text-sm">
				<thead>
					<tr
						class="border-b border-gray-800 bg-gray-900 text-left text-xs tracking-wider text-gray-500 uppercase"
					>
						<th class="px-4 py-3 font-medium">Name</th>
						<th class="px-4 py-3 font-medium">Email</th>
						<th class="px-4 py-3 font-medium">Sessions</th>
						<th class="px-4 py-3 font-medium">Signed up</th>
						<th class="px-4 py-3 font-medium">Last active</th>
						<th class="px-4 py-3 font-medium"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.dms as dm (dm.sessionId)}
						<tr class="border-b border-gray-800/60 bg-gray-900/40 hover:bg-gray-900">
							<td class="px-4 py-3 font-semibold text-gray-100">{dm.firstName} {dm.lastName}</td>
							<td class="px-4 py-3 text-gray-400">{dm.email}</td>
							<td class="px-4 py-3 text-gray-400">{dm.gameSessionCount}</td>
							<td class="px-4 py-3 text-gray-500">{formatDate(dm.createdAt)}</td>
							<td class="px-4 py-3 text-gray-500">{formatDate(dm.lastActiveAt)}</td>
							<td class="px-4 py-3 text-right">
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
									{#if dm.sessionId !== data.realSessionId}
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
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if data.dms.length === 0}
			<p class="mt-6 text-center text-gray-500">No DM accounts yet.</p>
		{/if}
	</div>
</div>
