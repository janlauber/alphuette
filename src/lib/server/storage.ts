import { AwsClient } from 'aws4fetch';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
	S3_ACCESS_KEY_ID,
	S3_BUCKET,
	S3_ENDPOINT,
	S3_REGION,
	S3_SECRET_ACCESS_KEY
} from '$app/env/private';

// S3 in production; a local folder when S3_ENDPOINT is not set (development).
const s3 = S3_ENDPOINT
	? new AwsClient({
			accessKeyId: S3_ACCESS_KEY_ID!,
			secretAccessKey: S3_SECRET_ACCESS_KEY!,
			service: 's3',
			region: S3_REGION
		})
	: null;
const url = (key: string) => `${S3_ENDPOINT!.replace(/\/$/, '')}/${S3_BUCKET}/${key}`;
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
