// A photo's file name can carry its description and gallery group:
// "03 Das Hüttli mit dem Ahorn am Abend [draussen].jpg". Camera names like DJI_0003 or IMG_1764 carry nothing.
export const GROUPS = ['draussen', 'drinnen', 'winter'] as const;

export function fromFileName(name: string): { alt: string; category: string } {
	let base = name.replace(/\.[a-z0-9]+$/i, '').normalize('NFC').trim();
	const group = base.match(/\s*\[(\w+)\]$/);
	const category = group && (GROUPS as readonly string[]).includes(group[1].toLowerCase()) ? group[1].toLowerCase() : '';
	if (group) base = base.slice(0, group.index).trim();
	base = base.replace(/^\d+[\s._-]+/, '').trim(); // leading order number
	const words = base.split(/\s+/).length >= 3 && !/^(DJI|IMG|DSC|PXL|GOPR|MVIMG)[_-]?\d/i.test(base);
	return { alt: words ? base.slice(0, 300) : '', category };
}
