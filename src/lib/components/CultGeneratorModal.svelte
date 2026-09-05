<!-- Cult / Secret Society Generator -->
<script lang="ts">
	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	// ── Types ─────────────────────────────────────────────────────────────────────
	interface Ritual {
		name: string;
		description: string;
		frequency: string;
	}
	interface CultData {
		name: string;
		type: string;
		symbol: string;
		doctrine: string;
		goal: string;
		stage: string;
		stageLevel: 'cell' | 'established' | 'ascendant' | 'critical';
		rituals: Ritual[];
		cover: string;
		leadership: string;
		signs: string[];
	}

	// ── Controls ──────────────────────────────────────────────────────────────────
	let partySize = $state(4);
	let partyLevel = $state(1);
	let seed = $state(Math.floor(Math.random() * 1_000_000_000));
	let cultData = $state<CultData | null>(null);

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
	const CULT_TYPES = [
		'Doomsday Cult',
		'Secret Society',
		'Arcane Cabal',
		'Death Cult',
		'Revolutionary Cell',
		'Mystery Cult',
		'Theocratic Conspiracy',
		'Apocalypse Sect',
		'Philosophical Brotherhood',
		'Occult Order'
	];

	const TYPE_COLORS: Record<string, string> = {
		'Doomsday Cult': 'bg-red-900/60 text-red-300',
		'Secret Society': 'bg-blue-900/60 text-blue-300',
		'Arcane Cabal': 'bg-purple-900/60 text-purple-300',
		'Death Cult': 'bg-green-900/60 text-green-300',
		'Revolutionary Cell': 'bg-orange-900/60 text-orange-300',
		'Mystery Cult': 'bg-violet-900/60 text-violet-300',
		'Theocratic Conspiracy': 'bg-amber-900/60 text-amber-300',
		'Apocalypse Sect': 'bg-red-900/60 text-red-300',
		'Philosophical Brotherhood': 'bg-cyan-900/60 text-cyan-300',
		'Occult Order': 'bg-indigo-900/60 text-indigo-300'
	};

	const NAME_PREFIXES = [
		'The Order of',
		'The Brotherhood of',
		'The Children of',
		'The Hand of',
		'The Eye of',
		'The Circle of',
		'The Servants of',
		'The Lodge of',
		'The Covenant of',
		'The Cult of',
		'The Disciples of',
		'The Conclave of',
		'The Society of'
	];

	const NAME_NOUNS = [
		'the Pale Flame',
		'the Undying Night',
		'the Severed Chain',
		'the Black Meridian',
		'the Hollow Crown',
		'the Ashen Veil',
		'the Fractured Dawn',
		'the Second Death',
		'the Open Door',
		'the Sealed Hour',
		'the Forgotten Name',
		'the Ouroboros',
		'the Still Threshold',
		'the Amber Silence',
		'the Shattered Mirror',
		'the Seventh Wound',
		'the Unspeaking Dark',
		'the Bleeding Compass',
		'the Pale Covenant',
		'the Last Question'
	];

	const STANDALONE_NAMES = [
		'The Pale Covenant',
		'The Ashen Hand',
		'The Undying Circle',
		'The Hollow Vigil',
		'The Severed Eye',
		'The Black Meridians',
		'The Still Conclave',
		'The Fractured Tongue',
		'The Second Threshold',
		'The Amber Doctrine',
		'The Bleeding Lodge',
		'The Open Wound',
		'The Silent Inheritance',
		'The Seventh Seal',
		'The Hollow Fathers',
		'The Unmade Court',
		'The Pale Instrument',
		'The Undivided Hand',
		'The Crow Covenant',
		'The Ash Brotherhood'
	];

	const SYMBOLS = [
		'An eye within a triangle, the iris replaced by a small flame that burns without smoke',
		"Two serpents devouring each other's tails in a figure-eight, their scales etched with runes too small to read at a glance",
		'A broken crown resting atop an open tome, the pages blank except for a single word that differs in every copy',
		'A hand with an open eye in the palm, fingers splayed as though reaching for something above it',
		'A moth orbiting a black candle flame, wings spread mid-flight, frozen',
		'Three interlocking circles, each containing a different rune — scholars disagree on what the runes mean',
		'A crescent moon with a dagger through it, point down, the blade wrapped in a single chain',
		'A skull wearing a laurel wreath, eyes replaced by polished coins',
		'An hourglass with what appears to be blood instead of sand, the lower half nearly full',
		'A tower being struck by lightning, split vertically down the center, both halves standing',
		'A compass rose with the northern point extended into a dagger blade',
		'A caged bird with the cage door open, the bird still inside',
		'A skeletal hand and a living hand clasped in a handshake',
		'A sun with a human face, eyes closed, positioned behind what appears to be iron bars',
		'A descending spiral that terminates in a void — ink-black in the center',
		'A pair of scales, one side holding a feather, the other holding a crown',
		"A wolf's head in profile, mouth open but silent, wearing a collar made of thorns",
		'A tree with roots that form a perfect circle beneath it and branches that spell a single letter',
		'An open door set into nothing — no walls, no frame — with darkness on the other side',
		'A coiled rope with seven knots, each knot a different size'
	];

	const DOCTRINES = [
		'The gods are not omnipotent — they are merely the first to have seized divine power, and they guard their thrones through deception. Mortality is not a condition but a cage, and the key was always within reach of those willing to do what the gods fear most.',
		'The world completed its purpose centuries ago. Everything since then has been an echo, a dying reverberation of something that should have ended. The Doctrine teaches that mercy is to help it stop.',
		'Suffering is not a punishment but a language — the only honest one. Every member learns to read it in others and speak it in themselves, until what most call pain becomes merely information.',
		'Order is a lie told by the powerful to the powerless. The natural state of all things is flux, entropy, and transformation. They do not want chaos — they want the truth of it acknowledged.',
		'There is one true god, and it is not worshipped because it does not want worship. It wants results. The Doctrine is not a theology but a contract.',
		'The current age is the last in a cycle of seven. The members have a role: to ensure the transition does not fail, as it has failed before, because those who knew were not prepared.',
		'Arcane blood is not a gift — it is a responsibility and a claim. Those born with the capacity for magic are a separate people, and the world that ignores this truth will eventually be forced to acknowledge it.',
		'Death is not the end of identity but a threshold that can be made permeable. The work of the order is not resurrection — resurrection is for amateurs — but continuity.',
		'Every institution that exists does so because someone decided it should. The order has decided otherwise.',
		'The entity they serve does not lie. Everything else does. This is the whole of the Doctrine.',
		'The body is a temporary architecture and the self is not housed within it but merely passing through. Transformation is not a loss of self but an evolution of it — the only kind that matters.',
		"The dream-world is more real than the waking one. What happens here is aftermath; what happens there is cause. The order's work is conducted in the only place that actually counts.",
		'The prophesied liberator is real, and what others call a monster is simply what liberation looks like from the perspective of those being freed from something they never chose. The order prepares the way.',
		"Civilization is a wound the natural world has not yet finished healing. The return of wildness is not catastrophe but justice, and the order's purpose is to hasten what cannot be stopped.",
		'A specific bloodline carries a fragment of something that should not exist in a mortal vessel. The destruction of that lineage is not murder — it is surgery. The cosmos requires it, and the cosmos has asked.',
		'The fundamental nature of reality is negotiable, and always has been. The laws that govern the world are not laws but habits, and habits can be broken with sufficient will and sufficient cost.',
		'The powerful are not powerful because they deserve to be. They are powerful because they arrived first. The doctrine is a map of every lock they placed on what should be common.',
		"Language is the architecture of thought, and all thought is trapped inside the language available to it. The order's work is to build new words for things that have never been said before and cannot yet be thought.",
		"There is a version of this world where everything went differently. The order's purpose is to find the seam between what happened and what should have, and to open it.",
		'Pain purifies. Comfort corrupts. The order does not seek suffering as an end but as a means: the stripping away of everything false until only the irreducible, unbreakable self remains.',
		'History is a document written by those who had the time to write it, and it contains one serious omission. The order has been correcting that omission for three generations.',
		'The stars are not lights. They are eyes. The order exists to give them something worth watching — and to ensure that what watches does not, eventually, look away.',
		'Every living thing is owed a death it chooses. The current world denies this. The order exists to make the denial temporary.',
		"The divide between the living and the dead is a political boundary, not a natural one, and it was drawn by those who benefit from it. The order's ideology is simply that it should be redrawn.",
		'There is a word that, if spoken correctly and in the right place, will end something fundamental. The order has been determining the correct pronunciation for longer than any of its current members have been alive.'
	];

	const GOALS = [
		'Awaken the sleeping entity bound beneath the oldest mountain range — the one the church calls a myth and cartographers call a geological feature.',
		'Destroy the Concordat of Twelve and the institutions it protects, replacing them with nothing. The point is the destruction, not the replacement.',
		'Achieve collective undeath for all willing members before the end of this generation — not as monsters, but as a civilization beyond mortality.',
		'Complete the ritual that was interrupted three hundred years ago. The previous attempt left a scar on reality that is still healing. They intend to finish it.',
		'Place their chosen candidate on the throne of the nearest significant kingdom. Everything else — the doctrine, the rituals, the deaths — is in service of this mundane goal pursued by extraordinary means.',
		'Open a permanent planar gate that cannot be closed. The destination is not the point; the permanence is.',
		'Eliminate the last seven members of a specific bloodline. Six are already gone. The seventh does not know what they are.',
		'Acquire the Codex of Unwritten Things, a tome that does not yet exist but will, according to the prophecy they are following.',
		'Shatter the divine compact that prevents deities from directly intervening in mortal affairs. The order believes the gods fear mortals, and they intend to prove it.',
		'Erase from living memory the name of the figure their patron most hates — not from history, but from every current mind that holds it.',
		'Trigger a specific celestial conjunction by ensuring the deaths of seven individuals whose births were spread across the known world. Three are already dead.',
		'Corrupt the Weave in a single city to the point where magic becomes impossible to cast reliably. They believe this is only the first city.',
		"Recover and reassemble the fragments of a shattered phylactery that contains something other than a lich's soul.",
		'Ensure that the prophecy their rivals are trying to prevent comes to pass exactly as written — including the parts the rivals have not yet read.',
		'Transfer the consciousness of their founder into a body that will not age. The founder has already died twice. Each revival has cost something they will not specify.',
		'Build a settlement, underground or otherwise, large enough to survive whatever is coming. Recruitment is not optional; they are acquiring people whether those people consent or not.',
		'Prove the existence of a ninth school of magic by demonstrating a spell that cannot be classified within any existing school. The demonstration will not be small.',
		'Assassinate every member of a particular religious hierarchy in a sequence that mirrors a specific passage of scripture from their own faith.',
		'Locate and destroy the last remaining copy of a text that proves their doctrine is plagiarized from something much older and much darker.',
		'Broker a contract between a mortal kingdom and an entity that has never made a binding agreement before. The entity has agreed to the meeting. It has not agreed to be reasonable.',
		'Reconstruct, from fragments and rumor, the full name of a god that was killed before the current age began. They believe speaking it will bring it back.',
		'Collapse the barrier between the Material Plane and the Shadowfell in a radius of three miles — permanently. They have already selected the location.',
		'Ensure that a specific child, currently eight years old, reaches adulthood without being killed by the people who already know what that child will become.',
		'Burn down a library that has stood for four hundred years. Not the knowledge inside it — they have copied what matters. The building itself is the object.',
		'Prevent a peace treaty from being signed. They have tried diplomacy; they are now trying everything else.'
	];

	const STAGES: Record<string, string[]> = {
		cell: [
			'A handful of members, known only to each other. No infrastructure, no real resources. Dangerous mostly in what they might grow into.',
			'Newly formed and still finding its doctrine. The founder has not yet been tested and the ideology has not yet produced consequences.',
			'Small enough to be entirely unknown to local authorities. They meet in private homes and communicate through dead drops.'
		],
		established: [
			'Operating across several settlements with resources enough to protect themselves. The hierarchy is functional and the doctrine is fixed.',
			'Known to exist by a handful of officials who have not yet decided what to do about it. That window is closing.',
			'The founding generation is still in charge, but a second generation of members is emerging — and they are more committed, not less.'
		],
		ascendant: [
			'Significant influence in local institutions — at least one of which has been quietly subverted. Opposition is possible but costly.',
			'No longer acting defensively. They have resources, reach, and allies who do not know what they are allied with.',
			'Their name is known. What they want is not. The gap between those two facts is where they do their best work.'
		],
		critical: [
			"Actively executing the final stage of their goal. One of the party's own contacts may be compromised. Time is the enemy.",
			'The goal is within reach. Events are in motion that cannot easily be reversed. Stopping them now requires stopping what they have already set in motion.',
			'Operating in the open, because there is no longer any advantage in concealment. They have what they need. The question is only whether anyone can respond in time.'
		]
	};

	const RITUALS: Ritual[] = [
		{
			name: 'The Binding Oath',
			description:
				'New members cut their palm and press it against the symbol carved into the altar stone, swearing on their own blood. The oath is specific and memorized — there is no improvisation. Members claim they can feel it if another member breaks their oath, though this has never been demonstrated.',
			frequency: 'Required of all initiates'
		},
		{
			name: 'The Vigil',
			description:
				'Members are required to stay awake for three consecutive days and nights before any major decision or action. The resulting state of deprivation is considered closer to truth than ordinary consciousness. Decisions made during the Vigil are binding.',
			frequency: 'Before major operations'
		},
		{
			name: 'The Communion',
			description:
				'A prepared substance — the recipe is known only to the Keeper — is consumed collectively. Members report shared visions of the same location, the same event, the same face. No two batches produce identical effects.',
			frequency: 'Monthly'
		},
		{
			name: 'The Unmasking',
			description:
				'Each member reveals their birth name — not the name they use with the order — to the full assembly. This is considered the most intimate of ceremonies and is kept from initiates for years. Knowing a true name is considered a form of ownership.',
			frequency: 'Annual'
		},
		{
			name: 'The Marking',
			description:
				'A specific symbol is burned or cut into a part of the body that can be concealed. The location varies by rank. The procedure is conducted by the senior member and is done deliberately slowly, because the duration is considered part of the ceremony.',
			frequency: 'Upon advancement in rank'
		},
		{
			name: 'The Burning',
			description:
				'Each member burns something that defined who they were before joining — a document, an object, sometimes a name written on paper. The fire is shared and the ash is kept communally in a sealed urn. The ceremony is treated as a true death of the previous self.',
			frequency: 'Required of all initiates'
		},
		{
			name: 'The Confession',
			description:
				'Members recite — in order, without omission — every act they have committed that violated the doctrine since the last assembly. This is not for absolution. It is recorded. The record is kept as insurance, leverage, and as proof that doctrine has real teeth.',
			frequency: 'At each full assembly'
		},
		{
			name: 'The Mock Death',
			description:
				'A senior member administers a carefully measured dose of a substance that suppresses the vital signs to near undetectability for a period of minutes. The experience is considered transformative. Two initiates have not survived it. Both deaths were recorded as accidents.',
			frequency: 'Once, at the transition from initiate to full member'
		},
		{
			name: 'The Silence',
			description:
				'At a prearranged signal — a phrase passed through sealed letters — every member simultaneously ceases all speech for exactly one hour, regardless of where they are or what they are doing. The collective silence is considered a demonstration that the doctrine operates without visible coordination.',
			frequency: 'Three times per year, dates known only to leadership'
		},
		{
			name: 'The Witnessing',
			description:
				'New members are required to observe an act — chosen by leadership — that they cannot report without incriminating themselves. The act varies and is calibrated to the individual. The shared complicity is considered the true initiation.',
			frequency: 'Once, as a precondition of full membership'
		},
		{
			name: 'The Fast and the Feast',
			description:
				'Members fast for seven days before each major gathering, permitted only water and a single cup of a specific tea. The gathering itself ends in a communal meal of notable extravagance. The contrast is deliberate: denial followed by abundance to demonstrate that the doctrine controls both states.',
			frequency: 'Before each major gathering'
		},
		{
			name: 'The Reading of Omens',
			description:
				'Before any significant action, a designated reader interprets signs — the behavior of animals, the arrangement of scattered objects, patterns in flame or smoke. The reading is not considered prediction but consultation. The patron is believed to answer through the material world.',
			frequency: 'Before any significant action'
		},
		{
			name: 'The Contact',
			description:
				'A ritual attempt to receive communication from the patron or entity the order serves. Not every attempt succeeds. When it does, the message is transcribed by three members independently and the transcriptions are compared before being acted upon.',
			frequency: 'Monthly, or before critical decisions'
		},
		{
			name: 'The Surrender',
			description:
				'Each member, once per year, must bring before the assembly something they consider irreplaceable — an object, a relationship, a secret — and offer it. Leadership decides whether the surrender is accepted. Most are returned. Some are not.',
			frequency: 'Annual'
		},
		{
			name: 'The Dissolution',
			description:
				"Upon the death of a member, the remaining members dissolve any evidence of that person's existence in the outside world: burning correspondence, reclaiming objects, ensuring that the name is never spoken again. The dead are not mourned; they are completed.",
			frequency: 'Upon the death of any member'
		},
		{
			name: 'The Mirror Work',
			description:
				'Pairs of members sit facing each other for an extended period — typically four to six hours — without speaking, maintaining eye contact. The practice is described as learning to see past the surface of a person into what they actually are. Several members have reported seeing something other than their partner looking back.',
			frequency: 'Quarterly'
		},
		{
			name: 'The Walk',
			description:
				'Members walk a prescribed route through the settlement alone, at a specific time of night, without stopping. They are not told what the walk is for. Senior members know that other members are watching, and that the unwatched behavior during the walk is considered the truest portrait of a person.',
			frequency: 'Monthly'
		},
		{
			name: 'The Rewriting',
			description:
				'Each member maintains a personal record that is periodically rewritten from memory, without reference to the previous version. The differences between versions are reviewed by a senior member. Changes are considered evidence of growth; consistency is considered evidence of stagnation.',
			frequency: 'Twice per year'
		},
		{
			name: 'The Ascension Test',
			description:
				'Members seeking advancement are given a task with no stated parameters, observed without their knowledge, and assessed not on the outcome but on the reasoning they describe afterward. Several members have failed tests they believed they passed. No one is told the results directly.',
			frequency: 'Upon petition for advancement'
		},
		{
			name: 'The Blood Map',
			description:
				"A map of the region is pricked onto the skin of a volunteer using a needle dipped in a diluted alchemical compound that leaves pale marks. The volunteer is aware of the ceremony's purpose; the marks fade within a season. The map is considered a form of claiming: what has been written on a body has been claimed by it.",
			frequency: 'When the order moves into new territory'
		}
	];

	const COVERS = [
		'A charitable organization that genuinely does feed and house the destitute. The good work is real. It also provides access, information, and a screen.',
		'A philosophical discussion club for the educated, whose published pamphlets are bland and whose private meetings are not.',
		'An astronomy society with a legitimate observatory and peer-reviewed publications. Their interest in the heavens is not astronomical.',
		"A fraternal veterans' order with genuine members who have no idea what the inner circle does.",
		'A theater troupe that performs everywhere and is welcomed everywhere and listens to everything.',
		'A religious order operating within the structure of an established faith. The heresy is in the inner doctrine, not the face.',
		'A guild of healers and herbalists with an excellent reputation. Their services are real. Their knowledge of poisons is incidental.',
		"A merchants' association controlling trade in one commodity. The commodity is unremarkable. The intelligence network built around it is not.",
		'A school for the gifted children of noble families. The parents have no idea what their children are being taught in the second year.',
		'A burial society that handles the dead with genuine dignity and professionalism. Their access to the recently deceased is simply a byproduct of their work.',
		"A cartographers' guild that produces accurate maps and sells them at reasonable prices. What they note on their private copies differs from the public editions.",
		'A literary salon that publishes a well-regarded journal of letters and commentary. The code within the criticism has been operating for eleven years without detection.',
		'A private courier service used by noble houses and merchant consortiums. Their reliability is genuine. Their reading of every sealed letter they carry is not.',
		'A lodge for hunters and rangers that provides genuine wilderness services and training. The ceremony at the center of each seasonal meeting is not about the hunt.',
		'A craft guild for stonemasons and architects. Their members have access to every significant building in the city and the legitimate reason to be found inside any of them.'
	];

	const LEADERSHIP_DESCRIPTIONS = [
		'A single founder who claims direct communication with the entity they serve. No succession plan exists, which several senior members have privately noted is either a statement of faith or a significant operational vulnerability.',
		'A triumvirate of equal rank who govern by consensus. Two of them are aware of something the third is not.',
		"A council of seven, each representing one of the doctrine's seven principles. Decisions are unanimous or nothing, which has made the organization slow but has also prevented two internal coups.",
		'The patron itself communicates through a chosen vessel. The vessel changes — voluntarily or otherwise — every seven years. The current vessel is in their fourth year.',
		'No formal hierarchy. The doctrine is the leader. Members interpret it themselves, which has caused two schisms already and will likely cause more.',
		'A single leader who is publicly unknown even within the organization. All orders are passed through intermediaries, and no member below the inner circle has ever met the person at the top.',
		'A hereditary leadership structure in which power passes through a specific bloodline. The current leader is the third generation and the youngest yet. They are seventeen.',
		'Leadership is earned through a test that is not announced until the moment it occurs, and the results are not explained. Members who believe they have passed are not always correct.',
		'An inner circle of twelve who each know only three others in the circle. A cell structure that prevents any single capture from compromising the whole.',
		'A dual leadership of a doctrine keeper and an operations leader, designed to prevent ideological drift in one direction and mindless pragmatism in the other. They are currently in significant disagreement.',
		'Leadership is rotated annually among a pool of senior members. The rotation is considered a feature, not a flaw: no single face becomes too recognizable, and no single mind becomes too attached to power.',
		'The founder is dead, but their writings govern every decision. A council interprets those writings when disputes arise, which gives the council power it was never formally granted.'
	];

	const SIGNS_POOL = [
		"A specific ring worn on the left index finger — plain, silver, with a notch filed in the band at the six o'clock position",
		'A phrase used as a greeting: "The hour is late." The response is: "It always was."',
		'A small tattoo on the inside of the left wrist, usually kept covered, depicting three dots in a triangle',
		'A scar in a specific location on the forearm, made during the Binding Oath ceremony',
		'A particular way of folding a written letter — two folds vertical, then one horizontal',
		'A pressed flower of a specific uncommon variety worn in the lapel on the seventh day of each month',
		'A deliberate mispronunciation of one specific common word — the same word, the same error, every time',
		'Tapping the left thumb against the index finger twice before speaking in formal settings',
		'A coin with a specific year of minting kept always in the left pocket, produced briefly when making introductions',
		'A particular way of holding a cup — left hand, handle toward the body — during any social gathering',
		'A phrase embedded in otherwise normal conversation: "...as my father always said." No context is needed. The recipient understands.',
		'A small glass bead of a specific unusual color worn threaded into hair or clothing, difficult to notice unless you know to look',
		'The habit of turning a ring on the finger three times when making a statement that has a second meaning',
		'A specific melody, hummed quietly, that serves as both greeting and signal. Six bars, no more.',
		'A mark pressed lightly into the wax of any sealed correspondence — too faint to notice without knowing it is there',
		'The use of a specific archaic word for a common thing — a word not used in ordinary speech for two generations',
		"A handshake in which the thumb is pressed twice against the other person's knuckle",
		"A small smudge of ash worn on the inside of the left wrist on the anniversary of the order's founding",
		'A specific pause before answering direct questions — exactly two breaths, timed — that signals awareness without speech',
		"The habit of setting one's cup or glass exactly at the corner of any table or surface, never in the center or at the edge"
	];

	// ── Generation ────────────────────────────────────────────────────────────────
	function generateCult(): CultData {
		const rng = mkRng(seed);

		// Name
		let name: string;
		if (rng() < 0.45) {
			const prefix = pick(NAME_PREFIXES, rng);
			const noun = pick(NAME_NOUNS, rng);
			name = `${prefix} ${noun}`;
		} else {
			name = pick(STANDALONE_NAMES, rng);
		}

		const type = pick(CULT_TYPES, rng);
		const symbol = pick(SYMBOLS, rng);
		const doctrine = pick(DOCTRINES, rng);
		const goal = pick(GOALS, rng);
		const cover = pick(COVERS, rng);
		const leadership = pick(LEADERSHIP_DESCRIPTIONS, rng);

		// Stage level — weighted by party level
		// Low party level: cell/established more likely; high party level: ascendant/critical more likely
		const stageLevels: CultData['stageLevel'][] = ['cell', 'established', 'ascendant', 'critical'];
		const levelFraction = (partyLevel - 1) / 19; // 0 at level 1, 1 at level 20
		const weights = [
			Math.max(0.05, 0.45 - levelFraction * 0.4),
			Math.max(0.05, 0.35 - levelFraction * 0.15),
			Math.min(0.45, 0.1 + levelFraction * 0.3),
			Math.min(0.4, 0.05 + levelFraction * 0.35)
		];
		const totalWeight = weights.reduce((a, b) => a + b, 0);
		let roll = rng() * totalWeight;
		let stageLevel: CultData['stageLevel'] = 'cell';
		for (let i = 0; i < weights.length; i++) {
			roll -= weights[i];
			if (roll <= 0) {
				stageLevel = stageLevels[i];
				break;
			}
		}

		const stageDescriptions = STAGES[stageLevel];
		const stage = pick(stageDescriptions, mkRng(hashSeed('stage', seed)));

		// Pick 3 rituals from pool (no repeats)
		const ritualPool = shuffle(RITUALS, mkRng(hashSeed('rituals', seed)));
		const rituals = ritualPool.slice(0, 3);

		// Pick 2 signs from pool (no repeats)
		const signsPool = shuffle(SIGNS_POOL, mkRng(hashSeed('signs', seed)));
		const signs = signsPool.slice(0, 2);

		return {
			name,
			type,
			symbol,
			doctrine,
			goal,
			stage,
			stageLevel,
			rituals,
			cover,
			leadership,
			signs
		};
	}

	function randomize() {
		seed = Math.floor(Math.random() * 1_000_000_000);
	}

	// ── Save / Load ───────────────────────────────────────────────────────────────
	interface SavedCult {
		id: string;
		name: string;
		partySize: number;
		partyLevel: number;
		seed: number;
		savedAt: number;
	}
	const CULTS_KEY = 'initiative_saved_cults';
	let savedCults = $state<SavedCult[]>([]);
	if (typeof window !== 'undefined') {
		try {
			savedCults = JSON.parse(localStorage.getItem(CULTS_KEY) ?? '[]');
		} catch {
			savedCults = [];
		}
	}
	function saveCult() {
		const entry: SavedCult = {
			id: crypto.randomUUID(),
			name: cultData?.name ?? 'Unknown Cult',
			partySize,
			partyLevel,
			seed,
			savedAt: Date.now()
		};
		savedCults = [entry, ...savedCults].slice(0, 20);
		localStorage.setItem(CULTS_KEY, JSON.stringify(savedCults));
	}
	function deleteSavedCult(id: string) {
		savedCults = savedCults.filter((c) => c.id !== id);
		localStorage.setItem(CULTS_KEY, JSON.stringify(savedCults));
	}
	function applyCult(s: SavedCult) {
		partySize = s.partySize;
		partyLevel = s.partyLevel;
		seed = s.seed;
	}

	// ── Color maps ────────────────────────────────────────────────────────────────
	const STAGE_COLORS: Record<string, string> = {
		cell: 'bg-gray-700 text-gray-300',
		established: 'bg-blue-900/60 text-blue-300',
		ascendant: 'bg-amber-900/60 text-amber-300',
		critical: 'bg-red-900/60 text-red-300'
	};

	$effect(() => {
		cultData = generateCult();
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
				<h2 class="text-lg font-bold tracking-wide text-amber-300">
					Cult / Secret Society Generator
				</h2>
				{#if cultData}
					<span class="text-xs text-gray-500">{cultData.name}</span>
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

			<!-- Actions -->
			<button
				onclick={randomize}
				class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
			>
				Randomize
			</button>

			{#if cultData}
				<button
					onclick={saveCult}
					class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
				>
					Save Cult
				</button>
			{/if}

			{#if savedCults.length}
				<div class="flex flex-col gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
						>Saved Cults</span
					>
					<div class="flex max-h-52 flex-col gap-1 overflow-y-auto">
						{#each savedCults as s (s.id)}
							<div class="flex items-center gap-1 rounded bg-gray-800/80 px-2 py-1.5">
								<button
									onclick={() => applyCult(s)}
									class="min-w-0 flex-1 truncate text-left text-xs text-gray-200 hover:text-amber-400"
									title={s.name}>{s.name}</button
								>
								<button
									onclick={() => deleteSavedCult(s.id)}
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
			{#if cultData}
				<!-- Overview card -->
				<div class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-5">
					<div class="mb-2 flex flex-wrap items-center gap-2">
						<h2 class="text-xl font-bold text-white">{cultData.name}</h2>
						<span
							class="rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {TYPE_COLORS[
								cultData.type
							] ?? 'bg-gray-700 text-gray-300'}"
						>
							{cultData.type}
						</span>
					</div>
					<p class="mb-1 text-sm text-gray-400 italic">{cultData.symbol}.</p>
					<p class="text-xs text-gray-600">
						Publicly known as: <span class="text-gray-500">{cultData.cover}</span>
					</p>
				</div>

				<!-- Doctrine -->
				<div class="mb-5 rounded-xl border border-amber-800/30 bg-amber-950/20 p-4">
					<h3 class="mb-2 text-xs font-bold tracking-widest text-amber-500 uppercase">Doctrine</h3>
					<p class="text-sm leading-relaxed text-gray-300">{cultData.doctrine}</p>
				</div>

				<!-- Goal & Stage -->
				<div class="mb-5 rounded-xl border border-gray-700 bg-gray-800/50 p-4">
					<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">Goal</h3>
					<p class="mb-3 text-sm leading-relaxed text-gray-300">{cultData.goal}</p>
					<div class="flex flex-wrap items-start gap-2">
						<span
							class="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {STAGE_COLORS[
								cultData.stageLevel
							]}"
						>
							{cultData.stageLevel}
						</span>
						<p class="text-xs leading-relaxed text-gray-500">{cultData.stage}</p>
					</div>
				</div>

				<!-- Rituals -->
				<div class="mb-5">
					<h3 class="mb-3 text-xs font-bold tracking-widest text-gray-400 uppercase">Rituals</h3>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
						{#each cultData.rituals as ritual}
							<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-3">
								<p class="mb-0.5 text-sm font-bold text-gray-100">{ritual.name}</p>
								<p class="mb-2 text-[11px] text-gray-500 italic">{ritual.frequency}</p>
								<p class="text-xs leading-relaxed text-gray-400">{ritual.description}</p>
							</div>
						{/each}
					</div>
				</div>

				<!-- Leadership & Recognition -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<!-- Leadership -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Leadership Structure
						</h3>
						<p class="text-sm leading-relaxed text-gray-300">{cultData.leadership}</p>
					</div>

					<!-- Recognition Signs -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Recognition Signs
						</h3>
						<ul class="space-y-2">
							{#each cultData.signs as sign}
								<li class="flex items-start gap-2 text-sm text-gray-300">
									<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-600"></span>
									<span>{sign}</span>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
