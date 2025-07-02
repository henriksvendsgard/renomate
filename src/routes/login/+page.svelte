<script lang="ts">
	import { authStore } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let email = '';
	let password = '';
	let error = '';
	let loading = false;
	let warning = '';
	// If already logged in, redirect to home
	onMount(() => {
		if ($authStore.isAuthenticated && !$authStore.loading) {
			goto('/', { replaceState: true });
		}
	});

	async function handleLogin() {
		error = '';
		warning = '';

		if (!email || !password) {
			error = 'Vennligst fyll ut alle feltene';
			return;
		}

		loading = true;

		try {
			const response = await authStore.login(email, password);

			// If email not confirmed, show error message
			if (response.error?.message === 'Email not confirmed') {
				warning = 'Vennligst verifiser din konto';
				return;
			}

			if (response.error) {
				error = 'Ugyldig e-post eller passord';
			} else {
				// Successfully logged in, navigate to home page
				goto('/', { replaceState: true });
			}
		} catch (err) {
			console.error('Login error:', err);
			error = 'Det oppstod en feil under innlogging';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-snow p-4">
	<div class="w-full max-w-md bg-white rounded-lg shadow-md p-6">
		<img src="/renomate-logo.png" alt="renomate logo" class="w-20 h-20 mx-auto" />
		<h1 class="text-2xl font-bold text-center mb-4 font-comfortaa">renomate</h1>
		<p class="text-charcoal/70 text-center mb-6">Logg inn for å fortsette</p>

		{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
				{error}
			</div>
		{/if}

		{#if warning}
			<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
				{warning}
			</div>
		{/if}

		<form on:submit|preventDefault={handleLogin} class="space-y-4">
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
				<div class="text-right mt-1">
					<a href="/forgot-password" class="text-sm text-pine hover:text-pine/90">Glemt passord?</a>
				</div>
			</div>

			<div class="flex justify-center py-4">
				<button
					type="submit"
					class="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-pine hover:bg-pine/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pine"
					disabled={loading}
				>
					{loading ? 'Logger inn...' : 'Logg inn'}
				</button>
			</div>

			<div class="text-center mt-4">
				<p class="text-sm text-charcoal/70">
					Har du ikke en konto?
					<a href="/register" class="font-medium text-pine hover:text-pine/90">Registrer deg</a>
				</p>
			</div>
		</form>
	</div>
</div>
