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
		description: 'Random string (32+ chars) that signs guest links',
		schema: required((v) => (v.length < 32 ? 'must be at least 32 characters' : undefined))
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
	S3_ENDPOINT: { schema: optional },
	S3_REGION: { schema: (v) => v || 'auto' },
	S3_BUCKET: { schema: optional },
	S3_ACCESS_KEY_ID: { schema: optional },
	S3_SECRET_ACCESS_KEY: { schema: optional }
});
