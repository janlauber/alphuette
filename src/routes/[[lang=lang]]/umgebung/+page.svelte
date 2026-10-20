<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import Signposts from '#lib/components/Signposts.svelte';
	import { dict, localize } from '#lib/i18n.ts';
	import { textToHtml } from '#lib/text.ts';

	let { data } = $props();
	const t = $derived(dict[data.lang]);
	const en = $derived(data.lang === 'en');
</script>

<Seo
	title={en ? 'Hiking and surroundings in the Kiental' : 'Wandern und Ausflüge im Kiental'}
	description={en
		? 'Hikes from Griesalp and Kiental: Pochten falls, Tschingelsee, Gamchi, Hohtürli. Shops, restaurants and the free guest card.'
		: 'Wanderungen ab Griesalp und Kiental: Pochtenfall, Tschingelsee, Gamchi, Hohtürli. Einkaufen, Restaurants und die Gästekarte.'}
	path="/umgebung"
	lang={data.lang}
	siteUrl={data.siteUrl}
/>

<div class="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
	<h1 class="text-[clamp(2.4rem,6vw,4rem)]">{en ? 'Around the hut' : 'Rund ums Hüttli'}</h1>
	<p class="mt-3 max-w-[56ch] text-lg text-stein">
		{en
			? 'The Kiental is a quiet side valley of the Kandertal. Waterfalls, alpine pastures and the Blüemlisalp massif are within walking distance.'
			: 'Das Kiental ist ein ruhiges Seitental des Kandertals. Wasserfälle, Alpweiden und das Blüemlisalpmassiv erreichst du zu Fuss.'}
	</p>

	<div class="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
		<section>
			<h2 class="text-[1.75rem]">{t.sections.hikes}</h2>
			<p class="mt-2 text-stein">{t.hikes.intro}</p>
			<div class="mt-8"><Signposts tips={data.tips} lang={data.lang} /></div>
			<p class="mt-6 flex items-center gap-3 text-sm text-stein">
				<span class="inline-block h-3 w-8 bg-[linear-gradient(to_bottom,#fff_0_33%,#d52b1e_33%_67%,#fff_67%)] outline outline-1 outline-linie"></span>
				{t.hikes.mountain}
			</p>
		</section>
		<section class="richtext max-w-[60ch] [&_p]:mt-0 [&_p+p]:mt-6">
			{@html textToHtml(data.area)}
		</section>
	</div>

	<a href="{localize(data.lang, '/')}#buchen" class="btn-gelb mt-14">{en ? 'Check availability' : 'Freie Daten ansehen'}</a>
</div>
