<!-- Player / Viewer guide (/player-guide). Covers the viewer menu features. -->
<script lang="ts">
	import { page } from '$app/stores';
	let backUrl = $derived($page.url.searchParams.get('back') ?? '/join');

	const toc = [
		{ id: 'sound', label: '1. Sound On / Off' },
		{ id: 'react', label: '2. React to DM' },
		{ id: 'dice', label: '3. Dice Roller' },
		{ id: 'message-dm', label: '4. Message DM' },
		{ id: 'initiative', label: '5. Roll Initiative' },
		{ id: 'notes', label: '6. My Notes' },
		{ id: 'dm-messages', label: '7. DM Messages' }
	];
</script>

<svelte:head>
	<title>Player Guide — Initiative Tracker</title>
</svelte:head>

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

<div class="min-h-screen bg-gray-950 text-gray-300">
	<div aria-hidden="true" class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
		<div class="bg-orb orb-1"></div>
		<div class="bg-orb orb-2"></div>
		<div class="bg-orb orb-3"></div>
		<div class="bg-orb orb-4"></div>
	</div>

	<!-- Header -->
	<header
		class="sticky top-0 z-20 flex items-center gap-4 border-b border-gray-800 bg-gray-900/95 px-6 py-3 backdrop-blur"
	>
		<div class="flex items-center gap-2">
			<i class="fa-duotone fa-light fa-swords text-lg" aria-hidden="true"></i>
			<h1 class="text-sm font-black tracking-[0.25em] text-amber-400 uppercase">Player Guide</h1>
		</div>
		<a
			href={backUrl}
			aria-label="Back"
			class="ml-auto rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition hover:border-gray-500 hover:text-white"
		>
			<i class="fa-duotone fa-light fa-xmark text-lg" aria-hidden="true"></i>
		</a>
	</header>

	<div class="mx-auto flex max-w-5xl gap-8 px-6 py-10">
		<!-- Sticky TOC sidebar (desktop only) -->
		<aside class="hidden w-52 shrink-0 lg:block">
			<nav class="sticky top-20 space-y-0.5 text-xs">
				<p class="mb-3 font-black tracking-widest text-gray-600 uppercase">Contents</p>
				{#each toc as item}
					<a
						href="#{item.id}"
						class="block truncate rounded px-2 py-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-amber-300"
						>{item.label}</a
					>
				{/each}
			</nav>
		</aside>

		<!-- Main content -->
		<main class="min-w-0 flex-1 space-y-16">
			<!-- 1 ── Sound ─────────────────────────────── -->
			<section id="sound">
				{@render h2('1', 'Sound On / Off')}

				<p class="mb-4 text-sm leading-relaxed">
					The viewer plays subtle audio cues when combat advances — a tone when a new turn begins
					and an alert when it becomes <strong class="text-white">your character's turn</strong>.
					Sound requires you to tap <strong class="text-white">Join Session</strong> on first load (a
					browser requirement for audio autoplay).
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Toggling Sound
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Open the <strong class="text-amber-300"
						><i class="fa-duotone fa-light fa-bars" aria-hidden="true"></i> menu</strong
					>
					in the top-right corner and tap
					<strong class="text-white">Sound On</strong> or
					<strong class="text-white">Sound Off</strong>. The button shows your current state and
					changes color — <span class="font-semibold text-amber-400">amber</span>
					when sound is on, gray when muted.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Turn Notifications
				</h3>
				<p class="text-sm leading-relaxed">
					When it becomes your turn a large <span class="font-semibold text-amber-300"
						>IT'S YOUR TURN!</span
					>
					banner slides down from the top. When you are one step away, a
					<span class="font-semibold text-blue-300">YOU'RE UP NEXT!</span> banner appears instead. Tap
					either banner to dismiss it early. On mobile, your device will vibrate briefly when your turn
					arrives (if supported).
				</p>
			</section>

			<!-- 2 ── React to DM ──────────────────────── -->
			<section id="react">
				{@render h2('2', 'React to DM')}

				<p class="mb-4 text-sm leading-relaxed">
					Send a quick emoji reaction to the Dungeon Master's screen. The emoji floats up the DM's
					display in large, animated form — great for celebrating a crit, mourning a nat-1, or
					letting the DM know you're loving the session.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Sending a Reaction
				</h3>
				<ol class="mb-4 ml-4 list-decimal space-y-1.5 text-sm leading-relaxed">
					<li>
						Open the <strong class="text-amber-300"
							><i class="fa-duotone fa-light fa-bars" aria-hidden="true"></i> menu</strong
						>
					</li>
					<li>Tap <strong class="text-white">React to DM</strong></li>
					<li>Tap any emoji from the picker — it sends immediately</li>
					<li>
						A brief <strong class="text-white">Sent!</strong> confirmation appears, then the picker closes
					</li>
				</ol>
				<p class="text-sm leading-relaxed">
					The picker includes 30 curated emojis across reactions, D&D / combat themes, and general
					expressions. You can send one at a time — tap again to send another.
				</p>
			</section>

			<!-- 3 ── Dice Roller ──────────────────────── -->
			<section id="dice">
				{@render h2('3', 'Dice Roller')}

				<p class="mb-4 text-sm leading-relaxed">
					Roll any standard polyhedral die directly in your browser — no physical dice required.
					Results are shown instantly with a 3D animation (optional).
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Opening the Roller
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Open the <strong class="text-amber-300"
						><i class="fa-duotone fa-light fa-bars" aria-hidden="true"></i> menu</strong
					>
					and tap
					<strong class="text-white">Dice Roller</strong>.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Rolling Dice
				</h3>
				<ol class="mb-4 ml-4 list-decimal space-y-1.5 text-sm leading-relaxed">
					<li>
						Select your <strong class="text-white">die type</strong> — d4, d6, d8, d10, d12, d20, or d100
						(percentile)
					</li>
					<li>Adjust the <strong class="text-white">quantity</strong> (how many dice, 1–99)</li>
					<li>
						Set a <strong class="text-white">modifier</strong> (−99 to +99, for ability scores and bonuses)
					</li>
					<li>Tap <strong class="text-white">Roll</strong></li>
				</ol>
				<p class="mb-4 text-sm leading-relaxed">
					Individual die results are shown in boxes. A <span class="font-semibold text-amber-300"
						>nat-20</span
					>
					highlights in gold and a <span class="font-semibold text-red-400">nat-1</span> in red (d20
					only). The <strong class="text-white">Total</strong> accounts for your modifier. Tap
					<strong class="text-white">Roll Again</strong> to instantly re-roll the same expression.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Roll History
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Your last 5 rolls are listed below the result, showing the expression (e.g.
					<code class="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-amber-300"
						>2d6+3</code
					>), individual values, and the total.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Disabling Virtual Dice
				</h3>
				<p class="text-sm leading-relaxed">
					Prefer to use physical dice and just track results? Check <strong class="text-white"
						>Disable virtual dice</strong
					>
					at the bottom of the roller. With this on, results are calculated instantly (no animation) and
					you can use the roller as a pure math tracker. This setting is saved in your browser.
				</p>
			</section>

			<!-- 4 ── Message DM ───────────────────────── -->
			<section id="message-dm">
				{@render h2('4', 'Message DM')}

				<p class="mb-4 text-sm leading-relaxed">
					Send a private text message directly to the Dungeon Master. This is perfect for side
					conversations, asking questions out-of-character, or whispering plans without the rest of
					the table seeing.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Sending a Message
				</h3>
				<ol class="mb-4 ml-4 list-decimal space-y-1.5 text-sm leading-relaxed">
					<li>
						Open the <strong class="text-amber-300"
							><i class="fa-duotone fa-light fa-bars" aria-hidden="true"></i> menu</strong
						>
					</li>
					<li>Tap <strong class="text-white">Message DM</strong> — a compose form appears</li>
					<li>Type your message and tap <strong class="text-white">Send</strong></li>
				</ol>
				<p class="mb-4 text-sm leading-relaxed">
					Messages appear in the DM's <strong class="text-white">Player Messages</strong> inbox on the
					dashboard. The DM sees your name alongside the message and can reply directly back to you or
					compose a new message targeting any player.
				</p>
				<p class="text-sm leading-relaxed">
					<strong class="text-white">Note:</strong> Only players who clicked
					<strong class="text-white">Join Session</strong> can send messages (guests who skipped the join
					step cannot, as they have no identity in the session).
				</p>
			</section>

			<!-- 5 ── Roll Initiative ──────────────────── -->
			<section id="initiative">
				{@render h2('5', 'Roll Initiative')}

				<p class="mb-4 text-sm leading-relaxed">
					Submit your initiative roll to the DM so they can place you in the combat order without
					having to shout numbers across the table. This is most useful when the DM starts a new
					combat encounter and asks everyone to roll.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Submitting Your Roll
				</h3>
				<ol class="mb-4 ml-4 list-decimal space-y-1.5 text-sm leading-relaxed">
					<li>
						Open the <strong class="text-amber-300"
							><i class="fa-duotone fa-light fa-bars" aria-hidden="true"></i> menu</strong
						>
					</li>
					<li>Tap <strong class="text-white">Roll Initiative</strong></li>
					<li>Enter the number you rolled (including your DEX modifier)</li>
					<li>Tap <strong class="text-white">Submit</strong></li>
				</ol>
				<p class="text-sm leading-relaxed">
					The DM receives your result in their dashboard and can use it to set your position in the
					turn order. The roller also has a built-in d20 so you can roll right in the app if you
					don't have physical dice handy.
				</p>
			</section>

			<!-- 6 ── My Notes ────────────────────────── -->
			<section id="notes">
				{@render h2('6', 'My Notes')}

				<p class="mb-4 text-sm leading-relaxed">
					Keep a personal session journal that stays with your player account across multiple
					sessions. Notes are private — only you can see them. The DM does not have access.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Opening Notes
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Open the <strong class="text-amber-300"
						><i class="fa-duotone fa-light fa-bars" aria-hidden="true"></i> menu</strong
					>
					and tap
					<strong class="text-white">My Notes</strong>. This option is only visible when you are
					logged in as a player (not a guest).
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Writing Notes
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Notes are organized by <strong class="text-white">date</strong>. Each day gets its own
					entry that you can freely edit. Changes are saved automatically after a short pause — no
					save button needed.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Searching Notes
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					Use the search bar at the top of the notes panel to filter entries by keyword. Matching
					entries are highlighted in the list.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Exporting to PDF
				</h3>
				<p class="text-sm leading-relaxed">
					Each note has a <strong class="text-white">download</strong> icon to export that single
					entry as a PDF. There is also an <strong class="text-white">Export All</strong> button to download
					every note as a single combined PDF — useful for printing a campaign journal at the end of a
					long campaign.
				</p>
			</section>

			<!-- 7 ── DM Messages ─────────────────────── -->
			<section id="dm-messages">
				{@render h2('7', 'DM Messages')}

				<p class="mb-4 text-sm leading-relaxed">
					The DM can send private messages to you (or to all players at once) directly from the
					dashboard. When a message arrives, a <span class="font-semibold text-purple-400"
						>purple toast notification</span
					>
					slides up from the bottom of your screen and your device will vibrate briefly.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Unread Badge
				</h3>
				<p class="mb-4 text-sm leading-relaxed">
					When you have unread messages from the DM, a small
					<span class="font-semibold text-purple-400">purple dot</span> appears on the
					<strong class="text-amber-300"
						><i class="fa-duotone fa-light fa-bars" aria-hidden="true"></i> menu</strong
					>
					button and the
					<strong class="text-white">DM Messages</strong> item inside the menu shows a count badge.
				</p>

				<h3 class="mt-5 mb-2 text-sm font-bold tracking-widest text-gray-200 uppercase">
					Reading Messages
				</h3>
				<ol class="mb-4 ml-4 list-decimal space-y-1.5 text-sm leading-relaxed">
					<li>
						Open the <strong class="text-amber-300"
							><i class="fa-duotone fa-light fa-bars" aria-hidden="true"></i> menu</strong
						>
					</li>
					<li>
						Tap <strong class="text-white">DM Messages</strong> — the unread count resets to zero
					</li>
					<li>Messages appear newest-first, showing the sender, recipient, date, time, and text</li>
				</ol>
				<p class="text-sm leading-relaxed">
					Tap <strong class="text-white">Clear all</strong> in the message inbox to wipe all stored messages
					from your screen. This only clears them from your local view — the DM's sent history is unaffected.
				</p>
			</section>
		</main>
	</div>
</div>

<style>
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
</style>
