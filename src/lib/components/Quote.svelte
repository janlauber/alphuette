<script lang="ts">
	import { chf, quote, type Guests, type Range, type Rates, type Season } from '#lib/booking.ts';
	import { dict, weekdayName, type Lang } from '#lib/i18n.ts';

	let {
		checkIn,
		checkOut,
		guests,
		seasons,
		rates,
		taken,
		lang
	}: { checkIn: string; checkOut: string; guests: Guests; seasons: Season[]; rates: Rates; taken: Range[]; lang: Lang } =
		$props();
	const t = $derived(dict[lang]);
	const q = $derived(quote(checkIn, checkOut, guests, seasons, rates, taken));

	const errorText = (e: string) => {
		const s = seasons.find((s) => s.start <= checkIn && checkIn < s.end) ?? seasons[0];
		if (e === 'min') return t.errors.min(s?.minNights ?? 1);
		if (e === 'changeover') return t.errors.changeover(weekdayName(s?.changeover ?? 6, lang));
		if (e === 'guests') return t.errors.guests(rates.maxGuests);
		return t.errors[e as 'dates' | 'closed' | 'taken'];
	};
</script>

{#if q.ok}
	<table class="w-full text-[0.95rem]">
		<tbody>
			{#each q.lines as line (line.key)}
				<tr>
					<td class="py-0.5">{t.lines[line.key](line.qty)}</td>
					<td class="py-0.5 text-right tabular-nums">{chf(line.amount)}</td>
				</tr>
			{/each}
		</tbody>
		<tfoot>
			<tr class="border-t-2 border-line text-lg font-bold">
				<td class="pt-2.5">{t.card.total}</td>
				<td class="pt-2.5 text-right tabular-nums"><mark class="rounded-md bg-accent-soft px-1.5 text-ink">{chf(q.total)}</mark></td>
			</tr>
		</tfoot>
	</table>
{:else}
	<p class="rounded-[16px] bg-danger-wash px-4 py-3 font-semibold text-danger" role="alert">{errorText(q.error)}</p>
{/if}
