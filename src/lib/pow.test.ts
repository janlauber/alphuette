import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { solve, zeroBits } from './pow.ts';

test('solve finds a nonce the server accepts', async () => {
	const challenge = 'abc.123.10.sig';
	const nonce = await solve(challenge);
	const hash = createHash('sha256').update(`${challenge}:${nonce}`).digest();
	assert.ok(zeroBits(hash, 10));
	assert.equal(zeroBits(Uint8Array.from([0x00, 0x40]), 10), false);
	assert.equal(zeroBits(Uint8Array.from([0x00, 0x20]), 10), true);
});
