const esc = (s: string) =>
	s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Escaped text has no quotes or angle brackets left, so URLs can be wrapped safely.
const linkify = (s: string) =>
	s.replace(/https?:\/\/[^\s<]+[^\s<.,;:)]/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</a>`);

/** Plain text from the admin to safe HTML: blank lines make paragraphs, lines starting with "- " make a list. */
export function textToHtml(text: string) {
	return text
		.trim()
		.split(/\n\s*\n/)
		.map((block) => {
			const lines = block.split('\n').filter((l) => l.trim());
			if (lines.every((l) => /^\s*[-•]\s+/.test(l)))
				return `<ul>${lines.map((l) => `<li>${linkify(esc(l.replace(/^\s*[-•]\s+/, '')))}</li>`).join('')}</ul>`;
			return `<p>${lines.map((l) => linkify(esc(l))).join('<br>')}</p>`;
		})
		.join('');
}
