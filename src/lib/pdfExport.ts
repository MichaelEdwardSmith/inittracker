// Client-side PDF export for Combat Chronicle records.
// Dynamically imports jsPDF and jspdf-autotable so they are never included
// in the SSR bundle — only loaded in the browser on first use.
import type { CombatRecord, CombatEvent, NoteEntry } from '$lib/types';
import { crToXp } from '$lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────

function toRoman(n: number): string {
	const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
	const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
	let result = '';
	for (let i = 0; i < vals.length; i++) {
		while (n >= vals[i]) {
			result += syms[i];
			n -= vals[i];
		}
	}
	return result;
}

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

function formatTime(iso: string): string {
	return new Date(iso).toLocaleTimeString(undefined, {
		hour: '2-digit',
		minute: '2-digit'
	});
}

function durationMinutes(start: string, end: string): string {
	const ms = new Date(end).getTime() - new Date(start).getTime();
	const min = Math.round(ms / 60000);
	return min < 1 ? '<1 min' : `${min} min`;
}

// ISO date → "2025-01-15" for filename
function isoDate(iso: string): string {
	return new Date(iso).toISOString().slice(0, 10);
}

function eventDesc(e: CombatEvent): string {
	const actor = e.actorName;
	const target = e.combatantName;
	const isSelf = !actor || e.actorId === e.combatantId;

	switch (e.type) {
		case 'damage': {
			const hpNote = `(${e.hpBefore} --> ${e.hpAfter} HP)`;
			let line = isSelf
				? `${target} took ${e.value} damage ${hpNote}`
				: `${actor} dealt ${e.value} damage to ${target} ${hpNote}`;
			if (e.causedDown) {
				const suffix =
					e.combatantType === 'player'
						? `${target} was knocked unconscious!`
						: `${target} was slain!`;
				line += ` \u2014 ${suffix}`;
			}
			return line;
		}
		case 'heal':
			return isSelf
				? `${target} recovered ${e.value} HP (${e.hpBefore} --> ${e.hpAfter} HP)`
				: `${actor} healed ${target} for ${e.value} HP (${e.hpBefore} --> ${e.hpAfter} HP)`;
		case 'down':
			return e.combatantType === 'player'
				? `${target} was knocked unconscious!`
				: `${target} was slain!`;
		case 'condition_add':
			return isSelf
				? `${target} became ${e.condition}`
				: `${actor} inflicted ${e.condition} on ${target}`;
		case 'condition_remove':
			return `${target} shook off ${e.condition}`;
		default:
			return '';
	}
}

// ── Main export function ─────────────────────────────────────────────────────

export async function exportChronicle(
	record: CombatRecord,
	encounterNumber: number
): Promise<void> {
	// Lazy-load jsPDF in the browser only
	const { jsPDF } = await import('jspdf');
	const { applyPlugin } = await import('jspdf-autotable');
	applyPlugin(jsPDF);

	const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
	const pageW = doc.internal.pageSize.getWidth();
	const pageH = doc.internal.pageSize.getHeight();
	const margin = 15;
	const contentW = pageW - margin * 2;

	// Colours
	const darkHeader = [30, 30, 35] as [number, number, number];
	const lightGray = [240, 240, 242] as [number, number, number];
	const textDark = [20, 20, 25] as [number, number, number];
	const textMid = [80, 80, 90] as [number, number, number];
	const textLight = [150, 150, 160] as [number, number, number]; // used for "no events" fallback
	const accentAmber = [180, 120, 30] as [number, number, number];
	const accentBlue = [50, 100, 180] as [number, number, number];
	const accentRed = [190, 50, 50] as [number, number, number];
	const accentGreen = [50, 150, 80] as [number, number, number];

	let y = margin;

	// ── Header box ───────────────────────────────────────────────────────────
	const headerH = 24;
	doc.setFillColor(...darkHeader);
	doc.rect(margin, y, contentW, headerH, 'F');

	doc.setTextColor(180, 130, 40); // amber
	doc.setFontSize(7);
	doc.setFont('helvetica', 'bold');
	doc.text('COMBAT CHRONICLE', margin + 5, y + 6);

	doc.setTextColor(255, 255, 255);
	doc.setFontSize(13);
	doc.text(`Encounter ${toRoman(encounterNumber)}`, margin + 5, y + 13);

	doc.setFontSize(8);
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(180, 180, 185);
	const dateStr = `${formatDate(record.startedAt)}  \u00B7  ${formatTime(record.startedAt)}  \u00B7  ${durationMinutes(record.startedAt, record.endedAt)}`;
	doc.text(dateStr, margin + 5, y + 20);

	y += headerH + 2;

	// ── Stats row ────────────────────────────────────────────────────────────
	const statsH = 10;
	doc.setFillColor(...lightGray);
	doc.rect(margin, y, contentW, statsH, 'F');

	const players = record.participants.filter((p) => p.type === 'player');
	const slain = record.participants.filter((p) => p.wasSlain);
	const statsItems: string[] = [
		`${record.rounds} ${record.rounds === 1 ? 'Round' : 'Rounds'}`,
		`${players.length} ${players.length === 1 ? 'Player' : 'Players'}`,
		`${slain.length} Slain`
	];
	if (record.totalXp !== undefined) {
		statsItems.push(`${record.totalXp.toLocaleString()} XP`);
	}

	doc.setFontSize(8);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(...textMid);
	const segW = contentW / statsItems.length;
	statsItems.forEach((item, idx) => {
		const cx = margin + segW * idx + segW / 2;
		doc.text(item, cx, y + 6.5, { align: 'center' });
	});

	y += statsH + 6;

	// ── Participants table ────────────────────────────────────────────────────
	doc.setFontSize(8);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(...accentAmber);
	doc.text('PARTICIPANTS', margin, y);
	y += 3;

	const participantRows = record.participants.map((p) => [
		p.name,
		p.type === 'player' ? 'PC' : 'NPC',
		String(p.startHp),
		`${p.finalHp} / ${p.maxHp}`,
		p.totalDamage > 0 ? String(p.totalDamage) : '—',
		p.totalHealing > 0 ? String(p.totalHealing) : '—',
		p.wasSlain ? 'Slain' : 'Survived'
	]);

	// @ts-expect-error jspdf-autotable augments doc at runtime
	doc.autoTable({
		startY: y,
		head: [['Name', 'Type', 'Start HP', 'Final HP', 'Dmg', 'Healed', 'Status']],
		body: participantRows,
		margin: { left: margin, right: margin },
		styles: {
			fontSize: 8,
			cellPadding: 2,
			textColor: textDark,
			lineColor: [210, 210, 215],
			lineWidth: 0.1
		},
		headStyles: {
			fillColor: [55, 55, 65],
			textColor: [220, 220, 225],
			fontStyle: 'bold',
			fontSize: 7.5
		},
		alternateRowStyles: { fillColor: [248, 248, 250] },
		columnStyles: {
			0: { cellWidth: 'auto' },
			1: { cellWidth: 14, halign: 'center' },
			2: { cellWidth: 18, halign: 'center' },
			3: { cellWidth: 22, halign: 'center' },
			4: { cellWidth: 14, halign: 'center' },
			5: { cellWidth: 16, halign: 'center' },
			6: { cellWidth: 22, halign: 'center' }
		},
		didParseCell: (data: {
			section: string;
			column: { index: number };
			cell: { text: string[]; styles: { textColor: number[] } };
		}) => {
			if (data.section === 'body') {
				if (data.column.index === 1) {
					data.cell.styles.textColor = data.cell.text[0] === 'PC' ? accentBlue : accentRed;
				}
				if (data.column.index === 6) {
					data.cell.styles.textColor = data.cell.text[0].includes('Slain')
						? accentRed
						: accentGreen;
				}
			}
		}
	});

	// @ts-expect-error autoTable adds lastAutoTable
	y = (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

	// ── XP section ───────────────────────────────────────────────────────────
	const slainWithCr = record.participants.filter((p) => p.wasSlain && p.cr !== undefined);

	if (slainWithCr.length > 0) {
		// Section header
		doc.setFontSize(8);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(...accentAmber);
		doc.text('EXPERIENCE', margin, y);
		y += 3;

		const xpRows = slainWithCr.map((p) => [
			p.name,
			`CR ${p.cr}`,
			`${crToXp(p.cr!).toLocaleString()} XP`
		]);

		const footerRow = [
			{ content: 'Total XP', styles: { fontStyle: 'bold' as const, textColor: accentAmber } },
			{ content: '', styles: {} },
			{
				content: `${record.totalXp!.toLocaleString()} XP`,
				styles: { fontStyle: 'bold' as const, textColor: accentAmber }
			}
		];

		// @ts-expect-error jspdf-autotable augments doc at runtime
		doc.autoTable({
			startY: y,
			head: [['Enemy', 'CR', 'XP']],
			body: xpRows,
			foot: [footerRow],
			showFoot: 'lastPage',
			margin: { left: margin, right: margin },
			tableWidth: contentW / 2, // only half width
			styles: { fontSize: 8, cellPadding: 2, textColor: textDark },
			headStyles: {
				fillColor: [55, 55, 65],
				textColor: [220, 220, 225],
				fontStyle: 'bold',
				fontSize: 7.5
			},
			footStyles: { fillColor: lightGray, fontStyle: 'bold' },
			alternateRowStyles: { fillColor: [248, 248, 250] },
			columnStyles: {
				0: { cellWidth: 'auto' },
				1: { cellWidth: 20, halign: 'center' },
				2: { cellWidth: 30, halign: 'right' }
			}
		});

		// @ts-expect-error autoTable adds lastAutoTable
		y = (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

		if (players.length > 1 && record.totalXp !== undefined) {
			y += 3;
			doc.setFontSize(8);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(...textMid);
			const splitXp = Math.floor(record.totalXp / players.length);
			doc.text(`Split ${players.length} ways: ${splitXp.toLocaleString()} XP each`, margin, y);
		}

		y += 7;
	}

	// ── Event log ─────────────────────────────────────────────────────────────
	doc.setFontSize(8);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(...accentAmber);
	doc.text('EVENT LOG', margin, y);
	y += 5;

	// Group events by round
	const grouped = new Map<number, CombatEvent[]>();
	for (const e of record.events) {
		if (e.type === 'round_advance') continue;
		const arr = grouped.get(e.round) ?? [];
		arr.push(e);
		grouped.set(e.round, arr);
	}

	const sortedRounds = [...grouped.entries()].sort(([a], [b]) => a - b);

	if (sortedRounds.length === 0) {
		doc.setFontSize(8);
		doc.setFont('helvetica', 'italic');
		doc.setTextColor(...textLight);
		doc.text('No events recorded.', margin, y);
	}

	for (const [roundNum, events] of sortedRounds) {
		// Round header
		if (y > pageH - margin - 12) {
			doc.addPage();
			y = margin;
		}

		doc.setFontSize(8);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(...accentAmber);
		doc.text(`Round ${roundNum}`, margin, y);

		// Amber rule line
		doc.setDrawColor(...accentAmber);
		doc.setLineWidth(0.2);
		doc.line(margin + 22, y - 1, margin + contentW, y - 1);

		y += 4;

		for (const e of events) {
			const desc = eventDesc(e);
			if (!desc) continue;

			// Choose text colour
			let colour: [number, number, number];
			if (e.causedDown || e.type === 'down') colour = accentRed;
			else if (e.type === 'damage') colour = [190, 80, 80];
			else if (e.type === 'heal') colour = accentGreen;
			else if (e.type === 'condition_add' || e.type === 'condition_remove') colour = [130, 80, 180];
			else colour = textMid;

			// Wrap long lines
			const lines = doc.splitTextToSize(desc, contentW) as string[];
			const lineH = 4.5;
			const blockH = lines.length * lineH + 1;

			if (y + blockH > pageH - margin) {
				doc.addPage();
				y = margin;
			}

			doc.setFontSize(8);
			doc.setFont('helvetica', e.causedDown || e.type === 'down' ? 'bold' : 'normal');
			doc.setTextColor(...colour);
			doc.text(lines, margin, y);
			y += blockH;
		}

		y += 2; // gap between rounds
	}

	// ── Download ─────────────────────────────────────────────────────────────
	// Use blob URL + anchor click — more reliable than doc.save() after async chains
	const roman = toRoman(encounterNumber);
	const dateSlug = isoDate(record.startedAt);
	const filename = `encounter-${roman}-${dateSlug}.pdf`;
	const blob = doc.output('blob');
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// ── Notes PDF export ──────────────────────────────────────────────────────────

/** Convert rich-text editor HTML to plain text, preserving block structure. */
function htmlToPlainText(html: string): string {
	return html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/div>/gi, '\n')
		.replace(/<\/p>/gi, '\n')
		.replace(/<p[^>]*>/gi, '')
		.replace(/<div[^>]*>/gi, '')
		.replace(/<\/li>/gi, '\n')
		.replace(/<li[^>]*>/gi, '\u2022 ')
		.replace(/<\/ul>|<\/ol>/gi, '')
		.replace(/<ul[^>]*>|<ol[^>]*>/gi, '')
		.replace(/<[^>]+>/g, '')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&nbsp;/g, ' ')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/**
 * Export one or all session notes to PDF.
 * @param notes - array of NoteEntry (one for 'single', all for 'all')
 * @param sessionName - displayed in the PDF header
 * @param mode - 'single' exports one note; 'all' puts each on a new page
 */
export async function exportNotesPdf(
	notes: NoteEntry[],
	sessionName: string,
	mode: 'single' | 'all'
): Promise<void> {
	const { jsPDF } = await import('jspdf');
	const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
	const pageW = doc.internal.pageSize.getWidth();
	const pageH = doc.internal.pageSize.getHeight();
	const margin = 15;
	const contentW = pageW - margin * 2;

	const darkHeader = [30, 30, 35] as [number, number, number];
	const textDark = [20, 20, 25] as [number, number, number];

	let y = margin;
	let firstNote = true;

	for (const note of notes) {
		if (!firstNote) {
			doc.addPage();
			y = margin;
		}
		firstNote = false;

		// ── Note header block ────────────────────────────────────────────────
		doc.setFillColor(...darkHeader);
		doc.rect(margin, y, contentW, 22, 'F');

		doc.setTextColor(180, 130, 40);
		doc.setFontSize(7);
		doc.setFont('helvetica', 'bold');
		doc.text('SESSION NOTES', margin + 5, y + 6);

		doc.setTextColor(255, 255, 255);
		doc.setFontSize(12);
		doc.setFont('helvetica', 'bold');
		doc.text(formatDate(note.date), margin + 5, y + 14);

		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(180, 180, 185);
		doc.text(sessionName, margin + 5, y + 20);

		y += 22 + 8;

		// ── Note body ────────────────────────────────────────────────────────
		const plainText = htmlToPlainText(note.content);
		const paragraphs = plainText.split('\n');

		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(...textDark);

		const lineH = 5;

		for (const para of paragraphs) {
			const lines = doc.splitTextToSize(para || '', contentW);
			for (const line of lines) {
				if (y + lineH > pageH - margin) {
					doc.addPage();
					y = margin;
				}
				doc.text(line, margin, y);
				y += lineH;
			}
			// extra space between paragraphs
			if (para === '') y += lineH * 0.4;
		}
	}

	// ── Download ─────────────────────────────────────────────────────────────
	const dateSlug = new Date().toISOString().slice(0, 10);
	const filename =
		mode === 'single' ? `notes-${isoDate(notes[0].date)}.pdf` : `notes-all-${dateSlug}.pdf`;

	const blob = doc.output('blob');
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// ── NPC PDF export ────────────────────────────────────────────────────────────

type NpcPdfStats = {
	cr: string;
	xp: number;
	ac: number;
	acNote: string;
	hp: number;
	hpDice: string;
	speed: number;
	str: number;
	dex: number;
	con: number;
	int: number;
	wis: number;
	cha: number;
	savingThrows: string[];
	skills: string[];
	traits: { name: string; desc: string }[];
	actions: { name: string; desc: string }[];
	alignment: string;
	type: string;
};

type NpcPdfData = {
	name: string;
	race: string;
	gender: string;
	ageDesc: string;
	role: string;
	disposition: string;
	build: string;
	feature: string;
	clothing: string;
	trait: string;
	flaw: string;
	voice: string;
	motivation: string;
	secret: string;
	plotHook: string;
	stats: NpcPdfStats;
};

export async function exportNpcPdf(npc: NpcPdfData): Promise<void> {
	const { jsPDF } = await import('jspdf');
	const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
	const pageW = doc.internal.pageSize.getWidth();
	const margin = 15;
	const contentW = pageW - margin * 2;

	const C = {
		dark: [30, 30, 35] as [number, number, number],
		amber: [180, 120, 30] as [number, number, number],
		textDark: [20, 20, 25] as [number, number, number],
		textMid: [80, 80, 90] as [number, number, number],
		textLight: [160, 160, 170] as [number, number, number]
	};

	const colGap = 6;
	const leftW = Math.round(contentW * 0.55);
	const rightW = contentW - leftW - colGap;
	const leftX = margin;
	const rightX = margin + leftW + colGap;

	// ── Header ────────────────────────────────────────────────────────────────
	let y = margin;
	const headerH = 22;
	doc.setFillColor(...C.dark);
	doc.rect(margin, y, contentW, headerH, 'F');

	doc.setFontSize(7);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(180, 130, 40);
	doc.text('NPC PROFILE', margin + 5, y + 6);

	doc.setFontSize(14);
	doc.setTextColor(255, 255, 255);
	doc.text(npc.name, margin + 5, y + 14);

	doc.setFontSize(7);
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(180, 180, 185);
	doc.text(npc.disposition.toUpperCase(), pageW - margin - 5, y + 6, { align: 'right' });

	doc.setFontSize(8.5);
	doc.setTextColor(160, 160, 170);
	doc.text(`${npc.race} ${npc.role}`, margin + 5, y + 19);
	doc.text(`${npc.gender} · ${npc.ageDesc}`, pageW - margin - 5, y + 19, { align: 'right' });

	y += headerH + 7;

	// ── Helpers ───────────────────────────────────────────────────────────────
	function modStr(score: number): string {
		const m = Math.floor((score - 10) / 2);
		return m >= 0 ? `+${m}` : `${m}`;
	}

	function sectionHeader(label: string, x: number, colYRef: { v: number }, maxX: number) {
		doc.setFontSize(6.5);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(...C.amber);
		doc.text(label, x, colYRef.v);
		const tw = doc.getTextWidth(label) + 2;
		doc.setDrawColor(...C.amber);
		doc.setLineWidth(0.2);
		doc.line(x + tw, colYRef.v - 0.5, maxX, colYRef.v - 0.5);
		colYRef.v += 4;
	}

	function labelLine(
		label: string,
		value: string,
		x: number,
		colYRef: { v: number },
		colW: number
	) {
		doc.setFontSize(8);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(...C.textMid);
		const labelStr = label + ' ';
		const lw = doc.getTextWidth(labelStr);
		doc.text(labelStr, x, colYRef.v);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(...C.textDark);
		const lines = doc.splitTextToSize(value, colW - lw) as string[];
		lines.forEach((line, i) => {
			doc.text(line, i === 0 ? x + lw : x, colYRef.v + i * 4.5);
		});
		colYRef.v += lines.length * 4.5 + 1;
	}

	function inlineEntry(
		name: string,
		desc: string,
		x: number,
		colYRef: { v: number },
		colW: number
	) {
		doc.setFontSize(8);
		doc.setFont('helvetica', 'bolditalic');
		doc.setTextColor(...C.textDark);
		const nameStr = name + '. ';
		const nw = doc.getTextWidth(nameStr);
		doc.text(nameStr, x, colYRef.v);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(...C.textMid);
		const firstChunk = doc.splitTextToSize(desc, colW - nw) as string[];
		const firstLine = firstChunk[0] ?? '';
		doc.text(firstLine, x + nw, colYRef.v);
		colYRef.v += 4.5;
		const remaining = desc.slice(firstLine.length).trim();
		if (remaining) {
			const rest = doc.splitTextToSize(remaining, colW) as string[];
			rest.forEach((line) => {
				doc.text(line, x, colYRef.v);
				colYRef.v += 4.5;
			});
		}
		colYRef.v += 1;
	}

	function amberRule(colYRef: { v: number }) {
		doc.setDrawColor(...C.amber);
		doc.setLineWidth(0.35);
		doc.line(rightX, colYRef.v, rightX + rightW, colYRef.v);
		colYRef.v += 3;
	}

	function statRow(label: string, value: string) {
		doc.setFontSize(8);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(...C.textDark);
		const lw = doc.getTextWidth(label + ' ');
		doc.text(label + ' ', rightX, rY.v);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(...C.textMid);
		doc.text(value, rightX + lw, rY.v);
		rY.v += 4.5;
	}

	// ── Left column: flavor ───────────────────────────────────────────────────
	const lY = { v: y };
	const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

	sectionHeader('APPEARANCE', leftX, lY, leftX + leftW);
	labelLine('Build:', npc.build + '.', leftX, lY, leftW);
	labelLine('Feature:', cap(npc.feature) + '.', leftX, lY, leftW);
	labelLine('Clothing:', cap(npc.clothing) + '.', leftX, lY, leftW);
	lY.v += 2;

	sectionHeader('PERSONALITY', leftX, lY, leftX + leftW);
	labelLine('Trait:', npc.trait, leftX, lY, leftW);
	labelLine('Flaw:', npc.flaw, leftX, lY, leftW);
	labelLine('Voice:', npc.voice, leftX, lY, leftW);
	lY.v += 2;

	sectionHeader('DRIVE & SECRET', leftX, lY, leftX + leftW);
	labelLine('Wants:', npc.motivation, leftX, lY, leftW);
	labelLine('Hides:', npc.secret, leftX, lY, leftW);
	lY.v += 2;

	sectionHeader('PLOT HOOK', leftX, lY, leftX + leftW);
	doc.setFontSize(8);
	doc.setFont('helvetica', 'italic');
	doc.setTextColor(...C.textDark);
	const hookLines = doc.splitTextToSize(npc.plotHook, leftW) as string[];
	hookLines.forEach((line) => {
		doc.text(line, leftX, lY.v);
		lY.v += 4.5;
	});

	// ── Right column: stat block ──────────────────────────────────────────────
	const rY = { v: y };
	const sb = npc.stats;

	doc.setFontSize(11);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(...C.textDark);
	doc.text(npc.name, rightX, rY.v);
	rY.v += 4.5;

	doc.setFontSize(8);
	doc.setFont('helvetica', 'italic');
	doc.setTextColor(...C.textMid);
	const typeLine = doc.splitTextToSize(
		`Medium ${sb.type} (${npc.race.toLowerCase()}), ${sb.alignment}`,
		rightW
	) as string[];
	typeLine.forEach((l) => {
		doc.text(l, rightX, rY.v);
		rY.v += 4;
	});
	rY.v += 1;

	amberRule(rY);

	statRow('Armor Class', `${sb.ac}${sb.acNote ? ` (${sb.acNote})` : ''}`);
	statRow('Hit Points', `${sb.hp} (${sb.hpDice})`);
	statRow('Speed', `${sb.speed} ft.`);
	rY.v += 1;

	amberRule(rY);

	// Ability scores
	const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
	const scores = [sb.str, sb.dex, sb.con, sb.int, sb.wis, sb.cha];
	const abColW = rightW / 6;

	abilities.forEach((ab, i) => {
		const cx = rightX + abColW * i + abColW / 2;
		doc.setFontSize(7);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(...C.amber);
		doc.text(ab, cx, rY.v, { align: 'center' });
	});
	rY.v += 3.5;

	scores.forEach((score, i) => {
		const cx = rightX + abColW * i + abColW / 2;
		doc.setFontSize(8);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(...C.textDark);
		doc.text(String(score), cx, rY.v, { align: 'center' });
		doc.setFontSize(7);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(...C.textMid);
		doc.text(`(${modStr(score)})`, cx, rY.v + 3.5, { align: 'center' });
	});
	rY.v += 8;

	amberRule(rY);

	if (sb.savingThrows.length) statRow('Saving Throws', sb.savingThrows.join(', '));
	if (sb.skills.length) statRow('Skills', sb.skills.join(', '));
	statRow('Challenge', `${sb.cr} (${sb.xp} XP)`);
	statRow('Proficiency Bonus', '+2');
	rY.v += 1;

	if (sb.traits.length) {
		amberRule(rY);
		sb.traits.forEach((t) => inlineEntry(t.name, t.desc, rightX, rY, rightW));
	}

	amberRule(rY);

	doc.setFontSize(9);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(...C.amber);
	doc.text('Actions', rightX, rY.v);
	rY.v += 5;

	sb.actions.forEach((a) => inlineEntry(a.name, a.desc, rightX, rY, rightW));

	// ── Footer ────────────────────────────────────────────────────────────────
	const finalY = Math.max(lY.v, rY.v) + 6;
	doc.setFontSize(7);
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(...C.textLight);
	doc.text(`Generated by Initiative Tracker · ${new Date().toLocaleDateString()}`, margin, finalY);

	// ── Download ──────────────────────────────────────────────────────────────
	const slug = npc.name
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');
	const dateSlug = new Date().toISOString().slice(0, 10);
	const filename = `npc-${slug}-${dateSlug}.pdf`;
	const blob = doc.output('blob');
	const url = URL.createObjectURL(blob);
	const npcAnchor = document.createElement('a');
	npcAnchor.href = url;
	npcAnchor.download = filename;
	document.body.appendChild(npcAnchor);
	npcAnchor.click();
	document.body.removeChild(npcAnchor);
	URL.revokeObjectURL(url);
}

// ── Dungeon PDF export ────────────────────────────────────────────────────────

type DungeonMonster = { name: string; count: number };
type DungeonEncounter = { monsters: DungeonMonster[]; xp: number; difficulty: string };
type DungeonRoom = {
	id: number;
	name: string;
	isEntrance: boolean;
	isBoss: boolean;
	encounter: DungeonEncounter | null;
	loot?: { coins: string; items: string[] };
};
type DungeonFloorData = { rooms: DungeonRoom[] };

const DIFF_COLOR: Record<string, [number, number, number]> = {
	trivial: [120, 120, 130],
	easy: [60, 160, 90],
	medium: [180, 160, 40],
	hard: [200, 120, 40],
	deadly: [190, 50, 50]
};

export async function exportDungeonPdf(
	floors: DungeonFloorData[],
	floorImages: string[]
): Promise<void> {
	const { jsPDF } = await import('jspdf');
	const { applyPlugin } = await import('jspdf-autotable');
	applyPlugin(jsPDF);

	// A4 portrait
	const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
	const pageW = doc.internal.pageSize.getWidth(); // 210
	const pageH = doc.internal.pageSize.getHeight(); // 297
	const margin = 12;
	const contentW = pageW - margin * 2; // 186

	const darkHeader = [30, 30, 35] as [number, number, number];
	const accentAmber = [180, 120, 30] as [number, number, number];
	const textMid = [80, 80, 90] as [number, number, number];
	const textDark = [20, 20, 25] as [number, number, number];

	const MAP_W = contentW; // 186mm
	const MAP_H = Math.round(MAP_W * (672 / 992)); // ~126mm — matches canvas aspect ratio

	for (let fi = 0; fi < floors.length; fi++) {
		if (fi > 0) doc.addPage();

		let y = margin;

		// ── Page header ────────────────────────────────────────────────────
		doc.setFillColor(...darkHeader);
		doc.rect(margin, y, contentW, 14, 'F');

		doc.setTextColor(180, 130, 40);
		doc.setFontSize(7);
		doc.setFont('helvetica', 'bold');
		doc.text('DUNGEON MAP', margin + 4, y + 5);

		doc.setTextColor(255, 255, 255);
		doc.setFontSize(12);
		doc.text(
			floors.length > 1 ? `Floor ${fi + 1} of ${floors.length}` : 'Floor Plan',
			margin + 4,
			y + 11
		);

		if (floors.length > 1) {
			const floorLabel = fi === 0 ? 'Ground Floor' : `${fi} Level${fi > 1 ? 's' : ''} Below Ground`;
			doc.setFontSize(7);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(160, 160, 170);
			doc.text(floorLabel, pageW - margin - 4, y + 5, { align: 'right' });
		}

		y += 14 + 4;

		// ── Map image ──────────────────────────────────────────────────────
		const img = floorImages[fi];
		if (img) {
			doc.addImage(img, 'PNG', margin, y, MAP_W, MAP_H);
		}
		y += MAP_H + 6;

		// ── Encounters section ─────────────────────────────────────────────
		const roomsWithEnc = floors[fi].rooms.filter(
			(r) => !r.isEntrance && r.encounter && r.encounter.monsters.length > 0
		);
		const entrance = floors[fi].rooms.find((r) => r.isEntrance);

		doc.setFontSize(7.5);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(...accentAmber);
		doc.text('ROOM ENCOUNTERS', margin, y);
		y += 4;

		if (roomsWithEnc.length === 0) {
			doc.setFontSize(8);
			doc.setFont('helvetica', 'italic');
			doc.setTextColor(...textMid);
			doc.text('No encounters on this floor.', margin, y);
		} else {
			const tableRows = roomsWithEnc.map((r) => {
				const monsterStr = r.encounter!.monsters.map((m) => `${m.count}x ${m.name}`).join(', ');
				const diffLabel =
					r.encounter!.difficulty.charAt(0).toUpperCase() + r.encounter!.difficulty.slice(1);
				return [
					`${r.id + 1}. ${r.name}${r.isBoss ? ' *' : ''}`,
					monsterStr,
					diffLabel,
					r.encounter!.xp.toLocaleString()
				];
			});

			// @ts-expect-error jspdf-autotable augments doc at runtime
			doc.autoTable({
				startY: y,
				head: [['Room', 'Monsters', 'Difficulty', 'XP']],
				body: tableRows,
				margin: { left: margin, right: margin },
				styles: { fontSize: 7.5, cellPadding: 1.8, textColor: textDark },
				headStyles: {
					fillColor: [50, 50, 60],
					textColor: [220, 220, 225],
					fontStyle: 'bold',
					fontSize: 7
				},
				alternateRowStyles: { fillColor: [248, 248, 250] },
				columnStyles: {
					0: { cellWidth: 44 },
					1: { cellWidth: 'auto' },
					2: { cellWidth: 22, halign: 'center' },
					3: { cellWidth: 20, halign: 'right' }
				},
				didParseCell: (data: {
					section: string;
					column: { index: number };
					cell: { text: string[]; styles: { textColor: number[]; fontStyle: string } };
				}) => {
					if (data.section === 'body' && data.column.index === 2) {
						const diff = (data.cell.text[0] || '').toLowerCase();
						data.cell.styles.textColor = DIFF_COLOR[diff] ?? textMid;
						data.cell.styles.fontStyle = 'bold';
					}
					if (
						data.section === 'body' &&
						data.column.index === 0 &&
						data.cell.text[0]?.includes('*')
					) {
						data.cell.styles.textColor = [190, 50, 50];
						data.cell.styles.fontStyle = 'bold';
					}
				}
			});
		}

		// ── Entrance note ──────────────────────────────────────────────────
		const afterTable: number =
			roomsWithEnc.length > 0
				? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
				: y + 4;

		if (entrance) {
			doc.setFontSize(7.5);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(...textMid);
			doc.text(
				`Room ${entrance.id + 1} (${entrance.name}) is the party entrance.`,
				margin,
				Math.min(afterTable, pageH - margin - 4)
			);
		}
	}

	// ── Download ───────────────────────────────────────────────────────────────
	const dateSlug = new Date().toISOString().slice(0, 10);
	const filename = `dungeon-map-${dateSlug}.pdf`;
	const blob = doc.output('blob');
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
