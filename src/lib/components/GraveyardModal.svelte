<!-- Graveyard / Crypt Generator -->
<script lang="ts">
	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	// ── Types ─────────────────────────────────────────────────────────────────────
	type SiteType = 'Graveyard' | 'Crypt' | 'Catacomb' | 'Barrow' | 'Ossuary';
	type Condition = 'Pristine' | 'Maintained' | 'Neglected' | 'Ruined' | 'Desecrated';

	interface LayoutSection {
		name: string;
		description: string;
		detail: string;
	}

	interface NotableGrave {
		name: string;
		epitaph: string;
		who: string;
		hook: string;
	}

	interface Haunt {
		type: string;
		trigger: string;
		manifestation: string;
		resolution: string;
	}

	interface TreasureHook {
		summary: string;
		location: string;
		contents: string;
		complication: string;
	}

	interface GraveyardData {
		siteName: string;
		siteType: SiteType;
		condition: Condition;
		age: string;
		keeper: string | null;
		keeperNote: string;
		atmosphere: string;
		layoutSections: LayoutSection[];
		notableGraves: NotableGrave[];
		haunts: Haunt[];
		treasureHooks: TreasureHook[];
		recentEvent: string;
		rumor: string;
	}

	// ── Controls ──────────────────────────────────────────────────────────────────
	let partySize = $state(4);
	let partyLevel = $state(1);
	let seed = $state(Math.floor(Math.random() * 1_000_000_000));
	let graveyardData = $state<GraveyardData | null>(null);

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

	const SITE_NAME_PRE = [
		'Ashfield',
		'Blackmoor',
		'Bone',
		'Cold',
		'Crow',
		'Dark',
		'Dusk',
		'Dread',
		'Ever',
		'Fell',
		'Frost',
		'Gray',
		'Grim',
		'Hallowed',
		'Hollow',
		'Iron',
		'Lorn',
		'Mist',
		'Mourning',
		'Night',
		'Old',
		'Pale',
		'Quiet',
		'Rest',
		'Rook',
		'Shadow',
		'Silent',
		'Sorrow',
		'Still',
		'Stone',
		'Thorn',
		'Twilight'
	];
	const SITE_NAME_SUF: Record<SiteType, string[]> = {
		Graveyard: ['Yard', 'Field', 'Green', 'Lea', 'Mound', 'Plot', 'Row', 'Walk'],
		Crypt: ['Crypt', 'Vault', 'Chamber', 'Hall', 'Hold', 'Reach', 'Warren'],
		Catacomb: ['Catacombs', 'Warrens', 'Depths', 'Labyrinth', 'Passages', 'Ways'],
		Barrow: ['Barrow', 'Mound', 'Cairn', 'Knoll', 'Rise', 'Howe'],
		Ossuary: ['Ossuary', 'Reliquary', 'Chapel', 'Gallery', 'Recess', 'Niche']
	};

	const AGES = [
		'less than a century old — some families still visit',
		"two centuries old, established in a forgotten king's reign",
		'three hundred years old; the oldest markers are barely legible',
		'four centuries old, predating the current city district above it',
		'five hundred years old — the founding generation rests here',
		'ancient — origins unknown, predating reliable records by at least two centuries',
		'of mixed age; the outer sections are recent, the inner sections are not',
		'built over a site of much older burials; the original occupants remain below'
	];

	const KEEPER_NAMES = [
		'Aldric Bone',
		'Bessa Kell',
		'Croft the Younger',
		'Davan Sere',
		'Eida Morne',
		'Farrow Grim',
		'Grael of the Long Watch',
		'Hesta Pale',
		'Igvin Soot',
		'Jenna Wax',
		'Korvan Dust',
		'Lisse of the Gates',
		'Mirven Ash',
		'Nolta Tallow',
		'Old Peck',
		'Rika Coldstone',
		'Seel the Quiet',
		'Taven Urm',
		'Vorna Last',
		'Waylen Mor'
	];

	const KEEPER_NOTES = [
		'has tended this place for thirty years and speaks to the stones as if they listen',
		'is new to the role and visibly unsettled by what the job entails',
		'knows every grave by name and where each body actually ended up — which is not always the same',
		'is rarely seen but leaves small offerings at certain graves each dawn',
		'was convicted of grave-robbing twenty years ago and considers the posting poetic justice',
		'keeps meticulous records but refuses to share them without compensation',
		'is deeply religious and watches visitors with undisguised suspicion',
		'has heard everything that goes on here at night and will describe it in extraordinary detail if asked',
		'appears to genuinely enjoy the company of the dead and finds the living exhausting',
		'is the third generation of their family to hold the position — and the last, they say'
	];

	const ATMOSPHERES = [
		'An unnatural stillness settles over the place — birdsong stops at the threshold.',
		'A cold mist rolls through regardless of the weather above ground.',
		'The air smells of damp earth, old stone, and something faintly sweet that no one can place.',
		'Shadows here seem slightly wrong — too long, facing the wrong direction.',
		'The wind moves through the stones producing sounds that almost resolve into words.',
		'Everything here is too quiet. Even footsteps seem muffled, absorbed.',
		'A persistent grey light diffuses evenly through the space, sourceless.',
		'Candles and torches flicker without cause. Flames lean toward certain graves.',
		'The temperature drops by ten degrees the moment you pass the gate.',
		'An inexplicable sense of being watched is present from the first step inside.',
		'Dead flowers left on graves never fully decay — they simply dry and bleach over weeks.',
		"The ground here is soft regardless of season. No one's footprints remain after they leave."
	];

	// ── Layout sections ───────────────────────────────────────────────────────────
	const LAYOUT_POOL: LayoutSection[] = [
		{
			name: 'The Main Gate',
			description:
				'Tall iron gates, one hinge long since rusted solid — only the left panel opens.',
			detail:
				'A name is welded above the arch in old script. Half the letters are missing. The one legible word is not a name anyone recognizes.'
		},
		{
			name: 'The Common Rows',
			description:
				'Dozens of simple markers, some wood, some stone, packed close together in the oldest section.',
			detail:
				'Many stones have sunk or tilted. Several are blank. One row has been dug up and refilled at some point — the soil color is wrong.'
		},
		{
			name: 'The Family Mausoleums',
			description:
				'A cluster of stone structures large enough to walk into, sealed with iron doors, most bearing family crests.',
			detail:
				'Three of the doors are sealed properly. One has been forced. One stands slightly ajar and has been that way, according to the keeper, since before they arrived.'
		},
		{
			name: 'The Chapel of the Dead',
			description:
				'A small stone building at the center, once used for funeral rites. The interior is intact but long unused.',
			detail:
				'The altar has been cleared. A single chair sits before it, facing the wrong direction. Someone has been burning tallow here recently — the drips are still soft.'
		},
		{
			name: "The Potter's Field",
			description:
				'The unconsecrated section — unmarked graves of the poor, the unknown, and the rejected.',
			detail:
				'There are more graves here than the records account for. The keeper shrugs when asked. Someone left a small bundle of herbs on one of the unmarked mounds this week.'
		},
		{
			name: "The Warrior's Quarter",
			description:
				'Rows of military graves, many bearing the emblems of disbanded companies or forgotten campaigns.',
			detail:
				'The markers here are better maintained than the rest of the site, though no one has been assigned to it. Flowers appear on several graves without explanation — fresh ones, regularly.'
		},
		{
			name: 'The Catacombs Entrance',
			description:
				'A stone stair descending into the earth, sealed with a gate that theoretically requires a key.',
			detail:
				"The gate mechanism is corroded. The key opens it — so does a firm pull. The air below is cold and very still. Something at the bottom reflects light back that shouldn't be there."
		},
		{
			name: 'The Memorial Wall',
			description:
				'A long stone wall carved with hundreds of names — those whose bodies were never recovered.',
			detail:
				'Some names have been scratched out. Some have been added in a different hand, recently. One name appears twice, in different locations on the wall, with different dates.'
		},
		{
			name: 'The Sealed Vault',
			description:
				'A structure older than the rest, its door bearing no family crest — only a warding symbol that the current church considers heretical.',
			detail:
				'The keeper avoids this area. The ward symbol is not protective — it is a warning. The door has not been opened in living memory, but the soil in front of it is disturbed.'
		},
		{
			name: 'The Garden of Urns',
			description: 'A section reserved for cremation urns set in stone niches along a curved wall.',
			detail:
				'One niche is sealed with mortar that is clearly newer than the others. No name is inscribed above it. The mortar is cracked, as if something pressed outward from inside.'
		},
		{
			name: "The Keeper's Lodge",
			description:
				'A small stone cottage at the edge of the grounds, smoke rising from the chimney.',
			detail:
				'The keeper is almost always visible near it. The door is never locked. The inside is surprisingly well-appointed for someone paid to tend graves. There is a locked chest under the bed that is heavier than furniture.'
		},
		{
			name: 'The Bone Gallery',
			description:
				'A long corridor in the lower level where older remains were moved to create space. Skulls are stacked in precise rows.',
			detail:
				'The arrangement is clearly deliberate — not for storage, but for something. A careful observer notes that certain skulls are grouped by marking: faint carved symbols, visible only by torchlight.'
		},
		{
			name: 'The Drowning Pool',
			description:
				'A small ornamental pond at the center of the older section, black water reflecting nothing.',
			detail:
				"The water does not freeze in winter. Things are sometimes seen in it that are not above it. The keeper says it has been there since before the graveyard was established. He doesn't know what it was for."
		},
		{
			name: "The Children's Corner",
			description:
				'A smaller section of the grounds with low markers, carved animals, and faded paint.',
			detail:
				"Too many graves for one town's natural losses over the years. The dates cluster around three specific years — the same years as three gaps in the local census records. Nobody talks about this."
		},
		{
			name: 'The Old Barrow',
			description:
				'A grass-covered earthen mound at the northern edge, clearly predating the formal graveyard around it.',
			detail:
				'It was here first. The graveyard grew around it rather than over it. The keeper says something about disturbing it is written into the site charter. No one has read the charter in decades.'
		}
	];

	// ── Notable Graves ────────────────────────────────────────────────────────────
	interface GraveEntry {
		name: string;
		epitaph: string;
		who: string;
		hook: string;
	}

	const GRAVE_POOL: GraveEntry[] = [
		{
			name: 'Lord Aldric Mourne',
			epitaph: '"He Held The Line."',
			who: "A military commander who died defending a bridge that doesn't appear on any current map.",
			hook: 'His sword was buried with him — a named blade with a documented history. A descendant is searching for it and will pay, or take it by other means.'
		},
		{
			name: 'Yesta of the Silver Hand',
			epitaph: '"Her Work Was Never Finished."',
			who: 'A healer of considerable renown who died mid-project, according to the date — while reportedly healthy.',
			hook: 'Her journals are supposedly buried with her. Three parties want them. The most recent visitor left a small vial of something on the grave — it was gone the next morning.'
		},
		{
			name: 'The Unnamed Stone',
			epitaph: '"Known Only To Those Who Should Not Know."',
			who: 'No records of this burial exist. The stone is old but the grave itself is relatively recent.',
			hook: 'Someone is leaving money on this grave at irregular intervals. The keeper has collected it rather than report it.'
		},
		{
			name: 'Brothers Carren and Fell',
			epitaph: '"Divided In Life. Together At Last."',
			who: 'Twin brothers buried in the same grave — a detail not reflected in any public record.',
			hook: 'They were enemies. Their shared burial was arranged by a third party whose name is scratched out of every document. The family wants to know who and why.'
		},
		{
			name: 'High Priest Vorn the Penitent',
			epitaph: '"Forgiveness Was Asked. The Answer Is Not Recorded Here."',
			who: 'A senior churchman who resigned his post abruptly and died within the year.',
			hook: 'Whatever he confessed before death was sealed. A faction within the church wants that confession found and destroyed. Another faction wants it found and published.'
		},
		{
			name: 'Mira Saltwood',
			epitaph: '"She Knew The Way. We Did Not Follow."',
			who: 'A cartographer who mapped routes through terrain no one has successfully crossed since.',
			hook: 'Her maps were buried with her at her insistence. They chart a path through the northern wastes that three expeditions have since failed to rediscover.'
		},
		{
			name: 'The Hanged Judge',
			epitaph: '"Every Sentence Is Final."',
			who: 'A magistrate executed for corruption — buried in the graveyard against local objection.',
			hook: 'He hid the bribes he received somewhere. His written confession mentioned a location but was never produced at trial. It may have gone into the grave with him.'
		},
		{
			name: 'Ren Ashwick, Artificer',
			epitaph: '"His Last Work Is Still Running."',
			who: 'An artificer of middling fame who died suddenly, leaving a device incomplete.',
			hook: 'The device was never found. His apprentice believes it was buried with him and is looking for an excuse to dig. The estate has blocked every legal attempt.'
		},
		{
			name: 'Lady Quell of Thornford',
			epitaph: '"She Was Asked. She Refused. She Was Right."',
			who: 'A noblewoman who declined a royal marriage and died under circumstances the crown never fully explained.',
			hook: 'She hid something before she died — her personal correspondence, which would reframe the succession dispute it touches on. An archivist has been piecing together clues for years.'
		},
		{
			name: 'Sergeant Brek Holt',
			epitaph: '"He Came Home. Not All Of Him."',
			who: 'A soldier who survived a disastrous campaign that is officially listed as a victory.',
			hook: 'He gave a deathbed account of what actually happened. His widow wrote it down and buried the account with him, not trusting anyone living with it. The account names names.'
		},
		{
			name: 'The Plague Year Memorial',
			epitaph: '"One Hundred And Twelve. They Deserved Better."',
			who: 'A mass grave from an outbreak three generations past — all buried together, records incomplete.',
			hook: 'One of the names inscribed was not actually a plague victim. They were buried here to hide them. A genealogist tracking a family line has noticed the discrepancy.'
		},
		{
			name: 'Tomb of the Architect',
			epitaph: '"I Built What Stands. I Am What Remains."',
			who: 'The designer of several important local buildings, buried in a tomb of his own construction.',
			hook: 'The tomb has a door within a door — a second internal chamber on no surviving plan. The outer tomb is open to visitors. The inner door has never been located from the outside.'
		},
		{
			name: 'Sister Pelm, Interred Twice',
			epitaph: '"Once Was Not Enough To Keep Her."',
			who: 'A nun buried here after her first death — and returned to this grave after her second, eight years later.',
			hook: 'Between those two deaths, she was seen repeatedly and is documented in three separate records. What she was doing during those eight years is unaccounted for.'
		},
		{
			name: 'Dusk Wren, Poet',
			epitaph: '"The Last Verse Was Never Written Down."',
			who: 'A poet beloved in her lifetime, whose final unpublished work was reportedly complete before she died.',
			hook: 'Her estate sold everything. The final manuscript was not among the effects. Her literary executor believes she buried it — literally — as her final act.'
		},
		{
			name: 'The Merchant With No Stone',
			epitaph: '(No stone — a wooden stake with a name burned into it, barely legible)',
			who: 'A merchant buried hastily and cheaply, suggesting either poverty at death or someone who wanted no monument.',
			hook: "The merchant's ledger was never found after his death. It documented three decades of transactions. The people named in it would prefer it stay lost."
		}
	];

	// ── Haunts ────────────────────────────────────────────────────────────────────
	interface HauntEntry {
		type: string;
		trigger: string;
		manifestation: string;
		resolution: string;
	}

	const HAUNT_POOL: HauntEntry[] = [
		{
			type: 'The Weeping Figure',
			trigger: 'Appears only when a living creature is alone in the eastern section after dark.',
			manifestation:
				"A translucent figure kneeling at a grave, shoulders heaving silently. It does not acknowledge being watched. If approached, it vanishes at arm's reach — but the grave it knelt before is always warm to the touch.",
			resolution:
				'Identifying whose grave it visits and completing whatever was left undone: a message undelivered, a debt unpaid, a name that needs to be spoken aloud at the right stone.'
		},
		{
			type: 'The Lighted Window',
			trigger:
				'The chapel window glows from inside between midnight and the third hour, despite no light source within.',
			manifestation:
				'The light is pale gold, steady, and casts no shadow. Creatures who enter the chapel during this period find it empty but hear clearly the sound of a quill on parchment. The sound stops the moment it is acknowledged.',
			resolution:
				'Placing an unfinished document — any document — on the altar. The next morning it will be completed in a hand not belonging to anyone currently living.'
		},
		{
			type: 'The Wrong Footprints',
			trigger:
				'On nights following rainfall, footprints appear in the mud leading from a specific grave to the gate — and back — with no prints going from the gate to the grave.',
			manifestation:
				"The prints are bare, adult-sized, and the correct depth for a living person. They circle the keeper's lodge twice before returning to the grave. The keeper claims not to notice them.",
			resolution:
				'Following the path in reverse — from the gate to the grave — at the right time, and waiting. Something is trying to leave and has not worked out the order yet.'
		},
		{
			type: 'The Repeating Bell',
			trigger:
				'A bell that no longer physically exists rings three times at irregular intervals — sometimes during the day, sometimes not for weeks.',
			manifestation:
				'The sound is coming from underground. A DC 14 Perception check locates the origin to a point beneath the bone gallery. Excavating there reveals a sealed room not on any plan, with a cracked bell inside and no other contents.',
			resolution:
				'Removing the bell from the site stops the ringing. It has not been removed because every person who has lifted it reports the same thing: it is heavier than it looks, and it pulls toward the old barrow.'
		},
		{
			type: 'The Warm Grave',
			trigger:
				'One specific grave is always warm — even in deep winter, the stone is blood temperature.',
			manifestation:
				'Plants grow faster around it. Small animals sleep on it. On the night of a new moon, the soil loosens without cause. Nothing has ever emerged, but the soil is looser each cycle.',
			resolution:
				'The occupant is not dead — not fully. A Remove Curse or Speak with Dead reveals that something was done to them before burial that keeps them in suspension. Whatever was done can be undone, for good or ill.'
		},
		{
			type: 'The Missing Hour',
			trigger:
				'Creatures who spend more than an hour in the catacombs lose exactly thirty minutes they cannot account for.',
			manifestation:
				'No memory of the gap. Equipment is sometimes rearranged. Written notes made during the period contain fragments of text in no one\'s handwriting. The text is always the same phrase, in an old dialect: "You were seen."',
			resolution:
				'The source is a fragment of consciousness stored in the stone of the catacomb walls — an ancient warding intelligence that observed visitors and recorded them. It can be communicated with, bargained with, or dispelled.'
		},
		{
			type: 'The Calling Name',
			trigger:
				'At least one visitor per week hears their own name spoken clearly in a familiar voice somewhere in the grounds — a voice belonging to someone they know to be dead.',
			manifestation:
				'The voice is accurate: tone, accent, and manner of address match how the dead person spoke. The words that follow the name vary but always end with a location within the graveyard. No one has followed the instruction to the end.',
			resolution:
				'Following the voice to its named location and responding. The source is a residual emotional echo — not intelligent, not malicious — that needs acknowledgment to dissipate. What is found at the location depends on who is calling.'
		},
		{
			type: 'The Second Shadow',
			trigger: 'Some visitors acquire a second shadow that does not match their movements.',
			manifestation:
				'The second shadow behaves like a person following two steps behind. It mimics movement imperfectly — slightly slower, occasionally making gestures the caster is not making. It vanishes outside the graveyard gates and reappears on return.',
			resolution:
				'The shadow belongs to a spirit attached to the creature by proximity to a specific grave they unknowingly walked near. Returning to that grave and speaking the name carved on it aloud releases the attachment.'
		},
		{
			type: 'The Open Grave',
			trigger:
				'Every three to four weeks, a grave in the common rows opens overnight — soil piled neatly beside it, the interior empty.',
			manifestation:
				'The grave opened is always different. The coffin, if present, is intact and unoccupied. There is no sign of entry or exit. The keeper fills it in by morning and says nothing. It has happened nineteen times.',
			resolution:
				'The graves being opened are not random — they form a pattern that, mapped over time, traces a symbol across the cemetery grounds. Completing the symbol — or disrupting it — changes what happens next, but something will happen.'
		},
		{
			type: "The Child's Game",
			trigger:
				'At dusk, the sound of a child counting — slowly, methodically — can be heard throughout the grounds.',
			manifestation:
				"The counting always starts at one. It has never, in anyone's hearing, reached a final number. The voice is not distressed. Creatures who count along silently report that the number they reach corresponds to a specific grave.",
			resolution:
				'Going to the corresponding grave at the moment the counting stops. What is needed there varies — some need an offering, some need a name spoken, one reportedly needed a specific lullaby sung once all the way through.'
		},
		{
			type: 'The Pale Procession',
			trigger:
				'On the anniversary of a large historical burial — the plague year, a battle, a fire — a procession of pale figures moves through the grounds in silence.',
			manifestation:
				'They are visible but not solid. They carry nothing. They do not acknowledge the living. They move to the mass grave at the center, stand in a circle for exactly one minute, and vanish. Anyone who steps into the circle during that minute does not vanish — but cannot move until it ends.',
			resolution:
				'The procession is a memory, not a haunting. It requires nothing. However, the one minute of forced stillness it creates is exactly long enough to hear something speaking from below the mass grave — if anyone is listening.'
		},
		{
			type: 'The Annotated Headstones',
			trigger:
				'Each dawn, several gravestones have been inscribed during the night — new text added to existing epitaphs.',
			manifestation:
				'The additions are in a consistent script, deeply carved despite no sound being heard. The new text always describes events that happened the previous day — accurately, from a perspective that was watching. The inscriptions cannot be removed.',
			resolution:
				'The author is a bound spirit tasked to record all events within the graveyard walls. It cannot be bargained with — it was bound to record, not to stop. But the one who bound it is also buried here, and their binding is encoded in the first inscription they ever made.'
		}
	];

	// ── Treasure Hooks ────────────────────────────────────────────────────────────
	interface TreasureHookEntry {
		summary: string;
		location: string;
		contents: string;
		complication: string;
	}

	const TREASURE_POOL: TreasureHookEntry[] = [
		{
			summary: "The Judge's Bribe Chest",
			location: "Buried beneath the Hanged Judge's coffin, accessible from the grave's north side",
			contents:
				'400 gp in mixed coin, a ledger of names and payments, two uncut gemstones used as weights',
			complication:
				'The names in the ledger are prominent. At least two are still alive. The moment the chest leaves the grave, someone already knows — the Judge arranged for it.'
		},
		{
			summary: "The Cartographer's Maps",
			location: 'Sealed in an oilskin tube inside the coffin of Mira Saltwood',
			contents:
				'Three detailed maps of routes through terrain currently considered impassable. One includes annotations in a second hand — someone added to them after she supposedly died.',
			complication:
				'The second annotator is also in this graveyard. Their addition describes a location that cannot be reached without both halves of the information.'
		},
		{
			summary: "The Architect's Inner Chamber",
			location:
				"Accessible through a mechanism inside the architect's outer tomb — a stone that turns, not a door that opens",
			contents:
				"The architect's personal design journals, a small chest of tools that appear enchanted, and a second will superseding the filed one",
			complication:
				'The second will changes the inheritance of a significant property. The current owners are a well-resourced family who have already lost one challenge to the will and will not lose another quietly.'
		},
		{
			summary: "The Soldier's Account",
			location: "Folded inside Sergeant Brek Holt's uniform coat, buried with him",
			contents:
				"A first-person account of a military atrocity covered up as a victory. Names twelve officers. Written in his wife's hand from his dictation. Notarized by a traveling clerk.",
			complication:
				'Two of the twelve named officers are still alive and in positions of power. They have known about this document for years and have made three attempts to retrieve it through legitimate means. The next attempt will not be legitimate.'
		},
		{
			summary: "The Merchant's Ledger",
			location: 'Wrapped in waxed cloth and tucked under the coffin of the Merchant With No Stone',
			contents:
				'Thirty years of undisclosed transactions. Three blackmail arrangements that are still technically active. The location of a warehouse never registered with city authorities.',
			complication:
				"The warehouse is still in use. Someone has been paying maintenance fees through a proxy for twenty years. They don't know the ledger exists. Yet."
		},
		{
			summary: 'The Sealed Vault Contents',
			location: 'Behind the warded door in the oldest structure on the grounds',
			contents:
				'Whatever was placed here was sealed with intent. The space contains three locked coffers, a set of religious vestments from a dissolved order, and something wrapped in canvas that moves occasionally.',
			complication:
				'The ward on the door was not placed to keep people out. It was placed to keep whatever is inside from leaving at will. Opening the door is the decision; what to do next is the harder one.'
		},
		{
			summary: "The Keeper's Locked Chest",
			location: "Under the bed in the keeper's lodge — heavier than it looks",
			contents:
				'Three decades of accumulated payments, offerings, and "finder\'s fees." Eighty years of private burial records the keeper kept separately from official ones. A list of graves that are not in the public register.',
			complication:
				'The keeper knows every secret this place holds and has leveraged most of them. The chest is the evidence. Taking it makes you the next party the keeper decides to leverage.'
		},
		{
			summary: "The Poet's Final Manuscript",
			location:
				"Placed inside the lid of Dusk Wren's coffin, attached with pins — not at the bottom",
			contents:
				'The complete final work. Twelve cantos. The final canto contains an accusation — specific, named, documented — that the poet could not publish in life.',
			complication:
				"The accused is a patron of the arts who funded the poet's early career and funded the funeral. He has been waiting for someone to find this. He intends to be present when they leave the graveyard."
		}
	];

	// ── Recent Events ─────────────────────────────────────────────────────────────
	const RECENT_EVENTS = [
		'A grave was opened from the inside three nights ago. The coffin was undisturbed. The occupant was not in it.',
		'A traveling priest refused to enter the grounds after one look and left without explanation.',
		"The keeper found a fresh grave dug in the potter's field — unmarked, filled in, no record of a burial.",
		"A family arrived to inter a relative and found the plot they'd purchased already occupied.",
		'Every candle in the chapel lit simultaneously at midnight and burned for exactly one hour.',
		'Soil samples taken by a city engineer came back flagged for contamination of unknown origin.',
		'A known grave robber was found inside the gates in the morning, unharmed but unable to speak for three days.',
		'The oldest readable headstone now reads something different than it did last month. The old text is gone.',
		'A child followed an "old man" into the graveyard; the child returned alone and calm. There was no old man.',
		'The iron bell by the gate rang on its own for the first time in forty years. The clapper was removed in 1287.'
	];

	// ── Rumors ────────────────────────────────────────────────────────────────────
	const RUMORS = [
		'The keeper has been accepting payment to show certain graves to certain visitors after dark. Nobody local is paying.',
		'Something in the sealed vault has been trying the door from inside — the ward is holding, but the stone around it is cracking.',
		'The grave of the Hanged Judge is avoided by every cat and dog in the district, without exception.',
		'Three separate visitors in the last month reported seeing an elderly woman walking between the graves who was not the keeper and left no footprints.',
		'A section of the catacombs has been walled off recently — new mortar, fresh stone. No one asked the keeper about it.',
		'The graveyard has a charter protection preventing construction within fifty feet. Someone recently made an offer to buy that protection out. The keeper refused. The offer was made again, less politely.',
		'One grave near the back has been freshly tended every week for six years. The person buried there has no living relatives.',
		"The barrow at the north end isn't sealed — it's locked. From the inside.",
		'A page from the public burial register is missing. The gap corresponds to a specific three-week period four years ago.',
		"Something in the bone gallery has rearranged itself. The keeper says it looks intentional but can't explain the purpose."
	];

	// ── Generation ────────────────────────────────────────────────────────────────
	function generateGraveyard(): GraveyardData {
		const baseSeed = hashSeed(`graveyard_${partySize}_${partyLevel}`, seed);
		const tier = partyLevel <= 4 ? 1 : partyLevel <= 8 ? 2 : partyLevel <= 12 ? 3 : 4;

		// Site type — higher tiers favour crypts and catacombs
		const typesByTier: Record<number, SiteType[]> = {
			1: ['Graveyard', 'Graveyard', 'Graveyard', 'Barrow', 'Ossuary'],
			2: ['Graveyard', 'Graveyard', 'Crypt', 'Crypt', 'Barrow'],
			3: ['Crypt', 'Crypt', 'Catacomb', 'Catacomb', 'Ossuary'],
			4: ['Catacomb', 'Catacomb', 'Catacomb', 'Crypt', 'Ossuary']
		};
		const siteType = pick(typesByTier[tier], mkRng(hashSeed('type', baseSeed)));

		// Name
		const namePre = pick(SITE_NAME_PRE, mkRng(hashSeed('npre', baseSeed)));
		const nameSuf = pick(SITE_NAME_SUF[siteType], mkRng(hashSeed('nsuf', baseSeed)));
		const siteName = `${namePre} ${nameSuf}`;

		// Condition
		const conditions: Condition[] = [
			'Pristine',
			'Maintained',
			'Maintained',
			'Neglected',
			'Neglected',
			'Ruined',
			'Desecrated'
		];
		const condition = pick(conditions, mkRng(hashSeed('cond', baseSeed)));

		const age = pick(AGES, mkRng(hashSeed('age', baseSeed)));

		// Keeper — 75% chance
		const keeperRng = mkRng(hashSeed('keeper', baseSeed));
		const keeperName =
			keeperRng() < 0.75 ? pick(KEEPER_NAMES, mkRng(hashSeed('kname', baseSeed))) : null;
		const keeperNote = pick(KEEPER_NOTES, mkRng(hashSeed('knote', baseSeed)));

		const atmosphere = pick(ATMOSPHERES, mkRng(hashSeed('atm', baseSeed)));

		// Layout — scales with party size (4 base + 1 extra for larger groups)
		const numSections = partySize >= 6 ? 5 : 4;
		const layoutSections = shuffle(LAYOUT_POOL, mkRng(hashSeed('layout', baseSeed))).slice(
			0,
			numSections
		);

		// Notable graves — scales with party size and tier
		const numGraves = Math.min(
			GRAVE_POOL.length,
			Math.max(3, Math.floor(partySize / 2) + tier - 1)
		);
		const notableGraves = shuffle(GRAVE_POOL, mkRng(hashSeed('graves', baseSeed))).slice(
			0,
			numGraves
		);

		// Haunts — scales with tier (higher = more dangerous hauntings)
		const numHaunts = Math.min(HAUNT_POOL.length, tier + 1);
		const haunts = shuffle(HAUNT_POOL, mkRng(hashSeed('haunts', baseSeed))).slice(0, numHaunts);

		// Treasure hooks — scales with tier (more loot at higher levels)
		const numTreasure = Math.min(TREASURE_POOL.length, tier >= 3 ? 3 : 2);
		const treasureHooks = shuffle(TREASURE_POOL, mkRng(hashSeed('treasure', baseSeed))).slice(
			0,
			numTreasure
		);

		const recentEvent = pick(RECENT_EVENTS, mkRng(hashSeed('event', baseSeed)));
		const rumor = pick(RUMORS, mkRng(hashSeed('rumor', baseSeed)));

		return {
			siteName,
			siteType,
			condition,
			age,
			keeper: keeperName,
			keeperNote,
			atmosphere,
			layoutSections,
			notableGraves,
			haunts,
			treasureHooks,
			recentEvent,
			rumor
		};
	}

	function randomize() {
		seed = Math.floor(Math.random() * 1_000_000_000);
	}

	// ── Save / Load ───────────────────────────────────────────────────────────────
	interface SavedSite {
		id: string;
		name: string;
		partySize: number;
		partyLevel: number;
		seed: number;
		savedAt: number;
	}
	const SITES_KEY = 'initiative_saved_graveyards';
	let savedSites = $state<SavedSite[]>([]);
	if (typeof window !== 'undefined') {
		try {
			savedSites = JSON.parse(localStorage.getItem(SITES_KEY) ?? '[]');
		} catch {
			savedSites = [];
		}
	}
	function saveSite() {
		const entry: SavedSite = {
			id: crypto.randomUUID(),
			name: graveyardData?.siteName ?? 'Unknown Site',
			partySize,
			partyLevel,
			seed,
			savedAt: Date.now()
		};
		savedSites = [entry, ...savedSites].slice(0, 20);
		localStorage.setItem(SITES_KEY, JSON.stringify(savedSites));
	}
	function deleteSite(id: string) {
		savedSites = savedSites.filter((s) => s.id !== id);
		localStorage.setItem(SITES_KEY, JSON.stringify(savedSites));
	}
	function applySite(s: SavedSite) {
		partySize = s.partySize ?? 4;
		partyLevel = s.partyLevel ?? 1;
		seed = s.seed;
	}

	// ── Expand state ──────────────────────────────────────────────────────────────
	let expandedHaunts = $state<Set<number>>(new Set());
	function toggleHaunt(i: number) {
		if (expandedHaunts.has(i)) expandedHaunts.delete(i);
		else expandedHaunts.add(i);
		expandedHaunts = new Set(expandedHaunts);
	}

	let expandedTreasure = $state<Set<number>>(new Set());
	function toggleTreasure(i: number) {
		if (expandedTreasure.has(i)) expandedTreasure.delete(i);
		else expandedTreasure.add(i);
		expandedTreasure = new Set(expandedTreasure);
	}

	// ── Color maps ────────────────────────────────────────────────────────────────
	const TYPE_COLORS: Record<SiteType, string> = {
		Graveyard: 'bg-gray-700 text-gray-300',
		Crypt: 'bg-indigo-900/50 text-indigo-300',
		Catacomb: 'bg-purple-900/50 text-purple-300',
		Barrow: 'bg-amber-900/50 text-amber-300',
		Ossuary: 'bg-rose-900/50 text-rose-300'
	};

	const CONDITION_COLORS: Record<Condition, string> = {
		Pristine: 'bg-green-900/50 text-green-300',
		Maintained: 'bg-blue-900/50 text-blue-300',
		Neglected: 'bg-yellow-900/50 text-yellow-400',
		Ruined: 'bg-orange-900/50 text-orange-400',
		Desecrated: 'bg-red-900/60 text-red-400'
	};

	$effect(() => {
		partySize;
		partyLevel;
		seed;
		graveyardData = generateGraveyard();
		expandedHaunts = new Set();
		expandedTreasure = new Set();
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
				<h2 class="text-lg font-bold tracking-wide text-amber-300">Graveyard / Crypt Generator</h2>
				{#if graveyardData}
					<span class="text-xs text-gray-500">{graveyardData.siteName}</span>
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

	<div class="relative flex min-h-0 flex-1 overflow-hidden">
		<!-- Left panel -->
		<div
			class="hidden w-56 shrink-0 flex-col gap-5 overflow-y-auto border-r border-gray-800 bg-gray-900/60 p-4 sm:flex"
		>
			<button
				onclick={randomize}
				class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
			>
				Generate New Site
			</button>

			{#if graveyardData}
				<button
					onclick={saveSite}
					class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
				>
					Save Site
				</button>
			{/if}

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
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
					<span class="min-w-[2rem] text-center text-sm font-bold text-gray-100">{partySize}</span>
					<button
						onclick={() => (partySize = Math.min(8, partySize + 1))}
						class="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-gray-300 transition hover:bg-gray-600"
						aria-label="Increase party size"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
								clip-rule="evenodd"
							/>
						</svg>
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
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
					<span class="min-w-[2rem] text-center text-sm font-bold text-gray-100">{partyLevel}</span>
					<button
						onclick={() => (partyLevel = Math.min(20, partyLevel + 1))}
						class="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-gray-300 transition hover:bg-gray-600"
						aria-label="Increase party level"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</div>
			</div>

			{#if savedSites.length}
				<div class="flex flex-col gap-1.5">
					<span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
						>Saved Sites</span
					>
					<div class="flex max-h-64 flex-col gap-1 overflow-y-auto">
						{#each savedSites as s (s.id)}
							<div class="flex items-center gap-1 rounded bg-gray-800/80 px-2 py-1.5">
								<button
									onclick={() => applySite(s)}
									class="min-w-0 flex-1 truncate text-left text-xs text-gray-200 hover:text-amber-400"
									title={s.name}>{s.name}</button
								>
								<button
									onclick={() => deleteSite(s.id)}
									class="shrink-0 text-[11px] leading-none text-gray-600 hover:text-red-400"
									aria-label="Delete">✕</button
								>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Right panel -->
		<div class="min-w-0 flex-1 overflow-y-auto p-5">
			{#if graveyardData}
				<!-- Banner -->
				<div class="mb-6 rounded-xl border border-gray-700 bg-gray-800/60 p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<div class="flex flex-wrap items-baseline gap-2">
								<h2 class="text-2xl font-bold tracking-wide text-white">
									{graveyardData.siteName}
								</h2>
								<span
									class="rounded px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase {TYPE_COLORS[
										graveyardData.siteType
									]}">{graveyardData.siteType}</span
								>
								<span
									class="rounded px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase {CONDITION_COLORS[
										graveyardData.condition
									]}">{graveyardData.condition}</span
								>
							</div>
							<p class="mt-1 text-xs text-gray-500">{graveyardData.age}.</p>
						</div>
						<div class="flex items-center gap-2 text-[11px] text-gray-500">
							<span>{partySize} players</span>
							<span>·</span>
							<span>Level {partyLevel}</span>
							<span>·</span>
							<span class="font-semibold text-gray-400"
								>Tier {partyLevel <= 4 ? 1 : partyLevel <= 8 ? 2 : partyLevel <= 12 ? 3 : 4}</span
							>
						</div>
					</div>
					{#if graveyardData.keeper}
						<p class="mt-2 text-xs text-gray-400">
							<span class="text-gray-600">Keeper:</span>
							<span class="font-semibold text-gray-200">{graveyardData.keeper}</span>
							— <span class="italic">{graveyardData.keeperNote}.</span>
						</p>
					{:else}
						<p class="mt-2 text-xs text-gray-600 italic">No keeper. The site is untended.</p>
					{/if}
					<p class="mt-2 text-xs text-gray-400 italic">{graveyardData.atmosphere}</p>
				</div>

				<div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
					<!-- Layout -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-amber-500 uppercase">Layout</h3>
						<div class="flex flex-col gap-2">
							{#each graveyardData.layoutSections as section}
								<div class="rounded-lg border border-gray-700/50 bg-gray-900/40 px-3 py-2">
									<p class="mb-0.5 text-sm font-semibold text-gray-100">{section.name}</p>
									<p class="mb-1 text-[11px] text-gray-500 italic">{section.description}</p>
									<p class="text-xs leading-snug text-gray-400">{section.detail}</p>
								</div>
							{/each}
						</div>
					</div>

					<!-- Notable Graves -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-amber-500 uppercase">
							Notable Graves
						</h3>
						<div class="flex flex-col gap-2">
							{#each graveyardData.notableGraves as grave}
								<div class="rounded-lg border border-gray-700/50 bg-gray-900/40 px-3 py-2">
									<p class="mb-0.5 text-sm font-semibold text-gray-100">{grave.name}</p>
									<p class="mb-1 text-[11px] text-amber-400/80 italic">{grave.epitaph}</p>
									<p class="mb-1 text-xs text-gray-500">{grave.who}</p>
									<p class="text-[11px] leading-snug text-gray-400">{grave.hook}</p>
								</div>
							{/each}
						</div>
					</div>

					<!-- Haunts -->
					<div class="rounded-xl border border-purple-900/30 bg-purple-950/10 p-4">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-purple-400 uppercase">Haunts</h3>
						<div class="flex flex-col gap-2">
							{#each graveyardData.haunts as haunt, i}
								{@const open = expandedHaunts.has(i)}
								<div class="rounded-lg border border-gray-700/50 bg-gray-900/40 px-3 py-2">
									<button
										class="flex w-full items-start justify-between gap-2 text-left"
										onclick={() => toggleHaunt(i)}
									>
										<div>
											<p class="text-sm font-bold text-purple-300">{haunt.type}</p>
											<p class="text-[11px] text-gray-500 italic">{haunt.trigger}</p>
										</div>
										<span class="mt-1 shrink-0 text-gray-600">{open ? '▲' : '▼'}</span>
									</button>
									{#if open}
										<div class="mt-2 space-y-2 border-t border-gray-700/50 pt-2">
											<p class="text-xs leading-relaxed text-gray-300">{haunt.manifestation}</p>
											<div class="rounded bg-green-950/40 px-2 py-1.5">
												<p
													class="mb-0.5 text-[10px] font-semibold tracking-wider text-green-400 uppercase"
												>
													Resolution
												</p>
												<p class="text-xs leading-relaxed text-gray-400 italic">
													{haunt.resolution}
												</p>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<!-- Treasure Hooks -->
					<div class="rounded-xl border border-amber-900/30 bg-amber-950/10 p-4">
						<h3 class="mb-3 text-xs font-bold tracking-widest text-amber-400 uppercase">
							Buried Treasure Hooks
						</h3>
						<div class="flex flex-col gap-2">
							{#each graveyardData.treasureHooks as hook, i}
								{@const open = expandedTreasure.has(i)}
								<div class="rounded-lg border border-gray-700/50 bg-gray-900/40 px-3 py-2">
									<button
										class="flex w-full items-start justify-between gap-2 text-left"
										onclick={() => toggleTreasure(i)}
									>
										<p class="text-sm font-bold text-amber-300">{hook.summary}</p>
										<span class="mt-1 shrink-0 text-gray-600">{open ? '▲' : '▼'}</span>
									</button>
									{#if open}
										<div class="mt-2 space-y-1.5 border-t border-gray-700/50 pt-2">
											<p class="text-[11px] text-gray-500 italic">{hook.location}.</p>
											<p class="text-xs leading-relaxed text-gray-300">{hook.contents}.</p>
											<div class="rounded bg-red-950/40 px-2 py-1.5">
												<p
													class="mb-0.5 text-[10px] font-semibold tracking-wider text-red-400 uppercase"
												>
													Complication
												</p>
												<p class="text-xs leading-relaxed text-gray-400 italic">
													{hook.complication}
												</p>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<!-- Recent Event & Rumor -->
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
							Recent Event
						</h3>
						<p class="text-sm leading-relaxed text-gray-300">{graveyardData.recentEvent}</p>
					</div>

					<div class="rounded-xl border border-indigo-900/30 bg-indigo-950/10 p-4">
						<h3 class="mb-2 text-xs font-bold tracking-widest text-indigo-400 uppercase">
							Local Rumor
						</h3>
						<p class="text-sm leading-relaxed text-gray-300 italic">{graveyardData.rumor}</p>
					</div>
				</div>

				<!-- Mobile regenerate -->
				<div class="mt-6 flex gap-3 sm:hidden">
					<button
						onclick={randomize}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						New Site
					</button>
					<button
						onclick={saveSite}
						class="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-amber-600 hover:text-amber-400"
					>
						Save
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
