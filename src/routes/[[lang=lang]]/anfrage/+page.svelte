<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Quote from '#lib/components/Quote.svelte';
	import { chf } from '#lib/booking.ts';
	import Seo from '#lib/components/Seo.svelte';
	import { dict, localize, weekdayName } from '#lib/i18n.ts';
	import { textToHtml } from '#lib/text.ts';

	let { data, form } = $props();
	const t = $derived(dict[data.lang]);
	const v = $derived(form?.values ?? {});
	const invalid = $derived(new Set<string>(form && 'invalid' in form ? (form.invalid as string[]) : []));

	// The form starts from the query string and is edited locally afterwards.
	const initial = untrack(() => data.initial);
	let checkIn = $state(initial.checkIn);
	let checkOut = $state(initial.checkOut);
	let adults = $state(initial.adults);
	let children = $state(initial.children);
	let infants = $state(initial.infants);
	let linen = $state(initial.linen);
	let sending = $state(false);

	const range = (n: number, from = 0) => Array.from({ length: n - from + 1 }, (_, i) => i + from);
	const serverError = $derived.by(() => {
		const e = form?.error;
		if (!e) return '';
		if (e === 'invalid') return t.request.invalid;
		if (e === 'tooMany') return t.request.tooMany;
		if (e === 'min') return t.errors.min(data.seasons[0]?.minNights ?? 1);
		if (e === 'changeover') return t.errors.changeover(weekdayName(data.seasons[0]?.changeover ?? 6, data.lang));
		if (e === 'guests') return t.errors.guests(data.rates.maxGuests);
		return t.errors[e as 'dates' | 'closed' | 'taken'] ?? t.request.invalid;
	});
</script>

<Seo
	title="{t.request.title} · {data.hutName}"
	description={data.lang === 'en' ? 'Send a booking request for the alpine hut in the Kiental.' : 'Sende eine Buchungsanfrage für das Alphüttli im Kiental.'}
	path="/anfrage"
	lang={data.lang}
	siteUrl={data.siteUrl}
/>

<div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
	<a href="{localize(data.lang, '/')}#buchen" class="text-stein">{data.hutName}</a>
	<h1 class="mt-2 text-[clamp(2.2rem,5vw,3.25rem)]">{t.request.title}</h1>

	<form
		method="POST"
		class="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]"
		use:enhance={() => {
			sending = true;
			return async ({ update }) => {
				await update({ reset: false });
				sending = false;
			};
		}}
	>
		<div class="grid content-start gap-10">
			<fieldset class="grid gap-4">
				<legend class="mb-3 font-serif text-2xl">{t.request.stay}</legend>
				<div class="grid grid-cols-2 gap-3">
					<label class="label">{t.card.checkIn}<input type="date" name="checkIn" bind:value={checkIn} required class="field mt-1 font-normal" /></label>
					<label class="label">{t.card.checkOut}<input type="date" name="checkOut" bind:value={checkOut} min={checkIn} required class="field mt-1 font-normal" /></label>
				</div>
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<label class="label">{t.card.adults} <span class="hint block text-sm">{t.card.adultsHint}</span>
						<select name="adults" bind:value={adults} class="field mt-1 font-normal">{#each range(data.rates.maxGuests, 1) as n (n)}<option value={n}>{n}</option>{/each}</select></label>
					<label class="label">{t.card.children} <span class="hint block text-sm">{t.card.childrenHint}</span>
						<select name="children" bind:value={children} class="field mt-1 font-normal">{#each range(data.rates.maxGuests - 1) as n (n)}<option value={n}>{n}</option>{/each}</select></label>
					<label class="label">{t.card.infants} <span class="hint block text-sm">{t.card.infantsHint}</span>
						<select name="infants" bind:value={infants} class="field mt-1 font-normal">{#each range(data.rates.maxGuests - 1) as n (n)}<option value={n}>{n}</option>{/each}</select></label>
					<label class="label">{t.card.linen} <span class="hint block text-sm">{t.card.linenHint(chf(data.rates.linen))}</span>
						<select name="linen" bind:value={linen} class="field mt-1 font-normal">{#each range(data.rates.maxGuests) as n (n)}<option value={n}>{n}</option>{/each}</select></label>
				</div>
			</fieldset>

			<fieldset class="grid gap-4">
				<legend class="mb-3 font-serif text-2xl">{t.request.you}</legend>
				<label class="label">{t.request.name}
					<input name="name" autocomplete="name" required minlength="2" maxlength="100" value={v.name ?? ''} aria-invalid={invalid.has('name')} class="field mt-1 font-normal" /></label>
				<div class="grid gap-4 sm:grid-cols-2">
					<label class="label">{t.request.email}
						<input name="email" type="email" autocomplete="email" required value={v.email ?? ''} aria-invalid={invalid.has('email')} class="field mt-1 font-normal" /></label>
					<label class="label">{t.request.phone} <span class="hint">({t.request.optional})</span>
						<input name="phone" type="tel" autocomplete="tel" maxlength="40" value={v.phone ?? ''} class="field mt-1 font-normal" /></label>
				</div>
				<label class="label">{t.request.city}
					<input name="city" autocomplete="address-level2" required maxlength="100" value={v.city ?? ''} aria-invalid={invalid.has('city')} class="field mt-1 font-normal" /></label>
				<fieldset>
					<legend class="label">{t.request.arrival} <span class="hint">({t.request.optional})</span></legend>
					<div class="flex gap-6">
						<label class="flex items-center gap-2"><input type="radio" name="arrival" value="auto" checked={v.arrival === 'auto'} class="size-4 accent-tanne" /> {t.request.car}</label>
						<label class="flex items-center gap-2"><input type="radio" name="arrival" value="oev" checked={v.arrival === 'oev'} class="size-4 accent-tanne" /> {t.request.bus}</label>
					</div>
				</fieldset>
				<label class="label">{t.request.note} <span class="hint">({t.request.optional})</span>
					<textarea name="note" rows="4" maxlength="3000" placeholder={t.request.notePlaceholder} class="field mt-1 font-normal">{v.note ?? ''}</textarea></label>
				<!-- Honeypot: people never see or fill this -->
				<div class="hidden" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off" /></label></div>
			</fieldset>

			<details class="rounded-[3px] border border-linie bg-paper p-4">
				<summary class="cursor-pointer font-semibold">{t.sections.rules}</summary>
				<div class="richtext mt-3">{@html textToHtml(data.rules)}</div>
			</details>
		</div>

		<aside class="lg:sticky lg:top-6 lg:self-start">
			<div class="rounded-[3px] border border-linie bg-paper p-5">
				{#if checkIn && checkOut}
					<Quote {checkIn} {checkOut} guests={{ adults, children, infants, linen }} seasons={data.seasons} rates={data.rates} taken={data.taken} lang={data.lang} />
				{:else}
					<p class="text-stein">{t.errors.dates}</p>
				{/if}
				{#if serverError}<p class="mt-4 text-rot" role="alert">{serverError}</p>{/if}
				<button class="btn-gelb mt-5 w-full" disabled={sending}>{t.request.submit}</button>
				<p class="mt-3 text-sm text-stein">{t.card.noPay}</p>
				<p class="mt-2 text-sm text-stein">
					{t.request.consent} <a href={localize(data.lang, '/datenschutz')}>{t.footer.privacy}</a>
				</p>
			</div>
		</aside>
	</form>
</div>
