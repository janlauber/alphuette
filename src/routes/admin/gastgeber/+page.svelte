<script lang="ts">
	import { confirmFirst } from '#lib/confirm.svelte.ts';
	import { enhance } from '$app/forms';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';

	let { data, form } = $props();
	let busy = $state(false);
</script>

<AdminPage title="Gastgeber und Zahlung" intro="Wer vermietet, wohin Gäste schreiben, und auf welches Konto sie zahlen.">
	{#snippet help()}
		<ul>
			<li>Diese Angaben stehen im Impressum, auf der QR-Rechnung und in den Mails an Gäste.</li>
			<li>Ohne IBAN gibt es keine QR-Rechnung. Es geht nur ein Konto bei einer Bank in der Schweiz oder in Liechtenstein.</li>
			<li>Die E-Mail für Gäste ist die Adresse, die auf der Website steht. Wohin Mails an diese Adresse weitergeleitet werden, stellst du unter <a href="/admin/mails">Mails</a> ein.</li>
		</ul>
	{/snippet}

	{#if data.missing.length}
		<p class="mb-6 rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">Für die QR-Rechnung fehlt noch: {data.missing.join(', ')}. Ohne diese Angaben bekommen bestätigte Gäste keine Rechnung.</p>
	{/if}

	<form
		method="POST"
		use:enhance={confirmFirst(
			({ formData }) =>
				String(formData.get('iban') ?? '').replace(/\s/g, '') !== data.host.iban.replace(/\s/g, '')
					? { title: 'IBAN ändern?', text: 'Alle QR-Rechnungen zeigen ab jetzt dieses Konto, auch offene, wenn Gäste sie neu öffnen. Prüf die Nummer bitte genau.', ok: 'Ja, IBAN ändern' }
					: null,
			() => {
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
				};
			}
		)}
		class="grid gap-6"
	>
		<section class="card grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
			<h2 class="text-xl sm:col-span-2">Hüttli und Gastgeber</h2>
			<label class="label sm:col-span-2">Name des Hüttli <input name="name" value={data.name} class="field mt-1 font-normal" /></label>
			<label class="label">Dein Name <span class="hint block text-sm font-normal">Gäste lesen «{data.host.name.split(' ')[0] || 'Tom'} ist dein Gastgeber».</span><input name="hostName" value={data.host.name} class="field mt-1 font-normal" /></label>
			<label class="label">E-Mail für Gäste <span class="hint block text-sm font-normal">Steht auf der Website und im Impressum.</span><input name="email" type="email" value={data.host.email} class="field mt-1 font-normal" /></label>
			<label class="label">Strasse und Nr. <input name="street" value={data.host.street} class="field mt-1 font-normal" /></label>
			<div class="grid grid-cols-[6rem_1fr] gap-3">
				<label class="label">PLZ <input name="zip" value={data.host.zip} inputmode="numeric" class="field mt-1 font-normal" /></label>
				<label class="label">Ort <input name="city" value={data.host.city} class="field mt-1 font-normal" /></label>
			</div>
			<label class="label sm:col-span-2">WhatsApp-Nummer <span class="hint block text-sm font-normal">Leer lassen, wenn Gäste dich nicht per WhatsApp erreichen sollen.</span><input name="whatsapp" type="tel" value={data.host.whatsapp} placeholder="079 123 45 67" class="field mt-1 font-normal" /></label>
		</section>

		<section class="card-strong grid gap-3 p-4 sm:p-5">
			<h2 class="text-xl">Zahlung</h2>
			<label class="label">IBAN für die QR-Rechnung
				<span class="hint block text-sm font-normal">Dein Konto bei einer Schweizer Bank. Gäste zahlen mit der QR-Rechnung direkt darauf.</span>
				<input name="iban" value={data.host.iban} placeholder="CH00 0000 0000 0000 0000 0" class="field mt-1 font-normal" aria-invalid={form?.error ? 'true' : undefined} />
			</label>
			<p class="hint text-sm">Auf der Rechnung stehen dein Name und deine Adresse von oben als Empfänger. Strasse, PLZ und Ort braucht die QR-Rechnung zwingend.</p>
		</section>

		<section class="card grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
			<h2 class="text-xl sm:col-span-2">Punkt auf der Karte</h2>
			<label class="label">Breitengrad <input name="lat" inputmode="decimal" value={data.host.lat} class="field mt-1 font-normal" /></label>
			<label class="label">Längengrad <input name="lon" inputmode="decimal" value={data.host.lon} class="field mt-1 font-normal" /></label>
			<p class="hint text-sm sm:col-span-2">Die Karte auf der Website zeigt diesen Punkt. Er muss nicht genau beim Hüttli liegen. Die genaue Lage gehört in die Infos für bestätigte Gäste.</p>
		</section>

		{#if form?.error}<p class="rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">{form.error}</p>{/if}
		<div><button class="btn-blue" disabled={busy}>{busy ? 'Speichert …' : 'Speichern'}</button></div>
	</form>
</AdminPage>
