<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { refreshAll } from '$app/navigation';
	import Bus from '@lucide/svelte/icons/bus';
	import Car from '@lucide/svelte/icons/car';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import MailCheck from '@lucide/svelte/icons/mail-check';
	import Img from '#lib/components/Img.svelte';
	import Quote from '#lib/components/Quote.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import Stepper from '#lib/components/Stepper.svelte';
	import Steps from '#lib/components/Steps.svelte';
	import { chf, quote } from '#lib/booking.ts';
	import { dict, fmtDate, localize, weekdayName } from '#lib/i18n.ts';
	import { solve } from '#lib/pow.ts';
	import { textToHtml } from '#lib/text.ts';
	import { track } from '#lib/track.ts';

	let { data, form } = $props();
	const t = $derived(dict[data.lang]);
	const v = $derived((form && 'values' in form ? form.values : {}) as Record<string, string>);
	const invalid = $derived(new Set<string>(form && 'invalid' in form ? (form.invalid as string[]) : []));

	// The form starts from the query string and is edited locally afterwards.
	const initial = untrack(() => data.initial);
	let checkIn = $state(initial.checkIn);
	let checkOut = $state(initial.checkOut);
	let guests = $state({ adults: initial.adults, children: initial.children, infants: initial.infants, linen: initial.linen });
	const people = $derived(guests.adults + guests.children + guests.infants);
	const q = $derived(checkIn && checkOut ? quote(checkIn, checkOut, guests, data.seasons, data.rates, data.taken) : null);

	// Steps only exist with JavaScript; without it the whole form shows at once.
	let js = $state(false);
	let step = $state(0);
	let sending = $state(false);
	let nonce = $state('');
	let formEl = $state<HTMLFormElement>();

	onMount(() => (js = true));

	// The proof-of-work runs while the guest types; a second or two on a phone.
	// Each challenge works once, so a failed attempt loads a fresh one.
	$effect(() => {
		const challenge = data.pow;
		nonce = '';
		solve(challenge).then((n) => {
			if (challenge === data.pow) nonce = n;
		});
	});

	function go(to: number) {
		if (to > step) {
			const fields = formEl?.querySelectorAll<HTMLInputElement>(`[data-step="${step}"] input, [data-step="${step}"] textarea`) ?? [];
			for (const f of fields) if (!f.reportValidity()) return;
		}
		step = to;
		track('request_step', to);
		scrollTo({ top: 0, behavior: 'smooth' });
	}

	const serverError = $derived.by(() => {
		const e = form && 'error' in form ? (form.error as string) : '';
		if (!e) return '';
		const s = data.seasons[0];
		if (e === 'min') return t.errors.min(s?.minNights ?? 1);
		if (e === 'changeover') return t.errors.changeover(weekdayName(s?.changeover ?? 6, data.lang));
		if (e === 'guests') return t.errors.guests(data.rates.maxGuests);
		if (e in t.errors) return t.errors[e as 'dates' | 'closed' | 'taken'];
		return (t.request as Record<string, unknown>)[e] as string ?? t.request.invalid;
	});
	const sent = $derived(form && 'sent' in form && form.sent);
	const show = (i: number) => !js || step === i;
</script>

<Seo
	title="{t.request.title} · {data.hutName}"
	description={data.lang === 'en' ? 'Send a booking request for the alpine hut in the Kiental.' : 'Sende eine Buchungsanfrage für das Alphüttli im Kiental.'}
	path="/anfrage"
	lang={data.lang}
	siteUrl={data.siteUrl}
/>

<div class="mx-auto max-w-2xl px-5 pb-10 pt-6 sm:px-6">
	{#if sent}
		<div class="flex flex-col gap-6 pt-4">
			<span class="grid size-14 place-items-center rounded-full bg-blush text-geranium"><MailCheck size={28} aria-hidden="true" /></span>
			<div>
				<h1 class="text-[2.1rem]">{t.sent.title}</h1>
				<p class="mt-3 text-[1.05rem] leading-relaxed">{t.sent.text(String(form?.email ?? ''))}</p>
			</div>
			<Steps
				steps={[
					{ title: t.steps.sent, text: '', state: 'done' },
					{ title: t.steps.confirm, text: t.steps.confirmText, state: 'now' },
					{ title: t.steps.host, text: t.steps.hostText, state: 'next' },
					{ title: t.steps.bill, text: t.steps.billText, state: 'next' },
					{ title: t.steps.arrive(fmtDate(checkIn, data.lang, { year: undefined })), text: t.steps.arriveText, state: 'next' }
				]}
			/>
			<p class="text-sm text-muted">{t.sent.noMail}</p>
		</div>
	{:else}
		<a href="{localize(data.lang, '/')}#buchen" class="inline-flex items-center gap-1 text-sm text-muted no-underline hover:text-ink"><ChevronLeft size={16} aria-hidden="true" />{data.hutName}</a>
		<h1 class="mt-3 text-[2.1rem]">{t.request.title}</h1>

		{#if js}
			<ol class="mt-5 grid grid-cols-3 gap-2" aria-label={t.request.stepOf(step + 1, 3)}>
				{#each t.request.steps as label, i (label)}
					<li>
						<span class="block h-1.5 rounded-full {i <= step ? 'bg-geranium' : 'bg-line'}"></span>
						<span class="mt-1.5 block text-xs font-semibold {i === step ? '' : 'text-muted'}">{label}</span>
					</li>
				{/each}
			</ol>
		{/if}

		<form
			bind:this={formEl}
			method="POST"
			class="mt-6"
			use:enhance={() => {
				sending = true;
				return async ({ update, result }) => {
					await update({ reset: false });
					sending = false;
					if (result.type === 'success') track('request_sent');
					else await refreshAll();
					if (result.type !== 'success') step = result.type === 'failure' && (result.data?.invalid as string[] | undefined)?.length ? 1 : 0;
				};
			}}
		>
			<input type="hidden" name="pow" value={data.pow} />
			<input type="hidden" name="nonce" value={nonce} />
			<input type="hidden" name="ft" value={data.ft} />
			<input type="hidden" name="checkIn" value={checkIn} />
			<input type="hidden" name="checkOut" value={checkOut} />
			<input type="hidden" name="adults" value={guests.adults} />
			<input type="hidden" name="children" value={guests.children} />
			<input type="hidden" name="infants" value={guests.infants} />
			<input type="hidden" name="linen" value={Math.min(guests.linen, people)} />
			<!-- Honeypot: people never see or fill this -->
			<div class="hidden" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off" /></label></div>

			{#if serverError}<p class="mb-5 rounded-[12px] bg-blush px-4 py-3 font-semibold text-geranium-dark" role="alert">{serverError}</p>{/if}

			<fieldset data-step="0" class="flex flex-col gap-5" hidden={!show(0)}>
				<legend class="sr-only">{t.request.steps[0]}</legend>
				<div class="card flex gap-4 p-3">
					{#if data.photo}<Img photo={data.photo} sizes="96px" class="size-24 shrink-0 rounded-[12px] object-cover" />{/if}
					<div class="flex min-w-0 flex-col justify-center gap-0.5">
						<p class="font-serif text-lg leading-tight">{data.hutName}</p>
						{#if checkIn && checkOut}
							<p>{fmtDate(checkIn, data.lang, { year: undefined })} – {fmtDate(checkOut, data.lang)}</p>
						{:else}
							<p class="text-geranium-dark">{t.errors.dates}</p>
						{/if}
						<a href="{localize(data.lang, '/')}#buchen" class="text-sm underline">{t.request.change}</a>
					</div>
				</div>
				<div class="divide-y divide-line border-y border-line">
					<Stepper label={t.card.adults} hint={t.card.adultsHint} bind:value={guests.adults} min={1} max={data.rates.maxGuests - guests.children - guests.infants} lang={data.lang} />
					<Stepper label={t.card.children} hint={t.card.childrenHint} bind:value={guests.children} max={data.rates.maxGuests - guests.adults - guests.infants} lang={data.lang} />
					<Stepper label={t.card.infants} hint={t.card.infantsHint} bind:value={guests.infants} max={data.rates.maxGuests - guests.adults - guests.children} lang={data.lang} />
					<Stepper label={t.card.linen} hint={t.card.linenHint(chf(data.rates.linen))} bind:value={guests.linen} max={people} lang={data.lang} />
				</div>
				{#if checkIn && checkOut}
					<Quote {checkIn} {checkOut} guests={{ ...guests, linen: Math.min(guests.linen, people) }} seasons={data.seasons} rates={data.rates} taken={data.taken} lang={data.lang} />
				{/if}
				{#if js}<button type="button" class="btn-primary" disabled={!q?.ok} onclick={() => go(1)}>{t.request.next}</button>{/if}
			</fieldset>

			<fieldset data-step="1" class="flex flex-col gap-4 {js ? '' : 'mt-10'}" hidden={!show(1)}>
				<legend class="mb-1 font-serif text-2xl">{t.request.steps[1]}</legend>
				<label class="label">{t.request.name}
					<input name="name" autocomplete="name" required minlength="2" maxlength="100" value={v.name ?? ''} aria-invalid={invalid.has('name')} class="field mt-1.5 font-normal" /></label>
				<label class="label">{t.request.email}
					<input name="email" type="email" autocomplete="email" required value={v.email ?? ''} aria-invalid={invalid.has('email')} aria-describedby="email-hint" class="field mt-1.5 font-normal" />
					<span id="email-hint" class="hint mt-1 block text-sm">{t.request.emailHint}</span></label>
				<div class="grid gap-4 sm:grid-cols-2">
					<label class="label">{t.request.city}
						<input name="city" autocomplete="address-level2" required maxlength="100" value={v.city ?? ''} aria-invalid={invalid.has('city')} class="field mt-1.5 font-normal" /></label>
					<label class="label">{t.request.phone} <span class="hint">({t.request.optional})</span>
						<input name="phone" type="tel" autocomplete="tel" maxlength="40" value={v.phone ?? ''} class="field mt-1.5 font-normal" /></label>
				</div>
				<fieldset>
					<legend class="label">{t.request.arrival} <span class="hint">({t.request.optional})</span></legend>
					<div class="grid grid-cols-2 gap-2">
						<label class="flex cursor-pointer items-center gap-2.5 rounded-[12px] border border-[#d9d0c9] px-3.5 py-3 has-[:checked]:border-ink has-[:checked]:bg-sand">
							<input type="radio" name="arrival" value="oev" checked={v.arrival === 'oev'} class="sr-only" /><Bus size={20} class="text-fir" aria-hidden="true" />{t.request.bus}
						</label>
						<label class="flex cursor-pointer items-center gap-2.5 rounded-[12px] border border-[#d9d0c9] px-3.5 py-3 has-[:checked]:border-ink has-[:checked]:bg-sand">
							<input type="radio" name="arrival" value="auto" checked={v.arrival === 'auto'} class="sr-only" /><Car size={20} class="text-fir" aria-hidden="true" />{t.request.car}
						</label>
					</div>
				</fieldset>
				<label class="label">{t.request.note} <span class="hint">({t.request.optional})</span>
					<textarea name="note" rows="4" maxlength="3000" placeholder={t.request.notePlaceholder} class="field mt-1.5 font-normal">{v.note ?? ''}</textarea></label>
				{#if js}
					<div class="grid grid-cols-[auto_1fr] gap-3">
						<button type="button" class="btn-line" onclick={() => go(0)}>{t.request.back}</button>
						<button type="button" class="btn-primary" onclick={() => go(2)}>{t.request.next}</button>
					</div>
				{/if}
			</fieldset>

			<fieldset data-step="2" class="flex flex-col gap-4 {js ? '' : 'mt-10'}" hidden={!show(2)}>
				<legend class="mb-1 font-serif text-2xl">{t.request.steps[2]}</legend>
				{#if q?.ok}
					<div class="card p-4">
						<p class="font-semibold">{fmtDate(checkIn, data.lang, { year: undefined })} – {fmtDate(checkOut, data.lang)}</p>
						<p class="text-sm text-muted">{guests.adults} {t.card.adults}{guests.children ? `, ${guests.children} ${t.card.children}` : ''}{guests.infants ? `, ${guests.infants} ${t.card.infants}` : ''}</p>
						<div class="mt-3 border-t border-line pt-3">
							<Quote {checkIn} {checkOut} guests={{ ...guests, linen: Math.min(guests.linen, people) }} seasons={data.seasons} rates={data.rates} taken={data.taken} lang={data.lang} />
						</div>
					</div>
				{/if}
				{#each [{ title: t.sections.rules, html: textToHtml(data.rules) }, { title: t.sections.payment, html: textToHtml(data.payment) }] as d (d.title)}
					<details class="group border-b border-line py-3">
						<summary class="flex cursor-pointer list-none items-center justify-between font-semibold">{d.title}<ChevronDown size={18} class="transition group-open:rotate-180" aria-hidden="true" /></summary>
						<div class="richtext mt-2">{@html d.html}</div>
					</details>
				{/each}
				<p class="text-sm text-muted">{t.request.consent} <a href={localize(data.lang, '/datenschutz')} class="underline">{t.request.privacy}</a></p>
				<div class="grid {js ? 'grid-cols-[auto_1fr]' : ''} gap-3">
					{#if js}<button type="button" class="btn-line" onclick={() => go(1)}>{t.request.back}</button>{/if}
					<button class="btn-primary" disabled={sending || (js && !nonce)}>{sending || (js && !nonce) ? t.request.sending : t.request.submit}</button>
				</div>
				<p class="text-center text-sm text-muted">{t.card.noPay}</p>
			</fieldset>
		</form>
		<noscript><p class="mt-6 text-sm text-muted">{data.lang === 'en' ? 'The spam protection needs JavaScript.' : 'Der Spamschutz braucht JavaScript.'}</p></noscript>
	{/if}
</div>
