import { test } from 'node:test';
import assert from 'node:assert/strict';
import { byLine, protect } from './mt.ts';

test('blank lines, list markers, times and placeholders survive', () => {
	const { parts, join } = byLine(['Hoi {vorname}\n\n- Holz & Wasser\n- 12:00', 'Wo ist der Schlüssel?\nAuf dem Balken.']);
	assert.deepEqual(parts, ['Hoi {vorname}', 'Holz & Wasser', 'Wo ist der Schlüssel?', 'Auf dem Balken.']);
	assert.deepEqual(join(parts.map((p) => p.toUpperCase())), ['HOI {VORNAME}\n\n- HOLZ & WASSER\n- 12:00', 'WO IST DER SCHLÜSSEL?\nAUF DEM BALKEN.']);
});

test('placeholders and place names go through the model as X1, X2', () => {
	const p = protect('Hoi {vorname}, das Hüttli steht in Lengschwendi im Kiental, Blick zur Blüemlisalp. Kientaler Käse.');
	assert.equal(p.text, 'Hoi X1, das Hüttli steht in X2 im X3, Blick zur X4. Kientaler Käse.');
	assert.equal(p.restore('Hi X1, the hut is in X2 in the X3, view of X4.'), 'Hi {vorname}, the hut is in Lengschwendi in the Kiental, view of Blüemlisalp.');
	assert.equal(protect('Blüemlisalpblick').text, 'X1');
});
