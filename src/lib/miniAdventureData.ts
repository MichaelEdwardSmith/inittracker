// Tables for the hidden "Mini Adventure" easter egg (click the clock on the DM dashboard).
// Pure data: no state, no server. The modal rolls on these to walk a DM through a 5-10 minute
// solo adventure. Placeholders in text: {hero} {patron} {place} {object} {villain}.

export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export const ABILITY_LABEL: Record<Ability, string> = {
	str: 'STR',
	dex: 'DEX',
	con: 'CON',
	int: 'INT',
	wis: 'WIS',
	cha: 'CHA'
};

export interface HeroClass {
	name: string;
	blurb: string;
	hitDie: number;
	/** Ability scores from highest to lowest priority; rolled scores are sorted into this order. */
	priority: Ability[];
	/** Two abilities the class is proficient in (+2 on checks). */
	proficient: [Ability, Ability];
	ac: number;
	attackAbility: Ability;
	dmgDie: number;
	attackVerb: string;
	/** Once-per-adventure move: auto-hit for sigDice damage dice in combat, or advantage on a check. */
	signature: { name: string; text: string };
	sigDice: number;
	gear: string[];
}

export const CLASSES: HeroClass[] = [
	{
		name: 'Barbarian',
		blurb: 'Hits things. Then hits them again.',
		hitDie: 12,
		priority: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
		proficient: ['str', 'con'],
		ac: 14,
		attackAbility: 'str',
		dmgDie: 12,
		attackVerb: 'swings a greataxe at',
		signature: {
			name: 'Rage',
			text: 'roars, eyes going red, and hits with the force of a falling barn'
		},
		sigDice: 3,
		gear: [
			'a greataxe with a name carved in it',
			'two handaxes',
			'a fur cloak of questionable origin'
		]
	},
	{
		name: 'Bard',
		blurb: 'Talks, sings, and stabs, usually in that order.',
		hitDie: 8,
		priority: ['cha', 'dex', 'con', 'wis', 'int', 'str'],
		proficient: ['cha', 'dex'],
		ac: 13,
		attackAbility: 'dex',
		dmgDie: 8,
		attackVerb: 'lunges with a rapier at',
		signature: { name: 'Vicious Mockery', text: 'delivers an insult so cutting it leaves a mark' },
		sigDice: 3,
		gear: [
			'a rapier',
			'a lute with one emergency string',
			'a stack of fan letters, all from the same fan'
		]
	},
	{
		name: 'Cleric',
		blurb: 'Divine power, sensible armor, and mild disapproval.',
		hitDie: 8,
		priority: ['wis', 'con', 'str', 'cha', 'dex', 'int'],
		proficient: ['wis', 'con'],
		ac: 17,
		attackAbility: 'wis',
		dmgDie: 8,
		attackVerb: 'calls down a radiant flame on',
		signature: { name: 'Divine Smite', text: 'channels a blinding shaft of holy light' },
		sigDice: 3,
		gear: ['a mace', 'a silver holy symbol', 'a shield painted with a very confident sun']
	},
	{
		name: 'Druid',
		blurb: 'Nature on your side. Nature is not always polite.',
		hitDie: 8,
		priority: ['wis', 'con', 'dex', 'int', 'cha', 'str'],
		proficient: ['wis', 'int'],
		ac: 14,
		attackAbility: 'wis',
		dmgDie: 8,
		attackVerb: 'lashes with a thorned vine at',
		signature: {
			name: 'Call Lightning',
			text: 'points skyward and the heavens obligingly zap the foe'
		},
		sigDice: 3,
		gear: ['a carved quarterstaff', 'a pouch of acorns', 'a pet squirrel that refuses to be named']
	},
	{
		name: 'Fighter',
		blurb: 'Reliable, sturdy, and very good at the main thing.',
		hitDie: 10,
		priority: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
		proficient: ['str', 'con'],
		ac: 17,
		attackAbility: 'str',
		dmgDie: 10,
		attackVerb: 'cuts down with a longsword at',
		signature: { name: 'Action Surge', text: 'finds a second wind and a third strike' },
		sigDice: 3,
		gear: [
			'a longsword',
			'chain mail, dented in flattering places',
			'a shield with a heraldic goose'
		]
	},
	{
		name: 'Monk',
		blurb: 'Fists, feet, and unnerving calm.',
		hitDie: 8,
		priority: ['dex', 'wis', 'con', 'str', 'cha', 'int'],
		proficient: ['dex', 'wis'],
		ac: 15,
		attackAbility: 'dex',
		dmgDie: 8,
		attackVerb: 'strikes with a flurry of blows at',
		signature: {
			name: 'Stunning Strike',
			text: 'taps a pressure point and the world briefly stops for the foe'
		},
		sigDice: 3,
		gear: ['simple robes', 'a bamboo staff', 'a bowl you refuse to explain']
	},
	{
		name: 'Paladin',
		blurb: 'Sworn to something. Sworn at by everyone else.',
		hitDie: 10,
		priority: ['str', 'cha', 'con', 'wis', 'dex', 'int'],
		proficient: ['wis', 'cha'],
		ac: 17,
		attackAbility: 'str',
		dmgDie: 10,
		attackVerb: 'strikes with a blessed blade at',
		signature: { name: 'Divine Smite', text: 'swings a sword wreathed in righteous fire' },
		sigDice: 3,
		gear: [
			'a blessed longsword',
			'plate armor, freshly polished',
			'a sacred oath, mostly memorized'
		]
	},
	{
		name: 'Ranger',
		blurb: 'Bow, beast, and a strong opinion about wolves.',
		hitDie: 10,
		priority: ['dex', 'wis', 'con', 'str', 'int', 'cha'],
		proficient: ['dex', 'wis'],
		ac: 15,
		attackAbility: 'dex',
		dmgDie: 8,
		attackVerb: 'looses an arrow at',
		signature: { name: "Hunter's Mark", text: 'whispers a promise, and the next arrow keeps it' },
		sigDice: 3,
		gear: ['a longbow', 'twenty arrows (nineteen if we are honest)', 'a cloak the color of a hedge']
	},
	{
		name: 'Rogue',
		blurb: 'Pockets full, conscience light.',
		hitDie: 8,
		priority: ['dex', 'int', 'con', 'cha', 'wis', 'str'],
		proficient: ['dex', 'int'],
		ac: 14,
		attackAbility: 'dex',
		dmgDie: 6,
		attackVerb: 'stabs with a shortsword at',
		signature: {
			name: 'Sneak Attack',
			text: 'slips from the shadows and finds the gap in the armor'
		},
		sigDice: 5,
		gear: ['two shortswords', "thieves' tools", 'a coin that always lands the way you need']
	},
	{
		name: 'Sorcerer',
		blurb: 'Born with power. Born without a manual.',
		hitDie: 6,
		priority: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
		proficient: ['cha', 'con'],
		ac: 12,
		attackAbility: 'cha',
		dmgDie: 10,
		attackVerb: 'hurls a bolt of raw fire at',
		signature: {
			name: 'Quickened Fireball',
			text: 'lets the magic off the leash, which is never advisable'
		},
		sigDice: 3,
		gear: ['a dagger for show', 'a crystal that hums when you lie', 'singed eyebrows']
	},
	{
		name: 'Warlock',
		blurb: 'A pact, a patron, and fine print.',
		hitDie: 8,
		priority: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
		proficient: ['wis', 'cha'],
		ac: 13,
		attackAbility: 'cha',
		dmgDie: 10,
		attackVerb: 'fires an eldritch beam at',
		signature: {
			name: 'Hex',
			text: 'calls in a favor from something that really does not like being called'
		},
		sigDice: 3,
		gear: [
			'a pact blade',
			'a book that whispers in the evenings',
			'a patron who is "totally fine, actually"'
		]
	},
	{
		name: 'Wizard',
		blurb: 'Reads a lot. Explodes things responsibly.',
		hitDie: 6,
		priority: ['int', 'con', 'dex', 'wis', 'cha', 'str'],
		proficient: ['int', 'wis'],
		ac: 12,
		attackAbility: 'int',
		dmgDie: 10,
		attackVerb: 'fires a crackling bolt of fire at',
		signature: { name: 'Fireball', text: 'speaks one word, and the room becomes a stove' },
		sigDice: 3,
		gear: [
			'a quarterstaff',
			'a spellbook held shut with a belt',
			'a pocket full of bat guano (do not ask)'
		]
	}
];

// ── Hero flavor ──────────────────────────────────────────────────────────────────────────────

export const FIRST_NAMES = [
	'Aldric',
	'Bramble',
	'Cedric',
	'Dara',
	'Elowen',
	'Fenwick',
	'Gwendolyn',
	'Hob',
	'Isolde',
	'Jorund',
	'Kessa',
	'Lorcan',
	'Mirela',
	'Nox',
	'Orla',
	'Pip',
	'Quill',
	'Rowan',
	'Sable',
	'Tamsin',
	'Ulric',
	'Vesper',
	'Wren',
	'Xander',
	'Ysolde',
	'Zephyr',
	'Brunhild',
	'Thistle',
	'Garrick',
	'Mabel',
	'Dorian',
	'Ember',
	'Finnian',
	'Hazel',
	'Ignatius',
	'Juniper',
	'Kellan',
	'Lyra',
	'Magnus',
	'Nessa',
	'Oswin',
	'Petra',
	'Rurik',
	'Seraphine',
	'Tobias',
	'Una',
	'Viktor',
	'Willa',
	'Yorick',
	'Zinnia'
];

export const SURNAMES = [
	'Ashgrove',
	'Brightwater',
	'Copperkettle',
	'Dunmere',
	'Evenfall',
	'Fogwhistle',
	'Greymantle',
	'Hollowbrook',
	'Ironbloom',
	'Jumblewick',
	'Kettleblack',
	'Lowtide',
	'Mossback',
	'Nightingale',
	'Oakenshield',
	'Pennywhistle',
	'Quickfoot',
	'Ravenscar',
	'Stonebottom',
	'Thornwick',
	'Underbough',
	'Vanterpool',
	'Whistlethorn',
	'Yarrowby',
	'Underhill',
	'Barrelchest',
	'Cinderfoot',
	'Dewdrop',
	'Emberlight',
	'Fairweather',
	'Goldleaf',
	'Highpeak',
	'Inkwell',
	'Longstride',
	'Muddyboots',
	'Nettlebed',
	'Oddfellow',
	'Proudfoot',
	'Rumblegut',
	'Sixpence'
];

export const QUIRKS = [
	'always hums while sneaking',
	'refuses to trust anyone who owns a hat',
	'names every weapon and mourns it when it breaks',
	'collects interesting rocks and has opinions about them',
	'is convinced a rival adventurer is secretly stalking them',
	'narrates their own heroics under their breath',
	'cannot resist pressing a suspicious button',
	'is terrified of chickens, for reasons they will not discuss',
	'tips every innkeeper far too generously',
	'talks to the dead, politely, and expects replies',
	'sleeps with one boot on, just in case',
	'keeps a ledger of every favor owed to them',
	'believes lucky socks are the only real armor',
	'quotes a cousin nobody has ever met',
	'insists on eating a proper breakfast before any battle',
	'greets every door with a small bow',
	'has never once been on time',
	'whittles tiny wooden ducks at tense moments',
	'is quietly famous in one village and unknown everywhere else',
	'treats every rat as a potential ally',
	'flinches at the sound of their own name when shouted',
	'owes money to someone dangerous, probably',
	'thinks all stew is good stew',
	'writes poetry about enemies before and after defeating them'
];

export const BACKGROUNDS = [
	'a retired bell-ringer who got bored',
	'a farmhand who found a sword in a turnip field',
	'a runaway noble with a fake mustache',
	'a former tax collector, now repenting',
	'a ship cook who survived three mutinies',
	'a temple acolyte who asked too many questions',
	'a caravan guard who lost the caravan',
	'a street performer with a dangerous following',
	'a disgraced apprentice, mostly unrepentant',
	'a hedge-witch’s nephew with a bad attitude',
	'a gravedigger with unsettlingly good hours',
	'a cartographer whose maps were always slightly wrong',
	'a bounty clerk who wanted to see the work firsthand',
	'a lighthouse keeper who left the light on',
	'a mercenary between contracts and between meals',
	'an exile from a town that no longer exists on maps'
];

export const POCKET_CURIOS = [
	'a tooth that glows faintly near lies',
	'a map to a place that has since moved',
	'a single glove, impossibly warm',
	'a key that fits no lock yet tried',
	'a tiny brass dragon that sometimes blinks',
	'a letter you were told never to open',
	'a bag of beans, slightly sentient',
	'a candle that burns blue in the presence of ghosts',
	'a coin from a kingdom nobody remembers',
	'a bottle of fog, corked',
	'a lock of someone else’s hair, labeled "DO NOT LOSE"',
	'a pair of dice that favor you, and resent it',
	'a pressed flower from a garden that is no longer there',
	'a mirror shard showing someone else’s reflection',
	'a ring that is clearly cursed but really comfortable',
	'a whistle that makes dogs sit and people uncomfortable',
	'a feather that always points toward the nearest bakery',
	'a small cheese, ancient and revered',
	'a compass that points to whatever you are avoiding',
	'a stub of chalk that draws very good doors'
];

// ── Adventure framing ────────────────────────────────────────────────────────────────────────

export const PATRONS = [
	'a harried mayor with a stress rash',
	'a retired adventurer with one eye and fewer scruples',
	'a nervous scholar in an overlarge hat',
	'a tavern keeper whose basement is "being weird"',
	'a duchess who speaks only through her butler',
	'a goblin trader with surprisingly good credit',
	'a traveling priest holding a very damp holy book',
	'a runaway page clutching a sealed letter',
	'an old witch who insists she is "just a baker"',
	'a captain of the watch who is tired of this nonsense',
	'a talking raven wearing a tiny medal',
	'a child with a map drawn in crayon and entirely accurate',
	'a ghost who is polite about it',
	'a gnome inventor covered in soot and optimism',
	'a dwarven brewer whose best barrel has gone missing',
	'a mysterious stranger who is actually a very ordinary man in a trench coat',
	'a merchant guild envoy with a leather-bound contract',
	'a drunken knight with a vision',
	'a pair of identical twins who finish each other’s sentences and disagree on everything else',
	'a small, stern turtle (it wears a badge)'
];

export const PLACES = [
	'the Sunken Chapel of Saint Gubbins',
	'the Ruins of Dunmarrow Keep',
	'the Whispering Mine',
	'the Hollow Hill',
	'a collapsed watchtower in the Marrowfen',
	'the Bone Orchard',
	'the Crooked Lighthouse at Gull’s End',
	'the Cellars of the Gilded Goose Inn',
	'an abandoned monastery in the Grey Peaks',
	'the Temple of the Forgotten Sundial',
	'a sewer-tunnel that is far too clean',
	'the Wyrmwood, where the trees are watching',
	'the Glass Caverns of Vael',
	'the haunted Brewery at the Edge of Town',
	'a drowned village at the bottom of Lake Sorrow',
	'the Floating Library of Quillhaven',
	'the Spiral Tower of Master Fenwright',
	'a roadside inn that was not there yesterday',
	'the Catacombs beneath the Market Square',
	'a bandit camp in a hollowed-out giant tree'
];

export const OBJECTS = [
	'the Silver Chalice of Ostrava',
	'a stolen royal crown (a bit bent)',
	'the Moonstone Egg',
	'a very important, very sealed letter',
	'a witch’s missing cat, Lord Whiskers',
	'the Blessed Ladle',
	'a sack of mislaid dragon scales',
	'the village’s missing prize goat',
	'a cursed music box that keeps humming',
	'the last page of a forbidden spellbook',
	'a lost heir, aged eleven, "definitely not lost"',
	'the Heartstone of the mountain',
	'a barrel of enchanted ale',
	'the Founder’s Seal',
	'a golden spoon that stirs by itself',
	'the key to the town’s clock tower',
	'a map to the real treasure',
	'a rare mushroom with a very bad reputation',
	'an enchanted lantern that refuses to go out',
	'a sword, humming, with feelings'
];

export const GOALS = [
	'{patron} begs you to retrieve {object} from {place}. {villain} took it, and also took the stairs.',
	'{patron} needs you to put an end to {villain}, who has set up in {place} and is "being a nuisance".',
	'{patron} has lost {object} somewhere in {place}. You volunteer. Maybe you were volunteered.',
	'Something is wrong at {place}. {patron} suspects {villain}, and has the muddy boot prints to prove it.',
	'{patron} offers gold, glory, and a decent lunch for the safe return of {object} from {place}.',
	'{villain} has been spotted near {place}, and {patron} would very much like you to do something about it.',
	'{patron} slides a crumpled map across the table: "{place}. {object}. Bring it back. No questions."',
	'The ground trembles, and {patron} arrives panting: "{villain} is at {place}. They have {object}!"'
];

export const HOOK_SCENES = [
	'Rain hammers the roof of the Gilded Goose as {hero} nurses a lukewarm drink.',
	'Market day, and {hero} is being chased by a very angry chicken when destiny calls.',
	'{hero} is mid-snack at a crossroads inn when the door bangs open.',
	'It is a perfectly quiet evening, which is how {hero} knows something is about to go wrong.',
	'{hero} wakes up in a haystack with a coin in each hand and a vague sense of purpose.',
	'The town bell tolls three times, then stops, embarrassed. {hero} looks up.',
	'{hero} is in the middle of an argument with a goat when someone clears their throat.',
	'A stranger spills a drink on {hero}, apologizes profusely, and turns out to be important.'
];

// ── Challenges ───────────────────────────────────────────────────────────────────────────────

export interface ChallengeOption {
	label: string;
	ability: Ability;
}
export interface Challenge {
	title: string;
	text: string;
	options: [ChallengeOption, ChallengeOption, ChallengeOption];
	win: string;
	lose: string;
}

function c(
	title: string,
	text: string,
	o1: [string, Ability],
	o2: [string, Ability],
	o3: [string, Ability],
	win: string,
	lose: string
): Challenge {
	return {
		title,
		text,
		options: [
			{ label: o1[0], ability: o1[1] },
			{ label: o2[0], ability: o2[1] },
			{ label: o3[0], ability: o3[1] }
		],
		win,
		lose
	};
}

/** Scene 2: trouble on the road to the adventure site. */
export const ROAD_EVENTS: Challenge[] = [
	c(
		'The Toll Troll',
		'A rope bridge spans a gorge. A smug goblin sits in the middle, holding a hand-lettered sign: TOLL, ONE (1) SECRET.',
		['Trade a secret you invented', 'cha'],
		['Dash across before it reacts', 'dex'],
		['Study the knots for a flaw', 'int'],
		'The goblin nods, satisfied, and lets you pass, muttering about "the good old days of extortion."',
		'The bridge sways, the goblin laughs, and you take a dunking in the river that ruins your dignity and your boots.'
	),
	c(
		'A Very Polite Ambush',
		'Four bandits step from the trees and ask if you have a moment to discuss your valuables. They have a pamphlet.',
		['Talk them out of it', 'cha'],
		['Show them how unwise this is', 'str'],
		['Spot their escape routes and cut them off', 'wis'],
		'The bandits apologize, hand back your purse (they had already taken it), and leave a business card.',
		'Things get rough. You come away lighter in purse, heavier in bruises, and slightly insulted by the pamphlet.'
	),
	c(
		'Fog of the Marrowfen',
		'A cold, clinging fog swallows the road. You hear someone calling your name from the wrong direction.',
		['Follow the sound of running water', 'wis'],
		['Tie a line and walk it out', 'int'],
		['Push through by sheer stubbornness', 'con'],
		'The fog gives up first. You step out onto the road with your boots dry and your pride intact.',
		'You wander in circles for an hour and finally stumble out soaked, sneezing, and one boot short.'
	),
	c(
		'Wagon Down',
		'A merchant’s wagon lies on its side across the road, a broken axle wheezing. The merchant is wailing about their cheese.',
		['Heave the wagon upright', 'str'],
		['Rig a lever from the busted axle', 'int'],
		['Calm the horses, then the merchant', 'wis'],
		'The wagon rights itself, the merchant weeps with joy, and presses a wheel of cheese into your hands.',
		'The wagon slips and you take the brunt of it. The cheese, sadly, does not survive.'
	),
	c(
		'The Singing Stones',
		'A ring of weathered stones hums an eerie, off-key tune. The road leads right through the middle.',
		['Hum the harmony until it stops', 'cha'],
		['Pick a careful path between them', 'dex'],
		['Work out what makes them sing', 'int'],
		'The stones fall silent, as if impressed. One of them even seems to bow.',
		'The stones shriek in four-part dissonance and send you reeling. Your ears ring for an hour.'
	),
	c(
		'Wolves, But Make It Rude',
		'A pack of wolves circles you. The biggest one looks you up and down, as if grading your outfit.',
		['Stare it down until it flinches', 'wis'],
		['Climb a tree. Immediately.', 'dex'],
		['Offer jerky and be diplomatic', 'cha'],
		'The pack loses interest, and the leader leaves with a look that says, "next time."',
		'A wolf snaps at your leg before you can react, and you limp along the road with nipped dignity.'
	),
	c(
		'Flooded Ford',
		'Last night’s storm swelled the river. The ford is chest-deep and quick, and the only way across is through.',
		['Swim for it', 'str'],
		['Hop across the exposed stones', 'dex'],
		['Find a shallower crossing upstream', 'wis'],
		'You cross dripping and triumphant. A passing duck acknowledges your effort.',
		'The current grabs you and drags you half a mile downstream before you scramble out, furious and soggy.'
	),
	c(
		'The Merchant of Questionable Goods',
		'A cheerful peddler waves you over, selling potions of "very probably healing." The labels are in crayon.',
		['Haggle for a real discount', 'cha'],
		['Inspect the stock for fakes', 'int'],
		['Sniff out which one is safe', 'wis'],
		'You walk away with a genuine bargain and a sense of smug satisfaction.',
		'You buy something that turns out to be vinegar and regret. The peddler is already gone.'
	),
	c(
		'A Fallen Tree, A Rude Fey',
		'A huge oak blocks the road. A very small, very smug fey sits on top, insisting it fell "of its own accord."',
		['Bargain with the fey', 'cha'],
		['Muscle the tree aside', 'str'],
		['Find the fey’s true name in the bark', 'int'],
		'The fey huffs, snaps its fingers, and the oak rolls over like a tired dog.',
		'The fey cackles and a branch whacks you in the shins. It really was a tree-first situation.'
	),
	c(
		'The Scarecrow Is Following You',
		'There is a scarecrow in the field to your left. It was in the field to your right ten minutes ago.',
		['Confront it directly', 'cha'],
		['Set a trap and wait', 'int'],
		['Outrun it', 'dex'],
		'The scarecrow stops, droops, and falls into a heap. You swear you hear it sigh with relief.',
		'The scarecrow lunges, rips your cloak, and vanishes in a flurry of straw. You are not sure what just happened.'
	),
	c(
		'Rockslide',
		'A rumble above, and then the hillside decides it would rather be elsewhere. Boulders are coming.',
		['Dive clear of the slide', 'dex'],
		['Brace and shield the others', 'con'],
		['Read the slope and run the safe way', 'wis'],
		'You emerge from the dust coughing but whole, with a brand-new boulder where the road used to be.',
		'A rock clips you hard. You come out of the dust with a story and a spectacular bruise.'
	),
	c(
		'The Pilgrim Who Won’t Stop Talking',
		'A cheerful pilgrim falls in beside you and begins an unbroken, three-hour monologue about turnips.',
		['Politely change the subject', 'cha'],
		['Endure it with a stone face', 'con'],
		['Slip away while they take a breath', 'dex'],
		'You part ways at the next fork, wiser about turnips and with no regrets.',
		'You hear the entire turnip saga. Your head throbs, but you do now know a lot about turnips.'
	),
	c(
		'Midnight Campfire',
		'You make camp, and something is watching from the dark with a pair of very large eyes.',
		['Light a bigger fire', 'int'],
		['Keep watch with sharp ears', 'wis'],
		['Stand and meet it with steel', 'str'],
		'Whatever it was decides you are more trouble than a meal and fades into the night.',
		'It darts in, steals your dinner, and leaves a claw mark on your arm for good measure.'
	),
	c(
		'The Riddling Gate',
		'A road gate with a stone face speaks: "Answer true, pass through. Answer false, learn to chew." Odd rules.',
		['Think carefully and answer', 'int'],
		['Charm the gate into skipping it', 'cha'],
		['Break the hinge when it blinks', 'str'],
		'The gate grumbles, swings open, and mumbles something about "clever ones."',
		'The gate decides you are wrong and spits a mouthful of gravel at you. You pass, but without grace.'
	)
];

/** Scene 3: a problem at the entrance of the adventure site. */
export const OBSTACLES: Challenge[] = [
	c(
		'The Pit of Mild Regret',
		'The corridor floor is a narrow ledge over a spiked pit. Someone has helpfully chalked "OOPS" on the wall.',
		['Edge across, balancing carefully', 'dex'],
		['Leap the whole gap', 'str'],
		['Spot the hidden pressure plate', 'wis'],
		'You cross without incident. The pit looks disappointed.',
		'You slip, catch the ledge, and haul yourself up with scrapes and a sharp reminder about chalk graffiti.'
	),
	c(
		'The Talking Door',
		'A large oak door with a face carved into it opens one eye. "Password?" it intones, then, "Never mind, I just like asking."',
		['Charm it with flattery', 'cha'],
		['Pick the lock behind its back', 'dex'],
		['Break it open and apologize', 'str'],
		'The door swings wide with a theatrical flourish. "Mind the draft!" it calls as you pass.',
		'The door slams a hinge on your fingers and spits a splinter. It cackles. You do not appreciate it.'
	),
	c(
		'Dart Trap Hallway',
		'The walls are pocked with tiny holes. The floor is covered in suspiciously neat dust.',
		['Roll through the corridor', 'dex'],
		['Study the dust pattern for a safe path', 'int'],
		['Tank it and walk straight', 'con'],
		'A volley of darts whistles past. You step out the other side, unharmed and smug.',
		'Three darts find their mark. The tips are mercifully unpoisoned, but the humiliation stings.'
	),
	c(
		'The Flooding Chamber',
		'The door slams shut behind you, and water starts pouring in from the walls. The room is filling fast.',
		['Find the drain mechanism', 'int'],
		['Force the door open', 'str'],
		['Hold your breath and swim to the vent', 'con'],
		'The water stops with a gurgle, and the door clicks open. You squelch onward, triumphant.',
		'You nearly drown before a lucky lever pull saves you. You emerge gasping, soaked, and a bit wiser.'
	),
	c(
		'Statues That Blink',
		'A hall of stone knights lines the walls. Their eyes follow you. Somehow, there are more of them than before.',
		['Keep your eyes on them and back away', 'wis'],
		['Run past and don’t look', 'dex'],
		['Smash the nearest to test a theory', 'str'],
		'Nothing moves. The statues stay put, and you suspect they are somewhat embarrassed.',
		'One lunges as you pass and clips you before freezing again. They are definitely playing a game.'
	),
	c(
		'The Rune-Locked Gate',
		'A glowing gate covered in runes blocks the way. The runes shift when you look away.',
		['Decipher the pattern', 'int'],
		['Feel for the weakness in the magic', 'wis'],
		['Argue with it until it gives up', 'cha'],
		'The runes align, the lock disengages, and you step through with the air of someone who "totally knew that."',
		'The runes flash and zap you with a stinging jolt. The gate remains smugly closed, then opens on its own.'
	),
	c(
		'Collapsing Floor',
		'Each step crumbles behind you. The far side is twenty feet away, and the gap widens.',
		['Sprint for it', 'dex'],
		['Leap and grab the far ledge', 'str'],
		['Find the stable stones by feel', 'wis'],
		'You land on the far side in a rain of dust and gravel, gasping but whole.',
		'You tumble through the floor and hit the lower level hard. You climb out, filthy and hurting.'
	),
	c(
		'The Ghostly Guard',
		'A translucent sentry blocks the stairwell, saluting you with a sword that is more of an idea than an object.',
		['Salute back, and explain yourself', 'cha'],
		['Push through its chill', 'con'],
		['Find a weakness in its patrol', 'int'],
		'The sentry nods, steps aside, and whispers, "Mind the third step."',
		'The ghost passes through you. You feel your heartbeat stall for a moment, and a deep, bone-aching chill sets in.'
	),
	c(
		'Webs, Floor to Ceiling',
		'The passage is choked with thick webbing. Something large is clearly not impressed with housekeeping.',
		['Burn or hack a path', 'str'],
		['Slip through the thinnest gaps', 'dex'],
		['Lure the owner away with a distraction', 'wis'],
		'You clear the webs and keep going. Behind you, something large mutters about vacuuming.',
		'The webs snag you, and the owner bites down as you struggle free. It sulks in the corner afterward.'
	),
	c(
		'The Slow Gas Leak',
		'A greenish gas seeps from cracks in the walls. The torches flicker blue. Your eyes begin to water.',
		['Hold your breath and push through', 'con'],
		['Find and seal the leak', 'int'],
		['Smell your way to the fresh air', 'wis'],
		'You clear the gas with a final, ragged breath. The torches flare orange again.',
		'You cough, retch, and stagger forward, eyes streaming. You will smell faintly of old eggs for days.'
	),
	c(
		'The Spinning Blades',
		'A corridor of whirring scythes swings from wall to wall. A nearby skeleton, mid-run, looks like a cautionary tale.',
		['Time your run perfectly', 'dex'],
		['Study the rhythm and find the gap', 'int'],
		['Wedge a pole in the gears', 'str'],
		'You slip through with a blade whistling past your ear. The skeleton almost seems to applaud.',
		'A scythe catches you across the shoulder. You press on, bleeding and annoyed.'
	),
	c(
		'The Gambling Gargoyle',
		'A stone gargoyle on a pedestal rattles a bone cup of dice. "A game," it rasps. "Win, and I let you pass."',
		['Play to win, fair and square', 'int'],
		['Bluff your way through', 'cha'],
		['Cheat, but subtly', 'dex'],
		'The dice favor you. The gargoyle grumbles, rolls aside, and opens the door.',
		'The gargoyle wins and smacks you with a stone fist for "being a poor sport." The dice are definitely loaded.'
	),
	c(
		'Mirror Maze',
		'A hall of dusty mirrors reflects a hundred of you, and not all of them are copying your movements.',
		['Ignore the reflections and trust your gut', 'wis'],
		['Smash the wrong mirrors', 'str'],
		['Pick out the real exit by logic', 'int'],
		'You walk out the far side, leaving a dozen glaring reflections behind.',
		'A reflection shoves you into a mirror. Glass sprays across your arms, and you finally find the exit, bruised.'
	),
	c(
		'The Locked Chest with Opinions',
		'A heavy chest sits in the corridor, locked. Every few seconds it clears its throat. "Not that way."',
		['Pick the lock', 'dex'],
		['Convince it you are trustworthy', 'cha'],
		['Pry the lid with brute force', 'str'],
		'The chest relents with a sigh. Inside, a spare key and a tiny note: "Good luck, you will need it."',
		'The chest bites. It really bites. Then it locks back up, gloating.'
	),
	c(
		'The Sleeping Giant Rat',
		'In the entrance hall, a rat the size of a pony snores, curled around a chewed-up shield. It stirs.',
		['Tiptoe around it', 'dex'],
		['Lull it back to sleep', 'wis'],
		['Stare it down and walk past', 'cha'],
		'The rat gives one great sniff and rolls over. You are in and out before it dreams again.',
		'It wakes, snaps, and takes a chunk out of your cloak and a nip from your calf. You escape, barely.'
	),
	c(
		'A Bridge of Bones',
		'The only path crosses a chasm on a narrow bridge of fused skeletons. Several of them are watching.',
		['Cross with steady feet', 'dex'],
		['Smash through the skeletons that wake', 'str'],
		['Ask the skeletons politely', 'cha'],
		'The skeletons seem to nod. You reach the other side without a single rattled bone.',
		'A skeletal arm yanks your ankle, and you drop, scrape, and crawl the rest of the way across.'
	)
];

/** Scene 5: something unexpected between the fight and the finale. */
export const TWISTS: Challenge[] = [
	c(
		'The Prisoner',
		'In a side cell, a disheveled stranger rattles the bars. "I can help! I know a secret way to the end!" They are very eager.',
		['Judge whether they are lying', 'wis'],
		['Pick the lock and drag them along', 'dex'],
		['Bargain for more than a secret route', 'cha'],
		'The prisoner is honest, and shows you a hidden passage. They scamper off with a grateful wave.',
		'The prisoner’s "secret way" is a trap. You escape, but not before it clips you hard.'
	),
	c(
		'The Wishing Well',
		'A small, glowing well sits in the middle of the next room. A sign reads: DO NOT WISH FOR THINGS. A coin dish sits nearby.',
		['Toss in a coin and wish carefully', 'cha'],
		['Inspect the well for tricks', 'int'],
		['Ignore it and keep going', 'wis'],
		'The water ripples warm, and you feel better. Not entirely cured of your woes, but sturdier.',
		'The well coughs up a cold spray and a nasty curse. You will be a little unlucky for a while.'
	),
	c(
		'The Lost Cartographer',
		'A cheerful gnome in a hat full of maps sits against a wall, mapping this very dungeon. "You are on page nine!"',
		['Trade stories for shortcuts', 'cha'],
		['Compare the map to the walls', 'int'],
		['Ask what the gnome has actually seen', 'wis'],
		'The gnome shares a shortcut and a flask of "map-making tonic." You press on refreshed.',
		'The map is wrong. You stumble into a hidden cellar and tumble down the stairs.'
	),
	c(
		'Betrayal at the Altar',
		'A robed figure kneels before an altar, humming. They turn: it is {patron}’s lost accomplice, who looks deeply, deeply embarrassed.',
		['Talk them down', 'cha'],
		['Seize them before they flee', 'str'],
		['Study their guilty hands', 'wis'],
		'The accomplice confesses everything and hands you a key. "I never wanted this," they sob.',
		'The accomplice flings a handful of acid-dust and bolts. You rub your eyes, hissing.'
	),
	c(
		'A Room Full of Doors',
		'There are exactly eleven doors in the next chamber. A small sign reads: "TEN OF THESE DOORS ARE A MISTAKE."',
		['Reason out which door is real', 'int'],
		['Listen at each door', 'wis'],
		['Kick down the most suspicious', 'str'],
		'You pick the right door on the first try and ignore the sound of the other ten sighing.',
		'You pick wrong. The door opens onto an indignant ogre in a bath. Awkward, painful, and a little steamy.'
	),
	c(
		'The Fey Bargain',
		'A shimmering figure steps from a mirror. "A trade," it purrs. "A little of your luck for a little of my aid."',
		['Haggle for better terms', 'cha'],
		['Decline and walk on', 'wis'],
		['Read the fine print in the air', 'int'],
		'You walk away with a boon and most of your luck intact. The fey sulks, impressed.',
		'The fey takes something small and important from you, and you feel strangely lighter in the worst way.'
	),
	c(
		'The Weeping Statue',
		'A marble statue of a knight weeps real tears. A puddle creeps toward your feet and starts to hiss.',
		['Comfort the statue', 'cha'],
		['Leap the spreading puddle', 'dex'],
		['Study the puzzle of its grief', 'int'],
		'The statue sniffles, smiles, and whispers where the final door waits. Your heart warms a little.',
		'The puddle is acid. Your boots smoke and your shins sting as you wade clear.'
	),
	c(
		'Cave-In, Again',
		'The ceiling groans. A familiar rumble. The way forward is half-buried in rubble, and the way back is worse.',
		['Dig through the rubble', 'str'],
		['Find a way up and around', 'dex'],
		['Spot the sturdy beam and brace it', 'wis'],
		'You break through into a clear tunnel, coughing dust but glad of the progress.',
		'The ceiling drops a chunk onto you before you finish. You crawl through, battered and stubborn.'
	),
	c(
		'The Banquet Table',
		'A great dining hall is set for a feast. Hot food steams in the middle. No one is here. Everything is delicious.',
		['Inspect for poison before eating', 'int'],
		['Eat anyway, because hunger', 'con'],
		['Sense something off about the food', 'wis'],
		'The feast is safe, and you fill up and rest for a few minutes. Excellent soup, honestly.',
		'The soup was a trap, naturally. You spend a grim stretch very ill, but you rally.'
	),
	c(
		'A Familiar Face',
		'A figure in the shadows steps forward, and it is {hero}. Or someone with {hero}’s exact face and a worse haircut.',
		['Out-think the doppelganger', 'int'],
		['Fight it down', 'str'],
		['Convince it you are the real one', 'cha'],
		'The doppelganger blinks, says "fair enough," and dissolves into smoke. You adjust your hair.',
		'The doppelganger lands a very personal blow. You get it back later, but it hurts, and the haircut insult stings too.'
	),
	c(
		'Library of Screaming Books',
		'Shelves of books scream when you walk past. One of them is yelling a very specific warning in your direction.',
		['Read the warning before it deafens you', 'int'],
		['Shush the books with authority', 'cha'],
		['Plow through with fingers in your ears', 'con'],
		'The warning is useful: the next corridor is trapped. You avoid it and feel pleased with yourself.',
		'The books shriek in unison. Your ears ring, and a heavy tome beans you for good measure.'
	),
	c(
		'The Honest Mimic',
		'A treasure chest in the corner has a note: "Not a mimic (promise)". The chest wiggles.',
		['Poke it with a stick', 'dex'],
		['Chat with it politely', 'cha'],
		['Open it with a hearty smack', 'str'],
		'The mimic admits to being a mimic, shares some actual gold, and you leave on friendly terms.',
		'The mimic chomps your arm and spits out a coin. "Fine," it grumbles, "that is the real one."'
	),
	c(
		'Spiral of Echoes',
		'A long spiral staircase repeats every word you say, but in a stranger voice. It starts to say things you have not said.',
		['Listen to the echoes carefully', 'wis'],
		['Climb up without speaking', 'dex'],
		['Shout back with confidence', 'cha'],
		'The echoes fade, and a distant voice murmurs "good luck." You climb into the quiet.',
		'The echoes build into a roar that rattles your teeth and shakes you to your knees.'
	)
];

// ── Monsters ─────────────────────────────────────────────────────────────────────────────────

export interface Foe {
	name: string;
	intro: string;
	hp: number;
	ac: number;
	attack: number;
	dmg: { n: number; d: number; b: number };
	defeat: string;
}

export const MONSTERS: Foe[] = [
	{
		name: 'Skeleton Warrior',
		intro:
			'A skeleton in rusted mail clatters out of the dark, one eye socket glowing a mean orange.',
		hp: 14,
		ac: 12,
		attack: 4,
		dmg: { n: 1, d: 8, b: 2 },
		defeat: 'collapses into a pile of bones and sighs with what sounds like relief.'
	},
	{
		name: 'Goblin Pack Leader',
		intro:
			'A goblin in a too-large helmet leaps onto a barrel and screams in a dialect nobody understands.',
		hp: 13,
		ac: 13,
		attack: 4,
		dmg: { n: 1, d: 6, b: 2 },
		defeat: 'flops over, helmet spinning, and the rest of the pack flees in squeaky disarray.'
	},
	{
		name: 'Giant Spider',
		intro:
			'A spider the size of a cart drops from the ceiling on a thread of silk, and it is hungry.',
		hp: 18,
		ac: 13,
		attack: 5,
		dmg: { n: 1, d: 8, b: 3 },
		defeat: 'curls up like a dried leaf, its eight eyes going dim.'
	},
	{
		name: 'Bugbear Brute',
		intro:
			'A hulking bugbear steps out of a shadowed alcove, hefting a spiked club and an unfriendly grin.',
		hp: 20,
		ac: 12,
		attack: 4,
		dmg: { n: 2, d: 6, b: 1 },
		defeat: 'topples with a thump that shakes dust from the ceiling.'
	},
	{
		name: 'Animated Armor',
		intro:
			'A suit of armor in the corner lifts its visor, empty inside, and draws a sword with a screech.',
		hp: 16,
		ac: 17,
		attack: 4,
		dmg: { n: 1, d: 6, b: 2 },
		defeat: 'falls apart with a long, hollow clang that echoes for a full minute.'
	},
	{
		name: 'Dire Wolf',
		intro:
			'A wolf the size of a pony pads out of the darkness, lips curled, and lets out a deep, rumbling growl.',
		hp: 17,
		ac: 13,
		attack: 5,
		dmg: { n: 2, d: 6, b: 1 },
		defeat: 'whimpers, rolls over, and limps off into the dark. Good boy, sort of.'
	},
	{
		name: 'Ghoul',
		intro:
			'A ghoul skulks from a pile of rags, jaws dripping, and licks its lips with an ugly tongue.',
		hp: 15,
		ac: 12,
		attack: 4,
		dmg: { n: 1, d: 8, b: 2 },
		defeat: 'crumples into foul-smelling dust. You will need a bath.'
	},
	{
		name: 'Gelatinous Cube',
		intro:
			'The corridor wall wobbles. A translucent cube, full of half-dissolved adventurers’ gear, slides toward you.',
		hp: 22,
		ac: 10,
		attack: 4,
		dmg: { n: 2, d: 6, b: 0 },
		defeat: 'bursts in a slick, steaming heap, releasing a surprising number of old coins.'
	},
	{
		name: 'Cultist Zealot',
		intro:
			'A robed cultist leaps from behind a pillar, chanting something about eternal sandwiches.',
		hp: 15,
		ac: 12,
		attack: 4,
		dmg: { n: 1, d: 8, b: 2 },
		defeat: 'drops the ritual dagger and stammers, "I was only in it for the robes!"'
	},
	{
		name: 'Hobgoblin Captain',
		intro:
			'A crisp, polished hobgoblin in a perfect red uniform snaps to attention and draws a longsword.',
		hp: 19,
		ac: 15,
		attack: 5,
		dmg: { n: 1, d: 8, b: 3 },
		defeat: 'salutes you, mid-collapse, with grudging respect.'
	},
	{
		name: 'Ogre Chef',
		intro:
			'An ogre in a stained apron lumbers out of a kitchen with a cleaver and a hungry, hopeful look.',
		hp: 22,
		ac: 11,
		attack: 5,
		dmg: { n: 2, d: 8, b: 0 },
		defeat: 'drops the cleaver and, deflated, goes back to making soup.'
	},
	{
		name: 'Swarm of Bats',
		intro:
			'A great fluttering cloud of bats explodes from the rafters, shrieking, and they all seem personally offended.',
		hp: 14,
		ac: 12,
		attack: 4,
		dmg: { n: 2, d: 4, b: 1 },
		defeat: 'scatters, and the last bat gives you a withering look as it flaps away.'
	},
	{
		name: 'Mimic Door',
		intro: 'The door you were about to open opens first. It has teeth. A lot of teeth.',
		hp: 21,
		ac: 12,
		attack: 5,
		dmg: { n: 1, d: 10, b: 2 },
		defeat:
			'slams shut, goes still, and is only a door again, a little singed and very embarrassed.'
	},
	{
		name: 'Bandit Chief',
		intro:
			'A scarred bandit chief swaggers out and twirls a pair of curved blades. "Last chance to hand it all over."',
		hp: 18,
		ac: 14,
		attack: 5,
		dmg: { n: 1, d: 8, b: 3 },
		defeat: 'sags, drops both blades, and mutters, "Retirement is looking pretty good right now."'
	},
	{
		name: 'Will-o’-the-Wisp',
		intro:
			'A dancing, flickering light drifts toward you, humming sweetly. Behind it, a darker thing waits.',
		hp: 12,
		ac: 15,
		attack: 5,
		dmg: { n: 2, d: 6, b: 0 },
		defeat: 'winks out with a sad little pop.'
	},
	{
		name: 'Stone Gargoyle',
		intro:
			'A gargoyle that you were sure was only decoration peels off the wall and drops in front of you.',
		hp: 20,
		ac: 14,
		attack: 4,
		dmg: { n: 1, d: 10, b: 1 },
		defeat: 'cracks apart and tumbles into a heap of loose, mossy rubble.'
	},
	{
		name: 'Rust Monster',
		intro:
			'A bug-eyed, antennaed creature scuttles toward you and sniffs at your gear with distinct longing.',
		hp: 17,
		ac: 14,
		attack: 3,
		dmg: { n: 1, d: 8, b: 1 },
		defeat: 'rolls over, belly up, utterly dejected, with a half-chewed spoon still in its jaws.'
	},
	{
		name: 'Zombie Horde (Small)',
		intro:
			'A knot of shambling zombies lumbers into view, moaning in what might be a harmonized chorus.',
		hp: 20,
		ac: 8,
		attack: 3,
		dmg: { n: 2, d: 6, b: 0 },
		defeat: 'tumbles into a heap of mumbling, slow-moving regret.'
	}
];

export const BOSSES: { title: string; foe: Foe }[] = [
	{
		title: 'Lord Grimfang, the Bone King',
		foe: {
			name: 'Lord Grimfang',
			intro:
				'The Bone King rises from a throne of skulls, his crown of rusted nails glinting in the gloom.',
			hp: 36,
			ac: 15,
			attack: 6,
			dmg: { n: 1, d: 10, b: 3 },
			defeat: 'comes apart bone by bone, still muttering about "proper respect."'
		}
	},
	{
		title: 'Maldrith the Hollow Witch',
		foe: {
			name: 'Maldrith',
			intro:
				'The witch turns from her cauldron, eyes pale as milk, and a toad on her shoulder gives you a withering look.',
			hp: 32,
			ac: 14,
			attack: 6,
			dmg: { n: 2, d: 6, b: 2 },
			defeat:
				'shrieks, shrivels, and disappears in a puff of foul smoke, leaving only a very put-upon toad.'
		}
	},
	{
		title: 'Skarn, Wyrmling of the Cinder Vault',
		foe: {
			name: 'Skarn the Wyrmling',
			intro:
				'A young dragon uncoils from a heap of coins, steam curling from its nostrils. "You are in my room."',
			hp: 38,
			ac: 16,
			attack: 6,
			dmg: { n: 2, d: 6, b: 3 },
			defeat: 'slumps, smoking, and croaks, "You could have just knocked."'
		}
	},
	{
		title: 'The Jabbering Idol',
		foe: {
			name: 'The Jabbering Idol',
			intro:
				'A twelve-foot stone idol’s many mouths begin to speak at once, and every word is a curse.',
			hp: 40,
			ac: 15,
			attack: 5,
			dmg: { n: 1, d: 12, b: 2 },
			defeat: 'cracks from base to crown, and the babbling finally falls silent.'
		}
	},
	{
		title: 'Duchess Vexmora, the Ageless',
		foe: {
			name: 'Duchess Vexmora',
			intro:
				'A pale duchess in a ballgown the color of old blood glides down a grand staircase, blade in hand. "How rude of you to drop by."',
			hp: 34,
			ac: 16,
			attack: 6,
			dmg: { n: 1, d: 10, b: 3 },
			defeat: 'folds into a cloud of bats and faint, dignified swearing.'
		}
	},
	{
		title: 'Gorrak Ironjaw, Ogre Warlord',
		foe: {
			name: 'Gorrak Ironjaw',
			intro:
				'A warlord ogre in patchwork plate drops from the rafters and roars until the dust falls.',
			hp: 40,
			ac: 14,
			attack: 6,
			dmg: { n: 2, d: 8, b: 2 },
			defeat: 'topples with a boom, mid-roar, and is surprisingly gentle on the way down.'
		}
	},
	{
		title: 'The Mirror Tyrant',
		foe: {
			name: 'The Mirror Tyrant',
			intro:
				'A towering figure of living glass steps from a wall of mirrors, and it moves exactly like you, only better.',
			hp: 34,
			ac: 15,
			attack: 7,
			dmg: { n: 1, d: 10, b: 3 },
			defeat: 'shatters into a thousand shards, each reflecting your triumphant face.'
		}
	},
	{
		title: 'Sister Mourn, Priestess of the Drowned God',
		foe: {
			name: 'Sister Mourn',
			intro:
				'A priestess in water-logged robes lifts a coral staff, and the room fills with the smell of salt and old seaweed.',
			hp: 33,
			ac: 14,
			attack: 6,
			dmg: { n: 2, d: 6, b: 2 },
			defeat:
				'dissolves into brine and foam, leaving only a conch shell and a mild sense of embarrassment.'
		}
	},
	{
		title: 'The Beholder-Adjacent',
		foe: {
			name: 'The Beholder-Adjacent',
			intro:
				'A floating orb with a single, very large, very bloodshot eye regards you. "Do you have an appointment?"',
			hp: 32,
			ac: 15,
			attack: 7,
			dmg: { n: 2, d: 6, b: 1 },
			defeat: 'deflates with a long, whistling sigh, drifts to the floor, and goes dark.'
		}
	},
	{
		title: 'Old Mother Thornfinger',
		foe: {
			name: 'Old Mother Thornfinger',
			intro:
				'A hag in a cloak of crows grins, cracks her knuckles, and offers you tea. It is not tea.',
			hp: 36,
			ac: 14,
			attack: 6,
			dmg: { n: 2, d: 6, b: 2 },
			defeat: 'caws in fury, bursts into a flock of crows, and flaps away in a huff.'
		}
	},
	{
		title: 'Captain Redbeard the Unliving',
		foe: {
			name: 'Captain Redbeard',
			intro:
				'A ghostly pirate captain strides from the mist, cutlass drawn, parrot (also a ghost) shrieking insults.',
			hp: 35,
			ac: 15,
			attack: 6,
			dmg: { n: 1, d: 10, b: 3 },
			defeat: 'fades to a shimmer, tips his hat, and mutters, "Fair winds, ye scurvy dog."'
		}
	},
	{
		title: 'The Clockwork Colossus',
		foe: {
			name: 'The Clockwork Colossus',
			intro:
				'A great brass automaton unfolds from the wall, gears whirring, and a tiny voice inside whispers, "Please be gentle."',
			hp: 40,
			ac: 16,
			attack: 6,
			dmg: { n: 2, d: 8, b: 1 },
			defeat: 'shudders, spins down, and settles with a series of tired, tinny clicks.'
		}
	}
];

// ── Roll flavor ──────────────────────────────────────────────────────────────────────────────

export const CHECK_CRIT = [
	'Absolutely flawless. The dice gods are weeping with joy.',
	'A move so smooth it will be told in taverns.',
	'You do it with such style that a nearby bird applauds.',
	'Pure, unfiltered brilliance. You may stop and enjoy this.'
];
export const CHECK_FUMBLE = [
	'Catastrophic. A bard in the next county feels a sudden chill.',
	'It goes so wrong that you consider a career change.',
	'The universe takes one look at your plan and giggles.',
	'A spectacular failure that will live in legend, but not the good kind.'
];
export const HIT_LINES = [
	'It lands with a satisfying crunch.',
	'A clean, solid hit.',
	'Right on target.',
	'It connects, and the foe winces.',
	'You find the gap in their defense.'
];
export const MISS_LINES = [
	'It glances off harmlessly.',
	'A near miss, mostly in spirit.',
	'The foe sidesteps with irritating grace.',
	'You swing at air and a little bit of ego.',
	'It clangs off armor, and your wrist complains.'
];
export const FOE_HIT_LINES = [
	'It strikes hard.',
	'That is going to leave a mark.',
	'You feel it, deep.',
	'It finds the gap in your guard.',
	'A solid hit, and not a polite one.'
];
export const FOE_MISS_LINES = [
	'Your armor takes the blow.',
	'You twist aside at the last moment.',
	'It whistles past your ear.',
	'The strike rings off your guard harmlessly.',
	'You duck, and the strike hits only air.'
];

// ── Endings ──────────────────────────────────────────────────────────────────────────────────

export const TREASURES = [
	'a sack of {gold} gold and a lovingly polished dagger',
	'{gold} gold, plus a cloak that is warm in a way that feels suspicious',
	'a ring that whispers compliments (and {gold} gold)',
	'{gold} gold and a map of a place you really should not visit',
	'a velvet pouch of {gold} gold and one very smug familiar',
	'a gleaming amulet and {gold} gold, still slightly warm',
	'{gold} gold and a tiny dragon-shaped teapot that refuses to boil',
	'a lock of silver hair, {gold} gold, and a favor owed by a minor god',
	'a sack of {gold} gold, and a pair of boots that never quite get muddy',
	'a heavy chest holding {gold} gold and a rather opinionated sword',
	'{gold} gold and a lantern that lights the way home',
	'a battered crown, {gold} gold, and a sudden, strong urge to be dramatic',
	'a bag of {gold} gold and a charm that makes you hum in harmony',
	'{gold} gold plus a flask that is always slightly more than half full',
	'a golden spoon, a stack of coins worth {gold} gold, and a glowing pebble',
	'{gold} gold, a pet rat of astonishing loyalty, and a half-eaten pie',
	'a scroll of vague prophecy, {gold} gold, and a surprisingly good hat',
	'{gold} gold and the gratitude of a goat',
	'a velvet cloak, {gold} gold, and an invitation to dinner (you can decline)',
	'a stash worth {gold} gold, and a deed to a tiny, haunted cottage'
];

export const TITLES_LEGENDARY = [
	'Slayer of the Unlikely',
	'the Dauntless',
	'Bane of Bad Ideas',
	'Hero of the Hour (and a Half)',
	'the Unbothered',
	'Terror of Tavern Tales'
];
export const TITLES_SOLID = [
	'the Reliable',
	'Defender of the Realm (Locally)',
	'the Stubborn',
	'Quiet Hero of the Parish',
	'Winner of Some Fights',
	'the Respectable'
];
export const TITLES_SCRAPE = [
	'the Barely Standing',
	'Survivor by Technicality',
	'the Lucky',
	'Most Likely to Limp Home',
	'Champion of Stubbornness',
	'Bruised but Famous'
];

export const EPILOGUES_VICTORY = [
	'{patron} throws a feast in your honor. It is a very modest feast, but there is cake, and cake is cake.',
	'The bards write a song about you. It is a little off-key, and your name is spelled wrong, but the chorus is great.',
	'You wake in a comfortable bed, with the sun on your face and absolutely no regrets, except the usual ones.',
	'The town names a goat after you. It is a lovely goat.',
	'A stranger buys you a drink and says, "I heard what you did." They do not elaborate, which is a little mysterious.',
	'You hang up your boots for a single day, then immediately start looking for the next quest.',
	'{patron} insists on a portrait. It does not look like you, but it does look heroic.',
	'You limp home through a town that parts to let you pass. Someone throws a flower. Someone else throws a cabbage. Both are meant kindly.',
	'The next morning, a new rumor spreads through the tavern, and you are already half-listening.',
	'Children now play "{hero}" in the village square. The villain is always a goat. You are fine with this.',
	'The scholars write that "{hero} was probably real." You take it as a compliment.',
	'A grateful stranger leaves a meat pie on your doorstep every Tuesday. You never find out why.'
];

export const EPILOGUES_DEFEAT = [
	'Everything goes dark. {patron} will tell your tale for years, with a few embellishments in the right places.',
	'You crumple, and the last thing you hear is a very smug, "Better luck next time." Somehow you do get a next time, but not today.',
	'The tavern sets a place for you. No one sits there. Every so often, someone raises a glass.',
	'Your adventure ends abruptly, but your name lives on in an unflattering ballad called "Oh, {hero}."',
	'A kind passerby finds you, patches you up, and politely suggests a different career. You consider it.',
	'You wake up in a ditch, wounded but alive, and quite certain you will be back. The villain, meanwhile, writes in their diary: "Close call."'
];

export const FLEE_LINES = [
	'You bolt from the fight with a speed that would surprise a horse.',
	'You dive out of reach and sprint, dignity left behind on the floor.',
	'"Strategic retreat," you yell. No one is listening.',
	'You duck, roll, and run, and nobody pursues, which is slightly insulting.'
];
