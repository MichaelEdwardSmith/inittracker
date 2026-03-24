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

// ── 1. Add ROOM_NAMES + getRoomName after getRoomDescription ──────────────────
const anchor = '\n\t// ── trap tables ─';
const insert = `
\t// ── room name tables (one per opener; index must match openers/bossOpener/startOpener) ──
\tconst ROOM_NAMES: Record<
\t\tDungeonTheme,
\t\t{ rooms: string[]; boss: string[]; start: string[] }
\t> = {
\t\tCrypt: {
\t\t\trooms: [
\t\t\t\t'The Shroud Chamber',
\t\t\t\t'The Effigy Hall',
\t\t\t\t'The Offering Altar',
\t\t\t\t'The Worn Passage',
\t\t\t\t'The Alcove Vault',
\t\t\t\t'The Stone Hollow'
\t\t\t],
\t\t\tboss: ['The Grand Burial Vault', 'The Ancient Sanctum'],
\t\t\tstart: ['The Entry Crack', 'The Collapsed Entry']
\t\t},
\t\tSewer: {
\t\t\trooms: [
\t\t\t\t'The Channel Room',
\t\t\t\t'The Algae Vault',
\t\t\t\t'The Cold Grate',
\t\t\t\t'The Rust Weep',
\t\t\t\t'The Collapsed Slab',
\t\t\t\t'The Drip Chamber'
\t\t\t],
\t\t\tboss: ['The Grand Cistern', 'The Master Vault'],
\t\t\tstart: ['The Ladder Drop', 'The Surface Gate']
\t\t},
\t\tCave: {
\t\t\trooms: [
\t\t\t\t'The Flowstone Hall',
\t\t\t\t'The Shadow Alcove',
\t\t\t\t'The Mineral Run',
\t\t\t\t'The Stalactite Den',
\t\t\t\t'The Crystal Hollow',
\t\t\t\t'The Bone Grit Floor'
\t\t\t],
\t\t\tboss: ['The Stone Cathedral', 'The Deep Maw'],
\t\t\tstart: ['The Narrow Mouth', 'The Marked Entry']
\t\t},
\t\tFortress: {
\t\t\trooms: [
\t\t\t\t'The Old Guardroom',
\t\t\t\t'The Arrow Room',
\t\t\t\t'The Iron Ring Hall',
\t\t\t\t'The Rotted Hall',
\t\t\t\t'The Murder Room',
\t\t\t\t'The Granite Keep'
\t\t\t],
\t\t\tboss: ['The Fallen Great Hall', 'The Command Chamber'],
\t\t\tstart: ['The Gatehouse', 'The Open Gate']
\t\t},
\t\tArcane: {
\t\t\trooms: [
\t\t\t\t'The Rune Floor',
\t\t\t\t'The Warped Chamber',
\t\t\t\t'The Ritual Circle',
\t\t\t\t'The Tablet Archive',
\t\t\t\t'The Resonance Hall',
\t\t\t\t'The Mote Chamber'
\t\t\t],
\t\t\tboss: ['The Inner Sanctum', 'The Power Nexus'],
\t\t\tstart: ['The Warding Antechamber', 'The Trial Room']
\t\t},
\t\tFungal: {
\t\t\trooms: [
\t\t\t\t'The Mushroom Cap Hall',
\t\t\t\t'The Mycelium Floor',
\t\t\t\t'The Spore Drift',
\t\t\t\t'The Growth Chamber',
\t\t\t\t'The Overgrowth',
\t\t\t\t'The Mycelium Web'
\t\t\t],
\t\t\tboss: ['The Colony Heart', 'The Rot Cathedral'],
\t\t\tstart: ['The Tendril Entry', 'The Outer Chamber']
\t\t}
\t};

\tfunction getRoomName(roomId: number, isBoss: boolean, isStart: boolean): string {
\t\tconst tn = ROOM_NAMES[dungeonTheme];
\t\tif (isBoss) return tn.boss[roomId % tn.boss.length];
\t\tif (isStart) return tn.start[roomId % tn.start.length];
\t\treturn tn.rooms[roomId % tn.rooms.length];
\t}

`;
if (!c.includes(anchor)) {
	console.error('trap table anchor NOT FOUND');
	process.exit(1);
}
c = c.substring(0, c.indexOf(anchor)) + insert + c.substring(c.indexOf(anchor));
console.log('OK: ROOM_NAMES + getRoomName');

// ── 2. Add {@const roomName} to the each block and update the header div ─────
const T = '\t';
const oldEachHeader =
	'{@const isStartRoom = currentFloor === 0 && roomId === 1}\n' +
	T.repeat(5) +
	'<div class="flex flex-col gap-1 border-b border-white/5 px-3 py-2">\n' +
	T.repeat(6) +
	'<div\n' +
	T.repeat(7) +
	"class=\"flex gap-2 {enc === 'Empty' && !treasure ? 'text-gray-600' : 'text-gray-200'}\"\n" +
	T.repeat(6) +
	'>\n' +
	T.repeat(7) +
	'<button\n' +
	T.repeat(8) +
	'class="w-5 shrink-0 text-left font-bold {isBossRoom\n' +
	T.repeat(9) +
	"? 'text-red-400 hover:text-red-300'\n" +
	T.repeat(9) +
	': isStartRoom\n' +
	T.repeat(10) +
	"? 'text-green-400 hover:text-green-300'\n" +
	T.repeat(10) +
	": 'text-indigo-400 hover:text-indigo-300'}\"\n" +
	T.repeat(8) +
	'title="Room description"';

if (!c.includes(oldEachHeader)) {
	console.error('each header NOT FOUND');
	process.exit(1);
}

const newEachHeader =
	'{@const isStartRoom = currentFloor === 0 && roomId === 1}\n' +
	T.repeat(5) +
	'{@const roomName = getRoomName(roomId, isBossRoom, isStartRoom)}\n' +
	T.repeat(5) +
	'<div class="flex flex-col gap-1 border-b border-white/5 px-3 py-2">\n' +
	T.repeat(6) +
	"<div class=\"flex items-start gap-2 {enc === 'Empty' && !treasure ? 'text-gray-600' : 'text-gray-200'}\">\n" +
	T.repeat(7) +
	'<button\n' +
	T.repeat(8) +
	'class="w-5 shrink-0 text-left font-bold {isBossRoom\n' +
	T.repeat(9) +
	"? 'text-red-400 hover:text-red-300'\n" +
	T.repeat(9) +
	': isStartRoom\n' +
	T.repeat(10) +
	"? 'text-green-400 hover:text-green-300'\n" +
	T.repeat(10) +
	": 'text-indigo-400 hover:text-indigo-300'}\"\n" +
	T.repeat(8) +
	'title="Room description"';

c = c.replace(oldEachHeader, newEachHeader);
console.log('OK: each header + roomName const');

// ── 3. Replace <span class="leading-snug">{enc || 'Empty'}</span> with name+enc stack ──
const oldEncSpan =
	'>{roomId}</button\n' +
	T.repeat(7) +
	'>\n' +
	T.repeat(7) +
	'<span class="leading-snug">{enc || \'Empty\'}</span>\n' +
	T.repeat(6) +
	'</div>';

if (!c.includes(oldEncSpan)) {
	console.error('enc span NOT FOUND');
	process.exit(1);
}

const newEncSpan =
	'>{roomId}</button\n' +
	T.repeat(7) +
	'>\n' +
	T.repeat(7) +
	'<div class="flex flex-col">\n' +
	T.repeat(8) +
	"<span class=\"text-[10px] italic {isBossRoom ? 'text-red-400/70' : isStartRoom ? 'text-green-400/70' : 'text-indigo-400/70'}\">{roomName}</span>\n" +
	T.repeat(8) +
	'<span class="leading-snug text-xs">{enc || \'Empty\'}</span>\n' +
	T.repeat(7) +
	'</div>\n' +
	T.repeat(6) +
	'</div>';

c = c.replace(oldEncSpan, newEncSpan);
console.log('OK: room name in each list');

// ── 4. Update setDungeonRoomDescription call — name + label instead of just title ──
const oldSync =
	T.repeat(10) +
	'const title =\n' +
	T.repeat(11) +
	"`Room ${roomId}` + (isBossRoom ? ' · Boss' : isStartRoom ? ' · Start' : '');\n" +
	T.repeat(10) +
	'combat.setDungeonRoomDescription({\n' +
	T.repeat(11) +
	'title,\n' +
	T.repeat(11) +
	'body: getRoomDescription(roomId, enc, !!treasure, isBossRoom, isStartRoom),\n' +
	T.repeat(11) +
	'theme: dungeonTheme\n' +
	T.repeat(10) +
	'});';

if (!c.includes(oldSync)) {
	console.error('sync call NOT FOUND');
	process.exit(1);
}

const newSync =
	T.repeat(10) +
	'combat.setDungeonRoomDescription({\n' +
	T.repeat(11) +
	'name: roomName,\n' +
	T.repeat(11) +
	"label: `Room ${roomId}` + (isBossRoom ? ' · Boss' : isStartRoom ? ' · Start' : ''),\n" +
	T.repeat(11) +
	'body: getRoomDescription(roomId, enc, !!treasure, isBossRoom, isStartRoom),\n' +
	T.repeat(11) +
	'theme: dungeonTheme\n' +
	T.repeat(10) +
	'});';

c = c.replace(oldSync, newSync);
console.log('OK: setDungeonRoomDescription with name+label');

// ── 5. Update popover h3 to show room name as main heading ────────────────────
const oldPopoverH3 =
	T.repeat(3) +
	'<div class="mb-2 flex items-start justify-between gap-2">\n' +
	T.repeat(4) +
	'<h3\n' +
	T.repeat(5) +
	'class="font-bold {activeRoomPopover.isBoss\n' +
	T.repeat(6) +
	"? 'text-red-400'\n" +
	T.repeat(6) +
	': activeRoomPopover.isStart\n' +
	T.repeat(7) +
	"? 'text-green-400'\n" +
	T.repeat(7) +
	": 'text-indigo-300'}\"\n" +
	T.repeat(4) +
	'>\n' +
	T.repeat(5) +
	'Room {activeRoomPopover.roomId}{activeRoomPopover.isBoss\n' +
	T.repeat(6) +
	"? ' · Boss'\n" +
	T.repeat(6) +
	': activeRoomPopover.isStart\n' +
	T.repeat(7) +
	"? ' · Start'\n" +
	T.repeat(7) +
	": ''}\n" +
	T.repeat(4) +
	'</h3>';

if (!c.includes(oldPopoverH3)) {
	console.error('popover h3 NOT FOUND');
	process.exit(1);
}

const newPopoverH3 =
	T.repeat(3) +
	'<div class="mb-2 flex items-start justify-between gap-2">\n' +
	T.repeat(4) +
	'<div>\n' +
	T.repeat(5) +
	'<p class="text-[10px] uppercase tracking-wide text-gray-500">\n' +
	T.repeat(6) +
	'Room {activeRoomPopover.roomId}{activeRoomPopover.isBoss\n' +
	T.repeat(7) +
	"? ' · Boss'\n" +
	T.repeat(7) +
	': activeRoomPopover.isStart\n' +
	T.repeat(8) +
	"? ' · Start'\n" +
	T.repeat(8) +
	": ''}\n" +
	T.repeat(5) +
	'</p>\n' +
	T.repeat(5) +
	'<h3\n' +
	T.repeat(6) +
	'class="font-semibold {activeRoomPopover.isBoss\n' +
	T.repeat(7) +
	"? 'text-red-300'\n" +
	T.repeat(7) +
	': activeRoomPopover.isStart\n' +
	T.repeat(8) +
	"? 'text-green-300'\n" +
	T.repeat(8) +
	": 'text-indigo-200'}\"\n" +
	T.repeat(5) +
	'>\n' +
	T.repeat(6) +
	'{getRoomName(activeRoomPopover.roomId, activeRoomPopover.isBoss, activeRoomPopover.isStart)}\n' +
	T.repeat(5) +
	'</h3>\n' +
	T.repeat(4) +
	'</div>';

c = c.replace(oldPopoverH3, newPopoverH3);
console.log('OK: popover heading');

fs.writeFileSync(file, c);
console.log('\nAll done!');
