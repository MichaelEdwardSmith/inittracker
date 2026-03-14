<!-- Concentration check modal — shown when a concentrating combatant takes damage. -->
<script lang="ts">
	interface Props {
		check: { id: string; name: string; damage: number; dc: number } | null;
		onsuccess: () => void;
		onfail: (id: string) => void;
	}

	let { check, onsuccess, onfail }: Props = $props();
</script>

{#if check}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		onmousedown={(e) => {
			if (e.target === e.currentTarget) onsuccess();
		}}
	>
		<div
			class="mx-4 w-full max-w-sm rounded-xl border border-cyan-700/60 bg-gray-900 shadow-2xl shadow-cyan-900/30"
		>
			<div class="flex items-center gap-2 border-b border-cyan-900/40 px-5 py-3">
				<span class="text-cyan-400">◈</span>
				<span class="text-sm font-bold tracking-widest text-cyan-300 uppercase"
					>Concentration Check</span
				>
			</div>
			<div class="px-5 py-5">
				<p class="mb-1 text-base font-semibold text-white">{check.name}</p>
				<p class="mb-4 text-sm text-gray-400">
					took <span class="font-bold text-red-400">{check.damage}</span> damage
				</p>
				<div
					class="mb-4 flex items-center justify-between rounded-lg border border-cyan-800/50 bg-cyan-950/40 px-4 py-3"
				>
					<div>
						<p class="text-xs font-semibold tracking-wider text-cyan-500 uppercase">CON Save DC</p>
						<p class="text-4xl font-bold text-cyan-300">{check.dc}</p>
					</div>
					<div class="text-right text-xs text-gray-500">
						<p>½ damage = {Math.floor(check.damage / 2)}</p>
						<p>minimum DC 10</p>
					</div>
				</div>
				<p class="text-xs text-gray-500">Fail → concentration ends. Success → spell continues.</p>
			</div>
			<div class="flex gap-2 border-t border-gray-800 px-5 py-3">
				<button
					onclick={onsuccess}
					class="flex-1 rounded bg-green-800/50 py-2 text-sm font-semibold text-green-200 transition hover:bg-green-700/60"
					>Success</button
				>
				<button
					onclick={() => onfail(check!.id)}
					class="flex-1 rounded bg-red-900/60 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-800"
					>Fail</button
				>
			</div>
		</div>
	</div>
{/if}
