<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { rooms } from '$lib/stores/rooms';
	import type { Room, Task } from '$lib/types';
	import TaskList from '$lib/components/task/TaskList.svelte';
	import PhotoUploader from '$lib/components/photo/PhotoUploader.svelte';
	import RoomForm from '$lib/components/room/RoomForm.svelte';
	import { goto } from '$app/navigation';
	import { clearThumbnailCache } from '$lib/services/photos';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { ArrowLeft } from '@lucide/svelte';

	// Get room ID from the route
	const roomId = $page.params.roomId;

	let isLoading = true;
	let isEditingRoom = false;
	let currentTab = 'tasks'; // 'tasks' or 'photos'

	// Calculate progress percentage
	function getProgressPercentage(room: Room | null): number {
		if (!room) return 0;
		const completedTasks = room.tasks.filter((task: Task) => task.done).length;
		const totalTasks = room.tasks.length;
		return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
	}

	// Get current room from the store
	$: currentRoom = $rooms.find((r) => r.id === roomId);
	$: room = currentRoom || null;
	$: progress = getProgressPercentage(room);
	$: completedTaskCount = room?.tasks.filter((t) => t.done).length ?? 0;
	$: totalTaskCount = room?.tasks.length ?? 0;
	$: spent = getRoomSpent(room);
	$: remaining = room ? room.budget - spent : 0;
	$: roomPhotos = room?.photos || [];
	$: roomTasks = room?.tasks || [];

	// Format currency for display
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('nb-NO', {
			style: 'currency',
			currency: 'NOK',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
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

	// Delete the room
	async function deleteRoom() {
		if (!room) return;

		if (
			confirm(
				`Er du sikker på at du vil slette rommet "${room.name}"? Denne handlingen kan ikke angres.`
			)
		) {
			await rooms.deleteRoom(roomId);
			goto('/');
		}
	}

	// Toggle edit mode
	function toggleEditMode() {
		isEditingRoom = !isEditingRoom;
	}

	// Handle room edit saved
	function handleRoomSaved() {
		isEditingRoom = false;
	}

	// Calculate spent amount for this room
	function getRoomSpent(room: Room | null): number {
		if (!room) return 0;
		return room.tasks
			.filter((task: Task) => task.done === true)
			.reduce((sum: number, task: Task) => sum + (task.cost || 0), 0);
	}

	// Switch tabs
	function setTab(tab: 'tasks' | 'photos') {
		currentTab = tab;

		// When switching to photos tab, try to reload the room data only if needed
		if (tab === 'photos') {
			// Clear thumbnail cache to ensure high-resolution thumbnails
			clearThumbnailCache();

			// Only reload if we actually need to
			if (
				!room?.photos ||
				room.photos.length === 0 ||
				(room.photos.length > 0 && roomPhotos.length === 0)
			) {
				rooms.load();
			}
		}
	}

	// Create a tweened store for the progress value
	const tweenedProgress = tweened(0, {
		duration: 600,
		easing: cubicOut
	});

	// Update the tweened progress whenever the actual progress changes
	$: tweenedProgress.set(progress);

	onMount(async () => {
		await rooms.load();
		isLoading = false;
	});
</script>

<div class="max-w-6xl mx-auto p-4 sm:p-6">
	<!-- Back button -->
	<div class="mb-6">
		<a
			href="/house/{room?.houseId}"
			class="inline-flex items-center text-asphalt hover:text-charcoal transition-colors"
		>
			<ArrowLeft class="h-5 w-5 mr-1" />
			<span>Tilbake til huset</span>
		</a>
	</div>

	{#if isLoading}
		<div class="py-10 text-center text-charcoal/70">
			<p>Laster romdetaljer...</p>
		</div>
	{:else if !room}
		<div class="bg-white rounded-lg border border-sand/30 p-8 text-center">
			<h3 class="text-lg font-medium text-charcoal mb-2">Rom ikke funnet</h3>
			<p class="text-charcoal/70 mb-6">
				Rommet du leter etter eksisterer ikke eller har blitt slettet.
			</p>
			<a href="/" class="btn btn-primary">Tilbake til oversikt</a>
		</div>
	{:else}
		<!-- Room Header -->
		<div class="mb-8">
			{#if isEditingRoom}
				<RoomForm {room} isEdit={true} on:saved={handleRoomSaved} on:cancel={toggleEditMode} />
			{:else}
				<div class="bg-white rounded-lg border border-sand/30 p-6 shadow-sm">
					<div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
						<div>
							<h1 class="text-2xl font-bold text-charcoal">{room.name}</h1>

							{#if room.deadline}
								<div class="mt-1 text-charcoal/70">
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

						<div class="flex items-center gap-2">
							<button
								onclick={toggleEditMode}
								class="btn bg-sand/30 text-charcoal hover:bg-sand/40 text-sm"
							>
								Rediger rom
							</button>
							<button
								onclick={deleteRoom}
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
									{completedTaskCount} av {totalTaskCount} oppgaver
								</span>
							</div>
						</div>

						<div>
							<h3 class="text-sm font-medium text-charcoal/70 mb-2">Budsjett</h3>
							<div class="p-3 bg-sand/30 rounded">
								<div class="text-sm text-charcoal/70">Totalt</div>
								<div class="font-semibold">{formatCurrency(room.budget)}</div>
							</div>
							<div class="grid grid-cols-2 gap-4 mt-4">
								<div class="p-3 bg-sand/30 rounded">
									<div class="text-sm text-charcoal/70">Brukt</div>
									<div class="font-semibold">{formatCurrency(spent)}</div>
								</div>
								<div class="p-3 bg-sand/30 rounded">
									<div class="text-sm text-charcoal/70">Gjenstående</div>
									<div class="font-semibold {remaining >= 0 ? 'text-pine' : 'text-red-500'}">
										{formatCurrency(remaining)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Tab Navigation -->
		<div class="border-b border-sand/30 mb-6">
			<div class="flex -mb-px">
				<button
					class="px-4 py-2 border-b-2 font-medium text-sm {currentTab === 'tasks'
						? 'border-asphalt text-asphalt'
						: 'border-transparent text-charcoal/60 hover:text-charcoal/80 hover:border-sand/50'}"
					onclick={() => setTab('tasks')}
				>
					Oppgaver <span class="text-sm text-charcoal/50">({roomTasks.length})</span>
				</button>
				<button
					class="px-4 py-2 border-b-2 font-medium text-sm {currentTab === 'photos'
						? 'border-asphalt text-asphalt'
						: 'border-transparent text-charcoal/60 hover:text-charcoal/80 hover:border-sand/50'}"
					onclick={() => setTab('photos')}
				>
					Bilder <span class="text-sm text-charcoal/50">({roomPhotos.length})</span>
				</button>
			</div>
		</div>

		<!-- Tab Content -->
		<div class="mb-12">
			{#if currentTab === 'tasks'}
				<TaskList tasks={roomTasks} roomId={room.id} />
			{:else if currentTab === 'photos'}
				{#key roomPhotos.length}
					<PhotoUploader roomId={room.id} photos={roomPhotos} />
				{/key}
			{/if}
		</div>
	{/if}
</div>
