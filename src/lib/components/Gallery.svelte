<script lang="ts">
	import Img, { type Photo } from './Img.svelte';
	import { dict, type Lang } from '#lib/i18n.ts';

	let { photos, lang }: { photos: Photo[]; lang: Lang } = $props();
	const t = $derived(dict[lang]);
	let dialog = $state<HTMLDialogElement>()!;

	function open(id?: number) {
		dialog?.showModal();
		if (id) requestAnimationFrame(() => dialog?.querySelector(`[data-photo="${id}"]`)?.scrollIntoView({ block: 'center' }));
	}
</script>

{#if photos.length}
	<!-- Phones: swipe through all photos -->
	<div class="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:hidden" aria-label={t.photos.all(photos.length)}>
		{#each photos as photo, i (photo.id)}
			<button type="button" class="w-[86%] shrink-0 snap-center" onclick={() => open(photo.id)}>
				<Img {photo} sizes="86vw" eager={i === 0} class="aspect-[4/3] w-full rounded-[3px] object-cover" />
			</button>
		{/each}
	</div>

	<!-- Larger screens: one large photo and four small ones -->
	<div class="relative hidden h-[min(62vh,560px)] grid-cols-4 grid-rows-2 gap-2 sm:grid">
		{#each photos.slice(0, 5) as photo, i (photo.id)}
			<button
				type="button"
				class="group overflow-hidden {i === 0 ? 'col-span-2 row-span-2 rounded-l-[3px]' : ''} {i === 2 ? 'rounded-tr-[3px]' : ''} {i === 4 ? 'rounded-br-[3px]' : ''}"
				onclick={() => open(photo.id)}
			>
				<Img
					{photo}
					sizes={i === 0 ? '(min-width: 1152px) 560px, 50vw' : '(min-width: 1152px) 280px, 25vw'}
					eager={i === 0}
					class="size-full object-cover transition duration-300 group-hover:brightness-[0.92]"
				/>
			</button>
		{/each}
		<button type="button" class="btn-line absolute bottom-4 right-4 bg-paper !py-1.5 text-sm" onclick={() => open()}>
			{t.photos.all(photos.length)}
		</button>
	</div>

	<dialog
		bind:this={dialog}
		class="m-0 h-dvh max-h-none w-screen max-w-none bg-kalk p-0 backdrop:bg-tanne/60"
		aria-label={t.photos.all(photos.length)}
	>
		<div class="sticky top-0 z-10 flex justify-end bg-kalk/95 px-4 py-3">
			<button type="button" class="btn-line !py-1.5" onclick={() => dialog?.close()}>{t.photos.close}</button>
		</div>
		<div class="mx-auto grid max-w-4xl gap-3 px-4 pb-10 sm:grid-cols-2">
			{#each photos as photo (photo.id)}
				<figure data-photo={photo.id} class={photo.width >= photo.height ? 'sm:col-span-2' : ''}>
					<Img {photo} sizes="(min-width: 896px) 864px, 100vw" class="w-full rounded-[3px]" />
				</figure>
			{/each}
		</div>
	</dialog>
{/if}
