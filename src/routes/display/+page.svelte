<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	if (browser) goto('/join', { replaceState: true });
</script>

<svelte:head>
	<title>Initiative Tracker</title>
</svelte:head>

<div class="flex h-screen items-center justify-center bg-gray-950 text-gray-600">
	<p class="text-sm">Redirecting to <a href="/join" class="text-amber-500">/join</a>…</p>
</div>
