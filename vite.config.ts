import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// small font subsets stay files: the CSP allows fonts only from 'self', not data: URLs
	build: { assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined) },
	plugins: [
		tailwindcss(),
		sveltekit({
			adapter: adapter(),
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					// Svelte sets dynamic style attributes
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:', 'blob:', 'https://wmts.geo.admin.ch'],
					'font-src': ['self'],
					'connect-src': ['self'],
					'frame-src': ['https://map.geo.admin.ch'],
					'frame-ancestors': ['none'],
					'form-action': ['self'],
					'base-uri': ['self'],
					'object-src': ['none']
				}
			}
		})
	]
});
