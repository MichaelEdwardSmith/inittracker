<!-- Shown the first time per session a DM activates voice commands.
     Lists available commands and notes the beta status. -->
<script lang="ts">
	interface Props {
		onclose: () => void;
	}

	let { onclose }: Props = $props();

	const sections = [
		{
			label: 'Combat Control',
			commands: [
				{ phrase: 'Tracker, start combat', desc: 'Begin the combat encounter' },
				{ phrase: 'Tracker, end combat', desc: 'End the current encounter' },
				{ phrase: 'Tracker, next', desc: 'Advance to the next turn' },
				{ phrase: 'Tracker, previous', desc: 'Go back to the previous turn' }
			]
		},
		{
			label: 'HP & Damage',
			commands: [
				{ phrase: '"[Name] takes 12 damage"', desc: 'Deal damage to a combatant' },
				{ phrase: '"[Name] heals 8 HP"', desc: 'Restore HP to a combatant' },
				{ phrase: '"[Name] gains 5 temp HP"', desc: 'Add temporary hit points' }
			]
		},
		{
			label: 'Conditions & Spell Effects',
			commands: [
				{ phrase: '"[Name] is prone"', desc: 'Apply a condition' },
				{ phrase: '"[Name] is poisoned for 3 rounds"', desc: 'Apply with a duration' },
				{ phrase: '"[Name] has bless"', desc: 'Apply a spell effect' },
				{ phrase: '"Remove prone from [Name]"', desc: 'Clear a condition or effect' }
			]
		},
		{
			label: 'Dice Rolling',
			commands: [
				{ phrase: 'Tracker, roll a d20', desc: 'Roll a single die' },
				{ phrase: 'Tracker, roll 2d6', desc: 'Roll multiple dice' },
				{ phrase: 'Tracker, roll d8 plus 3', desc: 'Roll with a modifier' }
			]
		}
	];
</script>

<div
	role="dialog"
	aria-modal="true"
	aria-label="Voice commands reference"
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
	tabindex="-1"
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') onclose();
	}}
>
	<div class="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-700 px-5 py-4">
			<div class="flex items-center gap-3">
				<i class="fa-solid fa-microphone text-lg text-amber-400" aria-hidden="true"></i>
				<span class="font-bold text-white">Voice Commands</span>
				<span
					class="rounded-full border border-amber-600/50 bg-amber-900/40 px-2 py-0.5 text-xs font-semibold text-amber-400"
					>BETA</span
				>
			</div>
			<button
				onclick={onclose}
				class="text-gray-500 transition hover:text-white"
				aria-label="Close"
			>
				<i class="fa-solid fa-xmark text-lg" aria-hidden="true"></i>
			</button>
		</div>

		<!-- Beta notice -->
		<div
			class="mx-5 mt-4 flex items-start gap-2.5 rounded-lg border border-amber-700/40 bg-amber-950/40 px-4 py-3"
		>
			<i
				class="fa-solid fa-triangle-exclamation mt-0.5 shrink-0 text-base text-amber-400"
				aria-hidden="true"
			></i>
			<p class="text-xs leading-relaxed text-amber-300/90">
				Voice commands are a <strong>beta feature</strong> and may not always behave as expected. Speech
				recognition runs locally via Moonshine AI and accuracy can vary based on microphone quality, background
				noise, and combatant names.
			</p>
		</div>

		<!-- Command sections -->
		<div class="divide-y divide-gray-800 px-5 py-4">
			{#each sections as section}
				<div class="py-3 first:pt-0 last:pb-0">
					<p class="mb-2 text-xs font-bold tracking-widest text-gray-500 uppercase">
						{section.label}
					</p>
					<div class="space-y-1.5">
						{#each section.commands as cmd}
							<div class="flex items-baseline justify-between gap-4">
								<code class="rounded bg-gray-800 px-2 py-0.5 text-xs text-amber-300"
									>{cmd.phrase}</code
								>
								<span class="shrink-0 text-xs text-gray-500">{cmd.desc}</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- Tip + close -->
		<div class="flex items-center justify-between border-t border-gray-700 px-5 py-3">
			<p class="text-xs text-gray-600">
				Use <span class="text-gray-500">"Tracker"</span> as the wake word to avoid false triggers.
			</p>
			<button
				onclick={onclose}
				class="rounded border border-gray-700 bg-gray-800 px-4 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-gray-500 hover:text-white"
			>
				Got it
			</button>
		</div>
	</div>
</div>
