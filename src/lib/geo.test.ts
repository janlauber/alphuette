import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toLv95, toWgs84 } from './geo.ts';

test('LV95 and WGS84 round trip within a few metres', () => {
	const hut = { e: 2622208, n: 1157578 };
	const { lat, lon } = toWgs84(hut.e, hut.n);
	assert.ok(Math.abs(lat - 46.569) < 0.01 && Math.abs(lon - 7.728) < 0.01);
	const back = toLv95(lat, lon);
	assert.ok(Math.abs(back.e - hut.e) < 3 && Math.abs(back.n - hut.n) < 3);
});
