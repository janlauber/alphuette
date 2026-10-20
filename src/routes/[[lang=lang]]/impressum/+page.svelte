<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();
	const en = $derived(data.lang === 'en');
</script>

<Seo title={en ? 'Legal notice' : 'Impressum'} description={data.hutName} path="/impressum" lang={data.lang} siteUrl={data.siteUrl} />

<div class="mx-auto max-w-[62ch] px-4 pt-8 sm:px-6">
	<h1 class="text-4xl">{en ? 'Legal notice' : 'Impressum'}</h1>
	<p class="mt-6">
		{data.host.name}<br />
		{#if data.host.street}{data.host.street}<br />{/if}
		{data.host.zip} {data.host.city}<br />
		<a href="mailto:{data.host.email}">{data.host.email}</a>
	</p>
	<p class="mt-6 text-stein">
		{en ? 'Rental property' : 'Mietobjekt'}: {data.hutName}, Lengschwendi, 3723 Kiental
	</p>
</div>
