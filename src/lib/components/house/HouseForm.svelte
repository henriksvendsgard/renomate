<script lang="ts">
	import { houses } from '$lib/stores/rooms';
	import type { House } from '$lib/types';
	import { createEventDispatcher } from 'svelte';
	import { processImages } from '$lib/services/photos';

	export let house: Partial<House> = {};
	export let isEdit = false;

	const dispatch = createEventDispatcher<{
		saved: { success: boolean; newId?: string };
		cancel: void;
	}>();

	// Form values
	let name = house.name || '';
	let address = house.address || '';
	let photo = house.photo || '';
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
				photo = photos[0];
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

	// Remove photo
	function removePhoto() {
		if (confirm('Er du sikker på at du vil fjerne dette bildet?')) {
			photo = '';
		}
	}

	// Submit the form
	async function handleSubmit() {
		console.log('Submit clicked');
		if (!name.trim()) {
			alert('Husnavn er påkrevd');
			return;
		}

		try {
			if (isEdit && house.id) {
				// Update existing house
				await houses.update(house.id, {
					name: name.trim(),
					address: address.trim() || undefined,
					photo: photo || undefined
				});

				dispatch('saved', { success: true });
			} else {
				// Add new house
				const id = await houses.add({
					name: name.trim(),
					address: address.trim() || undefined,
					photo: photo || undefined
				});

				dispatch('saved', { success: true, newId: id });
			}
		} catch (error) {
			console.error('Error saving house:', error);
			alert('Det oppstod en feil ved lagring av huset. Vennligst prøv igjen.');
		}
	}

	// Cancel the form
	function handleCancel() {
		console.log('Cancel clicked');
		dispatch('cancel');
	}
</script>

<div class="bg-white rounded-lg border border-sand/30 p-6 shadow-sm">
	<h2 class="text-xl font-medium mb-6 text-charcoal">
		{isEdit ? `Rediger ${house.name}` : 'Legg til nytt hus'}
	</h2>

	<form onsubmit={handleSubmit} class="space-y-5">
		<!-- House Photo -->
		<div>
			<label class="block text-sm font-medium text-charcoal/80 mb-2"> Husbilde (valgfritt) </label>
			{#if photo}
				<div class="relative w-full aspect-[16/9] mb-3">
					<img src={photo} alt="Husbilde" class="w-full h-full object-cover rounded-lg" />
					<button
						type="button"
						class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
						onclick={removePhoto}
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

		<!-- House Name -->
		<div>
			<label for="house-name" class="block text-sm font-medium text-charcoal/80 mb-1">
				Husnavn
			</label>
			<input
				id="house-name"
				type="text"
				bind:value={name}
				required
				placeholder="f.eks. Hovedhus, Hytte, etc."
				class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-asphalt"
			/>
		</div>

		<!-- Address -->
		<div>
			<label for="house-address" class="block text-sm font-medium text-charcoal/80 mb-1">
				Adresse (valgfritt)
			</label>
			<input
				id="house-address"
				type="text"
				bind:value={address}
				placeholder="Gateadresse"
				class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-asphalt"
			/>
		</div>

		<!-- Form Actions -->
		<div class="flex gap-3 pt-2">
			<button type="submit" class="btn btn-success" disabled={isUploading}>
				{isEdit ? 'Oppdater hus' : 'Opprett hus'}
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
