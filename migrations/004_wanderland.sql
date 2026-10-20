-- Official routes from Wanderland Schweiz by number; the Hohtürli hike is Via Alpina stage 1.13.
alter table hikes add column wanderland text;
update hikes set wanderland = '1.13', geometry = null, profile = null, source = 'wanderland',
	de = 'Passwanderung von der Griesalp über die Bundalp und das Hohtürli (2778 m) zum Oeschinensee und nach Kandersteg, als Etappe der Via Alpina. Bergwanderweg, Trittsicherheit nötig. Oben steht die Blüemlisalphütte des SAC.',
	en = 'Pass hike from Griesalp via Bundalp and Hohtürli (2,778 m) to Lake Oeschinen and Kandersteg, a stage of the Via Alpina. Mountain trail, sure footing needed. The SAC Blüemlisalp hut stands at the top.'
where slug = 'hohtuerli';
