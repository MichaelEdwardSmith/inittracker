<!-- "Email DMs" modal on /admin — compose a branded broadcast email to every DM who hasn't
     unsubscribed. Test sends the exact same template to dm@inittracker.com only, so the admin
     can see it before blasting everyone. Fully self-contained: handles its own POST results
     via use:enhance callbacks rather than the page's shared `form` prop, so reopening the modal
     never replays a stale previous result. -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { SentEmailEntry } from '$lib/server/dmModel';

	interface Props {
		recipientCount: number;
		sentEmails: SentEmailEntry[];
		onclose: () => void;
	}

	let { recipientCount, sentEmails, onclose }: Props = $props();

	let subject = $state('');
	let body = $state('');
	let textareaEl: HTMLTextAreaElement | undefined = $state();
	let testing = $state(false);
	let sending = $state(false);
	let testJustSent = $state(false);
	let emailError = $state('');
	let broadcastResult = $state<{ sent: number; failed: number } | null>(null);
	let activeTab = $state<'write' | 'preview' | 'history'>('write');
	let previewHtml = $state('');
	let loadingPreview = $state(false);
	// Seeded once from the page's loaded data; new sends are prepended locally (optimistic —
	// the actual persistence already happened server-side in logSentEmail()) so History reflects
	// this session's activity without needing a full page reload.
	let history = $state<SentEmailEntry[]>(sentEmails);

	function formatSentAt(d: string | Date): string {
		return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
	}

	/** Loads a past email back into the composer for editing/resending. */
	function recall(entry: SentEmailEntry) {
		subject = entry.subject;
		body = entry.body;
		activeTab = 'write';
	}

	// --- Markdown toolbar --------------------------------------------------
	// Every helper edits `body` directly, then restores focus/selection on the textarea after
	// Svelte re-renders (tick()) so the cursor lands somewhere useful instead of jumping to the
	// end of the field.

	/** Wraps the current selection in prefix/suffix (e.g. **bold**), or inserts a placeholder
	 *  with nothing selected, leaving that placeholder selected so typing replaces it. */
	function wrapSelection(prefix: string, suffix: string, placeholder: string) {
		const el = textareaEl;
		if (!el) return;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		const hasSelection = start !== end;
		const selected = hasSelection ? body.slice(start, end) : placeholder;
		body = body.slice(0, start) + prefix + selected + suffix + body.slice(end);
		const selStart = start + prefix.length;
		const selEnd = selStart + selected.length;
		tick().then(() => {
			el.focus();
			el.setSelectionRange(selStart, selEnd);
		});
	}

	/** Prefixes every line touched by the current selection (e.g. "- " for a bullet list). Works
	 *  on a single line too when nothing is selected. */
	function prefixLines(prefix: string) {
		const el = textareaEl;
		if (!el) return;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		const lineStart = body.lastIndexOf('\n', start - 1) + 1;
		const nextBreak = body.indexOf('\n', end);
		const lineEnd = nextBreak === -1 ? body.length : nextBreak;
		const block = body.slice(lineStart, lineEnd);
		const prefixed = block
			.split('\n')
			.map((line) => prefix + line)
			.join('\n');
		body = body.slice(0, lineStart) + prefixed + body.slice(lineEnd);
		const delta = prefixed.length - block.length;
		tick().then(() => {
			el.focus();
			el.setSelectionRange(start + prefix.length, end + delta);
		});
	}

	/** Inserts a link or image, selecting the URL placeholder so pasting a real one is one step. */
	function insertLinkOrImage(isImage: boolean) {
		const el = textareaEl;
		if (!el) return;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		const selected = body.slice(start, end);
		const label = selected || (isImage ? 'alt text' : 'link text');
		const bang = isImage ? '!' : '';
		const url = 'https://';
		const inserted = `${bang}[${label}](${url})`;
		body = body.slice(0, start) + inserted + body.slice(end);
		const urlStart = start + bang.length + label.length + 3; // past "[label]("
		tick().then(() => {
			el.focus();
			el.setSelectionRange(urlStart, urlStart + url.length);
		});
	}

	const toolbarButtons = [
		{ icon: 'fa-heading', title: 'Heading', action: () => prefixLines('## ') },
		{ icon: 'fa-bold', title: 'Bold', action: () => wrapSelection('**', '**', 'bold text') },
		{ icon: 'fa-italic', title: 'Italic', action: () => wrapSelection('*', '*', 'italic text') },
		{ icon: 'fa-quote-left', title: 'Quote', action: () => prefixLines('> ') },
		{ icon: 'fa-list-ul', title: 'Bullet list', action: () => prefixLines('- ') },
		{ icon: 'fa-list-ol', title: 'Numbered list', action: () => prefixLines('1. ') },
		{ icon: 'fa-link', title: 'Link', action: () => insertLinkOrImage(false) },
		{ icon: 'fa-image', title: 'Image', action: () => insertLinkOrImage(true) }
	];

	const handlePreview: SubmitFunction = () => {
		loadingPreview = true;
		return async ({ result }) => {
			loadingPreview = false;
			if (result.type === 'success') {
				previewHtml = (result.data?.previewHtml as string) ?? '';
				activeTab = 'preview';
			} else {
				emailError = 'Could not render preview.';
			}
		};
	};

	const handleTest: SubmitFunction = () => {
		emailError = '';
		testing = true;
		return async ({ result }) => {
			testing = false;
			if (result.type === 'failure') {
				emailError = (result.data?.emailError as string) ?? 'Failed to send test email.';
			} else if (result.type === 'success') {
				testJustSent = true;
				setTimeout(() => (testJustSent = false), 4000);
				const logged = result.data?.loggedEmail as SentEmailEntry | undefined;
				if (logged) history = [logged, ...history];
			}
		};
	};

	const handleSend: SubmitFunction = ({ cancel }) => {
		if (
			!confirm(
				`Send this email to ${recipientCount} Dungeon Master${recipientCount === 1 ? '' : 's'}? This can't be undone.`
			)
		) {
			cancel();
			return;
		}
		emailError = '';
		sending = true;
		return async ({ result }) => {
			sending = false;
			if (result.type === 'failure') {
				emailError = (result.data?.emailError as string) ?? 'Failed to send.';
			} else if (result.type === 'success') {
				const sent = (result.data?.broadcastSent as number) ?? 0;
				const failed = (result.data?.broadcastFailed as number) ?? 0;
				broadcastResult = { sent, failed };
				const logged = result.data?.loggedEmail as SentEmailEntry | undefined;
				if (logged) history = [logged, ...history];
				setTimeout(() => onclose(), 2500);
			}
		};
	};
</script>

<div
	class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
>
	<div class="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
		<div class="flex items-center justify-between border-b border-gray-800 px-5 py-4">
			<h2 class="text-sm font-bold tracking-widest text-gray-200 uppercase">
				<i class="fa-duotone fa-light fa-envelope" aria-hidden="true"></i> Email Dungeon Masters
			</h2>
			<button
				onclick={onclose}
				aria-label="Close"
				class="text-gray-600 transition hover:text-gray-300"
			>
				<i class="fa-duotone fa-light fa-xmark text-lg" aria-hidden="true"></i>
			</button>
		</div>

		{#if broadcastResult}
			<div class="flex flex-col items-center gap-3 px-5 py-10 text-center">
				<i class="fa-duotone fa-light fa-paper-plane text-3xl text-emerald-400" aria-hidden="true"
				></i>
				<p class="text-sm font-semibold text-emerald-400">
					Sent to {broadcastResult.sent} Dungeon Master{broadcastResult.sent === 1 ? '' : 's'}.
				</p>
				{#if broadcastResult.failed}
					<p class="text-xs text-red-400">{broadcastResult.failed} failed to send.</p>
				{/if}
			</div>
		{:else}
			<div class="flex flex-col gap-4 px-5 py-5">
				<p class="text-xs text-gray-500">
					Sends to <span class="text-gray-300">{recipientCount}</span> Dungeon Master{recipientCount ===
					1
						? ''
						: 's'} who haven't unsubscribed. Automatically wrapped in the Initiative Tracker branded template
					with an unsubscribe link.
				</p>

				<div class="flex flex-col gap-1.5">
					<label
						for="email-subject"
						class="text-xs font-semibold tracking-wider text-gray-500 uppercase"
					>
						Subject
					</label>
					<input
						id="email-subject"
						bind:value={subject}
						type="text"
						placeholder="What's new in Initiative Tracker"
						class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-amber-500 focus:outline-none"
					/>
				</div>
				<div class="flex flex-col gap-1.5">
					<div class="flex items-center justify-between">
						<label
							for="email-body"
							class="text-xs font-semibold tracking-wider text-gray-500 uppercase"
						>
							Message Body
						</label>
						<div class="flex overflow-hidden rounded border border-gray-700 text-xs">
							<button
								type="button"
								onclick={() => (activeTab = 'write')}
								class="px-2.5 py-1 transition {activeTab === 'write'
									? 'bg-amber-900/40 text-amber-300'
									: 'bg-gray-800 text-gray-400 hover:text-gray-200'}"
							>
								Write
							</button>
							<form method="POST" action="/admin?/previewEmail" use:enhance={handlePreview}>
								<input type="hidden" name="subject" value={subject} />
								<input type="hidden" name="body" value={body} />
								<button
									type="submit"
									disabled={!body.trim() || loadingPreview}
									class="px-2.5 py-1 transition disabled:cursor-not-allowed disabled:opacity-40 {activeTab ===
									'preview'
										? 'bg-amber-900/40 text-amber-300'
										: 'bg-gray-800 text-gray-400 hover:text-gray-200'}"
								>
									{loadingPreview ? 'Loading…' : 'Preview'}
								</button>
							</form>
							<button
								type="button"
								onclick={() => (activeTab = 'history')}
								class="px-2.5 py-1 transition {activeTab === 'history'
									? 'bg-amber-900/40 text-amber-300'
									: 'bg-gray-800 text-gray-400 hover:text-gray-200'}"
							>
								History{#if history.length}
									({history.length}){/if}
							</button>
						</div>
					</div>

					{#if activeTab === 'write'}
						<div
							class="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-gray-700 bg-gray-800/80 px-1.5 py-1"
						>
							{#each toolbarButtons as btn, i (btn.title)}
								{#if i === 3 || i === 6}
									<span class="mx-1 h-4 w-px bg-gray-700"></span>
								{/if}
								<button
									type="button"
									title={btn.title}
									aria-label={btn.title}
									onclick={btn.action}
									class="rounded px-2 py-1 text-gray-400 transition hover:bg-gray-700 hover:text-amber-300"
								>
									<i class="fa-duotone fa-light {btn.icon} text-xs" aria-hidden="true"></i>
								</button>
							{/each}
						</div>
						<textarea
							id="email-body"
							bind:value={body}
							bind:this={textareaEl}
							rows="8"
							placeholder="Type your message, or use the buttons above to format it…"
							class="resize-none rounded-t-none rounded-b-lg border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-sm text-gray-200 placeholder-gray-600 focus:border-amber-500 focus:outline-none"
						></textarea>
						<p class="text-[11px] text-gray-600">
							Markdown supported — select text and click a button, or type it yourself:
							<code class="text-gray-500">**bold**</code>,
							<code class="text-gray-500">*italic*</code>,
							<code class="text-gray-500"># heading</code>,
							<code class="text-gray-500">- list</code>,
							<code class="text-gray-500">[link](url)</code>,
							<code class="text-gray-500">![image](url)</code>.
						</p>
					{:else if activeTab === 'preview'}
						<iframe
							srcdoc={previewHtml}
							title="Email preview"
							sandbox=""
							class="h-[360px] w-full rounded-lg border border-gray-700 bg-[#0a0a0f]"
						></iframe>
					{:else}
						<div
							class="h-[360px] overflow-y-auto rounded-lg border border-gray-700 bg-gray-800/40 p-2"
						>
							{#if history.length === 0}
								<p
									class="flex h-full items-center justify-center text-center text-xs text-gray-600"
								>
									No emails sent yet — anything you Test or Send shows up here.
								</p>
							{:else}
								<ul class="flex flex-col gap-1.5">
									{#each history as entry (entry.id)}
										<li class="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2">
											<div class="flex items-start justify-between gap-2">
												<div class="min-w-0">
													<p class="truncate text-sm font-semibold text-gray-200">
														{entry.subject}
													</p>
													<p class="mt-0.5 text-[11px] text-gray-500">
														{formatSentAt(entry.sentAt)} ·
														{#if entry.isTest}
															Test
														{:else}
															{entry.recipientCount} recipient{entry.recipientCount === 1
																? ''
																: 's'}
															{#if entry.failedCount}
																· {entry.failedCount} failed
															{/if}
														{/if}
													</p>
												</div>
												<button
													type="button"
													onclick={() => recall(entry)}
													class="shrink-0 rounded border border-gray-600 bg-gray-800 px-2 py-1 text-[11px] text-gray-300 transition hover:border-amber-500 hover:text-amber-300"
												>
													Use
												</button>
											</div>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/if}
				</div>

				{#if emailError}
					<p class="text-xs text-red-400">{emailError}</p>
				{/if}
				{#if testJustSent}
					<p class="text-xs text-emerald-400">
						<i class="fa-duotone fa-light fa-check" aria-hidden="true"></i> Test sent to dm@inittracker.com
						— check that inbox.
					</p>
				{/if}

				<div class="flex items-center justify-end gap-2 pt-1">
					<form method="POST" action="/admin?/sendTestEmail" use:enhance={handleTest}>
						<input type="hidden" name="subject" value={subject} />
						<input type="hidden" name="body" value={body} />
						<button
							type="submit"
							disabled={!subject.trim() || !body.trim() || testing}
							class="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-sm font-bold text-gray-300 transition hover:border-amber-500 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
						>
							{testing ? 'Sending…' : 'Test'}
						</button>
					</form>
					<form method="POST" action="/admin?/sendBroadcast" use:enhance={handleSend}>
						<input type="hidden" name="subject" value={subject} />
						<input type="hidden" name="body" value={body} />
						<button
							type="submit"
							disabled={!subject.trim() || !body.trim() || sending}
							class="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
						>
							{sending ? 'Sending…' : `Send to ${recipientCount}`}
						</button>
					</form>
				</div>
			</div>
		{/if}
	</div>
</div>
