<!-- Villain / Antagonist Generator -->
<script lang="ts">
	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	// ── Types ─────────────────────────────────────────────────────────────────────
	interface VillainData {
		name: string;
		epithet: string | null;
		archetype: string;
		race: string;
		threatTier: string;
		goal: string;
		method: string;
		forces: string;
		tactic: string;
		weakness: string;
		complication: string;
		lair: string;
		quote: string;
	}

	// ── Controls ──────────────────────────────────────────────────────────────────
	let seed = $state(Math.floor(Math.random() * 1_000_000_000));
	let villain = $state<VillainData | null>(null);

	// ── RNG ───────────────────────────────────────────────────────────────────────
	function mkRng(s: number) {
		let st = s >>> 0 || 1;
		return () => {
			st ^= st << 13;
			st ^= st >> 17;
			st ^= st << 5;
			return (st >>> 0) / 0x100000000;
		};
	}
	function hashSeed(str: string, s: number): number {
		let h = s >>> 0 || 0x811c9dc5;
		for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 0x01000193);
		return h >>> 0;
	}
	function pick<T>(arr: T[], rng: () => number): T {
		return arr[Math.floor(rng() * arr.length)];
	}

	// ── Data ──────────────────────────────────────────────────────────────────────
	const FIRST_NAMES = [
		'Malakar',
		'Vexis',
		'Thraxis',
		'Isolde',
		'Corvina',
		'Drevan',
		'Ashka',
		'Voss',
		'Nyxandra',
		'Kael',
		'Morwen',
		'Zarek',
		'Lucienne',
		'Ravasz',
		'Thessaly',
		'Grimwald',
		'Ophidia',
		'Vorenna',
		'Cassivar',
		'Sable'
	];

	const SURNAMES = [
		'Drakemoor',
		'Ashvale',
		'Nightshade',
		'Cinderfall',
		'Blackthorn',
		'Ravenscar',
		'Duskmere',
		'Grimhollow',
		'Wraithbane',
		'Ironheart',
		'Bloodmere',
		'Shadowmere',
		'Vaeloria',
		'Thornwood'
	];

	const EPITHETS = [
		'the Unmaker',
		'the Hollow King',
		'of a Thousand Cuts',
		'the Ashbringer',
		'the Whisper in the Dark',
		'the Last Tyrant',
		'Bloodcrown',
		'the Pale Flame',
		'the Grave-Warden',
		'Soul-Render',
		'the Iron Widow',
		'the Undying',
		'the Heretic Queen',
		'the Devourer',
		'the Puppet Master'
	];

	const ARCHETYPES: [string, string][] = [
		['Fallen Paladin', '🗡️'],
		['Archmage', '🔮'],
		['Cult Leader', '🕯️'],
		['Crime Lord', '🗝️'],
		['Usurper Noble', '👑'],
		['Undead Tyrant', '💀'],
		['Beast Tamer', '🐺'],
		['War General', '⚔️'],
		['Fey Trickster', '🍄'],
		['Mad Alchemist', '⚗️'],
		['Dragon-Blooded Despot', '🐉'],
		['Demon-Bound Sorcerer', '👹'],
		['Pirate Overlord', '☠️'],
		['Corrupted Cleric', '✝️'],
		['Vengeful Spirit', '👻']
	];

	const RACES = [
		'Human',
		'Elf',
		'Half-Elf',
		'Half-Orc',
		'Tiefling',
		'Dragonborn',
		'Dwarf',
		'Gnome',
		'Genasi',
		'Undead (formerly Human)',
		'Yuan-ti',
		'Hag',
		'Fiend-Touched Human',
		'Shadar-kai'
	];

	const THREAT_TIERS = ['Minor Threat', 'Regional Threat', 'Major Threat', 'Legendary Threat'];

	const GOALS = [
		'seize the throne of a neighboring kingdom',
		'resurrect an ancient god long thought destroyed',
		'unleash a plague to "cleanse" the weak',
		'tear open a permanent gate to a hostile plane',
		'claim an artifact said to grant immortality',
		'avenge a betrayal from decades past',
		'enslave a population to fuel a great ritual',
		'rewrite history so their crimes never happened',
		'breed an army of monstrous hybrids',
		'collapse the region into a chaos only they can control',
		'ascend to godhood through forbidden rites',
		'recover a stolen birthright and destroy those who took it'
	];

	const METHODS = [
		'through patient political manipulation and blackmail',
		'via open, overwhelming military force',
		'by seeding chaos and letting others do the dirty work',
		'through a web of cults and secret societies',
		'using forbidden magic no one else dares touch',
		"by turning the party's own allies against them",
		'through economic strangulation and engineered famine',
		'via the quiet assassination of key figures, one by one',
		'by corrupting institutions patiently, from within',
		'through a slow, decades-long game almost no one notices'
	];

	const FORCES = [
		'a disciplined mercenary company bound by a blood oath',
		'a cult of fanatical, expendable zealots',
		'a horde of bound or charmed monstrosities',
		'a small circle of terrifyingly competent lieutenants',
		'an army of the reanimated dead',
		'spies and informants seeded in every court and tavern',
		'constructs and automatons built to exacting specifications',
		"shapeshifters who've quietly replaced key officials",
		'a warband of exiled and outcast warriors with nothing left to lose',
		'a loyal inner circle who each believe they alone have their trust'
	];

	const TACTICS = [
		'prefers to let lieutenants fight while observing from a distance',
		'strikes first with overwhelming force, then negotiates from strength',
		'uses hostages and collateral to control the battlefield',
		'relies on illusion and misdirection, rarely fighting fair',
		'baits enemies into traps built over months of preparation',
		'turns captured foes into unwilling weapons or hostages',
		'retreats the instant a fight turns unfavorable, always returning stronger',
		'fights with terrifying personal skill, testing worthy opponents',
		'never appears in person until the final confrontation'
	];

	const WEAKNESSES = [
		'an unshakeable code of honor that can be exploited',
		'a specific magic item they are dangerously overconfident without',
		'genuine love for one person, kept carefully secret',
		'a curse that worsens the longer their plan drags on',
		'pride that makes them monologue instead of finishing the job',
		'a debt to an even more dangerous patron',
		'an old friend or rival who knows their true weakness',
		'a fear they hide well, of fire, of the sea, or of a specific bloodline'
	];

	const COMPLICATIONS = [
		'is being secretly controlled or blackmailed by a more powerful entity',
		'believes, with real justification, that they are the hero of this story',
		'has a sympathetic backstory that complicates any kill-on-sight plan',
		'is dying, and this plan is a desperate final act',
		'has a child or protégé who does not know the full truth',
		'is being impersonated — the real one is elsewhere entirely',
		'wants, on some level, to be stopped, and is quietly testing the party',
		'has already achieved a smaller version of their goal and is hiding it'
	];

	const LAIRS = [
		'a fortress carved into a mountain, riddled with traps',
		'an abandoned temple reclaimed and warped to their purpose',
		'a floating citadel bound aloft by ancient magic',
		'a labyrinth of tunnels beneath a major city',
		'a warship that never makes port twice',
		'a manor house with a mundane facade and a horrifying basement',
		'a demiplane accessible only through a specific ritual',
		'the ruins of their own former kingdom'
	];

	const QUOTES = [
		'"You call it tyranny. I call it mercy — the mercy of an ending."',
		'"Every kingdom needs a monster. I simply chose to be useful."',
		'"You still think this is about power. How disappointing."',
		'"I have buried better heroes than you, and slept soundly after."',
		'"The gods left this place. I am simply the one who stayed."',
		'"You fight for a world that never once fought for you."',
		'"This ends the way it always does — with me, and ash."',
		'"I offered them order. They chose to bleed for chaos instead."'
	];

	const THREAT_COLORS: Record<string, string> = {
		'Minor Threat': 'bg-gray-700/60 text-gray-300',
		'Regional Threat': 'bg-yellow-900/50 text-yellow-400',
		'Major Threat': 'bg-orange-900/50 text-orange-400',
		'Legendary Threat': 'bg-red-900/60 text-red-400'
	};

	// ── Generation ────────────────────────────────────────────────────────────────
	function generateVillain(): VillainData {
		const rng = mkRng(seed);

		const first = pick(FIRST_NAMES, mkRng(hashSeed('first', seed)));
		const surname = pick(SURNAMES, mkRng(hashSeed('surname', seed)));
		const epithet = rng() < 0.6 ? pick(EPITHETS, mkRng(hashSeed('epithet', seed))) : null;
		const archetype = pick(ARCHETYPES, mkRng(hashSeed('archetype', seed)));

		return {
			name: `${first} ${surname}`,
			epithet,
			archetype: archetype[0],
			race: pick(RACES, mkRng(hashSeed('race', seed))),
			threatTier: pick(THREAT_TIERS, mkRng(hashSeed('threat', seed))),
			goal: pick(GOALS, mkRng(hashSeed('goal', seed))),
			method: pick(METHODS, mkRng(hashSeed('method', seed))),
			forces: pick(FORCES, mkRng(hashSeed('forces', seed))),
			tactic: pick(TACTICS, mkRng(hashSeed('tactic', seed))),
			weakness: pick(WEAKNESSES, mkRng(hashSeed('weakness', seed))),
			complication: pick(COMPLICATIONS, mkRng(hashSeed('complication', seed))),
			lair: pick(LAIRS, mkRng(hashSeed('lair', seed))),
			quote: pick(QUOTES, mkRng(hashSeed('quote', seed)))
		};
	}

	function archetypeIcon(name: string): string {
		return ARCHETYPES.find((a) => a[0] === name)?.[1] ?? '🗡️';
	}

	function randomize() {
		seed = Math.floor(Math.random() * 1_000_000_000);
	}

	// ── Save / Load ───────────────────────────────────────────────────────────────
	interface SavedVillain {
		id: string;
		name: string;
		seed: number;
		savedAt: number;
	}
	const VILLAINS_KEY = 'initiative_saved_villains';
	let savedVillains = $state<SavedVillain[]>([]);
	if (typeof window !== 'undefined') {
		try {
			savedVillains = JSON.parse(localStorage.getItem(VILLAINS_KEY) ?? '[]');
		} catch {
			savedVillains = [];
		}
	}
	function saveVillain() {
		const entry: SavedVillain = {
			id: crypto.randomUUID(),
			name: villain?.name ?? 'Unknown Villain',
			seed,
			savedAt: Date.now()
		};
		savedVillains = [entry, ...savedVillains].slice(0, 20);
		localStorage.setItem(VILLAINS_KEY, JSON.stringify(savedVillains));
	}
	function deleteSavedVillain(id: string) {
		savedVillains = savedVillains.filter((v) => v.id !== id);
		localStorage.setItem(VILLAINS_KEY, JSON.stringify(savedVillains));
	}
	function applyVillain(v: SavedVillain) {
		seed = v.seed;
	}

	$effect(() => {
		villain = generateVillain();
	});
</script>

<div
	class={embedded
		? 'flex h-full flex-col bg-gray-950'
		: 'fixed inset-0 z-50 flex flex-col bg-gray-950'}
	role="dialog"
	aria-modal="true"
	onkeydown={(e) => e.key === 'Escape' && onclose()}
>
	{#if !embedded}
		<div
			class="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900/80 px-5 py-3"
		>
			<div class="flex items-center gap-3">
				<h2 class="text-lg font-bold tracking-wide text-amber-300">Villain Generator</h2>
				{#if villain}
					<span class="text-xs text-gray-500">{villain.name}</span>
				{/if}
			</div>
			<button
				onclick={onclose}
				class="rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition hover:border-red-700 hover:text-red-400"
				aria-label="Close"
			>
				<i class="fa-duotone fa-light fa-xmark text-base" aria-hidden="true"></i>
			</button>
		</div>
	{/if}

	<div class="relative flex min-h-0 flex-1 overflow-hidden">
		<!-- Left panel: controls -->
		<div
			class="hidden w-56 shrink-0 flex-col gap-5 overflow-y-auto border-r border-gray-800 bg-gray-900/60 p-4 sm:flex"
		>
			<button
				onclick={randomize}
				class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
			>
				Generate New Villain
			</button>

			{#if villain}
				<button
					onclick={saveVillain}
					class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
				>
					Save Villain
				</button>
			{/if}

			{#if savedVillains.length}
				<div class="flex flex-col gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
						>Saved Villains</span
					>
					<div class="flex max-h-64 flex-col gap-1 overflow-y-auto">
						{#each savedVillains as s (s.id)}
							<div class="flex items-center gap-1 rounded bg-gray-800/80 px-2 py-1.5">
								<button
									onclick={() => applyVillain(s)}
									class="min-w-0 flex-1 truncate text-left text-xs text-gray-200 hover:text-amber-400"
									title={s.name}>{s.name}</button
								>
								<button
									onclick={() => deleteSavedVillain(s.id)}
									class="shrink-0 text-[11px] leading-none text-gray-600 hover:text-red-400"
									aria-label="Delete"
									><i class="fa-duotone fa-light fa-xmark" aria-hidden="true"></i></button
								>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Right panel: results -->
		<div class="min-w-0 flex-1 overflow-y-auto p-5">
			{#if villain}
				<!-- Banner -->
				<div class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-5">
					<div class="flex flex-wrap items-start gap-4">
						<div
							class="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-red-950/40 text-3xl shadow-inner"
						>
							{archetypeIcon(villain.archetype)}
						</div>
						<div class="flex min-w-0 flex-col gap-1">
							<div class="flex flex-wrap items-baseline gap-2">
								<h2 class="text-2xl font-bold tracking-wide text-white">{villain.name}</h2>
								{#if villain.epithet}
									<span class="text-sm text-gray-400 italic">"{villain.epithet}"</span>
								{/if}
							</div>
							<div class="flex flex-wrap items-center gap-2">
								<span class="text-xs font-semibold tracking-widest text-amber-500 uppercase"
									>{villain.archetype}</span
								>
								<span class="text-xs text-gray-500">· {villain.race}</span>
								<span
									class="rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {THREAT_COLORS[
										villain.threatTier
									] ?? 'bg-gray-700 text-gray-400'}">{villain.threatTier}</span
								>
							</div>
						</div>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-amber-500 uppercase">Goal</h3>
						<p class="text-sm leading-relaxed text-gray-300">
							Their ultimate goal is to {villain.goal}.
						</p>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-amber-500 uppercase">Method</h3>
						<p class="text-sm leading-relaxed text-gray-300">
							They pursue it {villain.method}.
						</p>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">Forces</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{villain.forces}.</p>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Signature Tactic
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{villain.tactic}.</p>
					</div>

					<div class="rounded-xl border border-green-900/30 bg-green-950/10 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-green-500 uppercase">
							Exploitable Weakness
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{villain.weakness}.</p>
					</div>

					<div class="rounded-xl border border-purple-900/30 bg-purple-950/10 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-purple-400 uppercase">
							Complication
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{villain.complication}.</p>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4 lg:col-span-2">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">Lair</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{villain.lair}.</p>
					</div>

					<div class="rounded-xl border border-red-900/30 bg-red-950/10 p-4 lg:col-span-2">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-red-500 uppercase">
							Signature Line
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 italic">{villain.quote}</p>
					</div>
				</div>

				<div class="mt-6 flex gap-3 sm:hidden">
					<button
						onclick={randomize}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						New Villain
					</button>
					<button
						onclick={saveVillain}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						Save
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
