<script lang="ts">
	import { chf } from '#lib/booking.ts';
	import { fmtDate } from '#lib/i18n.ts';

	let { data } = $props();
	const tabs = [
		['aktiv', 'Kommend'],
		['angefragt', 'Anfragen'],
		['vergangen', 'Vergangen'],
		['abgesagt', 'Abgesagt']
	];
	const STATUS: Record<string, string> = { angefragt: 'angefragt', bestaetigt: 'bestätigt', abgelehnt: 'abgelehnt', storniert: 'storniert' };
	const d = (iso: string) => fmtDate(iso, 'de', { month: 'short' });
</script>

<h1 class="text-3xl">Buchungen</h1>
<nav class="mt-6 flex gap-1 overflow-x-auto border-b border-linie">
	{#each tabs as [key, label] (key)}
		<a href="?f={key}" class="-mb-px whitespace-nowrap border-b-2 px-3 py-2 no-underline {data.filter === key ? 'border-tanne font-semibold' : 'border-transparent text-stein'}">{label}</a>
	{/each}
</nav>

{#if data.bookings.length}
	<div class="overflow-x-auto">
		<table class="mt-4 w-full min-w-[640px] text-left">
			<thead class="text-sm text-stein">
				<tr><th class="py-1 font-normal">Daten</th><th class="font-normal">Gast</th><th class="font-normal">Pers.</th><th class="font-normal">Total</th><th class="font-normal">Status</th></tr>
			</thead>
			<tbody>
				{#each data.bookings as b (b.id)}
					<tr class="border-t border-linie">
						<td class="py-2 tabular-nums">{d(b.checkIn)} bis {d(b.checkOut)}</td>
						<td><a href="/admin/buchungen/{b.id}">{b.name}</a> <span class="text-sm text-stein">{b.city}</span></td>
						<td>{b.people}</td>
						<td class="tabular-nums">{chf(b.totalRp ?? 0)}</td>
						<td>
							{STATUS[b.status]}{#if b.status === 'bestaetigt'}, {#if b.paidAt}<span class="text-moos">bezahlt</span>{:else}<span class="text-rot">offen</span>{/if}{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<p class="mt-6 text-stein">Hier ist nichts.</p>
{/if}
