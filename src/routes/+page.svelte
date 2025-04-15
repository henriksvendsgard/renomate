<script lang="ts">
	import { onMount } from 'svelte';
	import { rooms, totalBudget, totalSpent, remainingBudget } from '$lib/stores/rooms';
	import RoomCard from '$lib/components/room/RoomCard.svelte';
	import RoomForm from '$lib/components/room/RoomForm.svelte';

	let showAddRoomForm = false;
	let isLoading = true;

	// Format currency for display
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Toggle add room form
	function toggleAddRoomForm() {
		showAddRoomForm = !showAddRoomForm;
	}

	// Handle room saved event
	function handleRoomSaved() {
		showAddRoomForm = false;
	}

	onMount(async () => {
		await rooms.load();
		isLoading = false;
	});
</script>

<div class="max-w-6xl mx-auto p-4 sm:p-6">
	<header class="py-6">
		<h1 class="text-3xl font-bold text-charcoal">Oppuss</h1>
		<p class="text-charcoal/70 mt-1">Room-by-Room Renovation Planner</p>
	</header>

	<!-- Budget Overview -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
		<div class="bg-white rounded-lg border border-sand/20 p-4 shadow-sm">
			<h2 class="text-sm font-medium text-charcoal/60 mb-1">Total Budget</h2>
			<div class="text-2xl font-semibold text-charcoal">{formatCurrency($totalBudget)}</div>
		</div>

		<div class="bg-white rounded-lg border border-sand/20 p-4 shadow-sm">
			<h2 class="text-sm font-medium text-charcoal/60 mb-1">Spent</h2>
			<div class="text-2xl font-semibold text-charcoal">{formatCurrency($totalSpent)}</div>
		</div>

		<div class="bg-white rounded-lg border border-sand/20 p-4 shadow-sm">
			<h2 class="text-sm font-medium text-charcoal/60 mb-1">Remaining</h2>
			<div class="text-2xl font-semibold {$remainingBudget >= 0 ? 'text-pine' : 'text-red-500'}">
				{formatCurrency($remainingBudget)}
			</div>
		</div>
	</div>

	<!-- Rooms Section -->
	<div class="mb-6 flex justify-between items-center">
		<h2 class="text-xl font-semibold text-charcoal">Your Rooms</h2>
		<button on:click={toggleAddRoomForm} class="btn btn-primary">
			{showAddRoomForm ? 'Cancel' : 'Add Room'}
		</button>
	</div>

	<!-- Add Room Form -->
	{#if showAddRoomForm}
		<div class="mb-8">
			<RoomForm on:saved={handleRoomSaved} on:cancel={toggleAddRoomForm} />
		</div>
	{/if}

	<!-- Rooms Grid -->
	{#if isLoading}
		<div class="py-10 text-center text-charcoal/70">
			<p>Loading your rooms...</p>
		</div>
	{:else if $rooms.length === 0}
		<div class="bg-white rounded-lg border border-sand/20 p-8 text-center">
			<h3 class="text-lg font-medium text-charcoal mb-2">No rooms added yet</h3>
			<p class="text-charcoal/70 mb-6">Start planning your renovation by adding your first room.</p>
			<button on:click={toggleAddRoomForm} class="btn btn-primary"> Add Your First Room </button>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
			{#each $rooms as room (room.id)}
				<RoomCard {room} />
			{/each}
		</div>
	{/if}
</div>
