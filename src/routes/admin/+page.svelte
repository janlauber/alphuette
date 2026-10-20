<script lang="ts">
	import { chf } from '#lib/booking.ts';
	import { fmtDate } from '#lib/i18n.ts';

	let { data } = $props();
	const d = (iso: string) => fmtDate(iso, 'de', { year: undefined, month: 'short' });
</script>

<h1 class="text-3xl">Übersicht</h1>

<section class="mt-8">
	<h2 class="text-xl">Offene Anfragen</h2>
	{#if data.open.length}
		<ul class="mt-3 grid gap-2">
			{#each data.open as b (b.id)}
				<li>
					<a href="/admin/buchungen/{b.id}" class="flex flex-wrap items-center justify-between gap-2 rounded-[3px] border-l-4 border-gelb bg-paper px-4 py-3 no-underline hover:bg-white">
						<span><strong>{b.name}</strong> <span class="text-stein">aus {b.city}, {b.people} Pers.</span></span>
						<span class="flex gap-4 tabular-nums"><span>{d(b.checkIn)} bis {d(b.checkOut)}</span><span>{chf(b.totalRp)}</span></span>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-2 text-stein">Keine offenen Anfragen.</p>
	{/if}
</section>

{#if data.unread.length}
	<section class="mt-10">
		<h2 class="text-xl">Neue Nachrichten</h2>
		<ul class="mt-3 grid gap-2">
			{#each data.unread as m (m.id)}
				<li>
					<a href="/admin/buchungen/{m.id}#nachrichten" class="flex justify-between rounded-[3px] bg-paper px-4 py-3 no-underline hover:bg-white">
						<span><strong>{m.name}</strong> <span class="text-stein">{m.ref}</span></span>
						<span>{m.n} neu</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section class="mt-10">
	<h2 class="text-xl">Nächste Aufenthalte</h2>
	{#if data.upcoming.length}
		<table class="mt-3 w-full text-left">
			<thead class="text-sm text-stein"><tr><th class="py-1 font-normal">Gast</th><th class="font-normal">Daten</th><th class="font-normal">Pers.</th><th class="font-normal">Zahlung</th></tr></thead>
			<tbody>
				{#each data.upcoming as b (b.id)}
					<tr class="border-t border-linie">
						<td class="py-2"><a href="/admin/buchungen/{b.id}">{b.name}</a></td>
						<td class="tabular-nums">{d(b.checkIn)} bis {d(b.checkOut)}</td>
						<td>{b.people}</td>
						<td>{#if b.paidAt}<span class="text-moos">bezahlt</span>{:else}<span class="text-rot">offen</span>{/if}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p class="mt-2 text-stein">Keine bestätigten Aufenthalte.</p>
	{/if}
</section>
