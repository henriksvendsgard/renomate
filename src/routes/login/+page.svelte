<script lang="ts">
	import { userService } from '$lib/services/db';
	import { authStore } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let email = '';
	let password = '';
	let error = '';
	let loading = false;

	// If already logged in, redirect to home
	onMount(() => {
		if ($authStore.isAuthenticated && !$authStore.loading) {
			goto('/', { replaceState: true });
		}
	});

	async function handleLogin() {
		error = '';

		if (!email || !password) {
			error = 'Vennligst fyll ut alle feltene';
			return;
		}

		loading = true;

		try {
			const user = await userService.login(email, password);

			if (user) {
				// First store in localStorage directly
				if (browser) {
					localStorage.setItem('auth_user', JSON.stringify(user));
				}

				// Then update the store
				authStore.login(user);

				// Directly navigate to home page
				window.location.href = '/';
			} else {
				error = 'Ugyldig e-post eller passord';
			}
		} catch (err) {
			console.error('Login error:', err);
			error = 'Det oppstod en feil under innlogging';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
	<div class="w-full max-w-md bg-white rounded-lg shadow-md p-6">
		<img src="/oppuss-logo.png" alt="Oppuss logo" class="w-20 h-20 mx-auto mb-6" />
		<h1 class="text-2xl font-bold text-center mb-6">Velkommen til Oppuss!</h1>
		<p class="text-gray-600 text-center mb-6">Logg inn for å fortsette</p>

		{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
				{error}
			</div>
		{/if}

		<form on:submit|preventDefault={handleLogin} class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1">E-post</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
					placeholder="din@epost.no"
					required
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 mb-1"> Passord </label>
				<input
					type="password"
					id="password"
					bind:value={password}
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
					placeholder="Ditt passord"
					required
				/>
			</div>

			<div class="flex justify-center py-4">
				<button
					type="submit"
					class="flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-pine hover:bg-pine-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pine-dark"
					disabled={loading}
				>
					{loading ? 'Logger inn...' : 'Logg inn'}
				</button>
			</div>

			<div class="text-center mt-4">
				<p class="text-sm text-gray-600">
					Har du ikke en konto?
					<a href="/register" class="font-medium text-blue-600 hover:text-blue-500">Registrer deg</a
					>
				</p>
			</div>
		</form>
	</div>
</div>
