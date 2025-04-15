<script lang="ts">
	import type { Task } from '$lib/types';
	import TaskItem from './TaskItem.svelte';
	import { rooms } from '$lib/stores/rooms';
	import { flip } from 'svelte/animate';
	import { fade, fly } from 'svelte/transition';

	export let tasks: Task[] = [];
	export let roomId: string;
	export let showCost = true;

	// New task form
	let newTaskTitle = '';
	let newTaskNote = '';
	let newTaskCost: number | undefined = undefined;
	let isAddingTask = false;

	// Filter options
	let showCompleted = true;

	// Get current room from the store
	$: currentRoom = $rooms.find((room) => room.id === roomId);

	// Use the tasks from the store if available, fallback to props
	$: currentTasks = currentRoom ? currentRoom.tasks : tasks;

	// Filter tasks based on visibility options
	$: filteredTasks = currentTasks
		.filter((task) => showCompleted || !task.done)
		.sort((a, b) => {
			// Show incomplete tasks first
			if (a.done !== b.done) return a.done ? 1 : -1;

			// Then sort by created date (newest first)
			if (a.createdAt && b.createdAt) {
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			}

			return 0;
		});

	// Toggle show completed tasks
	function toggleShowCompleted() {
		showCompleted = !showCompleted;
	}

	// Toggle add task form
	function toggleAddTaskForm() {
		isAddingTask = !isAddingTask;
		if (isAddingTask) {
			// Reset form fields
			newTaskTitle = '';
			newTaskNote = '';
			newTaskCost = undefined;
		}
	}

	// Add a new task
	async function addTask() {
		if (!newTaskTitle.trim()) {
			alert('Oppgavetittel kan ikke være tom');
			return;
		}

		try {
			await rooms.addTask(roomId, {
				title: newTaskTitle.trim(),
				done: false,
				note: newTaskNote.trim() || undefined,
				cost: newTaskCost
			});

			// Reset form fields
			newTaskTitle = '';
			newTaskNote = '';
			newTaskCost = undefined;
			isAddingTask = false;
		} catch (error) {
			alert('Det oppstod en feil ved opprettelse av oppgaven. Vennligst prøv igjen.');
		}
	}
</script>

<div>
	<!-- Task list header and controls -->
	<div class="flex justify-between items-center mb-4">
		<h3 class="text-lg font-medium text-charcoal">Oppgaver</h3>

		<div class="flex items-center gap-3">
			<!-- Toggle completed tasks visibility -->
			<button
				on:click={toggleShowCompleted}
				class="text-sm text-charcoal/70 hover:text-charcoal flex items-center gap-1.5"
			>
				<span
					class="w-4 h-4 border border-charcoal/30 rounded inline-flex items-center justify-center"
				>
					{#if showCompleted}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
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
				</span>
				Vis fullførte
			</button>

			<!-- Add task button -->
			<button on:click={toggleAddTaskForm} class="btn btn-primary text-sm flex items-center gap-1">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
						clip-rule="evenodd"
					/>
				</svg>
				Legg til oppgave
			</button>
		</div>
	</div>

	<!-- Add task form -->
	{#if isAddingTask}
		<div class="bg-sand/10 p-4 rounded-lg mb-6 border border-sand/20">
			<h4 class="font-medium mb-3 text-charcoal">Legg til ny oppgave</h4>

			<div class="space-y-3">
				<div>
					<input
						type="text"
						bind:value={newTaskTitle}
						class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-clay"
						placeholder="Oppgavenavn"
					/>
				</div>

				<div>
					<textarea
						bind:value={newTaskNote}
						class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-clay h-20 resize-none"
						placeholder="Legg til notater (valgfritt)"
					></textarea>
				</div>

				<div>
					<label for="task-cost" class="block text-sm text-charcoal/70 mb-1"
						>Kostnad (valgfritt)</label
					>
					<input
						id="task-cost"
						type="number"
						bind:value={newTaskCost}
						min="0"
						step="1"
						class="w-full p-2 border border-sand rounded focus:outline-none focus:ring-1 focus:ring-clay"
						placeholder="Kostnad"
					/>
				</div>

				<div class="flex space-x-2 pt-1">
					<button on:click={addTask} class="btn btn-success text-sm"> Legg til oppgave </button>
					<button
						on:click={toggleAddTaskForm}
						class="btn bg-charcoal/10 text-charcoal text-sm hover:bg-charcoal/20"
					>
						Avbryt
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Tasks list -->
	<div class="bg-white rounded-lg border border-sand/20 divide-y divide-sand/10">
		{#if filteredTasks.length === 0}
			<div class="py-6 text-center text-charcoal/60" transition:fade>
				<p>Ingen oppgaver funnet</p>
				<button on:click={toggleAddTaskForm} class="mt-2 text-sm text-clay hover:underline">
					Legg til din første oppgave
				</button>
			</div>
		{:else}
			{#each filteredTasks as task (task.id)}
				<div
					animate:flip={{ duration: 400 }}
					in:fade={{ duration: 200 }}
					out:fade={{ duration: 200 }}
				>
					<TaskItem {task} {roomId} {showCost} />
				</div>
			{/each}
		{/if}
	</div>
</div>
