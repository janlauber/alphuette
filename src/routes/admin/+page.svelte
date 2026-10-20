<script lang="ts">
	import CalendarX from '@lucide/svelte/icons/calendar-x';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FileText from '@lucide/svelte/icons/file-text';
	import Images from '@lucide/svelte/icons/images';
	import Printer from '@lucide/svelte/icons/printer';
	import Tag from '@lucide/svelte/icons/tag';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';
	import Huettli from '#lib/components/Huettli.svelte';
	import { chf } from '#lib/booking.ts';
	import { fmtDate } from '#lib/i18n.ts';

	let { data } = $props();
	const d = (iso: string) => fmtDate(iso, 'de', { year: undefined, month: 'short' });
	const ago = (at: Date) => {
		const h = Math.round((Date.now() - new Date(at).getTime()) / 3600_000);
		return h < 1 ? 'gerade eben' : h < 24 ? `vor ${h} Std.` : `vor ${Math.round(h / 24)} Tagen`;
	};
	const todo = $derived(data.open.length + data.unread.length + data.unpaid.filter((u) => u.late).length + data.reviews.length);
	const next = $derived(data.upcoming[0]);
</script>

<AdminPage title="Übersicht" intro={todo ? `Es gibt ${todo === 1 ? 'eine Sache' : `${todo} Sachen`} zu erledigen.` : 'Alles erledigt. Es gibt gerade nichts zu tun.'}>
	{#snippet help()}
		<ul>
			<li>Oben steht, was auf dich wartet. Tipp auf eine Karte, dann kommst du direkt zur richtigen Stelle.</li>
			<li>Neue Anfragen bekommst du auch per Mail. Die Daten bleiben für den Gast reserviert, bis du bestätigst oder ablehnst.</li>
			<li>Links im Menü findest du alles andere. Der <a href="/admin/verlauf">Verlauf</a> zeigt jede Änderung, und fast alles lässt sich dort rückgängig machen.</li>
		</ul>
	{/snippet}

	{#if todo}
		<section class="grid gap-3" aria-label="Zu tun">
			{#each data.open as b (b.id)}
				<a href="/admin/buchungen/{b.id}" class="card-strong flex items-center gap-4 p-4 no-underline transition hover:-translate-y-0.5">
					<span class="chip chip-wait shrink-0">Neue Anfrage</span>
					<span class="min-w-0 flex-1"><strong class="text-ink">{b.name}</strong> <span class="text-muted">aus {b.city}, {b.people} Pers.</span><span class="block text-sm text-muted tabular-nums">{d(b.checkIn)} bis {d(b.checkOut)} · {chf(b.totalRp)} · angefragt {ago(b.createdAt)}</span></span>
					<span class="hidden font-bold text-brand sm:inline">Bestätigen oder ablehnen</span><ChevronRight class="shrink-0 text-brand" aria-hidden="true" />
				</a>
			{/each}
			{#each data.unread as m (m.id)}
				<a href="/admin/buchungen/{m.id}#nachrichten" class="card flex items-center gap-4 p-4 no-underline hover:border-brand">
					<span class="chip chip-ok shrink-0">{m.n === 1 ? 'Nachricht' : `${m.n} Nachrichten`}</span>
					<span class="min-w-0 flex-1"><strong class="text-ink">{m.name}</strong> <span class="text-muted">hat geschrieben, {ago(m.last)}</span></span>
					<span class="hidden font-bold text-brand sm:inline">Lesen und antworten</span><ChevronRight class="shrink-0 text-brand" aria-hidden="true" />
				</a>
			{/each}
			{#each data.unpaid.filter((u) => u.late) as b (b.id)}
				<a href="/admin/buchungen/{b.id}" class="card flex items-center gap-4 p-4 no-underline hover:border-brand">
					<span class="chip chip-wait shrink-0">Noch nicht bezahlt</span>
					<span class="min-w-0 flex-1"><strong class="text-ink">{b.name}</strong> <span class="text-muted">kommt am {d(b.checkIn)}, {chf(b.totalRp)} offen</span></span>
					<span class="hidden font-bold text-brand sm:inline">Zahlung prüfen</span><ChevronRight class="shrink-0 text-brand" aria-hidden="true" />
				</a>
			{/each}
			{#if data.reviews.length}
				<a href="/admin/bewertungen" class="card flex items-center gap-4 p-4 no-underline hover:border-brand">
					<span class="chip chip-wait shrink-0">Gästebuch</span>
					<span class="min-w-0 flex-1 text-ink">{data.reviews.length === 1 ? `${data.reviews[0].name} hat eine Bewertung geschrieben` : `${data.reviews.length} neue Bewertungen`}. Sie erscheint erst, wenn du sie freischaltest.</span>
					<ChevronRight class="shrink-0 text-brand" aria-hidden="true" />
				</a>
			{/if}
		</section>
	{:else}
		<div class="card flex items-center gap-4 p-5">
			<Huettli mini face="happy" class="size-14 shrink-0 text-brand" />
			<p class="text-lg">Keine offenen Anfragen, keine neuen Nachrichten.</p>
		</div>
	{/if}

	<div class="mt-10 grid gap-6 lg:grid-cols-[3fr_2fr]">
		<section>
			<h2 class="text-2xl">Nächste Gäste</h2>
			{#if next}
				<a href="/admin/buchungen/{next.id}" class="card-strong mt-3 block p-5 no-underline">
					<p class="text-sm font-bold uppercase tracking-wider text-muted">{next.days > 0 ? `In ${next.days} ${next.days === 1 ? 'Tag' : 'Tagen'}` : 'Gerade im Hüttli'}</p>
					<p class="mt-1 text-2xl font-bold text-brand">{next.name}</p>
					<p class="text-ink tabular-nums">{d(next.checkIn)} bis {d(next.checkOut)} · {next.people} Pers. · {#if next.paidAt}<span class="font-semibold">bezahlt</span>{:else}<span class="font-semibold text-accent-dark">noch nicht bezahlt</span>{/if}</p>
				</a>
				<ul class="mt-3 grid gap-2">
					{#each data.upcoming.slice(1) as b (b.id)}
						<li><a href="/admin/buchungen/{b.id}" class="card flex justify-between gap-3 px-4 py-3 no-underline hover:border-brand"><span class="font-semibold text-ink">{b.name}</span><span class="text-muted tabular-nums">{d(b.checkIn)} bis {d(b.checkOut)}</span></a></li>
					{/each}
				</ul>
			{:else}
				<p class="mt-3 text-muted">Noch keine bestätigten Aufenthalte.</p>
			{/if}
		</section>
		<section>
			<h2 class="text-2xl">Schnell erledigt</h2>
			<div class="mt-3 grid grid-cols-2 gap-3">
				{#each [{ href: '/admin/kalender', icon: CalendarX, label: 'Zeit sperren' }, { href: '/admin/fotos', icon: Images, label: 'Fotos hochladen' }, { href: '/admin/inhalte', icon: FileText, label: 'Texte ändern' }, { href: '/admin/preise', icon: Tag, label: 'Preise ändern' }, { href: '/admin/drucken', icon: Printer, label: 'Infoblatt drucken' }] as q (q.href)}
					<a href={q.href} class="card flex flex-col items-start gap-2 p-4 font-semibold text-ink no-underline hover:border-brand"><q.icon class="text-brand" size={24} aria-hidden="true" />{q.label}</a>
				{/each}
			</div>
		</section>
	</div>

	{#if data.recent.length}
		<section class="mt-10">
			<div class="flex items-baseline justify-between"><h2 class="text-2xl">Zuletzt geändert</h2><a href="/admin/verlauf" class="font-semibold">Ganzer Verlauf</a></div>
			<ul class="card mt-3 divide-y-2 divide-line">
				{#each data.recent as r (r.id)}
					<li class="flex justify-between gap-4 px-4 py-2.5"><span class="min-w-0 truncate">{r.title}</span><span class="shrink-0 text-sm text-muted">{ago(r.at)}</span></li>
				{/each}
			</ul>
		</section>
	{/if}
</AdminPage>
