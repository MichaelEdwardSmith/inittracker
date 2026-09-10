<!-- Ship / Vessel Generator -->
<script lang="ts">
	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	// ── Types ─────────────────────────────────────────────────────────────────────
	interface ShipData {
		name: string;
		type: string;
		purpose: string;
		captain: string;
		captainRep: string;
		crew: string;
		condition: string;
		feature: string;
		cargo: string;
		secret: string;
	}

	// ── Controls ──────────────────────────────────────────────────────────────────
	let seed = $state(Math.floor(Math.random() * 1_000_000_000));
	let ship = $state<ShipData | null>(null);

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
	// Types roughly follow the DMG's water vehicle stat block categories, so the
	// result tells a DM which stat block to reach for.
	const TYPES: [string, string][] = [
		['Rowboat', '🚣'],
		['Keelboat', '🛶'],
		['Longship', '🛡️'],
		['Sailing Ship', '⛵'],
		['Warship', '🚢'],
		['Galley', '⚓']
	];

	const NAMES = [
		"The Widow's Mercy",
		"Storm's Fury",
		'Iron Tide',
		'The Gilded Gull',
		"Night's Embrace",
		'The Drowned Rose',
		"Leviathan's Bane",
		'The Wandering Star',
		"Serpent's Kiss",
		'The Last Tide',
		'Ashen Wake',
		'The Silver Hind',
		"Kraken's Due",
		'The Salt Reaper',
		"Fortune's Folly",
		'The Weeping Mast',
		'Dawnrunner',
		'The Black Lantern',
		"Siren's Wager",
		'The Gray Widow'
	];

	const PURPOSES = [
		'Merchant trader',
		'Pirate raider',
		'Naval warship',
		'Smuggler',
		'Explorer / cartographer vessel',
		'Fishing trawler',
		'Passenger ferry',
		'Treasure hunter',
		'Diplomatic envoy ship',
		'Pilgrim ship',
		'Privateer, sailing under letters of marque'
	];

	const CAPTAINS = [
		'Captain Elara Voss',
		'Captain Bram Hollis',
		'Captain Odessa Kray',
		'Captain Silas Vane',
		'Captain Mireille Duarte',
		'Captain Thorne Blackwood',
		'Captain Ysolde Marrow',
		'Captain Roan Fitch',
		'Captain Calla Reyes',
		'Captain Dutch Almeida',
		'Captain Nadia Cross',
		'Captain Percival Wick'
	];

	const CAPTAIN_REPS = [
		'famously fair — splits plunder and profit evenly, to a fault',
		'ruthless, and known to maroon anyone who questions an order',
		'superstitious to a fault, and will delay sailing over a bad omen',
		'a former naval officer who deserted under murky circumstances',
		'beloved by the crew for pulling them through disaster twice already',
		'rumored to have struck a bargain with something in the deep',
		'a shrewd negotiator who avoids violence whenever coin will do',
		'haunted by the loss of a previous ship and crew',
		'young and inexperienced, propped up by a veteran first mate',
		'a legend in port, though the stories rarely agree with each other'
	];

	const CREWS = [
		'a lean crew of a dozen, fiercely loyal to the captain',
		'a full complement of forty, mostly press-ganged and resentful',
		'sixty hardened sailors who have served together for years',
		'a skeleton crew of six, barely enough to make way',
		'eighty marines and sailors under strict naval discipline',
		'a rowdy crew of twenty-five, more pirates than sailors',
		'thirty veteran privateers, well-paid and well-armed',
		'fifteen family members and in-laws who trust no outsiders'
	];

	const CONDITIONS = [
		'Pristine — recently refitted, gleaming paint and taut rigging',
		'Weathered — patched sails and a salt-stained hull, but sound',
		'Barely seaworthy — the leaks are a constant, unspoken worry',
		'Battle-scarred — old repairs from a fight not long past',
		'Overloaded — riding low in the water with too much cargo',
		'Unsettling — strange lights and whispers follow it after dark',
		'Recently looted — stripped of valuables, crew on edge',
		'Immaculate but eerily quiet — too clean, too orderly'
	];

	const FEATURES = [
		"a figurehead carved in the likeness of the captain's lost love",
		'sails dyed a color no ordinary dye should produce',
		'a bell that is said to ring on its own before a storm',
		'a hull reinforced with scavenged sea-monster bone',
		"a crow's-nest lookout who claims to see things others cannot",
		'a hidden compartment known only to the captain',
		"a ship's cat treated with more respect than most officers",
		'rigging inscribed with wards against sea hags and sirens',
		'a name freshly repainted over an older, scratched-out one',
		'a figurehead that some swear moves when no one is looking'
	];

	const CARGO = [
		'crates of exotic spices bound for a distant port',
		'a locked hold no crew member will discuss',
		'barrels of salted fish and ordinary trade goods',
		'smuggled weapons hidden beneath legitimate cargo',
		'a single, heavily guarded passenger',
		'stolen goods from a raid three ports back',
		'building stone and timber for a colonial outpost',
		'nothing — the hold is suspiciously empty',
		"livestock bound for a wealthy patron's table",
		'a shipment of "medicine" that is anything but'
	];

	const SECRETS = [
		'the captain owes a life-debt to someone aboard, and it shows',
		'half the crew are mutineers waiting for the right moment',
		'the ship is carrying a passenger wanted in three kingdoms',
		'a stowaway has been hiding in the hold for a week',
		'the last port they visited was struck by plague days later',
		'the ship is not what its papers claim it to be',
		'someone aboard is feeding information to a rival faction',
		'the vessel survived a wreck that killed everyone else in its fleet'
	];

	// ── Generation ────────────────────────────────────────────────────────────────
	function generateShip(): ShipData {
		const type = pick(TYPES, mkRng(hashSeed('type', seed)));
		return {
			name: pick(NAMES, mkRng(hashSeed('name', seed))),
			type: type[0],
			purpose: pick(PURPOSES, mkRng(hashSeed('purpose', seed))),
			captain: pick(CAPTAINS, mkRng(hashSeed('captain', seed))),
			captainRep: pick(CAPTAIN_REPS, mkRng(hashSeed('captain-rep', seed))),
			crew: pick(CREWS, mkRng(hashSeed('crew', seed))),
			condition: pick(CONDITIONS, mkRng(hashSeed('condition', seed))),
			feature: pick(FEATURES, mkRng(hashSeed('feature', seed))),
			cargo: pick(CARGO, mkRng(hashSeed('cargo', seed))),
			secret: pick(SECRETS, mkRng(hashSeed('secret', seed)))
		};
	}

	function typeIcon(name: string): string {
		return TYPES.find((t) => t[0] === name)?.[1] ?? '⛵';
	}

	function randomize() {
		seed = Math.floor(Math.random() * 1_000_000_000);
	}

	// ── Save / Load ───────────────────────────────────────────────────────────────
	interface SavedShip {
		id: string;
		name: string;
		seed: number;
		savedAt: number;
	}
	const SHIPS_KEY = 'initiative_saved_ships';
	let savedShips = $state<SavedShip[]>([]);
	if (typeof window !== 'undefined') {
		try {
			savedShips = JSON.parse(localStorage.getItem(SHIPS_KEY) ?? '[]');
		} catch {
			savedShips = [];
		}
	}
	function saveShip() {
		const entry: SavedShip = {
			id: crypto.randomUUID(),
			name: ship?.name ?? 'Unknown Vessel',
			seed,
			savedAt: Date.now()
		};
		savedShips = [entry, ...savedShips].slice(0, 20);
		localStorage.setItem(SHIPS_KEY, JSON.stringify(savedShips));
	}
	function deleteSavedShip(id: string) {
		savedShips = savedShips.filter((s) => s.id !== id);
		localStorage.setItem(SHIPS_KEY, JSON.stringify(savedShips));
	}
	function applyShip(s: SavedShip) {
		seed = s.seed;
	}

	$effect(() => {
		ship = generateShip();
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
				<h2 class="text-lg font-bold tracking-wide text-amber-300">Ship / Vessel Generator</h2>
				{#if ship}
					<span class="text-xs text-gray-500">{ship.name}</span>
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
				Generate New Ship
			</button>

			{#if ship}
				<button
					onclick={saveShip}
					class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
				>
					Save Ship
				</button>
			{/if}

			{#if savedShips.length}
				<div class="flex flex-col gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
						>Saved Ships</span
					>
					<div class="flex max-h-64 flex-col gap-1 overflow-y-auto">
						{#each savedShips as s (s.id)}
							<div class="flex items-center gap-1 rounded bg-gray-800/80 px-2 py-1.5">
								<button
									onclick={() => applyShip(s)}
									class="min-w-0 flex-1 truncate text-left text-xs text-gray-200 hover:text-amber-400"
									title={s.name}>{s.name}</button
								>
								<button
									onclick={() => deleteSavedShip(s.id)}
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
			{#if ship}
				<!-- Banner -->
				<div class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-5">
					<div class="flex flex-wrap items-start gap-4">
						<div
							class="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-blue-950/40 text-3xl shadow-inner"
						>
							{typeIcon(ship.type)}
						</div>
						<div class="flex min-w-0 flex-col gap-1">
							<h2 class="text-2xl font-bold tracking-wide text-white">{ship.name}</h2>
							<div class="flex flex-wrap items-center gap-2">
								<span class="text-xs font-semibold tracking-widest text-amber-500 uppercase"
									>{ship.type}</span
								>
								<span class="text-xs text-gray-500">· {ship.purpose}</span>
							</div>
						</div>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-amber-500 uppercase">Captain</h3>
						<p class="mb-1 text-sm font-semibold text-gray-100">{ship.captain}</p>
						<p class="text-xs leading-relaxed text-gray-400 capitalize">{ship.captainRep}.</p>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-amber-500 uppercase">Crew</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{ship.crew}.</p>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Condition
						</h3>
						<p class="text-sm leading-relaxed text-gray-300">{ship.condition}.</p>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Notable Feature
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{ship.feature}.</p>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">Cargo</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{ship.cargo}.</p>
					</div>

					<div class="rounded-xl border border-purple-900/30 bg-purple-950/10 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-purple-400 uppercase">Secret</h3>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">{ship.secret}.</p>
					</div>
				</div>

				<div class="mt-6 flex gap-3 sm:hidden">
					<button
						onclick={randomize}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						New Ship
					</button>
					<button
						onclick={saveShip}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						Save
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
