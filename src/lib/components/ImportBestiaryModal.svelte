<script lang="ts">
	import type { EnemyTemplate, MonsterDetail } from '$lib/types';

	interface Props {
		open: boolean;
		onImport: () => void;
	}

	let { open = $bindable(), onImport }: Props = $props();

	type ParsedMonster = EnemyTemplate & { source?: string; detail?: MonsterDetail };

	let parsed = $state<ParsedMonster[]>([]);
	let sourceLabel = $state('');
	let importing = $state(false);
	let result = $state<{ imported: number; skipped: number } | null>(null);
	let parseError = $state('');

	function close() {
		open = false;
		parsed = [];
		sourceLabel = '';
		importing = false;
		result = null;
		parseError = '';
	}

	// ── Constants ──────────────────────────────────────────────────────────────

	const SIZE_MAP: Record<string, string> = {
		F: 'Fine', D: 'Diminutive', T: 'Tiny', S: 'Small', M: 'Medium',
		L: 'Large', H: 'Huge', G: 'Gargantuan', C: 'Colossal'
	};

	const CR_XP: Record<string, string> = {
		'0': '10', '1/8': '25', '1/4': '50', '1/2': '100',
		'1': '200', '2': '450', '3': '700', '4': '1,100', '5': '1,800',
		'6': '2,300', '7': '2,900', '8': '3,900', '9': '5,000', '10': '5,900',
		'11': '7,200', '12': '8,400', '13': '10,000', '14': '11,500', '15': '13,000',
		'16': '15,000', '17': '18,000', '18': '20,000', '19': '22,000', '20': '25,000',
		'21': '33,000', '22': '41,000', '23': '50,000', '24': '62,000', '25': '75,000',
		'26': '90,000', '27': '105,000', '28': '120,000', '29': '135,000', '30': '155,000'
	};

	// ── Rendering helpers ──────────────────────────────────────────────────────

	function modStr(score: number): string {
		const mod = Math.floor((score - 10) / 2);
		return `(${mod >= 0 ? '+' : ''}${mod})`;
	}

	/** Convert 5etools inline tags to HTML. */
	function renderInline(text: string): string {
		return text
			.replace(/\{@recharge (\d+)\}/g, (_, n) => `(Recharge ${n}–6)`)
			.replace(/\{@h\}/g, 'Hit: ')
			.replace(/\{@atk ([^}]+)\}/g, (_, types: string) => {
				if (types.includes('mw') && types.includes('rw')) return 'Melee or Ranged Weapon Attack';
				if (types.includes('ms') && types.includes('rs')) return 'Melee or Ranged Spell Attack';
				if (types.includes('mw')) return 'Melee Weapon Attack';
				if (types.includes('rw')) return 'Ranged Weapon Attack';
				if (types.includes('ms')) return 'Melee Spell Attack';
				if (types.includes('rs')) return 'Ranged Spell Attack';
				return types;
			})
			.replace(/\{@hit ([^}]+)\}/g, '$1')
			.replace(/\{@dc ([^}]+)\}/g, 'DC $1')
			.replace(/\{@damage ([^}]+)\}/g, '$1')
			.replace(/\{@dice ([^|}]+)(?:\|[^}]*)?\}/g, '$1')
			.replace(/\{@d20 ([^|}]+)(?:\|[^}]*)?\}/g, '$1')
			.replace(/\{@b ([^}]+)\}/g, '<strong>$1</strong>')
			.replace(/\{@bold ([^}]+)\}/g, '<strong>$1</strong>')
			.replace(/\{@i ([^}]+)\}/g, '<em>$1</em>')
			.replace(/\{@italic ([^}]+)\}/g, '<em>$1</em>')
			// Generic: take the display text (first segment before |)
			.replace(/\{@[a-zA-Z]+ ([^|}]+)(?:\|[^}]*)?\}/g, '$1');
	}

	/** Recursively render a 5etools entry object or string to HTML. */
	function renderEntry(e: unknown): string {
		if (typeof e === 'string') return `<p>${renderInline(e)}</p>`;
		if (!e || typeof e !== 'object') return '';
		const obj = e as Record<string, unknown>;

		// Named sub-entry (most common for traits with multiple paragraphs)
		if (obj.type === 'entries' || obj.type === 'section') {
			const name = typeof obj.name === 'string' ? `<em><strong>${obj.name}.</strong></em> ` : '';
			const children = Array.isArray(obj.entries) ? obj.entries : [];
			if (name && children.length > 0 && typeof children[0] === 'string') {
				const [first, ...rest] = children;
				return `<p>${name}${renderInline(first as string)}</p>${rest.map(renderEntry).join('')}`;
			}
			return children.map(renderEntry).join('');
		}

		// List
		if (obj.type === 'list') {
			const items = Array.isArray(obj.items)
				? obj.items.map((i) => `<li>${typeof i === 'string' ? renderInline(i) : renderEntry(i)}</li>`).join('')
				: '';
			return `<ul class="list-disc ml-4 mb-2">${items}</ul>`;
		}

		// Named list item (list-hang-subtrait style)
		if (obj.type === 'item' || obj.type === 'itemSub') {
			const name = typeof obj.name === 'string' ? `<strong>${obj.name}.</strong> ` : '';
			if (typeof obj.entry === 'string') return `${name}${renderInline(obj.entry)}`;
			if (Array.isArray(obj.entries)) return `${name}${obj.entries.map(renderEntry).join('')}`;
			return name;
		}

		if (obj.type === 'inlineBlock' || obj.type === 'inline') {
			return Array.isArray(obj.entries) ? obj.entries.map(renderEntry).join('') : '';
		}
		if (obj.type === 'quote') {
			const content = Array.isArray(obj.entries) ? obj.entries.map(renderEntry).join('') : '';
			return `<blockquote class="border-l-2 border-gray-600 pl-3 italic">${content}</blockquote>`;
		}

		// Fallback: try to render entries if present
		if (Array.isArray(obj.entries)) return obj.entries.map(renderEntry).join('');
		return '';
	}

	/** Convert a 5etools feature array (trait/action/reaction/legendary) to HTML. */
	function parseFeatures(features: unknown): string | undefined {
		if (!Array.isArray(features) || features.length === 0) return undefined;
		const html = features.map((f) => {
			if (!f || typeof f !== 'object') return '';
			const feat = f as Record<string, unknown>;
			const rawName = typeof feat.name === 'string' ? feat.name : '';
			const recharge = feat.recharge !== undefined ? ` (Recharge ${feat.recharge}–6)` : '';
			const namePart = rawName ? `<em><strong>${rawName}${recharge}.</strong></em> ` : '';
			const entries = Array.isArray(feat.entries) ? feat.entries : [];
			if (entries.length === 0) return '';
			const [first, ...rest] = entries;
			const firstHtml = typeof first === 'string' ? renderInline(first) : renderEntry(first);
			const restHtml = rest.map(renderEntry).join('');
			return `<p>${namePart}${firstHtml}</p>${restHtml}`;
		}).join('');
		return html || undefined;
	}

	/** Convert a 5etools spellcasting array to HTML, appended to traits. */
	function renderSpellcasting(spellcasting: unknown[]): string {
		return spellcasting.map((sc) => {
			if (!sc || typeof sc !== 'object') return '';
			const s = sc as Record<string, unknown>;
			const name = typeof s.name === 'string' ? s.name : 'Spellcasting';
			const headers = Array.isArray(s.headerEntries)
				? s.headerEntries.map((h) => (typeof h === 'string' ? renderInline(h) : '')).join(' ')
				: '';
			const header = `<p><em><strong>${name}.</strong></em> ${headers}</p>`;

			const lines: string[] = [];

			// At will
			if (Array.isArray(s.will) && s.will.length > 0) {
				const spells = s.will
					.map((sp) => {
						if (typeof sp === 'string') return renderInline(sp);
						if (sp && typeof sp === 'object') {
							const o = sp as Record<string, unknown>;
							return typeof o.entry === 'string' ? renderInline(o.entry) : '';
						}
						return '';
					})
					.filter(Boolean)
					.join(', ');
				if (spells) lines.push(`<p>At will: ${spells}</p>`);
			}

			// Daily (1/day, 2/day, etc. — keys like "1", "2", "1e", "2e")
			if (s.daily && typeof s.daily === 'object') {
				const daily = s.daily as Record<string, unknown>;
				for (const [key, val] of Object.entries(daily)) {
					if (!Array.isArray(val)) continue;
					const num = key.replace('e', '');
					const spells = val
						.map((sp) => {
							if (typeof sp === 'string') return renderInline(sp);
							if (sp && typeof sp === 'object') {
								const o = sp as Record<string, unknown>;
								return typeof o.entry === 'string' ? renderInline(o.entry) : '';
							}
							return '';
						})
						.filter(Boolean)
						.join(', ');
					if (spells) lines.push(`<p>${num}/day each: ${spells}</p>`);
				}
			}

			// Slot-based (level-keyed spells object)
			if (s.spells && typeof s.spells === 'object') {
				const levelNames = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
				for (const [level, data] of Object.entries(s.spells as Record<string, unknown>)) {
					if (!data || typeof data !== 'object') continue;
					const d = data as Record<string, unknown>;
					const spells = Array.isArray(d.spells)
						? d.spells.map((sp) => (typeof sp === 'string' ? renderInline(sp) : '')).filter(Boolean).join(', ')
						: '';
					if (!spells) continue;
					if (level === '0') {
						lines.push(`<p>Cantrips (at will): ${spells}</p>`);
					} else {
						const lvlName = levelNames[parseInt(level)] ?? `${level}th`;
						const slots = typeof d.slots === 'number' ? ` (${d.slots} slot${d.slots !== 1 ? 's' : ''})` : '';
						lines.push(`<p>${lvlName} level${slots}: ${spells}</p>`);
					}
				}
			}

			return header + lines.join('');
		}).join('');
	}

	// ── Stat block field parsers ───────────────────────────────────────────────

	function parseAcNumber(ac: unknown): number {
		if (typeof ac === 'number') return ac;
		if (Array.isArray(ac)) {
			const first = ac[0];
			if (typeof first === 'number') return first;
			if (first && typeof first === 'object') return Number((first as Record<string, unknown>).ac ?? 10);
		}
		return 10;
	}

	function parseAcString(ac: unknown): string {
		if (typeof ac === 'number') return String(ac);
		if (Array.isArray(ac)) {
			const first = ac[0];
			if (typeof first === 'number') return String(first);
			if (first && typeof first === 'object') {
				const o = first as Record<string, unknown>;
				const base = String(o.ac ?? 10);
				const from = Array.isArray(o.from) && o.from.length ? ` (${(o.from as string[]).join(', ')})` : '';
				return base + from;
			}
		}
		return '10';
	}

	function parseCr(cr: unknown): string {
		if (typeof cr === 'string') return cr;
		if (typeof cr === 'number') return String(cr);
		if (cr && typeof cr === 'object') {
			const obj = cr as Record<string, unknown>;
			if (typeof obj.cr === 'string') return obj.cr;
		}
		return '1';
	}

	function parseMonsterTypeName(type: unknown): string {
		let raw = '';
		if (typeof type === 'string') raw = type;
		else if (type && typeof type === 'object') {
			const obj = type as Record<string, unknown>;
			raw = typeof obj.type === 'string' ? obj.type : '';
			if (Array.isArray(obj.tags) && obj.tags.length) {
				const tagStrs = (obj.tags as unknown[]).map((t) =>
					typeof t === 'string' ? t : String((t as Record<string, unknown>).tag ?? '')
				);
				raw += ` (${tagStrs.join(', ')})`;
			}
		}
		return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Humanoid';
	}

	function buildMeta(m: Record<string, unknown>): string {
		const sizes = Array.isArray(m.size)
			? (m.size as string[]).map((s) => SIZE_MAP[s] ?? s).join('/')
			: 'Medium';
		const typeStr = parseMonsterTypeName(m.type);
		let alignStr = '';
		if (Array.isArray(m.alignment) && m.alignment.length > 0) {
			const aligns = m.alignment as string[];
			if (aligns.includes('U')) alignStr = 'unaligned';
			else if (aligns.includes('A')) alignStr = 'any alignment';
			else {
				const AM: Record<string, string> = { L: 'lawful', N: 'neutral', C: 'chaotic', G: 'good', E: 'evil' };
				alignStr = aligns.map((a) => AM[a] ?? a.toLowerCase()).filter(Boolean).join(' ');
			}
		}
		return `${sizes} ${typeStr}${alignStr ? `, ${alignStr}` : ''}`.trim();
	}

	function parseSpeed(speed: unknown): string {
		if (!speed || typeof speed !== 'object') return '30 ft.';
		const s = speed as Record<string, unknown>;
		const getVal = (v: unknown) =>
			typeof v === 'object' && v !== null ? (v as Record<string, unknown>).number : v;
		const parts: string[] = [];
		if (s.walk !== undefined) {
			parts.push(`${getVal(s.walk)} ft.`);
		} else if (!s.fly && !s.swim && !s.burrow && !s.climb) {
			parts.push('0 ft.');
		}
		if (s.fly) parts.push(`fly ${getVal(s.fly)} ft.${s.canHover ? ' (hover)' : ''}`);
		if (s.swim) parts.push(`swim ${getVal(s.swim)} ft.`);
		if (s.climb) parts.push(`climb ${getVal(s.climb)} ft.`);
		if (s.burrow) parts.push(`burrow ${getVal(s.burrow)} ft.`);
		return parts.join(', ') || '30 ft.';
	}

	function parseHpString(hp: unknown): string {
		if (!hp || typeof hp !== 'object') return '10';
		const h = hp as Record<string, unknown>;
		if (h.special) return String(h.special);
		if (h.average !== undefined && h.formula) return `${h.average} (${h.formula})`;
		if (h.average !== undefined) return String(h.average);
		return '10';
	}

	function parseHpNumber(hp: unknown): number {
		if (!hp || typeof hp !== 'object') return 10;
		const h = hp as Record<string, unknown>;
		return typeof h.average === 'number' ? Math.max(1, h.average) : 10;
	}

	function parseSaves(save: unknown): string | undefined {
		if (!save || typeof save !== 'object') return undefined;
		const entries = Object.entries(save as Record<string, string>).map(
			([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)} ${v}`
		);
		return entries.length ? entries.join(', ') : undefined;
	}

	function parseSkills(skill: unknown): string | undefined {
		if (!skill || typeof skill !== 'object') return undefined;
		const entries = Object.entries(skill as Record<string, unknown>)
			.filter(([k]) => !k.startsWith('_'))
			.map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)} ${v}`);
		return entries.length ? entries.join(', ') : undefined;
	}

	function parseSenses(senses: unknown, passive: unknown): string {
		const parts: string[] = [];
		if (Array.isArray(senses)) parts.push(...(senses.filter((s) => typeof s === 'string') as string[]));
		parts.push(`passive Perception ${typeof passive === 'number' ? passive : 10}`);
		return parts.join(', ');
	}

	function parseLanguages(langs: unknown): string | undefined {
		if (!langs) return undefined;
		if (Array.isArray(langs)) {
			const strs = langs.filter((l) => typeof l === 'string') as string[];
			return strs.length ? strs.join(', ') : undefined;
		}
		return typeof langs === 'string' ? langs || undefined : undefined;
	}

	/** Parse a 5etools damage array (immune/resist/vulnerable) to a plain string. */
	function parseDamageList(list: unknown): string | undefined {
		if (!Array.isArray(list) || list.length === 0) return undefined;
		const parts: string[] = [];
		for (const item of list) {
			if (typeof item === 'string') {
				parts.push(item);
			} else if (item && typeof item === 'object') {
				const o = item as Record<string, unknown>;
				const dmg = Array.isArray(o.immune) ? o.immune
					: Array.isArray(o.resist) ? o.resist
					: Array.isArray(o.vulnerable) ? o.vulnerable
					: [];
				const note = typeof o.note === 'string' ? ` (${o.note})` : '';
				if (dmg.length) parts.push((dmg as string[]).join(', ') + note);
			}
		}
		return parts.length ? parts.join('; ') : undefined;
	}

	function parseConditionImmunities(ci: unknown): string | undefined {
		if (!Array.isArray(ci) || ci.length === 0) return undefined;
		const parts: string[] = [];
		for (const item of ci) {
			if (typeof item === 'string') parts.push(item);
			else if (item && typeof item === 'object') {
				const o = item as Record<string, unknown>;
				if (Array.isArray(o.conditionImmune)) parts.push(...(o.conditionImmune as string[]));
			}
		}
		return parts.length ? parts.join(', ') : undefined;
	}

	function parseChallengeStr(cr: unknown): string {
		const s = parseCr(cr);
		const xp = CR_XP[s];
		return xp ? `${s} (${xp} XP)` : s;
	}

	function buildDetail(m: Record<string, unknown>): MonsterDetail {
		const str = typeof m.str === 'number' ? m.str : 10;
		const dex = typeof m.dex === 'number' ? m.dex : 10;
		const con = typeof m.con === 'number' ? m.con : 10;
		const int = typeof m.int === 'number' ? m.int : 10;
		const wis = typeof m.wis === 'number' ? m.wis : 10;
		const cha = typeof m.cha === 'number' ? m.cha : 10;

		// Legendary actions (optional header text + feature list)
		const legendaryHeader = Array.isArray(m.legendaryHeader)
			? (m.legendaryHeader as unknown[]).map((h) => (typeof h === 'string' ? `<p>${renderInline(h)}</p>` : '')).join('')
			: '';
		const legendaryBody = parseFeatures(m.legendary) ?? '';
		const legendaryActions = legendaryHeader || legendaryBody ? legendaryHeader + legendaryBody : undefined;

		// Traits: native trait array + spellcasting (which is a separate field in 5etools)
		const traitHtml = parseFeatures(m.trait) ?? '';
		const spellcastHtml = Array.isArray(m.spellcasting)
			? renderSpellcasting(m.spellcasting as unknown[])
			: '';
		const traits = traitHtml + spellcastHtml || undefined;

		return {
			name: String(m.name),
			meta: buildMeta(m),
			armorClass: parseAcString(m.ac),
			hitPoints: parseHpString(m.hp),
			speed: parseSpeed(m.speed),
			str, strMod: modStr(str),
			dex, dexMod: modStr(dex),
			con, conMod: modStr(con),
			int, intMod: modStr(int),
			wis, wisMod: modStr(wis),
			cha, chaMod: modStr(cha),
			savingThrows: parseSaves(m.save),
			skills: parseSkills(m.skill),
			damageVulnerabilities: parseDamageList(m.vulnerable),
			damageImmunities: parseDamageList(m.immune),
			damageResistances: parseDamageList(m.resist),
			conditionImmunities: parseConditionImmunities(m.conditionImmune),
			senses: parseSenses(m.senses, m.passive),
			languages: parseLanguages(m.languages),
			challenge: parseChallengeStr(m.cr),
			traits,
			actions: parseFeatures(m.action),
			reactions: parseFeatures(m.reaction),
			legendaryActions,
			source: typeof m.source === 'string' ? m.source : undefined,
			page: typeof m.page === 'number' ? m.page : undefined
		};
	}

	// ── File parsing ───────────────────────────────────────────────────────────

	function onFileChange(e: Event) {
		parseError = '';
		result = null;
		parsed = [];
		sourceLabel = '';

		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			try {
				const json = JSON.parse(reader.result as string);
				if (!Array.isArray(json?.monster)) {
					parseError = 'No "monster" array found. Make sure this is a 5etools bestiary file.';
					return;
				}

				const monsters: ParsedMonster[] = [];
				let src = '';

				for (const m of json.monster) {
					if (!m?.name) continue;
					// Skip _copy entries — they reference another monster's stat block
					// and can't be resolved without the base file
					if (m._copy) continue;

					const source = typeof m.source === 'string' ? m.source : '';
					if (source && !src) src = source;

					monsters.push({
						name: String(m.name),
						ac: Math.max(1, Math.round(parseAcNumber(m.ac))),
						hp: Math.max(1, Math.round(parseHpNumber(m.hp))),
						cr: parseCr(m.cr),
						monsterType: parseMonsterTypeName(m.type),
						dexMod: typeof m.dex === 'number' ? Math.floor((m.dex - 10) / 2) : 0,
						...(source ? { source } : {}),
						detail: buildDetail(m as Record<string, unknown>)
					});
				}

				if (monsters.length === 0) {
					parseError = 'No valid monsters found in this file.';
					return;
				}

				parsed = monsters;
				sourceLabel = src;
			} catch {
				parseError = 'Failed to parse JSON. Make sure the file is a valid 5etools bestiary.';
			}
		};
		reader.readAsText(file);
	}

	async function doImport() {
		if (parsed.length === 0) return;
		importing = true;
		result = null;
		try {
			const res = await fetch('/api/monsters/batch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(parsed)
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				parseError = (data as Record<string, unknown>).error as string ?? 'Import failed.';
				return;
			}
			result = await res.json();
			onImport();
		} catch {
			parseError = 'Network error during import.';
		} finally {
			importing = false;
		}
	}
</script>

{#if open}
	<div
		role="dialog"
		aria-modal="true"
		aria-label="Import bestiary"
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-16 backdrop-blur-sm"
		tabindex="-1"
		onclick={(e) => { if (e.target === e.currentTarget) close(); }}
		onkeydown={(e) => { if (e.key === 'Escape') close(); }}
	>
		<div
			class="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
			style="max-height: calc(100vh - 5rem);"
		>
			<!-- Header -->
			<div class="flex shrink-0 items-center justify-between border-b border-gray-700 px-5 py-4">
				<h3 class="font-black tracking-widest text-indigo-400 uppercase">Import 5etools Bestiary</h3>
				<button onclick={close} class="text-gray-500 transition hover:text-white" aria-label="Close">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="flex flex-col gap-5 overflow-y-auto p-5">
				<!-- Instructions -->
				<p class="text-sm text-gray-400">
					Download a bestiary JSON file from the
					<a
						href="https://github.com/5etools-mirror-3/5etools-src/tree/master/data/bestiary"
						target="_blank"
						rel="noopener noreferrer"
						class="text-indigo-400 underline hover:text-indigo-300"
					>5etools data repository</a>
					(e.g. <code class="rounded bg-gray-800 px-1 text-xs text-indigo-300">bestiary-idrof.json</code>)
					and select it below. Full stat blocks are imported and shown in info cards.
				</p>

				<!-- File picker -->
				<div>
					<label for="bestiary-file" class="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">
						Bestiary JSON file
					</label>
					<input
						id="bestiary-file"
						type="file"
						accept=".json"
						onchange={onFileChange}
						class="block w-full cursor-pointer rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-300 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-indigo-700 file:px-3 file:py-1 file:text-xs file:font-bold file:text-white hover:file:bg-indigo-600"
					/>
				</div>

				{#if parseError}
					<p class="rounded border border-red-700/50 bg-red-900/20 px-3 py-2 text-sm text-red-400">{parseError}</p>
				{/if}

				{#if parsed.length > 0 && !result}
					<p class="text-sm text-gray-300">
						Found <strong class="text-white">{parsed.length}</strong> monsters
						{#if sourceLabel}from <strong class="text-indigo-300">{sourceLabel}</strong>{/if}
						with full stat blocks. Duplicates (matching an existing custom monster name) will be skipped.
					</p>
					<button
						onclick={doImport}
						disabled={importing}
						class="w-full rounded bg-indigo-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-indigo-600 disabled:opacity-50"
					>
						{importing ? 'Importing…' : `Import ${parsed.length} monsters`}
					</button>
				{/if}

				{#if result}
					<div class="rounded border border-green-700/50 bg-green-900/20 px-3 py-3 text-sm text-green-300">
						<p class="font-semibold">Import complete!</p>
						<p class="mt-1 text-gray-400">
							Imported <strong class="text-white">{result.imported}</strong> monsters with stat blocks
							{#if result.skipped > 0}
								&bull; <strong class="text-gray-300">{result.skipped}</strong> skipped (already exist or invalid)
							{/if}
						</p>
					</div>
					<button
						onclick={close}
						class="w-full rounded border border-gray-600 px-3 py-2 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white"
					>
						Close
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
