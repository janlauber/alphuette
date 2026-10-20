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

// Photos live in the bucket. Without one (local development) they go to the folder UPLOAD_DIR.
// No PUT sends a content-type: our Ceph RGW treats such a request as anonymous and answers 403.
// The objects are stored as binary, which is fine: /bilder sets the response type itself.
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

export async function put(key: string, body: Uint8Array) {
	if (!s3) {
		await mkdir(dirname(local(key)), { recursive: true });
		return writeFile(local(key), body);
	}
	const res = await s3.fetch(url(key), { method: 'PUT', body: body as BodyInit });
	if (res.ok) return;
	// only status and S3 code, so all refusals count as one error instead of one per file
	const e = new Error(`Bucket nimmt kein Foto an (${`${res.status} ${await s3Code(res)}`.trim()})`);
	await import('./monitor.ts').then((m) => m.report(e, 'Fotos speichern'));
	throw e;
}

export async function get(key: string): Promise<Uint8Array | null> {
	if (!s3) return readFile(local(key)).catch(() => null);
	const res = await s3.fetch(url(key)).catch(() => null);
	return res?.ok ? new Uint8Array(await res.arrayBuffer()) : null;
}

export async function del(key: string) {
	if (!s3) return rm(local(key), { force: true });
	await s3.fetch(url(key), { method: 'DELETE' }).catch(() => {});
}
