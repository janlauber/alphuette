export type Lang = 'de' | 'en';

const de = {
	locale: 'de-CH',
	nav: { hut: 'Das Hüttli', area: 'Umgebung', request: 'Anfragen', other: 'English', otherLang: 'en' as Lang },
	facts: {
		guests: (n: number) => `1 bis ${n} Personen`,
		altitude: '1200 m ü. M.',
		checkIn: (t: string) => `Anreise ab ${t} Uhr`,
		checkOut: (t: string) => `Abreise bis ${t} Uhr`
	},
	sections: {
		sleeping: 'Schlafen',
		amenities: 'Ausstattung',
		goodToKnow: 'Gut zu wissen',
		location: 'Lage',
		arrival: 'Anreise',
		rules: 'Hausregeln',
		payment: 'Zahlung und Absage',
		hikes: 'Wanderungen in der Nähe',
		host: 'Dein Gastgeber'
	},
	photos: { all: (n: number) => `Alle ${n} Fotos`, close: 'Schliessen', prev: 'Vorheriges Foto', next: 'Nächstes Foto' },
	map: { open: 'Auf der Karte von swisstopo öffnen', note: 'Die genaue Lage erfährst du nach der Bestätigung.' },
	hikes: {
		intro: 'Ausgangspunkte im Tal, mit Gehzeit für die ganze Strecke.',
		more: 'Mehr Ausflüge',
		mountain: 'Bergwanderweg'
	},
	card: {
		from: 'ab',
		perWeek: 'pro Woche',
		perNight: 'pro Nacht',
		checkIn: 'Anreise',
		checkOut: 'Abreise',
		pick: 'Datum wählen',
		adults: 'Erwachsene',
		adultsHint: 'ab 16 Jahren',
		children: 'Kinder',
		childrenHint: '6 bis 15 Jahre',
		infants: 'Kleinkinder',
		infantsHint: 'unter 6 Jahren',
		linen: 'Bettwäsche',
		linenHint: (p: string) => `${p} pro Set`,
		less: 'weniger',
		more: 'mehr',
		submit: 'Weiter zur Anfrage',
		noPay: 'Du zahlst erst, wenn Tom die Anfrage bestätigt hat.',
		total: 'Total',
		clear: 'Daten löschen'
	},
	lines: {
		stay: (n: number) => `${n} ${n === 1 ? 'Nacht' : 'Nächte'}`,
		cleaning: () => 'Endreinigung',
		linen: (n: number) => `Bettwäsche, ${n} ${n === 1 ? 'Set' : 'Sets'}`,
		tax: () => 'Kurtaxe',
		levy: () => 'Beherbergungsabgabe'
	},
	errors: {
		dates: 'Wähle das Anreise- und das Abreisedatum.',
		closed: 'In dieser Zeit ist das Hüttli nicht zu mieten.',
		taken: 'In dieser Zeit ist das Hüttli schon belegt.',
		min: (n: number) => `Du kannst das Hüttli ab ${n} Nächten mieten.`,
		changeover: (day: string) => `Anreise und Abreise sind am ${day}.`,
		guests: (n: number) => `Im Hüttli haben höchstens ${n} Personen Platz, davon mindestens eine erwachsene.`
	},
	calendar: {
		taken: 'Belegt',
		pickIn: 'Wähle den Anreisetag.',
		pickOut: 'Wähle den Abreisetag.',
		prev: 'Vorheriger Monat',
		next: 'Nächster Monat'
	},
	request: {
		title: 'Anfrage senden',
		stay: 'Dein Aufenthalt',
		change: 'Ändern',
		you: 'Deine Angaben',
		name: 'Vor- und Nachname',
		email: 'E-Mail',
		phone: 'Telefon',
		optional: 'freiwillig',
		city: 'PLZ und Wohnort',
		arrival: 'Anreise mit',
		car: 'Auto',
		bus: 'Bus und Bahn',
		note: 'Nachricht an Tom',
		notePlaceholder: 'Wer kommt mit, was habt ihr vor, gibt es Fragen?',
		consent: 'Mit dem Senden akzeptierst du die Hausregeln. So gehen wir mit deinen Daten um:',
		submit: 'Anfrage senden',
		invalid: 'Bitte prüfe die markierten Felder.',
		tooMany: 'Zu viele Anfragen von dieser Adresse. Versuch es in einer Stunde nochmals.'
	},
	booking: {
		title: 'Deine Buchung',
		ref: 'Buchungsnummer',
		status: {
			angefragt: 'Angefragt',
			bestaetigt: 'Bestätigt',
			abgelehnt: 'Abgelehnt',
			storniert: 'Storniert',
			gesperrt: 'Gesperrt'
		} as Record<string, string>,
		statusText: {
			angefragt: 'Tom prüft deine Anfrage und meldet sich per Mail. Die Daten sind so lange für dich reserviert.',
			bestaetigt: 'Das Hüttli ist für dich reserviert.',
			abgelehnt: 'Tom kann deine Anfrage leider nicht annehmen.',
			storniert: 'Diese Buchung ist storniert.'
		} as Record<string, string>,
		guests: 'Gäste',
		messages: 'Nachrichten',
		noMessages: 'Noch keine Nachrichten. Schreib Tom, wenn du eine Frage hast.',
		write: 'Nachricht an Tom',
		send: 'Nachricht senden',
		you: 'Du',
		invoice: 'QR-Rechnung öffnen',
		paid: (d: string) => `Bezahlt am ${d}`,
		open: 'Offen',
		info: 'Infos für deinen Aufenthalt',
		withdraw: 'Anfrage zurückziehen',
		withdrawConfirm: 'Willst du die Anfrage wirklich zurückziehen?',
		saveLink: 'Speichere diesen Link. Damit kommst du jederzeit zurück zu deiner Buchung.'
	},
	footer: {
		contact: 'Kontakt',
		imprint: 'Impressum',
		privacy: 'Datenschutz',
		whatsapp: 'WhatsApp'
	}
};

const en: typeof de = {
	locale: 'en-GB',
	nav: { hut: 'The hut', area: 'Surroundings', request: 'Request', other: 'Deutsch', otherLang: 'de' },
	facts: {
		guests: (n) => `1 to ${n} guests`,
		altitude: '1,200 m above sea level',
		checkIn: (t) => `Check-in from ${t}`,
		checkOut: (t) => `Check-out by ${t}`
	},
	sections: {
		sleeping: 'Sleeping',
		amenities: 'Amenities',
		goodToKnow: 'Good to know',
		location: 'Location',
		arrival: 'Getting there',
		rules: 'House rules',
		payment: 'Payment and cancellation',
		hikes: 'Hikes nearby',
		host: 'Your host'
	},
	photos: { all: (n) => `All ${n} photos`, close: 'Close', prev: 'Previous photo', next: 'Next photo' },
	map: { open: 'Open on the swisstopo map', note: 'You get the exact location after confirmation.' },
	hikes: { intro: 'Starting points in the valley, with walking time for the whole route.', more: 'More ideas', mountain: 'Mountain trail' },
	card: {
		from: 'from',
		perWeek: 'per week',
		perNight: 'per night',
		checkIn: 'Check-in',
		checkOut: 'Check-out',
		pick: 'Add date',
		adults: 'Adults',
		adultsHint: '16 and over',
		children: 'Children',
		childrenHint: 'ages 6 to 15',
		infants: 'Small children',
		infantsHint: 'under 6',
		linen: 'Bed linen',
		linenHint: (p) => `${p} per set`,
		less: 'fewer',
		more: 'more',
		submit: 'Continue to request',
		noPay: 'You only pay once Tom has confirmed your request.',
		total: 'Total',
		clear: 'Clear dates'
	},
	lines: {
		stay: (n) => `${n} ${n === 1 ? 'night' : 'nights'}`,
		cleaning: () => 'Final cleaning',
		linen: (n) => `Bed linen, ${n} ${n === 1 ? 'set' : 'sets'}`,
		tax: () => 'Tourist tax',
		levy: () => 'Cantonal lodging levy'
	},
	errors: {
		dates: 'Choose your check-in and check-out dates.',
		closed: 'The hut is not available for rent at that time.',
		taken: 'The hut is already booked for some of these nights.',
		min: (n) => `The minimum stay is ${n} nights.`,
		changeover: (day) => `Check-in and check-out are on ${day}.`,
		guests: (n) => `The hut sleeps at most ${n} people, including at least one adult.`
	},
	calendar: {
		taken: 'Booked',
		pickIn: 'Choose your check-in day.',
		pickOut: 'Choose your check-out day.',
		prev: 'Previous month',
		next: 'Next month'
	},
	request: {
		title: 'Send request',
		stay: 'Your stay',
		change: 'Change',
		you: 'Your details',
		name: 'First and last name',
		email: 'Email',
		phone: 'Phone',
		optional: 'optional',
		city: 'Postcode and town',
		arrival: 'Arriving by',
		car: 'Car',
		bus: 'Public transport',
		note: 'Message to Tom',
		notePlaceholder: 'Who is coming, what are your plans, any questions?',
		consent: 'By sending you accept the house rules. How we handle your data:',
		submit: 'Send request',
		invalid: 'Please check the marked fields.',
		tooMany: 'Too many requests from this address. Please try again in an hour.'
	},
	booking: {
		title: 'Your booking',
		ref: 'Booking number',
		status: { angefragt: 'Requested', bestaetigt: 'Confirmed', abgelehnt: 'Declined', storniert: 'Cancelled', gesperrt: 'Blocked' },
		statusText: {
			angefragt: 'Tom is reviewing your request and will reply by email. The dates are held for you until then.',
			bestaetigt: 'The hut is reserved for you.',
			abgelehnt: 'Unfortunately Tom cannot accept your request.',
			storniert: 'This booking has been cancelled.'
		},
		guests: 'Guests',
		messages: 'Messages',
		noMessages: 'No messages yet. Write to Tom if you have a question.',
		write: 'Message to Tom',
		send: 'Send message',
		you: 'You',
		invoice: 'Open QR bill',
		paid: (d) => `Paid on ${d}`,
		open: 'Unpaid',
		info: 'Information for your stay',
		withdraw: 'Withdraw request',
		withdrawConfirm: 'Do you really want to withdraw your request?',
		saveLink: 'Keep this link. It takes you back to your booking at any time.'
	},
	footer: { contact: 'Contact', imprint: 'Legal notice', privacy: 'Privacy', whatsapp: 'WhatsApp' }
};

export const dict = { de, en };

/** Path for a language: '/' stays German, English gets the /en prefix. */
export const localize = (lang: Lang, path: string) => (lang === 'en' ? '/en' + (path === '/' ? '' : path) : path);

export const fmtDate = (iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions = {}) =>
	new Date(iso + 'T00:00:00Z').toLocaleDateString(dict[lang].locale, {
		timeZone: 'UTC',
		weekday: 'short',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		...opts
	});

export const weekdayName = (day: number, lang: Lang) =>
	new Date(Date.UTC(2024, 0, 7 + day)).toLocaleDateString(dict[lang].locale, { timeZone: 'UTC', weekday: 'long' });
