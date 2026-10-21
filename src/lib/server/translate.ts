import Anthropic from '@anthropic-ai/sdk';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { ANTHROPIC_API_KEY } from '$app/env/private';
import { sql } from './db.ts';
import { byLine, protect } from '#lib/mt.ts';
import type { Lang } from '#lib/i18n.ts';

// Tom writes German. English, French and Italian come from the translations table, keyed by the
// German text and filled whenever a text is new by small translation models on this server
// (scripts/translate.mjs), without an account or key. Until then pages fall back to German.
// Messages between guests and Tom are translated by Claude (translateMessage).
const client = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;
export const TARGETS = ['en', 'fr', 'it'] as const;
const NAMES: Record<Lang, string> = { de: 'German', en: 'English', fr: 'French', it: 'Italian' };
// keyed by the trimmed German text, so a stray space or newline never loses a translation
export const hash = (s: string) => createHash('md5').update(s.trim()).digest('hex');

const SYSTEM = `You translate for the website of a small alpine hut for rent, "Alphütte Blüemlisalpblick" in Lengschwendi, Kiental, canton of Bern, Switzerland. The host is Tom.
- Keep the tone plain, warm and short, like the original. Address the reader informally (German "du": "tu" in French and Italian, "you" in English).
- Keep place names, mountain, hut, restaurant and bus stop names, URLs, phone numbers, amounts, dates and times exactly as written.
- Keep words in curly braces like {vorname} or {link} exactly as they are, untranslated; they are filled in later.
- Keep line breaks, blank lines and list markers ("- ") exactly. In FAQ texts a question line is followed by its answer; keep that layout.
- Use Swiss conventions: CHF, 24-hour times.`;

async function ask<T>(prompt: string, schema: Record<string, unknown>): Promise<T> {
	const res = await client!.beta.messages.create({
		model: 'claude-opus-5-5',
		max_tokens: 16000,
		// if the model declines, the API retries on its recommended fallback model
		betas: ['server-side-fallback-2026-07-01'],
		fallbacks: 'default',
		system: SYSTEM,
		output_config: { effort: 'low', format: { type: 'json_schema', schema } },
		messages: [{ role: 'user', content: prompt }]
	});
	if (res.stop_reason !== 'end_turn') throw new Error(`translate: stopped (${res.stop_reason})`);
	const text = res.content.find((b) => b.type === 'text')?.text;
	return JSON.parse(text ?? 'null') as T;
}

/** Translations of German texts into `lang`, from the table: German text → translation. */
export async function lookup(texts: string[], langs: readonly Lang[] = TARGETS) {
	const by = new Map<string, string>(texts.filter((t) => t?.trim()).map((t) => [hash(t), t]));
	const out = new Map<string, Map<string, string>>(langs.map((l) => [l, new Map()]));
	if (!by.size) return out;
	const rows = await sql`select hash, lang, text from translations where hash = any(${[...by.keys()]}) and lang = any(${langs as unknown as string[]})`;
	for (const r of rows) out.get(r.lang)!.set(by.get(r.hash)!, r.text);
	return out;
}

/** Puts a translation in by hand (or from the old English columns). */
export const setManual = (de: string, lang: Lang, text: string) =>
	sql`insert into translations (hash, lang, text, manual) values (${hash(de)}, ${lang}, ${text}, true)
		on conflict (hash, lang) do update set text = excluded.text, manual = true, at = now()`;

/** German lines in English, French and Italian, same order. In its own process: the models need a lot of memory while they work. */
function translateLocally(lines: string[]) {
	return new Promise<Record<(typeof TARGETS)[number], string[]>>((ok, fail) => {
		const child = spawn(process.execPath, ['scripts/translate.mjs']);
		let out = '';
		let err = '';
		child.stdout.on('data', (d) => (out += d));
		child.stderr.on('data', (d) => (err += d));
		const timer = setTimeout(() => child.kill(), 30 * 60_000);
		child.on('close', (code) => {
			clearTimeout(timer);
			try {
				ok(JSON.parse(out.trim().split('\n').at(-1)!));
			} catch {
				fail(new Error(`Übersetzungsprozess endete mit ${code}: ${err.trim().split('\n').slice(-2).join(' ').slice(0, 300)}`));
			}
		});
		child.stdin.end(JSON.stringify({ lines }));
	});
}

let busy: Promise<void> | null = null;

/** Translates German texts that have no translation yet, in all languages. One run at a time. */
export function fill(texts: string[]) {
	const run = async () => {
		const unique = [...new Set(texts.map((t) => t.trim()).filter(Boolean))];
		// texts missing in at least one language; the others keep what they have (on conflict do nothing)
		const have = await sql`select hash, count(*)::int as n from translations where hash = any(${unique.map(hash)}) group by hash`;
		const complete = new Set(have.filter((r) => r.n >= TARGETS.length).map((r) => r.hash));
		const missing = unique.filter((t) => !complete.has(hash(t)));
		if (!missing.length) return;
		const { parts, join } = byLine(missing);
		const kept = parts.map(protect);
		const out = await translateLocally(kept.map((k) => k.text));
		for (const lang of TARGETS) {
			const done = join(out[lang].map((s, i) => kept[i].restore(s)));
			for (const [j, de] of missing.entries()) await sql`insert into translations (hash, lang, text) values (${hash(de)}, ${lang}, ${done[j]}) on conflict do nothing`;
		}
	};
	busy = (busy ?? Promise.resolve()).then(run).catch((e) => import('./monitor.ts').then((m) => m.report(e, 'Übersetzung')));
	return busy;
}

/**
 * A message between guest and Tom in the reader's language. Returns null if it is already in
 * that language (Swiss German counts as German) or no API key is set.
 */
export async function translateMessage(text: string, to: Lang): Promise<string | null> {
	if (!client) return null;
	try {
		const res = await ask<{ language: string; translation: string }>(
			`This is a message between a guest and the host. If it is already in ${NAMES[to]} (for German: Swiss German dialect counts too), set language to "same" and translation to "". Otherwise set language to the language it is written in and translate it to ${NAMES[to]}, keeping greetings, names and line breaks.\n\n<message>\n${text}\n</message>`,
			{ type: 'object', properties: { language: { type: 'string' }, translation: { type: 'string' } }, required: ['language', 'translation'], additionalProperties: false }
		);
		return res.language === 'same' || !res.translation.trim() ? null : res.translation.trim();
	} catch (e) {
		await import('./monitor.ts').then((m) => m.report(e, 'Übersetzung einer Nachricht'));
		return null;
	}
}
