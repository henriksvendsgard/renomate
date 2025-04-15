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
	let fileInput: HTMLInputElement;

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
			showMessage('Data exported successfully!', 'success');
		} catch (error) {
			console.error('Error exporting data:', error);
			showMessage('Failed to export data', 'error');
		}
	}

	// Trigger file input to import data
	function triggerImportData() {
		fileInput.click();
	}

	// Handle file selection for import
	async function handleFileSelect() {
		if (!fileInput.files || fileInput.files.length === 0) return;

		const file = fileInput.files[0];
		if (file.type !== 'application/json') {
			showMessage('Please select a JSON file', 'error');
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
				showMessage('Failed to process the import file', 'error');
			}

			// Reset file input
			fileInput.value = '';
		};

		reader.onerror = () => {
			showMessage('Error reading file', 'error');
		};

		reader.readAsText(file);
	}

	// Clear all app data
	async function handleClearData() {
		if (confirm('Are you sure you want to delete ALL your data? This cannot be undone!')) {
			try {
				const result = await clearAllData();

				if (result.success) {
					showMessage(result.message, 'success');
				} else {
					showMessage(result.message, 'error');
				}
			} catch (error) {
				console.error('Error clearing data:', error);
				showMessage('Failed to clear data', 'error');
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

<div class="max-w-6xl mx-auto p-4 sm:p-6">
	<!-- Back button -->
	<div class="mb-6">
		<a href="/" class="inline-flex items-center text-clay hover:text-charcoal transition-colors">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 mr-1"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
					clip-rule="evenodd"
				/>
			</svg>
			<span>Back to Dashboard</span>
		</a>
	</div>

	<header class="mb-8">
		<h1 class="text-2xl font-bold text-charcoal">Settings</h1>
		<p class="text-charcoal/70 mt-1">Manage your app preferences</p>
	</header>

	<!-- Message display -->
	{#if message.text}
		<div
			class="mb-6 p-3 rounded-lg {message.type === 'success'
				? 'bg-pine/20 text-pine'
				: 'bg-red-500/20 text-red-600'}"
		>
			{message.text}
		</div>
	{/if}

	<!-- Settings Sections -->
	<div class="space-y-8">
		<!-- PWA Installation -->
		<section class="bg-white rounded-lg border border-sand/20 p-6 shadow-sm">
			<h2 class="text-lg font-medium text-charcoal mb-4">App Installation</h2>

			{#if isInstalled}
				<div class="flex items-center text-pine">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 mr-2"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>Oppuss is installed as an app on your device!</span>
				</div>
			{:else if canInstallPWA}
				<div>
					<p class="mb-4">
						Install Oppuss on your device to use it offline and get a better experience.
					</p>
					<button on:click={installPWA} class="btn btn-primary"> Install App </button>
				</div>
			{:else}
				<p>
					Oppuss can be installed as an app on your device. For installation instructions, visit
					this page using a supported browser on your mobile device or desktop.
				</p>
			{/if}
		</section>

		<!-- Data Management -->
		<section class="bg-white rounded-lg border border-sand/20 p-6 shadow-sm">
			<h2 class="text-lg font-medium text-charcoal mb-4">Data Management</h2>

			<div class="mb-6">
				<p class="mb-2">Your data is stored locally on your device using IndexedDB.</p>
				<p class="text-charcoal/70 text-sm">
					This allows Oppuss to work offline and keep your renovation data private.
				</p>
			</div>

			<details class="bg-sand/10 p-4 rounded-lg">
				<summary class="cursor-pointer font-medium">Advanced Options</summary>
				<div class="mt-4 space-y-4">
					<div>
						<h3 class="text-sm font-medium text-charcoal mb-1">Export Data</h3>
						<p class="text-sm text-charcoal/70 mb-2">
							Export your data as a JSON file for backup purposes.
						</p>
						<button
							on:click={handleExportData}
							class="btn bg-sand/20 text-charcoal hover:bg-sand/40 text-sm"
						>
							Export Data
						</button>
					</div>

					<div>
						<h3 class="text-sm font-medium text-charcoal mb-1">Import Data</h3>
						<p class="text-sm text-charcoal/70 mb-2">Import previously exported data.</p>
						<button
							on:click={triggerImportData}
							class="btn bg-sand/20 text-charcoal hover:bg-sand/40 text-sm"
						>
							Import Data
						</button>
						<input
							type="file"
							bind:this={fileInput}
							on:change={handleFileSelect}
							accept="application/json"
							class="hidden"
						/>
					</div>

					<div>
						<h3 class="text-sm font-medium text-red-600 mb-1">Clear All Data</h3>
						<p class="text-sm text-charcoal/70 mb-2">
							Delete all your rooms and tasks from this device. This action cannot be undone.
						</p>
						<button
							on:click={handleClearData}
							class="btn bg-red-500/10 text-red-600 hover:bg-red-500/20 text-sm"
						>
							Clear All Data
						</button>
					</div>
				</div>
			</details>
		</section>

		<!-- About -->
		<section class="bg-white rounded-lg border border-sand/20 p-6 shadow-sm">
			<h2 class="text-lg font-medium text-charcoal mb-4">About Oppuss</h2>

			<p class="mb-2">
				Oppuss is a minimalist and collaborative renovation planning app designed for couples or
				homeowners.
			</p>
			<p class="text-charcoal/70">
				Built as a PWA, it works offline and syncs your renovation tasks, budgets, and progress room
				by room.
			</p>

			<div class="mt-6 pt-4 border-t border-sand/20 text-sm text-charcoal/60">
				<p>Version 1.0.0</p>
				<p class="mt-1">Made with ❤️ by two people renovating their first home together.</p>
			</div>
		</section>
	</div>
</div>
