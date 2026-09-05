<!-- Embeds Watabou's Dwellings generator (watabou.github.io/dwellings) -->
<script lang="ts">
	let { building, onclose }: { building: { type: string; name: string }; onclose: () => void } =
		$props();

	function hashStr(str: string): number {
		let h = 0x811c9dc5;
		for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 0x01000193);
		return h >>> 0;
	}

	// Map building type → Dwellings tags
	const TAG_MAP: Record<string, string> = {
		cottage: 'small,organic,low',
		house: 'medium,organic',
		inn: 'large,mechanical,tall,stairwell',
		tavern: 'large,mechanical,low',
		shop: 'medium,mechanical,low',
		blacksmith: 'medium,organic,low',
		temple: 'large,mechanical,tall',
		market: 'large,mechanical,low',
		guildhall: 'large,mechanical,tall,stairwell',
		keep: 'large,mechanical,tall,stairwell,fortified',
		barracks: 'large,mechanical,low',
		stable: 'large,organic,low',
		farm: 'medium,organic,low',
		great_hall: 'large,mechanical,tall',
		armory: 'medium,mechanical,low',
		chapel: 'medium,organic,low',
		dungeon: 'large,mechanical,tall,basement,stairwell',
		lord_quarters: 'large,mechanical,tall,stairwell',
		park: 'large,organic,low,generic'
	};

	function buildUrl(seed: number): string {
		const tags = TAG_MAP[building.type] ?? 'medium,organic';
		const name = encodeURIComponent(building.name);
		return `https://watabou.github.io/dwellings/?seed=${seed}&tags=${tags}&name=${name}&view=plan`;
	}

	let seed = $state(hashStr(building.name + building.type) % 1_000_000 || 1);
	let src = $derived(buildUrl(seed));

	function reroll() {
		seed = Math.floor(Math.random() * 1_000_000) + 1;
	}
</script>

<div
	class="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
	role="dialog"
	aria-modal="true"
>
	<div
		class="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-700 px-4 py-3">
			<div class="flex items-center gap-3">
				<span class="text-sm font-bold text-gray-100">{building.name}</span>
				<span class="text-xs text-gray-500">Floor Plan</span>
			</div>
			<div class="flex items-center gap-2">
				<button
					onclick={reroll}
					class="rounded bg-slate-700/50 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-600/60"
					title="Generate a new layout"
				>
					New Layout
				</button>
				<a
					href={src}
					target="_blank"
					rel="noopener noreferrer"
					class="rounded bg-slate-700/50 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-600/60"
					title="Open in new tab"
				>
					Open <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
				</a>
				<button
					onclick={onclose}
					class="rounded p-1.5 text-gray-400 transition hover:bg-gray-700 hover:text-gray-100"
					aria-label="Close"
				>
					<i class="fa-solid fa-xmark text-base" aria-hidden="true"></i>
				</button>
			</div>
		</div>

		<!-- Iframe -->
		<div class="flex-1 overflow-hidden rounded-b-xl bg-gray-950">
			<iframe
				{src}
				title="Floor plan for {building.name}"
				class="h-full w-full border-0"
				style="min-height: 600px"
				allowfullscreen
			></iframe>
		</div>
	</div>
</div>
