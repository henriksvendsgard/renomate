<script lang="ts">
	import { authStore } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let error = '';
	let loading = false;

	// If already logged in, redirect to home
	onMount(() => {
		if ($authStore.isAuthenticated && !$authStore.loading) {
			goto('/');
		}
	});

	async function handleRegister() {
		error = '';

		if (!name || !email || !password || !confirmPassword) {
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

		loading = true;

		try {
			// Register the new user with Supabase
			const response = await authStore.signUp(email, password, name);

			if (response.error) {
				error = response.error.message || 'Det oppstod en feil under registreringen';
			} else {
				// Successfully created an account, navigate to home or verification page
				if (response.data.session) {
					// User is already signed in, go to home
					goto('/', { replaceState: true });
				} else {
					// Email verification might be required
					goto('/verify-email', { replaceState: true });
				}
			}
		} catch (err: any) {
			console.error('Registration error:', err);
			error = err.message || 'Det oppstod en feil under registreringen';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-snow p-4">
	<div class="w-full max-w-md bg-white rounded-lg shadow-md p-6">
		<img src="/renomate-logo.png" alt="renomate logo" class="w-20 h-20 mx-auto" />
		<h1 class="text-2xl font-bold text-center mb-4 font-comfortaa">renomate</h1>
		<p class="text-charcoal/70 text-center mb-6">Opprett en konto</p>

		{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
				{error}
			</div>
		{/if}

		<form on:submit|preventDefault={handleRegister} class="space-y-4">
			<div>
				<label for="name" class="block text-sm font-medium text-charcoal mb-1">Navn</label>
				<input
					type="text"
					id="name"
					bind:value={name}
					class="w-full px-3 py-2 border border-sand rounded-md shadow-sm focus:outline-none focus:ring-pine focus:border-pine"
					placeholder="Ditt navn"
					required
				/>
			</div>

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

			<div>
				<label for="password" class="block text-sm font-medium text-charcoal mb-1"> Passord </label>
				<input
					type="password"
					id="password"
					bind:value={password}
					class="w-full px-3 py-2 border border-sand rounded-md shadow-sm focus:outline-none focus:ring-pine focus:border-pine"
					placeholder="Ditt passord"
					required
				/>
			</div>

			<div>
				<label for="confirmPassword" class="block text-sm font-medium text-charcoal mb-1">
					Bekreft passord
				</label>
				<input
					type="password"
					id="confirmPassword"
					bind:value={confirmPassword}
					class="w-full px-3 py-2 border border-sand rounded-md shadow-sm focus:outline-none focus:ring-pine focus:border-pine"
					placeholder="Bekreft passordet ditt"
					required
				/>
			</div>

			<div class="py-4">
				<button
					type="submit"
					class="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-pine hover:bg-pine/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pine"
					disabled={loading}
				>
					{loading ? 'Oppretter konto...' : 'Registrer deg'}
				</button>
			</div>

			<div class="text-center mt-4">
				<p class="text-sm text-charcoal/70">
					Har du allerede en konto?
					<a href="/login" class="font-medium text-pine hover:text-pine/90">Logg inn</a>
				</p>
			</div>
		</form>
	</div>
</div>
