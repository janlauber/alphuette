<script lang="ts">
	import { enhance } from '$app/forms';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';
	import TextPreview from '#lib/components/admin/TextPreview.svelte';
	import Stars from '#lib/components/Stars.svelte';
	import { fmtDate } from '#lib/i18n.ts';

	let { data } = $props();
	const waiting = $derived(data.reviews.filter((r) => !r.approved));
	const shown = $derived(data.reviews.filter((r) => r.approved));
	// replies being typed, for the preview
	let replies = $state<Record<number, string>>({});
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
	const written = (d: Date | string) => new Date(d).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Zurich' });
</script>

{#snippet review(r: (typeof data.reviews)[number])}
	<li class="card flex flex-col gap-4 p-5 {r.approved ? '' : '!border-accent'}">
		<div class="flex flex-wrap items-start justify-between gap-3">
			<div>
				<p class="flex flex-wrap items-center gap-2"><Stars value={r.rating} size={20} label="{r.rating} von 5 Sternen" /><strong class="text-lg text-ink">{r.name}</strong></p>
				<p class="mt-1 text-sm text-muted">
					Geschrieben am {written(r.createdAt)}{#if r.stay}, Aufenthalt ab {fmtDate(r.stay, 'de', { weekday: undefined })}{/if}
					{#if r.bookingId}· <a href="/admin/buchungen/{r.bookingId}">Buchung von {r.guest}</a>{/if}
				</p>
			</div>
			<span class="chip {r.approved ? 'chip-ok' : 'chip-wait'}">{r.approved ? 'Auf der Website' : 'Wartet auf dich'}</span>
		</div>
		<blockquote class="whitespace-pre-line rounded-[16px] bg-wash px-4 py-3 text-ink">{r.body}</blockquote>

		<details class="group" open={!!r.reply}>
			<summary class="flex min-h-11 cursor-pointer list-none items-center font-semibold text-brand [&::-webkit-details-marker]:hidden">
				{r.reply ? 'Deine Antwort' : 'Antworten'} <span class="ml-2 text-sm font-normal text-muted">(freiwillig, steht unter dem Eintrag)</span>
			</summary>
			<form method="POST" action="?/reply" use:enhance={keep} class="mt-2 grid gap-3">
				<input type="hidden" name="id" value={r.id} />
				<label class="sr-only" for="reply-{r.id}">Deine Antwort</label>
				<textarea
					id="reply-{r.id}"
					name="reply"
					rows="3"
					class="field"
					placeholder="Danke für den schönen Eintrag!"
					value={replies[r.id] ?? r.reply ?? ''}
					oninput={(e) => (replies[r.id] = e.currentTarget.value)}
				></textarea>
				{#if (replies[r.id] ?? r.reply ?? '').trim()}<TextPreview text={replies[r.id] ?? r.reply ?? ''} />{/if}
				<button class="btn-blue justify-self-start !min-h-11 !px-5 !py-2">Antwort speichern</button>
			</form>
		</details>

		<div class="flex flex-wrap items-center gap-3 border-t-2 border-line pt-4">
			<form method="POST" action="?/approve" use:enhance>
				<input type="hidden" name="id" value={r.id} />
				{#if r.approved}
					<button name="approved" value="0" class="btn-line !min-h-11 !px-4 !py-2 text-sm"><EyeOff size={16} aria-hidden="true" />Verstecken</button>
				{:else}
					<button name="approved" value="1" class="btn-primary !min-h-11 !px-5 !py-2"><Eye size={18} aria-hidden="true" />Auf der Website zeigen</button>
				{/if}
			</form>
			<form
				method="POST"
				action="?/delete"
				class="ml-auto"
				use:enhance={({ cancel }) => {
					if (!confirm(`Eintrag von ${r.name} löschen? Du kannst es im Verlauf rückgängig machen.`)) cancel();
				}}
			>
				<input type="hidden" name="id" value={r.id} />
				<button class="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-danger underline"><Trash2 size={16} aria-hidden="true" />Löschen</button>
			</form>
		</div>
	</li>
{/snippet}

<AdminPage title="Gästebuch" intro="Was Gäste über ihren Aufenthalt schreiben. Ein Eintrag erscheint erst, wenn du ihn zeigst.">
	{#snippet help()}
		<ul>
			<li>Am Tag nach der Abreise bekommen Gäste eine Mail mit der Bitte um ein paar Zeilen.</li>
			<li>Neue Einträge stehen oben. Mit «Auf der Website zeigen» erscheinen sie auf der Startseite.</li>
			<li>Mit «Verstecken» nimmst du einen Eintrag wieder weg, ohne ihn zu löschen.</li>
			<li>Gäste schreiben in ihrer Sprache. Der Eintrag erscheint so, wie sie ihn geschrieben haben.</li>
		</ul>
	{/snippet}

	{#if waiting.length}
		<section aria-labelledby="neu">
			<h2 id="neu" class="text-2xl">Neu ({waiting.length})</h2>
			<ul class="mt-4 grid gap-4">{#each waiting as r (r.id)}{@render review(r)}{/each}</ul>
		</section>
	{/if}
	<section class={waiting.length ? 'mt-12' : ''} aria-labelledby="online">
		<h2 id="online" class="text-2xl">Auf der Website ({shown.length})</h2>
		<ul class="mt-4 grid gap-4">
			{#each shown as r (r.id)}{@render review(r)}{:else}<li class="text-muted">Noch keine Einträge auf der Website.</li>{/each}
		</ul>
	</section>
</AdminPage>
