<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/authStore';
	import { onMount } from 'svelte';
	import { House, Settings, ShoppingCart, User } from '@lucide/svelte';

	// fonts
	// Supports weights 300-700
	import '@fontsource-variable/comfortaa';
	// Supports weights 300-700
	import '@fontsource-variable/quicksand';

	let { children } = $props();
	let forceUpdate = 0;

	// Determine if we're on a specific route for highlighting the active link
	const isHomePage = $derived($page.url.pathname === '/');
	const isSettingsPage = $derived($page.url.pathname === '/settings');
	const isLoginPage = $derived($page.url.pathname === '/login');
	const isRegisterPage = $derived($page.url.pathname === '/register');
	const isProfilePage = $derived($page.url.pathname === '/profile');
	const isShoppingListPage = $derived($page.url.pathname === '/shopping');

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
		<footer class="bg-white border-t border-sand/30 py-2 px-4 sticky bottom-0">
			<div class="max-w-6xl mx-auto flex justify-between items-center">
				<nav class="flex-1 flex justify-center space-x-6">
					<!-- Home Link -->
					<a
						href="/"
						class="flex flex-col items-center p-2 {isHomePage
							? 'text-asphalt'
							: 'text-charcoal/60 hover:text-charcoal'}"
						aria-label="Hjem"
					>
						<House class="h-6 w-6" />
						<span class="text-xs mt-1">Hjem</span>
					</a>

					<!-- Shopping List Link -->
					<a
						href="/shopping"
						class="flex flex-col items-center p-2 {isShoppingListPage
							? 'text-asphalt'
							: 'text-charcoal/60 hover:text-charcoal'}"
						aria-label="Handleliste"
					>
						<ShoppingCart class="h-6 w-6" />
						<span class="text-xs mt-1">Handleliste</span>
					</a>

					<!-- Settings Link -->
					<a
						href="/settings"
						class="flex flex-col items-center p-2 {isSettingsPage
							? 'text-asphalt'
							: 'text-charcoal/60 hover:text-charcoal'}"
						aria-label="Innstillinger"
					>
						<Settings class="h-6 w-6" />
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
						<User class="h-6 w-6" />
						<span class="text-xs mt-1">Profil</span>
					</a>
				</nav>
			</div>
		</footer>
	{/if}
</div>
