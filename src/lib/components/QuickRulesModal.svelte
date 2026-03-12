<!-- Full-screen Quick Rules reference for DMs. Left column lists categories;
     right panel shows the selected category's content. -->
<script lang="ts">
	let { onclose }: { onclose: () => void } = $props();

	type Category = {
		id: string;
		label: string;
		icon: string;
	};

	const categories: Category[] = [
		{ id: 'actions',       label: 'Actions in Combat',       icon: '⚔️' },
		{ id: 'bonus',         label: 'Bonus Actions',           icon: '⚡' },
		{ id: 'movement',      label: 'Movement & Position',     icon: '👣' },
		{ id: 'conditions',    label: 'Conditions',              icon: '🩸' },
		{ id: 'concentration', label: 'Concentration',           icon: '🧠' },
		{ id: 'death',         label: 'Death Saving Throws',     icon: '☠' },
		{ id: 'exhaustion',    label: 'Exhaustion',              icon: '😓' },
		{ id: 'cover',         label: 'Cover',                   icon: '🛡️' },
		{ id: 'light',         label: 'Light & Vision',          icon: '👁️' },
		{ id: 'resting',       label: 'Resting',                 icon: '🌙' },
		{ id: 'checks',        label: 'Ability Check DCs',       icon: '🎲' },
		{ id: 'saves',         label: 'Common Save DCs',         icon: '💀' },
		{ id: 'xp',            label: 'Encounter Difficulty',    icon: '⚖️' },
		{ id: 'magic',         label: 'Magic & Casting',         icon: '✨' },
		{ id: 'names',         label: 'Name Generator',          icon: '📛' },
		{ id: 'weather',       label: 'Weather & Travel',        icon: '🌦️' },
	];

	let selected = $state('actions');

	// ── Name Generator ───────────────────────────────────────────────────────
	type SyllableDef  = { kind: 'syllable'; pre: string[]; mid?: string[]; suf: string[]; midChance?: number };
	type CompoundDef  = { kind: 'compound'; a: string[]; b: string[]; sep?: string; prefix?: string };
	type NameDef = SyllableDef | CompoundDef;

	const nameData: Record<string, NameDef> = {
		'human-male': { kind: 'syllable',
			pre: ['Al','Ar','Bal','Bran','Car','Cor','Dan','Ed','Gar','Gor','Hal','Har','Ian','Jar','Kel','Lan','Lar','Mar','Nal','Par','Ran','Ser','Sten','Tor','Ulf','Val','Wil'],
			mid: ['dan','gar','mar','ren','bar','fen','ker','nor','tar','wal'],
			suf: ['ric','ald','win','an','on','in','or','en','mar','dar','ford','ton','rel','bert','mund','brand','rick','ward','wick'],
		},
		'human-female': { kind: 'syllable',
			pre: ['Aer','Bri','Cass','Del','El','Em','Eva','Gwen','Isla','Kar','Lara','Mar','Mor','Nai','Rosa','Ser','Syl','Una','Val','Wyn'],
			mid: ['a','li','ra','ri','na','la','ni','ma','sa','ve'],
			suf: ['a','ia','ina','ena','wyn','lyn','ara','ira','ela','isa','ella','ane','ette','bel','dra'],
			midChance: 0.2,
		},
		'elf': { kind: 'syllable',
			pre: ['Aer','Ael','Cal','Cel','Cor','El','Fae','Gal','Gil','Ith','Kael','Lith','Mir','Nar','Nil','Quel','Riv','Sil','Sol','Tal','Thal','Var','Zel'],
			mid: ['a','i','u','e','ae','ie','ua','ei'],
			suf: ['iel','ion','ath','ara','uvar','anor','aniel','wen','thor','riel','las','mir','dan','rin','ros','el','ias'],
			midChance: 0.4,
		},
		'dwarf': { kind: 'syllable',
			pre: ['Baf','Bal','Bar','Bom','Dal','Dor','Dur','Far','Gar','Gim','Gor','Hal','Har','Kaz','Kel','Kor','Mord','Nor','Orn','Ran','Rok','Thor','Tor','Ulf'],
			suf: ['in','ak','un','ik','ek','or','ur','ar','im','rim','bur','dok','din','grim','dur','nar','li','ni'],
		},
		'halfling': { kind: 'syllable',
			pre: ['Amos','Bar','Bur','Cal','Cob','Del','Dil','Fil','Fin','Hal','Kel','Lil','Lin','Mel','Milo','Ned','Pip','Rol','Sam','Tab','Tim','Tom','Will'],
			suf: ['bo','ber','by','dle','fie','kin','ley','lin','low','pin','ro','ton','wick','wood','y','din'],
		},
		'gnome': { kind: 'syllable',
			pre: ['Alb','Bim','Bink','Bip','Dim','Dip','Elb','Erky','Fiz','Flan','Gim','Glib','Glim','Ink','Jeb','Kelb','Nib','Nim','Pip','Rib','Rim','Snip','Tab','Tim','Wim','Zook'],
			suf: ['ble','bix','bop','bur','ding','fiz','flax','gle','glim','kin','kle','lix','nix','pin','pip','ple','rim','tle','wick','zle'],
		},
		'orc': { kind: 'syllable',
			pre: ['Akh','Arg','Bak','Bol','Brug','Gar','Gog','Grim','Grob','Grul','Grum','Kaz','Krag','Krul','Mag','Mog','Nar','Rag','Rok','Skar','Thak','Thog','Ug','Ulg','Var','Vorg','Zak','Zog'],
			suf: ['ak','ash','at','dak','gak','gar','gul','kan','kar','mak','muk','nak','ok','rak','rog','rok','ruk','tak','tar','uk','zak'],
		},
		'tiefling': { kind: 'syllable',
			pre: ['Bael','Car','Drak','Exam','Fil','Graz','Kar','Lex','Lev','Lorr','Mal','Meph','Mor','Ner','Neth','Par','Ran','Scor','Ser','Sin','Tar','Tel','Vel','Xan','Zan','Zar'],
			suf: ['iel','ius','ias','ion','ax','ix','oth','uth','ex','us','ara','ath','an','as','os','eus','ias'],
		},
		'dragonborn': { kind: 'syllable',
			pre: ['Ach','Arj','Ark','Bala','Brae','Chra','Drak','Dras','Drax','Ghar','Grath','Grax','Kaar','Khal','Krag','Mech','Naer','Nax','Rath','Rax','Rex','Sarx','Skaar','Thar','Thav','Vrak','Vrax','Xan','Zar','Zel'],
			suf: ['akai','akir','an','ar','arith','ash','ax','axan','el','enth','ix','or','os','rak','rax','thix','ur','vaxis'],
		},
		'tavern': { kind: 'compound',
			prefix: 'The ',
			a: ['Golden','Silver','Iron','Rusty','Broken','Laughing','Dancing','Prancing','Wandering','Sleeping','Fallen','Burning','Frosty','Wicked','Lucky','Blind','Mad','Bold','Brave','Weary','Merry','Jolly','Painted','Crimson','Howling'],
			b: ['Dragon','Sword','Shield','Helm','Axe','Flagon','Goblet','Barrel','Pony','Griffin','Unicorn','Mermaid','Fox','Wolf','Bear','Eagle','Knight','Pilgrim','Raven','Owl','Monk','Serpent','Stag','Boar','Crow'],
			sep: ' ',
		},
		'town': { kind: 'compound',
			a: ['Ash','Black','Bright','Crest','Dark','East','Far','Fen','Gale','Glen','Gold','Green','Grey','High','Hollow','Iron','Long','Marsh','Mill','Moon','New','North','Oak','Old','Pine','Red','River','Rock','Rose','Silver','South','Stone','Storm','Swift','West','White','Wind','Wood'],
			b: ['bridge','brook','bury','cliff','dale','den','falls','field','ford','gate','glen','grove','ham','haven','hill','hold','hollow','keep','ley','mead','mere','mill','moor','mouth','peak','ridge','rock','shire','spring','stead','ton','vale','view','watch','well','wick','wood'],
		},
	};

	const nameTypeOptions = [
		{ value: 'human-male',   label: 'Human (Male)'    },
		{ value: 'human-female', label: 'Human (Female)'  },
		{ value: 'elf',          label: 'Elf'             },
		{ value: 'dwarf',        label: 'Dwarf'           },
		{ value: 'halfling',     label: 'Halfling'        },
		{ value: 'gnome',        label: 'Gnome'           },
		{ value: 'orc',          label: 'Orc / Half-Orc'  },
		{ value: 'tiefling',     label: 'Tiefling'        },
		{ value: 'dragonborn',   label: 'Dragonborn'      },
		{ value: 'tavern',       label: 'Tavern Name'     },
		{ value: 'town',         label: 'Town / Village'  },
	];

	let nameType = $state('human-male');
	let generatedNames = $state<string[]>([]);
	let generatedSurnames = $state<string[]>([]);

	const surnameData: Record<string, NameDef> = {
		'human-male':   { kind: 'compound',
			a: ['Ash','Black','Bright','Brown','Cross','Drake','Fair','Gold','Good','Grey','Hard','High','Iron','Long','Quick','Red','Rock','Sharp','Silver','Stone','Storm','Strong','Swift','White','Wild','Wood'],
			b: ['brook','burn','cliff','crest','dale','den','field','ford','gate','grove','ham','hill','hollow','marsh','mead','mere','mill','moor','ridge','rock','shore','side','stead','stone','ton','vale','well','wick','wood'],
		},
		'human-female': { kind: 'compound',
			a: ['Ash','Black','Bright','Brown','Cross','Drake','Fair','Gold','Good','Grey','Hard','High','Iron','Long','Quick','Red','Rock','Sharp','Silver','Stone','Storm','Strong','Swift','White','Wild','Wood'],
			b: ['brook','burn','cliff','crest','dale','den','field','ford','gate','grove','ham','hill','hollow','marsh','mead','mere','mill','moor','ridge','rock','shore','side','stead','stone','ton','vale','well','wick','wood'],
		},
		'elf': { kind: 'compound',
			a: ['Aer','Aiel','Aur','Cal','Dawn','Dusk','Ever','Gal','Gil','Golden','High','Lith','Moon','Night','Silver','Sol','Star','Sun','Tal','Wind'],
			b: ['bloom','breeze','dance','dawn','dream','glade','gleam','glimmer','grace','leaf','light','mist','river','rose','shade','shimmer','song','star','stream','vale','whisper','wing'],
		},
		'dwarf': { kind: 'compound',
			a: ['Anvil','Axe','Battle','Black','Coal','Dark','Deep','Fire','Flint','Forge','Gold','Granite','Grim','Iron','Marble','Rock','Rune','Silver','Steel','Stone','Thunder','War'],
			b: ['anvil','axe','breaker','crafted','forge','fist','grim','hammer','hand','hold','mace','maker','peak','ring','shield','smith','stone','strike'],
		},
		'halfling': { kind: 'compound',
			a: ['Apple','Berry','Bright','Chestnut','Clover','Cotton','Fern','Golden','Green','Honey','Meadow','Merry','Oak','Pebble','Rose','Sandy','Stone','Sweet','Thistle','Thorn','Warm','Wheat','Willow'],
			b: ['back','barn','bell','berry','bloom','bottom','burrow','bush','cheeks','den','field','foot','ford','grove','hill','home','knoll','leaf','meadow','mound','ridge','root','side','toes','vale','vine','wick','wood'],
		},
		'gnome': { kind: 'compound',
			a: ['Bright','Click','Copper','Crack','Fiz','Flash','Flick','Flint','Foam','Gear','Glim','Glint','Jolt','Kink','Pim','Pop','Snap','Spark','Spring','Tick','Tink','Twist','Whirr','Zap','Zip'],
			b: ['bolt','burst','cog','coil','cork','dial','fizzle','gadget','gear','grinder','kettle','knob','lever','nozzle','pin','pipe','plug','ratchet','rivet','screw','spark','spindle','spring','switch','tick','twist','valve','whistle','widget','wire','wrench'],
		},
		'orc': { kind: 'compound',
			a: ['Ash','Battle','Black','Blood','Bone','Broken','Claw','Dark','Death','Fang','Fire','Flesh','Gore','Grim','Iron','Night','Rage','Red','Scar','Shadow','Skull','Steel','Stone','Storm','Thunder','War','Wrath'],
			b: ['basher','biter','blade','bone','breaker','cleaver','crusher','cutter','fang','fist','grinder','hammer','hide','mauler','render','ripper','scar','shatter','smasher','splitter','stomper','striker','sunder','tooth','trampler','wrecker'],
		},
		'tiefling': { kind: 'compound',
			a: ['Bale','Carn','Curs','Dark','Death','Dread','Ember','Flame','Gloom','Hell','Hex','Ill','Mal','Mire','Night','Pain','Plague','Scorn','Shadow','Sin','Soul','Spite','Thorn','Vex','Woe','Wrath'],
			b: ['bane','blood','born','brand','curse','ember','fire','flame','forge','fury','heart','hex','mark','pyre','rise','scorn','shadow','smite','soul','spite','thorn','tide','torch','vex','wake','woe'],
		},
		'dragonborn': { kind: 'compound',
			a: ['Ash','Bitter','Black','Bone','Bright','Claw','Cold','Dark','Drake','Fire','Flame','Frost','Gold','Iron','Night','Scale','Shadow','Silver','Smoke','Storm','Stone','Thunder','Wing'],
			b: ['ash','bane','bite','blade','born','claw','crest','fang','fire','forge','fury','heart','hide','horn','jaw','maw','rage','roar','scale','scorn','shatter','shield','shine','snarl','strike','talon','thunder','tooth','veil','wrath'],
		},
	};

	function generateOneSurname(type: string): string {
		const def = surnameData[type];
		if (!def) return '';
		if (def.kind === 'compound') {
			const name = (def.prefix ?? '') + pickRandom(def.a) + (def.sep ?? '') + pickRandom(def.b);
			return name.charAt(0).toUpperCase() + name.slice(1);
		}
		const mid = def.mid && Math.random() < (def.midChance ?? 0.28) ? pickRandom(def.mid) : '';
		const name = pickRandom(def.pre) + mid + pickRandom(def.suf);
		return name.charAt(0).toUpperCase() + name.slice(1);
	}

	function generateSurnames() {
		generatedSurnames = Array.from({ length: 10 }, () => generateOneSurname(nameType));
	}

	// ── Weather Generator ─────────────────────────────────────────
	const seasonOptions = [
		{ value: 'spring', label: 'Spring' },
		{ value: 'summer', label: 'Summer' },
		{ value: 'autumn', label: 'Autumn' },
		{ value: 'winter', label: 'Winter' },
	];
	const biomeOptions = [
		{ value: 'forest',    label: 'Forest'              },
		{ value: 'plains',    label: 'Plains / Grassland'  },
		{ value: 'mountains', label: 'Mountains'           },
		{ value: 'desert',    label: 'Desert'              },
		{ value: 'arctic',    label: 'Arctic / Tundra'     },
		{ value: 'coastal',   label: 'Coastal'             },
		{ value: 'swamp',     label: 'Swamp / Marsh'       },
		{ value: 'jungle',    label: 'Jungle / Rainforest' },
	];

	// Base temperature level (0=freezing … 7=scorching) at midday
	const biomeSeasonTemp: Record<string, Record<string, number>> = {
		forest:    { spring: 4, summer: 5, autumn: 3, winter: 2 },
		plains:    { spring: 4, summer: 6, autumn: 3, winter: 2 },
		mountains: { spring: 3, summer: 5, autumn: 2, winter: 0 },
		desert:    { spring: 6, summer: 7, autumn: 5, winter: 3 },
		arctic:    { spring: 1, summer: 3, autumn: 1, winter: 0 },
		coastal:   { spring: 4, summer: 5, autumn: 3, winter: 2 },
		swamp:     { spring: 5, summer: 6, autumn: 4, winter: 3 },
		jungle:    { spring: 6, summer: 6, autumn: 6, winter: 5 },
	};
	const tempLabels = ['Freezing','Bitter cold','Cold','Cool','Mild','Warm','Hot','Scorching'];
	const timeOffsets: Record<string, number> = { dawn: -2, morning: -1, midday: 0, evening: -1, night: -2 };

	const conditionPools: Record<string, Record<string, string[]>> = {
		forest:    { spring: ['clear','partly_cloudy','partly_cloudy','light_rain','fog','overcast','light_rain'],
		             summer: ['clear','clear','partly_cloudy','thunderstorm','muggy','light_rain'],
		             autumn: ['overcast','light_rain','fog','partly_cloudy','overcast','heavy_rain'],
		             winter: ['overcast','light_snow','clear','fog','sleet','light_snow'] },
		plains:    { spring: ['clear','partly_cloudy','thunderstorm','light_rain','overcast','clear'],
		             summer: ['clear','clear','thunderstorm','partly_cloudy','haze'],
		             autumn: ['clear','overcast','light_rain','fog','partly_cloudy'],
		             winter: ['overcast','light_snow','clear','blizzard','partly_cloudy'] },
		mountains: { spring: ['partly_cloudy','overcast','light_snow','light_rain','clear','fog'],
		             summer: ['clear','partly_cloudy','thunderstorm','clear','overcast'],
		             autumn: ['overcast','heavy_snow','sleet','fog','clear','light_snow'],
		             winter: ['blizzard','heavy_snow','overcast','clear','blizzard'] },
		desert:    { spring: ['clear','clear','sandstorm','partly_cloudy','clear','haze'],
		             summer: ['clear','clear','sandstorm','haze','clear','thunderstorm'],
		             autumn: ['clear','clear','sandstorm','partly_cloudy','haze'],
		             winter: ['clear','partly_cloudy','overcast','light_rain','clear'] },
		arctic:    { spring: ['overcast','light_snow','blizzard','partly_cloudy','fog'],
		             summer: ['clear','partly_cloudy','fog','light_rain','overcast'],
		             autumn: ['overcast','heavy_snow','blizzard','fog','light_snow'],
		             winter: ['blizzard','heavy_snow','overcast','clear','blizzard'] },
		coastal:   { spring: ['partly_cloudy','fog','light_rain','overcast','clear','strong_wind'],
		             summer: ['clear','partly_cloudy','fog','clear','thunderstorm'],
		             autumn: ['overcast','heavy_rain','fog','thunderstorm','partly_cloudy'],
		             winter: ['overcast','heavy_rain','fog','sleet','clear'] },
		swamp:     { spring: ['fog','light_rain','overcast','muggy','partly_cloudy','fog'],
		             summer: ['muggy','heavy_rain','thunderstorm','fog','overcast'],
		             autumn: ['fog','overcast','light_rain','muggy','heavy_rain'],
		             winter: ['fog','overcast','sleet','cold_rain','partly_cloudy'] },
		jungle:    { spring: ['heavy_rain','light_rain','muggy','partly_cloudy','thunderstorm'],
		             summer: ['heavy_rain','thunderstorm','muggy','overcast','heavy_rain'],
		             autumn: ['heavy_rain','muggy','partly_cloudy','thunderstorm','overcast'],
		             winter: ['light_rain','muggy','partly_cloudy','overcast','light_rain'] },
	};

	type SlotTexts = { dawn: string; morning: string; midday: string; evening: string; night: string };
	const conditionSlots: Record<string, SlotTexts> = {
		clear:        { dawn:'☀️ Clear, stars fading',      morning:'☀️ Bright sunshine',         midday:'☀️ Clear blue skies',     evening:'☀️ Golden hour',          night:'✨ Clear, starry sky'      },
		partly_cloudy:{ dawn:'⛅ Thin clouds at sunrise',   morning:'⛅ Partly cloudy',            midday:'⛅ Partly cloudy',         evening:'⛅ Drifting clouds',       night:'⛅ Patchy clouds'           },
		overcast:     { dawn:'☁️ Leaden skies',             morning:'☁️ Overcast',                midday:'☁️ Heavy cloud cover',    evening:'☁️ Dark and overcast',    night:'☁️ No stars visible'      },
		light_rain:   { dawn:'🌦 Light drizzle',            morning:'🌦 Patchy showers',           midday:'🌦 Steady drizzle',       evening:'🌧 Light rain',           night:'🌧 Drizzle overnight'    },
		heavy_rain:   { dawn:'🌧 Heavy rain',               morning:'🌧 Downpour',                 midday:'🌧 Persistent heavy rain', evening:'🌧 Sheets of rain',       night:'🌧 Relentless rain'      },
		thunderstorm: { dawn:'⛈ Distant thunder',          morning:'⛈ Storm building',           midday:'⛈ Thunderstorm',          evening:'⛈ Violent storm',         night:'⛈ Thunder and lightning'  },
		fog:          { dawn:'🌫 Dense fog',                morning:'🌫 Fog lifting slowly',       midday:'🌫 Patchy fog',            evening:'🌫 Mist rolling in',      night:'🌫 Thick fog'             },
		light_snow:   { dawn:'🌨 Dusting of snow',          morning:'🌨 Light flurries',           midday:'🌨 Light snowfall',        evening:'🌨 Snowflakes drifting',  night:'❄️ Light snow overnight'  },
		heavy_snow:   { dawn:'❄️ Heavy snow',               morning:'❄️ Thick snowfall',           midday:'❄️ Heavy snowstorm',      evening:'❄️ Blinding snow',        night:'❄️ Deep snow falling'      },
		blizzard:     { dawn:'❄️ Blizzard conditions',      morning:'❄️ Whiteout',                 midday:'❄️ Blizzard, zero vis.',  evening:'❄️ Raging blizzard',      night:'❄️ Blizzard raging'        },
		sleet:        { dawn:'🌧 Icy sleet',                morning:'🌧 Sleet and rain',           midday:'🌧 Sleet',                evening:'❄️ Sleet turning to snow', night:'❄️ Frozen sleet'           },
		sandstorm:    { dawn:'🏜️ Dust rising',              morning:'🏜️ Sandstorm building',       midday:'🏜️ Full sandstorm',      evening:'🏜️ Sand gusts',           night:'🏜️ Gritty winds'           },
		haze:         { dawn:'🌅 Hazy dawn',                morning:'☀️ Hazy sunshine',            midday:'☀️ Scorching haze',       evening:'🌅 Hazy sunset',          night:'⛅ Hazy night sky'           },
		muggy:        { dawn:'💧 Muggy and damp',           morning:'💧 Humid, oppressive',        midday:'💧 Stifling heat',         evening:'⛈ Muggy, storms brewing', night:'💧 Hot and humid'         },
		strong_wind:  { dawn:'💨 Gusty winds',              morning:'💨 Strong coastal winds',     midday:'💨 Powerful gusts',        evening:'💨 Howling wind',         night:'💨 Gale-force winds'     },
		cold_rain:    { dawn:'🌧 Cold grey rain',           morning:'🌧 Frigid drizzle',           midday:'🌧 Cold steady rain',      evening:'🌧 Bone-chilling rain',   night:'🌧 Cold rain'             },
	};

	const conditionBg: Record<string, string> = {
		clear:'bg-amber-950/20', partly_cloudy:'bg-gray-800/40', overcast:'bg-gray-900/60',
		light_rain:'bg-blue-950/40', heavy_rain:'bg-blue-950/60', thunderstorm:'bg-indigo-950/60',
		fog:'bg-gray-800/60', light_snow:'bg-slate-800/50', heavy_snow:'bg-slate-800/70',
		blizzard:'bg-slate-900/80', sleet:'bg-slate-800/50', sandstorm:'bg-amber-900/40',
		haze:'bg-amber-900/30', muggy:'bg-green-950/40', strong_wind:'bg-gray-800/40', cold_rain:'bg-blue-950/40',
	};

	const windByCondition: Record<string, string[]> = {
		thunderstorm:['Strong wind','Gusting','Gale'],
		blizzard:    ['Gale','Howling gale','Strong wind'],
		sandstorm:   ['Strong wind','Gusting','Gale'],
		heavy_rain:  ['Moderate wind','Strong wind','Gusting'],
		strong_wind: ['Strong wind','Gusting','Gale'],
		clear:       ['Calm','Calm','Light breeze'],
		fog:         ['Calm','Calm','Light breeze'],
		haze:        ['Calm','Calm','Light breeze'],
	};
	const defaultWindPool = ['Calm','Light breeze','Light breeze','Moderate wind','Moderate wind','Strong wind'];

	const weatherDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
	const weatherTimeSlots = ['dawn','morning','midday','evening','night'] as const;
	const timeSlotLabels: Record<string, string> = {
		dawn:'Dawn', morning:'Morning', midday:'Midday', evening:'Evening', night:'Night'
	};

	type WeatherSlot = { sky: string; temp: string; wind: string; condition: string };
	type DayWeather  = { day: string; slots: Record<string, WeatherSlot> };

	let selectedSeason = $state('spring');
	let selectedBiome  = $state('forest');
	let weekWeather    = $state<DayWeather[]>([]);

	const biomePaceData: Record<string, { mult: number; reason: string }> = {
		forest:    { mult: 0.75, reason: 'Dense undergrowth, no roads' },
		plains:    { mult: 1.0,  reason: 'Open ground' },
		mountains: { mult: 0.5,  reason: 'Steep terrain and altitude' },
		desert:    { mult: 0.75, reason: 'Sand, heat, no trails' },
		arctic:    { mult: 0.75, reason: 'Snow, ice, and cold' },
		coastal:   { mult: 1.0,  reason: 'Open shoreline' },
		swamp:     { mult: 0.5,  reason: 'Deep mud and water crossings' },
		jungle:    { mult: 0.5,  reason: 'Thick vegetation, no trails' },
	};
	const seasonPaceData: Record<string, { mult: number; reason: string }> = {
		spring: { mult: 0.9,  reason: 'Muddy trails and spring floods' },
		summer: { mult: 1.0,  reason: 'Clear conditions' },
		autumn: { mult: 0.95, reason: 'Wet ground and shortening days' },
		winter: { mult: 0.75, reason: 'Snow, ice, and bitter cold' },
	};
	const paceMult = $derived(
		(biomePaceData[selectedBiome]?.mult ?? 1) * (seasonPaceData[selectedSeason]?.mult ?? 1)
	);
	const biomeMult   = $derived(biomePaceData[selectedBiome]?.mult ?? 1);
	const seasonMult  = $derived(seasonPaceData[selectedSeason]?.mult ?? 1);
	const biomeReason = $derived(biomePaceData[selectedBiome]?.reason ?? '');
	const seasonReason = $derived(seasonPaceData[selectedSeason]?.reason ?? '');
	const paceRows = $derived([
		['Fast',   '400 ft/min', (4 * paceMult).toFixed(1) + ' mph', Math.round(30 * paceMult) + ' miles', '−5 to passive Perception; cannot use Stealth'],
		['Normal', '300 ft/min', (3 * paceMult).toFixed(1) + ' mph', Math.round(24 * paceMult) + ' miles', 'No effect'],
		['Slow',   '200 ft/min', (2 * paceMult).toFixed(1) + ' mph', Math.round(18 * paceMult) + ' miles', 'Can move stealthily; able to forage while traveling'],
	] as [string,string,string,string,string][]);


	function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

	function generateWeek() {
		const baseTemp = biomeSeasonTemp[selectedBiome]?.[selectedSeason] ?? 4;
		const pool     = conditionPools[selectedBiome]?.[selectedSeason] ?? ['clear','partly_cloudy','overcast'];
		const result: DayWeather[] = [];
		let frontCondition = pickRandom(pool);
		let frontDaysLeft  = Math.floor(Math.random() * 3) + 1;
		for (const day of weatherDays) {
			if (frontDaysLeft <= 0) {
				frontCondition = pickRandom(pool);
				frontDaysLeft  = Math.floor(Math.random() * 3) + 1;
			}
			frontDaysLeft--;
			const slots: Record<string, WeatherSlot> = {};
			for (const t of weatherTimeSlots) {
				const condition = Math.random() < 0.18 ? pickRandom(pool) : frontCondition;
				const slotTexts = conditionSlots[condition] ?? conditionSlots['clear'];
				const sky       = slotTexts[t];
				const tempIdx   = clamp(baseTemp + (timeOffsets[t] ?? 0), 0, 7);
				const temp      = tempLabels[tempIdx];
				const wPool     = windByCondition[condition] ?? defaultWindPool;
				const wind      = pickRandom(wPool);
				slots[t] = { sky, temp, wind, condition };
			}
			result.push({ day, slots });
		}
		weekWeather = result;
	}

	function pickRandom<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	function generateOneName(type: string): string {
		const def = nameData[type];
		if (!def) return '';
		if (def.kind === 'compound') {
			return (def.prefix ?? '') + pickRandom(def.a) + (def.sep ?? '') + pickRandom(def.b);
		}
		const mid = def.mid && Math.random() < (def.midChance ?? 0.28)
			? pickRandom(def.mid) : '';
		const name = pickRandom(def.pre) + mid + pickRandom(def.suf);
		return name.charAt(0).toUpperCase() + name.slice(1);
	}

	function generateNames() {
		generatedNames = Array.from({ length: 10 }, () => generateOneName(nameType));
	}
</script>

<!-- Backdrop -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex flex-col bg-gray-950"
	onkeydown={(e) => e.key === 'Escape' && onclose()}
>
	<!-- Header -->
	<div class="flex shrink-0 items-center gap-3 border-b border-gray-800 bg-gray-900 px-6 py-3">
		<span class="text-xl">📖</span>
		<h2 class="text-lg font-black tracking-widest text-amber-400 uppercase">Quick Reference</h2>
		<p class="ml-2 hidden text-xs text-gray-500 sm:block">D&amp;D 5e combat reference</p>
		<button
			onclick={onclose}
			class="ml-auto rounded-lg border border-gray-700 p-1.5 text-gray-400 transition hover:border-gray-500 hover:text-white"
			title="Close"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- Body -->
	<div class="flex min-h-0 flex-1">
		<!-- Left nav -->
		<nav class="w-52 shrink-0 overflow-y-auto border-r border-gray-800 bg-gray-900/60 py-3">
			{#each categories as cat}
				<button
					onclick={() => (selected = cat.id)}
					class="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition
					       {selected === cat.id
						? 'bg-amber-900/30 font-semibold text-amber-300'
						: 'text-gray-400 hover:bg-gray-800 hover:text-white'}"
				>
					<span class="text-base leading-none">{cat.icon}</span>
					{cat.label}
				</button>
			{/each}
		</nav>

		<!-- Right content panel -->
		<div class="min-w-0 flex-1 overflow-y-auto px-8 py-6">

			<!-- ── Actions in Combat ────────────────────────────────── -->
			{#if selected === 'actions'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Actions in Combat</h3>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="pb-2 text-left font-semibold text-gray-400 w-36">Action</th>
							<th class="pb-2 text-left font-semibold text-gray-400">Effect</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [
							['Attack',       'Make one attack (more with Extra Attack). Replace one attack with a grapple or shove.'],
							['Dash',         'Double your movement for the turn.'],
							['Disengage',    'Your movement doesn\'t provoke opportunity attacks this turn.'],
							['Dodge',        'Attacks against you have disadvantage. DEX saves have advantage. Benefit lost if incapacitated or speed drops to 0.'],
							['Help',         'Give an ally advantage on their next ability check or one attack roll against a creature within 5 ft of you.'],
							['Hide',         'Make a Stealth check. You become hidden if you beat the DC.'],
							['Ready',        'Choose an action and a trigger. React to execute the action when the trigger occurs (before your next turn).'],
							['Search',       'Devote attention to finding something — Perception or Investigation check.'],
							['Use an Object','Interact with a second object (first is free) or use a special item property.'],
							['Cast a Spell', 'Cast any spell with a casting time of 1 action.'],
							['Use Class Feature', 'Activate a feature that requires an action (e.g. Second Wind, Divine Smite prep).'],
							['Improvise',    'Attempt any reasonable action not listed. DM sets the rules on the fly.'],
						] as [action, desc]}
							<tr>
								<td class="py-2 pr-4 font-semibold text-white align-top">{action}</td>
								<td class="py-2 text-gray-300">{desc}</td>
							</tr>
						{/each}
					</tbody>
				</table>

			<!-- ── Bonus Actions ────────────────────────────────────── -->
			{:else if selected === 'bonus'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Bonus Actions</h3>
				<div class="mb-4 rounded-lg border border-amber-800/40 bg-amber-900/10 px-4 py-3 text-sm text-amber-200">
					You may only take <strong>one bonus action per turn</strong>. A bonus action can only be taken when a feature, spell, or ability specifically grants one.
				</div>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="pb-2 text-left font-semibold text-gray-400 w-48">Source</th>
							<th class="pb-2 text-left font-semibold text-gray-400">Bonus Action</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [
							['Two-Weapon Fighting',       'Attack with your off-hand light weapon (no ability modifier to damage).'],
							['Spell (bonus action)',      'Cast any spell with a casting time of 1 bonus action. Can\'t cast another non-cantrip spell on the same turn.'],
							['Rogue — Cunning Action',    'Dash, Disengage, or Hide.'],
							['Druid — Wild Shape',        'Transform into a beast you\'ve seen.'],
							['Monk — Flurry of Blows',    'Spend 1 ki: two unarmed strikes.'],
							['Monk — Patient Defense',    'Spend 1 ki: take Dodge action as bonus.'],
							['Monk — Step of the Wind',   'Spend 1 ki: Disengage or Dash; jump distance doubled.'],
							['Paladin — Divine Smite',    'Expend a spell slot after hitting to add radiant damage.'],
							['Warlock — Hex / Hunter\'s Mark', 'Cast at normal casting time; move the curse/mark as bonus action.'],
						] as [src, desc]}
							<tr>
								<td class="py-2 pr-4 font-semibold text-white align-top">{src}</td>
								<td class="py-2 text-gray-300">{desc}</td>
							</tr>
						{/each}
					</tbody>
				</table>

			<!-- ── Movement & Position ──────────────────────────────── -->
			{:else if selected === 'movement'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Movement &amp; Position</h3>
				<div class="space-y-6 text-sm">
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">General Rules</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>• Move up to your speed. You can split movement before and after your action.</li>
							<li>• <strong class="text-white">Difficult terrain</strong> costs 2 ft of movement per 1 ft traveled.</li>
							<li>• <strong class="text-white">Standing from prone</strong> costs half your speed.</li>
							<li>• <strong class="text-white">Crawling</strong> (while prone) costs 1 extra foot per foot moved.</li>
							<li>• <strong class="text-white">Climbing / Swimming</strong> costs 1 extra foot per foot unless you have a climb/swim speed.</li>
							<li>• <strong class="text-white">Jumping</strong> — long jump: STR score in feet (running start); high jump: 3 + STR modifier in feet.</li>
						</ul>
					</section>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Opportunity Attacks</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>• Triggered when a hostile creature <strong class="text-white">leaves your reach</strong> without Disengaging.</li>
							<li>• Reaction: make one melee attack against the creature.</li>
							<li>• Teleportation and being moved by another creature does <em>not</em> trigger OAs.</li>
						</ul>
					</section>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Squeezing Through Tight Spaces</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>• A creature can squeeze through a space one size smaller than itself.</li>
							<li>• Costs 1 extra foot per foot moved.</li>
							<li>• Disadvantage on attack rolls and DEX saves; attacks against you have advantage.</li>
						</ul>
					</section>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Space &amp; Size</h4>
						<table class="w-full">
							<thead>
								<tr class="border-b border-gray-700">
									<th class="pb-2 text-left font-semibold text-gray-400">Size</th>
									<th class="pb-2 text-left font-semibold text-gray-400">Space</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800">
								{#each [['Tiny','2½ × 2½ ft'],['Small','5 × 5 ft'],['Medium','5 × 5 ft'],['Large','10 × 10 ft'],['Huge','15 × 15 ft'],['Gargantuan','20 × 20 ft or larger']] as [size, space]}
									<tr>
										<td class="py-1.5 pr-4 font-semibold text-white">{size}</td>
										<td class="py-1.5 text-gray-300">{space}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</section>
				</div>

			<!-- ── Conditions ───────────────────────────────────────── -->
			{:else if selected === 'conditions'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Conditions</h3>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="pb-2 text-left font-semibold text-gray-400 w-32">Condition</th>
							<th class="pb-2 text-left font-semibold text-gray-400">Key Effect</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [
							['Blinded',       'Can\'t see. Attacks against it have advantage; its attacks have disadvantage. Auto-fail checks requiring sight.'],
							['Charmed',       'Can\'t attack the charmer. Charmer has advantage on social ability checks against it.'],
							['Deafened',      'Can\'t hear. Auto-fail checks requiring hearing.'],
							['Exhausted',     'See Exhaustion table. Removed by long rest (one level per rest).'],
							['Frightened',    'Disadvantage on ability checks and attacks while source is in line of sight. Can\'t willingly move closer to source.'],
							['Grappled',      'Speed = 0. Ends if grappler is incapacitated or if creature is moved out of reach.'],
							['Incapacitated', 'Can\'t take actions or reactions.'],
							['Invisible',     'Can\'t be seen normally. Attacks against it have disadvantage; its attacks have advantage. Location still detectable by noise.'],
							['Paralyzed',     'Incapacitated; can\'t move or speak. Auto-fail STR/DEX saves. Attacks against it have advantage. Hits within 5 ft are critical hits.'],
							['Petrified',     'Transformed to stone; incapacitated; can\'t move or speak; unaware of surroundings. Resistance to all damage; immune to poison/disease. Auto-fail STR/DEX saves. Attacks have advantage.'],
							['Poisoned',      'Disadvantage on attack rolls and ability checks.'],
							['Prone',         'Can only crawl or stand up (costs half speed). Disadvantage on attack rolls. Melee attacks against it have advantage; ranged attacks have disadvantage.'],
							['Restrained',    'Speed = 0. Attacks against it have advantage; its attacks have disadvantage. Disadvantage on DEX saves.'],
							['Stunned',       'Incapacitated; can\'t move; can only speak falteringly. Auto-fail STR/DEX saves. Attacks against it have advantage.'],
							['Unconscious',   'Incapacitated; can\'t move or speak; unaware of surroundings. Drops held items; falls prone. Auto-fail STR/DEX saves. Attacks have advantage; hits within 5 ft are critical.'],
						] as [cond, desc]}
							<tr>
								<td class="py-2 pr-4 font-semibold text-white align-top">{cond}</td>
								<td class="py-2 text-gray-300">{desc}</td>
							</tr>
						{/each}
					</tbody>
				</table>

			<!-- ── Concentration ────────────────────────────────────── -->
			{:else if selected === 'concentration'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Concentration</h3>
				<div class="space-y-4 text-sm text-gray-300">
					<p>Maintaining a concentration spell requires focus. Only <strong class="text-white">one concentration spell</strong> may be active at a time — casting a second automatically ends the first.</p>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Concentration Breaks When…</h4>
						<ul class="space-y-1.5">
							<li>• <strong class="text-white">Damage taken</strong> — CON saving throw DC = max(10, ½ damage taken). Round down.</li>
							<li>• <strong class="text-white">Multiple hits same turn</strong> — separate save for each hit.</li>
							<li>• <strong class="text-white">Incapacitated or killed.</strong></li>
							<li>• <strong class="text-white">DM discretion</strong> — e.g. knocked prone by a large wave, crashing through a window.</li>
						</ul>
					</section>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">CON Save DC Quick Reference</h4>
						<table class="w-full max-w-xs">
							<thead>
								<tr class="border-b border-gray-700">
									<th class="pb-2 text-left font-semibold text-gray-400">Damage Taken</th>
									<th class="pb-2 text-left font-semibold text-gray-400">DC</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800">
								{#each [['1–19','10'],['20–21','10'],['22–23','11'],['24–25','12'],['26–27','13'],['28–29','14'],['30–31','15'],['40–41','20'],['50+','25']] as [dmg, dc]}
									<tr>
										<td class="py-1.5 pr-4 text-white">{dmg}</td>
										<td class="py-1.5 text-amber-300 font-bold">{dc}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</section>
					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Keeping Concentration</h4>
						<ul class="space-y-1.5">
							<li>• <strong class="text-white">War Caster feat</strong>: advantage on CON saves to maintain concentration.</li>
							<li>• <strong class="text-white">Resilient (Constitution) feat</strong>: proficiency on CON saves.</li>
							<li>• Concentration spells still require verbal/somatic components to cast.</li>
						</ul>
					</section>
				</div>

			<!-- ── Death Saving Throws ──────────────────────────────── -->
			{:else if selected === 'death'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Death Saving Throws</h3>
				<div class="space-y-4 text-sm text-gray-300">
					<p>When a creature drops to <strong class="text-white">0 HP</strong>, it falls unconscious and begins making death saving throws at the start of each of its turns. No ability modifier applies.</p>
					<table class="w-full max-w-sm">
						<thead>
							<tr class="border-b border-gray-700">
								<th class="pb-2 text-left font-semibold text-gray-400">Roll</th>
								<th class="pb-2 text-left font-semibold text-gray-400">Result</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each [
								['Nat 1',  '2 failures'],
								['2–9',    '1 failure'],
								['10–19',  '1 success'],
								['Nat 20', 'Regain 1 HP; stand up immediately'],
							] as [roll, result]}
								<tr>
									<td class="py-1.5 pr-4 font-semibold text-white">{roll}</td>
									<td class="py-1.5 text-gray-300">{result}</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<ul class="space-y-1.5">
						<li>• <strong class="text-white">3 successes</strong> — stabilized (unconscious but no longer dying).</li>
						<li>• <strong class="text-white">3 failures</strong> — dead.</li>
						<li>• <strong class="text-white">Taking damage at 0 HP</strong> — 1 failure (critical hit = 2 failures).</li>
						<li>• <strong class="text-white">Massive damage</strong> — if damage from a single hit equals or exceeds max HP, instant death.</li>
						<li>• Stabilized creatures regain 1 HP after 1d4 hours if not healed first.</li>
						<li>• Successes and failures reset when the creature regains any HP.</li>
					</ul>
				</div>

			<!-- ── Exhaustion ───────────────────────────────────────── -->
			{:else if selected === 'exhaustion'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Exhaustion</h3>
				<p class="mb-4 text-sm text-gray-300">Effects are cumulative. A long rest removes <strong class="text-white">one level</strong> of exhaustion (requires food and water).</p>
				<table class="w-full max-w-md text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="pb-2 text-left font-semibold text-gray-400 w-16">Level</th>
							<th class="pb-2 text-left font-semibold text-gray-400">Effect</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [
							['1','Disadvantage on ability checks'],
							['2','Speed halved'],
							['3','Disadvantage on attack rolls and saving throws'],
							['4','Hit point maximum halved'],
							['5','Speed reduced to 0'],
							['6','Death'],
						] as [lvl, effect]}
							<tr>
								<td class="py-2 pr-4 font-black text-amber-300 text-lg">{lvl}</td>
								<td class="py-2 text-gray-300 {lvl === '6' ? 'text-red-400 font-semibold' : ''}">{effect}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<p class="mt-4 text-xs text-gray-500">Common sources: forced march, swimming in armor, starvation, some spells and monster abilities.</p>

			<!-- ── Cover ────────────────────────────────────────────── -->
			{:else if selected === 'cover'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Cover</h3>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="pb-2 text-left font-semibold text-gray-400 w-44">Type</th>
							<th class="pb-2 text-left font-semibold text-gray-400 w-24">Bonus</th>
							<th class="pb-2 text-left font-semibold text-gray-400">Examples</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [
							['Half Cover',           '+2 AC &amp; DEX saves', 'Low wall, large furniture, another creature'],
							['Three-Quarters Cover', '+5 AC &amp; DEX saves', 'Portcullis, arrow slit, thick tree trunk'],
							['Full Cover',           'Can\'t be targeted',    'Completely hidden behind a solid barrier'],
						] as [type, bonus, examples]}
							<tr>
								<td class="py-2 pr-4 font-semibold text-white align-top">{type}</td>
								<td class="py-2 pr-4 text-amber-300 font-bold align-top">{@html bonus}</td>
								<td class="py-2 text-gray-400">{examples}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<p class="mt-4 text-sm text-gray-400">A target has cover based on the <strong class="text-white">most obstructing obstacle</strong> between attacker and target. Cover only applies if the obstacle is between the attacker's position and the target — draw a line from the attacker to the target to determine.</p>

			<!-- ── Light & Vision ───────────────────────────────────── -->
			{:else if selected === 'light'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Light &amp; Vision</h3>
				<div class="space-y-5 text-sm">
					<table class="w-full">
						<thead>
							<tr class="border-b border-gray-700">
								<th class="pb-2 text-left font-semibold text-gray-400 w-44">Light Level</th>
								<th class="pb-2 text-left font-semibold text-gray-400">Effect</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each [
								['Bright Light',    'Normal vision for all creatures.'],
								['Dim Light',       'Lightly obscured. Disadvantage on Perception checks relying on sight.'],
								['Darkness',        'Heavily obscured. Creatures effectively blinded unless they have Darkvision or Truesight.'],
							] as [light, effect]}
								<tr>
									<td class="py-2 pr-4 font-semibold text-white align-top">{light}</td>
									<td class="py-2 text-gray-300">{effect}</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<table class="w-full">
						<thead>
							<tr class="border-b border-gray-700">
								<th class="pb-2 text-left font-semibold text-gray-400 w-44">Vision Type</th>
								<th class="pb-2 text-left font-semibold text-gray-400">What It Does</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each [
								['Darkvision',     'Treat darkness as dim light (can see in B&amp;W) up to range. Dim light still treated as dim light.'],
								['Blindsight',     'Perceive surroundings without relying on sight up to range. Unaffected by invisibility or darkness.'],
								['Tremorsense',    'Detect vibrations; can sense creatures in contact with the same ground up to range.'],
								['Truesight',      'See in magical darkness, see invisible creatures, see into the Ethereal Plane, and detect illusions/shapechangers up to range.'],
							] as [type, desc]}
								<tr>
									<td class="py-2 pr-4 font-semibold text-white align-top">{type}</td>
									<td class="py-2 text-gray-300">{@html desc}</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<div>
						<h4 class="mb-2 font-semibold text-gray-200">Obscurement</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>• <strong class="text-white">Lightly obscured</strong> (dim light, patchy fog, foliage): disadvantage on Perception checks relying on sight.</li>
							<li>• <strong class="text-white">Heavily obscured</strong> (darkness, dense fog, thick foliage): effectively blinded.</li>
						</ul>
					</div>
				</div>

			<!-- ── Resting ───────────────────────────────────────────── -->
			{:else if selected === 'resting'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Resting</h3>
				<div class="space-y-5 text-sm text-gray-300">
					<section class="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
						<h4 class="mb-2 font-black text-gray-100">Short Rest <span class="ml-2 font-normal text-gray-500">— 1+ hour</span></h4>
						<ul class="space-y-1.5">
							<li>• Spend any number of <strong class="text-white">Hit Dice</strong>: roll each + CON modifier; regain that many HP.</li>
							<li>• Recover class features that refresh on a short rest (e.g. Warlock spell slots, Monk ki, Fighter Action Surge &amp; Second Wind).</li>
							<li>• Can be interrupted — requires 1 uninterrupted hour to benefit.</li>
						</ul>
					</section>
					<section class="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
						<h4 class="mb-2 font-black text-gray-100">Long Rest <span class="ml-2 font-normal text-gray-500">— 8 hours (6+ sleeping)</span></h4>
						<ul class="space-y-1.5">
							<li>• Regain <strong class="text-white">all HP</strong>.</li>
							<li>• Regain <strong class="text-white">spent Hit Dice</strong> up to half your maximum (minimum 1).</li>
							<li>• Regain <strong class="text-white">all spell slots</strong> and expended class features.</li>
							<li>• Remove <strong class="text-white">one level of exhaustion</strong> (if fed and watered).</li>
							<li>• Can take a long rest only <strong class="text-white">once per 24 hours</strong>.</li>
							<li>• More than 1 hour of combat or strenuous activity interrupts the rest.</li>
						</ul>
					</section>
				</div>

			<!-- ── Ability Check DCs ─────────────────────────────────── -->
			{:else if selected === 'checks'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Ability Check DCs</h3>
				<table class="mb-6 w-full max-w-xs text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="pb-2 text-left font-semibold text-gray-400">Difficulty</th>
							<th class="pb-2 text-left font-semibold text-gray-400">DC</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [
							['Very Easy',         '5'],
							['Easy',              '10'],
							['Medium',            '15'],
							['Hard',              '20'],
							['Very Hard',         '25'],
							['Nearly Impossible', '30'],
						] as [diff, dc]}
							<tr>
								<td class="py-1.5 pr-4 text-white">{diff}</td>
								<td class="py-1.5 font-black text-amber-300 text-lg">{dc}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<div class="space-y-3 text-sm text-gray-300">
					<p><strong class="text-white">Contested checks:</strong> both sides roll their relevant ability. Higher total wins. Ties go to the creature that initiated the contest.</p>
					<p><strong class="text-white">Passive checks</strong> (e.g. Passive Perception) = 10 + all modifiers (including proficiency and advantage/disadvantage ±5).</p>
					<p><strong class="text-white">Group checks:</strong> everyone rolls — if at least half the group succeeds, the group succeeds.</p>
				</div>

			<!-- ── Common Save DCs ───────────────────────────────────── -->
			{:else if selected === 'saves'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Common Save DCs</h3>
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700">
							<th class="pb-2 text-left font-semibold text-gray-400 w-56">Save</th>
							<th class="pb-2 text-left font-semibold text-gray-400">DC Formula</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-800">
						{#each [
							['Spell save DC',            '8 + proficiency bonus + spellcasting ability modifier'],
							['Concentration save',       'max(10, ½ damage taken) — round down'],
							['Grapple (escape)',         'Grappler\'s Athletics vs. your Athletics or Acrobatics'],
							['Shove (resist)',           'Attacker\'s Athletics vs. your Athletics or Acrobatics'],
							['Trap / environmental',     'Varies — typically DC 10–20 based on trap tier'],
							['Poison (generic)',         'Typically DC 10–15; varies by source'],
						] as [save, formula]}
							<tr>
								<td class="py-2 pr-4 font-semibold text-white align-top">{save}</td>
								<td class="py-2 text-gray-300">{formula}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<div class="mt-5 space-y-2 text-sm text-gray-300">
					<h4 class="font-semibold text-gray-200">Spell Save DC by Modifier &amp; Proficiency</h4>
					<table class="w-full max-w-sm">
						<thead>
							<tr class="border-b border-gray-700">
								<th class="pb-1 text-left font-semibold text-gray-400">Modifier</th>
								{#each ['+2','+3','+4','+5','+6'] as prof}
									<th class="pb-1 text-center font-semibold text-gray-400">Prof {prof}</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each [
								['+1', 11, 12, 13, 14, 15],
								['+2', 12, 13, 14, 15, 16],
								['+3', 13, 14, 15, 16, 17],
								['+4', 14, 15, 16, 17, 18],
								['+5', 15, 16, 17, 18, 19],
							] as [mod, ...dcs]}
								<tr>
									<td class="py-1 pr-2 font-semibold text-white">{mod}</td>
									{#each dcs as dc}
										<td class="py-1 text-center text-amber-200">{dc}</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

			<!-- ── Encounter Difficulty ──────────────────────────────── -->
			{:else if selected === 'xp'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Encounter Difficulty</h3>
				<div class="space-y-5 text-sm">
					<div>
						<h4 class="mb-2 font-semibold text-gray-200">XP Thresholds per Character Level</h4>
						<table class="w-full max-w-lg">
							<thead>
								<tr class="border-b border-gray-700">
									<th class="pb-2 text-left font-semibold text-gray-400 w-16">Level</th>
									<th class="pb-2 text-right font-semibold text-gray-400">Easy</th>
									<th class="pb-2 text-right font-semibold text-gray-400">Medium</th>
									<th class="pb-2 text-right font-semibold text-gray-400">Hard</th>
									<th class="pb-2 text-right font-semibold text-gray-400">Deadly</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800 text-gray-300">
								{#each [
									[1,25,50,75,100],[2,50,100,150,200],[3,75,150,225,400],
									[4,125,250,375,500],[5,250,500,750,1100],[6,300,600,900,1400],
									[7,350,750,1100,1700],[8,450,900,1400,2100],[9,550,1100,1600,2400],
									[10,600,1200,1900,2800],[11,800,1600,2400,3600],[12,1000,2000,3000,4500],
									[13,1100,2200,3400,5100],[14,1250,2500,3800,5700],[15,1400,2800,4300,6400],
									[16,1600,3200,4800,7200],[17,2000,3900,5900,8800],[18,2100,4200,6300,9500],
									[19,2400,4900,7300,10900],[20,2800,5700,8500,12700],
								] as [lvl, easy, med, hard, deadly]}
									<tr>
										<td class="py-1 pr-4 font-bold text-amber-300">{lvl}</td>
										<td class="py-1 text-right">{easy}</td>
										<td class="py-1 text-right">{med}</td>
										<td class="py-1 text-right text-orange-300">{hard}</td>
										<td class="py-1 text-right text-red-400">{deadly}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<div>
						<h4 class="mb-2 font-semibold text-gray-200">Monster Count Multiplier</h4>
						<table class="w-full max-w-xs">
							<thead>
								<tr class="border-b border-gray-700">
									<th class="pb-2 text-left font-semibold text-gray-400">Monsters</th>
									<th class="pb-2 text-left font-semibold text-gray-400">Multiplier</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800 text-gray-300">
								{#each [['1','×1'],['2','×1.5'],['3–6','×2'],['7–10','×2.5'],['11–14','×3'],['15+','×4']] as [n, mult]}
									<tr>
										<td class="py-1.5 pr-4 text-white">{n}</td>
										<td class="py-1.5 font-bold text-amber-300">{mult}</td>
									</tr>
								{/each}
							</tbody>
						</table>
						<p class="mt-2 text-xs text-gray-500">Compare total adjusted XP against the <em>party's</em> thresholds (sum each character's threshold). Small parties (≤2) move one bracket up; large parties (≥6) move one bracket down.</p>
					</div>
				</div>
			
			<!-- ── Magic & Casting ─────────────────────────────────── -->
			{:else if selected === 'magic'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Magic &amp; Casting</h3>
				<div class="space-y-6 text-sm">

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Casting Times</h4>
						<table class="w-full">
							<thead><tr class="border-b border-gray-700"><th class="pb-2 text-left font-semibold text-gray-400 w-36">Time</th><th class="pb-2 text-left font-semibold text-gray-400">Notes</th></tr></thead>
							<tbody class="divide-y divide-gray-800">
								{#each [
									['Action',           'Standard. Most spells use this.'],
									['Bonus Action',     'If you cast a bonus-action spell, your action that turn can only be used to cast a cantrip (2014 rules).'],
									['Reaction',         "On another creature's turn in response to a specific trigger defined in the spell (e.g. Shield, Counterspell)."],
									['1 Minute +',       'Must use your action every turn during casting; concentration required throughout. Interruption = slot lost.'],
									['Ritual (+10 min)', 'No spell slot expended. Takes 10 extra minutes. Cannot be used in combat for an instant result.'],
								] as [time, note]}
									<tr><td class="py-2 pr-4 font-semibold text-white align-top">{time}</td><td class="py-2 text-gray-300">{note}</td></tr>
								{/each}
							</tbody>
						</table>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Ritual Casting</h4>
						<table class="w-full">
							<thead><tr class="border-b border-gray-700"><th class="pb-2 text-left font-semibold text-gray-400 w-36">Class</th><th class="pb-2 text-left font-semibold text-gray-400">Requirement</th></tr></thead>
							<tbody class="divide-y divide-gray-800">
								{#each [
									['Wizard',             'Any ritual tag spell in spellbook — no preparation required. Spellbook must be on hand.'],
									['Cleric / Druid',     'Must have the spell prepared that day.'],
									['Bard',               'Must know the spell.'],
									['Ranger / Paladin',   'Cannot ritual cast by default.'],
									['Ritual Caster feat', 'Any class; grants a ritual book with two spells; more can be added. No preparation required.'],
								] as [cls, req]}
									<tr><td class="py-2 pr-4 font-semibold text-white align-top">{cls}</td><td class="py-2 text-gray-300">{req}</td></tr>
								{/each}
							</tbody>
						</table>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Spell Components</h4>
						<table class="w-full">
							<thead><tr class="border-b border-gray-700"><th class="pb-2 text-left font-semibold text-gray-400 w-28">Component</th><th class="pb-2 text-left font-semibold text-gray-400">Requirement &amp; Bypass</th></tr></thead>
							<tbody class="divide-y divide-gray-800">
								{#each [
									['V — Verbal',   'Must speak aloud at normal volume. Blocked by Silence spell, gag, or inability to speak.'],
									['S — Somatic',  'Precise hand gesture; one free hand required. War Caster feat bypasses this restriction.'],
									['M — Material', 'Item must be on hand. No-cost, non-consumed materials: substitute with component pouch (25 gp) or spellcasting focus. If the component has a listed gp cost or is consumed by the spell, the actual item is required — no substitutes.'],
								] as [comp, rule]}
									<tr><td class="py-2 pr-4 font-bold text-amber-300 align-top">{comp}</td><td class="py-2 text-gray-300">{rule}</td></tr>
								{/each}
							</tbody>
						</table>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Spell Ranges &amp; Ranged Attacks in Melee</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>• <strong class="text-white">Self</strong> — affects only the caster or originates from them.</li>
							<li>• <strong class="text-white">Touch</strong> — must touch the target. Melee spell attack roll against an unwilling creature.</li>
							<li>• <strong class="text-white">Ranged</strong> — if a hostile creature is within 5 ft of you and can see you, you have <strong class="text-white">disadvantage</strong> on ranged spell attack rolls. Does not apply to saving-throw spells.</li>
						</ul>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Areas of Effect</h4>
						<table class="w-full">
							<thead><tr class="border-b border-gray-700"><th class="pb-2 text-left font-semibold text-gray-400 w-24">Shape</th><th class="pb-2 text-left font-semibold text-gray-400">How it works</th></tr></thead>
							<tbody class="divide-y divide-gray-800">
								{#each [
									['Cone',     'Widens from origin point. Width = distance from origin. 15-ft cone is ~3 squares wide at its far edge.'],
									['Cube',     'Origin on a face; extends inward. 10-ft cube = 2×2 grid squares.'],
									['Cylinder', 'Has a radius and height. Origin at center of circular base; origin point is included.'],
									['Line',     'Straight path from origin with a length and width (typically 5 ft wide = 1 square).'],
									['Sphere',   'Extends from origin in all directions. Origin included. 20-ft radius = 4 squares from center.'],
								] as [shape, desc]}
									<tr><td class="py-2 pr-4 font-semibold text-white align-top">{shape}</td><td class="py-2 text-gray-300">{desc}</td></tr>
								{/each}
							</tbody>
						</table>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Spell Attack Rolls vs. Saving Throws</h4>
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
								<p class="mb-1 font-semibold text-white">Spell Attack Roll</p>
								<p class="mb-2 font-mono text-xs text-amber-300">d20 + ability mod + proficiency</p>
								<ul class="space-y-1 text-xs text-gray-300">
									<li>• Compare result to target AC</li>
									<li>• Nat 20 = critical hit (double dice)</li>
									<li>• Examples: Fire Bolt, Inflict Wounds</li>
								</ul>
							</div>
							<div class="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
								<p class="mb-1 font-semibold text-white">Saving Throw</p>
								<p class="mb-2 font-mono text-xs text-amber-300">DC = 8 + ability mod + proficiency</p>
								<ul class="space-y-1 text-xs text-gray-300">
									<li>• Target rolls d20 + their modifier vs. DC</li>
									<li>• Success: usually half damage; some spells have no effect</li>
									<li>• Failure: full effect</li>
								</ul>
							</div>
						</div>
						<p class="mt-2 text-xs text-gray-500">Spellcasting ability: INT (Wizard) · WIS (Cleric, Druid, Ranger) · CHA (Sorcerer, Warlock, Bard, Paladin)</p>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Spell Slots &amp; Upcasting</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>• <strong class="text-white">Cantrips (level 0)</strong> — no slot required; unlimited uses. Scale at character levels 5, 11, and 17.</li>
							<li>• <strong class="text-white">Upcasting</strong> — cast a spell with a higher-level slot; the spell uses that level for its effects. Only spells with an "At Higher Levels" clause benefit.</li>
							<li>• <strong class="text-white">Warlock slots</strong> — always cast at the caster's highest slot level; restored on a short rest.</li>
							<li>• Most full casters restore all slots on a long rest.</li>
						</ul>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Counterspell &amp; Dispel Magic</h4>
						<table class="w-full">
							<thead><tr class="border-b border-gray-700"><th class="pb-2 text-left font-semibold text-gray-400 w-36">Spell</th><th class="pb-2 text-left font-semibold text-gray-400">How it works</th></tr></thead>
							<tbody class="divide-y divide-gray-800">
								<tr>
									<td class="py-2 pr-4 font-semibold text-white align-top">Counterspell</td>
									<td class="py-2 text-gray-300 space-y-0.5">
										<div>Reaction · 60 ft · Trigger: a creature within range begins casting a spell.</div>
										<div><strong class="text-white">3rd level or lower</strong> → automatic counter, no check.</div>
										<div><strong class="text-white">4th level+</strong> → Spellcasting Ability check, DC = 10 + spell level. Upcast to match or exceed the spell level for an automatic counter.</div>
									</td>
								</tr>
								<tr>
									<td class="py-2 pr-4 font-semibold text-white align-top">Dispel Magic</td>
									<td class="py-2 text-gray-300 space-y-0.5">
										<div>Action · 120 ft · Target one creature, object, or magical effect.</div>
										<div><strong class="text-white">3rd level or lower</strong> → automatically ends, no check.</div>
										<div><strong class="text-white">4th level+</strong> → Spellcasting Ability check, DC = 10 + spell level. Upcast to match or exceed the spell level for an automatic end.</div>
									</td>
								</tr>
							</tbody>
						</table>
					</section>

					<section>
						<h4 class="mb-2 font-semibold text-gray-200">Combining Magical Effects</h4>
						<ul class="space-y-1.5 text-gray-300">
							<li>• <strong class="text-white">Different spells stack</strong> — effects from different spells add together while both are active.</li>
							<li>• <strong class="text-white">Same spell does not stack</strong> — if cast multiple times on the same target, only the most potent effect applies (e.g. two Bless spells → one set of bonus dice).</li>
							<li>• A spell bonus may still stack with a non-spell bonus from a class feature or item — DM judgment applies.</li>
						</ul>
					</section>

				</div>
			
			<!-- ── Name Generator ───────────────────────────────────── -->
			{:else if selected === 'names'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Name Generator</h3>
				<div class="flex flex-col gap-6">
					<!-- Controls -->
					<div class="flex flex-wrap items-center gap-3">
						<select
							bind:value={nameType}
							onchange={() => { generatedNames = []; generatedSurnames = []; }}
							class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
						>
							{#each nameTypeOptions as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
						<button
							onclick={generateNames}
							class="rounded-lg bg-amber-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-amber-500 active:scale-95"
						>
							First Names
						</button>
						<button
							onclick={generateSurnames}
							disabled={!surnameData[nameType]}
							class="rounded-lg bg-gray-700 px-5 py-2 text-sm font-bold text-gray-200 transition hover:bg-gray-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
						>
							Surnames
						</button>
					</div>

					{#if generatedNames.length === 0 && generatedSurnames.length === 0}
						<p class="text-sm text-gray-500">Select a type and click a button to generate 10 names.</p>
					{:else}
						<div class="grid gap-6 {generatedNames.length > 0 && generatedSurnames.length > 0 ? 'sm:grid-cols-2' : ''}">
							{#if generatedNames.length > 0}
								<div>
									<p class="mb-2 text-xs font-bold tracking-widest text-gray-500 uppercase">First Names</p>
									<div class="flex flex-col gap-1.5">
										{#each generatedNames as name}
											<div class="rounded-lg border border-gray-700 bg-gray-900/60 px-4 py-2.5 text-sm font-semibold text-white">
												{name}
											</div>
										{/each}
									</div>
								</div>
							{/if}
							{#if generatedSurnames.length > 0}
								<div>
									<p class="mb-2 text-xs font-bold tracking-widest text-gray-500 uppercase">Surnames</p>
									<div class="flex flex-col gap-1.5">
										{#each generatedSurnames as name}
											<div class="rounded-lg border border-gray-700 bg-gray-900/60 px-4 py-2.5 text-sm font-semibold text-white">
												{name}
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>

			<!-- ── Weather & Travel ───────────────────────────────── -->
			{:else if selected === 'weather'}
				<h3 class="mb-4 text-base font-black tracking-widest text-amber-400 uppercase">Weather &amp; Travel</h3>
				<div class="flex flex-col gap-8">

					<!-- Controls -->
					<div class="flex flex-wrap items-center gap-4">
						<div class="flex flex-col gap-1">
							<label class="text-[10px] font-bold tracking-widest text-gray-500 uppercase" for="weather-season">Season</label>
							<select id="weather-season" bind:value={selectedSeason} class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none">
								{#each seasonOptions as opt}<option value={opt.value}>{opt.label}</option>{/each}
							</select>
						</div>
						<div class="flex flex-col gap-1">
							<label class="text-[10px] font-bold tracking-widest text-gray-500 uppercase" for="weather-biome">Biome</label>
							<select id="weather-biome" bind:value={selectedBiome} class="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none">
								{#each biomeOptions as opt}<option value={opt.value}>{opt.label}</option>{/each}
							</select>
						</div>
						<button onclick={generateWeek} class="mt-5 rounded-lg bg-amber-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-amber-500 active:scale-95">
							Generate Week
						</button>
					</div>

					<!-- 7-day weather table -->
					{#if weekWeather.length > 0}
						<div class="overflow-x-auto rounded-xl border border-gray-700">
							<table class="min-w-full border-collapse text-xs">
								<thead>
									<tr class="border-b border-gray-700 bg-gray-900">
										<th class="sticky left-0 z-10 bg-gray-900 px-3 py-2 text-left w-20"></th>
										{#each weekWeather as dw}
											<th class="px-3 py-2 text-center font-bold text-amber-400 tracking-wider">{dw.day}</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each weatherTimeSlots as t}
										<tr class="border-b border-gray-800/60">
											<td class="sticky left-0 z-10 bg-gray-900 px-3 py-2.5 font-bold tracking-widest text-gray-400 uppercase text-[10px] whitespace-nowrap border-r border-gray-800">{timeSlotLabels[t]}</td>
											{#each weekWeather as dw}
												{@const slot = dw.slots[t]}
												<td class="px-2.5 py-2 align-top {conditionBg[slot.condition] ?? 'bg-gray-800/30'}">
													<div class="whitespace-nowrap font-medium text-white leading-snug">{slot.sky}</div>
													<div class="mt-0.5 whitespace-nowrap text-[10px] text-gray-400">{slot.temp} · {slot.wind}</div>
												</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="text-sm text-gray-500">Select a season and biome, then click Generate Week.</p>
					{/if}

					<!-- Travel Pace -->
					<section>
						<h4 class="mb-3 text-sm font-black tracking-widest text-amber-400 uppercase">Travel Pace</h4>
							{#if paceMult !== 1}
								<div class="mb-3 rounded-lg border border-amber-700/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-300 space-y-0.5">
									<p class="font-bold">Pace adjusted for current conditions (×{paceMult.toFixed(2)})</p>
									{#if biomeMult !== 1}<p class="text-amber-400/70">Biome ×{biomeMult} — {biomeReason}</p>{/if}
									{#if seasonMult !== 1}<p class="text-amber-400/70">Season ×{seasonMult} — {seasonReason}</p>{/if}
								</div>
							{/if}
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-gray-700">
									<th class="pb-2 text-left font-semibold text-gray-400 w-20">Pace</th>
									<th class="pb-2 text-left font-semibold text-gray-400">Speed</th>
									<th class="pb-2 text-left font-semibold text-gray-400">Per Hour</th>
									<th class="pb-2 text-left font-semibold text-gray-400">Per Day</th>
									<th class="pb-2 text-left font-semibold text-gray-400">Effect</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800">
								{#each paceRows as [pace, ftmin, mph, mpd, effect]}
									<tr>
										<td class="py-2 pr-4 font-bold {pace === 'Fast' ? 'text-red-400' : pace === 'Slow' ? 'text-green-400' : 'text-white'}">{pace}</td>
										<td class="py-2 pr-4 text-gray-300 tabular-nums">{ftmin}</td>
										<td class="py-2 pr-4 text-gray-300 tabular-nums">{mph}</td>
										<td class="py-2 pr-4 font-semibold text-amber-300 tabular-nums">{mpd}</td>
										<td class="py-2 text-gray-400">{effect}</td>
									</tr>
								{/each}
							</tbody>
						</table>
						<div class="mt-4 space-y-2 text-sm text-gray-400">
							<p><strong class="text-white">Difficult terrain</strong> — halve all distances (Fast: {Math.round(15 * paceMult)} mi, Normal: {Math.round(12 * paceMult)} mi, Slow: {Math.round(9 * paceMult)} mi/day).</p>
							<p><strong class="text-white">Forced march</strong> — after 8 hours, each extra hour requires a CON save (DC 10 + 1 per hour past 8). Fail = 1 level of exhaustion.</p>
							<p><strong class="text-white">Galloping mount</strong> — a mount can gallop at 2× fast pace (~8 mi/hr) for up to 1 hour before needing rest.</p>
							<p><strong class="text-white">Stealth (slow pace)</strong> — each member rolls Stealth; group check = lowest individual roll.</p>
						</div>
					</section>

					<!-- Navigation -->
					<section>
						<h4 class="mb-3 text-sm font-black tracking-widest text-amber-400 uppercase">Navigation</h4>
						<p class="mb-3 text-sm text-gray-400">One party member acts as Navigator. The DM may call for a <strong class="text-white">Wisdom (Survival)</strong> check. On a fail, the party travels the wrong direction and must spend 1d6 hours reorienting.</p>
						<table class="w-full max-w-lg text-sm">
							<thead>
								<tr class="border-b border-gray-700">
									<th class="pb-2 text-left font-semibold text-gray-400">Terrain</th>
									<th class="pb-2 text-left font-semibold text-gray-400 w-12">DC</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800">
								{#each [
									['Grassland, meadow, or farmland',                              '5'],
									['Arctic, desert, hills, or open sea with clear skies',        '10'],
									['Forest, jungle, swamp, mountains, or open sea (overcast)',   '15'],
								] as [terrain, dc]}
									<tr>
										<td class="py-1.5 pr-4 text-gray-300">{terrain}</td>
										<td class="py-1.5 font-black text-amber-300 text-lg">{dc}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</section>

				</div>
			{/if}

		</div>
	</div>
</div>
