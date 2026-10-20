import { error } from '@sveltejs/kit';
import { hikeTrack } from '#lib/server/hikes.ts';

const xml = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);

export const GET = async ({ params }) => {
	const track = await hikeTrack(params.slug);
	if (!track) error(404, 'Not found');
	const pts = track.points
		.map((p) => `<trkpt lat="${p.lat.toFixed(6)}" lon="${p.lon.toFixed(6)}">${p.ele == null ? '' : `<ele>${p.ele}</ele>`}</trkpt>`)
		.join('\n');
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Alphütte Blüemlisalpblick" xmlns="http://www.topografix.com/GPX/1/1">
<metadata><name>${xml(track.name)}</name><desc>Route: swisstopo hiking trail network</desc></metadata>
<trk><name>${xml(track.name)}</name><trkseg>
${pts}
</trkseg></trk>
</gpx>
`;
	return new Response(body, {
		headers: {
			'content-type': 'application/gpx+xml; charset=utf-8',
			'content-disposition': `attachment; filename="${params.slug}.gpx"`,
			'cache-control': 'public, max-age=3600'
		}
	});
};
