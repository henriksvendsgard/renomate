<script lang="ts">
	import { rooms } from '$lib/stores/rooms';
	import type { Room } from '$lib/types';
	import { createEventDispatcher } from 'svelte';

	export let room: Partial<Room> = {};
	export let isEdit = false;

	const dispatch = createEventDispatcher();

	// Form values
	let name = room.name || '';
	let budget = room.budget || 0;
	let deadline = room.deadline ? new Date(room.deadline).toISOString().split('T')[0] : '';

	// Submit the form
	async function handleSubmit() {
		if (!name.trim()) {
			alert('Room name is required');
			return;
		}

		if (budget < 0) {
			alert('Budget cannot be negative');
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
				photos: []
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
		{isEdit ? `Edit ${room.name}` : 'Add New Room'}
	</h2>

	<form on:submit|preventDefault={handleSubmit} class="space-y-5">
		<!-- Room Name -->
		<div>
			<label for="room-name" class="block text-sm font-medium text-charcoal/80 mb-1">
				Room Name
			</label>
			<input
				id="room-name"
				type="text"
				bind:value={name}
				required
				placeholder="e.g. Kitchen, Bathroom, etc."
				class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-clay"
			/>
		</div>

		<!-- Budget -->
		<div>
			<label for="room-budget" class="block text-sm font-medium text-charcoal/80 mb-1">
				Budget
			</label>
			<div class="relative">
				<span class="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/60">$</span>
				<input
					id="room-budget"
					type="number"
					bind:value={budget}
					min="0"
					step="1"
					placeholder="Enter budget amount"
					class="w-full p-2 pl-8 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-clay"
				/>
			</div>
		</div>

		<!-- Deadline -->
		<div>
			<label for="room-deadline" class="block text-sm font-medium text-charcoal/80 mb-1">
				Deadline (optional)
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
				{isEdit ? 'Update Room' : 'Create Room'}
			</button>
			<button
				type="button"
				class="btn bg-charcoal/10 text-charcoal hover:bg-charcoal/20"
				on:click={handleCancel}
			>
				Cancel
			</button>
		</div>
	</form>
</div>
