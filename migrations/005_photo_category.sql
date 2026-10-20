-- Photo groups for the gallery filter: draussen, drinnen, winter. Existing photos are matched by their description.
alter table photos add column category text not null default '';
update photos set category = 'draussen' where alt_de in (
	'Holzhütte am Wiesenhang neben grossem Laubbaum, dahinter bewaldete Berge mit Felsgipfeln',
	'Hütte mit Solarpanel auf dem Dach, Holzzaun und Kiesplatz, vorne ein Brunnentrog',
	'Hütte im Sommer mit eingezäunter Terrasse und Gartencheminée, Kiesweg zum Eingang',
	'Hütte von der Seite mit Holzstapel und grossem Laubbaum, dahinter Tal und Wolken',
	'Blick von der Hütte über Weide und Tannen zu verschneiten Gipfeln',
	'Spitzer verschneiter Gipfel, kahler Baum und Weide mit Brunnentrog und Weg',
	'Gepflasterte Terrasse mit Sonnenschirm, Tisch, Stuhl, Sichtschutz und Gartencheminée',
	'Tasse auf rundem Gartentisch, dahinter Holzzaun und verschneite Berge im Gegenlicht',
	'Gedeckte Holzlaube mit Sitzbank, Blick auf einen bewaldeten Hang',
	'Hütte auf offener Weide von oben, dahinter Felsberge und bewaldete Hänge'
);
update photos set category = 'drinnen' where alt_de in (
	'Stube mit Holztäfer, Esstisch mit Stühlen, Sitzbank und rot-weiss karierten Vorhängen',
	'Eingangsraum mit Holzleiter zur Schlafgalerie, weisser Kommode und Plattenboden',
	'Holzherd mit Ofenrohr und Brennholz, Leiter zur Galerie, alte Holztür',
	'Holzherd mit brennendem Feuer und offener Feuerraumtür',
	'Küche mit Chromstahl-Doppelspülbecken, Wasserhahn, Schränken und aufgehängten Tassen',
	'Küchenecke mit Arbeitsfläche, Schränken und gemauerter Ablage, darunter Holzbriketts',
	'Breite Liegefläche mit roter Bettwäsche und Kissen in der Stube, daneben der Esstisch',
	'Schlafgalerie unter dem Dach mit Matratzen, Geländer und hellem Holztäfer',
	'Ecke im Eingangsraum mit Kommode, Laterne, Orchidee und Wandregal mit Geschirr',
	'Holztür des Aussen-WCs mit herzförmigem Ausschnitt',
	'Aussen-WC mit Keramikschüssel, Deckel mit Kuhmuster und Regal mit WC-Papier',
	'Solartechnik an der Holzwand: Laderegler, Batterie und Sicherungskasten',
	'Blick durch eine alte Balkentür in den Vorratsraum mit Kisten und Kommode'
);
update photos set category = 'winter' where alt_de in (
	'Winterblick von der Hütte über verschneite Hänge und Tannen zu Schneegipfeln',
	'Tief verschneiter Hang mit grossem Laubbaum, Wolken über den Bergen',
	'Hütte im Tiefschnee bei Nebel, Äste eines Baums im Vordergrund',
	'Verschneite Bergkette im Gegenlicht, Tannen im Vordergrund',
	'Schneeschuhe im Neuschnee auf der Terrasse, Geländer und verschneite Bäume',
	'Verschneite Terrasse mit Zaun, Sichtschutz und zugeklapptem Sonnenschirm'
);
