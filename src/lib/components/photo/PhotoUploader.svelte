<script lang="ts">
	import { processImages } from '$lib/services/photos';
	import { rooms } from '$lib/stores/rooms';

	export let roomId: string;
	export let photos: string[] = [];

	let fileInput: HTMLInputElement;
	let isUploading = false;
	let uploadProgress = 0;
	let selectedIndex = -1;

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

			if (newPhotos.length === 0) {
				throw new Error('Ingen bilder ble behandlet');
			}

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
		} catch (error: unknown) {
			console.error('Error uploading photos:', error);
			isUploading = false;
			uploadProgress = 0;

			// Only show error message if no photos were processed
			if (error instanceof Error && error.message === 'Ingen bilder ble behandlet') {
				alert('Ingen bilder ble lastet opp. Vennligst prøv igjen med gyldige bildefiler.');
			}
		}
	}

	// Delete photo
	async function deletePhoto(index: number) {
		if (confirm('Er du sikker på at du vil slette dette bildet?')) {
			const updatedPhotos = [...photos.slice(0, index), ...photos.slice(index + 1)];
			await rooms.updateRoom(roomId, {
				photos: updatedPhotos
			});
		}
	}

	// Show fullsize photo in modal
	function selectPhoto(index: number) {
		selectedIndex = index;
	}

	// Close the photo modal
	function closeModal() {
		selectedIndex = -1;
	}
</script>

<div>
	<div class="flex justify-between items-center mb-4">
		<h3 class="text-lg font-medium text-charcoal">Bilder</h3>

		<!-- Upload button -->
		<button
			onclick={openFileInput}
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
			{isUploading ? 'Laster opp...' : 'Legg til bilder'}
		</button>

		<!-- Hidden file input -->
		<input
			type="file"
			bind:this={fileInput}
			onchange={handleFileSelect}
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
	<div class="bg-white rounded-lg border border-sand/30 p-4">
		{#if !photos || photos.length === 0}
			<div class="text-center py-8 text-charcoal/70">
				<p>Ingen bilder lagt til ennå</p>
				<button onclick={openFileInput} class="mt-2 text-sm text-asphalt hover:underline">
					Legg til ditt første bilde
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
				{#each photos as photo, index}
					<div class="relative aspect-square group">
						<button
							tabindex="0"
							aria-label="Vis bilde"
							onclick={() => selectPhoto(index)}
							onkeydown={(e) => e.key === 'Enter' && selectPhoto(index)}
						>
							<img
								src={photo}
								alt="Rombilde {index + 1}"
								class="w-full h-full object-cover rounded-lg cursor-pointer"
							/>
						</button>
						<button
							class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
							onclick={() => deletePhoto(index)}
							aria-label="Slett bilde"
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

	<!-- Photo modal -->
	{#if selectedIndex >= 0 && selectedIndex < photos.length}
		<div
			class="fixed inset-0 bg-charcoal/80 flex items-center justify-center z-50 p-4"
			onclick={closeModal}
			onkeydown={(e) => e.key === 'Escape' && closeModal()}
			role="dialog"
			aria-label="Bildevisning"
			tabindex="-1"
		>
			<div
				class="max-w-5xl max-h-[90vh] relative"
				role="button"
				tabindex="0"
				aria-label="Lukk bilde"
				onclick={closeModal}
				onkeydown={(e) => e.key === 'Escape' && closeModal()}
			>
				<div class="bg-snow rounded-lg shadow-lg">
					<img
						src={photos[selectedIndex]}
						alt="Rombilde"
						class="max-w-full max-h-[85vh] object-contain rounded"
						style="min-height: 200px; min-width: 200px;"
					/>
				</div>

				<button
					onclick={closeModal}
					class="absolute top-2 right-2 bg-white/80 text-charcoal p-1.5 rounded-full hover:bg-white"
					aria-label="Lukk bilde"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
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
		</div>
	{/if}
</div>
