<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-snow p-4">
	<div class="w-full max-w-md bg-white rounded-lg shadow-md p-6">
		<img src="/renomate-logo.png" alt="renomate logo" class="w-20 h-20 mx-auto" />
		<h1 class="text-2xl font-bold text-center mb-4 font-comfortaa">Verifiser din e-post</h1>

		<div class="text-center mb-8">
			<p class="text-charcoal/70 mb-4">
				Vi har sendt deg en e-post med en bekreftelseslenke. Vennligst sjekk e-posten din og klikk
				på lenken for å fullføre registreringen.
			</p>

			<p class="text-charcoal/70 mb-4">
				Hvis du ikke har mottatt e-posten, sjekk spam-mappen din eller prøv å registrere deg på
				nytt.
			</p>
		</div>

		<div class="flex justify-center">
			<button
				on:click={() => goto('/login')}
				class="py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-pine hover:bg-pine/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pine"
			>
				Tilbake til innlogging
			</button>
		</div>
	</div>
</div>
