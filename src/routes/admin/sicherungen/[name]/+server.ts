import { error } from '@sveltejs/kit';
import { isBackupName, readBackup } from '#lib/server/backup.ts';

// The admin guard in hooks.server.ts covers this route too.
export const GET = async ({ params }) => {
	if (!isBackupName(params.name)) error(404, 'Not found');
	const file = await readBackup(params.name).catch(() => error(404, 'Not found'));
	return new Response(file, {
		headers: {
			'content-type': 'application/gzip',
			'content-disposition': `attachment; filename="alphuette-${params.name}"`
		}
	});
};
