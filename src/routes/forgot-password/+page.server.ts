// Server logic for /forgot-password (DM).
// Always returns the same generic success message regardless of whether the email has an
// account, so this endpoint can't be used to enumerate registered DM emails.
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createPasswordResetToken } from '$lib/server/dmModel';
import { sendMail, passwordResetEmail, appBaseUrl } from '$lib/server/mail';
import { checkRateLimit } from '$lib/server/rateLimit';

const GENERIC_MESSAGE = "If that email has an account, we've sent a password reset link.";

export const actions: Actions = {
	default: async ({ request, getClientAddress }) => {
		const data = await request.formData();
		const email = (data.get('email') as string)?.trim().toLowerCase();

		if (!email) {
			return fail(400, { error: 'Please enter your email address.' });
		}

		// Rate-limit per email and per IP so this can't be hammered to spam a mailbox or probe
		// which addresses have accounts (timing/behavior is identical either way, but volume isn't).
		if (
			!checkRateLimit(`dm-reset:email:${email}`, 3, 15 * 60 * 1000) ||
			!checkRateLimit(`dm-reset:ip:${getClientAddress()}`, 10, 15 * 60 * 1000)
		) {
			return { success: true, message: GENERIC_MESSAGE };
		}

		const token = await createPasswordResetToken(email);
		if (token) {
			const { subject, html, text } = passwordResetEmail(`${appBaseUrl()}/reset-password/${token}`);
			await sendMail({ to: email, subject, html, text, tag: 'password-reset' });
		}

		return { success: true, message: GENERIC_MESSAGE };
	}
};
