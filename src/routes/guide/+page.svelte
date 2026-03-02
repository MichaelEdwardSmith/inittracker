<script lang="ts">
	const toc = [
		{ id: 'getting-started-dm', label: '1. Getting Started (DM)' },
		{ id: 'getting-started-players', label: '2. Getting Started (Players)' },
		{ id: 'dm-dashboard', label: '3. The DM Dashboard' },
		{ id: 'managing-players', label: '4. Managing Your Party' },
		{ id: 'managing-enemies', label: '5. Managing Enemies' },
		{ id: 'running-combat', label: '6. Running Combat' },
		{ id: 'hit-points', label: '7. Hit Points & Armor Class' },
		{ id: 'conditions', label: '8. Conditions & Statuses' },
		{ id: 'player-display', label: '9. The Player Display' },
		{ id: 'game-sessions', label: '10. Game Sessions' },
		{ id: 'chronicles', label: '11. Combat Chronicles' },
		{ id: 'contact', label: '12. Contact & Support' }
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
						class="block truncate rounded px-2 py-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-amber-300"
					>
						{item.label}
					</a>
				{/each}
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
						['Reset Players', 'Restores all players to max HP, removes temp HP and all conditions'],
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
					HP they automatically become Unconscious (all other conditions cleared). Enemies at 0 HP
					are simply removed from the turn order.
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
			<section id="contact">
				{@render h2('12', 'Contact & Support')}
				<p class="text-sm leading-relaxed">
					Have a question, found a bug, or want to suggest a feature? Email us at
					<a href="mailto:dm@inittracker.com" class="text-amber-400 transition hover:text-amber-300"
						>dm@inittracker.com</a
					>
					— or click the <strong class="font-semibold text-white">✉ Contact</strong> link found on the
					login page, the join page, and in both the DM and viewer headers.
				</p>
			</section>
		</main>
	</div>
</div>
