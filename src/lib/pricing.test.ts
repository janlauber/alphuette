import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceHints } from './pricing.ts';
import type { Season } from './booking.ts';

const summer: Season = { name: 'Sommer', start: '2027-05-01', end: '2027-10-16', nightly: 120_00, weekly: 650_00, minNights: 7, changeover: 6 };
const kinds = (h: ReturnType<typeof priceHints>) => Object.fromEntries(h.map((x) => [x.start, `${x.kind} ${x.suggested / 100}`]));

test('short notice, gap, summer holidays', () => {
	// booked: 12.–19. June and 26. June–3. July, so 19.–26. June is a gap
	const taken = [{ start: '2027-06-12', end: '2027-06-19' }, { start: '2027-06-26', end: '2027-07-03' }];
	const h = kinds(priceHints([summer], taken, '2027-05-10'));
	assert.equal(h['2027-05-15'], 'kurz 550');
	assert.equal(h['2027-06-19'], 'luecke 590');
	assert.equal(h['2027-07-10'], 'hoch 720');
	assert.equal(h['2027-09-04'], undefined);
});

test('weeks with their own price and dismissed hints stay quiet', () => {
	const own = { ...summer, weeks: { '2027-05-15': 600_00 } };
	assert.equal(kinds(priceHints([own], [], '2027-05-10'))['2027-05-15'], undefined);
	assert.equal(kinds(priceHints([summer], [], '2027-05-10', {}, ['kurz:2027-05-15']))['2027-05-15'], undefined);
});

test('often viewed but free, and a season that fills fast', () => {
	assert.equal(kinds(priceHints([summer], [], '2027-03-01', { '2027-06-05': 9 }))['2027-06-05'], 'liegen 620');
	const taken = [{ start: '2027-05-01', end: '2027-09-04' }];
	assert.equal(kinds(priceHints([summer], taken, '2027-03-01'))['2027-09-11'], 'gefragt 720');
});
