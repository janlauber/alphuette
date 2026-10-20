<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import { dict } from '#lib/i18n.ts';

	let { data } = $props();
	const t = $derived(dict[data.lang]);
</script>

<Seo title={t.legal.imprint} description={data.hutName} path="/impressum" lang={data.lang} siteUrl={data.siteUrl} />

<div class="mx-auto max-w-[62ch] px-4 pt-8 sm:px-6">
	<h1 class="text-[2.6rem]">{t.legal.imprint}</h1>
	<p class="mt-6">
		{data.host.name}<br />
		{#if data.host.street}{data.host.street}<br />{/if}
		{data.host.zip} {data.host.city}<br />
		<a href="mailto:{data.host.email}" class="font-semibold text-brand underline">{data.host.email}</a>
	</p>
	<p class="mt-6 text-muted">
		{t.legal.rental}{data.lang === 'fr' ? '\u00a0' : ''}: {data.hutName}, Lengschwendi, 3723 Kiental
	</p>
</div>
