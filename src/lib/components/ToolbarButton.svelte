<!-- A simple icon + label toolbar button — no responsive show/hide (that turned out to render
     both the icon-only and icon+label versions at once in practice instead of switching
     between them). Used for the primary turn controls (Start/Prev/Next/End); everything else
     lives behind the tools menu (see ToolbarMenuItem.svelte) so this row stays short. -->
<script lang="ts">
	interface Props {
		onclick: () => void;
		icon: string;
		label: string;
		title?: string;
		disabled?: boolean;
		/** Full Tailwind classes for background/text/hover — varies per button (Undo is grey,
		 *  Area of Effect is orange, Clear Enemies is red, etc.), so the caller owns it rather
		 *  than this component picking from a fixed palette. */
		colorClass: string;
	}

	let { onclick, icon, label, title: titleProp, disabled = false, colorClass }: Props = $props();
</script>

<button
	{onclick}
	{disabled}
	title={titleProp ?? label}
	class="flex items-center gap-1.5 rounded px-2 py-1 text-xs transition {colorClass} disabled:cursor-not-allowed disabled:opacity-30"
>
	<i class="fa-duotone fa-light {icon}" aria-hidden="true"></i>
	{label}
</button>
