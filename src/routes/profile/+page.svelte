<script lang="ts">
	import { authStore } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { userService } from '$lib/services/db';
	import { browser } from '$app/environment';

	let user = $derived($authStore.user);
	let isAuthenticated = $derived($authStore.isAuthenticated);

	// Redirect if not authenticated
	onMount(() => {
		if (!$authStore.isAuthenticated && !$authStore.loading) {
			goto('/login');
		}
	});

	// Function to handle logout
	async function handleLogout() {
		// First clear localStorage directly
		if (browser) {
			localStorage.removeItem('auth_user');
		}

		// Then update the store
		authStore.logout();

		// Force navigation to login page
		goto('/login', { replaceState: true });
	}

	// Function to handle direct delete with browser confirm
	async function handleDeleteAccount() {
		if (!user) return;

		const confirmed = confirm(
			'Er du sikker på at du vil slette kontoen din? Dette vil slette all informasjon om deg og kan ikke angres.'
		);
		if (!confirmed) return;

		try {
			console.log('Attempting to delete user:', user.id);
			// Delete the user
			await userService.deleteUser(user.id);
			console.log('User deleted successfully');

			// Clear localStorage directly
			if (browser) {
				localStorage.removeItem('auth_user');
			}

			// Update the store
			authStore.logout();

			// Force navigation to login page
			goto('/login', { replaceState: true });
		} catch (err: any) {
			console.error('Delete account error:', err);
			alert(err.message || 'Det oppstod en feil under sletting av kontoen');
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Only show profile content when authenticated -->
	{#if isAuthenticated}
		<div class="max-w-lg mx-auto">
			<h1 class="text-2xl font-bold text-asphalt mb-6">Min profil</h1>

			<div class="bg-white rounded-lg shadow-md p-6 mb-6">
				{#if user}
					<div class="flex items-center mb-6">
						<div
							class="bg-blue-100 text-blue-700 rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold"
						>
							{user.name.charAt(0).toUpperCase()}
						</div>
						<div class="ml-4">
							<h2 class="text-xl font-semibold">{user.name}</h2>
							<p class="text-gray-600">{user.email}</p>
						</div>
					</div>

					<div class="border-t border-gray-200 pt-4">
						<h3 class="text-lg font-medium mb-2">Kontoopplysninger</h3>
						<div class="space-y-2">
							<div class="grid grid-cols-3 text-sm">
								<span class="text-gray-500">Navn:</span>
								<span class="col-span-2">{user.name}</span>
							</div>
							<div class="grid grid-cols-3 text-sm">
								<span class="text-gray-500">E-post:</span>
								<span class="col-span-2">{user.email}</span>
							</div>
							<div class="grid grid-cols-3 text-sm">
								<span class="text-gray-500">Medlem siden:</span>
								<span class="col-span-2">
									{new Date(user.createdAt || '').toLocaleDateString('nb-NO')}
								</span>
							</div>
						</div>
					</div>
				{:else}
					<p class="text-center text-gray-600">Laster brukerdata...</p>
				{/if}
			</div>

			<div class="bg-white rounded-lg shadow-md p-6">
				<h3 class="text-lg font-medium mb-4">Kontoalternativer</h3>

				<!-- Logout button -->
				<button
					onclick={handleLogout}
					class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-4"
				>
					👋 Logg ut
				</button>

				<!-- Delete account button -->
				<button
					onclick={handleDeleteAccount}
					class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
					aria-label="Slett konto"
					type="button"
				>
					🗑️ Slett konto
				</button>
			</div>
		</div>
	{:else}
		<div class="flex items-center justify-center min-h-[50vh]">
			<p class="text-center text-gray-600">Vennligst logg inn for å se profilen din.</p>
		</div>
	{/if}
</div>
