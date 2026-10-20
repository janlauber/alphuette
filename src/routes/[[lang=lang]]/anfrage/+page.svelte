<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { refreshAll } from '$app/navigation';
	import Bus from '@lucide/svelte/icons/bus';
	import Car from '@lucide/svelte/icons/car';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Check from '@lucide/svelte/icons/check';
	import Huettli from '#lib/components/Huettli.svelte';
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
	let moving = $state(false);
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
		moving = true;
		setTimeout(() => (moving = false), 650);
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
	// country names in the page language, neighbours first
	const COUNTRIES = ['CH', 'DE', 'AT', 'FR', 'IT', 'LI', 'NL', 'BE', 'LU', 'GB', 'ES', 'DK', 'SE', 'NO', 'PL', 'CZ', 'US', 'CA', 'AU', 'IL', 'JP', 'CN', 'IN', 'BR'];
	const countries = $derived.by(() => {
		const names = new Intl.DisplayNames([t.locale], { type: 'region' });
		const [first, ...rest] = COUNTRIES.map((c) => [c, names.of(c) ?? c] as const);
		return [first, ...rest.slice(0, 5), ...rest.slice(5).sort((a, b) => a[1].localeCompare(b[1], t.locale))];
	});
</script>

<Seo
	title="{t.request.title} · {data.hutName}"
	description={t.seo.request}
	path="/anfrage"
	lang={data.lang}
	siteUrl={data.siteUrl}
/>

<div class="mx-auto max-w-2xl px-5 pb-10 pt-6 sm:px-6">
	{#if sent}
		<div class="flex flex-col gap-6 pt-4">
			<div class="relative w-fit text-brand">
				<Huettli face="wink" pose="stand" animate class="w-32" />
				<svg viewBox="0 0 64 48" class="absolute -right-16 top-6 w-16 animate-float" aria-hidden="true"><path d="M4 30h-4M8 38H2M6 22H1" stroke="currentColor" stroke-width="3" stroke-linecap="round" /><rect x="14" y="6" width="46" height="34" rx="6" fill="#fff" stroke="currentColor" stroke-width="3.5" /><path d="m16 10 21 17 21-17" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round" /></svg>
			</div>
			<div>
				<h1 class="text-[2.4rem]">{t.sent.title}</h1>
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
			<p class="rounded-[18px] bg-accent-wash p-4 text-sm">{t.sent.noMail}</p>
		</div>
	{:else}
		<a href="{localize(data.lang, '/')}#buchen" class="inline-flex items-center gap-1 text-sm font-semibold text-brand no-underline hover:underline"><ChevronLeft size={16} strokeWidth={2.5} aria-hidden="true" />{data.hutName}</a>
		<h1 class="mt-3 text-[2.4rem]">{t.request.title}</h1>

		{#if js}
			<!-- The Hüttli runs along the steps -->
			<div class="relative mt-16 text-brand">
				<span class="absolute left-[16.66%] right-[16.66%] top-[17px] border-t-2 border-dashed border-line"></span>
				<span class="absolute left-[16.66%] top-[17px] border-t-2 border-brand transition-all duration-500" style="width: {step * 33.33}%"></span>
				<span class="absolute -top-14 w-14 -translate-x-1/2 transition-[left] duration-600 ease-out" style="left: {16.66 + step * 33.33}%">
					<Huettli pose={moving ? 'run' : 'stand'} animate run={moving} face={step === 2 ? 'love' : 'happy'} class="w-full" />
				</span>
				<ol class="relative grid grid-cols-3" aria-label={t.request.stepOf(step + 1, 3)}>
					{#each t.request.steps as label, i (label)}
						<li class="flex flex-col items-center gap-1.5 text-center" aria-current={i === step ? 'step' : undefined}>
							<span class="grid size-9 place-items-center rounded-full border-2 font-bold transition-colors {i < step ? 'border-brand bg-brand text-white' : i === step ? 'border-brand bg-accent' : 'border-line bg-paper text-muted'}">
								{#if i < step}<Check size={16} strokeWidth={3.5} aria-hidden="true" />{:else}{i + 1}{/if}
							</span>
							<span class="text-balance text-xs font-bold leading-tight {i === step ? '' : 'text-muted'}">{label}</span>
						</li>
					{/each}
				</ol>
			</div>
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

			{#if serverError}<p class="mb-5 rounded-[18px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">{serverError}</p>{/if}

			<fieldset data-step="0" class="flex flex-col gap-5" hidden={!show(0)}>
				<legend class="sr-only">{t.request.steps[0]}</legend>
				<div class="card flex gap-4 p-3">
					{#if data.photo}<Img photo={data.photo} sizes="96px" class="size-24 shrink-0 rounded-[16px] object-cover" />{/if}
					<div class="flex min-w-0 flex-col justify-center gap-0.5">
						<p class="text-lg font-bold leading-tight text-brand">{data.hutName}</p>
						{#if checkIn && checkOut}
							<p>{fmtDate(checkIn, data.lang, { year: undefined })} – {fmtDate(checkOut, data.lang)}</p>
						{:else}
							<p class="font-semibold text-danger">{t.errors.dates}</p>
						{/if}
						<a href="{localize(data.lang, '/')}#buchen" class="text-sm font-semibold text-brand underline">{t.request.change}</a>
					</div>
				</div>
				<div class="divide-y-2 divide-line border-y-2 border-line">
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
				<legend class="mb-1 text-2xl font-bold text-brand">{t.request.steps[1]}</legend>
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
				<label class="label">{t.request.country}
					<select name="country" autocomplete="country" class="field mt-1.5 font-normal" aria-describedby="country-hint">
						{#each countries as [code, name] (code)}<option value={code} selected={(v.country ?? 'CH') === code}>{name}</option>{/each}
					</select>
					<span id="country-hint" class="hint mt-1 block text-sm">{t.request.countryHint}</span></label>
				<fieldset>
					<legend class="label">{t.request.arrival} <span class="hint">({t.request.optional})</span></legend>
					<div class="grid grid-cols-2 gap-2">
						<label class="flex cursor-pointer items-center gap-2.5 rounded-[18px] border-2 border-line px-4 py-3 font-semibold transition-colors hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-wash has-[:checked]:text-brand has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand">
							<input type="radio" name="arrival" value="oev" checked={v.arrival === 'oev'} class="sr-only" /><Bus size={22} strokeWidth={2.25} class="text-brand" aria-hidden="true" />{t.request.bus}
						</label>
						<label class="flex cursor-pointer items-center gap-2.5 rounded-[18px] border-2 border-line px-4 py-3 font-semibold transition-colors hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-wash has-[:checked]:text-brand has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand">
							<input type="radio" name="arrival" value="auto" checked={v.arrival === 'auto'} class="sr-only" /><Car size={22} strokeWidth={2.25} class="text-brand" aria-hidden="true" />{t.request.car}
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
				<legend class="mb-1 text-2xl font-bold text-brand">{t.request.steps[2]}</legend>
				{#if q?.ok}
					<div class="card p-4">
						<p class="font-semibold">{fmtDate(checkIn, data.lang, { year: undefined })} – {fmtDate(checkOut, data.lang)}</p>
						<p class="text-sm text-muted">{guests.adults} {t.card.adults}{guests.children ? `, ${guests.children} ${t.card.children}` : ''}{guests.infants ? `, ${guests.infants} ${t.card.infants}` : ''}</p>
						<div class="mt-3 border-t-2 border-line pt-3">
							<Quote {checkIn} {checkOut} guests={{ ...guests, linen: Math.min(guests.linen, people) }} seasons={data.seasons} rates={data.rates} taken={data.taken} lang={data.lang} />
						</div>
					</div>
				{/if}
				{#each [{ title: t.sections.rules, html: textToHtml(data.rules) }, { title: t.sections.payment, html: textToHtml(data.payment) }] as d (d.title)}
					<details class="group rounded-[20px] border-2 border-line px-4 py-3 open:border-brand">
						<summary class="flex cursor-pointer list-none items-center justify-between font-bold">{d.title}<ChevronDown size={20} strokeWidth={2.5} class="text-brand transition group-open:rotate-180" aria-hidden="true" /></summary>
						<div class="richtext mt-2">{@html d.html}</div>
					</details>
				{/each}
				<p class="text-sm text-muted">{t.request.consent} <a href={localize(data.lang, '/datenschutz')} class="font-semibold text-brand underline">{t.request.privacy}</a></p>
				<div class="grid {js ? 'grid-cols-[auto_1fr]' : ''} gap-3">
					{#if js}<button type="button" class="btn-line" onclick={() => go(1)}>{t.request.back}</button>{/if}
					<button class="btn-primary" disabled={sending || (js && !nonce)} aria-busy={sending}>
						{#if sending}<Huettli run class="-my-2 w-8 text-brand [--paper:var(--color-accent)]" />{/if}
						{sending || (js && !nonce) ? t.request.sending : t.request.submit}
					</button>
				</div>
				<p class="text-center text-sm text-muted">{t.card.noPay}</p>
			</fieldset>
		</form>
		<noscript><p class="mt-6 text-sm text-muted">{t.request.noscript}</p></noscript>
	{/if}
</div>
