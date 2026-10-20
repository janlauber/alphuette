import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quote, checkStay, type Season, type Rates } from './booking.ts';

const summer: Season = {
	name: 'Sommer',
	start: '2027-05-01',
	end: '2027-10-16',
	nightly: 120_00,
	weekly: 650_00,
	minNights: 7,
	changeover: 6
};
const rates: Rates = { cleaning: 0, linen: 5_00, taxAdult: 3_00, taxChild: 1_50, levyAdult: 1_00, maxGuests: 6 };
const family = { adults: 2, children: 2, infants: 1, linen: 4 };

test('one week Saturday to Saturday', () => {
	const q = quote('2027-07-03', '2027-07-10', family, [summer], rates);
	assert.ok(q.ok);
	assert.equal(q.nights, 7);
	// 650 + 4 × 5 linen + 7 × (2 × 3 + 2 × 1.5) tax + 7 × 2 × 1 levy
	assert.deepEqual(
		q.lines.map((l) => [l.key, l.amount]),
		[['stay', 650_00], ['linen', 20_00], ['tax', 63_00], ['levy', 14_00]]
	);
	assert.equal(q.total, 747_00);
});

test('ten nights use one week plus three nights', () => {
	const flexible = { ...summer, changeover: null };
	const q = quote('2027-07-03', '2027-07-13', { ...family, linen: 0 }, [flexible], rates);
	assert.ok(q.ok);
	assert.equal(q.lines[0].amount, 650_00 + 3 * 120_00);
});

test('rules', () => {
	assert.equal(checkStay('2027-07-04', '2027-07-11', [summer], []), 'changeover');
	assert.equal(checkStay('2027-07-03', '2027-07-06', [{ ...summer, changeover: null }], []), 'min');
	assert.equal(checkStay('2027-10-09', '2027-10-16', [summer], []), null);
	assert.equal(checkStay('2027-10-16', '2027-10-23', [summer], []), 'closed');
	assert.equal(checkStay('2027-07-03', '2027-07-10', [summer], [{ start: '2027-07-09', end: '2027-07-16' }]), 'taken');
	// a stay may start on the day the previous guests leave
	assert.equal(checkStay('2027-07-10', '2027-07-17', [summer], [{ start: '2027-07-03', end: '2027-07-10' }]), null);
	assert.equal(quote('2027-07-03', '2027-07-10', { adults: 6, children: 1, infants: 0, linen: 0 }, [summer], rates).ok, false);
	assert.equal(quote('2027-07-03', '2027-07-10', { adults: 0, children: 2, infants: 0, linen: 0 }, [summer], rates).ok, false);
});

test('a week with its own price costs that, the other weeks the season price', () => {
	const special = { ...summer, weeks: { '2027-07-10': 550_00 } };
	const q = quote('2027-07-03', '2027-07-17', { ...family, linen: 0 }, [special], rates);
	assert.ok(q.ok);
	assert.equal(q.lines.find((l) => l.key === 'stay')!.amount, 650_00 + 550_00);
});
