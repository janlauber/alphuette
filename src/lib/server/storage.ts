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
	S3_ENDPOINT
} from '$app/env/private';

// S3 in production (variable names as a Rook/klickops bucket provides them);
// a local folder when no bucket is configured (development).
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
const url = (key: string) => `${endpoint}/${BUCKET_NAME}/${key}`;
const local = (key: string) => `.data/uploads/${key}`;

export async function put(key: string, body: Uint8Array, type: string) {
	if (!s3) {
		await mkdir(dirname(local(key)), { recursive: true });
		return writeFile(local(key), body);
	}
	const res = await s3.fetch(url(key), { method: 'PUT', body: body as BodyInit, headers: { 'content-type': type } });
	if (!res.ok) throw new Error(`S3 put ${key}: ${res.status}`);
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
