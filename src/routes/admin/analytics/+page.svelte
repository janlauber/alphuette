<script lang="ts">
	import AdminPage from '#lib/components/admin/AdminPage.svelte';

	let { data } = $props();

	const ranges = [
		['1', 'Heute'],
		['7', '7 Tage'],
		['30', '30 Tage'],
		['365', 'Jahr']
	];
	const max = $derived(Math.max(1, ...data.series.map((s) => s.n)));
	const pct = (n: number, of: number) => (of ? Math.round((n / of) * 1000) / 10 : 0);
	const funnel = $derived([
		{ label: 'Startseite', n: data.funnel.home },
		{ label: 'Woche gewählt', n: data.funnel.week },
		{ label: 'Formular geöffnet', n: data.funnel.form },
		{ label: 'Anfrage gesendet', n: data.funnel.sent },
		{ label: 'Bestätigt', n: data.funnel.confirmed }
	]);
	const tables = $derived([
		{ title: 'Woher', rows: data.sources },
		{ title: 'Wo', rows: data.places },
		{ title: 'Länder', rows: data.countries },
		{ title: 'Gerät', rows: data.devices },
		{ title: 'Browser', rows: data.browsers },
		{ title: 'Seiten (Aufrufe)', rows: data.pages }
	]);
	const vital = (name: string) => data.vitals.find((v) => v.name === name);
	const VITALS = [
		{ name: 'LCP', label: 'Ladezeit', fmt: (v: number) => `${(v / 1000).toFixed(1)} s`, good: (v: number) => v <= 2500 },
		{ name: 'INP', label: 'Reaktion', fmt: (v: number) => `${Math.round(v)} ms`, good: (v: number) => v <= 200 },
		{ name: 'CLS', label: 'Verschieben', fmt: (v: number) => v.toFixed(2), good: (v: number) => v <= 0.1 }
	];
</script>

<AdminPage title="Besucher" intro="Wie viele Leute die Website anschauen und wie viele davon anfragen.">
	{#snippet help()}
		<ul>
			<li>Die Website zählt ohne Cookies. Wer an einem Tag mehrmals kommt, zählt einmal.</li>
			<li>«Vom Besuch zur Buchung» zeigt, wie viele bei jedem Schritt weitermachen.</li>
			<li>«Woher» sind andere Websites, Google oder ein QR-Code, über die Leute kommen.</li>
			<li>Ganz unten steht, wie schnell die Website lädt. Blau ist gut, orange langsam.</li>
		</ul>
	{/snippet}
	{#snippet actions()}
		<nav class="flex flex-wrap gap-1.5" aria-label="Zeitraum">
			{#each ranges as [r, label] (r)}
				<a href="?r={r}" class="pill min-h-11 no-underline {data.r === r ? '!bg-brand !text-white' : ''}" aria-current={data.r === r ? 'page' : undefined}>{label}</a>
			{/each}
		</nav>
	{/snippet}

<p class="flex items-center gap-2 font-semibold text-ink"><span class="size-2.5 rounded-full {data.live ? 'bg-accent' : 'bg-line'}"></span>{data.live} gerade auf der Website</p>

<div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
	{#each [
		{ label: 'Besucher', value: data.kpi.visitors, sub: 'pro Tag gezählt' },
		{ label: 'Seitenaufrufe', value: data.kpi.views, sub: data.kpi.visitors ? `${(data.kpi.views / data.kpi.visitors).toFixed(1)} pro Besuch` : '' },
		{ label: 'Anfragen', value: data.req.requests, sub: `${data.req.confirmed} bestätigt` },
		{ label: 'Besuch zu Anfrage', value: `${pct(data.req.requests, data.kpi.visitors)} %`, sub: data.kpi.seconds ? `Ø ${data.kpi.seconds} s pro Seite` : '' }
	] as k (k.label)}
		<div class="card p-4">
			<p class="text-sm text-muted">{k.label}</p>
			<p class="mt-1 text-3xl font-bold tabular-nums text-brand">{k.value ?? 0}</p>
			<p class="mt-1 text-sm text-muted">{k.sub}</p>
		</div>
	{/each}
</div>

<div class="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
	<section class="card p-4">
		<p class="font-semibold">Besucher pro Tag</p>
		<div class="mt-4 flex h-40 items-end gap-[2px]" role="img" aria-label="Besucher pro Tag">
			{#each data.series as s (s.day)}
				<span class="flex-1 rounded-t-[3px] {s.requests ? 'bg-brand' : 'bg-[#c9c5f6]'}" style="height: {Math.max(2, (s.n / max) * 100)}%" title="{s.day}: {s.n}"></span>
			{/each}
		</div>
		<p class="mt-2 text-xs text-muted">Dunkle Balken: Tage mit einer Anfrage</p>
	</section>
	<section class="card p-4">
		<p class="font-semibold">Vom Besuch zur Buchung</p>
		<div class="mt-3 flex flex-col gap-2.5">
			{#each funnel as f (f.label)}
				<div>
					<div class="flex justify-between text-sm"><span>{f.label}</span><span class="font-bold tabular-nums">{f.n}</span></div>
					<div class="mt-1 h-2.5 rounded-full bg-wash"><div class="h-2.5 rounded-full bg-brand" style="width: {Math.max(1, pct(f.n, funnel[0].n || 1))}%"></div></div>
				</div>
			{/each}
		</div>
	</section>
</div>

<div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
	{#each tables as tb (tb.title)}
		{@const top = Math.max(1, ...tb.rows.map((r) => r.n))}
		<section class="card p-4">
			<p class="mb-2 font-semibold">{tb.title}</p>
			{#each tb.rows as row (row.label)}
				<div class="relative flex justify-between gap-3 px-2 py-1.5 text-sm">
					<span class="absolute inset-y-0.5 left-0 rounded-[6px] bg-wash" style="width: {(row.n / top) * 100}%"></span>
					<span class="relative truncate">{row.label}</span><span class="relative font-semibold tabular-nums">{row.n}</span>
				</div>
			{:else}
				<p class="text-sm text-muted">Noch keine Daten.</p>
			{/each}
		</section>
	{/each}
</div>

<section class="card mt-3 flex flex-wrap items-center justify-between gap-4 p-4">
	<div class="flex flex-wrap gap-6 text-sm">
		{#each VITALS as v (v.name)}
			{@const m = vital(v.name)}
			<span><strong>{v.label}</strong> {#if m}<span class="font-semibold {v.good(m.p75) ? 'text-brand' : 'text-accent-dark'}">{v.fmt(m.p75)}</span>{:else}<span class="text-muted">noch keine Messung</span>{/if}</span>
		{/each}
	</div>
	<p class="text-xs text-muted">75 % der Besuche sind schneller. Ohne Cookies, IP nur gehasht mit Tagessalz. Orte: <a href="https://db-ip.com" class="underline">IP Geolocation by DB-IP</a></p>
</section>
</AdminPage>
