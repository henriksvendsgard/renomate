<script lang="ts">
	import { onMount } from 'svelte';
	import { houses } from '$lib/stores/rooms';
	import HouseCard from '$lib/components/house/HouseCard.svelte';
	import HouseForm from '$lib/components/house/HouseForm.svelte';
	import { rooms } from '$lib/stores/rooms';

	let showAddHouseForm = false;
	let isLoading = true;

	// Toggle add house form
	function toggleAddHouseForm() {
		showAddHouseForm = !showAddHouseForm;
	}

	// Handle house saved event
	function handleHouseSaved() {
		showAddHouseForm = false;
	}

	onMount(async () => {
		try {
			// Load both houses and rooms data
			await Promise.all([houses.load(), rooms.load()]);
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			isLoading = false;
		}
	});
</script>

<div class="max-w-6xl mx-auto p-4 sm:p-6">
	<header class="py-6">
		<div class="flex items-center gap-3 mb-4">
			<img src="/favicon.png" alt="Oppuss logo" class="w-16 h-16" />
			<div>
				<h1 class="text-3xl font-bold text-charcoal">Oppuss</h1>
				<p class="text-charcoal/70 mt-1">Full oversikt over oppussingen</p>
			</div>
		</div>
	</header>

	<!-- Houses Section -->
	<div class="mb-6 flex justify-between items-center">
		<h2 class="text-xl font-semibold text-charcoal">Dine hus</h2>
		<button on:click={toggleAddHouseForm} class="btn btn-primary">
			{showAddHouseForm ? 'Avbryt' : 'Legg til hus'}
		</button>
	</div>

	<!-- Add House Form -->
	{#if showAddHouseForm}
		<div class="mb-8">
			<HouseForm on:saved={handleHouseSaved} on:cancel={toggleAddHouseForm} />
		</div>
	{/if}

	<!-- Houses Grid -->
	{#if isLoading}
		<div class="py-10 text-center text-charcoal/70">
			<p>Laster dine hus...</p>
		</div>
	{:else if $houses.length === 0}
		<div class="bg-white rounded-lg border border-sand/20 p-8 text-center">
			<h3 class="text-lg font-medium text-charcoal mb-2">Ingen hus lagt til ennå</h3>
			<p class="text-charcoal/70 mb-6">
				Start planleggingen av oppussingen ved å legge til ditt første hus.
			</p>
			<button on:click={toggleAddHouseForm} class="btn btn-primary">
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
</div>
