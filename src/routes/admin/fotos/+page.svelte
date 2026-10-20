<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let uploading = $state(false);
</script>

<h1 class="text-3xl">Fotos</h1>
<p class="mt-1 text-stein">Das Titelbild steht auf der Website gross am Anfang, die nächsten vier daneben.</p>

<form
	method="POST"
	action="?/upload"
	enctype="multipart/form-data"
	class="mt-6 flex flex-wrap items-center gap-3 rounded-[3px] border border-dashed border-stein bg-paper p-4"
	use:enhance={() => {
		uploading = true;
		return async ({ update }) => {
			await update();
			uploading = false;
		};
	}}
>
	<label class="label mb-0" for="files">Neue Fotos</label>
	<input id="files" name="files" type="file" accept="image/*" multiple required class="text-sm" />
	<button class="btn-gelb !py-2" disabled={uploading}>{uploading ? 'Lädt hoch …' : 'Hochladen'}</button>
	<p class="w-full text-sm text-stein">JPG, PNG oder WebP. Standort und andere Metadaten werden beim Hochladen entfernt.</p>
	{#if form?.failed}<p class="w-full text-rot" role="alert">Nicht hochgeladen: {form.failed.join(', ')}</p>{/if}
	{#if form?.uploaded}<p class="w-full text-moos">{form.uploaded} Fotos hochgeladen.</p>{/if}
</form>

<ul class="mt-8 grid gap-4">
	{#each data.photos as p, i (p.id)}
		<li class="grid gap-4 rounded-[3px] border border-linie bg-paper p-3 sm:grid-cols-[180px_1fr]">
			<img
				src="/bilder/photos/{p.key}-480.webp"
				alt={p.altDe}
				width={p.width}
				height={p.height}
				loading="lazy"
				class="aspect-[4/3] w-full rounded-[2px] object-cover"
				style="background: url({p.lqip}) center / cover"
			/>
			<div>
				<form method="POST" action="?/save" use:enhance={() => async ({ update }) => update({ reset: false })} class="grid gap-2">
					<input type="hidden" name="id" value={p.id} />
					<label class="text-sm font-semibold">Beschreibung Deutsch <input name="alt_de" value={p.altDe} class="field mt-1 font-normal" /></label>
					<label class="text-sm font-semibold">Beschreibung Englisch <input name="alt_en" value={p.altEn} class="field mt-1 font-normal" /></label>
					<div class="flex items-center gap-3">
						<button class="btn-line !py-1 text-sm">Speichern</button>
						{#if form?.saved === p.id}<span class="text-sm text-moos">Gespeichert</span>{/if}
					</div>
				</form>
				<div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
					{#if p.hero}
						<span class="rounded-[3px] bg-gelb px-2 py-1 font-semibold">Titelbild</span>
					{:else}
						<form method="POST" action="?/hero" use:enhance><input type="hidden" name="id" value={p.id} /><button class="underline">Als Titelbild</button></form>
						<form method="POST" action="?/move" use:enhance>
							<input type="hidden" name="id" value={p.id} />
							<button name="dir" value="up" class="rounded border border-linie px-2 py-0.5 disabled:opacity-30" disabled={i <= 1} aria-label="Nach vorne">↑</button>
							<button name="dir" value="down" class="rounded border border-linie px-2 py-0.5 disabled:opacity-30" disabled={i === data.photos.length - 1} aria-label="Nach hinten">↓</button>
						</form>
					{/if}
					<form
						method="POST"
						action="?/delete"
						class="ml-auto"
						use:enhance={({ cancel }) => {
							if (!confirm('Foto löschen?')) cancel();
						}}
					>
						<input type="hidden" name="id" value={p.id} /><button class="text-rot underline">Löschen</button>
					</form>
				</div>
			</div>
		</li>
	{:else}
		<li class="text-stein">Noch keine Fotos. Lade oben die ersten hoch.</li>
	{/each}
</ul>
