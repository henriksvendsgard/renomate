<script lang="ts">
	import { userService } from '$lib/services/db';
	import { authStore } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

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
			// Register the new user
			await userService.register({ name, email, password });

			// Log the user in
			const user = await userService.login(email, password);

			if (user) {
				// First store in localStorage directly
				if (browser) {
					localStorage.setItem('auth_user', JSON.stringify(user));
				}

				// Then update the store
				authStore.login(user);

				// Force navigation to home page
				goto('/', { replaceState: true });
			} else {
				error =
					'Registreringen var vellykket, men innlogging feilet. Vennligst prøv å logge inn manuelt.';
			}
		} catch (err: any) {
			console.error('Registration error:', err);
			error = err.message || 'Det oppstod en feil under registreringen';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
	<div class="w-full max-w-md bg-white rounded-lg shadow-md p-6">
		<h1 class="text-2xl font-bold text-center mb-6">Opprett en konto</h1>

		{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
				{error}
			</div>
		{/if}

		<form onsubmit={handleRegister} class="space-y-4">
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700 mb-1">Navn</label>
				<input
					type="text"
					id="name"
					bind:value={name}
					class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
					placeholder="Ditt navn"
					required
				/>
			</div>

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

			<div>
				<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
					Bekreft passord
				</label>
				<input
					type="password"
					id="confirmPassword"
					bind:value={confirmPassword}
					class="w-full px-3 py-2 mb-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
					placeholder="Bekreft passordet ditt"
					required
				/>
			</div>

			<div>
				<button
					type="submit"
					class="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					disabled={loading}
				>
					{loading ? 'Oppretter konto...' : 'Registrer deg'}
				</button>
			</div>

			<div class="text-center mt-4">
				<p class="text-sm text-gray-600">
					Har du allerede en konto?
					<a href="/login" class="font-medium text-blue-600 hover:text-blue-500">Logg inn</a>
				</p>
			</div>
		</form>
	</div>
</div>
