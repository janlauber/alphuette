import type { Attachment } from 'svelte/attachments';

/**
 * Marks an element with data-unseen until it first scrolls into view, for one-off entrance
 * animations in CSS. Without JavaScript the attribute is never set, so nothing stays hidden.
 */
export const seen: Attachment<HTMLElement> = (el) => {
	el.dataset.unseen = '';
	const io = new IntersectionObserver(
		([e]) => {
			if (!e.isIntersecting) return;
			delete el.dataset.unseen;
			io.disconnect();
		},
		{ threshold: 0.25 }
	);
	io.observe(el);
	return () => io.disconnect();
};
