import { sql } from './db.ts';
import type { Rates, Season } from '#lib/booking.ts';

const de = {
	tagline: 'Einfaches Alphüttli auf 1200 m im Kiental, für 1 bis 6 Personen.',
	intro: `Das Hüttli steht in Lengschwendi, am Sonnenhang über der Strasse ins hintere Kiental. Wie der Name sagt, schaust du von hier auf die Blüemlisalp.

Drinnen gibt es eine Küche mit Holzherd, ein Zimmer, eine Galerie und ein Stübli. Strom kommt von der Solaranlage, das Wasser aus der eigenen Quelle. Wer es einfach mag, findet hier Ruhe und Wanderwege direkt vor der Tür.`,
	sleeping: `- Galerie: Matratzen 1 × 90 cm, 1 × 140 cm und 2 × 120 cm
- Stübli: ein Bett 140 × 200 cm
- Bettwäsche kannst du mieten oder selber mitbringen. Ein Schlafsack geht auch.`,
	good_to_know: `- Das WC ist ein Plumpsklo unter dem Balkon, WC-Papier ist da.
- Einen Kühlschrank gibt es nicht, dafür die 12-V-Kühlbox.
- Der Solarstrom reicht für Licht und zum Laden von Handy und Kamera.
- Auf die Galerie führt eine steile Holzleiter.
- Wie warm das Wasser wird, hängt vom Wetter ab. Bei Sonne bis 65 °C.`,
	arrival: `Mit dem Postauto: Linie 220 ab Bahnhof Reichenbach im Kandertal Richtung Griesalp bis «Kiental, Abzw. Spiggengrund», etwa 22 Minuten. Nach Kiental Dorf fährt der Bus nur von Ende Mai bis Mitte Oktober weiter, ungefähr alle zwei Stunden. Für den Freitagskurs um 17.27 Uhr ab Reichenbach musst du bis 16 Uhr am Vortag reservieren (0848 818 818).

Mit dem Auto: über Reichenbach ins Kiental und weiter Richtung Griesalp. Die Strasse kostet keine Maut mehr. Wo du parkierst, steht in den Infos nach der Bestätigung.

Gästekarte: Mit der Gästekarte fährst du gratis Bus und Bahn in der Region, zum Beispiel Reichenbach bis Kiental und die Sesselbahn auf die Ramslauenen. Die Strecke Kiental bis Griesalp ist nicht inbegriffen.`,
	rules: `- Im Hüttli schlafen höchstens 6 Personen.
- Bitte lass das Hüttli so zurück, wie du es angetroffen hast. Die Endreinigung ist im Preis inbegriffen.`,
	payment: `Nach der Bestätigung bekommst du eine QR-Rechnung über den ganzen Betrag. Zahlbar innert 30 Tagen, spätestens 14 Tage vor der Anreise.

Sagst du bis 60 Tage vor der Anreise ab, kostet es nichts. Bis 30 Tage vorher zahlst du die Hälfte, danach den ganzen Betrag.`,
	area: `Einkaufen: Der Dorfladen Aellig in Kiental hat Brot, Lebensmittel und eine Postagentur, etwa 2 km vom Hüttli. Er liefert am Dienstag, Donnerstag und Samstag für CHF 5. Den nächsten Coop gibt es in Reichenbach. https://www.aellig-kiental.ch

Essen gehen: Hotel-Restaurant Alpenruh (gut 1 km, Ruhetage Dienstag und Mittwoch), Hotel Bären in Kiental, Berghaus Ramslauenen, Berggasthaus Golderli, Naturfreundehaus Gorneren und die Hotels auf der Griesalp.

Gästekarte: Damit fährst du gratis mit dem Bus von Reichenbach nach Kiental, mit der Sesselbahn auf die Ramslauenen, mit dem Zug von Mülenen nach Kandersteg und mit den Bussen nach Adelboden. Niesenbahn, Blausee und Oeschinensee kosten weniger. https://adelboden-lenk-kandersteg.ch/buchen/angebote/gaestekarte`,
	faq: `Gibt es Strom im Hüttli?
Ja, Solarstrom für Licht und zum Laden von Handy und Kamera. USB-Kabel sind da.

Kann ich auch nur ein paar Nächte bleiben?
Das Hüttli vermieten wir wochenweise, von Samstag bis Samstag.

Wie komme ich ohne Auto hin?
Mit dem Postauto 220 ab Reichenbach im Kandertal bis «Kiental, Abzw. Spiggengrund», etwa 22 Minuten.

Ist die Kurtaxe im Preis inbegriffen?
Nein, wir weisen sie separat aus: CHF 3 pro Nacht ab 16 Jahren, Kinder von 6 bis 15 die Hälfte, dazu CHF 1 kantonale Beherbergungsabgabe. Dafür bekommst du die Gästekarte mit Gratis-ÖV in der Region.

Gibt es Bettwäsche?
Du kannst sie für CHF 5 pro Set mieten oder selber mitbringen.`,
	packing: `- Schlafsack oder eigene Bettwäsche
- Stirnlampe oder Taschenlampe
- Feste Schuhe für den Weg zum Hüttli
- Lebensmittel für die ersten Tage
- Powerbank
- Regenjacke`,
	guest_info: ''
};

const en: typeof de = {
	tagline: 'A simple alpine hut at 1,200 m in the Kiental valley, for 1 to 6 people.',
	intro: `The hut sits in Lengschwendi, on the sunny slope above the road into the upper Kiental. As the name says, it looks out on the Blüemlisalp.

Inside there is a kitchen with a wood stove, a bedroom, a sleeping loft and a small parlour. Power comes from solar panels, water from the hut's own spring. If you like things simple, you will find quiet here and hiking trails right outside the door.`,
	sleeping: `- Loft: mattresses 1 × 90 cm, 1 × 140 cm and 2 × 120 cm
- Parlour: one bed 140 × 200 cm
- You can rent bed linen or bring your own. A sleeping bag works too.`,
	good_to_know: `- The toilet is a compost toilet under the balcony, toilet paper is provided.
- There is no fridge, only the 12 V cool box.
- The solar power covers lights and charging phones and cameras.
- A steep wooden ladder leads up to the loft.
- How hot the water gets depends on the weather. Up to 65 °C on sunny days.`,
	arrival: `By bus: PostBus line 220 from Reichenbach im Kandertal station towards Griesalp, get off at "Kiental, Abzw. Spiggengrund", about 22 minutes. Beyond Kiental village the bus only runs from late May to mid-October, roughly every two hours. The Friday 17:27 bus from Reichenbach must be booked by 16:00 the day before (+41 848 818 818).

By car: via Reichenbach into the Kiental and on towards Griesalp. The road no longer has a toll. Where to park is in the guest information after confirmation.

Guest card: with the guest card you ride buses and trains in the region for free, for example Reichenbach to Kiental and the chairlift to Ramslauenen. The stretch from Kiental to Griesalp is not included.`,
	rules: `- The hut sleeps at most 6 people.
- Please leave the hut the way you found it. Final cleaning is included in the price.`,
	payment: `After confirmation you receive a Swiss QR bill for the full amount. Payable within 30 days, at the latest 14 days before arrival.

If you cancel up to 60 days before arrival, it costs nothing. Up to 30 days before, you pay half, after that the full amount.`,
	area: `Shopping: the Aellig village shop in Kiental sells bread and groceries and has a post office counter, about 2 km from the hut. It delivers on Tuesday, Thursday and Saturday for CHF 5. The nearest Coop supermarket is in Reichenbach. https://www.aellig-kiental.ch

Eating out: Hotel-Restaurant Alpenruh (just over 1 km, closed Tuesday and Wednesday), Hotel Bären in Kiental, Berghaus Ramslauenen, Berggasthaus Golderli, Naturfreundehaus Gorneren and the hotels at Griesalp.

Guest card: it gives you free rides on the bus from Reichenbach to Kiental, the chairlift to Ramslauenen, the train from Mülenen to Kandersteg and the buses to Adelboden. Niesen railway, Blausee and Oeschinensee are cheaper. https://adelboden-lenk-kandersteg.ch/en/booking/guest-card`,
	faq: `Is there electricity in the hut?
Yes, solar power for lights and charging phones and cameras. USB cables are provided.

Can I stay just a few nights?
The hut is rented by the week, Saturday to Saturday.

How do I get there without a car?
PostBus 220 from Reichenbach im Kandertal to "Kiental, Abzw. Spiggengrund", about 22 minutes.

Is the tourist tax included?
No, it is shown separately: CHF 3 per night from age 16, children 6 to 15 pay half, plus the cantonal lodging levy of CHF 1. In return you get the guest card with free public transport in the region.

Is bed linen available?
You can rent it for CHF 5 per set or bring your own.`,
	packing: `- Sleeping bag or your own bed linen
- Head torch or flashlight
- Sturdy shoes for the path to the hut
- Food for the first days
- Power bank
- Rain jacket`,
	guest_info: ''
};

export type Content = typeof de;
export type Amenity = { icon: string; de: string; en: string };

export const DEFAULTS = {
	name: 'Alphütte Blüemlisalpblick',
	rates: {
		cleaning: 0,
		linen: 500,
		taxAdult: 300,
		taxChild: 150,
		levyAdult: 100,
		maxGuests: 6,
		checkIn: '14:00',
		checkOut: '11:00'
	} as Rates & { checkIn: string; checkOut: string },
	host: {
		name: 'Tom Lauber',
		street: '',
		zip: '3713',
		city: 'Reichenbach im Kandertal',
		email: 'alt@example.ch',
		whatsapp: '',
		iban: '',
		lat: 46.5691,
		lon: 7.7283
	},
	content: { de, en },
	amenities: [
		{ icon: 'flame', de: 'Holzkochherd', en: 'Wood-fired stove' },
		{ icon: 'cooking-pot', de: 'Gasrechaud und Gasgrill', en: 'Gas burner and grill' },
		{ icon: 'flame-kindling', de: 'Gartencheminée', en: 'Outdoor fireplace' },
		{ icon: 'droplets', de: 'Quellwasser, trinkbar', en: 'Spring water, drinkable' },
		{ icon: 'thermometer', de: 'Warmwasser vom Solarboiler', en: 'Solar hot water' },
		{ icon: 'sun', de: 'Solarstrom für Licht', en: 'Solar power for lights' },
		{ icon: 'cable', de: 'Laden per USB', en: 'USB charging' },
		{ icon: 'snowflake', de: '12-V-Kühlbox', en: '12 V cool box' },
		{ icon: 'utensils', de: 'Geschirr und Kochutensilien', en: 'Crockery and cookware' },
		{ icon: 'shirt', de: 'Frottiertücher', en: 'Towels' },
		{ icon: 'toilet', de: 'Plumpsklo draussen', en: 'Outdoor compost toilet' }
	] as Amenity[]
};

export type Settings = typeof DEFAULTS;

/** Settings from the database on top of the defaults above. */
export async function getSettings(): Promise<Settings> {
	const rows = await sql`select key, value from settings`;
	const db = Object.fromEntries(rows.map((r) => [r.key, r.value]));
	return {
		name: db.name ?? DEFAULTS.name,
		rates: { ...DEFAULTS.rates, ...db.rates },
		host: { ...DEFAULTS.host, ...db.host },
		content: {
			de: { ...DEFAULTS.content.de, ...db.content?.de },
			en: { ...DEFAULTS.content.en, ...db.content?.en }
		},
		amenities: db.amenities ?? DEFAULTS.amenities
	};
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
	await sql`insert into settings (key, value) values (${key}, ${sql.json(value as never)})
		on conflict (key) do update set value = excluded.value`;
}

export async function getSeasons(): Promise<(Season & { id: number })[]> {
	return sql`
		select id, name, start_date as start, end_date as end, nightly_rp as nightly, weekly_rp as weekly,
			min_nights, changeover
		from seasons where end_date >= current_date order by start_date`;
}

/** FAQ text ("Question?" line, answer below, blank line between) to pairs. */
export const parseFaq = (text: string) =>
	text
		.split(/\n\s*\n/)
		.map((b) => b.trim().split('\n'))
		.filter((lines) => lines.length > 1)
		.map(([q, ...a]) => ({ q: q.trim(), a: a.join('\n').trim() }));
