<!-- Town Generator — table-driven building list with flavor text -->
<script lang="ts">
	import { triggerRoll } from '$lib/diceOverlay.svelte';

	interface DiceRollResult {
		expr: string;
		rolls: number[];
		sides: number;
		modifier: number;
		total: number;
	}
	let diceRollResult = $state<DiceRollResult | null>(null);
	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	// ── Town name generation ──────────────────────────────────────────────────────
	function generateTownName(): string {
		const pre = [
			'Ash',
			'Black',
			'Bright',
			'Crow',
			'Dark',
			'Dun',
			'Elder',
			'Ember',
			'Fell',
			'Grey',
			'Grim',
			'High',
			'Hollow',
			'Iron',
			'Lake',
			'Loch',
			'Marsh',
			'Mill',
			'Mist',
			'Oak',
			'Old',
			'Pine',
			'Red',
			'River',
			'Rock',
			'Salt',
			'Shadow',
			'Silver',
			'Stone',
			'Storm',
			'Thorn',
			'Thunder',
			'Timber',
			'White',
			'Willow',
			'Wind',
			'Winter',
			'Wolf'
		];
		const suf = [
			'bridge',
			'brook',
			'bury',
			'crest',
			'dale',
			'dell',
			'fall',
			'fen',
			'field',
			'ford',
			'gate',
			'grove',
			'hall',
			'ham',
			'harbor',
			'haven',
			'heath',
			'hill',
			'hold',
			'hollow',
			'holm',
			'hurst',
			'mead',
			'mere',
			'mill',
			'moor',
			'mount',
			'port',
			'reach',
			'ridge',
			'rock',
			'shore',
			'stead',
			'wick',
			'wood',
			'worth'
		];
		const r = (a: string[]) => a[Math.floor(Math.random() * a.length)];
		return r(pre) + r(suf);
	}

	type TownSize = 'thorp' | 'hamlet' | 'village' | 'town' | 'city' | 'metropolis';
	type Opulence = 'poor' | 'modest' | 'comfortable' | 'wealthy';
	type BType =
		| 'keep'
		| 'temple'
		| 'market'
		| 'guildhall'
		| 'inn'
		| 'tavern'
		| 'shop'
		| 'blacksmith'
		| 'house'
		| 'cottage'
		| 'stable'
		| 'farm'
		| 'park'
		| 'great_hall'
		| 'barracks'
		| 'armory'
		| 'chapel'
		| 'dungeon'
		| 'lord_quarters';

	interface Npc {
		name: string;
		role: string;
	}
	interface ListBuilding {
		type: BType;
		name: string;
		description: string;
		npcs: Npc[];
	}
	interface TownData {
		description: string;
		buildings: ListBuilding[];
		keepBuildings: ListBuilding[];
	}

	// ── Controls ─────────────────────────────────────────────────────────────────
	let townName = $state(generateTownName());
	let townSize = $state<TownSize>('town');
	let opulence = $state<Opulence>('modest');
	let hasKeep = $state(false);
	let seed = $state(Math.floor(Math.random() * 1_000_000_000));
	let townData = $state<TownData | null>(null);

	// ── RNG ──────────────────────────────────────────────────────────────────────
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
	function pname(rng: () => number): string {
		return `${pick(rng() < 0.5 ? FM : FF, rng)} ${pick(LAST, rng)}`;
	}

	// ── Building counts by town size ──────────────────────────────────────────────
	const COUNTS: Record<TownSize, Partial<Record<BType, number>>> = {
		thorp: { inn: 1, shop: 1, blacksmith: 1, stable: 1, cottage: 4, farm: 3 },
		hamlet: {
			inn: 1,
			tavern: 1,
			temple: 1,
			shop: 1,
			blacksmith: 1,
			stable: 1,
			house: 4,
			cottage: 4,
			farm: 3,
			park: 1
		},
		village: {
			inn: 1,
			tavern: 1,
			temple: 1,
			market: 1,
			guildhall: 1,
			shop: 2,
			blacksmith: 1,
			stable: 1,
			house: 7,
			cottage: 5,
			farm: 3,
			park: 1
		},
		town: {
			inn: 2,
			tavern: 2,
			temple: 2,
			market: 1,
			guildhall: 2,
			shop: 5,
			blacksmith: 2,
			stable: 2,
			house: 15,
			cottage: 6,
			farm: 2,
			park: 2
		},
		city: {
			inn: 3,
			tavern: 3,
			temple: 3,
			market: 2,
			guildhall: 3,
			shop: 9,
			blacksmith: 3,
			stable: 3,
			house: 28,
			cottage: 8,
			park: 3
		},
		metropolis: {
			inn: 5,
			tavern: 5,
			temple: 5,
			market: 3,
			guildhall: 5,
			shop: 15,
			blacksmith: 5,
			stable: 4,
			house: 50,
			cottage: 14,
			park: 5
		}
	};

	// ── Type display metadata ─────────────────────────────────────────────────────
	const TYPE_LABEL: Record<BType, string> = {
		keep: 'Keep',
		temple: 'Temple',
		market: 'Market',
		guildhall: 'Guild Hall',
		inn: 'Inn',
		tavern: 'Tavern',
		shop: 'Shop',
		blacksmith: 'Smithy',
		house: 'House',
		cottage: 'Cottage',
		stable: 'Stable',
		farm: 'Farm',
		park: 'Park',
		great_hall: 'Great Hall',
		barracks: 'Barracks',
		armory: 'Armory',
		chapel: 'Chapel',
		dungeon: 'Dungeon',
		lord_quarters: "Lord's Chambers"
	};
	const TYPE_COLOR: Record<BType, string> = {
		keep: 'bg-slate-600 text-slate-100',
		temple: 'bg-amber-800 text-amber-100',
		market: 'bg-yellow-700 text-yellow-100',
		guildhall: 'bg-orange-800 text-orange-100',
		inn: 'bg-red-800 text-red-100',
		tavern: 'bg-red-900 text-red-200',
		shop: 'bg-green-800 text-green-100',
		blacksmith: 'bg-zinc-600 text-zinc-100',
		house: 'bg-stone-600 text-stone-100',
		cottage: 'bg-stone-700 text-stone-200',
		stable: 'bg-yellow-800 text-yellow-100',
		farm: 'bg-lime-800 text-lime-100',
		park: 'bg-green-700 text-green-100',
		great_hall: 'bg-slate-700 text-slate-100',
		barracks: 'bg-slate-600 text-slate-100',
		armory: 'bg-zinc-700 text-zinc-100',
		chapel: 'bg-amber-900 text-amber-100',
		dungeon: 'bg-neutral-700 text-neutral-200',
		lord_quarters: 'bg-purple-900 text-purple-100'
	};

	// ── Name lists ────────────────────────────────────────────────────────────────
	const FM = [
		'Aldric',
		'Beren',
		'Calder',
		'Dorin',
		'Edwyn',
		'Fynn',
		'Gareth',
		'Hadwin',
		'Ivar',
		'Kendrick',
		'Leofric',
		'Mors',
		'Oswin',
		'Petyr',
		'Rolph',
		'Simeon',
		'Ulric',
		'Walther'
	];
	const FF = [
		'Aelys',
		'Brynn',
		'Calla',
		'Dena',
		'Faye',
		'Greta',
		'Hilda',
		'Ilsa',
		'Kira',
		'Lysa',
		'Maren',
		'Nessa',
		'Orla',
		'Petra',
		'Roswyn',
		'Sela',
		'Thea',
		'Willa',
		'Yara'
	];
	const LAST = [
		// Nature / landscape
		'Ashford',
		'Blackmoor',
		'Briarwood',
		'Coldbrook',
		'Craghollow',
		'Deepmere',
		'Dunmore',
		'Emberly',
		'Fenwick',
		'Greenvale',
		'Greystone',
		'Hawthorn',
		'Hillcrest',
		'Ironwood',
		'Lakeshore',
		'Longmire',
		'Marshfield',
		'Millwood',
		'Moorfield',
		'Netherby',
		'Oakhurst',
		'Ravenswood',
		'Redcliff',
		'Riverstone',
		'Rushford',
		'Saltmarsh',
		'Silverbrook',
		'Stonehaven',
		'Thornbury',
		'Underhill',
		'Westmoor',
		'Whitacre',
		'Willowmere',
		// Occupational
		'Arrowsmith',
		'Baxter',
		'Chandler',
		'Cooper',
		'Copperfield',
		'Fletcher',
		'Fuller',
		'Goldsmith',
		'Mason',
		'Mercer',
		'Miller',
		'Naylor',
		'Potter',
		'Sadler',
		'Thatcher',
		'Tanner',
		'Tucker',
		'Turner',
		'Wainwright',
		'Walker',
		'Ward',
		'Weaver',
		// Descriptive / characteristic
		'Fairweather',
		'Gale',
		'Gruff',
		'Hardy',
		'Hartley',
		'Ketterly',
		'Lorn',
		'Meek',
		'Pendleton',
		'Quick',
		'Sharpe',
		'Stern',
		'Stone',
		'Stout',
		'Swift',
		'Varley',
		// Short / punchy
		'Bale',
		'Brand',
		'Bray',
		'Cade',
		'Cross',
		'Daw',
		'Finch',
		'Flint',
		'Ford',
		'Fox',
		'Goss',
		'Grant',
		'Hale',
		'Holt',
		'Hunt',
		'Knox',
		'Lane',
		'Marsh',
		'Nash',
		'Pike',
		'Reed',
		'Rowe',
		'Ryse',
		'Thorn',
		'Vane',
		'Voss',
		'Wick',
		'Wren',
		// Longer / distinctive
		'Aldermoor',
		'Blackwell',
		'Bramblewood',
		'Cinderfall',
		'Duncastle',
		'Gallowtree',
		'Gravelshod',
		'Holloway',
		'Kettleworth',
		'Longfellow',
		'Maplethorn',
		'Nightingale',
		'Oakenshield',
		'Pemberton',
		'Ravenscroft',
		'Saddleworth',
		'Tanglewood',
		'Whitmore',
		'Wickfield',
		'Yardley'
	];
	const DEITY = [
		'Pelor',
		'Avandra',
		'Bahamut',
		'Ioun',
		'Kord',
		'Erathis',
		'Melora',
		'Sehanine',
		'The Raven Queen',
		'Moradin',
		'Corellon'
	];
	const INN_ADJ = [
		'Stumbling',
		'Prancing',
		'Silver',
		'Golden',
		'Rusty',
		'Wandering',
		'Drowsy',
		'Merry',
		'Crimson',
		'Gilded'
	];
	const INN_OBJ = [
		'Boar',
		'Pony',
		'Stag',
		'Chalice',
		'Flagon',
		'Lantern',
		'Goose',
		'Horseshoe',
		'Raven',
		'Barrel'
	];
	const SHOP_T = [
		'Apothecary',
		'Tailor',
		'Jeweler',
		'Cobbler',
		'Cooper',
		'Chandler',
		'Fletcher',
		'Tanner',
		'Scrivener',
		'Herbalist'
	];

	// ── Flavor text ───────────────────────────────────────────────────────────────
	// ── Flavor text ───────────────────────────────────────────────────────────────
	function makeBuildingInfo(
		type: BType,
		rng: () => number,
		tname: string
	): { name: string; description: string; npcs: Npc[] } {
		switch (type) {
			case 'inn': {
				const n = `The ${pick(INN_ADJ, rng)} ${pick(INN_OBJ, rng)}`;
				const keeper = pname(rng);
				const desc = pick(
					[
						`The common room of ${n} smells of woodsmoke, roasting meat, and old ale. A low fire crackles in the hearth, casting orange light over rough-hewn tables packed with travelers. The floorboards are worn smooth from years of boots.`,
						`${n} is the kind of inn where the beds have clean straw and the stew is reliably edible. No luxuries, no complaints — and the ale is better than it has any right to be.`,
						`The sign outside ${n} is freshly painted; the floorboards inside, less so. A half-dozen guests nurse drinks near the fire, each studiously ignoring the others.`,
						`${n} earns its reputation through sheer consistency — the rooms are small, the food is plain, and it has never once caught fire. In this business, that counts for something.`,
						`The common room of ${n} is louder than seems possible for its size. Travelers, merchants, and locals are packed three to a bench, and everyone seems to have news.`
					],
					rng
				);
				return {
					name: n,
					description: desc,
					npcs: [
						{
							name: keeper,
							role: pick(
								[
									'Innkeeper — stout, loud, and fiercely proud of the ale',
									'Innkeeper — sharp-eyed, keeps the peace through sheer force of personality',
									'Innkeeper — generous with portions, less so with information'
								],
								rng
							)
						},
						{
							name: pname(rng),
							role: pick(
								[
									'Barkeep — quick with a pour and quicker with a comeback',
									'Barkeep — quiet, efficient, misses nothing',
									'Barkeep — knows every regular by drink order and trouble level'
								],
								rng
							)
						},
						{
							name: pname(rng),
							role: pick(
								[
									'Traveler — road-weary merchant carrying news of distant trouble',
									'Traveler — a pilgrim heading somewhere holy, vague about which deity',
									"Traveler — a courier who will not say what they're carrying"
								],
								rng
							)
						}
					]
				};
			}
			case 'tavern': {
				const n = `The ${pick(INN_ADJ, rng)} ${pick(['Barrel', 'Tankard', 'Hook', 'Corner', 'Hearth', 'Nail', 'Sow', 'Hatch', 'Tap'], rng)}`;
				const desc = pick(
					[
						`Low-ceilinged and smoke-stained, ${n} is clearly the locals' haunt. A pair of old men argue over dice in the corner. Someone is playing a lute badly in the back room.`,
						`${n} smells of spilled beer and pipe smoke, which is to say it smells exactly right. The fire is generous, the ale is cheap, and the company is reliably opinionated.`,
						`A rough-and-ready place. The locals keep their purses close and their backs to the wall not from fear, but from long habit. Strangers are assessed and categorised within thirty seconds of entering.`,
						`${n} is quieter than usual today, apparently. The regulars keep referencing last week as if it explains the subdued atmosphere, but no one will elaborate.`,
						`The benches are full despite the early hour. Whatever else is wrong with this town, nobody is going thirsty. The barkeep moves with the efficient exhaustion of someone who has been on their feet since dawn.`
					],
					rng
				);
				return {
					name: n,
					description: desc,
					npcs: [
						{
							name: pname(rng),
							role: pick(
								[
									'Barkeep — surly, but the ale is cheap and the fire is warm',
									"Barkeep — cheerful and relentless, refills your cup before you've finished",
									'Barkeep — says little, charges fairly, and has clearly seen everything twice'
								],
								rng
							)
						},
						{
							name: pname(rng),
							role: pick(
								[
									"Regular — a retired soldier who knows everyone's business",
									'Regular — ancient, unmovable, has sat on that stool for twenty years',
									'Regular — a local farmer who comes in every evening regardless of the harvest'
								],
								rng
							)
						},
						{
							name: pname(rng),
							role: pick(
								[
									'Bard (attempted) — enthusiastic, talentless, hard to get rid of',
									'Drunk — friendly, philosophical, going to remember nothing',
									'Card player — losing steadily and taking it personally'
								],
								rng
							)
						}
					]
				};
			}
			case 'temple': {
				const deity = pick(DEITY, rng);
				const desc = pick(
					[
						`Candlelight shimmers off polished stone columns. Incense hangs heavy in the air, and the silence feels expectant. Offerings of small coins and wildflowers have been left at the altar of ${deity}.`,
						`The temple of ${deity} is older than most of the town, its stones worn smooth and its threshold polished by generations of feet. The air inside is still and cool, even in summer.`,
						`Newer than most buildings here, its stone still pale and clean. The priest is ambitious; the congregation, cautiously optimistic. A fresh coat of paint on the altar of ${deity} suggests recent donations.`,
						`A well-worn temple, clearly beloved — the prayer mats are thin with use, the offerings recent and genuine. ${deity} is evidently held in high esteem here, or at least considered prudent to honour.`,
						`Small enough that the priest knows every parishioner by name, which they consider an advantage. The temple of ${deity} is the town's conscience, for better or worse.`
					],
					rng
				);
				return {
					name: `Temple of ${deity}`,
					description: desc,
					npcs: [
						{
							name: pname(rng),
							role: pick(
								[
									`High Priest — calm, measured, devoted to ${deity}`,
									`Head Cleric — practical faith, deeply suspicious of miracles that cost nothing`,
									`Priestess — warm in public, precise in private, devoted to ${deity}`
								],
								rng
							)
						},
						{
							name: pname(rng),
							role: pick(
								[
									'Acolyte — nervous, still learning the rites',
									'Acolyte — recites prayers perfectly and understands about half of them',
									'Junior Cleric — devout, earnest, slightly too eager to help'
								],
								rng
							)
						},
						{
							name: pname(rng),
							role: pick(
								[
									'Petitioner — a grieving widow seeking guidance',
									'Supplicant — waiting for an answer to a prayer sent three months ago',
									'Worshipper — lights a candle every morning, never misses a service'
								],
								rng
							)
						}
					]
				};
			}
			case 'market': {
				const desc = pick(
					[
						`Stalls and awnings crowd the square, hawking everything from cured meats to questionable cures. The noise is overwhelming — vendors shouting, livestock complaining, children weaving between legs. The smell of fresh bread cuts through the general chaos.`,
						`The market is winding down for the day, vendors packing up with the efficient weariness of people who do this every morning and evening. Bargains can be had in the last hour.`,
						`${tname} Market Square is the town's real center of gravity. News, prices, and scandal all flow through here first, and everything else in town adjusts accordingly.`,
						`A busy market despite the hour — or perhaps because of it. The morning rush has passed but the serious buyers remain, moving methodically between stalls with lists and strong opinions.`
					],
					rng
				);
				return {
					name: `${tname} Market Square`,
					description: desc,
					npcs: [
						{
							name: pname(rng),
							role: pick(
								[
									'Spice Merchant — expensive tastes, vaguely suspicious origins',
									'Cloth Merchant — meticulous, expects you to handle the goods properly',
									'Trader — buys low, sells reasonable, trusts no one entirely'
								],
								rng
							)
						},
						{
							name: pname(rng),
							role: pick(
								[
									'Baker — cheerful, flour-dusted, reliable source of gossip',
									"Produce Seller — loud, generous with samples, louder still if you don't buy",
									'Butcher — honest about what the cuts are, less so about where they came from'
								],
								rng
							)
						},
						{
							name: pname(rng),
							role: pick(
								[
									'Guard — bored, watching for pickpockets, not finding them',
									'Guard — attentive, has stopped three arguments today, expects a fourth',
									'Market Inspector — checks weights and measures with the dedication of the genuinely righteous'
								],
								rng
							)
						}
					]
				};
			}
			case 'guildhall': {
				const trade = pick(
					[
						'Merchants',
						'Carpenters',
						'Masons',
						'Weavers',
						'Alchemists',
						'Adventurers',
						'Scribes',
						'Chandlers',
						'Dyers',
						'Tanners'
					],
					rng
				);
				const desc = pick(
					[
						`The guild hall is austere but well-maintained, its seal carved above the lintel. Inside, members conduct business in hushed, serious tones. A large ledger sits open on a central table, filled with contracts and dues.`,
						`The ${trade}' Guild Hall wears its prosperity plainly — quality stonework, well-fitted doors, and a meeting room that says money changes hands here regularly.`,
						`Arguments can be heard from outside. Inside, a half-dozen guild members are deeply invested in disagreeing about something that sounds procedural but clearly isn't.`,
						`A working building, not a proud one — the floors are scuffed, the ledgers are fat, and nothing here is for show. The ${trade}' Guild cares about results, not appearances.`,
						`Quieter than usual, the clerk explains, because the Guildmaster is travelling. Everyone seems slightly more relaxed about this than they should be.`
					],
					rng
				);
				return {
					name: `${trade}' Guild Hall`,
					description: desc,
					npcs: [
						{
							name: pname(rng),
							role: pick(
								[
									'Guildmaster — meticulous, connected, not easily impressed',
									'Acting Guildmaster — competent, anxious about looking competent',
									'Guild Elder — technically retired, practically indispensable'
								],
								rng
							)
						},
						{
							name: pname(rng),
							role: pick(
								[
									'Clerk — knows where every coin went, protective of that knowledge',
									'Secretary — manages the correspondence, the schedule, and quietly, the Guildmaster',
									'Ledger-keeper — will answer any question after you have filled in the correct form'
								],
								rng
							)
						},
						{
							name: pname(rng),
							role: pick(
								[
									'Applicant — waiting nervously to present their qualifications',
									'Contractor — here to dispute an invoice, certain they are right',
									'Guild Member — picking up their quarterly accounts, already annoyed'
								],
								rng
							)
						}
					]
				};
			}
			case 'shop': {
				const trade = pick(SHOP_T, rng);
				const owner = pname(rng);
				const desc = pick(
					[
						`The shop is small but well-organized, goods arranged on shelves with practiced care. ${owner} looks up with the practiced smile of someone who knows the price of everything. The smell of ${trade === 'Apothecary' || trade === 'Herbalist' ? 'herbs and strange chemicals' : 'leather and fresh-cut wood'} fills the space.`,
						`Goods are crammed floor-to-ceiling in no obvious order, but ${owner} produces anything you ask for in seconds and looks faintly offended that you doubted it.`,
						`A cramped but cheerful shop, smelling of cedar and old stock. The counter is worn smooth from generations of transactions, and the owner's eye for a hesitant customer is preternatural.`,
						`The shop's sign is newer than the building. Business is clearly going well — the shelves are full, the apprentice is busy, and ${owner} is not offering discounts.`,
						`A tidy, no-nonsense operation. ${owner} is behind the counter, doing three things at once and expecting you to know what you want before you open your mouth.`
					],
					rng
				);
				return {
					name: `${owner.split(' ')[0]}'s ${trade}`,
					description: desc,
					npcs: [
						{
							name: owner,
							role: pick(
								[
									`${trade} — knows their trade inside and out, drives a hard bargain`,
									`${trade} — fair prices, expert opinion, absolutely no patience for browsing`,
									`${trade} — will spend an hour explaining your options if you let them`
								],
								rng
							)
						},
						{
							name: pname(rng),
							role: pick(
								[
									'Apprentice — eager, clumsy, learning fast',
									'Apprentice — technically proficient, creatively uninspired, perfectly reliable',
									'Apprentice — has questions. So many questions.'
								],
								rng
							)
						}
					]
				};
			}
			case 'blacksmith': {
				const smith = pname(rng);
				const desc = pick(
					[
						`The heat from the forge hits you a full step before you reach the door. The rhythmic clang of hammer on anvil rings out into the street. Finished swords, plows, and door hinges hang from the rafters in an unlikely arrangement.`,
						`The forge is going cold today — ${smith.split(' ')[0]} is working outside at the anvil, shaping a length of bar iron in the morning air. It looks easier than it is.`,
						`A serious forge producing serious work. The walls are hung with samples: agricultural tools alongside swords, armor alongside cabinet hinges. Everything is made to last.`,
						`Dark, deafeningly loud, and smelling of coal smoke and hot iron. ${smith.split(' ')[0]} doesn't look up when you enter, and isn't going to until this piece is finished.`,
						`The smithy is closed at the moment — a handwritten sign says back after midday. Someone has added, in different handwriting, probably.`
					],
					rng
				);
				return {
					name: `${smith.split(' ')[0]}'s Forge`,
					description: desc,
					npcs: [
						{
							name: smith,
							role: pick(
								[
									'Master Smith — arms like tree trunks, surprisingly gentle with fine work',
									'Blacksmith — efficient, proud, gives a fair price and expects no argument about it',
									"Master Smith — has an opinion on the quality of every weapon you've ever owned"
								],
								rng
							)
						},
						{
							name: pname(rng),
							role: pick(
								[
									'Apprentice — sweaty, determined, nursing three new burn marks',
									'Apprentice — strong enough for the work, still learning the patience for it',
									'Journeyman Smith — almost as good as the master, aware of the gap'
								],
								rng
							)
						}
					]
				};
			}
			case 'stable': {
				const desc = pick(
					[
						`The stable smells of hay, horse, and oiled leather. A dozen horses in their stalls turn to look at you with calm, ancient eyes. A cat sleeps on the warmest bale.`,
						`A well-run stable with clean stalls and well-fed horses. The rates are fair, the feed is better than at most inns, and the stablemaster remembers every animal that has passed through.`,
						`More horses here than the stalls were built for. The stablemaster manages the overflow with practiced efficiency and an air of someone used to improvising.`,
						`The stables are quiet at this hour, most of the horses out with their riders. A single grey mare watches you enter with enormous, skeptical eyes.`,
						`The smell of fresh straw and horse liniment is clean and honest. The stablemaster is out back with a horse that has a stone in its shoe, speaking to it the way some people speak to children.`
					],
					rng
				);
				return {
					name: `${tname} Stables`,
					description: desc,
					npcs: [
						{
							name: pname(rng),
							role: pick(
								[
									'Stablemaster — knows horses better than people; prefers it that way',
									'Stablemaster — talks to the horses more than the customers, gets better results',
									"Stablemaster — can tell a horse's temperament in thirty seconds and a rider's in ten"
								],
								rng
							)
						},
						{
							name: pname(rng),
							role: pick(
								[
									'Stable Hand — quiet, quick, good with nervous animals',
									'Groom — patient, methodical, the horses visibly relax when they hear them coming',
									'Stable Boy — fourteen, fearless around horses, slightly less so around people'
								],
								rng
							)
						}
					]
				};
			}
			case 'farm': {
				const desc = pick(
					[
						`The farmstead is cluttered but productive, with pens of livestock and tidy rows in the garden. A dog barks twice, then loses interest. The farmer eyes you with the wariness of someone who has seen too much trouble come from outside.`,
						`A working farm in every sense — mud, manure, and the sound of hard labour from every direction. The animals are well-fed and the fields are properly tended. Whatever else, this family knows its business.`,
						`The fields around the farmhouse are neat and well-maintained, the furrows dead straight. This farmer takes pride in their work and is willing to explain why their methods are correct.`,
						`The barn is larger than the farmhouse, which says everything about priorities here. A pair of enormous oxen regard you from their pen with the serenity of animals that have never once worried about anything.`,
						`The kitchen garden is a riot of late-season vegetables. Strings of herbs dry under the eaves, and someone has left a half-mended fence gate leaning against the wall where it has been leaning for some time.`
					],
					rng
				);
				return {
					name: `${pick(LAST, rng)} Farm`,
					description: desc,
					npcs: [
						{
							name: pname(rng),
							role: pick(
								[
									'Farmer — calloused hands, knows the weather better than anyone',
									'Smallholder — proud, stubborn, has strong opinions about crop rotation',
									'Farmwife — runs the household and half the farm besides, takes no credit for either'
								],
								rng
							)
						},
						{
							name: pname(rng),
							role: pick(
								[
									"Farmhand — doesn't say much, gets it done",
									'Farmhand — new here, making up in effort what they lack in skill',
									'Farm Child — assigned to watch the geese, currently failing at this'
								],
								rng
							)
						}
					]
				};
			}
			case 'house':
			case 'cottage': {
				const family = pick(LAST, rng);
				const houseDescs = [
					`A modest house with a small garden out front. Smoke rises from the chimney and the smell of a simple meal drifts from inside. Curtains twitch at the window.`,
					`Well-kept, if unremarkable — freshly painted shutters, a swept step, and a neat stack of firewood beside the door. The sort of house where nothing interesting has ever happened, and they prefer it that way.`,
					`Children's toys are scattered in the small yard. A dog naps in a patch of afternoon sun beside the front step and opens one eye as you approach.`,
					`The upper window is propped open, and the faint sound of a domestic argument drifts out. The front step badly needs repair and has needed it for some time.`,
					`A respectable house, though the garden has been let go. Someone has scratched a ward against ill luck into the lintel. Given recent events, it seems reasonable.`,
					`Newer than most buildings on the street, with dressed stone at the corners and glass in two of the windows. Someone is doing well here and not hiding it.`
				];
				const cottageDescs = [
					`A modest cottage with a small garden out front. Smoke rises from the chimney and the smell of a simple meal drifts from inside. Curtains twitch at the window.`,
					`The cottage squats low against the ground, its thatched roof thick with moss and its walls whitewashed every spring. Chickens wander the yard as if they own it.`,
					`A tiny cottage, barely two rooms, but the smoke from its chimney smells of good cooking and the window box is bright with flowers in season.`,
					`The cottage garden is a riot of herbs and vegetables. Whoever lives here knows their plants, and the neighbours benefit from it whether they ask or not.`,
					`Rough-built but solid, this cottage has clearly stood for generations. The door fits badly but the walls are thick and the hearth is enormous.`,
					`Small enough to heat with one fire and large enough for one family, if they don't mind the closeness. The whole thing has the look of a place where people are quietly content.`
				];
				return {
					name: `${family} Residence`,
					description: pick(type === 'cottage' ? cottageDescs : houseDescs, rng),
					npcs: [
						{
							name: pname(rng),
							role: pick(
								[
									`${family} — resident, likely suspicious of strangers`,
									`${family} — polite, private, not inviting you in`,
									`${family} — will answer questions if pressed, and press back with their own`
								],
								rng
							)
						},
						{
							name: pname(rng),
							role: pick(
								[
									'Family member — curious, possibly useful',
									'Neighbour — stopped by to borrow something, staying to find out about you',
									'Child — watching from the doorway with frank, evaluating eyes'
								],
								rng
							)
						}
					]
				};
			}
			case 'park': {
				const kind = pick(
					[
						'Town Square',
						'Commons',
						'Memorial Garden',
						'Fountain Square',
						'Market Green',
						'Old Yard'
					],
					rng
				);
				const desc = pick(
					[
						`${pick(['A weathered stone fountain stands at the center, pigeons drowsing on its rim.', 'Old oak trees shade worn benches where the elderly gather to argue.', 'A carved war memorial bears names no one under forty recognizes.', 'Vendors sometimes set up impromptu stalls here when the market is full.'], rng)} On fair days the square fills with the whole town. On bad ones, it empties first.`,
						`The ${kind.toLowerCase()} is the town's breathing room — a patch of open ground where the buildings relent. Children play here in the afternoon, and in the evening it belongs to the old and the aimless.`,
						`Benches ring the edge, most of them occupied by people watching other people. In the middle, a sundial that is accurate twice a day and consulted constantly regardless.`,
						`An open space that the town has never quite decided what to do with. Currently it has a tree, three benches, a notice board, and a long-standing argument about whether it needs a fountain.`
					],
					rng
				);
				return {
					name: `${tname} ${kind}`,
					description: desc,
					npcs: [
						{
							name: pname(rng),
							role: pick(
								[
									'Town Crier — the source of all official and unofficial news',
									'Loiterer — has strong opinions, nowhere to be, plenty of time',
									'Pigeon Keeper — feeds the birds every morning, knows the square better than anyone'
								],
								rng
							)
						}
					]
				};
			}
			case 'keep': {
				return {
					name: `${tname} Keep`,
					description: `The keep looms over the town, its stone walls worn smooth by generations. Guards stand at the gate, watching everyone with studied indifference. Inside the courtyard, the smell of smoke and iron hangs in the air.`,
					npcs: [
						{
							name: pname(rng),
							role: 'Lord/Lady of the Keep — ruling with varying degrees of competence'
						},
						{ name: pname(rng), role: 'Captain of the Guard — loyal, tired, short on patience' },
						{
							name: pname(rng),
							role: 'Steward — manages the household, probably the real power here'
						}
					]
				};
			}
			case 'great_hall': {
				const desc = pick(
					[
						`A vast stone chamber hung with banners and lit by iron chandeliers. Long tables crowd the floor, scarred by years of feasts and the odd thrown tankard. The high seat at the far end is empty now, but its authority fills the room regardless.`,
						`The hall is grander than the town deserves, which is precisely the point. Someone spent lavishly on the vaulted ceiling and carved gallery — the result is a room that feels slightly too large, slightly too cold, and faintly too eager to be admired.`,
						`Soot-blackened beams overhead, rushes on the stone floor, and a permanent smell of smoke and roast. The great hall is lived-in and loud even when empty — every surface carries the mark of the people who have crowded it for generations.`,
						`Battle standards from campaigns long since settled hang faded above the tables. The hall holds a particular silence in the morning, before the day's business begins — the kind of silence that remembers noise.`,
						`Built more for intimidation than comfort — the ceiling vaulted high, the walls hung with mounted trophies. The lord's seat is elevated just enough to make visitors crane their necks when they speak.`,
						`The hall is half its original size; one wing was sealed off after a fire years ago and never rebuilt. Those who know don't mention it. The remaining space is made up for with excessive candlelight and an aggressively large table.`
					],
					rng
				);
				const npcRole1 = pick(
					[
						'Seneschal — runs the hall with quiet authority and knows every secret worth knowing',
						"Steward — manages the keep's accounts, provisions, and patience in roughly equal measure",
						'Chamberlain — obsessively formal, enforces etiquette no one else remembers agreeing to'
					],
					rng
				);
				const npcRole2 = pick(
					[
						'Herald — announces visitors and records proclamations with great ceremony',
						'Scribe — transcribes every order issued here; has opinions about all of them and shares none',
						'Cup-bearer — young noble learning courtly service; mostly learning to eavesdrop'
					],
					rng
				);
				return {
					name: `${tname} Great Hall`,
					description: desc,
					npcs: [
						{ name: pname(rng), role: npcRole1 },
						{ name: pname(rng), role: npcRole2 }
					]
				};
			}
			case 'barracks': {
				const desc = pick(
					[
						`Rows of narrow bunks line the walls, each bearing a soldier's kit laid out in practiced order. The smell of oiled leather and boot polish is sharp in the air. Off-duty guards play cards at a battered table near the fire.`,
						`The barracks are half-empty. The bunks that remain occupied are kept immaculate; the abandoned ones have gathered dust in a way that suggests nobody expects them to be filled again soon.`,
						`A long, low building where sleep is treated as a duty like any other — scheduled, regulated, and stripped of comfort wherever possible. Weapons are racked with more care than the men who carry them.`,
						`Noisier than expected at this hour — a dice game in one corner, two men arguing about patrol routes in another, and someone snoring through all of it with professional dedication.`,
						`The watch rotates through here in eight-hour shifts, and the building has the particular smell of a place that is never fully empty. The duty board by the door tracks every man's whereabouts; the sergeant checks it twice a day and trusts it not at all.`,
						`Spartan and deliberate — the bunks bolted to the walls, the floor swept bare, every personal effect confined to one small chest per man. The soldiers who sleep here either appreciate the discipline or have stopped noticing it.`
					],
					rng
				);
				const roles = pick(
					[
						[
							'Sergeant — gruff, efficient, has seen too many recruits come and go',
							'Guard — young, eager, asking too many questions',
							'Veteran — has been here twenty years and intends twenty more'
						],
						[
							"Sergeant-at-Arms — doesn't raise his voice; doesn't need to",
							'Corporal — newly promoted, overcompensating with enthusiasm',
							'Off-duty Guard — nursing a bruised hand and not explaining how'
						],
						[
							'Watch Commander — fair, methodical, and thoroughly disliked by those who deserve it',
							'Recruit — three weeks in, still startled by loud noises',
							'Old Soldier — should have retired two lords ago; shows no signs of doing so'
						]
					],
					rng
				);
				return {
					name: 'Guard Barracks',
					description: desc,
					npcs: [
						{ name: pname(rng), role: roles[0] },
						{ name: pname(rng), role: roles[1] },
						{ name: pname(rng), role: roles[2] }
					]
				};
			}
			case 'armory': {
				const desc = pick(
					[
						`Racks of weapons and armor line every wall, each piece oiled and catalogued. The armorer knows the location and condition of every item without consulting the ledger. There is enough iron here to outfit a small army — which is, of course, the point.`,
						`The armory is smaller than expected, which the armorer attributes to good inventory discipline. What is here is well-maintained to the point of obsession; there is no piece of equipment whose history the armorer cannot recite.`,
						`Weapons of three generations line these walls — old campaign swords beside newly-forged spearheads, the practical beside the ceremonial. The armorer has strong opinions about which is which and shares them whether asked or not.`,
						`Everything numbered, catalogued, and accounted for to the last buckle. The last soldier who returned a weapon dirty has not made that mistake twice. The armorer's expression is sufficient deterrent.`,
						`The armory smells of iron, oil, and something sharper — the kind of professional pride that keeps steel bright even in peacetime. Whoever has been maintaining this has been at it for years, and it shows.`,
						`Half the racks are empty, which the armorer explains as "efficiency" and declines to elaborate on. The pieces that remain are in exceptional condition. Whatever happened to the rest is not a subject for discussion.`
					],
					rng
				);
				const npcRole1 = pick(
					[
						'Master Armorer — proud of every piece, reluctant to let any of it out the door',
						'Armorer — catalogues every item twice; does not believe in rounding errors',
						'Weaponsmith — recently promoted from the town forge; still adjusting to keep politics'
					],
					rng
				);
				const npcRole2 = pick(
					[
						'Squire — polishing something, always polishing something',
						'Apprentice — talented, impatient, occasionally trusted with the inventory ledger',
						'Guard — detailed here for punishment duty; unclear what the punishment was'
					],
					rng
				);
				return {
					name: 'Keep Armory',
					description: desc,
					npcs: [
						{ name: pname(rng), role: npcRole1 },
						{ name: pname(rng), role: npcRole2 }
					]
				};
			}
			case 'chapel': {
				const deity = pick(DEITY, rng);
				const desc = pick(
					[
						`A small but dignified chapel dedicated to ${deity}, stone-carved and dimly lit. It smells of candle wax and old prayer. The lord's family takes services here, separate from the common folk at the temple in town.`,
						`The chapel is older than the keep itself — built here first, with everything else grown around it. The stonework is different, smoother, worn by hands that predate the current lord's line by centuries. ${deity} has been worshipped on this ground a long time.`,
						`The lord's chapel is private and rarely used, judging by the thin layer of dust on the prayer cushions. The chaplain keeps it immaculate regardless. Hope, apparently, is maintained whether or not it is exercised.`,
						`Candles burn at all hours before the altar of ${deity}. The chaplain insists this is pure devotion. The soldiers in the adjacent barracks suspect it is also a commercial arrangement with the chandler.`,
						`Small enough that the entire household barely fits for high services, the chapel feels intimate rather than grand. The carvings on the walls are skilled work — someone believed strongly, once, and wanted it to show.`,
						`The chapel was clearly built to a budget, then quietly improved over the years as the lord's fortunes changed. The altar cloth is new. The stonework behind it is not. The chaplain finds the contrast spiritually instructive.`
					],
					rng
				);
				const chaplainRole = pick(
					[
						`Chaplain — personal confessor to the lord, devoted to ${deity}`,
						`Chaplain — keeps the lord's soul in reasonable repair; opinions on the rest of the household vary`,
						`Prior — technically outranks the town's temple priest; both parties prefer not to discuss it`
					],
					rng
				);
				return {
					name: `Keep Chapel`,
					description: desc,
					npcs: [{ name: pname(rng), role: chaplainRole }]
				};
			}
			case 'dungeon': {
				const desc = pick(
					[
						`Below the keep, reached through a heavy iron door that sweats in cold weather. The dungeon is dark, damp, and exactly as unpleasant as it was designed to be. The jailor claims current occupancy is low. He doesn't say it with much conviction.`,
						`The dungeon is dry, which the jailor considers a personal professional achievement. The cells are old enough that the iron rings in the walls are worn smooth. Whatever was once held here was held for a long time.`,
						`Three cells, two occupied. The jailor has a practice of not asking what the occupants did, and the occupants have a practice of not mentioning it. This arrangement suits everyone except possibly the occupants.`,
						`The stairs down are deliberately steep — part design, part deterrent. It smells of old stone and lamp oil. Not a place built for cruelty so much as for waiting, which is sometimes worse.`,
						`Newer than the rest of the keep, added at some lord's insistence after an incident nobody discusses directly. The locks are good quality. So are the chains. The jailor was hired from out of town.`,
						`Expanded twice since the keep was first raised, each addition slightly different in style and slightly worse in smell. The oldest cells have scratched tallies on the walls; no one has bothered to count them.`
					],
					rng
				);
				const jailorRole = pick(
					[
						'Jailor — incurious, thorough, asks no questions about the guests',
						'Jailor — courteous in a way that makes the occupants more uncomfortable than cruelty would',
						"Under-Jailor — new to the post; still hasn't decided how he feels about it"
					],
					rng
				);
				const prisonerRole = pick(
					[
						'Prisoner — claims innocence, as they always do',
						'Prisoner — has stopped claiming anything; is simply waiting',
						"Prisoner — oddly well-informed about events outside the keep; won't say how"
					],
					rng
				);
				return {
					name: 'Keep Dungeon',
					description: desc,
					npcs: [
						{ name: pname(rng), role: jailorRole },
						{ name: pname(rng), role: prisonerRole }
					]
				};
			}
			case 'lord_quarters': {
				const desc = pick(
					[
						`The lord's private quarters are surprisingly austere for someone of their station. Maps cover one wall; correspondence, another. A sword rack near the door suggests the lord dresses for trouble as a matter of habit.`,
						`Less quarters than a working room that happens to contain a bed. Papers cover every surface. The bed looks slept in occasionally, and when it was, not for long.`,
						`Comfortable without being extravagant — the lord has taste, but it runs toward function. The window's view covers the main gate, the road south, and three-quarters of the town below. This is not a coincidence.`,
						`A portrait of the previous lord hangs above the fireplace; the current one hasn't taken it down. Whether this is sentiment, inertia, or a deliberate statement about continuity is left to the visitor's interpretation.`,
						`The chambers have been rearranged recently — the furniture carries the marks of being moved, the bookshelves have conspicuous gaps. The steward, if asked, changes the subject with practiced ease.`,
						`The lord's quarters smell of candle wax, old parchment, and a faint trace of something medicinal. The sleeping chamber is separated from the working space by a heavy curtain. Only the working space is shown to visitors.`
					],
					rng
				);
				const lordRole = pick(
					[
						'Rules the keep and the surrounding lands, for better or worse',
						'Lord of the keep — presents as reasonable, negotiates as anything but',
						'Commands the garrison and holds the charter; both are more complicated than they sound'
					],
					rng
				);
				const attendantRole = pick(
					[
						'Lady-in-Waiting — attends to personal matters and hears everything',
						"Steward — manages the lord's schedule, correspondence, and plausible deniability",
						'Personal Guard — professional, unreadable, and almost certainly listening'
					],
					rng
				);
				return {
					name: "Lord's Chambers",
					description: desc,
					npcs: [
						{ name: `Lord ${pick(LAST, rng)}`, role: lordRole },
						{ name: pname(rng), role: attendantRole }
					]
				};
			}
		}
	}

	function townDescription(rng: () => number): string {
		const sizeWord: Record<TownSize, string> = {
			thorp: 'tiny cluster of homesteads',
			hamlet: 'small hamlet',
			village: 'quiet village',
			town: 'bustling market town',
			city: 'sizeable city',
			metropolis: 'sprawling metropolis'
		};
		const opLine: Record<Opulence, string> = {
			poor: 'Hardship is evident everywhere — patched roofs, thin livestock, and the wary eyes of people ground down by hard years.',
			modest:
				'The settlement makes do, neither prosperous nor desperate, its buildings well-used if not well-appointed.',
			comfortable:
				'There is a quiet prosperity here. Painted shutters, tidy gardens, and the smell of fresh bread from more than one direction.',
			wealthy:
				'Wealth is on quiet display — dressed stonework, gilded signs, and merchants in fine cloth moving with the ease of those who expect to be served.'
		};
		const detail = pick(
			[
				`The ${pick(['smell of woodsmoke', 'clang of a distant forge', 'sound of livestock', 'creak of wagon wheels'], rng)} greets visitors on the road in.`,
				`The roads are ${pick(['cobbled and well-maintained', 'packed dirt, muddy after rain', 'worn smooth by generations of feet', 'narrow and winding between close-set buildings'], rng)}.`,
				`${pick(['A notice board near the gate', 'The well at the center of town', 'The steps of the largest inn', 'The temple steps'], rng)} serves as the de facto meeting point for local business and gossip.`,
				`${pick(['Travelers passing through tend to stay longer than they planned.', 'Strangers are noticed here, and word gets around quickly.', 'The locals have a reputation for being close-mouthed with outsiders.', 'The town sees enough trade to keep it lively, but not enough to make it comfortable.'], rng)}`
			],
			rng
		);
		const keepLine = hasKeep
			? ` A ${townSize === 'city' || townSize === 'metropolis' ? 'fortress' : 'stone keep'} dominates the ${pick(['north end of town', 'hilltop above', 'center of', 'high ground above'], rng)} ${townName}, its banner visible for miles.`
			: '';
		return `${townName} is a ${sizeWord[townSize]}.${keepLine} ${opLine[opulence]} ${detail}`;
	}

	// ── Generation ────────────────────────────────────────────────────────────────
	function generateTown() {
		const baseRng = mkRng(hashSeed(townName, seed));
		const counts = COUNTS[townSize];
		const buildings: ListBuilding[] = [];

		// Generate each building type in order
		for (const [rawType, count] of Object.entries(counts)) {
			const type = rawType as BType;
			for (let i = 0; i < (count ?? 0); i++) {
				const r = mkRng(hashSeed(type + i, hashSeed(townName, seed)));
				const info = makeBuildingInfo(type, r, townName);
				buildings.push({ type, name: info.name, description: info.description, npcs: info.npcs });
			}
		}

		// Keep sub-buildings
		const keepBuildings: ListBuilding[] = [];
		if (hasKeep) {
			const keepTypes: BType[] = ['great_hall', 'barracks', 'armory'];
			if (townSize !== 'thorp') keepTypes.push('chapel');
			if (['town', 'city', 'metropolis'].includes(townSize))
				keepTypes.push('dungeon', 'lord_quarters');
			for (const t of keepTypes) {
				const r = mkRng(hashSeed('keep_' + t, hashSeed(townName, seed)));
				const info = makeBuildingInfo(t, r, townName);
				keepBuildings.push({
					type: t,
					name: info.name,
					description: info.description,
					npcs: info.npcs
				});
			}
		}

		townData = {
			description: townDescription(baseRng),
			buildings,
			keepBuildings
		};
	}

	// ── Category groups for display ───────────────────────────────────────────────
	const CATEGORIES: { label: string; types: BType[] }[] = [
		{ label: 'Civic & Religious', types: ['temple', 'market', 'guildhall', 'park'] },
		{ label: 'Inns & Taverns', types: ['inn', 'tavern'] },
		{ label: 'Trades & Services', types: ['shop', 'blacksmith', 'stable'] },
		{ label: 'Farms & Outbuildings', types: ['farm'] },
		{ label: 'Residences', types: ['house', 'cottage'] }
	];

	// ── Shop inventory generator ──────────────────────────────────────────────────
	interface ShopItem {
		name: string;
		qty: string;
		price: string;
		note?: string;
		rare?: boolean;
	}
	interface PoolItem {
		name: string;
		cp: number;
		note?: string;
		rare?: boolean;
		bulk?: boolean; // sold in multiples
	}

	import BuildingFloorplanModal from '$lib/components/BuildingFloorplanModal.svelte';

	let selectedShop = $state<ListBuilding | null>(null);
	let shopSeed = $state(0);
	let floorplanBuilding = $state<ListBuilding | null>(null);

	const ITEM_POOLS: Record<string, PoolItem[]> = {
		Apothecary: [
			{ name: 'Healing Potion', cp: 5000, note: 'Restores 2d4+2 hp' },
			{ name: 'Antitoxin (vial)', cp: 5000, note: 'Advantage on saves vs. poison for 1 hour' },
			{ name: "Healer's Kit", cp: 500, note: '10 uses; stabilize a dying creature' },
			{ name: "Herbalist's Kit", cp: 500 },
			{ name: 'Wound Salve', cp: 120, note: 'Stabilizes a dying creature (1 use)' },
			{ name: 'Calming Draught', cp: 1500, note: 'Advantage on Wisdom saves vs. fear, 1 hour' },
			{ name: 'Sleep Tonic', cp: 2000, note: '6 hours dreamless sleep, no harmful effects' },
			{ name: "Fever's Remedy", cp: 60, note: 'Reduces fever; three doses', bulk: true },
			{ name: 'Smelling Salts', cp: 500 },
			{ name: 'Dried Willowbark', cp: 30, note: 'Mild pain relief; sold per bundle', bulk: true },
			{ name: 'Purging Draught', cp: 800, note: 'Expels ingested poison if taken within 10 min' },
			{
				name: 'Potion of Climbing',
				cp: 7500,
				note: 'Climbing speed equal to walking speed, 1 hour',
				rare: true
			},
			{ name: 'Potion of Greater Healing', cp: 15000, note: 'Restores 4d4+4 hp', rare: true },
			{
				name: "Alchemist's Fire (flask)",
				cp: 5000,
				note: 'Deals 1d4 fire damage/round until extinguished',
				rare: true
			},
			{ name: 'Bandages (10)', cp: 20, bulk: true }
		],
		Herbalist: [
			{ name: 'Healing Potion', cp: 5000, note: 'Restores 2d4+2 hp' },
			{ name: "Healer's Kit", cp: 500, note: '10 uses' },
			{ name: "Herbalist's Kit", cp: 500, note: 'Required for identifying herbs and poisons' },
			{ name: 'Dried Herbs Bundle', cp: 20, note: 'Cooking and minor remedies', bulk: true },
			{ name: 'Antitoxin (vial)', cp: 5000 },
			{ name: 'Dried Nightshade', cp: 200, note: 'Medicinal in small doses; poisonous in large' },
			{ name: 'Root of Valerian', cp: 80, note: 'Sleep aid; sold per bundle', bulk: true },
			{ name: "Fever's Remedy", cp: 60, note: 'Three doses', bulk: true },
			{ name: 'Wound Salve', cp: 120 },
			{ name: 'Calming Draught', cp: 1500 },
			{
				name: 'Potion of Animal Friendship',
				cp: 10000,
				note: 'Cast Animal Friendship once; save DC 13',
				rare: true
			},
			{
				name: 'Oil of Slipperiness',
				cp: 6000,
				note: 'As Freedom of Movement for 8 hours',
				rare: true
			},
			{
				name: 'Dried Mushrooms (rare)',
				cp: 500,
				note: 'Specific variety; ask the herbalist',
				rare: true
			},
			{ name: 'Bandages (10)', cp: 20, bulk: true },
			{ name: 'Fresh Herbs (bundle)', cp: 10, bulk: true }
		],
		Tailor: [
			{ name: 'Common Clothes', cp: 50 },
			{ name: "Traveler's Clothes", cp: 200 },
			{ name: "Entertainer's Costume", cp: 300 },
			{ name: "Merchant's Robes", cp: 800 },
			{ name: 'Fine Clothes', cp: 1500, rare: true },
			{ name: 'Wool Cloak', cp: 100 },
			{ name: 'Riding Cloak', cp: 200 },
			{ name: 'Silk Cloak', cp: 600, rare: true },
			{ name: 'Winter Coat (wool)', cp: 400 },
			{ name: 'Work Gloves', cp: 20, bulk: true },
			{ name: 'Leather Gloves', cp: 50 },
			{ name: 'Wide-brim Hat', cp: 50 },
			{ name: 'Linen Belt', cp: 20 },
			{ name: "Courtier's Clothes", cp: 3000, note: 'Made to order; takes 1 week', rare: true },
			{ name: 'Disguise Kit', cp: 2500, rare: true },
			{ name: 'Cloak Pin (silver)', cp: 500, rare: true }
		],
		Jeweler: [
			{ name: 'Silver Ring (plain)', cp: 500 },
			{ name: 'Gold Ring (plain)', cp: 2500, rare: true },
			{ name: 'Signet Ring (blank)', cp: 500, note: 'Can be engraved to order' },
			{ name: 'Silver Bracelet', cp: 1000 },
			{ name: 'Copper Pendant', cp: 200 },
			{ name: 'Silver Brooch', cp: 500 },
			{ name: 'Ear Rings (silver, pair)', cp: 300 },
			{ name: 'Gemstone — Quartz', cp: 500, note: '50 gp value' },
			{ name: 'Gemstone — Amethyst', cp: 10000, note: '100 gp value', rare: true },
			{ name: 'Gemstone — Garnet', cp: 10000, note: '100 gp value', rare: true },
			{ name: 'Pearl Necklace', cp: 10000, rare: true },
			{ name: 'Golden Locket', cp: 5000, note: 'Engraved to order', rare: true }
		],
		Cobbler: [
			{ name: 'Common Boots', cp: 100 },
			{ name: 'Work Boots (durable)', cp: 200 },
			{ name: 'Riding Boots', cp: 400 },
			{ name: 'Fine Boots', cp: 500, rare: true },
			{ name: 'Sandals', cp: 30, bulk: true },
			{ name: "Children's Shoes", cp: 50, bulk: true },
			{ name: 'Soft-soled Shoes', cp: 100 },
			{ name: 'Boot Polish (jar)', cp: 10, bulk: true },
			{ name: 'Waterproofing Wax', cp: 30 },
			{ name: 'Boot Repair Kit', cp: 50 }
		],
		Cooper: [
			{ name: 'Small Barrel (5 gal)', cp: 300 },
			{ name: 'Large Barrel (10 gal)', cp: 500 },
			{ name: 'Watertight Cask', cp: 400 },
			{ name: 'Wooden Bucket', cp: 50, bulk: true },
			{ name: 'Wash Tub', cp: 100 },
			{ name: 'Barrel Lid (replacement)', cp: 50, bulk: true },
			{ name: 'Water Barrel (sealed)', cp: 400 },
			{ name: 'Cask (wine, empty)', cp: 200 },
			{ name: 'Barrel (salted, for brining)', cp: 350 }
		],
		Chandler: [
			{ name: 'Tallow Candles (10)', cp: 5, bulk: true },
			{ name: 'Wax Candles (10)', cp: 100, bulk: true },
			{ name: 'Scented Candles (5)', cp: 200 },
			{ name: 'Oil (flask)', cp: 10, bulk: true },
			{ name: 'Torch (10)', cp: 10, bulk: true },
			{ name: 'Lantern (hooded)', cp: 500 },
			{ name: 'Bullseye Lantern', cp: 1000, rare: true },
			{ name: 'Incense Block', cp: 100, bulk: true },
			{ name: 'Candelabra (iron)', cp: 500, rare: true },
			{ name: 'Lamp (clay)', cp: 10, bulk: true },
			{ name: 'Lamp Oil (pint)', cp: 10, bulk: true }
		],
		Fletcher: [
			{ name: 'Arrows (20)', cp: 100, bulk: true },
			{ name: 'Crossbow Bolts (20)', cp: 100, bulk: true },
			{ name: 'Shortbow', cp: 2500 },
			{ name: 'Hand Crossbow', cp: 7500, rare: true },
			{ name: 'Light Crossbow', cp: 2500 },
			{ name: 'Quiver', cp: 100 },
			{ name: 'Fine Quiver (leather)', cp: 300 },
			{
				name: 'Hunting Arrows (20)',
				cp: 200,
				note: 'Balanced; +1 to attack rolls on first shot',
				rare: true
			},
			{
				name: 'Blunt Arrows (20)',
				cp: 50,
				note: 'Deals bludgeoning damage; non-lethal',
				bulk: true
			},
			{ name: 'Fire Arrows (5)', cp: 500, note: 'Treat as torch on hit; single use', rare: true },
			{ name: 'Longbow', cp: 5000, rare: true }
		],
		Tanner: [
			{ name: 'Leather Armor', cp: 1000 },
			{ name: 'Studded Leather', cp: 4500, rare: true },
			{ name: 'Leather Belt', cp: 20, bulk: true },
			{ name: 'Leather Satchel', cp: 200 },
			{ name: 'Saddlebags (pair)', cp: 400 },
			{ name: 'Backpack (leather)', cp: 200 },
			{ name: 'Wineskin', cp: 50, bulk: true },
			{ name: 'Coin Purse', cp: 30, bulk: true },
			{ name: 'Map Case', cp: 100 },
			{ name: 'Leather Gloves', cp: 50, bulk: true },
			{ name: 'Shield (leather)', cp: 1000 },
			{ name: 'Holster / Knife Sheath', cp: 200 },
			{ name: 'Leather Whip', cp: 200 }
		],
		Scrivener: [
			{ name: 'Parchment (10 sheets)', cp: 100, bulk: true },
			{ name: 'Letter Paper (10)', cp: 50, bulk: true },
			{ name: 'Ink (vial)', cp: 100, bulk: true },
			{ name: 'Ink Pen', cp: 20, bulk: true },
			{ name: 'Sealing Wax (stick)', cp: 50, bulk: true },
			{ name: 'Wax Seal Kit', cp: 500 },
			{ name: 'Writing Kit (complete)', cp: 500 },
			{ name: 'Journal / Notebook', cp: 200 },
			{ name: 'Map Case', cp: 100 },
			{ name: 'Almanac (current year)', cp: 1000 },
			{
				name: 'Spell Scroll — Cantrip',
				cp: 2500,
				note: 'Specific cantrip; ask what is in stock',
				rare: true
			},
			{ name: 'Blank Spellbook', cp: 5000, rare: true },
			{ name: 'Copying Service', cp: 200, note: '1 sp per page; takes 1 hour per 5 pages' }
		],
		blacksmith: [
			{ name: 'Dagger', cp: 200 },
			{ name: 'Shortsword', cp: 1000 },
			{ name: 'Longsword', cp: 1500, rare: true },
			{ name: 'Hand Axe', cp: 500 },
			{ name: 'Spear', cp: 100 },
			{ name: 'Quarterstaff (iron-capped)', cp: 20 },
			{ name: 'Shield (steel)', cp: 1000 },
			{ name: 'Light Hammer', cp: 200 },
			{ name: 'Mace', cp: 500 },
			{ name: 'Chain Shirt', cp: 5000, rare: true },
			{ name: 'Scale Mail', cp: 5000, rare: true },
			{ name: 'Horseshoes (set of 4)', cp: 100, bulk: true },
			{ name: 'Iron Tool Set', cp: 500 },
			{ name: 'Iron Pot', cp: 200, bulk: true },
			{ name: 'Nails (100)', cp: 10, bulk: true },
			{ name: 'Crowbar', cp: 200 },
			{ name: 'Grappling Hook', cp: 200 },
			{ name: 'Pitons (10)', cp: 50, bulk: true },
			{ name: 'Padlock (iron)', cp: 500 },
			{ name: 'Iron Spike (10)', cp: 10, bulk: true },
			{ name: 'Battle Axe', cp: 1000, rare: true },
			{ name: 'Warhammer', cp: 1500, rare: true }
		],
		stable: [
			{ name: 'Mule', cp: 800 },
			{ name: 'Draft Horse', cp: 5000 },
			{ name: 'Riding Horse', cp: 7500 },
			{ name: 'Pony', cp: 3000 },
			{ name: 'War Horse', cp: 40000, note: 'Trained for combat; rarely available', rare: true },
			{ name: 'Common Saddle', cp: 1000 },
			{ name: 'Pack Saddle', cp: 500 },
			{ name: 'Military Saddle', cp: 2000, rare: true },
			{ name: 'Bit and Bridle', cp: 200 },
			{ name: 'Saddlebags', cp: 400 },
			{ name: 'Feed (per day)', cp: 5, note: 'Oats and hay', bulk: true },
			{ name: 'Blanket (horse)', cp: 50 },
			{ name: 'Grooming Kit', cp: 100 },
			{ name: 'Horseshoes (set)', cp: 100 },
			{ name: 'Riding Crop', cp: 20, bulk: true },
			{ name: 'Stabling (per night)', cp: 50, note: 'Feed and shelter included' }
		],
		General: [
			{ name: 'Rope, Hemp (50 ft)', cp: 100 },
			{ name: 'Torch (10)', cp: 10, bulk: true },
			{ name: 'Rations (1 day)', cp: 50, bulk: true },
			{ name: 'Bedroll', cp: 100 },
			{ name: 'Backpack', cp: 200 },
			{ name: 'Waterskin', cp: 20, bulk: true },
			{ name: 'Candle (10)', cp: 10, bulk: true },
			{ name: 'Flint and Steel', cp: 100 },
			{ name: 'Ink and Pen', cp: 120 },
			{ name: 'Parchment (10)', cp: 100 },
			{ name: 'Signal Whistle', cp: 10 },
			{ name: 'Soap', cp: 2, bulk: true },
			{ name: 'Common Clothes', cp: 50 }
		],
		Inn: [
			{ name: 'Common Room (floor)', cp: 20, note: 'Per night; shared space by the hearth' },
			{ name: 'Shared Bunk', cp: 50, note: 'Per night; shared dormitory' },
			{ name: 'Private Room', cp: 100, note: 'Per night; simple but clean', rare: true },
			{ name: 'Private Suite', cp: 500, note: 'Per night; best room in the house', rare: true },
			{ name: 'Mug of Ale', cp: 4, bulk: true },
			{ name: 'Pitcher of Ale', cp: 20, bulk: true },
			{ name: 'Cup of Wine', cp: 20, bulk: true },
			{ name: 'Bottle of Wine', cp: 100 },
			{ name: 'Mug of Mead', cp: 30, bulk: true },
			{ name: 'Common Meal', cp: 3, note: 'Bread, broth, and whatever is in season', bulk: true },
			{ name: 'Hot Meal (stew)', cp: 10, note: 'Heartier fare; includes bread', bulk: true },
			{ name: 'Hearty Meal (roast)', cp: 30, note: 'Meat, vegetables, bread, and a drink' },
			{ name: 'Breakfast', cp: 10, note: 'Porridge, eggs, and bread', bulk: true },
			{ name: 'Hot Bath', cp: 30, note: 'Tub and hot water; linens extra' },
			{ name: 'Stabling (per night)', cp: 50, note: 'Feed and shelter included' }
		],
		Tavern: [
			{ name: 'Mug of Ale', cp: 4, bulk: true },
			{ name: 'Pitcher of Ale', cp: 20, bulk: true },
			{ name: 'Mug of Dark Ale', cp: 8, note: 'Richer and heavier than the house ale', bulk: true },
			{ name: 'Cup of House Wine', cp: 20, bulk: true },
			{ name: 'Bottle of House Wine', cp: 100 },
			{ name: 'Mug of Mead', cp: 30, bulk: true },
			{ name: 'Apple Cider (mug)', cp: 10, bulk: true },
			{ name: 'Dwarven Spirits (shot)', cp: 50, note: 'Burns going down; burns coming back up' },
			{ name: 'Hearty Stew', cp: 5, bulk: true },
			{ name: 'Cheese and Bread', cp: 3, bulk: true },
			{ name: 'Roasted Meat', cp: 30, note: 'Whatever the cook had on hand' },
			{ name: 'Hot Meal', cp: 10, bulk: true },
			{ name: 'Fine Wine (bottle)', cp: 300, note: 'Imported; limited stock', rare: true },
			{ name: 'Imported Spirits', cp: 200, note: 'Ask the barkeep what is in stock', rare: true },
			{ name: 'Game (per round)', cp: 5, note: 'Dice or cards; house takes a cut' }
		],
		Temple: [
			{
				name: 'Donation (suggested)',
				cp: 10,
				note: 'Any gift is welcome; the gods note generosity',
				bulk: true
			},
			{
				name: 'Prayer Service',
				cp: 50,
				note: 'Priest leads personal prayer for guidance or thanks',
				bulk: true
			},
			{
				name: 'Blessing of the Faith',
				cp: 100,
				note: 'Minor blessing; advantage on one saving throw (ask the priest)'
			},
			{ name: 'Holy Water (vial)', cp: 2500, note: 'Acts as acid against undead and fiends' },
			{ name: 'Cure Wounds (cast)', cp: 1000, note: 'Priest casts Cure Wounds; heals 1d8+3 hp' },
			{
				name: 'Lesser Restoration',
				cp: 2500,
				note: 'Cures one disease, poison, paralysis, or condition',
				rare: true
			},
			{
				name: 'Remove Curse',
				cp: 5000,
				note: 'Requires approval by the senior priest',
				rare: true
			},
			{ name: 'Last Rites', cp: 500, note: 'Proper burial ceremony; ensures peaceful rest' },
			{
				name: 'Sanctuary (per night)',
				cp: 100,
				note: 'Refuge within temple grounds; no questions asked'
			},
			{
				name: 'Consecrated Burial Plot',
				cp: 3000,
				note: 'In the temple cemetery; prevents undead rising',
				rare: true
			},
			{
				name: 'Raise Dead',
				cp: 50000,
				note: 'Requires diamond worth 500 gp; takes 1 day to perform',
				rare: true
			},
			{
				name: 'Blessed Candle',
				cp: 25,
				note: 'Burns for 8 hours; wards minor evil spirits',
				bulk: true
			},
			{
				name: 'Temple Incense (bundle)',
				cp: 150,
				note: 'Used in ritual; calming and pungent',
				bulk: true
			},
			{
				name: 'Amulet of the Faith',
				cp: 500,
				note: 'Holy symbol in silver; no magical properties'
			},
			{
				name: 'Scroll of Sacred Flame',
				cp: 2500,
				note: 'Cantrip; 1d8 radiant, Dex save DC 13',
				rare: true
			}
		]
	};

	function getShopTrade(b: ListBuilding): string {
		if (b.type === 'blacksmith') return 'blacksmith';
		if (b.type === 'inn') return 'Inn';
		if (b.type === 'tavern') return 'Tavern';
		if (b.type === 'stable') return 'stable';
		if (b.type === 'temple') return 'Temple';
		const m = b.name.match(/'s (.+)$/);
		return m ? m[1] : 'General';
	}

	function fmtPrice(cp: number): string {
		if (cp >= 100) {
			const gp = Math.floor(cp / 100);
			const rem = cp % 100;
			if (rem === 0) return `${gp} gp`;
			if (rem % 10 === 0) return `${gp} gp ${rem / 10} sp`;
			return `${gp} gp ${rem} cp`;
		}
		if (cp % 10 === 0) return `${cp / 10} sp`;
		const sp = Math.floor(cp / 10);
		const rem = cp % 10;
		return sp > 0 ? `${sp} sp ${rem} cp` : `${cp} cp`;
	}

	function generateInventory(b: ListBuilding): ShopItem[] {
		const trade = getShopTrade(b);
		const pool = ITEM_POOLS[trade] ?? ITEM_POOLS['General'];
		const r = mkRng(hashSeed('inv_' + b.name + String(shopSeed), seed));
		const arr = [...pool];
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(r() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		const count = 7 + Math.floor(r() * 4);
		return arr.slice(0, Math.min(count, arr.length)).map((item) => {
			const variance = 0.85 + r() * 0.3;
			const price = Math.max(1, Math.round(item.cp * variance));
			const qty = item.bulk ? `×${1 + Math.floor(r() * 4)}` : '1';
			return { name: item.name, qty, price: fmtPrice(price), note: item.note, rare: item.rare };
		});
	}

	function linkDice(text: string): string {
		return text.replace(
			/(\b\d*d\d+(?:\s*[+-]\s*\d+)?(?=\b|\s|[^a-zA-Z]))/g,
			(dice) => `<button class="inv-dice-btn" data-dice="${dice.trim()}">${dice}</button>`
		);
	}

	function handleInventoryClick(e: MouseEvent) {
		const target = (e.target as HTMLElement).closest('[data-dice]') as HTMLElement | null;
		if (!target?.dataset.dice) return;
		e.stopPropagation();
		const m = target.dataset.dice.trim().match(/^(\d*)d(\d+)(?:\s*[+-]\s*(\d+))?$/i);
		if (!m) return;
		const count = parseInt(m[1]) || 1;
		const sides = parseInt(m[2]);
		const modVal = m[3] ? parseInt(m[3]) : 0;
		triggerRoll(`${count}d${sides}`, (rolls: number[]) => {
			const total = rolls.reduce((s, r) => s + r, 0) + modVal;
			diceRollResult = { expr: target.dataset.dice!.trim(), rolls, sides, modifier: modVal, total };
		});
	}
	// ── Save / Load ───────────────────────────────────────────────────────────────
	interface SavedTown {
		id: string;
		townName: string;
		townSize: TownSize;
		opulence: Opulence;
		hasKeep: boolean;
		seed: number;
		savedAt: number;
	}

	const TOWNS_KEY = 'initiative_saved_towns';

	let savedTowns = $state<SavedTown[]>([]);
	if (typeof window !== 'undefined') {
		try {
			savedTowns = JSON.parse(localStorage.getItem(TOWNS_KEY) ?? '[]');
		} catch {
			savedTowns = [];
		}
	}

	function saveTown() {
		const entry: SavedTown = {
			id: crypto.randomUUID(),
			townName,
			townSize,
			opulence,
			hasKeep,
			seed,
			savedAt: Date.now()
		};
		savedTowns = [...savedTowns, entry];
		localStorage.setItem(TOWNS_KEY, JSON.stringify(savedTowns));
	}

	function deleteSavedTown(id: string) {
		savedTowns = savedTowns.filter((t) => t.id !== id);
		localStorage.setItem(TOWNS_KEY, JSON.stringify(savedTowns));
	}

	function applyTown(t: SavedTown) {
		townName = t.townName;
		townSize = t.townSize;
		opulence = t.opulence;
		hasKeep = t.hasKeep;
		seed = t.seed;
	}

	function randomize() {
		townName = generateTownName();
		seed = Math.floor(Math.random() * 1_000_000_000);
	}

	$effect(() => {
		townName;
		townSize;
		opulence;
		hasKeep;
		seed;
		generateTown();
	});
</script>

<!-- ── Full-screen layout ─────────────────────────────────────────────────── -->
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
				<span class="text-xl">🏘️</span>
				<h2 class="text-lg font-bold tracking-wide text-amber-300">Town Generator</h2>
				{#if townData}
					<span class="text-xs text-gray-500">
						{townData.buildings.length + townData.keepBuildings.length} buildings
					</span>
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
		<!-- Left panel: options -->
		<div
			class="hidden w-56 shrink-0 flex-col gap-5 overflow-y-auto border-r border-gray-800 bg-gray-900/60 p-4 sm:flex"
		>
			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Town Name</label
				>
				<input
					type="text"
					bind:value={townName}
					placeholder="Town name"
					class="w-full rounded bg-gray-800 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:ring-1 focus:ring-amber-500"
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-semibold tracking-wider text-gray-500 uppercase"
					>Settlement Size</label
				>
				<select
					bind:value={townSize}
					class="w-full rounded bg-gray-800 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:ring-1 focus:ring-amber-500"
				>
					<option value="thorp">Thorp</option>
					<option value="hamlet">Hamlet</option>
					<option value="village">Village</option>
					<option value="town">Town</option>
					<option value="city">City</option>
					<option value="metropolis">Metropolis</option>
				</select>
			</div>

			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Wealth</label>
				<select
					bind:value={opulence}
					class="w-full rounded bg-gray-800 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:ring-1 focus:ring-amber-500"
				>
					<option value="poor">Poor</option>
					<option value="modest">Modest</option>
					<option value="comfortable">Comfortable</option>
					<option value="wealthy">Wealthy</option>
				</select>
			</div>

			<label class="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
				<input type="checkbox" bind:checked={hasKeep} class="accent-amber-500" />
				<span>Has Keep</span>
			</label>

			<button
				onclick={randomize}
				class="w-full rounded bg-amber-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 active:bg-amber-800"
			>
				Randomize
			</button>

			<button
				onclick={saveTown}
				class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
			>
				Save Town
			</button>

			{#if savedTowns.length}
				<div class="flex flex-col gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
						>Saved Towns</span
					>
					<div class="flex max-h-52 flex-col gap-1 overflow-y-auto">
						{#each savedTowns as t (t.id)}
							<div class="flex items-center gap-1 rounded bg-gray-800/80 px-2 py-1.5">
								<button
									onclick={() => applyTown(t)}
									class="min-w-0 flex-1 truncate text-left text-xs text-gray-200 hover:text-amber-400"
									title={t.townName}
								>
									{t.townName}
								</button>
								<button
									onclick={() => deleteSavedTown(t.id)}
									class="shrink-0 text-[11px] leading-none text-gray-600 hover:text-red-400"
									aria-label="Delete">X</button
								>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<div class="mt-auto border-t border-gray-800 pt-3">
				<span class="text-[10px] text-gray-600">seed: {seed}</span>
			</div>
		</div>

		<!-- Main content: scrollable building list -->
		<div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
			{#if townData}
				<!-- Town description -->
				<div class="mb-6 rounded-lg border border-gray-700 bg-gray-800/70 px-5 py-4">
					<h3 class="mb-1.5 text-xs font-semibold tracking-widest text-amber-500/80 uppercase">
						About {townName}
					</h3>
					<p class="text-sm leading-relaxed text-gray-300 italic">{townData.description}</p>
				</div>

				<!-- Keep section -->
				{#if hasKeep && townData.keepBuildings.length}
					<section class="mb-8">
						<div class="mb-3 flex items-center gap-3">
							<h3 class="text-xs font-bold tracking-widest text-slate-300 uppercase">The Keep</h3>
							<div class="h-px flex-1 bg-slate-700/60"></div>
							<span class="text-xs text-gray-600">{townData.keepBuildings.length} buildings</span>
						</div>
						<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
							{#each townData.keepBuildings as b}
								<div class="rounded-lg border border-slate-700/60 bg-slate-800/50 p-3.5">
									<div class="mb-2 flex items-center gap-2">
										<span
											class="rounded px-1.5 py-0.5 text-[10px] font-semibold {TYPE_COLOR[b.type]}"
											>{TYPE_LABEL[b.type]}</span
										>
										<span class="text-sm font-semibold text-gray-100">{b.name}</span>
									</div>
									<p class="mb-3 text-xs leading-relaxed text-gray-400 italic">{b.description}</p>
									{#if b.npcs.length}
										<div class="space-y-1.5 border-t border-slate-700/60 pt-2">
											{#each b.npcs as npc}
												<div class="text-xs">
													<span class="font-semibold text-gray-200">{npc.name}</span>
													<span class="text-gray-500"> — {npc.role}</span>
												</div>
											{/each}
										</div>
									{/if}
									<div class="mt-2.5 border-t border-slate-700/60 pt-2.5">
										<button
											onclick={() => (floorplanBuilding = b)}
											class="w-full rounded bg-slate-700/40 px-2 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-600/50"
											>Floor Plan</button
										>
									</div>
								</div>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Building categories -->
				{#each CATEGORIES as cat}
					{@const catBuildings = townData.buildings.filter((b) => cat.types.includes(b.type))}
					{#if catBuildings.length}
						<section class="mb-8">
							<div class="mb-3 flex items-center gap-3">
								<h3 class="text-xs font-bold tracking-widest text-gray-400 uppercase">
									{cat.label}
								</h3>
								<div class="h-px flex-1 bg-gray-700/60"></div>
								<span class="text-xs text-gray-600">{catBuildings.length} buildings</span>
							</div>
							<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
								{#each catBuildings as b}
									<div class="rounded-lg border border-gray-700/60 bg-gray-800/70 p-3.5">
										<div class="mb-2 flex items-center gap-2">
											<span
												class="rounded px-1.5 py-0.5 text-[10px] font-semibold {TYPE_COLOR[b.type]}"
												>{TYPE_LABEL[b.type]}</span
											>
											<span class="text-sm font-semibold text-gray-100">{b.name}</span>
										</div>
										<p class="mb-3 text-xs leading-relaxed text-gray-400 italic">{b.description}</p>
										{#if b.npcs.length}
											<div class="space-y-1.5 border-t border-gray-700/60 pt-2">
												{#each b.npcs as npc}
													<div class="text-xs">
														<span class="font-semibold text-gray-200">{npc.name}</span>
														<span class="text-gray-500"> — {npc.role}</span>
													</div>
												{/each}
											</div>
										{/if}
										<div class="mt-2.5 flex gap-2 border-t border-gray-700/60 pt-2.5">
											<button
												onclick={() => (floorplanBuilding = b)}
												class="flex-1 rounded bg-slate-700/40 px-2 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-600/50"
												>Floor Plan</button
											>
											{#if ['shop', 'blacksmith', 'stable', 'inn', 'tavern', 'temple'].includes(b.type)}
												<button
													onclick={() => {
														selectedShop = b;
														shopSeed = 0;
													}}
													class="flex-1 rounded bg-amber-700/30 px-2 py-1 text-xs font-semibold text-amber-300 transition hover:bg-amber-700/50"
													>{['inn', 'tavern'].includes(b.type)
														? 'View Menu'
														: b.type === 'temple'
															? 'View Services'
															: 'View Inventory'}</button
												>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</section>
					{/if}
				{/each}
			{/if}
		</div>
	</div>

	<!-- Shop inventory overlay -->
	{#if selectedShop}
		{@const inv = generateInventory(selectedShop)}
		<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
			<div
				class="relative flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
			>
				<!-- Header -->
				<div class="flex items-center justify-between border-b border-gray-700 px-4 py-3">
					<div class="flex items-center gap-2">
						<span
							class="rounded px-1.5 py-0.5 text-[10px] font-semibold {TYPE_COLOR[
								selectedShop.type
							]}">{TYPE_LABEL[selectedShop.type]}</span
						>
						<span class="text-sm font-bold text-gray-100">{selectedShop.name}</span>
					</div>
					<div class="flex items-center gap-2">
						<button
							onclick={() => shopSeed++}
							class="rounded bg-amber-700/30 px-2.5 py-1 text-xs font-semibold text-amber-300 transition hover:bg-amber-700/50"
							>Restock</button
						>
						<button
							onclick={() => {
								selectedShop = null;
							}}
							class="rounded p-1 text-gray-400 transition hover:bg-gray-700 hover:text-gray-100"
							aria-label="Close"
						>
							<i class="fa-solid fa-xmark text-base" aria-hidden="true"></i>
						</button>
					</div>
				</div>
				<!-- Table -->
				<div role="presentation" onclick={handleInventoryClick} class="overflow-y-auto px-4 py-3">
					<table class="w-full text-xs">
						<thead>
							<tr class="border-b border-gray-700 text-left text-gray-500">
								<th class="pb-2 font-semibold">Item</th>
								<th class="pb-2 text-center font-semibold">Qty</th>
								<th class="pb-2 text-right font-semibold">Price</th>
							</tr>
						</thead>
						<tbody>
							{#each inv as item}
								<tr
									class="border-b border-gray-800 {item.rare ? 'text-amber-300' : 'text-gray-300'}"
								>
									<td class="py-1.5 pr-2">
										<span class="font-medium">{item.name}</span>
										{#if item.rare}<span
												class="ml-1 rounded bg-amber-900/50 px-1 text-[9px] font-bold tracking-wide text-amber-400 uppercase"
												>rare</span
											>{/if}
										{#if item.note}<div class="mt-0.5 text-[10px] text-gray-500 italic">
												{@html linkDice(item.note)}
											</div>{/if}
									</td>
									<td class="py-1.5 text-center">{item.qty}</td>
									<td class="py-1.5 text-right">{item.price}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<!-- Dice roll result popover -->
		{#if diceRollResult}
			{@const r = diceRollResult}
			<div
				class="absolute inset-0 z-[70] flex items-center justify-center"
				role="dialog"
				aria-modal="true"
				aria-label="Dice roll result"
				tabindex="-1"
				onclick={() => (diceRollResult = null)}
				onkeydown={(e) => {
					if (e.key === 'Escape') diceRollResult = null;
				}}
			>
				<div
					class="max-w-xs min-w-[14rem] rounded-xl border border-gray-600 bg-gray-900 p-5 shadow-2xl"
					onclick={(e) => e.stopPropagation()}
				>
					<div class="mb-3 flex items-center justify-between">
						<h4 class="font-black tracking-wide text-amber-400">{r.expr}</h4>
						<button
							onclick={() => (diceRollResult = null)}
							class="text-gray-500 transition hover:text-white"
							aria-label="Close"
						>
							<i class="fa-solid fa-xmark text-base" aria-hidden="true"></i>
						</button>
					</div>
					<div class="mb-3 flex flex-wrap gap-2">
						{#each r.rolls as roll}
							<div
								class="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-gray-600 bg-gray-800 text-lg font-black text-white"
							>
								{roll}
							</div>
						{/each}
					</div>
					{#if r.modifier !== 0}
						<p class="mb-1 text-sm text-gray-400">
							Dice sum: {r.rolls.reduce((s, v) => s + v, 0)}<span
								class={r.modifier > 0 ? 'text-green-400' : 'text-red-400'}
							>
								{r.modifier > 0 ? '+' : ''}{r.modifier}</span
							>
						</p>
					{/if}
					<p class="text-2xl font-black text-white">
						Total: <span class="text-amber-300">{r.total}</span>
					</p>
				</div>
			</div>
		{/if}
	{/if}
</div>

{#if floorplanBuilding}
	<BuildingFloorplanModal building={floorplanBuilding} onclose={() => (floorplanBuilding = null)} />
{/if}

<style>
	:global(.inv-dice-btn) {
		display: inline;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		color: rgb(252, 211, 77);
		text-decoration: underline;
		text-decoration-style: dotted;
		cursor: pointer;
		background: transparent;
		border: none;
		padding: 0;
		font-size: inherit;
		line-height: inherit;
	}
	:global(.inv-dice-btn:hover) {
		color: rgb(253, 230, 138);
	}
</style>
