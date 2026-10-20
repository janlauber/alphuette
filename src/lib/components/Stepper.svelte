<script lang="ts">
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import { dict, type Lang } from '#lib/i18n.ts';

	let {
		label,
		hint,
		value = $bindable(0),
		min = 0,
		max,
		lang
	}: { label: string; hint: string; value?: number; min?: number; max: number; lang: Lang } = $props();
	const t = $derived(dict[lang]);
</script>

<div class="flex items-center justify-between gap-3 py-3">
	<div>
		<p class="font-bold leading-tight">{label}</p>
		<p class="text-sm text-muted">{hint}</p>
	</div>
	<div class="flex items-center gap-3">
		<button type="button" class="grid size-10 place-items-center rounded-full border-2 border-brand text-brand transition hover:bg-wash active:scale-90 disabled:opacity-25" aria-label="{label}: {t.card.less}" disabled={value <= min} onclick={() => value--}>
			<Minus size={18} strokeWidth={3} />
		</button>
		{#key value}<output class="w-5 animate-[pop_220ms_ease-out] text-center text-lg font-bold text-brand tabular-nums" aria-live="polite">{value}</output>{/key}
		<button type="button" class="grid size-10 place-items-center rounded-full border-2 border-brand text-brand transition hover:bg-wash active:scale-90 disabled:opacity-25" aria-label="{label}: {t.card.more}" disabled={value >= max} onclick={() => value++}>
			<Plus size={18} strokeWidth={3} />
		</button>
	</div>
</div>
