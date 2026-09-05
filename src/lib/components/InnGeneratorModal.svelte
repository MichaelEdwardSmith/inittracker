<!-- Inn Generator — full-screen modal with owner, staff, menu, rooms, quests -->
<script lang="ts">
	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	// ── Types ─────────────────────────────────────────────────────────────────────
	type Quality = 'poor' | 'modest' | 'comfortable' | 'wealthy' | 'legendary';
	type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';

	interface StaffCard {
		name: string;
		role: string;
		description: string;
	}
	interface MenuItem {
		name: string;
		price: string;
		note?: string;
	}
	interface RoomType {
		type: string;
		qty: number;
		pricePerNight: string;
		note?: string;
	}
	interface QuestGuest {
		name: string;
		race: string;
		profession: string;
		appearance: string;
		demeanor: string;
	}
	interface Quest {
		guest: QuestGuest;
		hook: string;
		complication: string;
		goal: string;
		reward: string;
		difficulty: Difficulty;
	}
	interface InnData {
		name: string;
		tagline: string;
		qualityBadge: string;
		owner: { name: string; race: string; personality: string };
		staff: StaffCard[];
		food: MenuItem[];
		drink: MenuItem[];
		rooms: RoomType[];
		quests: Quest[];
		rumors: Rumor[];
	}

	// ── Controls ──────────────────────────────────────────────────────────────────
	let quality = $state<Quality>('modest');
	let partySize = $state(4);
	let partyLevel = $state(1);
	let seed = $state(Math.floor(Math.random() * 1_000_000_000));
	let innData = $state<InnData | null>(null);

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
		'Walther',
		'Torben',
		'Caswin',
		'Draven',
		'Edric',
		'Farlan',
		'Godwin'
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
		'Yara',
		'Cathra',
		'Elswyn',
		'Idris',
		'Josselyn',
		'Mirna'
	];
	const LAST = [
		'Ashford',
		'Blackwell',
		'Copperfield',
		'Dunmore',
		'Emberly',
		'Fairweather',
		'Goldsmith',
		'Hartley',
		'Ironwood',
		'Ketterly',
		'Lorn',
		'Millwood',
		'Netherby',
		'Oakhurst',
		'Pendleton',
		'Ravenswood',
		'Stone',
		'Thatcher',
		'Underhill',
		'Varley',
		'Wainwright',
		'Yardley',
		'Crestfall',
		'Duskmore'
	];

	const RACES = [
		'Human',
		'Dwarf',
		'Half-Elf',
		'Halfling',
		'Gnome',
		'Tiefling',
		'Dragonborn',
		'Half-Orc',
		'Elf',
		'Goliath'
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
		'Gilded',
		'Broken',
		'Leaning',
		'Smiling',
		'Laughing',
		'Crowing',
		'Limping',
		'Boisterous',
		'Weary',
		'Creaking',
		'Howling',
		'Sparkling',
		'Tarnished',
		'Roaming',
		'Crooked'
	];
	const INN_NOUN = [
		'Boar',
		'Pony',
		'Stag',
		'Chalice',
		'Flagon',
		'Lantern',
		'Goose',
		'Horseshoe',
		'Raven',
		'Barrel',
		'Hound',
		'Anchor',
		'Crow',
		'Badger',
		'Hammer',
		'Shield',
		'Coin',
		'Dragon',
		'Serpent',
		'Cask',
		'Kettle',
		'Hearth',
		'Torch',
		'Helm',
		'Bell',
		'Pilgrim',
		'Knight',
		'Maiden',
		'Fox',
		'Ox',
		'Wheel',
		'Sword',
		'Crown'
	];

	// ── Helpers ───────────────────────────────────────────────────────────────────
	function pname(rng: () => number): string {
		return `${pick(rng() < 0.5 ? FM : FF, rng)} ${pick(LAST, rng)}`;
	}
	function formatCp(cp: number): string {
		if (cp >= 1000) {
			const gp = cp / 100;
			return Number.isInteger(gp) ? `${gp} gp` : `${gp.toFixed(1)} gp`;
		}
		if (cp >= 10) {
			const sp = cp / 10;
			return Number.isInteger(sp) ? `${sp} sp` : `${sp.toFixed(1)} sp`;
		}
		return `${cp} cp`;
	}

	// ── Quality config ────────────────────────────────────────────────────────────
	const QUALITY_LABELS: Record<Quality, string> = {
		poor: 'Poor',
		modest: 'Modest',
		comfortable: 'Comfortable',
		wealthy: 'Wealthy',
		legendary: 'Legendary'
	};
	const QUALITY_BADGE_COLOR: Record<Quality, string> = {
		poor: 'bg-gray-700 text-gray-300',
		modest: 'bg-stone-700 text-stone-200',
		comfortable: 'bg-green-800 text-green-200',
		wealthy: 'bg-amber-700 text-amber-100',
		legendary: 'bg-purple-800 text-purple-100'
	};
	const DIFF_COLOR: Record<Difficulty, string> = {
		trivial: 'bg-gray-700 text-gray-300',
		easy: 'bg-green-800 text-green-200',
		medium: 'bg-yellow-700 text-yellow-100',
		hard: 'bg-orange-700 text-orange-100',
		deadly: 'bg-red-800 text-red-200'
	};

	// ── Price multiplier by quality ───────────────────────────────────────────────
	const QUALITY_MULT: Record<Quality, number> = {
		poor: 0.5,
		modest: 1,
		comfortable: 2,
		wealthy: 4,
		legendary: 10
	};

	// ── Staff count by quality ────────────────────────────────────────────────────
	const STAFF_COUNT: Record<Quality, number> = {
		poor: 1,
		modest: 2,
		comfortable: 3,
		wealthy: 4,
		legendary: 5
	};

	// ── Generation ────────────────────────────────────────────────────────────────
	function generateInn(): InnData {
		const rng = mkRng(hashSeed(`inn_${quality}_${partySize}_${partyLevel}`, seed));

		// Inn name & tagline
		const innAdj = pick(INN_ADJ, rng);
		const innNoun = pick(INN_NOUN, rng);
		const name = `The ${innAdj} ${innNoun}`;
		const taglines: Record<Quality, string[]> = {
			poor: [
				'The straw is mostly clean and the roof only leaks in three places.',
				'Lodging so humble even bandits walk past.',
				'The ale is weak, but the price is weaker.',
				'If you have nowhere else to go, you have somewhere to go.'
			],
			modest: [
				'Honest food, honest prices, honest beds.',
				'Not the best room in town, but reliably not the worst.',
				'The stew is filling. The beds are dry. What else do you need?',
				"A traveler's inn: dependable, unremarkable, and exactly what it claims to be."
			],
			comfortable: [
				'Where merchants sleep easy and adventurers sleep better.',
				'Good food, good company, good rest.',
				'The sort of inn that makes you reconsider leaving in the morning.',
				'Clean sheets, hot meals, and a barkeep who remembers your order.'
			],
			wealthy: [
				'The finest establishment between here and the capital.',
				'Where lords stay when they must travel with the commoners.',
				'Excellence in every detail, from the cellar to the chimney.',
				'The kind of inn that makes you rethink your life choices — for the better.'
			],
			legendary: [
				'Spoken of in seven kingdoms. Worth every coin.',
				'They say kings have slept here. The sheets have been laundered since.',
				'A destination, not merely a stop.',
				'The inn at the center of every great story in this region.'
			]
		};
		const tagline = pick(taglines[quality], rng);

		// Owner
		const ownerName = pname(rng);
		const ownerRace = pick(RACES, rng);
		const ownerTraits: Record<Quality, string[]> = {
			poor: [
				`${ownerName} runs the ${name} with the grim determination of someone who has run out of other options. The inn is rough, the conversation rougher, but the owner keeps it open through sheer stubbornness. Most regulars have known them long enough to call it character.`,
				`Hard years have made ${ownerName} a practical sort — no credit, no complaints, no questions about what you're carrying. The ${name} exists because enough people need somewhere to sleep, and ${ownerName} needs enough coin to get through winter.`,
				`${ownerName} inherited the ${name} and has been meaning to fix it up for years. The intention is genuine. The execution, less so. Still, they keep the fire burning and the rats at a manageable number.`
			],
			modest: [
				`${ownerName} has run the ${name} for eleven years and has no intention of stopping. They know every regular by name and preference, and have an uncanny ability to sense trouble before it starts. The inn is their life's work, and they are quietly proud of it.`,
				`A steady hand and an even temper define ${ownerName}'s management of the ${name}. They are honest to a fault, fair with prices, and will not tolerate bullying in their common room — a policy enforced with surprising effectiveness for someone their size.`,
				`${ownerName} came to innkeeping late in life, after a career in something they never discuss. Whatever it was, it left them observant, practical, and very good at reading a room. The ${name} benefits from all three.`
			],
			comfortable: [
				`${ownerName} has built the ${name} into a genuine institution through years of careful attention. They source ingredients from local farms, train staff properly, and care about reputation more than short-term profit. Regulars consider the inn a second home.`,
				`Warm, expansive, and genuinely delighted to see guests, ${ownerName} is exactly the innkeeper the ${name} deserves. Their enthusiasm is not performance — they simply love providing good hospitality, and it shows in every detail of the establishment.`,
				`${ownerName} runs the ${name} with the precision of a military operation and the warmth of a family kitchen. Nothing is left to chance, but nothing feels impersonal. They have a gift for making guests feel expected, even when they arrived unannounced.`
			],
			wealthy: [
				`${ownerName} is polished, precise, and expects the same from everyone on staff. The ${name} is an expression of their standards, which are high and non-negotiable. Guests who appreciate quality are treated like royalty; guests who do not are treated like mistakes.`,
				`Cultivated and quietly formidable, ${ownerName} built the ${name} from a modest tavern through connections, taste, and a willingness to spend money to make money. They know everyone worth knowing in three provinces and make that access part of the inn's appeal.`,
				`${ownerName} moves through the ${name} like a natural force — adjusting, correcting, charming. They are never rude, never flustered, and never wrong about what a room needs. Staff find them slightly intimidating; guests find them perfect.`
			],
			legendary: [
				`${ownerName} is a legend in their own right — a former adventurer, diplomat, or court figure whose history is the subject of considerable speculation. The ${name} was built on that history and now surpasses it. Meeting them in person is, for many guests, the point of the visit.`,
				`${ownerName} has made the ${name} famous through sheer refusal to compromise. Every detail, every ingredient, every hire has been deliberate. After decades of that approach, the result is an establishment that no longer needs to advertise. They simply wait, and the worthy arrive.`,
				`${ownerName} receives guests as an equal regardless of rank, which is either remarkable modesty or remarkable confidence — the guests who know them best disagree on which. The ${name} is their monument, and they are still adding to it.`
			]
		};
		const ownerPersonality = pick(ownerTraits[quality], rng);

		// Staff
		const staffRoles = [
			{
				role: 'Barkeep',
				descs: [
					'Works the bar with quiet efficiency, remembering faces and forgetting nothing else.',
					'Cheerful and quick-handed, refills cups before anyone has to ask.',
					'Says little, misses nothing. The sort of barkeep who makes the common room feel safe.'
				]
			},
			{
				role: 'Cook',
				descs: [
					'Produces honest food at remarkable speed. Not an artist, but entirely reliable.',
					'Has a few signature dishes and defends the recipes with genuine ferocity.',
					'Started as a kitchen hand and worked up over fifteen years. Knows every pot by name.'
				]
			},
			{
				role: 'Server',
				descs: [
					'Navigates the common room with practiced ease, never spilling, rarely stopping.',
					'Remembers every order, carries four plates at once, and is tipped accordingly.',
					'Quick, polite, and somehow always in the right place. Probably has eyes in the back of their head.'
				]
			},
			{
				role: 'Stablehand',
				descs: [
					'Handles horses with calm authority. The animals relax visibly when they arrive.',
					'Knows more about horses than most people know about anything. Conversation limited to the topic.',
					'Young but competent; the older stable animals have already accepted them as the authority.'
				]
			},
			{
				role: 'Guard',
				descs: [
					'Stands near the door and looks like the kind of person you would not argue with. This works.',
					'Former soldier. Breaks up trouble quietly and professionally, which is more impressive than it sounds.',
					'Polite to guests, firm with problems. Has a talent for identifying which category someone falls into.'
				]
			},
			{
				role: 'Chambermaid',
				descs: [
					'Keeps the rooms impeccably and sees everything without appearing to look.',
					'Moves through the inn like a ghost, leaving clean rooms and fresh linens in her wake.',
					'Has strong opinions about linen folding and is prepared to explain them at length.'
				]
			},
			{
				role: 'Porter',
				descs: [
					'Carries luggage as though it weighs nothing, which it mostly does not, comparatively.',
					'Knows every room, every guest, and every shortcut in the building.',
					'Quiet, helpful, and entirely trustworthy — the owner vouches for them personally.'
				]
			},
			{
				role: 'Entertainment',
				descs: [
					'Plays the lute adequately and the crowd brilliantly. The crowd is the real instrument.',
					'Tells stories and sings songs with equal facility. The common room fills up on nights they perform.',
					'A bard of modest but genuine talent who has found their ideal posting here.'
				]
			}
		];
		const staffCount = STAFF_COUNT[quality];
		const staff: StaffCard[] = [];
		const shuffledRoles = [...staffRoles].sort(() => rng() - 0.5);
		for (let i = 0; i < Math.min(staffCount, shuffledRoles.length); i++) {
			const sr = shuffledRoles[i];
			const srng = mkRng(hashSeed(`staff_${i}_${quality}`, seed));
			staff.push({
				name: pname(srng),
				role: sr.role,
				description: pick(sr.descs, srng)
			});
		}

		// Menu — food
		const mult = QUALITY_MULT[quality];
		const foodPools: Record<Quality, MenuItem[]> = {
			poor: [
				{ name: 'Watery porridge', price: formatCp(Math.round(1 * mult)), note: 'Best eaten hot' },
				{ name: 'Hard bread and dripping', price: formatCp(Math.round(2 * mult)) },
				{
					name: "Yesterday's stew",
					price: formatCp(Math.round(3 * mult)),
					note: "What's in it changes daily"
				},
				{ name: 'Boiled turnips', price: formatCp(Math.round(1 * mult)) },
				{ name: 'Salt pork rind', price: formatCp(Math.round(2 * mult)) }
			],
			modest: [
				{
					name: "Traveler's stew",
					price: formatCp(Math.round(5 * mult)),
					note: 'Thick and filling'
				},
				{ name: 'Roast root vegetables', price: formatCp(Math.round(4 * mult)) },
				{ name: 'Bread and cheese board', price: formatCp(Math.round(6 * mult)) },
				{ name: 'Smoked sausage and bread', price: formatCp(Math.round(7 * mult)) },
				{ name: 'Baked apple', price: formatCp(Math.round(3 * mult)), note: 'Seasonal' },
				{ name: 'Bean soup', price: formatCp(Math.round(4 * mult)) }
			],
			comfortable: [
				{
					name: 'Roast chicken with herbs',
					price: formatCp(Math.round(20 * mult)),
					note: 'Half or whole'
				},
				{ name: 'Hearty beef stew', price: formatCp(Math.round(15 * mult)) },
				{ name: 'Fresh bread with butter and honey', price: formatCp(Math.round(8 * mult)) },
				{
					name: 'Pan-fried trout',
					price: formatCp(Math.round(25 * mult)),
					note: 'Caught this morning'
				},
				{ name: 'Pork chop with braised greens', price: formatCp(Math.round(20 * mult)) },
				{ name: 'Cheese board with dried fruit', price: formatCp(Math.round(12 * mult)) },
				{ name: 'Spiced apple tart', price: formatCp(Math.round(10 * mult)) }
			],
			wealthy: [
				{ name: 'Roast rack of lamb', price: formatCp(Math.round(80 * mult)) },
				{
					name: 'Stuffed pheasant with wine reduction',
					price: formatCp(Math.round(120 * mult)),
					note: 'Requires one hour notice'
				},
				{ name: 'Seared venison with mushroom sauce', price: formatCp(Math.round(100 * mult)) },
				{ name: 'Freshwater salmon in butter', price: formatCp(Math.round(90 * mult)) },
				{ name: 'Fine cheese and charcuterie board', price: formatCp(Math.round(60 * mult)) },
				{ name: 'Artisan bread basket', price: formatCp(Math.round(20 * mult)) },
				{
					name: 'Poached pear in spiced wine',
					price: formatCp(Math.round(30 * mult)),
					note: 'Dessert'
				}
			],
			legendary: [
				{
					name: 'Whole roast boar',
					price: formatCp(Math.round(500 * mult)),
					note: 'Serves a table; 2 hr notice required'
				},
				{
					name: "Chef's tasting menu",
					price: formatCp(Math.round(300 * mult)),
					note: 'Seven courses, changes nightly'
				},
				{ name: 'Imported spiced duck', price: formatCp(Math.round(200 * mult)) },
				{
					name: 'Poached river eel in saffron',
					price: formatCp(Math.round(180 * mult)),
					note: 'Rare preparation'
				},
				{ name: 'Artisan bread and aged cheese flight', price: formatCp(Math.round(80 * mult)) },
				{ name: 'Flame-seared surf-and-turf', price: formatCp(Math.round(250 * mult)) },
				{
					name: 'Grand dessert platter',
					price: formatCp(Math.round(120 * mult)),
					note: "Pastry chef's selection"
				}
			]
		};
		const drinkPools: Record<Quality, MenuItem[]> = {
			poor: [
				{ name: 'Small ale (mug)', price: formatCp(Math.round(2 * mult)) },
				{ name: 'Watered-down wine (cup)', price: formatCp(Math.round(3 * mult)) },
				{ name: 'Well water', price: formatCp(1) }
			],
			modest: [
				{ name: 'Common ale (mug)', price: formatCp(Math.round(4 * mult)) },
				{ name: 'Table wine (cup)', price: formatCp(Math.round(6 * mult)) },
				{ name: 'Cider (mug)', price: formatCp(Math.round(5 * mult)) },
				{ name: 'Mead (cup)', price: formatCp(Math.round(8 * mult)) },
				{ name: 'Hot tea', price: formatCp(Math.round(2 * mult)) }
			],
			comfortable: [
				{ name: 'House ale (mug)', price: formatCp(Math.round(8 * mult)) },
				{ name: 'Local wine (cup)', price: formatCp(Math.round(12 * mult)) },
				{ name: 'Dark stout (mug)', price: formatCp(Math.round(10 * mult)) },
				{ name: 'Honeyed mead (cup)', price: formatCp(Math.round(14 * mult)) },
				{ name: 'Mulled wine (cup)', price: formatCp(Math.round(15 * mult)), note: 'Seasonal' },
				{ name: 'Spiced cider (mug)', price: formatCp(Math.round(10 * mult)) }
			],
			wealthy: [
				{ name: 'Premium ale, local brewery (mug)', price: formatCp(Math.round(20 * mult)) },
				{ name: 'Imported red wine (cup)', price: formatCp(Math.round(40 * mult)) },
				{ name: 'Fine white wine (cup)', price: formatCp(Math.round(35 * mult)) },
				{ name: 'Aged mead (goblet)', price: formatCp(Math.round(50 * mult)) },
				{ name: 'Brandy (measure)', price: formatCp(Math.round(60 * mult)) },
				{ name: 'Herbal spirits (measure)', price: formatCp(Math.round(55 * mult)) }
			],
			legendary: [
				{
					name: 'Vintage estate wine (cup)',
					price: formatCp(Math.round(200 * mult)),
					note: 'Ask for the year'
				},
				{
					name: 'Elven spring wine (goblet)',
					price: formatCp(Math.round(300 * mult)),
					note: 'Extremely limited'
				},
				{ name: 'Reserve aged brandy (measure)', price: formatCp(Math.round(250 * mult)) },
				{
					name: 'Dwarven dark ale (mug)',
					price: formatCp(Math.round(150 * mult)),
					note: 'Imported'
				},
				{ name: 'Honey liqueur (measure)', price: formatCp(Math.round(180 * mult)) },
				{
					name: 'Spiced exotic spirits (measure)',
					price: formatCp(Math.round(200 * mult)),
					note: 'Origin unknown'
				}
			]
		};
		const food = foodPools[quality]
			.sort(() => rng() - 0.5)
			.slice(0, quality === 'poor' ? 4 : quality === 'modest' ? 5 : 6);
		const drink = drinkPools[quality]
			.sort(() => rng() - 0.5)
			.slice(0, quality === 'poor' ? 3 : quality === 'modest' ? 4 : 5);

		// Rooms
		const roomDefs: Record<Quality, RoomType[]> = {
			poor: [
				{
					type: 'Floor space (common room)',
					qty: 10,
					pricePerNight: formatCp(Math.round(3)),
					note: 'Bring your own bedroll'
				},
				{ type: 'Shared bunk (dormitory)', qty: 6, pricePerNight: formatCp(Math.round(5)) }
			],
			modest: [
				{ type: 'Common bunk (dormitory)', qty: 8, pricePerNight: formatCp(Math.round(10)) },
				{
					type: 'Private room (single)',
					qty: 4,
					pricePerNight: formatCp(Math.round(30)),
					note: 'Clean straw mattress'
				},
				{ type: 'Private room (double)', qty: 2, pricePerNight: formatCp(Math.round(50)) }
			],
			comfortable: [
				{
					type: 'Standard room',
					qty: 6,
					pricePerNight: formatCp(Math.round(100)),
					note: 'Real mattress and washbasin'
				},
				{ type: 'Double room', qty: 4, pricePerNight: formatCp(Math.round(150)) },
				{
					type: 'Corner suite',
					qty: 2,
					pricePerNight: formatCp(Math.round(250)),
					note: 'Larger, quieter'
				}
			],
			wealthy: [
				{
					type: 'Standard room',
					qty: 8,
					pricePerNight: formatCp(Math.round(500)),
					note: 'Fine linen, hearth'
				},
				{ type: 'Deluxe room', qty: 4, pricePerNight: formatCp(Math.round(800)) },
				{
					type: 'Junior suite',
					qty: 3,
					pricePerNight: formatCp(Math.round(1500)),
					note: 'Private sitting room'
				},
				{
					type: 'Master suite',
					qty: 1,
					pricePerNight: formatCp(Math.round(3000)),
					note: 'The finest room available'
				}
			],
			legendary: [
				{
					type: 'Grand standard room',
					qty: 10,
					pricePerNight: formatCp(Math.round(2000)),
					note: 'Silk sheets, dedicated attendant'
				},
				{ type: 'Prestige suite', qty: 6, pricePerNight: formatCp(Math.round(5000)) },
				{
					type: 'The Royal Chambers',
					qty: 2,
					pricePerNight: formatCp(Math.round(15000)),
					note: 'Rumoured to have magical locks'
				},
				{
					type: 'The Vault Suite',
					qty: 1,
					pricePerNight: formatCp(Math.round(30000)),
					note: 'By invitation only'
				}
			]
		};
		const rooms = roomDefs[quality];

		// Quests
		const tier = partyLevel <= 4 ? 1 : partyLevel <= 8 ? 2 : partyLevel <= 12 ? 3 : 4;
		const numQuests = Math.min(6, Math.max(3, Math.floor(partySize / 2) + 2));
		const quests: Quest[] = [];

		const DIFFICULTIES: Difficulty[] = ['trivial', 'easy', 'medium', 'medium', 'hard', 'deadly'];
		const diffPool = [...DIFFICULTIES].sort(() => rng() - 0.5);

		const professions = [
			'Merchant',
			'Farmer',
			'Scholar',
			'Retired Soldier',
			'Hedge Wizard',
			'Pilgrim',
			'Courier',
			'Herbalist',
			'Scribe',
			'Blacksmith',
			'Fisherman',
			'Noble',
			'Priest',
			'Wandering Monk',
			'Cartographer'
		];
		const appearances = [
			'road-worn traveling clothes and a haunted look',
			'fine garments gone to seed, as though worn for weeks without care',
			'practical attire and the kind of sunburn that comes from too much travel',
			'dust-covered robes clutched closed despite the warmth inside',
			'a heavy cloak fastened wrong, suggesting haste',
			'simple clothes, clean but mended many times over',
			"pilgrim's garb adorned with the tokens of several shrines",
			"merchant's dress too fine for the circumstances they describe",
			'traveling leathers with more pouches than seems practical',
			'old military coat worn over civilian clothes'
		];
		const demeanors = [
			'Desperate but trying not to show it',
			'Calm in the way only the very frightened manage to be',
			'Businesslike, as though hiring adventurers is a routine errand',
			'Grieving, but holding themselves together by will',
			'Furious and barely suppressing it',
			'Exhausted, haunted, and grateful for anyone who will listen',
			'Cautiously optimistic despite everything',
			'Measured and precise; this is clearly not their first crisis',
			'Trembling but resolute',
			'Wary of strangers, but with nowhere else to turn'
		];

		// Tier-appropriate location pool
		const locations: Record<number, string[]> = {
			1: [
				'the old mill outside town',
				'Greymoor Forest',
				'the abandoned farmhouse',
				'the Ashfield mine',
				'Millhaven Crossing',
				'the ruined watchtower',
				'Copse of Whispers',
				'the Dunwater marshes',
				'Redthorn village',
				'the old tollhouse on the Merchant Road'
			],
			2: [
				'the Stoneguard ruins',
				"the Wyrm's Pass",
				'Blackthorn Abbey',
				'the Cursed Barrow of Erith',
				'Ironhold Fortress',
				'the Saltmere coast',
				'the Thornwood',
				'Ashkeep',
				'the sunken temple in Greywood',
				"the Cult's hidden compound near the Duskwall hills"
			],
			3: [
				'the Shattered Citadel',
				'the Undercity of Varholm',
				"the Demon's Gate Pass",
				'the Tomb of the Uncrowned King',
				'the Planar Rift at Ashenvale',
				"Lord Corvain's Fortress",
				'the ruins of the Mage-City',
				'the Sable Archive',
				'Nethermoor Reaches',
				'the Cathedral of Bone'
			],
			4: [
				"the Dragon's Reach",
				'the divine wound at the heart of the kingdom',
				"the Demon Lord's sanctum at the Rift's Edge",
				'the Celestial Observatory of the Fallen Order',
				'the Shattered Throne of the Dead God',
				'the Abyss Shard embedded in Castle Valdris',
				'the Well of Endings',
				'the God-Tomb beneath the capital',
				"the Worldbreaker's prison",
				'the Last Gate'
			]
		};

		// Tier-appropriate quest templates
		type QuestTemplate = { hook: string; complication: string; goal: string; reward: string };
		const questTemplates: Record<number, QuestTemplate[]> = {
			1: [
				{
					hook: 'A local child has gone missing near [LOCATION]. The parent is beside themselves and the constable is out of ideas.',
					complication:
						'The child followed a group of goblins they thought were "funny." The goblins are not trying to harm them, but they are not letting them leave either.',
					goal: 'Recover the child safely. Ideally without turning the encounter into a massacre the village will be talking about for years.',
					reward: "The family's savings: 25 gp, and a recommendation to the local merchant guild."
				},
				{
					hook: 'A merchant caravan went silent after passing through [LOCATION]. The trading company wants to know why.',
					complication:
						'Bandits, but smarter than average. They have taken the merchants hostage and are selling their silence to a local fence.',
					goal: "Recover the merchants and the cargo. The fence's identity would be a welcome bonus.",
					reward:
						'50 gp upon safe return of the caravan. The merchant company will remember the name.'
				},
				{
					hook: 'Strange lights have been seen at [LOCATION] for three nights running. The village elder offers coin for an explanation.',
					complication:
						"A hedge wizard's experiment has gone wrong. The lights are harmless but the wizard is now trapped inside a failed ritual circle.",
					goal: 'Dispel or disrupt the ritual and recover the wizard before they go mad from isolation.',
					reward:
						"30 gp from the village elder, plus the wizard's gratitude and minor magical assistance."
				},
				{
					hook: 'Livestock has been disappearing from farms near [LOCATION]. The culprit leaves three-toed tracks and a faint smell of sulfur.',
					complication:
						'A young wyvern, barely the size of a cart horse, has set up a nest nearby. It is hungry, not malicious.',
					goal: "Stop the livestock losses. Whether that means driving off the wyvern, killing it, or finding it another food source is the party's call.",
					reward: '40 gp pooled from the affected farms, plus room and board for as long as needed.'
				},
				{
					hook: 'The innkeeper asks the party to deliver a sealed letter to [LOCATION] by morning. The pay is good. The urgency is suspicious.',
					complication:
						'The letter is a ransom demand from someone who has taken a hostage. The innkeeper owes a debt they cannot repay any other way.',
					goal: 'Decide: deliver the letter, intercept the exchange, or find a third option the innkeeper has not considered.',
					reward: '20 gp for delivery. More if the party improves the outcome.'
				},
				{
					hook: 'A miller at [LOCATION] claims his mill is haunted. Bags move on their own, work is undone each morning, and the wheel keeps turning after the water is dammed.',
					complication:
						"It is the spirit of the miller's former apprentice, who died in an accident on the premises. The spirit is not malicious — it is simply trying to finish the work it left undone.",
					goal: 'Help the spirit understand it is dead and move on, or find a way to let it finish the work so it can rest. Either way, the miller needs to sleep.',
					reward: '35 gp from the miller and a sack of flour that will feed the party for a month.'
				},
				{
					hook: 'An old woman at the bar is quietly weeping. Her locket — the only portrait of her late husband — was stolen by a cutpurse in the market earlier today.',
					complication:
						'The cutpurse is a teenager stealing for a genuinely sick parent. The locket itself is worth nothing. Returning it means either confronting a desperate child or getting creative.',
					goal: 'Recover the locket. How the party handles the thief will reflect on them in this town for some time.',
					reward:
						'No coin — the woman has none — but the gratitude of an entire neighbourhood and a small blessing from the local temple.'
				},
				{
					hook: 'People in a hamlet near [LOCATION] are falling ill. All of them drink from the same well. The village healer suspects foul play.',
					complication:
						'A jealous neighbour has been adding a mild irritant to the water to drive out a rival farming family. The neighbour is not a villain, exactly, but people are getting sick.',
					goal: 'Identify the culprit and stop them before the illness becomes serious. Deciding what justice looks like is up to the party.',
					reward:
						'20 gp collected from grateful residents. The rival farmer throws in a fine ham, which is worth more than it sounds.'
				},
				{
					hook: 'A wounded scout staggers into the inn. The road north is blocked. Bandits have seized the waystation at [LOCATION] and are robbing every traveler. They have a hostage.',
					complication:
						'The hostage is the local magistrate, which is why the sheriff has done nothing. The bandits know it too and are escalating their demands.',
					goal: 'Clear the waystation and free the hostage. Ideally in a way that does not result in a dead magistrate, as that tends to generate paperwork.',
					reward:
						'60 gp from the magistrate personally, and a useful contact in the regional court.'
				},
				{
					hook: 'A wizard storms into the inn looking for their apprentice, who has run off with several spell components. The wizard is more upset than the situation warrants.',
					complication:
						'One of the stolen components is critically unstable. The apprentice does not know this. If they attempt to use it, the resulting accident will be visible from three miles away.',
					goal: 'Find the apprentice, recover the dangerous component before they kill themselves, and hear them out about why they left.',
					reward:
						'45 gp and a minor enchanted item the wizard was going to sell anyway. They are embarrassed enough to be generous.'
				},
				{
					hook: 'A family at the edge of [LOCATION] has not slept in a week. Something scratches at the walls each night. The local priest blessed the house and the scratching got worse.',
					complication:
						'The house was built over a burial site. The spirit interred there is not angry — it is lonely. The blessing made it feel further away from its grave, not safer.',
					goal: 'Identify what the spirit needs and provide it. Options include proper reburial, a memorial, or in the worst case a formal banishment the spirit will resent.',
					reward: '25 gp and genuine relief from a family that has been very, very frightened.'
				}
			],
			2: [
				{
					hook: 'A sect of cultists has taken over [LOCATION] and is performing rituals that are making the nearby river run black.',
					complication:
						'The cult leader was once a respected cleric. Several of the cultists are local townsfolk who joined willingly. The situation is more complicated than "kill the cultists."',
					goal: 'Stop the ritual and disrupt the cult. Recovering evidence of who funded them would be politically valuable.',
					reward: "200 gp from the local lord's office, plus a favor from the regional church."
				},
				{
					hook: 'A wyvern has made [LOCATION] impassable, cutting off a vital trade route. The merchant consortium is offering hazard pay.',
					complication:
						'The wyvern is protecting a nest. Its mate was killed by the last group sent to deal with it. It is angry, not random.',
					goal: 'Reopen the route. The consortium will pay double if the party does it without burning down the forest.',
					reward: '300 gp, with a bonus of 150 gp if property damage is minimal.'
				},
				{
					hook: 'Undead have been reported walking out of [LOCATION] each night. They return before dawn. The local clergy cannot explain it.',
					complication:
						"A necromancer's experiment, but the necromancer is dead. The ritual is running on its own, fueled by a buried artifact the party must locate and destroy.",
					goal: 'End the undead incursions permanently. Recovering the artifact would be safer than simply destroying it on-site.',
					reward: '250 gp from the temple and a minor boon from the presiding cleric.'
				},
				{
					hook: "A noble's heir has been taken to [LOCATION] by kidnappers demanding political concessions. The noble cannot publicly involve the authorities.",
					complication:
						"The kidnappers have inside information — someone in the noble's household is complicit. The heir may also know more than they are letting on.",
					goal: 'Recover the heir. Identifying the informant would prevent a future incident.',
					reward: "400 gp, a signet letter of recommendation, and the noble's political goodwill."
				},
				{
					hook: 'A former soldier slides a sealed document across the table. It describes a planned mercenary raid on a nearby town. They are offering it in exchange for sanctuary.',
					complication:
						'The soldier is a deserter with a price on their head, and the person who posted the bounty is directly connected to the mercenary contract. Someone wants them silenced before they can be believed.',
					goal: 'Protect the deserter long enough to act on the intelligence. Whether the party turns them in afterward is their business.',
					reward:
						'350 gp from the town council and a warrant clearing the soldier of charges, if the party negotiates for it.'
				},
				{
					hook: 'A druid at the bar has been sending distress signals from a grove near [LOCATION] for a week. Nobody else responded. The druid looks like they have not slept.',
					complication:
						'The grove is corrupted. The druids still inside have changed. The artifact causing it is buried deep, and the head druid does not want it destroyed — it is the only thing keeping the grove alive.',
					goal: 'Find a solution that does not destroy the grove, does not leave the corruption spreading, and does not require killing the people the druid came to save.',
					reward: '300 gp in trade goods, a nature boon, and an ally in the druidic network.'
				},
				{
					hook: 'A merchant is quietly furious. Forged writs of nobility — bearing his seal — have been used to claim property across the region. He wants the forger found.',
					complication:
						'The forger is small-time. The operation behind them is not. One of the fraudulent land claims has already been built upon — a small fortified compound whose occupant will not give it up without a fight.',
					goal: 'Expose the forgery network, recover enough evidence to invalidate the claims, and deal with the compound.',
					reward: '500 gp and a permanent line of credit with the merchant house.'
				},
				{
					hook: 'A retired sailor knows where a hanged pirate captain hid their treasure before their execution. They want a cut. They need muscle.',
					complication:
						'The treasure is guarded, but the real complication is what it contains: documentation of which three noble houses funded the pirate fleet. The nobles are very much alive.',
					goal: 'Retrieve the cache. Decide what to do with evidence that could topple powerful people — or be sold back to them for considerably more than the gold.',
					reward: '400 gp in coin, plus leverage over people who would normally be untouchable.'
				},
				{
					hook: 'Three separate travelers at the inn tonight have been attacked by people they trusted — people who looked exactly like someone else. The attacks are connected.',
					complication:
						'There are two shapeshifters working in tandem, using different strategies. One is impersonating locals. The other has been sitting at this bar for the last hour.',
					goal: 'Identify and deal with both shapeshifters before they vanish into the region and start the process over somewhere else.',
					reward:
						'350 gp bounty from the regional authority, who has been chasing these two for six months.'
				},
				{
					hook: "A farming village's crops are dying despite good weather. The villagers are frightened. The local lord is more interested in tax collection than solutions.",
					complication:
						'A nature spirit bound to the land is being suppressed by a curse placed by a rival clan decades ago. Lifting it requires navigating a generations-old family feud that neither side wants resolved.',
					goal: 'Break the curse and restore the land. Brokering peace between the families is optional but would make the spirit considerably more cooperative.',
					reward:
						'280 gp from the village collective and a minor charm from the grateful nature spirit.'
				}
			],
			3: [
				{
					hook: 'A criminal lord has been operating out of [LOCATION] for years, untouchable through bribes and threats. The last three groups sent to deal with them did not return.',
					complication:
						'The criminal lord has a contingency: if they die, evidence cached in three locations will destroy the reputations of several powerful figures — which is why no one in power has acted.',
					goal: 'Remove the threat. Securing or exposing the evidence cache is probably unavoidable.',
					reward:
						'1,000 gp, plus the gratitude of people who cannot publicly acknowledge why they are grateful.'
				},
				{
					hook: 'A planar rift has opened near [LOCATION]. Things are coming through. The things are getting worse.',
					complication:
						'The rift was not accidental. Someone opened it deliberately and has not survived to close it. The ritual to seal it requires components now in very dangerous hands.',
					goal: 'Recover the components and close the rift before what is coming through escalates past "contained problem" to "regional catastrophe."',
					reward:
						'800 gp from the regional authority, plus whatever the party can recover from the site.'
				},
				{
					hook: 'Ancient ruins at [LOCATION] have activated. Guardians dormant for centuries are killing anyone who approaches.',
					complication:
						'The ruins are responding to a prophecy. The party may be the ones it describes, which is either promising or terrifying depending on interpretation.',
					goal: 'Reach the center and deactivate the guardians. Reading the full prophecy would be a sensible secondary objective.',
					reward:
						'Whatever is in the ruins, plus 600 gp from a scholarly organization desperate for access.'
				},
				{
					hook: 'A well-dressed stranger at the bar asks the party to find and protect a specific person currently staying at [LOCATION]. They will not say why.',
					complication:
						"The target is a witness to a crime committed by someone powerful. An assassin has already arrived at [LOCATION]. They may already be disguised as a guest. The stranger is the witness's last hope, and possibly the person who got them into this.",
					goal: 'Keep the witness alive long enough to testify. Identifying the assassin is step one. Connecting the crime back to the powerful figure is step two.',
					reward:
						'1,200 gp from a legal consortium, plus evidence that can be used as leverage or handed to the authorities.'
				},
				{
					hook: 'A bank vault in the city has been sealed magically for forty years. The archmage who sealed it died without leaving the combination. The contents are needed to settle an estate.',
					complication:
						'Another party also wants what is inside. They are not asking. The vault itself may have developed an opinion about being opened, as sealed magical spaces sometimes do.',
					goal: 'Open the vault, determine what is inside, and get it to the rightful heirs before the interested third party does something everyone will regret.',
					reward:
						'900 gp plus a percentage of the estate contents depending on what the heirs find inside.'
				},
				{
					hook: 'A charismatic figure at [LOCATION] is rallying the poor behind a religious movement. The local nobility wants them stopped. Several priests want them stopped harder.',
					complication:
						'The figure is genuine, not a con artist, and their grievances are legitimate. They are also being deliberately manipulated by someone using the movement as political cover for something considerably worse.',
					goal: 'Determine who is exploiting the movement and expose them without destroying the figure, whose followers are real people with real problems.',
					reward:
						'750 gp from a discreet political faction, and the genuine goodwill of a large and organized community.'
				},
				{
					hook: "A dead adventurer's belongings were found at [LOCATION]. Among them: half a map to something significant. Three factions have already approached the inn asking about it.",
					complication:
						"The map is incomplete. The second half was tattooed on the adventurer's surviving partner, who is currently alive, does not know the tattoo exists, and has not been told their partner is dead.",
					goal: 'Find the partner. Tell them. Then decide what to do about the map and the three factions who want it — only one of whom has good intentions.',
					reward:
						"Whatever the map leads to, plus a 600 gp finder's fee from the faction with good intentions."
				},
				{
					hook: 'The party is approached quietly by someone who seems frightened. They saw something they should not have at [LOCATION]. Now professionals are following them.',
					complication:
						'The thing they witnessed is far bigger than expected. Several important people need it to stay buried. One of those people is very close to someone the party has already met.',
					goal: 'Keep the witness alive. Determine how far up the conspiracy goes. Decide whether to expose it, use it, or walk away — all three options have consequences.',
					reward:
						'800 gp in exchange for silence, or considerably more if the party decides to make noise instead.'
				},
				{
					hook: 'A strategic hilltop fortress near [LOCATION], abandoned after a failed siege twenty years ago, has started showing lights at night.',
					complication:
						'The descendants of the original garrison reclaimed it quietly. They are not what they were when they left. Whether this is the result of magic, curse, or choice is unclear until the party arrives.',
					goal: 'Determine what has happened to the garrison descendants and whether they represent a threat. If they do, deal with it before they expand.',
					reward:
						'700 gp from the regional lord, plus anything recoverable from the fortress armory.'
				}
			],
			4: [
				{
					hook: 'A dragon has declared sovereignty over [LOCATION] and the surrounding territory. It is accepting tribute or war. The region cannot afford either for long.',
					complication:
						"The dragon is not wrong — the region's leadership agreed to exactly these terms two hundred years ago and assumed the dragon would die. It has not.",
					goal: "Negotiate, drive off, or kill the dragon. The treaty's existence means the first option requires legal cleverness the dragon will definitely test.",
					reward:
						'5,000 gp from every merchant guild in the region, plus land grants from the grateful nobility.'
				},
				{
					hook: "A demon lord's influence is spreading from [LOCATION]. Entire villages have been converted. The corruption spreads faster than it can be contained.",
					complication:
						'The demon lord is bound, not free — someone is channeling its influence deliberately. Finding and stopping that someone is the actual problem. The demon lord is the symptom.',
					goal: 'Find the conduit. Break the connection. Contain the spread.',
					reward:
						'10,000 gp, divine blessing from a grateful pantheon, and the kind of fame that is only helpful if you survive to enjoy it.'
				},
				{
					hook: "A divine crisis is unfolding at [LOCATION]. A god's death has left a wound in the weave that lesser powers are fighting to exploit.",
					complication:
						'Several factions — celestial, fiendish, and mortal — want different outcomes from the crisis. All of them want to use the party as a tool toward those outcomes.',
					goal: "Navigate the crisis, choose which faction's solution (if any) to support, and survive consequences that will reshape the region for a generation.",
					reward:
						'The gratitude of a divine power. The enmity of at least two others. And enough material wealth to never worry about lodging again.'
				},
				{
					hook: 'An ancient king, resurrected by a ritual at [LOCATION], has walked into the city and presented himself at the palace. His claim to the throne is legally sound. The current royal family is not pleased.',
					complication:
						'The king is legitimate, is not evil, and has a point. He is also two centuries out of date, commands the loyalty of an undead army he does not fully control, and has no interest in being managed.',
					goal: 'Resolve the succession crisis before it becomes a war. This almost certainly requires talking to the king directly, which is not a safe conversation.',
					reward:
						'8,000 gp from the current crown for a quiet resolution, or the ancient king\'s "gratitude in the old manner," which includes a title and land.'
				},
				{
					hook: 'Seven seals on a prison plane have been failing one by one. Six are broken. The seventh seal is a living person who does not know it. They are sitting in this inn right now.',
					complication:
						'The seventh seal is not a metaphor. The person is dying of a mundane illness that has nothing to do with their nature. When they die, whatever is in the prison plane walks free. Several parties already know who they are.',
					goal: 'Keep the seal-person alive long enough to find an alternative, or help them choose how to face what they are. There may not be a clean solution.',
					reward:
						'The soul-debt of a grateful deity, which is an unusual form of currency but extremely valuable.'
				},
				{
					hook: 'A minor deity appears at the inn in mortal form, visibly dying. They ask the party for a favor they decline to describe in advance.',
					complication:
						'The favor involves confronting the entity that is killing them — an ancient power that should not exist, occupying a place that no living creature has entered in recorded history.',
					goal: "Complete the deity's final task. What the party does with what they find there will be entirely up to them.",
					reward:
						'A divine boon passed from the dying deity — power that costs them something to give, which makes it worth having.'
				},
				{
					hook: 'Two cities have been technically at war for a century. The peace everyone believes in is a fiction — the treaty was never signed because the negotiators died before the ceremony. Someone at [LOCATION] has found the original dispute documents.',
					complication:
						'The someone who found them plans to sell them to a third party interested in destabilizing the region. Both cities have agents in the field. None of them are working toward the same outcome. One of them is in this inn.',
					goal: 'Secure the documents. Decide who gets them — the cities, a neutral archive, or no one — and survive the agents who disagree with whichever choice is made.',
					reward:
						'6,000 gp from the combined city treasuries for the return of the documents, or considerably more leverage if the party keeps copies.'
				},
				{
					hook: 'A prophecy names a member of the party as heir to a shattered empire. The message arrives by way of a very formal, very nervous herald who does not want to be here.',
					complication:
						"The empire's enemies take prophecy seriously. So do its remnant loyalists. Both sides have already dispatched people. The named heir had a normal childhood and no interest in any of this — which, historically, is not a disqualification.",
					goal: 'Decide what to do with a prophecy, a title, and the attention of everyone who cares about either. Survival is the immediate objective. Everything else is negotiable.',
					reward:
						"The loyalty of a remnant imperial force, access to vaults that haven't been opened in two centuries, and problems that will last the rest of the campaign."
				},
				{
					hook: 'The last egg of an ancient dragon bloodline has surfaced at [LOCATION] and is being quietly auctioned to the highest bidder.',
					complication:
						'Every major faction wants it for a different reason — some to destroy it, some to control what hatches, some to return it to a bloodline that has been searching for a century. The egg is also about to hatch. Whoever it imprints on will shape what it becomes.',
					goal: 'Acquire the egg by purchase, theft, or persuasion. Protect it through the bidding war. Decide what it becomes.',
					reward:
						'The permanent alliance of whichever faction the party supports, the permanent enmity of the others, and a very young dragon that will remember everything.'
				}
			]
		};

		for (let i = 0; i < numQuests; i++) {
			const qrng = mkRng(hashSeed(`quest_${i}`, seed + i * 17));
			const guestName = pname(qrng);
			const difficulty: Difficulty = diffPool[i % diffPool.length];
			const loc = pick(locations[tier], qrng);
			const template = pick(questTemplates[tier], qrng);

			const fillTemplate = (t: string) => t.replace(/\[LOCATION\]/g, loc);

			quests.push({
				guest: {
					name: guestName,
					race: pick(RACES, qrng),
					profession: pick(professions, qrng),
					appearance: pick(appearances, qrng),
					demeanor: pick(demeanors, qrng)
				},
				hook: fillTemplate(template.hook),
				complication: fillTemplate(template.complication),
				goal: fillTemplate(template.goal),
				reward: template.reward,
				difficulty
			});
		}

		return {
			name,
			tagline,
			qualityBadge: QUALITY_LABELS[quality],
			owner: { name: ownerName, race: ownerRace, personality: ownerPersonality },
			staff,
			food,
			drink,
			rooms,
			quests,
			rumors: generateRumors()
		};
	}

	// ── Rumor Mill ────────────────────────────────────────────────────────────────
	interface Rumor {
		text: string;
		source: string;
		true: boolean;
	}

	const RUMOR_SOURCES = [
		'a pair of merchants huddled over their ale',
		"a farmer who won't stop looking at the door",
		"the innkeeper's wife, polishing glasses a little too slowly",
		'a travel-stained courier on her third cup',
		'two soldiers playing cards in the corner',
		'a shepherd who came in just to get out of the rain',
		'a gnome in a very large hat',
		'someone at the bar who went quiet when you sat down',
		'a dwarven trader with ink-stained fingers',
		'a local priest, drinking alone',
		'a teenager who clearly wants to be seen as knowing things',
		'an old woman darning socks by the fire',
		'a halfling who keeps laughing at his own jokes',
		'two off-duty guards, one of whom looks nervous',
		'a cloaked figure who left before you could get a good look'
	];

	const RUMOR_POOL: { text: string; likelyTrue: boolean }[] = [
		// Local & political
		{
			text: "The lord's youngest son was seen riding north alone three nights ago. No one knows why, and the steward is acting like nothing happened.",
			likelyTrue: true
		},
		{
			text: "The miller has been skimming the grain levy for two years. Half the village knows. The reeve doesn't, or pretends not to.",
			likelyTrue: true
		},
		{
			text: "A traveling merchant paid for his room in coins that turned to dried leaves by morning. The innkeeper is furious and won't say where he went.",
			likelyTrue: false
		},
		{
			text: "The blacksmith's apprentice has been sneaking out to meet someone at the edge of the Thornwood. Nobody's seen who.",
			likelyTrue: true
		},
		{
			text: "Lord Aldric hasn't been seen in public for six weeks. They say it's gout. Others say it's something worse.",
			likelyTrue: false
		},
		{
			text: "The new tax collector has been overcharging by a third and pocketing the difference. He's untouchable — he's the magistrate's nephew.",
			likelyTrue: true
		},
		{
			text: "The widow Harwen's cottage burned down last month. Everyone says it was an accident. She doesn't.",
			likelyTrue: true
		},
		{
			text: 'A guild courier was found dead on the south road. His satchel was empty. The guild is offering triple the usual rate for anyone willing to carry letters that way now.',
			likelyTrue: true
		},
		{
			text: 'The mayor has been paying protection money to someone — or something — in the hills. His wife let it slip to the baker.',
			likelyTrue: false
		},

		// Road & travel
		{
			text: "There's a bridge three days east that collapsed in the spring floods. The ferryman is charging a fortune to cross and no one's moving to fix it.",
			likelyTrue: true
		},
		{
			text: "Three caravans have gone missing on the Old Forest Road in as many months. The merchants' guild is calling it bandits. The drivers' families say the wagons were found empty with no sign of a fight.",
			likelyTrue: true
		},
		{
			text: "The north pass is being watched. Someone's collecting names of everyone who goes through — not the garrison. Someone else.",
			likelyTrue: false
		},
		{
			text: "The road south floods every spring at the Mire Crossing, but a dwarf engineer in Crestfall claims she can fix it for a reasonable sum. No one's hired her yet.",
			likelyTrue: true
		},
		{
			text: "A pilgrim road that hasn't been used in forty years has been recently cleared. Fresh wagon tracks. Someone knows where it goes and doesn't want to take the main road.",
			likelyTrue: true
		},

		// Monster & dungeon
		{
			text: 'Something has been taking sheep from the eastern pastures. The shepherd says it carries them off whole — no blood, no tracks. Just gone.',
			likelyTrue: true
		},
		{
			text: "There's a tower in the Ashwood that wasn't there last year. The locals won't go near it. Twice someone's tried to investigate and come back wrong.",
			likelyTrue: false
		},
		{
			text: 'An old mine in the hills reopened itself about three months ago. You can see light coming from the shaft at night, but the mining company abandoned it years ago.',
			likelyTrue: true
		},
		{
			text: "The standing stones on Harrow Hill have been rearranged. They're very heavy. No one saw anything move them.",
			likelyTrue: true
		},
		{
			text: "A half-orc hunter claims he found a dragon's shed scale in the valley. He's been selling pieces of it for a silver each. They're probably just painted lizard hide.",
			likelyTrue: false
		},
		{
			text: "Something lives under the old mill pond. The miller stopped talking about it after his dog went in one morning and didn't come back.",
			likelyTrue: true
		},
		{
			text: "An entire goblin warren went quiet last month. The scouts who went to investigate came back pale and wouldn't say what they found.",
			likelyTrue: true
		},
		{
			text: 'A farmer found a door under his field when the plow broke through it. He sealed it with stones and refuses to discuss it.',
			likelyTrue: true
		},

		// Supernatural & religious
		{
			text: "The temple of Avandra hasn't rung its morning bells in two weeks. The acolytes say the head priest is ill. The head priest hasn't been seen.",
			likelyTrue: false
		},
		{
			text: "Someone's been leaving silver coins on the doorsteps of the poor before dawn. Three people have seen a figure in grey robes but no one can agree on the details.",
			likelyTrue: true
		},
		{
			text: "A child in the lower quarter claims she can see people who aren't there. Her mother says it started after they moved into the house where the chandler died.",
			likelyTrue: false
		},
		{
			text: "The river has been running red at dawn for three days. The temple says it's iron oxide from upstream. The fisherfolk say there are no fish anymore.",
			likelyTrue: true
		},
		{
			text: "An herbalist was paid a great deal of money to make something she won't describe. She left town the following morning and hasn't returned.",
			likelyTrue: true
		},

		// Scandalous & personal
		{
			text: "The harbormaster and the magistrate's wife have been corresponding in secret for over a year. Their go-between is the butcher's boy, who has no idea what the letters say.",
			likelyTrue: true
		},
		{
			text: "The famous adventurer Selrik the Bold retired here six years ago under a different name. He's the one who runs the leatherworker's shop on Market Street.",
			likelyTrue: false
		},
		{
			text: "Someone has been leaving anonymous tips to the city watch — tips that are always correct. The watch captain thinks it's one of their own. It isn't.",
			likelyTrue: true
		},
		{
			text: "A local noble was caught cheating at cards by a tiefling gambler who then vanished without collecting his winnings. The noble's been jumpy ever since.",
			likelyTrue: false
		},
		{
			text: "The baker moved here twelve years ago and no one knows where from. He paid for the building in gold coins that aren't minted by any kingdom anyone recognizes.",
			likelyTrue: true
		},

		// War & politics
		{
			text: 'A regiment stationed two days north has been quietly recalled. The official reason is redeployment. Someone says they lost half their number to something in the hills.',
			likelyTrue: false
		},
		{
			text: "An armistice that was supposed to last five years is being quietly renegotiated. The crown's envoys have been meeting in private for three months.",
			likelyTrue: true
		},
		{
			text: "Someone is buying up grain stockpiles from every village in the region at above-market prices. Either there's a shortage coming or someone's preparing for a siege.",
			likelyTrue: true
		},
		{
			text: "The duke's second-in-command resigned last month. Officially it was a health matter. He was last seen boarding a ship at the eastern port.",
			likelyTrue: true
		}
	];

	function generateRumors(): Rumor[] {
		const rrng = mkRng(hashSeed('rumors', seed));
		const shuffled = [...RUMOR_POOL].sort(() => rrng() - 0.5);
		const count = 3 + Math.floor(rrng() * 2); // 3 or 4
		const srcRng = mkRng(hashSeed('rumor_src', seed));
		const sources = [...RUMOR_SOURCES].sort(() => srcRng() - 0.5);
		return shuffled.slice(0, count).map((r, i) => ({
			text: r.text,
			source: sources[i % sources.length],
			true: rrng() < (r.likelyTrue ? 0.72 : 0.28)
		}));
	}

	function randomize() {
		seed = Math.floor(Math.random() * 1_000_000_000);
	}

	// Save / Load
	interface SavedInn {
		id: string;
		innName: string;
		quality: Quality;
		partySize: number;
		partyLevel: number;
		seed: number;
		savedAt: number;
	}

	const INNS_KEY = 'initiative_saved_inns';

	let savedInns = $state<SavedInn[]>([]);
	if (typeof window !== 'undefined') {
		try {
			savedInns = JSON.parse(localStorage.getItem(INNS_KEY) ?? '[]');
		} catch {
			savedInns = [];
		}
	}

	function saveInn() {
		const entry: SavedInn = {
			id: crypto.randomUUID(),
			innName: innData?.name ?? 'Unknown Inn',
			quality,
			partySize,
			partyLevel,
			seed,
			savedAt: Date.now()
		};
		savedInns = [...savedInns, entry];
		localStorage.setItem(INNS_KEY, JSON.stringify(savedInns));
	}

	function deleteSavedInn(id: string) {
		savedInns = savedInns.filter((i) => i.id !== id);
		localStorage.setItem(INNS_KEY, JSON.stringify(savedInns));
	}

	function applyInn(s: SavedInn) {
		quality = s.quality;
		partySize = s.partySize;
		partyLevel = s.partyLevel;
		seed = s.seed;
	}

	$effect(() => {
		quality;
		partySize;
		partyLevel;
		seed;
		innData = generateInn();
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
				<h2 class="text-lg font-bold tracking-wide text-amber-300">Inn Generator</h2>
				{#if innData}
					<span class="text-xs text-gray-500">{innData.name}</span>
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
		<!-- Left panel: controls -->
		<div
			class="hidden w-64 shrink-0 flex-col gap-5 overflow-y-auto border-r border-gray-800 bg-gray-900/60 p-4 sm:flex"
		>
			<!-- Inn Quality -->
			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-semibold tracking-wider text-gray-500 uppercase"
					>Inn Quality</label
				>
				<div class="flex flex-col gap-1">
					{#each ['poor', 'modest', 'comfortable', 'wealthy', 'legendary'] as Quality[] as q}
						<button
							onclick={() => (quality = q)}
							class="w-full rounded px-2.5 py-1.5 text-left text-sm font-medium transition {quality ===
							q
								? 'bg-amber-700 text-white'
								: 'bg-gray-800 text-gray-300 hover:bg-gray-700'}"
						>
							{QUALITY_LABELS[q]}
						</button>
					{/each}
				</div>
			</div>

			<!-- Party Size -->
			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-semibold tracking-wider text-gray-500 uppercase"
					>Party Size</label
				>
				<div class="flex items-center gap-2">
					<button
						onclick={() => (partySize = Math.max(2, partySize - 1))}
						class="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-gray-300 transition hover:bg-gray-600"
						aria-label="Decrease party size"
					>
						<i class="fa-duotone fa-light fa-minus text-xs" aria-hidden="true"></i>
					</button>
					<span class="min-w-[2rem] text-center text-sm font-bold text-gray-100">{partySize}</span>
					<button
						onclick={() => (partySize = Math.min(8, partySize + 1))}
						class="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-gray-300 transition hover:bg-gray-600"
						aria-label="Increase party size"
					>
						<i class="fa-duotone fa-light fa-plus text-xs" aria-hidden="true"></i>
					</button>
				</div>
			</div>

			<!-- Party Level -->
			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-semibold tracking-wider text-gray-500 uppercase"
					>Party Level</label
				>
				<div class="flex items-center gap-2">
					<button
						onclick={() => (partyLevel = Math.max(1, partyLevel - 1))}
						class="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-gray-300 transition hover:bg-gray-600"
						aria-label="Decrease party level"
					>
						<i class="fa-duotone fa-light fa-minus text-xs" aria-hidden="true"></i>
					</button>
					<span class="min-w-[2rem] text-center text-sm font-bold text-gray-100">{partyLevel}</span>
					<button
						onclick={() => (partyLevel = Math.min(20, partyLevel + 1))}
						class="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-gray-300 transition hover:bg-gray-600"
						aria-label="Increase party level"
					>
						<i class="fa-duotone fa-light fa-plus text-xs" aria-hidden="true"></i>
					</button>
				</div>
				<span class="text-[10px] text-gray-600">
					Tier {partyLevel <= 4 ? 1 : partyLevel <= 8 ? 2 : partyLevel <= 12 ? 3 : 4}
					({partyLevel <= 4
						? '1-4'
						: partyLevel <= 8
							? '5-8'
							: partyLevel <= 12
								? '9-12'
								: '13-20'})
				</span>
			</div>

			<!-- Randomize -->
			<button
				onclick={randomize}
				class="w-full rounded bg-amber-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 active:bg-amber-800"
			>
				Randomize
			</button>

			<button
				onclick={saveInn}
				class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
			>
				Save Inn
			</button>

			{#if savedInns.length}
				<div class="flex flex-col gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
						>Saved Inns</span
					>
					<div class="flex max-h-52 flex-col gap-1 overflow-y-auto">
						{#each savedInns as s (s.id)}
							<div class="flex items-center gap-1 rounded bg-gray-800/80 px-2 py-1.5">
								<button
									onclick={() => applyInn(s)}
									class="min-w-0 flex-1 truncate text-left text-xs text-gray-200 hover:text-amber-400"
									title={s.innName}
								>
									{s.innName}
								</button>
								<button
									onclick={() => deleteSavedInn(s.id)}
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

		<!-- Main scrollable content -->
		<div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
			{#if innData}
				<!-- Inn Header Card -->
				<div class="mb-6 rounded-lg border border-amber-900/40 bg-gray-800/70 px-5 py-4">
					<div class="mb-1 flex flex-wrap items-center gap-2">
						<h3 class="text-xl font-bold text-amber-200">{innData.name}</h3>
						<span
							class="rounded px-1.5 py-0.5 text-[10px] font-semibold {QUALITY_BADGE_COLOR[quality]}"
						>
							{innData.qualityBadge}
						</span>
					</div>
					<p class="text-sm text-gray-400 italic">{innData.tagline}</p>
				</div>

				<!-- Owner Card -->
				<section class="mb-6">
					<div class="mb-3 flex items-center gap-3">
						<h3 class="text-xs font-bold tracking-widest text-gray-400 uppercase">Owner</h3>
						<div class="h-px flex-1 bg-gray-700/60"></div>
					</div>
					<div class="rounded-lg border border-gray-700/60 bg-gray-800/70 p-4">
						<div class="mb-2 flex flex-wrap items-center gap-2">
							<span class="text-sm font-bold text-gray-100">{innData.owner.name}</span>
							<span class="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-300">
								{innData.owner.race}
							</span>
						</div>
						<p class="text-sm leading-relaxed text-gray-300 italic">{innData.owner.personality}</p>
					</div>
				</section>

				<!-- Staff Section -->
				<section class="mb-6">
					<div class="mb-3 flex items-center gap-3">
						<h3 class="text-xs font-bold tracking-widest text-gray-400 uppercase">Staff</h3>
						<div class="h-px flex-1 bg-gray-700/60"></div>
						<span class="text-xs text-gray-600">{innData.staff.length} staff</span>
					</div>
					<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{#each innData.staff as s}
							<div class="rounded-lg border border-gray-700/60 bg-gray-800/70 p-3">
								<div class="mb-1.5 flex flex-wrap items-center gap-2">
									<span class="text-sm font-bold text-gray-100">{s.name}</span>
									<span
										class="rounded bg-amber-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300"
									>
										{s.role}
									</span>
								</div>
								<p class="text-xs leading-relaxed text-gray-400 italic">{s.description}</p>
							</div>
						{/each}
					</div>
				</section>

				<!-- Menu Section -->
				<section class="mb-6">
					<div class="mb-3 flex items-center gap-3">
						<h3 class="text-xs font-bold tracking-widest text-gray-400 uppercase">Menu</h3>
						<div class="h-px flex-1 bg-gray-700/60"></div>
					</div>
					<div class="grid gap-4 sm:grid-cols-2">
						<!-- Food -->
						<div class="rounded-lg border border-gray-700/60 bg-gray-800/70 p-4">
							<h4 class="mb-3 text-xs font-bold tracking-wider text-gray-500 uppercase">Food</h4>
							<div class="space-y-2">
								{#each innData.food as item}
									<div class="flex items-start justify-between gap-2">
										<div class="flex-1">
											<span class="text-sm text-gray-200">{item.name}</span>
											{#if item.note}
												<span class="ml-1.5 text-[10px] text-gray-500 italic">{item.note}</span>
											{/if}
										</div>
										<span class="shrink-0 text-sm font-semibold text-amber-400">{item.price}</span>
									</div>
								{/each}
							</div>
						</div>
						<!-- Drink -->
						<div class="rounded-lg border border-gray-700/60 bg-gray-800/70 p-4">
							<h4 class="mb-3 text-xs font-bold tracking-wider text-gray-500 uppercase">Drink</h4>
							<div class="space-y-2">
								{#each innData.drink as item}
									<div class="flex items-start justify-between gap-2">
										<div class="flex-1">
											<span class="text-sm text-gray-200">{item.name}</span>
											{#if item.note}
												<span class="ml-1.5 text-[10px] text-gray-500 italic">{item.note}</span>
											{/if}
										</div>
										<span class="shrink-0 text-sm font-semibold text-amber-400">{item.price}</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</section>

				<!-- Rooms Section -->
				<section class="mb-6">
					<div class="mb-3 flex items-center gap-3">
						<h3 class="text-xs font-bold tracking-widest text-gray-400 uppercase">Rooms</h3>
						<div class="h-px flex-1 bg-gray-700/60"></div>
					</div>
					<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{#each innData.rooms as room}
							<div class="rounded-lg border border-gray-700/60 bg-gray-800/70 p-3.5">
								<div class="mb-1 text-sm font-semibold text-gray-100">{room.type}</div>
								<div class="mb-1 flex items-center gap-3">
									<span class="text-xs text-gray-500">{room.qty} available</span>
									<span class="text-xs font-bold text-amber-400">{room.pricePerNight} / night</span>
								</div>
								{#if room.note}
									<p class="text-xs text-gray-500 italic">{room.note}</p>
								{/if}
							</div>
						{/each}
					</div>
				</section>

				<!-- Guests and Quests Section -->
				<section class="mb-6">
					<div class="mb-3 flex items-center gap-3">
						<h3 class="text-xs font-bold tracking-widest text-gray-400 uppercase">
							Guests and Quests
						</h3>
						<div class="h-px flex-1 bg-gray-700/60"></div>
						<span class="text-xs text-gray-600">{innData.quests.length} hooks</span>
					</div>
					<div class="flex flex-col gap-5">
						{#each innData.quests as quest}
							<div class="relative rounded-lg border border-gray-700 bg-gray-800/80 p-4 pt-5">
								<!-- Difficulty badge top-right -->
								<span
									class="absolute top-3 right-3 rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {DIFF_COLOR[
										quest.difficulty
									]}"
								>
									{quest.difficulty}
								</span>

								<!-- Guest info -->
								<div class="mb-3 pr-20">
									<div class="mb-1 flex flex-wrap items-center gap-2">
										<span class="text-sm font-bold text-gray-100">{quest.guest.name}</span>
										<span class="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-300"
											>{quest.guest.race}</span
										>
										<span class="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-300"
											>{quest.guest.profession}</span
										>
									</div>
									<p class="text-xs text-gray-400">
										<span class="text-gray-500">Wearing</span>
										{quest.guest.appearance}.
										<span class="ml-1 text-gray-500 italic">{quest.guest.demeanor}.</span>
									</p>
								</div>

								<!-- Quest sections -->
								<div class="flex flex-col gap-2">
									<div class="border-l-2 border-sky-700/60 pl-3">
										<div
											class="mb-0.5 text-[10px] font-bold tracking-wider text-sky-400/80 uppercase"
										>
											Hook
										</div>
										<p class="text-sm leading-relaxed text-gray-300">{quest.hook}</p>
									</div>
									<div class="border-l-2 border-orange-700/60 pl-3">
										<div
											class="mb-0.5 text-[10px] font-bold tracking-wider text-orange-400/80 uppercase"
										>
											Complication
										</div>
										<p class="text-sm leading-relaxed text-gray-300">{quest.complication}</p>
									</div>
									<div class="border-l-2 border-emerald-700/60 pl-3">
										<div
											class="mb-0.5 text-[10px] font-bold tracking-wider text-emerald-400/80 uppercase"
										>
											Goal
										</div>
										<p class="text-sm leading-relaxed text-gray-300">{quest.goal}</p>
									</div>
									<div class="border-l-2 border-amber-700/60 pl-3">
										<div
											class="mb-0.5 text-[10px] font-bold tracking-wider text-amber-400/80 uppercase"
										>
											Reward
										</div>
										<p class="text-sm leading-relaxed text-gray-300">{quest.reward}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</section>

				<!-- Rumor Mill Section -->
				<section class="mb-6">
					<div class="mb-3 flex items-center gap-3">
						<h3 class="text-xs font-bold tracking-widest text-gray-400 uppercase">Rumor Mill</h3>
						<div class="h-px flex-1 bg-gray-700/60"></div>
						<span class="text-xs text-gray-600">{innData.rumors.length} overheard</span>
					</div>
					<div class="flex flex-col gap-3">
						{#each innData.rumors as rumor}
							<div class="rounded-lg border border-gray-700 bg-gray-800/80 p-4">
								<div class="flex items-start gap-3">
									<span
										class="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase {rumor.true
											? 'bg-green-900/60 text-green-300'
											: 'bg-red-900/60 text-red-400'}"
									>
										{rumor.true ? 'True' : 'False'}
									</span>
									<div>
										<p class="mb-1 text-sm leading-relaxed text-gray-200">"{rumor.text}"</p>
										<p class="text-xs text-gray-500 italic">— {rumor.source}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	</div>
</div>
