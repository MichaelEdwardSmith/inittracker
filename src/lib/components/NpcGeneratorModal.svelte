<!-- NPC Generator — identity, personality, and D&D 5e stat block -->
<script lang="ts">
	import { exportNpcPdf } from '$lib/pdfExport';

	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	// ── Types ─────────────────────────────────────────────────────────────────────
	type Role =
		| 'commoner'
		| 'merchant'
		| 'guard'
		| 'innkeeper'
		| 'noble'
		| 'criminal'
		| 'adventurer'
		| 'sage'
		| 'clergy'
		| 'soldier';
	type Gender = 'any' | 'male' | 'female';
	type Disposition = 'friendly' | 'neutral' | 'suspicious' | 'hostile';

	interface StatBlock {
		cr: string;
		xp: number;
		ac: number;
		acNote: string;
		hp: number;
		hpDice: string;
		speed: number;
		str: number;
		dex: number;
		con: number;
		int: number;
		wis: number;
		cha: number;
		savingThrows: string[];
		skills: string[];
		traits: { name: string; desc: string }[];
		actions: { name: string; desc: string }[];
		alignment: string;
		type: string;
	}

	interface NpcData {
		name: string;
		race: string;
		gender: string;
		ageDesc: string;
		role: string;
		build: string;
		feature: string;
		clothing: string;
		trait: string;
		flaw: string;
		voice: string;
		motivation: string;
		secret: string;
		plotHook: string;
		stats: StatBlock;
	}

	// ── Controls ──────────────────────────────────────────────────────────────────
	let role = $state<Role>('commoner');
	let gender = $state<Gender>('any');
	let disposition = $state<Disposition>('neutral');
	let seed = $state(Math.floor(Math.random() * 1_000_000_000));
	let npcData = $state<NpcData | null>(null);

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
	function pick<T>(arr: T[], rng: () => number): T {
		return arr[Math.floor(rng() * arr.length)];
	}
	function vary(base: number, rng: () => number): number {
		return Math.max(3, Math.min(20, base + Math.floor(rng() * 3) - 1));
	}
	function mod(score: number): string {
		const m = Math.floor((score - 10) / 2);
		return m >= 0 ? `+${m}` : `${m}`;
	}
	function atk(score: number): string {
		const m = Math.floor((score - 10) / 2) + 2;
		return m >= 0 ? `+${m}` : `${m}`;
	}
	function dmg(dice: number, sides: number, score: number): string {
		const bonus = Math.floor((score - 10) / 2);
		const avg = Math.max(1, Math.floor((dice * (sides + 1)) / 2 + bonus));
		const bonusStr = bonus > 0 ? ` + ${bonus}` : bonus < 0 ? ` - ${Math.abs(bonus)}` : '';
		return `${avg} (${dice}d${sides}${bonusStr})`;
	}

	// ── Name tables ───────────────────────────────────────────────────────────────
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
		'Godwin',
		'Harwin',
		'Joren',
		'Kellan',
		'Lucian',
		'Mattis',
		'Nels',
		'Oran',
		'Perrin'
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
		'Mirna',
		'Aldara',
		'Briseis',
		'Celyn',
		'Dwyn',
		'Eryn',
		'Freya',
		'Gwynn',
		'Helsa'
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
		'Duskmore',
		'Brightwell',
		'Coldwater',
		'Elmshire',
		'Foxgrove',
		'Greymantle',
		'Holloway'
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
	const AGES = [
		'Young adult (early 20s)',
		'Adult (late 20s)',
		'Established (mid-30s)',
		'Settled (mid-40s)',
		'Veteran (50s)',
		'Elder (60s+)'
	];

	// ── Appearance ────────────────────────────────────────────────────────────────
	const BUILDS = [
		'Stout and broad-shouldered',
		'Wiry and lean',
		'Tall with a slight stoop',
		'Short but surprisingly solid',
		'Average height, forgettable frame',
		'Heavyset with a slow, deliberate manner',
		'Lanky with overlong arms',
		'Well-built but gone slightly soft with age',
		'Compact and quick-moving',
		'Slight of frame but with an oddly strong handshake'
	];
	const FEATURES = [
		'a deep scar running from chin to ear',
		'eyes of two different colors — one grey, one amber',
		'knuckles rough and scarred from decades of work',
		'a nose broken and reset at least twice',
		'laugh lines that give every expression a warm quality',
		'ink-stained fingers and a habit of squinting',
		'a missing fingertip on the left hand',
		'unusually neat hair for someone in their circumstances',
		'a faded tattoo on the back of one hand, origin unclear',
		'ears slightly too large, which they seem self-conscious of',
		'a thin white scar across one eyebrow',
		'deep-set eyes that rarely blink'
	];
	const CLOTHING: Record<Role, string[]> = {
		commoner: [
			'worn linen tunic and patched trousers, practical rather than presentable',
			'homespun cloth the color of mud, recently but imperfectly washed',
			'a work apron over plain clothes, never quite fully removed'
		],
		merchant: [
			'well-tailored coat gone shiny at the elbows, still finer than most in the room',
			'practical traveling clothes with more pockets than is strictly necessary',
			'a good wool doublet and boots that cost more than they look'
		],
		guard: [
			"a tabard over chain showing a local lord's insignia, slightly crooked",
			'patrol gear with a dented pauldron that was never replaced',
			'uniform kept in good order except for a buckle held closed with twine'
		],
		innkeeper: [
			'stained apron over a sturdy shirt, sleeves always rolled to the elbows',
			'plain but clean workwear, practical for a long day behind a bar',
			'a rough linen shirt and trousers that suggest pride without ostentation'
		],
		noble: [
			'fine garments in the current fashion, slightly overdressed for the company',
			'quality clothing worn with the ease of someone who has never bought their own',
			'a rich coat with subtle embroidery, understated enough to feel deliberate'
		],
		criminal: [
			'nondescript dark clothing chosen for not standing out',
			"plain traveler's clothes with a belt carrying more tools than weapons",
			'roughspun that fits oddly, as though taken from someone else'
		],
		adventurer: [
			'well-worn traveling gear with patches from a dozen different places',
			'practical layers: leather vest over wool, boots with room for a hidden blade',
			'a mix of practical and distinctive — someone who needs to be remembered in some rooms, forgotten in others'
		],
		sage: [
			'robes that were once fine, now faded and ink-stained in three places',
			'plain academic dress with a satchel that looks heavier than it is',
			'a long coat with so many inner pockets it has its own gravitational field'
		],
		clergy: [
			'vestments of modest quality, kept clean and pressed despite hard travel',
			"a cleric's traveling habit, hood usually down, holy symbol always visible",
			'plain religious garb with a single silver clasp — the only luxury allowed'
		],
		soldier: [
			'stripped-down armor, gambeson and pauldrons, like someone halfway between duty and rest',
			"a veteran's layered kit: practical, scarred, efficient",
			'military dress maintained by reflex, though no longer required to be'
		]
	};

	// ── Personality ───────────────────────────────────────────────────────────────
	const TRAITS: Record<Role, string[]> = {
		commoner: [
			'Suspicious of outsiders but fiercely loyal to anyone who earns their trust.',
			'Cheerful in a way that seems almost defiant given their circumstances.',
			'Quiet, observant, and quicker than they appear.',
			'A deep believer in fairness, even when the world has not been fair to them.'
		],
		merchant: [
			'Every conversation is an opportunity; every silence is a negotiation.',
			'Genuinely generous once the price is agreed — they just want the price agreed first.',
			'Maintains a pleasant façade that slips when someone wastes their time.',
			"Has a story about every item they sell. Whether it's true is another matter."
		],
		guard: [
			'Follows orders without complaint, interprets them creatively when convenient.',
			'Takes pride in the job, even when the job is thankless.',
			'Relaxed on the surface; hypervigilant underneath.',
			'Has seen enough that nothing surprises them, but they still care how things turn out.'
		],
		innkeeper: [
			'Has heard every hard-luck story and believes about half of them. Feeds people regardless.',
			'Direct, unhurried, and impossible to rattle. The inn has survived worse.',
			'Excellent memory for faces, tabs, and grudges — in approximately that order of priority.',
			"Keeps out of other people's business. Unless asked. Sometimes even then."
		],
		noble: [
			'Accustomed to being the most important person in the room; genuinely puzzled when they are not.',
			'Polished manners concealing a surprisingly ruthless practicality.',
			'Genuinely wants to help — just usually on their own terms and timeline.',
			'A wit deployed like a weapon and a smile deployed like a shield.'
		],
		criminal: [
			'Affable, cautious, and very good at being underestimated.',
			'Calculates risk the way other people calculate change: constantly and automatically.',
			'Loyal to a small circle. Outside that circle, loyalty is a commodity.',
			"Doesn't take things personally. Professionally, that's a different matter."
		],
		adventurer: [
			'Battle-worn and practical, with a soft spot they protect behind a hard exterior.',
			'Generous with hard-won knowledge, but only to those who seem capable of using it.',
			"Restless in peacetime. The quiet doesn't suit them.",
			'Cheerful about most things, deeply serious about a small number of them.'
		],
		sage: [
			'Easily distracted by anything genuinely interesting. "Interesting" covers a wide range.',
			'Talks faster when excited, slower when uncertain, and barely at all when disappointed.',
			"Assumes everyone shares their level of curiosity. Frequently surprised when they don't.",
			'Patient in the way of someone who has spent years waiting for the right answer.'
		],
		clergy: [
			'Calm in crisis, genuinely present in conversation, unhurried in all things.',
			'Carries a quiet certainty that most people find reassuring and a few find maddening.',
			'More practical than their calling might suggest. The gods help those who also help themselves.',
			'Listens better than they speak, and speaks only when they have something worth saying.'
		],
		soldier: [
			'Economical with words, generous with assistance, deeply uncomfortable with ceremony.',
			'Values competence above rank, loyalty above orders, honesty above everything.',
			'Has learned to be patient. Has not learned to be quiet when patience runs out.',
			'Dry humor deployed at intervals, usually in situations other people find tense.'
		]
	};
	const FLAWS = [
		"Can't let a slight go, no matter how small or how long ago.",
		'Tells half the truth and calls it honesty.',
		'Sees the worst in people first and makes them prove otherwise.',
		'Overestimates their own read of a situation.',
		'Spends coin as fast as it arrives.',
		"Has a temper they've learned to hide but not to control.",
		'Makes promises they mean at the time.',
		'Trusts the wrong people because the wrong people tell them what they want to hear.',
		'Holds a grudge the way other people hold a keepsake.',
		'Takes too long to ask for help.',
		'Has one habit they refuse to examine too closely.',
		'Uncomfortable with silence; fills it with things better left unsaid.'
	];
	const VOICES = [
		'Speaks quietly and expects to be leaned toward.',
		'A flat, measured cadence that gives nothing away.',
		"Warm and unhurried; every sentence ends like it's settling into place.",
		'Quick and clipped, as though words are being rationed.',
		'Has a habit of repeating the last few words of what someone said before responding.',
		'Drops volume when making a point; rises when uncomfortable.',
		'The kind of voice that fills a room without effort.',
		'Speaks in short sentences. Pauses between them are load-bearing.',
		"A slight accent, origin difficult to place, that strengthens when they're angry.",
		'Thoughtful pauses before every answer — genuine, not performative.',
		"Punctuates sentences with a small sound — 'hmm', 'aye', 'right' — easy to miss and hard to forget."
	];

	// ── Motivation, secrets, hooks ────────────────────────────────────────────────
	const MOTIVATIONS: Record<Role, string[]> = {
		commoner: [
			'Trying to save enough to buy out of a work contract before winter.',
			'Wants to find out what happened to a cousin who left for the city three years ago.',
			'Keeping a promise made to someone who can no longer collect on it.'
		],
		merchant: [
			"Closing one final deal that will clear a debt they'd rather no one knew about.",
			'Expanding their routes before a rival corners the market.',
			"Trying to establish a contact in a region that doesn't know their name yet."
		],
		guard: [
			'Covering for a fellow guard who made a mistake; hoping it stays covered.',
			'Working toward a post they were passed over for twice.',
			'Trying to stay out of a political dispute that both sides want them involved in.'
		],
		innkeeper: [
			'Trying to pay off a loan taken to expand the inn before the lender calls it early.',
			'Protecting a regular guest who may have made dangerous enemies.',
			'Keeping the inn neutral ground in a local feud that could turn the whole town against them.'
		],
		noble: [
			'Securing an alliance that will shore up a position quietly threatened by a rival house.',
			'Trying to locate a family heirloom before its absence is noticed.',
			'Managing a scandal before it becomes the kind of story people repeat.'
		],
		criminal: [
			"Looking for a way out of an organization that doesn't offer clean exits.",
			'Recovering something taken in a job gone wrong.',
			'Staying one step ahead of someone who has very good reasons to find them.'
		],
		adventurer: [
			'Tracking a rumor that, if true, would change what they thought they knew about their past.',
			"Making enough coin to retire somewhere that doesn't have an extradition treaty.",
			"Trying to put right something they did in a job they'd rather forget."
		],
		sage: [
			'Verifying a theory that their peers have dismissed as impossible.',
			'Tracing the provenance of an artifact before someone else claims it.',
			"Finding a student they mentored who has gone in a direction they can't endorse."
		],
		clergy: [
			'Ministering to a community that a larger institution has abandoned.',
			'Investigating a miracle that may not be what it appears.',
			'Carrying a message from their order that must arrive without going through official channels.'
		],
		soldier: [
			'Finding out what actually happened on a campaign that ended with unanswered questions.',
			"Protecting a civilian who witnessed something they shouldn't have.",
			'Completing a mission that was officially called off but still needs finishing.'
		]
	};
	const SECRETS: Record<Role, string[]> = {
		commoner: [
			"Witnessed something they weren't supposed to see. Have said nothing about it since.",
			'Has a past in another town under a different name.',
			'Has been quietly funding a cause they would never admit to in public.'
		],
		merchant: [
			'The business is carrying a debt that would ruin them if it became known.',
			'Has been passing information to a second buyer without either knowing.',
			"The goods they're known for are not entirely from the source they claim."
		],
		guard: [
			'Has been looking the other way for someone — not for coin, but for reasons they consider justified.',
			'Knows where something was hidden and has told no one.',
			'Was present during an incident recorded very differently from how it happened.'
		],
		innkeeper: [
			"The inn has a room that isn't on any manifest and hasn't been empty in months.",
			"Has been receiving messages through their establishment that they don't open but don't discard.",
			'Once sheltered someone the crown was actively hunting. Never stopped being grateful they did.'
		],
		noble: [
			"The family fortune is a fraction of what it's believed to be.",
			'Entered into an arrangement in youth that still has teeth.',
			'Has been feeding information about their own house to someone who pays well for it.'
		],
		criminal: [
			'Has been cooperating with an authority, quietly, for longer than anyone would believe.',
			'The reputation was earned by someone else. They stepped into it when the opportunity arose.',
			'Has enough on their employer to end them. Has never used it. Not yet.'
		],
		adventurer: [
			"Left a party behind in circumstances they can't justify and haven't tried.",
			"The name they're using is not the one they were born with.",
			'Has been quietly steering toward a specific destination without explaining why.'
		],
		sage: [
			"The discovery they're most known for was based on a source they fabricated.",
			'Has been contacted by an entity they have not disclosed to their institution.',
			"Knows something about an artifact they've chosen to record only in cipher."
		],
		clergy: [
			'Experienced a crisis of faith they resolved with a lie told to themselves.',
			'Has been redirecting a portion of the temple tithe to a cause their order would not approve.',
			'Knows the location of a relic their institution believes was lost.'
		],
		soldier: [
			'The casualty report from a particular engagement was not entirely accurate.',
			'Took something from the field that was never logged. Still has it.',
			'Received an order they followed without question and has been regretting it ever since.'
		]
	};
	const HOOKS: Record<Role, string[]> = {
		commoner: [
			"Overheard something while working that they don't fully understand but clearly someone would pay to know.",
			"Needs an escort for a delivery that's attracting attention they can't explain.",
			"The 'accident' that injured them last month wasn't one."
		],
		merchant: [
			'Needs discrete hands for a shipment that cannot go through normal channels.',
			"A competitor has obtained a document that shouldn't exist. They'd pay well for its return.",
			'Looking for someone who can investigate a supplier who has gone suddenly and completely silent.'
		],
		guard: [
			"Has information about a coming raid but can't act on it without exposing why they have it.",
			'Needs someone to deliver a sealed letter without logging who delivered it.',
			'Looking for a missing person — unofficially, on their own time.'
		],
		innkeeper: [
			"A guest has not checked out and no one will say what's happened to them.",
			'Someone has been watching the inn for three days. They want to know why.',
			'A package was left for a name no one at the inn recognizes. It ticks.'
		],
		noble: [
			'Needs someone to attend a function in their stead without the attendees knowing.',
			'A document has gone missing from a locked room. They need it back before an important meeting.',
			"A member of their household has made contact with someone they shouldn't have."
		],
		criminal: [
			"Has a job that requires people who can't be traced back to their usual network.",
			"Something went missing from a heist that wasn't on the manifest. Needs to know what it was.",
			'Looking for a neutral party to broker an exchange between two groups who would rather not meet.'
		],
		adventurer: [
			"Has a map to somewhere they can't go alone and won't say why.",
			'Looking for people trustworthy enough to hold something important while they handle something dangerous.',
			'Knows where a person of interest is. Needs backup before they can do anything about it.'
		],
		sage: [
			"Has found a reference to a location that shouldn't exist. Needs people who can get there.",
			"An artifact they authenticated has started behaving in ways that weren't in the description.",
			"Looking for a specific text. The last person who went looking for it didn't come back."
		],
		clergy: [
			'A member of the congregation has confessed to witnessing something. Needs secular help to act on it.',
			"Has been receiving visions pointing to a specific location. Not sure if that's good news.",
			"Something is wrong at a shrine two days out. Has no one to send and can't go personally."
		],
		soldier: [
			"Has orders to observe and report; the problem is what they're observing.",
			"Needs to reach a position before a relief that can't be trusted gets there first.",
			"Found something in the field that wasn't in the briefing. Can't leave it and can't carry it alone."
		]
	};

	// ── Stat block profiles ───────────────────────────────────────────────────────
	const ROLE_LABELS: Record<Role, string> = {
		commoner: 'Commoner',
		merchant: 'Merchant',
		guard: 'Guard',
		innkeeper: 'Innkeeper',
		noble: 'Noble',
		criminal: 'Criminal',
		adventurer: 'Retired Adventurer',
		sage: 'Sage',
		clergy: 'Clergy',
		soldier: 'Soldier'
	};

	type BaseStats = { str: number; dex: number; con: number; int: number; wis: number; cha: number };

	interface StatProfile {
		cr: string;
		xp: number;
		ac: number;
		acNote: string;
		hitDice: number;
		hitSides: number;
		str: number;
		dex: number;
		con: number;
		int: number;
		wis: number;
		cha: number;
		savingThrows: string[];
		skills: string[];
		traits: { name: string; desc: string }[];
		getActions: (sb: BaseStats) => { name: string; desc: string }[];
		alignment: string;
		type: string;
	}

	const PROFILES: Record<Role, StatProfile> = {
		commoner: {
			cr: '0',
			xp: 10,
			ac: 10,
			acNote: '',
			hitDice: 1,
			hitSides: 8,
			str: 10,
			dex: 10,
			con: 10,
			int: 10,
			wis: 10,
			cha: 10,
			savingThrows: [],
			skills: [],
			traits: [],
			getActions: (sb) => [
				{
					name: 'Club',
					desc: `Melee Weapon Attack: ${atk(sb.str)} to hit, reach 5 ft., one target. Hit: ${dmg(1, 4, sb.str)} bludgeoning damage.`
				}
			],
			alignment: 'any',
			type: 'humanoid'
		},
		merchant: {
			cr: '1/8',
			xp: 25,
			ac: 10,
			acNote: '',
			hitDice: 2,
			hitSides: 8,
			str: 10,
			dex: 11,
			con: 12,
			int: 12,
			wis: 11,
			cha: 13,
			savingThrows: [],
			skills: ['Insight +3', 'Persuasion +3'],
			traits: [
				{
					name: 'Mercantile Eye',
					desc: 'The merchant can appraise the value of nonmagical goods at a glance and has advantage on Insight checks to detect deception in trade negotiations.'
				}
			],
			getActions: (sb) => [
				{
					name: 'Dagger',
					desc: `Melee or Ranged Weapon Attack: ${atk(sb.dex)} to hit, reach 5 ft. or range 20/60 ft., one target. Hit: ${dmg(1, 4, sb.dex)} piercing damage.`
				}
			],
			alignment: 'any neutral',
			type: 'humanoid'
		},
		guard: {
			cr: '1/8',
			xp: 25,
			ac: 16,
			acNote: 'chain shirt, shield',
			hitDice: 2,
			hitSides: 8,
			str: 13,
			dex: 12,
			con: 12,
			int: 10,
			wis: 11,
			cha: 10,
			savingThrows: [],
			skills: ['Perception +2'],
			traits: [
				{
					name: 'Alert',
					desc: 'The guard has advantage on Wisdom (Perception) checks and cannot be surprised while conscious.'
				}
			],
			getActions: (sb) => [
				{
					name: 'Spear',
					desc: `Melee or Ranged Weapon Attack: ${atk(sb.str)} to hit, reach 5 ft. or range 20/60 ft., one target. Hit: ${dmg(1, 6, sb.str)} piercing damage, or ${dmg(1, 8, sb.str)} piercing damage if used with two hands.`
				}
			],
			alignment: 'any lawful',
			type: 'humanoid'
		},
		innkeeper: {
			cr: '1/8',
			xp: 25,
			ac: 10,
			acNote: '',
			hitDice: 2,
			hitSides: 8,
			str: 11,
			dex: 10,
			con: 11,
			int: 11,
			wis: 12,
			cha: 13,
			savingThrows: [],
			skills: ['Insight +3', 'Persuasion +3'],
			traits: [
				{
					name: 'Local Knowledge',
					desc: 'The innkeeper has advantage on Intelligence (History) and Wisdom (Insight) checks relating to their community and its inhabitants.'
				}
			],
			getActions: (sb) => [
				{
					name: 'Rolling Pin',
					desc: `Melee Weapon Attack: ${atk(sb.str)} to hit, reach 5 ft., one target. Hit: ${dmg(1, 4, sb.str)} bludgeoning damage.`
				}
			],
			alignment: 'any',
			type: 'humanoid'
		},
		noble: {
			cr: '1/8',
			xp: 25,
			ac: 15,
			acNote: 'breastplate',
			hitDice: 2,
			hitSides: 8,
			str: 11,
			dex: 12,
			con: 11,
			int: 12,
			wis: 14,
			cha: 16,
			savingThrows: ['Wis +4'],
			skills: ['Deception +5', 'Insight +4', 'Persuasion +5'],
			traits: [
				{
					name: 'Position of Privilege',
					desc: 'Thanks to their noble birth, people are inclined to think well of them. They are welcome in high society, and commoners make every effort to accommodate them.'
				}
			],
			getActions: (sb) => [
				{
					name: 'Rapier',
					desc: `Melee Weapon Attack: ${atk(sb.dex)} to hit, reach 5 ft., one target. Hit: ${dmg(1, 8, sb.dex)} piercing damage.`
				}
			],
			alignment: 'any',
			type: 'humanoid'
		},
		criminal: {
			cr: '1/2',
			xp: 100,
			ac: 12,
			acNote: 'leather armor',
			hitDice: 5,
			hitSides: 8,
			str: 11,
			dex: 15,
			con: 11,
			int: 12,
			wis: 10,
			cha: 10,
			savingThrows: ['Dex +4', 'Int +3'],
			skills: ['Deception +4', 'Stealth +4'],
			traits: [
				{
					name: 'Sneak Attack (1/Turn)',
					desc: "The criminal deals an extra 7 (2d6) damage when it hits a target with a weapon attack and has advantage on the roll, or when the target is within 5 feet of an ally that isn't incapacitated and the criminal doesn't have disadvantage."
				}
			],
			getActions: (sb) => [
				{
					name: 'Shortsword',
					desc: `Melee Weapon Attack: ${atk(sb.dex)} to hit, reach 5 ft., one target. Hit: ${dmg(1, 6, sb.dex)} piercing damage.`
				},
				{
					name: 'Light Crossbow',
					desc: `Ranged Weapon Attack: ${atk(sb.dex)} to hit, range 80/320 ft., one target. Hit: ${dmg(1, 8, sb.dex)} piercing damage.`
				}
			],
			alignment: 'any non-good',
			type: 'humanoid'
		},
		adventurer: {
			cr: '1',
			xp: 200,
			ac: 12,
			acNote: 'leather armor',
			hitDice: 6,
			hitSides: 10,
			str: 14,
			dex: 13,
			con: 12,
			int: 11,
			wis: 12,
			cha: 10,
			savingThrows: ['Str +4', 'Con +3'],
			skills: ['Athletics +4', 'Perception +3', 'Survival +3'],
			traits: [
				{
					name: "Veteran's Grit",
					desc: "When the adventurer is reduced to 0 hit points but not killed outright, they can drop to 1 hit point instead. They can't use this feature again until they finish a long rest."
				}
			],
			getActions: (sb) => [
				{ name: 'Multiattack', desc: 'The adventurer makes two weapon attacks.' },
				{
					name: 'Longsword',
					desc: `Melee Weapon Attack: ${atk(sb.str)} to hit, reach 5 ft., one target. Hit: ${dmg(1, 8, sb.str)} slashing damage, or ${dmg(1, 10, sb.str)} slashing damage when wielded with two hands.`
				},
				{
					name: 'Shortbow',
					desc: `Ranged Weapon Attack: ${atk(sb.dex)} to hit, range 80/320 ft., one target. Hit: ${dmg(1, 6, sb.dex)} piercing damage.`
				}
			],
			alignment: 'any',
			type: 'humanoid'
		},
		sage: {
			cr: '1/4',
			xp: 50,
			ac: 10,
			acNote: '',
			hitDice: 3,
			hitSides: 8,
			str: 8,
			dex: 11,
			con: 11,
			int: 16,
			wis: 14,
			cha: 11,
			savingThrows: ['Int +5', 'Wis +4'],
			skills: ['Arcana +5', 'History +5', 'Nature +5'],
			traits: [
				{
					name: 'Researcher',
					desc: 'When the sage fails to recall a piece of lore, they know where to find it. Information available in libraries or from contacts can be acquired within 1d4 days.'
				},
				{
					name: 'Spellcasting',
					desc: 'The sage is a 3rd-level spellcaster (save DC 13, +5 to hit). Cantrips: fire bolt, light, mage hand. 1st level (4 slots): detect magic, identify, magic missile, shield. 2nd level (2 slots): detect thoughts, suggestion.'
				}
			],
			getActions: (sb) => [
				{
					name: 'Quarterstaff',
					desc: `Melee Weapon Attack: ${atk(sb.str)} to hit, reach 5 ft., one target. Hit: ${dmg(1, 6, sb.str)} bludgeoning damage, or ${dmg(1, 8, sb.str)} bludgeoning damage with two hands.`
				},
				{
					name: 'Fire Bolt (Cantrip)',
					desc: 'Ranged Spell Attack: +5 to hit, range 120 ft., one target. Hit: 5 (1d10) fire damage.'
				}
			],
			alignment: 'any',
			type: 'humanoid'
		},
		clergy: {
			cr: '1/2',
			xp: 100,
			ac: 13,
			acNote: 'chain shirt',
			hitDice: 4,
			hitSides: 8,
			str: 10,
			dex: 10,
			con: 12,
			int: 11,
			wis: 16,
			cha: 13,
			savingThrows: ['Wis +5', 'Cha +3'],
			skills: ['Medicine +5', 'Religion +2'],
			traits: [
				{
					name: 'Divine Eminence',
					desc: 'As a bonus action, the clergy member can expend a spell slot to cause their melee weapon attacks to deal an extra 10 (3d6) radiant damage until the end of the turn. Spell slots: 1st ×4, 2nd ×2, 3rd ×1.'
				},
				{
					name: 'Spellcasting',
					desc: 'The clergy member is a 4th-level spellcaster (save DC 13, +5 to hit). Cantrips: light, sacred flame, thaumaturgy. 1st level (4 slots): cure wounds, guiding bolt, sanctuary. 2nd level (2 slots): lesser restoration, spiritual weapon.'
				}
			],
			getActions: (sb) => [
				{
					name: 'Mace',
					desc: `Melee Weapon Attack: ${atk(sb.str)} to hit, reach 5 ft., one target. Hit: ${dmg(1, 6, sb.str)} bludgeoning damage.`
				},
				{
					name: 'Sacred Flame (Cantrip)',
					desc: 'The target must succeed on a DC 13 Dexterity saving throw or take 4 (1d8) radiant damage. The target gains no benefit from cover for this save.'
				}
			],
			alignment: 'any good',
			type: 'humanoid'
		},
		soldier: {
			cr: '1/2',
			xp: 100,
			ac: 14,
			acNote: 'ring mail',
			hitDice: 4,
			hitSides: 10,
			str: 15,
			dex: 12,
			con: 14,
			int: 10,
			wis: 11,
			cha: 10,
			savingThrows: ['Str +4', 'Con +4'],
			skills: ['Athletics +4', 'Intimidation +2', 'Perception +2'],
			traits: [
				{
					name: 'Martial Discipline',
					desc: 'The soldier has advantage on saving throws against being frightened. When the soldier reduces a creature to 0 hit points, they can make one additional weapon attack as a bonus action.'
				}
			],
			getActions: (sb) => [
				{ name: 'Multiattack', desc: 'The soldier makes two melee attacks.' },
				{
					name: 'Longsword',
					desc: `Melee Weapon Attack: ${atk(sb.str)} to hit, reach 5 ft., one target. Hit: ${dmg(1, 8, sb.str)} slashing damage.`
				},
				{
					name: 'Javelin',
					desc: `Melee or Ranged Weapon Attack: ${atk(sb.str)} to hit, reach 5 ft. or range 30/120 ft., one target. Hit: ${dmg(1, 6, sb.str)} piercing damage.`
				}
			],
			alignment: 'any lawful',
			type: 'humanoid'
		}
	};

	// ── Generator ─────────────────────────────────────────────────────────────────
	function generateNpc(): NpcData {
		const roleHash = role.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
		const rng = mkRng(seed ^ roleHash);

		const profile = PROFILES[role];
		const isMale = gender === 'any' ? rng() < 0.5 : gender === 'male';
		const name = `${pick(isMale ? FM : FF, rng)} ${pick(LAST, rng)}`;

		const str = vary(profile.str, rng);
		const dex = vary(profile.dex, rng);
		const con = vary(profile.con, rng);
		const int = vary(profile.int, rng);
		const wis = vary(profile.wis, rng);
		const cha = vary(profile.cha, rng);

		const conMod = Math.floor((con - 10) / 2);
		let hp = 0;
		for (let i = 0; i < profile.hitDice; i++) hp += Math.floor(rng() * profile.hitSides) + 1;
		hp = Math.max(1, hp + conMod * profile.hitDice);

		const conBonus = conMod * profile.hitDice;
		const hpDice = `${profile.hitDice}d${profile.hitSides}${conBonus > 0 ? ` + ${conBonus}` : conBonus < 0 ? ` - ${Math.abs(conBonus)}` : ''}`;

		const baseStats: BaseStats = { str, dex, con, int, wis, cha };

		const stats: StatBlock = {
			cr: profile.cr,
			xp: profile.xp,
			ac: profile.ac,
			acNote: profile.acNote,
			hp,
			hpDice,
			speed: 30,
			...baseStats,
			savingThrows: profile.savingThrows,
			skills: profile.skills,
			traits: profile.traits,
			actions: profile.getActions(baseStats),
			alignment: profile.alignment,
			type: profile.type
		};

		return {
			name,
			race: pick(RACES, rng),
			gender: isMale ? 'Male' : 'Female',
			ageDesc: pick(AGES, rng),
			role: ROLE_LABELS[role],
			build: pick(BUILDS, rng),
			feature: pick(FEATURES, rng),
			clothing: pick(CLOTHING[role], rng),
			trait: pick(TRAITS[role], rng),
			flaw: pick(FLAWS, rng),
			voice: pick(VOICES, rng),
			motivation: pick(MOTIVATIONS[role], rng),
			secret: pick(SECRETS[role], rng),
			plotHook: pick(HOOKS[role], rng),
			stats
		};
	}

	$effect(() => {
		role;
		gender;
		seed;
		npcData = generateNpc();
	});

	// ── UI helpers ────────────────────────────────────────────────────────────────
	const DISPOSITION_LABEL: Record<Disposition, string> = {
		friendly: 'Friendly',
		neutral: 'Neutral',
		suspicious: 'Suspicious',
		hostile: 'Hostile'
	};
	const DISPOSITION_COLOR: Record<Disposition, string> = {
		friendly: 'bg-green-900 text-green-300 border-green-800',
		neutral: 'bg-gray-800 text-gray-300 border-gray-700',
		suspicious: 'bg-yellow-900 text-yellow-300 border-yellow-800',
		hostile: 'bg-red-900 text-red-300 border-red-800'
	};
	const ABILITY_LABELS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;

	// ── Save / load ───────────────────────────────────────────────────────────────
	interface SavedNpc {
		id: string;
		name: string;
		role: Role;
		gender: Gender;
		disposition: Disposition;
		seed: number;
		savedAt: number;
	}
	const NPCS_KEY = 'initiative_saved_npcs';
	let savedNpcs = $state<SavedNpc[]>([]);
	if (typeof window !== 'undefined') {
		try {
			savedNpcs = JSON.parse(localStorage.getItem(NPCS_KEY) ?? '[]');
		} catch {
			savedNpcs = [];
		}
	}
	function saveNpc() {
		if (!npcData) return;
		const entry: SavedNpc = {
			id: crypto.randomUUID(),
			name: npcData.name,
			role,
			gender,
			disposition,
			seed,
			savedAt: Date.now()
		};
		savedNpcs = [entry, ...savedNpcs].slice(0, 20);
		localStorage.setItem(NPCS_KEY, JSON.stringify(savedNpcs));
	}
	function loadNpc(s: SavedNpc) {
		role = s.role;
		gender = s.gender;
		disposition = s.disposition;
		seed = s.seed;
	}
	function deleteSavedNpc(id: string) {
		savedNpcs = savedNpcs.filter((s) => s.id !== id);
		localStorage.setItem(NPCS_KEY, JSON.stringify(savedNpcs));
	}
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
				<h2 class="text-lg font-bold tracking-wide text-amber-300">NPC Generator</h2>
				{#if npcData}
					<span class="text-xs text-gray-500">{npcData.name}</span>
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
			class="hidden w-52 shrink-0 flex-col gap-5 overflow-y-auto border-r border-gray-800 bg-gray-900/60 p-4 sm:flex"
		>
			<!-- Role -->
			<div class="flex flex-col gap-1.5">
				<label for="npc-role" class="text-xs font-semibold tracking-wider text-gray-500 uppercase"
					>Role</label
				>
				<select
					id="npc-role"
					bind:value={role}
					class="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-200 focus:border-amber-600 focus:outline-none"
				>
					{#each Object.entries(ROLE_LABELS) as [id, label]}
						<option value={id}>{label}</option>
					{/each}
				</select>
			</div>

			<!-- Gender -->
			<div class="flex flex-col gap-1.5">
				<label for="npc-gender" class="text-xs font-semibold tracking-wider text-gray-500 uppercase"
					>Gender</label
				>
				<select
					id="npc-gender"
					bind:value={gender}
					class="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-200 focus:border-amber-600 focus:outline-none"
				>
					<option value="any">Any</option>
					<option value="male">Male</option>
					<option value="female">Female</option>
				</select>
			</div>

			<!-- Disposition -->
			<div class="flex flex-col gap-1.5">
				<label
					for="npc-disposition"
					class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Disposition</label
				>
				<select
					id="npc-disposition"
					bind:value={disposition}
					class="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-200 focus:border-amber-600 focus:outline-none"
				>
					{#each Object.entries(DISPOSITION_LABEL) as [id, label]}
						<option value={id}>{label}</option>
					{/each}
				</select>
			</div>

			<!-- Seed -->
			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Seed</label>
				<input
					type="number"
					bind:value={seed}
					class="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-200 focus:border-amber-600 focus:outline-none"
				/>
				<button
					onclick={() => (seed = Math.floor(Math.random() * 1_000_000_000))}
					class="mt-1 w-full rounded bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-600"
				>
					Regenerate
				</button>
			</div>

			{#if npcData}
				<div class="flex gap-1.5">
					<button
						onclick={saveNpc}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						Save NPC
					</button>
					<button
						onclick={() =>
							exportNpcPdf({
								...npcData!,
								disposition: DISPOSITION_LABEL[disposition]
							})}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-2 text-sm font-semibold text-gray-300 transition hover:border-red-600 hover:text-red-400"
						title="Export to PDF"
					>
						Export PDF
					</button>
				</div>
			{/if}

			{#if savedNpcs.length}
				<div class="flex flex-col gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
						>Saved NPCs</span
					>
					<div class="flex max-h-52 flex-col gap-1 overflow-y-auto">
						{#each savedNpcs as s (s.id)}
							<div class="flex items-center gap-1 rounded bg-gray-800/80 px-2 py-1.5">
								<button
									onclick={() => loadNpc(s)}
									class="min-w-0 flex-1 truncate text-left text-xs text-gray-200 hover:text-amber-400"
									title={s.name}>{s.name}</button
								>
								<button
									onclick={() => deleteSavedNpc(s.id)}
									class="shrink-0 text-[11px] leading-none text-gray-600 hover:text-red-400"
									aria-label="Delete">✕</button
								>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Right panel: NPC output -->
		<div class="flex-1 overflow-y-auto p-4 md:p-6">
			{#if npcData}
				<!-- NPC header -->
				<div class="mb-5 flex flex-wrap items-start justify-between gap-3">
					<div>
						<h3 class="text-2xl font-bold text-gray-100">{npcData.name}</h3>
						<p class="mt-0.5 text-sm text-gray-400">
							{npcData.gender}
							{npcData.race} · {npcData.role} · {npcData.ageDesc}
						</p>
					</div>
					<span
						class="rounded border px-2.5 py-1 text-xs font-semibold {DISPOSITION_COLOR[
							disposition
						]}"
					>
						{DISPOSITION_LABEL[disposition]}
					</span>
				</div>

				<!-- Two-column layout -->
				<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
					<!-- Left column: flavor -->
					<div class="flex flex-col gap-4">
						<!-- Appearance -->
						<div class="rounded-lg border border-gray-800 bg-gray-900/70 p-4">
							<h4 class="mb-2.5 text-xs font-semibold tracking-wider text-gray-500 uppercase">
								Appearance
							</h4>
							<ul class="space-y-1.5 text-sm text-gray-300">
								<li>
									<span class="text-gray-500">Build:</span>
									{npcData.build}.
								</li>
								<li>
									<span class="text-gray-500">Feature:</span>
									{npcData.feature.charAt(0).toUpperCase() + npcData.feature.slice(1)}.
								</li>
								<li>
									<span class="text-gray-500">Clothing:</span>
									{npcData.clothing.charAt(0).toUpperCase() + npcData.clothing.slice(1)}.
								</li>
							</ul>
						</div>

						<!-- Personality -->
						<div class="rounded-lg border border-gray-800 bg-gray-900/70 p-4">
							<h4 class="mb-2.5 text-xs font-semibold tracking-wider text-gray-500 uppercase">
								Personality
							</h4>
							<div class="space-y-2 text-sm">
								<p class="leading-relaxed text-gray-300">
									<span class="text-gray-500">Trait:</span>
									{npcData.trait}
								</p>
								<p class="leading-relaxed text-gray-300">
									<span class="text-gray-500">Flaw:</span>
									{npcData.flaw}
								</p>
								<p class="leading-relaxed text-gray-300">
									<span class="text-gray-500">Voice:</span>
									{npcData.voice}
								</p>
							</div>
						</div>

						<!-- Drive & secret -->
						<div class="rounded-lg border border-gray-800 bg-gray-900/70 p-4">
							<h4 class="mb-2.5 text-xs font-semibold tracking-wider text-gray-500 uppercase">
								Drive & Secret
							</h4>
							<div class="space-y-2 text-sm">
								<p class="leading-relaxed text-gray-300">
									<span class="text-gray-500">Wants:</span>
									{npcData.motivation}
								</p>
								<p class="leading-relaxed text-gray-300">
									<span class="text-gray-500">Hides:</span>
									{npcData.secret}
								</p>
							</div>
						</div>

						<!-- Plot hook -->
						<div class="rounded-lg border border-amber-900/40 bg-amber-950/20 p-4">
							<h4 class="mb-2 text-xs font-semibold tracking-wider text-amber-600 uppercase">
								Plot Hook
							</h4>
							<p class="text-sm leading-relaxed text-gray-300">{npcData.plotHook}</p>
						</div>
					</div>

					<!-- Right column: stat block -->
					<div>
						<div class="rounded-lg border border-amber-900/50 bg-stone-950 p-5">
							<!-- Name & type line -->
							<h3 class="text-xl font-bold text-amber-200">{npcData.name}</h3>
							<p class="text-sm text-amber-700/80 italic">
								Medium {npcData.stats.type} ({npcData.race.toLowerCase()}), {npcData.stats
									.alignment}
							</p>

							<div class="my-3 h-0.5 bg-amber-900/60"></div>

							<!-- AC / HP / Speed -->
							<div class="space-y-0.5 text-sm">
								<p>
									<span class="font-bold text-gray-100">Armor Class</span>
									<span class="text-gray-300"
										>{npcData.stats.ac}{npcData.stats.acNote
											? ` (${npcData.stats.acNote})`
											: ''}</span
									>
								</p>
								<p>
									<span class="font-bold text-gray-100">Hit Points</span>
									<span class="text-gray-300">{npcData.stats.hp} ({npcData.stats.hpDice})</span>
								</p>
								<p>
									<span class="font-bold text-gray-100">Speed</span>
									<span class="text-gray-300">{npcData.stats.speed} ft.</span>
								</p>
							</div>

							<div class="my-3 h-0.5 bg-amber-900/60"></div>

							<!-- Ability scores -->
							<div class="grid grid-cols-6 gap-1 text-center text-sm">
								{#each ABILITY_LABELS as label, i}
									{@const score = [
										npcData.stats.str,
										npcData.stats.dex,
										npcData.stats.con,
										npcData.stats.int,
										npcData.stats.wis,
										npcData.stats.cha
									][i]}
									<div class="flex flex-col">
										<span class="text-xs font-bold text-amber-500">{label}</span>
										<span class="font-semibold text-gray-100">{score}</span>
										<span class="text-xs text-gray-400">({mod(score)})</span>
									</div>
								{/each}
							</div>

							<div class="my-3 h-0.5 bg-amber-900/60"></div>

							<!-- Saving throws / skills / CR -->
							<div class="space-y-0.5 text-sm">
								{#if npcData.stats.savingThrows.length}
									<p>
										<span class="font-bold text-gray-100">Saving Throws</span>
										<span class="text-gray-300">{npcData.stats.savingThrows.join(', ')}</span>
									</p>
								{/if}
								{#if npcData.stats.skills.length}
									<p>
										<span class="font-bold text-gray-100">Skills</span>
										<span class="text-gray-300">{npcData.stats.skills.join(', ')}</span>
									</p>
								{/if}
								<p>
									<span class="font-bold text-gray-100">Challenge</span>
									<span class="text-gray-300">{npcData.stats.cr} ({npcData.stats.xp} XP)</span>
								</p>
								<p>
									<span class="font-bold text-gray-100">Proficiency Bonus</span>
									<span class="text-gray-300">+2</span>
								</p>
							</div>

							{#if npcData.stats.traits.length}
								<div class="my-3 h-0.5 bg-amber-900/60"></div>
								<div class="space-y-2.5">
									{#each npcData.stats.traits as trait}
										<p class="text-sm leading-relaxed text-gray-300">
											<span class="font-bold text-gray-100 italic">{trait.name}.</span>
											{trait.desc}
										</p>
									{/each}
								</div>
							{/if}

							<div class="my-3 h-0.5 bg-amber-900/60"></div>

							<!-- Actions -->
							<h4 class="mb-2 text-base font-bold tracking-wide text-amber-400">Actions</h4>
							<div class="space-y-2.5">
								{#each npcData.stats.actions as action}
									<p class="text-sm leading-relaxed text-gray-300">
										<span class="font-bold text-gray-100 italic">{action.name}.</span>
										{action.desc}
									</p>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<!-- Mobile regenerate button -->
				<div class="mt-5 flex justify-center sm:hidden">
					<button
						onclick={() => (seed = Math.floor(Math.random() * 1_000_000_000))}
						class="rounded bg-amber-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
					>
						Regenerate
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
