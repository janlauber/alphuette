<script lang="ts">
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { dialog } from '#lib/confirm.svelte.ts';

	// The one confirmation dialog, mounted once in each layout; ask() from #lib/confirm.svelte.ts opens it.
	let el = $state<HTMLDialogElement>();
	let ok = $state<HTMLButtonElement>();
	let no = $state<HTMLButtonElement>();
	const q = $derived(dialog.question);

	$effect(() => {
		if (!el) return;
		if (q && !el.open) {
			el.showModal();
			// the safe choice has the focus when the action is dangerous
			(q.danger ? no : ok)?.focus();
		} else if (!q && el.open) el.close();
	});
</script>

<dialog
	bind:this={el}
	class="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[24px] border-2 border-brand bg-paper p-0 text-ink shadow-[0_6px_0_var(--color-brand)] backdrop:bg-ink/45 backdrop:backdrop-blur-[2px]"
	aria-labelledby="confirm-title"
	aria-describedby={q?.text ? 'confirm-text' : undefined}
	oncancel={(e) => (e.preventDefault(), dialog.answer?.(false))}
>
	{#if q}
		<div class="p-6">
			<div class="flex items-start gap-3">
				<span class="grid size-11 shrink-0 place-items-center rounded-full {q.danger ? 'bg-danger-wash text-danger' : 'bg-wash text-brand'}" aria-hidden="true">
					{#if q.danger}<TriangleAlert size={22} strokeWidth={2.25} />{:else}<CircleHelp size={22} strokeWidth={2.25} />{/if}
				</span>
				<div class="min-w-0 pt-1">
					<h2 id="confirm-title" class="text-xl leading-snug text-ink">{q.title}</h2>
					{#if q.text}<p id="confirm-text" class="mt-2 text-muted">{q.text}</p>{/if}
				</div>
			</div>
			<div class="mt-6 flex flex-wrap justify-end gap-3">
				<button bind:this={no} type="button" class="btn-line" onclick={() => dialog.answer?.(false)}>{q.cancel ?? 'Abbrechen'}</button>
				<button
					bind:this={ok}
					type="button"
					class={q.danger ? 'btn-line !border-danger !bg-danger !text-white !shadow-[0_4px_0_#8f1c25]' : 'btn-primary'}
					onclick={() => dialog.answer?.(true)}>{q.ok}</button
				>
			</div>
		</div>
	{/if}
</dialog>
