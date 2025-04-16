<script lang="ts">
	import type { House } from '$lib/types';
	import { getHouseBudget, getHouseSpent, getHouseRemaining, rooms } from '$lib/stores/rooms';
	import { getThumbnail } from '$lib/services/photos';
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	export let house: House;

	let thumbnailUrl = '';

	// Create a tweened store for the progress value
	const tweenedProgress = tweened(0, {
		duration: 600,
		easing: cubicOut
	});

	// Get derived stores for this house
	const houseBudget = getHouseBudget(house.id);
	const houseSpent = getHouseSpent(house.id);
	const houseRemaining = getHouseRemaining(house.id);

	// Get rooms for this house with proper reactivity
	$: houseRooms = $rooms.filter((room) => room.houseId === house.id);
	$: completedRooms = houseRooms.filter(
		(room) => room.tasks.length > 0 && room.tasks.every((task) => task.done)
	).length;
	$: totalRooms = houseRooms.length;
	$: progress = totalRooms > 0 ? Math.round((completedRooms / totalRooms) * 100) : 0;
	$: {
		console.log(`House ${house.id} progress updated:`, { progress, completedRooms, totalRooms });
		tweenedProgress.set(progress);
	}

	// Format currency for display
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('nb-NO', {
			style: 'currency',
			currency: 'NOK',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	onMount(async () => {
		if (house.photo) {
			try {
				thumbnailUrl = await getThumbnail(house.photo, undefined, house.id);
			} catch (error) {
				console.error('Error loading thumbnail:', error);
			}
		}
	});
</script>

<a
	href="/house/{house.id}"
	class="block card transition-transform hover:scale-[1.02] hover:shadow-md"
>
	<!-- House Photo -->
	<div class="h-48 bg-sand/30 rounded-lg overflow-hidden">
		{#if thumbnailUrl}
			<img src={thumbnailUrl} alt={house.name} class="w-full h-full object-cover" />
		{:else}
			<div class="flex items-center justify-center h-full bg-sand/30 text-asphalt">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-16 w-16 opacity-60"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/>
				</svg>
			</div>
		{/if}
	</div>

	<div class="pt-6 px-4 pb-4">
		<div class="flex justify-between items-start mb-4">
			<div>
				<h2 class="text-xl font-semibold text-charcoal">{house.name}</h2>
				{#if house.address}
					<p class="text-charcoal/70 text-sm mt-1">{house.address}</p>
				{/if}
			</div>
		</div>

		<!-- Progress -->
		<div class="mb-4">
			<div class="w-full bg-sand/30 rounded-full h-2.5">
				<div
					class="bg-pine h-2.5 rounded-full transition-transform duration-700 ease-out"
					style="width: {$tweenedProgress}%"
				></div>
			</div>
			<div class="mt-1 text-sm text-charcoal/70 flex justify-between">
				<span>{progress}% fullført</span>
				<span>{completedRooms} av {totalRooms} rom fullført</span>
			</div>
		</div>

		<!-- Budget Overview -->
		<div class="w-fit font-medium text-sm text-charcoal/70 bg-sand/30 rounded-md p-2">
			Budsjett: {formatCurrency($houseBudget)}
		</div>
		<div class="grid grid-cols-2 gap-3 mt-4">
			<div class="text-center p-2 bg-sand/30 rounded">
				<div class="text-sm text-charcoal/70">Brukt</div>
				<div class="font-medium">{formatCurrency($houseSpent)}</div>
			</div>
			<div class="text-center p-2 bg-sand/30 rounded">
				<div class="text-sm text-charcoal/70">Gjenstående</div>
				<div class="font-medium {$houseRemaining >= 0 ? 'text-pine' : 'text-red-500'}">
					{formatCurrency($houseRemaining)}
				</div>
			</div>
		</div>
	</div>
</a>
