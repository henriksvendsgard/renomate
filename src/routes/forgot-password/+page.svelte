<script lang="ts">
	import { supabase } from '$lib/supabase';

	let email = '';
	let error = '';
	let success = false;
	let loading = false;

	async function handleForgotPassword() {
		error = '';

		if (!email) {
			error = 'Vennligst skriv inn e-postadressen din';
			return;
		}

		loading = true;

		try {
			// Configure redirect URL - this should point to your reset password page
			const redirectTo = `${window.location.origin}/reset-password`;

			// Send password reset email
			const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo
			});

			if (resetError) {
				error =
					resetError.message ||
					'Det oppstod en feil ved sending av e-post for tilbakestilling av passord';
			} else {
				success = true;
				email = ''; // Clear field
			}
		} catch (err: any) {
			console.error('Forgot password error:', err);
			error =
				err.message || 'Det oppstod en feil ved sending av e-post for tilbakestilling av passord';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-snow p-4">
	<div class="w-full max-w-md bg-white rounded-lg shadow-md p-6">
		<img src="/renomate-logo.png" alt="renomate logo" class="w-20 h-20 mx-auto" />
		<h1 class="text-2xl font-bold text-center mb-4 font-comfortaa">Glemt passord</h1>
		<p class="text-charcoal/70 text-center mb-6">
			Skriv inn e-postadressen din for å tilbakestille passordet ditt
		</p>

		{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
				{error}
			</div>
		{/if}

		{#if success}
			<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
				<p>
					En e-post med instruksjoner for å tilbakestille passordet ditt er sendt til <strong
						>{email}</strong
					>.
				</p>
				<p class="mt-2">
					Sjekk innboksen din (og spam-mappen) og følg instruksjonene i e-posten for å tilbakestille
					passordet ditt.
				</p>
			</div>
		{:else}
			<form on:submit|preventDefault={handleForgotPassword} class="space-y-4">
				<div>
					<label for="email" class="block text-sm font-medium text-charcoal mb-1">E-post</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						class="w-full px-3 py-2 border border-sand rounded-md shadow-sm focus:outline-none focus:ring-pine focus:border-pine"
						placeholder="din@epost.no"
						required
					/>
				</div>

				<div class="flex justify-center py-4">
					<button
						type="submit"
						class="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-pine hover:bg-pine/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pine"
						disabled={loading}
					>
						{loading ? 'Sender e-post...' : 'Send tilbakestillingslenke'}
					</button>
				</div>
			</form>
		{/if}

		<div class="text-center mt-6">
			<a href="/login" class="text-sm font-medium text-pine hover:text-pine/90">
				Tilbake til innlogging
			</a>
		</div>
	</div>
</div>
