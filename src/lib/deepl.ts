// DeepL gets the site texts line by line, so blank lines, list markers ("- ") and the FAQ layout stay
// exactly as Tom wrote them. Lines without a letter (times, amounts) are not sent at all.
const LETTER = /\p{L}/u;

/** The lines to translate, and join() to put the translations back into the texts. */
export function byLine(texts: string[]) {
	const lines = texts.map((t) => t.split('\n').map((l) => /^(\s*(?:[-•]\s+)?)(.*?)(\s*)$/.exec(l)!));
	const parts = lines.flat().filter((m) => LETTER.test(m[2])).map((m) => m[2]);
	return {
		parts,
		join(translated: string[]) {
			let i = 0;
			return lines.map((ls) => ls.map((m) => (LETTER.test(m[2]) ? m[1] + translated[i++] + m[3] : m[0])).join('\n'));
		}
	};
}

/** Placeholders like {vorname} go into a tag DeepL leaves alone (tag_handling xml, ignore_tags x). */
export const protect = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\{(\w+)\}/g, '<x>{$1}</x>');
export const unprotect = (s: string) =>
	s.replace(/<x>(\{\w+\})<\/x>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
