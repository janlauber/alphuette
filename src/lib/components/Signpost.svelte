<script lang="ts">
	// A Swiss trail sign: yellow plate pointing right, mountain trails get the white-red-white tip.
	let { name, time, alpine = false, href = '' }: { name: string; time: string; alpine?: boolean; href?: string } = $props();
</script>

<svelte:element
	this={href ? 'a' : 'div'}
	href={href || undefined}
	target={href ? '_blank' : undefined}
	rel={href ? 'noopener' : undefined}
	class="sign relative flex min-h-12 items-center justify-between gap-4 bg-gelb py-2 pl-4 font-sans text-[1.05rem] font-bold leading-tight text-tanne no-underline {alpine ? 'alpine pr-14' : 'pr-10'}"
>
	<span>{name}</span>
	{#if time}<span class="whitespace-nowrap font-semibold tabular-nums">{time}</span>{/if}
</svelte:element>

<style>
	.sign {
		clip-path: polygon(0 0, calc(100% - 1.4rem) 0, 100% 50%, calc(100% - 1.4rem) 100%, 0 100%);
	}
	.alpine {
		background-image: linear-gradient(to bottom, #fff 0 33%, #d52b1e 33% 67%, #fff 67%);
		background-size: 2.6rem 100%;
		background-position: right;
		background-repeat: no-repeat;
	}
	a.sign:hover {
		filter: brightness(0.96);
	}
</style>
