<!-- Wizard's Tower Generator -->
<script lang="ts">
	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	// ── Types ─────────────────────────────────────────────────────────────────────
	type School =
		| 'abjuration'
		| 'conjuration'
		| 'divination'
		| 'enchantment'
		| 'evocation'
		| 'illusion'
		| 'necromancy'
		| 'transmutation';

	interface Apprentice {
		name: string;
		race: string;
		tier: string;
		description: string;
		activity: string;
		disposition: 'helpful' | 'nervous' | 'hostile' | 'oblivious' | 'frightened';
	}
	interface Experiment {
		name: string;
		description: string;
		status: string;
		danger: 'none' | 'low' | 'moderate' | 'high';
	}
	interface TowerFloor {
		number: number;
		label: string;
		description: string;
		anomaly: string | null;
		apprentice: Apprentice | null;
		experiment: Experiment | null;
	}
	interface WizardStatus {
		present: boolean;
		label: string;
		detail: string;
	}
	interface TowerData {
		name: string;
		exterior: string;
		wizard: { name: string; race: string; school: School };
		wizardStatus: WizardStatus;
		floors: TowerFloor[];
	}

	// ── Controls ──────────────────────────────────────────────────────────────────
	let partySize = $state(4);
	let partyLevel = $state(1);
	let numFloors = $state(4);
	let seed = $state(Math.floor(Math.random() * 1_000_000_000));
	let towerData = $state<TowerData | null>(null);

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
	const SCHOOLS: School[] = [
		'abjuration',
		'conjuration',
		'divination',
		'enchantment',
		'evocation',
		'illusion',
		'necromancy',
		'transmutation'
	];
	const SCHOOL_COLORS: Record<School, string> = {
		abjuration: 'bg-blue-900/60 text-blue-300',
		conjuration: 'bg-purple-900/60 text-purple-300',
		divination: 'bg-cyan-900/60 text-cyan-300',
		enchantment: 'bg-pink-900/60 text-pink-300',
		evocation: 'bg-orange-900/60 text-orange-300',
		illusion: 'bg-violet-900/60 text-violet-300',
		necromancy: 'bg-green-900/60 text-green-300',
		transmutation: 'bg-amber-900/60 text-amber-300'
	};

	const WIZARD_RACES = [
		'Human',
		'High Elf',
		'Wood Elf',
		'Half-Elf',
		'Gnome',
		'Tiefling',
		'Dragonborn',
		'Half-Orc',
		'Dwarf'
	];
	const WIZARD_NAMES_M = [
		'Aldric',
		'Borvyn',
		'Caelthas',
		'Dorvash',
		'Elyndor',
		'Farenk',
		'Gorlan',
		'Halveth',
		'Irenthas',
		'Jarvik',
		'Kaelthorn',
		'Lendric',
		'Mordain',
		'Narveth',
		'Orenthal',
		'Pelindor',
		'Quelveth',
		'Ryken',
		'Sylvrak',
		'Theron',
		'Uventhas',
		'Valdric',
		'Wrendar',
		'Xelvorn',
		'Zorven'
	];
	const WIZARD_NAMES_F = [
		'Aelindra',
		'Brynn',
		'Caelith',
		'Delvara',
		'Eryndel',
		'Fysha',
		'Grevyn',
		'Halvara',
		'Ireth',
		'Jalindra',
		'Kelvara',
		'Lirath',
		'Morryn',
		'Nelvara',
		'Orveth',
		'Pelindra',
		'Queth',
		'Ryvara',
		'Sylindra',
		'Thessa',
		'Ulvara',
		'Vendra',
		'Wythara',
		'Zelveth'
	];
	const TOWER_EPITHETS = [
		'of the Arcane Flame',
		'of the Seventh Seal',
		'of Whispered Knowledge',
		'of the Pale Moon',
		'of the Shattered Star',
		'of the Gilded Eye',
		'of Eternal Study',
		'of the Broken Circle',
		'of the Grey Vigil',
		'of Many Doors',
		'of the Amber Hour',
		'of the Iron Theorem',
		'of the Watchful Dark',
		'of the Last Equation',
		'of the Speaking Stones'
	];

	const EXTERIOR_DESCRIPTIONS = [
		'A crooked spire of smoke-grey stone, every window sealed with iron shutters. Faint light bleeds through the cracks.',
		'A slender tower of pale alabaster that catches the light oddly — it seems to glow even on overcast days.',
		'Black basalt streaked with veins of something luminescent and blue. The mortar between the stones shifts when not looked at directly.',
		'An overgrown ruin from the outside — but the vines are motionless regardless of wind, and they part around the door like a curtain.',
		'Five mismatched sections of different stone stacked atop each other, as though built in stages by different hands over centuries.',
		'A tower of red sandstone with arcane glyphs carved into every exterior surface. Some have been recently chiselled out.',
		"The upper third of the tower is wreathed in a permanent low cloud. Weather that should affect it simply doesn't.",
		'Constructed from enormous blocks of pale green stone shot through with copper wire. It hums faintly at a frequency felt in the teeth.',
		'The tower leans at an impossible angle — roughly 15 degrees past vertical — yet shows no sign of distress.',
		"Surrounded by a ring of scorched earth and standing stones. Animals avoid the area. Birds won't land on it.",
		'Carved into a cliff face rather than freestanding, with the upper floors protruding outward on stone buttresses.',
		'A perfectly cylindrical tower with no visible door seams — the entrance only becomes apparent at dusk.',
		'Covered in copper sheathing, now verdigris-green. Lightning rods bristle from every parapet.',
		"The tower's shadow always points north, regardless of the sun's position."
	];

	const FLOOR_TYPES: { label: string; descriptions: string[] }[] = [
		{
			label: 'Entry Hall',
			descriptions: [
				'A vaulted foyer dominated by a floor mosaic of the celestial sphere. The door locks itself behind visitors. A disembodied voice asks — once — to state your business.',
				'A narrow receiving room lined with portrait paintings whose eyes track movement. A lectern holds a guestbook that writes entries on its own.',
				'A circular antechamber with four exits, each leading in a different cardinal direction. Three are false walls. The correct one changes monthly.'
			]
		},
		{
			label: 'Laboratory',
			descriptions: [
				'Long tables crowded with glassware, copper tubing, and burbling alchemical apparatus. Dozens of experiments run unattended. Half smell of sulfur; half smell of nothing at all.',
				'A two-level workspace with an iron catwalk. The upper level holds volatile components in sealed glass. The lower level is scorched in several places.',
				'A pristine laboratory kept at a precise cool temperature. Everything is labelled in a precise, tiny hand. Nothing appears to have been touched in weeks.'
			]
		},
		{
			label: 'Library',
			descriptions: [
				'Floor-to-ceiling shelves that extend beyond what the exterior dimensions should allow. A rolling ladder provides access. Books occasionally rearrange themselves.',
				'A circular reading room with a skylight that shows the current night sky regardless of weather or time. Soft magelight adjusts automatically as you read.',
				'A cramped scriptorium with three writing desks and a copying apparatus that can duplicate text mechanically. Stacks of partially finished manuscripts everywhere.'
			]
		},
		{
			label: 'Summoning Chamber',
			descriptions: [
				'A bare stone floor dominated by a permanent binding circle inlaid in silver and cold iron. Something burned through the eastern section of the circle at some point.',
				'Circular walls covered in containment glyphs from floor to ceiling. Four iron posts mark the corners of a rectangular summoning area. Scratch marks on the inside of the posts.',
				'A chamber kept scrupulously clean except for the chalk residue of recent circles. The air smells of ozone and something organic.'
			]
		},
		{
			label: 'Observatory',
			descriptions: [
				'A domed ceiling opens to the sky via a brass mechanism. Star charts cover every horizontal surface. A brass orrery in the center tracks twelve celestial bodies.',
				'The ceiling is a perfect illusion of the night sky, updated in real time. A large telescope points at one particular section of sky and cannot be moved.',
				"Walls lined with star maps and navigational instruments of unfamiliar design. A log of nightly observations sits open at yesterday's date, written in the wizard's hand."
			]
		},
		{
			label: 'Golem Workshop',
			descriptions: [
				'Half-finished constructs hang from ceiling hooks. The floor is scattered with arcane manuals, iron filings, and animating ink. One golem in the corner twitches at irregular intervals.',
				"A forge-adjacent workshop with a permanently lit arcane furnace. Copper and stone components sorted into bins. A workbench holds a golem's head mid-construction, jaw wired open.",
				'A clean room with one completed guardian golem standing motionless in the center. Its eyes track movement. A command word is scratched into the wall near the door.'
			]
		},
		{
			label: 'Familiar Menagerie',
			descriptions: [
				'Cages, perches, terrariums, and tanks lining every wall. Several creatures are unfamiliar. The food and water dispensers are magically maintained — nothing has starved.',
				'A warm, slightly humid room where a dozen creatures of various sizes move freely. They study visitors with unsettling intelligence. The door cannot be opened until every creature is accounted for.',
				'A single large room containing what appears to be a small outdoor environment — grass, a pool, a dead tree — under a permanent daylight spell.'
			]
		},
		{
			label: 'Alchemical Distillery',
			descriptions: [
				'A complex of glass coils, heated chambers, and collection vessels taking up most of the floor. The output drips into labeled bottles at a rate of one every few hours.',
				'An automated distillery running without supervision. Twelve processes are ongoing simultaneously, tracked by a self-updating brass clock mechanism on the far wall.',
				'Mostly inactive — the main apparatus has been carefully shut down and covered. A single small reaction continues in a corner. The smell of accelerant lingers.'
			]
		},
		{
			label: 'Sealed Vault',
			descriptions: [
				'A reinforced chamber behind three successive locked doors, each requiring a different key. The innermost room is temperature-controlled and contains artifact-grade items in stasis fields.',
				'A room warded against divination, teleportation, and fire. The single door opens only from the inside once locked — a design choice that implies the previous occupant expected to leave a different way.',
				'A vault of modest size whose walls are thick with layered abjuration enchantments. Several shelves are empty. The most secure shelf still holds one item, wrapped in oilcloth.'
			]
		},
		{
			label: 'Scrying Room',
			descriptions: [
				'A dark, octagonal room with a large mirror on each wall. The central basin is filled with still water. Observation logs are stacked by date — the most recent is three days old.',
				'A sparse chamber containing a single perfectly circular pool of silver liquid. Ripples cross it at irregular intervals. A velvet curtain covers the single window.',
				'Multiple overlapping scrying circles, each tuned to a different subject. Seven small mirrors each show a different location, continuously. Three are covered.'
			]
		},
		{
			label: 'Runic Forge',
			descriptions: [
				'A forge burning with blue-white magefire surrounded by engraving benches. Partially runed weapons and armor hang on racks. A quench tank contains a liquid that is not water.',
				'A precise workshop for enchanting objects. Each bench is isolated from the others by copper grounding strips. The tools are laid out with surgical precision.',
				'The forge is cold but recently used — the coals are still warm. A finished item sits in the center of the engraving table, apparently awaiting delivery.'
			]
		},
		{
			label: 'Elemental Containment',
			descriptions: [
				"A circular chamber with four reinforced alcoves at cardinal points, each holding a bound elemental. They are calm — for now. Iron shackles are sized for things much larger than what's currently bound.",
				'A room designed for elemental experimentation. One alcove has been recently emptied; its bindings are still warm. A log of experiments tracks reaction times.',
				'A pressurized chamber accessible through an airlock door. The air inside smells of mineral and electricity. Something moves in the pipes.'
			]
		},
		{
			label: 'Apprentice Dormitory',
			descriptions: [
				'Bunk beds for six, most currently unmade. Personal effects scattered about. A duty roster on the wall shows assigned tasks by name. Several names are crossed out.',
				'Simple quarters — clean, organized, personality suppressed. Identical trunks at the foot of each bed are locked. A shared study table holds a single lamp and a stack of practice texts.',
				'The dormitory of a single apprentice, not multiple. Either the others left or were never here. The occupant has made the space their own with personal items and a small shrine.'
			]
		},
		{
			label: 'Mind Laboratory',
			descriptions: [
				'A reclining chair in the center of the room surrounded by delicate sensory apparatus. The walls are covered in charts mapping mental archetypes, emotional resonance patterns, and memory structures.',
				'Two chairs face each other across a low table. Restraint straps on both chairs. A glass case holds vials labelled with names rather than compounds.',
				"A softly lit room that feels immediately calming upon entry. Overly so. Several subjects' experience logs are filed alphabetically on a shelf."
			]
		},
		{
			label: 'Trophy Room',
			descriptions: [
				"Mounted specimens of creatures both mundane and magical. Display cases hold defeated foes' equipment, cleaned and labelled with dates and locations.",
				"Less a display than an evidence room — each item is tagged with notes on its acquisition. The wizard's notes are analytical, not triumphant.",
				"A room that reveals the wizard's previous career as an adventurer. The trophies are old. Dust has gathered on several cases. The largest display case is empty and clean."
			]
		},
		{
			label: 'Personal Quarters',
			descriptions: [
				'Surprisingly austere. A bed, a desk, and more bookshelves. The only personal touch is a small portrait on the desk, turned face-down.',
				'Comfortable without being lavish. A reading nook dominates one corner. The wardrobe holds robes of several styles, including mundane travel clothes.',
				'The most lived-in room in the tower — clearly where the wizard actually spends time. A cold dinner sits on the desk, a book open beside it.'
			]
		}
	];

	const ANOMALIES = [
		'Gravity reverses within 5 feet of the north wall. Loose objects drift to the ceiling.',
		'All flames in the room burn a steady, cold blue regardless of fuel source.',
		'Shadows move independently of their casters with a delay of several seconds.',
		'Sound echoes back with a 6-second delay. Conversations overlap themselves.',
		'The temperature is exactly 10 degrees colder than it should be, regardless of heat sources.',
		'Time passes 10% faster in this room. Clocks run measurably ahead.',
		"Any lie spoken aloud causes a sharp metallic taste in the speaker's mouth.",
		'The ceiling shows a different sky than the exterior — a different time of day, or a different season.',
		'Small metal objects drift to the center of the room and orbit slowly at knee height.',
		'Every mirror and reflective surface shows a reflection that is 5 seconds behind.',
		'A persistent whisper in an unknown language emanates from the western wall, repeating on a 40-second cycle.',
		'Doors in this room open to different locations each time. The original destination returns after 10 minutes.',
		'Written text in this room rearranges itself when unobserved. The meaning remains the same.',
		'The floor is warm to the touch despite no heat source below.',
		'Animals refuse to enter this room. Familiars become visibly agitated at the threshold.',
		'Colors appear desaturated in this room — everything trends toward grey.',
		'Spells cast here leave visible trails of light that persist for several rounds.',
		'The room appears larger from inside than outside by a factor of roughly two.',
		'A thin layer of frost on the windows, even in summer. The glass cannot be broken from outside.',
		'Concentration checks in this room have advantage, but the reason is unclear and slightly unsettling.'
	];

	const EXPERIMENTS: {
		name: string;
		description: string;
		status: string;
		danger: 'none' | 'low' | 'moderate' | 'high';
	}[] = [
		{
			name: 'Stalled Transmutation',
			description:
				'A lead ingot half-converted to gold sits in a containment cradle. The reaction has stalled — the surrounding material is crystallizing in unpredictable directions.',
			status: 'Stable but degenerating. Will collapse within 48 hours.',
			danger: 'low'
		},
		{
			name: 'Bound Homunculus',
			description:
				'A jar the size of a melon contains a small humanoid form suspended in amber liquid. Its eyes track movement. It appears to be mouthing words.',
			status: 'Alive and aware. Bindings intact.',
			danger: 'low'
		},
		{
			name: 'Severed Gate',
			description:
				'A portal frame — two iron posts and a copper arch — stands in the center of the room. The aperture flickers open for exactly 3 seconds every hour. The destination changes each time.',
			status: 'Active. Destination uncontrolled.',
			danger: 'moderate'
		},
		{
			name: 'Headless Golem',
			description:
				'A stone golem body, complete from the neck down, stands at the workbench. The head sits beside it, unattached. The body twitches periodically, reaching for the head.',
			status: 'Inert without head. Approach with caution.',
			danger: 'moderate'
		},
		{
			name: 'Interrupted Scroll',
			description:
				'A spell scroll mid-transcription, the quill still resting on the page. The ink at the tip is still wet. Whatever interrupted the wizard did so very recently.',
			status: 'Incomplete. Do not attempt to cast from it.',
			danger: 'low'
		},
		{
			name: 'Sedated Specimen',
			description:
				'A glass tank of preservation fluid contains a creature of unknown species. It breathes slowly. An attached notebook documents its behavior over 60 days.',
			status: 'Living. Sedated. Sedation wears off in ~4 hours.',
			danger: 'moderate'
		},
		{
			name: 'Broken Salt Circle',
			description:
				'A ritual circle drawn in salt with one section deliberately erased. A weight sits at the break point, preventing accidental closure. The notes suggest this was intentional.',
			status: 'Intentionally incomplete. Do not move the weight.',
			danger: 'high'
		},
		{
			name: 'Crystallizing Cauldron',
			description:
				'A cauldron of violet liquid slowly crystallizing from the bottom up. The crystal structure is spreading about an inch per day and has nearly reached the rim.',
			status: 'Self-terminating unless interrupted. 3 days remaining.',
			danger: 'none'
		},
		{
			name: 'Imprinted Memory Sphere',
			description:
				"A glass sphere on a velvet stand that, when touched, floods the holder with 30 seconds of someone else's memory. The memory is vivid, distressing, and incomplete.",
			status: "Stable. Memory appears to be the wizard's.",
			danger: 'low'
		},
		{
			name: 'Unrestrained Elemental Shard',
			description:
				'A fragment of an elemental plane — a fist-sized piece of solid fire, frozen mid-leap — sits in an iron cradle. It pulses with heat. The binding chains are one link short.',
			status: 'Contained but improperly restrained. Handle carefully.',
			danger: 'high'
		},
		{
			name: 'Cloned Familiar',
			description:
				'Two identical small animals in adjacent cages. They behave identically — same movements, same reactions, 3 seconds apart. One is the original. The other is something else.',
			status: 'Stable. Do not allow them to touch.',
			danger: 'moderate'
		},
		{
			name: 'Self-Replicating Inscription',
			description:
				'An inscription on a brass plate that has slowly spread across the table and is working its way up the wall. The original text is now illegible under the overlay.',
			status: 'Active and spreading. Source text destroyed.',
			danger: 'low'
		},
		{
			name: 'Temporal Knot',
			description:
				'A section of bench where time stutters — objects in a 1-foot radius repeat their last 3 seconds of motion on a loop. A teacup eternally tips over and rights itself.',
			status: 'Stable loop. Do not place living tissue inside.',
			danger: 'moderate'
		},
		{
			name: 'Partially Decoded Cipher',
			description:
				'A wall-sized sheet of vellum covered in symbols. A decoder wheel and partial translation sit at a desk below it. The translation is fascinating and wrong in at least two places.',
			status: 'Ongoing. Translation ~60% complete.',
			danger: 'none'
		},
		{
			name: 'Unhoused Golem Core',
			description:
				'The core gem of a golem removed and placed in a null-magic box, but the lid is not fully closed. The gem pulses with residual animation. The golem body is elsewhere.',
			status: 'Active core, unhoused. Risk of partial animation.',
			danger: 'moderate'
		}
	];

	const APPRENTICE_NAMES = [
		'Tessek',
		'Brynn',
		'Orvyn',
		'Caelith',
		'Fenwick',
		'Lirath',
		'Halvec',
		'Drysa',
		'Quillen',
		'Tarvis',
		'Nelvara',
		'Jorveth',
		'Sylk',
		'Maeven',
		'Renwick',
		'Fysha',
		'Aldec',
		'Thessa',
		'Gorten',
		'Ilvara'
	];
	const APPRENTICE_RACES = [
		'Human',
		'Half-Elf',
		'Gnome',
		'Tiefling',
		'Elf',
		'Halfling',
		'Dwarf',
		'Dragonborn'
	];
	const APPRENTICE_DESCRIPTIONS = [
		"Ink-stained to the elbows, with the distracted look of someone who hasn't slept properly in several days.",
		'Meticulously neat despite the chaos around them, with careful eyes that miss very little.',
		'Young — probably too young — with the over-confident bearing of someone recently promoted.',
		'Wearing several protective amulets. Jumpy at loud noises.',
		"Quiet, efficient, and clearly more capable than their rank suggests. Doesn't volunteer information.",
		'Covered in minor burns, none apparently from the current experiment. Has a nervous habit of checking exits.',
		"Speaks too quickly and too much, as though they've been alone for a while.",
		'Has a small mechanical familiar on their shoulder that watches everything.',
		'Wearing an expression of permanent mild anxiety that has probably become their resting face.',
		'Older than expected for an apprentice, with the demeanor of someone who started over late in life.',
		"Exceptionally organized — everything labelled, everything in its place. Visibly stressed by the party's presence.",
		"Clearly the competent one keeping things running in the wizard's absence."
	];
	const APPRENTICE_ACTIVITIES = [
		'cataloguing potion ingredients against a master list',
		'copying a text that keeps shifting under the quill',
		'feeding several creatures that should not coexist peacefully',
		'monitoring three experiments simultaneously and failing at it',
		'trying to remove a stain from the ceiling with a ten-foot pole',
		'translating a document into three languages at once',
		'attempting to contain a spell that got slightly out of hand',
		'organizing component shelves according to a system only they understand',
		'running calculations on a chalkboard that covers most of one wall',
		'reading a book while a scrying mirror they may not know is active observes them',
		'writing a letter they hide when the party enters',
		'conducting an experiment that has clearly gone differently than planned',
		'sleeping on duty and doing a poor job of pretending they were not',
		'arguing with a construct about a task assignment',
		'performing maintenance on a device the party cannot identify'
	];
	const APPRENTICE_TIERS: Record<number, string> = {
		1: '1st-level acolyte',
		2: '2nd-level acolyte',
		3: '3rd-level student',
		4: '4th-level student',
		5: 'journeyman mage',
		6: 'journeyman mage',
		7: 'senior apprentice',
		8: 'senior apprentice',
		9: 'near-graduate',
		10: 'near-graduate'
	};
	const DISPOSITION_NOTES: Record<string, string> = {
		helpful: 'Willing to answer questions and assist, within limits.',
		nervous: 'Answers questions but checks over their shoulder. Knows something.',
		hostile: 'Will not allow unauthorized access. Will call for help if pressed.',
		oblivious: 'Too absorbed to be immediately suspicious. Easy to redirect.',
		frightened: 'Something happened recently. May share it if pressed carefully.'
	};

	const WIZARD_STATUSES: WizardStatus[] = [
		{
			present: true,
			label: 'Present — Working',
			detail:
				'The wizard is in the tower, absorbed in current research. They are aware of visitors but considers interruption rude. Approach with care.'
		},
		{
			present: true,
			label: 'Present — Hostile',
			detail:
				'The wizard is here and knows you are too. They do not welcome uninvited guests and have already prepared a response.'
		},
		{
			present: true,
			label: 'Present — Distracted',
			detail:
				'The wizard is mid-experiment at a critical juncture. They are technically present but functionally absent for the next 10 to 30 minutes.'
		},
		{
			present: true,
			label: 'Present — Sleeping',
			detail:
				'The wizard is asleep — heavily, possibly magically. Waking them abruptly is likely unwise.'
		},
		{
			present: true,
			label: 'Present — Expecting Company',
			detail:
				'The wizard is here and expects visitors, though perhaps not these ones. They are cautiously welcoming.'
		},
		{
			present: false,
			label: 'Absent — Planned Departure',
			detail:
				'A note on the door indicates a planned absence of 1d6 days. The tower wards are active but set to observe rather than deter.'
		},
		{
			present: false,
			label: 'Absent — Left in Haste',
			detail:
				'Signs of rapid, unplanned departure — a half-eaten meal, an experiment left running. Something interrupted the wizard mid-session.'
		},
		{
			present: false,
			label: 'Absent — Long Gone',
			detail:
				'The wizard has not been in residence for weeks or months. Dust on surfaces. Automated systems still running. No return date indicated.'
		},
		{
			present: false,
			label: 'Absent — Unknown',
			detail:
				'No signs of departure, no note. The wizard was simply here, and then was not. Apprentices, if present, are evasive about it.'
		},
		{
			present: false,
			label: 'Deceased — Experiment Gone Wrong',
			detail:
				'The wizard died in their own laboratory. The body may or may not be visible. Automated systems have continued running regardless.'
		},
		{
			present: false,
			label: 'Transformed',
			detail:
				'The wizard is still here, in a sense. A recent accident or deliberate ritual has left them in an altered state — polymorphed, incorporeal, or otherwise changed.'
		}
	];

	// ── Generation ────────────────────────────────────────────────────────────────
	function generateTower(): TowerData {
		const rng = mkRng(seed);
		const race = pick(WIZARD_RACES, rng);
		const wizardName = pick(rng() < 0.5 ? WIZARD_NAMES_M : WIZARD_NAMES_F, rng);
		const school = pick(SCHOOLS, rng);
		const epithet = pick(TOWER_EPITHETS, rng);
		const exterior = pick(EXTERIOR_DESCRIPTIONS, rng);
		const wizardStatus = pick(WIZARD_STATUSES, rng);
		const name = rng() < 0.5 ? `The Tower ${epithet}` : `${wizardName}'s Tower`;

		const floorTypes = shuffle(FLOOR_TYPES, mkRng(hashSeed('floors', seed)));
		const anomalyPool = shuffle(ANOMALIES, mkRng(hashSeed('anomalies', seed)));
		const experimentPool = shuffle(EXPERIMENTS, mkRng(hashSeed('experiments', seed)));
		const floors: TowerFloor[] = [];

		for (let i = 0; i < numFloors; i++) {
			const frng = mkRng(hashSeed(`floor_${i}`, seed));
			const floorType = floorTypes[i % floorTypes.length];
			const description = pick(floorType.descriptions, frng);
			const anomaly = frng() < 0.55 ? anomalyPool[i % anomalyPool.length] : null;

			const appChance = Math.max(0.15, 0.55 - partyLevel * 0.025);
			let apprentice: Apprentice | null = null;
			if (frng() < appChance) {
				const arng = mkRng(hashSeed(`app_${i}`, seed));
				const dispositions: Apprentice['disposition'][] = [
					'helpful',
					'nervous',
					'hostile',
					'oblivious',
					'frightened'
				];
				const disposition = pick(dispositions, arng);
				apprentice = {
					name: pick(APPRENTICE_NAMES, arng),
					race: pick(APPRENTICE_RACES, arng),
					tier: APPRENTICE_TIERS[Math.min(10, Math.max(1, partyLevel))] ?? 'apprentice',
					description: pick(APPRENTICE_DESCRIPTIONS, arng),
					activity: pick(APPRENTICE_ACTIVITIES, arng),
					disposition
				};
			}

			const experiment = frng() < 0.45 ? experimentPool[i % experimentPool.length] : null;

			floors.push({
				number: i + 1,
				label: floorType.label,
				description,
				anomaly,
				apprentice,
				experiment
			});
		}

		return { name, exterior, wizard: { name: wizardName, race, school }, wizardStatus, floors };
	}

	function randomize() {
		seed = Math.floor(Math.random() * 1_000_000_000);
	}

	// ── Save / Load ───────────────────────────────────────────────────────────────
	interface SavedTower {
		id: string;
		name: string;
		numFloors: number;
		partySize: number;
		partyLevel: number;
		seed: number;
		savedAt: number;
	}
	const TOWERS_KEY = 'initiative_saved_towers';
	let savedTowers = $state<SavedTower[]>([]);
	if (typeof window !== 'undefined') {
		try {
			savedTowers = JSON.parse(localStorage.getItem(TOWERS_KEY) ?? '[]');
		} catch {
			savedTowers = [];
		}
	}
	function saveTower() {
		const entry: SavedTower = {
			id: crypto.randomUUID(),
			name: towerData?.name ?? 'Unknown Tower',
			numFloors,
			partySize,
			partyLevel,
			seed,
			savedAt: Date.now()
		};
		savedTowers = [entry, ...savedTowers].slice(0, 20);
		localStorage.setItem(TOWERS_KEY, JSON.stringify(savedTowers));
	}
	function deleteSavedTower(id: string) {
		savedTowers = savedTowers.filter((t) => t.id !== id);
		localStorage.setItem(TOWERS_KEY, JSON.stringify(savedTowers));
	}
	function applyTower(s: SavedTower) {
		numFloors = s.numFloors;
		partySize = s.partySize;
		partyLevel = s.partyLevel;
		seed = s.seed;
	}

	// ── Color maps ────────────────────────────────────────────────────────────────
	const DANGER_COLORS: Record<string, string> = {
		none: 'bg-gray-700 text-gray-400',
		low: 'bg-blue-900/60 text-blue-300',
		moderate: 'bg-yellow-900/60 text-yellow-300',
		high: 'bg-red-900/60 text-red-300'
	};
	const DISPOSITION_COLORS: Record<string, string> = {
		helpful: 'bg-green-900/60 text-green-300',
		nervous: 'bg-yellow-900/60 text-yellow-300',
		hostile: 'bg-red-900/60 text-red-300',
		oblivious: 'bg-gray-700 text-gray-400',
		frightened: 'bg-orange-900/60 text-orange-300'
	};

	$effect(() => {
		towerData = generateTower();
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
				<h2 class="text-lg font-bold tracking-wide text-amber-300">Wizard's Tower Generator</h2>
				{#if towerData}
					<span class="text-xs text-gray-500">{towerData.name}</span>
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
			<!-- Party Size -->
			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-semibold tracking-wider text-gray-500 uppercase"
					>Party Size</label
				>
				<div class="flex items-center gap-2">
					<button
						onclick={() => (partySize = Math.max(1, partySize - 1))}
						class="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-gray-300 transition hover:bg-gray-600"
						aria-label="Decrease"
					>
						<i class="fa-duotone fa-light fa-minus text-xs" aria-hidden="true"></i>
					</button>
					<span class="min-w-[2rem] text-center text-sm font-bold text-gray-100">{partySize}</span>
					<button
						onclick={() => (partySize = Math.min(8, partySize + 1))}
						class="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-gray-300 transition hover:bg-gray-600"
						aria-label="Increase"
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
						aria-label="Decrease"
					>
						<i class="fa-duotone fa-light fa-minus text-xs" aria-hidden="true"></i>
					</button>
					<span class="min-w-[2rem] text-center text-sm font-bold text-gray-100">{partyLevel}</span>
					<button
						onclick={() => (partyLevel = Math.min(20, partyLevel + 1))}
						class="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-gray-300 transition hover:bg-gray-600"
						aria-label="Increase"
					>
						<i class="fa-duotone fa-light fa-plus text-xs" aria-hidden="true"></i>
					</button>
				</div>
				<span class="text-[10px] text-gray-600">
					Tier {partyLevel <= 4 ? 1 : partyLevel <= 8 ? 2 : partyLevel <= 12 ? 3 : 4}
					({partyLevel <= 4
						? '1–4'
						: partyLevel <= 8
							? '5–8'
							: partyLevel <= 12
								? '9–12'
								: '13–20'})
				</span>
			</div>

			<!-- Number of Floors -->
			<div class="flex flex-col gap-1.5">
				<label class="text-xs font-semibold tracking-wider text-gray-500 uppercase"
					>Number of Floors</label
				>
				<div class="flex items-center gap-2">
					<button
						onclick={() => (numFloors = Math.max(2, numFloors - 1))}
						class="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-gray-300 transition hover:bg-gray-600"
						aria-label="Decrease"
					>
						<i class="fa-duotone fa-light fa-minus text-xs" aria-hidden="true"></i>
					</button>
					<span class="min-w-[2rem] text-center text-sm font-bold text-gray-100">{numFloors}</span>
					<button
						onclick={() => (numFloors = Math.min(8, numFloors + 1))}
						class="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-gray-300 transition hover:bg-gray-600"
						aria-label="Increase"
					>
						<i class="fa-duotone fa-light fa-plus text-xs" aria-hidden="true"></i>
					</button>
				</div>
			</div>

			<!-- Actions -->
			<button
				onclick={randomize}
				class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
			>
				Randomize
			</button>

			{#if towerData}
				<button
					onclick={saveTower}
					class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
				>
					Save Tower
				</button>
			{/if}

			{#if savedTowers.length}
				<div class="flex flex-col gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
						>Saved Towers</span
					>
					<div class="flex max-h-52 flex-col gap-1 overflow-y-auto">
						{#each savedTowers as s (s.id)}
							<div class="flex items-center gap-1 rounded bg-gray-800/80 px-2 py-1.5">
								<button
									onclick={() => applyTower(s)}
									class="min-w-0 flex-1 truncate text-left text-xs text-gray-200 hover:text-amber-400"
									title={s.name}>{s.name}</button
								>
								<button
									onclick={() => deleteSavedTower(s.id)}
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
			{#if towerData}
				<!-- Tower Overview -->
				<div class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-5">
					<div class="mb-1 flex flex-wrap items-center gap-2">
						<h2 class="text-xl font-bold text-white">{towerData.name}</h2>
						<span
							class="rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {SCHOOL_COLORS[
								towerData.wizard.school
							]}"
						>
							{towerData.wizard.school}
						</span>
					</div>
					<p class="mb-4 text-xs text-gray-500">
						{towerData.wizard.race} wizard · {numFloors} floors
					</p>
					<p class="mb-4 text-sm leading-relaxed text-gray-300 italic">{towerData.exterior}</p>

					<!-- Wizard Status -->
					<div
						class="flex items-start gap-3 rounded-lg border {towerData.wizardStatus.present
							? 'border-amber-700/40 bg-amber-950/20'
							: 'border-gray-700 bg-gray-900/40'} p-3"
					>
						<span
							class="mt-0.5 shrink-0 rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {towerData
								.wizardStatus.present
								? 'bg-amber-700/50 text-amber-300'
								: 'bg-gray-700 text-gray-400'}"
						>
							{towerData.wizardStatus.present ? 'PRESENT' : 'ABSENT'}
						</span>
						<div>
							<p class="mb-0.5 text-sm font-semibold text-gray-100">
								{towerData.wizardStatus.label}
							</p>
							<p class="text-xs leading-relaxed text-gray-400">{towerData.wizardStatus.detail}</p>
						</div>
					</div>
				</div>

				<!-- Floors -->
				<div class="flex flex-col gap-5">
					{#each towerData.floors as floor}
						<div class="overflow-hidden rounded-xl border border-gray-700 bg-gray-800/50">
							<!-- Floor header -->
							<div
								class="flex items-center gap-3 border-b border-gray-700/60 bg-gray-900/60 px-4 py-2.5"
							>
								<span
									class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-700 text-[11px] font-bold text-gray-300"
								>
									{floor.number}
								</span>
								<span class="text-sm font-bold text-amber-300">{floor.label}</span>
							</div>

							<div class="space-y-4 p-4">
								<!-- Description -->
								<p class="text-sm leading-relaxed text-gray-300">{floor.description}</p>

								<!-- Anomaly -->
								{#if floor.anomaly}
									<div class="rounded-lg border border-violet-700/40 bg-violet-950/20 px-3 py-2.5">
										<p class="mb-1 text-[10px] font-bold tracking-widest text-violet-400 uppercase">
											Magical Anomaly
										</p>
										<p class="text-xs leading-relaxed text-gray-300">{floor.anomaly}</p>
									</div>
								{/if}

								<!-- Apprentice -->
								{#if floor.apprentice}
									{@const app = floor.apprentice}
									<div class="rounded-lg border border-gray-600 bg-gray-900/50 px-3 py-2.5">
										<div class="mb-2 flex flex-wrap items-center gap-2">
											<p class="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
												Apprentice
											</p>
											<span
												class="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase {DISPOSITION_COLORS[
													app.disposition
												]}"
											>
												{app.disposition}
											</span>
										</div>
										<div class="mb-1 flex flex-wrap items-center gap-2">
											<span class="text-sm font-bold text-gray-100">{app.name}</span>
											<span class="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-300"
												>{app.race}</span
											>
											<span class="text-[11px] text-gray-500">{app.tier}</span>
										</div>
										<p class="mb-1.5 text-xs text-gray-400">{app.description}</p>
										<p class="mb-1.5 text-xs text-gray-500 italic">Currently: {app.activity}.</p>
										<p class="text-[11px] text-gray-600">{DISPOSITION_NOTES[app.disposition]}</p>
									</div>
								{/if}

								<!-- Experiment -->
								{#if floor.experiment}
									{@const exp = floor.experiment}
									<div class="rounded-lg border border-gray-600 bg-gray-900/50 px-3 py-2.5">
										<div class="mb-2 flex flex-wrap items-center gap-2">
											<p class="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
												Experiment
											</p>
											<span
												class="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase {DANGER_COLORS[
													exp.danger
												]}"
											>
												{exp.danger} risk
											</span>
										</div>
										<p class="mb-1 text-sm font-semibold text-gray-100">{exp.name}</p>
										<p class="mb-2 text-xs leading-relaxed text-gray-400">{exp.description}</p>
										<p class="text-[11px] font-semibold text-gray-500 italic">
											Status: {exp.status}
										</p>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
