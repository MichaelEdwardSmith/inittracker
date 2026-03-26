<!-- Thieves Guild Den Generator -->
<script lang="ts">
	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	// ── Types ─────────────────────────────────────────────────────────────────────
	type HeatLevel = 'Cold' | 'Warm' | 'Hot' | 'Burning';

	interface GuildMember {
		title: string;
		name: string;
		trait: string;
		note: string;
	}

	interface Room {
		name: string;
		description: string;
		detail: string;
	}

	interface FenceItem {
		item: string;
		origin: string;
		value: string;
		note: string;
	}

	interface Job {
		title: string;
		type: string;
		target: string;
		payout: string;
		risk: 'Low' | 'Medium' | 'High' | 'Suicidal';
		details: string;
		twist: string;
	}

	interface DenData {
		guildName: string;
		alias: string;
		cover: string;
		district: string;
		heatLevel: HeatLevel;
		heatNote: string;
		entrance: string;
		rooms: Room[];
		hierarchy: GuildMember[];
		fence: FenceItem[];
		jobs: Job[];
		rule: string;
		rumor: string;
	}

	// ── Controls ──────────────────────────────────────────────────────────────────
	let seed = $state(Math.floor(Math.random() * 1_000_000_000));
	let denData = $state<DenData | null>(null);

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

	const GUILD_NAMES = [
		'The Crimson Ledger',
		'The Silent Hand',
		'The Inkblot Compact',
		'The Velvet Noose',
		'The Broken Seal',
		'The Ash Covenant',
		'The Hollow Crown',
		'The Pale Commission',
		'The Threadbare Court',
		'The Amber Hook',
		'The Rusted Key',
		'The Whisper Market',
		'The Iron Shim',
		'The Leaden Purse',
		'The Twice-Told Lie',
		"The Collector's Circle",
		'The Salted Wound',
		'The Cracked Wax',
		'The Night Syndicate',
		'The Tallow Compact'
	];

	const ALIASES = [
		'the Family',
		'the Firm',
		'the Trade',
		'the House',
		'the Circle',
		'the Network',
		'the Association',
		'the Brotherhood',
		'the Compact',
		'the Arrangement'
	];

	const COVERS = [
		"a chandler's shop selling candles and lamp oil",
		'a pawn broker dealing in "estate goods"',
		'a laundry and linen cleaning service',
		"a cartographer's studio with outdated maps in the window",
		'a rat-catcher operating out of a basement office',
		'a shipping broker who arranges "discreet cargo" transit',
		'a counting house that never seems to have actual clients',
		'a locksmith whose real skill is on the other side of the lock',
		'a second-hand bookshop with a remarkable forgery section',
		'a spice merchant who imports more than pepper',
		'a funeral parlor that moves bodies in both directions',
		'a tailor specializing in garments with hidden pockets',
		'a tavern where only regulars know the real menu',
		'a scrivener\'s office offering "confidential document services"',
		"a herbalist selling remedies the apothecary won't stock"
	];

	const DISTRICTS = [
		'the Docks',
		'the Warrens',
		"the Tanner's Quarter",
		'the Ash Market',
		'Coppergate',
		'the Middens',
		'Loom Street',
		'the Old Port',
		'Gallowside',
		'the Salt Ward',
		'the Undercroft District',
		"Pauper's Row",
		'the Slaughter Quarter',
		'the Night Market',
		'Irongate'
	];

	const ENTRANCES = [
		'a trapdoor behind the counter, beneath a loose flagstone',
		'a false bookshelf that pivots when three specific volumes are pressed in sequence',
		'a sewer grate in the alley that requires a specific knock pattern',
		'the back of a wardrobe in a rented room at the adjacent inn',
		'a rope ladder descending through a false chimney flue',
		'a door disguised as a section of plastered wall, triggered by a hidden lever',
		'an underwater passage connecting to a storm drain beneath the floor',
		'a tunnel entrance behind a loose section of the wine cellar wall',
		'the inside of a large delivery crate on a permanently parked wagon',
		'a cellar door padlocked with a trick lock only openable from below'
	];

	// ── Rooms ─────────────────────────────────────────────────────────────────────
	const ROOM_POOL: Room[] = [
		{
			name: 'The Common Room',
			description:
				'A low-ceilinged chamber with mismatched furniture and a perpetual haze of pipe smoke.',
			detail:
				'Members drink, argue, and take their cut here. A locked strongbox sits beneath the bar, bolted to the floor.'
		},
		{
			name: "The Fence's Parlor",
			description:
				'Shelves of labeled crates, locked cabinets, and a large writing desk covered in ledgers.',
			detail:
				'Every stolen item that passes through gets catalogued here. The fence sleeps with a crossbow under the desk.'
		},
		{
			name: 'The Map Room',
			description:
				'Walls papered with city ward maps, building schematics, and guard patrol schedules.',
			detail:
				'Pin markers indicate current jobs. Red pins mean a job went wrong. There are too many red pins.'
		},
		{
			name: 'The Holding Cells',
			description:
				'Three iron-barred alcoves carved from raw stone, each just large enough to stand in.',
			detail:
				'Used for holding ransom targets, informants awaiting questioning, and members who broke house rules.'
		},
		{
			name: 'The Training Loft',
			description:
				'A long low space with rope obstacles, lock-picking frames, and a padded mat for grappling practice.',
			detail:
				'New recruits spend their first week here before they touch a real job. A scarred instructor watches with flat eyes.'
		},
		{
			name: "The Guildmaster's Chamber",
			description:
				'A surprisingly comfortable room — good furniture, a real fire, and a locked door with three separate bolts.',
			detail:
				'The master conducts all private meetings here. There is a second exit hidden behind the wardrobe.'
		},
		{
			name: 'The Counting Room',
			description: 'A narrow room with a single lamp, a table, and two chairs. No windows.',
			detail:
				'All cuts are calculated and paid out here, always in the presence of two witnesses. Arguments are settled by the ledger, not by shouting.'
		},
		{
			name: 'The Escape Tunnels',
			description:
				'A low brick passage splitting into three branches, heading toward the river, the market, and the wall.',
			detail:
				'Emergency exit only. Lanterns are staged every twenty feet. Two are always missing their oil.'
		},
		{
			name: 'The Infirmary',
			description:
				'A cramped room with two cots, bandage rolls, and a cabinet of dubiously sourced medicines.',
			detail:
				"The guild's medic is a disgraced surgeon who asks no questions and expects no gratitude."
		},
		{
			name: 'The Forgery Workshop',
			description:
				'A long table scattered with parchment, wax blocks, stamps, inks, and a rack of drying papers.',
			detail:
				'Letters of transit, merchant permits, noble seals — all made to order. Rush jobs cost extra and look it.'
		},
		{
			name: 'The Rookery',
			description:
				'A narrow tower room lined with cages of messenger pigeons and coded message tubes.',
			detail:
				'The birds go to six receiving points across the city. Someone checks this room every three hours without fail.'
		},
		{
			name: 'The Vault',
			description:
				'An iron-doored chamber with walls of reinforced stone and a floor-level combination lock.',
			detail:
				"The guild's liquid capital, insurance funds, and a handful of items too hot to fence are stored here. Three people know the combination. One is unaccounted for."
		},
		{
			name: 'The Poison Cabinet',
			description:
				'A locked glass-fronted case bolted to the wall of a back room, key held by the master.',
			detail:
				'Labeled vials in neat rows. Some labels are in a language no one currently in the den reads. A fresh order arrived last week.'
		},
		{
			name: 'The Bunkhouse',
			description:
				'A long room with rows of narrow cots, personal lockboxes chained to each frame, and hooks for gear.',
			detail:
				"Full-time guild members sleep here. Privacy is nonexistent. Everyone knows everyone's business."
		},
		{
			name: 'The Interview Room',
			description:
				'A bare stone room with two chairs, a table, and a hook in the ceiling of unclear purpose.',
			detail:
				'Prospective members are assessed here. So are suspected informants. The distinction is important.'
		}
	];

	// ── Hierarchy ─────────────────────────────────────────────────────────────────
	const FIRST_NAMES = [
		'Aldric',
		'Brix',
		'Cal',
		'Daven',
		'Estra',
		'Fenn',
		'Gris',
		'Hale',
		'Inara',
		'Jak',
		'Kessa',
		'Lorn',
		'Mave',
		'Nix',
		'Orla',
		'Pell',
		'Quill',
		'Ren',
		'Sable',
		'Tev',
		'Ulla',
		'Vane',
		'Wren',
		'Yora',
		'Zell',
		'Ash',
		'Brynn',
		'Cade',
		'Dex',
		'Elka',
		'Finn',
		'Gael',
		'Hark',
		'Isra',
		'Jace',
		'Kira',
		'Lev',
		'Mora',
		'Nael',
		'Orin'
	];

	const LAST_NAMES = [
		'Ashwick',
		'Blackthorn',
		'Croft',
		'Dusk',
		'Edgely',
		'Fallow',
		'Greer',
		'Holt',
		'Ives',
		'Jann',
		'Kell',
		'Lorne',
		'Marsh',
		'Nett',
		'Oakes',
		'Pryce',
		'Quade',
		'Rook',
		'Sable',
		'Tarn',
		'Umber',
		'Vale',
		'Wicks',
		'Yenn',
		'Zarr',
		'Crane',
		'Dray',
		'Finch',
		'Galt',
		'Hern',
		'Ivey',
		'Jarrow',
		'Kade',
		'Lask',
		'Morn'
	];

	const TITLES: { title: string; note: string }[] = [
		{ title: 'Guildmaster', note: 'Commands absolute loyalty. Rarely seen directly.' },
		{ title: 'Shadow', note: "The master's enforcer and eyes. Answers to no one else." },
		{ title: 'Fence', note: 'Converts stolen goods to coin. Knows the value of everything.' },
		{ title: 'Spymaster', note: 'Manages informants and sells information to the highest bidder.' },
		{ title: 'Cutpurse Captain', note: 'Runs street-level theft operations across two districts.' },
		{ title: 'Forger', note: 'Creates false documents, seals, and identities on demand.' },
		{ title: 'Poisoner', note: "The guild's specialist in non-violent solutions. Usually." },
		{ title: 'Muscle', note: 'Handles jobs that require a more direct approach.' },
		{ title: 'Lookout Chief', note: 'Coordinates the network of street urchins and informants.' },
		{ title: 'Safecracker', note: 'Called in for the jobs no one else can finish.' }
	];

	const TRAITS = [
		'never raises their voice — which makes them more terrifying',
		'counts everything obsessively: coins, steps, exits',
		"has a warm laugh that doesn't reach their eyes",
		'wears only grey and moves like smoke',
		'carries three knives and admits to two',
		'speaks in a whisper regardless of the setting',
		'is always eating something, never offers to share',
		'maintains exhaustive written records of every slight',
		'quotes contracts and agreements from memory, word for word',
		'has informants in every guild in the city',
		'takes every insult as a debt to be repaid with interest',
		"hasn't slept more than four hours in years — they say",
		"is unfailingly polite right up until they aren't",
		'has a reputation for finishing what others abandoned',
		'has done time in the city prison and came out calmer',
		"keeps a list — no one knows what's on it",
		'owes a significant favor to someone and hates it',
		'grew up on these streets and knows every shortcut',
		'has an uncanny ability to read a room in seconds',
		'never commits anything to writing. Ever.'
	];

	// ── Fence Inventory ───────────────────────────────────────────────────────────
	interface FenceEntry {
		item: string;
		origin: string;
		value: string;
		note: string;
	}

	const FENCE_POOL: FenceEntry[] = [
		{
			item: 'A set of silver dining plate, monogrammed',
			origin: "Lifted from a merchant's townhouse on the Hill",
			value: '80 gp',
			note: "The family hasn't reported it yet. Price drops if they do."
		},
		{
			item: 'A sealed diplomatic pouch, unopened',
			origin: 'Taken from a courier three nights ago',
			value: '120 gp (or more to the right buyer)',
			note: 'Contents unknown. The fence is nervous about this one.'
		},
		{
			item: 'A matched pair of dueling pistols in a velvet case',
			origin: 'An estate burglary in the Merchant Ward',
			value: '65 gp',
			note: 'Fine craftsmanship. The owner is offering a reward — the guild is ignoring it.'
		},
		{
			item: 'Three bolts of Calishite silk',
			origin: 'A dockside warehouse job',
			value: '45 gp per bolt',
			note: 'Difficult to move — too recognizable without repackaging.'
		},
		{
			item: 'A wax-sealed ledger from a merchant house',
			origin: 'Stolen to order; buyer pulled out',
			value: 'Unknown — open to offers',
			note: 'The fence suspects it contains compromising debt records.'
		},
		{
			item: 'A clockwork music box with a sapphire inlay',
			origin: 'A snatch job at the midsummer fair',
			value: '90 gp',
			note: 'Plays the same four notes on repeat. The fence hates it.'
		},
		{
			item: 'Six vials of what is labeled "Tears of Sehanine"',
			origin: 'A temple sacristy, quietly emptied',
			value: '30 gp per vial',
			note: 'May be holy oil. May be poison. Untested. Priced accordingly.'
		},
		{
			item: 'A signet ring from a minor noble family',
			origin: 'Pickpocketed at the last court reception',
			value: '40 gp (as metal); 200 gp (to a forger)',
			note: "The noble hasn't noticed yet, or is too embarrassed to say."
		},
		{
			item: 'A rolled architectural schematic for the city treasury',
			origin: 'Provenance unknown — came in as part of a lot',
			value: 'Not for sale. Reserved.',
			note: 'The master has taken personal interest in this item.'
		},
		{
			item: 'Twelve bottles of aged dwarven spirits',
			origin: 'A customs seizure that was re-seized',
			value: '18 gp per bottle',
			note: 'Already two bottles short. The fence is "conducting quality verification."'
		},
		{
			item: 'A locked iron strongbox, key missing',
			origin: 'A smash-and-grab from a counting house',
			value: 'Contents unknown',
			note: 'The safecracker is away. Has been for two weeks.'
		},
		{
			item: 'An enchanted hand mirror that shows the viewer as they were ten years ago',
			origin: "A mage's tower burglary",
			value: '150 gp',
			note: 'Harmless but unnerving. Three buyers have declined after looking into it.'
		},
		{
			item: 'A stack of blank but officially watermarked civic permits',
			origin: 'A city hall inside job',
			value: '15 gp each (blank); 50 gp (filled and sealed)',
			note: 'The forger is backed up for a week.'
		},
		{
			item: 'A war medal from a disbanded mercenary company',
			origin: "Pulled from a veteran's belt at the docks",
			value: '8 gp (as silver); 60 gp (to the right collector)',
			note: 'Someone has been asking about it. The guild is asking who.'
		},
		{
			item: "A leather case of surgeon's tools, engraved with initials",
			origin: 'Taken during a street robbery gone sideways',
			value: '35 gp',
			note: 'The owner filed a report. The fence wants this gone fast.'
		},
		{
			item: 'A sealed correspondence bundle tied in red ribbon',
			origin: 'Intercepted from a private mail runner',
			value: "200 gp to the named recipient's rival",
			note: 'Three parties have independently asked if the guild has these letters.'
		},
		{
			item: 'A small but exquisite oil painting, unmounted from its frame',
			origin: 'Cut from the wall of a private gallery',
			value: '110 gp',
			note: 'The frame is in a ditch outside the city. The artist is still alive and very upset.'
		},
		{
			item: 'A pouch of uncut gemstones, mixed quality',
			origin: "A jeweler's back room, bypassed through the roof",
			value: '180 gp (assessed); may be higher',
			note: "The guild's gem-cutter is negotiating a cut of the final price. Literally."
		}
	];

	// ── Jobs ──────────────────────────────────────────────────────────────────────
	const JOB_TYPES = [
		'Burglary',
		'Extortion',
		'Assassination',
		'Smuggling',
		'Espionage',
		'Kidnapping',
		'Frame Job',
		'Heist',
		'Blackmail',
		'Sabotage',
		'Forgery',
		'Debt Collection'
	];

	interface JobEntry {
		title: string;
		type: string;
		target: string;
		payout: string;
		risk: Job['risk'];
		details: string;
		twist: string;
	}

	const JOB_POOL: JobEntry[] = [
		{
			title: "The Alderman's Safe",
			type: 'Burglary',
			target: "City alderman's private office, east side of the Civic Hall",
			payout: '300 gp on delivery of contents',
			risk: 'High',
			details:
				"A client wants whatever is in the alderman's personal safe — documents, coin, anything. The office sits above a city watch post. Two guards, rotated hourly.",
			twist:
				"The alderman knows someone is coming. He moved the safe's real contents to a second location and left a trap inside the original."
		},
		{
			title: 'Silence the Ledger',
			type: 'Assassination',
			target: 'A port authority clerk named Ferran Goss',
			payout: '500 gp, half up front',
			risk: 'Medium',
			details:
				'Goss has been building a case against a guild-connected shipping operation. He needs to stop. The client wants it quiet — no fire, no public scene.',
			twist:
				"Goss is already aware he's a target. He's been leaving false trails and hasn't slept at home in two weeks."
		},
		{
			title: "The Merchant's Daughter",
			type: 'Kidnapping',
			target: 'Lyssa Carrenmore, daughter of the Carrenmore wool trading family',
			payout: '400 gp plus 10% of ransom recovered',
			risk: 'High',
			details:
				'A rival merchant wants leverage. The girl is never alone — she travels with a bodyguard and a handmaid. Snatch and hold, no harm. Deadline is four days.',
			twist:
				'Lyssa Carrenmore is not who she appears. She is a licensed city watchwoman conducting an undercover investigation. Into this guild.'
		},
		{
			title: 'Red Wine, Black Cargo',
			type: 'Smuggling',
			target: 'Twelve crates of contraband through the river checkpoint at Millgate',
			payout: '200 gp for delivery; 350 gp if no crates are opened',
			risk: 'Medium',
			details:
				'The cargo is moving tonight regardless. The guild is hired to provide cover, distraction at the checkpoint, and a safe house at the other end.',
			twist:
				"Two of the twelve crates don't contain what the client said. Whatever is inside is breathing."
		},
		{
			title: 'The Whisper Contract',
			type: 'Espionage',
			target: 'The household of Lord Aldric Thane, specifically his secretary',
			payout: '250 gp for a weekly intelligence report, ongoing',
			risk: 'Low',
			details:
				"A competing noble family wants advance notice of Thane's political moves. Access to the secretary is the key — bribery, seduction, or blackmail, the client doesn't care how.",
			twist:
				'The secretary is already feeding information to a third party. She will negotiate with whoever approaches her. Her price is extraction from the city.'
		},
		{
			title: 'The Tallow Candle Frame',
			type: 'Frame Job',
			target: "Master Chandler Obbrun, of the Chandlers' Guild",
			payout: '180 gp',
			risk: 'Low',
			details:
				"Plant forged evidence linking Obbrun to a string of thefts from his own guild's warehouse. The client wants him expelled and discredited within two weeks.",
			twist:
				'Obbrun IS guilty of the thefts — just for different reasons than the client knows. If the guild discovers this, the frame job becomes an extortion opportunity worth far more.'
		},
		{
			title: 'Vault Day',
			type: 'Heist',
			target: "The Merchant Compact's quarterly strongroom transfer",
			payout: '600 gp split, plus a share of whatever is in the strongroom',
			risk: 'Suicidal',
			details:
				'Once per quarter the Compact moves its reserves to a new location. The transfer route is known, the window is twenty minutes. Six guards, a mage, and a very heavy box.',
			twist:
				"The guild's own Spymaster sold the route to a second crew as well. Two groups will show up at the same time, and neither knows about the other."
		},
		{
			title: 'The Protection Arrangement',
			type: 'Extortion',
			target: 'Seven businesses in the Salt Ward, currently paying a rival gang',
			payout: '40 gp per business per month, ongoing',
			risk: 'Medium',
			details:
				'The rival gang, the Salted Hand, has been weakened by recent arrests. This is the window to move into their territory. Convince the businesses — firmly — that the guild is the better option.',
			twist:
				'One of the seven businesses is secretly owned by a city watch captain who has been waiting for exactly this kind of approach.'
		},
		{
			title: 'Burn the Records',
			type: 'Sabotage',
			target: 'The Hall of Scribes, specifically the western archive',
			payout: '350 gp',
			risk: 'High',
			details:
				'A specific set of property records needs to disappear before a disputed estate ruling next month. The client needs the entire records room for that ward destroyed. Make it look like an accident.',
			twist:
				'The records have already been copied by someone. Whoever that is will try to stop the job — they plan to sell the copies after the originals are gone.'
		},
		{
			title: 'Counterfeit Season',
			type: 'Forgery',
			target: 'Reproduction of sixty trading licenses for the Autumn Market',
			payout: '8 gp per license, 480 gp total',
			risk: 'Medium',
			details:
				'A coalition of unlicensed merchants needs official-looking market permits before the fair opens in twelve days. The guild forger is already stretched. Extra hands are needed.',
			twist:
				'The real licenses have a new security feature this year — an invisible ink watermark only visible under mage light. No one told the forger.'
		},
		{
			title: 'The Soft Collection',
			type: 'Debt Collection',
			target: 'Darvon Wick, a gambler who owes the guild 800 gp',
			payout: '20% of recovered sum',
			risk: 'Low',
			details:
				"Wick has been avoiding the guild for three months. He isn't hiding — he's just gambling at increasingly dangerous establishments hoping his luck turns. It hasn't.",
			twist:
				"Wick placed one final bet staking something he doesn't own: information about the guild's den location. He lost. The new holder of that information isn't sure what to do with it yet."
		},
		{
			title: 'The Noble Correspondence',
			type: 'Blackmail',
			target: 'Lord Fennwick Cray, a minor noble with major parliamentary ambitions',
			payout: '150 gp now, 60 gp per month ongoing',
			risk: 'Medium',
			details:
				"The guild holds letters proving Lord Cray's involvement in a scandalous affair six years ago. Approach him discreetly, present the terms, and establish the arrangement.",
			twist:
				"Cray has already hired a different group to retrieve the letters. That group is currently watching the guild's cover business from across the street."
		},
		{
			title: 'Museum Night',
			type: 'Burglary',
			target: "The Artificers' Museum, specifically the third-floor eastern wing",
			payout: '280 gp for the specific item; 400 gp if nothing else is touched',
			risk: 'High',
			details:
				'A collector wants a specific mechanical artifact returned to them — they claim it was stolen from their family. The museum uses an arcane alarm system on the display cases.',
			twist:
				"The artifact is real, the collector's claim is false, and the item's actual owner is a powerful mage who will notice its absence within hours of removal."
		},
		{
			title: 'The Informant',
			type: 'Assassination',
			target: 'An unknown guild member who has been talking to the watch',
			payout: 'Internal — guild standing and forgiveness of outstanding debts',
			risk: 'Medium',
			details:
				'Someone in the den has been leaking information. Three jobs have gone wrong in ways that suggest advance knowledge. Find the source and deal with it before the next job is compromised.',
			twist:
				"There are two informants, not one, working independently and each unaware of the other. The guild's Spymaster planted one of them."
		}
	];

	// ── House Rules ───────────────────────────────────────────────────────────────
	const RULES = [
		"No member marks another member's target. Violators are expelled without severance.",
		'All jobs are cleared through the board. Freelancing keeps nothing and earns a fine.',
		"No member gives the den's location under any circumstance. The penalty is not negotiable.",
		'A member may buy out of a job, but only before the brief. After the brief, you finish or you pay.',
		'The fence sets the price. Arguing the price costs you five percent. Every time.',
		'No killing inside the den. Outside is your own business.',
		'First-job members take sixty percent cut. The standard is eighty. You earn the rest.',
		'Debts to the guild compound weekly. Three weeks unpaid and the matter goes to the Shadow.',
		'What happens on a job stays on the job. No stories in the common room. Ever.',
		'Any member who goes to ground for more than two weeks without notice is considered retired. Permanently.'
	];

	// ── Rumors ────────────────────────────────────────────────────────────────────
	const RUMORS = [
		"The Guildmaster hasn't been seen in person for three weeks. The Shadow is giving all the orders.",
		'Someone has been meeting with the city watch — not as an informant, but as a negotiator.',
		'A job that went wrong last season killed two members. The client who set it up is still breathing.',
		'The vault was opened last night. No one authorized it. The master says nothing was taken.',
		"A rival guild sent a message — not a threat, a job offer. The guild hasn't responded yet.",
		"One of the fence's regular buyers is offering above-market for anything relating to House Aldenmere.",
		"Three members went to case a job site two days ago. Only two came back, and they won't say why.",
		"The guild's street informant network has gone quiet in the Docks. Something is being cleared out.",
		"The forger has been working overnight on a document nobody asked about. She won't say for whom.",
		"A new recruit passed all tests in record time. The Lookout Chief thinks they're too good.",
		'The poisoner received a custom order from an anonymous client. It has already been completed.',
		"Someone in the den has been asking detailed questions about the escape tunnels' exit points.",
		"The watch's new captain has a reputation — she made three other guilds disappear in her last posting.",
		'An old member surfaced in another city, claiming to run their own operation. The master was told.',
		'The counting room ledger from two months ago has a discrepancy. No one is admitting to it.'
	];

	// ── Heat ──────────────────────────────────────────────────────────────────────
	const HEAT_NOTES: Record<HeatLevel, string[]> = {
		Cold: [
			'The watch has no active leads. Business is good.',
			"The guild's cover story is solid. No eyebrows are raised.",
			'Recent jobs have been clean. No witnesses, no trails.'
		],
		Warm: [
			'A watch sergeant has been asking questions in the district.',
			"One recent job was sloppy. There's a witness the guild hasn't found yet.",
			"The guild's cover business is under a routine tax audit. Timing is inconvenient."
		],
		Hot: [
			"Two members were arrested last week. They're holding — for now.",
			"A watch informant is active in the district. The guild doesn't know who.",
			"The new watch captain has the den's neighborhood as a personal project."
		],
		Burning: [
			'A raid is imminent. The Shadow has already begun moving assets.',
			"An inside informant has given the watch partial information about the den's location.",
			'Three members have gone to ground. The Guildmaster is considering burning the cover entirely.'
		]
	};

	// ── Generation ────────────────────────────────────────────────────────────────
	function makeName(rng: () => number): string {
		return `${pick(FIRST_NAMES, rng)} ${pick(LAST_NAMES, rng)}`;
	}

	function generateDen(): DenData {
		const guildName = pick(GUILD_NAMES, mkRng(hashSeed('gname', seed)));
		const alias = pick(ALIASES, mkRng(hashSeed('alias', seed)));
		const cover = pick(COVERS, mkRng(hashSeed('cover', seed)));
		const district = pick(DISTRICTS, mkRng(hashSeed('district', seed)));
		const entrance = pick(ENTRANCES, mkRng(hashSeed('entrance', seed)));

		// Heat level — weighted
		const heatRng = mkRng(hashSeed('heat', seed));
		const heatRoll = heatRng();
		let heatLevel: HeatLevel;
		if (heatRoll < 0.3) heatLevel = 'Cold';
		else if (heatRoll < 0.6) heatLevel = 'Warm';
		else if (heatRoll < 0.85) heatLevel = 'Hot';
		else heatLevel = 'Burning';
		const heatNote = pick(HEAT_NOTES[heatLevel], mkRng(hashSeed('heat-note', seed)));

		// Rooms — pick 5 from pool
		const rooms = shuffle(ROOM_POOL, mkRng(hashSeed('rooms', seed))).slice(0, 5);

		// Hierarchy — 4 members from title pool
		const titlePool = shuffle(TITLES, mkRng(hashSeed('titles', seed))).slice(0, 4);
		const traitPool = shuffle(TRAITS, mkRng(hashSeed('traits', seed)));
		const hierarchy: GuildMember[] = titlePool.map((t, i) => ({
			title: t.title,
			name: makeName(mkRng(hashSeed(`member-name-${i}`, seed))),
			trait: traitPool[i],
			note: t.note
		}));

		// Fence — 5 items
		const fence = shuffle(FENCE_POOL, mkRng(hashSeed('fence', seed))).slice(0, 5);

		// Jobs — 3–4 from pool
		const jobRng = mkRng(hashSeed('jobs', seed));
		const numJobs = jobRng() < 0.45 ? 3 : 4;
		const jobs = shuffle(JOB_POOL, mkRng(hashSeed('job-pool', seed))).slice(0, numJobs);

		const rule = pick(RULES, mkRng(hashSeed('rule', seed)));
		const rumor = pick(RUMORS, mkRng(hashSeed('rumor', seed)));

		return {
			guildName,
			alias,
			cover,
			district,
			heatLevel,
			heatNote,
			entrance,
			rooms,
			hierarchy,
			fence,
			jobs,
			rule,
			rumor
		};
	}

	function randomize() {
		seed = Math.floor(Math.random() * 1_000_000_000);
	}

	// ── Save / Load ───────────────────────────────────────────────────────────────
	interface SavedDen {
		id: string;
		name: string;
		seed: number;
		savedAt: number;
	}
	const DENS_KEY = 'initiative_saved_guild_dens';
	let savedDens = $state<SavedDen[]>([]);
	if (typeof window !== 'undefined') {
		try {
			savedDens = JSON.parse(localStorage.getItem(DENS_KEY) ?? '[]');
		} catch {
			savedDens = [];
		}
	}
	function saveDen() {
		const entry: SavedDen = {
			id: crypto.randomUUID(),
			name: denData?.guildName ?? 'Unknown Guild',
			seed,
			savedAt: Date.now()
		};
		savedDens = [entry, ...savedDens].slice(0, 20);
		localStorage.setItem(DENS_KEY, JSON.stringify(savedDens));
	}
	function deleteSavedDen(id: string) {
		savedDens = savedDens.filter((d) => d.id !== id);
		localStorage.setItem(DENS_KEY, JSON.stringify(savedDens));
	}
	function applyDen(s: SavedDen) {
		seed = s.seed;
	}

	// ── Color maps ────────────────────────────────────────────────────────────────
	const HEAT_COLORS: Record<HeatLevel, string> = {
		Cold: 'bg-blue-900/50 text-blue-300',
		Warm: 'bg-yellow-900/50 text-yellow-400',
		Hot: 'bg-orange-900/50 text-orange-400',
		Burning: 'bg-red-900/60 text-red-400'
	};

	const RISK_COLORS: Record<Job['risk'], string> = {
		Low: 'bg-green-900/50 text-green-300',
		Medium: 'bg-yellow-900/50 text-yellow-400',
		High: 'bg-orange-900/50 text-orange-400',
		Suicidal: 'bg-red-900/60 text-red-400'
	};

	const JOB_TYPE_COLORS: Record<string, string> = {
		Burglary: 'bg-indigo-900/50 text-indigo-300',
		Assassination: 'bg-red-900/50 text-red-300',
		Extortion: 'bg-orange-900/50 text-orange-300',
		Smuggling: 'bg-teal-900/50 text-teal-300',
		Espionage: 'bg-purple-900/50 text-purple-300',
		Kidnapping: 'bg-rose-900/50 text-rose-300',
		'Frame Job': 'bg-amber-900/50 text-amber-300',
		Heist: 'bg-yellow-900/50 text-yellow-300',
		Blackmail: 'bg-fuchsia-900/50 text-fuchsia-300',
		Sabotage: 'bg-red-900/50 text-red-400',
		Forgery: 'bg-blue-900/50 text-blue-300',
		'Debt Collection': 'bg-gray-700 text-gray-300'
	};

	let expandedJobs = $state<Set<number>>(new Set());
	function toggleJob(i: number) {
		if (expandedJobs.has(i)) expandedJobs.delete(i);
		else expandedJobs.add(i);
		expandedJobs = new Set(expandedJobs);
	}

	$effect(() => {
		denData = generateDen();
		expandedJobs = new Set();
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
				<h2 class="text-lg font-bold tracking-wide text-amber-300">Thieves Guild Generator</h2>
				{#if denData}
					<span class="text-xs text-gray-500">{denData.guildName}</span>
				{/if}
			</div>
			<button
				onclick={onclose}
				class="rounded border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition hover:border-red-700 hover:text-red-400"
				aria-label="Close"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/if}

	<!-- Body -->
	<div class="relative flex min-h-0 flex-1 overflow-hidden">
		<!-- Left panel: controls -->
		<div
			class="hidden w-56 shrink-0 flex-col gap-5 overflow-y-auto border-r border-gray-800 bg-gray-900/60 p-4 sm:flex"
		>
			<button
				onclick={randomize}
				class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
			>
				Generate New Den
			</button>

			{#if denData}
				<button
					onclick={saveDen}
					class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
				>
					Save Den
				</button>
			{/if}

			{#if savedDens.length}
				<div class="flex flex-col gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
						>Saved Dens</span
					>
					<div class="flex max-h-64 flex-col gap-1 overflow-y-auto">
						{#each savedDens as s (s.id)}
							<div class="flex items-center gap-1 rounded bg-gray-800/80 px-2 py-1.5">
								<button
									onclick={() => applyDen(s)}
									class="min-w-0 flex-1 truncate text-left text-xs text-gray-200 hover:text-amber-400"
									title={s.name}>{s.name}</button
								>
								<button
									onclick={() => deleteSavedDen(s.id)}
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
			{#if denData}
				<!-- ── Banner ──────────────────────────────────────────────────── -->
				<div class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h2 class="text-2xl font-bold tracking-wide text-white">{denData.guildName}</h2>
							<p class="text-sm text-gray-500 italic">
								Known to members as <span class="text-gray-300">{denData.alias}</span>
							</p>
						</div>
						<span
							class="rounded px-2.5 py-1 text-xs font-bold tracking-widest uppercase {HEAT_COLORS[
								denData.heatLevel
							]}"
						>
							Heat: {denData.heatLevel}
						</span>
					</div>
					<div class="mt-3 grid grid-cols-1 gap-1 text-xs text-gray-400 sm:grid-cols-3">
						<p><span class="text-gray-600">District:</span> {denData.district}</p>
						<p class="sm:col-span-2">
							<span class="text-gray-600">Cover:</span>
							{denData.cover}
						</p>
					</div>
					<p class="mt-2 text-xs text-gray-400">
						<span class="text-gray-600">Secret entrance:</span>
						{denData.entrance}.
					</p>
					<p class="mt-2 text-xs text-gray-500 italic">{denData.heatNote}</p>
				</div>

				<!-- ── Main grid ───────────────────────────────────────────────── -->
				<div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
					<!-- Den Layout -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-amber-500 uppercase">
							Den Layout
						</h3>
						<div class="flex flex-col gap-2">
							{#each denData.rooms as room}
								<div class="rounded-lg border border-gray-700/50 bg-gray-900/40 px-3 py-2">
									<p class="mb-0.5 text-sm font-semibold text-gray-100">{room.name}</p>
									<p class="mb-1 text-[11px] text-gray-500 italic">{room.description}</p>
									<p class="text-xs leading-snug text-gray-400">{room.detail}</p>
								</div>
							{/each}
						</div>
					</div>

					<!-- Hierarchy -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-amber-500 uppercase">
							Hierarchy
						</h3>
						<div class="flex flex-col gap-2">
							{#each denData.hierarchy as member}
								<div class="rounded-lg border border-gray-700/50 bg-gray-900/40 px-3 py-2">
									<div class="mb-0.5 flex flex-wrap items-baseline gap-2">
										<span class="text-sm font-bold text-gray-100">{member.name}</span>
										<span class="text-[10px] font-semibold tracking-wider text-amber-500 uppercase"
											>{member.title}</span
										>
									</div>
									<p class="text-xs text-gray-500 italic">{member.note}</p>
									<p class="mt-0.5 text-[11px] text-gray-400">{member.trait}.</p>
								</div>
							{/each}
						</div>
					</div>

					<!-- Fence Inventory -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-amber-500 uppercase">
							Fence Inventory
						</h3>
						<div class="flex flex-col gap-2">
							{#each denData.fence as item}
								<div class="rounded-lg border border-gray-700/50 bg-gray-900/40 px-3 py-2">
									<p class="mb-0.5 text-sm font-semibold text-gray-100">{item.item}</p>
									<p class="mb-1 text-[11px] text-gray-500 italic">{item.origin}.</p>
									<div class="flex items-start justify-between gap-2">
										<p class="text-[11px] leading-snug text-gray-400 italic">{item.note}</p>
										<span class="shrink-0 text-xs font-bold text-amber-400">{item.value}</span>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Job Board -->
					<div class="rounded-xl border border-red-900/30 bg-red-950/10 p-4">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-red-400 uppercase">
							Current Job Board
						</h3>
						<div class="flex flex-col gap-2">
							{#each denData.jobs as job, i}
								{@const expanded = expandedJobs.has(i)}
								<div class="rounded-lg border border-gray-700/50 bg-gray-900/40 px-3 py-2">
									<button
										class="flex w-full items-start justify-between gap-2 text-left"
										onclick={() => toggleJob(i)}
									>
										<div class="flex min-w-0 flex-col gap-1">
											<div class="flex flex-wrap items-center gap-1.5">
												<span class="text-sm font-bold text-gray-100">{job.title}</span>
												<span
													class="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase {JOB_TYPE_COLORS[
														job.type
													] ?? 'bg-gray-700 text-gray-300'}">{job.type}</span
												>
												<span
													class="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase {RISK_COLORS[
														job.risk
													]}">{job.risk}</span
												>
											</div>
											<p class="text-xs font-semibold text-amber-400">{job.payout}</p>
										</div>
										<span class="mt-1 shrink-0 text-gray-600">{expanded ? '▲' : '▼'}</span>
									</button>
									{#if expanded}
										<div class="mt-2 border-t border-gray-700/50 pt-2">
											<p class="mb-1 text-[11px] text-gray-500 italic">
												Target: {job.target}
											</p>
											<p class="mb-2 text-xs leading-relaxed text-gray-300">{job.details}</p>
											<div class="rounded bg-red-950/40 px-2 py-1.5">
												<p
													class="mb-0.5 text-[10px] font-semibold tracking-wider text-red-400 uppercase"
												>
													Twist
												</p>
												<p class="text-xs leading-relaxed text-gray-400 italic">{job.twist}</p>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<!-- House Rule & Rumor -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							House Rule
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 italic">"{denData.rule}"</p>
					</div>

					<div class="rounded-xl border border-purple-900/30 bg-purple-950/10 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-purple-400 uppercase">
							Current Rumor
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 italic">{denData.rumor}</p>
					</div>
				</div>

				<!-- Mobile regenerate -->
				<div class="mt-6 flex gap-3 sm:hidden">
					<button
						onclick={randomize}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						New Den
					</button>
					<button
						onclick={saveDen}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						Save
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
