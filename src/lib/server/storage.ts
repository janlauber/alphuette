import { AwsClient } from 'aws4fetch';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
	AWS_ACCESS_KEY_ID,
	AWS_SECRET_ACCESS_KEY,
	BUCKET_HOST,
	BUCKET_NAME,
	BUCKET_PORT,
	BUCKET_REGION,
	S3_BUCKET,
	S3_ENDPOINT,
	S3_REGION,
	UPLOAD_DIR
} from '$app/env/private';

// Photos live in the local folder (UPLOAD_DIR, a volume in production) and, when a bucket is
// configured, in S3. Reads try the folder first, so files written before a bucket existed keep
// working; writes go to the bucket and fall back to the folder when the bucket refuses them.
// ponytail: two places on purpose; copy the folder into the bucket once its writes work, then drop the fallback.
const endpoint =
	S3_ENDPOINT?.replace(/\/$/, '') ??
	(BUCKET_HOST ? `${BUCKET_PORT === '443' ? 'https' : 'http'}://${BUCKET_HOST}:${BUCKET_PORT ?? '80'}` : null);
const bucket = S3_BUCKET ?? BUCKET_NAME;
const s3 =
	endpoint && bucket && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
		? new AwsClient({ accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY, service: 's3', region: S3_REGION ?? BUCKET_REGION })
		: null;
if (s3) {
	// Startup check, so a broken bucket shows up in the log right away.
	s3.fetch(`${endpoint}/${bucket}?list-type=2&max-keys=1`)
		.then(async (r) => console.log(`storage: bucket ${bucket}: list ${r.status} ${r.ok ? '' : (await r.text()).slice(0, 200)}`))
		.catch((e) => console.error('storage: bucket unreachable', e));
} else if (endpoint) console.warn('storage: bucket endpoint set but name or credentials missing, using', UPLOAD_DIR);

const url = (key: string) => `${endpoint}/${bucket}/${key}`;
const local = (key: string) => `${UPLOAD_DIR}/${key}`;

async function putLocal(key: string, body: Uint8Array) {
	await mkdir(dirname(local(key)), { recursive: true });
	await writeFile(local(key), body);
}

export async function put(key: string, body: Uint8Array, type: string) {
	if (!s3) return putLocal(key, body);
	const res = await s3.fetch(url(key), { method: 'PUT', body: body as BodyInit, headers: { 'content-type': type } }).catch((e) => e as Error);
	if (res instanceof Response && res.ok) return;
	// only status and S3 code, so all refusals count as one error instead of one per request id
	const why = res instanceof Response ? `${res.status} ${(await res.text()).match(/<Code>(\w+)<\/Code>/)?.[1] ?? ''}`.trim() : String(res);
	await import('./monitor.ts').then((m) => m.report(new Error(`Bucket nimmt kein Foto an (${why}), liegt jetzt auf dem Volume`), 'Fotos speichern', { alert: false }));
	await putLocal(key, body);
}

export async function get(key: string): Promise<Uint8Array | null> {
	const file = await readFile(local(key)).catch(() => null);
	if (file || !s3) return file;
	const res = await s3.fetch(url(key)).catch(() => null);
	return res?.ok ? new Uint8Array(await res.arrayBuffer()) : null;
}

export async function del(key: string) {
	await rm(local(key), { force: true });
	if (s3) await s3.fetch(url(key), { method: 'DELETE' }).catch(() => {});
}
