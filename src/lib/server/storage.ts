import { AwsClient } from 'aws4fetch';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
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
// No PUT sends a content-type: our Ceph RGW treats such a request as anonymous and answers 403.
// The objects are stored as binary, which is fine: /bilder sets the response type itself.
// ponytail: two places on purpose; copy the folder into the bucket once its writes work, then drop the fallback.
const endpoint =
	S3_ENDPOINT?.replace(/\/$/, '') ??
	(BUCKET_HOST ? `${BUCKET_PORT === '443' ? 'https' : 'http'}://${BUCKET_HOST}:${BUCKET_PORT ?? '80'}` : null);
const bucket = S3_BUCKET ?? BUCKET_NAME;
const s3 =
	endpoint && bucket && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
		? new AwsClient({ accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY, service: 's3', region: S3_REGION ?? BUCKET_REGION })
		: null;
const url = (key: string) => `${endpoint}/${bucket}/${key}`;
/** The S3 error code from an error response, e.g. AccessDenied. */
const s3Code = async (res: Response) => (await res.text()).match(/<Code>(\w+)<\/Code>/)?.[1] ?? '';

if (s3) {
	// Startup check, so a broken bucket shows up in the log right away: can we list, and can we write?
	const probe = url('probe/write-check');
	Promise.all([s3.fetch(`${endpoint}/${bucket}?list-type=2&max-keys=1`), s3.fetch(probe, { method: 'PUT', body: new TextEncoder().encode('ok') })])
		.then(async ([list, write]) => {
			console.log(`storage: bucket ${bucket}: list ${list.status} ${list.ok ? '' : await s3Code(list)}, write ${write.status} ${write.ok ? '' : await s3Code(write)}`);
			if (write.ok) await s3.fetch(probe, { method: 'DELETE' });
		})
		.catch((e) => console.error('storage: bucket unreachable', e));
} else if (endpoint) console.warn('storage: bucket endpoint set but name or credentials missing, using', UPLOAD_DIR);

const local = (key: string) => `${UPLOAD_DIR}/${key}`;

async function putLocal(key: string, body: Uint8Array) {
	await mkdir(dirname(local(key)), { recursive: true });
	await writeFile(local(key), body);
}

export async function put(key: string, body: Uint8Array) {
	if (!s3) return putLocal(key, body);
	const res = await s3.fetch(url(key), { method: 'PUT', body: body as BodyInit }).catch((e) => e as Error);
	if (res instanceof Response && res.ok) return;
	// only status and S3 code, so all refusals count as one error instead of one per request id
	const why = res instanceof Response ? `${res.status} ${await s3Code(res)}`.trim() : String(res);
	await import('./monitor.ts').then((m) => m.report(new Error(`Bucket nimmt kein Foto an (${why}), liegt jetzt auf dem Volume`), 'Fotos speichern', { alert: false }));
	await putLocal(key, body);
}

export async function get(key: string): Promise<Uint8Array | null> {
	const file = await readFile(local(key)).catch(() => null);
	if (file || !s3) return file;
	const res = await s3.fetch(url(key)).catch(() => null);
	return res?.ok ? new Uint8Array(await res.arrayBuffer()) : null;
}

/** Copies photos that so far only exist on the volume into the bucket; files already there are skipped. */
export async function copyToBucket() {
	if (!s3) return 0;
	let n = 0;
	for (const f of await readdir(local('photos')).catch(() => [] as string[])) {
		const key = `photos/${f}`;
		if ((await s3.fetch(url(key), { method: 'HEAD' })).ok) continue;
		const res = await s3.fetch(url(key), { method: 'PUT', body: (await readFile(local(key))) as BodyInit });
		if (!res.ok) throw new Error(`Bucket nimmt ${key} nicht an (${res.status} ${await s3Code(res)})`);
		n++;
	}
	return n;
}

export async function del(key: string) {
	await rm(local(key), { force: true });
	if (s3) await s3.fetch(url(key), { method: 'DELETE' }).catch(() => {});
}
