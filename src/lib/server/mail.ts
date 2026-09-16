// Transactional email via Postmark. Used for password reset and email verification links.
// Requires POSTMARK_SERVER_TOKEN + EMAIL_FROM in environment; sendMail() is a no-op (logs to
// console instead) when unconfigured, so local dev works without a Postmark account.
//
// EMAIL_FROM must be an address on a domain verified in Postmark (Sender Signature or full
// Domain verification with SPF/DKIM records) — see Postmark's "Sending Domains" setup.
import * as postmark from 'postmark';
import { Marked, type RendererObject, type RendererThis } from 'marked';
import { env } from '$env/dynamic/private';
import { OAUTH_REDIRECT_BASE } from '$env/static/private';

const client = env.POSTMARK_SERVER_TOKEN
	? new postmark.ServerClient(env.POSTMARK_SERVER_TOKEN)
	: null;

/** Base URL for links embedded in emails — reuses OAUTH_REDIRECT_BASE since it's already the
 *  one "public app URL" env var this project defines (see oauth.ts). */
export function appBaseUrl(): string {
	return OAUTH_REDIRECT_BASE || 'http://localhost:5173';
}

interface MailMessage {
	to: string;
	subject: string;
	html: string;
	text: string;
	/** Postmark tag — groups messages in the Activity view (e.g. 'password-reset'). */
	tag: string;
}

/** True if Postmark is configured to actually send (token + from address both present). Callers
 *  that need to fail fast with a clear reason — rather than attempt N sends that are each
 *  guaranteed to no-op — should check this before calling sendMail in a loop. */
export function isMailConfigured(): boolean {
	return !!client && !!env.EMAIL_FROM;
}

/** Fire-and-forget-safe: never throws, so a rejected send never blocks the request that
 *  triggered it (a reset/verify flow must not fail loudly just because Postmark is down — the
 *  token still exists and the user can ask again). Returns whether the send actually succeeded
 *  so callers that need to know (e.g. the admin broadcast composer) can surface a real failure
 *  instead of assuming success just because sendMail didn't throw. */
export async function sendMail(msg: MailMessage): Promise<boolean> {
	if (!client) {
		console.warn(
			`[mail] POSTMARK_SERVER_TOKEN not set — would have sent "${msg.subject}" to ${msg.to}`
		);
		return false;
	}
	const from = env.EMAIL_FROM;
	if (!from) {
		console.warn('[mail] EMAIL_FROM not set — cannot send mail');
		return false;
	}
	try {
		await client.sendEmail({
			From: from,
			To: msg.to,
			Subject: msg.subject,
			HtmlBody: msg.html,
			TextBody: msg.text,
			MessageStream: 'outbound',
			Tag: msg.tag
		});
		return true;
	} catch (err) {
		console.error(`[mail] Failed to send "${msg.subject}" to ${msg.to}:`, err);
		return false;
	}
}

// ---------------------------------------------------------------------------
// Templates — plain functions, no template engine. Keep these short; anything
// elaborate belongs in a real design pass, not inline HTML strings.
// ---------------------------------------------------------------------------

function wrapper(title: string, bodyHtml: string): string {
	return `<!doctype html>
<html>
<body style="margin:0;padding:32px 16px;background:#0a0a0f;font-family:-apple-system,Segoe UI,sans-serif;color:#e5e5e5;">
	<table role="presentation" width="100%" style="max-width:480px;margin:0 auto;">
		<tr><td style="padding-bottom:24px;text-align:center;">
			<span style="font-size:12px;font-weight:800;letter-spacing:0.25em;text-transform:uppercase;color:#f59e0b;">Initiative Tracker</span>
		</td></tr>
		<tr><td style="background:#18181f;border:1px solid #2a2a35;border-radius:12px;padding:32px 28px;">
			<h1 style="margin:0 0 16px;font-size:18px;color:#fff;">${title}</h1>
			${bodyHtml}
		</td></tr>
		<tr><td style="padding-top:20px;text-align:center;font-size:11px;color:#555;">
			If you didn't request this, you can safely ignore this email.
		</td></tr>
	</table>
</body>
</html>`;
}

function button(href: string, label: string): string {
	return `<a href="${href}" style="display:inline-block;margin:8px 0 4px;padding:12px 24px;background:#d97706;color:#0a0a0f;font-weight:800;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;text-decoration:none;border-radius:8px;">${label}</a>`;
}

const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
};

/** Escapes user-authored text (session names, slot labels) before it's interpolated into a
 *  hand-built HTML email string — unlike Svelte templates, these get no automatic escaping. */
function escapeHtml(s: string): string {
	return s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/** Formats an ISO instant for email display in a specific IANA time zone. Emails are rendered
 *  once on the server, so — unlike the in-app UI, where the viewer's own browser formats dates
 *  in their local zone automatically — there's no viewer browser to defer to here. The DM's zone
 *  (captured when they propose times, see SchedulingProposal.timeZone) is used instead, so the
 *  email shows the same wall-clock time the DM intended regardless of where the mail server runs. */
function formatDateTime(iso: string, timeZone: string): string {
	return new Date(iso).toLocaleString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		timeZone
	});
}

export function passwordResetEmail(link: string): { subject: string; html: string; text: string } {
	const subject = 'Reset your Initiative Tracker password';
	const html = wrapper(
		'Reset your password',
		`<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#c5c5c5;">
			We received a request to reset your password. This link expires in 30 minutes.
		</p>
		${button(link, 'Reset password')}
		<p style="margin:20px 0 0;font-size:12px;color:#777;word-break:break-all;">${link}</p>`
	);
	const text = `Reset your Initiative Tracker password: ${link}\n\nThis link expires in 30 minutes. If you didn't request this, ignore this email.`;
	return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Markdown → email-safe HTML for the admin broadcast composer. Email clients don't load
// external stylesheets, so every element needs its own inline style — this overrides marked's
// default renderer methods to emit the branded dark theme inline instead of bare tags.
//
// Must be a plain object with regular (non-arrow) methods, not a class instance: marked's
// `.use()`/constructor merging walks the renderer's own enumerable properties to combine it
// with the defaults, and class methods live on the prototype — an instance was silently
// ignored (fell through to unstyled default tags) until this was switched to an object literal.
// `this.parser` inside each method is wired up by marked itself at render time.
//
// The admin is the only person who ever writes this Markdown (it isn't user input from anyone
// else), so raw HTML passthrough and unescaped injection aren't a concern here the way they
// would be for untrusted content.
// ---------------------------------------------------------------------------
const emailRenderer: RendererObject = {
	heading(this: RendererThis, { tokens, depth }) {
		const size = depth <= 2 ? 20 : depth === 3 ? 17 : 15;
		return `<h${depth} style="margin:24px 0 12px;font-size:${size}px;font-weight:800;color:#fff;">${this.parser.parseInline(tokens)}</h${depth}>\n`;
	},
	paragraph(this: RendererThis, { tokens }) {
		return `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#c5c5c5;">${this.parser.parseInline(tokens)}</p>\n`;
	},
	strong(this: RendererThis, { tokens }) {
		return `<strong style="color:#fff;">${this.parser.parseInline(tokens)}</strong>`;
	},
	em(this: RendererThis, { tokens }) {
		return `<em>${this.parser.parseInline(tokens)}</em>`;
	},
	codespan({ text }) {
		return `<code style="background:#000;padding:2px 5px;border-radius:4px;font-size:12.5px;color:#f59e0b;">${text}</code>`;
	},
	code({ text }) {
		return `<pre style="background:#000;border-radius:8px;padding:12px 14px;overflow-x:auto;font-size:12.5px;color:#e5e5e5;margin:0 0 14px;"><code>${text}</code></pre>\n`;
	},
	blockquote(this: RendererThis, { tokens }) {
		return `<blockquote style="margin:0 0 14px;padding:2px 0 2px 14px;border-left:3px solid #d97706;color:#999;">${this.parser.parse(tokens)}</blockquote>\n`;
	},
	link(this: RendererThis, { href, title, tokens }) {
		const titleAttr = title ? ` title="${title}"` : '';
		return `<a href="${href}"${titleAttr} style="color:#f59e0b;text-decoration:underline;">${this.parser.parseInline(tokens)}</a>`;
	},
	image({ href, title, text }) {
		const titleAttr = title ? ` title="${title}"` : '';
		return `<img src="${href}" alt="${text ?? ''}"${titleAttr} style="max-width:100%;border-radius:8px;margin:8px 0 14px;display:block;" />`;
	},
	list(this: RendererThis, token) {
		const tag = token.ordered ? 'ol' : 'ul';
		const items = token.items.map((item) => this.parser.renderer.listitem(item)).join('');
		const startAttr = token.ordered && token.start !== 1 ? ` start="${token.start}"` : '';
		return `<${tag}${startAttr} style="margin:0 0 14px;padding-left:22px;color:#c5c5c5;font-size:14px;line-height:1.6;">\n${items}</${tag}>\n`;
	},
	listitem(this: RendererThis, item) {
		return `<li style="margin:0 0 4px;">${this.parser.parse(item.tokens)}</li>\n`;
	},
	hr() {
		return `<hr style="border:none;border-top:1px solid #2a2a35;margin:20px 0;" />\n`;
	}
};

const markdownToEmailHtml = new Marked({ renderer: emailRenderer });

/** Admin → DMs broadcast email (the "Email DMs" button on /admin). `body` is Markdown typed
 *  into the composer — rendered to inline-styled HTML matching the branded theme, so the admin
 *  can format text and include images (`![alt](url)`). Always carries an unsubscribe link,
 *  since this is the one email type in the app that isn't triggered by the recipient's own
 *  action. */
export function adminBroadcastEmail(
	subject: string,
	body: string,
	unsubscribeLink: string
): { subject: string; html: string; text: string } {
	const bodyHtml = markdownToEmailHtml.parse(body, { async: false }) as string;
	const html = wrapper(
		subject,
		`${bodyHtml}
		<p style="margin:28px 0 0;padding-top:16px;border-top:1px solid #2a2a35;font-size:11px;color:#666;">
			You're receiving this because you have a Dungeon Master account on Initiative Tracker.
			<a href="${unsubscribeLink}" style="color:#888;">Unsubscribe from these emails</a>.
		</p>`
	);
	// Plain-text fallback keeps the raw Markdown source — readable enough for a text-only client,
	// and consistent with how most Markdown-authored emails degrade.
	const text = `${body}\n\n---\nYou're receiving this because you have a Dungeon Master account on Initiative Tracker.\nUnsubscribe: ${unsubscribeLink}`;
	return { subject, html, text };
}

export function verifyEmailEmail(link: string): { subject: string; html: string; text: string } {
	const subject = 'Verify your Initiative Tracker email';
	const html = wrapper(
		'Verify your email',
		`<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#c5c5c5;">
			Confirm this is your email address to finish setting up your account.
		</p>
		${button(link, 'Verify email')}
		<p style="margin:20px 0 0;font-size:12px;color:#777;word-break:break-all;">${link}</p>`
	);
	const text = `Verify your Initiative Tracker email: ${link}`;
	return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Scheduling emails — DM proposes/confirms candidate session times (see
// src/lib/server/schedulingModel.ts and /api/scheduling). All three link back to the player's
// display page; PlayerSchedulingView.svelte there pops the Session Times card open on its own
// once it polls and finds an active proposal, for any player already logged in — no query param
// needed to trigger it.
// ---------------------------------------------------------------------------

export function schedulingProposedEmail(
	sessionName: string,
	slots: { start: string; label?: string }[],
	timeZone: string,
	link: string
): { subject: string; html: string; text: string } {
	const subject = `New session times proposed for ${sessionName}`;
	const listItem = (s: { start: string; label?: string }) => {
		const when = formatDateTime(s.start, timeZone);
		return `${when}${s.label ? ` — ${escapeHtml(s.label)}` : ''}`;
	};
	const htmlRows = slots.map((s) => `<li style="margin:0 0 6px;">${listItem(s)}</li>`).join('');
	const textRows = slots.map((s) => `- ${listItem(s)}`).join('\n');

	const html = wrapper(
		'New session times proposed',
		`<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#c5c5c5;">
			Your DM proposed the following candidate times for the next
			<strong style="color:#fff;">${escapeHtml(sessionName)}</strong> session. Mark your
			availability for each one:
		</p>
		<ul style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.6;color:#e5e5e5;">${htmlRows}</ul>
		${button(link, 'Respond Now')}
		<p style="margin:20px 0 0;font-size:12px;color:#777;word-break:break-all;">${link}</p>`
	);
	const text = `Your DM proposed the following candidate times for the next ${sessionName} session:\n\n${textRows}\n\nRespond: ${link}`;
	return { subject, html, text };
}

export function schedulingConfirmedEmail(
	sessionName: string,
	confirmedStart: string,
	timeZone: string,
	link: string
): { subject: string; html: string; text: string } {
	const when = formatDateTime(confirmedStart, timeZone);
	const subject = `${sessionName} confirmed for ${when}`;
	const html = wrapper(
		'Session time confirmed',
		`<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#c5c5c5;">
			Your next <strong style="color:#fff;">${escapeHtml(sessionName)}</strong> session is locked
			in for:
		</p>
		<p style="margin:0 0 20px;font-size:19px;font-weight:800;color:#34d399;text-align:center;">${when}</p>
		${button(link, 'View Details')}
		<p style="margin:20px 0 0;font-size:12px;color:#777;word-break:break-all;">${link}</p>`
	);
	const text = `Your next ${sessionName} session is confirmed for ${when}.\n\nDetails: ${link}`;
	return { subject, html, text };
}

export function schedulingReminderEmail(
	sessionName: string,
	confirmedStart: string,
	timeZone: string,
	link: string
): { subject: string; html: string; text: string } {
	const when = formatDateTime(confirmedStart, timeZone);
	const subject = `Reminder: ${sessionName} starts tomorrow`;
	const html = wrapper(
		'Session reminder',
		`<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#c5c5c5;">
			Your next <strong style="color:#fff;">${escapeHtml(sessionName)}</strong> session starts in
			about 24 hours:
		</p>
		<p style="margin:0 0 20px;font-size:19px;font-weight:800;color:#f59e0b;text-align:center;">${when}</p>
		${button(link, 'View Details')}`
	);
	const text = `Your next ${sessionName} session starts in about 24 hours: ${when}\n\nDetails: ${link}`;
	return { subject, html, text };
}
