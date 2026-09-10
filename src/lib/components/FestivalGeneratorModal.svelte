<!-- Festival / Local Event Generator -->
<script lang="ts">
	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	// ── Types ─────────────────────────────────────────────────────────────────────
	interface FestivalData {
		name: string;
		occasion: string;
		duration: string;
		activities: string[];
		attraction: string;
		food: string;
		mood: string;
		hook: string;
	}

	// ── Controls ──────────────────────────────────────────────────────────────────
	let seed = $state(Math.floor(Math.random() * 1_000_000_000));
	let festival = $state<FestivalData | null>(null);

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
	function shuffle<T>(arr: T[], rng: () => number): T[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(rng() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	// ── Data ──────────────────────────────────────────────────────────────────────
	const NAMES = [
		'The Emberfall Revel',
		'Harvestide',
		'The Longnight Watch',
		"Founders' Faire",
		'The Thawmoot',
		'The Drowning Moon Festival',
		'Suncrest Jubilee',
		"The Wanderer's Fair",
		'Old Blood Night',
		'The Gilded Market Days',
		'Hearthfire Eve',
		'The Comet Court',
		'The Reaping Dance',
		"Saint Ilvana's Feast",
		'The Masked Tide'
	];

	const OCCASIONS = [
		'the annual harvest, when the granaries are blessed',
		'the founding of the town, centuries past',
		"a local saint or hero's feast day",
		'the changing of the season, marked since before written history',
		'a royal wedding or coronation, celebrated in every corner of the realm',
		'the anniversary of a great victory few now remember firsthand',
		'the first thaw after a hard winter',
		'a rare celestial event — a comet, an eclipse, twin moons aligning',
		'the successful close of the harvest fair and market season',
		'a traveling festival that only stops in this town once a decade'
	];

	const DURATIONS = [
		'a single, raucous evening',
		'three days and three nights',
		'a full week, with the town nearly shutting down for it',
		'just until dawn — the festival ends the moment the sun rises',
		'a lunar cycle, building to a climax on the full moon',
		'one day, but every year without fail'
	];

	const ACTIVITIES = [
		'a market bursting with rare goods not normally sold here',
		'bonfires lit at every crossroads',
		'a parade led by masked performers',
		'a tournament of arm-wrestling, archery, or blade-work',
		'dancing that lasts well past midnight',
		'a bardic competition judged by the crowd',
		'fireworks or arcane light-displays over the square',
		"a mock battle re-enacting the town's founding legend",
		'a lantern release sent drifting down the river',
		'a feast where strangers are seated with locals by tradition',
		'games for children with small prizes from the temple',
		'a masquerade where identities stay secret until midnight'
	];

	const ATTRACTIONS = [
		'a drinking contest whose reigning champion has not lost in a decade',
		'a horse race through the town streets, dangerous and beloved',
		'a greased-pole climb for a purse of gold',
		'an eating contest sponsored by the local guildhall',
		"a riddle contest hosted by the town's eldest resident",
		'a duel of songs between two rival bards',
		'a strongest-in-town contest judged by the blacksmith',
		'a pie-throwing tradition aimed at any volunteer brave enough'
	];

	const FOODS = [
		'spiced wine ladled from an enormous communal cauldron',
		'honeyed festival cakes sold by every baker in town',
		'a whole roasted boar, carved at midnight by the mayor',
		'free bread for anyone who asks — an old tradition none dare break',
		'a fiery local liquor brought out only once a year',
		"sweetmeats shaped like the town's founding symbol",
		'fresh-caught fish grilled streetside',
		'a stew recipe kept secret by one family for generations'
	];

	const MOODS = [
		'Joyful — the whole town turns out, worries set aside for a night',
		'Tense — old grudges tend to surface once the drink flows',
		'Reverent — even the rowdiest activities carry real religious weight',
		'Chaotic — the festival has a well-earned reputation for getting out of hand',
		"Bittersweet — the celebration always falls near a town tragedy's anniversary",
		'Commercial — merchants treat it as the most important sales day of the year'
	];

	const HOOKS = [
		'a pickpocket guild treats the crowd as their best hunting ground all year',
		'a rival town sends a delegation that is not entirely welcome',
		'the person meant to lead the ceremony has gone missing',
		'an old rivalry threatens to turn a friendly contest violent',
		"a fortune teller's prediction has half the town on edge",
		'someone important plans to make an announcement during the festivities',
		'a monster or bandit gang always seems to strike during the chaos',
		'a forgotten tradition, if skipped, is rumored to bring bad luck'
	];

	const MOOD_COLORS: Record<string, string> = {
		Joyful: 'bg-green-900/50 text-green-300',
		Tense: 'bg-yellow-900/50 text-yellow-400',
		Reverent: 'bg-blue-900/50 text-blue-300',
		Chaotic: 'bg-orange-900/50 text-orange-400',
		Bittersweet: 'bg-purple-900/50 text-purple-300',
		Commercial: 'bg-amber-900/50 text-amber-300'
	};

	// ── Generation ────────────────────────────────────────────────────────────────
	function generateFestival(): FestivalData {
		const shuffled = shuffle(ACTIVITIES, mkRng(hashSeed('activities', seed)));
		const mood = pick(MOODS, mkRng(hashSeed('mood', seed)));

		return {
			name: pick(NAMES, mkRng(hashSeed('name', seed))),
			occasion: pick(OCCASIONS, mkRng(hashSeed('occasion', seed))),
			duration: pick(DURATIONS, mkRng(hashSeed('duration', seed))),
			activities: shuffled.slice(0, 3),
			attraction: pick(ATTRACTIONS, mkRng(hashSeed('attraction', seed))),
			food: pick(FOODS, mkRng(hashSeed('food', seed))),
			mood: mood.split(' — ')[0],
			hook: pick(HOOKS, mkRng(hashSeed('hook', seed)))
		};
	}

	function moodDesc(mood: string): string {
		return MOODS.find((m) => m.startsWith(mood))?.split(' — ')[1] ?? '';
	}

	function randomize() {
		seed = Math.floor(Math.random() * 1_000_000_000);
	}

	// ── Save / Load ───────────────────────────────────────────────────────────────
	interface SavedFestival {
		id: string;
		name: string;
		seed: number;
		savedAt: number;
	}
	const FESTIVALS_KEY = 'initiative_saved_festivals';
	let savedFestivals = $state<SavedFestival[]>([]);
	if (typeof window !== 'undefined') {
		try {
			savedFestivals = JSON.parse(localStorage.getItem(FESTIVALS_KEY) ?? '[]');
		} catch {
			savedFestivals = [];
		}
	}
	function saveFestival() {
		const entry: SavedFestival = {
			id: crypto.randomUUID(),
			name: festival?.name ?? 'Unknown Festival',
			seed,
			savedAt: Date.now()
		};
		savedFestivals = [entry, ...savedFestivals].slice(0, 20);
		localStorage.setItem(FESTIVALS_KEY, JSON.stringify(savedFestivals));
	}
	function deleteSavedFestival(id: string) {
		savedFestivals = savedFestivals.filter((f) => f.id !== id);
		localStorage.setItem(FESTIVALS_KEY, JSON.stringify(savedFestivals));
	}
	function applyFestival(f: SavedFestival) {
		seed = f.seed;
	}

	$effect(() => {
		festival = generateFestival();
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
				<h2 class="text-lg font-bold tracking-wide text-amber-300">
					Festival / Local Event Generator
				</h2>
				{#if festival}
					<span class="text-xs text-gray-500">{festival.name}</span>
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
				Generate New Festival
			</button>

			{#if festival}
				<button
					onclick={saveFestival}
					class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
				>
					Save Festival
				</button>
			{/if}

			{#if savedFestivals.length}
				<div class="flex flex-col gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
						>Saved Festivals</span
					>
					<div class="flex max-h-64 flex-col gap-1 overflow-y-auto">
						{#each savedFestivals as s (s.id)}
							<div class="flex items-center gap-1 rounded bg-gray-800/80 px-2 py-1.5">
								<button
									onclick={() => applyFestival(s)}
									class="min-w-0 flex-1 truncate text-left text-xs text-gray-200 hover:text-amber-400"
									title={s.name}>{s.name}</button
								>
								<button
									onclick={() => deleteSavedFestival(s.id)}
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
			{#if festival}
				<!-- Banner -->
				<div class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-5">
					<div class="flex flex-wrap items-start gap-4">
						<div
							class="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-amber-950/40 text-3xl shadow-inner"
						>
							🎉
						</div>
						<div class="flex min-w-0 flex-col gap-1">
							<h2 class="text-2xl font-bold tracking-wide text-white">{festival.name}</h2>
							<div class="flex flex-wrap items-center gap-2">
								<span
									class="rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {MOOD_COLORS[
										festival.mood
									] ?? 'bg-gray-700 text-gray-400'}">{festival.mood}</span
								>
								<span class="text-xs text-gray-500">· Lasts {festival.duration}</span>
							</div>
							<p class="mt-1 text-sm text-gray-300">
								Celebrates {festival.occasion}.
							</p>
						</div>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4 lg:col-span-2">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-amber-500 uppercase">
							What's Happening
						</h3>
						<div class="flex flex-col gap-2">
							{#each festival.activities as activity}
								<div class="flex items-start gap-2 text-sm text-gray-300">
									<i
										class="fa-duotone fa-light fa-star mt-0.5 text-xs text-amber-500"
										aria-hidden="true"
									></i>
									<span class="capitalize">{activity}.</span>
								</div>
							{/each}
						</div>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Signature Attraction
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{festival.attraction}.</p>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Food &amp; Drink
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{festival.food}.</p>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4 lg:col-span-2">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Atmosphere
						</h3>
						<p class="text-sm leading-relaxed text-gray-300">{moodDesc(festival.mood)}.</p>
					</div>

					<div class="rounded-xl border border-purple-900/30 bg-purple-950/10 p-4 lg:col-span-2">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-purple-400 uppercase">
							Complication / Hook
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{festival.hook}.</p>
					</div>
				</div>

				<div class="mt-6 flex gap-3 sm:hidden">
					<button
						onclick={randomize}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						New Festival
					</button>
					<button
						onclick={saveFestival}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						Save
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
