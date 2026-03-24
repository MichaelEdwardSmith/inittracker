const fs = require('fs');
const file =
	'C:/Users/mojpo/WebstormProjects/Initiative/src/lib/components/DonjonDungeonModal.svelte';
let c = fs.readFileSync(file, 'utf8');

const start = c.indexOf('\t\t\t\t{#each floorEncounters[currentFloor].slice(1) as enc, i}');
const endMarker = '\t\t\t\t{/each}';
const end = c.indexOf(endMarker) + endMarker.length;
if (start === -1 || end <= endMarker.length) {
	console.error('Block not found');
	process.exit(1);
}

const T = '\t';
const newBlock =
	T +
	T +
	T +
	T +
	'{#each floorEncounters[currentFloor].slice(1) as enc, i}\n' +
	T +
	T +
	T +
	T +
	T +
	'{@const roomId = i + 1}\n' +
	T +
	T +
	T +
	T +
	T +
	"{@const treasure = floorTreasure[currentFloor]?.[roomId] ?? ''}\n" +
	T +
	T +
	T +
	T +
	T +
	'{@const isBossRoom = floorBossRoomIds[currentFloor] === roomId}\n' +
	T +
	T +
	T +
	T +
	T +
	'{@const isStartRoom = currentFloor === 0 && roomId === 1}\n' +
	T +
	T +
	T +
	T +
	T +
	'<div class="flex flex-col gap-1 border-b border-white/5 px-3 py-2">\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	"<div class=\"flex gap-2 {enc === 'Empty' && !treasure ? 'text-gray-600' : 'text-gray-200'}\">\n" +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'<button\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	"class=\"w-5 shrink-0 text-left font-bold {isBossRoom ? 'text-red-400 hover:text-red-300' : isStartRoom ? 'text-green-400 hover:text-green-300' : 'text-indigo-400 hover:text-indigo-300'}\"\n" +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'title="Room description"\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'onclick={(e) => {\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'const el = e.currentTarget as HTMLElement;\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'if (activeRoomPopover?.roomId === roomId) { activeRoomPopover = null; }\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'else { activeRoomPopover = { roomId, enc, hasTreasure: !!treasure, isBoss: isBossRoom, isStart: isStartRoom, anchorEl: el }; }\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'}}\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'>{roomId}</button>\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'<span class="leading-snug">{enc || \'Empty\'}</span>\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	'</div>\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	'{#if treasure}\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'<div class="ml-5 flex items-start gap-1 text-[10px] text-amber-400">\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'<span class="shrink-0">\uD83D\uDCB0</span>\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'<span class="leading-snug">{treasure}</span>\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'</div>\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	'{/if}\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	"{#if enc !== 'Empty'}\n" +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'<button\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'onclick={() => addToInitiative(enc)}\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'class="ml-7 self-start rounded bg-indigo-700/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-200 hover:bg-indigo-600"\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'>\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'+ Add to Initiative\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	T +
	'</button>\n' +
	T +
	T +
	T +
	T +
	T +
	T +
	'{/if}\n' +
	T +
	T +
	T +
	T +
	T +
	'</div>\n' +
	T +
	T +
	T +
	T +
	'{/each}';

c = c.substring(0, start) + newBlock + c.substring(end);

// ── theme selector (after Floors label, before Boss Room) ────────────────────
const floorsEnd = c.indexOf(
	'\t\t</label>\n\n\t\t<label class="flex cursor-pointer items-center gap-2">\n\t\t\t<input type="checkbox" bind:checked={includeBossRoom}'
);
if (floorsEnd === -1) {
	console.error('Floors anchor not found');
	process.exit(1);
}
const themeSelect =
	T +
	T +
	'</label>\n\n' +
	T +
	T +
	'<label class="flex flex-col gap-1">\n' +
	T +
	T +
	T +
	'Theme\n' +
	T +
	T +
	T +
	'<select bind:value={dungeonTheme} class="w-full rounded bg-gray-700 px-1 py-0.5 text-white">\n' +
	T +
	T +
	T +
	T +
	'<option value="Crypt">\u26B0\uFE0F Crypt</option>\n' +
	T +
	T +
	T +
	T +
	'<option value="Sewer">Sewer</option>\n' +
	T +
	T +
	T +
	T +
	'<option value="Cave">Cave</option>\n' +
	T +
	T +
	T +
	T +
	'<option value="Fortress">\uD83C\uDFF0 Fortress</option>\n' +
	T +
	T +
	T +
	T +
	'<option value="Arcane">\uD83D\uDD2E Arcane</option>\n' +
	T +
	T +
	T +
	T +
	'<option value="Fungal">\uD83C\uDF44 Fungal</option>\n' +
	T +
	T +
	T +
	'</select>\n' +
	T +
	T +
	'</label>\n\n' +
	T +
	T +
	'<label class="flex cursor-pointer items-center gap-2">\n' +
	T +
	T +
	T +
	'<input type="checkbox" bind:checked={includeBossRoom}';
c =
	c.substring(0, floorsEnd) +
	themeSelect +
	c.substring(
		floorsEnd +
			T +
			T +
			'</label>\n\n\t\t<label class="flex cursor-pointer items-center gap-2">\n\t\t\t<input type="checkbox" bind:checked={includeBossRoom}'
				.length
	);
console.log('OK: theme selector');

// ── legend swatches ──────────────────────────────────────────────────────────
const swaps = [
	['bg-[#2a3a4a]', 'style="background:{C.floor}"'],
	['bg-[#1e2c3a]', 'style="background:{C.corridor}"'],
	['bg-[#c87820]', 'style="background:{C.door}"'],
	['bg-[#cc2222]', 'style="background:{C.trap}"'],
	['bg-[#1a2a5a]', 'style="background:{C.wallDim}"']
];
for (const [from, to] of swaps) {
	// replace only inside legend divs (in legend context keep class prefix)
	const fullFrom = `class="inline-block h-3 w-3 rounded-sm ${from} align-middle"`;
	const fullTo = `class="inline-block h-3 w-3 rounded-sm align-middle" ${to}`;
	if (c.includes(fullFrom)) {
		c = c.replace(fullFrom, fullTo);
		console.log('OK: legend swatch', from);
	} else {
		console.warn('WARN: legend swatch not found', from);
	}
}
// boss checkbox swatch
c = c.replace(
	'<span class="inline-block h-2.5 w-2.5 rounded-sm bg-[#4a1515]"></span>',
	'<span class="inline-block h-2.5 w-2.5 rounded-sm" style="background:{C.bossFloor}"></span>'
);
console.log('OK: boss swatch');

// ── room description popover (before trap popup) ─────────────────────────────
const beforeTrap = '\t<!-- trap detail popup -->';
const popover =
	'\t<!-- room description popover -->\n' +
	'\t{#if activeRoomPopover}\n' +
	'\t\t<button\n' +
	'\t\t\tclass="absolute inset-0 z-10"\n' +
	'\t\t\taria-label="Close room description"\n' +
	'\t\t\tonclick={() => (activeRoomPopover = null)}\n' +
	'\t\t></button>\n' +
	'\t\t<div\n' +
	'\t\t\tclass="absolute z-20 w-72 rounded-lg border border-indigo-900/60 bg-gray-900 p-4 shadow-xl"\n' +
	'\t\t\tstyle="left: {Math.min(activeRoomPopover.anchorEl.getBoundingClientRect().left - 296, window.innerWidth - 310)}px; top: {Math.min(activeRoomPopover.anchorEl.getBoundingClientRect().top, window.innerHeight - 200)}px;"\n' +
	'\t\t>\n' +
	'\t\t\t<div class="mb-2 flex items-start justify-between gap-2">\n' +
	"\t\t\t\t<h3 class=\"font-bold {activeRoomPopover.isBoss ? 'text-red-400' : activeRoomPopover.isStart ? 'text-green-400' : 'text-indigo-300'}\">\n" +
	"\t\t\t\t\tRoom {activeRoomPopover.roomId}{activeRoomPopover.isBoss ? ' \xB7 Boss' : activeRoomPopover.isStart ? ' \xB7 Start' : ''}\n" +
	'\t\t\t\t</h3>\n' +
	'\t\t\t\t<button onclick={() => (activeRoomPopover = null)} class="shrink-0 text-gray-500 hover:text-white" aria-label="Close">\u2715</button>\n' +
	'\t\t\t</div>\n' +
	'\t\t\t<p class="text-xs leading-relaxed text-gray-300 italic">\n' +
	'\t\t\t\t{getRoomDescription(activeRoomPopover.roomId, activeRoomPopover.enc, activeRoomPopover.hasTreasure, activeRoomPopover.isBoss, activeRoomPopover.isStart)}\n' +
	'\t\t\t</p>\n' +
	'\t\t\t<div class="mt-3 text-[10px] uppercase tracking-wide text-gray-600">{dungeonTheme} \xB7 for players</div>\n' +
	'\t\t</div>\n' +
	'\t{/if}\n\n' +
	'\t<!-- trap detail popup -->';

if (!c.includes(beforeTrap)) {
	console.error('trap popup anchor not found');
	process.exit(1);
}
c = c.replace(beforeTrap, popover);
console.log('OK: room description popover');

// ── Save/Load: add dungeonTheme ───────────────────────────────────────────────
c = c.replace(
	'\t\t\tnumFloors: number;\n\t\t};',
	'\t\t\tnumFloors: number;\n\t\t\tdungeonTheme?: DungeonTheme;\n\t\t};'
);
c = c.replace(
	'settings: { nRows, nCols, roomMin, roomMax, corridorLayout, removeDeadends, numFloors }',
	'settings: { nRows, nCols, roomMin, roomMax, corridorLayout, removeDeadends, numFloors, dungeonTheme }'
);
if (!c.includes('dungeonTheme = entry.settings.dungeonTheme')) {
	c = c.replace(
		'\t\tcorridorLayout = entry.settings.corridorLayout;',
		"\t\tcorridorLayout = entry.settings.corridorLayout;\n\t\tdungeonTheme = (entry.settings.dungeonTheme ?? 'Crypt') as DungeonTheme;"
	);
}
console.log('OK: save/load');

// ── close activeRoomPopover when floor changes ────────────────────────────────
c = c.replace(
	'function selectFloor(fi: number): void {',
	'function selectFloor(fi: number): void {\n\t\tactiveRoomPopover = null;'
);
console.log('OK: close popover on floor change');

fs.writeFileSync(file, c);
console.log('\nAll done!');
