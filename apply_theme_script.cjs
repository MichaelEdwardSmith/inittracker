// Apply only the script-block changes from theme_impl.cjs.
// Step 7 (encounterListContent each) is already applied — skip it.
const fs = require('fs');
const file =
	'C:/Users/mojpo/WebstormProjects/Initiative/src/lib/components/DonjonDungeonModal.svelte';
let c = fs.readFileSync(file, 'utf8');

function rep(label, old, next) {
	if (!c.includes(old)) {
		console.error('NOT FOUND: ' + label);
		process.exit(1);
	}
	c = c.replace(old, next);
	console.log('OK: ' + label);
}

// 1. Add DungeonTheme type + dungeonTheme state
rep(
	'dungeonTheme state',
	`\tlet numFloors = $state(1);\n\tlet includeBossRoom = $state(false);`,
	`\ttype DungeonTheme = 'Crypt' | 'Sewer' | 'Cave' | 'Fortress' | 'Arcane' | 'Fungal';\n\tlet dungeonTheme = $state<DungeonTheme>('Crypt');\n\tlet numFloors = $state(1);\n\tlet includeBossRoom = $state(false);`
);

// 2. Replace const C = {...} with THEME_PALETTES + $derived
const cStart = c.indexOf('\n\tconst C = {\n');
const cEnd = c.indexOf('\n\t};\n', cStart) + 4;
if (cStart === -1 || cEnd <= 4) {
	console.error('Palette C NOT FOUND');
	process.exit(1);
}

const palettes = `
\tconst THEME_PALETTES: Record<DungeonTheme, {
\t\tvoid: string; gridVoid: string;
\t\tfloor: string; floorAlt: string;
\t\tcorridor: string; corridorGrout: string; gridFloor: string;
\t\twallLit: string; wallDim: string;
\t\tdoor: string; trap: string; label: string;
\t\tbossFloor: string; bossFloorAlt: string; bossWallLit: string; bossWallDim: string; bossLabel: string;
\t\tstartFloor: string; startFloorAlt: string; startWallLit: string; startWallDim: string; startLabel: string;
\t}> = {
\t\tCrypt: {
\t\t\tvoid: '#0a0d12', gridVoid: '#111820',
\t\t\tfloor: '#2a3a4a', floorAlt: '#243242',
\t\t\tcorridor: '#1e2c3a', corridorGrout: 'rgba(100,150,190,0.25)', gridFloor: 'rgba(0,0,0,0.18)',
\t\t\twallLit: '#5a8098', wallDim: '#2a4058',
\t\t\tdoor: '#c87820', trap: '#cc2222', label: '#5a8098',
\t\t\tbossFloor: '#4a1515', bossFloorAlt: '#3d1010', bossWallLit: '#a04040', bossWallDim: '#602020', bossLabel: '#e05050',
\t\t\tstartFloor: '#1a3d20', startFloorAlt: '#152f18', startWallLit: '#4a9a5a', startWallDim: '#2a6035', startLabel: '#5fd870'
\t\t},
\t\tSewer: {
\t\t\tvoid: '#06090a', gridVoid: '#0d1410',
\t\t\tfloor: '#243028', floorAlt: '#1e2a20',
\t\t\tcorridor: '#182418', corridorGrout: 'rgba(80,140,80,0.28)', gridFloor: 'rgba(0,0,0,0.20)',
\t\t\twallLit: '#5a8a50', wallDim: '#2a4825',
\t\t\tdoor: '#a06820', trap: '#cc2222', label: '#6a9a60',
\t\t\tbossFloor: '#3a2810', bossFloorAlt: '#2e200c', bossWallLit: '#9a6830', bossWallDim: '#5a3c18', bossLabel: '#e09040',
\t\t\tstartFloor: '#1c3a32', startFloorAlt: '#162e28', startWallLit: '#40988a', startWallDim: '#225848', startLabel: '#50d8c0'
\t\t},
\t\tCave: {
\t\t\tvoid: '#0c0906', gridVoid: '#1a1410',
\t\t\tfloor: '#3a2e22', floorAlt: '#30261c',
\t\t\tcorridor: '#261e16', corridorGrout: 'rgba(160,120,80,0.28)', gridFloor: 'rgba(0,0,0,0.18)',
\t\t\twallLit: '#8a6a48', wallDim: '#4a3820',
\t\t\tdoor: '#c87820', trap: '#cc2222', label: '#9a7a58',
\t\t\tbossFloor: '#3a1a10', bossFloorAlt: '#2e1410', bossWallLit: '#a84830', bossWallDim: '#682818', bossLabel: '#e06840',
\t\t\tstartFloor: '#223820', startFloorAlt: '#1a2e1a', startWallLit: '#608858', startWallDim: '#385030', startLabel: '#80c870'
\t\t},
\t\tFortress: {
\t\t\tvoid: '#080a0c', gridVoid: '#141618',
\t\t\tfloor: '#303438', floorAlt: '#282c30',
\t\t\tcorridor: '#1e2226', corridorGrout: 'rgba(140,150,160,0.25)', gridFloor: 'rgba(0,0,0,0.20)',
\t\t\twallLit: '#808898', wallDim: '#404850',
\t\t\tdoor: '#9a7840', trap: '#cc2222', label: '#909aaa',
\t\t\tbossFloor: '#381830', bossFloorAlt: '#2c1028', bossWallLit: '#984880', bossWallDim: '#5a2850', bossLabel: '#e060b8',
\t\t\tstartFloor: '#183040', startFloorAlt: '#122838', startWallLit: '#4080a8', startWallDim: '#205068', startLabel: '#60c0e8'
\t\t},
\t\tArcane: {
\t\t\tvoid: '#08060e', gridVoid: '#110d1c',
\t\t\tfloor: '#241840', floorAlt: '#1e1438',
\t\t\tcorridor: '#180e30', corridorGrout: 'rgba(120,80,200,0.30)', gridFloor: 'rgba(0,0,0,0.20)',
\t\t\twallLit: '#7858c0', wallDim: '#3c2878',
\t\t\tdoor: '#a870e0', trap: '#cc2222', label: '#8868d0',
\t\t\tbossFloor: '#2a0840', bossFloorAlt: '#220638', bossWallLit: '#9830c0', bossWallDim: '#5c1878', bossLabel: '#d050f0',
\t\t\tstartFloor: '#0c2840', startFloorAlt: '#0a2038', startWallLit: '#3878c8', startWallDim: '#1c4880', startLabel: '#60b8f8'
\t\t},
\t\tFungal: {
\t\t\tvoid: '#050a08', gridVoid: '#0c1410',
\t\t\tfloor: '#1a2e28', floorAlt: '#152620',
\t\t\tcorridor: '#101e1a', corridorGrout: 'rgba(80,200,140,0.28)', gridFloor: 'rgba(0,0,0,0.22)',
\t\t\twallLit: '#48b888', wallDim: '#206040',
\t\t\tdoor: '#a0b820', trap: '#cc2222', label: '#58c890',
\t\t\tbossFloor: '#1e3010', bossFloorAlt: '#162808', bossWallLit: '#88c020', bossWallDim: '#488010', bossLabel: '#c8f040',
\t\t\tstartFloor: '#0e2830', startFloorAlt: '#0a2028', startWallLit: '#30b0c0', startWallDim: '#186880', startLabel: '#40d8e8'
\t\t}
\t};
\tconst C = $derived(THEME_PALETTES[dungeonTheme]);
`;
c = c.substring(0, cStart) + palettes + c.substring(cEnd);
console.log('OK: THEME_PALETTES + $derived C');

// 3. Add $effect for theme re-render
rep(
	'$effect theme re-render',
	`\tconst C = $derived(THEME_PALETTES[dungeonTheme]);`,
	`\tconst C = $derived(THEME_PALETTES[dungeonTheme]);\n\t$effect(() => {\n\t\tconst _t = dungeonTheme;\n\t\tif (floors.length > 0 && canvasEl) renderDungeon(floors[currentFloor], floorBossRoomIds[currentFloor], currentFloor === 0 ? 1 : 0);\n\t});`
);

// 4. Add ROOM_DESC + getRoomDescription
const trapTableAnchor = '\n\t// ── trap tables ─';
const roomDescCode = `
\t// ── room description tables (per dungeon theme) ─────────────────────────────
\tconst ROOM_DESC: Record<DungeonTheme, {
\t\topeners: string[]; details: string[];
\t\tbossOpener: string[]; startOpener: string[];
\t\ttreasureDetail: string[]; encounterDetail: string[];
\t}> = {
\t\tCrypt: {
\t\t\topeners: [
\t\t\t\t'The low ceiling presses down like a burial shroud.',
\t\t\t\t'Carved niches line the walls, each holding a crumbling effigy.',
\t\t\t\t'A stone altar occupies the far wall, stained with ancient offerings.',
\t\t\t\t'The floor is worn smooth by decades of shuffling feet.',
\t\t\t\t'Rows of sealed alcoves climb both walls to the vaulted ceiling.',
\t\t\t\t'A smell of cold earth and old stone hangs heavy here.'
\t\t\t],
\t\t\tdetails: [
\t\t\t\t'Dust motes drift in the torchlight like slow snow.',
\t\t\t\t'A fine crack runs the length of the ceiling, weeping mineral salts.',
\t\t\t\t'Someone has scratched tally marks near the door.',
\t\t\t\t'The walls are slick with moisture that has no visible source.',
\t\t\t\t'Iron sconces jut from the walls, empty for centuries.'
\t\t\t],
\t\t\tbossOpener: [
\t\t\t\t'A vast burial vault stretches before you, the ceiling lost in shadow above a great sarcophagus.',
\t\t\t\t'This chamber is older than the rest — the stonework finer, darker, and deeply cold.'
\t\t\t],
\t\t\tstartOpener: [
\t\t\t\t'Weak light filters through a crack above the entrance, illuminating dust in the still air.',
\t\t\t\t'The entry chamber is partially collapsed, rubble piled against one wall.'
\t\t\t],
\t\t\ttreasureDetail: [
\t\t\t\t'A locked iron coffer rests on a plinth in the corner.',
\t\t\t\t'Offerings of tarnished coin surround a carved skull set into the wall.'
\t\t\t],
\t\t\tencounterDetail: [
\t\t\t\t'Bones crunch underfoot — some disturbingly fresh.',
\t\t\t\t'The scrape of stone on stone echoes from somewhere nearby.'
\t\t\t]
\t\t},
\t\tSewer: {
\t\t\topeners: [
\t\t\t\t'Black water channels cut through the floor, fed by unseen pipes.',
\t\t\t\t'The ceiling is low and arched, slick with algae and moisture.',
\t\t\t\t'A grate in the floor breathes cold air from somewhere far below.',
\t\t\t\t'The walls stream with water that smells of iron and rot.',
\t\t\t\t'A partially collapsed section of floor exposes the channel rushing beneath.',
\t\t\t\t'Rusted iron brackets once held torches; now they drip.'
\t\t\t],
\t\t\tdetails: [
\t\t\t\t'The sound of dripping never quite stops.',
\t\t\t\t'Rats scatter into the darkness at your approach.',
\t\t\t\t'Green slime colonises the lower half of every wall.',
\t\t\t\t'The mortar has eroded in places, leaving gaps that whistle with moving air.',
\t\t\t\t'A faint chemical smell mingles with the pervasive damp.'
\t\t\t],
\t\t\tbossOpener: [
\t\t\t\t'A vast cistern chamber opens before you, the central pool dark and unfathomably deep.',
\t\t\t\t'The master vault of the network — a cathedral of dripping stone and black water.'
\t\t\t],
\t\t\tstartOpener: [
\t\t\t\t'A rusted ladder descends from above, your only way back to the surface.',
\t\t\t\t'Faint daylight flickers through a slit grate set high in the ceiling.'
\t\t\t],
\t\t\ttreasureDetail: [
\t\t\t\t'A waterproof oilskin bundle has been wedged into a dry niche above the waterline.',
\t\t\t\t'Coins and small valuables rest on a shelf clearly placed to stay dry.'
\t\t\t],
\t\t\tencounterDetail: [
\t\t\t\t'Something large moves beneath the water near the far wall.',
\t\t\t\t'A low resonance travels through the pipes overhead.'
\t\t\t]
\t\t},
\t\tCave: {
\t\t\topeners: [
\t\t\t\t'Natural columns of flowstone divide the space into shadowed alcoves.',
\t\t\t\t'The cave walls are irregular, with deep shadows hiding possible passages.',
\t\t\t\t'A thin stream of mineral-rich water traces a pale line across the floor.',
\t\t\t\t'The ceiling is a tangle of stalactites, a few broken stumps hinting at past violence.',
\t\t\t\t'Crystals embedded in the rock catch the light and scatter it in pale fragments.',
\t\t\t\t'The floor here is gritty — a mix of sand and crushed bone.'
\t\t\t],
\t\t\tdetails: [
\t\t\t\t'The temperature drops sharply from the passage outside.',
\t\t\t\t'A faint wind suggests a hidden opening somewhere above.',
\t\t\t\t'The rock underfoot is slippery with mineral deposits.',
\t\t\t\t'Ancient scratch marks on the wall might be directions — or warnings.',
\t\t\t\t'A shallow depression in the floor holds stagnant brown water.'
\t\t\t],
\t\t\tbossOpener: [
\t\t\t\t'A monstrous natural cathedral of stone opens before you, its ceiling lost in darkness.',
\t\t\t\t'The largest cave you have yet encountered — and the air here is noticeably warmer.'
\t\t\t],
\t\t\tstartOpener: [
\t\t\t\t'The cave mouth narrows behind you; returning will require care.',
\t\t\t\t'Faint marks in the rock suggest this entrance has seen many visitors before.'
\t\t\t],
\t\t\ttreasureDetail: [
\t\t\t\t'A leather satchel has been tucked into a crevice and mostly concealed with rubble.',
\t\t\t\t'A crude stone chest sealed with clay sits in a dry corner.'
\t\t\t],
\t\t\tencounterDetail: [
\t\t\t\t'Claw marks on the walls are at a height that suggests nothing human made them.',
\t\t\t\t'The smell of musk and old blood hangs in the air ahead.'
\t\t\t]
\t\t},
\t\tFortress: {
\t\t\topeners: [
\t\t\t\t'The room was clearly a guardroom once — weapon racks line one wall, stripped bare.',
\t\t\t\t'Arrow slits in the outer wall suggest this chamber was designed for defence.',
\t\t\t\t'The floor is dressed stone, well-fitted, with iron rings bolted at intervals.',
\t\t\t\t'A heavy oak table, half rotted, dominates the centre of the room.',
\t\t\t\t'Murder holes in the ceiling are a reminder this fortress expected to be taken.',
\t\t\t\t'The walls are dressed grey granite, unadorned and unapologetically functional.'
\t\t\t],
\t\t\tdetails: [
\t\t\t\t'The iron door hinges are still sound, though the wood has long gone.',
\t\t\t\t'Faded military insignia are still visible on a surviving patch of plaster.',
\t\t\t\t'The floor shows worn grooves from years of booted feet.',
\t\t\t\t'Cold wind whistles through a broken arrow slit.',
\t\t\t\t'A rusted portcullis slot in the ceiling was never used — its mechanism still set.'
\t\t\t],
\t\t\tbossOpener: [
\t\t\t\t'The great hall — or what remains of it — stretches before you, its banners in tatters.',
\t\t\t\t'This was the command chamber; the remains of a war table occupy its centre.'
\t\t\t],
\t\t\tstartOpener: [
\t\t\t\t'The gatehouse entry is defensible but long since abandoned.',
\t\t\t\t'The first courtyard gate stands open, its locks rusted solid.'
\t\t\t],
\t\t\ttreasureDetail: [
\t\t\t\t'An iron strongbox has been chained to the floor near the far wall.',
\t\t\t\t'A concealed compartment in the floor has been partially pried open.'
\t\t\t],
\t\t\tencounterDetail: [
\t\t\t\t'The clash of metal echoes from a passage beyond.',
\t\t\t\t'Marching footfalls — disciplined, regular — approach from below.'
\t\t\t]
\t\t},
\t\tArcane: {
\t\t\topeners: [
\t\t\t\t'Runes etched into the floor pulse with a faint blue light at your approach.',
\t\t\t\t'The geometry of this room is subtly wrong — angles that should not meet, do.',
\t\t\t\t'A ritual circle, still faintly luminous, occupies the centre of the chamber.',
\t\t\t\t'Bookshelves of stone hold rows of crystalline tablets, each inscribed with glowing script.',
\t\t\t\t'The air vibrates at a frequency you feel in your back teeth.',
\t\t\t\t'Floating motes of cold light drift aimlessly near the ceiling.'
\t\t\t],
\t\t\tdetails: [
\t\t\t\t'The temperature is unnaturally constant regardless of the season above.',
\t\t\t\t'Any spoken word echoes with a faint harmonic that does not quite match.',
\t\t\t\t'The shadows move slightly faster than the light that casts them.',
\t\t\t\t'A smell of ozone and burnt copper permeates everything.',
\t\t\t\t'Your magical implements feel heavier — or lighter — than they should.'
\t\t\t],
\t\t\tbossOpener: [
\t\t\t\t'A sanctum of almost incomprehensible arcane complexity unfolds before you.',
\t\t\t\t'The ritual chamber at the heart of the complex — the air crackles with barely contained power.'
\t\t\t],
\t\t\tstartOpener: [
\t\t\t\t'The warding circle just inside the entrance still reacts weakly to your presence.',
\t\t\t\t'The antechamber served as a test for the uninitiated — simple enough, by design.'
\t\t\t],
\t\t\ttreasureDetail: [
\t\t\t\t'A locked crystalline case holds what appears to be a scroll or small tome.',
\t\t\t\t'Rare components fill a sealed alcove, still potent after all this time.'
\t\t\t],
\t\t\tencounterDetail: [
\t\t\t\t'A magical construct shifts in the shadows, its purpose unclear.',
\t\t\t\t'The ritual circle flares briefly — something has been summoned recently.'
\t\t\t]
\t\t},
\t\tFungal: {
\t\t\topeners: [
\t\t\t\t'Enormous mushroom caps press against the ceiling, their undersides weeping faint luminescence.',
\t\t\t\t'A carpet of spongy white mycelium covers the floor entirely, silencing footfalls.',
\t\t\t\t'Bioluminescent spores drift through the air in lazy, disorienting clouds.',
\t\t\t\t'Bulbous growths of orange and violet cling to every surface.',
\t\t\t\t'The walls are barely visible beneath layers of interlocking fungal growth.',
\t\t\t\t'Thick cords of mycelium web the ceiling like a living chandelier.'
\t\t\t],
\t\t\tdetails: [
\t\t\t\t'The air is thick with spores — breathing deeply is inadvisable.',
\t\t\t\t'A faint humming comes from the largest mushroom cluster; it vibrates under your hand.',
\t\t\t\t'The floor is soft and slightly warm, like breathing flesh.',
\t\t\t\t'Something that was once a creature has been absorbed entirely into the wall growth.',
\t\t\t\t'A faint sweetness underlies the pervasive smell of decay.'
\t\t\t],
\t\t\tbossOpener: [
\t\t\t\t'The heart of the colony: a vast chamber dominated by a pulsing central mass.',
\t\t\t\t'A cathedral of rot — towering growths in every colour, and at the centre, something old and awake.'
\t\t\t],
\t\t\tstartOpener: [
\t\t\t\t'Thin tendrils reach through the entry crack, testing the air beyond.',
\t\t\t\t'The outer chamber is only lightly colonised — the fungus has not yet claimed this close to the surface.'
\t\t\t],
\t\t\ttreasureDetail: [
\t\t\t\t'Something valuable is half-buried in mycelium; retrieving it will disturb the network.',
\t\t\t\t'A hermetically sealed container rests in a clear patch of floor, deliberately kept away from the growth.'
\t\t\t],
\t\t\tencounterDetail: [
\t\t\t\t'The nearest mushroom cap pulses rhythmically — a warning signal moving through the colony.',
\t\t\t\t'Spore clouds thicken near the far wall, disturbed by something that passed through recently.'
\t\t\t]
\t\t}
\t};

\tfunction getRoomDescription(roomId: number, enc: string, hasTreasure: boolean, isBoss: boolean, isStart: boolean): string {
\t\tconst td = ROOM_DESC[dungeonTheme];
\t\tconst opener = isBoss
\t\t\t? td.bossOpener[roomId % td.bossOpener.length]
\t\t\t: isStart
\t\t\t\t? td.startOpener[roomId % td.startOpener.length]
\t\t\t\t: td.openers[roomId % td.openers.length];
\t\tconst detail = td.details[(roomId * 3 + 1) % td.details.length];
\t\tconst extra = hasTreasure
\t\t\t? td.treasureDetail[roomId % td.treasureDetail.length]
\t\t\t: enc !== 'Empty'
\t\t\t\t? td.encounterDetail[roomId % td.encounterDetail.length]
\t\t\t\t: '';
\t\treturn extra ? \`\${opener} \${detail} \${extra}\` : \`\${opener} \${detail}\`;
\t}

`;
if (!c.includes(trapTableAnchor)) {
	console.error('trap table anchor NOT FOUND');
	process.exit(1);
}
c =
	c.substring(0, c.indexOf(trapTableAnchor)) +
	roomDescCode +
	c.substring(c.indexOf(trapTableAnchor));
console.log('OK: ROOM_DESC + getRoomDescription');

// 5. Add RoomPopover state + interface near activeTrap
const activeTrapDecl = c.indexOf('\n\tlet activeTrap = $state');
if (activeTrapDecl === -1) {
	console.error('activeTrap NOT FOUND');
	process.exit(1);
}
const insertAfterTrap = c.indexOf('\n', activeTrapDecl + 1);
c =
	c.substring(0, insertAfterTrap) +
	`\n\tinterface RoomPopover { roomId: number; enc: string; hasTreasure: boolean; isBoss: boolean; isStart: boolean; anchorEl: HTMLElement; }\n\tlet activeRoomPopover = $state<RoomPopover | null>(null);` +
	c.substring(insertAfterTrap);
console.log('OK: RoomPopover state');

// 6. Add Escape handling for room popover in handleKeydown
rep(
	'Escape room popover',
	`\t\t\tif (showMobileOptions) {`,
	`\t\t\tif (activeRoomPopover) {\n\t\t\t\tactiveRoomPopover = null;\n\t\t\t\treturn;\n\t\t\t}\n\t\t\tif (showMobileOptions) {`
);

fs.writeFileSync(file, c);
console.log('\nAll done!');
