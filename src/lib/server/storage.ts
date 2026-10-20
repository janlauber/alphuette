import { AwsClient } from 'aws4fetch';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
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

// Photos and backups live in the bucket (keys photos/… and backups/…). Without a bucket (local
// development) they go to the folder UPLOAD_DIR instead.
// No PUT sends a content-type: our Ceph RGW treats such a request as anonymous and answers 403.
// The objects are stored as binary, which is fine: the routes that serve them set the type themselves.
const endpoint =
	S3_ENDPOINT?.replace(/\/$/, '') ??
	(BUCKET_HOST ? `${BUCKET_PORT === '443' ? 'https' : 'http'}://${BUCKET_HOST}:${BUCKET_PORT ?? '80'}` : null);
const bucket = S3_BUCKET ?? BUCKET_NAME;
const s3 =
	endpoint && bucket && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
		? new AwsClient({ accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY, service: 's3', region: S3_REGION ?? BUCKET_REGION })
		: null;
const url = (key: string) => `${endpoint}/${bucket}/${key}`;
const local = (key: string) => `${UPLOAD_DIR}/${key}`;
/** The S3 error code from an error response, e.g. AccessDenied. */
const s3Code = async (res: Response) => (await res.text()).match(/<Code>(\w+)<\/Code>/)?.[1] ?? '';

/** Can the app list and write the bucket? For the startup log and the system page. */
export async function bucketCheck(): Promise<{ ok: boolean | null; text: string }> {
	if (!s3) return { ok: null, text: `kein Bucket, Dateien liegen im Ordner ${UPLOAD_DIR}` };
	const probe = url('probe/write-check');
	const [list, write] = await Promise.all([s3.fetch(`${endpoint}/${bucket}?list-type=2&max-keys=1`), s3.fetch(probe, { method: 'PUT', body: new TextEncoder().encode('ok') })]);
	if (write.ok) await s3.fetch(probe, { method: 'DELETE' });
	const ok = list.ok && write.ok;
	return { ok, text: ok ? 'lesen und schreiben geht' : `lesen ${list.status} ${list.ok ? '' : await s3Code(list)}, schreiben ${write.status} ${write.ok ? '' : await s3Code(write)}` };
}
bucketCheck()
	.then((c) => console.log(`storage: ${s3 ? `bucket ${bucket}` : 'folder'}: ${c.text}`))
	.catch((e) => console.error('storage: bucket unreachable', e));

export async function put(key: string, body: Uint8Array) {
	if (!s3) {
		await mkdir(dirname(local(key)), { recursive: true });
		return writeFile(local(key), body);
	}
	const res = await s3.fetch(url(key), { method: 'PUT', body: body as BodyInit });
	if (res.ok) return;
	// only status and S3 code, so all refusals count as one error instead of one per file
	const e = new Error(`Bucket nimmt keine Datei an (${`${res.status} ${await s3Code(res)}`.trim()})`);
	await import('./monitor.ts').then((m) => m.report(e, 'Bucket speichern'));
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

/**
 * Files under a prefix such as "backups/", with their size.
 * ponytail: one page of up to 1000 keys; enough for backups, page with continuation-token if more ever live there.
 */
export async function list(prefix: string): Promise<{ key: string; size: number }[]> {
	if (!s3) {
		const names = await readdir(local(prefix)).catch(() => [] as string[]);
		return Promise.all(names.map(async (n) => ({ key: prefix + n, size: (await stat(local(prefix + n))).size })));
	}
	const res = await s3.fetch(`${endpoint}/${bucket}?list-type=2&prefix=${encodeURIComponent(prefix)}`);
	if (!res.ok) throw new Error(`Bucket listet ${prefix} nicht (${res.status} ${await s3Code(res)})`);
	const xml = await res.text();
	return [...xml.matchAll(/<Contents>[\s\S]*?<Key>([^<]+)<\/Key>[\s\S]*?<Size>(\d+)<\/Size>[\s\S]*?<\/Contents>/g)].map((m) => ({ key: m[1], size: +m[2] }));
}
