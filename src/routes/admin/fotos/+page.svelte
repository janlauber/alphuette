<script lang="ts">
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { refreshAll } from '$app/navigation';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Star from '@lucide/svelte/icons/star';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';

	let { data, form } = $props();

	const GROUPS = [
		['', 'Keine Gruppe'],
		['draussen', 'Draussen'],
		['drinnen', 'Drinnen'],
		['winter', 'Im Winter']
	];
	const MAX = 40_000_000;
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });

	// Upload with a real progress bar: SvelteKit's enhance uses fetch, which can't report upload progress.
	let progress = $state<number | null>(null);
	let processing = $state(false);
	let tooBig = $state<string[]>([]);
	let dragging = $state(false);
	let input = $state<HTMLInputElement>();

	function upload(list: FileList | null) {
		const files = [...(list ?? [])].filter((f) => f.type.startsWith('image/'));
		tooBig = files.filter((f) => f.size > MAX).map((f) => f.name);
		const ok = files.filter((f) => f.size <= MAX);
		if (!ok.length) return;
		const body = new FormData();
		for (const f of ok) body.append('files', f);
		const xhr = new XMLHttpRequest();
		xhr.open('POST', '?/upload');
		xhr.setRequestHeader('x-sveltekit-action', 'true');
		xhr.setRequestHeader('accept', 'application/json');
		progress = 0;
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) progress = Math.round((e.loaded / e.total) * 100);
			if (e.loaded === e.total) processing = true;
		};
		xhr.onloadend = async () => {
			try {
				await applyAction(deserialize(xhr.responseText));
			} catch {
				await applyAction({ type: 'failure', status: 500, data: { failed: ok.map((f) => f.name) }, location: window.location.pathname });
			}
			await refreshAll();
			progress = null;
			processing = false;
			if (input) input.value = '';
		};
		xhr.send(body);
	}
	const busy = $derived(progress !== null);
	const days = (d: Date | string) => Math.max(0, 30 - Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000));
</script>

<AdminPage title="Fotos" intro="Die Bilder auf der Website. Das erste ist das Titelbild, die nächsten vier stehen daneben.">
	{#snippet help()}
		<ul>
			<li>Zum Hochladen ziehst du Fotos in das Feld oder tippst darauf. Mehrere auf einmal gehen auch.</li>
			<li>Standort und andere versteckte Angaben im Foto entfernt die Website beim Hochladen.</li>
			<li>Schreib zu jedem Foto einen kurzen Satz, was man sieht. Das hilft Gästen mit Screenreader und bei Google.</li>
			<li>Die Gruppe bestimmt, unter welchem Knopf das Foto in der Galerie erscheint.</li>
			<li>Englisch, Französisch und Italienisch übersetzt die Website automatisch, meist innert einer Minute.</li>
			<li>Gelöschte Fotos liegen 30 Tage im Papierkorb ganz unten. Von dort holst du sie zurück.</li>
		</ul>
	{/snippet}

	<label
		class="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-[24px] border-2 border-dashed p-6 text-center transition-colors
			focus-within:border-brand {dragging ? 'border-brand bg-wash' : 'border-line bg-paper hover:border-brand'} {busy ? 'pointer-events-none' : ''}"
		ondragover={(e) => {
			e.preventDefault();
			dragging = true;
		}}
		ondragleave={() => (dragging = false)}
		ondrop={(e) => {
			e.preventDefault();
			dragging = false;
			upload(e.dataTransfer?.files ?? null);
		}}
	>
		<input bind:this={input} type="file" accept="image/*" multiple class="sr-only" onchange={(e) => upload(e.currentTarget.files)} disabled={busy} />
		{#if busy}
			<p class="font-bold text-brand">{processing ? 'Fotos werden verkleinert und gespeichert …' : `Lädt hoch … ${progress} %`}</p>
			<div class="h-3 w-full max-w-sm overflow-hidden rounded-full bg-wash" role="progressbar" aria-valuenow={progress ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label="Hochladen">
				<div class="h-full rounded-full bg-brand transition-[width] {processing ? 'animate-pulse' : ''}" style="width: {processing ? 100 : progress}%"></div>
			</div>
		{:else}
			<span class="grid size-14 place-items-center rounded-full bg-brand text-white"><ImagePlus size={26} aria-hidden="true" /></span>
			<span class="text-lg font-bold text-brand">Fotos hierher ziehen oder antippen</span>
			<span class="text-sm text-muted">JPG, PNG oder WebP, bis 40 MB pro Foto</span>
		{/if}
	</label>
	{#if tooBig.length}<p class="mt-3 rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">Zu gross (über 40 MB): {tooBig.join(', ')}</p>{/if}
	{#if form?.failed}<p class="mt-3 rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">Nicht hochgeladen: {form.failed.join(', ')}. Ist es wirklich ein Foto?</p>{/if}

	<ul class="mt-8 grid gap-5 sm:grid-cols-2">
		{#each data.photos as p, i (p.id)}
			<li class="card flex flex-col overflow-hidden {p.hero ? '!border-brand' : ''}">
				<div class="relative">
					<img
						src="/bilder/photos/{p.key}-{p.widths.includes(960) ? 960 : 480}.webp"
						alt={p.altDe}
						width={p.width}
						height={p.height}
						loading="lazy"
						class="aspect-[4/3] w-full object-cover"
						style="background: url({p.lqip}) center / cover"
					/>
					<span class="absolute left-3 top-3 rounded-full px-3 py-1 text-sm font-bold {p.hero ? 'bg-accent text-ink' : 'bg-paper/90 text-brand'}">
						{p.hero ? 'Titelbild' : `Nr. ${i + 1}`}
					</span>
				</div>
				<div class="flex flex-1 flex-col gap-4 p-4">
					<form method="POST" action="?/save" use:enhance={keep} class="grid gap-3">
						<input type="hidden" name="id" value={p.id} />
						<label><span class="label">Was sieht man?</span>
							<input name="alt_de" value={p.altDe} placeholder="z. B. Das Hüttli im Abendlicht" class="field" />
						</label>
						<label><span class="label">Gruppe in der Galerie</span>
							<select name="category" class="field">
								{#each GROUPS as [v, l] (v)}<option value={v} selected={p.category === v}>{l}</option>{/each}
							</select>
						</label>
						<button class="btn-blue justify-self-start !min-h-11 !px-5 !py-2">Speichern</button>
					</form>
					<div class="mt-auto flex flex-wrap items-center gap-2 border-t-2 border-line pt-4">
						{#if !p.hero}
							<form method="POST" action="?/move" use:enhance class="flex gap-2">
								<input type="hidden" name="id" value={p.id} />
								<button name="dir" value="up" class="btn-line !min-h-11 !px-3 !py-2 text-sm" disabled={i === 0 || (i === 1 && data.photos[0].hero)} title="Nach vorne"><ArrowLeft size={16} aria-hidden="true" />Nach vorne</button>
								<button name="dir" value="down" class="btn-line !min-h-11 !px-3 !py-2 text-sm" disabled={i === data.photos.length - 1} title="Nach hinten">Nach hinten<ArrowRight size={16} aria-hidden="true" /></button>
							</form>
							<form method="POST" action="?/hero" use:enhance>
								<input type="hidden" name="id" value={p.id} />
								<button class="btn-line !min-h-11 !px-3 !py-2 text-sm"><Star size={16} aria-hidden="true" />Als Titelbild</button>
							</form>
						{/if}
						<form
							method="POST"
							action="?/delete"
							class="ml-auto"
							use:enhance={({ cancel }) => {
								if (!confirm('Foto in den Papierkorb legen? Du kannst es im Verlauf rückgängig machen.')) cancel();
							}}
						>
							<input type="hidden" name="id" value={p.id} />
							<button class="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-danger underline"><Trash2 size={16} aria-hidden="true" />In den Papierkorb</button>
						</form>
					</div>
				</div>
			</li>
		{:else}
			<li class="text-muted sm:col-span-2">Noch keine Fotos. Zieh oben die ersten hinein.</li>
		{/each}
	</ul>

	{#if data.trash.length}
		<section class="mt-14" aria-labelledby="papierkorb">
			<h2 id="papierkorb" class="flex items-center gap-2 text-2xl"><Trash2 size={22} aria-hidden="true" />Papierkorb</h2>
			<p class="mt-1 text-muted">Diese Fotos sind nicht mehr auf der Website. Nach 30 Tagen löscht die Website sie für immer.</p>
			<ul class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
				{#each data.trash as p (p.id)}
					<li class="overflow-hidden rounded-[18px] border-2 border-line bg-off">
						<img src="/bilder/photos/{p.key}-480.webp" alt={p.altDe} width={p.width} height={p.height} loading="lazy" class="aspect-[4/3] w-full object-cover opacity-70 grayscale" style="background: url({p.lqip}) center / cover" />
						<div class="grid gap-2 p-3">
							<p class="text-sm text-off-text">Noch {days(p.deletedAt!)} Tage</p>
							<form method="POST" action="?/restore" use:enhance>
								<input type="hidden" name="id" value={p.id} />
								<button class="btn-line w-full !min-h-11 !px-3 !py-2 text-sm"><RotateCcw size={16} aria-hidden="true" />Zurückholen</button>
							</form>
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</AdminPage>
