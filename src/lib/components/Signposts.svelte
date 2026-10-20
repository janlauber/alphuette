<script lang="ts">
	import Signpost from './Signpost.svelte';
	import type { Lang } from '#lib/i18n.ts';

	type Tip = { name: string; time: string; alpine: boolean; de: string; en: string; url: string };
	let { tips, lang, describe = true }: { tips: Tip[]; lang: Lang; describe?: boolean } = $props();
</script>

<!-- A signpost: white location plate on top, yellow direction plates below, all on one pole -->
<div class="relative max-w-xl pl-5">
	<div class="absolute bottom-0 left-0 top-0 w-1.5 rounded-sm bg-[#8b928b]" aria-hidden="true"></div>
	<p class="mb-2 inline-flex items-baseline gap-3 border border-tanne bg-white px-3 py-1.5 font-bold">
		Lengschwendi <span class="font-semibold tabular-nums">1200 m</span>
	</p>
	<ul class="grid gap-5">
		{#each tips as tip (tip.name)}
			<li>
				<Signpost name={tip.name} time={tip.time} alpine={tip.alpine} href={tip.url} />
				{#if describe}<p class="mt-1.5 text-stein">{tip[lang]}</p>{/if}
			</li>
		{/each}
	</ul>
</div>
