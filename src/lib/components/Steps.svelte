<script lang="ts">
	import Check from '@lucide/svelte/icons/check';

	type Step = { title: string; text: string; state: 'done' | 'now' | 'next' };
	let { steps }: { steps: Step[] } = $props();
</script>

<ol class="flex flex-col">
	{#each steps as s, i (s.title)}
		<li class="flex gap-3.5">
			<div class="flex flex-col items-center">
				<span
					class="grid size-7 shrink-0 place-items-center rounded-full border-2
						{s.state === 'done' ? 'border-fir bg-fir text-white' : s.state === 'now' ? 'border-geranium bg-paper' : 'border-[#d9d0c9] bg-paper'}"
				>
					{#if s.state === 'done'}<Check size={14} strokeWidth={3} />{/if}
				</span>
				{#if i < steps.length - 1}<span class="w-0.5 flex-1 {s.state === 'done' ? 'bg-fir' : 'bg-line'}"></span>{/if}
			</div>
			<div class="pb-5 pt-0.5">
				<p class={s.state === 'now' ? 'font-bold' : 'font-medium'}>{s.title}</p>
				<p class="text-sm text-muted">{s.text}</p>
			</div>
		</li>
	{/each}
</ol>
