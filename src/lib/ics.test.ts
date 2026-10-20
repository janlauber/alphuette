import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calendar, fold, zurich } from './server/ics.ts';

test('Swiss local time becomes UTC, summer and winter', () => {
	assert.equal(zurich('2027-07-17', '14:00').toISOString(), '2027-07-17T12:00:00.000Z');
	assert.equal(zurich('2027-01-09', '11:00').toISOString(), '2027-01-09T10:00:00.000Z');
});

test('long lines fold at 75 bytes, umlauts included', () => {
	const folded = fold('DESCRIPTION:' + 'ü'.repeat(60));
	for (const line of folded.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, line);
	assert.equal(folded.replace(/\r\n /g, ''), 'DESCRIPTION:' + 'ü'.repeat(60));
});

test('a stay becomes one event with escaped text', () => {
	const ics = calendar('Alphütte', [{ uid: 'ABC@x', start: zurich('2027-07-17', '14:00'), end: zurich('2027-07-24', '11:00'), title: 'Hüttli; Woche, 6 P.' }]);
	assert.match(ics, /DTSTART:20270717T120000Z\r\n/);
	assert.match(ics, /DTEND:20270724T090000Z\r\n/);
	assert.match(ics, /SUMMARY:Hüttli\\; Woche\\, 6 P\.\r\n/);
});
