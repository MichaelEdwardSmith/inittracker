<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	const KEY = 'guide-intro-dismissed';

	let visible = $state(false);
	let dontShow = $state(false);
	let btnRect = $state<{ top: number; left: number; width: number; height: number } | null>(null);

	onMount(() => {
		if (localStorage.getItem(KEY)) return;
		requestAnimationFrame(() => {
			const el = document.getElementById('guide-link');
			if (!el) return;
			const r = el.getBoundingClientRect();
			btnRect = { top: r.top, left: r.left, width: r.width, height: r.height };
			visible = true;
		});
	});

	function dismiss() {
		if (dontShow) localStorage.setItem(KEY, '1');
		visible = false;
		btnRect = null;
	}

	// Derived popover + arrow positions
	const PAD = 6;
	const POPOVER_W = 272;

	let spotTop = $derived(btnRect ? btnRect.top - PAD : 0);
	let spotLeft = $derived(btnRect ? btnRect.left - PAD : 0);
	let spotW = $derived(btnRect ? btnRect.width + PAD * 2 : 0);
	let spotH = $derived(btnRect ? btnRect.height + PAD * 2 : 0);

	let popoverLeft = $derived(
		btnRect
			? Math.max(8, Math.min(btnRect.left + btnRect.width / 2 - POPOVER_W / 2, (browser ? window.innerWidth : 800) - POPOVER_W - 8))
			: 0
	);
	let popoverTop = $derived(btnRect ? btnRect.top + btnRect.height + PAD + 8 : 0);

	let arrowLeft = $derived(
		btnRect ? Math.max(12, Math.min(btnRect.left + btnRect.width / 2 - popoverLeft - 6, POPOVER_W - 24)) : 136
	);
</script>

{#if visible && btnRect}
	<!--
		Single full-screen container at z-[9999] so nothing on the page can appear above it.
		Clicking anywhere on it dismisses the popover.
	-->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[9999]"
		onclick={dismiss}
		onkeydown={(e) => e.key === 'Escape' && dismiss()}
	>
		<!-- Spotlight: pointer-events:none so clicks fall through to the parent wrapper -->
		<div
			class="pointer-events-none absolute rounded"
			style="top:{spotTop}px; left:{spotLeft}px; width:{spotW}px; height:{spotH}px;
			       box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
			       border: 2px solid rgba(251,191,36,0.7);
			       border-radius: 0.375rem;"
		></div>

		<!-- Popover: child of the wrapper, stops propagation so clicking it doesn't also fire the wrapper's dismiss -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute w-[272px] rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
			style="top:{popoverTop}px; left:{popoverLeft}px;"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Upward-pointing arrow -->
			<div
				class="absolute -top-[7px] h-3 w-3 rotate-45 border-l border-t border-gray-700 bg-gray-900"
				style="left:{arrowLeft}px;"
			></div>

			<!-- Content -->
			<div class="p-4">
				<p class="mb-1 text-sm font-bold text-white">👋 Welcome!</p>
				<p class="mb-4 text-sm leading-relaxed text-gray-400">
					Use the <strong class="text-amber-300">Guide</strong> to learn everything about the
					Initiative Tracker — combat management, conditions, chronicles, sessions, and more.
				</p>
				<label class="mb-4 flex cursor-pointer items-center gap-2 text-xs text-gray-500 select-none">
					<input
						type="checkbox"
						bind:checked={dontShow}
						class="h-3.5 w-3.5 cursor-pointer accent-amber-500"
					/>
					Don't show this again
				</label>
				<button
					onclick={dismiss}
					class="w-full rounded bg-amber-600 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-500"
				>
					Got it
				</button>
			</div>
		</div>
	</div>
{/if}
