<script lang="ts">
	import { page } from '$app/state';
	import Huettli from '#lib/components/Huettli.svelte';
	import Panorama from '#lib/components/Panorama.svelte';
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

<a href="#inhalt" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-white">{t.skip}</a>

<div class="flex min-h-dvh flex-col">
<header class="sticky top-0 z-30 border-b-2 border-line bg-paper/95 backdrop-blur">
	<div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
		<a href={localize(data.lang, '/')} class="group flex items-center gap-2 text-brand no-underline">
			<Huettli mini class="size-9 transition-transform group-hover:-rotate-6 sm:size-10" />
			<span class="text-[1.15rem] font-bold leading-none tracking-tight sm:text-[1.3rem]">Alphütte<span class="hidden font-semibold opacity-70 sm:inline">&nbsp;Blüemlisalpblick</span></span>
		</a>
		<nav class="flex items-center gap-0.5 text-[14px] font-semibold sm:gap-1 sm:text-[15px]">
			{#each links as l (l.href)}
				{@const active = path.startsWith(l.href)}
				<a href={localize(data.lang, l.href)} class="rounded-full border-2 px-2.5 py-1.5 no-underline transition-colors sm:px-3 {active ? 'border-brand text-brand' : 'border-transparent hover:bg-wash'}" aria-current={active ? 'page' : undefined}>{l.label}</a>
			{/each}
			<a href={localize(t.nav.otherLang, path)} hreflang={t.nav.otherLang} lang={t.nav.otherLang} aria-label={t.nav.otherName} class="rounded-full border-2 border-transparent px-2.5 py-1.5 no-underline hover:bg-wash sm:px-3">{t.nav.other}</a>
			<a href="{localize(data.lang, '/')}#buchen" class="btn-primary ml-2 hidden !min-h-10 !px-4 !py-1.5 text-sm lg:inline-flex">{t.nav.request}</a>
		</nav>
	</div>
</header>

<main id="inhalt" class="flex-1">
	{@render children()}
</main>

<footer class="mt-24 text-brand">
	<Panorama ground="brand" sky={false} class="h-28 w-full sm:h-44 lg:h-72" />
	<div class="-mt-px bg-brand pb-32 text-white lg:pb-12">
		<div class="mx-auto grid max-w-6xl gap-10 px-5 pt-6 sm:grid-cols-[auto_1fr_1fr_auto] sm:px-6">
			<Huettli face="sleep" pose="stand" animate class="w-24 text-white [--paper:var(--color-brand)]" />
			<div>
				<p class="text-xl font-bold">{data.hutName}</p>
				<p class="mt-2 opacity-80">Lengschwendi<br />3723 Kiental</p>
			</div>
			<div>
				<p class="font-bold">{t.footer.contact}</p>
				<p class="mt-2 opacity-80">{data.host.name}</p>
				<a href="mailto:{data.host.email}" class="underline">{data.host.email}</a>
				{#if whatsapp}<a href={whatsapp} class="mt-1 block underline" rel="noopener" target="_blank">{t.footer.whatsapp}</a>{/if}
			</div>
			<nav class="flex flex-col gap-1.5 font-semibold sm:items-end">
				<a href={localize(data.lang, '/wanderungen')} class="no-underline hover:underline">{t.nav.hikes}</a>
				<a href={localize(data.lang, '/umgebung')} class="no-underline hover:underline">{t.nav.area}</a>
				<a href={localize(data.lang, '/impressum')} class="no-underline hover:underline">{t.footer.imprint}</a>
				<a href={localize(data.lang, '/datenschutz')} class="no-underline hover:underline">{t.footer.privacy}</a>
			</nav>
		</div>
	</div>
</footer>
</div>
