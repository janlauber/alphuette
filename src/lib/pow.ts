// Proof-of-work shared by the browser (solve) and the server (zeroBits).
// The challenge is "salt.expires.difficulty.signature"; find a nonce so that
// sha256("<challenge>:<nonce>") starts with `difficulty` zero bits.

export const zeroBits = (hash: Uint8Array, bits: number) => {
	for (let i = 0; i < bits; i++) if (hash[i >> 3] & (0x80 >> (i & 7))) return false;
	return true;
};

export async function solve(challenge: string) {
	const bits = Number(challenge.split('.')[2]);
	const enc = new TextEncoder();
	for (let nonce = 0; nonce < 50_000_000; nonce++) {
		const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(`${challenge}:${nonce}`)));
		if (zeroBits(hash, bits)) return String(nonce);
	}
	return '';
}
