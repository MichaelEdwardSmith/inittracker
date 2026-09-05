<!-- Black Market Generator -->
<script lang="ts">
	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	// ── Types ─────────────────────────────────────────────────────────────────────
	type HeatLevel = 'Cold' | 'Warm' | 'Hot' | 'Burning';
	type LegalStatus = 'Contraband' | 'Restricted' | 'Stolen' | 'Prohibited' | 'Regulated';
	type ItemRisk = 'Low' | 'Medium' | 'High' | 'Extreme';

	interface MarketItem {
		name: string;
		description: string;
		status: LegalStatus;
		legalPrice: string;
		streetPrice: string;
		markup: string;
		risk: ItemRisk;
		note: string;
	}

	interface Broker {
		name: string;
		trait: string;
		specialty: string;
	}

	interface Condition {
		type: string;
		description: string;
	}

	interface MarketData {
		marketName: string;
		location: string;
		accessMethod: string;
		cover: string;
		heatLevel: HeatLevel;
		heatNote: string;
		broker: Broker;
		items: MarketItem[];
		condition: Condition;
		rule: string;
		rumor: string;
	}

	// ── Controls ──────────────────────────────────────────────────────────────────
	let seed = $state(Math.floor(Math.random() * 1_000_000_000));
	let marketData = $state<MarketData | null>(null);

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

	const MARKET_NAMES = [
		'The Under Market',
		'The Grey Shelf',
		'The Wet Ledger',
		'The Crooked Stall',
		'The Night Exchange',
		'The Blind Auction',
		'The Salted Deal',
		'The Twice-Traded',
		"The Surgeon's Drawer",
		'The Damp Vault',
		'The Unmarked Stall',
		'The Hollow Weight',
		'The Off-Book Mart',
		'The Shadow Fair',
		'The Quiet Counter',
		'The Last Resort Market',
		'The Unlicensed Floor',
		'The Wrung Coin',
		'The Ink-Dry Bargain',
		'The Closed Session'
	];

	const LOCATIONS = [
		'a condemned tenement basement in the Warrens',
		'the back room of a legitimate pawn shop',
		"a disused sewer junction beneath the Tanner's Quarter",
		'a river barge that moves mooring every three days',
		'a warehouse annex behind a busy import dock',
		'the sub-cellar of a working tavern, accessed through the wine rack',
		"a windowless room above a moneylender's office",
		'a covered market stall that sets up only after the legitimate market closes',
		'a private dining room in a mid-tier inn, rented by the week',
		'a tunnel complex beneath a long-closed bathhouse',
		'an upper floor of a printing press that no longer prints',
		"a converted stable at the edge of the city's oldest district",
		"a physician's consultation room — the physician is in on it",
		"a chandler's back office, accessible only through an employee entrance",
		'a smoke-filled room above a fighting pit'
	];

	const ACCESS_METHODS = [
		'speak a rotating passphrase — changed every new moon, distributed by runners',
		"present a marked coin stamped with the broker's personal seal",
		'be vouched for by an existing customer in person',
		'leave a specific item at a dead drop; a guide appears within the hour',
		"send a coded message to a listed scrivener's address and await a reply",
		'purchase a specific mundane item from the cover business — the item is a signal',
		'arrive at a specific hour on a specific day; the entrance is only unlocked then',
		'know the correct knock pattern — six raps, pause, two, pause, one',
		"be escorted by a guild member who takes a finder's fee",
		'bribe the right city watch officer who will look the other way and point the way'
	];

	const COVERS = [
		'a licensed apothecary with a longer-than-usual back inventory',
		"a chandler's shop that smells of more than candles",
		'a curio dealer whose stock is aggressively uninteresting',
		'a cobbler who repairs shoes very slowly and has a lot of storage',
		"a scrivener's office that handles unusual document requests",
		'a second-hand goods dealer with no visible supply chain',
		'an import broker who never seems to import anything obvious',
		'a letter-of-credit office nobody uses for actual credit',
		'a tobacconist who stocks things smokier than tobacco',
		'a map seller with an unusual interest in building interiors'
	];

	// ── Broker ────────────────────────────────────────────────────────────────────
	const FIRST_NAMES = [
		'Aldra',
		'Benn',
		'Coss',
		'Drevv',
		'Essa',
		'Falk',
		'Grim',
		'Holt',
		'Issa',
		'Jurk',
		'Kael',
		'Lenne',
		'Morv',
		'Nast',
		'Orvyn',
		'Pell',
		'Quorra',
		'Rime',
		'Sevik',
		'Tann',
		'Ulra',
		'Veld',
		'Wace',
		'Yenn',
		'Zol',
		'Arke',
		'Brix',
		'Calla',
		'Dusk',
		'Ember'
	];
	const LAST_NAMES = [
		'Ashwick',
		'Bolt',
		'Crane',
		'Dray',
		'Edgely',
		'Foss',
		'Grale',
		'Holt',
		'Irvine',
		'Jast',
		'Kell',
		'Lorne',
		'Mercer',
		'Nolt',
		'Orvyn',
		'Pryce',
		'Quade',
		'Rafter',
		'Stave',
		'Thorn',
		'Umble',
		'Vale',
		'Wicker',
		'Yolt',
		'Zarr',
		'Denn',
		'Finch',
		'Galt'
	];

	const BROKER_TRAITS = [
		'quotes prices once, never twice — hesitate and they move on',
		"keeps meticulous ledgers that they'd kill to protect",
		'is unfailingly pleasant right up until the moment a deal goes wrong',
		"has a policy of not knowing the buyer's name and enforces it strictly",
		'asks no questions about intended use, but remembers every face',
		"won't touch a deal that smells like a setup — and they have a nose for setups",
		'works exclusively in trade-and-coin — no pure coin deals, ever',
		"has connections in the city watch and isn't shy about implying it",
		'is the calmest person in any room, which is somehow more threatening than anger',
		"takes ten percent above the listed price for any buyer they don't already know",
		'has a reputation for goods that are exactly as described — a rare quality',
		'never writes anything down and has a memory that makes ledgers jealous',
		'will front credit to trusted clients, which is how they own three of them now',
		'speaks in a flat, transactional tone that makes everything feel like a legal proceeding'
	];

	const BROKER_SPECIALTIES = [
		'alchemical and arcane contraband',
		'stolen documents and intelligence',
		'weapons and illegal armaments',
		'exotic and controlled substances',
		'forbidden religious or occult items',
		'counterfeit goods and forgeries',
		'restricted medical and surgical supplies',
		'stolen luxury goods and valuables',
		'smuggled imports from embargoed regions',
		'information and blackmail material'
	];

	// ── Items ─────────────────────────────────────────────────────────────────────
	interface ItemEntry {
		name: string;
		description: string;
		status: LegalStatus;
		legalPrice: string;
		streetPrice: string;
		markup: string;
		risk: ItemRisk;
		note: string;
	}

	const ITEM_POOL: ItemEntry[] = [
		{
			name: 'Nightshade Extract',
			description:
				'A concentrated tincture derived from belladonna. Lethal in quantity; sedative in careful doses.',
			status: 'Prohibited',
			legalPrice: 'Not sold legally',
			streetPrice: '75 gp per vial',
			markup: '—',
			risk: 'High',
			note: 'Favored for untraceable poisonings. Purchase alone is a capital offense in most jurisdictions.'
		},
		{
			name: 'Forged Merchant Guild Charter',
			description:
				'A convincing reproduction of a full Merchant Guild operating license, complete with wax seal.',
			status: 'Contraband',
			legalPrice: 'Not sold legally',
			streetPrice: '200 gp',
			markup: '—',
			risk: 'High',
			note: 'Passes casual inspection. Would not survive a guild house verification. Buyer assumes all risk.'
		},
		{
			name: 'Unregistered Spellbook (Partial)',
			description:
				'A handwritten tome of twelve spells, none prohibited individually — but the registration is conspicuously absent.',
			status: 'Restricted',
			legalPrice: '180 gp (registered copy)',
			streetPrice: '310 gp',
			markup: '+72%',
			risk: 'Medium',
			note: 'The Arcane Conclave tracks unregistered tomes. Owning one draws questions; using one draws attention.'
		},
		{
			name: 'Military-Grade Crossbow (Full Draw)',
			description:
				'A steel-reinforced crossbow exceeding the draw weight permitted for civilian use.',
			status: 'Restricted',
			legalPrice: 'Military contract only',
			streetPrice: '85 gp',
			markup: '—',
			risk: 'Medium',
			note: "Illegal to own without a soldier's writ. Visually indistinguishable from a legal model until tested."
		},
		{
			name: "Alchemist's Fire (Crate of Six)",
			description:
				'Six sealed ceramic flasks of volatile incendiary compound. Each can engulf a ten-foot area.',
			status: 'Restricted',
			legalPrice: '60 gp each (licensed)',
			streetPrice: '520 gp for the crate',
			markup: '+44%',
			risk: 'Extreme',
			note: 'Transport is the primary risk. One cracked seal and the crate becomes the incident.'
		},
		{
			name: 'City Watch Identification Papers (Blank)',
			description:
				'A folio of twenty authentic, unstamped city watch identity documents. Legitimately stolen from the print office.',
			status: 'Stolen',
			legalPrice: 'Not purchasable',
			streetPrice: '35 gp per page; 600 gp for the folio',
			markup: '—',
			risk: 'Extreme',
			note: 'The print office has reported the theft. Using these requires a forger. Getting caught with them requires a lawyer.'
		},
		{
			name: 'Regulated Healing Draught (Bulk)',
			description:
				'Twenty vials of standard healing potion, acquired outside the Apothecary Guild licensing system.',
			status: 'Regulated',
			legalPrice: '50 gp per vial (licensed)',
			streetPrice: '38 gp per vial',
			markup: '-24% (undercut)',
			risk: 'Low',
			note: 'Medically identical to the licensed version. The guild considers this criminal. The guild is not here.'
		},
		{
			name: 'Tariff-Exempt Import Documents',
			description:
				'A stack of authentic transit permits stamped by a corrupt dockmaster, exempting cargo from tariff inspection.',
			status: 'Contraband',
			legalPrice: 'Not sold legally',
			streetPrice: '90 gp per sheet',
			markup: '—',
			risk: 'High',
			note: "The dockmaster who stamps these has three more months before he's rotated out. Price reflects urgency."
		},
		{
			name: 'Drowsing Dust (Six Portions)',
			description:
				'A fine powder that induces unconsciousness when inhaled. Dissolves in liquid in under a minute.',
			status: 'Prohibited',
			legalPrice: 'Not sold legally',
			streetPrice: '40 gp per portion',
			markup: '—',
			risk: 'High',
			note: 'Used in robberies, kidnappings, and worse. No legitimate use recognized by any jurisdiction on this road.'
		},
		{
			name: 'Disassembled Handcannon',
			description:
				'A rare firearms piece, broken into components for transport. Functional when reassembled.',
			status: 'Prohibited',
			legalPrice: 'Crown monopoly — not available',
			streetPrice: '450 gp',
			markup: '—',
			risk: 'Extreme',
			note: 'Only issued to crown military units. Possession by a civilian is technically treason in three territories.'
		},
		{
			name: 'Stolen Estate Deed (Blank Transfer)',
			description:
				'An authentic deed of land transfer, signed in blank by a forged noble seal. The land is real; the signature is not.',
			status: 'Stolen',
			legalPrice: 'Not purchasable',
			streetPrice: '800 gp',
			markup: '—',
			risk: 'High',
			note: 'Could transfer ownership of a small manor. Will not survive a heraldic records check, but few buyers plan to go to court.'
		},
		{
			name: 'Church-Restricted Scripture',
			description:
				'A handbound copy of a religious text banned by the High Church as heretical. The theology is provocative; the content is historical.',
			status: 'Prohibited',
			legalPrice: 'Banned — no legal price',
			streetPrice: '55 gp',
			markup: '—',
			risk: 'Medium',
			note: 'Possession draws ecclesiastical attention. The ideas inside it draw more.'
		},
		{
			name: 'Concentrated Acid (Sealed Flask)',
			description:
				'A sealed alchemical flask of concentrated acid, sufficient to destroy a small metal lock or severely injure a person.',
			status: 'Restricted',
			legalPrice: '30 gp (licensed trade use)',
			streetPrice: '65 gp',
			markup: '+117%',
			risk: 'Medium',
			note: "Legal for licensed metalworkers. The broker doesn't ask what you plan to dissolve."
		},
		{
			name: 'Embargoed Silk (Bolts)',
			description:
				'Four bolts of Calishite silk from an embargoed trade route, beautiful and technically seized goods.',
			status: 'Contraband',
			legalPrice: '80 gp/bolt (when available legally)',
			streetPrice: '120 gp/bolt',
			markup: '+50%',
			risk: 'Low',
			note: "A customs inspector would confiscate it. A merchant could move it quickly in a city that doesn't ask questions."
		},
		{
			name: 'Summoning Diagram (Bound Copy)',
			description:
				'A transcribed diagram for summoning a minor fiend. Not inherently illegal — but the Arcane Conclave would very much like to know who has it.',
			status: 'Restricted',
			legalPrice: 'Conclave-restricted — no public price',
			streetPrice: '380 gp',
			markup: '—',
			risk: 'High',
			note: 'The diagram is accurate. The notes on containment are incomplete. These facts may be related.'
		},
		{
			name: "Assassin's Contract (Unfilled)",
			description:
				'A standard assassination contract template, pre-signed by a known broker. The target line is blank.',
			status: 'Contraband',
			legalPrice: 'Not sold legally',
			streetPrice: '300 gp',
			markup: '—',
			risk: 'Extreme',
			note: 'The broker claims not to know the original client. The original client may still be looking for this.'
		},
		{
			name: 'Counterfeit Coin (Mixed Lot)',
			description:
				'A pouch of 100 gold coins, 40% genuine, 60% convincing base-metal forgeries. Individually indistinguishable by eye.',
			status: 'Contraband',
			legalPrice: 'Not sold legally',
			streetPrice: '28 gp for the lot',
			markup: '—',
			risk: 'Medium',
			note: "A moneychanger's scales will catch the forgeries. A busy merchant might not. Risk transfers to the buyer on purchase."
		},
		{
			name: "Thieves' Tools (Military Grade)",
			description:
				'A full lockpick set rated for military-grade locks, including tension bars for mechanisms not commercially available.',
			status: 'Restricted',
			legalPrice: 'Guild-licensed locksmiths only',
			streetPrice: '95 gp',
			markup: '—',
			risk: 'Medium',
			note: 'Owning these implies intent in most courts. The broker sells them as "locksmith study materials."'
		},
		{
			name: 'Divination-Blocked Amulet',
			description:
				'An enchanted amulet that suppresses scrying and magical location attempts on the wearer.',
			status: 'Restricted',
			legalPrice: 'Conclave-licensed only — 400 gp',
			streetPrice: '680 gp',
			markup: '+70%',
			risk: 'Medium',
			note: 'Legal to own with Conclave documentation. Illegal to own without it. The documentation costs more than the amulet.'
		},
		{
			name: 'Prison Release Writ (Forged)',
			description:
				'A convincing forgery of an official release document for a named prisoner — the name field is blank.',
			status: 'Contraband',
			legalPrice: 'Not sold legally',
			streetPrice: '150 gp',
			markup: '—',
			risk: 'High',
			note: 'Used at the point of release, not afterward. Works once. If questioned, the writ is the only evidence that exists.'
		},
		{
			name: 'Regulated Poison Antidote (Rare)',
			description:
				'A genuine antidote to three common contact poisons, manufactured by an unlicensed alchemist.',
			status: 'Regulated',
			legalPrice: '120 gp (licensed apothecary)',
			streetPrice: '85 gp',
			markup: '-29% (undercut)',
			risk: 'Low',
			note: 'Chemically sound. The Apothecary Guild criminalizes unlicensed production. The guild is not wrong, but the price is right.'
		},
		{
			name: 'A Sealed Letter of Credit (Stolen)',
			description:
				"A banker's letter of credit drawn on a real account, stolen before it reached its intended recipient.",
			status: 'Stolen',
			legalPrice: 'Face value: 500 gp',
			streetPrice: '200 gp',
			markup: '-60% (risk discount)',
			risk: 'High',
			note: 'The account is real and the funds are there. The original recipient has presumably reported it missing.'
		},
		{
			name: 'Alchemical Smoke Canisters (Four)',
			description:
				'Dense smoke bombs providing twelve seconds of complete visual obscuration in a twenty-foot radius.',
			status: 'Restricted',
			legalPrice: 'Military supply contract only',
			streetPrice: '55 gp each',
			markup: '—',
			risk: 'Low',
			note: 'Not technically prohibited for civilians — the restriction is on manufacture and bulk sale. One or two raises no flags.'
		},
		{
			name: 'Enchanted Silence Cloak',
			description:
				"A cloak enchanted to suppress the sound of the wearer's footsteps and movement.",
			status: 'Restricted',
			legalPrice: 'Conclave-licensed: 600 gp',
			streetPrice: '950 gp',
			markup: '+58%',
			risk: 'Medium',
			note: "The enchantment is real and well-made. Unregistered, which means it can't be reported stolen if taken from you."
		},
		{
			name: 'Naval Charts (Restricted Routes)',
			description:
				'Official nautical charts covering smuggling patrol routes and blind spots in the coastal watch.',
			status: 'Stolen',
			legalPrice: 'Crown restricted — no price',
			streetPrice: '320 gp',
			markup: '—',
			risk: 'Extreme',
			note: 'Worth every coin to a smuggler. Would end a naval career and begin a prison sentence if traced back to the source.'
		}
	];

	// ── Conditions ────────────────────────────────────────────────────────────────
	interface ConditionEntry {
		type: string;
		description: string;
	}

	const CONDITIONS: ConditionEntry[] = [
		{
			type: 'Price Surge',
			description:
				'A recent crackdown on a competing supplier has temporarily halved available stock. All prices are 30% higher than listed until supply recovers. The broker is apologetic and not remotely sorry.'
		},
		{
			type: 'Watch Scrutiny',
			description:
				'A city watch patrol has established a checkpoint two streets away. The broker is operating normally but has doubled the waiting period between customers. New buyers are being turned away today.'
		},
		{
			type: 'New Stock',
			description:
				"A large acquisition came in three days ago and the broker hasn't finished cataloguing it. Buyers willing to take unlisted items at a discount can browse the backroom — risk and condition unknown."
		},
		{
			type: 'Trusted Buyers Only',
			description:
				"There was an incident last week. The broker isn't discussing details. First-time buyers need a voucher from a known customer. Without one, the door stays closed."
		},
		{
			type: 'Short Supply',
			description:
				'Three of the most requested items are currently out of stock. The broker expects resupply within a week but offers no guarantees. Pre-orders can be placed with a 50% deposit — non-refundable.'
		},
		{
			type: 'Competitor Threat',
			description:
				'A rival black market operation has been undercutting prices in this district. The broker is matching prices today on selected items and very clearly unhappy about it.'
		},
		{
			type: 'Informant Suspected',
			description:
				'The broker believes someone in their regular customer base is feeding information to the authorities. Every transaction today comes with an informal interrogation. Buyers who seem nervous will be turned away.'
		},
		{
			type: 'Cash Only',
			description:
				"The broker's usual network for moving letters of credit has gone dark. Coin only today, no exceptions. Buyers who arrived expecting to trade goods or notes will need to come back."
		},
		{
			type: 'Clearance Sale',
			description:
				'Several items are being sold below cost — the broker needs to move them before a scheduled relocation. No questions about why specific items need to disappear quickly.'
		},
		{
			type: 'Heavy Escort',
			description:
				'Two additional armed individuals are present who weren\'t here before. The broker mentions this is "temporary." They do not introduce themselves or make eye contact with buyers.'
		},
		{
			type: 'Damaged Stock',
			description:
				'A storage problem — water, vermin, or something more sinister — has degraded a portion of inventory. Affected items are available at 40% off. Condition is described as "mostly functional."'
		},
		{
			type: 'Third-Party Auction',
			description:
				"An anonymous seller has consigned several items for auction today. Bidding starts in one hour. The broker takes 15%. The seller's identity is protected — the items' origins are not guaranteed."
		}
	];

	// ── Rules ─────────────────────────────────────────────────────────────────────
	const RULES = [
		'No names. Neither party uses them. Violations end the transaction.',
		'All sales are final. The broker does not accept returns, complaints, or consequences.',
		'Payment is made before the item leaves this room. Without exception.',
		'Describe what you want — never ask where it came from. The broker will do the same.',
		'One buyer in the room at a time. Wait outside until called.',
		'The broker does not negotiate with first-time visitors. Come back with a voucher or come back with more coin.',
		"If you're followed here, you're not welcome here. The broker assumes this has happened to everyone.",
		'No weapons drawn in the market. Not yours, not theirs. This rule has been tested.',
		"The broker's assessment of an item is final. You may take it or leave it. You may not argue it.",
		'Information about other customers is not for sale. Not to you. Not to anyone.'
	];

	// ── Rumors ────────────────────────────────────────────────────────────────────
	const RUMORS = [
		'A city inspector bribed to look the other way recently doubled his asking price. The broker is reconsidering the arrangement.',
		'Something came through last week that the broker refused to handle. No one knows what it was or where it went.',
		'The market is moving locations next month. Regular customers will be notified. New customers may not find the new address.',
		'A buyer was turned in to the watch after threatening the broker. The broker provided testimony personally. The buyer did not come back.',
		"There's a rumor that one of the regular items here is traced — every sale tracked by the Arcane Conclave. The broker denies it with unusual specificity.",
		'A competing market three streets over was raided last night. The timing felt like more than coincidence to several people here.',
		'The broker recently turned down a very large contract from someone wealthy. The reason given was "the item doesn\'t exist." Regulars think it does.',
		'An unfamiliar face has been asking questions about this market at several nearby inns. Nobody knows who sent them.',
		"One of the broker's suppliers has gone quiet. Two shipments missed. The broker is diversifying sources and absorbing the cost for now.",
		'The broker was seen meeting privately with a city watch captain. Opinions on what that means are sharply divided.'
	];

	// ── Heat ──────────────────────────────────────────────────────────────────────
	const HEAT_NOTES: Record<HeatLevel, string[]> = {
		Cold: [
			'No active investigation. The watch has bigger problems this season.',
			'The cover business is holding. Foot traffic looks completely normal.',
			'Three clean months. The broker is almost relaxed about it.'
		],
		Warm: [
			'A new watch constable in the district has been asking questions at neighboring businesses.',
			"One recent transaction was sloppy. The buyer talked. The trail hasn't led here yet.",
			'The Merchant Guild filed a complaint about unlicensed competition. The watch is obligated to look into it.'
		],
		Hot: [
			'An undercover operation is active in this district. At least one person the broker knows is compromised.',
			"Two of the broker's suppliers were arrested last week. The broker is operating on reduced stock and elevated nerves.",
			'The watch made an unannounced visit to the cover business. They left without finding anything. They will return.'
		],
		Burning: [
			'A raid is expected within days. The broker is liquidating quickly and plans to vanish.',
			"An informant inside this market has been confirmed. The broker doesn't know which customer it is.",
			'The cover has been formally flagged by city inspectors. The next visit will not be a routine check.'
		]
	};

	// ── Generation ────────────────────────────────────────────────────────────────
	function makeName(rng: () => number): string {
		return `${pick(FIRST_NAMES, rng)} ${pick(LAST_NAMES, rng)}`;
	}

	function generateMarket(): MarketData {
		const marketName = pick(MARKET_NAMES, mkRng(hashSeed('mname', seed)));
		const location = pick(LOCATIONS, mkRng(hashSeed('loc', seed)));
		const accessMethod = pick(ACCESS_METHODS, mkRng(hashSeed('access', seed)));
		const cover = pick(COVERS, mkRng(hashSeed('cover', seed)));

		const heatRng = mkRng(hashSeed('heat', seed));
		const heatRoll = heatRng();
		let heatLevel: HeatLevel;
		if (heatRoll < 0.3) heatLevel = 'Cold';
		else if (heatRoll < 0.6) heatLevel = 'Warm';
		else if (heatRoll < 0.85) heatLevel = 'Hot';
		else heatLevel = 'Burning';
		const heatNote = pick(HEAT_NOTES[heatLevel], mkRng(hashSeed('heat-note', seed)));

		const broker: Broker = {
			name: makeName(mkRng(hashSeed('broker', seed))),
			trait: pick(BROKER_TRAITS, mkRng(hashSeed('b-trait', seed))),
			specialty: pick(BROKER_SPECIALTIES, mkRng(hashSeed('b-spec', seed)))
		};

		// Items — 5–7 from pool
		const itemRng = mkRng(hashSeed('item-count', seed));
		const numItems = 5 + Math.floor(itemRng() * 3); // 5–7
		const items = shuffle(ITEM_POOL, mkRng(hashSeed('items', seed))).slice(0, numItems);

		const condition = pick(CONDITIONS, mkRng(hashSeed('condition', seed)));
		const rule = pick(RULES, mkRng(hashSeed('rule', seed)));
		const rumor = pick(RUMORS, mkRng(hashSeed('rumor', seed)));

		return {
			marketName,
			location,
			accessMethod,
			cover,
			heatLevel,
			heatNote,
			broker,
			items,
			condition,
			rule,
			rumor
		};
	}

	function randomize() {
		seed = Math.floor(Math.random() * 1_000_000_000);
	}

	// ── Save / Load ───────────────────────────────────────────────────────────────
	interface SavedMarket {
		id: string;
		name: string;
		seed: number;
		savedAt: number;
	}
	const MARKETS_KEY = 'initiative_saved_black_markets';
	let savedMarkets = $state<SavedMarket[]>([]);
	if (typeof window !== 'undefined') {
		try {
			savedMarkets = JSON.parse(localStorage.getItem(MARKETS_KEY) ?? '[]');
		} catch {
			savedMarkets = [];
		}
	}
	function saveMarket() {
		const entry: SavedMarket = {
			id: crypto.randomUUID(),
			name: marketData?.marketName ?? 'Unknown Market',
			seed,
			savedAt: Date.now()
		};
		savedMarkets = [entry, ...savedMarkets].slice(0, 20);
		localStorage.setItem(MARKETS_KEY, JSON.stringify(savedMarkets));
	}
	function deleteMarket(id: string) {
		savedMarkets = savedMarkets.filter((m) => m.id !== id);
		localStorage.setItem(MARKETS_KEY, JSON.stringify(savedMarkets));
	}
	function applyMarket(s: SavedMarket) {
		seed = s.seed;
	}

	// ── Color maps ────────────────────────────────────────────────────────────────
	const HEAT_COLORS: Record<HeatLevel, string> = {
		Cold: 'bg-blue-900/50 text-blue-300',
		Warm: 'bg-yellow-900/50 text-yellow-400',
		Hot: 'bg-orange-900/50 text-orange-400',
		Burning: 'bg-red-900/60 text-red-400'
	};

	const STATUS_COLORS: Record<LegalStatus, string> = {
		Contraband: 'bg-red-900/50 text-red-300',
		Restricted: 'bg-orange-900/50 text-orange-300',
		Stolen: 'bg-rose-900/50 text-rose-300',
		Prohibited: 'bg-red-950/70 text-red-200',
		Regulated: 'bg-yellow-900/40 text-yellow-400'
	};

	const RISK_COLORS: Record<ItemRisk, string> = {
		Low: 'bg-green-900/50 text-green-300',
		Medium: 'bg-yellow-900/50 text-yellow-400',
		High: 'bg-orange-900/50 text-orange-400',
		Extreme: 'bg-red-900/60 text-red-400'
	};

	$effect(() => {
		marketData = generateMarket();
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
	{#if !embedded}
		<div
			class="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900/80 px-5 py-3"
		>
			<div class="flex items-center gap-3">
				<h2 class="text-lg font-bold tracking-wide text-amber-300">Black Market Generator</h2>
				{#if marketData}
					<span class="text-xs text-gray-500">{marketData.marketName}</span>
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

	<div class="relative flex min-h-0 flex-1 overflow-hidden">
		<!-- Left panel -->
		<div
			class="hidden w-56 shrink-0 flex-col gap-5 overflow-y-auto border-r border-gray-800 bg-gray-900/60 p-4 sm:flex"
		>
			<button
				onclick={randomize}
				class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
			>
				Generate New Market
			</button>

			{#if marketData}
				<button
					onclick={saveMarket}
					class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
				>
					Save Market
				</button>
			{/if}

			{#if savedMarkets.length}
				<div class="flex flex-col gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
						>Saved Markets</span
					>
					<div class="flex max-h-64 flex-col gap-1 overflow-y-auto">
						{#each savedMarkets as s (s.id)}
							<div class="flex items-center gap-1 rounded bg-gray-800/80 px-2 py-1.5">
								<button
									onclick={() => applyMarket(s)}
									class="min-w-0 flex-1 truncate text-left text-xs text-gray-200 hover:text-amber-400"
									title={s.name}>{s.name}</button
								>
								<button
									onclick={() => deleteMarket(s.id)}
									class="shrink-0 text-[11px] leading-none text-gray-600 hover:text-red-400"
									aria-label="Delete"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button
								>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Right panel -->
		<div class="min-w-0 flex-1 overflow-y-auto p-5">
			{#if marketData}
				<!-- Banner -->
				<div class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h2 class="text-2xl font-bold tracking-wide text-white">{marketData.marketName}</h2>
							<p class="mt-0.5 text-sm text-gray-400 italic">{marketData.location}.</p>
						</div>
						<span
							class="rounded px-2.5 py-1 text-xs font-bold tracking-widest uppercase {HEAT_COLORS[
								marketData.heatLevel
							]}"
						>
							Heat: {marketData.heatLevel}
						</span>
					</div>
					<div class="mt-3 grid grid-cols-1 gap-1 text-xs text-gray-400 sm:grid-cols-2">
						<p>
							<span class="text-gray-600">Cover:</span>
							{marketData.cover}.
						</p>
						<p>
							<span class="text-gray-600">Access:</span>
							{marketData.accessMethod}.
						</p>
					</div>
					<p class="mt-2 text-xs text-gray-500 italic">{marketData.heatNote}</p>
				</div>

				<div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
					<!-- Broker -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-amber-500 uppercase">Broker</h3>
						<p class="mb-1 text-sm font-bold text-gray-100">{marketData.broker.name}</p>
						<p class="mb-1 text-xs text-gray-500 italic">
							Specializes in {marketData.broker.specialty}.
						</p>
						<p class="text-xs leading-relaxed text-gray-400">{marketData.broker.trait}.</p>
					</div>

					<!-- Today's Condition -->
					<div class="rounded-xl border border-orange-900/30 bg-orange-950/10 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-orange-400 uppercase">
							Today's Condition
						</h3>
						<p class="mb-1 text-sm font-semibold text-gray-200">{marketData.condition.type}</p>
						<p class="text-xs leading-relaxed text-gray-400">{marketData.condition.description}</p>
					</div>

					<!-- Inventory -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4 xl:col-span-2">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-amber-500 uppercase">
							Current Inventory
						</h3>
						<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
							{#each marketData.items as item}
								<div class="rounded-lg border border-gray-700/50 bg-gray-900/40 px-3 py-2.5">
									<!-- Name + badges -->
									<div class="mb-1 flex flex-wrap items-start gap-1.5">
										<span class="text-sm font-bold text-gray-100">{item.name}</span>
										<span
											class="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase {STATUS_COLORS[
												item.status
											]}">{item.status}</span
										>
										<span
											class="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase {RISK_COLORS[
												item.risk
											]}">Risk: {item.risk}</span
										>
									</div>
									<!-- Description -->
									<p class="mb-2 text-[11px] leading-snug text-gray-500 italic">
										{item.description}
									</p>
									<!-- Pricing -->
									<div class="mb-1.5 grid grid-cols-3 gap-1 text-[10px]">
										<div>
											<p class="tracking-wider text-gray-600 uppercase">Legal</p>
											<p class="font-semibold text-gray-400">{item.legalPrice}</p>
										</div>
										<div>
											<p class="tracking-wider text-gray-600 uppercase">Street</p>
											<p class="font-bold text-amber-400">{item.streetPrice}</p>
										</div>
										<div>
											<p class="tracking-wider text-gray-600 uppercase">Markup</p>
											<p
												class="font-semibold {item.markup.startsWith('-')
													? 'text-green-400'
													: item.markup === '—'
														? 'text-gray-600'
														: 'text-orange-400'}"
											>
												{item.markup}
											</p>
										</div>
									</div>
									<!-- Note -->
									<p class="text-[11px] leading-snug text-gray-500 italic">{item.note}</p>
								</div>
							{/each}
						</div>
					</div>

					<!-- House Rule & Rumor -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							House Rule
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 italic">"{marketData.rule}"</p>
					</div>

					<div class="rounded-xl border border-purple-900/30 bg-purple-950/10 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-purple-400 uppercase">
							Word on the Street
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 italic">{marketData.rumor}</p>
					</div>
				</div>

				<!-- Mobile regenerate -->
				<div class="mt-6 flex gap-3 sm:hidden">
					<button
						onclick={randomize}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						New Market
					</button>
					<button
						onclick={saveMarket}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						Save
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
