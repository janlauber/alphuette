// Big mail providers: old domains, no need to ask.
const PROVIDERS = new Set(['gmail.com', 'googlemail.com', 'bluewin.ch', 'gmx.ch', 'gmx.net', 'gmx.de', 'web.de', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com', 'me.com', 'yahoo.com', 'proton.me', 'protonmail.com', 'sunrise.ch', 'hispeed.ch', 'bluemail.ch', 't-online.de']);
const ages = new Map<string, { at: number; days: number | null }>();

/**
 * Days since the sender's domain was registered, from RDAP (public, no key; only the domain leaves the server).
 * null when unknown: .ch domains publish no date, and a lookup that fails counts for nothing.
 */
export async function domainAge(address: string): Promise<number | null> {
	const domain = address.split('@')[1]?.toLowerCase() ?? '';
	if (!domain || PROVIDERS.has(domain)) return null;
	const hit = ages.get(domain);
	if (hit && Date.now() - hit.at < 86_400_000) return hit.days;
	let days: number | null = null;
	// a subdomain (mail.example.com) has no record of its own: try shorter names down to two labels
	for (let d = domain; d.split('.').length >= 2; d = d.slice(d.indexOf('.') + 1)) {
		// rdap.org answers Node's default user agent with 403
		const res = await fetch(`https://rdap.org/domain/${d}`, { headers: { accept: 'application/rdap+json', 'user-agent': 'alphuette-kiental.ch (spam check)' }, signal: AbortSignal.timeout(4000) }).catch(() => null);
		if (res?.ok) {
			const events = ((await res.json().catch(() => ({}))).events ?? []) as { eventAction?: string; eventDate?: string }[];
			const registered = Date.parse(events.find((e) => e.eventAction === 'registration')?.eventDate ?? '');
			if (Number.isFinite(registered)) days = Math.floor((Date.now() - registered) / 86_400_000);
			break;
		}
		if (res?.status !== 404) break;
	}
	ages.set(domain, { at: Date.now(), days });
	return days;
}
