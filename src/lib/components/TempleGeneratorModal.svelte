<!-- Temple / Shrine Generator -->
<script lang="ts">
	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	// ── Types ─────────────────────────────────────────────────────────────────────
	interface Deity {
		name: string;
		title: string;
		domains: string;
	}

	interface TempleData {
		name: string;
		scale: string;
		scaleDesc: string;
		deity: Deity;
		architecture: string;
		clergy: string;
		orderSize: string;
		community: string;
		relic: string;
		service: string;
		secret: string;
	}

	// ── Controls ──────────────────────────────────────────────────────────────────
	let seed = $state(Math.floor(Math.random() * 1_000_000_000));
	let temple = $state<TempleData | null>(null);

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
	const SCALES: [string, string, string, string][] = [
		['Wayside Shrine', 'a single attendant, open to all travelers', 'Shrine', '🕯️'],
		['Village Chapel', 'modest, serves a small community', 'Chapel', '⛪'],
		['Town Temple', 'an established congregation with several clergy', 'Temple', '🏛️'],
		['City Temple', 'grand, and politically influential', 'Temple', '🏛️'],
		['Grand Cathedral', 'a center of the faith, drawing pilgrims from afar', 'Cathedral', '⛩️'],
		['Hidden Sanctuary', 'deliberately unmarked and difficult to find', 'Sanctuary', '🗝️']
	];

	const DEITIES: Deity[] = [
		{ name: 'Aurelia', title: 'Goddess of the Dawn', domains: 'Light, Renewal' },
		{ name: 'Thal Voren', title: 'God of the Forge', domains: 'Craft, Fire' },
		{ name: 'Nyxara', title: 'Goddess of Shadows', domains: 'Night, Secrets' },
		{ name: 'Korrath', title: 'God of War', domains: 'Battle, Honor' },
		{ name: 'Vellithra', title: 'Goddess of the Sea', domains: 'Storms, Tides' },
		{ name: 'Ossandril', title: 'God of Death', domains: 'Endings, Judgment' },
		{ name: 'Faelurin', title: 'Goddess of Nature', domains: 'Growth, the Wild' },
		{ name: 'Doraven', title: 'God of Trade', domains: 'Fortune, Travel' },
		{ name: 'Ithessa', title: 'Goddess of Knowledge', domains: 'Wisdom, Secrets' },
		{ name: 'The Marrow King', title: 'God of the Dead', domains: 'Undeath, Ancestors' },
		{ name: 'The Nameless Flame', title: 'Deity of Destruction', domains: 'Chaos, Fire' },
		{ name: 'Sevrina', title: 'Goddess of Love', domains: 'Beauty, Devotion' }
	];

	const ARCHITECTURE = [
		'weathered gray stone with narrow, slitted windows',
		'soaring white marble columns beneath a gilded dome',
		'timber and thatch, visibly older than the town around it',
		'carved directly into the face of a cliff',
		'a converted merchant hall with a hastily raised altar',
		'black basalt, unsettling even to the devout',
		'an open-air garden sanctuary with no roof but the sky',
		'a spiraling tower of colored glass that scatters light across the floor'
	];

	const CLERGY_TITLES = [
		'High Priest',
		'High Priestess',
		'Abbot',
		'Abbess',
		'Keeper of the Flame',
		'Voice of the Faith',
		'Shrine-Warden',
		'Hierophant',
		'Curate',
		'Prior'
	];

	const CLERGY_NAMES = [
		'Aldric',
		'Seraphine',
		'Benedikt',
		'Mireille',
		'Thaddeus',
		'Oriane',
		'Cassian',
		'Wilhelmina',
		'Dorian',
		'Ysabel',
		'Anselm',
		'Petra'
	];

	const ORDER_SIZES = [
		'a lone caretaker who has served for decades',
		'a small order of five devoted clergy',
		'a bustling staff of two dozen priests and acolytes',
		'a monastic order of a hundred, largely self-sufficient',
		'just the priest and a handful of volunteer townsfolk'
	];

	const COMMUNITY = [
		'beloved — the temple feeds the poor every tenday',
		'viewed with quiet suspicion after a recent scandal',
		'the true center of civic life; even the mayor answers to the clergy',
		'struggling for relevance as the town turns to newer faiths',
		'the only authority trusted during the recent troubles',
		'resented by some for tithes many consider excessive',
		'a refuge that never turns anyone away, no questions asked'
	];

	const RELICS = [
		"a reliquary said to hold a bone of the faith's first saint",
		'a perpetually burning flame that has never once been rekindled',
		'a statue that weeps on the anniversary of a great tragedy',
		'stained glass depicting a prophecy no one has fully deciphered',
		'a bell audible for miles, said to ward off the restless dead',
		'an altar stone that hums faintly to those of true faith',
		'a garden where nothing has ever been known to wilt or die',
		'a crypt beneath the sanctuary, sealed for a reason no one now recalls'
	];

	const SERVICES = [
		'healing and the removal of curses, for a modest donation',
		'sanctuary and asylum, honored even by the local watch',
		'burial rites and care for the recently deceased',
		'divination and guidance, by appointment only',
		'blessings for travelers before a long journey',
		'education — the temple runs the only school in town',
		'counsel for the troubled, freely given to any who ask',
		'a small orphanage attached to the grounds'
	];

	const SECRETS = [
		'the current head of the clergy is a fraud, chosen without a true calling',
		'a schism is quietly brewing between two factions of the faithful',
		'the relic at the heart of the temple is a forgery — the original vanished years ago',
		'the temple sits atop something far older than the faith it now houses',
		'clergy have been performing rites the wider church would forbid outright',
		'a member of the clergy is secretly in league with a rival faith',
		'the temple is deeply in debt to a moneylender who is losing patience',
		'donations have been vanishing, and no one within will say where'
	];

	// ── Generation ────────────────────────────────────────────────────────────────
	function generateTemple(): TempleData {
		const scale = pick(SCALES, mkRng(hashSeed('scale', seed)));
		const deity = pick(DEITIES, mkRng(hashSeed('deity', seed)));
		const clergyName = pick(CLERGY_NAMES, mkRng(hashSeed('clergy-name', seed)));
		const clergyTitle = pick(CLERGY_TITLES, mkRng(hashSeed('clergy-title', seed)));

		return {
			name: `${scale[2]} of ${deity.name}`,
			scale: scale[0],
			scaleDesc: scale[1],
			deity,
			architecture: pick(ARCHITECTURE, mkRng(hashSeed('architecture', seed))),
			clergy: `${clergyTitle} ${clergyName}`,
			orderSize: pick(ORDER_SIZES, mkRng(hashSeed('order', seed))),
			community: pick(COMMUNITY, mkRng(hashSeed('community', seed))),
			relic: pick(RELICS, mkRng(hashSeed('relic', seed))),
			service: pick(SERVICES, mkRng(hashSeed('service', seed))),
			secret: pick(SECRETS, mkRng(hashSeed('secret', seed)))
		};
	}

	function scaleIcon(scale: string): string {
		return SCALES.find((s) => s[0] === scale)?.[3] ?? '⛪';
	}

	function randomize() {
		seed = Math.floor(Math.random() * 1_000_000_000);
	}

	// ── Save / Load ───────────────────────────────────────────────────────────────
	interface SavedTemple {
		id: string;
		name: string;
		seed: number;
		savedAt: number;
	}
	const TEMPLES_KEY = 'initiative_saved_temples';
	let savedTemples = $state<SavedTemple[]>([]);
	if (typeof window !== 'undefined') {
		try {
			savedTemples = JSON.parse(localStorage.getItem(TEMPLES_KEY) ?? '[]');
		} catch {
			savedTemples = [];
		}
	}
	function saveTemple() {
		const entry: SavedTemple = {
			id: crypto.randomUUID(),
			name: temple?.name ?? 'Unknown Temple',
			seed,
			savedAt: Date.now()
		};
		savedTemples = [entry, ...savedTemples].slice(0, 20);
		localStorage.setItem(TEMPLES_KEY, JSON.stringify(savedTemples));
	}
	function deleteSavedTemple(id: string) {
		savedTemples = savedTemples.filter((t) => t.id !== id);
		localStorage.setItem(TEMPLES_KEY, JSON.stringify(savedTemples));
	}
	function applyTemple(t: SavedTemple) {
		seed = t.seed;
	}

	$effect(() => {
		temple = generateTemple();
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
				<h2 class="text-lg font-bold tracking-wide text-amber-300">Temple / Shrine Generator</h2>
				{#if temple}
					<span class="text-xs text-gray-500">{temple.name}</span>
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
				Generate New Temple
			</button>

			{#if temple}
				<button
					onclick={saveTemple}
					class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
				>
					Save Temple
				</button>
			{/if}

			{#if savedTemples.length}
				<div class="flex flex-col gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
						>Saved Temples</span
					>
					<div class="flex max-h-64 flex-col gap-1 overflow-y-auto">
						{#each savedTemples as s (s.id)}
							<div class="flex items-center gap-1 rounded bg-gray-800/80 px-2 py-1.5">
								<button
									onclick={() => applyTemple(s)}
									class="min-w-0 flex-1 truncate text-left text-xs text-gray-200 hover:text-amber-400"
									title={s.name}>{s.name}</button
								>
								<button
									onclick={() => deleteSavedTemple(s.id)}
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
			{#if temple}
				<!-- Banner -->
				<div class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-5">
					<div class="flex flex-wrap items-start gap-4">
						<div
							class="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-amber-950/40 text-3xl shadow-inner"
						>
							{scaleIcon(temple.scale)}
						</div>
						<div class="flex min-w-0 flex-col gap-1">
							<h2 class="text-2xl font-bold tracking-wide text-white">{temple.name}</h2>
							<div class="flex flex-wrap items-center gap-2">
								<span class="text-xs font-semibold tracking-widest text-amber-500 uppercase"
									>{temple.scale}</span
								>
								<span class="text-xs text-gray-500">· {temple.scaleDesc}</span>
							</div>
							<p class="mt-1 text-sm text-gray-300">
								Dedicated to <span class="font-semibold text-gray-100">{temple.deity.name}</span>,
								{temple.deity.title}
								<span class="text-gray-500">({temple.deity.domains})</span>
							</p>
						</div>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Architecture
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{temple.architecture}.</p>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-amber-500 uppercase">Clergy</h3>
						<p class="mb-1 text-sm font-semibold text-gray-100">{temple.clergy}</p>
						<p class="text-xs leading-relaxed text-gray-400">Served by {temple.orderSize}.</p>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4 lg:col-span-2">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Standing with the Community
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{temple.community}.</p>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Notable Relic
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{temple.relic}.</p>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Services Offered
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{temple.service}.</p>
					</div>

					<div class="rounded-xl border border-purple-900/30 bg-purple-950/10 p-4 lg:col-span-2">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-purple-400 uppercase">Secret</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{temple.secret}.</p>
					</div>
				</div>

				<div class="mt-6 flex gap-3 sm:hidden">
					<button
						onclick={randomize}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						New Temple
					</button>
					<button
						onclick={saveTemple}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						Save
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
