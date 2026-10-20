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
		<p class="font-semibold leading-tight">{label}</p>
		<p class="text-sm text-muted">{hint}</p>
	</div>
	<div class="flex items-center gap-3">
		<button type="button" class="grid size-9 place-items-center rounded-full border border-[#d9d0c9] disabled:opacity-30" aria-label="{label}: {t.card.less}" disabled={value <= min} onclick={() => value--}>
			<Minus size={16} />
		</button>
		<output class="w-4 text-center font-semibold tabular-nums" aria-live="polite">{value}</output>
		<button type="button" class="grid size-9 place-items-center rounded-full border border-[#d9d0c9] disabled:opacity-30" aria-label="{label}: {t.card.more}" disabled={value >= max} onclick={() => value++}>
			<Plus size={16} />
		</button>
	</div>
</div>
