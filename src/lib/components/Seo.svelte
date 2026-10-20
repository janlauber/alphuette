<script lang="ts">
	import { LANGS, localize, type Lang } from '#lib/i18n.ts';

	const OG_LOCALE: Record<Lang, string> = { de: 'de_CH', en: 'en_GB', fr: 'fr_CH', it: 'it_CH' };

	let {
		title,
		description,
		path,
		lang,
		siteUrl,
		image = '',
		jsonld = null
	}: { title: string; description: string; path: string; lang: Lang; siteUrl: string; image?: string; jsonld?: object | null } =
		$props();
	const ld = $derived(jsonld ? JSON.stringify(jsonld).replace(/</g, '\\u003c') : '');
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={siteUrl + localize(lang, path)} />
	{#each LANGS as l (l)}
		<link rel="alternate" hreflang={l} href={siteUrl + localize(l, path)} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={siteUrl + localize('de', path)} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={siteUrl + localize(lang, path)} />
	<meta property="og:locale" content={OG_LOCALE[lang]} />
	{#if image}
		<meta property="og:image" content={image} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
	{#if ld}
		{@html `<script type="application/ld+json">${ld}</script>`}
	{/if}
</svelte:head>
