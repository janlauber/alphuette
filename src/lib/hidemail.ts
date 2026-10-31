// The hut's address never appears as a plain address in the page source, so harvesting bots miss it:
// the page data carries it reversed and base64-encoded, and MailLink.svelte turns it back into a link.
export const hide = (address: string) => btoa([...address].reverse().join(''));

export function reveal(hidden: string) {
	try {
		return [...atob(hidden)].reverse().join('');
	} catch {
		return '';
	}
}
