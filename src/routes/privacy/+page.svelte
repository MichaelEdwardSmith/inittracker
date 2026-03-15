<svelte:head>
	<title>Privacy Policy — Initiative Tracker</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 text-white">
	<div class="mx-auto max-w-3xl px-6 py-16">
		<!-- Header -->
		<div class="mb-12">
			<a href="/" class="mb-8 inline-block text-sm text-gray-500 transition hover:text-gray-400">← Back to home</a>
			<h1 class="text-3xl font-black tracking-wide text-amber-400">Privacy Policy</h1>
			<p class="mt-2 text-sm text-gray-500">Last updated: March 14, 2026</p>
		</div>

		<div class="space-y-10 text-gray-300">

			<section>
				<h2 class="mb-3 text-lg font-bold text-white">Overview</h2>
				<p class="text-sm leading-relaxed">
					Initiative Tracker ("we", "us", or "our") is a web application designed to help Dungeon
					Masters run D&amp;D 5e combat encounters. This policy explains what information we collect,
					how we use it, and your rights regarding that information. We do not sell your data to anyone.
				</p>
			</section>

			<section>
				<h2 class="mb-3 text-lg font-bold text-white">Information We Collect</h2>
				<ul class="space-y-3 text-sm leading-relaxed">
					<li>
						<span class="font-semibold text-gray-200">Account information.</span> When you register,
						we store your first name, last name, email address, and a hashed (bcrypt) version of your
						password. We never store your password in plain text.
					</li>
					<li>
						<span class="font-semibold text-gray-200">OAuth sign-in.</span> If you sign in with
						Google or Facebook, we receive your name, email address, and a unique identifier from that
						provider. We do not receive or store your social media password.
					</li>
					<li>
						<span class="font-semibold text-gray-200">Combat and session data.</span> We store the
						combat state, combat history, session notes, and custom monsters you create within the
						app. This data is associated with your account and is used solely to provide the service.
					</li>
					<li>
						<span class="font-semibold text-gray-200">Player messages.</span> Messages sent from
						players to the DM during a session are stored temporarily and associated with your game
						session.
					</li>
				</ul>
			</section>

			<section>
				<h2 class="mb-3 text-lg font-bold text-white">Cookies</h2>
				<ul class="space-y-3 text-sm leading-relaxed">
					<li>
						<span class="font-semibold text-gray-200">dm_auth.</span> A session cookie set when you
						log in. It holds a random identifier (not your password) used to authenticate your
						requests. It expires after 30 days.
					</li>
					<li>
						<span class="font-semibold text-gray-200">dm_guest.</span> A temporary session cookie set
						when you enter as a guest. It is cleared when you close the browser tab or log out.
					</li>
					<li>
						<span class="font-semibold text-gray-200">oauth_state / oauth_code_verifier.</span>
						Short-lived cookies (10 minutes) used during the OAuth sign-in flow to prevent
						cross-site request forgery. They are deleted immediately after sign-in completes.
					</li>
				</ul>
				<p class="mt-3 text-sm leading-relaxed">
					We do not use advertising cookies, tracking pixels, or third-party analytics cookies.
				</p>
			</section>

			<section>
				<h2 class="mb-3 text-lg font-bold text-white">How We Use Your Information</h2>
				<ul class="space-y-2 text-sm leading-relaxed list-disc list-inside">
					<li>To create and manage your account.</li>
					<li>To save and restore your combat sessions and history.</li>
					<li>To authenticate your identity on each visit.</li>
					<li>To respond to support requests you send to us.</li>
				</ul>
				<p class="mt-3 text-sm leading-relaxed">
					We do not use your data for advertising, profiling, or any purpose beyond operating the
					application.
				</p>
			</section>

			<section>
				<h2 class="mb-3 text-lg font-bold text-white">Data Sharing</h2>
				<p class="text-sm leading-relaxed">
					We do not sell, rent, or share your personal information with third parties, except:
				</p>
				<ul class="mt-3 space-y-2 text-sm leading-relaxed list-disc list-inside">
					<li>
						<span class="font-semibold text-gray-200">Google / Facebook</span> — only during the
						OAuth sign-in flow, as required to authenticate you. Their use of your data is governed
						by their own privacy policies.
					</li>
					<li>
						<span class="font-semibold text-gray-200">Legal obligations</span> — if required by law
						or to protect the rights and safety of our users.
					</li>
				</ul>
			</section>

			<section>
				<h2 class="mb-3 text-lg font-bold text-white">Data Retention</h2>
				<p class="text-sm leading-relaxed">
					Your account and associated data are retained for as long as your account is active. If you
					wish to delete your account and all associated data, contact us at the email below and we
					will process the request within 30 days.
				</p>
			</section>

			<section>
				<h2 class="mb-3 text-lg font-bold text-white">Security</h2>
				<p class="text-sm leading-relaxed">
					Passwords are hashed with bcrypt before storage. Authentication tokens are random,
					opaque identifiers with no user-readable information. We use HttpOnly cookies to
					prevent client-side script access to session tokens.
				</p>
			</section>

			<section>
				<h2 class="mb-3 text-lg font-bold text-white">Children's Privacy</h2>
				<p class="text-sm leading-relaxed">
					Initiative Tracker is not directed at children under 13. We do not knowingly collect
					personal information from children under 13. If you believe a child has provided us with
					personal information, please contact us so we can delete it.
				</p>
			</section>

			<section>
				<h2 class="mb-3 text-lg font-bold text-white">Changes to This Policy</h2>
				<p class="text-sm leading-relaxed">
					We may update this policy from time to time. When we do, we will update the "Last updated"
					date at the top. Continued use of the service after changes constitutes acceptance of the
					updated policy.
				</p>
			</section>

			<section>
				<h2 class="mb-3 text-lg font-bold text-white">Contact</h2>
				<p class="text-sm leading-relaxed">
					Questions about this policy or requests to delete your data:
					<a href="mailto:dm@inittracker.com" class="text-amber-500 transition hover:text-amber-400">
						dm@inittracker.com
					</a>
				</p>
			</section>

		</div>
	</div>
</div>
