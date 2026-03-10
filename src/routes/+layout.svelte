<!-- Root layout — wraps every page. Loads global CSS, sets the favicon,
     and syncs the dark/light theme class on <html> with localStorage. -->
<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { browser } from '$app/environment';
	import { theme } from '$lib/theme.svelte';

	// Sync initial state with what the no-flash inline script already applied
	if (browser && localStorage.getItem('theme') === 'light') {
		theme.isDark = false;
	}

	$effect(() => {
		document.documentElement.classList.toggle('light', !theme.isDark);
		if (browser) localStorage.setItem('theme', theme.isDark ? 'dark' : 'light');
	});

	import DiceOverlay from '$lib/components/DiceOverlay.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<DiceOverlay />
{@render children()}
