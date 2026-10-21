<script lang="ts">
	import { confirmFirst } from '#lib/confirm.svelte.ts';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
	import MailCheck from '@lucide/svelte/icons/mail-check';
	import Plus from '@lucide/svelte/icons/plus';
	import GuidePhoto from '#lib/components/GuidePhoto.svelte';
	import Huettli, { type Face } from '#lib/components/Huettli.svelte';
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
	// The mascot shows how the booking is doing.
	const chip = $derived({ unbestaetigt: 'chip-todo', angefragt: 'chip-wait', bestaetigt: 'chip-ok', abgelehnt: 'chip-no', storniert: 'chip-no' }[b.status as string] ?? 'chip-off');
	const mood = $derived<Face>(b.status === 'bestaetigt' ? 'love' : b.status === 'angefragt' ? 'wink' : active ? 'happy' : 'sleep');
</script>

<svelte:head>
	<title>{t.booking.title} {b.ref} · {data.hutName}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-8 px-5 pb-10 pt-6 sm:px-6">
	<div class="flex items-end justify-between gap-4">
		<div>
			<p class="pill text-sm">{t.booking.ref} {b.ref}</p>
			<h1 class="mt-3 text-[2.4rem]">{b.status === 'unbestaetigt' ? t.booking.confirmTitle : t.booking.title}</h1>
		</div>
		<Huettli face={mood} pose="stand" animate class="w-24 shrink-0 text-brand sm:w-28" />
	</div>

	{#if b.status === 'unbestaetigt'}
		<form method="POST" action="?/confirm" use:enhance class="card-strong flex flex-col gap-4 p-5">
			<p class="flex items-start gap-3"><MailCheck size={24} strokeWidth={2.25} class="mt-0.5 shrink-0 text-brand" aria-hidden="true" />{t.booking.confirmText}</p>
			<button class="btn-primary">{t.booking.confirm}</button>
		</form>
	{:else if form?.confirmed}
		<p class="rounded-[20px] bg-wash px-4 py-3 font-semibold text-brand">{t.booking.confirmed} {t.booking.saveLink}</p>
	{/if}

	<section class="card flex flex-col gap-4 p-5">
		<p class="chip {chip} self-start text-sm">{t.booking.status[b.status]}</p>
		<div class="flex gap-4">
			{#if data.photo}<Img photo={data.photo} sizes="96px" class="size-24 shrink-0 rounded-[16px] object-cover" />{/if}
			<div class="flex min-w-0 flex-col justify-center gap-0.5">
				<p class="font-semibold">{fmtDate(b.checkIn, data.lang, { year: undefined })} – {fmtDate(b.checkOut, data.lang)}</p>
				<p class="text-sm text-muted"><span class="whitespace-nowrap">{people} {t.booking.guests}</span>, <span class="whitespace-nowrap">{t.facts.checkIn(data.rates.checkIn)}</span></p>
			</div>
		</div>
		<p class="text-muted">{t.booking.statusText[b.status]}</p>
		<table class="w-full border-t-2 border-line text-[0.95rem]">
			<tbody>
				{#each b.lines as line (line.key)}
					<tr><td class="pt-2">{t.lines[line.key as keyof typeof t.lines](line.qty)}</td><td class="pt-2 text-right tabular-nums">{chf(line.amount)}</td></tr>
				{/each}
			</tbody>
			<tfoot><tr class="text-lg font-bold"><td class="pt-3">{t.card.total}</td><td class="pt-3 text-right tabular-nums"><mark class="rounded-md bg-accent-soft px-1.5 text-ink">{chf(b.total)}</mark></td></tr></tfoot>
		</table>
		{#if b.status === 'bestaetigt'}
			<div class="grid gap-2 sm:grid-cols-2">
				{#if data.invoiceReady}<a href="{page.url.pathname}/rechnung" class="btn-primary"><Receipt size={18} aria-hidden="true" />{t.booking.invoice}</a>{/if}
				<a href="{page.url.pathname}/kalender.ics" class="btn-line"><CalendarPlus size={18} aria-hidden="true" />{t.booking.calendar}</a>
			</div>
		{/if}
	</section>

	{#if active}
		<section><Steps {steps} /></section>
	{/if}

	{#if data.guestInfo}
		<section>
			<h2 class="text-[1.9rem]">{t.booking.info}</h2>
			<div class="richtext mt-4">{@html textToHtml(data.guestInfo)}</div>
			<h3 class="mt-8 text-[1.4rem]">{t.sections.arrival}</h3>
			<div class="richtext mt-2">{@html textToHtml(data.arrival)}</div>
		</section>
	{/if}
	{#if data.guides.length}
		<section>
			<h2 class="text-[1.9rem]">{t.booking.guides}</h2>
			<div class="mt-4 grid gap-3">
				{#each data.guides as g (g.id)}
					<details class="group rounded-[22px] border-2 border-line px-5 py-4 open:border-brand">
						<summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
							{g.title}<span class="grid size-8 shrink-0 place-items-center rounded-full border-2 border-brand text-brand transition group-open:rotate-45 group-open:bg-brand group-open:text-white"><Plus size={16} strokeWidth={3} aria-hidden="true" /></span>
						</summary>
						<ol class="mt-4 grid gap-6">
							{#each g.steps as s, i (i)}
								<li class="grid gap-3">
									{#if s.photo}<GuidePhoto src="{page.url.pathname}/anleitung/{s.photo}" marks={s.marks} alt={s.marks.map((m) => m.label).filter(Boolean).join(', ')} />{/if}
									{#if s.text}
										<div class="flex gap-3">
											{#if g.steps.length > 1}<span class="grid size-7 shrink-0 place-items-center rounded-full bg-wash text-sm font-bold text-brand" aria-hidden="true">{i + 1}</span>{/if}
											<div class="richtext min-w-0">{@html textToHtml(s.text)}</div>
										</div>
									{/if}
								</li>
							{/each}
						</ol>
					</details>
				{/each}
			</div>
		</section>
	{/if}
	{#if data.booking.status === 'bestaetigt'}
		<p class="rounded-[18px] border-2 border-line bg-wash px-5 py-4">{t.booking.guestCard}</p>
	{/if}

	{#if data.packing.length}
		<section>
			<h2 class="text-[1.9rem]">{t.booking.packing}</h2>
			<p class="mb-3 mt-1 text-sm text-muted">{t.booking.packingHint}</p>
			<Checklist items={data.packing} key="packliste-{b.ref}" />
		</section>
	{/if}

	{#if data.canReview && !form?.reviewed}
		<section id="bewertung" class="rounded-[28px] bg-wash p-6">
			<h2 class="text-[1.9rem]">{t.review.title}</h2>
			<p class="mt-1 text-muted">{t.review.text}</p>
			<form method="POST" action="?/review" use:enhance class="mt-4 flex flex-col gap-4">
				<fieldset>
					<legend class="label">{t.review.rating}</legend>
					<div class="flex gap-1">
						{#each [1, 2, 3, 4, 5] as n (n)}
							<label class="cursor-pointer text-brand transition hover:scale-110 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand" title={t.review.stars(n)}>
								<input type="radio" name="rating" value={n} checked={rating === n} onchange={() => (rating = n)} class="sr-only" />
								<Star size={36} fill={n <= rating ? 'currentColor' : 'none'} strokeWidth={2} aria-hidden="true" />
								<span class="sr-only">{t.review.stars(n)}</span>
							</label>
						{/each}
					</div>
				</fieldset>
				<label class="label">{t.review.body}<textarea name="body" rows="5" required minlength="10" maxlength="3000" class="field mt-1.5 font-normal"></textarea></label>
				<label class="label">{t.review.name}<input name="name" maxlength="80" placeholder={t.review.namePlaceholder} class="field mt-1.5 font-normal" /></label>
				{#if form?.reviewInvalid}<p class="font-semibold text-danger" role="alert">{t.request.invalid}</p>{/if}
				<button class="btn-primary">{t.review.send}</button>
			</form>
		</section>
	{:else if form?.reviewed || data.reviewed}
		<p id="bewertung" class="rounded-[20px] bg-wash px-4 py-3 font-semibold text-brand">{t.review.thanks}</p>
	{/if}

	{#if b.status !== 'unbestaetigt'}
		<section>
			<h2 class="text-[1.9rem]">{t.booking.messages}</h2>
			<div class="mt-4">
				<Thread
					messages={data.messages}
					me="gast"
					names={{ gast: t.booking.you, host: 'Tom' }}
					placeholder={t.booking.write}
					send={t.booking.send}
					empty={t.booking.noMessages}
					hint={data.lang === 'de' ? '' : t.thread.hint}
					labels={t.thread}
					locale={t.locale}
				/>
			</div>
		</section>
	{/if}

	{#if b.status === 'angefragt' || b.status === 'unbestaetigt'}
		<form
			method="POST"
			action="?/withdraw"
			use:enhance={confirmFirst({ title: t.booking.withdrawConfirm, text: t.booking.withdrawText, ok: t.booking.withdrawYes, cancel: t.booking.withdrawNo, danger: true })}
		>
			<button class="text-sm font-semibold text-danger underline">{t.booking.withdraw}</button>
		</form>
	{/if}
</div>
