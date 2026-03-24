const fs = require('fs');
const file =
	'C:/Users/mojpo/WebstormProjects/Initiative/src/lib/components/DonjonDungeonModal.svelte';
let c = fs.readFileSync(file, 'utf8');
const T = '\t';

function chk(label, pattern) {
	if (!c.includes(pattern)) {
		console.error('NOT FOUND: ' + label);
		console.error('Pattern: ' + JSON.stringify(pattern.slice(0, 80)));
		process.exit(1);
	}
}
function rep(label, old, next) {
	chk(label, old);
	c = c.replace(old, next);
	console.log('OK: ' + label);
}

// ── 1. State vars ─────────────────────────────────────────────────────────────
rep(
	'floorHazards + floorVisitedRooms state',
	'let floorTreasure = $state<string[][]>([]);',
	'let floorTreasure = $state<string[][]>([]);\n' +
		'\tlet floorHazards = $state<Record<number, string>[]>([]);\n' +
		'\tlet floorVisitedRooms = $state<Set<number>[]>([]);'
);

// ── 2. HAZARD_TABLE (insert before trap tables) ───────────────────────────────
const hazardTable = `
\t// ── environmental hazard tables (per dungeon theme) ──────────────────────────
\tconst HAZARD_TABLE: Record<DungeonTheme, string[]> = {
\t\tCrypt: [
\t\t\t'The flagstones are unstable; each step produces an ominous crack.',
\t\t\t'A thin mist of greenish gas seeps through cracks in the mortar.',
\t\t\t'The air is bitterly cold; breath fogs and metal burns to the touch.',
\t\t\t'Loose rubble from a partial ceiling collapse covers half the floor.',
\t\t\t'Foul water drips steadily from above, pooling in the low points.',
\t\t\t'The room is completely lightless — even darkvision struggles here.'
\t\t],
\t\tSewer: [
\t\t\t'Knee-deep black water floods the floor; visibility below the surface is zero.',
\t\t\t'A cloud of toxic fumes clings to the ceiling; taller creatures breathe it first.',
\t\t\t'The floor is dangerously slick; any sudden movement risks a fall.',
\t\t\t'The walls groan and crack — a section feels ready to give way.',
\t\t\t'Sewage gas has accumulated here; an open flame could ignite it.',
\t\t\t'Rat swarms have claimed this room; disturbing them will provoke a reaction.'
\t\t],
\t\tCave: [
\t\t\t'The ceiling is unstable — any loud noise or heavy blow risks a rockfall.',
\t\t\t'A deep pit cuts across the room; its bottom is not visible.',
\t\t\t'Thick supernatural darkness fills the room; darkvision extends only 5 feet.',
\t\t\t'Razor-sharp crystal formations cover much of the floor.',
\t\t\t'The air is thin and stale; sustained exertion is harder than usual.',
\t\t\t'A narrow underground river cuts through one corner; the current is swift.'
\t\t],
\t\tFortress: [
\t\t\t'Arrow slits in the walls allow this room to be fired into from adjacent corridors.',
\t\t\t'The floor has partially collapsed; several sections will not bear full weight.',
\t\t\t'A portcullis mechanism is visible — it could trap those inside.',
\t\t\t'Choking smoke from a long-dead fire still lingers near the ceiling.',
\t\t\t'Murder holes above this room allow something above to act against those below.',
\t\t\t'The iron door can be barred from the outside; those inside could be sealed in.'
\t\t],
\t\tArcane: [
\t\t\t'Wild magic saturates the air — spells cast here have unpredictable effects.',
\t\t\t'Magical darkness fills the room; it cannot be pierced by any light source.',
\t\t\t'An antimagic field suppresses all magical effects within.',
\t\t\t'Gravity is subtly wrong — movement costs double and balance is difficult.',
\t\t\t'The floor is inscribed with a binding glyph; triggering it is easy to do accidentally.',
\t\t\t'Time moves strangely here; creatures may act faster or slower than expected.'
\t\t],
\t\tFungal: [
\t\t\t'Dense spore clouds fill the air; breathing deeply requires a saving throw.',
\t\t\t'The floor yields underfoot like soft flesh — movement is halved.',
\t\t\t'Bioluminescent pulses from the fungal network cause disorientation.',
\t\t\t'Thick mycelium tangles throughout the room; it counts as difficult terrain.',
\t\t\t'The colony is aware of intruders here — something has been alerted.',
\t\t\t'Acidic secretions drip from the ceiling; standing still is not advisable.'
\t\t]
\t};

`;
const trapAnchor = '\n\t// ── trap tables ─';
chk('trap table anchor', trapAnchor);
c = c.slice(0, c.indexOf(trapAnchor)) + hazardTable + c.slice(c.indexOf(trapAnchor));
console.log('OK: HAZARD_TABLE');

// ── 3. generateHazards function (after generateTreasure, before generateEncounters) ──
rep(
	'generateHazards',
	'\tfunction generateEncounters(',
	'\tfunction generateHazards(\n' +
		'\t\tdungeon: Dungeon,\n' +
		'\t\tbossRoomId = 0,\n' +
		'\t\tfloorIndex = 0\n' +
		'\t): Record<number, string> {\n' +
		'\t\tconst table = HAZARD_TABLE[dungeonTheme];\n' +
		'\t\tconst result: Record<number, string> = {};\n' +
		'\t\tfor (let id = 1; id <= dungeon.n_rooms; id++) {\n' +
		'\t\t\tif (floorIndex === 0 && id === 1) continue; // skip start room\n' +
		'\t\t\tconst prob = id === bossRoomId ? 0.45 : 0.22;\n' +
		'\t\t\tif (Math.random() < prob) result[id] = table[rand(table.length)];\n' +
		'\t\t}\n' +
		'\t\treturn result;\n' +
		'\t}\n\n' +
		'\tfunction generateEncounters('
);

// ── 4. handleGenerate — init hazards + visitedRooms ───────────────────────────
rep(
	'handleGenerate init hazards+visited',
	'\t\tfloorTreasure = generated.map((d, fi) => generateTreasure(d, floorBossRoomIds[fi]));\n\t\tcurrentFloor = 0;',
	'\t\tfloorTreasure = generated.map((d, fi) => generateTreasure(d, floorBossRoomIds[fi]));\n' +
		'\t\tfloorHazards = generated.map((d, fi) => generateHazards(d, floorBossRoomIds[fi], fi));\n' +
		'\t\tfloorVisitedRooms = generated.map(() => new Set<number>());\n' +
		'\t\tcurrentFloor = 0;'
);

// ── 5. toggleVisited function (before onMount) ────────────────────────────────
rep(
	'toggleVisited',
	'\tonMount(() => {',
	'\tfunction toggleVisited(roomId: number): void {\n' +
		'\t\tconst s = new Set(floorVisitedRooms[currentFloor] ?? []);\n' +
		'\t\tif (s.has(roomId)) s.delete(roomId); else s.add(roomId);\n' +
		'\t\tfloorVisitedRooms = floorVisitedRooms.map((v, i) => (i === currentFloor ? s : v));\n' +
		'\t\trenderDungeon(floors[currentFloor], floorBossRoomIds[currentFloor], currentFloor === 0 ? 1 : 0);\n' +
		'\t}\n\n' +
		'\tonMount(() => {'
);

// ── 6. renderDungeon visited overlay (inject at end of function body) ─────────
{
	const rdStart = c.indexOf('\n\tfunction renderDungeon(');
	const rdEnd = c.indexOf('\n\tfunction ', rdStart + 1);
	const rdBody = c.slice(rdStart, rdEnd);
	const lastBrace = rdBody.lastIndexOf('\n\t}');
	const overlay =
		'\n\n\t\t// ── Visited overlay ────────────────────────────────────────────────────\n' +
		'\t\tconst visited = floorVisitedRooms[currentFloor] ?? new Set<number>();\n' +
		'\t\tif (visited.size > 0) {\n' +
		"\t\t\tctx.fillStyle = 'rgba(0,0,0,0.45)';\n" +
		'\t\t\tfor (let vr = 0; vr <= d.n_rows; vr++) {\n' +
		'\t\t\t\tfor (let vc = 0; vc <= d.n_cols; vc++) {\n' +
		'\t\t\t\t\tconst vcell = d.cell[vr][vc];\n' +
		'\t\t\t\t\tif (!(vcell & ROOM)) continue;\n' +
		'\t\t\t\t\tif (!visited.has((vcell & ROOM_ID) >> 6)) continue;\n' +
		'\t\t\t\t\tctx.fillRect(vc * TILE, vr * TILE, TILE, TILE);\n' +
		'\t\t\t\t}\n' +
		'\t\t\t}\n' +
		'\t\t}\n';
	const newRdBody = rdBody.slice(0, lastBrace) + overlay + '\n\t}';
	c = c.slice(0, rdStart) + newRdBody + c.slice(rdEnd);
	console.log('OK: renderDungeon visited overlay');
}

// ── 7. Template: add {@const isVisited} and {@const hazard} after roomName ────
rep(
	'isVisited + hazard consts',
	'{@const roomName = getRoomName(roomId, isBossRoom, isStartRoom)}',
	'{@const roomName = getRoomName(roomId, isBossRoom, isStartRoom)}\n' +
		T.repeat(5) +
		'{@const isVisited = (floorVisitedRooms[currentFloor] ?? new Set()).has(roomId)}\n' +
		T.repeat(5) +
		"{@const hazard = floorHazards[currentFloor]?.[roomId] ?? ''}"
);

// ── 8. Outer row div — add opacity when visited ───────────────────────────────
rep(
	'outer row div visited dim',
	'<div class="flex flex-col gap-1 border-b border-white/5 px-3 py-2">',
	"<div class=\"flex flex-col gap-1 border-b border-white/5 px-3 py-2 {isVisited ? 'opacity-50' : ''}\">"
);

// ── 9. Inner header div + add toggle button after name/enc stack ──────────────
rep(
	'inner div flex-1 + toggle button',
	'\n' +
		T.repeat(6) +
		'<div\n' +
		T.repeat(7) +
		"class=\"flex items-start gap-2 {enc === 'Empty' && !treasure\n" +
		T.repeat(8) +
		"? 'text-gray-600'\n" +
		T.repeat(8) +
		": 'text-gray-200'}\"\n" +
		T.repeat(6) +
		'>\n' +
		T.repeat(7) +
		'<button\n',

	'\n' +
		T.repeat(6) +
		'<div\n' +
		T.repeat(7) +
		"class=\"flex items-start gap-2 {enc === 'Empty' && !treasure\n" +
		T.repeat(8) +
		"? 'text-gray-600'\n" +
		T.repeat(8) +
		": 'text-gray-200'}\"\n" +
		T.repeat(6) +
		'>\n' +
		T.repeat(7) +
		'<button\n'
);

// find the </div> that closes the inner header div (right after the name/enc stack)
// and add the toggle button before it
rep(
	'add visited toggle button',
	T.repeat(7) + '</div>\n' + T.repeat(6) + '</div>\n' + T.repeat(6) + '{#if treasure}',

	T.repeat(7) +
		'</div>\n' +
		T.repeat(7) +
		'<button\n' +
		T.repeat(8) +
		'onclick={() => toggleVisited(roomId)}\n' +
		T.repeat(8) +
		"title={isVisited ? 'Mark unvisited' : 'Mark visited'}\n" +
		T.repeat(8) +
		'class="ml-auto shrink-0 text-[11px] transition {isVisited\n' +
		T.repeat(9) +
		"? 'text-green-500 hover:text-gray-600'\n" +
		T.repeat(9) +
		": 'text-gray-700 hover:text-green-500'}\"\n" +
		T.repeat(7) +
		'>✓</button\n' +
		T.repeat(6) +
		'>\n' +
		T.repeat(6) +
		'</div>\n' +
		T.repeat(6) +
		'{#if treasure}'
);

// ── 10. Hazard display block (after treasure block, before enc button) ────────
rep(
	'hazard display block',
	T.repeat(6) +
		"{#if enc !== 'Empty'}\n" +
		T.repeat(7) +
		'<button\n' +
		T.repeat(8) +
		'onclick={() => addToInitiative(enc)}',

	T.repeat(6) +
		'{#if hazard}\n' +
		T.repeat(7) +
		'<div class="ml-5 flex items-start gap-1 text-[10px] text-orange-400">\n' +
		T.repeat(8) +
		'<span class="shrink-0">⚠</span>\n' +
		T.repeat(8) +
		'<span class="leading-snug">{hazard}</span>\n' +
		T.repeat(7) +
		'</div>\n' +
		T.repeat(6) +
		'{/if}\n' +
		T.repeat(6) +
		"{#if enc !== 'Empty'}\n" +
		T.repeat(7) +
		'<button\n' +
		T.repeat(8) +
		'onclick={() => addToInitiative(enc)}'
);

// ── 11. setDungeonRoomDescription — add hazard field ─────────────────────────
rep(
	'setDungeonRoomDescription hazard',
	'body: getRoomDescription(roomId, enc, !!treasure, isBossRoom, isStartRoom),\n' +
		T.repeat(11) +
		'theme: dungeonTheme',
	'body: getRoomDescription(roomId, enc, !!treasure, isBossRoom, isStartRoom),\n' +
		T.repeat(11) +
		'hazard,\n' +
		T.repeat(11) +
		'theme: dungeonTheme'
);

// ── 12. Popover — add hazard section before the theme/for-players footer ─────
rep(
	'popover hazard section',
	'\t\t\t<div class="mt-3 text-[10px] tracking-wide text-gray-600 uppercase">\n' +
		'\t\t\t\t{dungeonTheme} · for players\n' +
		'\t\t\t</div>',
	"\t\t\t{#if activeRoomPopover && (floorHazards[currentFloor]?.[activeRoomPopover.roomId] ?? '')}\n" +
		'\t\t\t\t<div class="mt-3 flex items-start gap-1 text-[10px] text-orange-400">\n' +
		'\t\t\t\t\t<span class="shrink-0">⚠</span>\n' +
		'\t\t\t\t\t<span class="leading-snug italic">{floorHazards[currentFloor][activeRoomPopover.roomId]}</span>\n' +
		'\t\t\t\t</div>\n' +
		'\t\t\t{/if}\n' +
		'\t\t\t<div class="mt-3 text-[10px] tracking-wide text-gray-600 uppercase">\n' +
		'\t\t\t\t{dungeonTheme} · for players\n' +
		'\t\t\t</div>'
);

// ── 13. DungeonSave interface — add floorHazards + floorVisitedRooms ─────────
rep(
	'DungeonSave floorHazards + floorVisitedRooms',
	'\t\tfloorBossRoomIds: number[];\n\t\tincludeBossRoom: boolean;',
	'\t\tfloorBossRoomIds: number[];\n' +
		'\t\tfloorHazards?: Record<number, string>[];\n' +
		'\t\tfloorVisitedRooms?: number[][];\n' +
		'\t\tincludeBossRoom: boolean;'
);

// ── 14. confirmSave — persist hazards + visited ───────────────────────────────
rep(
	'confirmSave floorHazards + floorVisitedRooms',
	'\t\t\tfloorTreasure,\n\t\t\tfloorBossRoomIds,',
	'\t\t\tfloorTreasure,\n\t\t\tfloorBossRoomIds,\n' +
		'\t\t\tfloorHazards,\n' +
		'\t\t\tfloorVisitedRooms: floorVisitedRooms.map((s) => [...s]),'
);

// ── 15. loadSave — restore hazards + visited ─────────────────────────────────
rep(
	'loadSave restore hazards + visited',
	'const trapResults = entry.floors.map(generateTraps);',
	'floorHazards =\n' +
		'\t\tentry.floorHazards ??\n' +
		'\t\tentry.floors.map((d, fi) => generateHazards(d, entry.floorBossRoomIds[fi], fi));\n' +
		'\tfloorVisitedRooms =\n' +
		'\t\tentry.floorVisitedRooms?.map((arr) => new Set(arr)) ??\n' +
		'\t\tentry.floors.map(() => new Set<number>());\n' +
		'\tconst trapResults = entry.floors.map(generateTraps);'
);

fs.writeFileSync(file, c);
console.log('\nAll done!');
