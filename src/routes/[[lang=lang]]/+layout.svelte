<script lang="ts">
	import { page } from '$app/state';
	import { dict, localize } from '#lib/i18n.ts';

	let { data, children } = $props();
	const t = $derived(dict[data.lang]);
	const path = $derived(page.url.pathname.replace(/^\/en(?=\/|$)/, '') || '/');
	const whatsapp = $derived(
		data.host.whatsapp
			? `https://wa.me/${data.host.whatsapp.replace(/\D/g, '').replace(/^0/, '41')}?text=${encodeURIComponent(data.lang === 'en' ? 'Hello Tom, I have a question about the Alphütte: ' : 'Hoi Tom, ich habe eine Frage zur Alphütte: ')}`
			: ''
	);
</script>

<a href="#inhalt" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-gelb focus:px-3 focus:py-2">
	{data.lang === 'en' ? 'Skip to content' : 'Zum Inhalt'}
</a>

<header class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
	<a href={localize(data.lang, '/')} class="font-serif text-xl leading-none no-underline sm:text-[1.4rem]">{data.hutName}</a>
	<nav class="flex items-center gap-4 text-[0.95rem] sm:gap-6">
		<a href={localize(data.lang, '/umgebung')} class="hidden no-underline hover:underline sm:inline" aria-current={path === '/umgebung' ? 'page' : undefined}>{t.nav.area}</a>
		<a href={localize(t.nav.otherLang, path)} hreflang={t.nav.otherLang} lang={t.nav.otherLang} class="no-underline hover:underline">{t.nav.other}</a>
		<a href="{localize(data.lang, '/')}#buchen" class="btn-line hidden !py-1.5 sm:inline-flex">{t.nav.request}</a>
	</nav>
</header>

<main id="inhalt">
	{@render children()}
</main>

<footer class="mt-24 bg-tanne text-kalk">
	<div class="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
		<div>
			<p class="font-serif text-xl">{data.hutName}</p>
			<p class="mt-2 text-kalk/75">Lengschwendi<br />3723 Kiental</p>
		</div>
		<div>
			<p class="font-semibold">{t.footer.contact}</p>
			<p class="mt-2 text-kalk/75">{data.host.name}</p>
			<a href="mailto:{data.host.email}" class="text-kalk/90 underline">{data.host.email}</a>
			{#if whatsapp}
				<a href={whatsapp} class="mt-1 block text-kalk/90 underline" rel="noopener" target="_blank">{t.footer.whatsapp}</a>
			{/if}
		</div>
		<nav class="flex flex-col gap-1 sm:items-end">
			<a href={localize(data.lang, '/umgebung')} class="text-kalk/90 no-underline hover:underline">{t.nav.area}</a>
			<a href={localize(data.lang, '/impressum')} class="text-kalk/90 no-underline hover:underline">{t.footer.imprint}</a>
			<a href={localize(data.lang, '/datenschutz')} class="text-kalk/90 no-underline hover:underline">{t.footer.privacy}</a>
		</nav>
	</div>
</footer>
