<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Thread from '#lib/components/Thread.svelte';
	import { chf } from '#lib/booking.ts';
	import { dict, fmtDate } from '#lib/i18n.ts';
	import { textToHtml } from '#lib/text.ts';

	let { data } = $props();
	const t = $derived(dict[data.lang]);
	const b = $derived(data.booking);
	const people = $derived(b.adults + b.children + b.infants);
	const isNew = page.url.searchParams.has('neu');
</script>

<svelte:head>
	<title>{t.booking.title} {b.ref} · {data.hutName}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
	<p class="text-stein">{t.booking.ref} {b.ref}</p>
	<h1 class="mt-1 text-[clamp(2.2rem,5vw,3.25rem)]">{t.booking.title}</h1>

	{#if isNew}
		<p class="mt-4 rounded-[3px] bg-gelb px-4 py-3 font-semibold">{t.booking.saveLink}</p>
	{/if}

	<section class="mt-8 rounded-[3px] border border-linie bg-paper p-5 sm:p-6">
		<p class="flex items-center gap-2 font-semibold">
			<span class="inline-block size-2.5 rounded-full {b.status === 'bestaetigt' ? 'bg-moos' : b.status === 'angefragt' ? 'bg-gelb' : 'bg-rot'}"></span>
			{t.booking.status[b.status]}
		</p>
		<p class="mt-1 text-stein">{t.booking.statusText[b.status]}</p>

		<dl class="mt-5 grid gap-4 sm:grid-cols-3">
			<div><dt class="text-sm text-stein">{t.card.checkIn}</dt><dd class="font-semibold">{fmtDate(b.checkIn, data.lang)}</dd><dd class="text-sm text-stein">{t.facts.checkIn(data.rates.checkIn)}</dd></div>
			<div><dt class="text-sm text-stein">{t.card.checkOut}</dt><dd class="font-semibold">{fmtDate(b.checkOut, data.lang)}</dd><dd class="text-sm text-stein">{t.facts.checkOut(data.rates.checkOut)}</dd></div>
			<div><dt class="text-sm text-stein">{t.booking.guests}</dt><dd class="font-semibold">{people}</dd></div>
		</dl>

		<table class="mt-5 w-full border-t border-linie text-[0.95rem]">
			<tbody>
				{#each b.lines as line (line.key)}
					<tr><td class="pt-2">{t.lines[line.key as keyof typeof t.lines](line.qty)}</td><td class="pt-2 text-right tabular-nums">{chf(line.amount)}</td></tr>
				{/each}
			</tbody>
			<tfoot>
				<tr class="font-semibold"><td class="pt-3">{t.card.total}</td><td class="pt-3 text-right tabular-nums">{chf(b.total)}</td></tr>
			</tfoot>
		</table>

		{#if b.status === 'bestaetigt'}
			<div class="mt-5 flex flex-wrap items-center gap-4 border-t border-linie pt-5">
				{#if data.invoiceReady}<a href="{page.url.pathname}/rechnung" class="btn-gelb">{t.booking.invoice}</a>{/if}
				<span class="text-stein">{b.paidAt ? t.booking.paid(fmtDate(new Date(b.paidAt).toISOString().slice(0, 10), data.lang)) : t.booking.open}</span>
			</div>
		{/if}
		{#if b.status === 'angefragt'}
			<form
				method="POST"
				action="?/withdraw"
				class="mt-5 border-t border-linie pt-4"
				use:enhance={({ cancel }) => {
					if (!confirm(t.booking.withdrawConfirm)) cancel();
				}}
			>
				<button class="text-sm text-stein underline">{t.booking.withdraw}</button>
			</form>
		{/if}
	</section>

	{#if data.guestInfo}
		<section class="mt-10">
			<h2 class="text-[1.75rem]">{t.booking.info}</h2>
			<div class="richtext mt-4">{@html textToHtml(data.guestInfo)}</div>
			<h3 class="mt-8 text-xl">{t.sections.arrival}</h3>
			<div class="richtext mt-3">{@html textToHtml(data.arrival)}</div>
		</section>
	{/if}

	<section class="mt-10">
		<h2 class="text-[1.75rem]">{t.booking.messages}</h2>
		<div class="mt-4">
			<Thread
				messages={data.messages}
				me="gast"
				names={{ gast: t.booking.you, host: 'Tom' }}
				placeholder={t.booking.write}
				send={t.booking.send}
				empty={t.booking.noMessages}
				locale={t.locale}
			/>
		</div>
	</section>
</div>
