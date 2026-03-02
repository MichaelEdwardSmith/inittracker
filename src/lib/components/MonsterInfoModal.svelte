<script lang="ts">
	import type { MonsterDetail } from '$lib/types';

	interface Props {
		monster: MonsterDetail | null;
		onclose: () => void;
	}

	let { monster, onclose }: Props = $props();

	let imgExpanded = $state(false);

	$effect(() => {
		if (monster) imgExpanded = false;
	});
</script>

{#if monster}
	<div
		role="dialog"
		aria-modal="true"
		aria-label="Monster information"
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-12 backdrop-blur-sm"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) onclose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') onclose();
		}}
	>
		<div
			class="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
			style="max-height: calc(100vh - 4rem);"
		>
			<!-- Header -->
			<div class="flex shrink-0 items-center justify-between border-b border-gray-700 px-5 py-4">
				<div>
					<h3 class="text-lg font-black tracking-wide text-red-400">{monster.name}</h3>
					<p class="text-xs text-gray-400 italic">{monster.meta}</p>
					{#if monster.source}
						<p class="mt-0.5 text-xs text-gray-500">
							<span class="rounded bg-indigo-900/60 px-1 py-0.5 font-semibold text-indigo-300">{monster.source}</span>{#if monster.page}&nbsp;p.&nbsp;{monster.page}{/if}
						</p>
					{/if}
				</div>
				<button
					onclick={onclose}
					class="text-gray-500 transition hover:text-white"
					aria-label="Close"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="overflow-y-auto p-5 text-gray-200">
				<!-- Image -->
				{#if monster.imgUrl}
					<div class="mb-4">
						<button
							onclick={() => (imgExpanded = !imgExpanded)}
							class="w-full overflow-hidden rounded-lg focus:outline-none"
							title={imgExpanded ? 'Collapse image' : 'Expand image'}
						>
							<img
								src={monster.imgUrl}
								alt={monster.name}
								class="w-full rounded-lg object-cover transition-all duration-300
								       {imgExpanded ? 'max-h-[32rem] object-contain' : 'h-32 object-top'}"
							/>
						</button>
						<p class="mt-1 text-right text-[10px] text-gray-500">
							{imgExpanded ? 'Click to collapse' : 'Click to expand'}
						</p>
					</div>
				{/if}

				<!-- Core stats -->
				<div class="mb-4 flex flex-wrap gap-4 border-b border-gray-700 pb-4 text-sm">
					<div>
						<span class="text-gray-500">AC</span>
						<span class="font-bold text-gray-200">{monster.armorClass}</span>
					</div>
					<div>
						<span class="text-gray-500">HP</span>
						<span class="font-bold text-gray-200">{monster.hitPoints}</span>
					</div>
					<div>
						<span class="text-gray-500">Speed</span>
						<span class="font-bold text-gray-200">{monster.speed}</span>
					</div>
					<div>
						<span class="text-gray-500">CR</span>
						<span class="font-bold text-amber-300">{monster.challenge}</span>
					</div>
				</div>

				<!-- Ability scores -->
				<div class="mb-4 grid grid-cols-6 gap-2 border-b border-gray-700 pb-4 text-center">
					{#each [{ label: 'STR', val: monster.str, mod: monster.strMod }, { label: 'DEX', val: monster.dex, mod: monster.dexMod }, { label: 'CON', val: monster.con, mod: monster.conMod }, { label: 'INT', val: monster.int, mod: monster.intMod }, { label: 'WIS', val: monster.wis, mod: monster.wisMod }, { label: 'CHA', val: monster.cha, mod: monster.chaMod }] as stat}
						<div class="rounded bg-gray-800 px-1 py-2">
							<div class="text-xs font-bold tracking-wider text-red-400 uppercase">
								{stat.label}
							</div>
							<div class="text-sm font-bold text-white">{stat.val}</div>
							<div class="text-xs text-gray-400">{stat.mod}</div>
						</div>
					{/each}
				</div>

				<!-- Secondary stats -->
				<div class="mb-4 flex flex-col gap-1 border-b border-gray-700 pb-4 text-sm">
					{#if monster.savingThrows}
						<div>
							<span class="text-gray-500">Saving Throws </span><span>{monster.savingThrows}</span>
						</div>
					{/if}
					{#if monster.skills}
						<div><span class="text-gray-500">Skills </span><span>{monster.skills}</span></div>
					{/if}
					{#if monster.damageVulnerabilities}
					<div>
						<span class="text-gray-500">Damage Vulnerabilities </span><span
							>{monster.damageVulnerabilities}</span
						>
					</div>
				{/if}
				{#if monster.damageImmunities}
						<div>
							<span class="text-gray-500">Damage Immunities </span><span
								>{monster.damageImmunities}</span
							>
						</div>
					{/if}
					{#if monster.damageResistances}
						<div>
							<span class="text-gray-500">Damage Resistances </span><span
								>{monster.damageResistances}</span
							>
						</div>
					{/if}
					{#if monster.conditionImmunities}
						<div>
							<span class="text-gray-500">Condition Immunities </span><span
								>{monster.conditionImmunities}</span
							>
						</div>
					{/if}
					{#if monster.senses}
						<div><span class="text-gray-500">Senses </span><span>{monster.senses}</span></div>
					{/if}
					{#if monster.languages}
						<div><span class="text-gray-500">Languages </span><span>{monster.languages}</span></div>
					{/if}
				</div>

				<!-- Traits -->
				{#if monster.traits}
					<div class="mb-4 border-b border-gray-700 pb-4">
						<div class="[&_em]:text-gray-300 [&_p]:mb-2 [&_strong]:text-gray-200">
							{@html monster.traits}
						</div>
					</div>
				{/if}

				<!-- Actions -->
				{#if monster.actions}
					<div class="mb-4 border-b border-gray-700 pb-4">
						<h4 class="mb-2 text-xs font-bold tracking-widest text-red-400 uppercase">Actions</h4>
						<div class="[&_em]:text-gray-300 [&_p]:mb-2 [&_strong]:text-gray-200">
							{@html monster.actions}
						</div>
					</div>
				{/if}

				<!-- Reactions -->
				{#if monster.reactions}
					<div class="mb-4 border-b border-gray-700 pb-4">
						<h4 class="mb-2 text-xs font-bold tracking-widest text-red-400 uppercase">Reactions</h4>
						<div class="[&_em]:text-gray-300 [&_p]:mb-2 [&_strong]:text-gray-200">
							{@html monster.reactions}
						</div>
					</div>
				{/if}

				<!-- Legendary Actions -->
				{#if monster.legendaryActions}
					<div class="mb-2">
						<h4 class="mb-2 text-xs font-bold tracking-widest text-amber-400 uppercase">
							Legendary Actions
						</h4>
						<div class="[&_em]:text-gray-300 [&_p]:mb-2 [&_strong]:text-gray-200">
							{@html monster.legendaryActions}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
