<!-- Small icon button that flips a boolean flag on a combatant — Reaction available, Readied
     Action, Surprised, and Inspiration all share this exact shape: one icon, a two-tone color
     depending on state, and a tooltip explaining what clicking it will do next. Used on both
     the initiative card (InitiativeTracker) and the compact Party roster row (PlayerPanel, via
     `compact`). -->
<script lang="ts">
	interface Props {
		active: boolean;
		onclick: () => void;
		/** Icon shown in both states, unless overridden below. */
		icon: string;
		/** Overrides `icon` while active (e.g. Reaction's bolt vs bolt-slash). */
		activeIcon?: string;
		/** Overrides `icon` while inactive. */
		inactiveIcon?: string;
		activeTitle: string;
		inactiveTitle: string;
		/** Full Tailwind text-color classes (incl. hover:) for the active state. */
		activeClass: string;
		/** Full Tailwind text-color classes (incl. hover:) for the inactive state. */
		inactiveClass: string;
		/** Smaller padding/icon size — used in the Party roster list. */
		compact?: boolean;
	}

	let {
		active,
		onclick,
		icon,
		activeIcon,
		inactiveIcon,
		activeTitle,
		inactiveTitle,
		activeClass,
		inactiveClass,
		compact = false
	}: Props = $props();
</script>

<button
	{onclick}
	title={active ? activeTitle : inactiveTitle}
	class="shrink-0 rounded transition {compact ? 'p-0.5' : 'p-2'} {active
		? activeClass
		: inactiveClass}"
>
	<i
		class="fa-duotone fa-light {active ? (activeIcon ?? icon) : (inactiveIcon ?? icon)} {compact
			? 'text-xs'
			: 'text-base'}"
		aria-hidden="true"
	></i>
</button>
