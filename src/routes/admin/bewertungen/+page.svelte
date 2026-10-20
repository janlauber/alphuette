<script lang="ts">
	import { enhance } from '$app/forms';
	import Stars from '#lib/components/Stars.svelte';
	import { fmtDate } from '#lib/i18n.ts';

	let { data, form } = $props();
</script>

<h1 class="text-3xl">Gästebuch</h1>
<p class="mt-1 text-stein">Gäste bekommen am Tag nach der Abreise eine Mail mit der Bitte um einen Eintrag. Er erscheint erst, wenn du ihn freigibst.</p>

<ul class="mt-8 grid gap-4">
	{#each data.reviews as r (r.id)}
		<li class="card flex flex-col gap-3 p-4 {r.approved ? '' : 'border-l-4 border-l-geranium'}">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<p class="flex items-center gap-2"><Stars value={r.rating} label="{r.rating} von 5" /> <strong>{r.name}</strong>{#if r.stay}<span class="text-sm text-stein">Aufenthalt {fmtDate(r.stay, 'de', { weekday: undefined })}</span>{/if}</p>
				{#if r.bookingId}<a href="/admin/buchungen/{r.bookingId}" class="text-sm">Buchung von {r.guest}</a>{/if}
			</div>
			<p class="whitespace-pre-line">{r.body}</p>
			<form method="POST" action="?/reply" use:enhance={() => async ({ update }) => update({ reset: false })} class="flex flex-col gap-2">
				<input type="hidden" name="id" value={r.id} />
				<label class="text-sm font-semibold">Deine Antwort <span class="font-normal text-stein">(freiwillig, erscheint unter dem Eintrag)</span>
					<textarea name="reply" rows="2" class="field mt-1 font-normal">{r.reply ?? ''}</textarea></label>
				<div class="flex items-center gap-3"><button class="btn-line !min-h-9 !py-1 text-sm">Antwort speichern</button>{#if form?.saved === r.id}<span class="text-sm text-moos">Gespeichert</span>{/if}</div>
			</form>
			<div class="flex flex-wrap items-center gap-3 border-t border-line pt-3">
				<form method="POST" action="?/approve" use:enhance>
					<input type="hidden" name="id" value={r.id} />
					{#if r.approved}
						<button name="approved" value="0" class="btn-line !min-h-9 !py-1 text-sm">Ausblenden</button>
					{:else}
						<button name="approved" value="1" class="btn-primary !min-h-9 !py-1 text-sm">Freigeben</button>
					{/if}
				</form>
				<form method="POST" action="?/delete" class="ml-auto" use:enhance={({ cancel }) => { if (!confirm('Eintrag löschen?')) cancel(); }}>
					<input type="hidden" name="id" value={r.id} /><button class="text-sm text-geranium underline">Löschen</button>
				</form>
			</div>
		</li>
	{:else}
		<li class="text-stein">Noch keine Einträge.</li>
	{/each}
</ul>
