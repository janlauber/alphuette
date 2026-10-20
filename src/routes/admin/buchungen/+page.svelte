<script lang="ts">
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Users from '@lucide/svelte/icons/users';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';
	import { chf } from '#lib/booking.ts';
	import { fmtDate } from '#lib/i18n.ts';

	let { data } = $props();
	const tabs = [
		['offen', 'Offen'],
		['kommend', 'Kommende'],
		['vergangen', 'Vergangene'],
		['abgesagt', 'Abgesagt']
	] as const;
	const STATUS: Record<string, [string, string]> = {
		angefragt: ['Wartet auf dich', 'chip-wait'],
		bestaetigt: ['Bestätigt', 'chip-ok'],
		abgelehnt: ['Abgelehnt', 'chip-off'],
		storniert: ['Storniert', 'chip-off']
	};
	const EMPTY: Record<string, string> = {
		offen: 'Keine offenen Anfragen. Neue Anfragen kommen auch per Mail.',
		kommend: 'Keine bestätigten Aufenthalte in nächster Zeit.',
		vergangen: 'Noch keine vergangenen Aufenthalte.',
		abgesagt: 'Nichts abgesagt.'
	};
	const d = (iso: string) => fmtDate(iso, 'de', { month: 'short', year: undefined });
	const year = (iso: string) => iso.slice(0, 4);
</script>

<AdminPage title="Buchungen" intro="Alle Anfragen und Aufenthalte. Tipp auf eine Buchung, um sie zu öffnen.">
	{#snippet help()}
		<ul>
			<li><strong>Offen</strong> sind neue Anfragen. Die Daten sind für den Gast reserviert, bis du bestätigst oder ablehnst.</li>
			<li><strong>Kommende</strong> sind bestätigte Aufenthalte. Dort siehst du auch, ob schon bezahlt ist.</li>
			<li>Eine Zahl in der Sprechblase heisst: Der Gast hat dir geschrieben und du hast es noch nicht gelesen.</li>
		</ul>
	{/snippet}

	<nav class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Filter">
		{#each tabs as [key, label] (key)}
			{@const on = data.filter === key}
			<a
				href="?f={key}"
				class="flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 px-4 font-semibold no-underline {on ? 'border-brand bg-brand text-white' : 'border-line bg-paper text-ink hover:border-brand'}"
				aria-current={on ? 'page' : undefined}
			>
				{label}
				{#if data.counts[key]}<span class="rounded-full px-1.5 text-sm {on ? 'bg-white/20' : key === 'offen' ? 'bg-accent text-ink' : 'bg-wash text-brand'}">{data.counts[key]}</span>{/if}
			</a>
		{/each}
	</nav>

	{#if data.bookings.length}
		<ul class="mt-5 grid gap-3">
			{#each data.bookings as b (b.id)}
				{@const [label, chip] = STATUS[b.status] ?? [b.status, 'chip-off']}
				<li>
					<a
						href="/admin/buchungen/{b.id}"
						class="card flex items-center gap-4 p-4 text-ink no-underline transition-colors hover:border-brand {b.status === 'angefragt' ? '!border-accent' : ''}"
					>
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
								<span class="text-lg font-bold text-brand">{b.name}</span>
								<span class="chip {chip}">{label}</span>
								{#if b.status === 'bestaetigt'}
									<span class="chip {b.paidAt ? 'chip-ok' : 'chip-todo'}">{b.paidAt ? 'Bezahlt' : 'Noch nicht bezahlt'}</span>
								{/if}
							</div>
							<div class="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-muted">
								<span class="flex items-center gap-1.5 tabular-nums"><CalendarDays size={16} aria-hidden="true" />{d(b.checkIn)} bis {d(b.checkOut)} {year(b.checkOut)}</span>
								<span class="flex items-center gap-1.5"><Users size={16} aria-hidden="true" />{b.people} {b.people === 1 ? 'Person' : 'Personen'}{b.city ? `, aus ${b.city}` : ''}</span>
								<span class="font-semibold tabular-nums text-ink">{chf(b.totalRp ?? 0)}</span>
							</div>
						</div>
						{#if b.unread}
							<span class="flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-sm font-bold text-ink" title="Ungelesene Nachrichten">
								<MessageCircle size={16} aria-hidden="true" />{b.unread}<span class="sr-only">ungelesene Nachrichten</span>
							</span>
						{/if}
						<ChevronRight size={22} class="shrink-0 text-brand" aria-hidden="true" />
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-6 text-muted">{EMPTY[data.filter]}</p>
	{/if}
</AdminPage>
