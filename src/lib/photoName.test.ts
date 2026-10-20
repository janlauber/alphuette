import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromFileName } from './photoName.ts';

test('description and group come from a descriptive file name', () => {
	assert.deepEqual(fromFileName('03 Das Hüttli mit dem Ahorn am Abend [draussen].jpg'), { alt: 'Das Hüttli mit dem Ahorn am Abend', category: 'draussen' });
	assert.deepEqual(fromFileName('Stube mit Holzherd und Tisch [Drinnen].JPG'), { alt: 'Stube mit Holzherd und Tisch', category: 'drinnen' });
	assert.deepEqual(fromFileName('Hüttli im Schnee, Blick ins Tal.webp'), { alt: 'Hüttli im Schnee, Blick ins Tal', category: '' });
});

test('camera file names and unknown groups give nothing', () => {
	assert.deepEqual(fromFileName('DJI_0003.JPG'), { alt: '', category: '' });
	assert.deepEqual(fromFileName('IMG_1764.jpeg'), { alt: '', category: '' });
	assert.deepEqual(fromFileName('foto [sommer].jpg'), { alt: '', category: '' });
});
