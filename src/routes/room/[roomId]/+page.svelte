<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { rooms } from '$lib/stores/rooms';
	import TaskList from '$lib/components/task/TaskList.svelte';
	import PhotoUploader from '$lib/components/photo/PhotoUploader.svelte';
	import RoomForm from '$lib/components/room/RoomForm.svelte';
	import { goto } from '$app/navigation';
	import { clearThumbnailCache } from '$lib/services/photos';

	// Get room ID from the route
	const roomId = $page.params.roomId;

	let room: ReturnType<typeof getRoomData>;
	let isLoading = true;
	let isEditingRoom = false;
	let currentTab = 'tasks'; // 'tasks' or 'photos'

	// Helper to get room data safely
	function getRoomData() {
		const roomData = $rooms.find((r) => r.id === roomId);
		if (!roomData) return null;
		return roomData;
	}

	// Format currency for display
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Format the date for display
	function formatDate(dateString: string) {
		if (!dateString) return 'No deadline';

		const date = new Date(dateString);
		return new Intl.DateTimeFormat('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		}).format(date);
	}

	// Calculate progress percentage
	function getProgressPercentage() {
		if (!room) return 0;
		const completedTasks = room.tasks.filter((task) => task.done).length;
		const totalTasks = room.tasks.length;
		return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
	}

	// Delete the room
	async function deleteRoom() {
		if (!room) return;

		if (
			confirm(
				`Are you sure you want to delete the room "${room.name}"? This action cannot be undone.`
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
	function getRoomSpent() {
		if (!room) return 0;
		return room.tasks.reduce((sum, task) => sum + (task.cost || 0), 0);
	}

	// Switch tabs
	function setTab(tab: 'tasks' | 'photos') {
		currentTab = tab;

		// When switching to photos tab, try to reload the room data only if needed
		if (tab === 'photos') {
			// Clear thumbnail cache to ensure high-resolution thumbnails
			clearThumbnailCache();

			// Only reload if we actually need to - if there are no photos or if there was an issue before
			if (
				!room?.photos ||
				room.photos.length === 0 ||
				(room.photos.length > 0 && roomPhotos.length === 0)
			) {
				console.log('Switching to photos tab, reloading room data');
				rooms.load().then(() => {
					// Log photo info after loading
					logPhotoInfo();
				});
			} else {
				console.log('Photos already loaded, skipping reload');
				// Just log existing photo info
				logPhotoInfo();
			}
		}
	}

	// Diagnostic function to check photo storage
	function logPhotoInfo() {
		if (!room) return;

		console.log('Room photos info:');
		console.log('- Photos array:', room.photos ? 'exists' : 'not defined');
		console.log('- Is array:', Array.isArray(room.photos));
		console.log('- Length:', room.photos ? room.photos.length : 0);

		if (room.photos && room.photos.length > 0) {
			console.log('- First photo type:', typeof room.photos[0]);
			console.log(
				'- First photo starts with:',
				typeof room.photos[0] === 'string'
					? room.photos[0].substring(0, 20) + '...'
					: 'not a string'
			);

			// Count how many photos are valid
			const validPhotos = room.photos.filter(
				(photo) => photo && typeof photo === 'string' && photo.startsWith('data:')
			);
			console.log(`- Valid photos: ${validPhotos.length} of ${room.photos.length}`);
		}
	}

	onMount(async () => {
		await rooms.load();
		room = getRoomData();
		isLoading = false;

		// Log photo info after loading
		if (room) {
			logPhotoInfo();
		}
	});

	// Reactively update room data when the rooms store changes
	$: room = getRoomData();
	$: progress = getProgressPercentage();
	$: spent = getRoomSpent();
	$: remaining = room ? room.budget - spent : 0;
	$: roomPhotos = room && room.photos && Array.isArray(room.photos) ? room.photos : [];
	$: roomTasks = room && room.tasks && Array.isArray(room.tasks) ? room.tasks : [];
</script>

<div class="max-w-6xl mx-auto p-4 sm:p-6">
	<!-- Back button -->
	<div class="mb-6">
		<a href="/" class="inline-flex items-center text-clay hover:text-charcoal transition-colors">
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
			<span>Back to Dashboard</span>
		</a>
	</div>

	{#if isLoading}
		<div class="py-10 text-center text-charcoal/70">
			<p>Loading room details...</p>
		</div>
	{:else if !room}
		<div class="bg-white rounded-lg border border-sand/20 p-8 text-center">
			<h3 class="text-lg font-medium text-charcoal mb-2">Room not found</h3>
			<p class="text-charcoal/70 mb-6">
				The room you're looking for doesn't exist or has been deleted.
			</p>
			<a href="/" class="btn btn-primary">Back to Dashboard</a>
		</div>
	{:else}
		<!-- Room Header -->
		<div class="mb-8">
			{#if isEditingRoom}
				<RoomForm {room} isEdit={true} on:saved={handleRoomSaved} on:cancel={toggleEditMode} />
			{:else}
				<div class="bg-white rounded-lg border border-sand/20 p-6 shadow-sm">
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
									Deadline: {formatDate(room.deadline)}
								</div>
							{/if}
						</div>

						<div class="flex items-center gap-2">
							<button
								on:click={toggleEditMode}
								class="btn bg-sand/20 text-charcoal hover:bg-sand/40 text-sm"
							>
								Edit Room
							</button>
							<button
								on:click={deleteRoom}
								class="btn bg-red-500/10 text-red-600 hover:bg-red-500/20 text-sm"
							>
								Delete
							</button>
						</div>
					</div>

					<!-- Progress and Budget Info -->
					<div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
						<div>
							<h3 class="text-sm font-medium text-charcoal/70 mb-2">Progress</h3>
							<div class="w-full bg-sand/30 rounded-full h-3.5">
								<div class="bg-pine h-3.5 rounded-full" style="width: {progress}%"></div>
							</div>
							<div class="mt-2 flex justify-between text-sm">
								<span>{progress}% complete</span>
								<span class="text-charcoal/70">
									{room.tasks.filter((t) => t.done).length} of {room.tasks.length} tasks
								</span>
							</div>
						</div>

						<div>
							<h3 class="text-sm font-medium text-charcoal/70 mb-2">Budget</h3>
							<div class="grid grid-cols-3 gap-2">
								<div class="p-3 bg-sand/10 rounded">
									<div class="text-sm text-charcoal/70">Total</div>
									<div class="font-semibold">{formatCurrency(room.budget)}</div>
								</div>
								<div class="p-3 bg-sand/10 rounded">
									<div class="text-sm text-charcoal/70">Spent</div>
									<div class="font-semibold">{formatCurrency(spent)}</div>
								</div>
								<div class="p-3 bg-sand/10 rounded">
									<div class="text-sm text-charcoal/70">Remaining</div>
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
		<div class="border-b border-sand/20 mb-6">
			<div class="flex -mb-px">
				<button
					class="px-4 py-2 border-b-2 font-medium text-sm {currentTab === 'tasks'
						? 'border-clay text-clay'
						: 'border-transparent text-charcoal/60 hover:text-charcoal/80 hover:border-sand/50'}"
					on:click={() => setTab('tasks')}
				>
					Tasks
				</button>
				<button
					class="px-4 py-2 border-b-2 font-medium text-sm {currentTab === 'photos'
						? 'border-clay text-clay'
						: 'border-transparent text-charcoal/60 hover:text-charcoal/80 hover:border-sand/50'}"
					on:click={() => setTab('photos')}
				>
					Photos
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
