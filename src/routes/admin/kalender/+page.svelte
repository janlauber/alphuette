<script lang="ts">
	import { enhance } from '$app/forms';
	import AdminPage from '#lib/components/admin/AdminPage.svelte';
	import { addDays, toIso, weekday } from '#lib/booking.ts';
	import { fmtDate } from '#lib/i18n.ts';

	let { data, form } = $props();
	const today = toIso(Date.now());

	const months = $derived.by(() => {
		const start = today.slice(0, 7);
		return Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(+start.slice(0, 4), +start.slice(5, 7) - 1 + i, 1)).toISOString().slice(0, 7));
	});
	// Monday first; null pads the days before the 1st
	const days = (ym: string) => {
		const first = ym + '-01';
		const out: (string | null)[] = Array((weekday(first) + 6) % 7).fill(null);
		for (let d = first; d.startsWith(ym); d = addDays(d, 1)) out.push(d);
		return out;
	};
	const stayOn = (d: string) => data.bookings.find((b) => b.checkIn <= d && d < b.checkOut);
	const inSeason = (d: string) => data.seasons.some((s) => s.start <= d && d < s.end);
	const STYLE: Record<string, string> = {
		bestaetigt: 'bg-brand text-white font-bold',
		angefragt: 'bg-accent-soft text-accent-dark font-bold',
		gesperrt: 'bg-off text-off-text line-through'
	};
	const LABEL: Record<string, string> = { bestaetigt: 'bestätigt', angefragt: 'angefragt', gesperrt: 'gesperrt' };
	const monthName = (ym: string) => new Date(ym + '-01T00:00:00Z').toLocaleDateString('de-CH', { timeZone: 'UTC', month: 'long', year: 'numeric' });
	const d = (iso: string) => fmtDate(iso, 'de', { month: 'short' });
	const blocks = $derived(data.bookings.filter((b) => b.status === 'gesperrt'));
</script>

<AdminPage title="Kalender" intro="Welche Tage belegt sind, die nächsten zwölf Monate. Tipp auf einen farbigen Tag, um die Buchung zu öffnen.">
	{#snippet help()}
		<ul>
			<li>Blau sind bestätigte Buchungen, orange sind Anfragen, die auf dich warten.</li>
			<li>Grau durchgestrichen sind Tage, die du selbst gesperrt hast. Auf der Website sind sie belegt.</li>
			<li>Der Abreisetag ist wieder frei, damit am selben Tag neue Gäste kommen können.</li>
			<li>Tage ausserhalb der Saisons sind blass. Saisons stellst du unter <a href="/admin/preise">Preise und Saisons</a> ein.</li>
		</ul>
	{/snippet}

	<ul class="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Legende">
		<li class="flex items-center gap-2"><span class="size-5 rounded-md bg-brand"></span>Bestätigt</li>
		<li class="flex items-center gap-2"><span class="size-5 rounded-md bg-accent-soft"></span>Angefragt</li>
		<li class="flex items-center gap-2"><span class="size-5 rounded-md bg-off"></span>Gesperrt</li>
		<li class="flex items-center gap-2"><span class="size-5 rounded-md border-2 border-line bg-paper"></span>Frei</li>
		<li class="flex items-center gap-2 text-muted"><span class="size-5 rounded-md bg-wash"></span>Nicht vermietet</li>
	</ul>

	<div class="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
		{#each months as ym (ym)}
			<section class="card p-4">
				<h2 class="text-lg first-letter:uppercase">{monthName(ym)}</h2>
				<div class="mt-2 grid grid-cols-7 gap-1 text-center text-sm">
					{#each ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as w (w)}<span class="pb-1 text-xs font-semibold text-muted">{w}</span>{/each}
					{#each days(ym) as day, i (day ?? 'x' + i)}
						{#if day}
							{@const b = stayOn(day)}
							{@const ring = day === today ? 'ring-2 ring-ink ring-offset-1' : ''}
							{#if b && b.status !== 'gesperrt'}
								<a
									href="/admin/buchungen/{b.id}"
									title="{b.name}, {LABEL[b.status]}"
									class="grid h-9 place-items-center rounded-md no-underline hover:opacity-80 {STYLE[b.status]} {ring}"
								>{+day.slice(8)}<span class="sr-only">, {b.name}, {LABEL[b.status]}</span></a>
							{:else if b}
								<span title={b.hostNote ? `Gesperrt: ${b.hostNote}` : 'Gesperrt'} class="grid h-9 place-items-center rounded-md {STYLE.gesperrt} {ring}">{+day.slice(8)}<span class="sr-only">, gesperrt</span></span>
							{:else}
								<span class="grid h-9 place-items-center rounded-md {inSeason(day) ? 'border-2 border-line bg-paper' : 'bg-wash text-muted/70'} {day < today ? 'opacity-50' : ''} {ring}">{+day.slice(8)}</span>
							{/if}
						{:else}
							<span></span>
						{/if}
					{/each}
				</div>
			</section>
		{/each}
	</div>

	<section class="mt-12 grid gap-6 lg:grid-cols-2">
		<form method="POST" action="?/block" use:enhance class="card p-5">
			<h2 class="text-xl">Zeit sperren</h2>
			<p class="hint mt-1">Zum Beispiel wenn du selbst im Hüttli bist oder etwas reparierst. Auf der Website sind diese Tage dann belegt, niemand kann sie anfragen.</p>
			<div class="mt-4 grid grid-cols-2 gap-3">
				<label class="label">Von <input type="date" name="from" required min={today} class="field mt-1 font-normal" /></label>
				<label class="label">Bis <input type="date" name="to" required min={today} class="field mt-1 font-normal" /></label>
			</div>
			<label class="label mt-3 block">Grund <span class="hint font-normal">(freiwillig, sieht nur du)</span><input name="note" maxlength="200" class="field mt-1 font-normal" /></label>
			{#if form?.error}<p class="mt-3 rounded-[14px] bg-danger-wash px-3 py-2 font-semibold text-danger" role="alert">{form.error}</p>{/if}
			<button class="btn-primary mt-4">Sperren</button>
		</form>

		<div>
			<h2 class="text-xl">Deine Sperren</h2>
			<ul class="mt-3 grid gap-2">
				{#each blocks as b (b.id)}
					<li class="card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
						<span><strong class="tabular-nums">{d(b.checkIn)} bis {d(b.checkOut)}</strong>{#if b.hostNote}<span class="block text-sm text-muted">{b.hostNote}</span>{/if}</span>
						<form
							method="POST"
							action="?/unblock"
							use:enhance={({ cancel }) => {
								if (!confirm(`Sperre vom ${d(b.checkIn)} bis ${d(b.checkOut)} aufheben? Die Tage sind dann wieder frei. Du kannst es im Verlauf rückgängig machen.`)) cancel();
							}}
						>
							<input type="hidden" name="id" value={b.id} />
							<button class="btn-line">Freigeben</button>
						</form>
					</li>
				{:else}
					<li class="text-muted">Keine Sperren.</li>
				{/each}
			</ul>
		</div>
	</section>
</AdminPage>
