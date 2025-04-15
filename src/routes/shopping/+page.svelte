<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { activeItems, completedItems, shoppingStore } from '$lib/stores/shoppingStore';
	import { Pencil, Trash, Trash2 } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { backOut } from 'svelte/easing';

	let newItemText = $state('');
	let newItemQuantity = $state(1);
	let newItemComment = $state('');
	let isLoading = $state(false);
	let showCompleted = $state(true);
	let isCompletedAccordionOpen = $state(true);
	let user = $derived($authStore.user);
	let editingItemId = $state<string | null>(null);
	let editText = $state('');
	let editQuantity = $state(1);
	let editComment = $state('');

	// Redirect if not authenticated
	onMount(() => {
		if (!$authStore.isAuthenticated && !$authStore.loading) {
			goto('/login');
		} else if (user) {
			loadShoppingItems(user.id);
		}
	});

	// Load shopping items
	$effect(() => {
		if ($authStore.isAuthenticated && user) {
			loadShoppingItems(user.id);
		}
	});

	async function loadShoppingItems(userId: string) {
		try {
			isLoading = true;
			await shoppingStore.load(userId);
		} catch (error) {
			console.error('Error loading shopping items:', error);
		} finally {
			isLoading = false;
		}
	}

	// Add a new item
	async function addItem() {
		if (!newItemText.trim() || !user) return;

		try {
			await shoppingStore.add({
				userId: user.id,
				title: newItemText.trim(),
				completed: false,
				quantity: newItemQuantity,
				note: newItemComment.trim() || undefined
			});
			newItemText = '';
			newItemQuantity = 1;
			newItemComment = '';
		} catch (error) {
			console.error('Error adding item:', error);
		}
	}

	// Toggle item completion
	async function toggleItem(id: string) {
		if (!user) return;
		try {
			await shoppingStore.toggleCompleted(id, user.id);
		} catch (error) {
			console.error('Error toggling item:', error);
		}
	}

	// Delete an item
	async function deleteItem(id: string) {
		if (!user) return;
		try {
			await shoppingStore.delete(id, user.id);
		} catch (error) {
			console.error('Error deleting item:', error);
		}
	}

	// Clear completed items with confirmation
	async function clearCompleted() {
		if (!user) return;

		// Ask for confirmation before clearing
		const confirmed = confirm('Er du sikker på at du vil fjerne alle fullførte elementer?');
		if (!confirmed) return;

		try {
			await shoppingStore.clearCompleted(user.id);
		} catch (error) {
			console.error('Error clearing completed items:', error);
		}
	}

	// Toggle the completed items accordion
	function toggleAccordion() {
		isCompletedAccordionOpen = !isCompletedAccordionOpen;
	}

	// Update item quantity
	async function updateQuantity(id: string, newQuantity: number) {
		if (!user || newQuantity < 1) return;
		try {
			await shoppingStore.update(id, { quantity: newQuantity });
		} catch (error) {
			console.error('Error updating quantity:', error);
		}
	}

	// Start editing an item
	function startEditing(item: (typeof $activeItems)[0] | (typeof $completedItems)[0]) {
		editingItemId = item.id;
		editText = item.title;
		editQuantity = item.quantity || 1;
		editComment = item.note || '';
	}

	// Cancel editing
	function cancelEditing() {
		editingItemId = null;
	}

	// Save edits
	async function saveEdits() {
		if (!user || !editingItemId || !editText.trim()) return;

		try {
			await shoppingStore.update(editingItemId, {
				title: editText.trim(),
				quantity: editQuantity,
				note: editComment.trim() || undefined
			});
			editingItemId = null;
		} catch (error) {
			console.error('Error updating item:', error);
		}
	}
</script>

<div class="max-w-lg mx-auto p-4 py-6">
	<h1 class="text-2xl font-bold text-charcoal mb-4">Handleliste</h1>

	<!-- Add new item form -->
	<form
		onsubmit={(e) => {
			e.preventDefault();
			addItem();
		}}
		class="mb-6 bg-white rounded-lg shadow-sm p-4 border border-sand/20"
	>
		<div class="flex gap-2 mb-3">
			<input
				type="text"
				bind:value={newItemText}
				placeholder="Legg til nytt element..."
				class="flex-grow p-2 border border-sand rounded-md focus:outline-none focus:ring-1 focus:ring-asphalt"
			/>
			<div class="flex items-center bg-sand/10 rounded-md px-2">
				<button
					type="button"
					onclick={() => (newItemQuantity = Math.max(1, newItemQuantity - 1))}
					class="w-8 h-8 flex items-center justify-center text-charcoal hover:bg-sand/20 rounded-full"
					aria-label="Reduser antall"
				>
					-
				</button>
				<input
					type="number"
					bind:value={newItemQuantity}
					min="1"
					class="w-12 text-center bg-transparent p-1"
					aria-label="Antall"
				/>
				<button
					type="button"
					onclick={() => newItemQuantity++}
					class="w-8 h-8 flex items-center justify-center text-charcoal hover:bg-sand/20 rounded-full"
					aria-label="Øk antall"
				>
					+
				</button>
			</div>
		</div>

		<div class="mb-3">
			<input
				type="text"
				bind:value={newItemComment}
				placeholder="Legg til kommentar (valgfritt)..."
				class="w-full p-2 border border-sand rounded-md focus:outline-none focus:ring-1 focus:ring-asphalt"
			/>
		</div>

		<button
			type="submit"
			class="bg-pine text-white px-6 py-2 rounded-md hover:bg-pine-dark transition-colors"
			disabled={!newItemText.trim()}
		>
			Legg til
		</button>
	</form>

	{#if isLoading}
		<div class="flex justify-center my-12" transition:fade>
			<div
				class="animate-spin h-8 w-8 border-4 border-pine border-t-transparent rounded-full"
			></div>
		</div>
	{:else}
		<!-- Active items -->
		<div
			class="bg-white rounded-lg shadow-sm p-4 mb-6 border border-sand/20"
			transition:fly={{ y: 20, duration: 300 }}
		>
			<h2 class="text-lg font-semibold mb-3 text-charcoal">Kjøpes ({$activeItems.length})</h2>

			{#if $activeItems.length === 0}
				<p class="text-center text-charcoal/60 py-4" transition:fade>Ingen elementer å vise</p>
			{:else}
				<ul class="space-y-2">
					{#each $activeItems as item (item.id)}
						<li class="rounded-md bg-white overflow-hidden" transition:slide={{ duration: 300 }}>
							{#if editingItemId === item.id}
								<!-- Edit mode -->
								<form
									class="p-3 border border-pine rounded-md"
									onsubmit={(e) => {
										e.preventDefault();
										saveEdits();
									}}
								>
									<div class="flex gap-2 mb-2">
										<input
											type="text"
											bind:value={editText}
											class="flex-grow p-2 border border-sand rounded-md focus:outline-none focus:ring-1 focus:ring-asphalt"
											autofocus
										/>
										<div class="flex items-center bg-sand/10 rounded-md px-2">
											<button
												type="button"
												onclick={() => (editQuantity = Math.max(1, editQuantity - 1))}
												class="w-8 h-8 flex items-center justify-center text-charcoal hover:bg-sand/20 rounded-full"
											>
												-
											</button>
											<input
												type="number"
												bind:value={editQuantity}
												min="1"
												class="w-12 text-center bg-transparent p-1"
											/>
											<button
												type="button"
												onclick={() => editQuantity++}
												class="w-8 h-8 flex items-center justify-center text-charcoal hover:bg-sand/20 rounded-full"
											>
												+
											</button>
										</div>
									</div>

									<div class="mb-3">
										<input
											type="text"
											bind:value={editComment}
											placeholder="Legg til kommentar (valgfritt)..."
											class="w-full p-2 border border-sand rounded-md focus:outline-none focus:ring-1 focus:ring-asphalt"
										/>
									</div>

									<div class="flex justify-end gap-2">
										<button
											type="button"
											onclick={cancelEditing}
											class="px-3 py-1 text-charcoal/70 hover:text-charcoal"
										>
											Avbryt
										</button>
										<button
											type="submit"
											class="px-3 py-1 bg-pine text-white rounded-md hover:bg-pine-dark"
										>
											Lagre
										</button>
									</div>
								</form>
							{:else}
								<!-- View mode -->
								<div
									class="flex items-center gap-3 p-3 hover:bg-sand/10 transition-colors rounded-md"
								>
									<!-- Checkbox -->
									<button
										class="w-6 h-6 border-2 rounded-full flex items-center justify-center text-white {item.completed
											? 'bg-pine border-pine'
											: 'border-charcoal/30 hover:border-pine/70'}"
										onclick={() => toggleItem(item.id)}
										aria-label={item.completed ? 'Merk som ufullført' : 'Merk som fullført'}
									>
										{#if item.completed}
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4"
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
									</button>

									<!-- Item details -->
									<div class="flex-grow">
										<div class="flex items-center">
											<span class="font-medium">{item.title}</span>
											{#if item.quantity && item.quantity > 1}
												<span class="ml-2 px-2 py-0.5 bg-sand/20 rounded-full text-sm">
													{item.quantity}
												</span>
											{/if}
										</div>
										{#if item.note}
											<p class="text-sm text-charcoal/70 mt-1">{item.note}</p>
										{/if}
									</div>

									<!-- Action buttons -->
									<div class="flex">
										<button
											class="text-charcoal/60 hover:text-charcoal p-1"
											onclick={() => startEditing(item)}
											aria-label="Rediger element"
										>
											<Pencil class="h-5 w-5" />
										</button>
										<button
											class="text-red-500 hover:text-red-700 p-1"
											onclick={() => deleteItem(item.id)}
											aria-label="Slett element"
										>
											<Trash2 class="h-5 w-5" />
										</button>
									</div>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<!-- Completed items with accordion -->
		{#if $completedItems.length > 0}
			<div
				class="bg-white rounded-lg shadow-sm p-4 border border-sand/20"
				transition:fly={{ y: 20, duration: 300, delay: 150 }}
			>
				<!-- Accordion header -->
				<div
					class="flex justify-between items-center mb-3 cursor-pointer"
					onclick={toggleAccordion}
					aria-expanded={isCompletedAccordionOpen}
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Enter' && toggleAccordion()}
				>
					<h2 class="text-lg font-semibold text-charcoal flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="w-5 h-5 transition-transform duration-300 {isCompletedAccordionOpen
								? 'rotate-90'
								: ''}"
						>
							<path
								fill-rule="evenodd"
								d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
								clip-rule="evenodd"
							/>
						</svg>
						Fullførte ({$completedItems.length})
					</h2>

					<div class="flex gap-2">
						{#if $completedItems.length > 0}
							<button
								onclick={(e) => {
									e.stopPropagation();
									clearCompleted();
								}}
								class="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
								aria-label="Tøm fullførte"
							>
								Tøm liste
							</button>
						{/if}
					</div>
				</div>

				<!-- Accordion content -->
				{#if isCompletedAccordionOpen}
					<ul class="space-y-2 mt-4" transition:slide={{ duration: 300 }}>
						{#each $completedItems as item (item.id)}
							<li
								class="flex items-center gap-3 p-3 hover:bg-sand/10 transition-colors rounded-md"
								transition:slide={{ duration: 300 }}
							>
								<!-- Checkbox -->
								<button
									class="w-6 h-6 border-2 rounded-full flex items-center justify-center text-white {item.completed
										? 'bg-pine border-pine'
										: 'border-charcoal/30 hover:border-pine/70'}"
									onclick={() => toggleItem(item.id)}
									aria-label={item.completed ? 'Merk som ufullført' : 'Merk som fullført'}
								>
									{#if item.completed}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4"
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
								</button>

								<!-- Item details -->
								<div class="flex-grow">
									<div class="flex items-center">
										<span class="line-through text-charcoal/60">{item.title}</span>
										{#if item.quantity && item.quantity > 1}
											<span
												class="ml-2 px-2 py-0.5 bg-sand/20 rounded-full text-sm line-through text-charcoal/60"
											>
												{item.quantity}
											</span>
										{/if}
									</div>
									{#if item.note}
										<p class="text-sm text-charcoal/50 mt-1 line-through">{item.note}</p>
									{/if}
								</div>

								<!-- Delete button -->
								<button
									class="text-red-500/70 hover:text-red-700"
									onclick={() => deleteItem(item.id)}
									aria-label="Slett element"
								>
									<Trash2 class="h-5 w-5" />
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	{/if}
</div>
