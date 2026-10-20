<script lang="ts">
	// The Hüttli mascot: one colour (currentColor), outlined body, solid roof and smoke.
	// Set the colour with a text class, the inside colour with --paper.
	// `animate` keeps it quietly alive (blinking, slow smoke). `run` moves the legs: true runs
	// until it stops being set, a number runs that many strides and then holds still.
	export type Face = 'happy' | 'wink' | 'sleep' | 'love';
	let {
		face = 'happy',
		pose = 'run',
		animate = false,
		run = false,
		shadow = true,
		mini = false,
		label = '',
		class: cls = '',
		...rest
	}: { face?: Face; pose?: 'run' | 'stand'; animate?: boolean; run?: boolean | number; shadow?: boolean; mini?: boolean; label?: string; class?: string; [attr: string]: unknown } = $props();
	const running = $derived(pose === 'run' && run !== false);

	const sw = $derived(mini ? 9 : 4.6);
	const arc = (x: number, up: boolean) => `M${x - 6} ${up ? 148 : 144}Q${x} ${up ? 139 : 153} ${x + 6} ${up ? 148 : 144}`;
	const heart = (x: number) => `M${x} 154C${x - 12} 146 ${x - 7} 136 ${x} 142C${x + 7} 136 ${x + 12} 146 ${x} 154Z`;
	// two leg frames, swapped while running
	const LEGS = {
		run: ['M104 196Q100 224 78 225', 'M136 196Q160 206 154 234'],
		pass: ['M104 196Q103 218 110 234', 'M136 196Q152 214 142 224'],
		stand: ['M104 196V226', 'M136 196V226']
	};
	const SHOES = {
		run: [[73, 226, -6], [159, 238, 10]],
		pass: [[115, 237, 4], [138, 226, -20]],
		stand: [[99, 230, 0], [141, 230, 0]]
	} as const;
</script>

{#snippet legs(kind: keyof typeof LEGS, cls: string)}
	<g class={cls}>
		{#each LEGS[kind] as d, i (i)}
			<path {d} class="tube" stroke-width="14" />
			<path {d} class="tube-in" stroke-width={14 - 2 * sw} />
			<ellipse cx={SHOES[kind][i][0]} cy={SHOES[kind][i][1]} rx="12" ry="7" transform="rotate({SHOES[kind][i][2]} {SHOES[kind][i][0]} {SHOES[kind][i][1]})" class="ink" />
		{/each}
	</g>
{/snippet}

<svg
	{...rest}
	viewBox={mini ? '26 26 190 190' : '0 -38 240 306'}
	class="huettli {cls}"
	class:animate
	class:running
	style:--runs={run === true ? 'infinite' : run || 0}
	role={label ? 'img' : undefined}
	aria-label={label || undefined}
	aria-hidden={label ? undefined : 'true'}
>
	{#if !mini && shadow}
		<ellipse cx={pose === 'run' ? 118 : 120} cy={pose === 'run' ? 258 : 240} rx={pose === 'run' ? 46 : 42} ry={pose === 'run' ? 6 : 5} class="ink shadow" />
	{/if}
	<g class="figure" transform={pose === 'run' && !mini ? 'rotate(6 120 230)' : undefined}>
		{#if !mini}
			{#if pose === 'run'}
				{@render legs('run', 'frame-a')}
				{#if running}{@render legs('pass', 'frame-b')}{/if}
			{:else}
				{@render legs('stand', '')}
			{/if}
		{/if}
		<g class="head">
			<path d="M62 106L64 168Q66 202 102 202H138Q174 202 176 168L178 106Z" class="paper line" stroke-width={sw} />
			{#if face === 'wink'}
				<path d={arc(108, true)} class="line" stroke-width={sw} />
				<ellipse cx="132" cy="146" rx="3.8" ry="5.8" class="ink" />
			{:else if face === 'sleep'}
				<path d={arc(108, false)} class="line" stroke-width={sw} />
				<path d={arc(132, false)} class="line" stroke-width={sw} />
			{:else if face === 'love'}
				<path d={heart(108)} class="ink" />
				<path d={heart(132)} class="ink" />
			{:else}
				<g class="eyes"><ellipse cx="108" cy="146" rx="3.8" ry="5.8" class="ink" /><ellipse cx="132" cy="146" rx="3.8" ry="5.8" class="ink" /></g>
			{/if}
			{#if face === 'sleep'}
				<ellipse cx="121" cy="165" rx="4" ry="5" class="ink" />
			{:else if face === 'happy'}
				<path d="M101 160Q120 178 141 160" class="line" stroke-width={sw} />
			{:else}
				<path d="M102 159Q121 162 140 159Q137 178 121 178Q105 178 102 159Z" class="ink" />
			{/if}
			<path d="M76 76V40H92V76" class="paper line" stroke-width={sw} />
			<rect x="71" y="32" width="26" height="10" rx="4" class="paper line" stroke-width={sw} />
			<path d="M38 118C33 110 41 103 49 97L111 46C119 39 129 39 137 46L197 94C205 101 208 110 200 115C170 123 146 111 121 118C96 125 70 111 38 118Z" class="ink" />
		</g>
		{#if !mini}
			{#if face === 'sleep'}
				<path d="M46 30h11l-11 12h11M28 10h8l-8 9h8" class="line zz" stroke-width={sw} />
			{:else}
				<g class="smoke">
					<circle cx="74" cy="22" r="4.5" class="ink" />
					<circle cx="58" cy="9" r="8" class="ink" />
					<ellipse cx="33" cy="-8" rx="13" ry="9" transform="rotate(25 33 -8)" class="ink" />
				</g>
			{/if}
		{/if}
	</g>
</svg>

<style>
	.huettli {
		overflow: visible;
	}
	.ink {
		fill: currentColor;
	}
	.paper {
		fill: var(--paper, #fff);
	}
	.line {
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.paper.line {
		fill: var(--paper, #fff);
	}
	.tube,
	.tube-in {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.tube {
		stroke: currentColor;
	}
	.tube-in {
		stroke: var(--paper, #fff);
	}

	/* Running: the legs swap and the body bobs, for --runs strides. */
	.running .frame-a {
		animation: frame-a 0.5s steps(1) var(--runs);
	}
	.running .frame-b {
		opacity: 0;
		animation: frame-b 0.5s steps(1) var(--runs);
	}
	@keyframes frame-a {
		50% {
			opacity: 0;
		}
	}
	@keyframes frame-b {
		50% {
			opacity: 1;
		}
	}
	.running .head {
		animation: bob 0.25s ease-in-out calc(var(--runs) * 2) alternate;
	}
	@keyframes bob {
		to {
			translate: 0 -3px;
		}
	}

	/* Alive: smoke drifts off slowly, the eyes blink now and then. */
	:is(.animate, .running) .smoke > :global(*) {
		transform-box: fill-box;
		transform-origin: center;
		animation: puff 4.5s ease-out infinite;
	}
	:is(.animate, .running) .smoke > :global(:nth-child(2)) {
		animation-delay: 1.5s;
	}
	:is(.animate, .running) .smoke > :global(:nth-child(3)) {
		animation-delay: 3s;
	}
	@keyframes puff {
		0% {
			translate: 16px 24px;
			scale: 0.3;
			opacity: 0;
		}
		30% {
			opacity: 1;
		}
		100% {
			translate: -10px -10px;
			scale: 1.05;
			opacity: 0;
		}
	}
	.animate .eyes {
		transform-box: fill-box;
		transform-origin: center;
		animation: blink 6s infinite;
	}
	@keyframes blink {
		0%,
		96%,
		100% {
			scale: 1 1;
		}
		98% {
			scale: 1 0.1;
		}
	}
	.animate .zz {
		animation: float-z 3.5s ease-in-out infinite alternate;
	}
	@keyframes float-z {
		to {
			translate: -3px -6px;
			opacity: 0.6;
		}
	}
</style>
