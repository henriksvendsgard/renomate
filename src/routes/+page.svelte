<script lang="ts">
	import { goto } from '$app/navigation';
	import HouseCard from '$lib/components/house/HouseCard.svelte';
	import HouseForm from '$lib/components/house/HouseForm.svelte';
	import { authStore } from '$lib/stores/authStore';
	import { houses } from '$lib/stores/rooms';
	import { onMount } from 'svelte';

	let showAddHouseForm = $state(false);
	let isLoading = $state(false);
	let loadError = $state<string | null>(null);
	let user = $derived($authStore.user);
	let addHouseButton = $state<HTMLButtonElement | null>(null);

	// Redirect if not authenticated
	onMount(() => {
		if (!$authStore.isAuthenticated && !$authStore.loading) {
			goto('/login');
		}
	});

	// Toggle add house form
	function toggleAddHouseForm() {
		showAddHouseForm = !showAddHouseForm;
	}

	// Handle house saved event
	function handleHouseSaved() {
		showAddHouseForm = false;
	}

	// Load data when user is authenticated
	$effect(() => {
		if ($authStore.isAuthenticated && user) {
			loadData(user.id);
		}
	});

	async function loadData(userId: string) {
		try {
			isLoading = true;
			loadError = null;
			// Only load houses for now to simplify
			await houses.load(userId);
		} catch (error) {
			console.error('Error loading data:', error);
			loadError = 'Kunne ikke laste husene dine. Vennligst prøv igjen senere.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="max-w-6xl mx-auto p-4 sm:p-6">
	<header class="py-6">
		<div class="flex items-center gap-3 mb-4">
			<img src="/favicon.png" alt="Oppuss logo" class="w-16 h-16" />
			<div>
				<h1 class="text-3xl font-bold text-charcoal">renomate</h1>
				<p class="text-charcoal/70 mt-1">Din venn for oppussingen</p>
			</div>
		</div>
	</header>

	<!-- Houses Section -->
	{#if $authStore.isAuthenticated}
		<div class="mb-6 flex justify-between items-center">
			<h2 class="text-xl font-semibold text-charcoal">Dine hus</h2>
			<button
				class="btn btn-primary"
				bind:this={addHouseButton}
				onclick={() => toggleAddHouseForm()}
			>
				{showAddHouseForm ? 'Avbryt' : 'Legg til hus'}
			</button>
		</div>

		<!-- Add House Form -->
		{#if showAddHouseForm}
			<div class="mb-8">
				<HouseForm
					userId={user?.id || ''}
					on:saved={(e) => {
						showAddHouseForm = false;
						loadData(user?.id || '');
					}}
					on:cancel={() => {
						showAddHouseForm = false;
					}}
				/>
			</div>
		{/if}

		<!-- Error State -->
		{#if loadError}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
				{loadError}
				<button class="ml-2 underline" onclick={() => loadData(user?.id || '')}>Prøv igjen</button>
			</div>
		{/if}

		<!-- Loading State -->
		{#if isLoading}
			<div class="py-10 text-center text-charcoal/70">
				<div
					class="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-blue-600 rounded-full mb-2"
				></div>
				<p>Laster dine hus...</p>
			</div>
		{:else if $houses.length === 0 && !showAddHouseForm}
			<div class="bg-white rounded-lg border border-sand/20 p-8 text-center">
				<h3 class="text-lg font-medium text-charcoal mb-2">Ingen hus lagt til ennå</h3>
				<p class="text-charcoal/70 mb-6">
					Start planleggingen av oppussingen ved å legge til ditt første hus.
				</p>
				<button class="btn btn-primary" onclick={() => toggleAddHouseForm()}>
					Legg til ditt første hus
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
				{#each $houses as house (house.id)}
					<HouseCard {house} />
				{/each}
			</div>
		{/if}
	{:else}
		<div class="py-10 text-center text-charcoal/70">
			<p>Vennligst logg inn for å se dine hus.</p>
		</div>
	{/if}
</div>
