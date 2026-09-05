<!-- Noble House Generator -->
<script lang="ts">
	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	// ── Types ─────────────────────────────────────────────────────────────────────
	interface Heraldry {
		field: string;
		fieldTincture: string;
		charge: string;
		chargeTincture: string;
		ordinary: string | null;
		description: string;
	}

	interface Holding {
		seat: string;
		territory: string;
		resource: string;
		incomeTier: string;
		military: string;
	}

	interface Alliance {
		name: string;
		relation: 'Ally' | 'Vassal' | 'Patron' | 'Trading Partner';
		note: string;
	}

	interface Rival {
		name: string;
		cause: string;
		intensity: 'Cold' | 'Tense' | 'Hostile' | 'Vendetta';
	}

	interface Scandal {
		type: string;
		severity: 'Whispered' | 'Known' | 'Open Secret' | 'Public Outrage';
		description: string;
	}

	interface HouseData {
		name: string;
		epithet: string | null;
		rank: string;
		heraldry: Heraldry;
		motto: string;
		holding: Holding;
		allegiance: string;
		alliances: Alliance[];
		rival: Rival;
		scandals: Scandal[];
		heir: string;
		reputation: string;
	}

	// ── Controls ──────────────────────────────────────────────────────────────────
	let seed = $state(Math.floor(Math.random() * 1_000_000_000));
	let houseData = $state<HouseData | null>(null);

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

	const NAME_PRE = [
		'Ald',
		'Ash',
		'Black',
		'Bright',
		'Cold',
		'Crane',
		'Dark',
		'Dusk',
		'Frost',
		'Gold',
		'Gray',
		'Green',
		'Grim',
		'High',
		'Iron',
		'Lake',
		'Lark',
		'Long',
		'Moon',
		'Moor',
		'Night',
		'Oak',
		'Red',
		'Rook',
		'Silver',
		'Stone',
		'Storm',
		'Straw',
		'Swift',
		'Thorn',
		'Vane',
		'White',
		'Wind',
		'Wolf'
	];

	const NAME_SUF = [
		'bourne',
		'bridge',
		'brook',
		'burgh',
		'cliff',
		'crest',
		'dale',
		'fern',
		'field',
		'ford',
		'gate',
		'grove',
		'haven',
		'keep',
		'mere',
		'mount',
		'moor',
		'ridge',
		'stone',
		'ton',
		'vale',
		'ward',
		'well',
		'wick',
		'wood'
	];

	const EPITHETS = [
		'the Ancient',
		'the Unbowed',
		'the Steadfast',
		'the Victorious',
		'the Merchant Lords',
		'the Iron Seat',
		'of the Golden Thread',
		'of the Old Blood',
		'the Kingmakers',
		'the Unyielding',
		'the Dragonkin',
		'the Wardens of the North',
		'the Ever-Watchful',
		'the Silver Tongue',
		'the First Axe',
		'the Hearthkeepers',
		'the Sunborn',
		'the Tidewalkers',
		'of Forgotten Valor',
		'the Enduring'
	];

	const RANKS = [
		'Duke',
		'Duke',
		'Marquess',
		'Earl',
		'Earl',
		'Viscount',
		'Baron',
		'Baron',
		'Baron',
		'Knight-Banneret'
	];

	// Heraldry
	const TINCTURES = [
		{ name: 'Azure', color: '#1a4f8c' },
		{ name: 'Gules', color: '#9b1b30' },
		{ name: 'Or', color: '#c8a44a' },
		{ name: 'Argent', color: '#d8d8d8' },
		{ name: 'Sable', color: '#2a2a2a' },
		{ name: 'Vert', color: '#2d6e3e' },
		{ name: 'Purpure', color: '#5b2d8a' }
	];

	const CHARGES = [
		'lion rampant',
		'eagle displayed',
		'stag passant',
		'dragon rampant',
		'serpent nowed',
		'tower',
		'crown',
		'crossed swords',
		'warhammer',
		'oak tree',
		'ship under sail',
		'rose',
		'sun in splendour',
		'crescent moon',
		'six-pointed star',
		'griffin segreant',
		'wolf salient',
		'bear rampant',
		'horse courant',
		'phoenix rising',
		'boar passant',
		'leaping fish',
		'anchor',
		'fleur-de-lis',
		'gauntlet'
	];

	const ORDINARIES = [
		'a bend',
		'a pale',
		'a fess',
		'a chevron',
		'a chief',
		'a saltire',
		'a bordure',
		null,
		null,
		null,
		null,
		null
	];

	// Holdings
	const SEAT_FIRST = [
		'Alder',
		'Black',
		'Broken',
		'Crow',
		'Dark',
		'Dusk',
		'Frost',
		'Gray',
		'Grim',
		'High',
		'Hollow',
		'Iron',
		'Lorn',
		'Mist',
		'Old',
		'Red',
		'Salt',
		'Shadow',
		'Silver',
		'Stone',
		'Storm',
		'Thorn',
		'Wind',
		'Wolf'
	];

	const SEAT_SECOND = [
		'Bastion',
		'Citadel',
		'Court',
		'Fastness',
		'Gate',
		'Hall',
		'Hold',
		'Keep',
		'Manor',
		'Peak',
		'Reach',
		'Ridge',
		'Seat',
		'Spire',
		'Tower',
		'Watch'
	];

	const TERRITORIES = [
		'a sweep of fertile river valley farmland',
		'a rugged highland pass controlling overland trade',
		'a stretch of prosperous coastal trade ports',
		'a dense ancient forest rich with timber and game',
		'a river delta crossroads thick with merchant traffic',
		'a wind-scoured moorland concealing silver mines',
		'a patchwork of fortified market towns',
		'a sun-baked plateau of sheep pastures and grain fields',
		'a tangle of sea-cliffs dotted with fishing villages',
		'a disputed border march, heavily garrisoned',
		'a network of underground quarries and stone-cutting villages',
		'a vine-covered hillside renowned for its wine'
	];

	const RESOURCES = [
		'prime warhorses bred on the estate',
		'a lucrative salt monopoly',
		'deep iron ore seams',
		'a renowned mage college on the grounds',
		'the only bridge for forty miles',
		'rich fishing grounds jealously guarded',
		'a shrine that draws pilgrims year-round',
		'an ancient copper mine still producing',
		'vast timber reserves supplying half the kingdom',
		'a guild charter granting tax-free trade in three cities',
		'a small but battle-hardened standing army',
		'access to a sheltered deepwater harbor'
	];

	const INCOME_TIERS = ['Meager', 'Modest', 'Comfortable', 'Wealthy', 'Rich', 'Opulent'];

	const MILITARY = [
		'a dozen sworn household knights and little else',
		'fifty mounted knights and three hundred levies',
		'twenty knights, two hundred spearmen, and a siege train',
		'a retinue of hardened veterans, feared across the region',
		'a hundred crossbowmen, thirty knights, and loyal militia',
		'a small but disciplined professional guard backed by city watch',
		'mercenary contracts that swell the force threefold in wartime',
		'a river fleet and river-fort garrison',
		'no standing army — relies entirely on allied obligations',
		'an elite company of longbowmen with a storied battlefield record'
	];

	// Mottos
	const MOTTOS = [
		'By Blood and Fire',
		'Endure and Prevail',
		'Never Bend, Never Break',
		'Strength Before All',
		'We Rise Again',
		'Fortune Favors the Bold',
		'Truth in Steel',
		'Let None Pass Unchallenged',
		'Vigilance is Our Shield',
		'In Darkness, We Burn Bright',
		'What We Hold, We Keep',
		'Honor Above All',
		'Through Storm, We Stand',
		'Our Word is Iron',
		'Fear No Shadow',
		'The Old Ways Endure',
		'From the Ashes, Onward',
		'Yield Nothing, Claim All',
		'Remember the First Wound',
		'We Have Always Returned',
		'The Price of Power is Paid in Blood',
		'Let Our Enemies Learn Patience',
		'Even Stone Wears Away — We Do Not',
		'Faith Forges the Blade',
		'One Purpose, One Blood'
	];

	// Allegiances
	const ALLEGIANCES = [
		'The Crown',
		'The Crown',
		'The High Church',
		'The Merchant Compact',
		'The Arcane Conclave',
		'The Old Lords Coalition',
		'The Frontier League',
		'The Naval Brotherhood',
		'The Order of the Iron Vow',
		'Nominally none — fiercely independent'
	];

	// Alliances (other house names)
	const ALLY_PRE = [
		'Ash',
		'Bell',
		'Bright',
		'Cam',
		'Crane',
		'Del',
		'Dun',
		'Ever',
		'Fen',
		'Glen',
		'Hale',
		'Haw',
		'Holt',
		'Hull',
		'Ivy',
		'Kay',
		'Larch',
		'Loch',
		'Mel',
		'Mere',
		'Neth',
		'Ode',
		'Penn',
		'Pym',
		'Ran',
		'Ren',
		'Sal',
		'Sel',
		'Spen',
		'Stan',
		'Tav',
		'Tel',
		'Usk',
		'Vel',
		'Wyn'
	];
	const ALLY_SUF = [
		'bane',
		'brook',
		'burn',
		'croft',
		'dale',
		'field',
		'ford',
		'grove',
		'ham',
		'hurst',
		'ley',
		'lock',
		'mar',
		'mond',
		'moor',
		'more',
		'shaw',
		'shire',
		'ton',
		'vale',
		'vane',
		'wall',
		'well',
		'wood',
		'worth'
	];

	const ALLY_RELATIONS: Alliance['relation'][] = ['Ally', 'Vassal', 'Patron', 'Trading Partner'];

	const ALLY_NOTES = [
		'bound by a marriage contract two generations old',
		'united against a common border threat',
		'sharing a profitable trade route agreement',
		'linked by a sworn oath of mutual defense',
		'tied by a recent betrothal of their heirs',
		'indebted after military aid during a crisis',
		'sharing a deep ancestral enmity toward the rival house',
		'joined by shared devotion to the same religious order',
		'connected through a long-standing wool and iron exchange',
		'owing military service in exchange for land grants'
	];

	const RIVAL_CAUSES = [
		'a disputed inheritance that remains unresolved for three generations',
		'the annexation of border lands after a short war',
		'a broken betrothal that shamed both families publicly',
		'a longstanding rivalry over river toll rights',
		"a duel that left one house's heir dead and unavenged",
		'competing claims to the same royal appointment',
		'the accusation of treachery during a past war',
		'a series of merchant sabotages blamed on each other',
		'a feud sparked by public insult at court',
		'a disputed ancestral seat neither side will relinquish'
	];

	const RIVAL_INTENSITIES: Rival['intensity'][] = ['Cold', 'Tense', 'Hostile', 'Vendetta'];

	// Scandals
	const SCANDAL_TYPES = ['Financial', 'Romantic', 'Criminal', 'Political', 'Arcane', 'Religious'];

	const SCANDAL_SEVERITIES: Scandal['severity'][] = [
		'Whispered',
		'Known',
		'Open Secret',
		'Public Outrage'
	];

	const SCANDAL_POOL: Record<string, string[]> = {
		Financial: [
			'The house is secretly insolvent — debts hidden behind proxy merchants may surface soon.',
			'Grain stores were reported destroyed in a fire, yet the market price spiked suspiciously.',
			"Bribes to tax assessors have been keeping the estate's true wealth off the royal ledger.",
			"A business partner claims the house defrauded them of a decade's profits.",
			"The heir has gambled away a third of the estate's liquid assets in private card games."
		],
		Romantic: [
			"The current lord's youngest child is rumored to be the product of an affair with a visiting ambassador.",
			'The heir is conducting a secret courtship with a member of the rival house.',
			'A former paramour of the lady of the house has reappeared, bearing letters.',
			'The lord\'s remarriage after their spouse\'s "sudden illness" raises dark questions.',
			"A celebrated knight in the house's service fathered a child in a village within the estate."
		],
		Criminal: [
			'House guards were involved in the disappearance of a merchant traveling through their lands.',
			"A senior steward is believed to have forged the lord's seal on land transfer documents.",
			'Bandits operating near the estate are suspected of paying the household a tithe.',
			"A prisoner in the house's dungeon has been held without trial for over a year.",
			"An arson fire that destroyed a rival's mill was traced to a man in the house's employ."
		],
		Political: [
			'Letters suggesting treasonous correspondence with a foreign power were intercepted last season.',
			"The house voted against the Crown's latest levy — the reasons given were considered inadequate.",
			'A royal herald was turned away from the gates, claiming the lord refused to receive them.',
			'The house supported the wrong claimant in a recent succession dispute and has not reconciled.',
			'The lord is rumored to be funding an opposition faction within the ruling council.'
		],
		Arcane: [
			'The youngest child has manifested wild magic, and the family is concealing it.',
			'A court magician in their employ was caught conducting prohibited divination.',
			"The estate's old tower is said to house a bound entity the house uses for intelligence.",
			'Illegal enchantments were found on goods the house traded at the last fair.',
			'The lord reportedly consulted a hedge witch before a major military decision.'
		],
		Religious: [
			'The lord has not attended high services in over a year, feeding rumors of apostasy.',
			'A tithe chest meant for the church was found short — the discrepancy was quietly covered.',
			'One of the heirs converted to a fringe sect considered heretical by the established church.',
			'A cleric who visited the estate vanished; the church wants answers the house refuses to give.',
			'Ancestral burial rites on the estate have been conducted without clerical oversight.'
		]
	};

	// Heirs
	const HEIR_TEMPLATES = [
		'an untested son of seventeen, more fond of the hunt than statecraft',
		'a sharp-minded daughter of twenty-two who already manages the household accounts',
		'twin heirs of dubious legitimacy whose claims are already in dispute',
		"a sickly nephew, the lord's only remaining blood relative",
		'a seasoned military commander who resents being kept from the front',
		'a child of nine, meaning a regency council now holds real power',
		'a proud young heir recently returned from a foreign court with strange new ideas',
		'a betrothed heir whose future in-laws now effectively hold a lien on the succession',
		'no clear heir — the house is quietly in a succession crisis',
		'a capable and popular heir who some say is already more powerful than the lord'
	];

	// Reputations
	const REPUTATIONS = [
		'Known for brutal efficiency in collecting debts and dues.',
		'Respected as fair administrators who keep the peace, if not warmth.',
		'Feared for their willingness to go to war over perceived slights.',
		'Admired for producing the finest warhorses and cavalry in the region.',
		'Regarded as cunning diplomats who rarely put a foot wrong.',
		'Viewed with suspicion — too wealthy, too quiet, too careful.',
		'Popular with common folk for holding open feast days each harvest.',
		'Renowned for scholarly patronage; their library is open to all.',
		'Loathed by merchants for aggressive trade protectionism.',
		'Known for producing loyal soldiers who never break under pressure.',
		'Considered pious — the lord funds three chapels on the estate.',
		'Whispered to have outlasted six crises through simple ruthlessness.'
	];

	// ── Generation ────────────────────────────────────────────────────────────────
	function generateHouseName(rng: () => number): string {
		return pick(NAME_PRE, rng) + pick(NAME_SUF, rng);
	}

	function generateAllyName(rng: () => number): string {
		return pick(ALLY_PRE, rng) + pick(ALLY_SUF, rng);
	}

	function buildHeraldryDescription(h: Heraldry): string {
		const ordinary = h.ordinary ? `, ${h.ordinary} ${h.chargeTincture}` : '';
		return `${h.fieldTincture}, ${h.charge} ${h.chargeTincture}${ordinary}`;
	}

	function generateHouse(): HouseData {
		const rng = mkRng(seed);

		const name = generateHouseName(mkRng(hashSeed('name', seed)));
		const rank = pick(RANKS, mkRng(hashSeed('rank', seed)));
		const epithet = rng() < 0.55 ? pick(EPITHETS, mkRng(hashSeed('epithet', seed))) : null;

		// Heraldry — rule of tincture: charge must contrast field (metal on colour or colour on metal)
		const metals = ['Or', 'Argent'];
		const colours = ['Azure', 'Gules', 'Sable', 'Vert', 'Purpure'];
		const fieldTinctures = [...TINCTURES];
		const fieldT = pick(fieldTinctures, mkRng(hashSeed('field', seed)));
		// Pick contrasting charge tincture
		const isMetal = metals.includes(fieldT.name);
		const contrastPool = isMetal
			? TINCTURES.filter((t) => colours.includes(t.name))
			: TINCTURES.filter((t) => metals.includes(t.name));
		const chargeT = pick(contrastPool, mkRng(hashSeed('charge-t', seed)));
		const charge = pick(CHARGES, mkRng(hashSeed('charge', seed)));
		const ordinary = pick(ORDINARIES, mkRng(hashSeed('ordinary', seed)));

		const heraldry: Heraldry = {
			field: fieldT.name,
			fieldTincture: fieldT.name,
			charge,
			chargeTincture: chargeT.name,
			ordinary,
			description: ''
		};
		heraldry.description = buildHeraldryDescription(heraldry);

		const motto = pick(MOTTOS, mkRng(hashSeed('motto', seed)));

		// Holdings
		const seatFirst = pick(SEAT_FIRST, mkRng(hashSeed('seat-f', seed)));
		const seatSecond = pick(SEAT_SECOND, mkRng(hashSeed('seat-s', seed)));
		const seat = `${seatFirst} ${seatSecond}`;
		const territory = pick(TERRITORIES, mkRng(hashSeed('territory', seed)));
		const resource = pick(RESOURCES, mkRng(hashSeed('resource', seed)));
		const incomeTier = pick(INCOME_TIERS, mkRng(hashSeed('income', seed)));
		const military = pick(MILITARY, mkRng(hashSeed('military', seed)));

		const holding: Holding = { seat, territory, resource, incomeTier, military };

		const allegiance = pick(ALLEGIANCES, mkRng(hashSeed('allegiance', seed)));

		// Alliances — 2–3 named houses
		const allyRng = mkRng(hashSeed('ally', seed));
		const numAllies = 2 + (allyRng() < 0.4 ? 1 : 0);
		const allyNames: string[] = [];
		for (let i = 0; i < numAllies; i++) {
			let n: string;
			do {
				n = generateAllyName(mkRng(hashSeed(`ally-name-${i}`, seed)));
			} while (allyNames.includes(n) || n === name);
			allyNames.push(n);
		}
		const allyNotes = shuffle(ALLY_NOTES, mkRng(hashSeed('ally-notes', seed)));
		const allyRelations = shuffle(
			[...ALLY_RELATIONS, ...ALLY_RELATIONS],
			mkRng(hashSeed('ally-rel', seed))
		);
		const alliances: Alliance[] = allyNames.map((n, i) => ({
			name: `House ${n}`,
			relation: allyRelations[i],
			note: allyNotes[i]
		}));

		// Rival
		let rivalName: string;
		do {
			rivalName = generateAllyName(mkRng(hashSeed('rival-name', seed)));
		} while (rivalName === name || allyNames.includes(rivalName));
		const rival: Rival = {
			name: `House ${rivalName}`,
			cause: pick(RIVAL_CAUSES, mkRng(hashSeed('rival-cause', seed))),
			intensity: pick(RIVAL_INTENSITIES, mkRng(hashSeed('rival-int', seed)))
		};

		// Scandals — 1–2
		const scandalRng = mkRng(hashSeed('scandal', seed));
		const numScandals = scandalRng() < 0.45 ? 1 : 2;
		const scandalTypes = shuffle(SCANDAL_TYPES, mkRng(hashSeed('scandal-types', seed)));
		const scandals: Scandal[] = [];
		for (let i = 0; i < numScandals; i++) {
			const type = scandalTypes[i];
			const pool = SCANDAL_POOL[type];
			const desc = pick(pool, mkRng(hashSeed(`scandal-desc-${i}`, seed)));
			const severity = pick(SCANDAL_SEVERITIES, mkRng(hashSeed(`scandal-sev-${i}`, seed)));
			scandals.push({ type, severity, description: desc });
		}

		const heir = pick(HEIR_TEMPLATES, mkRng(hashSeed('heir', seed)));
		const reputation = pick(REPUTATIONS, mkRng(hashSeed('rep', seed)));

		return {
			name: `House ${name}`,
			epithet,
			rank,
			heraldry,
			motto,
			holding,
			allegiance,
			alliances,
			rival,
			scandals,
			heir,
			reputation
		};
	}

	function randomize() {
		seed = Math.floor(Math.random() * 1_000_000_000);
	}

	// ── Save / Load ───────────────────────────────────────────────────────────────
	interface SavedHouse {
		id: string;
		name: string;
		seed: number;
		savedAt: number;
	}
	const HOUSES_KEY = 'initiative_saved_noble_houses';
	let savedHouses = $state<SavedHouse[]>([]);
	if (typeof window !== 'undefined') {
		try {
			savedHouses = JSON.parse(localStorage.getItem(HOUSES_KEY) ?? '[]');
		} catch {
			savedHouses = [];
		}
	}
	function saveHouse() {
		const entry: SavedHouse = {
			id: crypto.randomUUID(),
			name: houseData?.name ?? 'Unknown House',
			seed,
			savedAt: Date.now()
		};
		savedHouses = [entry, ...savedHouses].slice(0, 20);
		localStorage.setItem(HOUSES_KEY, JSON.stringify(savedHouses));
	}
	function deleteSavedHouse(id: string) {
		savedHouses = savedHouses.filter((h) => h.id !== id);
		localStorage.setItem(HOUSES_KEY, JSON.stringify(savedHouses));
	}
	function applyHouse(s: SavedHouse) {
		seed = s.seed;
	}

	// ── Color maps ────────────────────────────────────────────────────────────────
	const TINCTURE_COLORS: Record<string, string> = {
		Azure: '#1a4f8c',
		Gules: '#9b1b30',
		Or: '#c8a44a',
		Argent: '#c8c8c8',
		Sable: '#3a3a3a',
		Vert: '#2d6e3e',
		Purpure: '#5b2d8a'
	};

	const TINCTURE_TEXT: Record<string, string> = {
		Azure: 'text-blue-300',
		Gules: 'text-red-400',
		Or: 'text-yellow-400',
		Argent: 'text-gray-300',
		Sable: 'text-gray-500',
		Vert: 'text-green-400',
		Purpure: 'text-purple-400'
	};

	const SEVERITY_COLORS: Record<string, string> = {
		Whispered: 'bg-gray-700/60 text-gray-400',
		Known: 'bg-yellow-900/50 text-yellow-400',
		'Open Secret': 'bg-orange-900/50 text-orange-400',
		'Public Outrage': 'bg-red-900/60 text-red-400'
	};

	const RIVAL_COLORS: Record<string, string> = {
		Cold: 'bg-blue-900/50 text-blue-300',
		Tense: 'bg-yellow-900/50 text-yellow-400',
		Hostile: 'bg-orange-900/50 text-orange-400',
		Vendetta: 'bg-red-900/60 text-red-400'
	};

	const RELATION_COLORS: Record<string, string> = {
		Ally: 'bg-green-900/50 text-green-300',
		Vassal: 'bg-indigo-900/50 text-indigo-300',
		Patron: 'bg-amber-900/50 text-amber-300',
		'Trading Partner': 'bg-teal-900/50 text-teal-300'
	};

	const INCOME_COLORS: Record<string, string> = {
		Meager: 'text-gray-500',
		Modest: 'text-gray-400',
		Comfortable: 'text-green-400',
		Wealthy: 'text-yellow-400',
		Rich: 'text-amber-400',
		Opulent: 'text-orange-400'
	};

	// Charge emoji approximations for display
	const CHARGE_ICON: Record<string, string> = {
		'lion rampant': '🦁',
		'eagle displayed': '🦅',
		'stag passant': '🦌',
		'dragon rampant': '🐉',
		'serpent nowed': '🐍',
		tower: '🏰',
		crown: '👑',
		'crossed swords': '⚔️',
		warhammer: '🔨',
		'oak tree': '🌳',
		'ship under sail': '⛵',
		rose: '🌹',
		'sun in splendour': '☀️',
		'crescent moon': '🌙',
		'six-pointed star': '✦',
		'griffin segreant': '🦅',
		'wolf salient': '🐺',
		'bear rampant': '🐻',
		'horse courant': '🐴',
		'phoenix rising': '🔥',
		'boar passant': '🐗',
		'leaping fish': '🐟',
		anchor: '⚓',
		'fleur-de-lis': '⚜️',
		gauntlet: '🧤'
	};

	$effect(() => {
		houseData = generateHouse();
	});
</script>

<!-- Full-screen layout -->
<div
	class={embedded
		? 'flex h-full flex-col bg-gray-950'
		: 'fixed inset-0 z-50 flex flex-col bg-gray-950'}
	role="dialog"
	aria-modal="true"
	onkeydown={(e) => e.key === 'Escape' && onclose()}
>
	<!-- Header -->
	{#if !embedded}
		<div
			class="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900/80 px-5 py-3"
		>
			<div class="flex items-center gap-3">
				<h2 class="text-lg font-bold tracking-wide text-amber-300">Noble House Generator</h2>
				{#if houseData}
					<span class="text-xs text-gray-500">{houseData.name}</span>
				{/if}
			</div>
			<button
				onclick={onclose}
				class="rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition hover:border-red-700 hover:text-red-400"
				aria-label="Close"
			>
				<i class="fa-solid fa-xmark text-base" aria-hidden="true"></i>
			</button>
		</div>
	{/if}

	<!-- Body -->
	<div class="relative flex min-h-0 flex-1 overflow-hidden">
		<!-- Left panel: controls -->
		<div
			class="hidden w-56 shrink-0 flex-col gap-5 overflow-y-auto border-r border-gray-800 bg-gray-900/60 p-4 sm:flex"
		>
			<!-- Actions -->
			<button
				onclick={randomize}
				class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
			>
				Generate New House
			</button>

			{#if houseData}
				<button
					onclick={saveHouse}
					class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
				>
					Save House
				</button>
			{/if}

			{#if savedHouses.length}
				<div class="flex flex-col gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
						>Saved Houses</span
					>
					<div class="flex max-h-64 flex-col gap-1 overflow-y-auto">
						{#each savedHouses as s (s.id)}
							<div class="flex items-center gap-1 rounded bg-gray-800/80 px-2 py-1.5">
								<button
									onclick={() => applyHouse(s)}
									class="min-w-0 flex-1 truncate text-left text-xs text-gray-200 hover:text-amber-400"
									title={s.name}>{s.name}</button
								>
								<button
									onclick={() => deleteSavedHouse(s.id)}
									class="shrink-0 text-[11px] leading-none text-gray-600 hover:text-red-400"
									aria-label="Delete">✕</button
								>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Right panel: results -->
		<div class="min-w-0 flex-1 overflow-y-auto p-5">
			{#if houseData}
				<!-- ── Banner card ─────────────────────────────────────────────── -->
				<div class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-5">
					<div class="flex flex-wrap items-start gap-4">
						<!-- Shield -->
						<div
							class="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg text-3xl shadow-inner"
							style="background-color:{TINCTURE_COLORS[houseData.heraldry.field] ?? '#333'}"
							title={houseData.heraldry.description}
						>
							{CHARGE_ICON[houseData.heraldry.charge] ?? '⚜️'}
						</div>

						<!-- Name & motto -->
						<div class="flex min-w-0 flex-col gap-1">
							<div class="flex flex-wrap items-baseline gap-2">
								<h2 class="text-2xl font-bold tracking-wide text-white">{houseData.name}</h2>
								{#if houseData.epithet}
									<span class="text-sm text-gray-400 italic">"{houseData.epithet}"</span>
								{/if}
							</div>
							<span class="text-xs font-semibold tracking-widest text-amber-500 uppercase"
								>{houseData.rank}</span
							>
							<p class="mt-1 text-sm text-gray-300 italic">
								<span class="text-gray-500">Motto:</span>
								"{houseData.motto}"
							</p>
						</div>
					</div>
				</div>

				<!-- ── Two-column grid ─────────────────────────────────────────── -->
				<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
					<!-- Heraldry -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-amber-500 uppercase">
							Heraldry
						</h3>
						<div class="mb-2 flex flex-wrap gap-2">
							<span
								class="rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {TINCTURE_TEXT[
									houseData.heraldry.field
								] ?? 'text-gray-300'}"
								style="background-color:{TINCTURE_COLORS[houseData.heraldry.field]}22"
							>
								Field: {houseData.heraldry.field}
							</span>
							<span
								class="rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {TINCTURE_TEXT[
									houseData.heraldry.chargeTincture
								] ?? 'text-gray-300'}"
								style="background-color:{TINCTURE_COLORS[houseData.heraldry.chargeTincture]}22"
							>
								Charge: {houseData.heraldry.chargeTincture}
							</span>
						</div>
						<p class="text-sm leading-relaxed text-gray-300 capitalize">
							{houseData.heraldry.description}
						</p>
						{#if houseData.heraldry.ordinary}
							<p class="mt-1 text-xs text-gray-500 italic">
								Includes {houseData.heraldry.ordinary} as an ordinary.
							</p>
						{/if}
					</div>

					<!-- Holdings -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-amber-500 uppercase">
							Holdings
						</h3>
						<p class="mb-1 text-sm font-semibold text-gray-100">
							Seat: <span class="text-amber-300">{houseData.holding.seat}</span>
						</p>
						<p class="mb-1 text-xs leading-relaxed text-gray-400">
							Territory: {houseData.holding.territory}.
						</p>
						<p class="mb-1 text-xs leading-relaxed text-gray-400">
							Notable resource: {houseData.holding.resource}.
						</p>
						<p class="mb-2 text-xs text-gray-400">
							Military: {houseData.holding.military}.
						</p>
						<div class="flex items-center gap-2">
							<span class="text-[10px] tracking-wider text-gray-600 uppercase">Annual income</span>
							<span
								class="text-sm font-bold {INCOME_COLORS[houseData.holding.incomeTier] ??
									'text-gray-300'}">{houseData.holding.incomeTier}</span
							>
						</div>
					</div>

					<!-- Allegiance & Alliances -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-amber-500 uppercase">
							Political Alliances
						</h3>
						<p class="mb-3 text-xs text-gray-400">
							Primary allegiance: <span class="font-semibold text-gray-200"
								>{houseData.allegiance}</span
							>
						</p>
						<div class="flex flex-col gap-2">
							{#each houseData.alliances as a}
								<div class="rounded-lg border border-gray-700/60 bg-gray-900/40 px-3 py-2">
									<div class="mb-0.5 flex flex-wrap items-center gap-2">
										<span class="text-sm font-semibold text-gray-100">{a.name}</span>
										<span
											class="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase {RELATION_COLORS[
												a.relation
											] ?? 'bg-gray-700 text-gray-400'}">{a.relation}</span
										>
									</div>
									<p class="text-[11px] leading-snug text-gray-500 italic">{a.note}.</p>
								</div>
							{/each}
						</div>
					</div>

					<!-- Rival -->
					<div class="rounded-xl border border-red-900/30 bg-red-950/10 p-4">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-red-500 uppercase">
							Rival House
						</h3>
						<div class="mb-2 flex flex-wrap items-center gap-2">
							<span class="text-sm font-bold text-gray-100">{houseData.rival.name}</span>
							<span
								class="rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase {RIVAL_COLORS[
									houseData.rival.intensity
								] ?? 'bg-gray-700 text-gray-400'}">{houseData.rival.intensity}</span
							>
						</div>
						<p class="text-xs leading-relaxed text-gray-400">{houseData.rival.cause}.</p>
					</div>

					<!-- Scandals -->
					<div class="rounded-xl border border-purple-900/30 bg-purple-950/10 p-4 lg:col-span-2">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-purple-400 uppercase">
							Current Scandals
						</h3>
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							{#each houseData.scandals as scandal}
								<div class="rounded-lg border border-gray-700/50 bg-gray-900/40 p-3">
									<div class="mb-1.5 flex flex-wrap items-center gap-2">
										<span class="text-xs font-bold text-gray-300">{scandal.type}</span>
										<span
											class="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase {SEVERITY_COLORS[
												scandal.severity
											] ?? 'bg-gray-700 text-gray-400'}">{scandal.severity}</span
										>
									</div>
									<p class="text-xs leading-relaxed text-gray-400 italic">
										{scandal.description}
									</p>
								</div>
							{/each}
						</div>
					</div>

					<!-- Heir & Reputation -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Succession
						</h3>
						<p class="text-sm leading-relaxed text-gray-300">The heir is {houseData.heir}.</p>
					</div>

					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Reputation
						</h3>
						<p class="text-sm leading-relaxed text-gray-300">{houseData.reputation}</p>
					</div>
				</div>

				<!-- Mobile regenerate -->
				<div class="mt-6 flex gap-3 sm:hidden">
					<button
						onclick={randomize}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						New House
					</button>
					<button
						onclick={saveHouse}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						Save
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
