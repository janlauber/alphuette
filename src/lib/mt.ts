// The site texts go to the translation model line by line, so blank lines, list markers ("- ") and the
// FAQ layout stay exactly as Tom wrote them. Lines without a letter (times, amounts) are not sent at all.
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

// Names the model would translate or mangle ("Kiental" became "Ki Valley"). Longest first, so
// "Blüemlisalpblick" wins over "Blüemlisalp".
// ponytail: a fixed list; add a name here when a translation garbles it
const NAMES = ['Blüemlisalpblick', 'Blüemlisalp', 'Lengschwendi', 'Kiental', 'Griesalp', 'Reichenbach', 'Ramslauenen', 'Tschingel', 'Gorneren', 'Pochtenalp', 'Frutigen', 'Kandersteg', 'Adelboden', 'Mülenen', 'Oeschinensee', 'Blausee', 'Hohtürli', 'Sefinenfurgge', 'Gamchi', 'Niesen', 'Spiez', 'Alphütte'];
const KEEP = new RegExp(`\\{\\w+\\}|(?<!\\p{L})(?:${NAMES.join('|')})(?!\\p{L})`, 'gu');

/** Placeholders like {vorname} and place names become X1, X2 …, which the model copies unchanged. */
export function protect(line: string) {
	const kept: string[] = [];
	return { text: line.replace(KEEP, (m) => `X${kept.push(m)}`), restore: (s: string) => s.replace(/X(\d+)/g, (m, n) => kept[n - 1] ?? m) };
}
