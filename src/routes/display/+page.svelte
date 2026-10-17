<!-- Fallback for /display (no sessionId). Immediately redirects to /join. -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	if (browser) goto('/join', { replaceState: true });
</script>

<svelte:head>
	<title>Initiative Tracker</title>
</svelte:head>

<div
	id="main-content"
	role="main"
	tabindex="-1"
	class="flex h-screen items-center justify-center bg-gray-950 text-gray-600"
>
	<p class="text-sm">Redirecting to <a href="/join" class="text-amber-500">/join</a>…</p>
</div>
