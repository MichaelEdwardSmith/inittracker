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

	// ── The hero d20 ──────────────────────────────────────────────────────────
	const quips = {
		nat1: [
			'Natural 1. You tripped over your own spreadsheet.',
			'Natural 1. The die rolled off the table. The cat is now involved.',
			'Natural 1. You have rolled so low the goblins feel bad for you.',
			'Natural 1. Somewhere, a bard is already composing a ballad about this.',
			'Natural 1. Please do not tell the party. Please. They can see the screen.'
		],
		low: [
			'You go first… to find out the goblins were never the problem. (Rolled low.)',
			'Low roll. You act last, which is to say, you get to watch.',
			'A modest showing. The wizard will describe it as “strategic patience.”',
			'Rolled low. At least the monsters will go first and soften the blow. (They won’t.)',
			'Bottom of the order. Excellent time to reconsider that tavern brawl.',
			'That roll is why rogues carry daggers and grudges.'
		],
		mid: [
			'Solid. Unremarkable. Exactly how your last three characters died.',
			'Middle of the pack. Safe, sensible, and doomed to be forgotten.',
			'A perfectly average roll. Your barbarian is unimpressed.',
			'Not bad, not great. The dice shrugged, and so did we.',
			'Respectable. The party’s cleric nods without looking up from their phone.',
			'Mid-initiative: the “let the fighter take the first hit” zone.'
		],
		high: [
			'Look at you, acting before the monsters. Growth.',
			'High roll! You get to be wrong first.',
			'You act early. The rogue is beside themselves with delight.',
			'Great roll. The DM pretends not to be nervous.',
			'Quick on the draw. Slow on the plan, as ever.',
			'A fine roll. The goblins are reconsidering their life choices.'
		],
		nat20: [
			'NATURAL 20. Your players are already suspicious.',
			'NATURAL 20. The dice are clearly weighted. By destiny.',
			'NATURAL 20. Please enjoy this, because the next fight is a dragon.',
			'NATURAL 20. Your DM will now invent a reason for the room to be on fire.',
			'NATURAL 20. Legends will be told. Mostly by you.'
		]
	};

	let roll = $state<number | null>(null);
	let rolling = $state(false);
	let quip = $state('Go on. Click the die. We know you want to.');

	// Picks a random line for the roll, avoiding an immediate repeat
	function pickQuip(n: number): string {
		const pool =
			n === 20
				? quips.nat20
				: n === 1
					? quips.nat1
					: n <= 8
						? quips.low
						: n <= 15
							? quips.mid
							: quips.high;
		const options = pool.filter((q) => q !== quip);
		return options[Math.floor(Math.random() * options.length)];
	}

	function rollD20() {
		if (rolling) return;
		rolling = true;
		let ticks = 0;
		const timer = setInterval(() => {
			roll = Math.ceil(Math.random() * 20);
			if (++ticks >= 10) {
				clearInterval(timer);
				rolling = false;
				quip = pickQuip(roll);
			}
		}, 60);
	}

	// ── Feature zones ─────────────────────────────────────────────────────────
	type Feature = {
		icon: string;
		title: string;
		desc: string;
		color: string;
		screenshot?: string;
		// Wide, short screenshot: shown at its natural aspect ratio instead of a cropped 16:9 frame
		strip?: boolean;
	};
	type Zone = {
		id: string;
		tab: string;
		tabIcon: string;
		kicker: string;
		headline: string;
		blurb: string;
		features: Feature[];
	};

	const zones: Zone[] = [
		{
			id: 'combat',
			tab: 'Combat',
			tabIcon: 'fa-swords',
			kicker: 'During the fight',
			headline: 'Controlled chaos, with a spreadsheet’s dignity',
			blurb:
				'The party has decided to attack the one NPC you didn’t prepare. We got you. Everything here is one click from the turn order.',
			features: [
				{
					icon: 'fa-swords',
					title: 'Initiative Order',
					desc: 'Sorted automatically, ties broken by dex, turns advanced by click or voice. Never again will you ask “who’s next?” and be answered with silence.',
					color: 'text-amber-400',
					screenshot: '/screenshots/Initiative.jpg'
				},
				{
					icon: 'fa-shield-halved',
					title: 'HP & Conditions',
					desc: 'Current, max, and temp HP, all 15 conditions, plus advantage and disadvantage. Replaces the sticky notes you keep losing.',
					color: 'text-blue-400',
					screenshot: '/screenshots/HP&Conditions.jpg',
					strip: true
				},
				{
					icon: 'fa-dragon',
					title: 'Monster Library',
					desc: '5e and 5.5e stat blocks with legendary actions, lair actions, and spells. Or add your own homebrew. We won’t judge the CR 3 “Gerald.”',
					color: 'text-red-400',
					screenshot: '/screenshots/MonsterLibrary.jpg'
				},
				{
					icon: 'fa-microphone',
					title: 'Voice Commands',
					desc: 'Say “tracker next” or “Aragorn takes 8 damage.” Hands-free combat, so your hands are free for dramatic gesturing.',
					color: 'text-cyan-400',
					screenshot: '/screenshots/VoiceCommands.jpg'
				},
				{
					icon: 'fa-map',
					title: 'Battle Map',
					desc: 'Draggable tokens and a distance ruler, for when “about thirty feet-ish” starts a debate.',
					color: 'text-emerald-400',
					screenshot: '/screenshots/BattleMap.jpg'
				},
				{
					icon: 'fa-person-running',
					title: 'Chase Tracker',
					desc: 'A proper gap-track for pursuits. Finally, a fair way to lose the rogue’s thief.',
					color: 'text-orange-400',
					screenshot: '/screenshots/ChaseTracker.jpg'
				},
				{
					icon: 'fa-skull',
					title: 'Death Saves & Dying',
					desc: 'Tracked on the DM screen and on the player display. Dramatic tension, now with visible dots.',
					color: 'text-rose-400',
					screenshot: '/screenshots/DeathSaves.jpg',
					strip: true
				},
				{
					icon: 'fa-hourglass-half',
					title: 'Turn Timer & Combat Log',
					desc: 'A timer for the player who “just needs a second,” and a log that remembers who did what.',
					color: 'text-yellow-400',
					screenshot: '/screenshots/TurnTimerCombatLog.jpg',
					strip: true
				}
			]
		},
		{
			id: 'prep',
			tab: 'Prep',
			tabIcon: 'fa-compass-drafting',
			kicker: 'Before the session',
			headline: 'Look like you planned for weeks',
			blurb:
				'It’s 40 minutes to game time. The party is heading to a town you haven’t named. Sixteen generators are ready to bail you out.',
			features: [
				{
					icon: 'fa-city',
					title: 'Town Generator',
					desc: 'Full towns with NPCs, factions, shops, floor plans, and a keep if you’re feeling feudal.',
					color: 'text-orange-400',
					screenshot: '/screenshots/TownGenerator.jpg'
				},
				{
					icon: 'fa-dungeon',
					title: 'Dungeon Generator',
					desc: 'Rooms, traps, puzzles, treasure, and fog-of-war you can reveal to players as they stumble in.',
					color: 'text-slate-400',
					screenshot: '/screenshots/DungeonGenerator.jpg'
				},
				{
					icon: 'fa-beer-mug-empty',
					title: 'Inn Generator',
					desc: 'Owner, staff, menu, rumors (secretly marked true or false), and quest hooks. The tavern scene writes itself.',
					color: 'text-teal-400',
					screenshot: '/screenshots/InnGenerator.jpg'
				},
				{
					icon: 'fa-dice',
					title: 'Random Encounters',
					desc: 'XP-budgeted by party size and difficulty. Choose “Deadly” and mean it.',
					color: 'text-lime-400',
					screenshot: '/screenshots/EncounterGenerator.jpg'
				},
				{
					icon: 'fa-cloud-sun-rain',
					title: 'Weather & Travel',
					desc: 'A week of biome-aware forecasts. It will rain exactly when the party forgot their cloaks.',
					color: 'text-sky-400',
					screenshot: '/screenshots/WeatherGenerator.jpg'
				},
				{
					icon: 'fa-id-badge',
					title: 'Names & NPCs',
					desc: 'Names for every race, plus NPCs with secrets, flaws, and stat blocks. No more “Bob the Innkeeper.” (Okay, a little Bob.)',
					color: 'text-rose-400',
					screenshot: '/screenshots/NameGenerator.jpg'
				},
				{
					icon: 'fa-shop',
					title: 'Shops & Black Markets',
					desc: 'Properly priced wares with friendly, neutral, and hostile haggling tiers. Magic items included, scruples not.',
					color: 'text-emerald-400',
					screenshot: '/screenshots/ShopGenerator.jpg'
				},
				{
					icon: 'fa-hat-wizard',
					title: 'Towers, Cults & Noble Houses',
					desc: 'Wizard’s towers, thieves’ guilds, caravans, graveyards, and scandalous noble houses. Villainy, pre-assembled.',
					color: 'text-purple-400',
					screenshot: '/screenshots/VillainryGenerators.jpg'
				}
			]
		},
		{
			id: 'table',
			tab: 'Table Toys',
			tabIcon: 'fa-masks-theater',
			kicker: 'At the table',
			headline: 'Because “just roleplay it” only goes so far',
			blurb:
				'Atmosphere, handouts, and distractions to keep five adults focused for four hours. Results may vary.',
			features: [
				{
					icon: 'fa-tv',
					title: 'Live Viewer Display',
					desc: 'Share a 6-character code. Players watch initiative, HP, and conditions update live on their own phones. No account, no install, no excuses.',
					color: 'text-green-400',
					screenshot: '/screenshots/LiveViewerDisplay.jpg'
				},
				{
					icon: 'fa-music',
					title: 'Audio Mixer',
					desc: 'Mix ambient soundscapes and music live. Nothing sets the mood like a distant thunderstorm and your cat walking across the keyboard.',
					color: 'text-pink-400',
					screenshot: '/screenshots/AudioMixer.jpg'
				},
				{
					icon: 'fa-file-image',
					title: 'Document Share',
					desc: 'Push a handout or a map to every screen and scribble on it live. The cryptic note, finally legible.',
					color: 'text-indigo-400',
					screenshot: '/screenshots/DocumentShare.jpg'
				},
				{
					icon: 'fa-dice-d20',
					title: 'Dice Roller',
					desc: 'For the dice you left at home, or the dice you’ve forbidden from the table after last week.',
					color: 'text-amber-400',
					screenshot: '/screenshots/DiceRoller.jpg'
				},
				{
					icon: 'fa-envelope',
					title: 'Player Messaging',
					desc: 'Players can whisper to the DM. Passing notes, but nobody gets detention.',
					color: 'text-cyan-400',
					screenshot: '/screenshots/PlayerMessaging.jpg'
				},
				{
					icon: 'fa-chart-simple',
					title: 'Polls & Stream Overlay',
					desc: 'Let the table vote, or put the initiative on stream like the professional you are.',
					color: 'text-sky-400',
					screenshot: '/screenshots/PollsOverlay.jpg'
				},
				{
					icon: 'fa-dice-five',
					title: 'Liar’s Dice',
					desc: 'Bluff at your friends in character. Friendships have been tested.',
					color: 'text-orange-400',
					screenshot: '/screenshots/LiarsDice.jpg'
				}
			]
		},
		{
			id: 'after',
			tab: 'Aftermath',
			tabIcon: 'fa-book-skull',
			kicker: 'After the session',
			headline: 'Proof of what happened (and who did it)',
			blurb:
				'Somebody will say “I never agreed to that.” You will have receipts. The party’s memory is now the party’s problem.',
			features: [
				{
					icon: 'fa-scroll',
					title: 'Combat Chronicles',
					desc: 'Every fight is recorded: event logs, HP arcs, XP earned, and casualties. A permanent record of every questionable decision.',
					color: 'text-purple-400',
					screenshot: '/screenshots/CombatChronicles.jpg'
				},
				{
					icon: 'fa-note-sticky',
					title: 'Session Notes',
					desc: 'NPCs met, loot found, plot threads dropped. Write it down before it’s forgotten, like the name of that barkeep.',
					color: 'text-yellow-400',
					screenshot: '/screenshots/SessionNotes.jpg'
				},
				{
					icon: 'fa-book-open',
					title: 'Quick Reference',
					desc: 'Conditions, cover, exhaustion, and DC tables. Settles rules arguments in under ten minutes, usually.',
					color: 'text-indigo-400',
					screenshot: '/screenshots/QuickReference.jpg'
				},
				{
					icon: 'fa-layer-group',
					title: 'Multiple Game Sessions',
					desc: 'Run more than one campaign without mixing up your Tuesday goblins and your Friday goblins.',
					color: 'text-teal-400',
					screenshot: '/screenshots/GameSessions.jpg'
				},
				{
					icon: 'fa-calendar-check',
					title: 'Scheduling',
					desc: 'Find a night that works for everyone. A sacred quest that has ended greater campaigns than any lich.',
					color: 'text-emerald-400',
					screenshot: '/screenshots/Scheduling.jpg'
				},
				{
					icon: 'fa-wand-sparkles',
					title: 'Spell & Item Reference',
					desc: 'Look up spells, weapons, armor, and magic items without a three-pound book.',
					color: 'text-pink-400',
					screenshot: '/screenshots/SpellItemReference.jpg'
				}
			]
		}
	];

	let activeZoneId = $state('combat');
	let selectedTitle = $state<string | null>(null);

	const activeZone = $derived(zones.find((z) => z.id === activeZoneId) ?? zones[0]);
	const featuredFeature = $derived(
		activeZone.features.find((f) => f.title === selectedTitle && f.screenshot) ??
			activeZone.features.find((f) => f.screenshot)
	);

	function pickZone(id: string) {
		activeZoneId = id;
		selectedTitle = null;
	}

	// ── Misc content ──────────────────────────────────────────────────────────
	const stats = [
		{ value: '$0', label: 'Cost. Forever. Even for the goblins.' },
		{ value: '16', label: 'Generators for when you didn’t prep' },
		{ value: '2', label: 'Editions supported (5e and 5.5e)' },
		{ value: '0', label: 'Player accounts required' }
	];

	const steps = [
		{
			num: '1',
			title: 'Add your party',
			desc: 'Names, AC, HP, dex modifier. Once. They stick around, unlike most of your NPCs.'
		},
		{
			num: '2',
			title: 'Summon monsters',
			desc: 'Pick from the bestiary or your homebrew. Add six more when the party is doing too well.'
		},
		{
			num: '3',
			title: 'Roll & suffer',
			desc: 'Enter initiatives, hit start, and track the carnage as it unfolds.'
		},
		{
			num: '4',
			title: 'Share the screen',
			desc: 'Players follow along on their phones. Questions of “is it my turn?” drop sharply.'
		}
	];

	const faqs = [
		{
			q: 'Is it really free?',
			a: 'Yes. No trial, no credit card, no “premium dragons.” If it saves you an evening, a coffee is welcome, never required.'
		},
		{
			q: 'Do my players need accounts?',
			a: 'Nope. They type in a 6-character code. That’s already more effort than they put into their backstories.'
		},
		{
			q: 'Will it stop my players from metagaming?',
			a: 'Nothing can. But we do hide the monsters’ exact HP and AC unless you say otherwise.'
		},
		{
			q: 'What if there’s a total party kill?',
			a: 'Combat Chronicles will remember. It remembers everything. Say hello to the casualty list.'
		},
		{
			q: 'Does it work with 5.5e?',
			a: 'Yes, both the 2014 and 2024 rules. Pick one in settings and argue about the other at the table.'
		}
	];
</script>

<svelte:head>
	<title>Initiative Tracker — D&D 5e Combat Manager</title>
	<meta
		name="description"
		content="Free D&D 5e and 5.5e initiative tracker with a live player display, monster library, and 16 generators to cover for you when you didn't prep."
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
					href="/join"
					class="hidden text-sm text-green-500 transition hover:text-green-300 sm:block"
				>
					I’m a Player
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

	<main id="main-content" tabindex="-1" class="relative z-10">
		<!-- ── Hero ──────────────────────────────────────────────────────────────── -->
		<section class="px-6 pt-20 pb-24">
			<div class="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.8fr_1fr]">
				<div class="text-center lg:text-left">
					<p class="mb-5 text-xs font-bold tracking-[0.3em] text-amber-600 uppercase">
						The D&D combat tracker for people with other things to do
					</p>

					<h1
						class="mb-6 text-5xl leading-[1.05] font-black tracking-tight text-white sm:text-6xl lg:text-7xl"
					>
						Herding adventurers<br />
						<span class="text-amber-400">since round one.</span>
					</h1>

					<p class="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-gray-400 lg:mx-0">
						Initiative, HP, conditions, and a live screen for your players, so you can stop shouting
						“who’s next?” and start enjoying your own game. Works with 5e and 5.5e.
					</p>

					<div class="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
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
						<a
							href="https://www.buymeacoffee.com/inittracker"
							target="_blank"
							rel="noopener noreferrer"
						>
							<img
								src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png"
								alt="Buy Me A Coffee"
								style="height: 45px; width: 163px;"
							/>
						</a>
					</div>

					<form method="POST" action="/login?/guest" class="mt-5">
						<button
							type="submit"
							class="text-sm text-gray-500 underline underline-offset-4 transition hover:text-gray-300"
						>
							Just let me in as a guest. No commitment, no judgment.
						</button>
					</form>

					<p class="mt-6 text-sm text-gray-500">
						Player?
						<a href="/join" class="text-green-400 transition hover:text-green-300"
							>Join your DM’s game here</a
						>
						(you only need the code they keep yelling).
					</p>
				</div>

				<!-- Interactive d20 -->
				<div class="flex flex-col items-center">
					<button
						type="button"
						onclick={rollD20}
						aria-label="Roll a d20"
						class="d20 group relative flex h-56 w-56 items-center justify-center transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 active:scale-95 {rolling
							? 'is-rolling'
							: ''}"
					>
						<svg viewBox="0 0 100 100" class="absolute inset-0 h-full w-full" aria-hidden="true">
							<polygon
								points="50,4 92,28 92,72 50,96 8,72 8,28"
								class="fill-amber-950/70 stroke-amber-500"
								stroke-width="2.5"
								stroke-linejoin="round"
							/>
							<polyline
								points="50,4 50,34 8,72 M50,34 92,72 M8,28 50,34 92,28 M50,96 50,66 8,28 M50,66 92,28 M8,72 50,66 92,72"
								class="fill-none stroke-amber-700/70"
								stroke-width="1.2"
								stroke-linejoin="round"
							/>
						</svg>
						<span class="relative text-6xl font-black text-amber-300 tabular-nums">
							{roll ?? '20'}
						</span>
					</button>
					<p
						class="mt-6 min-h-14 max-w-xs text-center text-sm text-gray-400"
						role="status"
						aria-live="polite"
					>
						{quip}
					</p>
				</div>
			</div>

			<!-- Stats strip -->
			<div
				class="fade-in mx-auto mt-20 grid max-w-5xl gap-px overflow-hidden rounded-xl border border-gray-800 bg-gray-800 sm:grid-cols-2 lg:grid-cols-4"
				use:fadeIn
			>
				{#each stats as stat}
					<div class="bg-gray-950/90 px-6 py-5 text-center">
						<div class="text-3xl font-black text-amber-400">{stat.value}</div>
						<div class="mt-1 text-xs text-gray-500">{stat.label}</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- ── Features by phase of the game ─────────────────────────────────────── -->
		<section class="px-6 py-24" id="features">
			<div class="mx-auto max-w-6xl">
				<div class="mb-12 text-center" use:fadeIn>
					<p class="mb-3 text-xs font-bold tracking-[0.3em] text-amber-600 uppercase">
						What’s in the box
					</p>
					<h2 class="text-3xl font-black tracking-tight text-white sm:text-4xl">
						Organized by how a session actually goes
					</h2>
					<p class="mt-4 text-gray-500">
						Plan it. Fight it. Play with it. Regret it. Pick a phase to see the toys.
					</p>
				</div>

				<!-- Tabs -->
				<div
					role="tablist"
					aria-label="Feature categories"
					class="mb-10 flex flex-wrap justify-center gap-2"
				>
					{#each zones as zone}
						<button
							role="tab"
							id="tab-{zone.id}"
							aria-selected={activeZoneId === zone.id}
							aria-controls="panel-{zone.id}"
							onclick={() => pickZone(zone.id)}
							class="rounded-full border px-5 py-2 text-sm font-semibold transition {activeZoneId ===
							zone.id
								? 'border-amber-600 bg-amber-900/40 text-amber-300'
								: 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-600 hover:text-gray-200'}"
						>
							<i class="fa-duotone fa-light {zone.tabIcon} mr-2" aria-hidden="true"></i>{zone.tab}
						</button>
					{/each}
				</div>

				<!-- Panel -->
				<div
					role="tabpanel"
					id="panel-{activeZone.id}"
					aria-labelledby="tab-{activeZone.id}"
					class="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 sm:p-10"
				>
					<div class="mb-8 max-w-2xl">
						<p class="mb-2 text-xs font-bold tracking-[0.3em] text-amber-600 uppercase">
							{activeZone.kicker}
						</p>
						<h3 class="mb-3 text-2xl font-black text-white sm:text-3xl">{activeZone.headline}</h3>
						<p class="text-gray-400">{activeZone.blurb}</p>
					</div>

					<div class="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
						<!-- Feature list -->
						<ul class="grid gap-3 sm:grid-cols-2">
							{#each activeZone.features as feature}
								<li>
									<button
										type="button"
										onclick={() => (selectedTitle = feature.title)}
										onmouseenter={() => feature.screenshot && (selectedTitle = feature.title)}
										class="h-full w-full rounded-lg border p-4 text-left transition {featuredFeature?.title ===
										feature.title
											? 'border-amber-700 bg-gray-900'
											: 'border-gray-800/80 bg-gray-950/50 hover:border-gray-700 hover:bg-gray-900'}"
									>
										<span class="mb-1.5 flex items-center gap-2.5">
											<i
												class="fa-duotone fa-light {feature.icon} text-lg {feature.color}"
												aria-hidden="true"
											></i>
											<span class="text-sm font-bold text-white">{feature.title}</span>
										</span>
										<span class="block text-xs leading-relaxed text-gray-500">{feature.desc}</span>
									</button>
								</li>
							{/each}
						</ul>

						<!-- Screenshot -->
						<div class="lg:sticky lg:top-24 lg:self-start">
							{#if featuredFeature?.screenshot}
								<div
									class="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-xl shadow-black/40"
								>
									<div
										class="flex items-center gap-2 border-b border-gray-800 bg-gray-900 px-4 py-2.5"
									>
										<div class="h-2.5 w-2.5 rounded-full bg-gray-700"></div>
										<div class="h-2.5 w-2.5 rounded-full bg-gray-700"></div>
										<div class="h-2.5 w-2.5 rounded-full bg-gray-700"></div>
										<span class="mx-auto text-xs text-gray-600">{featuredFeature.title}</span>
									</div>
									<a href={featuredFeature.screenshot} target="_blank" rel="noopener noreferrer">
										<img
											src={featuredFeature.screenshot}
											alt="{featuredFeature.title} screenshot"
											class="w-full transition hover:opacity-90 {featuredFeature.strip
												? 'h-auto'
												: 'aspect-video object-cover object-top'}"
										/>
									</a>
								</div>
								<p class="mt-3 text-center text-xs text-gray-600">
									Click a card to peek at it. Click the picture to see it bigger.
								</p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ── Live viewer highlight ──────────────────────────────────────────────── -->
		<section class="border-y border-gray-800/50 bg-gray-900/30 px-6 py-24">
			<div class="mx-auto max-w-6xl">
				<div class="flex flex-col items-center gap-14 lg:flex-row lg:gap-20" use:fadeIn>
					<div class="flex-1">
						<p class="mb-3 text-xs font-bold tracking-[0.3em] text-green-600 uppercase">
							Live Display
						</p>
						<h2 class="mb-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
							“Whose turn is it?”<br />
							<span class="text-green-400">Look at your phone.</span>
						</h2>
						<p class="mb-6 leading-relaxed text-gray-400">
							Hand your players a 6-character code. They watch the turn order, HP bars, and
							conditions update in real time on whatever they’re already holding under the table.
						</p>
						<ul class="space-y-3 text-sm text-gray-500">
							{#each ['Instant updates. The server does the shouting now.', 'Shows the current turn, round count, and HP', 'Conditions on display: blinded, stunned, prone, “inexplicably on fire”', 'Phone, tablet, laptop, or that fridge with a browser'] as item}
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
		<section class="px-6 py-24">
			<div class="mx-auto max-w-6xl">
				<div class="mb-14 text-center" use:fadeIn>
					<p class="mb-3 text-xs font-bold tracking-[0.3em] text-amber-600 uppercase">
						How it works
					</p>
					<h2 class="text-3xl font-black tracking-tight text-white sm:text-4xl">
						Four steps. One is optional. We won’t say which.
					</h2>
				</div>

				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" use:fadeIn>
					{#each steps as step}
						<div class="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
							<div
								class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-amber-800/50 bg-amber-950/40 text-lg font-black text-amber-500"
							>
								{step.num}
							</div>
							<h3 class="mb-2 font-bold text-white">{step.title}</h3>
							<p class="text-sm leading-relaxed text-gray-500">{step.desc}</p>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- ── FAQ ───────────────────────────────────────────────────────────────── -->
		<section class="border-t border-gray-800/50 bg-gray-900/30 px-6 py-24">
			<div class="mx-auto max-w-3xl">
				<div class="mb-10 text-center" use:fadeIn>
					<p class="mb-3 text-xs font-bold tracking-[0.3em] text-amber-600 uppercase">
						Questions from the tavern
					</p>
					<h2 class="text-3xl font-black tracking-tight text-white sm:text-4xl">
						Frequently asked, occasionally answered
					</h2>
				</div>

				<div class="space-y-3" use:fadeIn>
					{#each faqs as faq}
						<details class="group rounded-lg border border-gray-800 bg-gray-900/60 px-5 py-4">
							<summary
								class="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white"
							>
								{faq.q}
								<i
									class="fa-duotone fa-light fa-chevron-down text-xs text-gray-500 transition group-open:rotate-180"
									aria-hidden="true"
								></i>
							</summary>
							<p class="mt-3 text-sm leading-relaxed text-gray-400">{faq.a}</p>
						</details>
					{/each}
				</div>
			</div>
		</section>

		<!-- ── Closing CTA ───────────────────────────────────────────────────────── -->
		<section class="px-6 py-24 text-center" use:fadeIn>
			<div class="mx-auto max-w-2xl">
				<h2 class="mb-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
					Your players are waiting.<br />
					<span class="text-amber-400">Impatiently. Loudly.</span>
				</h2>
				<p class="mb-8 text-gray-500">
					Free to use, no subscription, and nobody has to learn a new class to use it.
				</p>
				<div class="flex flex-wrap items-center justify-center gap-4">
					<a
						href="/register"
						class="rounded border border-amber-600 bg-amber-900/40 px-8 py-3 text-sm font-bold text-amber-300 transition hover:bg-amber-900/70 hover:text-amber-200"
					>
						Create Free Account
					</a>
					<a
						href="https://www.buymeacoffee.com/inittracker"
						target="_blank"
						rel="noopener noreferrer"
					>
						<img
							src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png"
							alt="Buy Me A Coffee"
							style="height: 45px; width: 163px;"
						/>
					</a>
				</div>
			</div>
		</section>
	</main>

	<!-- ── Footer ─────────────────────────────────────────────────────────────── -->
	<footer class="relative z-10 border-t border-gray-800/60 px-6 py-8">
		<div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
			<div class="flex items-center gap-2">
				<i class="fa-duotone fa-light fa-swords text-base" aria-hidden="true"></i>
				<span class="text-xs font-bold tracking-[0.2em] text-gray-600 uppercase"
					>Initiative Tracker</span
				>
				<span class="ml-2 text-xs text-gray-700">No dragons were harmed. Several were rolled.</span>
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

	/* ── d20 tumble ── */
	.d20.is-rolling svg {
		animation: d20-tumble 0.6s linear;
	}

	@keyframes d20-tumble {
		0% {
			transform: rotate(0deg) scale(1);
		}
		50% {
			transform: rotate(180deg) scale(1.12);
		}
		100% {
			transform: rotate(360deg) scale(1);
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

	@media (prefers-reduced-motion: reduce) {
		:global(.fade-in) {
			opacity: 1;
			transform: none;
		}
		.d20.is-rolling svg {
			animation: none;
		}
	}
</style>
