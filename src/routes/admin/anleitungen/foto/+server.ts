import { error, json } from '@sveltejs/kit';
import { addGuidePhoto } from '#lib/server/guides.ts';

// Upload from the guide editor; the key goes into the step when Tom saves.
export const POST = async ({ request }) => {
	const file = (await request.formData()).get('photo');
	if (!(file instanceof File) || !file.size) error(400, 'Kein Foto');
	try {
		return json({ key: await addGuidePhoto(new Uint8Array(await file.arrayBuffer())) });
	} catch {
		error(400, 'Die Website kann dieses Foto nicht lesen.');
	}
};
