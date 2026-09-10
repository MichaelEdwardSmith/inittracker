<!-- Root layout — wraps every page. Loads global CSS, sets the favicon,
     syncs the dark/light theme class on <html> with localStorage, and shows a persistent
     "verify your email" nag banner for any logged-in DM or Player whose email isn't verified
     yet (see +layout.server.ts). Nothing is gated on verification — this is nag-only. -->
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

	let { data, children } = $props();

	let dismissed = $state(false);
	let resendState = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');

	async function resend() {
		resendState = 'sending';
		try {
			const res = await fetch('/api/resend-verification', { method: 'POST' });
			resendState = res.ok ? 'sent' : 'error';
		} catch {
			resendState = 'error';
		}
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if data.unverifiedEmail && !dismissed}
	<div
		class="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-800 bg-amber-950 px-4 py-2 text-center text-sm text-amber-200"
	>
		<span>
			<i class="fa-duotone fa-light fa-triangle-exclamation" aria-hidden="true"></i>
			Please verify <strong>{data.unverifiedEmail}</strong> — check your inbox for the link.
		</span>
		{#if resendState === 'sent'}
			<span class="text-emerald-400">Sent! Check your inbox.</span>
		{:else if resendState === 'error'}
			<span class="text-red-400">Couldn't resend — try again shortly.</span>
			<button onclick={resend} class="font-semibold underline hover:text-amber-100">
				Resend email
			</button>
		{:else}
			<button
				onclick={resend}
				disabled={resendState === 'sending'}
				class="font-semibold underline hover:text-amber-100 disabled:opacity-50"
			>
				{resendState === 'sending' ? 'Sending…' : 'Resend email'}
			</button>
		{/if}
		<button
			onclick={() => (dismissed = true)}
			aria-label="Dismiss"
			class="ml-1 text-amber-500 hover:text-amber-300"
		>
			<i class="fa-duotone fa-light fa-xmark" aria-hidden="true"></i>
		</button>
	</div>
{/if}

{@render children()}
