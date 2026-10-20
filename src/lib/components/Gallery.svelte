<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Expand from '@lucide/svelte/icons/expand';
	import Share from '@lucide/svelte/icons/share';
	import X from '@lucide/svelte/icons/x';
	import Img, { type Photo } from './Img.svelte';
	import { dict, type Lang } from '#lib/i18n.ts';

	// Swipe strip with group filter on the page, full-screen lightbox with thumbnails on tap.
	let { photos, lang, title }: { photos: Photo[]; lang: Lang; title: string } = $props();
	const t = $derived(dict[lang]);

	let group = $state('alle');
	const groups = $derived(['alle', 'draussen', 'drinnen', 'winter'].filter((g) => g === 'alle' || photos.some((p) => p.category === g)));
	const shown = $derived(group === 'alle' ? photos : photos.filter((p) => p.category === group));

	let strip = $state<HTMLDivElement>();
	let at = $state(0);
	let dialog = $state<HTMLDialogElement>();
	let slides = $state<HTMLDivElement>();
	let big = $state(0);
	let copied = $state(false);

	// Index of the slide at the start edge; at the very end of the strip it is the last one.
	const nearest = (el: HTMLElement) => {
		if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) return el.children.length - 1;
		const left = el.getBoundingClientRect().left + (parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0);
		let best = 0;
		let gap = Infinity;
		[...el.children].forEach((k, i) => {
			const d = Math.abs(k.getBoundingClientRect().left - left);
			if (d < gap) [gap, best] = [d, i];
		});
		return best;
	};
	const go = (el: HTMLElement | undefined, i: number) =>
		(el?.children[i] as HTMLElement | undefined)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });

	function pick(g: string) {
		group = g;
		at = 0;
		strip?.scrollTo({ left: 0 });
	}

	function open(i: number) {
		dialog?.showModal();
		big = i;
		requestAnimationFrame(() => slides?.children[i]?.scrollIntoView({ block: 'nearest', inline: 'start' }));
	}

	function keys(e: KeyboardEvent) {
		if (e.key === 'ArrowRight') go(slides, Math.min(big + 1, shown.length - 1));
		if (e.key === 'ArrowLeft') go(slides, Math.max(big - 1, 0));
	}

	async function share() {
		const url = location.href.split('#')[0];
		if (navigator.share) await navigator.share({ title, url }).catch(() => {});
		else {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

{#if photos.length}
	{#if groups.length > 2}
		<div class="snap-row -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0" role="group" aria-label={t.hero.all(photos.length)}>
			{#each groups as g (g)}
				{@const n = g === 'alle' ? photos.length : photos.filter((p) => p.category === g).length}
				<button
					type="button"
					aria-pressed={group === g}
					onclick={() => pick(g)}
					class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-brand px-3.5 py-1.5 text-sm font-bold transition-colors {group === g ? 'bg-brand text-white' : 'bg-white text-brand hover:bg-wash'}"
				>
					{t.gallery.groups[g]}<span class="rounded-full px-1.5 text-xs {group === g ? 'bg-white text-brand' : 'bg-wash'}">{n}</span>
				</button>
			{/each}
		</div>
	{/if}

	<div class="relative mt-4">
		<div bind:this={strip} class="snap-row -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 sm:mx-0 sm:scroll-px-0 sm:px-0" onscroll={() => strip && (at = nearest(strip))}>
			{#each shown as photo, i (photo.id)}
				<button
					type="button"
					class="group relative aspect-[4/3] shrink-0 basis-[86%] snap-start overflow-hidden rounded-[24px] border-[3px] border-white sm:basis-[62%] lg:basis-[48%]"
					aria-label={t.gallery.open(photo.alt)}
					onclick={() => open(i)}
				>
					<Img {photo} sizes="(min-width: 1024px) 560px, (min-width: 640px) 62vw, 86vw" eager={i === 0} class="size-full object-cover transition duration-500 group-hover:scale-105" />
					<span class="absolute inset-x-3 bottom-3 truncate rounded-full bg-white/95 px-3 py-1 text-left text-sm font-semibold text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{photo.alt}</span>
					<span class="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white text-brand opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true"><Expand size={16} strokeWidth={2.5} /></span>
				</button>
			{/each}
		</div>
		<button type="button" class="absolute left-2 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full border-2 border-brand bg-white text-brand shadow-[0_4px_0_var(--color-brand)] transition hover:bg-wash disabled:opacity-0 sm:grid" aria-label={t.gallery.prev} disabled={at === 0} onclick={() => go(strip, at - 1)}>
			<ArrowLeft size={20} strokeWidth={2.5} />
		</button>
		<button type="button" class="absolute right-2 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full border-2 border-brand bg-white text-brand shadow-[0_4px_0_var(--color-brand)] transition hover:bg-wash disabled:opacity-0 sm:grid" aria-label={t.gallery.next} disabled={at >= shown.length - 1} onclick={() => go(strip, at + 1)}>
			<ArrowRight size={20} strokeWidth={2.5} />
		</button>
	</div>

	<div class="mt-4 flex items-center gap-3">
		<!-- progress: where in the strip you are -->
		<div class="h-2 flex-1 overflow-hidden rounded-full bg-white" aria-hidden="true">
			<div class="h-full rounded-full bg-brand transition-all duration-300" style="width: {((at + 1) / shown.length) * 100}%"></div>
		</div>
		<p class="shrink-0 text-sm font-bold tabular-nums text-brand" aria-live="polite">{at + 1} / {shown.length}</p>
		<button type="button" onclick={share} class="grid size-10 shrink-0 place-items-center rounded-full border-2 border-brand bg-white text-brand" aria-label={copied ? t.hero.copied : t.hero.share}>
			<Share size={18} strokeWidth={2.5} />
		</button>
	</div>

	<dialog bind:this={dialog} onkeydown={keys} class="m-0 h-dvh max-h-none w-screen max-w-none bg-brand p-0 text-white backdrop:bg-brand" aria-label={t.hero.all(shown.length)}>
		<div class="flex h-full flex-col">
			<div class="flex items-center justify-between px-4 py-3">
				<p class="rounded-full bg-white px-3 py-0.5 text-sm font-bold tabular-nums text-brand" aria-live="polite">{big + 1} / {shown.length}</p>
				<button type="button" class="grid size-11 place-items-center rounded-full border-2 border-white hover:bg-white/15" aria-label={t.hero.close} onclick={() => dialog?.close()}>
					<X size={22} strokeWidth={2.5} />
				</button>
			</div>
			<div class="relative min-h-0 flex-1">
				<div bind:this={slides} class="snap-row flex size-full snap-x snap-mandatory overflow-x-auto" onscroll={() => slides && (big = nearest(slides))}>
					{#each shown as photo (photo.id)}
						<figure class="flex size-full shrink-0 snap-start flex-col items-center justify-center gap-3 px-4">
							<Img {photo} sizes="100vw" class="max-h-[calc(100%-3rem)] w-auto max-w-full rounded-[20px] object-contain" />
							<figcaption class="max-w-2xl text-center text-sm font-medium text-white/90">{photo.alt}</figcaption>
						</figure>
					{/each}
				</div>
				<button type="button" class="absolute left-4 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white text-brand disabled:opacity-0 sm:grid" aria-label={t.gallery.prev} disabled={big === 0} onclick={() => go(slides, big - 1)}>
					<ArrowLeft size={22} strokeWidth={2.5} />
				</button>
				<button type="button" class="absolute right-4 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white text-brand disabled:opacity-0 sm:grid" aria-label={t.gallery.next} disabled={big >= shown.length - 1} onclick={() => go(slides, big + 1)}>
					<ArrowRight size={22} strokeWidth={2.5} />
				</button>
			</div>
			<!-- thumbnails -->
			<div class="snap-row flex gap-2 overflow-x-auto px-4 py-3">
				{#each shown as photo, i (photo.id)}
					<button type="button" class="size-14 shrink-0 overflow-hidden rounded-[12px] border-[3px] transition {i === big ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'}" aria-label={photo.alt} aria-current={i === big} onclick={() => go(slides, i)}>
						<img src="/bilder/photos/{photo.key}-480.webp" alt="" loading="lazy" class="size-full object-cover" style="background: url({photo.lqip}) center / cover" />
					</button>
				{/each}
			</div>
		</div>
	</dialog>
{/if}
