// Downloads the free DB-IP "IP to City Lite" database (CC BY 4.0) at build time.
// Tries this month and last month, because the new file appears during the first days.
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { createGunzip } from 'node:zlib';

const out = process.argv[2] ?? 'geo/dbip-city-lite.mmdb';
await mkdir(out.replace(/\/[^/]+$/, ''), { recursive: true });
const month = (back) => {
	const d = new Date();
	d.setUTCDate(1);
	d.setUTCMonth(d.getUTCMonth() - back);
	return d.toISOString().slice(0, 7);
};
for (const m of [month(0), month(1)]) {
	const res = await fetch(`https://download.db-ip.com/free/dbip-city-lite-${m}.mmdb.gz`);
	if (!res.ok) continue;
	await pipeline(Readable.fromWeb(res.body), createGunzip(), createWriteStream(out));
	console.log('geoip', m, out);
	process.exit(0);
}
console.warn('geoip: no database downloaded, analytics will show no places');
