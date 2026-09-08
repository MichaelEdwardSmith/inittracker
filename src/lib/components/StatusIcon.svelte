<!-- A small inline status icon with a tooltip — the compact counterpart to StatusPillBadge,
     used in the Player Display's list view where there's no room for a full pill. -->
<script lang="ts">
	interface Props {
		icon: string;
		title: string;
		/** Full Tailwind text-color class, e.g. 'text-amber-400'. Omit for an uncolored icon
		 *  (matches the original Bloodied icon, which inherits its color). */
		colorClass?: string;
	}

	let { icon, title, colorClass = '' }: Props = $props();
</script>

<i
	class="fa-duotone fa-light {icon} shrink-0 text-sm leading-none {colorClass}"
	{title}
	aria-hidden="true"
></i>
