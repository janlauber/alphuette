import { defineEnvVars } from '@sveltejs/kit/env';
import { building } from '$app/env';

const optional = (value: string | undefined) => value || undefined;
// Required when the app runs, not while it is built (the build has no secrets).
const required = (check: (v: string) => string | void = () => {}) => (value: string | undefined) => {
	if (building) return value ?? '';
	if (!value) throw new Error('missing');
	const problem = check(value);
	if (problem) throw new Error(problem);
	return value;
};

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'Postgres connection string', schema: required() },
	APP_SECRET: {
		description: 'Signs guest links. Without it the app generates one and keeps it in the database.',
		schema: (v) => {
			if (v && v.length < 32) throw new Error('must be at least 32 characters');
			return v || undefined;
		}
	},
	SITE_URL: {
		description: 'Public base URL without trailing slash, used in mails and sitemap',
		schema: required((v) => (/^https?:\/\/[^/]+$/.test(v) ? undefined : 'must look like https://example.ch'))
	},
	ADMIN_EMAILS: {
		description: 'Comma-separated emails allowed to log in to /admin',
		schema: (v) => (v ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
	},
	RESEND_API_KEY: { schema: optional },
	MAIL_FROM: { schema: (v) => v || 'Alphütte <hallo@alphuette-kiental.ch>' },
	REPLY_DOMAIN: { schema: optional, description: 'Domain receiving replies via Resend inbound' },
	RESEND_WEBHOOK_SECRET: { schema: optional },
	// Bucket, named as a Rook/klickops bucket provides it. S3_ENDPOINT overrides host and port.
	S3_ENDPOINT: { schema: optional },
	GEOIP_DB: { schema: optional, description: 'Path to a city mmdb file (DB-IP lite) for analytics places' },
	UPLOAD_DIR: { schema: (v) => v || '.data/uploads', description: 'Folder for photos when no bucket is set' },
	BUCKET_HOST: { schema: optional },
	BUCKET_PORT: { schema: optional },
	BUCKET_NAME: { schema: optional },
	BUCKET_REGION: { schema: (v) => v || 'us-east-1' },
	AWS_ACCESS_KEY_ID: { schema: optional },
	AWS_SECRET_ACCESS_KEY: { schema: optional }
});
