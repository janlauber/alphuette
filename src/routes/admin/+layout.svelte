<script lang="ts">
	import { page } from '$app/state';

	let { data, children } = $props();
	const nav = [
		['/admin', 'Übersicht'],
		['/admin/buchungen', 'Buchungen'],
		['/admin/analytics', 'Besucher'],
		['/admin/kalender', 'Kalender'],
		['/admin/gaeste', 'Gäste'],
		['/admin/fotos', 'Fotos'],
		['/admin/bewertungen', 'Gästebuch'],
		['/admin/wanderungen', 'Wanderungen'],
		['/admin/preise', 'Preise'],
		['/admin/inhalte', 'Inhalte']
	];
	const current = (href: string) =>
		href === '/admin' ? page.url.pathname === '/admin' : page.url.pathname.startsWith(href);
</script>

<svelte:head>
	<title>Admin · Alphütte</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if data.admin}
	<div class="min-h-dvh lg:grid lg:grid-cols-[220px_1fr]">
		<aside class="border-b border-linie bg-tanne text-kalk lg:min-h-dvh lg:border-b-0">
			<div class="flex items-center justify-between px-4 py-4 lg:block">
				<a href="/" class="font-serif text-lg no-underline">Alphütte</a>
				<form method="POST" action="/admin/logout" class="lg:hidden"><button class="text-sm underline">Abmelden</button></form>
			</div>
			<nav class="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:px-3">
				{#each nav as [href, label] (href)}
					<a
						{href}
						class="flex items-center justify-between gap-2 whitespace-nowrap rounded-[3px] px-3 py-2 no-underline {current(href) ? 'bg-kalk text-tanne' : 'hover:bg-moos'}"
						aria-current={current(href) ? 'page' : undefined}
					>
						{label}
						{#if href === '/admin/buchungen' && data.open}<span class="rounded-full bg-gelb px-1.5 text-xs font-bold text-tanne">{data.open}</span>{/if}
					</a>
				{/each}
			</nav>
			<div class="hidden px-6 pt-8 text-sm text-kalk/70 lg:block">
				<p class="break-all">{data.admin}</p>
				<form method="POST" action="/admin/logout"><button class="mt-1 underline">Abmelden</button></form>
			</div>
		</aside>
		<main class="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
			{@render children()}
		</main>
	</div>
{:else}
	{@render children()}
{/if}
