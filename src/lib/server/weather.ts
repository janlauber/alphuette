// Local forecast for PLZ 3723 Kiental from MeteoSwiss open data (CC BY 4.0, "Quelle: MeteoSchweiz").
// Fetched on the server, cached two hours: browsers never talk to MeteoSwiss.
// The point sits at 960 m; the hut is about 210 m higher, so roughly 1.4 °C colder.

import { lookup } from './translate.ts';

// MeteoSwiss day symbols 1 to 42 (night symbols are code + 100), texts from MeteoSwiss/opendata-localforecast-demos.
const SYMBOLS: Record<number, [string, string, string]> = {
	1: ['sun', "sonnig", "sunny"],
	2: ['partly', "ziemlich sonnig", "mostly sunny, some clouds"],
	3: ['partly', "teilweise sonnig", "partly sunny, thick passing clouds"],
	4: ['partly', "wechselnd bewölkt", "overcast"],
	5: ['cloud', "bedeckt", "very cloudy"],
	6: ['rain', "Aufhellungen, einzelne Regenschauer", "sunny intervals, isolated showers"],
	7: ['rain', "Aufhellungen, einzelne Regen- oder Schneeschauer", "sunny intervals, isolated sleet"],
	8: ['snow', "Aufhellungen, einzelne Schneeschauer", "sunny intervals, snow showers"],
	9: ['rain', "bewölkt, einige Regenschauer", "overcast, some rain showers"],
	10: ['rain', "bewölkt, einige Regen- oder Schneeschauer", "overcast, some sleet"],
	11: ['snow', "bewölkt, einige Schneeschauer", "overcast, some snow showers"],
	12: ['storm', "Aufhellungen, leicht gewitterhaft", "sunny intervals, chance of thunderstorms"],
	13: ['storm', "Aufhellungen und gewitterhaft", "sunny intervals, possible thunderstorms"],
	14: ['rain', "stark bewölkt, schwacher Regen", "very cloudy, light rain"],
	15: ['rain', "stark bewölkt, schwacher Schnee oder Regen", "very cloudy, light sleet"],
	16: ['snow', "stark bewölkt, schwacher Schnee", "very cloudy, light snow showers"],
	17: ['rain', "stark bewölkt, zeitweise Regen", "very cloudy, intermittent rain"],
	18: ['rain', "stark bewölkt, zeitweise Schnee oder Regen", "very cloudy, intermittent sleet"],
	19: ['snow', "stark bewölkt, zeitweise Schnee", "very cloudy, intermittent snow"],
	20: ['rain', "stark bewölkt, anhaltender Regen", "very overcast with rain"],
	21: ['rain', "stark bewölkt, anhaltender Regen oder Schnee", "very overcast with frequent sleet"],
	22: ['snow', "stark bewölkt, anhaltender Schnee", "very overcast with heavy snow"],
	23: ['storm', "stark bewölkt, leicht gewitterhaft", "very overcast, slight chance of storms"],
	24: ['storm', "stark bewölkt, gewitterhaft", "very overcast with storms"],
	25: ['storm', "stark bewölkt, stark gewitterhaft", "very cloudy, very stormy"],
	26: ['partly', "Hohe Bewölkung", "high clouds"],
	27: ['fog', "Hochnebel", "stratus"],
	28: ['fog', "Nebel", "fog"],
	29: ['rain', "leicht bewölkt, einzelne Regenschauer", "sunny intervals, scattered showers"],
	30: ['snow', "leicht bewölkt, leichter Schneefall", "sunny intervals, scattered snow showers"],
	31: ['rain', "teilweise sonnig, einige Schnee- oder Regenschauer", "sunny intervals, scattered sleet"],
	32: ['rain', "teilweise sonnig, einige Regenschauer", "sunny intervals, some showers"],
	33: ['rain', "bewölkt, häufige Regenschauer", "short sunny intervals, frequent rain"],
	34: ['snow', "bewölkt, häufige Schneeschauer", "short sunny intervals, frequent snowfalls"],
	35: ['cloud', "bedeckt und trocken", "overcast and dry"],
	36: ['storm', "teilweise sonnig, gewitterhaft", "partly sunny, slightly stormy"],
	37: ['storm', "teilweise sonnig, Gewitter und Schneeschauer", "partly sunny, stormy snow showers"],
	38: ['storm', "bewölkt, Gewitter und häufige Regenschauer", "overcast, thundery showers"],
	39: ['storm', "bewölkt, Gewitter und häufige Schneeschauer", "overcast, thundery snow showers"],
	40: ['storm', "stark bewölkt, leicht gewitterhaft", "very cloudly, slightly stormy"],
	41: ['storm', "bewölkt, leicht gewitterhaft", "overcast, slightly stormy"],
	42: ['storm', "stark bewölkt, Gewitter und häufige Schneeschauer", "very cloudly, thundery snow showers"]
};

export type Day = { date: string; tmin: number; tmax: number; precip: number; kind: string; de: string; en: string; fr: string; it: string };

/** German symbol texts, so the translation job covers French and Italian. */
export const weatherTexts = () => Object.values(SYMBOLS).map(([, de]) => de);

const ITEMS = 'https://data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-local-forecasting/items';
const BASE = 'https://data.geo.admin.ch/ch.meteoschweiz.ogd-local-forecasting';
const POINT = '372300;2;'; // point_id 372300, point_type_id 2 (postal code 3723)
const PARAMS = ['tre200px', 'tre200pn', 'rka150p0', 'jp2000d0'] as const;

let cache: { at: number; days: Day[] } | null = null;

async function latestRun() {
	for (const back of [0, 1]) {
		// today's item is empty just after midnight UTC
		const day = new Date(Date.now() - back * 864e5).toISOString().slice(0, 10).replaceAll('-', '');
		const res = await fetch(`${ITEMS}/${day}-ch`, { signal: AbortSignal.timeout(5000) });
		if (!res.ok) continue;
		const assets: Record<string, unknown> = (await res.json()).assets ?? {};
		const runs = [...new Set(Object.keys(assets).map((k) => k.split('.')[2]))].sort().reverse();
		const run = runs.find((r) => PARAMS.every((p) => assets[`vnut12.lssw.${r}.${p}.csv`]));
		if (run) return { day, run };
	}
	throw new Error('no complete MeteoSwiss run');
}

async function series(day: string, run: string, param: string) {
	const res = await fetch(`${BASE}/${day}-ch/vnut12.lssw.${run}.${param}.csv`, { signal: AbortSignal.timeout(15_000) });
	if (!res.ok) throw new Error(`${param}: ${res.status}`);
	const map = new Map<string, number>();
	for (const line of (await res.text()).split('\n')) {
		if (!line.startsWith(POINT)) continue;
		const [, , date, value] = line.split(';');
		map.set(date.slice(0, 8), Number(value));
	}
	return map;
}

export async function forecast(): Promise<Day[]> {
	if (cache && Date.now() - cache.at < 2 * 3600_000) return cache.days;
	const { day, run } = await latestRun();
	const [tmax, tmin, rain, symbol] = await Promise.all(PARAMS.map((p) => series(day, run, p)));
	const tr = await lookup(Object.values(SYMBOLS).map(([, de]) => de), ['fr', 'it']);
	const days = [...tmax.keys()].sort().slice(0, 7).map((d) => {
		const [kind, de, en] = SYMBOLS[(symbol.get(d) ?? 4) % 100] ?? SYMBOLS[4];
		const fr = tr.get('fr')?.get(de) ?? en, it = tr.get('it')?.get(de) ?? en;
		return { date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, tmax: tmax.get(d)!, tmin: tmin.get(d) ?? NaN, precip: rain.get(d) ?? 0, kind, de, en, fr, it };
	});
	cache = { at: Date.now(), days };
	return days;
}
