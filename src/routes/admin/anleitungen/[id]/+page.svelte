<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import X from '@lucide/svelte/icons/x';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';
	import GuidePhoto from '#lib/components/GuidePhoto.svelte';
	import type { Step } from '#lib/guides.ts';

	let { data } = $props();
	const blank = (): Step => ({ text: '', marks: [], photo: null });
	// svelte-ignore state_referenced_locally
	let title = $state(data.guide.title);
	// svelte-ignore state_referenced_locally
	let steps = $state<Step[]>(data.guide.steps.length ? JSON.parse(JSON.stringify(data.guide.steps)) : [blank()]);
	let busy = $state(false);
	let uploading = $state<number | null>(null);
	let problem = $state('');

	const move = (i: number, d: number) => ([steps[i], steps[i + d]] = [steps[i + d], steps[i]]);

	async function upload(i: number, input: HTMLInputElement) {
		const file = input.files?.[0];
		if (!file) return;
		uploading = i;
		problem = '';
		const body = new FormData();
		body.append('photo', file);
		const res = await fetch('/admin/anleitungen/foto', { method: 'POST', body }).catch(() => null);
		uploading = null;
		input.value = '';
		if (!res?.ok) {
			problem = 'Das Foto liess sich nicht hochladen. Versuch es nochmals oder mit einem anderen Foto.';
			return;
		}
		steps[i].photo = (await res.json()).key;
		steps[i].marks = [];
	}

	async function mark(i: number, x: number, y: number) {
		steps[i].marks.push({ x, y, label: '' });
		await tick();
		document.getElementById(`mark-${i}-${steps[i].marks.length - 1}`)?.focus();
	}
</script>

<AdminPage title={title || 'Anleitung'} intro="Gäste sehen diese Anleitung auf ihrer Buchungsseite, sobald du die Buchung bestätigt hast.">
	{#snippet actions()}
		<a href="/admin/anleitungen" class="btn-line no-underline"><ArrowLeft size={18} aria-hidden="true" />Alle Anleitungen</a>
	{/snippet}
	{#snippet help()}
		<ul>
			<li>Pro Schritt ein kurzer Text, zum Beispiel «Der Schlüssel liegt auf dem Balken über der Tür.»</li>
			<li>«Foto hinzufügen» öffnet auf dem Handy die Kamera oder deine Fotos.</li>
			<li>Tipp auf dem Foto auf die Stelle, die Gäste finden sollen. Es erscheint ein Kreis. Darunter schreibst du ein Wort dazu, zum Beispiel «Schlüssel» oder «Lichtschalter». Mit dem X entfernst du einen Kreis wieder.</li>
			<li>Erst «Speichern» übernimmt alles.</li>
		</ul>
	{/snippet}

	<form
		method="POST"
		action="?/save"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update({ reset: false });
				busy = false;
			};
		}}
		class="grid max-w-3xl gap-5"
	>
		<div>
			<label class="label" for="title">Titel</label>
			<input id="title" name="title" bind:value={title} class="field mt-2 w-full text-lg font-semibold" maxlength="80" required />
		</div>
		<input type="hidden" name="steps" value={JSON.stringify(steps)} />

		{#each steps as step, i (i)}
			<section class="card grid gap-4 p-4" aria-label="Schritt {i + 1}">
				<div class="flex items-center gap-3">
					<span class="grid size-9 shrink-0 place-items-center rounded-full bg-wash font-bold text-brand" aria-hidden="true">{i + 1}</span>
					<p class="font-bold">Schritt {i + 1}</p>
					<div class="ml-auto flex gap-1">
						<button type="button" class="grid size-10 place-items-center rounded-full text-brand hover:bg-wash disabled:opacity-30" disabled={i === 0} onclick={() => move(i, -1)} aria-label="Schritt {i + 1} nach oben"><ArrowUp size={18} /></button>
						<button type="button" class="grid size-10 place-items-center rounded-full text-brand hover:bg-wash disabled:opacity-30" disabled={i === steps.length - 1} onclick={() => move(i, 1)} aria-label="Schritt {i + 1} nach unten"><ArrowDown size={18} /></button>
						<button type="button" class="grid size-10 place-items-center rounded-full text-muted hover:bg-danger-wash hover:text-danger" onclick={() => steps.splice(i, 1)} aria-label="Schritt {i + 1} entfernen"><Trash2 size={18} /></button>
					</div>
				</div>

				{#if step.photo}
					<div>
						<GuidePhoto src="/admin/anleitungen/foto/{step.photo}" marks={step.marks} onpick={(x, y) => mark(i, x, y)} />
						<p class="mt-2 text-sm text-muted">Tipp auf die Stelle, die Gäste finden sollen.</p>
					</div>
					{#if step.marks.length}
						<ul class="grid gap-2">
							{#each step.marks as m, j (j)}
								<li class="flex items-center gap-2">
									<span class="size-6 shrink-0 rounded-full border-4 border-accent" aria-hidden="true"></span>
									<label class="sr-only" for="mark-{i}-{j}">Wort zu Markierung {j + 1}</label>
									<input id="mark-{i}-{j}" bind:value={m.label} class="field min-w-0 flex-1" placeholder="z. B. Schlüssel" maxlength="40" />
									<button type="button" class="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-danger-wash hover:text-danger" onclick={() => step.marks.splice(j, 1)} aria-label="Markierung {j + 1} entfernen"><X size={18} /></button>
								</li>
							{/each}
						</ul>
					{/if}
				{/if}

				<div class="flex flex-wrap gap-3">
					<label class="btn-line cursor-pointer {uploading === i ? 'opacity-60' : ''}">
						<ImagePlus size={18} aria-hidden="true" />{uploading === i ? 'Lädt hoch …' : step.photo ? 'Anderes Foto' : 'Foto hinzufügen'}
						<input type="file" accept="image/*" class="sr-only" disabled={uploading !== null} onchange={(e) => upload(i, e.currentTarget)} />
					</label>
					{#if step.photo}
						<button type="button" class="text-sm font-semibold text-brand underline" onclick={() => ((step.photo = null), (step.marks = []))}>Foto entfernen</button>
					{/if}
				</div>

				<div>
					<label class="label" for="text-{i}">Text</label>
					<textarea id="text-{i}" bind:value={step.text} rows="3" class="field mt-2 w-full resize-none leading-relaxed [field-sizing:content]" placeholder="z. B. Der Schlüssel liegt auf dem Balken über der Tür." maxlength="2000"></textarea>
				</div>
			</section>
		{/each}

		{#if problem}<p class="rounded-[14px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">{problem}</p>{/if}

		<div class="flex flex-wrap gap-3">
			<button type="button" class="btn-line" onclick={() => steps.push(blank())}><Plus size={18} aria-hidden="true" />Schritt hinzufügen</button>
			<button class="btn-blue" disabled={busy || uploading !== null}>{busy ? 'Speichert …' : 'Speichern'}</button>
		</div>
	</form>

	<form method="POST" action="?/delete" class="mt-12 max-w-3xl border-t-2 border-line pt-6" onsubmit={(e) => confirm(`Anleitung «${data.guide.title}» löschen? Im Verlauf lässt es sich rückgängig machen.`) || e.preventDefault()}>
		<button class="text-sm font-semibold text-danger underline">Anleitung löschen</button>
	</form>
</AdminPage>
