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
