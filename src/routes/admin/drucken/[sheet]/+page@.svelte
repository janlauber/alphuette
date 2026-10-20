<script lang="ts">
	import { page } from '$app/state';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Printer from '@lucide/svelte/icons/printer';
	import Huettli from '#lib/components/Huettli.svelte';
	import Panorama from '#lib/components/Panorama.svelte';
	import { ICONS } from '#lib/icons.ts';
	import { chf } from '#lib/booking.ts';
	import { textToHtml } from '#lib/text.ts';

	let { data } = $props();
	const landscape = $derived(page.url.searchParams.get('format') === 'quer');
	const show = $derived(new Set((page.url.searchParams.get('teile') ?? 'gut,regeln,umgebung,notfall,qr').split(',')));

	// Words on the sheets, in the four languages of the website
	const L = {
		de: {
			welcome: 'Willkommen im Hüttli', times: (a: string, b: string) => `Ankunft ab ${a} Uhr · Abreise bis ${b} Uhr`, good: 'Gut zu wissen', rules: 'Hausregeln',
			area: 'Einkaufen und Essen', emergency: 'Notfall', ambulance: 'Sanität', police: 'Polizei', fire: 'Feuerwehr', rega: 'Rega, Rettungshelikopter',
			contact: 'Fragen? Melde dich bei', hikes: 'Wanderungen ab dem Hüttli', bus: 'Postauto-Fahrplan', nearby: 'Läden und Restaurants', thanks: 'Schöne Tage im Kiental!',
			flyerTitle: 'Ferien im Alphüttli', flyerSub: 'Zu mieten in Lengschwendi, Kiental', people: (n: number) => `1 bis ${n} Personen`, weeks: (a: string, b: string) => `Wochenweise, ${a} bis ${b}`,
			from: (p: string) => `ab ${p} pro Woche`, scan: 'Freie Wochen und Anfrage', other: 'Hut for rent · Chalet à louer · Baita in affitto'
		},
		en: {
			welcome: 'Welcome to the hut', times: (a: string, b: string) => `Arrival from ${a} · Departure by ${b}`, good: 'Good to know', rules: 'House rules',
			area: 'Shopping and eating out', emergency: 'Emergency', ambulance: 'Ambulance', police: 'Police', fire: 'Fire brigade', rega: 'Rega, air rescue',
			contact: 'Questions? Contact', hikes: 'Hikes from the hut', bus: 'Bus timetable', nearby: 'Shops and restaurants', thanks: 'Enjoy your days in the Kiental!',
			flyerTitle: 'Holidays in an alpine hut', flyerSub: 'For rent in Lengschwendi, Kiental', people: (n: number) => `1 to ${n} people`, weeks: (a: string, b: string) => `By the week, ${a} to ${b}`,
			from: (p: string) => `from ${p} per week`, scan: 'Free weeks and booking request', other: 'Alphütte zu mieten · Chalet à louer · Baita in affitto'
		},
		fr: {
			welcome: 'Bienvenue au chalet', times: (a: string, b: string) => `Arrivée dès ${a} · Départ jusqu'à ${b}`, good: 'Bon à savoir', rules: 'Règles de la maison',
			area: 'Courses et restaurants', emergency: 'Urgence', ambulance: 'Ambulance', police: 'Police', fire: 'Pompiers', rega: 'Rega, sauvetage aérien',
			contact: 'Des questions ? Contacte', hikes: 'Randonnées depuis le chalet', bus: 'Horaire du car postal', nearby: 'Magasins et restaurants', thanks: 'Beaux jours dans le Kiental !',
			flyerTitle: 'Vacances au chalet d’alpage', flyerSub: 'À louer à Lengschwendi, Kiental', people: (n: number) => `1 à ${n} personnes`, weeks: (a: string, b: string) => `À la semaine, de ${a} à ${b}`,
			from: (p: string) => `dès ${p} la semaine`, scan: 'Semaines libres et demande', other: 'Alphütte zu mieten · Hut for rent · Baita in affitto'
		},
		it: {
			welcome: 'Benvenuti nella baita', times: (a: string, b: string) => `Arrivo dalle ${a} · Partenza entro le ${b}`, good: 'Buono a sapersi', rules: 'Regole della casa',
			area: 'Spesa e ristoranti', emergency: 'Emergenza', ambulance: 'Ambulanza', police: 'Polizia', fire: 'Pompieri', rega: 'Rega, soccorso aereo',
			contact: 'Domande? Contatta', hikes: 'Escursioni dalla baita', bus: 'Orario dell’autopostale', nearby: 'Negozi e ristoranti', thanks: 'Buone giornate nel Kiental!',
			flyerTitle: 'Vacanze in baita', flyerSub: 'In affitto a Lengschwendi, Kiental', people: (n: number) => `Da 1 a ${n} persone`, weeks: (a: string, b: string) => `A settimana, da ${a} a ${b}`,
			from: (p: string) => `da ${p} a settimana`, scan: 'Settimane libere e richiesta', other: 'Alphütte zu mieten · Hut for rent · Chalet à louer'
		}
	};
	const t = $derived(L[data.lang]);
	const locale = $derived({ de: 'de-CH', en: 'en-GB', fr: 'fr-CH', it: 'it-CH' }[data.lang]);
	const month = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString(locale, { month: 'long', timeZone: 'UTC' });
	const hours = (m: number | null) => (m ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} h` : '');

	const set = (key: string, value: string | null) => {
		const u = new URL(page.url.href);
		if (value === null) u.searchParams.delete(key);
		else u.searchParams.set(key, value);
		return u.pathname + u.search;
	};
	const toggle = (part: string) => set('teile', [...(show.has(part) ? [...show].filter((p) => p !== part) : [...show, part])].join(','));

	// fits the sheet into the window on screen; paper always gets 100 %
	let width = $state(1200);
	const scale = $derived(Math.min(1, (width - 32) / ((landscape ? 297 : 210) * 3.7795)));
</script>

<svelte:window bind:innerWidth={width} />
<svelte:head>
	<title>{data.sheet === 'flyer' ? 'Flyer' : 'Infoblatt'} drucken · Alphütte</title>
	<meta name="robots" content="noindex" />
	{@html `<style>@page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 0 }</style>`}
</svelte:head>

<div class="toolbar sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b-2 border-line bg-paper px-4 py-3">
	<a href="/admin/drucken" class="btn-line !min-h-0 !px-3 !py-1.5 text-sm no-underline"><ArrowLeft size={16} aria-hidden="true" />Zurück</a>
	<span class="mx-2 hidden h-6 border-l-2 border-line sm:block"></span>
	<a href={set('format', null)} class="pill no-underline {landscape ? '' : '!bg-brand !text-white'}">Hochformat</a>
	<a href={set('format', 'quer')} class="pill no-underline {landscape ? '!bg-brand !text-white' : ''}">Querformat</a>
	<span class="mx-2 hidden h-6 border-l-2 border-line sm:block"></span>
	{#each ['de', 'en', 'fr', 'it'] as l (l)}
		<a href={set('sprache', l === 'de' ? null : l)} class="pill no-underline {data.lang === l ? '!bg-brand !text-white' : ''}">{l.toUpperCase()}</a>
	{/each}
	{#if data.sheet === 'infoblatt'}
		<span class="mx-2 hidden h-6 border-l-2 border-line sm:block"></span>
		{#each [['gut', t.good], ['regeln', t.rules], ['umgebung', t.area], ['notfall', t.emergency], ['qr', 'QR-Codes']] as [k, label] (k)}
			<a href={toggle(k)} class="pill no-underline {show.has(k) ? '!border-brand' : 'opacity-50 line-through'}">{label}</a>
		{/each}
	{/if}
	<button type="button" class="btn-primary ml-auto" onclick={() => print()}><Printer size={18} aria-hidden="true" />Drucken</button>
</div>

<div class="screen grid justify-center bg-wash px-4 py-8">
	<div class="sheet {landscape ? 'landscape' : 'portrait'}" style="zoom: {scale}" lang={data.lang}>
		{#if data.sheet === 'infoblatt'}
			<header class="flex items-center gap-4 border-b-[3px] border-brand pb-3">
				<Huettli mini face="happy" class="size-[22mm] shrink-0 text-brand" />
				<div class="min-w-0 flex-1">
					<p class="text-[11pt] font-semibold text-muted">{data.name}</p>
					<h1 class="text-[26pt] leading-tight">{t.welcome}</h1>
				</div>
				<p class="rounded-full bg-accent px-4 py-1.5 text-[11pt] font-bold text-ink">{t.times(data.times.in, data.times.out)}</p>
			</header>

			<div class="body mt-4 text-[10pt] leading-snug" style="columns: {landscape ? 3 : 2}; column-gap: 8mm">
				{#if show.has('gut') && data.texts.goodToKnow}<section><h2>{t.good}</h2><div class="richtext">{@html textToHtml(data.texts.goodToKnow)}</div></section>{/if}
				{#if show.has('regeln') && data.texts.rules}<section><h2>{t.rules}</h2><div class="richtext">{@html textToHtml(data.texts.rules)}</div></section>{/if}
				{#if show.has('umgebung') && data.texts.area}<section><h2>{t.area}</h2><div class="richtext">{@html textToHtml(data.texts.area)}</div></section>{/if}
				{#if show.has('notfall')}
					<section class="emergency">
						<h2>{t.emergency}</h2>
						<dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
							<dt class="font-bold">144</dt><dd>{t.ambulance}</dd>
							<dt class="font-bold">117</dt><dd>{t.police}</dd>
							<dt class="font-bold">118</dt><dd>{t.fire}</dd>
							<dt class="font-bold">1414</dt><dd>{t.rega}</dd>
						</dl>
						<p class="mt-2">{t.contact} <strong>{data.host.name}</strong>{#if data.host.phone}, <strong class="whitespace-nowrap">{data.host.phone}</strong>{/if}{#if data.host.email}, {data.host.email}{/if}</p>
					</section>
				{/if}
			</div>

			{#if show.has('qr')}
				<footer class="mt-auto grid grid-cols-3 gap-[6mm] border-t-[3px] border-brand pt-4">
					{#each [[data.qr.hikes, t.hikes], [data.qr.bus, t.bus], [data.qr.area, t.nearby]] as [svg, label] (label)}
						<figure class="flex items-center gap-3">
							<div class="qr size-[26mm] shrink-0">{@html svg}</div>
							<figcaption class="text-[10pt] font-bold leading-tight text-brand">{label}</figcaption>
						</figure>
					{/each}
				</footer>
			{/if}
			<p class="mt-3 text-center text-[10pt] font-semibold text-muted">{t.thanks}</p>
		{:else}
			<div class="flyer flex h-full flex-col {landscape ? 'flyer-l' : ''}">
				{#if data.photos.hero && landscape}
					<div class="flex h-[84mm] shrink-0 gap-[4mm] overflow-hidden">
						<img src="/bilder/photos/{data.photos.hero.key}-1600.webp" alt={data.photos.hero.alt} class="h-[84mm] min-w-0 flex-[2] rounded-[7mm] border-[3px] border-brand object-cover object-bottom" />
						<div class="flex min-w-0 flex-1 flex-col gap-[4mm]">
							{#each data.photos.more.slice(0, 2) as p (p.key)}<img src="/bilder/photos/{p.key}-960.webp" alt={p.alt} class="h-[40mm] w-full rounded-[6mm] border-[3px] border-brand object-cover" />{/each}
						</div>
					</div>
				{:else if data.photos.hero}
					<div class="relative h-[112mm]">
						<img src="/bilder/photos/{data.photos.hero.key}-1600.webp" alt={data.photos.hero.alt} class="absolute inset-0 size-full rounded-[8mm] border-[3px] border-brand object-cover object-bottom" />
						<div class="absolute -bottom-[12mm] right-[6mm] flex gap-[3mm]">
							{#each data.photos.more as p, i (p.key)}
								<img src="/bilder/photos/{p.key}-960.webp" alt={p.alt} class="size-[36mm] rounded-[5mm] border-[3px] border-white object-cover shadow-[0_2mm_0_var(--color-brand)] {['-rotate-3', 'rotate-2', '-rotate-1'][i]}" />
							{/each}
						</div>
					</div>
				{:else}
					<div class="relative overflow-hidden rounded-[8mm] border-[3px] border-brand bg-paper {landscape ? 'h-[92mm]' : 'h-[110mm]'}">
						<Panorama hut={data.name} animate={false} class="absolute inset-0 h-full w-full" />
					</div>
				{/if}
				<div class="{data.photos.hero && !landscape ? 'mt-[16mm]' : 'mt-[8mm]'} grid flex-1 gap-[8mm] {landscape ? 'grid-cols-[1fr_62mm]' : 'grid-cols-1'}">
					<div>
						<p class="text-[14pt] font-semibold text-muted">{data.name}</p>
						<h1 class="text-[{landscape ? 40 : 46}pt] leading-[1.02]" style="font-size: {landscape ? 40 : 46}pt">{t.flyerTitle}</h1>
						<p class="mt-2 text-[16pt] font-semibold text-ink">{t.flyerSub}</p>
						<ul class="mt-[6mm] grid gap-2 text-[13pt] font-semibold text-ink {landscape ? 'grid-cols-2' : 'grid-cols-2'}">
							<li class="flex items-center gap-2"><span class="dot">✓</span>{t.people(data.maxGuests)}</li>
							{#if data.months}<li class="flex items-center gap-2"><span class="dot">✓</span>{t.weeks(month(data.months.from), month(data.months.to))}</li>{/if}
							{#each data.amenities.slice(0, landscape ? 4 : 4) as a (a.label)}
								{@const Icon = ICONS[a.icon as keyof typeof ICONS] ?? ICONS.info}
								<li class="flex items-center gap-2"><span class="dot"><Icon size={15} strokeWidth={2.5} /></span>{a.label}</li>
							{/each}
						</ul>
						{#if data.fromWeekly}<p class="mt-[6mm] inline-block rounded-full bg-accent px-5 py-2 text-[18pt] font-bold text-ink">{t.from(chf(data.fromWeekly))}</p>{/if}
					</div>
					<div class="flex {landscape ? 'flex-col justify-end' : 'items-end justify-between gap-[8mm]'}">
						<figure class="flex flex-col items-center gap-2 rounded-[6mm] border-[3px] border-brand p-[4mm]">
							<div class="qr size-[48mm]">{@html data.qr.site}</div>
							<figcaption class="text-center text-[12pt] font-bold text-brand">{t.scan}</figcaption>
						</figure>
						<div class="{landscape ? 'mt-4' : 'text-right'}">
							<p class="text-[20pt] font-bold text-brand">{data.site}</p>
							{#if data.host.email}<p class="text-[11pt] text-muted">{data.host.email}</p>{/if}
						</div>
					</div>
				</div>
				<p class="mt-[6mm] border-t-[3px] border-brand pt-3 text-center text-[11pt] font-semibold text-muted">{t.other}</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.sheet {
		display: flex;
		flex-direction: column;
		background: white;
		padding: 12mm 13mm;
		box-shadow: 0 6px 0 var(--color-brand);
		border: 2px solid var(--color-brand);
		border-radius: 4px;
		color: var(--color-ink);
		print-color-adjust: exact;
		-webkit-print-color-adjust: exact;
		overflow: hidden;
	}
	.portrait {
		width: 210mm;
		height: 297mm;
	}
	.landscape {
		width: 297mm;
		height: 210mm;
	}
	.body :global(h2) {
		font-size: 13pt;
		margin: 0 0 1.5mm;
		break-after: avoid;
	}
	.body section {
		break-inside: avoid-column;
		margin-bottom: 5mm;
	}
	.emergency {
		border: 2px solid var(--color-brand);
		border-radius: 4mm;
		padding: 3mm 4mm;
	}
	.qr :global(svg) {
		width: 100%;
		height: 100%;
	}
	.dot {
		display: grid;
		place-items: center;
		width: 7mm;
		height: 7mm;
		flex-shrink: 0;
		border-radius: 999px;
		background: var(--color-brand);
		color: white;
		font-size: 10pt;
	}
	@media print {
		.toolbar {
			display: none;
		}
		.screen {
			padding: 0;
			background: white;
			display: block;
		}
		.sheet {
			zoom: 1 !important;
			box-shadow: none;
			border: 0;
			border-radius: 0;
		}
	}
</style>
