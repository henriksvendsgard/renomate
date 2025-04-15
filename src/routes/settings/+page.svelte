<script lang="ts">
	import { onMount } from 'svelte';
	import { exportData, importData, clearAllData } from '$lib/services/data';

	// Variable to track if the app is installed
	let isInstalled = false;
	// Variable to track if the app can be installed
	let canInstallPWA = false;
	// Deferred installation prompt
	let deferredPrompt: any;

	// Message for user feedback
	let message = { text: '', type: '' };
	// File input reference for importing data
	let fileInput: HTMLInputElement | null = null;
	// Advanced settings accordion state
	let isAdvancedOpen = false;

	// Check if app is installed
	function checkIfInstalled() {
		// PWA is installed if in standalone mode or fullscreen
		if (
			window.matchMedia('(display-mode: standalone)').matches ||
			window.matchMedia('(display-mode: fullscreen)').matches ||
			(window.navigator as any).standalone === true
		) {
			isInstalled = true;
		}
	}

	// Install the PWA
	async function installPWA() {
		if (!deferredPrompt) return;

		// Show installation prompt
		deferredPrompt.prompt();

		// Wait for user response
		const choiceResult = await deferredPrompt.userChoice;

		// User accepted installation
		if (choiceResult.outcome === 'accepted') {
			console.log('User accepted the installation');
			canInstallPWA = false;
			isInstalled = true;
		}

		// Clear the deferred prompt
		deferredPrompt = null;
	}

	// Export app data
	async function handleExportData() {
		try {
			const jsonData = await exportData();

			// Create a download link
			const blob = new Blob([jsonData], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');

			// Set up file download
			a.href = url;
			a.download = `oppuss-backup-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();

			// Clean up
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			// Show success message
			showMessage('Data ble eksportert!', 'success');
		} catch (error) {
			console.error('Error exporting data:', error);
			showMessage('Kunne ikke eksportere data', 'error');
		}
	}

	// Trigger file input to import data
	function handleImportClick() {
		if (fileInput) {
			fileInput.click();
		}
	}

	// Handle file selection for import
	async function handleFileSelect() {
		if (!fileInput?.files || fileInput.files.length === 0) return;

		const file = fileInput.files[0];
		if (file.type !== 'application/json') {
			showMessage('Vennligst velg en JSON-fil', 'error');
			return;
		}

		// Read the file
		const reader = new FileReader();
		reader.onload = async (e) => {
			try {
				const jsonString = e.target?.result as string;
				const result = await importData(jsonString);

				if (result.success) {
					showMessage(result.message, 'success');
				} else {
					showMessage(result.message, 'error');
				}
			} catch (error) {
				console.error('Error processing file:', error);
				showMessage('Kunne ikke behandle importfilen', 'error');
			}

			// Reset file input
			if (fileInput) {
				fileInput.value = '';
			}
		};

		reader.onerror = () => {
			showMessage('Feil ved lesing av fil', 'error');
		};

		reader.readAsText(file);
	}

	// Clear all app data
	async function handleClearData() {
		if (confirm('Er du sikker på at du vil slette ALLE data? Dette kan ikke angres!')) {
			try {
				const result = await clearAllData();

				if (result.success) {
					showMessage(result.message, 'success');
				} else {
					showMessage(result.message, 'error');
				}
			} catch (error) {
				console.error('Error clearing data:', error);
				showMessage('Kunne ikke slette data', 'error');
			}
		}
	}

	// Show a message to the user
	function showMessage(text: string, type: 'success' | 'error') {
		message = { text, type };

		// Clear message after 5 seconds
		setTimeout(() => {
			message = { text: '', type: '' };
		}, 5000);
	}

	// Toggle advanced settings
	function toggleAdvanced() {
		isAdvancedOpen = !isAdvancedOpen;
	}

	onMount(() => {
		// Check if app is already installed
		checkIfInstalled();

		// Listen for beforeinstallprompt event
		window.addEventListener('beforeinstallprompt', (e) => {
			// Prevent Chrome 67+ from automatically showing the prompt
			e.preventDefault();

			// Store the event for later use
			deferredPrompt = e;
			canInstallPWA = true;
		});

		// Listen for app installation
		window.addEventListener('appinstalled', () => {
			isInstalled = true;
			canInstallPWA = false;
			console.log('PWA was installed');
		});
	});
</script>

<div class="max-w-6xl mx-auto px-4 py-8">
	<h1 class="text-2xl font-bold mb-4">Innstillinger</h1>

	<div class="bg-white rounded-lg shadow p-6 mb-8">
		<p class="text-charcoal/80 mb-4">
			Velkommen til innstillingene for Oppuss! Her kan du tilpasse appen etter dine behov og
			administrere dine data.
		</p>
		<p class="text-charcoal/70 text-sm">
			Oppuss er designet for å være enkel å bruke, samtidig som den gir deg full kontroll over dine
			oppussingsprosjekter. Vi jobber kontinuerlig med å forbedre appen og legge til nye funksjoner.
		</p>
	</div>

	<!-- App Installation -->
	{#if !isInstalled && canInstallPWA}
		<div class="bg-white rounded-lg shadow p-6 mb-8">
			<h2 class="text-xl font-semibold mb-4">Installer app</h2>
			<p class="text-charcoal/70 mb-4">
				Installer Oppuss som en app på enheten din for bedre ytelse og offline-tilgang.
			</p>
			<button on:click={installPWA} class="btn btn-primary inline-flex items-center gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
				Installer app
			</button>
		</div>
	{/if}

	<!-- Advanced Settings Accordion -->
	<div class="bg-white rounded-lg shadow overflow-hidden">
		<button
			class="w-full p-6 text-left flex justify-between items-center focus:outline-none"
			on:click={toggleAdvanced}
			aria-expanded={isAdvancedOpen}
		>
			<div>
				<h2 class="text-xl font-semibold">Avanserte innstillinger</h2>
				<p class="text-sm text-charcoal/70 mt-1">
					Administrer data, sikkerhetskopier og gjenoppretting
				</p>
			</div>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 transform transition-transform duration-200 {isAdvancedOpen
					? 'rotate-180'
					: ''}"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
					clip-rule="evenodd"
				/>
			</svg>
		</button>

		{#if isAdvancedOpen}
			<div class="px-6 pb-6 border-t border-sand/20">
				<div class="space-y-4 mt-4">
					<div>
						<button
							on:click={handleExportData}
							class="btn btn-primary inline-flex items-center gap-2"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
							Eksporter data
						</button>
						<p class="mt-2 text-sm text-charcoal/70">
							Last ned en sikkerhetskopi av alle dine rom og oppgaver
						</p>
					</div>

					<div>
						<button
							on:click={handleImportClick}
							class="btn btn-primary inline-flex items-center gap-2"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
							Importer data
						</button>
						<p class="mt-2 text-sm text-charcoal/70">
							Gjenopprett data fra en tidligere sikkerhetskopi
						</p>
						<input
							type="file"
							bind:this={fileInput}
							on:change={handleFileSelect}
							accept="application/json"
							class="hidden"
						/>
					</div>

					<div>
						<button
							on:click={handleClearData}
							class="btn bg-red-500/10 text-red-600 hover:bg-red-500/20 inline-flex items-center gap-2"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
									clip-rule="evenodd"
								/>
							</svg>
							Slett alle data
						</button>
						<p class="mt-2 text-sm text-charcoal/70">
							Slett alle rom og oppgaver permanent (kan ikke angres)
						</p>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- User Messages -->
	{#if message.text}
		<div
			class="fixed bottom-20 right-4 p-4 rounded-lg shadow-lg {message.type === 'success'
				? 'bg-pine text-white'
				: 'bg-red-500 text-white'}"
			role="alert"
		>
			{message.text}
		</div>
	{/if}

	<!-- Footer Attribution -->
	<div class="mt-12 text-center text-charcoal/60 text-sm">Bygget med ❤️ av Henrik og Sofie</div>
</div>
