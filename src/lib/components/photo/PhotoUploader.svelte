<script lang="ts">
	import { processImages } from '$lib/services/photos';
	import { rooms } from '$lib/stores/rooms';

	export let roomId: string;
	export let photos: string[] = [];

	let fileInput: HTMLInputElement;
	let isUploading = false;
	let uploadProgress = 0;

	// Keep photos in sync with room store
	$: {
		const room = $rooms.find((r) => r.id === roomId);
		if (room && Array.isArray(room.photos)) {
			photos = room.photos;
		}
	}

	// Trigger file input click
	function openFileInput() {
		fileInput.click();
	}

	// Handle file selection
	async function handleFileSelect() {
		if (!fileInput.files || fileInput.files.length === 0) return;

		isUploading = true;
		uploadProgress = 0;

		try {
			// Start progress animation
			const progressInterval = setInterval(() => {
				uploadProgress = Math.min(95, uploadProgress + 5);
			}, 100);

			// Process images
			const newPhotos = await processImages(fileInput.files);

			// Update the room with new photos
			const updatedPhotos = [...photos, ...newPhotos];
			await rooms.updateRoom(roomId, {
				photos: updatedPhotos
			});

			// Complete the upload
			clearInterval(progressInterval);
			uploadProgress = 100;

			// Reset file input and progress
			fileInput.value = '';
			setTimeout(() => {
				isUploading = false;
				uploadProgress = 0;
			}, 500);
		} catch (error) {
			console.error('Error processing images:', error);
			isUploading = false;
			uploadProgress = 0;
			alert('There was an error processing your images. Please try again.');
		}
	}

	// Delete photo
	async function deletePhoto(index: number) {
		if (confirm('Are you sure you want to delete this photo?')) {
			const updatedPhotos = [...photos.slice(0, index), ...photos.slice(index + 1)];
			await rooms.updateRoom(roomId, {
				photos: updatedPhotos
			});
		}
	}
</script>

<div>
	<div class="flex justify-between items-center mb-4">
		<h3 class="text-lg font-medium text-charcoal">Photos</h3>

		<!-- Upload button -->
		<button
			on:click={openFileInput}
			disabled={isUploading}
			class="btn btn-primary text-sm flex items-center gap-1"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
					clip-rule="evenodd"
				/>
			</svg>
			{isUploading ? 'Uploading...' : 'Add Photos'}
		</button>

		<!-- Hidden file input -->
		<input
			type="file"
			bind:this={fileInput}
			on:change={handleFileSelect}
			accept="image/*"
			multiple
			class="hidden"
		/>
	</div>

	<!-- Upload progress -->
	{#if isUploading}
		<div class="mb-4">
			<div class="w-full bg-sand/30 rounded-full h-2">
				<div
					class="bg-pine h-2 rounded-full transition-all duration-300"
					style="width: {uploadProgress}%"
				></div>
			</div>
			<div class="mt-1 text-xs text-charcoal/70 text-right">
				{uploadProgress}%
			</div>
		</div>
	{/if}

	<!-- Photos grid -->
	<div class="bg-white rounded-lg border border-sand/20 p-4">
		{#if !photos || photos.length === 0}
			<div class="text-center py-8 text-charcoal/70">
				<p>No photos added yet</p>
				<button on:click={openFileInput} class="mt-2 text-sm text-clay hover:underline">
					Add your first photo
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
				{#each photos as photo, index}
					<div class="relative aspect-square group">
						<img
							src={photo}
							alt="Room photo {index + 1}"
							class="w-full h-full object-cover rounded-lg"
						/>
						<button
							class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
							on:click={() => deletePhoto(index)}
							aria-label="Delete photo"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
