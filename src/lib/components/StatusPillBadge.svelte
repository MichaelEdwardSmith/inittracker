<!-- A colored pill badge (icon + uppercase label) shown on the Player Display to flag a
     combatant's current state at a glance — Bloodied, Inspired, Readied, Surprised, Exhausted.
     The icon deliberately isn't tinted (matches the original Bloodied badge it was extracted
     from) — only the label text and the pill's border/background carry the color. -->
<script lang="ts">
	type PillColor = 'red' | 'amber' | 'violet' | 'pink' | 'orange';

	const COLOR_CLASSES: Record<PillColor, { pill: string; label: string }> = {
		red: { pill: 'border-red-700/60 bg-red-950/60', label: 'text-red-400' },
		amber: { pill: 'border-amber-700/60 bg-amber-950/60', label: 'text-amber-300' },
		violet: { pill: 'border-violet-700/60 bg-violet-950/60', label: 'text-violet-300' },
		pink: { pill: 'border-pink-700/60 bg-pink-950/60', label: 'text-pink-300' },
		orange: { pill: 'border-orange-700/60 bg-orange-950/60', label: 'text-orange-300' }
	};

	interface Props {
		icon: string;
		label: string;
		color: PillColor;
	}

	let { icon, label, color }: Props = $props();
</script>

<div class="flex items-center gap-2 rounded-full border px-4 py-1 {COLOR_CLASSES[color].pill}">
	<i class="fa-duotone fa-light {icon} text-base leading-none" aria-hidden="true"></i>
	<span class="text-xs font-black tracking-[0.25em] uppercase {COLOR_CLASSES[color].label}"
		>{label}</span
	>
</div>
