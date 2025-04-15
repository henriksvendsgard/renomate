<script lang="ts">
	import { rooms } from '$lib/stores/rooms';
	import type { Room } from '$lib/types';
	import { createEventDispatcher } from 'svelte';

	export let room: Partial<Room> & { houseId: string } = { houseId: '' };
	export let isEdit = false;

	const dispatch = createEventDispatcher();

	// Form values
	let name = room.name || '';
	let budget = room.budget || 0;
	let deadline = room.deadline ? new Date(room.deadline).toISOString().split('T')[0] : '';

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
				deadline: formattedDeadline
			});

			dispatch('saved', { success: true });
		} else {
			// Add new room
			const id = await rooms.add({
				name: name.trim(),
				budget,
				deadline: formattedDeadline,
				photos: [],
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

<div class="bg-white rounded-lg border border-sand/20 p-6 shadow-sm">
	<h2 class="text-xl font-medium mb-6 text-charcoal">
		{isEdit ? `Rediger ${room.name}` : 'Legg til nytt rom'}
	</h2>

	<form on:submit|preventDefault={handleSubmit} class="space-y-5">
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
				class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-clay"
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
					class="w-full p-2 pl-8 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-clay"
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
				class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-clay"
			/>
		</div>

		<!-- Form Actions -->
		<div class="flex gap-3 pt-2">
			<button type="submit" class="btn btn-success">
				{isEdit ? 'Oppdater rom' : 'Opprett rom'}
			</button>
			<button
				type="button"
				class="btn bg-charcoal/10 text-charcoal hover:bg-charcoal/20"
				on:click={handleCancel}
			>
				Avbryt
			</button>
		</div>
	</form>
</div>
