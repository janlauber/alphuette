<script lang="ts">
	import { onMount } from 'svelte';

	// Ticks live in localStorage only: a per-device convenience, nothing is sent anywhere.
	let { items, key }: { items: string[]; key: string } = $props();
	let done = $state<Record<string, boolean>>({});

	onMount(() => {
		try {
			done = JSON.parse(localStorage.getItem(key) ?? '{}');
		} catch {}
	});
	function toggle(item: string) {
		done[item] = !done[item];
		try {
			localStorage.setItem(key, JSON.stringify(done));
		} catch {}
	}
</script>

<ul class="grid gap-2">
	{#each items as item (item)}
		<li>
			<label class="flex cursor-pointer items-center gap-3 rounded-[12px] bg-sand px-3.5 py-3">
				<input type="checkbox" checked={!!done[item]} onchange={() => toggle(item)} class="size-5 accent-fir" />
				<span class={done[item] ? 'text-muted line-through' : ''}>{item}</span>
			</label>
		</li>
	{/each}
</ul>
