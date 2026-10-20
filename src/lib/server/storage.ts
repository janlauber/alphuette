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
	S3_ENDPOINT,
	UPLOAD_DIR
} from '$app/env/private';

// S3 in production (variable names as a Rook/klickops bucket provides them);
// a local folder (UPLOAD_DIR) when no bucket is configured.
const endpoint =
	S3_ENDPOINT?.replace(/\/$/, '') ??
	(BUCKET_HOST ? `${BUCKET_PORT === '443' ? 'https' : 'http'}://${BUCKET_HOST}:${BUCKET_PORT ?? '80'}` : null);
const s3 = endpoint
	? new AwsClient({
			accessKeyId: AWS_ACCESS_KEY_ID!,
			secretAccessKey: AWS_SECRET_ACCESS_KEY!,
			service: 's3',
			region: BUCKET_REGION
		})
	: null;
if (s3) {
	// Startup check, so a broken bucket shows up in the log right away.
	s3.fetch(`${endpoint}/${BUCKET_NAME}?list-type=2&max-keys=1`)
		.then(async (r) => console.log(`storage: bucket ${BUCKET_NAME} at ${endpoint}: list ${r.status} ${r.ok ? '' : (await r.text()).slice(0, 200)}`))
		.catch((e) => console.error('storage: bucket unreachable', e));
}
const url = (key: string) => `${endpoint}/${BUCKET_NAME}/${key}`;
const local = (key: string) => `${UPLOAD_DIR}/${key}`;

export async function put(key: string, body: Uint8Array, type: string) {
	if (!s3) {
		await mkdir(dirname(local(key)), { recursive: true });
		return writeFile(local(key), body);
	}
	const res = await s3.fetch(url(key), { method: 'PUT', body: body as BodyInit, headers: { 'content-type': type } });
	if (!res.ok) throw new Error(`S3 put ${key}: ${res.status} ${(await res.text()).slice(0, 300)}`);
}

export async function get(key: string): Promise<Uint8Array | null> {
	if (!s3) return readFile(local(key)).catch(() => null);
	const res = await s3.fetch(url(key));
	return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
}

export async function del(key: string) {
	if (!s3) return rm(local(key), { force: true });
	await s3.fetch(url(key), { method: 'DELETE' });
}
