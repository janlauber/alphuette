<script lang="ts">
	import Images from '@lucide/svelte/icons/images';
	import Share from '@lucide/svelte/icons/share';
	import X from '@lucide/svelte/icons/x';
	import Img, { type Photo } from './Img.svelte';
	import { dict, type Lang } from '#lib/i18n.ts';

	let { photos, lang, title }: { photos: Photo[]; lang: Lang; title: string } = $props();
	const t = $derived(dict[lang]);
	let dialog = $state<HTMLDialogElement>();
	let strip = $state<HTMLDivElement>();
	let index = $state(1);
	let copied = $state(false);

	function open(id?: number) {
		dialog?.showModal();
		if (id) requestAnimationFrame(() => dialog?.querySelector(`[data-photo="${id}"]`)?.scrollIntoView({ block: 'center' }));
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
	<!-- Phones: full-bleed swipe strip with counter -->
	<div class="relative lg:hidden">
		<div
			bind:this={strip}
			class="snap-row flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto"
			onscroll={() => strip && (index = Math.round(strip.scrollLeft / strip.clientWidth) + 1)}
			aria-label={t.hero.all(photos.length)}
		>
			{#each photos as photo, i (photo.id)}
				<button type="button" class="h-full w-full shrink-0 snap-center" onclick={() => open(photo.id)}>
					<Img {photo} sizes="100vw" eager={i === 0} class="h-full w-full object-cover" />
				</button>
			{/each}
		</div>
		<button type="button" onclick={share} aria-label={t.hero.share} class="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/90 text-ink shadow-sm">
			<Share size={18} />
		</button>
		<p class="absolute bottom-10 right-4 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-semibold text-white tabular-nums" aria-live="polite">
			{index} / {photos.length}
		</p>
	</div>

	<!-- Larger screens: one large photo and four small ones -->
	<div class="relative mx-auto hidden h-[min(60vh,540px)] max-w-6xl grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[18px] px-0 lg:grid">
		{#each photos.slice(0, 5) as photo, i (photo.id)}
			<button type="button" class="group overflow-hidden {i === 0 ? 'col-span-2 row-span-2' : ''}" onclick={() => open(photo.id)}>
				<Img
					{photo}
					sizes={i === 0 ? '(min-width: 1152px) 576px, 50vw' : '(min-width: 1152px) 288px, 25vw'}
					eager={i === 0}
					class="size-full object-cover transition duration-300 group-hover:brightness-90"
				/>
			</button>
		{/each}
		<div class="absolute bottom-4 right-4 flex gap-2">
			<button type="button" class="btn-line !min-h-10 !py-1.5 text-sm" onclick={share}><Share size={16} />{copied ? t.hero.copied : t.hero.share}</button>
			<button type="button" class="btn-line !min-h-10 !py-1.5 text-sm" onclick={() => open()}><Images size={16} />{t.hero.all(photos.length)}</button>
		</div>
	</div>

	<dialog bind:this={dialog} class="m-0 h-dvh max-h-none w-screen max-w-none bg-paper p-0 backdrop:bg-ink/60" aria-label={t.hero.all(photos.length)}>
		<div class="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-3 backdrop-blur">
			<p class="font-semibold">{t.hero.all(photos.length)}</p>
			<button type="button" class="grid size-10 place-items-center rounded-full hover:bg-sand" aria-label={t.hero.close} onclick={() => dialog?.close()}>
				<X size={20} />
			</button>
		</div>
		<div class="mx-auto grid max-w-4xl gap-2 px-2 py-4 sm:grid-cols-2 sm:px-4">
			{#each photos as photo (photo.id)}
				<figure data-photo={photo.id} class={photo.width >= photo.height ? 'sm:col-span-2' : ''}>
					<Img {photo} sizes="(min-width: 896px) 864px, 100vw" class="w-full rounded-[12px]" />
				</figure>
			{/each}
		</div>
	</dialog>
{/if}
