<!-- Public landing page for Initiative Tracker -->
<script lang="ts">
	import { browser } from '$app/environment';

	// Simple intersection-observer fade-in for sections
	function fadeIn(node: HTMLElement) {
		if (!browser) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					node.classList.add('is-visible');
					observer.disconnect();
				}
			},
			{ threshold: 0.1 }
		);
		observer.observe(node);
		return { destroy: () => observer.disconnect() };
	}

	const features = [
		{
			icon: '<i class="fa-solid fa-swords"></i>',
			title: 'Initiative Order',
			desc: 'Automatically sort combatants by roll. Ties broken by dex modifier. Move through turns with a single click or voice command.',
			color: 'text-amber-400',
			screenshot: '/screenshots/Initiative.jpg'
		},
		{
			icon: '<i class="fa-solid fa-shield-halved"></i>',
			title: 'HP & Conditions',
			desc: 'Track current, max, and temporary HP for every combatant. Apply all 15 standard conditions plus advantage/disadvantage states.',
			color: 'text-blue-400',
			screenshot: '/screenshots/HP&Conditions.jpg'
		},
		{
			icon: '<i class="fa-solid fa-tv"></i>',
			title: 'Live Viewer Display',
			desc: 'Share a URL with your players. They see the initiative order and HP bars update in real time — no account or install needed.',
			color: 'text-green-400',
			screenshot: '/screenshots/LiveViewerDisplay.jpg'
		},
		{
			icon: '<i class="fa-solid fa-scroll"></i>',
			title: 'Combat Chronicles',
			desc: 'Every encounter is recorded automatically. Review event logs, HP arcs, XP earned, and casualties from every past session.',
			color: 'text-purple-400',
			screenshot: '/screenshots/CombatChronicles.jpg'
		},
		{
			icon: '<i class="fa-solid fa-dragon"></i>',
			title: 'Monster Library',
			desc: 'Built-in D&D 5e and 5.5e stat blocks with lair actions, legendary actions, and full spell lists. Add custom homebrew monsters too.',
			color: 'text-red-400',
			screenshot: '/screenshots/MonsterLibrary.jpg'
		},
		{
			icon: '<i class="fa-solid fa-microphone"></i>',
			title: 'Voice Commands',
			desc: 'Run combat hands-free. Say "tracker next", "Aragorn takes 8 damage", or "roll d20" — powered by on-device Moonshine AI.',
			color: 'text-cyan-400',
			screenshot: '/screenshots/VoiceCommands.jpg'
		},
		{
			icon: '<i class="fa-solid fa-note-sticky"></i>',
			title: 'Session Notes',
			desc: 'Keep freeform notes tied to each game session — NPCs met, loot found, plot threads. Always one click away during play.',
			color: 'text-yellow-400',
			screenshot: '/screenshots/SessionNotes.jpg'
		},
		{
			icon: '<i class="fa-solid fa-music"></i>',
			title: 'Audio Mixer',
			desc: 'Set the mood with built-in ambient soundscapes and music tracks. Mix volume levels for atmosphere without leaving the dashboard.',
			color: 'text-pink-400',
			screenshot: '/screenshots/AudioMixer.jpg'
		},
		{
			icon: '<i class="fa-solid fa-book-open"></i>',
			title: 'Quick Reference',
			desc: 'Instant access to conditions, actions, cover rules, exhaustion levels, and common DC tables — right inside the tracker.',
			color: 'text-indigo-400',
			screenshot: '/screenshots/QuickReference.jpg'
		},
		{
			icon: '<i class="fa-solid fa-city"></i>',
			title: 'Town Generator',
			desc: 'Generate fully detailed towns with unique NPCs, factions, districts, shops, and local lore — ready to drop into any campaign.',
			color: 'text-orange-400',
			screenshot: '/screenshots/TownGenerator.jpg'
		},
		{
			icon: '<i class="fa-solid fa-map"></i>',
			title: 'Dungeon Generator',
			desc: 'Procedurally generate dungeon maps with interconnected rooms, traps, secret doors, encounters, and treasure hoards.',
			color: 'text-slate-400',
			screenshot: '/screenshots/DungeonGenerator.jpg'
		},
		{
			icon: '<i class="fa-solid fa-beer-mug-empty"></i>',
			title: 'Inn Generator',
			desc: "Generate richly detailed inns complete with staff, regulars, today's menu, rumors heard over ale, and adventure hooks.",
			color: 'text-teal-400',
			screenshot: '/screenshots/InnGenerator.jpg'
		},
		{
			icon: '<i class="fa-solid fa-cloud-sun-rain"></i>',
			title: 'Weather & Travel',
			desc: 'Generate season- and biome-aware weather, 7-day forecasts, weather events, travel pace, and navigation DCs for any journey.',
			color: 'text-sky-400',
			screenshot: '/screenshots/WeatherGenerator.jpg'
		},
		{
			icon: '<i class="fa-solid fa-dice"></i>',
			title: 'Random Encounter',
			desc: 'Build balanced random encounters by difficulty and party size, with monster selections drawn from the full 5e bestiary.',
			color: 'text-lime-400',
			screenshot: '/screenshots/EncounterGenerator.jpg'
		},
		{
			icon: '<i class="fa-solid fa-id-badge"></i>',
			title: 'Name Generator',
			desc: 'Generate names for any race and gender in seconds — humans, elves, dwarves, halflings, and more, with authentic phonetic patterns.',
			color: 'text-rose-400',
			screenshot: '/screenshots/NameGenerator.jpg'
		}
	];

	const steps = [
		{
			num: '01',
			title: 'Create your roster',
			desc: 'Add your players once — they persist across every session. Set AC, HP, and dex modifier.'
		},
		{
			num: '02',
			title: 'Build the encounter',
			desc: 'Pull monsters from the 5e bestiary or your homebrew collection. Adjust HP and count on the fly.'
		},
		{
			num: '03',
			title: 'Roll & track',
			desc: 'Enter initiatives, start combat, and manage HP and conditions as the battle unfolds.'
		},
		{
			num: '04',
			title: 'Share the view',
			desc: 'Your players watch the order update live on their own screens — total immersion, zero setup.'
		}
	];
</script>

<svelte:head>
	<title>Initiative Tracker — D&D 5e Combat Manager</title>
	<meta
		name="description"
		content="The DM's command center for D&D 5e combat. Track initiative, HP, conditions, and more in real time."
	/>
</svelte:head>

<div class="min-h-screen bg-gray-950 text-white">
	<!-- Drifting atmospheric orbs (fixed, behind everything) -->
	<div aria-hidden="true" class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
		<div class="bg-orb orb-1"></div>
		<div class="bg-orb orb-2"></div>
		<div class="bg-orb orb-3"></div>
		<div class="bg-orb orb-4"></div>
	</div>

	<!-- ── Nav ───────────────────────────────────────────────────────────────── -->
	<nav class="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/90 backdrop-blur">
		<div class="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
			<a href="/" class="flex items-center gap-2.5">
				<i class="fa-solid fa-swords text-xl" aria-hidden="true"></i>
				<span class="text-sm font-black tracking-[0.2em] text-amber-400 uppercase"
					>Initiative Tracker</span
				>
			</a>
			<div class="ml-auto flex items-center gap-3">
				<a
					href="/guide?back=/"
					class="hidden text-sm text-gray-500 transition hover:text-gray-200 sm:block"
				>
					User Guide
				</a>
				<a
					href="/login"
					class="rounded border border-gray-700 bg-gray-900 px-4 py-1.5 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white"
				>
					Sign In
				</a>
				<a
					href="/register"
					class="rounded border border-amber-700 bg-amber-900/30 px-4 py-1.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-900/60 hover:text-amber-200"
				>
					Get Started
				</a>
			</div>
		</div>
	</nav>

	<!-- ── Hero ──────────────────────────────────────────────────────────────── -->
	<section
		class="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 py-24 text-center"
	>
		<div class="mx-auto max-w-3xl">
			<div class="mb-6 flex items-center justify-center gap-3">
				<div class="h-px w-12 bg-amber-800/60"></div>
				<span class="text-xs font-bold tracking-[0.3em] text-amber-600 uppercase"
					>D&D 5e Combat Manager</span
				>
				<div class="h-px w-12 bg-amber-800/60"></div>
			</div>

			<h1
				class="mb-6 text-5xl leading-tight font-black tracking-tight text-white sm:text-6xl lg:text-7xl"
			>
				Roll Initiative.<br />
				<span class="text-amber-400">Run Better Combat.</span>
			</h1>

			<p class="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-gray-400">
				The DM's command center for D&D 5e (2014) and 5.5e (2024). Track initiative, HP, and
				conditions in real time — with a live display your players can follow from their own
				screens.
			</p>

			<div class="flex flex-wrap items-center justify-center gap-4">
				<a
					href="https://www.buymeacoffee.com/inittracker"
					target="_blank"
					rel="noopener noreferrer"
					class="mr-2"
				>
					<img
						src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png"
						alt="Buy Me A Coffee"
						style="height: 45px; width: 163px;"
					/>
				</a>
				<a
					href="/register"
					class="rounded border border-amber-600 bg-amber-900/40 px-8 py-3 text-sm font-bold text-amber-300 transition hover:bg-amber-900/70 hover:text-amber-200"
				>
					Create Free DM Account
				</a>
				<a
					href="/login"
					class="rounded border border-gray-700 bg-gray-900 px-8 py-3 text-sm font-semibold text-gray-300 transition hover:border-gray-500 hover:text-white"
				>
					DM Sign In
				</a>
				<form method="POST" action="/login?/guest">
					<button
						type="submit"
						class="text-sm text-gray-600 underline underline-offset-4 transition hover:text-gray-400"
					>
						Try as Guest DM — no account needed
					</button>
				</form>
			</div>
		</div>

		<!-- Player join link -->
		<div class="mt-10">
			<a
				href="https://inittracker.com/join"
				class="text-sm text-green-400 transition hover:text-green-300"
			>
				Click here if you are a player — inittracker.com/join
			</a>
		</div>

		<!-- Hero screenshot mockup -->
		<div class="hero-fade relative mx-auto mt-10 w-full max-w-5xl" use:fadeIn>
			<div
				class="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/80 shadow-2xl shadow-black/60"
			>
				<!-- Mock browser chrome -->
				<div class="flex items-center gap-2 border-b border-gray-800 bg-gray-900 px-4 py-3">
					<div class="h-2.5 w-2.5 rounded-full bg-gray-700"></div>
					<div class="h-2.5 w-2.5 rounded-full bg-gray-700"></div>
					<div class="h-2.5 w-2.5 rounded-full bg-gray-700"></div>
					<div class="mx-auto max-w-xs flex-1">
						<div class="rounded bg-gray-800 px-3 py-1 text-center text-xs text-gray-600">
							inittracker.com / dashboard
						</div>
					</div>
				</div>
				<a href="/screenshots/Dashboard.jpg" target="_blank" rel="noopener noreferrer">
					<img
						src="/screenshots/Dashboard.jpg"
						alt="Initiative Tracker dashboard"
						class="aspect-[16/9] w-full object-cover transition hover:opacity-90"
					/>
				</a>
			</div>
			<!-- Glow under screenshot -->
			<div
				class="pointer-events-none absolute -bottom-8 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-full bg-amber-950/30 blur-3xl"
			></div>
		</div>
	</section>

	<!-- ── Feature grid ───────────────────────────────────────────────────────── -->
	<section class="px-6 py-28">
		<div class="mx-auto max-w-6xl">
			<div class="mb-16 text-center" use:fadeIn>
				<p class="mb-3 text-xs font-bold tracking-[0.3em] text-amber-600 uppercase">Features</p>
				<h2 class="text-3xl font-black tracking-tight text-white sm:text-4xl">
					Beyond everything you need at the table
				</h2>
				<p class="mt-4 text-gray-500">
					Built for DMs who want to focus on the story, not the spreadsheets.
				</p>
			</div>

			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each features as feature}
					<div
						class="group rounded-xl border border-gray-800 bg-gray-900/60 p-6 transition hover:border-gray-700 hover:bg-gray-900"
						use:fadeIn
					>
						{#if feature.screenshot}
							<a href={feature.screenshot} target="_blank" rel="noopener noreferrer">
								<img
									src={feature.screenshot}
									alt={feature.title}
									class="mb-5 aspect-video w-full rounded-lg border border-gray-800/80 object-cover transition hover:opacity-90"
								/>
							</a>
						{:else}
							<div
								class="mb-5 flex aspect-video w-full items-center justify-center rounded-lg border border-gray-800/80 bg-gray-950/60"
							>
								<span class="text-4xl opacity-20 {feature.color}">{@html feature.icon}</span>
							</div>
						{/if}

						<div class="mb-2 flex items-center gap-2.5">
							<span class="text-lg {feature.color}">{@html feature.icon}</span>
							<h3 class="font-bold text-white">{feature.title}</h3>
						</div>
						<p class="text-sm leading-relaxed text-gray-500">{feature.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ── Live viewer highlight ──────────────────────────────────────────────── -->
	<section class="border-y border-gray-800/50 bg-gray-900/30 px-6 py-28">
		<div class="mx-auto max-w-6xl">
			<div class="flex flex-col items-center gap-16 lg:flex-row lg:gap-20" use:fadeIn>
				<!-- Text -->
				<div class="flex-1">
					<p class="mb-3 text-xs font-bold tracking-[0.3em] text-green-600 uppercase">
						Live Display
					</p>
					<h2 class="mb-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
						Your players see it<br />as it happens.
					</h2>
					<p class="mb-6 leading-relaxed text-gray-400">
						Share a 6-character session code and your players can watch the initiative order, HP
						bars, and conditions update live on any device — phone, tablet, or laptop. No account
						required on their end.
					</p>
					<ul class="space-y-3 text-sm text-gray-500">
						{#each ['Updates in real time via server-sent events', 'Shows current turn, round counter, and HP', 'Conditions visible — blinded, stunned, prone, and more', 'Works on any browser, no install needed'] as item}
							<li class="flex items-start gap-2.5">
								<i class="fa-solid fa-check mt-0.5 shrink-0 text-green-600" aria-hidden="true"></i>
								{item}
							</li>
						{/each}
					</ul>
				</div>

				<!-- Viewer screenshot mockup -->
				<div class="w-full flex-1 lg:max-w-lg">
					<div
						class="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-xl shadow-black/40"
					>
						<div class="flex items-center gap-2 border-b border-gray-800 bg-gray-900 px-4 py-3">
							<div class="h-2.5 w-2.5 rounded-full bg-gray-700"></div>
							<div class="h-2.5 w-2.5 rounded-full bg-gray-700"></div>
							<div class="h-2.5 w-2.5 rounded-full bg-gray-700"></div>
							<div class="mx-auto max-w-xs flex-1">
								<div class="rounded bg-gray-800 px-3 py-1 text-center text-xs text-gray-600">
									inittracker.com / display / AB3X9K
								</div>
							</div>
						</div>
						<a
							href="/screenshots/ViewerDisplayScreenshot.jpg"
							target="_blank"
							rel="noopener noreferrer"
						>
							<img
								src="/screenshots/ViewerDisplayScreenshot.jpg"
								alt="Live viewer display"
								class="aspect-[4/3] w-full object-cover transition hover:opacity-90"
							/>
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ── How it works ───────────────────────────────────────────────────────── -->
	<section class="px-6 py-28">
		<div class="mx-auto max-w-6xl">
			<div class="mb-16 text-center" use:fadeIn>
				<p class="mb-3 text-xs font-bold tracking-[0.3em] text-amber-600 uppercase">How It Works</p>
				<h2 class="text-3xl font-black tracking-tight text-white sm:text-4xl">
					Up and running in minutes
				</h2>
			</div>

			<div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4" use:fadeIn>
				{#each steps as step, i}
					<div class="relative">
						<!-- Connector line -->
						{#if i < steps.length - 1}
							<div
								class="absolute top-6 left-full z-10 hidden w-10 border-t border-dashed border-gray-800 lg:block"
							></div>
						{/if}
						<div
							class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-amber-800/50 bg-amber-950/40 text-sm font-black text-amber-500"
						>
							{step.num}
						</div>
						<h3 class="mb-2 font-bold text-white">{step.title}</h3>
						<p class="text-sm leading-relaxed text-gray-500">{step.desc}</p>
					</div>
				{/each}
			</div>

			<!-- Chronicle screenshot -->
			<div
				class="mt-20 overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60 shadow-xl"
				use:fadeIn
			>
				<div class="flex items-center justify-between border-b border-gray-800 px-5 py-3">
					<div class="flex items-center gap-3">
						<i class="fa-solid fa-swords text-amber-500" aria-hidden="true"></i>
						<span class="text-sm font-bold tracking-widest text-amber-400 uppercase"
							>Combat Chronicles</span
						>
					</div>
					<span class="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-500">12 encounters</span>
				</div>
				<a
					href="/screenshots/CombatChronicleScreenshot.jpg"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img
						src="/screenshots/CombatChronicleScreenshot.jpg"
						alt="Combat Chronicles"
						class="aspect-[21/9] w-full object-cover transition hover:opacity-90"
					/>
				</a>
			</div>
		</div>
	</section>

	<!-- ── CTA ───────────────────────────────────────────────────────────────── -->
	<section class="relative overflow-hidden border-t border-gray-800/60 px-6 py-28 text-center">
		<div class="mx-auto max-w-2xl" use:fadeIn>
			<i class="fa-solid fa-swords text-4xl" aria-hidden="true"></i>
			<h2 class="mb-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
				Ready to roll initiative?
			</h2>
			<p class="mb-10 text-gray-500">
				Free to use. No subscription. Create an account and run your first encounter tonight.
			</p>
			<div class="flex flex-wrap items-center justify-center gap-4">
				<a
					href="/register"
					class="rounded border border-amber-600 bg-amber-900/40 px-10 py-3.5 text-sm font-bold text-amber-300 transition hover:bg-amber-900/70 hover:text-amber-200"
				>
					Create Free Account
				</a>
				<form method="POST" action="/login?/guest">
					<button
						type="submit"
						class="rounded border border-gray-700 bg-gray-900 px-10 py-3.5 text-sm font-semibold text-gray-400 transition hover:border-gray-600 hover:text-gray-200"
					>
						Try as Guest
					</button>
				</form>
			</div>
		</div>
	</section>

	<!-- ── Footer ─────────────────────────────────────────────────────────────── -->
	<footer class="border-t border-gray-800/60 px-6 py-8">
		<div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
			<div class="flex items-center gap-2">
				<i class="fa-solid fa-swords text-base" aria-hidden="true"></i>
				<span class="text-xs font-bold tracking-[0.2em] text-gray-600 uppercase"
					>Initiative Tracker</span
				>
			</div>
			<div class="flex items-center gap-6 text-xs text-gray-700">
				<a href="/privacy" class="transition hover:text-gray-400">Privacy Policy</a>
				<a href="/guide?back=/" class="transition hover:text-gray-400">User Guide</a>
				<a href="/login" class="transition hover:text-gray-400">Sign In</a>
				<a href="/register" class="transition hover:text-gray-400">Register</a>
			</div>
		</div>
	</footer>
</div>

<style>
	/* ── Atmospheric drifting orbs ── */
	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(90px);
	}

	.orb-1 {
		width: min(65vw, 700px);
		height: min(65vw, 700px);
		background: rgba(88, 28, 135, 0.45);
		top: -15%;
		left: -12%;
		animation: orb-drift-1 24s ease-in-out infinite;
	}
	.orb-2 {
		width: min(55vw, 620px);
		height: min(55vw, 620px);
		background: rgba(30, 58, 138, 0.45);
		bottom: -18%;
		right: -10%;
		animation: orb-drift-2 30s ease-in-out infinite;
	}
	.orb-3 {
		width: min(45vw, 520px);
		height: min(45vw, 520px);
		background: rgba(120, 53, 15, 0.35);
		top: 35%;
		left: 42%;
		transform: translate(-50%, -50%);
		animation: orb-drift-3 20s ease-in-out infinite;
	}
	.orb-4 {
		width: min(38vw, 440px);
		height: min(38vw, 440px);
		background: rgba(49, 46, 129, 0.4);
		top: 15%;
		right: 18%;
		animation: orb-drift-4 26s ease-in-out infinite;
	}

	@keyframes orb-drift-1 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		25% {
			transform: translate(8vw, 6vh) scale(1.06);
		}
		55% {
			transform: translate(3vw, 12vh) scale(0.94);
		}
		75% {
			transform: translate(-3vw, 7vh) scale(1.03);
		}
	}
	@keyframes orb-drift-2 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		30% {
			transform: translate(-7vw, -9vh) scale(1.08);
		}
		65% {
			transform: translate(-2vw, -4vh) scale(0.92);
		}
	}
	@keyframes orb-drift-3 {
		0%,
		100% {
			transform: translate(-50%, -50%) scale(1);
		}
		40% {
			transform: translate(calc(-50% + 7vw), calc(-50% - 9vh)) scale(1.1);
		}
		70% {
			transform: translate(calc(-50% - 5vw), calc(-50% + 5vh)) scale(0.9);
		}
	}
	@keyframes orb-drift-4 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		35% {
			transform: translate(6vw, 9vh) scale(0.94);
		}
		68% {
			transform: translate(-5vw, 4vh) scale(1.06);
		}
	}

	:global(.hero-fade) {
		opacity: 0;
		transform: translateY(24px);
		transition:
			opacity 0.7s ease,
			transform 0.7s ease;
	}

	:global(.is-visible) {
		opacity: 1;
		transform: translateY(0);
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.hero-fade) {
			opacity: 1;
			transform: none;
		}
	}
</style>
