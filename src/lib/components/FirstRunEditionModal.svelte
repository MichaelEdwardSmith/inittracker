<!-- Shown on first login to let the DM choose their D&D edition.
     Cannot be dismissed — a choice must be made before using the dashboard. -->
<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	interface Props {
		sessionId: string; // internal UUID of the active session (unused for guests)
		isGuest?: boolean;
		onpick?: (ruleset: '2014' | '2024') => void; // guest-only: called instead of API
	}

	let { sessionId, isGuest = false, onpick }: Props = $props();

	let selected = $state<'2014' | '2024' | null>(null);
	let saving = $state(false);
	let error = $state('');

	async function confirm() {
		if (!selected) return;

		// Guests: hand the choice back to the parent — no server call, no persistence
		if (isGuest) {
			onpick?.(selected);
			return;
		}

		saving = true;
		error = '';
		try {
			const res = await fetch('/api/sessions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'set-ruleset', id: sessionId, ruleset: selected })
			});
			if (!res.ok) {
				error = 'Something went wrong. Please try again.';
				return;
			}
			// Refresh page data so the dashboard gets the confirmed ruleset
			await invalidateAll();
		} finally {
			saving = false;
		}
	}
</script>

<!-- Full-screen backdrop — intentionally no click-to-close -->
<div
	class="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
	role="dialog"
	aria-modal="true"
	aria-labelledby="edition-modal-title"
>
	<div
		class="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
	>
		<!-- Header -->
		<div class="border-b border-gray-700 px-6 py-5 text-center">
			<div class="mb-2 text-4xl">⚔️</div>
			<h2
				id="edition-modal-title"
				class="text-xl font-black tracking-widest text-amber-400 uppercase"
			>
				Choose Your Edition
			</h2>
			<p class="mt-1 text-sm text-gray-400">
				Which version of D&D will you be running? This shapes the bestiary, spells, and rules
				available in your session.
			</p>
		</div>

		<!-- Edition cards -->
		<div class="grid grid-cols-2 gap-4 p-6">
			<!-- 2014 card -->
			<button
				type="button"
				onclick={() => (selected = '2014')}
				class="rounded-lg border-2 p-4 text-left transition
					{selected === '2014'
					? 'border-amber-500 bg-amber-950/30'
					: 'border-gray-700 bg-gray-800/40 hover:border-gray-500'}"
			>
				<p class="mb-1 font-black tracking-wide text-amber-400">D&D 5e (2014)</p>
				<p class="mb-3 text-xs text-gray-500 italic">Player's Handbook · Monster Manual · DMG</p>
				<ul class="space-y-1 text-xs text-gray-300">
					<li>• Original Monster Manual bestiary</li>
					<li>• Classic PHB / XGE / TCE spells</li>
					<li>• 6-tier Exhaustion table</li>
					<li>• XP multiplier encounter difficulty</li>
				</ul>
				{#if selected === '2014'}
					<div class="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-400">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
							<path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clip-rule="evenodd"/>
						</svg>
						Selected
					</div>
				{/if}
			</button>

			<!-- 2024 card -->
			<button
				type="button"
				onclick={() => (selected = '2024')}
				class="rounded-lg border-2 p-4 text-left transition
					{selected === '2024'
					? 'border-blue-500 bg-blue-950/30'
					: 'border-gray-700 bg-gray-800/40 hover:border-gray-500'}"
			>
				<p class="mb-1 font-black tracking-wide text-blue-400">D&D 2024</p>
				<p class="mb-3 text-xs text-gray-500 italic">2024 Player's Handbook · Monster Manual</p>
				<ul class="space-y-1 text-xs text-gray-300">
					<li>• 2024 Monster Manual bestiary</li>
					<li>• 339 spells, flat format</li>
					<li>• Stacking −1 Exhaustion (10 levels)</li>
					<li>• XP budget encounter difficulty</li>
				</ul>
				{#if selected === '2024'}
					<div class="mt-3 flex items-center gap-1.5 text-xs font-bold text-blue-400">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
							<path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clip-rule="evenodd"/>
						</svg>
						Selected
					</div>
				{/if}
			</button>
		</div>

		<!-- Warning + confirm -->
		<div class="border-t border-gray-700 px-6 pb-6">
			<div
				class="mb-4 rounded-lg border border-orange-800/40 bg-orange-950/20 px-4 py-2.5 text-xs text-orange-200"
			>
				<strong class="text-white">This choice is permanent.</strong> It cannot be changed after
				confirming. You can always create a new session with a different edition.
			</div>

			{#if error}
				<p class="mb-3 text-xs text-red-400">{error}</p>
			{/if}

			<button
				type="button"
				onclick={confirm}
				disabled={!selected || saving}
				class="w-full rounded-lg px-4 py-3 text-sm font-black tracking-widest uppercase transition
					disabled:cursor-not-allowed disabled:opacity-40
					{selected === '2024'
					? 'bg-blue-600 text-white hover:bg-blue-500'
					: selected === '2014'
						? 'bg-amber-600 text-gray-950 hover:bg-amber-500'
						: 'bg-gray-700 text-gray-400'}"
			>
				{saving ? 'Saving…' : selected ? `Confirm — ${selected === '2024' ? 'D&D 2024' : 'D&D 5e (2014)'}` : 'Select an Edition'}
			</button>
		</div>
	</div>
</div>
