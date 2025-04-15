<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/authStore';
	import { onMount } from 'svelte';

	let { children } = $props();
	let forceUpdate = 0;

	// Determine if we're on a specific route for highlighting the active link
	const isHomePage = $derived($page.url.pathname === '/');
	const isSettingsPage = $derived($page.url.pathname === '/settings');
	const isRoomDetailPage = $derived($page.url.pathname.startsWith('/room/'));
	const isLoginPage = $derived($page.url.pathname === '/login');
	const isRegisterPage = $derived($page.url.pathname === '/register');
	const isProfilePage = $derived($page.url.pathname === '/profile');

	// Check if we should display the nav footer
	const showNavFooter = $derived(!isLoginPage && !isRegisterPage);

	// Subscribe to auth changes and force a component update
	onMount(() => {
		const unsubscribe = authStore.subscribe(() => {
			// Force component to update when auth state changes
			forceUpdate = Date.now();
		});

		return unsubscribe;
	});

	// Log auth state changes for debugging using the $effect rune
	$effect(() => {
		console.log(
			`[Layout] Auth state: isAuthenticated=${$authStore.isAuthenticated}, loading=${$authStore.loading}, forceUpdate=${forceUpdate}`
		);
	});
</script>

<!-- Main Layout -->
<div class="flex flex-col min-h-screen bg-snow">
	<!-- Content -->
	<main class="flex-grow">
		{@render children()}
	</main>

	<!-- Footer Navigation - only show when logged in -->
	{#if showNavFooter && $authStore.isAuthenticated}
		<footer class="bg-white border-t border-sand/20 py-2 px-4 sticky bottom-0">
			<div class="max-w-6xl mx-auto flex justify-between items-center">
				<nav class="flex-1 flex justify-center space-x-8">
					<!-- Home Link -->
					<a
						href="/"
						class="flex flex-col items-center p-2 {isHomePage
							? 'text-asphalt'
							: 'text-charcoal/60 hover:text-charcoal'}"
						aria-label="Hjem"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
							/>
						</svg>
						<span class="text-xs mt-1">Hjem</span>
					</a>

					<!-- Settings Link -->
					<a
						href="/settings"
						class="flex flex-col items-center p-2 {isSettingsPage
							? 'text-asphalt'
							: 'text-charcoal/60 hover:text-charcoal'}"
						aria-label="Innstillinger"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
						<span class="text-xs mt-1">Innstillinger</span>
					</a>

					<!-- Profile Link -->
					<a
						href="/profile"
						class="flex flex-col items-center p-2 {isProfilePage
							? 'text-asphalt'
							: 'text-charcoal/60 hover:text-charcoal'}"
						aria-label="Profil"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
						<span class="text-xs mt-1">Profil</span>
					</a>
				</nav>
			</div>
		</footer>
	{/if}
</div>
