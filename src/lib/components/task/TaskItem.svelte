<script lang="ts">
	import { rooms } from '$lib/stores/rooms';
	import type { Task } from '$lib/types';
	import { Pencil, Trash2 } from '@lucide/svelte';

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
				class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-asphalt"
				placeholder="Oppgavenavn"
			/>

			<textarea
				bind:value={editedNote}
				class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-asphalt h-20 resize-none"
				placeholder="Legg til notater (valgfritt)"
			></textarea>

			<div>
				<label for="task-edit-cost" class="block text-sm text-charcoal/70 mb-1"
					>Kostnad (valgfritt)</label
				>
				<input
					id="task-edit-cost"
					type="number"
					bind:value={editedCost}
					min="0"
					step="1"
					onclick={(e) => {
						if (e.target instanceof HTMLInputElement) {
							e.target.select();
						}
					}}
					class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-asphalt"
					placeholder="Kostnad i kr"
				/>
			</div>

			<div class="flex space-x-2">
				<button onclick={saveEdits} class="btn btn-success text-sm"> Lagre </button>
				<button
					onclick={cancelEditing}
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
			<button class="flex items-start flex-grow gap-3 cursor-pointer" onclick={toggleComplete}>
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
				<div class="flex-grow w-fit">
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
						<p class="text-sm text-charcoal/70 mt-1 whitespace-pre-line w-fit">{task.note}</p>
					{/if}

					{#if showCost && task.cost !== undefined && task.cost > 0}
						<div class="mt-2 text-sm w-fit">
							<span class="px-2 py-1 bg-sand rounded text-charcoal/80 inline-block">
								{formatCurrency(task.cost)}
							</span>
						</div>
					{/if}
				</div>
			</button>

			<!-- Action buttons - Separate clickable area -->
			<div class="flex items-center">
				<button
					onclick={startEditing}
					class="p-1 text-charcoal/60 hover:text-charcoal transition-colors"
					aria-label="Rediger oppgave"
				>
					<Pencil class="h-5 w-5" />
				</button>
				<button
					onclick={deleteTask}
					class="p-1 text-red-500 hover:text-red-700 transition-colors"
					aria-label="Slett oppgave"
				>
					<Trash2 class="h-5 w-5" />
				</button>
			</div>
		</div>
	{/if}
</div>
