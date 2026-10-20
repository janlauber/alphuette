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
					class="grid size-8 shrink-0 place-items-center rounded-full border-2
						{s.state === 'done' ? 'border-brand bg-brand text-white' : s.state === 'now' ? 'border-brand bg-accent' : 'border-line bg-paper'}"
				>
					{#if s.state === 'done'}<Check size={16} strokeWidth={3.5} />{:else if s.state === 'now'}<span class="size-2.5 rounded-full bg-brand"></span>{/if}
				</span>
				{#if i < steps.length - 1}<span class="my-1 w-0 flex-1 border-l-2 {s.state === 'done' ? 'border-brand' : 'border-dashed border-line'}"></span>{/if}
			</div>
			<div class="pb-6 pt-1">
				<p class={s.state === 'now' ? 'font-bold text-brand' : s.state === 'done' ? 'font-semibold' : 'font-medium text-muted'}>{s.title}</p>
				<p class="text-sm text-muted">{s.text}</p>
			</div>
		</li>
	{/each}
</ol>
