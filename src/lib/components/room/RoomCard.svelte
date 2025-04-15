<script lang="ts">
	import { getThumbnail } from '$lib/services/photos';
	import type { Room } from '$lib/types';
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	export let room: Room;

	let thumbnailUrl = '';
	let completedTasks = 0;
	let totalTasks = 0;
	let progressPercentage = 0;

	// Create a tweened store for the progress value
	const tweenedProgress = tweened(0, {
		duration: 600,
		easing: cubicOut
	});

	$: {
		completedTasks = room.tasks.filter((task) => task.done).length;
		totalTasks = room.tasks.length;
		progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
		tweenedProgress.set(progressPercentage);
	}

	// Format the date for display
	function formatDate(dateString: string) {
		if (!dateString) return 'Ingen frist';

		const date = new Date(dateString);
		return new Intl.DateTimeFormat('nb-NO', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		}).format(date);
	}

	// Format budget as currency
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('nb-NO', {
			style: 'currency',
			currency: 'NOK',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Calculate days until deadline
	function getDaysRemaining(dateString: string) {
		if (!dateString) return null;

		const deadline = new Date(dateString);
		const today = new Date();

		// Reset time to midnight for accurate day comparison
		deadline.setHours(0, 0, 0, 0);
		today.setHours(0, 0, 0, 0);

		const timeDiff = deadline.getTime() - today.getTime();
		const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

		return daysDiff;
	}

	onMount(async () => {
		// Get the first photo as the thumbnail
		if (room.photos && room.photos.length > 0) {
			try {
				thumbnailUrl = await getThumbnail(room.photos[0]);
			} catch (error) {
				// Error handling without console.log
			}
		}
	});
</script>

<a
	href="/room/{room.id}"
	class="block card transition-transform hover:scale-[1.02] hover:shadow-md"
>
	<div class="flex flex-col h-full">
		<!-- Room thumbnail or placeholder -->
		<div class="h-32 bg-sand/20 rounded-t overflow-hidden relative">
			{#if thumbnailUrl}
				<img src={thumbnailUrl} alt={room.name} class="w-full h-full object-cover" />
			{:else}
				<div class="flex items-center justify-center h-full bg-sand/30 text-clay">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-12 w-12 opacity-60"
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

			<!-- Days remaining badge -->
			{#if room.deadline}
				{@const daysRemaining = getDaysRemaining(room.deadline)}
				{#if daysRemaining !== null}
					<div
						class="absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold {daysRemaining < 7
							? 'bg-red-500 text-white'
							: daysRemaining < 14
								? 'bg-amber-500 text-white'
								: 'bg-pine text-snow'}"
					>
						{daysRemaining > 0
							? `${daysRemaining} dager igjen`
							: daysRemaining === 0
								? 'Forfaller i dag'
								: `${Math.abs(daysRemaining)} dager på overtid`}
					</div>
				{/if}
			{/if}
		</div>

		<div class="p-4 flex-grow">
			<h2 class="text-lg font-semibold text-charcoal mb-2">{room.name}</h2>

			<!-- Progress bar -->
			<div class="mb-3">
				<div class="w-full bg-sand/30 rounded-full h-2.5">
					<div
						class="bg-pine h-2.5 rounded-full transition-transform duration-700 ease-out"
						style="width: {$tweenedProgress}%"
					></div>
				</div>
				<div class="mt-1 text-xs text-charcoal/70">
					{completedTasks} av {totalTasks} oppgaver fullført
				</div>
			</div>

			<div class="flex justify-between items-center mt-4 text-sm">
				<div>
					{#if room.deadline}
						<div class="text-charcoal/80">
							<span class="inline-block mr-1">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 inline"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							</span>
							Frist: {formatDate(room.deadline)}
						</div>
					{/if}
				</div>
				<div class="font-medium text-charcoal">
					{formatCurrency(room.budget)}
				</div>
			</div>
		</div>
	</div>
</a>
