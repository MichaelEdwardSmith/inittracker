<!-- Shown when creating a new game session. Lets the DM choose 2014 or 2024 ruleset.
     This choice is permanent and cannot be changed after the session is created. -->
<script lang="ts">
	interface Props {
		defaultName: string;
		oncreate: (name: string, ruleset: '2014' | '2024') => void;
		oncancel: () => void;
	}

	let { defaultName, oncreate, oncancel }: Props = $props();

	let selectedRuleset = $state<'2014' | '2024' | null>(null);
	let sessionName = $state(defaultName);

	function submit() {
		if (!selectedRuleset) return;
		oncreate(sessionName.trim() || defaultName, selectedRuleset);
	}
</script>

<div
	role="dialog"
	aria-modal="true"
	aria-label="Choose ruleset"
	class="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4"
	tabindex="-1"
	onclick={(e) => {
		if (e.target === e.currentTarget) oncancel();
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') oncancel();
	}}
>
	<div class="w-full max-w-xl rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
		<!-- Header -->
		<div class="border-b border-gray-700 px-6 py-5">
			<h2 class="text-lg font-bold tracking-wide text-white">Choose Your Edition</h2>
			<p class="mt-1 text-sm text-gray-400">
				Select the D&amp;D 5e ruleset for this session. Each edition uses its own bestiary and
				rules.
			</p>
		</div>

		<!-- Edition cards -->
		<div class="grid grid-cols-2 gap-4 p-6">
			<!-- 2014 card -->
			<button
				onclick={() => (selectedRuleset = '2014')}
				class="relative flex flex-col rounded-xl border-2 p-5 text-left transition-all {selectedRuleset ===
				'2014'
					? 'border-amber-500 bg-amber-900/20'
					: 'border-gray-700 bg-gray-800/60 hover:border-gray-600 hover:bg-gray-800'}"
			>
				{#if selectedRuleset === '2014'}
					<span
						class="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3 text-black"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</span>
				{/if}
				<span class="text-xs font-bold tracking-widest text-amber-400 uppercase">D&D 5e</span>
				<span class="mt-1 text-2xl font-black text-white">2014</span>
				<p class="mt-3 text-xs leading-relaxed text-gray-400">
					Classic Fifth Edition. The original Monster Manual bestiary, 2014 condition rules, and
					standard action economy.
				</p>
				<ul class="mt-3 space-y-1">
					<li class="flex items-center gap-2 text-xs text-gray-500">
						<span class="h-1.5 w-1.5 rounded-full bg-gray-600"></span>
						Original Monster Manual
					</li>
					<li class="flex items-center gap-2 text-xs text-gray-500">
						<span class="h-1.5 w-1.5 rounded-full bg-gray-600"></span>
						Standard Exhaustion (6 tiers)
					</li>
					<li class="flex items-center gap-2 text-xs text-gray-500">
						<span class="h-1.5 w-1.5 rounded-full bg-gray-600"></span>
						Classic action economy
					</li>
				</ul>
			</button>

			<!-- 2024 card -->
			<button
				onclick={() => (selectedRuleset = '2024')}
				class="relative flex flex-col rounded-xl border-2 p-5 text-left transition-all {selectedRuleset ===
				'2024'
					? 'border-blue-500 bg-blue-900/20'
					: 'border-gray-700 bg-gray-800/60 hover:border-gray-600 hover:bg-gray-800'}"
			>
				{#if selectedRuleset === '2024'}
					<span
						class="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3 text-white"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</span>
				{/if}
				<span class="flex items-center gap-2 text-xs font-bold tracking-widest text-blue-400 uppercase"
					>D&D 5e <span
						class="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300 ring-1 ring-blue-500/30"
						>NEW</span
					></span
				>
				<span class="mt-1 text-2xl font-black text-white">2024</span>
				<p class="mt-3 text-xs leading-relaxed text-gray-400">
					Revised Fifth Edition. Updated Monster Manual with new stat block format, revised
					conditions, and 2024 action economy.
				</p>
				<ul class="mt-3 space-y-1">
					<li class="flex items-center gap-2 text-xs text-gray-500">
						<span class="h-1.5 w-1.5 rounded-full bg-blue-600/60"></span>
						2024 Monster Manual bestiary
					</li>
					<li class="flex items-center gap-2 text-xs text-gray-500">
						<span class="h-1.5 w-1.5 rounded-full bg-blue-600/60"></span>
						Revised Exhaustion (stacking −1 per level)
					</li>
					<li class="flex items-center gap-2 text-xs text-gray-500">
						<span class="h-1.5 w-1.5 rounded-full bg-blue-600/60"></span>
						Bonus Actions section in stat blocks
					</li>
				</ul>
			</button>
		</div>

		<!-- Warning banner -->
		<div class="mx-6 flex items-start gap-3 rounded-lg bg-orange-950/40 px-4 py-3 ring-1 ring-orange-800/50">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="mt-0.5 h-4 w-4 shrink-0 text-orange-400"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
					clip-rule="evenodd"
				/>
			</svg>
			<p class="text-xs leading-relaxed text-orange-300">
				<strong class="font-semibold text-orange-200">This choice is permanent.</strong> The ruleset
				cannot be changed after the session is created. Choose carefully.
			</p>
		</div>

		<!-- Session name + actions -->
		<div class="flex items-center gap-3 p-6">
			<input
				type="text"
				placeholder="Session name…"
				class="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500"
				bind:value={sessionName}
				onkeydown={(e) => {
					if (e.key === 'Enter' && selectedRuleset) submit();
					if (e.key === 'Escape') oncancel();
				}}
			/>
			<button
				onclick={oncancel}
				class="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition hover:bg-gray-800 hover:text-white"
			>
				Cancel
			</button>
			<button
				onclick={submit}
				disabled={!selectedRuleset}
				class="rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 {selectedRuleset ===
				'2024'
					? 'bg-blue-600 text-white hover:bg-blue-500'
					: 'bg-amber-600 text-white hover:bg-amber-500'}"
			>
				Create Session
			</button>
		</div>
	</div>
</div>
