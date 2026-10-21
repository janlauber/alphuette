<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ImageOff from '@lucide/svelte/icons/image-off';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';

	let { data } = $props();
	const ideas = ['Schlüssel', 'Licht und Strom', 'Holzherd', 'Wasser', 'Toilette', 'Abfall', 'Bei der Abreise'];
	const cover = (g: (typeof data.guides)[number]) => g.steps.find((s) => s.photo)?.photo;
</script>

<AdminPage title="Anleitungen für Gäste" intro="Wo der Schlüssel ist, wie Licht und Holzherd gehen. Gäste sehen die Anleitungen erst, wenn du ihre Buchung bestätigt hast.">
	{#snippet help()}
		<ul>
			<li>Eine Anleitung hat einen Titel und Schritte. Jeder Schritt hat einen kurzen Text und, wenn du willst, ein Foto.</li>
			<li>Auf dem Foto tippst du auf die Stelle, die Gäste finden sollen, und schreibst ein Wort dazu, zum Beispiel «Schlüssel». Die Website zeichnet einen Kreis und das Wort hinein.</li>
			<li>Gäste sehen die Anleitungen auf ihrer Buchungsseite, aber erst nach deiner Bestätigung. Die Fotos sind nirgends sonst zu sehen.</li>
			<li>Du schreibst Deutsch. Gäste aus dem Ausland lesen es in ihrer Sprache.</li>
		</ul>
	{/snippet}

	<ol class="grid max-w-3xl gap-3">
		{#each data.guides as g, i (g.id)}
			<li class="card grid grid-cols-[72px_minmax(0,1fr)] items-center gap-4 p-3 sm:grid-cols-[96px_minmax(0,1fr)_auto]">
				<a href="/admin/anleitungen/{g.id}" class="block aspect-square overflow-hidden rounded-[12px] bg-wash" aria-label="«{g.title}» bearbeiten">
					{#if cover(g)}<img src="/admin/anleitungen/foto/{cover(g)}" alt="" class="size-full object-cover" />{:else}<span class="grid size-full place-items-center text-muted"><ImageOff size={22} aria-hidden="true" /></span>{/if}
				</a>
				<div class="min-w-0">
					<a href="/admin/anleitungen/{g.id}" class="text-xl font-bold text-brand no-underline hover:underline">{g.title}</a>
					<p class="mt-1 text-sm text-muted">{g.steps.length === 1 ? '1 Schritt' : `${g.steps.length} Schritte`}{g.steps.length ? '' : ', Gäste sehen sie noch nicht'}</p>
				</div>
				<div class="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1">
					<a href="/admin/anleitungen/{g.id}" class="btn-blue !min-h-11 !px-4 !py-2 text-sm no-underline"><Pencil size={16} aria-hidden="true" />Bearbeiten</a>
					<form method="POST" action="?/move" use:enhance class="flex gap-2">
						<input type="hidden" name="id" value={g.id} />
						<button name="dir" value="up" disabled={i === 0} class="grid size-11 place-items-center rounded-full border-2 border-brand text-brand hover:bg-wash disabled:opacity-25" aria-label="«{g.title}» nach oben"><ArrowUp size={18} /></button>
						<button name="dir" value="down" disabled={i === data.guides.length - 1} class="grid size-11 place-items-center rounded-full border-2 border-brand text-brand hover:bg-wash disabled:opacity-25" aria-label="«{g.title}» nach unten"><ArrowDown size={18} /></button>
					</form>
				</div>
			</li>
		{:else}
			<li class="card p-6 text-muted">Noch keine Anleitung. Tipp unten auf ein Thema oder gib einen eigenen Titel ein.</li>
		{/each}
	</ol>

	<form method="POST" action="?/create" class="mt-8 max-w-3xl">
		<label class="label" for="new-title">Neue Anleitung</label>
		<div class="mt-2 flex flex-wrap gap-3">
			<input id="new-title" name="title" class="field min-w-0 flex-1" placeholder="z. B. Holzherd anfeuern" maxlength="80" />
			<button class="btn-primary"><Plus size={18} aria-hidden="true" />Anlegen</button>
		</div>
	</form>
	<form method="POST" action="?/create" class="mt-4 max-w-3xl">
		<p class="font-semibold">Oder ein Thema antippen</p>
		<div class="mt-2 flex flex-wrap gap-2">
			{#each ideas.filter((x) => !data.guides.some((g) => g.title === x)) as x (x)}
				<button name="title" value={x} class="rounded-full border-2 border-brand px-3 py-1.5 text-sm font-semibold text-brand hover:bg-wash">{x}</button>
			{/each}
		</div>
	</form>
</AdminPage>
