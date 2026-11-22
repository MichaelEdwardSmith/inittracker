<!-- Easter egg: click the clock on the DM dashboard to play a 5-10 minute solo mini adventure.
     Pick a class, roll up a hero, then walk through seven scenes generated from the tables in
     $lib/miniAdventureData. Entirely client-side and nothing is saved. -->
<script lang="ts">
	import { focusTrap } from '$lib/actions/focusTrap';
	import {
		ABILITY_LABEL,
		BACKGROUNDS,
		BOSSES,
		CHECK_CRIT,
		CHECK_FUMBLE,
		CLASSES,
		EPILOGUES_DEFEAT,
		EPILOGUES_VICTORY,
		FIRST_NAMES,
		FLEE_LINES,
		FOE_HIT_LINES,
		FOE_MISS_LINES,
		GOALS,
		HIT_LINES,
		HOOK_SCENES,
		MISS_LINES,
		MONSTERS,
		OBJECTS,
		OBSTACLES,
		PATRONS,
		PLACES,
		POCKET_CURIOS,
		QUIRKS,
		ROAD_EVENTS,
		SURNAMES,
		TITLES_LEGENDARY,
		TITLES_SCRAPE,
		TITLES_SOLID,
		TREASURES,
		TWISTS,
		type Ability,
		type Challenge,
		type Foe,
		type HeroClass
	} from '$lib/miniAdventureData';

	let { onclose }: { onclose: () => void } = $props();

	// ── Dice helpers ──────────────────────────────────────────────────────────────────────────
	const d = (n: number) => Math.floor(Math.random() * n) + 1;
	const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
	const mod = (score: number) => Math.floor((score - 10) / 2);
	const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
	const ABILITIES: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
	const PROF = 2;

	function rollScore() {
		const dice = [d(6), d(6), d(6), d(6)].sort((a, b) => a - b);
		return dice[1] + dice[2] + dice[3];
	}

	function randomName() {
		return `${pick(FIRST_NAMES)} ${pick(SURNAMES)}`;
	}

	// ── Hero setup ────────────────────────────────────────────────────────────────────────────
	let phase = $state<'setup' | 'story' | 'end'>('setup');
	let cls = $state<HeroClass | null>(null);
	let heroName = $state(randomName());
	let stats = $state<Record<Ability, number> | null>(null);
	let quirk = $state(pick(QUIRKS));
	let background = $state(pick(BACKGROUNDS));
	let curio = $state(pick(POCKET_CURIOS));

	function rollStats(c: HeroClass) {
		const scores = Array.from({ length: 6 }, rollScore).sort((a, b) => b - a);
		const out = {} as Record<Ability, number>;
		c.priority.forEach((ab, i) => (out[ab] = scores[i]));
		stats = out;
	}

	function chooseClass(c: HeroClass) {
		cls = c;
		rollStats(c);
	}

	function rerollHero() {
		if (cls) rollStats(cls);
		heroName = randomName();
		quirk = pick(QUIRKS);
		background = pick(BACKGROUNDS);
		curio = pick(POCKET_CURIOS);
	}

	const maxHpPreview = $derived.by(() => {
		if (!cls || !stats) return 0;
		return Math.max(10, cls.hitDie + 2 * (Math.floor(cls.hitDie / 2) + 1) + 3 * mod(stats.con));
	});

	// ── Adventure state ───────────────────────────────────────────────────────────────────────
	interface Ctx {
		hero: string;
		patron: string;
		place: string;
		object: string;
		villain: string;
		goal: string;
		bossFoe: Foe;
	}
	type Tone = 'good' | 'bad' | 'neutral';
	interface JournalEntry {
		title: string;
		text: string;
		tone: Tone;
	}
	type Scene =
		| { kind: 'story'; title: string; text: string }
		| { kind: 'challenge'; title: string; text: string; ch: Challenge; dc: number }
		| {
				kind: 'combat';
				title: string;
				text: string;
				foe: Foe;
				foeHp: number;
				boss: boolean;
				log: string[];
				done: null | 'won' | 'fled';
		  };

	const STEPS = 7;
	let ctx = $state<Ctx | null>(null);
	let step = $state(0);
	let scene = $state<Scene | null>(null);
	let outcome = $state<{ text: string; tone: Tone } | null>(null);
	let journal = $state<JournalEntry[]>([]);
	let hp = $state(0);
	let maxHp = $state(0);
	let glory = $state(0);
	let sigUsed = $state(false);
	let useSig = $state(false);
	let potionUsed = $state(false);
	let ending = $state<{
		won: boolean;
		fullTitle: string;
		gold: number;
		treasure: string;
		epilogue: string;
	} | null>(null);

	function fill(text: string): string {
		if (!ctx) return text;
		const out = text
			.replaceAll('{hero}', ctx.hero)
			.replaceAll('{patron}', ctx.patron)
			.replaceAll('{place}', ctx.place)
			.replaceAll('{object}', ctx.object)
			.replaceAll('{villain}', ctx.villain);
		// Capitalize the start of each sentence (placeholders like "the Sunken Chapel" may lead one).
		return out.replace(
			/(^|[.!?]\s+|"\s*)([a-z])/g,
			(_m, p: string, ch: string) => p + ch.toUpperCase()
		);
	}

	function fillChallenge(ch: Challenge): Challenge {
		return {
			title: fill(ch.title),
			text: fill(ch.text),
			options: ch.options,
			win: fill(ch.win),
			lose: fill(ch.lose)
		};
	}

	function beginAdventure() {
		if (!cls || !stats) return;
		const boss = pick(BOSSES);
		const patron = pick(PATRONS);
		const place = pick(PLACES);
		const object = pick(OBJECTS);
		ctx = {
			hero: heroName.trim() || 'The Nameless One',
			patron,
			place,
			object,
			villain: boss.title,
			goal: pick(GOALS),
			bossFoe: boss.foe
		};
		maxHp = maxHpPreview;
		hp = maxHp;
		glory = 0;
		sigUsed = false;
		useSig = false;
		potionUsed = false;
		journal = [];
		ending = null;
		step = 0;
		phase = 'story';
		loadScene();
	}

	function newAdventureSameHero() {
		beginAdventure();
	}

	function newHero() {
		phase = 'setup';
		cls = null;
		stats = null;
		rerollHero();
	}

	function startCombat(foe: Foe, boss: boolean, title: string, text: string) {
		scene = {
			kind: 'combat',
			title,
			text,
			foe,
			foeHp: foe.hp,
			boss,
			log: [],
			done: null
		};
	}

	function loadScene() {
		outcome = null;
		useSig = false;
		if (!ctx) return;
		switch (step) {
			case 0:
				scene = {
					kind: 'story',
					title: 'The Call',
					text: `${fill(pick(HOOK_SCENES))} ${fill(ctx.goal)}`
				};
				break;
			case 1: {
				const ch = fillChallenge(pick(ROAD_EVENTS));
				scene = {
					kind: 'challenge',
					title: `On the Road: ${ch.title}`,
					text: ch.text,
					ch,
					dc: 11 + d(4)
				};
				break;
			}
			case 2: {
				const ch = fillChallenge(pick(OBSTACLES));
				scene = {
					kind: 'challenge',
					title: `${ch.title}`,
					text: fill(`At last you reach {place}. ${ch.text}`),
					ch,
					dc: 12 + d(3)
				};
				break;
			}
			case 3: {
				const foe = pick(MONSTERS);
				startCombat(foe, false, `A Fight: ${foe.name}`, foe.intro);
				break;
			}
			case 4: {
				const ch = fillChallenge(pick(TWISTS));
				scene = {
					kind: 'challenge',
					title: `A Twist: ${ch.title}`,
					text: ch.text,
					ch,
					dc: 12 + d(4)
				};
				break;
			}
			case 5: {
				const heal = Math.min(maxHp - hp, d(8) + 2);
				hp += heal;
				const rest =
					heal > 0
						? `You catch your breath at the final door and recover ${heal} HP. `
						: 'You steel yourself at the final door. ';
				startCombat(ctx.bossFoe, true, `Showdown: ${ctx.villain}`, rest + ctx.bossFoe.intro);
				break;
			}
			default:
				finish(true);
		}
	}

	function recordAndAdvance(entry: JournalEntry) {
		journal.push(entry);
		step += 1;
		loadScene(); // past the last scene, loadScene() builds the victory ending
	}

	// ── Story scene ───────────────────────────────────────────────────────────────────────────
	function continueStory() {
		if (scene?.kind !== 'story') return;
		recordAndAdvance({ title: scene.title, text: scene.text, tone: 'neutral' });
	}

	// ── Challenge scene ───────────────────────────────────────────────────────────────────────
	function attempt(optionIdx: number) {
		if (!cls || !stats || scene?.kind !== 'challenge' || outcome) return;
		const opt = scene.ch.options[optionIdx];
		const first = d(20);
		const second = useSig && !sigUsed ? d(20) : null;
		const roll = second === null ? first : Math.max(first, second);
		if (second !== null) sigUsed = true;
		const prof = cls.proficient.includes(opt.ability) ? PROF : 0;
		const bonus = mod(stats[opt.ability]) + prof;
		const total = roll + bonus;
		const success = roll === 20 || (roll !== 1 && total >= scene.dc);
		const rollText =
			(second !== null
				? `${cls.signature.name}: rolled ${first} and ${second}, kept ${roll}. `
				: '') +
			`d20 ${roll} ${signed(bonus)} (${ABILITY_LABEL[opt.ability]}${prof ? ' + proficiency' : ''}) = ${total} vs DC ${scene.dc}.`;

		let body: string;
		let tone: Tone;
		if (success) {
			let extra = '';
			if (roll === 20) {
				const heal = Math.min(maxHp - hp, d(4));
				hp += heal;
				glory += 2;
				extra = ` ${pick(CHECK_CRIT)}${heal ? ` (+${heal} HP)` : ''}`;
			} else {
				glory += 1;
			}
			body = `Success! ${scene.ch.win}${extra}`;
			tone = 'good';
		} else {
			const dmg = d(6) + 2;
			const taken = Math.min(dmg, hp - 1);
			hp -= taken;
			const extra = roll === 1 ? ` ${pick(CHECK_FUMBLE)}` : '';
			body = `Failure. ${scene.ch.lose}${extra} (-${taken} HP${taken < dmg ? ', but you refuse to fall' : ''})`;
			tone = 'bad';
		}
		outcome = { text: `${rollText} ${body}`, tone };
	}

	function continueChallenge() {
		if (scene?.kind !== 'challenge' || !outcome) return;
		recordAndAdvance({ title: scene.title, text: outcome.text, tone: outcome.tone });
	}

	// ── Combat scene ──────────────────────────────────────────────────────────────────────────
	function heroAtkBonus() {
		return cls && stats ? PROF + mod(stats[cls.attackAbility]) : 0;
	}

	function foeTurn() {
		if (scene?.kind !== 'combat' || !cls) return;
		const foe = scene.foe;
		const roll = d(20);
		const hit = roll === 20 || (roll !== 1 && roll + foe.attack >= cls.ac);
		if (!hit) {
			scene.log.push(
				`${foe.name} attacks (${roll + foe.attack} vs AC ${cls.ac}). ${pick(FOE_MISS_LINES)}`
			);
			return;
		}
		let dmg = foe.dmg.b;
		const dice = foe.dmg.n * (roll === 20 ? 2 : 1);
		for (let i = 0; i < dice; i++) dmg += d(foe.dmg.d);
		hp = Math.max(0, hp - dmg);
		scene.log.push(
			`${foe.name} attacks (${roll + foe.attack} vs AC ${cls.ac}${roll === 20 ? ', CRIT' : ''}) for ${dmg} damage. ${pick(FOE_HIT_LINES)}`
		);
		if (hp <= 0) {
			// The combat panel vanishes on the Defeat screen, so keep the killing blow in the journal.
			journal.push({ title: scene.title, text: scene.log.slice(-3).join(' '), tone: 'bad' });
			finish(false);
		}
	}

	function afterHeroAction() {
		if (scene?.kind !== 'combat') return;
		if (scene.foeHp <= 0) {
			scene.done = 'won';
			glory += scene.boss ? 5 : 2;
			scene.log.push(`${scene.foe.name} ${scene.foe.defeat}`);
			return;
		}
		foeTurn();
	}

	function attackFoe(useSignature: boolean) {
		if (scene?.kind !== 'combat' || scene.done || !cls || !stats) return;
		const dmgMod = Math.max(0, mod(stats[cls.attackAbility]));
		if (useSignature) {
			if (sigUsed) return;
			sigUsed = true;
			let dmg = dmgMod;
			for (let i = 0; i < cls.sigDice; i++) dmg += d(cls.dmgDie);
			scene.foeHp -= dmg;
			scene.log.push(
				`${cls.signature.name}! ${heroName.trim() || 'You'} ${cls.signature.text}, dealing ${dmg} damage.`
			);
		} else {
			const roll = d(20);
			const total = roll + heroAtkBonus();
			const hit = roll === 20 || (roll !== 1 && total >= scene.foe.ac);
			if (hit) {
				let dmg = dmgMod;
				const dice = roll === 20 ? 2 : 1;
				for (let i = 0; i < dice; i++) dmg += d(cls.dmgDie);
				scene.foeHp -= dmg;
				scene.log.push(
					`You ${cls.attackVerb} ${scene.foe.name} (${total} vs AC ${scene.foe.ac}${roll === 20 ? ', CRIT' : ''}) for ${dmg} damage. ${pick(HIT_LINES)}`
				);
			} else {
				scene.log.push(
					`You ${cls.attackVerb} ${scene.foe.name} (${total} vs AC ${scene.foe.ac}). ${pick(MISS_LINES)}`
				);
			}
		}
		afterHeroAction();
	}

	function drinkPotion() {
		if (scene?.kind !== 'combat' || scene.done || potionUsed) return;
		potionUsed = true;
		const heal = Math.min(maxHp - hp, d(4) + d(4) + d(4) + 4);
		hp += heal;
		scene.log.push(
			`You gulp a suspiciously fizzy healing potion and recover ${heal} HP. It's a quick swig, so you keep your turn.`
		);
	}

	function flee() {
		if (scene?.kind !== 'combat' || scene.done || scene.boss || !stats) return;
		const roll = d(20);
		const total = roll + mod(stats.dex);
		if (roll !== 1 && (roll === 20 || total >= 12)) {
			scene.done = 'fled';
			scene.log.push(`DEX check ${total} vs DC 12. ${pick(FLEE_LINES)}`);
		} else {
			scene.log.push(`DEX check ${total} vs DC 12. You fail to get away.`);
			foeTurn();
		}
	}

	function continueCombat() {
		if (scene?.kind !== 'combat' || !scene.done) return;
		const won = scene.done === 'won';
		recordAndAdvance({
			title: scene.title,
			text: won
				? `${scene.foe.name} ${scene.foe.defeat}`
				: `You escaped from ${scene.foe.name}, battered but alive.`,
			tone: won ? 'good' : 'neutral'
		});
	}

	// ── Ending ────────────────────────────────────────────────────────────────────────────────
	function finish(won: boolean) {
		if (!ctx) return;
		const name = ctx.hero;
		let title: string;
		let treasure = '';
		let gold = 0;
		if (won) {
			const pool = glory >= 10 ? TITLES_LEGENDARY : glory >= 6 ? TITLES_SOLID : TITLES_SCRAPE;
			title = pick(pool);
			gold = (d(10) + 4) * 10 + glory * 5;
			treasure = fill(pick(TREASURES).replace('{gold}', String(gold)));
		} else {
			title = 'Fondly Remembered';
		}
		const fullTitle = title.startsWith('the ') ? `${name} ${title}` : `${name}, ${title}`;
		ending = {
			won,
			fullTitle,
			gold,
			treasure,
			epilogue: fill(pick(won ? EPILOGUES_VICTORY : EPILOGUES_DEFEAT))
		};
		phase = 'end';
	}

	// ── Auto-scroll as the story grows ────────────────────────────────────────────────────────
	let scrollEl = $state<HTMLDivElement | null>(null);
	$effect(() => {
		// Read everything that should trigger a scroll.
		void journal.length;
		void phase;
		void outcome;
		if (scene?.kind === 'combat') void scene.log.length;
		queueMicrotask(() => scrollEl?.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' }));
	});

	const toneClass: Record<Tone, string> = {
		good: 'border-green-800/60 bg-green-950/30 text-green-200',
		bad: 'border-red-800/60 bg-red-950/30 text-red-200',
		neutral: 'border-gray-700/60 bg-gray-800/50 text-gray-300'
	};

	const hpPct = $derived(maxHp > 0 ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0);
</script>

<!-- Backdrop -->
<div
	role="presentation"
	class="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm"
	onclick={(e) => e.target === e.currentTarget && onclose()}
></div>

<!-- Panel -->
<div
	role="dialog"
	aria-modal="true"
	aria-label="Mini adventure"
	tabindex="-1"
	use:focusTrap
	onkeydown={(e) => e.key === 'Escape' && onclose()}
	class="fixed top-[50%] left-[50%] z-[151] flex max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-2xl border border-amber-800/60 bg-gray-900 shadow-2xl"
>
	<div
		class="flex shrink-0 items-center justify-between border-b border-gray-700/60 bg-gradient-to-r from-amber-950/60 to-gray-900 px-6 py-4"
	>
		<div class="flex items-center gap-3">
			<i class="fa-duotone fa-light fa-dungeon text-2xl" aria-hidden="true"></i>
			<div>
				<h2 class="text-lg font-black tracking-wider text-amber-300 uppercase">Mini Adventure</h2>
				<p class="text-xs text-gray-500">A quick quest for the DM who deserves a night off.</p>
			</div>
		</div>
		<button
			onclick={onclose}
			aria-label="Close"
			class="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-white"
			><i class="fa-duotone fa-light fa-xmark" aria-hidden="true"></i></button
		>
	</div>

	<!-- Hero status bar -->
	{#if phase !== 'setup' && cls && stats && ctx}
		<div
			class="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b border-gray-800 bg-gray-950/60 px-6 py-2 text-xs"
		>
			<span class="font-bold text-amber-300">{ctx.hero}</span>
			<span class="text-gray-400">Level 3 {cls.name}</span>
			<span class="text-gray-400">AC {cls.ac}</span>
			<div class="flex min-w-32 flex-1 items-center gap-2">
				<div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
					<div
						class="h-full transition-all {hpPct > 50
							? 'bg-green-500'
							: hpPct > 25
								? 'bg-amber-500'
								: 'bg-red-500'}"
						style="width: {hpPct}%"
					></div>
				</div>
				<span class="font-mono text-gray-300 tabular-nums">{hp}/{maxHp}</span>
			</div>
			<span class="text-gray-500">Glory {glory}</span>
		</div>
	{/if}

	<div bind:this={scrollEl} class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
		{#if phase === 'setup'}
			<p class="text-sm text-gray-300">
				Pick a class. We'll roll up a level 3 hero, hand you a sword (or a spellbook), and send you
				off on a quest that takes about 5 to 10 minutes. Nobody here needs to prep a thing.
			</p>

			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
				{#each CLASSES as c (c.name)}
					<button
						onclick={() => chooseClass(c)}
						class="rounded-lg border px-3 py-2 text-left transition {cls?.name === c.name
							? 'border-amber-500 bg-amber-900/30'
							: 'border-gray-700 bg-gray-800/60 hover:border-amber-700'}"
					>
						<div class="text-sm font-bold text-amber-300">{c.name}</div>
						<div class="text-[11px] leading-snug text-gray-400">{c.blurb}</div>
					</button>
				{/each}
			</div>

			{#if cls && stats}
				<div class="flex flex-col gap-3 rounded-xl border border-gray-700 bg-gray-950/50 p-4">
					<div class="flex items-end gap-2">
						<label class="flex flex-1 flex-col gap-1 text-xs text-gray-400">
							Hero name
							<input
								bind:value={heroName}
								maxlength="40"
								class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-amber-500 focus:outline-none"
							/>
						</label>
						<button
							onclick={() => (heroName = randomName())}
							class="rounded border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:border-amber-600 hover:text-amber-300"
							title="Roll a new name"
						>
							Roll name
						</button>
					</div>

					<div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
						{#each ABILITIES as ab (ab)}
							<div
								class="rounded-lg border border-gray-700 bg-gray-800/60 py-1.5 text-center {cls.proficient.includes(
									ab
								)
									? 'border-amber-700/70'
									: ''}"
							>
								<div class="text-[10px] font-bold tracking-wider text-gray-500">
									{ABILITY_LABEL[ab]}
								</div>
								<div class="text-lg font-black text-white">{stats[ab]}</div>
								<div class="text-xs text-amber-300">{signed(mod(stats[ab]))}</div>
							</div>
						{/each}
					</div>

					<div class="grid grid-cols-1 gap-1 text-xs text-gray-400 sm:grid-cols-2">
						<div><span class="text-gray-500">HP</span> {maxHpPreview}</div>
						<div><span class="text-gray-500">AC</span> {cls.ac}</div>
						<div class="sm:col-span-2">
							<span class="text-gray-500">Signature move</span>
							<span class="font-semibold text-amber-300">{cls.signature.name}</span>, once per
							adventure (a mighty strike in battle, or advantage on any check)
						</div>
						<div class="sm:col-span-2">
							<span class="text-gray-500">Gear</span>
							{cls.gear.join('; ')}; a healing potion
						</div>
						<div class="sm:col-span-2">
							<span class="text-gray-500">Background</span>
							{background}
						</div>
						<div class="sm:col-span-2">
							<span class="text-gray-500">Quirk</span> Always {quirk}
						</div>
						<div class="sm:col-span-2"><span class="text-gray-500">In a pocket</span> {curio}</div>
					</div>

					<div class="flex flex-wrap justify-end gap-2">
						<button
							onclick={rerollHero}
							class="rounded border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-400 transition hover:text-white"
						>
							Reroll hero
						</button>
						<button
							onclick={beginAdventure}
							class="rounded border border-amber-600 bg-amber-900/40 px-5 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-900/70"
						>
							Begin the adventure
						</button>
					</div>
				</div>
			{/if}
		{:else}
			<!-- Journal of finished scenes -->
			{#each journal as entry, i (i)}
				<div class="rounded-lg border px-4 py-3 text-sm {toneClass[entry.tone]}">
					<div class="mb-0.5 text-[11px] font-bold tracking-wider uppercase opacity-70">
						{entry.title}
					</div>
					<div class="leading-relaxed">{entry.text}</div>
				</div>
			{/each}

			{#if phase === 'story' && scene}
				<div class="rounded-xl border border-amber-700/60 bg-gray-800/70 p-4">
					<div class="mb-1 text-xs font-bold tracking-wider text-amber-400 uppercase">
						Scene {step + 1} of {STEPS - 1}: {scene.title}
					</div>
					<p class="text-sm leading-relaxed text-gray-200">{scene.text}</p>

					{#if scene.kind === 'story'}
						<div class="mt-4 flex justify-end">
							<button
								onclick={continueStory}
								class="rounded border border-amber-600 bg-amber-900/40 px-5 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-900/70"
							>
								Set out
							</button>
						</div>
					{:else if scene.kind === 'challenge'}
						{#if outcome}
							<div class="mt-3 rounded-lg border px-4 py-3 text-sm {toneClass[outcome.tone]}">
								{outcome.text}
							</div>
							<div class="mt-4 flex justify-end">
								<button
									onclick={continueChallenge}
									class="rounded border border-amber-600 bg-amber-900/40 px-5 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-900/70"
								>
									Onward
								</button>
							</div>
						{:else}
							{#if cls && !sigUsed}
								<label class="mt-3 flex items-center gap-2 text-xs text-gray-300">
									<input type="checkbox" bind:checked={useSig} class="accent-amber-500" />
									Use <span class="font-semibold text-amber-300">{cls.signature.name}</span> for advantage
									on this roll (once per adventure)
								</label>
							{/if}
							<div class="mt-3 flex flex-col gap-2">
								{#each scene.ch.options as opt, i (i)}
									<button
										onclick={() => attempt(i)}
										class="flex items-center justify-between gap-3 rounded-lg border border-gray-700 bg-gray-900/70 px-4 py-2.5 text-left text-sm text-gray-200 transition hover:border-amber-600"
									>
										<span>{opt.label}</span>
										<span class="shrink-0 text-xs font-bold text-amber-400">
											{ABILITY_LABEL[opt.ability]}
											{#if cls && stats}
												{signed(
													mod(stats[opt.ability]) +
														(cls.proficient.includes(opt.ability) ? PROF : 0)
												)}
											{/if}
										</span>
									</button>
								{/each}
							</div>
							<p class="mt-2 text-[11px] text-gray-500">
								DC {scene.dc}. Failing hurts, but never fatally.
							</p>
						{/if}
					{:else if scene.kind === 'combat'}
						<div class="mt-3 flex items-center gap-3 text-xs text-gray-400">
							<span class="font-bold text-red-300">{scene.foe.name}</span>
							<span>AC {scene.foe.ac}</span>
							<div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
								<div
									class="h-full bg-red-500 transition-all"
									style="width: {Math.max(0, (scene.foeHp / scene.foe.hp) * 100)}%"
								></div>
							</div>
							<span class="font-mono tabular-nums">{Math.max(0, scene.foeHp)}/{scene.foe.hp}</span>
						</div>

						{#if scene.log.length}
							<ul class="mt-3 flex max-h-48 flex-col gap-1 overflow-y-auto text-xs text-gray-300">
								{#each scene.log as line, i (i)}
									<li class="rounded border border-gray-700/50 bg-gray-900/60 px-3 py-1.5">
										{line}
									</li>
								{/each}
							</ul>
						{/if}

						{#if scene.done}
							<div class="mt-4 flex justify-end">
								<button
									onclick={continueCombat}
									class="rounded border border-amber-600 bg-amber-900/40 px-5 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-900/70"
								>
									Onward
								</button>
							</div>
						{:else}
							<div class="mt-3 flex flex-wrap gap-2">
								<button
									onclick={() => attackFoe(false)}
									class="rounded border border-red-700 bg-red-900/40 px-4 py-2 text-sm font-bold text-red-200 transition hover:bg-red-900/70"
								>
									Attack ({signed(heroAtkBonus())})
								</button>
								{#if cls && !sigUsed}
									<button
										onclick={() => attackFoe(true)}
										class="rounded border border-amber-600 bg-amber-900/40 px-4 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-900/70"
									>
										{cls.signature.name}
									</button>
								{/if}
								{#if !potionUsed}
									<button
										onclick={drinkPotion}
										class="rounded border border-green-700 bg-green-900/30 px-4 py-2 text-sm font-semibold text-green-300 transition hover:bg-green-900/60"
									>
										Drink potion
									</button>
								{/if}
								{#if !scene.boss}
									<button
										onclick={flee}
										class="rounded border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-400 transition hover:text-white"
									>
										Flee
									</button>
								{/if}
							</div>
						{/if}
					{/if}
				</div>
			{/if}

			{#if phase === 'end' && ending}
				<div
					class="rounded-xl border p-5 {ending.won
						? 'border-amber-500/70 bg-amber-950/30'
						: 'border-red-800/70 bg-red-950/20'}"
				>
					<div
						class="text-xs font-bold tracking-wider uppercase {ending.won
							? 'text-amber-400'
							: 'text-red-400'}"
					>
						{ending.won ? 'Victory' : 'Defeat'}
					</div>
					<h3 class="mt-1 text-xl font-black text-white">{ending.fullTitle}</h3>
					{#if ending.won}
						<p class="mt-2 text-sm text-gray-200">
							You return with <span class="font-semibold text-amber-300">{ending.treasure}</span>.
						</p>
					{/if}
					<p class="mt-2 text-sm leading-relaxed text-gray-300">{ending.epilogue}</p>
					<p class="mt-3 text-xs text-gray-500">
						Final Glory: {glory} · HP left: {hp}/{maxHp}
					</p>
					<div class="mt-4 flex flex-wrap justify-end gap-2">
						<button
							onclick={newAdventureSameHero}
							class="rounded border border-amber-600 bg-amber-900/40 px-4 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-900/70"
						>
							Same hero, new quest
						</button>
						<button
							onclick={newHero}
							class="rounded border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:text-white"
						>
							New hero
						</button>
						<button
							onclick={onclose}
							class="rounded border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-400 transition hover:text-white"
						>
							Back to the real work
						</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
