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
	const links = $derived([
		{ href: '/wanderungen', label: t.nav.hikes },
		{ href: '/umgebung', label: t.nav.area }
	]);
</script>

<a href="#inhalt" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-white">{t.skip}</a>

<header class="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
	<div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
		<a href={localize(data.lang, '/')} class="flex items-center gap-2 no-underline">
			<svg viewBox="0 0 32 32" class="size-7" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#d2373f" /><path d="M6 23 16 9l10 14z" fill="#fff" /><path d="M13.5 23v-5h5v5z" fill="#d2373f" /></svg>
			<span class="font-serif text-[1.15rem] leading-none">Alphütte<span class="hidden sm:inline">&nbsp;Blüemlisalpblick</span></span>
		</a>
		<nav class="flex items-center gap-1 text-[15px]">
			{#each links as l (l.href)}
				<a href={localize(data.lang, l.href)} class="rounded-full px-3 py-2 no-underline hover:bg-sand {path.startsWith(l.href) ? 'font-semibold' : ''}" aria-current={path.startsWith(l.href) ? 'page' : undefined}>{l.label}</a>
			{/each}
			<a href={localize(t.nav.otherLang, path)} hreflang={t.nav.otherLang} lang={t.nav.otherLang} aria-label={t.nav.otherName} class="rounded-full px-3 py-2 font-semibold no-underline hover:bg-sand">{t.nav.other}</a>
			<a href="{localize(data.lang, '/')}#buchen" class="btn-primary ml-2 hidden !min-h-10 !px-4 !py-2 text-sm lg:inline-flex">{t.nav.request}</a>
		</nav>
	</div>
</header>

<main id="inhalt">
	{@render children()}
</main>

<footer class="mt-20 border-t border-line bg-sand pb-28 lg:pb-0">
	<div class="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3 sm:px-6">
		<div>
			<p class="font-serif text-xl">{data.hutName}</p>
			<p class="mt-2 text-muted">Lengschwendi<br />3723 Kiental</p>
		</div>
		<div>
			<p class="font-semibold">{t.footer.contact}</p>
			<p class="mt-2 text-muted">{data.host.name}</p>
			<a href="mailto:{data.host.email}" class="underline">{data.host.email}</a>
			{#if whatsapp}<a href={whatsapp} class="mt-1 block underline" rel="noopener" target="_blank">{t.footer.whatsapp}</a>{/if}
		</div>
		<nav class="flex flex-col gap-1.5 sm:items-end">
			<a href={localize(data.lang, '/wanderungen')} class="no-underline hover:underline">{t.nav.hikes}</a>
			<a href={localize(data.lang, '/umgebung')} class="no-underline hover:underline">{t.nav.area}</a>
			<a href={localize(data.lang, '/impressum')} class="no-underline hover:underline">{t.footer.imprint}</a>
			<a href={localize(data.lang, '/datenschutz')} class="no-underline hover:underline">{t.footer.privacy}</a>
		</nav>
	</div>
</footer>
