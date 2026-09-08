<!-- A single row in the Initiative Order tools dropdown menu — icon + label, full width,
     hover highlight. Used for Undo, Area of Effect, Log, Timer, Reset Init, Reset Players, and
     Clear Enemies (see the tools menu in InitiativeTracker.svelte). -->
<script lang="ts">
	interface Props {
		onclick: () => void;
		icon: string;
		label: string;
		disabled?: boolean;
		/** Text color class for this row — defaults to the standard grey; pass an accent color
		 *  for the orange (AoE) / red (Clear Enemies) / blue (Timer, when active) variants. */
		textClass?: string;
	}

	let { onclick, icon, label, disabled = false, textClass = 'text-gray-300' }: Props = $props();
</script>

<button
	{onclick}
	{disabled}
	class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-30 {textClass}"
>
	<i class="fa-duotone fa-light {icon} w-4 text-center" aria-hidden="true"></i>
	{label}
</button>
