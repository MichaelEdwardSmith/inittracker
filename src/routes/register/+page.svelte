<!-- DM registration page (/register).
     Client-side validates password length and match before hashing with SHA-256 and submitting.
     On success the server creates the account and redirects to /login. -->
<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { form }: { form: ActionData } = $props();
	let clientError = $state('');

	async function sha256(text: string): Promise<string> {
		const data = new TextEncoder().encode(text);
		const hash = await crypto.subtle.digest('SHA-256', data);
		return Array.from(new Uint8Array(hash))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
	}
</script>

<svelte:head>
	<title>Register — Initiative Tracker</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
	<!-- Subtle background glow -->
	<div
		class="pointer-events-none absolute inset-0"
		style="background: radial-gradient(ellipse 60% 50% at 50% 45%, rgba(180,130,20,0.07) 0%, transparent 70%);"
	></div>

	<div class="relative z-10 w-full max-w-sm px-6 py-12">
		<!-- Header -->
		<div class="mb-8 text-center">
			<div class="mb-3 text-5xl">⚔️</div>
			<h1 class="text-2xl font-black tracking-[0.25em] text-amber-400 uppercase">
				Initiative Tracker
			</h1>
			<p class="mt-1 text-xs tracking-widest text-gray-600 uppercase">New Dungeon Master</p>
		</div>

		<!-- Register card -->
		<div class="rounded-xl border border-gray-800 bg-gray-900/80 p-8 shadow-2xl backdrop-blur">
			<form
				method="POST"
				use:enhance={async ({ formData, cancel }) => {
					clientError = '';
					const pw = formData.get('password') as string;
					const conf = formData.get('confirm') as string;
					if (pw.length < 8) {
						clientError = 'Password must be at least 8 characters.';
						cancel();
						return;
					}
					if (pw !== conf) {
						clientError = 'Passwords do not match.';
						cancel();
						return;
					}
					const hashed = await sha256(pw);
					formData.set('password', hashed);
					formData.set('confirm', hashed);
				}}
			>
				<div class="flex gap-3">
					<div class="flex-1">
						<label
							for="firstName"
							class="mb-2 block text-xs font-bold tracking-widest text-gray-400 uppercase"
						>
							First Name
						</label>
						<input
							id="firstName"
							name="firstName"
							type="text"
							autocomplete="given-name"
							value={form?.firstName ?? ''}
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600
							       transition outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
							placeholder="Elara"
						/>
					</div>
					<div class="flex-1">
						<label
							for="lastName"
							class="mb-2 block text-xs font-bold tracking-widest text-gray-400 uppercase"
						>
							Last Name
						</label>
						<input
							id="lastName"
							name="lastName"
							type="text"
							autocomplete="family-name"
							value={form?.lastName ?? ''}
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600
							       transition outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
							placeholder="Nightwind"
						/>
					</div>
				</div>

				<label
					for="email"
					class="mt-4 mb-2 block text-xs font-bold tracking-widest text-gray-400 uppercase"
				>
					Email
				</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					value={form?.email ?? ''}
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600
					       transition outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40
					       {form?.error ? 'border-red-700 focus:border-red-500 focus:ring-red-500/40' : ''}"
					placeholder="dungeon@master.com"
				/>

				<label
					for="password"
					class="mt-4 mb-2 block text-xs font-bold tracking-widest text-gray-400 uppercase"
				>
					Password
				</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="new-password"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600
					       transition outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40
					       {form?.error ? 'border-red-700 focus:border-red-500 focus:ring-red-500/40' : ''}"
					placeholder="At least 8 characters"
				/>

				<label
					for="confirm"
					class="mt-4 mb-2 block text-xs font-bold tracking-widest text-gray-400 uppercase"
				>
					Confirm Password
				</label>
				<input
					id="confirm"
					name="confirm"
					type="password"
					autocomplete="new-password"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600
					       transition outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40
					       {form?.error ? 'border-red-700 focus:border-red-500 focus:ring-red-500/40' : ''}"
					placeholder="••••••••"
				/>

				{#if clientError || form?.error}
					<p class="mt-3 text-xs text-red-400">{clientError || form?.error}</p>
				{/if}

				<button
					type="submit"
					class="mt-6 w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-black tracking-widest text-gray-950 uppercase
					       transition hover:bg-amber-500 active:scale-[0.98]"
				>
					Create Account
				</button>
			</form>
		</div>


		<!-- Google SSO -->
		<div class="mt-4">
			<a
				href="/auth/google"
				class="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-900/60 px-4 py-3 text-sm font-semibold tracking-wide text-gray-300
				       transition hover:border-gray-500 hover:text-white active:scale-[0.98]"
			>
				<svg class="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
					<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
					<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
					<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
				</svg>
				Continue with Google
			</a>
		</div>
		<p class="mt-6 text-center text-xs text-gray-600">
			Already have an account?
			<a href="/login" class="text-amber-500 transition hover:text-amber-400">Sign in</a>
		</p>
	</div>
</div>
