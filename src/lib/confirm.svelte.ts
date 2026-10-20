import type { SubmitFunction } from '$app/forms';

// One confirmation dialog for the whole app (ConfirmDialog.svelte), styled like the site,
// instead of the browser's confirm(). ask() opens it and resolves with the answer.
export type Question = {
	title: string;
	text?: string;
	ok: string;
	cancel?: string;
	/** red button: deleting, cancelling, things guests notice */
	danger?: boolean;
};

export const dialog = $state<{ question: Question | null; answer?: (yes: boolean) => void }>({ question: null });

export function ask(question: Question): Promise<boolean> {
	dialog.answer?.(false);
	return new Promise((resolve) => {
		dialog.question = question;
		dialog.answer = (yes) => {
			dialog.question = null;
			dialog.answer = undefined;
			resolve(yes);
		};
	});
}

/**
 * For use:enhance: asks first, then sends the form (with the button that was pressed).
 * `question` may be a function returning null when no question is needed (nothing important changed).
 * `then` is the usual enhance callback for after the question.
 */
type Input = { formElement: HTMLFormElement; submitter: HTMLElement | null; cancel: () => void; action: URL; formData: FormData; controller: AbortController };

export function confirmFirst(question: Question | ((input: Input) => Question | null), then?: SubmitFunction): SubmitFunction {
	return (input: Input) => {
		const form = input.formElement;
		if (form.dataset.confirmed) {
			delete form.dataset.confirmed;
			return then?.(input);
		}
		const q = typeof question === 'function' ? question(input) : question;
		if (!q) return then?.(input);
		input.cancel();
		ask(q).then((yes) => {
			if (!yes) return;
			form.dataset.confirmed = '1';
			form.requestSubmit(input.submitter instanceof HTMLButtonElement || input.submitter instanceof HTMLInputElement ? input.submitter : undefined);
		});
	};
}
