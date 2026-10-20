// iCalendar files (RFC 5545): the stay for the guest's calendar, all bookings as a feed for Tom's phone.
export type CalEvent = { uid: string; start: Date; end: Date; title: string; location?: string; description?: string; url?: string; alarm?: boolean };

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const text = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Lines longer than 75 bytes continue on the next line, which starts with a space. */
export function fold(line: string) {
	const out: string[] = [];
	let cur = '';
	for (const ch of line) {
		const limit = out.length ? 74 : 75;
		if (Buffer.byteLength(cur + ch) > limit) {
			out.push(cur);
			cur = '';
		}
		cur += ch;
	}
	out.push(cur);
	return out.join('\r\n ');
}

/** A local time in Switzerland as a UTC instant, so the file needs no time zone block. */
export function zurich(day: string, time: string) {
	const guess = Date.parse(`${day}T${time}:00Z`);
	const p = Object.fromEntries(
		new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
			.formatToParts(guess)
			.map((x) => [x.type, x.value])
	);
	const shown = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);
	return new Date(guess - (shown - guess));
}

export function calendar(name: string, events: CalEvent[]) {
	const now = stamp(new Date());
	const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//alphuette-kiental.ch//Buchungen//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${text(name)}`];
	for (const e of events) {
		lines.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${now}`, `DTSTART:${stamp(e.start)}`, `DTEND:${stamp(e.end)}`, `SUMMARY:${text(e.title)}`);
		if (e.location) lines.push(`LOCATION:${text(e.location)}`);
		if (e.description) lines.push(`DESCRIPTION:${text(e.description)}`);
		if (e.url) lines.push(`URL:${e.url}`);
		if (e.alarm) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${text(e.title)}`, 'TRIGGER:-P1D', 'END:VALARM');
		lines.push('END:VEVENT');
	}
	lines.push('END:VCALENDAR');
	return lines.map(fold).join('\r\n') + '\r\n';
}
