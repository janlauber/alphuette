// Rules for mail from unknown senders to the hut's address. Each rule that matches adds its weight;
// from 3 on the mail counts as spam and is kept in the admin instead of forwarded.
// ponytail: a keyword list, no learning; Tom blocks or allows single senders in the admin
const RULES: [weight: number, reason: string, pattern: RegExp][] = [
	[3, 'Abmelde-Hinweis wie in Werbemails', /\b(unsubscribe|opt[- ]?out|reply (with )?["'«]?stop|abmelden|austragen)\b/i],
	[3, 'Werbung für Suchmaschinen', /\b(seo|search engines?|suchmaschine\w*|google ranking|first page of google|backlinks?|guest posts?|domain authority)\b/i],
	[3, 'Angebot zur Domain', /\b(domain (registration|renewal|expir\w*)|register (your )?domain|indexregister)\b/i],
	[3, 'Betrugsmasche', /\b(i am (ill|sick|dying)|would die|inheritance|beneficiary|next of kin|lottery|you have won|bitcoin|crypto\w*|investment opportunity|loan offer|barrister|million (dollars|usd|euros?))\b/i],
	[2, 'Angebot für Website oder App', /\b(web ?design|website (design|redesign|development)|mobile apps?|app development|wordpress|shopify)\b/i],
	[2, 'Marketing-Angebot', /\b(social media (marketing|management|growth)|lead generation|marketing (agency|services)|followers|influencer|sponsored (post|article)|partnership opportunity|let'?s connect|quick question)\b/i],
	[2, 'Website-Adresse im Betreff', /\bwww\.|\|\s*\S+\.(ch|com)\b/i],
	[1, 'Spricht von «your website»', /\byour (website|business|company|brand)\b/i]
];

/** domainAge: days since the sender's domain was registered, if known. Spam domains are mostly days or weeks old. */
export function spamCheck(mail: { subject: string; text: string; domainAge?: number | null }) {
	const subject = mail.subject ?? '';
	const all = `${subject}\n${mail.text ?? ''}`;
	const reasons: string[] = [];
	let score = 0;
	for (const [weight, reason, pattern] of RULES) {
		if (pattern.test(reason === 'Website-Adresse im Betreff' ? subject : all)) (score += weight), reasons.push(reason);
	}
	if ((all.match(/https?:\/\//g) ?? []).length >= 3) (score += 1), reasons.push('Viele Links');
	const age = mail.domainAge;
	if (age != null && age < 90) (score += age < 30 ? 3 : 2), reasons.push(`Domain erst vor ${age} Tagen registriert`);
	return { spam: score >= 3, reasons };
}
