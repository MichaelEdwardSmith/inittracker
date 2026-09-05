<!-- Trade Caravan Generator -->
<script lang="ts">
	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	// ── Types ─────────────────────────────────────────────────────────────────────
	interface CargoItem {
		goods: string;
		quantity: string;
		value: string;
		note: string;
	}

	interface Guard {
		name: string;
		role: string;
		description: string;
	}

	interface Complication {
		type: string;
		summary: string;
		detail: string;
	}

	interface CaravanData {
		masterName: string;
		masterTrait: string;
		origin: string;
		destination: string;
		routeType: string;
		daysOut: number;
		daysRemaining: number;
		currentLocation: string;
		caravanSize: string;
		wagonCount: number;
		cargo: CargoItem[];
		secretCargo: CargoItem | null;
		guards: Guard[];
		guardQuality: 'Rabble' | 'Adequate' | 'Professional' | 'Elite';
		complication: Complication;
		rumor: string;
	}

	// ── Controls ──────────────────────────────────────────────────────────────────
	let seed = $state(Math.floor(Math.random() * 1_000_000_000));
	let caravanData = $state<CaravanData | null>(null);

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

	const FIRST_NAMES = [
		'Aldous',
		'Bram',
		'Cass',
		'Dorn',
		'Edra',
		'Fitch',
		'Garvin',
		'Hesta',
		'Ivo',
		'Jura',
		'Kern',
		'Lida',
		'Morten',
		'Nessa',
		'Orvin',
		'Petra',
		'Quell',
		'Reva',
		'Stenn',
		'Tova',
		'Ulf',
		'Vessa',
		'Weld',
		'Yara',
		'Zorn',
		'Anika',
		'Brek',
		'Colta',
		'Daveth',
		'Elsa'
	];
	const LAST_NAMES = [
		'Ashford',
		'Barley',
		'Coinsworth',
		'Dray',
		'Escott',
		'Fullmer',
		'Greel',
		'Hobb',
		'Inkwood',
		'Jarvis',
		'Kell',
		'Lutton',
		'Mercer',
		'Nole',
		'Orvyn',
		'Packard',
		'Quint',
		'Rafter',
		'Stover',
		'Turnbull',
		'Umble',
		'Voss',
		'Wicker',
		'Yolt',
		'Zane',
		'Dusk',
		'Folly',
		'Granger',
		'Halter',
		'Irwin'
	];

	const MASTER_TRAITS = [
		'counts every coin twice and never forgets a debt',
		'has made this exact route forty-three times and is tired of it',
		'is relentlessly cheerful in a way that unnerves the guards',
		'drinks heavily at camp but is stone-cold sober for every transaction',
		'keeps a detailed journal of every road hazard encountered since her first run',
		'refuses to move the caravan if the omens look wrong — he has his own system',
		'never learned to read but can quote the price of six hundred goods from memory',
		'treats every merchant contact like a long-lost friend and every stranger like a threat',
		'has a habit of hiring family members, which is both his strength and his problem',
		'is scrupulously honest about prices and quantities, which makes rivals deeply suspicious',
		'runs the tightest books on the road but takes every shortcut she can find',
		'is negotiating a buyout of his own company — quietly, and not with his current partners',
		'volunteers more information than she should when nervous, which is often',
		'has a bounty outstanding in one of the cities on this route — a misunderstanding, she says'
	];

	const SETTLEMENTS = [
		'Ashford',
		'Blackmere',
		'Coldwater Crossing',
		'Dunhaven',
		'Emberton',
		'Fernwick',
		'Galeholt',
		"Harrow's End",
		'Irongate',
		'Kelwick',
		'Lornfast',
		'Millhaven',
		'Northgate',
		'Oldbury',
		'Pelm',
		'Queensreach',
		'Redstone',
		'Saltern',
		'Thornford',
		'Underpass',
		'Velmoor',
		'Westmarch',
		'Yarrow',
		'Coppergate',
		'Duskfall',
		'Eastwatch',
		'Fenport',
		'Greywall',
		'Hammerfast',
		'Ironhaven',
		'Jestholm',
		'Keld'
	];

	const ROUTE_TYPES = [
		"the King's Road — well-maintained, heavily taxed, heavily watched",
		'a river road following the Greyfen east — prone to flooding in season',
		'an old imperial highway, cracked but fast, avoided by most',
		'a mountain pass route — shorter but brutal on wagons and animals',
		'a coastal track — scenic, exposed to weather, and thick with gulls',
		'a forest road through the Thornwood — three days shorter but locally notorious',
		'a trade road maintained by the Merchant Compact — tolls at every junction',
		'a backcountry trail used by smugglers that the master quietly prefers',
		'the Dustway — flat, featureless, and relentlessly efficient',
		'a road that crosses two disputed border territories — papers must be in order'
	];

	const LOCATIONS = [
		'camped at a waystation two days from the next town',
		'passing through a stretch of open farmland',
		'stopped at a roadside inn for the night',
		'crossing a river ford that is deeper than expected',
		'on a long exposed ridgeline with no shelter',
		'approaching a garrison checkpoint on the border',
		'parked outside a small village where a wheel needs replacing',
		'resting in a wooded hollow off the main road',
		'moving through a stretch of road notorious for bandits',
		'stuck behind a slower caravan that refuses to yield the road',
		'waiting at a toll gate while papers are reviewed',
		'sheltering from weather in a partially collapsed waystation'
	];

	// ── Cargo ─────────────────────────────────────────────────────────────────────
	interface CargoEntry {
		goods: string;
		quantity: string;
		value: string;
		note: string;
	}

	const CARGO_POOL: CargoEntry[] = [
		{
			goods: 'Iron ingots',
			quantity: 'Eight crates, roughly 400 lbs',
			value: '180 gp',
			note: 'Bound for a smithy in the destination city. Heavy, boring, honest work.'
		},
		{
			goods: 'Salted fish in barrels',
			quantity: 'Twelve barrels',
			value: '60 gp',
			note: 'Two barrels have a slow leak. The smell is becoming a negotiating point.'
		},
		{
			goods: 'Bolts of undyed wool cloth',
			quantity: 'Twenty bolts',
			value: '95 gp',
			note: 'Destined for a dyer. The merchant is already two weeks late on delivery.'
		},
		{
			goods: 'Spice bundles — pepper, cumin, saffron',
			quantity: 'Fourteen sealed cases',
			value: '340 gp',
			note: 'The saffron alone makes this wagon worth watching. The master knows it.'
		},
		{
			goods: 'Hardwood timber, pre-cut',
			quantity: 'A full wagon load',
			value: '70 gp',
			note: 'For a construction project. The buyer is impatient; bonuses ride on arrival date.'
		},
		{
			goods: 'Lamp oil in sealed ceramic jugs',
			quantity: 'Thirty jugs',
			value: '45 gp',
			note: 'Fragile. The driver of this wagon moves conspicuously slowly.'
		},
		{
			goods: 'Dried herbs and medicinal supplies',
			quantity: 'Six locked chests',
			value: '210 gp',
			note: "Purchased by a healer's guild. Some components are restricted in certain jurisdictions."
		},
		{
			goods: 'Cut stone blocks, dressed and numbered',
			quantity: 'Three wagon loads',
			value: '130 gp',
			note: "For a noble's renovation project. Slow, grinding travel on anything but flat road."
		},
		{
			goods: 'Wine — mid-quality Rhaestan red',
			quantity: 'Eighteen bottles, crated',
			value: '90 gp',
			note: 'Three bottles are already missing. The master has a theory about which guard.'
		},
		{
			goods: 'Grain sacks — mixed wheat and rye',
			quantity: 'Forty sacks',
			value: '55 gp',
			note: 'Moving toward a city that had a poor harvest. Price will be significantly higher on arrival.'
		},
		{
			goods: 'Tanned leather hides',
			quantity: 'Two bundled wagon loads',
			value: '160 gp',
			note: 'High quality. Bound for a military contractor making saddles and armour components.'
		},
		{
			goods: 'Candles and rendered tallow',
			quantity: 'Eight crates',
			value: '30 gp',
			note: 'Boring but reliable. The master uses this load as cover for other cargo.'
		},
		{
			goods: 'Glass panes, padded in straw',
			quantity: 'Forty panes of varying size',
			value: '200 gp',
			note: 'Extremely fragile. Every rut in the road is an anxious event.'
		},
		{
			goods: 'Alchemical reagents in wax-sealed vials',
			quantity: 'Two locked cases',
			value: '420 gp',
			note: 'Manifested as "chemical supplies." Technically legal. The border guards always look twice.'
		},
		{
			goods: 'Live chickens in stacked cages',
			quantity: 'Eighty birds',
			value: '20 gp',
			note: 'Loud. Smelly. One cage has already opened and been recaptured. Morale is low.'
		},
		{
			goods: 'Printed books and pamphlets',
			quantity: 'Four crates',
			value: '150 gp',
			note: 'Academic texts for a university. One crate is sealed separately and not on the manifest.'
		},
		{
			goods: 'Fine porcelain, nested and wrapped',
			quantity: 'Two crates',
			value: '280 gp',
			note: 'A wedding gift from a distant noble family. Irreplaceable. The master checks on it personally every stop.'
		},
		{
			goods: 'Salt blocks',
			quantity: 'Six wagon loads',
			value: '85 gp',
			note: 'Bulk commodity. The profit margin is thin but the volume makes it worthwhile.'
		},
		{
			goods: 'Rope — hemp and twisted silk varieties',
			quantity: 'Twelve coils of each',
			value: '40 gp',
			note: 'Bound for a port city. Someone made a very large order of the silk rope specifically.'
		},
		{
			goods: 'Preserved fruit and candied nuts',
			quantity: 'Twenty sealed jars and crates',
			value: '75 gp',
			note: 'Luxury provisions for a noble household. One jar has been opened and resealed badly.'
		}
	];

	const SECRET_CARGO_POOL: CargoEntry[] = [
		{
			goods: 'Forged trade permits — blank, stamped, ready to fill',
			quantity: 'A leather folio of sixty sheets',
			value: '800 gp to the right buyer',
			note: "Hidden in a false floor beneath the master's personal wagon. She doesn't discuss this."
		},
		{
			goods: 'A wanted individual, sedated and crated',
			quantity: 'One medium crate, ventilated',
			value: 'Contract value unknown',
			note: 'Listed as "specialty livestock." Moved twice daily for water. No one else knows.'
		},
		{
			goods: 'Stolen religious relics, wrapped in oilcloth',
			quantity: 'Seven items of varying size',
			value: '1,200 gp to a private collector',
			note: 'The church they came from is offering a reward. The buyer is offering more.'
		},
		{
			goods: 'Contraband narcotics pressed into soap blocks',
			quantity: 'Forty "soap" blocks across three crates',
			value: '600 gp wholesale',
			note: 'The master was paid to carry these and genuinely does not know what they are. Or claims not to.'
		},
		{
			goods: 'A sealed diplomatic correspondence pouch',
			quantity: "One pouch, wax-sealed with a minor noble's crest",
			value: 'Unknown — not for sale',
			note: 'The master is being paid to deliver this personally and ask no questions. She has questions.'
		},
		{
			goods: 'Blackmail documentation in a lacquered box',
			quantity: 'One box, locked',
			value: '500 gp to the subject; more to their enemies',
			note: "The master acquired this in lieu of a debt. She hasn't decided what to do with it yet."
		},
		{
			goods: 'A smuggled arcane focusing crystal, unregistered',
			quantity: 'One crystal, the size of a fist',
			value: '900 gp on the grey market',
			note: 'Wrapped in lead foil to suppress detection. Hidden in the axle compartment of wagon three.'
		},
		{
			goods: 'Counterfeit gold coins, convincingly struck',
			quantity: 'Two hundred coins in a canvas bag',
			value: 'Face value 200 gp; actual value 12 gp in base metal',
			note: 'Somewhere in the normal coin purse. Even the master may not know which coins are false.'
		}
	];

	// ── Guards ────────────────────────────────────────────────────────────────────
	const GUARD_QUALITIES = ['Rabble', 'Adequate', 'Professional', 'Elite'] as const;

	const GUARD_ROLES_BY_QUALITY: Record<string, { role: string; desc: string }[]> = {
		Rabble: [
			{
				role: 'Guard',
				desc: "Hired at the last waystation. Hasn't sharpened his sword in months. Asks too many questions about what's in the wagons."
			},
			{
				role: 'Guard',
				desc: 'Two sisters, both technically employed. One is competent. The other is there because of the first.'
			},
			{
				role: 'Guard',
				desc: 'Former farm laborer who owns a spear and technically knows how to hold it.'
			},
			{
				role: 'Driver / Guard',
				desc: "Drives wagon two and carries a crossbow she's never actually fired at anything living."
			}
		],
		Adequate: [
			{
				role: 'Guard Captain',
				desc: 'Retired city watchman. Competent, methodical, and deeply unimaginative. Gets the job done.'
			},
			{
				role: 'Scout',
				desc: 'Rides a quarter-mile ahead of the column. Has an excellent instinct for trouble and an average instinct for self-preservation.'
			},
			{
				role: 'Guard',
				desc: 'Ex-soldier who took this job when the company disbanded. Professional enough, but clearly overqualified.'
			},
			{
				role: 'Guard',
				desc: 'Young and eager to prove herself. Has not yet learned that eagerness gets people killed on the road.'
			},
			{
				role: 'Guard',
				desc: "Veteran of three caravan runs. Reliable but jumpy at night — he's seen something that stayed with him."
			}
		],
		Professional: [
			{
				role: 'Guard Captain',
				desc: "Licensed through the Wayfarers' Guild. Runs tight rotations, no gambling on shift, no drinking until camp. Unpopular and effective."
			},
			{
				role: 'Outrider',
				desc: 'Mounted, fast, and equipped to handle light skirmishers. Has a reputation in three regions.'
			},
			{
				role: 'Outrider',
				desc: "Her partner and counterpart. They don't speak much but communicate perfectly in the field."
			},
			{
				role: 'Guard',
				desc: 'Former soldier with scars that tell a longer story than he does. Does his job without complaint or commentary.'
			},
			{
				role: 'Guard',
				desc: 'Specialist in ambush detection — specifically hired after the last caravan on this route was hit.'
			},
			{
				role: 'Medic / Guard',
				desc: 'Can stitch a wound and hold a sword. Neither as well as a specialist, but far better than nothing.'
			}
		],
		Elite: [
			{
				role: 'Guard Captain',
				desc: 'Veteran mercenary commander. Three decades on the road. Has turned down every offer to stop doing this.'
			},
			{
				role: 'Outrider',
				desc: 'Half-elf scout who has worked this route for twenty years. Knows every ambush site, every informant, and every corrupt checkpoint officer.'
			},
			{
				role: 'Outrider',
				desc: 'Former cavalry officer. Fights with disciplined economy and a complete absence of panic.'
			},
			{
				role: 'Mage',
				desc: 'A hedge wizard under retainer — not powerful, but enough to counter most roadside threats. Invaluable for detecting magical tampering.'
			},
			{
				role: 'Guard',
				desc: 'A retired adventurer who took this contract as "simple work." Has already identified three things about this caravan that concern her.'
			},
			{
				role: 'Guard',
				desc: "A specialist in personal protection, here to watch the cargo master specifically. She hasn't said who hired her for that."
			}
		]
	};

	// ── Complications ─────────────────────────────────────────────────────────────
	interface ComplicationEntry {
		type: string;
		summary: string;
		detail: string;
	}

	const COMPLICATIONS: ComplicationEntry[] = [
		{
			type: 'Bandit Intelligence',
			summary: 'Someone sold the route',
			detail:
				"A bandit crew has advance knowledge of the caravan's schedule, cargo value, and guard count. They are currently positioned two hours ahead on the road. The information came from inside — someone on this caravan is being paid, or threatened."
		},
		{
			type: 'Cargo Dispute',
			summary: "The consignment papers don't match",
			detail:
				"At the last checkpoint, a border official flagged a discrepancy between the manifest and the actual goods in wagon three. The master has been arguing it's a clerical error for six hours. The official wants a bribe. The master refuses on principle. The caravan is parked."
		},
		{
			type: 'Sick Animal',
			summary: 'Two draft horses are ailing',
			detail:
				"The lead pair on the heaviest wagon have developed a respiratory illness. They can still pull, but the pace has dropped and the master is worried. If they don't reach the next town by nightfall, she'll have to offload cargo and find replacement animals — at a significant loss."
		},
		{
			type: 'Internal Theft',
			summary: 'Something is missing from a sealed crate',
			detail:
				'One of the cargo crates was opened in transit and partially emptied. The seals were re-applied carefully. Only someone with access and knowledge of the manifest could have done it. Every guard and driver is under suspicion. Morale is deteriorating.'
		},
		{
			type: 'Stowaway',
			summary: 'Someone is hiding in the cargo',
			detail:
				'A stowaway was discovered in a grain sack wagon — a young person, dehydrated, clearly running from something. They have no coin and no papers. The master is debating whether to hand them to the authorities at the next checkpoint, leave them at the road, or let them ride. The guards have opinions.'
		},
		{
			type: 'Road Blocked',
			summary: 'The primary route is impassable',
			detail:
				"A bridge on the main road collapsed four days ago — recent rains, nobody's fault. The alternative route adds three days and passes through territory with an active tax dispute. The master has two options and dislikes both."
		},
		{
			type: 'Rival Caravan',
			summary: 'Competition is playing dirty',
			detail:
				"A rival trading company's caravan is running the same route, two days behind. Someone has been leaving misleading markers on the road and spreading rumors at waystations that the master's cargo is carrying plague. It's not. But the rumors have already reached the next town."
		},
		{
			type: 'Guard Desertion',
			summary: 'Half the protection just quit',
			detail:
				"Three guards walked off the job at the last camp. They were overheard saying the contract wasn't worth whatever they think is on this caravan. The master offered double pay. Two refused anyway. The caravan is now significantly underguarded in a stretch of road that doesn't permit it."
		},
		{
			type: 'Noble Claim',
			summary: 'A lord is asserting right of seizure',
			detail:
				'A local noble is claiming that the caravan is carrying goods that were stolen from his estate three transactions ago. His riders intercepted the column this morning. The goods in question were legitimately purchased — the master has papers — but the noble is not interested in papers. He wants the goods.'
		},
		{
			type: 'Magical Cargo',
			summary: 'Something in the manifest is active',
			detail:
				'A crate that was consigned as "decorative stonework" has been emitting a faint, intermittent glow since the second day out. The master doesn\'t know what it is. The guards are deeply unhappy about it. Opening it requires breaking the consignment seal, which voids the contract.'
		},
		{
			type: 'Debt Collector',
			summary: 'The master has a past catching up',
			detail:
				"A creditor's enforcer has been tracking this caravan for three days. The master owes a significant sum to a merchant house and missed the payment deadline by a month. The enforcer is not here to negotiate — he's here to attach the cargo as collateral. Technically, the law is on his side."
		},
		{
			type: 'Weather',
			summary: 'A serious storm is closing in',
			detail:
				"Local farmers at the last waystation warned of a storm system coming in from the west — the kind that floods the river ford on this route for three to five days. The master can push hard and potentially beat it, or stop now and shelter. She's pushing. She may be wrong."
		},
		{
			type: 'Passenger Problem',
			summary: 'A paying passenger is more than they seem',
			detail:
				"The caravan took on a paying passenger at the origin city — a well-dressed merchant, polite, no trouble. Last night one of the guards saw him signaling toward the tree line at the edge of camp. When confronted, he had an explanation. It was a very good explanation. The guard isn't sure she believes it."
		},
		{
			type: 'Contested Goods',
			summary: 'Two buyers claim the same shipment',
			detail:
				'The master sold transit rights to one cargo consignment twice — an administrative error, she insists. Both buyers have sent representatives to meet the caravan at the destination. The cargo cannot be split. One of the representatives has made it clear their employer does not accept refunds.'
		}
	];

	// ── Rumors ────────────────────────────────────────────────────────────────────
	const RUMORS = [
		"There's a new toll collector on the main road ahead who is not, apparently, an official toll collector.",
		"The waystation two days out burned down last week. The cause hasn't been determined.",
		"A bounty hunter was seen at the last inn, asking questions about a caravan matching this one's description.",
		"Bandits hit a courier on this road three days ago. The courier survived. The message didn't.",
		'One of the guards has been writing letters every night and leaving them at road markers. No one has asked who for.',
		"The master turned down a cargo pickup in the origin city that would have paid triple the current load. She won't explain why.",
		'The next town is under a trade embargo from the Merchant Compact. Papers may not be enough to get through.',
		'Something died in the tree line last night. The horses have been nervous ever since.',
		"A guard mentioned in passing that this is the fourth time she's run this particular route for this particular master. She looks like she regrets it.",
		'The manifest lists fourteen crates. There are fifteen on the wagon.'
	];

	// ── Generation ────────────────────────────────────────────────────────────────
	function makeName(rng: () => number): string {
		return `${pick(FIRST_NAMES, rng)} ${pick(LAST_NAMES, rng)}`;
	}

	function generateCaravan(): CaravanData {
		const masterName = makeName(mkRng(hashSeed('master', seed)));
		const masterTrait = pick(MASTER_TRAITS, mkRng(hashSeed('trait', seed)));

		// Origin and destination — must differ
		const settlementPool = shuffle(SETTLEMENTS, mkRng(hashSeed('settlements', seed)));
		const origin = settlementPool[0];
		const destination = settlementPool[1];

		const routeType = pick(ROUTE_TYPES, mkRng(hashSeed('route', seed)));

		const daysRng = mkRng(hashSeed('days', seed));
		const totalDays = 4 + Math.floor(daysRng() * 10); // 4–13 days total
		const daysOut = 1 + Math.floor(daysRng() * (totalDays - 1));
		const daysRemaining = totalDays - daysOut;
		const currentLocation = pick(LOCATIONS, mkRng(hashSeed('location', seed)));

		// Caravan size
		const sizeRng = mkRng(hashSeed('size', seed));
		const sizeRoll = sizeRng();
		let caravanSize: string;
		let wagonCount: number;
		if (sizeRoll < 0.25) {
			caravanSize = 'Small';
			wagonCount = 2 + Math.floor(sizeRng() * 3); // 2–4
		} else if (sizeRoll < 0.65) {
			caravanSize = 'Medium';
			wagonCount = 5 + Math.floor(sizeRng() * 4); // 5–8
		} else {
			caravanSize = 'Large';
			wagonCount = 9 + Math.floor(sizeRng() * 6); // 9–14
		}

		// Cargo — 3–4 items
		const cargoRng = mkRng(hashSeed('cargo', seed));
		const numCargo = cargoRng() < 0.4 ? 3 : 4;
		const cargo = shuffle(CARGO_POOL, mkRng(hashSeed('cargo-pool', seed))).slice(0, numCargo);

		// Secret cargo — 35% chance
		const secretRng = mkRng(hashSeed('secret', seed));
		const secretCargo =
			secretRng() < 0.35 ? pick(SECRET_CARGO_POOL, mkRng(hashSeed('secret-item', seed))) : null;

		// Guard quality — weighted
		const guardRng = mkRng(hashSeed('guard-q', seed));
		const guardRoll = guardRng();
		let guardQuality: CaravanData['guardQuality'];
		if (guardRoll < 0.2) guardQuality = 'Rabble';
		else if (guardRoll < 0.55) guardQuality = 'Adequate';
		else if (guardRoll < 0.85) guardQuality = 'Professional';
		else guardQuality = 'Elite';

		const guardRolePool = shuffle(
			GUARD_ROLES_BY_QUALITY[guardQuality],
			mkRng(hashSeed('guard-roles', seed))
		);
		const numGuards =
			guardQuality === 'Rabble'
				? 2 + Math.floor(guardRng() * 2)
				: guardQuality === 'Adequate'
					? 3 + Math.floor(guardRng() * 2)
					: guardQuality === 'Professional'
						? 4 + Math.floor(guardRng() * 2)
						: 4 + Math.floor(guardRng() * 3);
		const guardSlots = guardRolePool.slice(0, Math.min(numGuards, guardRolePool.length));
		const guards: Guard[] = guardSlots.map((g, i) => ({
			name: makeName(mkRng(hashSeed(`guard-name-${i}`, seed))),
			role: g.role,
			description: g.desc
		}));

		const complication = pick(COMPLICATIONS, mkRng(hashSeed('complication', seed)));
		const rumor = pick(RUMORS, mkRng(hashSeed('rumor', seed)));

		return {
			masterName,
			masterTrait,
			origin,
			destination,
			routeType,
			daysOut,
			daysRemaining,
			currentLocation,
			caravanSize,
			wagonCount,
			cargo,
			secretCargo,
			guards,
			guardQuality,
			complication,
			rumor
		};
	}

	function randomize() {
		seed = Math.floor(Math.random() * 1_000_000_000);
	}

	// ── Save / Load ───────────────────────────────────────────────────────────────
	interface SavedCaravan {
		id: string;
		name: string;
		seed: number;
		savedAt: number;
	}
	const CARAVANS_KEY = 'initiative_saved_caravans';
	let savedCaravans = $state<SavedCaravan[]>([]);
	if (typeof window !== 'undefined') {
		try {
			savedCaravans = JSON.parse(localStorage.getItem(CARAVANS_KEY) ?? '[]');
		} catch {
			savedCaravans = [];
		}
	}
	function saveCaravan() {
		if (!caravanData) return;
		const entry: SavedCaravan = {
			id: crypto.randomUUID(),
			name: `${caravanData.origin} → ${caravanData.destination}`,
			seed,
			savedAt: Date.now()
		};
		savedCaravans = [entry, ...savedCaravans].slice(0, 20);
		localStorage.setItem(CARAVANS_KEY, JSON.stringify(savedCaravans));
	}
	function deleteSavedCaravan(id: string) {
		savedCaravans = savedCaravans.filter((c) => c.id !== id);
		localStorage.setItem(CARAVANS_KEY, JSON.stringify(savedCaravans));
	}
	function applyCaravan(s: SavedCaravan) {
		seed = s.seed;
	}

	// ── Color maps ────────────────────────────────────────────────────────────────
	const GUARD_QUALITY_COLORS: Record<CaravanData['guardQuality'], string> = {
		Rabble: 'bg-red-900/50 text-red-400',
		Adequate: 'bg-yellow-900/50 text-yellow-400',
		Professional: 'bg-green-900/50 text-green-300',
		Elite: 'bg-blue-900/50 text-blue-300'
	};

	const SIZE_COLORS: Record<string, string> = {
		Small: 'bg-gray-700 text-gray-300',
		Medium: 'bg-amber-900/50 text-amber-300',
		Large: 'bg-indigo-900/50 text-indigo-300'
	};

	const COMPLICATION_COLORS: Record<string, string> = {
		'Bandit Intelligence': 'bg-red-900/50 text-red-300',
		'Cargo Dispute': 'bg-orange-900/50 text-orange-300',
		'Sick Animal': 'bg-yellow-900/50 text-yellow-300',
		'Internal Theft': 'bg-rose-900/50 text-rose-300',
		Stowaway: 'bg-teal-900/50 text-teal-300',
		'Road Blocked': 'bg-gray-700 text-gray-300',
		'Rival Caravan': 'bg-purple-900/50 text-purple-300',
		'Guard Desertion': 'bg-red-900/50 text-red-400',
		'Noble Claim': 'bg-amber-900/50 text-amber-300',
		'Magical Cargo': 'bg-violet-900/50 text-violet-300',
		'Debt Collector': 'bg-orange-900/50 text-orange-400',
		Weather: 'bg-blue-900/50 text-blue-300',
		'Passenger Problem': 'bg-purple-900/50 text-purple-400',
		'Contested Goods': 'bg-red-900/50 text-red-300'
	};

	$effect(() => {
		caravanData = generateCaravan();
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
				<h2 class="text-lg font-bold tracking-wide text-amber-300">Trade Caravan Generator</h2>
				{#if caravanData}
					<span class="text-xs text-gray-500"
						>{caravanData.origin}
						<i class="fa-duotone fa-light fa-arrow-right" aria-hidden="true"></i>
						{caravanData.destination}</span
					>
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

	<!-- Body -->
	<div class="relative flex min-h-0 flex-1 overflow-hidden">
		<!-- Left panel -->
		<div
			class="hidden w-56 shrink-0 flex-col gap-5 overflow-y-auto border-r border-gray-800 bg-gray-900/60 p-4 sm:flex"
		>
			<button
				onclick={randomize}
				class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
			>
				Generate New Caravan
			</button>

			{#if caravanData}
				<button
					onclick={saveCaravan}
					class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
				>
					Save Caravan
				</button>
			{/if}

			{#if savedCaravans.length}
				<div class="flex flex-col gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
						>Saved Caravans</span
					>
					<div class="flex max-h-64 flex-col gap-1 overflow-y-auto">
						{#each savedCaravans as s (s.id)}
							<div class="flex items-center gap-1 rounded bg-gray-800/80 px-2 py-1.5">
								<button
									onclick={() => applyCaravan(s)}
									class="min-w-0 flex-1 truncate text-left text-xs text-gray-200 hover:text-amber-400"
									title={s.name}>{s.name}</button
								>
								<button
									onclick={() => deleteSavedCaravan(s.id)}
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

		<!-- Right panel -->
		<div class="min-w-0 flex-1 overflow-y-auto p-5">
			{#if caravanData}
				<!-- ── Banner ──────────────────────────────────────────────────── -->
				<div class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<div class="flex flex-wrap items-baseline gap-3">
								<h2 class="text-2xl font-bold text-white">
									{caravanData.origin}
									<span class="text-gray-500"
										><i class="fa-duotone fa-light fa-arrow-right" aria-hidden="true"></i></span
									>
									{caravanData.destination}
								</h2>
								<span
									class="rounded px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase {SIZE_COLORS[
										caravanData.caravanSize
									]}"
								>
									{caravanData.caravanSize} Caravan
								</span>
							</div>
							<p class="mt-1 text-sm text-gray-400">
								<span class="font-semibold text-gray-200">{caravanData.masterName}</span>, Caravan
								Master —
								<span class="text-gray-500 italic">{caravanData.masterTrait}.</span>
							</p>
						</div>
					</div>
					<div class="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-400 sm:grid-cols-4">
						<p>
							<span class="text-gray-600">Wagons</span><br />
							<span class="font-semibold text-gray-200">{caravanData.wagonCount}</span>
						</p>
						<p>
							<span class="text-gray-600">Days out</span><br />
							<span class="font-semibold text-gray-200">{caravanData.daysOut}</span>
						</p>
						<p>
							<span class="text-gray-600">Days remaining</span><br />
							<span class="font-semibold text-gray-200">{caravanData.daysRemaining}</span>
						</p>
						<p>
							<span class="text-gray-600">Guards</span><br />
							<span
								class="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase {GUARD_QUALITY_COLORS[
									caravanData.guardQuality
								]}">{caravanData.guardQuality}</span
							>
						</p>
					</div>
					<p class="mt-2 text-xs text-gray-500">
						<span class="text-gray-600">Route:</span>
						{caravanData.routeType}.
					</p>
					<p class="mt-1 text-xs text-gray-500">
						<span class="text-gray-600">Currently:</span>
						{caravanData.currentLocation}.
					</p>
				</div>

				<!-- ── Main grid ───────────────────────────────────────────────── -->
				<div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
					<!-- Cargo Manifest -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-amber-500 uppercase">
							Cargo Manifest
						</h3>
						<div class="flex flex-col gap-2">
							{#each caravanData.cargo as item}
								<div class="rounded-lg border border-gray-700/50 bg-gray-900/40 px-3 py-2">
									<p class="mb-0.5 text-sm font-semibold text-gray-100">{item.goods}</p>
									<p class="mb-1 text-[11px] text-gray-500">{item.quantity}</p>
									<div class="flex items-start justify-between gap-2">
										<p class="text-[11px] leading-snug text-gray-400 italic">{item.note}</p>
										<span class="shrink-0 text-xs font-bold text-amber-400">{item.value}</span>
									</div>
								</div>
							{/each}

							{#if caravanData.secretCargo}
								<div class="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2">
									<div class="mb-0.5 flex items-center gap-2">
										<p class="text-sm font-semibold text-gray-100">
											{caravanData.secretCargo.goods}
										</p>
										<span
											class="rounded bg-red-900/50 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-red-400 uppercase"
											>Not on Manifest</span
										>
									</div>
									<p class="mb-1 text-[11px] text-gray-500">
										{caravanData.secretCargo.quantity}
									</p>
									<div class="flex items-start justify-between gap-2">
										<p class="text-[11px] leading-snug text-gray-400 italic">
											{caravanData.secretCargo.note}
										</p>
										<span class="shrink-0 text-xs font-bold text-amber-400"
											>{caravanData.secretCargo.value}</span
										>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Guards -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<div class="mb-3 flex items-center gap-2">
							<h3 class="text-xs font-bold tracking-widest text-amber-500 uppercase">Guards</h3>
							<span
								class="rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase {GUARD_QUALITY_COLORS[
									caravanData.guardQuality
								]}">{caravanData.guardQuality}</span
							>
						</div>
						<div class="flex flex-col gap-2">
							{#each caravanData.guards as guard}
								<div class="rounded-lg border border-gray-700/50 bg-gray-900/40 px-3 py-2">
									<div class="mb-0.5 flex flex-wrap items-baseline gap-2">
										<span class="text-sm font-bold text-gray-100">{guard.name}</span>
										<span class="text-[10px] font-semibold tracking-wider text-amber-500 uppercase"
											>{guard.role}</span
										>
									</div>
									<p class="text-xs leading-snug text-gray-400">{guard.description}</p>
								</div>
							{/each}
						</div>
					</div>

					<!-- Complication -->
					<div class="rounded-xl border border-red-900/30 bg-red-950/10 p-4 xl:col-span-2">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-red-400 uppercase">
							Complication
						</h3>
						<div class="mb-2 flex flex-wrap items-center gap-2">
							<span
								class="rounded px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase {COMPLICATION_COLORS[
									caravanData.complication.type
								] ?? 'bg-gray-700 text-gray-300'}"
							>
								{caravanData.complication.type}
							</span>
							<span class="text-sm font-semibold text-gray-200"
								>{caravanData.complication.summary}</span
							>
						</div>
						<p class="text-sm leading-relaxed text-gray-300">{caravanData.complication.detail}</p>
					</div>

					<!-- Rumor -->
					<div class="rounded-xl border border-purple-900/30 bg-purple-950/10 p-4 xl:col-span-2">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-purple-400 uppercase">
							Overheard on the Road
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 italic">{caravanData.rumor}</p>
					</div>
				</div>

				<!-- Mobile regenerate -->
				<div class="mt-6 flex gap-3 sm:hidden">
					<button
						onclick={randomize}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						New Caravan
					</button>
					<button
						onclick={saveCaravan}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						Save
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
