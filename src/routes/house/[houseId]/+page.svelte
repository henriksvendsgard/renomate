<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		houses,
		rooms,
		getHouseBudget,
		getHouseSpent,
		getHouseRemaining
	} from '$lib/stores/rooms';
	import RoomCard from '$lib/components/room/RoomCard.svelte';
	import RoomForm from '$lib/components/room/RoomForm.svelte';
	import HouseForm from '$lib/components/house/HouseForm.svelte';
	import { goto } from '$app/navigation';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	// Get house ID from the route
	const houseId = $page.params.houseId;

	let isLoading = true;
	let showAddRoomForm = false;
	let isEditingHouse = false;

	// Create a tweened store for the progress value
	const tweenedProgress = tweened(0, {
		duration: 600,
		easing: cubicOut
	});

	// Get derived stores for this house
	const houseBudget = getHouseBudget(houseId);
	const houseSpent = getHouseSpent(houseId);
	const houseRemaining = getHouseRemaining(houseId);

	// Get current house and its rooms
	$: currentHouse = $houses.find((h) => h.id === houseId);
	$: houseRooms = $rooms.filter((r) => r.houseId === houseId);
	$: completedRooms = houseRooms.filter(
		(room) => room.tasks.length > 0 && room.tasks.every((task) => task.done)
	).length;
	$: totalRooms = houseRooms.length;
	$: progress = totalRooms > 0 ? Math.round((completedRooms / totalRooms) * 100) : 0;
	$: tweenedProgress.set(progress);

	// Format currency for display
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('nb-NO', {
			style: 'currency',
			currency: 'NOK',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Toggle add room form
	function toggleAddRoomForm() {
		showAddRoomForm = !showAddRoomForm;
	}

	// Handle room saved event
	async function handleRoomSaved() {
		showAddRoomForm = false;
		await rooms.loadForHouse(houseId);
	}

	// Toggle edit house mode
	function toggleEditMode() {
		isEditingHouse = !isEditingHouse;
	}

	// Handle house edit saved
	function handleHouseSaved() {
		isEditingHouse = false;
	}

	// Delete the house
	async function deleteHouse() {
		if (!currentHouse) return;

		if (
			confirm(
				`Er du sikker på at du vil slette huset "${currentHouse.name}" og alle dets rom? Denne handlingen kan ikke angres.`
			)
		) {
			await houses.delete(houseId);
			goto('/');
		}
	}

	onMount(async () => {
		await houses.load();
		await rooms.load();
		isLoading = false;
	});
</script>

<div class="max-w-6xl mx-auto p-4 sm:p-6">
	<!-- Back button -->
	<div class="mb-6">
		<a href="/" class="inline-flex items-center text-asphalt hover:text-charcoal transition-colors">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 mr-1"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
					clip-rule="evenodd"
				/>
			</svg>
			<span>Tilbake til oversikt</span>
		</a>
	</div>

	{#if isLoading}
		<div class="py-10 text-center text-charcoal/70">
			<p>Laster husdetaljer...</p>
		</div>
	{:else if !currentHouse}
		<div class="bg-white rounded-lg border border-sand/20 p-8 text-center">
			<h3 class="text-lg font-medium text-charcoal mb-2">Hus ikke funnet</h3>
			<p class="text-charcoal/70 mb-6">
				Huset du leter etter eksisterer ikke eller har blitt slettet.
			</p>
			<a href="/" class="btn btn-primary">Tilbake til oversikt</a>
		</div>
	{:else}
		<!-- House Header -->
		<div class="mb-8">
			{#if isEditingHouse}
				<HouseForm
					house={currentHouse}
					isEdit={true}
					on:saved={handleHouseSaved}
					on:cancel={toggleEditMode}
				/>
			{:else}
				<div class="bg-white rounded-lg border border-sand/20 p-6 shadow-sm">
					<div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
						<div>
							<h1 class="text-2xl font-bold text-charcoal">{currentHouse.name}</h1>
							{#if currentHouse.address}
								<p class="text-charcoal/70 mt-1">{currentHouse.address}</p>
							{/if}
						</div>

						<div class="flex items-center gap-2">
							<button
								on:click={toggleEditMode}
								class="btn bg-sand/20 text-charcoal hover:bg-sand/40 text-sm"
							>
								Rediger hus
							</button>
							<button
								on:click={deleteHouse}
								class="btn bg-red-500/10 text-red-600 hover:bg-red-500/20 text-sm"
							>
								Slett
							</button>
						</div>
					</div>

					<!-- Progress and Budget Info -->
					<div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
						<div>
							<h3 class="text-sm font-medium text-charcoal/70 mb-2">Fremgang</h3>
							<div class="w-full bg-sand/30 rounded-full h-3.5">
								<div
									class="bg-pine h-3.5 rounded-full transition-transform duration-700 ease-out"
									style="width: {$tweenedProgress}%"
								></div>
							</div>
							<div class="mt-2 flex justify-between text-sm">
								<span>{progress}% fullført</span>
								<span class="text-charcoal/70">
									{completedRooms} av {totalRooms} rom
								</span>
							</div>
						</div>

						<div>
							<h3 class="text-sm font-medium text-charcoal/70 mb-2">Budsjett</h3>
							<div class="grid grid-cols-3 gap-2">
								<div class="p-3 bg-sand/10 rounded">
									<div class="text-sm text-charcoal/70">Totalt</div>
									<div class="font-semibold">{formatCurrency($houseBudget)}</div>
								</div>
								<div class="p-3 bg-sand/10 rounded">
									<div class="text-sm text-charcoal/70">Brukt</div>
									<div class="font-semibold">{formatCurrency($houseSpent)}</div>
								</div>
								<div class="p-3 bg-sand/10 rounded">
									<div class="text-sm text-charcoal/70">Gjenstående</div>
									<div class="font-semibold {$houseRemaining >= 0 ? 'text-pine' : 'text-red-500'}">
										{formatCurrency($houseRemaining)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Rooms Section -->
		<div class="mb-6 flex justify-between items-center">
			<h2 class="text-xl font-semibold text-charcoal">Rom</h2>
			<button on:click={toggleAddRoomForm} class="btn btn-primary">
				{showAddRoomForm ? 'Avbryt' : 'Legg til rom'}
			</button>
		</div>

		<!-- Add Room Form -->
		{#if showAddRoomForm}
			<div class="mb-8">
				<RoomForm on:saved={handleRoomSaved} on:cancel={toggleAddRoomForm} room={{ houseId }} />
			</div>
		{/if}

		<!-- Rooms Grid -->
		{#if houseRooms.length === 0}
			<div class="bg-white rounded-lg border border-sand/20 p-8 text-center">
				<h3 class="text-lg font-medium text-charcoal mb-2">Ingen rom lagt til ennå</h3>
				<p class="text-charcoal/70 mb-6">
					Start planleggingen av oppussingen ved å legge til ditt første rom.
				</p>
				<button on:click={toggleAddRoomForm} class="btn btn-primary">
					Legg til ditt første rom
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
				{#each houseRooms as room (room.id)}
					<RoomCard {room} />
				{/each}
			</div>
		{/if}
	{/if}
</div>
