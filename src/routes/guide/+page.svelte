<!-- In-app user guide (/guide). Static help page with a sticky table of contents and
     sections covering DM setup, player joining, the dashboard, combat flow, conditions,
     custom monsters, bestiary import, session management, history, and player messaging. -->
<script lang="ts">
	let { data } = $props();

	const toc = [
		{ id: 'getting-started-dm', label: '1. Getting Started (DM)' },
		{ id: 'getting-started-players', label: '2. Getting Started (Players)' },
		{ id: 'dm-dashboard', label: '3. The DM Dashboard' },
		{ id: 'managing-players', label: '4. Managing Your Party' },
		{ id: 'managing-enemies', label: '5. Managing Enemies' },
		{ id: 'running-combat', label: '6. Running Combat' },
		{ id: 'initiative-ties', label: '↳ Initiative Ties' },
		{ id: 'hit-points', label: '7. Hit Points & Armor Class' },
		{ id: 'death-saves', label: '↳ Death Saving Throws' },
		{ id: 'concentration-check', label: '↳ Concentration Checks' },
		{ id: 'legendary-actions', label: '↳ Legendary Actions' },
		{ id: 'lair-actions', label: '↳ Lair Actions' },
		{ id: 'conditions', label: '8. Conditions & Statuses' },
		{ id: 'player-display', label: '9. The Player Display' },
		{ id: 'game-sessions', label: '10. Game Sessions' },
		{ id: 'chronicles', label: '11. Combat Chronicles' },
		{ id: 'dice-roller', label: '12. Dice Roller' },
		{ id: 'encounter-builder', label: '13. Encounter Builder' },
		{ id: 'spell-reference', label: '14. Spell Reference' },
		{ id: 'player-messaging', label: '15. Player Messaging' },
		{ id: 'contact', label: '16. Contact & Support' }
	];

	const conditions = [
		'Blinded',
		'Charmed',
		'Concentrating',
		'Deafened',
		'Exhausted',
		'Frightened',
		'Grappled',
		'Incapacitated',
		'Invisible',
		'Paralyzed',
		'Petrified',
		'Poisoned',
		'Prone',
		'Restrained',
		'Stunned'
	];

	const advConditions = [
		'Advantage For',
		'Advantage Against',
		'Disadvantage For',
		'Disadvantage Against'
	];
</script>

<!-- Reusable snippets -->

{#snippet h2(n: string, title: string)}
	<div class="mb-6 flex items-center gap-3">
		<span
			class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-900/40 text-xs font-black text-amber-400"
			>{n}</span
		>
		<h2 class="text-xl font-black tracking-wide text-amber-400">{title}</h2>
		<div class="flex-1 border-t border-gray-800"></div>
	</div>
{/snippet}

{#snippet dataTable(headers: string[], rows: string[][])}
	<div class="overflow-hidden rounded-lg border border-gray-800">
		<table class="w-full text-sm">
			<thead class="bg-gray-800/60">
				<tr>
					{#each headers as header}
						<th
							class="px-4 py-2.5 text-left text-xs font-bold tracking-widest text-gray-400 uppercase"
							>{header}</th
						>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-800/60">
				{#each rows as row}
					<tr class="transition hover:bg-gray-800/30">
						{#each row as cell, i}
							<td class="px-4 py-2.5 {i === 0 ? 'font-semibold text-white' : 'text-gray-400'}"
								>{cell}</td
							>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/snippet}

<svelte:head>
	<title>User Guide — Initiative Tracker</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 text-gray-300">
	<!-- Header -->
	<header
		class="sticky top-0 z-20 flex items-center gap-4 border-b border-gray-800 bg-gray-900/95 px-6 py-3 backdrop-blur"
	>
		<a
			href="/"
			class="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 transition hover:border-amber-600 hover:text-amber-300"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-3.5 w-3.5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Dashboard
		</a>
		<div class="flex items-center gap-2">
			<span class="text-lg">⚔️</span>
			<h1 class="text-sm font-black tracking-[0.25em] text-amber-400 uppercase">User Guide</h1>
		</div>
	</header>

	<div class="mx-auto flex max-w-6xl gap-8 px-6 py-10">
		<!-- Sticky TOC sidebar (desktop only) -->
		<aside class="hidden w-56 shrink-0 lg:block">
			<nav class="sticky top-20 space-y-0.5 text-xs">
				<p class="mb-3 font-black tracking-widest text-gray-600 uppercase">Contents</p>
				{#each toc as item}
					<a
						href="#{item.id}"
						class="block truncate rounded py-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-amber-300 {item.label.startsWith('↳') ? 'pl-6 pr-2' : 'px-2'}"
					>
						{item.label}
					</a>
				{/each}
				{#if data.showVoiceCommands}
					<a
						href="#voice-commands"
						class="block truncate rounded px-2 py-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-amber-300"
					>
						17. Voice Commands (Beta)
					</a>
				{/if}
			</nav>
		</aside>

		<!-- Main content -->
		<main class="min-w-0 flex-1 space-y-16">
			<!-- 1 ─────────────────────────────────────── -->
			<section id="getting-started-dm">
				{@render h2('1', 'Getting Started (DM)')}

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Creating an Account
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Navigate to <code
						class="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-amber-300"
						>/register</code
					>
					and fill in your first and last name, email address, a password (minimum 8 characters),
					and a password confirmation. Click
					<strong class="font-semibold text-white">Create Account</strong> — you will land directly on
					your dashboard.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Logging In
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Go to <code class="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-amber-300"
						>/login</code
					>, enter your email and password, and click
					<strong class="font-semibold text-white">Enter</strong>. Your last active combat state is
					restored automatically.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Logging Out
				</h3>
				<p class="text-sm leading-relaxed">
					Click the <strong class="font-semibold text-white">logout icon</strong> (arrow pointing right)
					in the top-right corner of the dashboard header.
				</p>
			</section>

			<!-- 2 ─────────────────────────────────────── -->
			<section id="getting-started-players">
				{@render h2('2', 'Getting Started (Players)')}

				<p class="mb-4 text-sm leading-relaxed">
					Players do <strong class="text-white">not</strong> need an account. Your DM will give you
					a <strong class="font-semibold text-white">6-character Session ID</strong> (e.g.
					<code class="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-amber-300"
						>AB3X9K</code
					>).
				</p>
				<ol class="mb-4 ml-4 list-decimal space-y-1.5 text-sm leading-relaxed">
					<li>
						Navigate to <code
							class="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-amber-300">/join</code
						>
					</li>
					<li>
						Type in the Session ID — it auto-formats to uppercase and ignores invalid characters
					</li>
					<li>Click <strong class="font-semibold text-white">Join Session</strong></li>
					<li>
						You are taken to the live <strong class="font-semibold text-white"
							>Player Display</strong
						> for that session
					</li>
				</ol>
				<p class="text-sm leading-relaxed">
					On the display screen, tap <strong class="font-semibold text-white">Join Session</strong>
					to enable live audio, or
					<strong class="font-semibold text-white">Continue without sound</strong> for a silent view.
				</p>
			</section>

			<!-- 3 ─────────────────────────────────────── -->
			<section id="dm-dashboard">
				{@render h2('3', 'The DM Dashboard')}

				<p class="mb-4 text-sm leading-relaxed">
					The dashboard is your command center, divided into three panels:
				</p>
				{@render dataTable(
					['Panel', 'Contents'],
					[
						['Left sidebar', 'Party (Players)'],
						['Center', 'Initiative Order'],
						['Right sidebar', 'Enemy Library']
					]
				)}
				<p class="mt-4 mb-4 text-sm leading-relaxed">
					On mobile, the sidebars are hidden. Tap <strong class="font-semibold text-white"
						>Party</strong
					>
					or <strong class="font-semibold text-white">Enemies</strong> in the bottom action bar to open
					them full-screen. Tap the <strong class="font-semibold text-white">✕ close button</strong> or
					press back to return to the main tracker.
				</p>
				<p class="mt-0 mb-6 text-sm leading-relaxed">
					On desktop, the <strong class="font-semibold text-white">Enemy panel</strong> is resizable —
					drag its <strong class="font-semibold text-white">left edge</strong> left or right to make it
					wider or narrower (200–520 px). Your preferred width is saved automatically.
				</p>

				<h3 class="mt-5 mb-3 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Header Bar
				</h3>
				<ul class="ml-4 list-disc space-y-2 text-sm leading-relaxed">
					<li>
						<strong class="font-semibold text-white">⚔️ Initiative Tracker</strong> — app title
					</li>
					<li>
						<strong class="font-semibold text-white">Session display</strong> — active session name
						and its 6-char public ID. Click the
						<strong class="font-semibold text-white">copy icon</strong> to copy it to your clipboard (turns
						into a green checkmark to confirm).
					</li>
					<li>
						<strong class="font-semibold text-white">Dice</strong> — opens the Dice Roller modal (see <a href="#dice-roller" class="text-amber-400 transition hover:text-amber-300">section 12</a>)
					</li>
					<li>
						<strong class="font-semibold text-white">Sessions</strong> — opens the Session Manager modal
					</li>
					<li><strong class="font-semibold text-white">Guide</strong> — opens this page</li>
					<li>
						<strong class="font-semibold text-white">Chronicle</strong> — opens the Combat History page
					</li>
					<li>
						<strong class="font-semibold text-white">Player Display</strong> — opens the viewer screen
						in a new tab (desktop only)
					</li>
					<li>
						<strong class="font-semibold text-white">Contact</strong> — opens your email client to contact
						support
					</li>
					<li><strong class="font-semibold text-white">Logout</strong> — ends your session</li>
				</ul>
			</section>

			<!-- 4 ─────────────────────────────────────── -->
			<section id="managing-players">
				{@render h2('4', 'Managing Your Party (Players)')}

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Adding a Player
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					In the left sidebar, fill in the player's <strong class="font-semibold text-white"
						>Name</strong
					>, <strong class="font-semibold text-white">AC</strong> (Armor Class, default 10), and
					<strong class="font-semibold text-white">Max HP</strong>
					(default 10), then click <strong class="font-semibold text-white">Add Player</strong>.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Player Avatars
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Click a player's circular avatar to upload a photo (JPEG/PNG). It is automatically cropped
					to a square and resized to 256×256. To remove an avatar, hover over it and click the <strong
						class="font-semibold text-white">✕</strong
					> that appears.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Editing a Player
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Double-click a player card (or click the pencil icon) to enter inline edit mode. You can
					change the name, AC, and max HP. Saving resets HP to the new max. Click <strong
						class="font-semibold text-white">Save</strong
					>
					or <strong class="font-semibold text-white">Cancel</strong>.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Benching a Player
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Click the bench icon to remove a player from the current initiative order while keeping
					them in your roster. A <strong class="font-semibold text-white">"Benched"</strong> label
					appears on their card. Click <strong class="font-semibold text-white">+ Combat</strong> to bring
					them back into the fight.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Removing a Player
				</h3>
				<p class="text-sm leading-relaxed">
					Click the <strong class="font-semibold text-red-400">red delete button</strong> on a player
					card to permanently remove them from the roster.
				</p>
			</section>

			<!-- 5 ─────────────────────────────────────── -->
			<section id="managing-enemies">
				{@render h2('5', 'Managing Enemies')}

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					The Enemy Library
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					The right sidebar contains ~380 D&amp;D 5e SRD monsters. Use the controls to find what you
					need:
				</p>
				<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li>
						<strong class="font-semibold text-white">Search bar</strong> — filters by name in real time
					</li>
					<li>
						<strong class="font-semibold text-white">Type dropdown</strong> — filters by monster type
						(Beast, Dragon, Undead, Humanoid, etc.)
					</li>
					<li>
						<strong class="font-semibold text-white">Sort dropdown</strong> — sort A–Z by name, or group
						by type
					</li>
				</ul>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Adding Enemies to Combat
				</h3>
				<ol class="mb-4 ml-4 list-decimal space-y-1.5 text-sm leading-relaxed">
					<li>Click a monster in the list to select it — it highlights in red</li>
					<li>
						A panel slides out below the list — set the quantity (1–20) with the <strong
							class="font-semibold text-white">−</strong
						>
						/ <strong class="font-semibold text-white">+</strong> buttons or by typing
					</li>
					<li>Click <strong class="font-semibold text-white">Add to Encounter</strong></li>
				</ol>
				<p class="mb-4 text-sm leading-relaxed">
					When you add more than one of the same monster they are automatically numbered (<strong
						class="font-semibold text-white">Goblin 1</strong
					>, <strong class="font-semibold text-white">Goblin 2</strong>, etc.) and each gets a
					randomly rolled initiative based on its DEX modifier.
				</p>
				<div
					class="my-4 flex items-start gap-2 rounded-lg border border-amber-800/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-300"
				>
					<span class="mt-0.5 shrink-0">💡</span>
					<span
						>Double-click any monster to instantly add one copy without going through the quantity
						selector.</span
					>
				</div>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Viewing a Stat Block
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					Click the <strong class="font-semibold text-white">ℹ️ info icon</strong> on any built-in or
					bestiary-imported monster (in the library or the initiative order) to open a full D&amp;D stat
					block modal — ability scores, saving throws, traits, actions, resistances, artwork, and more.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Rolling Dice from a Stat Block
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					Inside the stat block modal, two types of values are interactive:
				</p>
				<ul class="mb-4 ml-4 list-disc space-y-2 text-sm leading-relaxed">
					<li>
						<strong class="font-semibold text-white">Damage / HP dice</strong> — any dice expression
						such as <code class="rounded bg-gray-800 px-1 font-mono text-xs text-amber-300">2d6 + 5</code>
						appears in <span class="font-semibold text-amber-300">amber</span> with a dotted underline.
						Click it to roll those dice and add any modifier.
					</li>
					<li>
						<strong class="font-semibold text-white">Attack rolls</strong> — phrases like
						<span class="font-semibold" style="color: rgb(196,181,253);">Melee Weapon Attack: +9 to hit</span>
						appear in violet with a dotted underline. Click the phrase to roll a
						d20 and add the listed attack bonus.
					</li>
				</ul>
				<p class="mb-4 text-sm leading-relaxed">
					A result popup shows each individual die value, a modifier breakdown when one applies, and a
					<strong class="font-semibold text-white">Total</strong>. Use
					<strong class="font-semibold text-white">Roll again</strong> to re-roll the same expression,
					or click anywhere outside the popup to dismiss it.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Custom Monsters
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					Click the <strong class="font-semibold text-white">Custom</strong> button at the top of the
					right sidebar to open the Custom Monster Manager.
				</p>
				<p class="mb-3 text-sm leading-relaxed">
					<strong class="font-semibold text-white">Creating:</strong> Fill in Name, AC, HP, CR, and
					Monster Type (all required), optionally upload an avatar, then click
					<strong class="font-semibold text-white">Create</strong>.
				</p>
				<p class="text-sm leading-relaxed">
					Custom monsters appear at the top of the library list and work exactly like built-in ones.
					Use the <strong class="font-semibold text-white">pencil</strong> and
					<strong class="font-semibold text-white">trash</strong> icons in the manager to edit or delete
					them.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Importing a Bestiary
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					Non-SRD monsters (e.g. Icewind Dale: Rime of the Frostmaiden) cannot be bundled with the app
					because the stat blocks are WotC IP. You can import them yourself from a 5etools bestiary JSON file.
				</p>
				<ol class="mb-4 ml-4 list-decimal space-y-1.5 text-sm leading-relaxed">
					<li>
						Download the bestiary JSON from the
						<strong class="font-semibold text-white">5etools data repository</strong> on GitHub
						(e.g. <code class="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-amber-300">bestiary-idrotf.json</code>)
					</li>
					<li>
						In the Enemy Panel, click the <strong class="font-semibold text-white">⬆ Import</strong> button
						next to the Custom button
					</li>
					<li>Select the JSON file — the app parses it entirely in your browser (nothing is uploaded to any server)</li>
					<li>Review the monster count shown and click <strong class="font-semibold text-white">Import</strong></li>
				</ol>
				<p class="mb-3 text-sm leading-relaxed">
					Imported monsters appear at the top of the library, tagged with a
					<span class="inline rounded bg-indigo-900/60 px-1 py-0.5 font-mono text-[11px] font-semibold text-indigo-300">SOURCE</span>
					badge (e.g. <span class="inline rounded bg-indigo-900/60 px-1 py-0.5 font-mono text-[11px] font-semibold text-indigo-300">IDRotF</span>).
					The badge also appears on the combatant row in the initiative tracker so you always know which
					book a creature came from.
				</p>
				<p class="mb-3 text-sm leading-relaxed">
					Imported monsters carry their full stat block — click the
					<strong class="font-semibold text-white">ℹ️ info icon</strong> to open the stat block modal just
					like built-in SRD monsters. Re-importing the same file skips monsters that are already in your
					library, so it is safe to import repeatedly.
				</p>
				<div
					class="my-4 flex items-start gap-2 rounded-lg border border-amber-800/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-300"
				>
					<span class="mt-0.5 shrink-0">💡</span>
					<span
						>Entries that rely on another monster’s stat block (<code class="rounded bg-amber-900/40 px-1 font-mono text-xs">_copy</code>
						entries) are automatically skipped during import, as they carry no independent stat data.</span
					>
				</div>
			</section>

			<!-- 6 ─────────────────────────────────────── -->
			<section id="running-combat">
				{@render h2('6', 'Running Combat')}

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Setting Initiatives
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Click the initiative field on any combatant row and type a number. Fields left blank show <strong
						class="font-semibold text-white">—</strong
					> and those combatants sort to the bottom.
				</p>

				<div id="initiative-ties">
					<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
						Resolving Initiative Ties
					</h3>
					<p class="mb-3 text-sm leading-relaxed">
						When two or more combatants share the same initiative value,
						<strong class="font-semibold text-white">▲/▼ buttons</strong> appear on the left
						side of each tied card so you can set the tiebreak order.
					</p>
					<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
						<li>
							<strong class="font-semibold text-white">▲</strong> — moves this combatant above
							the one directly ahead of it in the tied group
						</li>
						<li>
							<strong class="font-semibold text-white">▼</strong> — moves this combatant below
							the one directly behind it in the tied group
						</li>
					</ul>
					<p class="mb-6 text-sm leading-relaxed">
						A button is dimmed and inactive when there is no same-initiative neighbour in
						that direction. The buttons disappear entirely once no tie exists.
					</p>
				</div>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Starting Combat
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Once at least one combatant has an initiative set, click <strong
						class="font-semibold text-white">Start Combat</strong
					>. The highest-initiative combatant becomes active (highlighted in amber). The round
					counter starts at <strong class="font-semibold text-white">1</strong>.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Advancing Turns
				</h3>
				<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li>
						<strong class="font-semibold text-white">Next</strong> — advances to the next combatant. When
						the last one acts, the round increments and the order wraps to the top.
					</li>
					<li>
						<strong class="font-semibold text-white">Prev</strong> — steps back one turn (useful for corrections).
					</li>
				</ul>
				<p class="mb-4 text-sm leading-relaxed">
					Dead enemies (0 HP) are automatically skipped in the turn rotation.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Ending Combat
				</h3>
				<p class="mb-6 text-sm leading-relaxed">
					Click <strong class="font-semibold text-white">End</strong> to conclude combat. The
					encounter is automatically saved to your
					<strong class="font-semibold text-white">Combat Chronicles</strong>.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Combatant Notes
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Every combatant row has a <strong class="font-semibold text-white">pencil icon</strong>
					beside the remove (✕) button. Click it to open a notes modal where you can type any
					freeform text — spell concentration reminders, loot notes, roleplay hooks, etc. When a
					note has been saved the icon glows
					<strong class="font-semibold text-amber-300">amber</strong>
					as a visual reminder. Notes persist with the rest of the combat state.
				</p>

				<h3 class="mt-5 mb-3 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Utility Buttons
				</h3>
				{@render dataTable(
					['Button', 'What it does'],
					[
						['Reset Init', 'Clears all initiative values and resets the round counter to 1'],
						['Reset Players', 'Restores all players to max HP, removes temp HP, all conditions, and clears death saves'],
						['Clear Enemies', 'Removes all enemies from the combat tracker'],
						['Save', 'Saves a snapshot to Chronicles without ending combat']
					]
				)}
			</section>

			<!-- 7 ─────────────────────────────────────── -->
			<section id="hit-points">
				{@render h2('7', 'Hit Points, Temp HP & Armor Class')}

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Dealing Damage
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Type an amount in the <strong class="font-semibold text-white">damage field</strong> on
					any row and click <strong class="font-semibold text-red-400">Dmg</strong>. Damage is
					absorbed by Temporary HP first — any overflow reduces current HP. HP cannot go below 0.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">Healing</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Type an amount and click <strong class="font-semibold text-green-400">Heal</strong>. HP
					cannot exceed the combatant's max HP.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Temporary HP
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					For <strong class="font-semibold text-white">players</strong>, a Temp HP section appears
					on each row. Type an amount and click
					<strong class="font-semibold text-yellow-400">Set Temp HP</strong>
					to assign temporary hit points. Click <strong class="font-semibold text-white">✕</strong> to
					clear them. Temp HP shows as a yellow badge and a yellow bar extension on the HP meter. Damage
					reduces temp HP before current HP; healing does not restore temp HP.
				</p>

				<h3 class="mt-5 mb-3 text-sm font-bold tracking-widest text-gray-200 uppercase">
					HP Color Coding
				</h3>
				{@render dataTable(
					['HP remaining', 'Color'],
					[
						['> 50%', 'Green'],
						['26–50%', 'Amber'],
						['1–25%', 'Red'],
						['0 (dead)', 'Grey']
					]
				)}

				<div id="death-saves">
					<h3 class="mt-6 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
						Death Saving Throws
					</h3>
					<p class="mb-4 text-sm leading-relaxed">
						When a <strong class="font-semibold text-white">player</strong> drops to 0 HP they are
						automatically marked <strong class="font-semibold text-white">Unconscious</strong>. Under
						D&amp;D 5e rules, they must roll a death saving throw at the start of each of their turns:
						three successes means they stabilize, three failures means they die.
					</p>

					<p class="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">DM Tracker</p>
					<p class="mb-3 text-sm leading-relaxed">
						A <strong class="font-semibold text-white">&#9760; Death Saves</strong> row appears at the
						bottom of that player's initiative card (visible only while HP = 0):
					</p>
					<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
						<li>
							<strong class="font-semibold text-red-400">Failures</strong> (left) and
							<strong class="font-semibold text-green-400">Successes</strong> (right) — three
							clickable circles each; filled with &#9760; or &#9829; when recorded
						</li>
						<li>
							Click a <strong class="font-semibold text-white">filled</strong> circle to decrement
							(correct a mistake); click an
							<strong class="font-semibold text-white">empty</strong> circle to increment
						</li>
						<li>
							<strong class="font-semibold text-white">Stabilize</strong> button — immediately marks
							the player stable without needing three successes (Medicine check, bonus-action
							healing, etc.)
						</li>
						<li>
							<strong class="font-semibold text-white">reset</strong> link — clears all saves back
							to 0/0 for corrections
						</li>
					</ul>
					<p class="mb-4 text-sm leading-relaxed">
						At <strong class="font-semibold text-red-400">3 failures</strong> a red
						<strong class="font-semibold text-white">&#9760; Dead</strong> banner replaces the circles
						and the <strong class="font-semibold text-white">Dead</strong> condition is auto-applied.
						At <strong class="font-semibold text-green-400">3 successes</strong> or after clicking
						Stabilize, a green <strong class="font-semibold text-white">&#9829; Stable</strong> banner
						is shown instead.
					</p>

					<p class="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Player Display</p>
					<p class="mb-4 text-sm leading-relaxed">
						While a player is at 0 HP the HP bar is replaced with a large
						<strong class="font-semibold text-white">Death Saving Throws panel</strong> — two
						columns showing failures (red skull circles) and successes (green heart circles),
						updating in real time via SSE. A large red
						<strong class="font-semibold text-white">&#9760; DEAD</strong> or green
						<strong class="font-semibold text-white">&#9829; STABILIZED</strong> banner replaces the
						circles when the outcome is decided. The panel is read-only — only the DM records the
						rolls.
					</p>

					<p class="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Recovery</p>
					<p class="mb-6 text-sm leading-relaxed">
						Any healing above 0 HP clears the Unconscious condition and resets the death saves
						tracker automatically — the HP bar returns on the player display.
						<strong class="font-semibold text-white">Reset Players</strong> also clears death saves
						on all players.
					</p>
				</div>

				<div id="concentration-check">
					<h3 class="mt-6 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
						Concentration Checks
					</h3>
					<p class="mb-3 text-sm leading-relaxed">
						When any combatant with the <strong class="font-semibold text-white">Concentrating</strong>
						condition takes damage, a <strong class="font-semibold text-white">Concentration Check</strong>
						modal appears automatically.
					</p>
					<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
						<li>
							Shows the combatant's name, the damage taken, and the
							<strong class="font-semibold text-white">CON Save DC</strong> — the higher of 10 or
							half the damage taken, per PHB rules.
						</li>
						<li>
							<strong class="font-semibold text-green-400">Success</strong> — closes the modal; the
							Concentrating condition remains.
						</li>
						<li>
							<strong class="font-semibold text-red-400">Fail</strong> — closes the modal and
							automatically removes the
							<strong class="font-semibold text-white">Concentrating</strong> condition from that
							combatant.
						</li>
					</ul>
					<p class="mb-6 text-sm leading-relaxed">
						This applies to both players and enemies.
					</p>
				</div>

				<h3 id="legendary-actions" class="mt-6 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Legendary Actions
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					Enemies whose stat block includes legendary actions automatically show a
					<strong class="font-semibold text-white">Legendary Actions</strong> row on their initiative
					card. Three amber dots represent the legendary action uses available each round.
				</p>
				<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li>
						<strong class="font-semibold text-amber-300">Filled dot (●)</strong> — action available.
						<strong class="font-semibold text-amber-300">Hollow dot (○)</strong> — action spent.
					</li>
					<li>
						Click a filled dot to spend actions down to that position; click a hollow dot to restore
						actions from that position onward.
					</li>
					<li>
						All dots <strong class="font-semibold text-white">automatically refill</strong> at the
						start of that creature's turn.
					</li>
					<li>
						Click the <strong class="font-semibold text-white">ℹ️ icon</strong> beside the dots to
						open a quick-reference modal showing all of the creature's legendary action options.
					</li>
				</ul>
				<p class="mb-6 text-sm leading-relaxed text-gray-400">
					This row only appears for enemies with a full stat block (built-in SRD monsters and
					bestiary imports). Custom monsters created manually do not have a stat block and will not
					show the tracker.
				</p>

				<h3 id="lair-actions" class="mt-6 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Lair Actions
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					Some powerful creatures can take <strong class="font-semibold text-white">lair actions</strong>
					— special effects that trigger on initiative count 20. Click the
					<strong class="font-semibold text-white">building icon</strong> on any enemy card to add a
					purple <strong class="font-semibold text-purple-300">Lair Actions</strong> card to the
					initiative order.
				</p>
				<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li>
						The building icon appears between the info and notes buttons on enemy cards, and is only
						visible when no lair card already exists for that creature.
					</li>
					<li>
						The lair card sits at <strong class="font-semibold text-white">initiative count 20</strong>
						and participates in the normal turn order — it is highlighted amber when it is that
						card's turn, prompting you to resolve the lair action.
					</li>
					<li>
						Only one lair card can exist per creature template at a time.
					</li>
					<li>
						When the <strong class="font-semibold text-white">last instance</strong> of a creature is
						removed from combat, its lair card is automatically removed as well.
					</li>
					<li>
						Click the <strong class="font-semibold text-white">✕ button</strong> on the lair card to
						dismiss it manually at any time.
					</li>
				</ul>
				<p class="mb-6 text-sm leading-relaxed text-gray-400">
					On the player display, the lair card appears in the initiative list and active-turn view
					with purple styling and a "LAIR" label.
				</p>

				<h3 class="mt-6 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Armor Class Visibility
				</h3>
				<p class="text-sm leading-relaxed">
					Enemy AC is hidden from the player display by default. Check the <strong
						class="font-semibold text-white">Show AC</strong
					> checkbox on an enemy row to reveal it to players. If there are multiple enemies of the
					same type (e.g. three Goblins), toggling the checkbox on any one of them automatically
					applies the same setting to all others of that type. Players always see their own
					character's AC.
				</p>
			</section>

			<!-- 8 ─────────────────────────────────────── -->
			<section id="conditions">
				{@render h2('8', 'Conditions & Status Effects')}

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Adding a Condition
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Click <strong class="font-semibold text-white">+ Condition</strong> on any combatant row.
					A dropdown lists all conditions in two sections. Click one to apply it — the badge appears
					immediately on the row. Dead and Unconscious are not selectable: when a player drops to 0
					HP they automatically become Unconscious (all other conditions cleared) and a
					<a href="#death-saves" class="text-amber-400 transition hover:text-amber-300"
						>death saving throw tracker</a
					> appears on their row. Enemies at 0 HP are simply removed from the turn order.
				</p>

				<p class="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Standard conditions</p>
				<div class="mb-4 flex flex-wrap gap-2">
					{#each conditions as c}
						<span
							class="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs text-gray-300"
							>{c}</span
						>
					{/each}
				</div>

				<p class="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Advantage / Disadvantage</p>
				<div class="mb-6 flex flex-wrap gap-2">
					{#each advConditions as c}
						<span
							class="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs text-gray-300"
							>{c}</span
						>
					{/each}
				</div>
				<p class="mb-4 text-sm leading-relaxed">
					The four <strong class="font-semibold text-white">Adv / Disadv</strong> conditions behave
					like any other condition — they appear as color-coded badges on both the DM dashboard and
					the player display. Use them to track situational modifiers such as the effects of spells,
					terrain, or class abilities that grant or impose advantage or disadvantage.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Viewing a Condition Description
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Every active condition badge has a small <strong class="font-semibold text-white"
						>ⓘ info icon</strong
					> on its right edge. Clicking it opens a modal showing the condition name and a summary of its
					mechanical effects — what saves it imposes, what actions it prevents, and any special rules.
					This works on both the DM dashboard and the Player Display.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Removing a Condition
				</h3>
				<p class="text-sm leading-relaxed">
					On the <strong class="font-semibold text-white">DM screen</strong>, click the condition
					name portion of the badge to remove it. The ⓘ icon and the remove action are separate —
					clicking the icon only opens the description, it does not remove the condition. Condition
					changes appear as a colored flash and audio cue on the viewer screen.
				</p>
			</section>

			<!-- 9 ─────────────────────────────────────── -->
			<section id="player-display">
				{@render h2('9', 'The Player Display (Viewer Screen)')}

				<p class="mb-4 text-sm leading-relaxed">
					The viewer at <code
						class="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-amber-300"
						>/display/[sessionId]</code
					> is the public-facing screen your players watch during combat. It updates in real time — no
					refreshing needed.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Sharing the Session
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Give players your <strong class="font-semibold text-white">6-character Session ID</strong>
					from the dashboard header. They go to
					<code class="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-amber-300"
						>/join</code
					>, enter the ID, and are taken to the viewer. Or click
					<strong class="font-semibold text-white">Player Display</strong> in the header to open it yourself.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Join Gate
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					When a player first opens the viewer, an overlay asks them to tap <strong
						class="font-semibold text-white">Join Session</strong
					>
					— required by browsers before playing audio.
					<strong class="font-semibold text-white">Continue without sound</strong> skips audio entirely.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					What Players See
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					<strong class="font-semibold text-white">Before combat starts:</strong> A large sword icon,
					"Awaiting Combat", and a list of all combatants with their current initiative rolls.
				</p>
				<p class="mb-3 text-sm leading-relaxed">
					<strong class="font-semibold text-white">During combat:</strong>
				</p>
				<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li>
						Type badge — <strong class="text-blue-400">PLAYER CHARACTER</strong> or
						<strong class="text-red-400">ENEMY</strong>
					</li>
					<li>
						Avatar in a glowing circular frame (uploaded photo or monster artwork/emoji) — <strong
							class="font-semibold text-white">click an enemy's avatar</strong
						> to open the full image in a new tab
					</li>
					<li>Name in large responsive text with a colored glow</li>
					<li>Stats row: Initiative · Armor Class · Hit Points (players only)</li>
					<li>HP bar with color coding and a yellow temp HP extension (players only)</li>
					<li>Active conditions as color-coded badges</li>
					<li>
						<strong class="font-semibold text-white">Up Next</strong> strip — the next 1–4 combatants
						in order
					</li>
				</ul>
				<p class="mb-6 text-sm leading-relaxed">
					The background glows <strong class="text-blue-400">blue</strong> during a player's turn
					and <strong class="text-red-400">red</strong> during an enemy's turn.
				</p>

				<h3 class="mt-5 mb-3 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Flash Effects
				</h3>
				{@render dataTable(
					['Event', 'Flash color'],
					[
						['Damage taken', 'Red'],
						['HP restored', 'Green'],
						['Condition applied', "Condition's color"]
					]
				)}

				<h3 class="mt-6 mb-3 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Audio Effects
				</h3>
				{@render dataTable(
					['Event', 'Sound'],
					[
						['Damage', 'Low thud sweep'],
						['Heal', 'Ascending magical chime'],
						['Condition applied', 'Resonant bell tone'],
						['Temp HP granted', 'Bright shield shimmer'],
						['Combat begins', 'Urgent war-horn fanfare'],
						['Combat ends', 'Triumphant brass fanfare']
					]
				)}
				<p class="mt-4 text-sm leading-relaxed">
					The <strong class="font-semibold text-white">🔊 / 🔇</strong> button in the viewer header toggles
					all sounds on or off.
				</p>

				<h3 class="mt-6 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Connection Status
				</h3>
				<ul class="ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li>
						<strong class="text-green-400">Green dot · Live</strong> — receiving updates normally
					</li>
					<li>
						<strong class="text-gray-500">Grey dot · Connecting…</strong> — reconnecting automatically,
						no action needed
					</li>
				</ul>
			</section>

			<!-- 10 ─────────────────────────────────────── -->
			<section id="game-sessions">
				{@render h2('10', 'Game Sessions')}

				<p class="mb-4 text-sm leading-relaxed">
					Each DM account can have multiple independent game sessions — useful if you run more than
					one campaign or want to separate one-shots from your main game.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					What a Session Contains
				</h3>
				<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li>
						Its own <strong class="font-semibold text-white">6-character public ID</strong> shared with
						players
					</li>
					<li>A user-defined <strong class="font-semibold text-white">name</strong></li>
					<li>
						An independent <strong class="font-semibold text-white">combat state</strong> (combatants,
						HP, turn order)
					</li>
					<li>Its own <strong class="font-semibold text-white">combat history</strong></li>
				</ul>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Opening the Session Manager
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Click the <strong class="font-semibold text-white">Sessions</strong> button (≡ icon) in the
					dashboard header.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Switching Sessions
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Click any session in the list to switch to it. The dashboard reloads with that session's
					state. Players need to use the new session's ID to connect.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Creating a New Session
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Click <strong class="font-semibold text-white">New Session</strong> at the bottom of the
					modal, type a name (or leave blank for a default like "Session 2"), then click
					<strong class="font-semibold text-white">Create</strong>.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Renaming a Session
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Click the <strong class="font-semibold text-white">pencil icon</strong> next to any
					session, edit the name inline, and press
					<strong class="font-semibold text-white">Enter</strong>
					to save or <strong class="font-semibold text-white">Escape</strong> to cancel.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Deleting a Session
				</h3>
				<p class="text-sm leading-relaxed">
					Click the <strong class="font-semibold text-white">trash icon</strong> next to a session.
					A <strong class="font-semibold text-white">"Sure?"</strong> confirmation appears — click again
					to confirm. You cannot delete your last remaining session.
				</p>
			</section>

			<!-- 11 ─────────────────────────────────────── -->
			<section id="chronicles">
				{@render h2('11', 'Combat Chronicles (History)')}

				<p class="mb-4 text-sm leading-relaxed">
					The <strong class="font-semibold text-white">Chronicle</strong> page keeps a permanent record
					of every completed encounter.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					How Records Are Created
				</h3>
				<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li>
						<strong class="font-semibold text-white">End Combat</strong> — automatically saves the full
						encounter to history
					</li>
					<li>
						<strong class="font-semibold text-white">Save</strong> button — creates a manual snapshot
						during active combat without ending it
					</li>
				</ul>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Reading a Combat Record
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					Each card shows encounter number (Roman numerals), enemy roster, date/time/duration, and
					summary stats (rounds, players, casualties, events logged).
				</p>
				<p class="mb-4 text-sm leading-relaxed">
					The <strong class="font-semibold text-white">participants grid</strong> shows every
					combatant with a dual-layer HP bar (ghost starting HP + current HP) and a
					<strong class="font-semibold text-white">☠ Slain</strong> label if they died.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Experience Points
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					When the chronicle is generated, the XP total for the encounter is automatically
					calculated from each <strong class="font-semibold text-white">slain enemy's Challenge
					Rating</strong> using the standard D&amp;D 5e XP-by-CR table. Expand a record to see the
					full breakdown — each slain enemy listed with its CR and XP value, a total, and an
					<strong class="font-semibold text-white">even split per player</strong> if your party is
					listed.
				</p>

				<h3 class="mt-5 mb-3 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Event Log
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					Click <strong class="font-semibold text-white">Show Chronicle</strong> to expand the detailed
					event log, grouped by round:
				</p>
				{@render dataTable(
					['Icon', 'Event type'],
					[
						['⚔', 'Damage — who dealt it, to whom, amount, before/after HP'],
						['♥', 'Heal — who healed whom, amount, before/after HP'],
						['✦', 'Condition added — who inflicted which condition on whom'],
						['✧', 'Condition removed — which condition was lifted'],
						['☠', 'Death — when a combatant was knocked out or slain']
					]
				)}

				<h3 class="mt-6 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Exporting to PDF
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					Click the <strong class="font-semibold text-white">download icon</strong> button on any
					record card header to generate and download a PDF of that encounter. The button shows a
					spinner while it prepares; the file downloads automatically once ready.
				</p>
				<p class="mb-3 text-sm leading-relaxed">The PDF contains:</p>
				<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li>Header — encounter number (Roman numerals), date, time, and duration</li>
					<li>Stats row — rounds, players, casualties, and total XP</li>
					<li>
						Participants table — starting HP, final HP, damage dealt, healing done, and outcome
						(Survived / Slain)
					</li>
					<li>
						XP breakdown — each slain enemy with its CR and XP value, a total, and a per-player
						split (shown when any slain enemies had a CR set)
					</li>
					<li>Full round-by-round event log, paginating automatically for long encounters</li>
				</ul>
				<p class="mb-6 text-sm leading-relaxed">
					Files are named <code
						class="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-amber-300"
						>encounter-XVIII-2025-01-15.pdf</code
					> (Roman-numeral encounter number + ISO date).
				</p>

				<h3 class="mt-6 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Deleting Records
				</h3>
				<ul class="ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li>
						<strong class="font-semibold text-white">Delete one</strong> — click the trash icon on a record
						card and confirm within 3 seconds
					</li>
					<li>
						<strong class="font-semibold text-white">Delete all</strong> — click
						<strong class="font-semibold text-white">Clear All</strong> at the top of the page and confirm
					</li>
				</ul>
			</section>

			<!-- 12 ─────────────────────────────────────── -->
			<section id="dice-roller">
				{@render h2('12', 'Dice Roller')}

				<p class="mb-4 text-sm leading-relaxed">
					Click the <strong class="font-semibold text-white">Dice</strong> button (cube icon) in the
					dashboard header to open the Dice Roller modal. It is available at any time — in or out of combat.
				</p>

				<h3 class="mt-5 mb-3 text-sm font-bold tracking-widest text-gray-200 uppercase">Controls</h3>
				{@render dataTable(
					['Control', 'Description'],
					[
						['Die type', 'Seven buttons: d4, d6, d8, d10, d12, d20, d100. The selected die is highlighted amber.'],
						['Quantity', 'How many dice to roll (1–99). Use the − / + buttons or type directly.'],
						['Modifier', 'A flat bonus or penalty added to the dice sum (−99 to +99). Displayed green when positive, red when negative.']
					]
				)}

				<p class="mt-4 mb-4 text-sm leading-relaxed">
					An expression preview (e.g.
					<code class="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-amber-300">2d6 + 3</code>)
					updates live above the <strong class="font-semibold text-white">Roll</strong> button so you
					can confirm your selection before rolling.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">Rolling</h3>
				<p class="mb-3 text-sm leading-relaxed">
					Click <strong class="font-semibold text-white">Roll</strong> to execute. The result panel shows:
				</p>
				<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li>
						<strong class="font-semibold text-white">Individual die tiles</strong> — one tile per die rolled.
						On a d20, a natural <strong class="font-semibold text-amber-300">20</strong> glows amber
						and a natural <strong class="font-semibold text-red-400">1</strong> glows red.
					</li>
					<li>
						<strong class="font-semibold text-white">Dice sum + modifier</strong> — shown when a modifier
						is set, breaking down the raw sum and the adjustment separately.
					</li>
					<li>
						<strong class="font-semibold text-white">Total</strong> — the final result in large amber text.
					</li>
					<li>
						<strong class="font-semibold text-white">Roll Again</strong> — re-rolls the same die type,
						quantity, and modifier immediately.
					</li>
				</ul>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">Roll History</h3>
				<p class="text-sm leading-relaxed">
					The last <strong class="font-semibold text-white">5 rolls</strong> are listed below the result
					in a compact log showing the expression (e.g.
					<code class="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-amber-300">2d6+3</code>),
					the individual die values, and the total. The most recent roll is fully opaque; older entries
					are dimmed.
				</p>
			</section>

			<!-- 13 ─────────────────────────────────────── -->
			<section id="encounter-builder">
				{@render h2('13', 'Encounter Builder')}

				<p class="mb-4 text-sm leading-relaxed">
					Click the <strong class="font-semibold text-white">Encounters</strong> button (clipboard
					icon) in the dashboard header to open the Encounter Builder. Use it to plan and save
					reusable combat encounters — add enemies, preview XP and difficulty, then load the whole
					encounter into the initiative tracker with one click.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Party Context
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Two small inputs at the top of the modal set the
					<strong class="font-semibold text-white">Party size</strong> (number of players) and
					<strong class="font-semibold text-white">Level</strong> (average party level). These affect
					the difficulty display for every encounter card and the builder preview. They are not
					persisted — adjust them each session as needed.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Saved Encounters
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					Each saved encounter card shows:
				</p>
				<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li><strong class="font-semibold text-white">Name</strong> — the encounter's title</li>
					<li>
						<strong class="font-semibold text-white">Difficulty badge</strong> — Trivial / Easy /
						Medium / Hard / Deadly, calculated from adjusted XP vs. the D&D 5e DMG thresholds for the
						current party size and level
					</li>
					<li>
						<strong class="font-semibold text-white">XP total</strong> — adjusted XP (raw XP × the
						standard enemy-count multiplier)
					</li>
					<li>
						<strong class="font-semibold text-white">Enemy summary</strong> — e.g.
						<em>2× Goblin, 1× Hobgoblin</em>
					</li>
				</ul>
				<p class="mb-4 text-sm leading-relaxed">
					Two action buttons appear on each card:
				</p>
				{@render dataTable(
					['Button', 'What it does'],
					[
						['Load to Initiative', 'Adds all enemies in the encounter to the active tracker and closes the modal'],
						['Delete', 'Permanently removes the encounter from your account']
					]
				)}

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Building a New Encounter
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					Click <strong class="font-semibold text-white">New Encounter</strong> to expand the
					builder form.
				</p>
				<ol class="mb-4 ml-4 list-decimal space-y-1.5 text-sm leading-relaxed">
					<li>
						Give the encounter a <strong class="font-semibold text-white">name</strong> (e.g.
						<em>Goblin Ambush</em>)
					</li>
					<li>
						Type in the <strong class="font-semibold text-white">enemy search box</strong> to filter
						the full library (SRD monsters + your custom monsters); click a result to select it
					</li>
					<li>Set a <strong class="font-semibold text-white">quantity</strong> in the number input beside the search box</li>
					<li>
						Click <strong class="font-semibold text-white">Add</strong> — the group appears in the
						staging list; adding the same monster again merges the quantities
					</li>
					<li>Remove any staged entry with the <strong class="font-semibold text-white">✕</strong> button on its row</li>
					<li>
						The <strong class="font-semibold text-amber-300">live preview</strong> below the list
						shows the adjusted XP total and difficulty badge as you build
					</li>
					<li>
						Click <strong class="font-semibold text-white">Save Encounter</strong> — it appears
						immediately in the saved list above
					</li>
				</ol>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Difficulty Calculation
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					Difficulty follows the D&D 5e DMG rules:
				</p>
				<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li>
						<strong class="font-semibold text-white">Raw XP</strong> — each enemy's CR XP value ×
						its quantity, summed
					</li>
					<li>
						<strong class="font-semibold text-white">Adjusted XP</strong> — raw XP × a multiplier
						based on total enemy count (×1 for 1, ×1.5 for 2, ×2 for 3–6, ×2.5 for 7–10, etc.)
					</li>
					<li>
						<strong class="font-semibold text-white">Thresholds</strong> — adjusted XP is compared
						to the party's Easy / Medium / Hard / Deadly values (per-level DMG values × number of
						players)
					</li>
				</ul>
				{@render dataTable(
					['Badge', 'Meaning'],
					[
						['Trivial', 'Below the Easy threshold'],
						['Easy', 'At or above Easy'],
						['Medium', 'At or above Medium'],
						['Hard', 'At or above Hard'],
						['Deadly', 'At or above Deadly']
					]
				)}

				<p class="mt-4 text-sm leading-relaxed text-gray-500">
					<strong class="text-gray-400">Note:</strong> Encounters are stored at the account level
					and are available in every game session — build your library once, reuse it across
					campaigns.
				</p>
			</section>

			<!-- 14 ─────────────────────────────────────── -->
			<section id="spell-reference">
				{@render h2('14', 'Spell Reference')}

				<p class="mb-4 text-sm leading-relaxed">
					Click the <strong class="font-semibold text-white">Spells</strong> button in the dashboard
					header to open the Spell Reference modal. It is available at any time — in or out of combat.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Searching and Filtering
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					The left panel contains a search bar and three filter dropdowns:
				</p>
				<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li>
						<strong class="font-semibold text-white">Search bar</strong> — filters the list by name
						in real time
					</li>
					<li>
						<strong class="font-semibold text-white">Level</strong> — All Levels, Cantrip, or 1st
						through 9th
					</li>
					<li>
						<strong class="font-semibold text-white">School</strong> — Abjuration, Conjuration,
						Divination, Enchantment, Evocation, Illusion, Necromancy, or Transmutation
					</li>
					<li>
						<strong class="font-semibold text-white">Class</strong> — Artificer, Bard, Cleric,
						Druid, Paladin, Ranger, Sorcerer, Warlock, or Wizard
					</li>
				</ul>
				<p class="mb-4 text-sm leading-relaxed">
					Each spell in the list shows its name and a level badge —
					<strong class="font-semibold text-emerald-400">C</strong> for cantrips,
					<strong class="font-semibold text-white">1–9</strong> for leveled spells. Click any spell
					to open its card in the right panel.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Spell Card
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					The right panel shows the full spell details:
				</p>
				<ul class="mb-4 ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li>
						<strong class="font-semibold text-violet-300">Name</strong>, level, school, and
						source badge
					</li>
					<li>
						<strong class="font-semibold text-amber-300">Ritual</strong> badge — shown when the
						spell can be cast as a ritual
					</li>
					<li>
						Info grid — <strong class="font-semibold text-white">Casting Time</strong>,
						<strong class="font-semibold text-white">Range</strong>,
						<strong class="font-semibold text-white">Components</strong>,
						<strong class="font-semibold text-white">Duration</strong>
					</li>
					<li>Full <strong class="font-semibold text-white">description</strong></li>
					<li>
						<strong class="font-semibold text-amber-300">At Higher Levels</strong> — shown when
						applicable
					</li>
					<li>
						<strong class="font-semibold text-white">Available to</strong> — the classes that can
						learn the spell
					</li>
				</ul>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Clickable Dice
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Dice expressions inside spell descriptions (e.g.
					<code class="rounded bg-gray-800 px-1 font-mono text-xs text-amber-300">8d6</code>) appear
					in <span class="font-semibold text-amber-300">amber</span> with a dotted underline. Click
					one to roll it — the same result popup used in stat blocks appears, showing individual die
					values and the total.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Opening a Spell from a Stat Block
				</h3>
				<p class="text-sm leading-relaxed">
					When viewing a monster's stat block, any spell name in a spell list (e.g. in a
					<em>Spellcasting</em> or <em>Innate Spellcasting</em> trait) is a clickable button. Click
					it to close the stat block and open the Spell Reference directly to that spell.
				</p>
			</section>

			<!-- 15 ───────────────────────────────────────── -->
			<section id="player-messaging">
				{@render h2('15', 'Player Messaging')}

				<p class="mb-4 text-sm leading-relaxed">
					Players on the viewer screen can send a private message directly to the DM — useful for
					asking questions, flagging something, or just communicating without leaving the display.
					Messages are visible only to the DM and are not persisted between server restarts.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Sending a Message (Player)
				</h3>
				<ol class="mb-4 ml-4 list-decimal space-y-1.5 text-sm leading-relaxed">
					<li>
						Click the <strong class="font-semibold text-white">✉ Message DM</strong> button in the
						viewer header
					</li>
					<li>
						Choose which <strong class="font-semibold text-white">party member</strong> you are
						sending as from the dropdown — the list shows all players currently in the session
					</li>
					<li>Type your message in the text field</li>
					<li>
						Click <strong class="font-semibold text-white">Send</strong> — the modal closes and
						your message is delivered instantly
					</li>
				</ol>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Receiving Messages (DM)
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					The <strong class="font-semibold text-white">Messages</strong> button in the dashboard
					header shows an <strong class="font-semibold text-amber-300">amber badge</strong> with the
					unread count whenever new messages arrive. On mobile, the same badge appears on the
					hamburger menu button so you always know there is something waiting even with the menu
					collapsed.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Reading the Inbox
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Click <strong class="font-semibold text-white">Messages</strong> to open the inbox modal.
					Messages are listed newest-first, each showing the
					<strong class="font-semibold text-amber-300">sender's name</strong>, the
					<strong class="font-semibold text-white">time received</strong>, and the full message
					text. Opening the inbox marks all current messages as read and resets the unread badge.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Clearing Messages
				</h3>
				<p class="text-sm leading-relaxed">
					Click <strong class="font-semibold text-white">Clear all</strong> in the inbox header to
					delete all messages for the current session. This action cannot be undone.
				</p>
			</section>

			<!-- 16 ─────────────────────────────────────── -->
			<section id="contact">
				{@render h2('16', 'Contact & Support')}
				<p class="text-sm leading-relaxed">
					Have a question, found a bug, or want to suggest a feature? Email us at
					<a href="mailto:dm@inittracker.com" class="text-amber-400 transition hover:text-amber-300"
						>dm@inittracker.com</a
					>
					— or click the <strong class="font-semibold text-white">✉ Contact</strong> link found on the
					login page, the join page, and in both the DM and viewer headers.
				</p>
			</section>
			{#if data.showVoiceCommands}
			<!-- 17 ─────────────────────────────────────── -->
			<section id="voice-commands">
				{@render h2('17', 'Voice Commands (Beta)')}

				<div class="mb-5 rounded-lg border border-amber-800/50 bg-amber-900/20 px-4 py-3 text-sm leading-relaxed text-amber-300">
					⚠️ <strong>Beta feature — still in testing.</strong> Voice commands use the browser's built-in
					Speech Recognition API, currently supported in <strong class="text-white">Chrome and Edge</strong>
					only. Results may vary based on microphone quality, accent, and ambient noise.
				</div>

				<p class="mb-4 text-sm leading-relaxed">
					Click the <strong class="font-semibold text-white">🎤 Voice</strong> button in the dashboard
					header to control the tracker hands-free. The button only appears when your browser supports
					speech recognition.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Activating
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Click <strong class="font-semibold text-white">Voice</strong> to start listening — the button
					turns amber with a <strong class="font-semibold text-amber-300">pulsing dot</strong>. Your
					browser will ask for microphone permission the first time. Click the button again to stop.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Commands
				</h3>
				<p class="mb-3 text-sm leading-relaxed">
					Every command begins with <strong class="font-semibold text-amber-300">"Tracker"</strong> so
					the app ignores normal table conversation. A confirmation toast appears at the bottom of the
					screen when a command is recognized.
				</p>
				{@render dataTable(
					['Say', 'Action'],
					[
						['"Tracker Next"', 'Advance to the next combatant\'s turn'],
						['"Tracker Previous"', 'Go back to the previous combatant\'s turn'],
						['"Tracker Start Combat"', 'Start combat (same as clicking Start Combat)'],
						['"Tracker End Combat"', 'End combat and save it to Chronicles']
					]
				)}

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Tips
				</h3>
				<ul class="ml-4 list-disc space-y-1.5 text-sm leading-relaxed">
					<li>Commands only fire when valid — <em>Next</em> and <em>Previous</em> do nothing if combat hasn't started</li>
					<li>If <strong class="font-semibold text-white">"Tracker End Combat"</strong> isn't recognized, try saying it slightly more slowly — speech engines sometimes hear "end" as "and"</li>
					<li>The mic listens continuously and auto-restarts after silence; no need to re-click between commands</li>
				</ul>
			</section>


			{/if}
		</main>
	</div>
</div>
