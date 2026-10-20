<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
	import MailCheck from '@lucide/svelte/icons/mail-check';
	import Receipt from '@lucide/svelte/icons/receipt';
	import Star from '@lucide/svelte/icons/star';
	import Checklist from '#lib/components/Checklist.svelte';
	import Img from '#lib/components/Img.svelte';
	import Steps from '#lib/components/Steps.svelte';
	import Thread from '#lib/components/Thread.svelte';
	import { chf } from '#lib/booking.ts';
	import { dict, fmtDate } from '#lib/i18n.ts';
	import { textToHtml } from '#lib/text.ts';

	let { data, form } = $props();
	const t = $derived(dict[data.lang]);
	const b = $derived(data.booking);
	const people = $derived(b.adults + b.children + b.infants);
	let rating = $state(5);

	const steps = $derived.by(() => {
		const s = b.status;
		const state = (done: boolean, now: boolean) => (done ? 'done' : now ? 'now' : 'next') as 'done' | 'now' | 'next';
		const confirmed = s === 'bestaetigt';
		return [
			{ title: t.steps.sent, text: '', state: state(true, false) },
			{ title: t.steps.confirm, text: t.steps.confirmText, state: state(s !== 'unbestaetigt', s === 'unbestaetigt') },
			{ title: t.steps.host, text: t.steps.hostText, state: state(confirmed, s === 'angefragt') },
			{ title: t.steps.bill, text: b.paidAt ? t.booking.paid(fmtDate(new Date(b.paidAt).toISOString().slice(0, 10), data.lang)) : t.steps.billText, state: state(!!b.paidAt, confirmed && !b.paidAt) },
			{ title: t.steps.arrive(fmtDate(b.checkIn, data.lang, { year: undefined })), text: t.steps.arriveText, state: state(false, confirmed && !!b.paidAt) }
		];
	});
	const active = $derived(['unbestaetigt', 'angefragt', 'bestaetigt'].includes(b.status));
</script>

<svelte:head>
	<title>{t.booking.title} {b.ref} · {data.hutName}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-8 px-5 pb-10 pt-6 sm:px-6">
	<div>
		<p class="text-sm text-muted">{t.booking.ref} {b.ref}</p>
		<h1 class="mt-1 text-[2.1rem]">{b.status === 'unbestaetigt' ? t.booking.confirmTitle : t.booking.title}</h1>
	</div>

	{#if b.status === 'unbestaetigt'}
		<form method="POST" action="?/confirm" use:enhance class="flex flex-col gap-4 rounded-[18px] bg-blush p-5">
			<p class="flex items-start gap-3"><MailCheck size={22} class="mt-0.5 shrink-0 text-geranium" aria-hidden="true" />{t.booking.confirmText}</p>
			<button class="btn-primary">{t.booking.confirm}</button>
		</form>
	{:else if form?.confirmed}
		<p class="rounded-[14px] bg-sand px-4 py-3 font-semibold">{t.booking.confirmed} {t.booking.saveLink}</p>
	{/if}

	<section class="card flex flex-col gap-4 p-4 sm:p-5">
		<div class="flex gap-4">
			{#if data.photo}<Img photo={data.photo} sizes="96px" class="size-24 shrink-0 rounded-[12px] object-cover" />{/if}
			<div class="flex min-w-0 flex-col justify-center gap-0.5">
				<p class="flex items-center gap-2 text-sm font-semibold">
					<span class="inline-block size-2.5 rounded-full {b.status === 'bestaetigt' ? 'bg-fir' : active ? 'bg-geranium' : 'bg-muted'}"></span>{t.booking.status[b.status]}
				</p>
				<p class="font-semibold">{fmtDate(b.checkIn, data.lang, { year: undefined })} – {fmtDate(b.checkOut, data.lang)}</p>
				<p class="text-sm text-muted">{people} {t.booking.guests}, {t.facts.checkIn(data.rates.checkIn)}</p>
			</div>
		</div>
		<p class="text-muted">{t.booking.statusText[b.status]}</p>
		<table class="w-full border-t border-line text-[0.95rem]">
			<tbody>
				{#each b.lines as line (line.key)}
					<tr><td class="pt-2">{t.lines[line.key as keyof typeof t.lines](line.qty)}</td><td class="pt-2 text-right tabular-nums">{chf(line.amount)}</td></tr>
				{/each}
			</tbody>
			<tfoot><tr class="font-bold"><td class="pt-3">{t.card.total}</td><td class="pt-3 text-right tabular-nums">{chf(b.total)}</td></tr></tfoot>
		</table>
		{#if b.status === 'bestaetigt'}
			<div class="grid gap-2 sm:grid-cols-2">
				{#if data.invoiceReady}<a href="{page.url.pathname}/rechnung" class="btn-primary no-underline"><Receipt size={18} aria-hidden="true" />{t.booking.invoice}</a>{/if}
				<a href="{page.url.pathname}/kalender.ics" class="btn-line no-underline"><CalendarPlus size={18} aria-hidden="true" />{t.booking.calendar}</a>
			</div>
		{/if}
	</section>

	{#if active}
		<section><Steps {steps} /></section>
	{/if}

	{#if data.guestInfo}
		<section>
			<h2 class="text-[1.65rem]">{t.booking.info}</h2>
			<div class="richtext mt-4">{@html textToHtml(data.guestInfo)}</div>
			<h3 class="mt-6 font-sans text-lg font-bold">{t.sections.arrival}</h3>
			<div class="richtext mt-2">{@html textToHtml(data.arrival)}</div>
		</section>
	{/if}

	{#if data.packing.length}
		<section>
			<h2 class="text-[1.65rem]">{t.booking.packing}</h2>
			<p class="mb-3 mt-1 text-sm text-muted">{t.booking.packingHint}</p>
			<Checklist items={data.packing} key="packliste-{b.ref}" />
		</section>
	{/if}

	{#if data.canReview && !form?.reviewed}
		<section id="bewertung" class="rounded-[18px] bg-sand p-5">
			<h2 class="text-[1.65rem]">{t.review.title}</h2>
			<p class="mt-1 text-muted">{t.review.text}</p>
			<form method="POST" action="?/review" use:enhance class="mt-4 flex flex-col gap-4">
				<fieldset>
					<legend class="label">{t.review.rating}</legend>
					<div class="flex gap-1">
						{#each [1, 2, 3, 4, 5] as n (n)}
							<label class="cursor-pointer text-geranium" title={t.review.stars(n)}>
								<input type="radio" name="rating" value={n} checked={rating === n} onchange={() => (rating = n)} class="sr-only" />
								<Star size={32} fill={n <= rating ? 'currentColor' : 'none'} strokeWidth={1.5} aria-hidden="true" />
								<span class="sr-only">{t.review.stars(n)}</span>
							</label>
						{/each}
					</div>
				</fieldset>
				<label class="label">{t.review.body}<textarea name="body" rows="5" required minlength="10" maxlength="3000" class="field mt-1.5 font-normal"></textarea></label>
				<label class="label">{t.review.name}<input name="name" maxlength="80" placeholder={t.review.namePlaceholder} class="field mt-1.5 font-normal" /></label>
				{#if form?.reviewInvalid}<p class="text-geranium-dark" role="alert">{t.request.invalid}</p>{/if}
				<button class="btn-primary">{t.review.send}</button>
			</form>
		</section>
	{:else if form?.reviewed || data.reviewed}
		<p id="bewertung" class="rounded-[14px] bg-sand px-4 py-3">{t.review.thanks}</p>
	{/if}

	{#if b.status !== 'unbestaetigt'}
		<section>
			<h2 class="text-[1.65rem]">{t.booking.messages}</h2>
			<div class="mt-4">
				<Thread messages={data.messages} me="gast" names={{ gast: t.booking.you, host: 'Tom' }} placeholder={t.booking.write} send={t.booking.send} empty={t.booking.noMessages} locale={t.locale} />
			</div>
		</section>
	{/if}

	{#if b.status === 'angefragt' || b.status === 'unbestaetigt'}
		<form
			method="POST"
			action="?/withdraw"
			use:enhance={({ cancel }) => {
				if (!confirm(t.booking.withdrawConfirm)) cancel();
			}}
		>
			<button class="text-sm text-muted underline">{t.booking.withdraw}</button>
		</form>
	{/if}
</div>
