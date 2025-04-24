<script lang="ts">
	import { authStore } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let user = $derived($authStore.user);
	let isAuthenticated = $derived($authStore.isAuthenticated);
	let isLoading = $state(false);

	// Redirect if not authenticated
	onMount(() => {
		if (!$authStore.isAuthenticated && !$authStore.loading) {
			goto('/login');
		}
	});

	// Function to handle logout
	async function handleLogout() {
		isLoading = true;
		try {
			const error = await authStore.logout();
			if (error) {
				console.error('Logout error:', error);
			}
			goto('/login', { replaceState: true });
		} catch (err) {
			console.error('Logout error:', err);
		} finally {
			isLoading = false;
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
							class="bg-pine/10 text-pine rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold"
						>
							{user.name.charAt(0).toUpperCase()}
						</div>
						<div class="ml-4">
							<h2 class="text-xl font-semibold">{user.name}</h2>
							<p class="text-charcoal/70">{user.email}</p>
						</div>
					</div>

					<div class="border-t border-sand pt-4">
						<h3 class="text-lg font-medium mb-2">Kontoopplysninger</h3>
						<div class="space-y-2">
							<div class="grid grid-cols-3 text-sm">
								<span class="text-charcoal/60">Navn:</span>
								<span class="col-span-2">{user.name}</span>
							</div>
							<div class="grid grid-cols-3 text-sm">
								<span class="text-charcoal/60">E-post:</span>
								<span class="col-span-2">{user.email}</span>
							</div>
							{#if user.createdAt}
								<div class="grid grid-cols-3 text-sm">
									<span class="text-charcoal/60">Medlem siden:</span>
									<span class="col-span-2">
										{new Date(user.createdAt).toLocaleDateString('nb-NO')}
									</span>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<p class="text-center text-charcoal/60">Laster brukerdata...</p>
				{/if}
			</div>

			<div class="bg-white rounded-lg shadow-md p-6">
				<h3 class="text-lg font-medium mb-4">Kontoalternativer</h3>

				<!-- Logout button -->
				<button
					onclick={handleLogout}
					class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pine hover:bg-pine/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pine"
					disabled={isLoading}
				>
					{isLoading ? 'Logger ut...' : 'Logg ut 👋'}
				</button>
			</div>
		</div>
	{:else}
		<div class="flex items-center justify-center min-h-[50vh]">
			<p class="text-center text-charcoal/60">Vennligst logg inn for å se profilen din.</p>
		</div>
	{/if}
</div>
