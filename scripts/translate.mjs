// Translates German lines into English, French and Italian with small Opus-MT models on this machine,
// no account or key. Runs as its own process because the models need several hundred MB while they
// work: reads {"lines": [...]} on stdin, writes {"en": [...], "fr": [...], "it": [...]} as one line on stdout.
// node scripts/translate.mjs --download only fetches the models into ./models (Docker build).
import { pipeline, env } from '@huggingface/transformers';
import { resolve } from 'node:path';

env.cacheDir = resolve('models');
const MODELS = { en: 'Xenova/opus-mt-de-en', fr: 'Xenova/opus-mt-de-fr', enIt: 'Xenova/opus-mt-en-it' };
const load = (model) => pipeline('translation', model, { dtype: 'q8' });

if (process.argv.includes('--download')) {
	for (const model of Object.values(MODELS)) await (await load(model)).dispose();
	process.exit(0);
}

let input = '';
for await (const chunk of process.stdin) input += chunk;
const { lines } = JSON.parse(input);

// one line at a time: in a batch the French model pads its output with dots
async function run(model, src) {
	const translate = await load(model);
	const out = [];
	for (const line of src) out.push((await translate(line))[0].translation_text);
	await translate.dispose();
	return out;
}

const en = await run(MODELS.en, lines);
const fr = await run(MODELS.fr, lines);
// Italian goes through English: there is no German-Italian model in this format
const it = await run(MODELS.enIt, en);
process.stdout.write(JSON.stringify({ en, fr, it }) + '\n');
