<script lang="ts">
	import { rooms } from '$lib/stores/rooms';
	import type { Room } from '$lib/types';
	import { createEventDispatcher } from 'svelte';
	import { processImages } from '$lib/services/photos';

	export let room: Partial<Room> & { houseId: string } = { houseId: '' };
	export let isEdit = false;

	const dispatch = createEventDispatcher();

	// Form values
	let name = room.name || '';
	let budget = room.budget || 0;
	let deadline = room.deadline ? new Date(room.deadline).toISOString().split('T')[0] : '';
	let thumbnail = room.thumbnail || '';
	let fileInput: HTMLInputElement;
	let isUploading = false;

	// Handle file selection
	async function handleFileSelect() {
		if (!fileInput.files || fileInput.files.length === 0) return;

		isUploading = true;

		try {
			// Process the first image only with high quality
			const photos = await processImages(fileInput.files, 'HIGH');
			if (photos.length > 0) {
				thumbnail = photos[0];
			}

			// Reset file input
			fileInput.value = '';
		} catch (error) {
			console.error('Error uploading photo:', error);
			alert('Det oppstod en feil ved opplasting av bildet. Vennligst prøv igjen.');
		} finally {
			isUploading = false;
		}
	}

	// Remove thumbnail
	function removeThumbnail() {
		if (confirm('Er du sikker på at du vil fjerne dette bildet?')) {
			thumbnail = '';
		}
	}

	// Submit the form
	async function handleSubmit() {
		if (!name.trim()) {
			alert('Romnavn er påkrevd');
			return;
		}

		if (budget < 0) {
			alert('Budsjett kan ikke være negativt');
			return;
		}

		// Format the deadline as ISO string if provided
		const formattedDeadline = deadline ? new Date(deadline).toISOString() : '';

		if (isEdit && room.id) {
			// Update existing room
			await rooms.updateRoom(room.id, {
				name: name.trim(),
				budget,
				deadline: formattedDeadline,
				thumbnail: thumbnail || undefined
			});

			dispatch('saved', { success: true });
		} else {
			// Add new room
			const id = await rooms.add({
				name: name.trim(),
				budget,
				deadline: formattedDeadline,
				photos: [],
				thumbnail: thumbnail || undefined,
				houseId: room.houseId
			});

			dispatch('saved', { success: true, newId: id });
		}
	}

	// Cancel the form
	function handleCancel() {
		dispatch('cancel');
	}
</script>

<div class="bg-white rounded-lg border border-sand/30 p-6 shadow-sm">
	<h2 class="text-xl font-medium mb-6 text-charcoal">
		{isEdit ? `Rediger ${room.name}` : 'Legg til nytt rom'}
	</h2>

	<form onsubmit={handleSubmit} class="space-y-5">
		<!-- Room Thumbnail -->
		<div>
			<label for="room-thumbnail" class="block text-sm font-medium text-charcoal/80 mb-2">
				Rombilde (valgfritt)
			</label>
			{#if thumbnail}
				<div class="relative w-full aspect-[16/9] mb-3">
					<img src={thumbnail} alt="Rombilde" class="w-full h-full object-cover rounded-lg" />
					<button
						type="button"
						class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
						onclick={removeThumbnail}
						aria-label="Fjern bilde"
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
			{:else}
				<div class="flex items-center justify-center w-full">
					<label
						class="w-full h-32 flex flex-col items-center justify-center border-2 border-sand border-dashed rounded-lg cursor-pointer bg-sand/5 hover:bg-sand/30 transition-colors"
					>
						<div class="flex flex-col items-center justify-center pt-5 pb-6">
							<svg
								class="w-8 h-8 mb-3 text-charcoal/60"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
								></path>
							</svg>
							<p class="text-sm text-charcoal/60">
								{isUploading ? 'Laster opp...' : 'Klikk for å laste opp bilde'}
							</p>
						</div>
						<input
							bind:this={fileInput}
							type="file"
							class="hidden"
							accept="image/*"
							onchange={handleFileSelect}
							disabled={isUploading}
						/>
					</label>
				</div>
			{/if}
		</div>

		<!-- Room Name -->
		<div>
			<label for="room-name" class="block text-sm font-medium text-charcoal/80 mb-1">
				Romnavn
			</label>
			<input
				id="room-name"
				type="text"
				bind:value={name}
				required
				placeholder="f.eks. Kjøkken, Bad, etc."
				class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-asphalt"
			/>
		</div>

		<!-- Budget -->
		<div>
			<label for="room-budget" class="block text-sm font-medium text-charcoal/80 mb-1">
				Budsjett
			</label>
			<div class="relative">
				<span class="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/60">kr</span>
				<input
					id="room-budget"
					type="number"
					bind:value={budget}
					min="0"
					step="1"
					placeholder="Angi budsjettbeløp"
					class="w-full p-2 pl-8 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-asphalt"
				/>
			</div>
		</div>

		<!-- Deadline -->
		<div>
			<label for="room-deadline" class="block text-sm font-medium text-charcoal/80 mb-1">
				Frist (valgfritt)
			</label>
			<input
				id="room-deadline"
				type="date"
				bind:value={deadline}
				class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-asphalt"
			/>
		</div>

		<!-- Form Actions -->
		<div class="flex gap-3 pt-2">
			<button type="submit" class="btn btn-success" disabled={isUploading}>
				{isEdit ? 'Oppdater rom' : 'Opprett rom'}
			</button>
			<button
				type="button"
				class="btn bg-charcoal/10 text-charcoal hover:bg-charcoal/20"
				onclick={handleCancel}
				disabled={isUploading}
			>
				Avbryt
			</button>
		</div>
	</form>
</div>
