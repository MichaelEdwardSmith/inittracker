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

	// Tilts/shifts the node away from the cursor on hover
	function tiltAway(node: HTMLElement) {
		if (!browser) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const maxRotate = 8; // deg
		const maxOffset = 16; // px

		function handleMove(e: MouseEvent) {
			const rect = node.getBoundingClientRect();
			const px = (e.clientX - rect.left) / rect.width - 0.5;
			const py = (e.clientY - rect.top) / rect.height - 0.5;
			const rotateY = -px * maxRotate * 2;
			const rotateX = py * maxRotate * 2;
			const translateX = -px * maxOffset;
			const translateY = -py * maxOffset;
			node.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate(${translateX}px, ${translateY}px)`;
		}

		function handleLeave() {
			node.style.transform = '';
		}

		node.addEventListener('mousemove', handleMove);
		node.addEventListener('mouseleave', handleLeave);

		return {
			destroy: () => {
				node.removeEventListener('mousemove', handleMove);
				node.removeEventListener('mouseleave', handleLeave);
			}
		};
	}

	// Core combat-tracking features — shown as full cards with screenshots
	const coreFeatures = [
		{
			icon: '<i class="fa-duotone fa-light fa-swords"></i>',
			title: 'Initiative Order',
			desc: 'Automatically sort combatants by roll. Ties broken by dex modifier. Move through turns with a single click or voice command.',
			color: 'text-amber-400',
			screenshot: '/screenshots/Initiative.jpg'
		},
		{
			icon: '<i class="fa-duotone fa-light fa-shield-halved"></i>',
			title: 'HP & Conditions',
			desc: 'Track current, max, and temporary HP for every combatant. Apply all 15 standard conditions plus advantage/disadvantage states.',
			color: 'text-blue-400',
			screenshot: '/screenshots/HP&Conditions.jpg'
		},
		{
			icon: '<i class="fa-duotone fa-light fa-tv"></i>',
			title: 'Live Viewer Display',
			desc: 'Share a URL with your players. They see the initiative order and HP bars update in real time — no account or install needed.',
			color: 'text-green-400',
			screenshot: '/screenshots/LiveViewerDisplay.jpg'
		},
		{
			icon: '<i class="fa-duotone fa-light fa-scroll"></i>',
			title: 'Combat Chronicles',
			desc: 'Every encounter is recorded automatically. Review event logs, HP arcs, XP earned, and casualties from every past session.',
			color: 'text-purple-400',
			screenshot: '/screenshots/CombatChronicles.jpg'
		},
		{
			icon: '<i class="fa-duotone fa-light fa-dragon"></i>',
			title: 'Monster Library',
			desc: 'Built-in D&D 5e and 5.5e stat blocks with lair actions, legendary actions, and full spell lists. Add custom homebrew monsters too.',
			color: 'text-red-400',
			screenshot: '/screenshots/MonsterLibrary.jpg'
		},
		{
			icon: '<i class="fa-duotone fa-light fa-microphone"></i>',
			title: 'Voice Commands',
			desc: 'Run combat hands-free. Say "tracker next", "Aragorn takes 8 damage", or "roll d20" — powered by on-device Moonshine AI.',
			color: 'text-cyan-400',
			screenshot: '/screenshots/VoiceCommands.jpg'
		},
		{
			icon: '<i class="fa-duotone fa-light fa-note-sticky"></i>',
			title: 'Session Notes',
			desc: 'Keep freeform notes tied to each game session — NPCs met, loot found, plot threads. Always one click away during play.',
			color: 'text-yellow-400',
			screenshot: '/screenshots/SessionNotes.jpg'
		},
		{
			icon: '<i class="fa-duotone fa-light fa-book-open"></i>',
			title: 'Quick Reference',
			desc: 'Instant access to conditions, actions, cover rules, exhaustion levels, and common DC tables — right inside the tracker.',
			color: 'text-indigo-400',
			screenshot: '/screenshots/QuickReference.jpg'
		}
	];

	// Prep & worldbuilding extras — shown as a compact icon strip
	const extraFeatures = [
		{
			icon: '<i class="fa-duotone fa-light fa-music"></i>',
			title: 'Audio Mixer',
			desc: 'Ambient soundscapes and music, mixed live from the dashboard.',
			color: 'text-pink-400'
		},
		{
			icon: '<i class="fa-duotone fa-light fa-city"></i>',
			title: 'Town Generator',
			desc: 'Full towns with NPCs, factions, districts, and shops.',
			color: 'text-orange-400'
		},
		{
			icon: '<i class="fa-duotone fa-light fa-map"></i>',
			title: 'Dungeon Generator',
			desc: 'Procedural maps with rooms, traps, and treasure.',
			color: 'text-slate-400'
		},
		{
			icon: '<i class="fa-duotone fa-light fa-beer-mug-empty"></i>',
			title: 'Inn Generator',
			desc: 'Staff, regulars, menus, rumors, and adventure hooks.',
			color: 'text-teal-400'
		},
		{
			icon: '<i class="fa-duotone fa-light fa-cloud-sun-rain"></i>',
			title: 'Weather & Travel',
			desc: 'Biome-aware forecasts, travel pace, and navigation DCs.',
			color: 'text-sky-400'
		},
		{
			icon: '<i class="fa-duotone fa-light fa-dice"></i>',
			title: 'Random Encounter',
			desc: 'Balanced encounters by difficulty and party size.',
			color: 'text-lime-400'
		},
		{
			icon: '<i class="fa-duotone fa-light fa-id-badge"></i>',
			title: 'Name Generator',
			desc: 'Authentic names for any race and gender, in seconds.',
			color: 'text-rose-400'
		},
		{
			icon: '<i class="fa-duotone fa-light fa-shop"></i>',
			title: 'Shop Generator',
			desc: 'Stocked shops with priced wares, from general goods to magic items.',
			color: 'text-emerald-400'
		}
	];

	const trustBadges = [
		'Free forever',
		'No credit card required',
		'No install needed',
		'D&D 5e & 5.5e ready'
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
				<i class="fa-duotone fa-light fa-swords text-xl" aria-hidden="true"></i>
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

			<!-- Trust strip -->
			<div
				class="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-gray-500"
			>
				{#each trustBadges as badge}
					<div class="flex items-center gap-2">
						<i class="fa-duotone fa-light fa-check text-green-600" aria-hidden="true"></i>
						<span>{badge}</span>
					</div>
				{/each}
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
		<div class="fade-in relative mx-auto mt-10 w-full max-w-5xl" use:fadeIn>
			<div
				class="tilt-card overflow-hidden rounded-xl border border-gray-800 bg-gray-900/80 shadow-2xl shadow-black/60"
				use:tiltAway
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
						class="h-auto w-full object-contain transition hover:opacity-90"
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

			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{#each coreFeatures as feature}
					<div
						class="fade-in group rounded-xl border border-gray-800 bg-gray-900/60 p-6 transition hover:border-gray-700 hover:bg-gray-900"
						use:fadeIn
					>
						<a href={feature.screenshot} target="_blank" rel="noopener noreferrer">
							<img
								src={feature.screenshot}
								alt={feature.title}
								class="mb-5 aspect-video w-full rounded-lg border border-gray-800/80 object-cover transition hover:opacity-90"
							/>
						</a>

						<div class="mb-2 flex items-center gap-2.5">
							<span class="text-lg {feature.color}">{@html feature.icon}</span>
							<h3 class="font-bold text-white">{feature.title}</h3>
						</div>
						<p class="text-sm leading-relaxed text-gray-500">{feature.desc}</p>
					</div>
				{/each}
			</div>

			<!-- Extras strip: prep & worldbuilding tools -->
			<div class="mt-16" use:fadeIn>
				<p class="mb-6 text-center text-xs font-bold tracking-[0.3em] text-gray-600 uppercase">
					Plus prep & worldbuilding tools
				</p>
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{#each extraFeatures as feature}
						<div
							class="fade-in flex items-start gap-3 rounded-lg border border-gray-800/70 bg-gray-900/30 p-4"
							use:fadeIn
						>
							<span class="mt-0.5 shrink-0 text-lg {feature.color}">{@html feature.icon}</span>
							<div>
								<h3 class="mb-0.5 text-sm font-bold text-white">{feature.title}</h3>
								<p class="text-xs leading-relaxed text-gray-500">{feature.desc}</p>
							</div>
						</div>
					{/each}
				</div>

				<p class="mt-8 text-center text-xs font-bold tracking-[0.3em] text-gray-600 uppercase">
					And more...
				</p>
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
								<i
									class="fa-duotone fa-light fa-check mt-0.5 shrink-0 text-green-600"
									aria-hidden="true"
								></i>
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
								class="h-auto w-full object-contain transition hover:opacity-90"
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
						<i class="fa-duotone fa-light fa-swords text-amber-500" aria-hidden="true"></i>
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

	<!-- ── Closing strip ─────────────────────────────────────────────────────── -->
	<section class="border-t border-gray-800/60 px-6 py-14 text-center" use:fadeIn>
		<div class="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-4">
			<p class="text-sm text-gray-500">Free to use, no subscription — ready when you are.</p>
			<a
				href="/register"
				class="rounded border border-amber-600 bg-amber-900/40 px-6 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-900/70 hover:text-amber-200"
			>
				Create Free Account
			</a>
		</div>
	</section>

	<!-- ── Footer ─────────────────────────────────────────────────────────────── -->
	<footer class="border-t border-gray-800/60 px-6 py-8">
		<div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
			<div class="flex items-center gap-2">
				<i class="fa-duotone fa-light fa-swords text-base" aria-hidden="true"></i>
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

	:global(.fade-in) {
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

	.tilt-card {
		transform-style: preserve-3d;
		will-change: transform;
		transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.fade-in) {
			opacity: 1;
			transform: none;
		}
	}
</style>
