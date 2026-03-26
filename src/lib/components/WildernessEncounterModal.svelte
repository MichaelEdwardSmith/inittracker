<!-- Wilderness Encounter Generator -->
<script lang="ts">
	let { onclose, embedded = false }: { onclose: () => void; embedded?: boolean } = $props();

	type Terrain =
		| 'forest'
		| 'mountains'
		| 'plains'
		| 'desert'
		| 'swamp'
		| 'coast'
		| 'arctic'
		| 'jungle'
		| 'hills'
		| 'river';
	type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'night';
	type EncType = 'combat' | 'hazard' | 'discovery' | 'fauna' | 'traveler' | 'mystery';

	interface WildernessResult {
		type: EncType;
		headline: string;
		scene: string;
		details: string;
		complication: string;
		opportunity: string;
		skills: string[];
	}

	// ── Controls ──────────────────────────────────────────────────────────────
	let terrain = $state<Terrain>('forest');
	let timeOfDay = $state<TimeOfDay>('morning');
	let partyLevel = $state(1);
	let seed = $state(Math.floor(Math.random() * 1_000_000_000));
	let result = $state<WildernessResult | null>(null);

	// ── RNG ───────────────────────────────────────────────────────────────────
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

	// ── Labels ────────────────────────────────────────────────────────────────
	const TERRAIN_LABELS: Record<Terrain, string> = {
		forest: 'Forest',
		mountains: 'Mountains',
		plains: 'Plains',
		desert: 'Desert',
		swamp: 'Swamp',
		coast: 'Coast',
		arctic: 'Arctic',
		jungle: 'Jungle',
		hills: 'Hills',
		river: 'River'
	};
	const TIME_LABELS: Record<TimeOfDay, string> = {
		dawn: 'Dawn',
		morning: 'Morning',
		afternoon: 'Afternoon',
		dusk: 'Dusk',
		night: 'Night'
	};
	const TYPE_LABELS: Record<EncType, string> = {
		combat: 'Combat',
		hazard: 'Hazard',
		discovery: 'Discovery',
		fauna: 'Flora & Fauna',
		traveler: 'Travelers',
		mystery: 'Mystery'
	};
	const TYPE_COLORS: Record<EncType, string> = {
		combat: 'bg-red-900/60 text-red-300 border-red-800/60',
		hazard: 'bg-orange-900/60 text-orange-300 border-orange-800/60',
		discovery: 'bg-amber-900/60 text-amber-300 border-amber-800/60',
		fauna: 'bg-emerald-900/60 text-emerald-300 border-emerald-800/60',
		traveler: 'bg-blue-900/60 text-blue-300 border-blue-800/60',
		mystery: 'bg-purple-900/60 text-purple-300 border-purple-800/60'
	};

	// ── Data pools ────────────────────────────────────────────────────────────
	interface EncEntry {
		headline: string;
		details: string;
	}
	type EncPool = Record<EncType, EncEntry[]>;

	const POOLS: Record<Terrain, EncPool> = {
		forest: {
			combat: [
				{
					headline: 'Wolf Pack',
					details:
						'A pack of six wolves fans out through the trees, cutting off retreat. The alpha circles wide, herding the party toward the rest.'
				},
				{
					headline: 'Bandit Ambush',
					details:
						'Rope-trip wires and concealed pit stakes — a professional setup. Crossbowmen fire from elevated positions in the canopy while footmen close the gap.'
				},
				{
					headline: 'Owlbear Territory',
					details:
						'Deep scratch marks on every tree, bones scattered across the trail. The creature is already aware of the party and approaches from downwind.'
				},
				{
					headline: 'Ettercap Web Trap',
					details:
						'Strands of near-invisible webbing stretch between the trees. The ettercap waits above, patient and still, while its giant spider companions patrol the perimeter.'
				},
				{
					headline: 'Gnoll Hunters',
					details:
						'A gnoll hunting party of four, painted for the wild hunt, emerges from brush on both sides. Fresh blood on their weapons suggests they found something else first.'
				},
				{
					headline: 'Worg Riders',
					details:
						'Goblin scouts mounted on worgs burst from a game trail at speed. They are scouting ahead of a larger band — one will attempt to flee and report back.'
				}
			],
			hazard: [
				{
					headline: 'Flash Flood Ravine',
					details:
						'The sound arrives before the water — a low roar building fast. The ravine ahead is about to fill. The banks are steep and slick with moss.'
				},
				{
					headline: 'Deadfall Trap',
					details:
						'Poorly disguised stakes and a weighted log triggered by a trip line. Old enough to be half-rotten but still deadly. Others may be nearby.'
				},
				{
					headline: 'Sinkhole',
					details:
						'The ground collapses without warning beneath the lead traveler. The pit is ten feet deep, threaded with roots, and the soil around the edge keeps crumbling.'
				},
				{
					headline: 'Thornbriar Wall',
					details:
						'A near-impenetrable wall of magical thornbriar has grown across the path. The thorns carry a mild paralytic sap. It was not here on any map.'
				},
				{
					headline: 'Diseased Carcass',
					details:
						'A large animal carcass blocks the trail, buzzing with flies. The sickness that killed it is still active in the surrounding soil and water.'
				}
			],
			discovery: [
				{
					headline: 'Abandoned Logging Camp',
					details:
						'Tools still laid out, a cold fire, food half-eaten. The loggers left mid-day and did not return. Personal effects and a strongbox remain untouched.'
				},
				{
					headline: 'Fey Mushroom Ring',
					details:
						'A perfect circle of silver-capped mushrooms, each exactly eighteen inches tall. The air inside the ring is ten degrees cooler and smells faintly of lightning.'
				},
				{
					headline: 'Moss-Covered Statue',
					details:
						'A stone figure of a robed person with outstretched hands, old enough that the face has weathered smooth. A small offering bowl at its feet was recently filled.'
				},
				{
					headline: 'Collapsed Watchtower',
					details:
						'The tower fell inward, filling its own base. Carved stonework suggests military origin. Something has been digging at the collapsed entrance from the outside.'
				},
				{
					headline: "Poacher's Cache",
					details:
						'A buried oilskin bundle: salted pelts, a hand-drawn map, a list of names, and more coin than a poacher should have. Someone will come back for this.'
				}
			],
			fauna: [
				{
					headline: 'Crow Parliament',
					details:
						'Dozens of crows fill the canopy above a dead tree, utterly silent. They watch the party pass with unnatural focus, then resume their noise exactly twenty feet behind.'
				},
				{
					headline: 'Stag with Iron Antlers',
					details:
						'A massive red stag stands motionless in a shaft of light. Its antlers have grown around an old iron axe head — long since rusted shut into the bone.'
				},
				{
					headline: 'Wounded Elk',
					details:
						'An elk with a crossbow bolt in its flank blocks the trail, too exhausted to flee. It will not survive without help, and its distress calls are attracting predators.'
				},
				{
					headline: 'Glowing Fungi',
					details:
						'A grove of bioluminescent mushrooms casts pale blue light across the forest floor. They pulse slowly, almost in rhythm, and react noticeably to sound.'
				},
				{
					headline: 'Territorial Badgers',
					details:
						'A family of giant badgers has taken over a stretch of the trail. They have no interest in leaving and no fear of creatures larger than themselves.'
				}
			],
			traveler: [
				{
					headline: 'Lost Merchant',
					details:
						'A merchant and two guards, clearly off-route, are camped at the wrong fork. They have valuable cargo and an inflated sense of how dangerous this forest is.'
				},
				{
					headline: 'Ranger Patrol',
					details:
						'Three rangers of a local warden order flag the party down. They are tracking a creature and want information — and are watching for specific individuals.'
				},
				{
					headline: 'Fleeing Refugee',
					details:
						'A single person, exhausted and terrified, running toward the party. They have nothing but the clothes on their back and urgent news of something behind them.'
				},
				{
					headline: 'Hermit Healer',
					details:
						'An old healer lives in a hut three minutes off the trail. They have herbs and poultices and no interest in the outside world — except they are clearly lying about something.'
				}
			],
			mystery: [
				{
					headline: 'Reversed Compasses',
					details:
						'Every compass in the party begins pointing at the same fixed point to the northwest, regardless of orientation. The phenomenon is localized to this stretch of trail.'
				},
				{
					headline: 'The Silent Forest',
					details:
						'All ambient sound stops instantly — no birds, insects, or wind. Animal tracks ahead end in a circle with no sign of departure in any direction.'
				},
				{
					headline: 'Standing Flames',
					details:
						'Three fires burn in a triangle between the trees. They have no fuel source, cast no heat, and have clearly been burning for some time judging by the undisturbed ash beneath.'
				},
				{
					headline: "Child's Voice",
					details:
						"A child's singing drifts through the trees, always equidistant regardless of how the party moves. No tracks. The song has no words in any known language."
				}
			]
		},
		mountains: {
			combat: [
				{
					headline: 'Harpy Nest',
					details:
						'Three harpies use the rocky outcroppings for diving attacks. Their song carries on the wind and the terrain heavily favors an aerial combatant.'
				},
				{
					headline: 'Stone Giant',
					details:
						'A stone giant hurls boulders from the ridge above, each one capable of triggering a small avalanche. It has been watching the party since the base of the pass.'
				},
				{
					headline: 'Wyvern Circling',
					details:
						'A wyvern has identified the party as prey and is waiting for the right moment — when they are exposed on the open face with nowhere to shelter.'
				},
				{
					headline: 'Ogre Toll',
					details:
						'An ogre and two smaller kin have set up a crude toll at a natural choke in the pass. They want food, coin, or entertainment. They are not patient.'
				},
				{
					headline: 'Griffon Pair',
					details:
						'Two griffons defending a nest in the cliffs above attack anything that enters their flight shadow. One will always remain near the nest.'
				}
			],
			hazard: [
				{
					headline: 'Rockslide',
					details:
						'A crack, then a rumble, then loose stone cascading down the slope above. The trigger appeared natural. Cover is minimal and secondary collapses are likely.'
				},
				{
					headline: 'Ice Shelf Collapse',
					details:
						'The overhanging ice shelf above the trail gives way without warning. The debris field extends thirty feet in every direction.'
				},
				{
					headline: 'Narrow Ledge',
					details:
						'The path narrows to eighteen inches with a three-hundred-foot drop. Wind is picking up, the rock is damp, and something on the far side is watching.'
				},
				{
					headline: 'Mountain Whiteout',
					details:
						'A localized blizzard descends in minutes. Visibility drops to five feet. Trail markings are covered. The temperature drop is immediate and dangerous.'
				}
			],
			discovery: [
				{
					headline: 'Dwarven Mining Shaft',
					details:
						'A sealed shaft entrance with dwarf-cut stonework around the frame. The seal has been broken from the inside recently. Faint forge-smoke drifts upward.'
				},
				{
					headline: 'Ancient Battlefield',
					details:
						'Rusted weapons and bones half-buried in scree, spread over a quarter-mile. Standards of two forgotten armies. Something valuable may be under the rubble.'
				},
				{
					headline: 'Storm Shrine',
					details:
						'A squat cairn shrine on a promontory, offerings tied to iron spikes. The offerings are recent. The weather here is unnaturally calm within a hundred feet.'
				},
				{
					headline: 'Dragon Bones',
					details:
						'The skeleton of an ancient dragon, mostly intact, wedged in a narrow canyon. Something has been pulling teeth from the skull. Recently.'
				}
			],
			fauna: [
				{
					headline: 'Mountain Goat Herd',
					details:
						'A herd of mountain goats occupies the only safe route ahead. They will not move for anything less than a genuine predator, and they are not bluffable.'
				},
				{
					headline: 'Messenger Eagle',
					details:
						'A trained eagle with a courier band on its leg circles the party, having lost its bearings. The message capsule is sealed with a recognizable seal.'
				},
				{
					headline: 'Cave Howling',
					details:
						'A deep, rhythmic sound emanates from a cave mouth halfway up the cliff face — too regular to be wind, too deep to be any ordinary animal.'
				}
			],
			traveler: [
				{
					headline: 'Dwarven Prospector',
					details:
						'A single dwarf, heavily loaded with equipment, has found something worth mapping but needs a guide to the lowlands. She is cautious about sharing details.'
				},
				{
					headline: 'Stranded Pilgrims',
					details:
						'Five pilgrims making for a mountain shrine are pinned down by weather in a shallow cave. Food for one more day and one of them is injured.'
				}
			],
			mystery: [
				{
					headline: 'Ringing Stones',
					details:
						'A circle of standing stones emits a low harmonic tone when wind passes through. The tone changes based on exactly where you stand inside the circle.'
				},
				{
					headline: 'Frozen Figure',
					details:
						'A humanoid figure in perfectly clear ice stands upright on the trail. Fully equipped for travel. Expression neutral. The ice is not melting despite the temperature.'
				}
			]
		},
		plains: {
			combat: [
				{
					headline: 'Gnoll Warband',
					details:
						'Eight gnolls on a raid, spread wide to cut off escape. They have horses tied a quarter-mile back, suggesting a larger operation. Their cackling serves as coordination.'
				},
				{
					headline: 'Bandit Cavalry',
					details:
						'Six bandits on horseback emerge from a dry creek bed. They have the speed advantage and know the terrain. Their goal is to separate and surround.'
				},
				{
					headline: 'Dire Wolf Pack',
					details:
						'Seven dire wolves hunting in coordinated silence. Two have already flanked behind the party before the lead wolf shows itself.'
				},
				{
					headline: 'Centaur War Scouts',
					details:
						'Three centaur scouts challenge the party in their territory. They are testing for weakness, not committed to a fight — yet.'
				}
			],
			hazard: [
				{
					headline: 'Prairie Fire',
					details:
						'A line of fire advances from the south, pushed by wind. The grass is shoulder-high. The fire moves faster than it looks, and the smoke is already visible.'
				},
				{
					headline: 'Stampede',
					details:
						'The ground vibrates before the herd crests the low rise. A hundred bison, spooked by something behind them. No high ground is in sight.'
				},
				{
					headline: 'Lightning Storm',
					details:
						'The sky turns green-black in thirty minutes. The storm grounds anything flying. The plains offer no shelter and every metal object is a liability.'
				}
			],
			discovery: [
				{
					headline: 'Standing Stones',
					details:
						'Seven tall monoliths in a rough oval, each carved with different symbols. A fire pit in the center was used within the last week. The symbols match no known calendar.'
				},
				{
					headline: 'Abandoned Farmstead',
					details:
						'House and outbuildings intact, crops unharvested and drying, well clean. No sign of violence and no sign of departure. Everything is simply stopped.'
				},
				{
					headline: 'Mass Grave Mound',
					details:
						'A long earthen mound crossing the trail, no marker, recent enough that grass is only just covering it. Someone buried a great many bodies here quietly.'
				}
			],
			fauna: [
				{
					headline: 'Wild Horse Herd',
					details:
						'Thirty wild horses across the trail. Among them is one branded with a recognizable noble house sigil — someone lost this animal, and it was valuable.'
				},
				{
					headline: 'Hawk and the Dead',
					details:
						'A red-tailed hawk circles something off the trail. A body — recent, mostly undisturbed — with documents still in an inner pocket.'
				}
			],
			traveler: [
				{
					headline: 'Merchant Caravan',
					details:
						'Four wagons stopped due to a broken axle. The merchants are well-armed and nervous. Two days behind schedule, unwilling to explain why.'
				},
				{
					headline: 'Militia Patrol',
					details:
						'Eight militia members from a nearby town looking for someone specific. They have a wanted notice. The description could apply to someone in the party.'
				}
			],
			mystery: [
				{
					headline: 'Watching Scarecrows',
					details:
						'Every scarecrow in the abandoned fields has been turned to face the road. They were not all facing this direction when the farmer drew the directions.'
				},
				{
					headline: 'Crop Pattern',
					details:
						'A massive geometric pattern pressed into the grass, visible in its full design only from elevation. Identical to a symbol from a spellbook illustration someone has seen before.'
				}
			]
		},
		desert: {
			combat: [
				{
					headline: 'Gnoll Raiders',
					details:
						'Five gnolls, experienced desert hunters, attack from the direction of the sun. Fast, dirty fighters who retreat strategically if overwhelmed.'
				},
				{
					headline: 'Giant Scorpion',
					details:
						'The creature emerged from beneath a dune to the right. Large enough to grapple a horse. The venomous stinger strikes faster than the claws.'
				},
				{
					headline: 'Yuan-ti Patrol',
					details:
						'Four yuan-ti malisons in desert wraps, scales patterned to match the sand, close from multiple angles. They prefer captives over corpses.'
				},
				{
					headline: 'Roc Shadow',
					details:
						'A shadow large as a house moves across the dunes. The roc is hunting, and the party is the largest warm thing visible for miles.'
				}
			],
			hazard: [
				{
					headline: 'Sandstorm',
					details:
						'A brown wall on the horizon — sixty seconds of warning. Visibility drops to zero. Without shelter, every exposed piece of equipment is scoured. Navigation impossible.'
				},
				{
					headline: 'Heat Exhaustion',
					details:
						'The weakest party member shows signs: confusion, no sweat, skin hot and dry. Water needed immediately and shade within the hour.'
				},
				{
					headline: 'Collapsing Dune Face',
					details:
						'A dune face gives way beneath the party, triggering a slow-motion avalanche of sand. Thirty feet high, forty more feet of soft sand at the base.'
				}
			],
			discovery: [
				{
					headline: 'Tomb Entrance',
					details:
						'A stone lintel protrudes from the sand, the seal broken by treasure hunters. Their equipment was not left behind voluntarily.'
				},
				{
					headline: 'Poisoned Oasis',
					details:
						'An oasis, clear and inviting, with dead animals around the water edge. Something beneath the surface is maintaining the poison deliberately.'
				},
				{
					headline: 'Buried City Spire',
					details:
						'A single ornate tower tip protrudes from the dune field. Mapping the surrounding rises reveals the outline of a buried city. The scale is enormous.'
				}
			],
			fauna: [
				{
					headline: 'Giant Vultures',
					details:
						'Eleven giant vultures perched on a rock formation, all watching the party. Patient. Also watching something under a nearby dune — still warm.'
				},
				{
					headline: 'Scarab Column',
					details:
						'A mass of scarab beetles moves in a directed column against the wind. Anything in their path is stripped clean within minutes. Their destination is deliberate.'
				}
			],
			traveler: [
				{
					headline: 'Nomadic Tribe',
					details:
						'A nomadic clan of thirty, including children, camps around a sheltered rock. Cautious with strangers but willing to trade water and terrain knowledge.'
				},
				{
					headline: 'Desperate Treasure Hunter',
					details:
						'A sole treasure hunter with too many maps and not enough water. He knows where the tomb is. He also knows what is inside, which is why he needs help.'
				}
			],
			mystery: [
				{
					headline: 'Glass Desert',
					details:
						'A section of sand fused into perfect black glass stretching fifty yards. Recent — within days. The temperature needed would have incinerated anything standing here.'
				},
				{
					headline: 'Voice Beneath the Sand',
					details:
						'A faint voice speaks from directly underfoot — ancient words, repeating the same phrase. The ground is solid. No tunnels are detectable.'
				}
			]
		},
		swamp: {
			combat: [
				{
					headline: 'Lizardfolk Patrol',
					details:
						'Six lizardfolk emerge from the water simultaneously on three sides. Territorial, organized, and rehearsed. They use the fog and shallow water as cover.'
				},
				{
					headline: "Will-o'-Wisps",
					details:
						"Three will-o'-wisps have led the party off the safe path into deep water. They strike with electrical jolts that are more dangerous in standing water."
				},
				{
					headline: 'Bullywug Ambush',
					details:
						'Bullywugs concealed in reed beds strike as the party crosses a narrow causeway. They have trained giant frogs as mounts and use them to grapple targets off the path.'
				},
				{
					headline: 'Green Hag',
					details:
						'A green hag has been watching the party for an hour. She approaches as a bent old woman in distress. She wants something specific — she knows what they are carrying.'
				}
			],
			hazard: [
				{
					headline: 'Quicksand',
					details:
						'The ground ahead looks solid — darker mud patches are the only warning. Three feet of quicksand with a sucking pull that increases with struggle.'
				},
				{
					headline: 'Gas Pocket',
					details:
						'Disturbing the bog floor releases a pocket of methane. Not immediately lethal, but highly flammable and disorienting. Any open flame for the next hour is a significant risk.'
				},
				{
					headline: 'Contaminated Crossing',
					details:
						'The only viable path crosses visibly contaminated water — oily sheen, dead fish. Wading through risks exposure to swamp sickness.'
				}
			],
			discovery: [
				{
					headline: 'Sunken Ruins',
					details:
						'Stone walls protrude from the water, covered in moss. Most of the structure is intact beneath the surface. The doors are sealed from the inside.'
				},
				{
					headline: "Witch's Hut",
					details:
						'A hut on thick wooden stilts, not on any map. Smoke from the chimney. Unusual components drying on the porch. No answer at the door, but recent habitation is clear.'
				},
				{
					headline: 'Drowned Idol',
					details:
						'A stone frog-headed idol, half-submerged, surrounded by offerings both old and recent. The most recent offering is a piece of gear from a specific named guild.'
				}
			],
			fauna: [
				{
					headline: 'Giant Dragonflies',
					details:
						'A cloud of giant dragonflies, each the size of a housecat, swarms the party. Not aggressive, but intensely attracted to light and metallic objects.'
				},
				{
					headline: 'Poison Frogs',
					details:
						'The path is covered in brilliantly colored frogs. They are not moving. They arrived deliberately — they do not normally live in this part of the swamp.'
				}
			],
			traveler: [
				{
					headline: 'Lizardfolk Merchant',
					details:
						'A lizardfolk trader poles a flat raft loaded with swamp goods including a caged creature covered by cloth. Willing to trade and guide — for a price.'
				},
				{
					headline: 'Lost Explorer',
					details:
						'An academic explorer, waist-deep in water, has completely lost the path. Their notes describe something remarkable found two days ago before they became lost.'
				}
			],
			mystery: [
				{
					headline: 'The Dry Spot',
					details:
						'A perfect circle of dry ground, fifteen feet across, in the wettest part of the swamp. No water enters it. Grass inside is healthy. Bones are arranged at the edge.'
				},
				{
					headline: 'Lantern Procession',
					details:
						'A line of lights moves slowly through the distant trees at water level. Perfect spacing. They stop when the party stops. They resume when the party moves.'
				}
			]
		},
		coast: {
			combat: [
				{
					headline: 'Sahuagin Raiders',
					details:
						'Six sahuagin emerge from the surf using the wave noise as cover. They carry nets and barbed tridents, and appear to be looking for something specific.'
				},
				{
					headline: 'Shore Pirates',
					details:
						'Eight pirates from a ship anchored offshore came ashore for water and spotted the party. They have decided it is more profitable than water.'
				},
				{
					headline: 'Harpy Flock',
					details:
						'Four harpies nest in the sea cliffs above. Their song carries even over surf, and the rocky beach offers terrible footing for anyone entranced.'
				},
				{
					headline: 'Giant Crab',
					details:
						'The rock is actually a giant crab that has been motionless waiting for prey. Its shell is barnacled and salt-worn — it blends perfectly with the beach.'
				}
			],
			hazard: [
				{
					headline: 'Rip Current',
					details:
						'The calm water between two rock formations is a powerful rip current. Anyone entering is swept out to sea within seconds. Visible only from above.'
				},
				{
					headline: 'Storm Surge',
					details:
						'The tide came in three hours early and is still rising. The beach path will be underwater in twenty minutes. The cliff path is above, if they can find it in the spray.'
				},
				{
					headline: 'Sea Fog',
					details:
						'A thick fog rolls in from the water with unusual speed. Visibility drops to ten feet. Ships can be heard. So can something else — closer, moving toward shore.'
				}
			],
			discovery: [
				{
					headline: 'Wrecked Ship',
					details:
						'A merchant vessel, recently wrecked, still has cargo in her hold. She will not survive the next tide. Three crew are trapped below. Something is circling in the water.'
				},
				{
					headline: 'Sea Cave Shrine',
					details:
						'Accessible only at low tide, a cave with walls covered in offerings from multiple cultures and centuries. The object at the altar is recently placed with a note still attached.'
				},
				{
					headline: 'Message in Bottles',
					details:
						'Forty or more bottles have washed ashore, each containing the same message. The handwriting is identical on every one. The date written is in the future.'
				}
			],
			fauna: [
				{
					headline: 'Ancient Sea Turtle',
					details:
						'An enormous sea turtle has come ashore. She has been making this journey for three hundred years. She may be willing to communicate if approached respectfully.'
				},
				{
					headline: 'Dolphin Warning',
					details:
						'A pod of dolphins behaves erratically near the shoreline, making distressed sounds and trying to guide the party away from a specific section of beach.'
				}
			],
			traveler: [
				{
					headline: 'Stranded Sailors',
					details:
						'Nine survivors of a wreck three days ago are signaling from a beach. They know what sank them. They also know what is in the sealed strongbox still on the wreck.'
				},
				{
					headline: 'Smugglers',
					details:
						'A small boat is offloading crates from a vessel offshore. The crew spots the party and initially acts casual. Two of the crates are moving on their own.'
				}
			],
			mystery: [
				{
					headline: 'Stone Spiral',
					details:
						'A fifty-foot spiral of stones arranged on the beach. The stones are from the sea floor — they could not have been carried up by tide. The center was dug up from below.'
				},
				{
					headline: 'Singing Shore',
					details:
						'The beach produces a clear harmonic tone at certain wave intervals. When hummed back at the water, the next wave arrives in a measurably different shape.'
				}
			]
		},
		arctic: {
			combat: [
				{
					headline: 'Winter Wolf Pack',
					details:
						'Five winter wolves tracked the party since morning. They attack crossing an exposed snowfield — no cover, limited visibility, the worst possible ground.'
				},
				{
					headline: 'Frost Giant',
					details:
						'A frost giant crests a glacier ridge above the trail. It has been collecting travelers. Equipment from previous victims is visible at its camp.'
				},
				{
					headline: 'Yeti',
					details:
						"A yeti's terrifying roar precedes a charge across the ice. Its thick fur sheds most non-magical strikes. It is protecting young hidden in a snow cave nearby."
				},
				{
					headline: 'White Dragon Wyrmling',
					details:
						'A young white dragon, reckless and hungry, attacks with breath weapon from altitude before closing. It lacks the patience and tactics of an adult.'
				}
			],
			hazard: [
				{
					headline: 'Thin Ice',
					details:
						'The ice shelf looks solid. Cracks spreading from footsteps tell a different story. The water below is thirty feet deep and near-freezing. The far bank is sixty feet away.'
				},
				{
					headline: 'Avalanche',
					details:
						'The snowpack above the trail has been destabilized by recent melt. A single loud noise — shout, spell, weapon clash — is enough to send it down.'
				},
				{
					headline: 'Blizzard',
					details:
						'A severe blizzard strikes with one hour warning. Wind chill makes the temperature lethal without shelter. Three hours from known shelter, two from unknown.'
				}
			],
			discovery: [
				{
					headline: 'Frozen Warrior',
					details:
						'A figure preserved in glacier ice — fully armored, weapon drawn, expression of recognition rather than fear. Still faintly warm to the touch despite centuries of encasement.'
				},
				{
					headline: 'Ice Cave Drawings',
					details:
						'A cave cut into the glacier contains detailed charcoal drawings: maps, star charts, and images of a creature that matches no known bestiary entry.'
				},
				{
					headline: 'Nordic Ruins',
					details:
						'The ruins of a longhouse built from wood that has not rotted despite centuries of burial. A sealed chest is the only intact object inside.'
				}
			],
			fauna: [
				{
					headline: 'Arctic Fox Guide',
					details:
						'A white fox has followed the party since camp, maintaining constant distance. It appears to be leading somewhere specific. It is not a natural fox.'
				},
				{
					headline: 'Aurora Anomaly',
					details:
						'The aurora moves against usual patterns, forming shapes that hold for several seconds before dissolving. The shapes appear to be letters in an elder script.'
				}
			],
			traveler: [
				{
					headline: 'Lost Expedition',
					details:
						'Three survivors of a larger expedition around a nearly dead fire. They found what they were looking for — and it found them back. They will share the location for escort out.'
				},
				{
					headline: 'Goliath Hunter',
					details:
						'A lone goliath on a ritual solo hunt. She has information about terrain ahead and strange activity over the past week. She will trade knowledge for assistance with her quarry.'
				}
			],
			mystery: [
				{
					headline: 'Warm Circle',
					details:
						'A circle of bare earth in the middle of a snowfield. Not just thawed — summer-warm. A single flower grows at the exact center. The boundary is a perfect line.'
				},
				{
					headline: 'The Following Star',
					details:
						'A star not on any known chart appears at dusk and tracks the party throughout the night, disappearing at dawn. It is not a planet and does not move with the sky.'
				}
			]
		},
		jungle: {
			combat: [
				{
					headline: 'Yuan-ti Scouts',
					details:
						'Six yuan-ti pureblood scouts move through canopy and undergrowth simultaneously. Gathering intelligence, not seeking a fight — unless the party shows aggression first.'
				},
				{
					headline: 'Dinosaur Territory',
					details:
						'A territorial allosaurus has detected the party. Fast in the undergrowth, knows the terrain, and is currently between the party and their route forward.'
				},
				{
					headline: 'Giant Constrictor',
					details:
						'The snake has been above the party for the last ten minutes. It drops without warning, targeting the heaviest member. It is sixty feet long and has done this before.'
				},
				{
					headline: 'Vegepygmy Colony',
					details:
						'A colony of vegepygmies emerges from the undergrowth, driven from their territory by something larger. Frightened and violent. What drove them out is still back there.'
				}
			],
			hazard: [
				{
					headline: 'Poison Dart Trap',
					details:
						'A tripwire triggers a compressed bamboo dart launcher. The darts are coated. This is one of several traps in a network — probably protecting something nearby.'
				},
				{
					headline: 'Strangling Vines',
					details:
						'The vines react to movement, constricting anything warm-blooded. Cutting them releases a sap that makes the cut sections react more aggressively.'
				},
				{
					headline: 'Insect Swarm',
					details:
						'A cloud of biting insects, disturbed from their colony, pursues the party for a quarter mile. Their bites carry a fever that manifests within hours.'
				}
			],
			discovery: [
				{
					headline: 'Ruined Ziggurat',
					details:
						'A stone pyramid mostly reclaimed by jungle. The interior is intact. Traps are still active. So is whatever the ziggurat was built to contain.'
				},
				{
					headline: 'Abandoned Research Camp',
					details:
						'Tents still standing, notes organized on a field table, samples labeled and packed. The researchers left methodically. They did not take their personal effects.'
				},
				{
					headline: 'Unknown Idol',
					details:
						'A stone idol in a clearing the jungle respects — no growth within ten feet. No known religious tradition matches the iconography. Fresh blood at the base.'
				}
			],
			fauna: [
				{
					headline: 'Watching Jaguar',
					details:
						'A jaguar on a branch above the trail has been watching for ten minutes. It is not behaving like a predator. It appears to be guarding the trail, not hunting it.'
				},
				{
					headline: 'Giant Butterflies',
					details:
						'Butterflies the size of dinner plates fill a clearing. Their wing dust has a mild hallucinogenic effect when inhaled. They are migrating to a specific location.'
				}
			],
			traveler: [
				{
					headline: 'Native Guide',
					details:
						'A tribesperson offers to guide the party through a dangerous section for an unusual price. They also want to know if the party saw anything in the ruins to the east.'
				},
				{
					headline: 'Mercenary Expedition',
					details:
						'Twelve mercenaries, tight-lipped, moving in the opposite direction. They lost four members to something in the ruins and will not give details. Their employer sigil is recognizable.'
				}
			],
			mystery: [
				{
					headline: 'Reversed Growth',
					details:
						'A section of jungle where everything grows downward — roots exposed, canopy pointing at the ground. The zone is fifty feet across. The transition line is razor-sharp.'
				},
				{
					headline: 'The Drumbeat',
					details:
						'A drumbeat from no discernible direction, felt in the chest as much as heard. Its rhythm does not repeat within forty-seven beats. Local wildlife avoids the area entirely.'
				}
			]
		},
		hills: {
			combat: [
				{
					headline: 'Orc Warband',
					details:
						'Ten orcs on a raiding sweep, experienced hill fighters who use terrain to break line of sight. Two carry horns — if blown, reinforcements arrive within ten minutes.'
				},
				{
					headline: 'Hill Giant',
					details:
						'A hill giant with a sack of boulders sits astride the only ridge crossing. It throws rocks until things get interesting, then charges. Reach: seventeen feet.'
				},
				{
					headline: 'Goblin Wolf Riders',
					details:
						'Fifteen goblin wolf riders using hit-and-run tactics across the rolling terrain. They are trying to exhaust the party before a final strike, not commit to direct combat.'
				},
				{
					headline: 'Manticore',
					details:
						'A manticore uses the hills for visibility, raining tail spikes from outside melee range before closing. It has clearly hunted prey on these hills before.'
				}
			],
			hazard: [
				{
					headline: 'Mudslide',
					details:
						'Recent rain has saturated the hill face above the trail. The leading edge is already moving. Full collapse in minutes. Safe route requires backtracking a mile.'
				},
				{
					headline: 'Sinkhole Field',
					details:
						'The ground is riddled with limestone sinkholes, some concealed by grass. Every step has a chance of breaking through. The deepest visible hole is forty feet deep.'
				}
			],
			discovery: [
				{
					headline: 'Ancient Menhirs',
					details:
						'Eleven standing stones in a horseshoe, each ten feet tall, covered in astronomical carvings. The alignment is accurate to a celestial event occurring in two weeks.'
				},
				{
					headline: 'Opened Tomb',
					details:
						'A stone lintel set into the hillside, door half-ajar and recently visited. Boot prints of three different sizes going in. Two sets coming out.'
				},
				{
					headline: 'Hidden Dell',
					details:
						'A sheltered valley invisible from the hilltops, with a spring, good grass, and evidence of long habitation. Not on any map. Whoever uses it values that fact.'
				}
			],
			fauna: [
				{
					headline: 'Shepherdless Flock',
					details:
						"Two hundred sheep with no shepherd visible, behaving normally. The shepherd's crook is jammed into the earth near a wall. No shepherd in sight in any direction."
				},
				{
					headline: 'Unusual Goat',
					details:
						'A goat following the party at constant distance — close enough to notice, far enough to seem uninterested. It has not eaten anything. It has not blinked.'
				}
			],
			traveler: [
				{
					headline: 'Shepherd with Stories',
					details:
						'An old shepherd with a detailed memory for what passes through these hills offers hospitality. Two of his entertaining stories are warnings in disguise.'
				},
				{
					headline: 'Refugee Family',
					details:
						"A family of five moving away from something they won't name. The oldest child is injured. They carry a map of where they came from that they don't know they have."
				}
			],
			mystery: [
				{
					headline: 'The Sunken Road',
					details:
						'A road descending below the surrounding ground level — not a valley, but a road the land has grown up around. Not on any map. The paving stones are not from this region.'
				},
				{
					headline: 'Cairn That Moves',
					details:
						'A cairn the party passes on the way up is in a different location on the way back. The stones are the same. The position is demonstrably different. No tracks surround either site.'
				}
			]
		},
		river: {
			combat: [
				{
					headline: 'River Troll',
					details:
						'A troll lurks under the ford crossing, waiting for the weight of a traveler above. It can breathe underwater and is comfortable fighting in the current.'
				},
				{
					headline: 'Bandits on Rafts',
					details:
						'Three rafts emerge from under an overhanging bank. Twelve bandits using the current for speed. They know every crossing for twenty miles.'
				},
				{
					headline: 'Merrow',
					details:
						'Merrow hunting in the river use harpoon lines to drag victims into the water. The current assists them. The river bottom is their home ground.'
				},
				{
					headline: 'Crocodile',
					details:
						'The log in the shallows is not a log. The crocodile has been motionless for three hours. Two more are positioned downstream in case the first attempt fails.'
				}
			],
			hazard: [
				{
					headline: 'Rapid Current',
					details:
						'The ford looked shallow from upstream. Mid-crossing, the current is strong enough to knock a person off their feet. The bottom is uneven and the far bank is thirty feet away.'
				},
				{
					headline: 'Flash Flood',
					details:
						'The water level rises six inches in as many minutes — upstream rain not yet arrived. A wall of brown water will reach this point within fifteen minutes.'
				},
				{
					headline: 'River Fog',
					details:
						'Dense fog settles on the water at dusk. Visibility drops to five feet. Movement sounds carry strangely. Something is using the fog as cover to approach.'
				}
			],
			discovery: [
				{
					headline: 'Sunken Barge',
					details:
						'A cargo barge visible through clear water at thirty feet depth, intact, cargo still sealed. The barge was not wrecked — it was deliberately scuttled, cleanly.'
				},
				{
					headline: 'Riverside Shrine',
					details:
						'A shrine built at the water edge, replenished by different people over decades. The most recent offering is a message tube with a live wax seal.'
				},
				{
					headline: "Druid's Refuge",
					details:
						'A structure woven from living willow branches between two trees. Someone skilled in druidic construction built this and left deliberately. Emergency caches are inside.'
				}
			],
			fauna: [
				{
					headline: 'Agitated Otters',
					details:
						'A family of river otters groups at a specific spot and dives repeatedly. They are agitated. Whatever is in the river at that point has disturbed them.'
				},
				{
					headline: 'The Kingfisher',
					details:
						'A kingfisher drops live, uninjured prey at the party feet — an unusual deepwater species not native to this river. Then it watches to see what the party does with it.'
				}
			],
			traveler: [
				{
					headline: 'The Ferryman',
					details:
						'An old ferryman who has seen everything passing on this river for forty years. He knows things. His price for information is reasonable. His price for passage is negotiable.'
				},
				{
					headline: 'River Trader',
					details:
						'A trading boat tied up for the night. Captain willing to trade goods and intelligence about conditions downriver. One crate is locked with a lock not in the inventory.'
				}
			],
			mystery: [
				{
					headline: 'Upstream Flow',
					details:
						'A fifty-yard section of river flows upstream. Not slowly — actively reversed. Fish in this section swim upstream relative to the reversal, making them stationary in space.'
				},
				{
					headline: 'Singing Water',
					details:
						'The river produces distinct harmonic tones at this bend that form a recognizable melody — one that several party members have heard before, in different cities.'
				}
			]
		}
	};

	const COMPLICATIONS = [
		'The situation is not what it first appears — something is driving events toward the party from further along the trail.',
		'A second threat arrives from an unexpected direction mid-encounter.',
		'A bystander or prisoner is caught in the middle, complicating any direct solution.',
		'The apparent enemy is fleeing something worse — still at least a mile back.',
		'Resolving this with noise or magic will attract attention from the surrounding area.',
		"One of the party's essential resources — rope, torches, water — is critically needed right now.",
		'The environment shifts as the encounter develops: weather worsens, ground destabilizes, light fails.',
		'Someone has been watching the whole encounter and is drawing their own conclusions.',
		'Time pressure: whatever is happening will be irreversible within the next few minutes.',
		'The most obvious solution creates a larger problem that will surface later in the journey.'
	];

	const OPPORTUNITIES = [
		'A cache of useful supplies is hidden nearby, visible to anyone who looks carefully.',
		'Information pointing toward a local quest hook or regional rumor becomes available.',
		'A shortcut or safer alternate route through this terrain becomes apparent.',
		'A potential ally, guide, or knowledgeable contact emerges if treated well.',
		'A valuable material component or alchemical ingredient is accessible here.',
		'Evidence of something larger happening in this region — part of a pattern.',
		'An item of moderate value left behind by whoever was here before.',
		'A sheltered campsite or defensible rest location becomes apparent.',
		'Accurate local intelligence: one reliable piece of information about the terrain ahead.',
		'A creature that might become a companion or contact with the right approach.'
	];

	const SKILLS: Record<EncType, string[]> = {
		combat: ['Athletics', 'Acrobatics', 'Intimidation', 'Perception', 'Animal Handling'],
		hazard: ['Athletics', 'Acrobatics', 'Survival', 'Medicine', 'Nature'],
		discovery: ['Investigation', 'History', 'Arcana', 'Religion', "Thieves' Tools"],
		fauna: ['Nature', 'Animal Handling', 'Survival', 'Perception', 'Stealth'],
		traveler: ['Persuasion', 'Insight', 'Deception', 'Medicine', 'History'],
		mystery: ['Arcana', 'Investigation', 'Perception', 'Religion', 'History']
	};

	const TIME_PREFIX: Record<TimeOfDay, string[]> = {
		dawn: [
			'Morning mist clings to the ground as first light filters through.',
			'The sky is pale grey, birds just beginning to call, dew heavy on every surface.',
			'Dawn light turns everything amber for a few minutes before the world becomes itself again.'
		],
		morning: [
			'Clear morning light makes the terrain easy to read.',
			'A cool morning with long shadows and crisp air — good traveling conditions.',
			'The morning is bright and still, visibility good in every direction.'
		],
		afternoon: [
			'The sun is high, heat rising off the ground, shadows short and unhelpful.',
			'Afternoon fatigue has settled into the march; the light is flat and direct.',
			'The light offers no shadow cover and the air is at its warmest.'
		],
		dusk: [
			'Failing light makes distances deceptive and details hard to read.',
			'The last hour before dark — predators begin moving and visibility drops fast.',
			'Long shadows and a deep orange sky that makes it hard to see clearly into the west.'
		],
		night: [
			'Dark enough that movement is possible only with a light source or darkvision.',
			'The night is overcast — no moon, no stars, hearing more reliable than sight.',
			'Moonlight throws pale, misleading shadows across the terrain.'
		]
	};

	// Encounter type weights — combat less common than exploratory types
	const ENC_TYPES: EncType[] = [
		'combat',
		'combat',
		'hazard',
		'hazard',
		'discovery',
		'discovery',
		'fauna',
		'fauna',
		'traveler',
		'traveler',
		'mystery'
	];

	// ── Generation ────────────────────────────────────────────────────────────
	function generate(): WildernessResult {
		const rng = mkRng(hashSeed(terrain + timeOfDay, seed + partyLevel));
		const encType = pick(ENC_TYPES, rng);
		const pool = POOLS[terrain][encType];
		const enc = pick(pool, rng);
		const scene = pick(TIME_PREFIX[timeOfDay], rng);
		const complication = pick(COMPLICATIONS, rng);
		const opportunity = pick(OPPORTUNITIES, rng);
		const allSkills = [...SKILLS[encType]];
		const shuffled = shuffle(allSkills, rng);
		const skills = shuffled.slice(0, 2 + Math.floor(rng() * 2));
		return {
			type: encType,
			headline: enc.headline,
			scene,
			details: enc.details,
			complication,
			opportunity,
			skills
		};
	}

	function randomize() {
		seed = Math.floor(Math.random() * 1_000_000_000);
	}

	$effect(() => {
		terrain;
		timeOfDay;
		partyLevel;
		seed;
		result = generate();
	});
</script>

<!-- ── Layout ─────────────────────────────────────────────────────────────── -->
<div
	class={embedded
		? 'flex h-full flex-col bg-gray-950'
		: 'fixed inset-0 z-50 flex flex-col bg-gray-950'}
	role="dialog"
	aria-modal="true"
	onkeydown={(e) => e.key === 'Escape' && onclose()}
>
	<!-- Header (standalone only) -->
	{#if !embedded}
		<div
			class="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900/80 px-5 py-3"
		>
			<div class="flex items-center gap-3">
				<h2 class="text-lg font-bold tracking-wide text-amber-300">Wilderness Encounter</h2>
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
		<!-- Left panel -->
		<div
			class="hidden w-56 shrink-0 flex-col gap-5 overflow-y-auto border-r border-gray-800 bg-gray-900/60 p-4 sm:flex"
		>
			<!-- Terrain -->
			<div class="flex flex-col gap-1.5">
				<label
					for="wilderness-terrain"
					class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Terrain</label
				>
				<select
					id="wilderness-terrain"
					bind:value={terrain}
					class="w-full rounded bg-gray-800 px-2.5 py-1.5 text-sm text-gray-100 outline-none focus:ring-1 focus:ring-amber-500"
				>
					{#each Object.entries(TERRAIN_LABELS) as [key, label]}
						<option value={key}>{label}</option>
					{/each}
				</select>
			</div>

			<!-- Time of Day -->
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Time of Day</span
				>
				<div class="flex flex-col gap-1">
					{#each Object.entries(TIME_LABELS) as [key, label]}
						<button
							onclick={() => (timeOfDay = key as TimeOfDay)}
							class="w-full rounded px-2.5 py-1.5 text-left text-sm font-medium transition {timeOfDay ===
							key
								? 'bg-amber-700 text-white'
								: 'bg-gray-800 text-gray-300 hover:bg-gray-700'}"
						>
							{label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Party Level -->
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Party Level</span
				>
				<div class="flex items-center gap-2">
					<button
						onclick={() => (partyLevel = Math.max(1, partyLevel - 1))}
						class="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-gray-300 transition hover:bg-gray-600"
						aria-label="Decrease"
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
						aria-label="Increase"
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
				<span class="text-[10px] text-gray-600">
					Tier {partyLevel <= 4 ? 1 : partyLevel <= 8 ? 2 : partyLevel <= 12 ? 3 : 4}
				</span>
			</div>

			<button
				onclick={randomize}
				class="w-full rounded bg-amber-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 active:bg-amber-800"
			>
				Roll Encounter
			</button>

			<div class="mt-auto border-t border-gray-800 pt-3">
				<span class="text-[10px] text-gray-600">seed: {seed}</span>
			</div>
		</div>

		<!-- Right panel -->
		<div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
			{#if result}
				<div class="flex flex-col gap-5 text-sm">
					<!-- Type badge + headline -->
					<div class="flex flex-wrap items-baseline gap-3">
						<span
							class="rounded border px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase {TYPE_COLORS[
								result.type
							]}"
						>
							{TYPE_LABELS[result.type]}
						</span>
						<h3 class="text-xl font-black text-white">{result.headline}</h3>
					</div>

					<!-- Scene -->
					<p class="text-sm leading-relaxed text-gray-400 italic">{result.scene}</p>

					<!-- Details -->
					<div class="rounded-lg border border-gray-700 bg-gray-800/60 px-5 py-4">
						<p class="leading-relaxed text-gray-200">{result.details}</p>
					</div>

					<!-- Complication + Opportunity -->
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="rounded-lg border border-orange-900/40 bg-orange-950/20 px-4 py-3">
							<p class="mb-1.5 text-[10px] font-bold tracking-widest text-orange-400/80 uppercase">
								Complication
							</p>
							<p class="leading-relaxed text-gray-300">{result.complication}</p>
						</div>
						<div class="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-4 py-3">
							<p class="mb-1.5 text-[10px] font-bold tracking-widest text-emerald-400/80 uppercase">
								Opportunity
							</p>
							<p class="leading-relaxed text-gray-300">{result.opportunity}</p>
						</div>
					</div>

					<!-- Skills -->
					<div class="flex flex-wrap items-center gap-2">
						<span class="text-[10px] font-bold tracking-widest text-gray-500 uppercase"
							>Relevant Skills</span
						>
						{#each result.skills as skill}
							<span class="rounded bg-gray-800 px-2 py-0.5 text-xs font-semibold text-gray-300"
								>{skill}</span
							>
						{/each}
					</div>

					<!-- Roll Again -->
					<div class="mt-1">
						<button
							onclick={randomize}
							class="rounded-lg border border-gray-700 px-4 py-1.5 text-xs font-bold text-gray-400 transition hover:border-amber-700 hover:text-amber-400"
						>
							Roll Again
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
