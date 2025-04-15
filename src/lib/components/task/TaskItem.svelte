<script lang="ts">
	import { rooms } from '$lib/stores/rooms';
	import type { Task } from '$lib/types';

	export let task: Task;
	export let roomId: string;
	export let showCost = true;

	let isEditing = false;
	let editedTitle = task.title;
	let editedNote = task.note || '';
	let editedCost = task.cost || 0;

	// Update edited values when task changes
	$: {
		if (!isEditing) {
			editedTitle = task.title;
			editedNote = task.note || '';
			editedCost = task.cost || 0;
		}
	}

	// Format currency for display
	function formatCurrency(amount: number | undefined) {
		if (amount === undefined) return '';

		return new Intl.NumberFormat('nb-NO', {
			style: 'currency',
			currency: 'NOK',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Toggle the completion status of a task
	async function toggleComplete() {
		try {
			await rooms.toggleTaskCompletion(roomId, task.id);
		} catch (error) {
			alert('Det oppstod en feil ved oppdatering av oppgaven. Vennligst prøv igjen.');
		}
	}

	// Delete this task
	async function deleteTask() {
		if (confirm(`Er du sikker på at du vil slette oppgaven "${task.title}"?`)) {
			try {
				await rooms.deleteTask(roomId, task.id);
			} catch (error) {
				alert('Det oppstod en feil ved sletting av oppgaven. Vennligst prøv igjen.');
			}
		}
	}

	// Start editing this task
	function startEditing() {
		editedTitle = task.title;
		editedNote = task.note || '';
		editedCost = task.cost || 0;
		isEditing = true;
	}

	// Save edits
	async function saveEdits() {
		if (!editedTitle.trim()) {
			alert('Oppgavetittel kan ikke være tom');
			return;
		}

		try {
			await rooms.updateTask(roomId, task.id, {
				title: editedTitle.trim(),
				note: editedNote.trim() || undefined,
				cost: editedCost || undefined
			});

			isEditing = false;
		} catch (error) {
			alert('Det oppstod en feil ved oppdatering av oppgaven. Vennligst prøv igjen.');
		}
	}

	// Cancel editing
	function cancelEditing() {
		isEditing = false;
		// Reset to original values
		editedTitle = task.title;
		editedNote = task.note || '';
		editedCost = task.cost || 0;
	}
</script>

<div class="group border-b border-sand/20 py-3 px-2 hover:bg-sand/5 transition-colors">
	{#if isEditing}
		<!-- Edit Mode -->
		<div class="space-y-3">
			<input
				type="text"
				bind:value={editedTitle}
				class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-clay"
				placeholder="Oppgavenavn"
			/>

			<textarea
				bind:value={editedNote}
				class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-clay h-20 resize-none"
				placeholder="Legg til notater (valgfritt)"
			></textarea>

			<div>
				<label for="task-edit-cost" class="block text-sm text-charcoal/70 mb-1"
					>Kostnad i kr (valgfritt)</label
				>
				<input
					id="task-edit-cost"
					type="number"
					bind:value={editedCost}
					min="0"
					step="1"
					class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-clay"
					placeholder="Kostnad"
				/>
			</div>

			<div class="flex space-x-2">
				<button on:click={saveEdits} class="btn btn-success text-sm"> Lagre </button>
				<button
					on:click={cancelEditing}
					class="btn bg-charcoal/10 text-charcoal text-sm hover:bg-charcoal/20"
				>
					Avbryt
				</button>
			</div>
		</div>
	{:else}
		<!-- Display Mode -->
		<div class="flex items-start gap-3">
			<!-- Checkbox and Title Group - Clickable -->
			<div class="flex items-start flex-grow gap-3 cursor-pointer" on:click={toggleComplete}>
				<div class="pt-0.5">
					<div
						class="w-5 h-5 border rounded-full flex items-center justify-center transition-all duration-300
						{task.done
							? 'bg-pine border-pine text-snow scale-100'
							: 'border-charcoal/30 hover:border-pine/70 scale-95 hover:scale-100'}"
						aria-label={task.done ? 'Merk som ikke fullført' : 'Merk som fullført'}
					>
						{#if task.done}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-3 w-3 transition-transform duration-300"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
						{/if}
					</div>
				</div>

				<!-- Task content -->
				<div class="flex-grow">
					<div class="flex justify-between items-start">
						<h3
							class="font-medium transition-all duration-300 {task.done
								? 'line-through text-charcoal/60'
								: 'text-charcoal'}"
						>
							{task.title}
						</h3>
					</div>

					{#if task.note}
						<p class="text-sm text-charcoal/70 mt-1 whitespace-pre-line">{task.note}</p>
					{/if}

					{#if showCost && task.cost !== undefined && task.cost > 0}
						<div class="mt-2 text-sm">
							<span class="px-2 py-1 bg-sand/20 rounded text-charcoal/80 inline-block">
								{formatCurrency(task.cost)}
							</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Action buttons - Separate clickable area -->
			<div class="flex items-center">
				<button
					on:click|stopPropagation={startEditing}
					class="p-1 text-charcoal/60 hover:text-charcoal transition-colors"
					aria-label="Rediger oppgave"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
						/>
					</svg>
				</button>
				<button
					on:click|stopPropagation={deleteTask}
					class="p-1 text-red-600/60 hover:text-red-600 transition-colors"
					aria-label="Slett oppgave"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
		</div>
	{/if}
</div>
