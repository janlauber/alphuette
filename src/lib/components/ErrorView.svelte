<script lang="ts">
	import { page } from '$app/state';
	import Huettli from './Huettli.svelte';
	import { dict, localize, type Lang } from '#lib/i18n.ts';

	const lang = $derived((page.url.pathname.match(/^\/(en|fr|it)(?=\/|$)/)?.[1] ?? 'de') as Lang);
	const t = $derived(dict[lang].error);
	const missing = $derived(page.status === 404);
</script>

<div class="mx-auto flex max-w-xl flex-col items-center px-5 py-16 text-center sm:px-6">
	<Huettli face="sleep" pose="stand" animate class="w-40 text-brand" />
	<p class="pill mt-6 text-sm">{page.status}</p>
	<h1 class="mt-4 text-[2.6rem]">{missing ? t.missing : t.failed}</h1>
	<p class="mt-3 text-muted">{missing ? t.missingText : t.failedText}</p>
	<a href={localize(lang, '/')} class="btn-primary mt-8">{t.home}</a>
</div>
