import { error } from '@sveltejs/kit';
import { hikeTrack } from '#lib/server/hikes.ts';

const xml = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);

// For map.geo.admin.ch, which loads it as a layer. KML colours are aabbggrr: the site's blue #3b30e3.
export const GET = async ({ params }) => {
	const track = await hikeTrack(params.slug);
	if (!track) error(404, 'Not found');
	const coords = track.points.map((p) => `${p.lon.toFixed(6)},${p.lat.toFixed(6)}${p.ele == null ? '' : `,${p.ele}`}`).join(' ');
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xml(track.name)}</name>
<Style id="route"><LineStyle><color>ffe3303b</color><width>5</width></LineStyle></Style>
<Placemark><name>${xml(track.name)}</name><styleUrl>#route</styleUrl><LineString><tessellate>1</tessellate><coordinates>${coords}</coordinates></LineString></Placemark>
</Document></kml>
`;
	return new Response(body, {
		headers: {
			'content-type': 'application/vnd.google-earth.kml+xml; charset=utf-8',
			'access-control-allow-origin': '*',
			'cache-control': 'public, max-age=3600'
		}
	});
};
