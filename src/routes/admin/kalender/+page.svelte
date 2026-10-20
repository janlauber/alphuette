<script lang="ts">
	import { enhance } from '$app/forms';
	import { addDays, toIso, weekday } from '#lib/booking.ts';
	import { fmtDate } from '#lib/i18n.ts';

	let { data, form } = $props();
	const today = toIso(Date.now());

	const months = $derived.by(() => {
		const start = today.slice(0, 7);
		return Array.from({ length: 12 }, (_, i) => {
			const d = new Date(Date.UTC(+start.slice(0, 4), +start.slice(5, 7) - 1 + i, 1));
			return d.toISOString().slice(0, 7);
		});
	});
	const days = (ym: string) => {
		const first = ym + '-01';
		const out: (string | null)[] = Array((weekday(first) + 6) % 7).fill(null);
		for (let d = first; d.startsWith(ym); d = addDays(d, 1)) out.push(d);
		return out;
	};
	const stayOn = (d: string) => data.bookings.find((b) => b.checkIn <= d && d < b.checkOut);
	const open = (d: string) => data.seasons.some((s) => s.start <= d && d < s.end);
	const COLOR: Record<string, string> = { bestaetigt: 'bg-tanne text-kalk', angefragt: 'bg-gelb', gesperrt: 'bg-stein/40' };
	const monthName = (ym: string) => new Date(ym + '-01T00:00:00Z').toLocaleDateString('de-CH', { timeZone: 'UTC', month: 'long', year: 'numeric' });
	const d = (iso: string) => fmtDate(iso, 'de', { month: 'short' });
</script>

<h1 class="text-3xl">Kalender</h1>
<p class="mt-2 flex flex-wrap gap-4 text-sm">
	<span class="flex items-center gap-1.5"><span class="size-3 bg-tanne"></span> Bestätigt</span>
	<span class="flex items-center gap-1.5"><span class="size-3 bg-gelb"></span> Angefragt</span>
	<span class="flex items-center gap-1.5"><span class="size-3 bg-stein/40"></span> Gesperrt</span>
	<span class="flex items-center gap-1.5"><span class="size-3 border border-linie bg-white"></span> Offen</span>
	<span class="flex items-center gap-1.5 text-stein"><span class="size-3 bg-kalk"></span> Ausserhalb der Saison</span>
</p>

<div class="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
	{#each months as ym (ym)}
		<div>
			<p class="font-semibold first-letter:uppercase">{monthName(ym)}</p>
			<div class="mt-1 grid grid-cols-7 gap-px text-center text-sm">
				{#each days(ym) as day, i (day ?? 'x' + i)}
					{#if day}
						{@const b = stayOn(day)}
						{#if b && b.status !== 'gesperrt'}
							<a href="/admin/buchungen/{b.id}" title={b.name} class="py-1 no-underline {COLOR[b.status]}">{+day.slice(8)}</a>
						{:else}
							<span title={b?.hostNote ?? ''} class="py-1 {b ? COLOR.gesperrt : open(day) ? 'bg-white' : 'text-stein/60'}">{+day.slice(8)}</span>
						{/if}
					{:else}
						<span></span>
					{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>

<section class="mt-12 grid gap-8 lg:grid-cols-2">
	<form method="POST" action="?/block" use:enhance class="rounded-[14px] bg-paper p-5">
		<h2 class="text-xl">Zeit sperren</h2>
		<p class="text-sm text-stein">Zum Beispiel wenn du selbst im Hüttli bist. Gesperrte Tage sind auf der Website belegt.</p>
		<div class="mt-4 grid grid-cols-2 gap-3">
			<label class="label">Von <input type="date" name="from" required class="field mt-1 font-normal" /></label>
			<label class="label">Bis <input type="date" name="to" required class="field mt-1 font-normal" /></label>
		</div>
		<label class="label mt-3">Grund <span class="hint">(freiwillig)</span><input name="note" maxlength="200" class="field mt-1 font-normal" /></label>
		{#if form?.error}<p class="mt-2 text-rot" role="alert">{form.error}</p>{/if}
		<button class="btn-gelb mt-4">Sperren</button>
	</form>

	<div>
		<h2 class="text-xl">Sperren</h2>
		<ul class="mt-3 grid gap-2">
			{#each data.bookings.filter((b) => b.status === 'gesperrt') as b (b.id)}
				<li class="flex items-center justify-between gap-3 rounded-[14px] bg-paper px-4 py-2">
					<span>{d(b.checkIn)} bis {d(b.checkOut)} <span class="text-stein">{b.hostNote ?? ''}</span></span>
					<form method="POST" action="?/unblock" use:enhance><input type="hidden" name="id" value={b.id} /><button class="text-sm underline">Freigeben</button></form>
				</li>
			{:else}
				<li class="text-stein">Keine Sperren.</li>
			{/each}
		</ul>
	</div>
</section>
