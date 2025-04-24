<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let password = '';
	let confirmPassword = '';
	let error = '';
	let success = false;
	let loading = false;

	// Extract token from URL
	const token = $page.url.searchParams.get('token');

	async function handleResetPassword() {
		error = '';

		if (!password || !confirmPassword) {
			error = 'Vennligst fyll ut alle feltene';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passordene matcher ikke';
			return;
		}

		if (password.length < 6) {
			error = 'Passordet må være minst 6 tegn langt';
			return;
		}

		if (!token) {
			error = 'Ugyldig eller utløpt lenke. Vennligst be om en ny tilbakestilling av passord.';
			return;
		}

		loading = true;

		try {
			// Update password using the token
			const { error: resetError } = await supabase.auth.updateUser({
				password
			});

			if (resetError) {
				error = resetError.message || 'Det oppstod en feil under tilbakestilling av passord';
			} else {
				success = true;
				// Clear fields
				password = '';
				confirmPassword = '';
			}
		} catch (err: any) {
			console.error('Password reset error:', err);
			error = err.message || 'Det oppstod en feil under tilbakestilling av passord';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-snow p-4">
	<div class="w-full max-w-md bg-white rounded-lg shadow-md p-6">
		<img src="/renomate-logo.png" alt="renomate logo" class="w-20 h-20 mx-auto" />
		<h1 class="text-2xl font-bold text-center mb-4 font-comfortaa">Tilbakestill passord</h1>
		<p class="text-charcoal/70 text-center mb-6">Opprett et nytt passord for kontoen din</p>

		{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
				{error}
			</div>
		{/if}

		{#if success}
			<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
				Passordet ditt er nå tilbakestilt. Du kan <a href="/login" class="font-bold underline"
					>logge inn</a
				> med ditt nye passord.
			</div>
		{:else if token}
			<form on:submit|preventDefault={handleResetPassword} class="space-y-4">
				<div>
					<label for="password" class="block text-sm font-medium text-charcoal mb-1">
						Nytt passord
					</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						class="w-full px-3 py-2 border border-sand rounded-md shadow-sm focus:outline-none focus:ring-pine focus:border-pine"
						placeholder="Ditt nye passord"
						required
					/>
				</div>

				<div>
					<label for="confirmPassword" class="block text-sm font-medium text-charcoal mb-1">
						Bekreft nytt passord
					</label>
					<input
						type="password"
						id="confirmPassword"
						bind:value={confirmPassword}
						class="w-full px-3 py-2 border border-sand rounded-md shadow-sm focus:outline-none focus:ring-pine focus:border-pine"
						placeholder="Bekreft ditt nye passord"
						required
					/>
				</div>

				<div class="flex justify-center py-4">
					<button
						type="submit"
						class="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-pine hover:bg-pine/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pine"
						disabled={loading}
					>
						{loading ? 'Tilbakestiller passord...' : 'Tilbakestill passord'}
					</button>
				</div>
			</form>
		{:else}
			<div class="text-center">
				<p class="text-charcoal/70 mb-4">
					Ugyldig eller utløpt lenke. Vennligst be om en ny tilbakestilling av passord.
				</p>
				<a
					href="/forgot-password"
					class="inline-block py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-pine hover:bg-pine/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pine"
				>
					Tilbakestill passord
				</a>
			</div>
		{/if}

		<div class="text-center mt-6">
			<a href="/login" class="text-sm font-medium text-pine hover:text-pine/90">
				Tilbake til innlogging
			</a>
		</div>
	</div>
</div>
