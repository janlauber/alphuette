import { test } from 'node:test';
import assert from 'node:assert/strict';
import { byLine, protect, unprotect } from './deepl.ts';

test('blank lines, list markers, times and placeholders survive', () => {
	const { parts, join } = byLine(['Hoi {vorname}\n\n- Holz & Wasser\n- 12:00', 'Wo ist der Schlüssel?\nAuf dem Balken.']);
	assert.deepEqual(parts, ['Hoi {vorname}', 'Holz & Wasser', 'Wo ist der Schlüssel?', 'Auf dem Balken.']);
	assert.deepEqual(join(parts.map((p) => p.toUpperCase())), ['HOI {VORNAME}\n\n- HOLZ & WASSER\n- 12:00', 'WO IST DER SCHLÜSSEL?\nAUF DEM BALKEN.']);
});

test('placeholders and special characters round-trip through the xml escaping', () => {
	assert.equal(protect('Hoi {vorname} & <du>'), 'Hoi <x>{vorname}</x> &amp; &lt;du&gt;');
	assert.equal(unprotect(protect('Hoi {vorname} & <du>')), 'Hoi {vorname} & <du>');
});
