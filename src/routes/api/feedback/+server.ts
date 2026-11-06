// POST /api/feedback — a signed-in DM sends a free-text note ({ message }) to the site owner.
// Stored in the `feedback` collection and shown on /admin's Insights tab. Guests (no real
// account/email) are rejected, and admin impersonation sessions are never recorded as the DM.
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getDMBySessionId } from '$lib/server/dmModel';
import { addFeedback, FEEDBACK_MAX_LENGTH } from '$lib/server/feedbackStore';
import { sendMail, feedbackNotificationEmail } from '$lib/server/mail';

const FEEDBACK_RECIPIENT = 'dm@inittracker.com';

// Light per-account throttle so a stuck script or double-click storm can't flood the inbox.
const lastSent = new Map<string, number>();
const MIN_INTERVAL_MS = 5000;

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionId = cookies.get('dm_auth');
	if (!sessionId) return new Response('Unauthorized', { status: 401 });
	if (cookies.get('dm_impersonate'))
		return new Response('Not available while impersonating', { status: 403 });

	const body = await request.json().catch(() => null);
	const message = typeof body?.message === 'string' ? body.message.trim() : '';
	if (!message) return new Response('Message is required', { status: 400 });
	if (message.length > FEEDBACK_MAX_LENGTH)
		return new Response('Message too long', { status: 400 });

	const now = Date.now();
	if (now - (lastSent.get(sessionId) ?? 0) < MIN_INTERVAL_MS) {
		return new Response('Please wait a moment before sending again', { status: 429 });
	}

	const dm = await getDMBySessionId(sessionId);
	if (!dm?.email) return new Response('A DM account is required to send feedback', { status: 403 });

	lastSent.set(sessionId, now);
	await addFeedback({ sessionId, email: dm.email, message });

	// Notify the owner by email too. Fire-and-forget: the note is already saved, and sendMail
	// never throws, so a Postmark hiccup can't make the DM's submission look like it failed.
	const { subject, html, text } = feedbackNotificationEmail(dm.email, message);
	void sendMail({
		to: FEEDBACK_RECIPIENT,
		subject,
		html,
		text,
		tag: 'feedback',
		replyTo: dm.email
	});
	return json({ ok: true });
};
