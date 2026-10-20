<script lang="ts">
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

<div class="flex items-center justify-between gap-3 py-2.5">
	<div>
		<p class="font-semibold leading-tight">{label}</p>
		<p class="text-sm text-stein">{hint}</p>
	</div>
	<div class="flex items-center gap-3">
		<button
			type="button"
			class="grid size-8 place-items-center rounded-full border border-[#b9beb4] disabled:opacity-30"
			aria-label="{label}: {t.card.less}"
			disabled={value <= min}
			onclick={() => value--}>−</button
		>
		<output class="w-4 text-center tabular-nums" aria-live="polite">{value}</output>
		<button
			type="button"
			class="grid size-8 place-items-center rounded-full border border-[#b9beb4] disabled:opacity-30"
			aria-label="{label}: {t.card.more}"
			disabled={value >= max}
			onclick={() => value++}>+</button
		>
	</div>
</div>
