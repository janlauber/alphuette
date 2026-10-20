<script lang="ts">
	import Huettli from '#lib/components/Huettli.svelte';
	import { chf } from '#lib/booking.ts';
	import { dict, fmtDate } from '#lib/i18n.ts';

	let { data } = $props();
	const t = $derived(dict[data.lang]);
	const b = $derived(data.booking);
</script>

<svelte:head>
	<title>{t.invoice.title} {b.ref}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="invoice mx-auto max-w-[210mm] bg-white px-6 py-10 text-[15px] text-black sm:px-12">
	<div class="flex flex-wrap justify-between gap-6">
		<div>
			<p class="flex items-center gap-2 text-2xl font-bold text-brand"><Huettli mini class="size-10" />{data.hutName}</p>
			<p class="mt-1">{data.host.name}<br />{data.host.street}<br />{data.host.zip} {data.host.city}<br />{data.host.email}</p>
		</div>
		<div class="text-right">
			<p>{b.name}<br />{b.city}</p>
			<p class="mt-4">{data.host.city}, {fmtDate(b.date, data.lang, { weekday: undefined })}</p>
		</div>
	</div>

	<h1 class="mt-12 text-3xl">{t.invoice.title} {b.ref}</h1>
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
	{#if b.paidAt}
		<p class="mt-6 rounded-[14px] bg-wash px-4 py-3 font-semibold">{t.invoice.paid(fmtDate(b.paidAt, data.lang, { weekday: undefined }))}</p>
	{:else}
		<p class="mt-6 font-semibold">{t.invoice.due(fmtDate(b.due, data.lang, { weekday: undefined }))}</p>
		<p class="mt-2">{t.invoice.pay}</p>
		{#if b.reference}<p class="mt-2 text-sm">{t.invoice.reference}: <span class="font-mono">{b.reference}</span></p>{/if}
	{/if}

	<button class="btn-line mt-6 print:hidden" onclick={() => print()}>{t.invoice.print}</button>
</div>

{#if data.svg}
	<div class="qr mx-auto max-w-[210mm] bg-white">{@html data.svg}</div>
{:else if !b.paidAt}
	<p class="mx-auto max-w-[210mm] bg-white px-12 py-6 text-rot">{t.invoice.notReady}</p>
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
