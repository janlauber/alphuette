<script lang="ts">
	import { chf } from '#lib/booking.ts';
	import { fmtDate } from '#lib/i18n.ts';

	let { data } = $props();
</script>

<h1 class="text-3xl">Gäste</h1>
<form class="mt-6 flex max-w-md gap-2" role="search">
	<label class="sr-only" for="q">Suchen</label>
	<input id="q" name="q" value={data.q} placeholder="Name, E-Mail oder Ort" class="field" />
	<button class="btn-line">Suchen</button>
</form>

{#if data.guests.length}
	<div class="overflow-x-auto">
		<table class="mt-6 w-full min-w-[640px] text-left">
			<thead class="text-sm text-stein">
				<tr><th class="py-1 font-normal">Name</th><th class="font-normal">Kontakt</th><th class="font-normal">Aufenthalte</th><th class="font-normal">Zuletzt</th><th class="text-right font-normal">Umsatz</th></tr>
			</thead>
			<tbody>
				{#each data.guests as g (g.email)}
					<tr class="border-t border-linie align-top">
						<td class="py-2"><a href="/admin/buchungen/{g.lastId}">{g.name}</a><br /><span class="text-sm text-stein">{g.city}</span></td>
						<td class="py-2 text-sm"><a href="mailto:{g.email}" class="break-all">{g.email}</a>{#if g.phone}<br /><a href="tel:{g.phone}">{g.phone}</a>{/if}</td>
						<td class="py-2">{g.stays}</td>
						<td class="py-2 text-sm">{g.lastStay ? fmtDate(g.lastStay, 'de', { weekday: undefined, month: 'short' }) : 'nur angefragt'}</td>
						<td class="py-2 text-right tabular-nums">{chf(g.total)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<p class="mt-6 text-stein">{data.q ? 'Niemand gefunden.' : 'Noch keine Gäste.'}</p>
{/if}
