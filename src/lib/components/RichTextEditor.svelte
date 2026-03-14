<!-- WYSIWYG rich-text editor built on contenteditable + execCommand.
     Supports bold, italic, underline, unordered lists, and text color via a toolbar.
     Stores/emits content as browser-produced HTML. -->
<script lang="ts">
	interface Props {
		value: string;
		onchange: (v: string) => void;
		placeholder?: string;
	}

	let { value, onchange, placeholder = 'Start typing…' }: Props = $props();

	let editorEl: HTMLDivElement | undefined = $state();
	let showColorPicker = $state(false);

	// Track the last value we pushed into the DOM so the effect doesn't reset
	// the cursor while the user is typing.
	let lastPushedValue = '';

	$effect(() => {
		if (editorEl && value !== lastPushedValue) {
			editorEl.innerHTML = value;
			lastPushedValue = value;
		}
	});

	function handleInput() {
		if (!editorEl) return;
		lastPushedValue = editorEl.innerHTML;
		onchange(editorEl.innerHTML);
	}

	function execCmd(cmd: string, arg?: string) {
		document.execCommand(cmd, false, arg);
		editorEl?.focus();
		handleInput();
	}

	function applyColor(color: string) {
		showColorPicker = false;
		execCmd('foreColor', color);
	}

	function isActive(cmd: string): boolean {
		try {
			return document.queryCommandState(cmd);
		} catch {
			return false;
		}
	}

	// Re-render toolbar active states on selection change
	let boldActive = $state(false);
	let italicActive = $state(false);
	let underlineActive = $state(false);
	let listActive = $state(false);

	function updateToolbarState() {
		boldActive = isActive('bold');
		italicActive = isActive('italic');
		underlineActive = isActive('underline');
		listActive = isActive('insertUnorderedList');
	}

	const COLORS = [
		{ hex: '#e5e7eb', label: 'White' },
		{ hex: '#f87171', label: 'Red' },
		{ hex: '#fb923c', label: 'Orange' },
		{ hex: '#fbbf24', label: 'Amber' },
		{ hex: '#4ade80', label: 'Green' },
		{ hex: '#60a5fa', label: 'Blue' },
		{ hex: '#c084fc', label: 'Purple' },
		{ hex: '#f472b6', label: 'Pink' },
		{ hex: '#6b7280', label: 'Gray' }
	];
</script>

<svelte:document onselectionchange={updateToolbarState} />

<div class="flex h-full w-full flex-col overflow-hidden rounded border border-gray-700 bg-gray-800">
	<!-- Toolbar -->
	<div class="flex shrink-0 items-center gap-1 border-b border-gray-700 bg-gray-900/60 px-2 py-1.5">
		<button
			type="button"
			onmousedown={(e) => e.preventDefault()}
			onclick={() => execCmd('bold')}
			class="rounded px-2 py-1 text-xs font-bold transition
			       {boldActive
				? 'bg-amber-600/30 text-amber-300'
				: 'text-gray-400 hover:bg-gray-700 hover:text-white'}"
			title="Bold (Ctrl+B)"
			aria-label="Bold">B</button
		>
		<button
			type="button"
			onmousedown={(e) => e.preventDefault()}
			onclick={() => execCmd('italic')}
			class="rounded px-2 py-1 text-xs font-semibold italic transition
			       {italicActive
				? 'bg-amber-600/30 text-amber-300'
				: 'text-gray-400 hover:bg-gray-700 hover:text-white'}"
			title="Italic (Ctrl+I)"
			aria-label="Italic">I</button
		>
		<button
			type="button"
			onmousedown={(e) => e.preventDefault()}
			onclick={() => execCmd('underline')}
			class="rounded px-2 py-1 text-xs font-semibold underline transition
			       {underlineActive
				? 'bg-amber-600/30 text-amber-300'
				: 'text-gray-400 hover:bg-gray-700 hover:text-white'}"
			title="Underline (Ctrl+U)"
			aria-label="Underline">U</button
		>
		<div class="mx-1 h-4 w-px bg-gray-700"></div>
		<button
			type="button"
			onmousedown={(e) => e.preventDefault()}
			onclick={() => execCmd('insertUnorderedList')}
			class="rounded px-2 py-1 text-xs font-semibold transition
			       {listActive
				? 'bg-amber-600/30 text-amber-300'
				: 'text-gray-400 hover:bg-gray-700 hover:text-white'}"
			title="Bullet list"
			aria-label="Bullet list">• List</button
		>
		<div class="mx-1 h-4 w-px bg-gray-700"></div>
		<!-- Color picker -->
		<div class="relative">
			<button
				type="button"
				onmousedown={(e) => e.preventDefault()}
				onclick={() => (showColorPicker = !showColorPicker)}
				class="rounded px-2 py-1 text-xs font-bold transition
				       {showColorPicker
					? 'bg-amber-600/30 text-amber-300'
					: 'text-gray-400 hover:bg-gray-700 hover:text-white'}"
				title="Text color"
				aria-label="Text color">A</button
			>
			{#if showColorPicker}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="absolute top-full left-0 z-20 mt-1 flex gap-1 rounded border border-gray-600 bg-gray-900 p-1.5 shadow-xl"
					onmousedown={(e) => e.preventDefault()}
				>
					{#each COLORS as color}
						<button
							type="button"
							onclick={() => applyColor(color.hex)}
							title={color.label}
							aria-label={color.label}
							class="h-5 w-5 rounded-full border border-gray-600 transition hover:scale-125 hover:border-white"
							style="background-color: {color.hex}"
						></button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Editable area -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={editorEl}
		contenteditable="true"
		oninput={handleInput}
		data-placeholder={placeholder}
		class="editor-area min-h-0 flex-1 overflow-y-auto px-3 py-2 text-sm text-gray-200 focus:outline-none"
	></div>
</div>

<style>
	.editor-area:empty:before {
		content: attr(data-placeholder);
		color: #6b7280;
		pointer-events: none;
	}

	/* Style browser-generated list markup */
	.editor-area :global(ul) {
		list-style-type: disc;
		padding-left: 1.5rem;
		margin: 0.25rem 0;
	}
	.editor-area :global(li) {
		margin: 0.1rem 0;
	}
</style>
