/**
 * Scrapes all 2024 D&D monsters from aidedd.org/monster/
 * Outputs: scripts/monsters-2024.json
 *
 * Run: node scripts/scrape-monsters.mjs
 */

import { writeFileSync } from 'fs';

const BASE_URL = 'https://www.aidedd.org/monster/';
const DELAY_MS = 300; // be polite to the server
const OUTPUT_FILE = './scripts/monsters-2024.json';

const SLUGS = [
	'aarakocra-aeromancer',
	'aarakocra-skirmisher',
	'aberrant-cultist',
	'aberrant-spirit',
	'aboleth',
	'abominable-yeti',
	'adult-black-dragon',
	'adult-blue-dragon',
	'adult-brass-dragon',
	'adult-bronze-dragon',
	'adult-copper-dragon',
	'adult-gold-dragon',
	'adult-green-dragon',
	'adult-red-dragon',
	'adult-silver-dragon',
	'adult-white-dragon',
	'air-elemental',
	'allosaurus',
	'ancient-black-dragon',
	'ancient-blue-dragon',
	'ancient-brass-dragon',
	'ancient-bronze-dragon',
	'ancient-copper-dragon',
	'ancient-gold-dragon',
	'ancient-green-dragon',
	'ancient-red-dragon',
	'ancient-silver-dragon',
	'ancient-white-dragon',
	'animal-lord',
	'animated-armor',
	'animated-broom',
	'animated-flying-sword',
	'animated-object',
	'animated-rug-of-smothering',
	'ankheg',
	'ankylosaurus',
	'ape',
	'arcanaloth',
	'arch-hag',
	'archelon',
	'archmage',
	'archpriest',
	'assassin',
	'awakened-shrub',
	'awakened-tree',
	'axe-beak',
	'azer-pyromancer',
	'azer-sentinel',
	'baboon',
	'badger',
	'balor',
	'bandit',
	'bandit-captain',
	'bandit-crime-lord',
	'bandit-deceiver',
	'banshee',
	'barbed-devil',
	'barlgura',
	'basilisk',
	'bat',
	'bearded-devil',
	'beast-of-the-land',
	'beast-of-the-sea',
	'beast-of-the-sky',
	'behir',
	'beholder',
	'beholder-zombie',
	'berserker',
	'berserker-commander',
	'bestial-spirit',
	'black-bear',
	'black-dragon-wyrmling',
	'black-pudding',
	'blink-dog',
	'blob-of-annihilation',
	'blood-hawk',
	'blue-dragon-wyrmling',
	'blue-slaad',
	'boar',
	'bone-devil',
	'bone-naga',
	'brass-dragon-wyrmling',
	'brazen-gorgon',
	'bronze-dragon-wyrmling',
	'brown-bear',
	'bugbear-stalker',
	'bugbear-warrior',
	'bulette',
	'bulette-pup',
	'bullywug-bog-sage',
	'bullywug-warrior',
	'cambion',
	'camel',
	'carrion-crawler',
	'cat',
	'celestial-spirit',
	'centaur-trooper',
	'centaur-warden',
	'chain-devil',
	'chasme',
	'chimera',
	'chuul',
	'clay-golem',
	'cloaker',
	'cloud-giant',
	'cockatrice',
	'cockatrice-regent',
	'colossus',
	'commoner',
	'constrictor-snake',
	'construct-spirit',
	'copper-dragon-wyrmling',
	'couatl',
	'crab',
	'crawling-claw',
	'crocodile',
	'cultist',
	'cultist-fanatic',
	'cultist-hierophant',
	'cyclops-oracle',
	'cyclops-sentry',
	'dao',
	'darkmantle',
	'death-cultist',
	'death-dog',
	'death-knight',
	'death-knight-aspirant',
	'death-slaad',
	'death-tyrant',
	'deer',
	'demilich',
	'deva',
	'dire-wolf',
	'dire-worg',
	'displacer-beast',
	'djinni',
	'doppelganger',
	'dracolich',
	'draconic-spirit',
	'draft-horse',
	'dragon-turtle',
	'dretch',
	'drider',
	'druid',
	'dryad',
	'dust-mephit',
	'eagle',
	'earth-elemental',
	'efreeti',
	'elemental-cataclysm',
	'elemental-cultist',
	'elemental-spirit',
	'elephant',
	'elk',
	'empyrean',
	'empyrean-iota',
	'erinyes',
	'ettercap',
	'ettin',
	'faerie-dragon-adult',
	'faerie-dragon-youth',
	'fey-spirit',
	'fiend-cultist',
	'fiendish-spirit',
	'fire-elemental',
	'fire-giant',
	'flameskull',
	'flaming-skeleton',
	'flesh-golem',
	'flumph',
	'flying-snake',
	'fomorian',
	'frog',
	'frost-giant',
	'galeb-duhr',
	'gargoyle',
	'gas-spore-fungus',
	'gelatinous-cube',
	'ghast',
	'ghast-gravecaller',
	'ghost',
	'ghoul',
	'giant-ape',
	'giant-axe-beak',
	'giant-badger',
	'giant-bat',
	'giant-boar',
	'giant-centipede',
	'giant-constrictor-snake',
	'giant-crab',
	'giant-crocodile',
	'giant-eagle',
	'giant-elk',
	'giant-fire-beetle',
	'giant-frog',
	'giant-goat',
	'giant-hyena',
	'giant-insect',
	'giant-lizard',
	'giant-octopus',
	'giant-owl',
	'giant-rat',
	'giant-scorpion',
	'giant-seahorse',
	'giant-shark',
	'giant-spider',
	'giant-squid',
	'giant-toad',
	'giant-venomous-snake',
	'giant-vulture',
	'giant-wasp',
	'giant-weasel',
	'giant-wolf-spider',
	'gibbering-mouther',
	'githyanki-dracomancer',
	'githyanki-knight',
	'githyanki-warrior',
	'githzerai-monk',
	'githzerai-psion',
	'githzerai-zerth',
	'glabrezu',
	'gladiator',
	'gnoll-demoniac',
	'gnoll-fang-of-yeenoghu',
	'gnoll-pack-lord',
	'gnoll-warrior',
	'goat',
	'goblin-boss',
	'goblin-hexer',
	'goblin-minion',
	'goblin-warrior',
	'gold-dragon-wyrmling',
	'gorgon',
	'goristro',
	'graveyard-revenant',
	'gray-ooze',
	'gray-slaad',
	'green-dragon-wyrmling',
	'green-hag',
	'green-slaad',
	'grell',
	'grick',
	'grick-ancient',
	'griffon',
	'grimlock',
	'guard',
	'guard-captain',
	'guardian-naga',
	'gulthias-blight',
	'half-dragon',
	'harpy',
	'haunting-revenant',
	'hawk',
	'hell-hound',
	'helmed-horror',
	'hezrou',
	'hill-giant',
	'hippogriff',
	'hippopotamus',
	'hobgoblin-captain',
	'hobgoblin-warlord',
	'hobgoblin-warrior',
	'homunculus',
	'hook-horror',
	'horned-devil',
	'hunter-shark',
	'hydra',
	'hyena',
	'ice-devil',
	'ice-mephit',
	'imp',
	'incubus',
	'intellect-devourer',
	'invisible-stalker',
	'iron-golem',
	'jackal',
	'jackalwere',
	'juvenile-shadow-dragon',
	'kenku',
	'killer-whale',
	'knight',
	'kobold-warrior',
	'kraken',
	'kuo-toa',
	'kuo-toa-archpriest',
	'kuo-toa-monitor',
	'kuo-toa-whip',
	'lacedon-ghoul',
	'lamia',
	'larva',
	'lemure',
	'lich',
	'lion',
	'lizard',
	'lizardfolk-geomancer',
	'lizardfolk-sovereign',
	'mage',
	'mage-apprentice',
	'magma-mephit',
	'magmin',
	'mammoth',
	'manes',
	'manes-vaporspawn',
	'manticore',
	'marid',
	'marilith',
	'mastiff',
	'medusa',
	'merfolk-skirmisher',
	'merfolk-wavebender',
	'merrow',
	'mezzoloth',
	'mimic',
	'mind-flayer',
	'mind-flayer-arcanist',
	'minotaur-of-baphomet',
	'minotaur-skeleton',
	'mud-mephit',
	'mule',
	'mummy',
	'mummy-lord',
	'myconid-adult',
	'myconid-sovereign',
	'myconid-spore-servant',
	'myconid-sprout',
	'nalfeshnee',
	'needle-blight',
	'night-hag',
	'nightmare',
	'noble',
	'noble-prodigy',
	'nothic',
	'nycaloth',
	'ochre-jelly',
	'octopus',
	'ogre',
	'ogre-zombie',
	'ogrillon-ogre',
	'oni',
	'otherworldly-steed',
	'otyugh',
	'owl',
	'owlbear',
	'panther',
	'pegasus',
	'performer',
	'performer-legend',
	'performer-maestro',
	'peryton',
	'phase-spider',
	'piercer',
	'piranha',
	'pirate',
	'pirate-admiral',
	'pirate-captain',
	'pit-fiend',
	'pixie',
	'pixie-wonderbringer',
	'planetar',
	'plesiosaurus',
	'polar-bear',
	'poltergeist',
	'pony',
	'priest',
	'priest-acolyte',
	'primeval-owlbear',
	'pseudodragon',
	'psychic-gray-ooze',
	'pteranodon',
	'purple-worm',
	'quaggoth',
	'quaggoth-thonot',
	'quasit',
	'questing-knight',
	'rakshasa',
	'rat',
	'raven',
	'red-dragon-wyrmling',
	'red-slaad',
	'reef-shark',
	'remorhaz',
	'revenant',
	'rhinoceros',
	'riding-horse',
	'roc',
	'roper',
	'rust-monster',
	'saber-toothed-tiger',
	'sahuagin-baron',
	'sahuagin-priest',
	'sahuagin-warrior',
	'salamander',
	'salamander-fire-snake',
	'salamander-inferno-master',
	'satyr',
	'satyr-revelmaster',
	'scarecrow',
	'scorpion',
	'scout',
	'scout-captain',
	'sea-hag',
	'seahorse',
	'shadow',
	'shadow-dragon',
	'shambling-mound',
	'shield-guardian',
	'shrieker-fungus',
	'silver-dragon-wyrmling',
	'skeleton',
	'slaad-tadpole',
	'smoke-mephit',
	'solar',
	'spectator',
	'specter',
	'sphinx-of-lore',
	'sphinx-of-secrets',
	'sphinx-of-valor',
	'sphinx-of-wonder',
	'spider',
	'spined-devil',
	'spirit-naga',
	'sprite',
	'spy',
	'spy-master',
	'steam-mephit',
	'stirge',
	'stone-giant',
	'stone-golem',
	'storm-giant',
	'succubus',
	'swarm-of-bats',
	'swarm-of-crawling-claws',
	'swarm-of-dretches',
	'swarm-of-insects',
	'swarm-of-larvae',
	'swarm-of-lemures',
	'swarm-of-piranhas',
	'swarm-of-rats',
	'swarm-of-ravens',
	'swarm-of-stirges',
	'swarm-of-venomous-snakes',
	'tarrasque',
	'thri-kreen-marauder',
	'thri-kreen-psion',
	'tiger',
	'tough',
	'tough-boss',
	'treant',
	'tree-blight',
	'triceratops',
	'troglodyte',
	'troll',
	'troll-limb',
	'twig-blight',
	'tyrannosaurus-rex',
	'ultroloth',
	'umber-hulk',
	'undead-spirit',
	'unicorn',
	'vampire',
	'vampire-familiar',
	'vampire-nightbringer',
	'vampire-spawn',
	'vampire-umbral-lord',
	'venomous-snake',
	'vine-blight',
	'violet-fungus',
	'violet-fungus-necrohulk',
	'vrock',
	'vulture',
	'warhorse',
	'warhorse-skeleton',
	'warrior-commander',
	'warrior-infantry',
	'warrior-veteran',
	'water-elemental',
	'water-weird',
	'weasel',
	'werebear',
	'wereboar',
	'wererat',
	'weretiger',
	'werewolf',
	'white-dragon-wyrmling',
	'wight',
	'will-o--wisp',
	'winged-kobold',
	'winter-wolf',
	'wolf',
	'worg',
	'wraith',
	'wyvern',
	'xorn',
	'yeti',
	'yochlol',
	'young-black-dragon',
	'young-blue-dragon',
	'young-brass-dragon',
	'young-bronze-dragon',
	'young-copper-dragon',
	'young-gold-dragon',
	'young-green-dragon',
	'young-red-dragon',
	'young-remorhaz',
	'young-silver-dragon',
	'young-white-dragon',
	'yuan-ti-abomination',
	'yuan-ti-infiltrator',
	'yuan-ti-malison-type-1',
	'yuan-ti-malison-type-2',
	'yuan-ti-malison-type-3',
	'zombie'
];

// ── HTML parsing helpers ─────────────────────────────────────────────────────

function stripTags(html) {
	return html
		.replace(/<[^>]+>/g, '')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&nbsp;/g, ' ')
		.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
		.replace(/&raquo;/g, '»')
		.replace(/\s+/g, ' ')
		.trim();
}

function between(str, open, close) {
	const s = str.indexOf(open);
	if (s === -1) return '';
	const e = str.indexOf(close, s + open.length);
	return e === -1 ? '' : str.slice(s + open.length, e);
}

function allBetween(str, open, close) {
	const results = [];
	let pos = 0;
	while (true) {
		const s = str.indexOf(open, pos);
		if (s === -1) break;
		const e = str.indexOf(close, s + open.length);
		if (e === -1) break;
		results.push(str.slice(s + open.length, e));
		pos = e + close.length;
	}
	return results;
}

function parseAbility(html, carClass1, carClass2, carClass3) {
	// Extract all car1/car2/car3 blocks for ability scores
	const names = allBetween(html, `class='${carClass1}'>`, '</div>');
	const scores = allBetween(html, `class='${carClass2}'>`, '</div>');
	const mods = allBetween(html, `class='${carClass3}'>`, '</div>');
	const result = {};
	for (let i = 0; i < names.length && i < scores.length; i++) {
		const name = stripTags(names[i]).toUpperCase();
		const score = parseInt(stripTags(scores[i])) || 0;
		const mod = stripTags(mods[i * 2] || ''); // first mod = stat mod
		const save = stripTags(mods[i * 2 + 1] || ''); // second = save
		result[name] = { score, mod, save };
	}
	return result;
}

function parseParagraphs(sectionHtml) {
	// Full format: <p><strong><em>Name</em></strong>. Description</p>
	const paras = allBetween(sectionHtml, '<p>', '</p>');
	if (paras.length > 0) {
		return paras
			.map((p) => {
				const nameMatch = p.match(/<strong><em>(.*?)<\/em><\/strong>\.\s*/s);
				if (!nameMatch) return null;
				const name = stripTags(nameMatch[1]);
				const description = stripTags(p.slice(nameMatch[0].length));
				return { name, description };
			})
			.filter(Boolean);
	}
	// Abbreviated format: "Name.<br>OtherName.<br>" (no <p> tags, just text + <br>)
	// Strip divs first, then split on <br>, then strip remaining tags
	const noDivs = sectionHtml.replace(/<div[^>]*>.*?<\/div>/gs, '');
	return noDivs
		.split(/<br\s*\/?>/i)
		.map((chunk) => stripTags(chunk).trim())
		.filter((s) => s.length > 1 && !s.startsWith('<'))
		.map((s) => ({ name: s.replace(/\.$/, ''), description: '' }));
}

function parseSection(html, sectionTitle) {
	// Find <h2 class='rub'>SectionTitle</h2> ... next <h2 or end of stat block
	const marker = `<h2 class='rub'>${sectionTitle}</h2>`;
	const start = html.indexOf(marker);
	if (start === -1) return [];
	const after = html.slice(start + marker.length);
	// Stop at next section header OR at end of the stat block div
	const nextH2 = after.indexOf("<h2 class='rub'>");
	const blockEnd = after.indexOf("</div></div><div class='description'>");
	const candidates = [nextH2, blockEnd].filter((n) => n !== -1);
	const end = candidates.length ? Math.min(...candidates) : -1;
	const sectionHtml = end === -1 ? after : after.slice(0, end);
	return parseParagraphs(sectionHtml);
}

function parseLegendaryPreamble(html, sectionTitle) {
	const marker = `<h2 class='rub'>${sectionTitle}</h2>`;
	const start = html.indexOf(marker);
	if (start === -1) return null;
	const after = html.slice(start + marker.length);
	const legendMatch = after.match(/<div class='legend'>(.*?)<\/div>/s);
	return legendMatch ? stripTags(legendMatch[1]) : null;
}

function parseStat(html, label) {
	// Finds <strong>Label</strong> text<br> pattern
	const re = new RegExp(`<strong(?:[^>]*)>${label}<\\/strong>\\s*([^<]*)`);
	const m = html.match(re);
	return m ? m[1].trim() : '';
}

function parseMonsterHtml(html, slug) {
	const jaune = between(html, "<div class='jaune'>", "</div></div><div class='description'>");

	// Name
	const name = stripTags(between(html, '<h1>', '</h1>'));

	// Type line: "Large Aberration, Lawful Evil"
	const typeLine = stripTags(between(html, "<div class='type'>", '</div>'));
	// Parse: size + type + alignment
	const typeMatch = typeLine.match(
		/^(Fine|Diminutive|Tiny|Small|Medium|Large|Huge|Gargantuan)\s+(.+?),\s*(.+)$/i
	);
	const size = typeMatch ? typeMatch[1] : '';
	const type = typeMatch ? typeMatch[2].trim() : typeLine;
	const alignment = typeMatch ? typeMatch[3].trim() : '';

	// Initiative
	const initLine = stripTags(between(html, "<div class='init'>", '</div>'));
	const initMatch = initLine.match(/Initiative\s+([+-]\d+)\s+\((\d+)\)/);
	const initiativeMod = initMatch ? initMatch[1] : '';
	const initiativeScore = initMatch ? parseInt(initMatch[2]) : null;

	// AC
	const acMatch = jaune.match(/<strong>AC<\/strong>\s*([^<]+)/);
	const ac = acMatch ? acMatch[1].trim() : '';

	// HP
	const hpMatch = jaune.match(/<strong>HP<\/strong>\s*([^<]+)/);
	const hp = hpMatch ? hpMatch[1].trim() : '';

	// Speed
	const speedMatch = jaune.match(/<strong>Speed<\/strong>\s*([^<]+)/);
	const speed = speedMatch ? speedMatch[1].trim() : '';

	// Ability scores — two rows: STR/DEX/CON and INT/WIS/CHA
	// car1/car2/car3 = STR row labels/scores/mods+saves
	// car4/car5/car6 = INT row
	const abilityNames1 = allBetween(jaune, "class='car1'>", '</div>').map(stripTags);
	const abilityScores1 = allBetween(jaune, "class='car2'>", '</div>').map(stripTags);
	const abilityCells3 = allBetween(jaune, "class='car3'>", '</div>').map(stripTags);
	const abilityNames2 = allBetween(jaune, "class='car4'>", '</div>').map(stripTags);
	const abilityScores2 = allBetween(jaune, "class='car5'>", '</div>').map(stripTags);
	const abilityCells6 = allBetween(jaune, "class='car6'>", '</div>').map(stripTags);

	const abilities = {};
	const row1 = ['STR', 'DEX', 'CON'];
	const row2 = ['INT', 'WIS', 'CHA'];
	for (let i = 0; i < 3; i++) {
		const aname1 = abilityNames1[i] || row1[i];
		abilities[aname1.toUpperCase()] = {
			score: parseInt(abilityScores1[i]) || 0,
			mod: abilityCells3[i * 2] || '',
			save: abilityCells3[i * 2 + 1] || ''
		};
		const aname2 = abilityNames2[i] || row2[i];
		abilities[aname2.toUpperCase()] = {
			score: parseInt(abilityScores2[i]) || 0,
			mod: abilityCells6[i * 2] || '',
			save: abilityCells6[i * 2 + 1] || ''
		};
	}

	// Text fields after ability scores
	const skillsMatch = jaune.match(/<strong[^>]*>Skills<\/strong>\s*([^\n<]*)/);
	const skills = skillsMatch ? skillsMatch[1].trim() : '';

	const sensesMatch = jaune.match(/<strong>Senses<\/strong>\s*([^\n<]*)/);
	const senses = sensesMatch ? sensesMatch[1].trim() : '';

	const langsMatch = jaune.match(/<strong>Languages<\/strong>\s*([^\n<]*)/);
	const languages = langsMatch ? langsMatch[1].trim() : '';

	const crMatch = jaune.match(/<strong>CR<\/strong>\s*([^\n<]*)/);
	const crRaw = crMatch ? crMatch[1].trim() : '';
	// Parse "10 (XP 5 900, or 7 200 in Lair; PB +4)"
	const crNumMatch = crRaw.match(/^(\S+)/);
	const cr = crNumMatch ? crNumMatch[1] : '';
	const xpMatch = crRaw.match(/XP\s*([\d\s,]+?)(?:,|;|\))/);
	const xp = xpMatch ? xpMatch[1].replace(/\s/g, '').replace(',', '') : '';
	const xpLairMatch = crRaw.match(/or\s*([\d\s,]+?)\s*in Lair/);
	const xpLair = xpLairMatch ? xpLairMatch[1].replace(/\s/g, '').replace(',', '') : '';
	const pbMatch = crRaw.match(/PB\s*([+-]\d+)/);
	const proficiencyBonus = pbMatch ? pbMatch[1] : '';

	// Immunities / resistances from the text (look in the full jaune block)
	const immuneMatch = jaune.match(/<strong>Immunities<\/strong>\s*([^\n<]*)/);
	const immunities = immuneMatch ? immuneMatch[1].trim() : '';
	const resistMatch = jaune.match(/<strong>Resistances<\/strong>\s*([^\n<]*)/);
	const resistances = resistMatch ? resistMatch[1].trim() : '';
	const vulnMatch = jaune.match(/<strong>Vulnerabilities<\/strong>\s*([^\n<]*)/);
	const vulnerabilities = vulnMatch ? vulnMatch[1].trim() : '';
	const condImmuneMatch = jaune.match(/<strong>Condition Immunities<\/strong>\s*([^\n<]*)/);
	const conditionImmunities = condImmuneMatch ? condImmuneMatch[1].trim() : '';

	// Sections
	const traits = parseSection(html, 'Traits');
	const actions = parseSection(html, 'Actions');
	const bonusActions = parseSection(html, 'Bonus actions');
	const reactions = parseSection(html, 'Reactions');

	const legendaryPreamble = parseLegendaryPreamble(html, 'Legendary actions');
	const legendaryActions = parseSection(html, 'Legendary actions');

	const lairPreamble = parseLegendaryPreamble(html, 'Lair actions');
	const lairActions = parseSection(html, 'Lair actions');

	// Habitat & source
	const habitatMatches = allBetween(html, "<div class='habitat'>", '</div>');
	const habitat = habitatMatches.map(stripTags).join('; ');
	const sourceMatch = between(html, "<div class='source'>", '</div>');
	const source = stripTags(sourceMatch);

	return {
		slug,
		name,
		size,
		type,
		alignment,
		initiative: { mod: initiativeMod, score: initiativeScore },
		ac,
		hp,
		speed,
		abilities,
		skills,
		senses,
		languages,
		cr,
		xp: xp ? parseInt(xp) : null,
		xpLair: xpLair ? parseInt(xpLair) : null,
		proficiencyBonus,
		immunities,
		resistances,
		vulnerabilities,
		conditionImmunities,
		traits,
		actions,
		bonusActions,
		reactions,
		legendary: {
			preamble: legendaryPreamble,
			actions: legendaryActions
		},
		lair: {
			preamble: lairPreamble,
			actions: lairActions
		},
		habitat,
		source
	};
}

// ── Main scraper ─────────────────────────────────────────────────────────────

async function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchMonster(slug) {
	const url = `${BASE_URL}${slug}`;
	const res = await fetch(url, {
		headers: { 'User-Agent': 'Mozilla/5.0 (compatible; dnd-scraper/1.0)' }
	});
	if (!res.ok) throw new Error(`HTTP ${res.status} for ${slug}`);
	const html = await res.text();
	return parseMonsterHtml(html, slug);
}

async function main() {
	const results = [];
	const errors = [];
	const total = SLUGS.length;

	console.log(`Scraping ${total} monsters from aidedd.org…\n`);

	for (let i = 0; i < SLUGS.length; i++) {
		const slug = SLUGS[i];
		try {
			const monster = await fetchMonster(slug);
			results.push(monster);
			process.stdout.write(`\r[${i + 1}/${total}] ${monster.name.padEnd(40)}`);
		} catch (err) {
			errors.push({ slug, error: err.message });
			process.stdout.write(`\r[${i + 1}/${total}] ERROR: ${slug}\n`);
		}
		if (i < SLUGS.length - 1) await sleep(DELAY_MS);
	}

	console.log(`\n\nDone! ${results.length} monsters scraped, ${errors.length} errors.`);

	if (errors.length) {
		console.log('\nErrors:');
		errors.forEach((e) => console.log(`  ${e.slug}: ${e.error}`));
	}

	writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf8');
	console.log(`\nSaved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
