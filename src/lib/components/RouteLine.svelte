<script lang="ts">
	import Bus from '@lucide/svelte/icons/bus';
	import Footprints from '@lucide/svelte/icons/footprints';
	import TrainFront from '@lucide/svelte/icons/train-front';
	import Huettli from './Huettli.svelte';
	import { dict, type Lang } from '#lib/i18n.ts';
	import { seen } from '#lib/seen.ts';

	type Departure = { time: string; arrival: string; line: string; delay: number };
	// From the train to the hut as one line: station, bus, stop, the last bit on foot.
	// The ride time comes from the next real departure; out of season the bus ends at Ramslauenen.
	let { lang, buses }: { lang: Lang; buses: { list: Departure[]; winter: boolean } | null } = $props();
	const t = $derived(dict[lang]);
	const first = $derived(buses?.list[0]);
	const mins = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3, 5);
	const ride = $derived(first ? (mins(first.arrival) - mins(first.time) + 1440) % 1440 : null);
	const stop = $derived(buses?.winter ? 'Kiental, Ramslauenen' : 'Kiental, Abzw. Spiggengrund');
</script>

{#snippet station(name: string)}
	<span class="font-semibold leading-tight">{name}</span>
{/snippet}

<ol {@attach seen} class="route grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[auto_minmax(3rem,1fr)_auto_minmax(3rem,1fr)_auto] sm:grid-rows-[auto_auto] sm:gap-x-3 sm:gap-y-3">
	<li class="contents">
		<span class="grid size-11 place-items-center rounded-full bg-brand text-white sm:col-start-1 sm:row-start-1"><TrainFront size={20} strokeWidth={2.25} aria-hidden="true" /></span>
		<span class="self-center sm:col-start-1 sm:row-start-2 sm:max-w-32">{@render station(t.still.train)}</span>
	</li>
	<li class="contents">
		<span class="seg mx-auto h-14 w-0.5 bg-brand sm:col-start-2 sm:row-start-1 sm:mx-0 sm:h-0.5 sm:w-auto sm:self-center"></span>
		<span class="flex items-center gap-1.5 self-center text-sm text-muted sm:col-start-2 sm:row-start-2 sm:self-start sm:justify-center"><Bus size={16} strokeWidth={2.25} aria-hidden="true" />{t.still.bus(first?.line ?? 'B 220', ride)}</span>
	</li>
	<li class="contents">
		<span class="grid size-11 place-items-center rounded-full border-2 border-brand bg-paper text-brand sm:col-start-3 sm:row-start-1"><Bus size={20} strokeWidth={2.25} aria-hidden="true" /></span>
		<span class="self-center sm:col-start-3 sm:row-start-2 sm:max-w-36">{@render station(stop)}</span>
	</li>
	<li class="contents">
		<span class="seg mx-auto h-14 w-0 border-l-2 border-dashed border-brand sm:col-start-4 sm:row-start-1 sm:mx-0 sm:h-0 sm:w-auto sm:self-center sm:border-l-0 sm:border-t-2"></span>
		<span class="flex items-center gap-1.5 self-center text-sm text-muted sm:col-start-4 sm:row-start-2 sm:self-start sm:justify-center"><Footprints size={16} strokeWidth={2.25} aria-hidden="true" />{t.still.walk}</span>
	</li>
	<li class="contents">
		<Huettli mini class="size-11 text-brand [--paper:var(--color-paper)] sm:col-start-5 sm:row-start-1" />
		<span class="self-center sm:col-start-5 sm:row-start-2">{@render station(t.still.hut)}</span>
	</li>
</ol>

<style>
	/* the line draws itself from the station towards the hut */
	.seg {
		transform-origin: 0 0;
		transition: transform 900ms ease-out 150ms;
	}
	.route li:nth-child(4) .seg {
		transition-delay: 900ms;
	}
	.route:global([data-unseen]) .seg {
		transform: scale(0);
	}
</style>
