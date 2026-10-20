<script lang="ts">
	import { chf } from '#lib/booking.ts';
	import { dict, fmtDate } from '#lib/i18n.ts';

	let { data } = $props();
	const t = $derived(dict[data.lang]);
	const b = $derived(data.booking);
	const en = $derived(data.lang === 'en');
</script>

<svelte:head>
	<title>{en ? 'Invoice' : 'Rechnung'} {b.ref}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="invoice mx-auto max-w-[210mm] bg-white px-6 py-10 text-[15px] text-black sm:px-12">
	<div class="flex flex-wrap justify-between gap-6">
		<div>
			<p class="font-serif text-2xl">{data.hutName}</p>
			<p class="mt-1">{data.host.name}<br />{data.host.street}<br />{data.host.zip} {data.host.city}<br />{data.host.email}</p>
		</div>
		<div class="text-right">
			<p>{b.name}<br />{b.city}</p>
			<p class="mt-4">{data.host.city}, {fmtDate(b.date, data.lang, { weekday: undefined })}</p>
		</div>
	</div>

	<h1 class="mt-12 text-3xl">{en ? 'Invoice' : 'Rechnung'} {b.ref}</h1>
	<p class="mt-2">{fmtDate(b.checkIn, data.lang)} – {fmtDate(b.checkOut, data.lang)}</p>

	<table class="mt-6 w-full">
		<tbody>
			{#each b.lines as line (line.key)}
				<tr class="border-b border-neutral-200">
					<td class="py-1.5">{t.lines[line.key as keyof typeof t.lines](line.qty)}</td>
					<td class="py-1.5 text-right tabular-nums">{chf(line.amount)}</td>
				</tr>
			{/each}
		</tbody>
		<tfoot>
			<tr class="font-semibold"><td class="pt-3">{t.card.total}</td><td class="pt-3 text-right tabular-nums">{chf(b.total)}</td></tr>
		</tfoot>
	</table>
	<p class="mt-6">
		{en
			? 'Please pay within 30 days, at the latest 14 days before arrival. Scan the QR code with your banking app.'
			: 'Bitte zahle innert 30 Tagen, spätestens 14 Tage vor der Anreise. Scanne dazu den QR-Code mit deiner Banking-App.'}
	</p>

	<button class="btn-line mt-6 print:hidden" onclick={() => print()}>{en ? 'Print or save as PDF' : 'Drucken oder als PDF speichern'}</button>
</div>

{#if data.svg}
	<div class="qr mx-auto max-w-[210mm] bg-white">{@html data.svg}</div>
{:else}
	<p class="mx-auto max-w-[210mm] bg-white px-12 py-6 text-rot">{en ? 'The QR bill is not ready yet. Tom will send it to you.' : 'Die QR-Rechnung ist noch nicht bereit. Tom schickt sie dir.'}</p>
{/if}

<style>
	.qr :global(svg) {
		width: 100%;
		height: auto;
	}
	@media print {
		:global(header),
		:global(footer) {
			display: none;
		}
		.invoice {
			padding: 0 12mm;
		}
		.qr {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
		}
	}
</style>
