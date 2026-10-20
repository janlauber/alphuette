// Next buses via transport.opendata.ch (timetable data: opentransportdata.swiss), fetched on
// the server and cached for a minute, so guests' browsers never talk to a third party.
// Line 220 only stops at Abzw. Spiggengrund in summer; otherwise it ends at Kiental, Ramslauenen.
export type Departure = { time: string; arrival: string; line: string; delay: number };

const REICHENBACH = '8507480';
const SPIGGENGRUND = '8571336';
const RAMSLAUENEN = '8582987';

const cache = new Map<string, { at: number; list: Departure[] }>();
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('de-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' });

async function connections(from: string, to: string): Promise<Departure[]> {
	const key = `${from}-${to}`;
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < 60_000) return hit.list;
	const res = await fetch(`https://transport.opendata.ch/v1/connections?from=${from}&to=${to}&limit=3`, { signal: AbortSignal.timeout(4000) });
	if (!res.ok) throw new Error(`transport ${res.status}`);
	const list: Departure[] = ((await res.json()).connections ?? []).map((c: any) => {
		const journey = c.sections?.find((s: any) => s.journey)?.journey;
		return {
			time: hhmm(c.from.departure),
			arrival: hhmm(c.to.arrival),
			line: journey ? `${journey.category ?? ''} ${journey.number ?? ''}`.trim() : '',
			delay: Number(c.from.delay) || 0
		};
	});
	cache.set(key, { at: Date.now(), list });
	return list;
}

/** Next buses towards the hut or back; `winter` when only Ramslauenen is served. */
export async function departures(route: 'toHut' | 'fromHut') {
	const summer = route === 'toHut' ? await connections(REICHENBACH, SPIGGENGRUND) : await connections(SPIGGENGRUND, REICHENBACH);
	if (summer.length) return { list: summer, winter: false };
	const list = route === 'toHut' ? await connections(REICHENBACH, RAMSLAUENEN) : await connections(RAMSLAUENEN, REICHENBACH);
	return { list, winter: true };
}
