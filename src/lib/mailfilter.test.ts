import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spamCheck } from './mailfilter.ts';

test('cold mails and scams count as spam', () => {
	const spam = [
		{ subject: 'Is alphuette-kiental.ch showing up in Google yet?', text: 'Hi,\nRegister alphuette-kiental.ch in Search Engines to start appearing in search results!\nVisit: https://indexregister.pro/?src=vps\nReply with "unsubscribe" if you are not the owner of the domain.' },
		{ subject: 'Mobile app development | www.alphuette-kiental.ch', text: 'Hi, we build apps that help your business grow.' },
		{ subject: "Let's Connect", text: 'Hi, I came across your website and would love to talk.' },
		{ subject: 'I am ill and would die', text: 'Dear friend, I have funds for a charity and need a beneficiary.' }
	];
	for (const m of spam) assert.equal(spamCheck(m).spam, true, m.subject);
	assert.deepEqual(spamCheck(spam[0]).reasons, ['Abmelde-Hinweis wie in Werbemails', 'Werbung für Suchmaschinen', 'Angebot zur Domain']);
});

test('guests asking about the hut get through', () => {
	const ham = [
		{ subject: 'Anfrage August', text: 'Hoi Tom, ist das Hüttli vom 8. bis 15. August frei? Wir wären zwei Erwachsene und zwei Kinder. Liebe Grüsse, Anna' },
		{ subject: 'Réservation', text: 'Bonjour, nous aimerions réserver votre chalet en juillet. Est-ce possible avec un chien ?' },
		{ subject: 'Question', text: 'Hi, we would love to visit your hut in September. Is the calendar on your website up to date?' },
		{ subject: 'Re: Deine Buchung', text: 'Danke! Wir freuen uns. Gibt es Holz für den Herd? https://alphuette-kiental.ch/buchung/abc' }
	];
	for (const m of ham) assert.equal(spamCheck(m).spam, false, m.subject);
});
