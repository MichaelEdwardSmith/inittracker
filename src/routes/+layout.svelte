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

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
